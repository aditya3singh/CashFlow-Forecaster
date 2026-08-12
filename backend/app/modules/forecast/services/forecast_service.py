"""
Forecast service — orchestrates data gathering, engine execution, and caching.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

This service ties together:
- Bank accounts (to get current balance)
- Transactions (historical data for the engine)
- Forecast engine (pure computation)
- Forecast repository (caching)
"""

import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.modules.bank.repositories import bank_account_repository
from app.modules.forecast.repositories import forecast_repository
from app.modules.forecast.schemas.forecast_schemas import (
    ForecastDay,
    ForecastResponse,
    ShortfallInfo,
)
from app.modules.forecast.services.forecast_engine import (
    detect_shortfall,
    generate_forecast,
)
from app.modules.transaction.repositories import transaction_repository

logger = get_logger(__name__)


def get_forecast(
    db: Session,
    user_id: str,
    threshold: float = 0.0,
) -> ForecastResponse:
    """
    Get the cashflow forecast for a user.

    Flow:
        1. Check for connected accounts → needs_onboarding if none
        2. Check for today's cached forecast → return if exists
        3. Gather data: current balance + last 90 days of transactions
        4. Run forecast engine
        5. Cache the results
        6. Return

    Args:
        db: Database session.
        user_id: The authenticated user's UUID.
        threshold: Alert threshold for shortfall detection.

    Returns:
        ForecastResponse with projected balances and shortfall info.
    """
    user_uuid = uuid.UUID(user_id)

    # 1. Check for connected accounts
    accounts = bank_account_repository.get_accounts_by_user(db, user_uuid)
    if not accounts:
        logger.info(f"No accounts for user {user_id} — needs onboarding")
        return ForecastResponse(
            current_balance=0.0,
            days=[],
            shortfall=None,
            needs_onboarding=True,
        )

    # 2. Check cache
    cached = forecast_repository.get_today_forecast(db, user_uuid)
    if cached:
        logger.info(f"Returning cached forecast for user {user_id}")
        current_balance = _get_current_balance(accounts)
        days = [
            ForecastDay(
                date=s.forecast_date,
                projected_balance=float(s.projected_balance),
            )
            for s in cached
        ]
        shortfall_result = detect_shortfall(
            [{"date": d.date, "projected_balance": d.projected_balance} for d in days],
            Decimal(str(threshold)),
        )
        shortfall = (
            ShortfallInfo(
                date=shortfall_result["date"],
                projected_balance=shortfall_result["projected_balance"],
            )
            if shortfall_result
            else None
        )
        return ForecastResponse(
            current_balance=current_balance,
            days=days,
            shortfall=shortfall,
        )

    # 3. Gather data
    current_balance = _get_current_balance(accounts)
    account_ids = [a.id for a in accounts]

    # Historical transactions — last 90 days
    start_date = date.today() - timedelta(days=90)
    historical = transaction_repository.get_transactions_for_user(
        db=db,
        account_ids=account_ids,
        start_date=start_date,
        end_date=date.today(),
    )

    # Manual overrides — future dates
    overrides = transaction_repository.get_manual_overrides_for_user(
        db=db,
        account_ids=account_ids,
    )

    # Convert to dicts for the engine
    hist_dicts = [
        {"date": t.date, "amount": float(t.amount)}
        for t in historical
        if not t.is_manual_override
    ]
    override_dicts = [
        {"date": t.date, "amount": float(t.amount)}
        for t in overrides
    ]

    # 4. Run forecast engine
    forecast = generate_forecast(
        current_balance=Decimal(str(current_balance)),
        historical_transactions=hist_dicts,
        manual_overrides=override_dicts,
    )

    # 5. Cache
    forecast_repository.save_forecast_snapshots(
        db=db,
        user_id=user_uuid,
        snapshots=forecast,
    )

    # 6. Build response
    days = [
        ForecastDay(
            date=f["date"],
            projected_balance=f["projected_balance"],
        )
        for f in forecast
    ]

    shortfall_result = detect_shortfall(forecast, Decimal(str(threshold)))
    shortfall = (
        ShortfallInfo(
            date=shortfall_result["date"],
            projected_balance=shortfall_result["projected_balance"],
        )
        if shortfall_result
        else None
    )

    logger.info(
        f"Generated forecast for user {user_id}: "
        f"{len(days)} days, shortfall={'yes' if shortfall else 'no'}"
    )

    return ForecastResponse(
        current_balance=current_balance,
        days=days,
        shortfall=shortfall,
    )


def _get_current_balance(accounts) -> float:
    """
    Sum the current balance across all active accounts.
    Accounts with None balance are treated as 0.
    """
    total = sum(
        float(a.current_balance) if a.current_balance is not None else 0.0
        for a in accounts
        if a.status == "active"
    )
    return round(total, 2)
