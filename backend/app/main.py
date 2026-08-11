"""
FastAPI Application — main entry point.

Registers all module routers, middleware, and error handlers.

Run with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.error_handlers import app_exception_handler, generic_exception_handler
from app.core.exceptions import AppException
from app.core.logging_config import setup_logging
from app.middleware.request_logger import RequestLoggerMiddleware

# ── Setup Logging ──
setup_logging(level="DEBUG" if settings.APP_ENV == "development" else "INFO")

# ── Create App ──
app = FastAPI(
    title=settings.APP_NAME,
    description="Predict your bank balance 2-6 weeks ahead. Get alerted before a shortfall.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ──
# CORS — allows frontend (Next.js on :3000) to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging
app.add_middleware(RequestLoggerMiddleware)

# ── Error Handlers ──
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# ── Module Routers ──
# Each module registers its own routes via router.py.
# Import and include them here as they are built.

from app.modules.auth.router import router as auth_router  # noqa: E402

app.include_router(auth_router)

# Uncomment as modules are built:
# from app.modules.bank.router import router as bank_router
# from app.modules.transaction.router import router as transaction_router
# from app.modules.forecast.router import router as forecast_router
# from app.modules.alert.router import router as alert_router
# from app.modules.audit.router import router as audit_router
# from app.modules.admin.router import router as admin_router
# app.include_router(bank_router)
# app.include_router(transaction_router)
# app.include_router(forecast_router)
# app.include_router(alert_router)
# app.include_router(audit_router)
# app.include_router(admin_router)


# ── Health Check ──
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """Health check endpoint — returns 200 if the service is running."""
    return {"status": "ok", "service": settings.APP_NAME}
