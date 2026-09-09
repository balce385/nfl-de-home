import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from .config import settings

bearer = HTTPBearer(auto_error=False)


def _verify(token: str) -> dict:
    """Gibt die JWT-Payload zurück oder wirft JWTError.

    Mit gesetztem SUPABASE_JWT_SECRET wird lokal (HS256) geprüft. Ohne Secret
    fragt der Server Supabase Auth direkt (/auth/v1/user) – etwas langsamer,
    braucht aber kein Secret auf dem Server.
    """
    if settings.SUPABASE_JWT_SECRET:
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    try:
        r = httpx.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={"apikey": settings.SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
            timeout=5.0,
        )
    except httpx.HTTPError as e:
        raise JWTError(str(e))
    if r.status_code != 200:
        raise JWTError("token rejected by supabase")
    return {"sub": r.json()["id"]}


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        return _verify(credentials.credentials)["sub"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")


def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str | None:
    if credentials is None:
        return None
    try:
        return _verify(credentials.credentials).get("sub")
    except (JWTError, KeyError):
        return None
