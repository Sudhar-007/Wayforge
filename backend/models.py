"""SQLAlchemy ORM models for Pathfinder."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    github_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    github_username: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    roadmaps: Mapped[list["Roadmap"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    topic: Mapped[str | None] = mapped_column(String, nullable=True)
    level: Mapped[str | None] = mapped_column(String, nullable=True)
    weekly: Mapped[str | None] = mapped_column(String, nullable=True)
    goal: Mapped[str | None] = mapped_column(String, nullable=True)
    focus: Mapped[str | None] = mapped_column(String, nullable=True)
    # Full roadmap document (nodes[]/edges[]) matching src/types/roadmap.ts.
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="roadmaps")
