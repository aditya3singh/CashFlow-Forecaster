# Database Design — Microservices Architecture

## 1. Core principle: database-per-service

In a microservices setup, **each service owns its own database** — no service reads or
writes another service's tables directly, and there are **no foreign keys across
service boundaries**. Services only talk to each other through their APIs or through
events on the message queue.

Why this matters:
- Each service can change its schema without breaking others.
- Each database can be scaled, backed up, or even swapped (Postgres → something else)
  independently.
- It forces clean ownership — "who is allowed to write this data" is never ambiguous.

The trade-off: you lose the convenience of a SQL `JOIN` across services. Where one
service needs data owned by another (e.g. the alert service needs the user's email,
which lives in Auth), it either calls that service's API, or keeps a small
**denormalized copy** of just the fields it needs, kept in sync via events. Both
patterns are used below, noted per table.

Each service gets its **own Postgres database** (can be separate instances, or separate
schemas within one Postgres cluster for the pilot to save cost — logically identical,
just cheaper to run early on).

---

## 2. Auth service — `auth_db`

### `users`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `uuid4()` |
| email | VARCHAR | UNIQUE, NOT NULL, indexed |
| hashed_password | VARCHAR | NOT NULL |
| business_name | VARCHAR | NULLABLE |
| alert_threshold | NUMERIC(12,2) | NOT NULL, default `0.00` |
| is_active | BOOLEAN | default `true` |
| created_at | TIMESTAMPTZ | default `now()` |
| updated_at | TIMESTAMPTZ | default `now()`, updated on change |

### `refresh_tokens`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL, indexed |
| token_hash | VARCHAR | NOT NULL, indexed |
| expires_at | TIMESTAMPTZ | NOT NULL |
| revoked | BOOLEAN | default `false` |
| created_at | TIMESTAMPTZ | default `now()` |

*Owns:* identity, credentials, session tokens. This is the **only** service allowed to
verify passwords or issue tokens.

---

## 3. Bank integration service — `bank_db`

### `bank_accounts`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | **logical reference only** (no FK — user lives in `auth_db`), indexed |
| plaid_item_id | VARCHAR | NOT NULL |
| encrypted_access_token | BYTEA | NOT NULL |
| institution_name | VARCHAR | NULLABLE |
| account_name | VARCHAR | NULLABLE |
| current_balance | NUMERIC(12,2) | NULLABLE |
| status | VARCHAR | NOT NULL, default `'active'`; enum: `active \| reauth_required \| error` |
| last_synced_at | TIMESTAMPTZ | NULLABLE |
| connected_at | TIMESTAMPTZ | default `now()` |

### `sync_logs`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| bank_account_id | UUID | FK → bank_accounts.id, NOT NULL |
| started_at | TIMESTAMPTZ | NOT NULL |
| completed_at | TIMESTAMPTZ | NULLABLE |
| status | VARCHAR | enum: `running \| success \| failed` |
| error_message | TEXT | NULLABLE |
| transactions_synced | INTEGER | default `0` |

*Owns:* the Plaid relationship and encrypted tokens. **This is the only service that
ever touches raw bank credentials or the Plaid SDK.** When it pulls new transactions,
it publishes a `transactions.synced` event (with the transaction data) to the queue —
it does not write directly into the transaction service's database.

---

## 4. Transaction service — `transaction_db`

### `transactions`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | logical reference, indexed |
| bank_account_id | UUID | logical reference (owned by bank service), indexed |
| plaid_transaction_id | VARCHAR | UNIQUE, NOT NULL (idempotency key) |
| amount | NUMERIC(12,2) | NOT NULL |
| category | VARCHAR | NULLABLE |
| merchant_name | VARCHAR | NULLABLE |
| date | DATE | NOT NULL |
| is_manual_override | BOOLEAN | default `false` |
| created_at | TIMESTAMPTZ | default `now()` |

**Indexes:** composite `(user_id, date)` — this is the query the forecast service hits
constantly ("give me the last 90 days for this user").

*Owns:* the transaction ledger, including user-entered manual overrides. Populated by
consuming the `transactions.synced` event from the bank service — not by direct calls.

---

## 5. Forecast service — `forecast_db`

### `forecast_snapshots`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | logical reference, indexed |
| forecast_date | DATE | NOT NULL |
| projected_balance | NUMERIC(12,2) | NOT NULL |
| model_version | VARCHAR | NOT NULL, e.g. `'rolling-avg-v1'` |
| generated_at | TIMESTAMPTZ | default `now()` |

**Indexes:** composite unique `(user_id, forecast_date, generated_at::date)`.

### `forecast_runs` (audit/debug trail)
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | logical reference |
| triggered_by | VARCHAR | enum: `scheduled \| manual \| override_added` |
| input_transaction_count | INTEGER | NOT NULL |
| horizon_days | INTEGER | default `42` |
| run_at | TIMESTAMPTZ | default `now()` |

*Owns:* all forecast computation and its cached output. Calls the transaction service's
API (`GET /transactions?user_id=...&last=90d`) to get its inputs — this is a direct
synchronous call since the forecast needs fresh data on demand, not an event.

---

## 6. Alert service — `alert_db`

### `alerts`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | logical reference, indexed |
| alert_type | VARCHAR | default `'projected_shortfall'` |
| shortfall_date | DATE | NOT NULL |
| message | TEXT | NOT NULL |
| channel | VARCHAR | enum: `email \| push \| sms`, default `'email'` |
| sent | BOOLEAN | default `false` |
| sent_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | default `now()` |

**Indexes:** composite `(user_id, shortfall_date)` — used to check "did we already
alert for this date" before sending again.

### `notification_preferences`
| Column | Type | Constraints |
|---|---|---|
| user_id | UUID | PK, logical reference |
| email | VARCHAR | NOT NULL — **denormalized copy** from Auth, kept in sync via a `user.updated` event, so this service can send email without calling Auth on every alert |
| email_enabled | BOOLEAN | default `true` |
| push_enabled | BOOLEAN | default `false` |

*Owns:* notification history and delivery preferences. Consumes `forecast.shortfall_detected`
events from the forecast service to decide when to send.

---

## 7. Cross-service data flow (how the pieces stay in sync)

```
Auth DB          Bank DB           Transaction DB      Forecast DB        Alert DB
  │                 │                    │                  │                │
  │ user.created ───┼───────────────────►│ (creates a       │                │
  │  (event)         │                    │  denormalized    │                │
  │                 │                    │  user_id index)   │                │
  │                 │ transactions.synced│                  │                │
  │                 ├───────────────────►│ (writes rows)     │                │
  │                 │                    │                  │                │
  │                 │                    │◄── GET /transactions (sync call) ──┤
  │                 │                    │                  │ forecast.shortfall_detected
  │                 │                    │                  ├───────────────►│
  │                 │                    │                  │                │ (sends email)
  │ user.updated ───┼────────────────────┼──────────────────┼───────────────►│
  │  (email changed) │                    │                  │  (updates      │
  │                 │                    │                  │   notification_ │
  │                 │                    │                  │   preferences)  │
```

**Rule of thumb used above:**
- **Events (async, via queue)** for "something happened, react when you can" —
  new user, transactions synced, shortfall detected. These don't need an instant
  response and shouldn't block the publisher.
- **Direct API calls (sync)** only when the caller needs the answer *right now* to do
  its job — the forecast service asking the transaction service for the last 90 days
  before it can compute anything.

## 8. Consistency and idempotency notes

- **No distributed transactions.** If the alert service fails to process a
  `forecast.shortfall_detected` event, the queue retries it — the event isn't lost.
  This is "eventual consistency," which is fine here: an alert arriving 2 minutes late
  is not a correctness problem for a daily cash-flow tool.
- **Idempotency keys everywhere.** `plaid_transaction_id` (unique) prevents duplicate
  transactions on retry. `(user_id, shortfall_date)` prevents duplicate alerts on retry.
  Any event consumer should be safe to process the same event twice.
- **`user_id` is never enforced by a foreign key outside `auth_db`.** It's just a UUID
  copied around. If Auth deletes a user, it publishes a `user.deleted` event and every
  other service cleans up its own rows independently — there's no cascading delete
  across databases.

## 9. Local/pilot-stage shortcut

Running 5 separate Postgres instances is unnecessary cost for a pilot. Recommended
setup for now: **one Postgres cluster, 5 separate schemas** (`auth`, `bank`,
`transaction`, `forecast`, `alert`), each service connects only to its own schema's
credentials. This keeps the *logical* separation (each service's migrations, models,
and access are isolated) while keeping *infra* simple. Splitting into physically
separate database instances later is a config change, not a data migration, because
the boundaries were already respected from day one.

## 10. Related documents
- `HLD.md` / `LLD.md` — architecture and forecast algorithm detail (monolith version,
  schema here supersedes its DB section for the microservices path)
- `FOLDER_ARCHITECTURE.md` — code layout
