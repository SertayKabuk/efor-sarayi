from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel

from app.auth import create_jwt, get_current_user, verify_google_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    email: str
    name: str
    picture: str


@router.post("/google", response_model=UserResponse)
async def google_login(body: GoogleLoginRequest, response: Response):
    user = verify_google_token(body.credential)
    token = create_jwt(user)
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return user


@router.get("/me", response_model=UserResponse)
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("auth_token")
    return {"ok": True}
