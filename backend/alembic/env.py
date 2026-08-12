"""
Alembic env.py — configured for CashFlow Forecaster.

Imports all ORM models so autogenerate discovers every table.
Uses DATABASE_URL from app config.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import all models so Alembic sees them ──
# Auth
from app.modules.auth.models.user import User  # noqa: F401, E402
from app.modules.auth.models.refresh_token import RefreshToken  # noqa: F401, E402

# Bank
from app.modules.bank.models.bank_account import BankAccount  # noqa: F401, E402
from app.modules.bank.models.sync_log import SyncLog  # noqa: F401, E402

# Transaction
from app.modules.transaction.models.transaction import Transaction  # noqa: F401, E402

# Forecast
from app.modules.forecast.models.forecast_snapshot import ForecastSnapshot  # noqa: F401, E402

# Alert
from app.modules.alert.models.alert import Alert  # noqa: F401, E402

# ── Use our Base metadata and database URL ──
from app.database import Base  # noqa: E402
from app.config import settings  # noqa: E402

target_metadata = Base.metadata

# Override sqlalchemy.url with our config value
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Include schema names so multi-schema setup works
        include_schemas=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Include schema names so multi-schema setup works
            include_schemas=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
