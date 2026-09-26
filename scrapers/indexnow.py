"""
IndexNow: neue URLs sofort an Bing, Yandex, Seznam und Naver melden.

Google nutzt IndexNow nicht (dort hilft nur die Search Console mit Sitemap).
Der Schluessel ist per Protokoll oeffentlich — Bing prueft ihn, indem es
KEY_LOCATION abruft (public/<KEY>.txt im Next.js-Projekt).

    python -m scrapers.indexnow https://nfl-fan-app.de/ ...   # manuell melden
"""
import sys

import httpx

from .common import client_headers

SITE = "https://nfl-fan-app.de"
KEY = "07c176a0aa9dfdf46c391dc80c421dfd"
KEY_LOCATION = f"{SITE}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"


def submit(urls: list[str]) -> None:
    """Meldet URLs; Fehler werden nur protokolliert, der Scraper-Lauf bleibt gruen."""
    urls = [u for u in dict.fromkeys(urls) if u.startswith(SITE)]
    if not urls:
        return
    try:
        r = httpx.post(
            ENDPOINT,
            json={"host": "nfl-fan-app.de", "key": KEY, "keyLocation": KEY_LOCATION,
                  "urlList": urls[:10_000]},
            headers=client_headers(),
            timeout=30,
        )
        # 200 = angenommen, 202 = angenommen, Schluessel wird noch geprueft
        print(f"  [indexnow] {len(urls)} URLs -> HTTP {r.status_code}")
    except httpx.HTTPError as e:
        print(f"  [indexnow] FAIL: {type(e).__name__}: {e}")


if __name__ == "__main__":
    submit(sys.argv[1:])
