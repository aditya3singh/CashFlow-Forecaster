"""
PaymentMethod ORM model — bank schema.

Stores user payment methods: cards (tokenized), UPI IDs, and bank accounts.
Only masked/last-4 digits are stored for cards — never full card numbers.
Gateway tokens (for future Razorpay/Stripe integration) are encrypted at rest.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PaymentMethod(Base):
    """A saved payment method (card, UPI, or bank account)."""

    __tablename__ = "payment_methods"
    __table_args__ = {"schema": "bank"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True,
    )

    # ── Type: 'card', 'upi', 'bank_account' ──
    method_type: Mapped[str] = mapped_column(
        String(20), nullable=False,
    )

    # ── Common ──
    label: Mapped[str] = mapped_column(
        String(100), nullable=False,
    )

    # ── Card-specific ──
    last_four: Mapped[str | None] = mapped_column(
        String(4), nullable=True,
    )
    card_brand: Mapped[str | None] = mapped_column(
        String(30), nullable=True,  # visa, mastercard, rupay, amex, discover
    )
    card_expiry_month: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    card_expiry_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )
    cardholder_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )

    # ── UPI-specific ──
    upi_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )

    # ── Bank account-specific ──
    bank_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )
    bank_ifsc: Mapped[str | None] = mapped_column(
        String(11), nullable=True,
    )
    bank_account_number_masked: Mapped[str | None] = mapped_column(
        String(30), nullable=True,  # e.g., "XXXX XXXX 4821"
    )
    account_holder_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )

    # ── Gateway integration (future) ──
    gateway_token: Mapped[bytes | None] = mapped_column(
        nullable=True,  # Fernet-encrypted token from Razorpay/Stripe
    )

    # ── Flags ──
    is_default: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
    )
    is_auto_pay_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active",
        # active | disabled | expired
    )

    # ── Timestamps ──
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<PaymentMethod {self.method_type}:{self.label} ({self.status})>"
