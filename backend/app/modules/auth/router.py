"""
Auth module router — registers all auth endpoints.

All routes are prefixed with /api/v1/auth.
This file is imported by main.py to include in the app.
"""

from fastapi import APIRouter

from app.modules.auth.controllers.auth_controller import router as auth_controller

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

# Include controller routes
router.include_router(auth_controller)
