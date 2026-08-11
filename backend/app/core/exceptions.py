"""
Custom exception classes — consistent error handling across all modules.

Usage:
    from app.core.exceptions import NotFoundException

    raise NotFoundException("User not found")
"""


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found (404)."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404)


class UnauthorizedException(AppException):
    """Authentication failed (401)."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message=message, status_code=401)


class ForbiddenException(AppException):
    """Authorization failed — user lacks permission (403)."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(message=message, status_code=403)


class ConflictException(AppException):
    """Duplicate resource (409) — e.g. email already registered."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message=message, status_code=409)


class ValidationException(AppException):
    """Input validation failed (422)."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message=message, status_code=422)
