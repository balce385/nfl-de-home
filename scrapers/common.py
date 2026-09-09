import os
import time
from datetime import date
from typing import Any

import httpx
from supabase import create_client, Client
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()

# Kein eigener User-Agent per Default — httpx schickt dann seinen eigenen
# ("python-httpx/x.y"), und genau den akzeptiert ESPN.
#
# Gemessen am 2026-09-09 gegen site.api.espn.com/.../scoreboard:
#   python-httpx/0.28.1 -> 200      curl/8.5.0 -> 200
#   NFL-DE-Hub-Scraper/0.2 -> 403   Mozilla/5.0 (Browser-Fake) -> 403
#   node -> 403                     MeinBot/1.0 -> 403
# ESPN blockt also selbstgewaehlte Namen und gefaelschte Browser-Kennungen,
# nicht aber die ehrliche Kennung der HTTP-Bibliothek. Eine Browser-Kennung
# vorzutaeuschen macht es nachweislich schlimmer.
# Ueber die Umgebungsvariable USER_AGENT laesst sich das bei Bedarf setzen.
USER_AGENT = os.getenv("USER_AGENT", "")

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


def client_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    """Header-Satz; ohne gesetzten USER_AGENT bleibt httpx' eigene Kennung stehen."""
    h = dict(extra or {})
    if USER_AGENT:
        h["User-Agent"] = USER_AGENT
    return h


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=5, max=60),
    retry=retry_if_exception(_is_retryable),
)
def fetch(url: str, params: dict | None = None) -> str:
    headers = client_headers({"Accept-Language": "en-US,en;q=0.8"})
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
    headers = client_headers()
    with httpx.Client(timeout=20, headers=headers, follow_redirects=True) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        return r.json()


def dedupe_by(rows: list[dict[str, Any]], keys: str) -> list[dict[str, Any]]:
    """Behaelt je Konflikt-Schluessel nur den letzten Datensatz.

    Postgres bricht einen Upsert ab, sobald derselbe Schluessel zweimal in
    einer Anweisung vorkommt ("ON CONFLICT DO UPDATE command cannot affect row
    a second time"). Quellen wie Sleeper liefern solche Duplikate regelmaessig.
    """
    cols = [k.strip() for k in keys.split(",") if k.strip()]
    if not cols:
        return rows
    unique: dict[tuple, dict[str, Any]] = {}
    for row in rows:
        unique[tuple(row.get(c) for c in cols)] = row
    return list(unique.values())


def upsert(table: str, rows: list[dict[str, Any]], on_conflict: str | None = None):
    if not rows:
        return
    sb = supabase_admin()
    q = sb.table(table)
    if on_conflict:
        rows = dedupe_by(rows, on_conflict)
        q.upsert(rows, on_conflict=on_conflict).execute()
    else:
        q.upsert(rows).execute()
    print(f"  ↳ upserted {len(rows)} rows into {table}")
