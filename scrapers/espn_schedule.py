"""
ESPN's öffentliche JSON-API liefert den NFL-Spielplan.
Endpoint: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
"""
import httpx
from datetime import datetime
from .common import upsert, USER_AGENT


def fetch_scoreboard(week: int | None = None) -> list[dict]:
    url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    params = {"week": week} if week else {}
    with httpx.Client(timeout=20, headers={"User-Agent": USER_AGENT}) as c:
        r = c.get(url, params=params)
        r.raise_for_status()
        return r.json().get("events", [])


def to_game_row(event: dict) -> dict | None:
    comp = event.get("competitions", [{}])[0]
    teams = comp.get("competitors", [])
    if len(teams) != 2:
        return None
    home = next((t for t in teams if t.get("homeAway") == "home"), teams[0])
    away = next((t for t in teams if t.get("homeAway") == "away"), teams[1])
    return {
        "id": event["id"],
        "season": event.get("season", {}).get("year"),
        "week": event.get("week", {}).get("number"),
        "home_team_id": home.get("team", {}).get("abbreviation"),
        "away_team_id": away.get("team", {}).get("abbreviation"),
        "home_score": int(home.get("score") or 0),
        "away_score": int(away.get("score") or 0),
        "kickoff": event.get("date"),
        "status": comp.get("status", {}).get("type", {}).get("state", "scheduled"),
    }


def run(week: int | None = None):
    print(f"ESPN scoreboard week={week or 'current'} …")
    events = fetch_scoreboard(week)
    rows = [r for r in (to_game_row(e) for e in events) if r]
    print(f"  found {len(rows)} games")
    upsert("games", rows, on_conflict="id")


if __name__ == "__main__":
    import sys
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
