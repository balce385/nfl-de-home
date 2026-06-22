"""
NFL-Standings über ESPNs öffentliche JSON-API.
Endpoint: https://site.api.espn.com/apis/v2/sports/football/nfl/standings

Liefert pro Team: Bilanz (W-L-T), Win-Percentage, Division — Grundlage
für Power-Rankings / "Top Teams" auf der Startseite.
"""
from .common import fetch_json, upsert, current_season

STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/football/nfl/standings"


def fetch_standings(season: int) -> list[dict]:
    data = fetch_json(STANDINGS_URL, params={"season": season})
    rows: list[dict] = []
    for conference in data.get("children", []):
        conf_name = conference.get("abbreviation") or conference.get("name")
        for entry in conference.get("standings", {}).get("entries", []):
            team = entry.get("team", {})
            stats = {s.get("name"): s for s in entry.get("stats", [])}

            def val(name: str, key: str = "value"):
                return stats.get(name, {}).get(key)

            rows.append({
                "team_id": team.get("abbreviation"),
                "team_name": team.get("displayName"),
                "conference": conf_name,
                "season": season,
                "wins": int(val("wins") or 0),
                "losses": int(val("losses") or 0),
                "ties": int(val("ties") or 0),
                "win_percent": float(val("winPercent") or 0.0),
                "record": val("overall", "displayValue"),
            })
    return rows


def run(season: int | None = None):
    season = season or current_season()
    print(f"ESPN standings season {season} …")
    rows = fetch_standings(season)
    print(f"  found {len(rows)} teams")
    upsert("standings", rows, on_conflict="team_id,season")


if __name__ == "__main__":
    import sys
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
