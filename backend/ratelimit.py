"""Postgres-backed fixed-window rate limiting for /generate.

Counters live in the `rate_limit_counters` table so they survive Azure Container
Apps scale-to-zero cold starts (in-memory counters would reset to zero on every
cold start and be useless). Windows are fixed and UTC-aligned: one row per
(scope, subject_key, period, window_start).

Limits (authenticated users only — identity is always the user id):
  - per user:   5 / hour  AND  15 / day
  - global:     120 / day  (hard ceiling protecting Gemini ~500 RPD + Serper)
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from models import RateLimitCounter

USER_PER_HOUR = 5
USER_PER_DAY = 15
GLOBAL_PER_DAY = 120

_DB_UNAVAILABLE = HTTPException(
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    detail="Rate limiter unavailable. Please try again shortly.",
)


def _hour_start(now: datetime) -> datetime:
    return now.replace(minute=0, second=0, microsecond=0)


def _day_start(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


async def _get_count(
    db: AsyncSession, scope: str, subject_key: str, period: str, window_start: datetime
) -> int:
    result = await db.execute(
        select(RateLimitCounter.count).where(
            RateLimitCounter.scope == scope,
            RateLimitCounter.subject_key == subject_key,
            RateLimitCounter.period == period,
            RateLimitCounter.window_start == window_start,
        )
    )
    return result.scalar_one_or_none() or 0


async def _increment(
    db: AsyncSession, scope: str, subject_key: str, period: str, window_start: datetime
) -> None:
    stmt = pg_insert(RateLimitCounter).values(
        scope=scope,
        subject_key=subject_key,
        period=period,
        window_start=window_start,
        count=1,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["scope", "subject_key", "period", "window_start"],
        set_={"count": RateLimitCounter.count + 1},
    )
    await db.execute(stmt)


def _raise_429(
    scope_label: str, limit: int, message: str, window_start: datetime, window: timedelta
) -> None:
    retry_at = window_start + window
    retry_after = max(1, int((retry_at - datetime.now(timezone.utc)).total_seconds()))
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "rate_limited",
            "scope": scope_label,
            "limit": limit,
            "message": message,
            "retry_after_seconds": retry_after,
            "retry_at": retry_at.isoformat(),
        },
        headers={"Retry-After": str(retry_after)},
    )


async def enforce_generate_limit(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Raise 429 if any limit is exceeded; otherwise increment all counters.

    Checks (precedence global -> user/day -> user/hour); rejected requests are
    not counted. Fails closed (503) on DB errors so quota protection is never
    silently bypassed.
    """
    now = datetime.now(timezone.utc)
    hour_start = _hour_start(now)
    day_start = _day_start(now)
    key = str(user_id)

    try:
        user_hour = await _get_count(db, "user", key, "hour", hour_start)
        user_day = await _get_count(db, "user", key, "day", day_start)
        global_day = await _get_count(db, "global", "global", "day", day_start)
    except Exception as exc:  # DB unreachable / query failure
        raise _DB_UNAVAILABLE from exc

    if global_day >= GLOBAL_PER_DAY:
        _raise_429(
            "global_day",
            GLOBAL_PER_DAY,
            "Pathfinder has reached its daily generation capacity. Please try again tomorrow.",
            day_start,
            timedelta(days=1),
        )
    if user_day >= USER_PER_DAY:
        _raise_429(
            "user_day",
            USER_PER_DAY,
            f"You've reached your daily limit of {USER_PER_DAY} roadmap generations. Please try again tomorrow.",
            day_start,
            timedelta(days=1),
        )
    if user_hour >= USER_PER_HOUR:
        _raise_429(
            "user_hour",
            USER_PER_HOUR,
            f"You've reached your limit of {USER_PER_HOUR} roadmap generations per hour. Please try again later.",
            hour_start,
            timedelta(hours=1),
        )

    try:
        await _increment(db, "user", key, "hour", hour_start)
        await _increment(db, "user", key, "day", day_start)
        await _increment(db, "global", "global", "day", day_start)
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise _DB_UNAVAILABLE from exc
