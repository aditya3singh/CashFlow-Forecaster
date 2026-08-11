.PHONY: dev stop logs test migrate seed clean

# ── Development ──
dev:
	docker compose up -d
	@echo ""
	@echo "✅ CashFlow Forecaster is running!"
	@echo "   Backend API:  http://localhost:8000/docs"
	@echo "   PostgreSQL:   localhost:5432"
	@echo "   Redis:        localhost:6379"
	@echo ""

stop:
	docker compose down

logs:
	docker compose logs -f backend

# ── Database ──
migrate:
	cd backend && alembic upgrade head

migrate-create:
	cd backend && alembic revision --autogenerate -m "$(msg)"

seed:
	cd backend && python -m app.seed

# ── Testing ──
test:
	cd backend && python -m pytest -v

test-auth:
	cd backend && python -m pytest tests/test_auth/ -v

test-forecast:
	cd backend && python -m pytest tests/test_forecast/ -v

# ── Code Quality ──
lint:
	cd backend && ruff check .

format:
	cd backend && ruff format .

# ── Cleanup ──
clean:
	docker compose down -v
	@echo "🧹 Cleaned up containers and volumes"
