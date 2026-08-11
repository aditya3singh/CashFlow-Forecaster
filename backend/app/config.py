"""
Application configuration — loads from .env, typed and validated.

Usage:
    from app.config import settings
    print(settings.DATABASE_URL)
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Typed settings loaded from environment variables."""

    # ── Database ──
    DATABASE_URL: str = "postgresql://cashflow:cashflow@localhost:5432/cashflow_db"

    # ── Security ──
    JWT_SECRET_KEY: str = "change-me-to-a-random-64-char-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # ── Encryption (Fernet key for bank tokens) ──
    TOKEN_ENCRYPTION_KEY: str = "change-me-generate-with-fernet"

    # ── Plaid (stubbed) ──
    PLAID_CLIENT_ID: str = ""
    PLAID_SECRET: str = ""
    PLAID_ENV: str = "sandbox"

    # ── SendGrid (stubbed) ──
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "alerts@cashflowforecaster.com"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379"

    # ── App ──
    APP_ENV: str = "development"
    APP_NAME: str = "CashFlow Forecaster"
    CORS_ORIGINS: str = "http://localhost:3000"
    BACKEND_PORT: int = 8000

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton instance — import this everywhere
settings = Settings()
