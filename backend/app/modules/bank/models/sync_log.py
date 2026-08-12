"""
SyncLog ORM model — bank schema.

Tracks the history and status of daily bank sync jobs.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SyncLog(Base):
    """Tracks each sync job's execution status."""

    __tablename__ = "sync_logs"
    __table_args__ = {"schema": "bank"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    bank_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bank.bank_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="running",
    )
    error_message: Mapped[str | None] = mapped_column(
        Text, nullable=True,
    )
    transactions_synced: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0,
    )

    def __repr__(self) -> str:
        return f"<SyncLog {self.status} ({self.transactions_synced} txns)>"
