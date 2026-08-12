"""
BankAccount ORM model — bank schema.

Stores connected bank accounts and their encrypted Plaid access tokens.
user_id is a logical reference (UUID) — no FK to auth schema.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BankAccount(Base):
    """A connected bank account (via Plaid)."""

    __tablename__ = "bank_accounts"
    __table_args__ = {"schema": "bank"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True,
    )
    plaid_item_id: Mapped[str] = mapped_column(
        String(255), nullable=False,
    )
    encrypted_access_token: Mapped[bytes] = mapped_column(
        nullable=False,
    )
    institution_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    account_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    current_balance: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active",
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<BankAccount {self.institution_name} ({self.status})>"
