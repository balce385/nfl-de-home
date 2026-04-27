"""
Sleeper Public API → players-Tabelle.
Quelle: https://api.sleeper.app/v1/players/nfl  (kein Key, ~10 MB JSON)
Doku:   https://docs.sleeper.com/

Wir nutzen die GSIS-ID (= nflverse player_id) als primären players.id, damit
die nflverse-Stats sauber per Foreign-Key referenzieren können.
"""
import httpx
from .common import upsert, USER_AGENT, supabase_admin

URL = "https://api.sleeper.app/v1/players/nfl"

# Sleeper-Team-Codes → unsere teams.id
TEAM_MAP = {
    "ARI":"ARI","ATL":"ATL","BAL":"BAL","BUF":"BUF","CAR":"CAR","CHI":"CHI",
    "CIN":"CIN","CLE":"CLE","DAL":"DAL","DEN":"DEN","DET":"DET","GB":"GB",
    "HOU":"HOU","IND":"IND","JAX":"JAX","KC":"KC","LV":"LV","LAC":"LAC",
    "LAR":"LAR","MIA":"MIA","MIN":"MIN","NE":"NE","NO":"NO","NYG":"NYG",
    "NYJ":"NYJ","PHI":"PHI","PIT":"PIT","SF":"SF","SEA":"SEA","TB":"TB",
    "TEN":"TEN","WAS":"WAS",
}

# Wir akzeptieren auch Teams die in unserer DB noch nicht existieren — FK-Verstöße
# fangen wir ab, indem wir team_id auf NULL setzen wenn unbekannt.
_TEAM_CACHE: set[str] | None = None


def _known_teams() -> set[str]:
    global _TEAM_CACHE
    if _TEAM_CACHE is None:
        sb = supabase_admin()
        res = sb.table("teams").select("id").execute()
        _TEAM_CACHE = {r["id"] for r in (res.data or [])}
    return _TEAM_CACHE


def run():
    print(f"Sleeper Players: lade {URL} …")
    with httpx.Client(timeout=60, headers={"User-Agent": USER_AGENT}) as c:
        r = c.get(URL)
        r.raise_for_status()
        data = r.json()

    known_teams = _known_teams()
    rows: list[dict] = []
    skipped_no_gsis = 0
    skipped_inactive = 0

    for sleeper_id, p in data.items():
        if not isinstance(p, dict):
            continue
        gsis = p.get("gsis_id")
        if not gsis:
            skipped_no_gsis += 1
            continue
        if p.get("status") and p["status"] not in ("Active", "Inactive", "Injured Reserve",
                                                    "Physically Unable to Perform", "Suspended"):
            skipped_inactive += 1
            continue
        team = p.get("team")
        team_id = TEAM_MAP.get(team) if team else None
        if team_id and team_id not in known_teams:
            team_id = None  # FK-Verstoß vermeiden

        h_in = p.get("height")
        try:
            height_cm = round(int(h_in) * 2.54) if h_in else None
        except (TypeError, ValueError):
            height_cm = None

        w_lb = p.get("weight")
        try:
            weight_kg = round(int(w_lb) * 0.453592) if w_lb else None
        except (TypeError, ValueError):
            weight_kg = None

        rows.append({
            "id": gsis,
            "full_name": p.get("full_name") or f"{p.get('first_name','')} {p.get('last_name','')}".strip() or "Unknown",
            "position": (p.get("position") or "UNK")[:8],
            "team_id": team_id,
            "jersey_number": p.get("number"),
            "height_cm": height_cm,
            "weight_kg": weight_kg,
            "birth_date": p.get("birth_date") or None,
            "photo_url": f"https://sleepercdn.com/content/nfl/players/{sleeper_id}.jpg",
            "sleeper_id": sleeper_id,
            "gsis_id": gsis,
            "status": p.get("status") or "Active",
            "injury_status": p.get("injury_status"),
            "injury_body_part": p.get("injury_body_part"),
        })

    print(f"  Sleeper geliefert: {len(data)} | mit GSIS: {len(rows)} | skipped no-gsis: {skipped_no_gsis}")
    # Chunk-Upsert (Supabase REST hat Body-Limits)
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("players", rows[i:i + BATCH], on_conflict="id")
    print(f"  ✓ {len(rows)} players in DB")


if __name__ == "__main__":
    run()
