import os
import secrets
import time
import uuid

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google.api_core import exceptions as google_api_exceptions
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Literal
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai

from intent_mapper import build_search_strategy
from searcher import search_all
from scraper import scrape_all
from ranker import filter_results, format_for_prompt
from validator import validate_all
from synthesizer import synthesize_roadmap, mock_structured_roadmap

from auth import create_access_token, get_current_user
from database import get_db
from models import Roadmap, User
from oauth import (
    exchange_code_for_token,
    fetch_github_user,
    github_authorize_url,
)
from schemas import (
    RoadmapCreate,
    RoadmapListItem,
    RoadmapResponse,
    RoadmapUpdate,
    UserResponse,
    compute_progress_percentage,
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Configure Gemini. Default to Gemini 3.1 Flash-Lite; override with GEMINI_MODEL
# env if needed. Stay on 3.1 (or newer) — do not pin back to 2.0.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
gemini_model = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel(GEMINI_MODEL)
    print(f"Gemini model: {GEMINI_MODEL}")
else:
    print("WARNING: GEMINI_API_KEY not found!")


def generate_gemini_text(prompt: str) -> str:
    if not gemini_model:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except google_api_exceptions.ResourceExhausted as e:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini API quota exceeded. Wait a minute and try again, "
                "or use a different API key / model (GEMINI_MODEL env var)."
            ),
        ) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}") from e


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def verify_db_connection():
    """Verify the database is reachable on startup (log, don't crash)."""
    from sqlalchemy import text

    from database import engine

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("Database connection: OK")
    except Exception as e:
        print(f"WARNING: Database connection failed: {e}")


class GenerateRequest(BaseModel):
    topic: str
    level: Literal["Beginner", "Intermediate", "Advanced"]
    weekly: str  # "1-3 hours" | "4-7 hours" | "8-15 hours" | "15+ hours"
    goal: str
    focus: str = ""


@app.post("/generate")
async def generate(request: GenerateRequest):
    """Structured roadmap generation.

    Accepts the intake form directly and returns a roadmap matching the frontend
    contract (src/types/roadmap.ts): top-level nodes[]/edges[]. Runs the
    search/scrape/validate/rank pipeline, then the new-schema synthesizer.
    """
    print("Structured roadmap generation (/generate) started...")

    # Mock mode: no API keys configured — return a schema-valid sample roadmap.
    if not os.environ.get("GEMINI_API_KEY") or not os.environ.get("SERPER_API_KEY"):
        print("[WARNING] GEMINI_API_KEY or SERPER_API_KEY missing. Returning mock roadmap.")
        return mock_structured_roadmap(request)

    strategy = build_search_strategy(
        goal=request.goal,
        skill_input=request.level,
        interest=request.topic,
        hours_per_week=request.weekly,
        learning_style=request.focus,
    )
    print(f"Track: {strategy.track}, Level: {strategy.skill_level}")

    print("Searching for resources...")
    raw_results = await search_all(strategy.queries, strategy.project_queries)

    print("Scraping content...")
    scraped_resources = await scrape_all(raw_results["resources"])
    scraped_projects = await scrape_all(raw_results["projects"])

    print("Validating URLs...")
    validated_resources = await validate_all(scraped_resources)
    validated_projects = await validate_all(scraped_projects)

    print("Ranking results...")
    top_resources = filter_results(validated_resources, top_n=8)
    top_projects = filter_results(validated_projects, top_n=4)

    resource_context = format_for_prompt(top_resources, top_projects)
    print(f"Final context: {len(top_resources)} resources, {len(top_projects)} projects")

    print("Synthesizing roadmap (nodes/edges schema)...")
    return synthesize_roadmap(resource_context, request, generate_gemini_text)


# ---------------------------------------------------------------------------
# Authentication (GitHub OAuth + JWT sessions)
# ---------------------------------------------------------------------------

# CSRF state tokens, mapped to creation time. In-memory is fine for dev; a
# multi-process or production deploy would use Redis or signed cookies instead.
_oauth_states: dict[str, float] = {}
_STATE_TTL_SECONDS = 600  # 10 minutes


def _remember_state(state: str) -> None:
    now = time.time()
    # Opportunistically drop expired states so the dict doesn't grow unbounded.
    for key, created in list(_oauth_states.items()):
        if now - created > _STATE_TTL_SECONDS:
            del _oauth_states[key]
    _oauth_states[state] = now


def _consume_state(state: str) -> bool:
    """Return True if `state` is known and unexpired, removing it either way."""
    created = _oauth_states.pop(state, None)
    return created is not None and (time.time() - created) <= _STATE_TTL_SECONDS


@app.get("/auth/github")
async def auth_github():
    """Return the GitHub authorize URL for the frontend to redirect to."""
    state = secrets.token_urlsafe(32)
    _remember_state(state)
    return {"url": github_authorize_url(state)}


@app.get("/auth/github/callback")
async def auth_github_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Complete the OAuth flow: upsert the user, issue a JWT, redirect to frontend."""
    if not _consume_state(state):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state.")

    access_token = await exchange_code_for_token(code)
    profile = await fetch_github_user(access_token)

    github_id = str(profile["id"])
    result = await db.execute(select(User).where(User.github_id == github_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            github_id=github_id,
            github_username=profile.get("login", ""),
            email=profile.get("email"),
            avatar_url=profile.get("avatar_url"),
        )
        db.add(user)
    else:
        # Keep the profile fresh on each login.
        user.github_username = profile.get("login", user.github_username)
        user.email = profile.get("email", user.email)
        user.avatar_url = profile.get("avatar_url", user.avatar_url)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={token}")


@app.get("/auth/me", response_model=UserResponse)
async def auth_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


# ---------------------------------------------------------------------------
# Roadmaps
#
# User-scoped persistence for generated roadmaps. Every endpoint requires
# authentication and enforces ownership — a user can only touch their own rows.
# ---------------------------------------------------------------------------


async def _get_owned_roadmap(
    roadmap_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
) -> Roadmap:
    """Fetch a roadmap, enforcing existence (404) and ownership (403)."""
    roadmap = await db.get(Roadmap, roadmap_id)
    if roadmap is None:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    if roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this roadmap"
        )
    return roadmap


@app.post("/roadmaps", response_model=RoadmapResponse, status_code=201)
async def create_roadmap(
    roadmap: RoadmapCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_roadmap = Roadmap(**roadmap.model_dump(), user_id=current_user.id)
    db.add(db_roadmap)
    await db.commit()
    await db.refresh(db_roadmap)
    return db_roadmap


@app.get("/roadmaps", response_model=List[RoadmapListItem])
async def list_roadmaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.updated_at.desc())
    )
    return [
        RoadmapListItem(
            id=rm.id,
            title=rm.title,
            topic=rm.topic,
            level=rm.level,
            created_at=rm.created_at,
            updated_at=rm.updated_at,
            progress_percentage=compute_progress_percentage(rm.data),
        )
        for rm in result.scalars().all()
    ]


@app.get("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(
    roadmap_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_owned_roadmap(roadmap_id, db, current_user)


@app.patch("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
async def update_roadmap(
    roadmap_id: uuid.UUID,
    updates: RoadmapUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roadmap = await _get_owned_roadmap(roadmap_id, db, current_user)
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(roadmap, field, value)
    await db.commit()
    await db.refresh(roadmap)
    return roadmap


@app.delete("/roadmaps/{roadmap_id}", status_code=204)
async def delete_roadmap(
    roadmap_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roadmap = await _get_owned_roadmap(roadmap_id, db, current_user)
    await db.delete(roadmap)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
