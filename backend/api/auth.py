"""Auth API — simple username-based login (matches existing system)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.persistence.exercise_repository import get_or_create_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str


class LoginResponse(BaseModel):
    user_id: int
    username: str


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    username = req.username.strip()

    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty.")

    user = get_or_create_user(username)

    return LoginResponse(user_id=user["id"], username=user["username"])
