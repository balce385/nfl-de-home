import os
import time
from datetime import date
from typing import Any

import httpx
from supabase import create_client, Client
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()

USER_AGENT = os.getenv("USER_AGENT", "NFL-DE-Hub-Scraper/0.2 (+https://nfl-de-hub.example.com)")

# Sports-Reference erlaubt max. 20 Requests/Minute — darüber droht bis zu
# 24h "Jail" (HTTP 429). 3.5s Delay = ~17 req/min, sicher unter dem Limit.
# https://www.sports-reference.com/bot-traffic.html
DELAY = float(os.getenv("SCRAPE_DELAY_SECONDS", "3.5"))


def current_season(today: date | None = None) -> int:
    """NFL-Saisonjahr: ab März zählt das laufende Kalenderjahr als neue Saison."""
    d = today or date.today()
    return d.year if d.month >= 3 else d.year - 1


def supabase_admin() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _is_retryable(exc: BaseException) -> bool:
    # 429/5xx erneut versuchen, 4xx (außer 429) nicht — das wäre sinnlos
    # und verlängert bei Sports-Reference nur die Sperre.
    if isinstance(exc, httpx.HTTPStatusError):
        code = exc.response.status_code
        return code == 429 or code >= 500
    return isinstance(exc, (httpx.TransportError, httpx.TimeoutException))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=5, max=60),
    retry=retry_if_exception(_is_retryable),
)
def fetch(url: str, params: dict | None = None) -> str:
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.8"}
    with httpx.Client(timeout=20, headers=headers, follow_redirects=True) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        time.sleep(DELAY)  # höflicher Crawler
        return r.text


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=2, max=30),
    retry=retry_if_exception(_is_retryable),
)
def fetch_json(url: str, params: dict | None = None) -> Any:
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(timeout=20, headers=headers, follow_redirects=True) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        return r.json()


def upsert(table: str, rows: list[dict[str, Any]], on_conflict: str | None = None):
    if not rows:
        return
    sb = supabase_admin()
    q = sb.table(table)
    if on_conflict:
        q.upsert(rows, on_conflict=on_conflict).execute()
    else:
        q.upsert(rows).execute()
    print(f"  ↳ upserted {len(rows)} rows into {table}")
