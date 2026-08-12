"""
Bank module router — registers all bank/account endpoints.

All routes are prefixed with /api/v1/accounts.
This file is imported by main.py to include in the app.
"""

from fastapi import APIRouter

from app.modules.bank.controllers.account_controller import router as account_controller

router = APIRouter(
    prefix="/api/v1/accounts",
    tags=["Bank Accounts"],
)

# Include controller routes
router.include_router(account_controller)
