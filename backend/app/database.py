"""
Database setup — SQLAlchemy engine, session factory, and Base.

Usage:
    from app.database import get_db, Base

    # In a FastAPI route:
    def my_route(db: Session = Depends(get_db)):
        ...

    # In a model:
    class User(Base):
        __tablename__ = "users"
        __table_args__ = {"schema": "auth"}
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# ── Engine ──
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Detect stale connections
    pool_size=10,
    max_overflow=20,
    echo=(settings.APP_ENV == "development"),  # SQL logging in dev only
)

# ── Session Factory ──
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ── Declarative Base ──
class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ── Dependency ──
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    Automatically closes the session when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
