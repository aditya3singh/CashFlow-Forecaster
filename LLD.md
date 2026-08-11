# Low-Level Design (LLD) — SMB Cashflow Forecaster

Companion to `HLD.md`. Where the HLD says *what* and *why*, this says *exactly how* —
schemas, function signatures, sequence flows, and algorithms.

## 1. Database schema (detailed)

### 1.1 `users`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `uuid4()` |
| email | VARCHAR | UNIQUE, NOT NULL, indexed |
| hashed_password | VARCHAR | NOT NULL (bcrypt) |
| business_name | VARCHAR | NULLABLE |
| alert_threshold | NUMERIC(12,2) | NOT NULL, default `0.00` |
| created_at | TIMESTAMPTZ | default `now()` |

### 1.2 `bank_accounts`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL, indexed |
| plaid_item_id | VARCHAR | NOT NULL |
| encrypted_access_token | BYTEA | NOT NULL (Fernet-encrypted, never plaintext) |
| institution_name | VARCHAR | NULLABLE |
| account_name | VARCHAR | NULLABLE |
| current_balance | NUMERIC(12,2) | NULLABLE, updated on each sync |
| status | VARCHAR | NOT NULL, default `'active'`; enum: `active \| reauth_required \| error` |
| last_synced_at | TIMESTAMPTZ | NULLABLE |
| connected_at | TIMESTAMPTZ | default `now()` |

### 1.3 `transactions`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| bank_account_id | UUID | FK → bank_accounts.id, NOT NULL |
| plaid_transaction_id | VARCHAR | UNIQUE, NOT NULL (idempotency key for sync upserts) |
| amount | NUMERIC(12,2) | NOT NULL (positive = inflow, negative = outflow) |
| category | VARCHAR | NULLABLE (simplified bucket, see `categorization.py`) |
| merchant_name | VARCHAR | NULLABLE |
| date | DATE | NOT NULL |
| is_manual_override | BOOLEAN | default `false` |
| created_at | TIMESTAMPTZ | default `now()` |

**Indexes**: composite `(bank_account_id, date)` — the forecast engine's primary query
pattern is "last 90 days of transactions for this account."

### 1.4 `forecast_snapshots`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| forecast_date | DATE | NOT NULL — the day being predicted |
| projected_balance | NUMERIC(12,2) | NOT NULL |
| generated_at | TIMESTAMPTZ | default `now()` |

**Indexes**: composite unique `(user_id, forecast_date, generated_at::date)` — one
cached snapshot set per user per calendar day.

### 1.5 `alerts`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| alert_type | VARCHAR | default `'projected_shortfall'` |
| shortfall_date | DATE | NOT NULL |
| message | TEXT | NOT NULL |
| sent | BOOLEAN | default `false` |
| created_at | TIMESTAMPTZ | default `now()` |

**Indexes**: composite `(user_id, shortfall_date)` — used to check "did we already alert
for this date" before sending again (idempotency for the nightly job).

### 1.6 ER diagram

```
users ──1:N── bank_accounts ──1:N── transactions
  │
  ├──1:N── forecast_snapshots
  └──1:N── alerts
```

## 2. Module-level design

### 2.1 `services/forecast_engine.py`

```python
def generate_forecast(
    current_balance: Decimal,
    historical_transactions: list[dict],   # last 90 days, [{date, amount}]
    manual_overrides: list[dict],          # [{date, amount, description}]
    horizon_days: int = 42,
) -> list[dict]:                           # [{date, projected_balance}]
```

**Algorithm (v1 — weekday rolling average):**
1. Group `historical_transactions` by `date.weekday()` (0=Monday..6=Sunday).
2. For each weekday, compute `avg_net = mean(sum(amounts for that date) for each
   occurrence of that weekday in the last 90 days)`.
3. Starting from `current_balance` on day 0, for each day `d` in `[1, horizon_days]`:
   - `projected_balance[d] = projected_balance[d-1] + avg_net[weekday(d)]`
   - If a `manual_override` exists for date `d`, add its `amount` on top.
4. Return the full series.

**Complexity**: O(n) over historical transactions to build the weekday averages,
O(horizon_days) to project forward. Trivial at pilot scale (90 days of transactions,
42-day horizon).

**Edge cases to handle in implementation:**
- New account with < 90 days of history → fall back to whatever history exists,
  widen confidence language in the UI rather than fabricate data.
- A weekday with zero historical occurrences → `avg_net = 0` for that weekday, not a
  crash.
- Outlier transactions (e.g. one-time equipment purchase) skew the average — v1 accepts
  this; a v2 could winsorize or let the user tag one-offs to exclude them.

```python
def detect_shortfall(forecast: list[dict], threshold: Decimal = Decimal("0")) -> dict | None:
```
Linear scan, returns the first `{date, projected_balance}` where `projected_balance <
threshold`. Returns `None` if the full horizon stays above threshold.

### 2.2 `services/plaid_service.py`

```python
def create_link_token(user_id: str) -> str
def exchange_public_token(public_token: str) -> str          # returns access_token
def fetch_transactions(access_token: str, start_date: date, end_date: date) -> list[dict]
```

**Implementation notes:**
- `exchange_public_token` must immediately pass its result to
  `core.encryption.encrypt_token()` before it touches any database write — this
  function should never return a value that gets logged or persisted unencrypted.
- `fetch_transactions` must handle Plaid's pagination (`has_more` / `cursor` in the
  `/transactions/sync` endpoint, preferred over the older `/transactions/get`), and
  should upsert on `plaid_transaction_id` to stay idempotent across repeated syncs.

### 2.3 `core/encryption.py`

```python
def encrypt_token(token: str) -> bytes    # Fernet symmetric encryption
def decrypt_token(token: bytes) -> str
```
Key comes from `TOKEN_ENCRYPTION_KEY` env var (32-byte, base64). Rotation strategy for
production: support a list of keys, encrypt with the newest, attempt decrypt with each
until one succeeds — not implemented in the scaffold, flagged as a pre-launch TODO.

### 2.4 `core/security.py`

```python
def hash_password(password: str) -> str          # bcrypt via passlib
def verify_password(plain: str, hashed: str) -> bool
def create_access_token(subject: str) -> str      # JWT, HS256, exp = now + JWT_EXPIRE_MINUTES
```

## 3. Sequence diagrams (textual)

### 3.1 Onboarding → first forecast

```
Browser          API                Plaid              DB
  │  POST /accounts/link-token       │                   │
  ├──────────────►│                  │                   │
  │                ├── link_token_create ──►│            │
  │                │◄── link_token ─────────┤            │
  │◄── link_token ─┤                  │                   │
  │  (opens Plaid Link UI, user authenticates with bank)  │
  │  POST /accounts/exchange-token   │                   │
  ├──────────────►│                  │                   │
  │                ├── item/public_token/exchange ──►│    │
  │                │◄── access_token ────────┤            │
  │                ├── encrypt_token() ───────────────────┤
  │                ├── INSERT bank_accounts ─────────────►│
  │                ├── transactions/sync (initial pull) ─►│
  │                │◄── transactions ────────┤            │
  │                ├── INSERT transactions (bulk) ───────►│
  │◄── 200 OK ─────┤                  │                   │
  │  GET /forecast/                  │                   │
  ├──────────────►│                  │                   │
  │                ├── SELECT last 90 days transactions ──►│
  │                ├── generate_forecast()                │
  │                ├── INSERT forecast_snapshots ─────────►│
  │◄── forecast ───┤                  │                   │
```

### 3.2 Nightly sync + alert

```
Scheduler        daily_sync.py       Plaid          alert_scheduler.py    SendGrid
  │  cron trigger      │               │                     │               │
  ├────────────────────►│              │                     │               │
  │                     ├── for each active bank_account:     │               │
  │                     │   decrypt_token()                   │               │
  │                     │   fetch_transactions() ──────►│      │               │
  │                     │   upsert transactions          │      │               │
  │                     │   UPDATE last_synced_at         │      │               │
  │  cron trigger (after sync completes)                 │      │               │
  ├───────────────────────────────────────────────────────►│    │               │
  │                     │              │                     ├── for each user: │
  │                     │              │                     │   generate_forecast()
  │                     │              │                     │   detect_shortfall()
  │                     │              │                     │   IF shortfall AND
  │                     │              │                     │      not already alerted today:
  │                     │              │                     ├── send_shortfall_alert() ──►│
  │                     │              │                     │   INSERT alerts (sent=true)  │
```

## 4. API — detailed request/response shapes

### `POST /api/v1/auth/signup`
```json
// Request
{ "email": "owner@business.com", "password": "•••", "business_name": "Acme Bakery" }
// Response 201
{ "access_token": "eyJ...", "token_type": "bearer" }
```

### `GET /api/v1/forecast/`
```json
// Response 200
{
  "current_balance": "12450.30",
  "days": [
    { "date": "2026-08-12", "projected_balance": "12100.30" },
    { "date": "2026-08-13", "projected_balance": "11875.10" }
  ],
  "shortfall": { "date": "2026-09-03", "projected_balance": "-420.00" }  // or null
}
```

### `POST /api/v1/transactions/manual-override`
```json
// Request
{ "description": "Invoice #204 due", "amount": 6200.00, "expected_date": "2026-08-20" }
// Response 201
{ "id": "uuid", "date": "2026-08-20", "amount": "6200.00", "is_manual_override": true }
```

Full endpoint list in `API_SPEC.md`.

## 5. Validation and error handling rules

| Scenario | Handling |
|---|---|
| Duplicate signup email | 409 Conflict, generic message (don't leak which field failed, for security) |
| Invalid/expired JWT | 401 Unauthorized on every protected route via a shared dependency (`api/deps.py`) |
| Plaid item enters `ITEM_LOGIN_REQUIRED` | Set `bank_accounts.status = 'reauth_required'`, surface a reconnect prompt in the UI, skip in nightly sync until resolved |
| Manual override with a past date | Reject with 400 — overrides are for *future* known events, not backdating history |
| Forecast requested with zero connected accounts | Return 200 with an empty series and a `needs_onboarding: true` flag, not an error |
| Duplicate transaction from Plaid re-sync | Upsert on `plaid_transaction_id` unique constraint — never double-count |

## 6. Testing strategy

| Layer | Approach |
|---|---|
| `forecast_engine.py` | Pure unit tests with fixed transaction fixtures and known expected output — no DB, no mocks needed |
| `plaid_service.py` | Mock the Plaid SDK client; test pagination handling and error mapping |
| API routes | `httpx` + FastAPI `TestClient` against a test Postgres (or SQLite for speed in CI) |
| Encryption | Round-trip test: encrypt → decrypt → assert equality; test failure on wrong key |
| Scheduled jobs | Run `daily_sync.run()` / `alert_scheduler.run()` against a seeded test DB, assert resulting rows |

## 7. Related documents
- `HLD.md` — architecture rationale, deployment view, non-functional requirements
- `SYSTEM_DESIGN.md` — narrative overview and tech stack decisions
- `FOLDER_ARCHITECTURE.md` — directory layout
- `API_SPEC.md` — full endpoint reference
