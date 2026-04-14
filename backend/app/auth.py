from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Cookie, Header, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def verify_google_token(credential: str) -> dict:
    """Verify a Google ID token and return the payload."""
    try:
        payload = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {exc}")

    email: str = payload.get("email", "")
    if not email.endswith(f"@{settings.allowed_domain}"):
        raise HTTPException(
            status_code=403,
            detail=f"Only @{settings.allowed_domain} accounts are allowed",
        )

    if not payload.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")

    return {
        "email": email,
        "name": payload.get("name", ""),
        "picture": payload.get("picture", ""),
    }


def create_jwt(user: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {**user, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def get_current_user(
    token: str = Cookie(None, alias="auth_token"),
    seed_token: str | None = Header(None, alias="X-Seed-Token"),
) -> dict:
    if (
        settings.allow_seed_bypass_auth
        and settings.seed_auth_token
        and seed_token == settings.seed_auth_token
    ):
        return {
            "email": "seed@local",
            "name": "Seed User",
            "picture": "",
        }

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"email": payload["email"], "name": payload["name"], "picture": payload["picture"]}
