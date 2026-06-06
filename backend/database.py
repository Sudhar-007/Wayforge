"""Database connection setup for Wayforge.

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

# Azure Postgres Flexible Server forces TLS. We enable it per-driver (asyncpg
# here, psycopg2 in alembic/env.py) instead of putting an SSL flag in
# DATABASE_URL, because the two drivers spell the option differently
# (ssl=True vs sslmode=require). Gated on DB_SSL so the local docker-compose
# Postgres (TLS disabled) keeps working unchanged.
DB_SSL_REQUIRED = os.environ.get("DB_SSL", "").lower() in ("require", "true", "1")
_connect_args = {"ssl": True} if DB_SSL_REQUIRED else {}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=_connect_args,
)

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
