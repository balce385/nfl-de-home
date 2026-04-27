"""
nflverse Play-by-Play → aggregierte Advanced Stats pro Spieler-Woche.
Quelle: https://github.com/nflverse/nflverse-data/releases/tag/pbp
Lizenz: MIT (open data, kommerzielle Nutzung erlaubt mit Attribution)

Liefert pro (player_id, season, week):
  - epa            (Sum Expected Points Added)
  - cpoe           (Mean Completion % Over Expected, nur für QBs)
  - targets, receptions, passing_yards, passing_tds,
    rushing_yards, rushing_tds, receiving_yards, receiving_tds

Voraussetzung: scrapers/sleeper_players.py wurde vorher gelaufen, damit
die player_id-FKs in players existieren (player_id = nflverse gsis_id).
"""
import csv
import gzip
import io
from collections import defaultdict
from typing import Iterable
import httpx
from .common import upsert, USER_AGENT, supabase_admin

PBP_URL_TPL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.csv.gz"


def _to_float(v) -> float:
    try:
        if v in (None, "", "NA"): return 0.0
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _to_int(v) -> int:
    try:
        if v in (None, "", "NA"): return 0
        return int(float(v))
    except (TypeError, ValueError):
        return 0


def fetch_pbp_csv(season: int) -> str:
    url = PBP_URL_TPL.format(season=season)
    print(f"nflverse PBP {season}: lade {url} …")
    with httpx.Client(timeout=180, headers={"User-Agent": USER_AGENT},
                      follow_redirects=True) as c:
        r = c.get(url)
        r.raise_for_status()
        raw = gzip.decompress(r.content).decode("utf-8", errors="replace")
        size_mb = len(raw) / 1024 / 1024
        print(f"  ↳ entpackt: {size_mb:.1f} MB")
        return raw


def aggregate(csv_text: str, season: int, valid_player_ids: set[str] | None = None) -> list[dict]:
    """Aggregiere per (player_id, season, week)."""
    reader = csv.DictReader(io.StringIO(csv_text))
    bucket: dict[tuple, dict] = defaultdict(lambda: {
        "epa_sum": 0.0, "cpoe_sum": 0.0, "cpoe_n": 0,
        "targets": 0, "receptions": 0,
        "passing_yards": 0, "passing_tds": 0,
        "rushing_yards": 0, "rushing_tds": 0,
        "receiving_yards": 0, "receiving_tds": 0,
    })

    n_plays = 0
    for row in reader:
        n_plays += 1
        week = _to_int(row.get("week"))
        if not (1 <= week <= 22):
            continue
        epa = _to_float(row.get("epa"))

        # Passer
        passer = row.get("passer_player_id")
        if passer and (not valid_player_ids or passer in valid_player_ids):
            b = bucket[(passer, season, week)]
            b["epa_sum"] += epa
            cpoe = row.get("cpoe")
            if cpoe and cpoe != "NA":
                b["cpoe_sum"] += _to_float(cpoe)
                b["cpoe_n"] += 1
            b["passing_yards"] += _to_int(row.get("passing_yards"))
            if row.get("pass_touchdown") == "1":
                b["passing_tds"] += 1

        # Receiver
        receiver = row.get("receiver_player_id")
        if receiver and (not valid_player_ids or receiver in valid_player_ids):
            b = bucket[(receiver, season, week)]
            b["targets"] += 1
            if row.get("complete_pass") == "1":
                b["receptions"] += 1
                b["receiving_yards"] += _to_int(row.get("receiving_yards"))
            if row.get("pass_touchdown") == "1" and row.get("td_player_id") == receiver:
                b["receiving_tds"] += 1

        # Rusher
        rusher = row.get("rusher_player_id")
        if rusher and (not valid_player_ids or rusher in valid_player_ids):
            b = bucket[(rusher, season, week)]
            b["rushing_yards"] += _to_int(row.get("rushing_yards"))
            if row.get("rush_touchdown") == "1":
                b["rushing_tds"] += 1

    print(f"  ↳ {n_plays} Plays gelesen, {len(bucket)} Player-Week-Kombinationen")

    rows = []
    for (pid, ssn, wk), s in bucket.items():
        rows.append({
            "player_id": pid,
            "season": ssn,
            "week": wk,
            "epa": round(s["epa_sum"], 4),
            "cpoe": round(s["cpoe_sum"] / s["cpoe_n"], 3) if s["cpoe_n"] else None,
            "targets": s["targets"],
            "receptions": s["receptions"],
            "passing_yards": s["passing_yards"],
            "passing_tds": s["passing_tds"],
            "rushing_yards": s["rushing_yards"],
            "rushing_tds": s["rushing_tds"],
            "receiving_yards": s["receiving_yards"],
            "receiving_tds": s["receiving_tds"],
        })
    return rows


def _load_known_player_ids() -> set[str]:
    """Lade alle players.id (= GSIS), damit FK-Verstöße bei Insert vermieden werden."""
    sb = supabase_admin()
    ids: set[str] = set()
    page = 0
    SIZE = 1000
    while True:
        res = sb.table("players").select("id").range(page * SIZE, (page + 1) * SIZE - 1).execute()
        chunk = res.data or []
        ids.update(r["id"] for r in chunk)
        if len(chunk) < SIZE:
            break
        page += 1
    return ids


def run(season: int = 2025):
    print(f"=== nflverse PBP Run (season={season}) ===")
    valid = _load_known_player_ids()
    print(f"  bekannte players in DB: {len(valid)}")
    if not valid:
        print("  ⚠ keine players in DB — bitte erst sleeper_players.run() ausführen")
        return

    txt = fetch_pbp_csv(season)
    rows = aggregate(txt, season, valid_player_ids=valid)
    print(f"  → {len(rows)} player-week rows zum Upsert")

    BATCH = 500
    for i in range(0, len(rows), BATCH):
        upsert("player_stats", rows[i:i + BATCH], on_conflict="player_id,season,week")
    print(f"  ✓ {len(rows)} player_stats in DB")


if __name__ == "__main__":
    run()
