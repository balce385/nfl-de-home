"""
Scrape Player-Stats von Pro-Football-Reference.
Bsp.: https://www.pro-football-reference.com/years/2026/passing.htm

WICHTIG (Sports-Reference Bot-Policy):
- Max. 20 Requests/Minute, sonst bis zu 24h IP-Sperre (HTTP 429).
- common.DELAY ist entsprechend auf 3.5s gesetzt — nicht reduzieren.
- Viele PFR-Tabellen liegen in HTML-Kommentaren (<!-- <table…> -->);
  _soup_with_comments() macht sie für BeautifulSoup sichtbar.
- Alternative ohne Scraping-Risiko: nfl-data-py / nflverse
  (https://pypi.org/project/nfl-data-py/) liefert dieselben Daten als Parquet/CSV.
"""
import re

from bs4 import BeautifulSoup
from .common import fetch, upsert, current_season

BASE = "https://www.pro-football-reference.com"


def _soup_with_comments(html: str) -> BeautifulSoup:
    """PFR versteckt Tabellen in HTML-Kommentaren — Kommentar-Marker entfernen."""
    html = re.sub(r"<!--\s*(<table.*?</table>)\s*-->", r"\1", html, flags=re.DOTALL)
    return BeautifulSoup(html, "lxml")


def _to_int(val: str | None) -> int:
    try:
        return int(val or 0)
    except ValueError:
        return 0


def scrape_passing(season: int) -> list[dict]:
    html = fetch(f"{BASE}/years/{season}/passing.htm")
    soup = _soup_with_comments(html)
    rows = []
    for tr in soup.select("table#passing tbody tr:not(.thead)"):
        cells = {td.get("data-stat"): td.get_text(strip=True) for td in tr.find_all(["th", "td"])}
        player = cells.get("player") or cells.get("name_display")
        if not player or player == "League Average":
            continue
        rows.append({
            "player_name": player.rstrip("*+"),  # PFR markiert Pro Bowl/All-Pro mit *+
            "team": cells.get("team") or cells.get("team_name_abbr"),
            "passing_yards": _to_int(cells.get("pass_yds")),
            "passing_tds": _to_int(cells.get("pass_td")),
            "interceptions": _to_int(cells.get("pass_int")),
            "season": season,
        })
    return rows


def run(season: int | None = None):
    season = season or current_season()
    print(f"PFR scraping season {season} …")
    rows = scrape_passing(season)
    print(f"  found {len(rows)} QB rows")
    if not rows:
        print("  [WARN] 0 Zeilen — Seitenstruktur prüfen oder Saison noch nicht gestartet.")
        return
    # Mapping zu player_id müsste hier per fuzzy-match erfolgen — vereinfacht:
    # upsert("player_stats", rows, on_conflict="player_id,season,week")


if __name__ == "__main__":
    import sys
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
