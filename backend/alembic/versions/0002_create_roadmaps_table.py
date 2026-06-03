"""create roadmaps table

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "roadmaps",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("topic", sa.String(), nullable=True),
        sa.Column("level", sa.String(), nullable=True),
        sa.Column("weekly", sa.String(), nullable=True),
        sa.Column("goal", sa.String(), nullable=True),
        sa.Column("focus", sa.String(), nullable=True),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roadmaps_user_id"), "roadmaps", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_roadmaps_user_id"), table_name="roadmaps")
    op.drop_table("roadmaps")
