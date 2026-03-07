"""
Authentication router — register, login, profile.

JWT-based auth backed by DynamoDB (pillmate_users table).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

from pydantic import BaseModel

from config import settings
from db.dynamodb import get_users_table
from models import LoginRequest, RegisterRequest, TokenResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login/form")


# ── JWT helpers ────────────────────────────────────────────────────────────────

def _create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependency — current user ──────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    payload = _decode_token(token)
    user_id: str = payload.get("sub", "")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    table = get_users_table()
    resp = table.get_item(Key={"user_id": user_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return UserPublic(
        user_id=item["user_id"],
        email=item["email"],
        display_name=item["display_name"],
        photo_url=item.get("photo_url"),
        created_at=item["created_at"],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """Register a new user with email + password."""
    table = get_users_table()

    # Check if email already exists (GSI query)
    resp = table.query(
        IndexName="email-index",
        KeyConditionExpression=Key("email").eq(body.email),
    )
    if resp.get("Items"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    hashed_pw = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

    item = {
        "user_id": user_id,
        "email": body.email,
        "display_name": body.display_name,
        "password_hash": hashed_pw,
        "photo_url": None,
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)

    token = _create_access_token(user_id, body.email)
    user_public = UserPublic(
        user_id=user_id,
        email=body.email,
        display_name=body.display_name,
        created_at=now,
    )
    return TokenResponse(access_token=token, user=user_public)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Login with email + password, returns JWT."""
    table = get_users_table()

    resp = table.query(
        IndexName="email-index",
        KeyConditionExpression=Key("email").eq(body.email),
    )
    items = resp.get("Items", [])
    if not items:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    item = items[0]
    if not bcrypt.checkpw(body.password.encode(), item["password_hash"].encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = _create_access_token(item["user_id"], item["email"])
    user_public = UserPublic(
        user_id=item["user_id"],
        email=item["email"],
        display_name=item["display_name"],
        photo_url=item.get("photo_url"),
        created_at=item["created_at"],
    )
    return TokenResponse(access_token=token, user=user_public)


@router.post("/login/form", response_model=TokenResponse, include_in_schema=False)
async def login_form(form: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password-flow endpoint (used by Swagger UI)."""
    return await login(LoginRequest(email=form.username, password=form.password))


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: UserPublic = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    photo_url: str | None = None


@router.put("/me", response_model=UserPublic)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: UserPublic = Depends(get_current_user),
):
    """Update display name or photo URL."""
    display_name = body.display_name
    photo_url = body.photo_url
    table = get_users_table()
    now = datetime.now(timezone.utc).isoformat()

    update_expr_parts = ["#updated_at = :updated_at"]
    expr_names = {"#updated_at": "updated_at"}
    expr_values = {":updated_at": now}

    if display_name is not None:
        update_expr_parts.append("#dn = :dn")
        expr_names["#dn"] = "display_name"
        expr_values[":dn"] = display_name

    if photo_url is not None:
        update_expr_parts.append("#pu = :pu")
        expr_names["#pu"] = "photo_url"
        expr_values[":pu"] = photo_url

    table.update_item(
        Key={"user_id": current_user.user_id},
        UpdateExpression="SET " + ", ".join(update_expr_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )

    return UserPublic(
        user_id=current_user.user_id,
        email=current_user.email,
        display_name=display_name if display_name is not None else current_user.display_name,
        photo_url=photo_url if photo_url is not None else current_user.photo_url,
        created_at=current_user.created_at,
    )
