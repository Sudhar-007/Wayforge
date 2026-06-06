"""JWT session helpers and the current-user FastAPI dependency.

Tokens are signed with HS256 using JWT_SECRET. The token subject (`sub`) is the
user's UUID. There is no password flow — OAuth2PasswordBearer is used only to
pull the bearer token out of the Authorization header (its tokenUrl is nominal).
"""

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User

JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
DEFAULT_EXPIRES_IN = timedelta(days=7)

# Minimum acceptable secret length. HS256 security rests entirely on this secret;
# a short/guessable value lets an attacker forge tokens for any user (account
# takeover). Fail fast at import so a misconfigured deploy never boots with a weak
# or missing secret instead of silently signing forgeable tokens.
MIN_JWT_SECRET_LENGTH = 32

if len(JWT_SECRET) < MIN_JWT_SECRET_LENGTH:
    raise RuntimeError(
        "JWT_SECRET must be set to a strong random value of at least "
        f"{MIN_JWT_SECRET_LENGTH} characters "
        f"(got {len(JWT_SECRET)}). Generate one with: openssl rand -hex 32"
    )

# tokenUrl is conventional; we never serve a password grant there.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/github")

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def create_access_token(user_id: uuid.UUID, expires_in: timedelta = DEFAULT_EXPIRES_IN) -> str:
    """Sign a JWT whose subject is the user's id."""
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured.")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + expires_in,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> uuid.UUID:
    """Return the user_id encoded in a valid token, or raise HTTPException(401)."""
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise _CREDENTIALS_EXC
        return uuid.UUID(sub)
    except (JWTError, ValueError) as e:
        raise _CREDENTIALS_EXC from e


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the authenticated User from the bearer token, or raise 401."""
    user_id = decode_token(token)
    user = await db.get(User, user_id)
    if user is None:
        raise _CREDENTIALS_EXC
    return user
