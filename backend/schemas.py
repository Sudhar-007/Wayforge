"""Pydantic v2 schemas for the User API."""

import json
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Bounds for roadmap payloads (defense against storage/DoS abuse — these routes
# are authenticated but otherwise unmetered).
MAX_TITLE_LEN = 200
MAX_META_LEN = 500
MAX_ROADMAP_NODES = 500
MAX_ROADMAP_EDGES = 1000
MAX_ROADMAP_DATA_BYTES = 256 * 1024  # 256 KB serialized


def _validate_roadmap_data(data: dict | None) -> dict | None:
    """Reject oversized or absurdly large roadmap documents.

    Caps the serialized size and the node/edge counts so a client can't store
    multi-MB blobs in the JSONB column. Shape correctness beyond this is enforced
    by the frontend contract (src/types/roadmap.ts); this is purely a safety cap.
    """
    if data is None:
        return data
    if not isinstance(data, dict):
        raise ValueError("data must be a JSON object")

    size = len(json.dumps(data, separators=(",", ":")).encode("utf-8"))
    if size > MAX_ROADMAP_DATA_BYTES:
        raise ValueError(
            f"roadmap data too large ({size} bytes; max {MAX_ROADMAP_DATA_BYTES})"
        )

    nodes = data.get("nodes")
    if isinstance(nodes, list) and len(nodes) > MAX_ROADMAP_NODES:
        raise ValueError(f"too many nodes ({len(nodes)}; max {MAX_ROADMAP_NODES})")

    edges = data.get("edges")
    if isinstance(edges, list) and len(edges) > MAX_ROADMAP_EDGES:
        raise ValueError(f"too many edges ({len(edges)}; max {MAX_ROADMAP_EDGES})")

    return data


class UserBase(BaseModel):
    github_id: str
    github_username: str
    email: str | None = None
    avatar_url: str | None = None


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

    title: str = Field(max_length=MAX_TITLE_LEN)
    topic: str | None = Field(default=None, max_length=MAX_META_LEN)
    level: str | None = Field(default=None, max_length=MAX_META_LEN)
    weekly: str | None = Field(default=None, max_length=MAX_META_LEN)
    goal: str | None = Field(default=None, max_length=MAX_META_LEN)
    focus: str | None = Field(default=None, max_length=MAX_META_LEN)


class RoadmapCreate(RoadmapBase):
    """Input shape for creating a roadmap. `data` is the full roadmap document
    (nodes[]/edges[]) matching src/types/roadmap.ts."""

    data: dict

    _check_data = field_validator("data")(_validate_roadmap_data)


class RoadmapUpdate(BaseModel):
    """Partial-update shape for PATCH — every field optional."""

    title: str | None = Field(default=None, max_length=MAX_TITLE_LEN)
    topic: str | None = Field(default=None, max_length=MAX_META_LEN)
    level: str | None = Field(default=None, max_length=MAX_META_LEN)
    weekly: str | None = Field(default=None, max_length=MAX_META_LEN)
    goal: str | None = Field(default=None, max_length=MAX_META_LEN)
    focus: str | None = Field(default=None, max_length=MAX_META_LEN)
    data: dict | None = None

    _check_data = field_validator("data")(_validate_roadmap_data)


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
