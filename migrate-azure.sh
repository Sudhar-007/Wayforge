#!/usr/bin/env bash
# Run Alembic migrations against the Azure Postgres Flexible Server.
# The DB password is passed as $1 so it is NOT stored in this file.
# Usage (from repo root):  bash migrate-azure.sh '<db-password>'
set -euo pipefail
cd "$(dirname "$0")/backend"
DATABASE_URL="postgresql+asyncpg://pfadmin:$1@pathfinder-db.postgres.database.azure.com:5432/pathfinder" \
DB_SSL=require python -m alembic upgrade head
