"""Alembic migration environment.

Runs synchronously (psycopg2) using SQLALCHEMY_DATABASE_URL_SYNC and imports the
ORM metadata so autogenerate can detect model changes.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Import the declarative Base and models so target_metadata is populated.
from database import SQLALCHEMY_DATABASE_URL_SYNC, Base, DB_SSL_REQUIRED
import models  # noqa: F401  (imported for side effect: registers tables on Base)

config = context.config

# Use the sync URL derived from DATABASE_URL rather than the static ini value.
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL_SYNC)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL without a DBAPI connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (with a live DBAPI connection)."""
    # Match database.py: require TLS (psycopg2 spelling) only when DB_SSL is
    # set, so Azure Postgres works while local docker Postgres stays plaintext.
    connect_args = {"sslmode": "require"} if DB_SSL_REQUIRED else {}

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
