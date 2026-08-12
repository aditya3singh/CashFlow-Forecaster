"""
Forecast repository — data access layer for forecast snapshots.

Handles caching of computed forecasts so the dashboard
doesn't recompute on every request.
"""

import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.modules.forecast.models.forecast_snapshot import ForecastSnapshot


def get_today_forecast(
    db: Session,
    user_id: uuid.UUID,
) -> list[ForecastSnapshot] | None:
    """
    Get the cached forecast for today, if one exists.

    Returns:
        List of ForecastSnapshot rows for today's generation, or None
        if no forecast has been generated today.
    """
    snapshots = (
        db.query(ForecastSnapshot)
        .filter(
            ForecastSnapshot.user_id == user_id,
            ForecastSnapshot.generated_date == date.today(),
        )
        .order_by(ForecastSnapshot.forecast_date.asc())
        .all()
    )
    return snapshots if snapshots else None


def save_forecast_snapshots(
    db: Session,
    user_id: uuid.UUID,
    snapshots: list[dict],
) -> list[ForecastSnapshot]:
    """
    Save a computed forecast series to the database.

    Deletes any existing snapshots generated today for this user
    before inserting the new ones (replace strategy).

    Args:
        db: Database session.
        user_id: The user this forecast belongs to.
        snapshots: List of dicts with 'date' and 'projected_balance' keys.

    Returns:
        The saved ForecastSnapshot objects.
    """
    today = date.today()

    # Delete any existing forecast for today (regeneration)
    db.query(ForecastSnapshot).filter(
        ForecastSnapshot.user_id == user_id,
        ForecastSnapshot.generated_date == today,
    ).delete()

    # Insert new snapshots
    records = []
    for snap in snapshots:
        record = ForecastSnapshot(
            user_id=user_id,
            forecast_date=snap["date"],
            projected_balance=snap["projected_balance"],
            generated_date=today,
        )
        db.add(record)
        records.append(record)

    db.commit()

    for r in records:
        db.refresh(r)

    return records
