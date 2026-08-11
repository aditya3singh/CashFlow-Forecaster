# Developer Brief

This is a **scaffold, not production code**. Hand this to whoever builds it so
expectations are set on day one.

## What's already built
- Full folder architecture and separation of concerns (see `FOLDER_ARCHITECTURE.md`)
- Complete DB schema (`backend/app/models/`) — ready to run `alembic revision --autogenerate`
- All API routes defined with correct signatures (`backend/app/api/v1/`)
- Forecast engine interface with the algorithm approach documented (`forecast_engine.py`)
- Frontend component tree wired end-to-end: onboarding → dashboard → chart
- Docker Compose for local dev (Postgres + backend + scheduler + frontend)
- CI pipeline stub (GitHub Actions: test backend, build frontend)

## What's stubbed (`# TODO`) and must be built
Every file with a `raise NotImplementedError` or `# TODO` needs real logic. The three
gates that must be closed **before any real bank data touches the system**:

1. **Real authentication** — `auth.py` signup/login are stubbed; there is currently no
   working login.
2. **Encrypted token storage wired end-to-end** — the encryption utility exists
   (`core/encryption.py`) but `accounts.py` doesn't call it yet.
3. **Real Plaid token exchange** — `plaid_service.py` has the right method signatures
   but no actual SDK calls.

## Suggested build order
1. Auth (signup/login/JWT) — nothing else matters until users can log in securely.
2. Plaid connection flow (link token → exchange → encrypted storage).
3. Transaction sync (`daily_sync.py`) — pull real data to test the forecast engine against.
4. Forecast engine (`generate_forecast`) — implement the rolling-average approach.
5. Dashboard wiring — replace mock data with real API responses.
6. Alerts (`alert_service.py` + `alert_scheduler.py`) — email first.
7. Error handling — expired bank connections, failed syncs, retry logic.
8. Production migrations via Alembic — never `Base.metadata.create_all()` outside dev.

## Realistic timeline
- **2–3 weeks** for a working prototype with real (sandbox) bank data, one developer,
  working from this scaffold.
- Add **1 week** before a real pilot: error handling, basic monitoring, a staging environment.

## Full build roadmap
See the phased roadmap (foundations → security/auth → real bank integration → forecast
validation → alerts → pilot → production hardening → launch) — each phase should have a
concrete exit condition before moving to the next. Most fintech MVPs fail by skipping the
security or pilot phase to rush toward something flashier; don't do that here.
