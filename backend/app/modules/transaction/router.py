"""
Transaction module router — registers all transaction endpoints.

All routes are prefixed with /api/v1/transactions.
This file is imported by main.py to include in the app.
"""

from fastapi import APIRouter

from app.modules.transaction.controllers.transaction_controller import (
    router as transaction_controller,
)

router = APIRouter(
    prefix="/api/v1/transactions",
    tags=["Transactions"],
)

# Include controller routes
router.include_router(transaction_controller)
