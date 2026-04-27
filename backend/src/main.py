from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .db import get_supabase, get_supabase_admin
from .auth import get_current_user_id
from .schemas import (
    RegisterIn, LoginIn, TokenOut, UserOut,
    MessageIn, MessageOut, DashboardData,
)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="NFL-DE-Fan Hub API",
    version="0.1.0",
    description="Backend für NFL-DE-Fan Hub",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.ENV}


# ---------------- AUTH ----------------
@app.post("/api/v1/auth/register", response_model=TokenOut, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, body: RegisterIn):
    sb = get_supabase()
    res = sb.auth.sign_up({
        "email": body.email,
        "password": body.password,
        "options": {"data": {"full_name": body.full_name}},
    })
    if not res.user or not res.session:
        raise HTTPException(400, "Registration failed")
    return TokenOut(
        access_token=res.session.access_token,
        refresh_token=res.session.refresh_token,
        user_id=res.user.id,
    )


@app.post("/api/v1/auth/login", response_model=TokenOut)
@limiter.limit("10/minute")
def login(request: Request, body: LoginIn):
    sb = get_supabase()
    try:
        res = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception:
        raise HTTPException(401, "Invalid credentials")
    if not res.user or not res.session:
        raise HTTPException(401, "Invalid credentials")
    return TokenOut(
        access_token=res.session.access_token,
        refresh_token=res.session.refresh_token,
        user_id=res.user.id,
    )


# ---------------- USERS ----------------
@app.get("/api/v1/users/me", response_model=UserOut)
def me(user_id: str = Depends(get_current_user_id)):
    admin = get_supabase_admin()
    user_res = admin.auth.admin.get_user_by_id(user_id)
    if not user_res.user:
        raise HTTPException(404, "User not found")
    profile = admin.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    p = profile.data or {}
    return UserOut(
        id=user_id,
        email=user_res.user.email or "",
        full_name=p.get("full_name"),
        avatar_url=p.get("avatar_url"),
    )


# ---------------- CHAT ----------------
@app.get("/api/v1/chat/messages", response_model=list[MessageOut])
def list_messages(
    channel_id: str,
    limit: int = Query(50, ge=1, le=200),
    before: str | None = None,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase_admin()
    q = sb.table("messages").select("*").eq("channel_id", channel_id).order("created_at", desc=True).limit(limit)
    if before:
        q = q.lt("created_at", before)
    res = q.execute()
    return [MessageOut(**row) for row in (res.data or [])]


@app.post("/api/v1/chat/messages", response_model=MessageOut, status_code=201)
@limiter.limit("30/minute")
def create_message(
    request: Request,
    body: MessageIn,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase_admin()
    res = sb.table("messages").insert({
        "channel_id": body.channel_id,
        "user_id": user_id,
        "content": body.content,
    }).execute()
    if not res.data:
        raise HTTPException(500, "Insert failed")
    return MessageOut(**res.data[0])


# ---------------- DASHBOARD-DATA ----------------
@app.get("/api/v1/data", response_model=DashboardData)
def dashboard_data(user_id: str = Depends(get_current_user_id)):
    sb = get_supabase_admin()
    games = sb.table("games").select("*").eq("status", "scheduled").order("kickoff").limit(8).execute()
    players = sb.table("player_stats").select("*, players(*)").order("fantasy_points", desc=True).limit(10).execute()
    articles = sb.table("articles").select("*").order("published_at", desc=True).limit(6).execute()
    return DashboardData(
        upcoming_games=games.data or [],
        top_players=players.data or [],
        latest_articles=articles.data or [],
    )
