# NFL-DE-Fan Hub — Backend

FastAPI Backend mit 6 Endpoints, Supabase-Integration, JWT-Auth, Rate-Limiting.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -e .[dev]

cp .env.example .env
# .env mit Supabase-Werten füllen

uvicorn src.main:app --reload
```

API-Docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | - |
| POST | `/api/v1/auth/register` | - |
| POST | `/api/v1/auth/login` | - |
| GET | `/api/v1/users/me` | JWT |
| GET | `/api/v1/chat/messages?channel_id=…` | JWT |
| POST | `/api/v1/chat/messages` | JWT |
| GET | `/api/v1/data` | JWT |

## Deployment

```bash
docker build -t nfl-de-api .
docker run -p 8000:8000 --env-file .env nfl-de-api
```

Railway/Render erkennen das `Dockerfile` automatisch.
