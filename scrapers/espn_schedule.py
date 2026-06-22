"""
ESPN's öffentliche JSON-API liefert den NFL-Spielplan.
Endpoint: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard

Parameter (Stand 2026, verifiziert):
  dates=YYYY        → Saisonjahr (z.B. 2026)
  seasontype=1|2|3  → 1=Preseason, 2=Regular Season, 3=Playoffs
  week=N            → Spielwoche
Ohne Parameter liefert die API die aktuelle Woche.
"""
from .common import fetch_json, upsert

SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"


def fetch_scoreboard(
    week: int | None = None,
    season: int | None = None,
    seasontype: int = 2,
) -> list[dict]:
    params: dict = {}
    if season:
        params["dates"] = season
        params["seasontype"] = seasontype
    if week:
        params["week"] = week
    data = fetch_json(SCOREBOARD_URL, params=params or None)
    return data.get("events", [])


def to_game_row(event: dict) -> dict | None:
    comp = event.get("competitions", [{}])[0]
    teams = comp.get("competitors", [])
    if len(teams) != 2:
        return None
    home = next((t for t in teams if t.get("homeAway") == "home"), teams[0])
    away = next((t for t in teams if t.get("homeAway") == "away"), teams[1])
    status_type = comp.get("status", {}).get("type", {})
    venue = comp.get("venue", {})
    return {
        "id": event["id"],
        "season": event.get("season", {}).get("year"),
        "week": event.get("week", {}).get("number"),
        "home_team_id": home.get("team", {}).get("abbreviation"),
        "away_team_id": away.get("team", {}).get("abbreviation"),
        "home_score": int(home.get("score") or 0),
        "away_score": int(away.get("score") or 0),
        "kickoff": event.get("date"),
        # state: "pre" | "in" | "post"
        "status": status_type.get("state", "scheduled"),
        "completed": bool(status_type.get("completed", False)),
        "venue": venue.get("fullName"),
        # International Games (z.B. München 15.11.2026) haben hier
        # country != "USA" — nützlich fürs DACH-Publikum.
        "venue_country": venue.get("address", {}).get("country"),
    }


def run(week: int | None = None, season: int | None = None, seasontype: int = 2):
    print(f"ESPN scoreboard season={season or 'current'} week={week or 'current'} …")
    events = fetch_scoreboard(week, season, seasontype)
    rows = [r for r in (to_game_row(e) for e in events) if r]
    print(f"  found {len(rows)} games")
    upsert("games", rows, on_conflict="id")


if __name__ == "__main__":
    import sys

    # Aufruf: python -m scrapers.espn_schedule [week] [season]
    week = int(sys.argv[1]) if len(sys.argv) > 1 else None
    season = int(sys.argv[2]) if len(sys.argv) > 2 else None
    run(week, season)
