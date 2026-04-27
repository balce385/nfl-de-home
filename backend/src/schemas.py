from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None


class MessageIn(BaseModel):
    channel_id: str
    content: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: str
    channel_id: str
    user_id: str | None
    content: str
    created_at: datetime


class DashboardData(BaseModel):
    upcoming_games: list[dict]
    top_players: list[dict]
    latest_articles: list[dict]
