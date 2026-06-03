"""Pydantic v2 schemas for the User API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    github_id: str
    github_username: str
    email: str | None = None
    avatar_url: str | None = None


class UserCreate(UserBase):
    """Input shape for creating a user."""


class UserResponse(UserBase):
    """Output shape returned to clients."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Roadmaps
# ---------------------------------------------------------------------------


class RoadmapBase(BaseModel):
    """Shared roadmap metadata fields (excludes the heavy `data` blob)."""

    title: str
    topic: str | None = None
    level: str | None = None
    weekly: str | None = None
    goal: str | None = None
    focus: str | None = None


class RoadmapCreate(RoadmapBase):
    """Input shape for creating a roadmap. `data` is the full roadmap document
    (nodes[]/edges[]) matching src/types/roadmap.ts."""

    data: dict


class RoadmapUpdate(BaseModel):
    """Partial-update shape for PATCH — every field optional."""

    title: str | None = None
    topic: str | None = None
    level: str | None = None
    weekly: str | None = None
    goal: str | None = None
    focus: str | None = None
    data: dict | None = None


class RoadmapResponse(RoadmapBase):
    """Full roadmap returned to clients, including the `data` document."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    data: dict
    created_at: datetime
    updated_at: datetime


class RoadmapListItem(BaseModel):
    """Lightweight list-view shape — omits `data`, adds derived progress."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    topic: str | None = None
    level: str | None = None
    created_at: datetime
    updated_at: datetime
    progress_percentage: int


def compute_progress_percentage(data: dict | None) -> int:
    """Percent of learnable nodes marked completed, as an integer 0–100.

    Section headers are organizational labels, not learnable work, so they are
    excluded from both the numerator and the denominator.
    """
    nodes = (data or {}).get("nodes", []) or []
    learnable = [n for n in nodes if n.get("type") != "section_header"]
    if not learnable:
        return 0
    completed = sum(1 for n in learnable if n.get("status") == "completed")
    return round(completed / len(learnable) * 100)
