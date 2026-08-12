"""
ForecastSnapshot ORM model — forecast schema.

Stores cached daily balance projections so the dashboard doesn't
recompute on every request.
"""

import uuid
from datetime import date as date_type
from datetime import datetime, timezone

from sqlalchemy import Date, DateTime, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ForecastSnapshot(Base):
    """A single day's projected balance in a forecast series."""

    __tablename__ = "forecast_snapshots"
    __table_args__ = (
        # One cached snapshot set per user per calendar day
        UniqueConstraint(
            "user_id", "forecast_date", "generated_date",
            name="uq_forecast_user_date_generated",
        ),
        {"schema": "forecast"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True,
    )
    forecast_date: Mapped[date_type] = mapped_column(
        Date, nullable=False,
    )
    projected_balance: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False,
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    generated_date: Mapped[date_type] = mapped_column(
        Date, nullable=False,
        default=date_type.today,
    )

    def __repr__(self) -> str:
        return (
            f"<ForecastSnapshot {self.forecast_date}: "
            f"${self.projected_balance}>"
        )
