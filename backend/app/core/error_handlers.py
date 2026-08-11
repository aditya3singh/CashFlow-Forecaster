"""
Global error handlers — catches AppException and returns consistent JSON.

Registered in main.py so every route gets the same error format:
    { "success": false, "message": "...", "status_code": 404 }
"""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle all custom AppException subclasses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "status_code": exc.status_code,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all for unhandled exceptions.
    Never expose stack traces to the client.
    """
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred",
            "status_code": 500,
        },
    )
