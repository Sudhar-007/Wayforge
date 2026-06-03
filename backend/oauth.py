"""GitHub OAuth helpers — authorize URL, code exchange, and profile fetch.

Thin wrappers over the GitHub OAuth endpoints using httpx. Config is read from
the environment (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET). The callback URL is
derived from BACKEND_URL so it matches the registered OAuth app.
"""

import os
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
CALLBACK_URL = f"{BACKEND_URL}/auth/github/callback"

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


def github_authorize_url(state: str) -> str:
    """Build the GitHub authorization URL the frontend should redirect to."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID is not configured.")
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": CALLBACK_URL,
        "scope": "read:user user:email",
        "state": state,
    }
    return f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> str:
    """Exchange an OAuth `code` for a GitHub access token."""
    if not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_SECRET is not configured.")
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": CALLBACK_URL,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="GitHub token exchange failed.")
    payload = resp.json()
    access_token = payload.get("access_token")
    if not access_token:
        # GitHub returns 200 with an "error" field on bad/expired codes.
        detail = payload.get("error_description", "No access token returned by GitHub.")
        raise HTTPException(status_code=401, detail=detail)
    return access_token


async def fetch_github_user(access_token: str) -> dict:
    """Fetch the authenticated GitHub user's profile.

    Falls back to the /user/emails endpoint when the primary profile hides the
    email (GitHub omits it when the user keeps their email private).
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }
        resp = await client.get(GITHUB_USER_URL, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch GitHub profile.")
        profile = resp.json()

        if not profile.get("email"):
            emails_resp = await client.get(f"{GITHUB_USER_URL}/emails", headers=headers)
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                primary = next(
                    (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                    None,
                )
                profile["email"] = primary

    return profile
