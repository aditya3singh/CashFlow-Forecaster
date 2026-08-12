"""
Transaction ORM model — txn schema.

Stores both Plaid-synced transactions and user-created manual overrides.
plaid_transaction_id is the idempotency key for sync upserts.
"""

import uuid
from datetime import date as date_type
from datetime import datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Transaction(Base):
    """A single financial transaction (from Plaid or manual override)."""

    __tablename__ = "transactions"
    __table_args__ = (
        # The forecast engine's primary query pattern:
        # "last 90 days of transactions for this account"
        Index("ix_transactions_account_date", "bank_account_id", "date"),
        {"schema": "txn"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    bank_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True,
    )
    plaid_transaction_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True,
    )
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False,
    )
    category: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    merchant_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True,
    )
    date: Mapped[date_type] = mapped_column(
        Date, nullable=False,
    )
    is_manual_override: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<Transaction {self.amount} on {self.date} ({self.category})>"
