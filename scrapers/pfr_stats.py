"""
Scrape Player-Stats von Pro-Football-Reference.
Bsp.: https://www.pro-football-reference.com/years/2025/passing.htm
"""
from bs4 import BeautifulSoup
from .common import fetch, upsert

BASE = "https://www.pro-football-reference.com"


def scrape_passing(season: int) -> list[dict]:
    html = fetch(f"{BASE}/years/{season}/passing.htm")
    soup = BeautifulSoup(html, "lxml")
    rows = []
    for tr in soup.select("table#passing tbody tr:not(.thead)"):
        cells = {td.get("data-stat"): td.get_text(strip=True) for td in tr.find_all(["th", "td"])}
        if not cells.get("player"):
            continue
        rows.append({
            "player_name": cells["player"],
            "team": cells.get("team"),
            "passing_yards": int(cells.get("pass_yds") or 0),
            "passing_tds": int(cells.get("pass_td") or 0),
            "season": season,
        })
    return rows


def run(season: int = 2025):
    print(f"PFR scraping season {season} …")
    rows = scrape_passing(season)
    print(f"  found {len(rows)} QB rows")
    # Mapping zu player_id müsste hier per fuzzy-match erfolgen — vereinfacht:
    # upsert("player_stats", rows, on_conflict="player_id,season,week")


if __name__ == "__main__":
    import sys
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)
