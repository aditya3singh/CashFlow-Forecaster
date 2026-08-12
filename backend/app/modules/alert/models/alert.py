"""
Alert ORM model — alert schema.

Stores shortfall alert history. Used for:
- Displaying past alerts to users
- Idempotency: don't re-alert for the same shortfall date
"""

import uuid
from datetime import date as date_type
from datetime import datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Alert(Base):
    """A shortfall alert sent (or pending) to a user."""

    __tablename__ = "alerts"
    __table_args__ = (
        # Used to check "did we already alert for this date?"
        # before sending again (idempotency for the nightly job)
        Index("ix_alerts_user_shortfall_date", "user_id", "shortfall_date"),
        {"schema": "alert"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True,
    )
    alert_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="projected_shortfall",
    )
    shortfall_date: Mapped[date_type] = mapped_column(
        Date, nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text, nullable=False,
    )
    sent: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return (
            f"<Alert {self.alert_type} on {self.shortfall_date} "
            f"sent={self.sent}>"
        )
