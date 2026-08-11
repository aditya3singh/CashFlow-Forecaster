# Folder Architecture

```
smb-cashflow-forecaster/
├── README.md                      Quick start + status of what's built vs. stubbed
├── docker-compose.yml             Local dev: Postgres + backend + scheduler + frontend
├── .env.example                   All required environment variables, documented
├── .gitignore
│
├── backend/                       FastAPI service
│   ├── app/
│   │   ├── main.py                App entrypoint, registers all routers
│   │   ├── config.py              Typed settings loaded from .env
│   │   ├── database.py            SQLAlchemy engine/session setup
│   │   │
│   │   ├── models/                One file per DB table (SQLAlchemy ORM)
│   │   │   ├── user.py
│   │   │   ├── account.py         BankAccount — holds encrypted Plaid access token
│   │   │   ├── transaction.py
│   │   │   ├── forecast.py        ForecastSnapshot — cached daily projections
│   │   │   └── alert.py
│   │   │
│   │   ├── schemas/                Pydantic request/response shapes (kept separate
│   │   │                           from ORM models so the API contract can evolve
│   │   │                           independently of the DB schema)
│   │   │
│   │   ├── api/v1/                 Route handlers, grouped by resource
│   │   │   ├── auth.py             signup, login
│   │   │   ├── accounts.py         Plaid Link token, token exchange, list accounts
│   │   │   ├── transactions.py     list transactions, manual overrides
│   │   │   ├── forecast.py         GET the current forecast for the dashboard
│   │   │   └── alerts.py           list alert history
│   │   │
│   │   ├── core/                   Cross-cutting concerns, no business logic
│   │   │   ├── security.py         password hashing, JWT
│   │   │   ├── encryption.py       encrypt/decrypt bank tokens at rest
│   │   │   └── logging.py
│   │   │
│   │   ├── services/                Business logic, framework-agnostic
│   │   │   ├── forecast_engine.py   pure function: transactions → projected balances
│   │   │   ├── plaid_service.py     wraps the Plaid SDK — isolates the 3rd-party dependency
│   │   │   ├── alert_service.py     formats + sends shortfall notifications
│   │   │   └── categorization.py    maps raw bank categories to simplified buckets
│   │   │
│   │   ├── jobs/                    Scripts run on a schedule (cron/Celery beat), not
│   │   │   ├── daily_sync.py        request handlers
│   │   │   └── alert_scheduler.py
│   │   │
│   │   └── tests/                   Mirrors the structure above
│   │
│   ├── alembic/                     DB migrations (never use create_all in production)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pytest.ini
│
├── frontend/                        React + Vite SPA
│   ├── src/
│   │   ├── main.jsx / App.jsx       Entry point, routing
│   │   ├── components/
│   │   │   ├── Dashboard/           Balance card, forecast chart, shortfall banner
│   │   │   ├── Onboarding/          Connect-bank flow (Plaid Link widget)
│   │   │   ├── Auth/                Login / signup forms
│   │   │   └── shared/              Reusable UI primitives (Button, Loader)
│   │   ├── pages/                   One file per route, composes components
│   │   ├── api/client.js            Single place that talks to the backend
│   │   ├── hooks/useForecast.js     Data-fetching hook used by the dashboard
│   │   └── context/AuthContext.jsx  Auth/session state
│   ├── package.json
│   └── vite.config.js
│
├── infra/
│   └── github-actions/ci.yml        Backend tests + frontend build on every push
│
└── docs/
    ├── SYSTEM_DESIGN.md              Architecture, data flow, security, scaling
    ├── FOLDER_ARCHITECTURE.md        This file
    ├── API_SPEC.md                   Endpoint reference
    └── DEVELOPER_BRIEF.md            What's done, stubbed, and required before launch
```

## Design principles behind this layout

1. **`services/` is framework-agnostic.** The forecast engine and Plaid wrapper don't
   import FastAPI. That means they can be unit-tested in isolation and reused if the API
   framework ever changes.
2. **`models/` (DB shape) is separate from `schemas/` (API shape).** The database and the
   public API contract are allowed to diverge — a common source of pain when they're
   conflated from day one.
3. **`core/` has no business logic.** Security and encryption utilities are generic and
   reusable across every feature, not tied to cashflow-specific concepts.
4. **`jobs/` are scripts, not endpoints.** Nightly sync and alerting are triggered by a
   scheduler, not by a user request — keeping them separate avoids accidentally exposing
   them as HTTP routes.
5. **One `api/client.js` on the frontend.** Every network call goes through one file, so
   auth headers, error handling, and the base URL are defined once.
6. **Docs live next to the code they describe**, not in a wiki that drifts out of sync.
