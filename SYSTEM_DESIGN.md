# System Design — SMB Cashflow Forecaster

## 1. Product summary

Connects to a small business's bank account (read-only), projects the cash balance
2–6 weeks forward using transaction history, and alerts the owner before a shortfall
happens. v1 scope is deliberately narrow: one bank connection, one forecast model,
one alert type.

## 2. Goals and non-goals

**Goals (v1)**
- Connect a bank account in under 2 minutes (Plaid Link)
- Show a forecast within 5 minutes of connecting
- Detect and alert on projected shortfalls automatically, daily
- Let the user nudge the forecast with known upcoming income/expenses

**Non-goals (v1)** — explicitly deferred to keep the MVP pitchable and buildable fast
- Multi-entity / multi-business accounts
- Scenario planning ("what if I hire someone")
- Integrations beyond one bank/accounting provider
- ML-based forecasting (rolling-average model is enough to prove the concept)
- Mobile app (responsive web is enough for v1)

## 3. High-level architecture

```
┌─────────────┐        ┌──────────────────────────────┐        ┌─────────────┐
│   Browser    │◄──────►│         Backend API           │◄──────►│  Postgres   │
│  (React SPA) │  HTTPS │        (FastAPI, REST)        │  SQL   │             │
└─────────────┘        └───────────────┬───────────────┘        └─────────────┘
                                        │
                        ┌───────────────┼────────────────┐
                        ▼               ▼                ▼
                ┌───────────────┐ ┌───────────┐  ┌────────────────┐
                │  Plaid API     │ │  Forecast │  │  Alert Service  │
                │ (bank data)    │ │  Engine   │  │  (email/push)   │
                └───────────────┘ └───────────┘  └────────────────┘
                        ▲
                        │ nightly
                ┌───────┴────────┐
                │  Scheduled Jobs │  daily_sync.py → alert_scheduler.py
                │  (cron/Celery)  │
                └────────────────┘
```

**Request flow (dashboard load)**
1. Browser requests `GET /api/v1/forecast/` with JWT.
2. API loads current balance + last 90 days of transactions + manual overrides.
3. Forecast engine projects balance forward daily for the horizon (default 42 days).
4. Result is cached as a `ForecastSnapshot` and returned to the browser.
5. React renders the balance card, chart, and shortfall banner from one payload.

**Background flow (daily)**
1. `daily_sync.py` runs nightly, pulls new transactions per connected account via Plaid.
2. `alert_scheduler.py` runs after sync, regenerates forecasts, and emails any user whose
   projected balance dips below their threshold.

## 4. Components

| Component | Responsibility | Notes |
|---|---|---|
| **Frontend (React + Vite)** | Onboarding, dashboard, settings | Talks only to our API, never to Plaid directly except the Link widget handshake |
| **API (FastAPI)** | Auth, CRUD, orchestration | Stateless; horizontal scaling is just "run more instances" |
| **Forecast Engine** | Pure function: transactions → projected balances | No I/O — easy to unit test and to later swap for an ML model |
| **Plaid Service** | Wraps all bank-data calls | Isolates the third-party SDK so providers can be swapped per region |
| **Alert Service** | Formats and sends notifications | Starts as email (SendGrid); push/SMS are additive later |
| **Scheduled Jobs** | Nightly sync + forecast + alert | Run as cron/Celery beat, not a long-lived process, for v1 simplicity |
| **Postgres** | System of record | Single database is enough until multi-region or heavy write load demands otherwise |

## 5. Data model (core entities)

- **User** — one per business owner (v1: one business per user)
- **BankAccount** — one row per Plaid `item`; stores an **encrypted** access token, never plaintext
- **Transaction** — synced from Plaid, or manually entered as an override
- **ForecastSnapshot** — cached daily projection, avoids recomputing on every page load
- **Alert** — record of shortfall notifications sent, for audit and to avoid duplicate alerts

Relationships: `User 1—N BankAccount 1—N Transaction`; `User 1—N ForecastSnapshot`; `User 1—N Alert`.

## 6. Forecasting approach

v1 uses a **rolling weekly-pattern average**, not machine learning:
1. Bucket the last 90 days of transactions by day-of-week to capture recurring patterns
   (payroll every other Friday, rent on the 1st).
2. Project forward day-by-day using the average inflow/outflow for that weekday.
3. Apply manual overrides (known one-off income/expenses) on their specific dates.
4. Flag the first day the projected balance crosses the user's alert threshold (default $0).

This is deliberately explainable — an SMB owner can see *why* the forecast says what it
says, which matters more for trust and adoption than raw accuracy at this stage. A proper
ML model (e.g. gradient-boosted regression on seasonality + category-level trends) is a
natural v2 once there's enough real usage data to train and validate against.

## 7. Security

- **Bank tokens encrypted at rest** (Fernet/AES via `TOKEN_ENCRYPTION_KEY`) — never stored
  or logged in plaintext.
- **Passwords hashed with bcrypt**, never stored in plaintext.
- **JWT auth** on every non-public endpoint; short expiry + refresh flow before production.
- **Read-only bank access** — Plaid scopes are transactions/balance only, never
  payment-initiation. This is also the strongest line in the pitch: *"we can never move
  your money."*
- **Transport**: HTTPS everywhere, no exceptions, including internal service calls in
  production.
- **Secrets**: environment variables / secrets manager, never committed — see `.env.example`.
- Before any real bank data touches the system: auth must be real (not stubbed), tokens
  must be encrypted (not plaintext), and there must be a documented incident-response plan
  for a leaked token. These are the three gates in `docs/DEVELOPER_BRIEF.md`.

## 8. Scaling considerations (post-MVP)

These are **not** needed for the pilot, but worth knowing the path exists:

- **API**: stateless FastAPI instances behind a load balancer — scales horizontally with no code changes.
- **Scheduled jobs**: move from a single cron process to Celery + a task queue (Redis/SQS)
  once the number of connected accounts makes a single nightly pass too slow.
- **Forecast caching**: `ForecastSnapshot` already avoids recomputation per page load;
  add a short-TTL cache (Redis) in front of `/forecast` if traffic grows.
- **Database**: Postgres read replicas for reporting/analytics once dashboards need
  aggregate queries across many users.
- **Multi-region banks**: the Plaid wrapper is isolated specifically so TrueLayer/Yapily
  (UK/EU) or a local provider can be added without touching the API or forecast engine.

## 9. Tech stack summary

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI (Python) | Fast to build, auto-generated OpenAPI docs, good async support |
| DB | PostgreSQL + SQLAlchemy + Alembic | Relational fits the data well; Alembic gives real migrations from day one |
| Bank data | Plaid (US) | Handles bank auth/security so we never touch raw credentials |
| Frontend | React + Vite | Fast dev loop, large ecosystem, easy to hire for |
| Charts | Recharts | Simple declarative charts, good enough for a balance/forecast line |
| Hosting (MVP) | Render/Railway (API+DB), Vercel (frontend) | Cheap, fast to deploy, easy to graduate to AWS/GCP later |
| Alerts | SendGrid (email) | Simplest reliable channel for v1; push/SMS later |

## 10. What's still needed before this is a real, launchable product

See `docs/DEVELOPER_BRIEF.md` for the full checklist. In short: real Plaid token
exchange, real auth, encrypted tokens wired up end-to-end, error handling for expired
bank connections, production migrations, and a pilot with 5–10 real businesses before
scaling further.
