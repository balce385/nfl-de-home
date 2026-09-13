"""
Generischer Loader fuer nflverse-data Release-Assets.

Quellen (alle MIT-Lizenz, GitHub Releases, oeffentlich):
  - rosters/roster_{season}.csv          (Team-Kader pro Saison)
  - depth_charts/depth_charts_{season}.csv (Tagesstaende der Depth Charts)
  - snap_counts/snap_counts_{season}.csv.gz (Game-Level Snap-Counts ab 2012)
  - injuries/injuries_{season}.csv       (Wochen-Verletztenreport ab 2009)
  - combine/combine.csv                  (Combine-Messwerte ab 2000)
  - draft_picks/draft_picks.csv          (Draft ab 1980 mit Karriere-Auszeichnungen)
  - contracts/historical_contracts.parquet (Vertraege von OverTheCap)

Voraussetzung: scrapers/sleeper_players.py wurde gelaufen, damit player_id
(=GSIS-ID) FK-konform ist. nflverse-Tabellen verwenden 'gsis_id' als
Primary-Player-Key, was unserem players.id entspricht.
"""
import csv
import gzip
import io
import re
from typing import Iterable
from datetime import datetime
import httpx
from .common import upsert, client_headers, supabase_admin, normalize_abbr

BASE = "https://github.com/nflverse/nflverse-data/releases/download"


def _fetch_csv(release: str, name: str, gzipped: bool = False) -> str:
    """Laedt eine nflverse-Datei; faellt bei 404 auf die Vorsaison zurueck.

    Die Dateien einer Saison erscheinen erst nach dem ersten Spieltag. Steht im
    Namen ein Jahr, wird deshalb einmal mit dem Vorjahr nachgefragt, statt den
    ganzen Lauf scheitern zu lassen.
    """
    suffix = ".csv.gz" if gzipped else ".csv"
    names = [name]
    year = re.search(r"(19|20)\d{2}", name)
    if year:
        names.append(name.replace(year.group(0), str(int(year.group(0)) - 1)))

    with httpx.Client(timeout=120, headers=client_headers(),
                      follow_redirects=True) as c:
        for i, candidate in enumerate(names):
            url = f"{BASE}/{release}/{candidate}{suffix}"
            print(f"  nflverse: lade {url} ...")
            r = c.get(url)
            if r.status_code == 404 and i < len(names) - 1:
                print("  ↳ noch nicht veroeffentlicht, versuche Vorsaison")
                continue
            r.raise_for_status()
            if gzipped:
                return gzip.decompress(r.content).decode("utf-8", errors="replace")
            return r.text
    raise RuntimeError("unerreichbar")  # pragma: no cover


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
        gsis = (r.get("gsis_id") or r.get("player_id") or "").strip()
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
# 2. DEPTH CHARTS (aktueller Stand pro Team)
# ============================================================
def parse_depth_charts(txt: str, season: int, valid_p: set[str], valid_t: set[str]) -> list[dict]:
    """Juengster Depth-Chart-Stand je Team.

    Seit 2025 liefert nflverse keine Wochen-Charts mehr, sondern taegliche
    Staende: `dt` statt `week`, `pos_abb`/`pos_rank` statt `position`/
    `depth_team`. Das alte Mapping liess deshalb jede Zeile durchfallen.
    Gespeichert wird nur der neueste Stand je Team, als week = 0.

    `pos_rank` ist nicht die Tiefe: er zaehlt ueber alle Slots einer Position.
    Bei drei WR-Slots sind Rang 1-3 die Starter und 4-6 die ersten Backups.
    Die Tiefe ergibt sich erst aus der Reihenfolge innerhalb eines Slots.
    """
    latest: dict[str, str] = {}
    for r in csv.DictReader(io.StringIO(txt)):
        team = normalize_abbr(r.get("team"))
        if team and r.get("dt", "") > latest.get(team, ""):
            latest[team] = r["dt"]

    slots: dict[tuple, list[tuple[int, str, str]]] = {}
    for r in csv.DictReader(io.StringIO(txt)):
        team = normalize_abbr(r.get("team"))
        rank = _to_int(r.get("pos_rank"))
        if r.get("dt") != latest.get(team) or rank is None or not r.get("pos_abb"):
            continue
        key = (team, r.get("pos_grp") or None, _to_int(r.get("pos_slot")), r["pos_abb"][:8])
        slots.setdefault(key, []).append((rank, (r.get("gsis_id") or "").strip(), r["dt"]))

    rows = []
    for (team, formation, slot, position), entries in slots.items():
        # Tiefe vor dem Filtern vergeben: fehlt ein Starter in players, rueckt
        # sein Backup nicht faelschlich auf Platz 1.
        for depth, (_, gsis, dt) in enumerate(sorted(entries), start=1):
            if team not in valid_t or gsis not in valid_p:
                continue
            rows.append({
                "season": season,
                "week": 0,
                "team_id": team,
                "player_id": gsis,
                "position": position,
                "slot": slot,
                "formation": formation,
                "depth_position": depth,
                "as_of": dt,
            })
    return rows


def run_depth_charts(season: int = None):
    season = season or datetime.now().year
    print(f"=== nflverse Depth Charts {season} ===")
    txt = _fetch_csv("depth_charts", f"depth_charts_{season}", gzipped=False)
    rows = parse_depth_charts(txt, season, _known_player_ids(), _known_team_ids())
    # Null Zeilen ist ein Fehler, kein Erfolg: genau so blieb das
    # Formatwechsel-Problem monatelang unbemerkt.
    if not rows:
        raise RuntimeError("keine verwertbare Depth-Chart-Zeile, Format pruefen")
    print(f"  -> {len(rows)} Eintraege, Stand {max(r['as_of'] for r in rows)}")
    # Nur der aktuelle Stand zaehlt; ein inzwischen verdraengter Starter
    # wuerde sonst neben dem neuen stehen bleiben.
    # ponytail: kurzes Fenster ohne Daten zwischen delete und upsert, bei Bedarf als SQL-Funktion in einer Transaktion
    supabase_admin().table("depth_charts").delete().eq("season", season).execute()
    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("depth_charts", rows[i:i + BATCH],
               on_conflict="season,week,team_id,position,depth_position,player_id")
    print(f"  [OK] {len(rows)} depth_charts gespeichert")


# ============================================================
# 2b. COMBINE, DRAFT, VERTRAEGE (Spielerkarte im Dashboard)
# ============================================================
def _text(v) -> str | None:
    v = (v or "").strip()
    return None if v in ("", "NA") else v


def _money(v, digits: int = 2) -> float | None:
    # Parquet kennt NaN; das ist kein gueltiges JSON und bricht den Upsert.
    return None if v is None or v != v else round(float(v), digits)


def run_combine():
    print("=== nflverse Combine ===")
    txt = _fetch_csv("combine", "combine")
    rows = []
    for r in csv.DictReader(io.StringIO(txt)):
        pfr = _text(r.get("pfr_id"))
        season = _to_int(r.get("season"))
        # Ohne PFR-ID laesst sich der Messwert keinem Spieler zuordnen.
        if not pfr or season is None:
            continue
        rows.append({
            "pfr_id": pfr,
            "player_name": _text(r.get("player_name")) or "Unknown",
            "season": season,
            "position": _text(r.get("pos")),
            "school": _text(r.get("school")),
            "height": _text(r.get("ht")),
            "weight": _to_int(r.get("wt")),
            "forty": _to_float(r.get("forty")),
            "bench": _to_int(r.get("bench")),
            "vertical": _to_float(r.get("vertical")),
            "broad_jump": _to_int(r.get("broad_jump")),
            "cone": _to_float(r.get("cone")),
            "shuttle": _to_float(r.get("shuttle")),
        })
    for i in range(0, len(rows), 500):
        upsert("player_combine", rows[i:i + 500], on_conflict="pfr_id")
    print(f"  [OK] {len(rows)} Combine-Ergebnisse")


def run_draft_picks():
    print("=== nflverse Draft Picks ===")
    txt = _fetch_csv("draft_picks", "draft_picks")
    rows = []
    for r in csv.DictReader(io.StringIO(txt)):
        season, pick = _to_int(r.get("season")), _to_int(r.get("pick"))
        if season is None or pick is None:
            continue
        rows.append({
            "season": season,
            "pick": pick,
            "round": _to_int(r.get("round")),
            "team": _text(r.get("team")),
            "gsis_id": _text(r.get("gsis_id")),
            "pfr_id": _text(r.get("pfr_player_id")),
            "player_name": _text(r.get("pfr_player_name")) or "Unknown",
            "position": _text(r.get("position")),
            "college": _text(r.get("college")),
            "age": _to_int(r.get("age")),
            "hof": r.get("hof") == "TRUE",
            "allpro": _to_int(r.get("allpro")),
            "probowls": _to_int(r.get("probowls")),
            "seasons_started": _to_int(r.get("seasons_started")),
            "games": _to_int(r.get("games")),
            "career_av": _to_int(r.get("w_av")),
        })
    for i in range(0, len(rows), 500):
        upsert("player_draft", rows[i:i + 500], on_conflict="season,pick")
    print(f"  [OK] {len(rows)} Draft-Picks")


def run_contracts():
    """Laufende Vertraege von OverTheCap, Betraege in Mio. US-Dollar.

    Die CSV-Fassung des Releases ist seit 2022 eingefroren, aktuell ist nur
    die Parquet-Datei. Gelesen werden nur die flachen Spalten; die
    verschachtelte Gehaltshistorie bleibt aussen vor.
    """
    import pyarrow.parquet as pq

    print("=== nflverse Contracts (OverTheCap) ===")
    with httpx.Client(timeout=180, headers=client_headers(), follow_redirects=True) as c:
        r = c.get(f"{BASE}/contracts/historical_contracts.parquet")
        r.raise_for_status()
    cols = ["player", "position", "team", "is_active", "year_signed", "years",
            "value", "apy", "guaranteed", "apy_cap_pct", "otc_id", "gsis_id"]
    rows = []
    for x in pq.read_table(io.BytesIO(r.content), columns=cols).to_pylist():
        gsis = _text(x["gsis_id"])
        if not x["is_active"] or not gsis:
            continue
        rows.append({
            "gsis_id": gsis,
            "player_name": x["player"] or "Unknown",
            "position": x["position"],
            "team": x["team"],
            "year_signed": x["year_signed"],
            "years": x["years"],
            "value_musd": _money(x["value"]),
            "apy_musd": _money(x["apy"]),
            "guaranteed_musd": _money(x["guaranteed"]),
            "apy_cap_pct": _money(x["apy_cap_pct"], 3),
            "otc_id": x["otc_id"],
        })
    if not rows:
        raise RuntimeError("keine aktiven Vertraege gefunden, Format pruefen")
    # Ausgelaufene Vertraege sollen verschwinden statt als laufend stehen zu bleiben.
    # ponytail: kurzes Fenster ohne Daten zwischen delete und upsert, wie bei den Depth Charts
    supabase_admin().table("player_contracts").delete().neq("gsis_id", "").execute()
    for i in range(0, len(rows), 500):
        upsert("player_contracts", rows[i:i + 500], on_conflict="gsis_id")
    print(f"  [OK] {len(rows)} aktive Vertraege")


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
