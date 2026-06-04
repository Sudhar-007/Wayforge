"""create rate_limit_counters table

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rate_limit_counters",
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("subject_key", sa.String(), nullable=False),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint(
            "scope", "subject_key", "period", "window_start"
        ),
    )
    op.create_index(
        op.f("ix_rate_limit_counters_window_start"),
        "rate_limit_counters",
        ["window_start"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_rate_limit_counters_window_start"),
        table_name="rate_limit_counters",
    )
    op.drop_table("rate_limit_counters")
