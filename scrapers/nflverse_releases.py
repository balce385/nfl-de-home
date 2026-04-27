"""
Generischer Loader fuer nflverse-data Release-Assets.

Quellen (alle MIT-Lizenz, GitHub Releases, oeffentlich):
  - rosters/roster_{season}.csv          (Team-Kader pro Saison)
  - depth_charts/depth_charts_{season}.csv (Wochen-Depth-Charts)
  - snap_counts/snap_counts_{season}.csv.gz (Game-Level Snap-Counts ab 2012)
  - injuries/injuries_{season}.csv       (Wochen-Verletztenreport ab 2009)

Voraussetzung: scrapers/sleeper_players.py wurde gelaufen, damit player_id
(=GSIS-ID) FK-konform ist. nflverse-Tabellen verwenden 'gsis_id' als
Primary-Player-Key, was unserem players.id entspricht.
"""
import csv
import gzip
import io
from typing import Iterable
from datetime import datetime
import httpx
from .common import upsert, USER_AGENT, supabase_admin

BASE = "https://github.com/nflverse/nflverse-data/releases/download"


def _fetch_csv(release: str, name: str, gzipped: bool = False) -> str:
    suffix = ".csv.gz" if gzipped else ".csv"
    url = f"{BASE}/{release}/{name}{suffix}"
    print(f"  nflverse: lade {url} ...")
    with httpx.Client(timeout=120, headers={"User-Agent": USER_AGENT},
                      follow_redirects=True) as c:
        r = c.get(url)
        r.raise_for_status()
        if gzipped:
            return gzip.decompress(r.content).decode("utf-8", errors="replace")
        return r.text


def _known_player_ids() -> set[str]:
    sb = supabase_admin()
    ids: set[str] = set()
    page = 0
    while True:
        res = sb.table("players").select("id").range(page * 1000, (page + 1) * 1000 - 1).execute()
        chunk = res.data or []
        ids.update(r["id"] for r in chunk)
        if len(chunk) < 1000:
            break
        page += 1
    return ids


def _known_team_ids() -> set[str]:
    sb = supabase_admin()
    res = sb.table("teams").select("id").execute()
    return {r["id"] for r in (res.data or [])}


def _to_int(v) -> int | None:
    try:
        if v in (None, "", "NA"): return None
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _to_float(v) -> float | None:
    try:
        if v in (None, "", "NA"): return None
        return float(v)
    except (TypeError, ValueError):
        return None


# ============================================================
# 1. ROSTERS (Saison-Kader, ergaenzt players-Tabelle)
# ============================================================
def run_rosters(season: int = None):
    season = season or datetime.now().year
    print(f"=== nflverse Rosters {season} ===")
    txt = _fetch_csv("rosters", f"roster_{season}", gzipped=False)
    teams = _known_team_ids()
    rows = []
    for r in csv.DictReader(io.StringIO(txt)):
        gsis = r.get("gsis_id") or r.get("player_id")
        if not gsis: continue
        team = r.get("team")
        team_id = team if team in teams else None
        rows.append({
            "id": gsis,
            "full_name": r.get("full_name") or f"{r.get('first_name','')} {r.get('last_name','')}".strip() or "Unknown",
            "position": (r.get("position") or "UNK")[:8],
            "team_id": team_id,
            "jersey_number": _to_int(r.get("jersey_number")),
            "height_cm": int(_to_float(r.get("height")) * 2.54) if _to_float(r.get("height")) else None,
            "weight_kg": int(_to_float(r.get("weight")) * 0.453592) if _to_float(r.get("weight")) else None,
            "birth_date": r.get("birth_date") or None,
            "headshot_url": r.get("headshot_url"),
            "college": r.get("college"),
            "years_exp": _to_int(r.get("years_exp")),
            "espn_id": r.get("espn_id") or None,
            "pfr_id": r.get("pfr_id") or None,
            "rotowire_id": r.get("rotowire_id") or None,
            "yahoo_id": r.get("yahoo_id") or None,
            "gsis_id": gsis,
            "status": r.get("status") or "Active",
        })
    print(f"  -> {len(rows)} Roster-Eintraege")
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("players", rows[i:i + BATCH], on_conflict="id")
    print(f"  [OK] {len(rows)} players upgedatet")


# ============================================================
# 2. DEPTH CHARTS (woechentliche Aufstellung pro Team)
# ============================================================
def run_depth_charts(season: int = None):
    season = season or datetime.now().year
    print(f"=== nflverse Depth Charts {season} ===")
    txt = _fetch_csv("depth_charts", f"depth_charts_{season}", gzipped=False)
    valid_p = _known_player_ids()
    valid_t = _known_team_ids()
    rows = []
    skipped = 0
    for r in csv.DictReader(io.StringIO(txt)):
        gsis = r.get("gsis_id")
        team = r.get("club_code") or r.get("team")
        week = _to_int(r.get("week"))
        depth = _to_int(r.get("depth_team"))
        position = r.get("position") or r.get("depth_position")
        if not gsis or gsis not in valid_p:
            skipped += 1; continue
        if team not in valid_t or week is None or depth is None or not position:
            skipped += 1; continue
        rows.append({
            "season": season,
            "week": week,
            "team_id": team,
            "player_id": gsis,
            "position": position[:8],
            "formation": r.get("formation"),
            "depth_position": depth,
        })
    print(f"  -> {len(rows)} Depth-Chart-Eintraege ({skipped} skipped)")
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("depth_charts", rows[i:i + BATCH],
               on_conflict="season,week,team_id,position,depth_position,player_id")
    print(f"  [OK] {len(rows)} depth_charts gespeichert")


# ============================================================
# 3. SNAP COUNTS (Spielanteile pro Game)
# ============================================================
def run_snap_counts(season: int = None):
    season = season or datetime.now().year
    print(f"=== nflverse Snap Counts {season} ===")
    txt = _fetch_csv("snap_counts", f"snap_counts_{season}", gzipped=True)
    valid_p = _known_player_ids()
    # Aggregiere pro (player, season, week)
    bucket: dict[tuple, dict] = {}
    for r in csv.DictReader(io.StringIO(txt)):
        gsis = r.get("pfr_player_id")  # snap-counts hat oft pfr_id, nicht gsis
        # Fallback: ueber player_id (= gsis) wenn vorhanden
        if not gsis or gsis not in valid_p:
            gsis = r.get("player_id") or r.get("gsis_id")
        if not gsis or gsis not in valid_p:
            continue
        week = _to_int(r.get("week"))
        if week is None: continue
        key = (gsis, season, week)
        cur = bucket.get(key, {
            "player_id": gsis, "season": season, "week": week,
            "offense_snaps": 0, "defense_snaps": 0, "st_snaps": 0,
            "offense_pct": None, "defense_pct": None,
        })
        cur["offense_snaps"] = max(cur["offense_snaps"], _to_int(r.get("offense_snaps")) or 0)
        cur["defense_snaps"] = max(cur["defense_snaps"], _to_int(r.get("defense_snaps")) or 0)
        cur["st_snaps"]      = max(cur["st_snaps"],      _to_int(r.get("st_snaps")) or 0)
        op = _to_float(r.get("offense_pct"))
        dp = _to_float(r.get("defense_pct"))
        if op is not None: cur["offense_pct"] = round(op * 100, 2) if op <= 1 else round(op, 2)
        if dp is not None: cur["defense_pct"] = round(dp * 100, 2) if dp <= 1 else round(dp, 2)
        bucket[key] = cur
    rows = list(bucket.values())
    print(f"  -> {len(rows)} Snap-Count-Eintraege")
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("player_stats", rows[i:i + BATCH], on_conflict="player_id,season,week")
    print(f"  [OK] {len(rows)} player_stats erweitert")


# ============================================================
# 4. INJURIES (woechentlicher Verletztenreport)
# ============================================================
def run_injuries(season: int = None):
    season = season or datetime.now().year
    print(f"=== nflverse Injuries {season} ===")
    txt = _fetch_csv("injuries", f"injuries_{season}", gzipped=False)
    valid_p = _known_player_ids()
    valid_t = _known_team_ids()
    rows = []
    skipped = 0
    for r in csv.DictReader(io.StringIO(txt)):
        gsis = r.get("gsis_id")
        team = r.get("team")
        week = _to_int(r.get("week"))
        if not gsis or gsis not in valid_p:
            skipped += 1; continue
        if team not in valid_t:
            team = None
        rows.append({
            "season": season,
            "week": week,
            "team_id": team,
            "player_id": gsis,
            "report_status": r.get("report_status") or None,
            "practice_status": r.get("practice_status") or None,
            "body_part": r.get("report_primary_injury") or r.get("body_part") or None,
            "date_modified": r.get("date_modified") or None,
            "source": "nflverse",
        })
    print(f"  -> {len(rows)} Injury-Eintraege ({skipped} skipped)")
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("injuries", rows[i:i + BATCH], on_conflict="season,week,player_id,source")
    print(f"  [OK] {len(rows)} injuries gespeichert")
