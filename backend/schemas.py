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
