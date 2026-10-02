"""
Payment module router — registers all payment method endpoints.

All routes are prefixed with /api/v1/payments.
This file is imported by main.py to include in the app.
"""

from fastapi import APIRouter

from app.modules.payment.controllers.payment_controller import router as payment_controller

router = APIRouter(
    prefix="/api/v1/payments",
    tags=["Payment Methods"],
)

# Include controller routes
router.include_router(payment_controller)
