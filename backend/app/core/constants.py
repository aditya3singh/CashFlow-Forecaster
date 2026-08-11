"""
Application-wide constants and enums.

Centralized here so they're importable from anywhere
without circular dependencies.
"""

from enum import Enum


class UserRole(str, Enum):
    """User roles — maps to the 3 portals."""
    CUSTOMER = "customer"   # Customer Portal (SMB owners)
    ADMIN = "admin"         # Admin Portal (internal team)
    PARTNER = "partner"     # Partner Portal (accountants, v2+)


class AccountStatus(str, Enum):
    """Bank account connection status."""
    ACTIVE = "active"
    REAUTH_REQUIRED = "reauth_required"
    ERROR = "error"


class SyncStatus(str, Enum):
    """Daily sync job status."""
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class AlertType(str, Enum):
    """Types of alerts."""
    PROJECTED_SHORTFALL = "projected_shortfall"


class AlertChannel(str, Enum):
    """Notification delivery channels."""
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"


class ForecastTrigger(str, Enum):
    """What triggered a forecast regeneration."""
    SCHEDULED = "scheduled"
    MANUAL = "manual"
    OVERRIDE_ADDED = "override_added"
