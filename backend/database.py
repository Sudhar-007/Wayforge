"""Database connection setup for Pathfinder.

Provides the async SQLAlchemy engine/session used by FastAPI request handlers,
plus a sync URL that Alembic uses for migrations (Alembic runs synchronously).
"""

import os

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

# Async URL used by the FastAPI app (asyncpg driver).
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://pathfinder:devpass@localhost:5432/pathfinder",
)

# Sync URL used by Alembic — strip the asyncpg driver so it falls back to the
# default sync driver (psycopg2).
SQLALCHEMY_DATABASE_URL_SYNC = DATABASE_URL.replace("+asyncpg", "")

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


async def get_db():
    """Yield a database session per request (FastAPI Depends pattern)."""
    async with AsyncSessionLocal() as session:
        yield session
