import os
import time
from typing import Any
import httpx
from supabase import create_client, Client
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()

USER_AGENT = os.getenv("USER_AGENT", "NFL-DE-Hub-Scraper/0.1")
DELAY = float(os.getenv("SCRAPE_DELAY_SECONDS", "2"))


def supabase_admin() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
def fetch(url: str, params: dict | None = None) -> str:
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(timeout=20, headers=headers, follow_redirects=True) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        time.sleep(DELAY)  # höflicher Crawler
        return r.text


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
