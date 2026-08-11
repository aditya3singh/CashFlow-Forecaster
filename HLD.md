# High-Level Design (HLD) — SMB Cashflow Forecaster

## 1. Purpose and scope

This HLD describes the system at the level a stakeholder, architect, or new engineer
needs to understand what the system does, how its major parts fit together, and why
those choices were made. It does not describe internal class structures or exact
schemas — that's in `LLD.md`.

## 2. System context

```
                    ┌─────────────────────────────────────────┐
                    │              SMB Cashflow                │
        SMB Owner   │              Forecaster                  │   Plaid
        (Browser) ──►│         (this system)                   │◄──► (bank data
                    │                                          │      provider)
                    └───────────────────┬──────────────────────┘
                                         │
                                         ▼
                                  SendGrid (email alerts)
```

**Actors**
- **SMB owner** — end user, connects a bank account, views forecast, receives alerts.
- **Plaid** — third-party bank-data aggregator; system never touches raw bank credentials.
- **SendGrid** (or equivalent) — outbound email for shortfall alerts.
- **Accountant/bookkeeper** (future) — potential secondary user for GTM distribution.

## 3. Architectural style

**Layered monolith, service-oriented internally.** A single deployable FastAPI backend
divided into clear layers (API → services → data), plus a decoupled React SPA and a
separate scheduled-job process. This is intentional for an MVP:

- A monolith is faster to build, test, and reason about than microservices at this scale.
- Internal layering (`api/`, `services/`, `models/`) means a future split into services
  (e.g. pulling the forecast engine into its own worker) doesn't require a rewrite —
  boundaries already exist.
- The scheduled-job process is separated from the request-serving API from day one,
  since their scaling and failure characteristics differ (jobs can be slow and retried;
  API requests must be fast).

## 4. Logical architecture

| Layer | Responsibility | Key modules |
|---|---|---|
| **Presentation** | UI, client-side state, talks only to our API | `frontend/` (React SPA) |
| **API / Interface** | AuthN/Z, request validation, routing, response shaping | `backend/app/api/v1/*` |
| **Application / Service** | Business logic, orchestration, third-party integration | `backend/app/services/*` |
| **Domain / Core** | Cross-cutting rules independent of any one feature | `backend/app/core/*` |
| **Data** | Persistence, schema, migrations | `backend/app/models/*`, Postgres |
| **Background processing** | Scheduled sync and alerting, decoupled from requests | `backend/app/jobs/*` |
| **External integrations** | Bank data, email delivery | Plaid, SendGrid |

## 5. Major components

### 5.1 Frontend (React SPA)
Three screens carry the entire v1 experience: **Onboarding** (connect bank via Plaid
Link), **Dashboard** (balance, forecast chart, shortfall banner), **Settings** (manage
connection, alert threshold). All state is fetched from the API; no business logic
lives client-side beyond form validation and chart rendering.

### 5.2 Backend API (FastAPI)
Stateless REST service. Every write path validates auth via JWT before touching the
database. Routers are grouped by resource (`auth`, `accounts`, `transactions`,
`forecast`, `alerts`) so ownership and testing boundaries are obvious.

### 5.3 Forecast engine
A pure function, no I/O, no framework dependency: `transactions + overrides → daily
projected balances`. This isolation is deliberate — it can be unit tested with fixed
inputs/outputs and swapped for a smarter model later without touching the API layer.

### 5.4 Plaid integration
Isolated behind `plaid_service.py` so the rest of the app never imports the Plaid SDK
directly. This is the seam where a UK/EU provider (TrueLayer, Yapily) would plug in for
international expansion without changing any other component.

### 5.5 Scheduled jobs
Two nightly jobs, run in sequence: `daily_sync` (pull new transactions per connected
account) then `alert_scheduler` (regenerate forecasts, email anyone crossing their
shortfall threshold). Run via cron in v1; can graduate to Celery beat + a task queue
without changing job logic.

### 5.6 Alert service
Formats and sends the shortfall notification. Starts as email-only; the interface is
generic enough (`send_shortfall_alert(user, date, balance)`) that push/SMS channels are
additive, not a rewrite.

## 6. Data flow — key scenarios

### 6.1 Onboarding (connect bank → first forecast)
1. Browser requests a Plaid **link token** from the API.
2. User completes Plaid Link in the browser; Plaid returns a **public token**.
3. Browser sends the public token to the API, which exchanges it for a permanent
   **access token** via Plaid, encrypts it, and stores it as a `BankAccount`.
4. API triggers an initial transaction pull (last 90 days) synchronously or via a
   quick background task, so the user sees a forecast within the 5-minute target.
5. Forecast engine runs, dashboard renders.

### 6.2 Nightly sync and alerting
1. `daily_sync` pulls new transactions for every active `BankAccount`.
2. `alert_scheduler` regenerates each user's forecast and checks for a shortfall.
3. If found, `alert_service` sends an email and records an `Alert` row (idempotency —
   don't re-alert for the same shortfall every night).

### 6.3 Dashboard load (steady state)
1. Browser requests `GET /forecast/` with a JWT.
2. API checks for a same-day cached `ForecastSnapshot`; if present, returns it.
   Otherwise recomputes and caches.
3. Response includes current balance, the projected-balance series, and any shortfall.

## 7. Non-functional requirements

| Requirement | Target (v1 pilot) | Approach |
|---|---|---|
| Availability | Best-effort, business hours | Single-region deploy, managed Postgres |
| Latency | Dashboard load < 1s (cached) | `ForecastSnapshot` caching, avoid recompute per request |
| Time-to-first-forecast | < 5 minutes from signup | Synchronous initial sync on onboarding |
| Security | No plaintext secrets, ever | Encrypted bank tokens, bcrypt passwords, HTTPS only |
| Data freshness | Daily | Nightly scheduled sync (acceptable for a cash-position tool) |
| Scalability | 5–10 pilot businesses → hundreds | Stateless API scales horizontally; jobs move to a queue when volume demands |

## 8. Deployment view

```
Frontend (Vercel)  ──HTTPS──►  API (Render/Railway, N instances)  ──►  Postgres (managed)
                                        │
                                        ├──► Plaid API
                                        ├──► SendGrid API
                                        └──► Scheduled job process (same host or separate worker)
```

- **v1 pilot**: single small instance each for API and worker, managed Postgres,
  frontend on a static host/CDN. Optimized for cost and simplicity, not scale.
- **Post-pilot**: API behind a load balancer with multiple instances (stateless, so this
  is a config change, not a redesign); jobs move to Celery + Redis/SQS; add a Redis
  cache in front of `/forecast` if read traffic grows.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Bank token leak | Encryption at rest, never logged, scoped read-only Plaid permissions |
| Forecast inaccuracy erodes trust | v1 model is intentionally explainable (rolling average, not a black-box ML model); manual overrides let users correct known gaps |
| Plaid outage or rate limits | Nightly sync (not real-time) reduces call volume; cache last-known forecast so dashboard degrades gracefully |
| Single point of failure (monolith) | Layering keeps the codebase splittable later; not a concern at pilot scale |
| Scope creep before pilot validates the model | Non-goals section in `SYSTEM_DESIGN.md` explicitly excludes multi-entity, scenario planning, ML, and mobile from v1 |

## 10. Related documents
- `SYSTEM_DESIGN.md` — architecture rationale and tech stack detail
- `LLD.md` — detailed schema, sequence diagrams, module-level design
- `FOLDER_ARCHITECTURE.md` — directory layout
- `API_SPEC.md` — endpoint reference
- `DEVELOPER_BRIEF.md` — build status and roadmap
