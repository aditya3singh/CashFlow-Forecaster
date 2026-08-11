# CashFlow Forecaster

> **Predict your bank balance 2-6 weeks ahead. Get alerted before a shortfall.**

A fintech cashflow forecasting platform for small business owners — built with a **modular monolith** architecture designed for clean future microservices extraction.

## 🏗️ Architecture

```
                    ┌──────────────────────────────────────────┐
                    │         FRONTEND (Next.js + TS)          │
                    │  Customer Portal │ Admin Portal (v1.5)   │
                    └──────────┬───────────────────────────────┘
                               │ HTTPS
                    ┌──────────▼───────────────────────────────┐
                    │        ONE FastAPI Application            │
                    │                                          │
                    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐  │
                    │  │ Auth │ │ Bank │ │Trans.│ │Forecast│  │
                    │  │Module│ │Module│ │Module│ │ Module │  │
                    │  └──────┘ └──────┘ └──────┘ └────────┘  │
                    │  ┌──────┐ ┌──────┐ ┌──────┐             │
                    │  │Alert │ │Audit │ │Admin │             │
                    │  │Module│ │Module│ │Module│             │
                    │  └──────┘ └──────┘ └──────┘             │
                    └──────────┬───────────────────────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │  PostgreSQL (7 schemas)  │   Redis
                    └─────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS |
| **Backend** | Python 3.12 + FastAPI |
| **Database** | PostgreSQL 16 (7 isolated schemas) |
| **Cache** | Redis 7 |
| **Auth** | JWT (HS256) + bcrypt |
| **Bank API** | Plaid (stubbed for now) |
| **Email** | SendGrid (stubbed for now) |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Setup
```bash
# Clone the repo
git clone https://github.com/aditya3singh/CashFlow-Forecaster.git
cd CashFlow-Forecaster

# Create .env from template
cp .env.example .env

# Start all services
make dev
```

The API will be available at: **http://localhost:8000/docs**

### Common Commands
```bash
make dev          # Start all containers
make stop         # Stop all containers
make logs         # Stream backend logs
make test         # Run all tests
make migrate      # Run database migrations
make lint         # Check code quality
make format       # Auto-format code
make clean        # Remove containers + volumes
```

## 📁 Project Structure

```
smb-cashflow-forecaster/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── core/                # Security, encryption, dependencies
│   │   ├── middleware/          # CORS, rate limiting, logging
│   │   └── modules/            # Business logic (7 modules)
│   │       ├── auth/           # Authentication & users
│   │       ├── bank/           # Bank integration (Plaid)
│   │       ├── transaction/    # Transaction ledger
│   │       ├── forecast/       # Forecast engine
│   │       ├── alert/          # Notifications
│   │       ├── audit/          # Activity logging
│   │       └── admin/          # Admin portal
│   ├── alembic/                # Database migrations
│   └── tests/                  # Test suite
├── frontend/                   # Next.js + TypeScript
├── infra/                      # Docker, SQL init, CI/CD
├── docs/                       # Architecture docs
├── docker-compose.yml
├── Makefile
└── .env.example
```

## 🔐 Security

- Passwords hashed with **bcrypt** (never stored plaintext)
- Bank tokens encrypted with **Fernet** symmetric encryption
- JWT tokens with role-based access control
- Consistent error responses (no stack traces to client)
- `.env` secrets never committed to git

## 📋 Build Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Foundations & folder structure | ✅ Done |
| Phase 1 | Auth module (signup/login/JWT) | 🔧 In Progress |
| Phase 2 | Bank integration (Plaid) | ⏳ Planned |
| Phase 3 | Forecast engine | ⏳ Planned |
| Phase 4 | Alerts & notifications | ⏳ Planned |
| Phase 5 | Frontend (Next.js) | ⏳ Planned |
| Phase 6 | Pilot (5-10 real businesses) | ⏳ Planned |

## 📄 License

Private — All rights reserved.
