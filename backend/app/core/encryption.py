"""
Encryption utilities — Fernet symmetric encryption for bank access tokens.

Bank tokens are NEVER stored in plaintext. This module provides
encrypt/decrypt functions using a key from the environment.

Usage:
    from app.core.encryption import encrypt_token, decrypt_token

    encrypted = encrypt_token("access-sandbox-abc123")
    original = decrypt_token(encrypted)
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


def _get_fernet() -> Fernet:
    """Get a Fernet instance with the configured key."""
    raw_key = settings.TOKEN_ENCRYPTION_KEY or "cashflow-development-secret-encryption-key"
    try:
        key = raw_key.encode()
        return Fernet(key)
    except Exception:
        # If key is not valid 32 url-safe base64 bytes, derive one using SHA256
        digest = hashlib.sha256(raw_key.encode()).digest()
        url_safe_key = base64.urlsafe_b64encode(digest)
        return Fernet(url_safe_key)


def encrypt_token(token: str) -> bytes:
    """
    Encrypt a plaintext bank access token.

    Args:
        token: The plaintext access token from Plaid.

    Returns:
        Encrypted bytes (safe to store in BYTEA column).

    Important:
        This MUST be called immediately after receiving a token from Plaid,
        BEFORE any database write. The plaintext token should never be
        logged, stored, or passed beyond this function.
    """
    fernet = _get_fernet()
    return fernet.encrypt(token.encode())


def decrypt_token(encrypted_token: bytes) -> str:
    """
    Decrypt an encrypted bank access token.

    Args:
        encrypted_token: The encrypted bytes from the database.

    Returns:
        The original plaintext access token.

    Raises:
        InvalidToken: If the key is wrong or data is corrupted.
    """
    fernet = _get_fernet()
    return fernet.decrypt(encrypted_token).decode()
