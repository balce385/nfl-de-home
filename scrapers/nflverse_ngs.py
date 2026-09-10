"""
Next Gen Stats der NFL ueber nflverse.

Quelle: https://github.com/nflverse/nflverse-data/releases/tag/nextgen_stats
Lizenz: MIT (offene Daten, Attribution)

Die NFL erfasst diese Werte per Chip-Tracking in Schulterpolstern und Ball.
Sie beantworten Fragen, die ein klassisches Boxscore nicht beantworten kann:
wie schnell ein Quarterback den Ball loswird, wie frei ein Receiver im Moment
des Wurfs steht, wie voll die Box beim Lauf war.

Drei Dateien, jeweils eine Zeile je Spieler/Saison/Woche:
  ngs_passing    Time to Throw, CPOE, Aggressiveness, Passer Rating
  ngs_receiving  Separation, Cushion, YAC ueber Erwartung
  ngs_rushing    Zeit hinter der Linie, 8+ in der Box, Yards ueber Erwartung

week = 0 ist das Saison-Aggregat, das die NFL selbst so ausliefert.

Nicht enthalten, weil oeffentlich nicht verfuegbar: Pass Block Win Rate,
Pass Rush Win Rate, Pressure Rate, Burn Rate und Route Run Percentage. Diese
Werte stammen aus dem kostenpflichtigen Charting von ESPN bzw. PFF und lassen
sich aus Tracking-Daten nicht rekonstruieren.
"""
import csv
import gzip
import io
from datetime import datetime

import httpx

from .common import upsert, client_headers, supabase_admin, normalize_abbr

BASE = "https://github.com/nflverse/nflverse-data/releases/download/nextgen_stats"


def _fetch(kind: str) -> str:
    """Laedt ngs_{kind}.csv.gz — eine Datei ueber alle Saisons."""
    url = f"{BASE}/ngs_{kind}.csv.gz"
    print(f"  nflverse NGS: lade {url} ...")
    with httpx.Client(timeout=180, headers=client_headers(), follow_redirects=True) as c:
        r = c.get(url)
        r.raise_for_status()
        return gzip.decompress(r.content).decode("utf-8", errors="replace")


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
    return {r["id"] for r in (sb.table("teams").select("id").execute().data or [])}


def _num(v, cast=float):
    if v in (None, "", "NA"):
        return None
    try:
        return cast(float(v))
    except (TypeError, ValueError):
        return None


# Spalte in der CSV -> Spalte in unserer Tabelle. Alles andere wird verworfen.
FIELD_MAP: dict[str, dict[str, tuple[str, type]]] = {
    "passing": {
        "attempts": ("attempts", int),
        "completions": ("completions", int),
        "pass_yards": ("pass_yards", int),
        "pass_touchdowns": ("pass_touchdowns", int),
        "interceptions": ("interceptions", int),
        "passer_rating": ("passer_rating", float),
        "completion_percentage": ("completion_pct", float),
        "expected_completion_percentage": ("expected_completion_pct", float),
        "completion_percentage_above_expectation": ("cpoe", float),
        "avg_time_to_throw": ("avg_time_to_throw", float),
        "aggressiveness": ("aggressiveness", float),
        "avg_air_yards_to_sticks": ("avg_air_yards_to_sticks", float),
    },
    "receiving": {
        "targets": ("targets", int),
        "receptions": ("receptions", int),
        "yards": ("rec_yards", int),
        "rec_touchdowns": ("rec_touchdowns", int),
        "catch_percentage": ("catch_pct", float),
        "avg_separation": ("avg_separation", float),
        "avg_cushion": ("avg_cushion", float),
        "avg_yac": ("avg_yac", float),
        "avg_expected_yac": ("avg_expected_yac", float),
        "avg_yac_above_expectation": ("avg_yac_above_expectation", float),
    },
    "rushing": {
        "rush_attempts": ("rush_attempts", int),
        "rush_yards": ("rush_yards", int),
        "rush_touchdowns": ("rush_touchdowns", int),
        "efficiency": ("rush_efficiency", float),
        "percent_attempts_gte_eight_defenders": ("pct_attempts_8plus_box", float),
        "avg_time_to_los": ("avg_time_to_los", float),
        "rush_yards_over_expected_per_att": ("rush_yards_over_expected_per_att", float),
    },
}


def run(season: int | None = None, seasons_back: int = 1):
    """Laedt die Next Gen Stats der letzten `seasons_back` Saisons.

    Vor dem ersten Spieltag existiert fuer die laufende Saison noch nichts —
    deshalb standardmaessig auch die Vorsaison, damit die Seite nie leer ist.
    """
    season = season or datetime.now().year
    wanted = {season - i for i in range(seasons_back + 1)}
    print(f"=== nflverse Next Gen Stats {sorted(wanted)} ===")

    valid_players = _known_player_ids()
    valid_teams = _known_team_ids()
    if not valid_players:
        print("  [warn] keine players in DB — erst sleeper_players/nflverse_rosters laufen lassen")
        return

    # Zeilen der drei Dateien auf denselben Schluessel zusammenfuehren.
    merged: dict[tuple, dict] = {}
    skipped_unknown = 0

    for kind, mapping in FIELD_MAP.items():
        txt = _fetch(kind)
        rows = 0
        for r in csv.DictReader(io.StringIO(txt)):
            ssn = _num(r.get("season"), int)
            if ssn not in wanted:
                continue
            gsis = r.get("player_gsis_id")
            if not gsis or gsis not in valid_players:
                skipped_unknown += 1
                continue
            week = _num(r.get("week"), int)
            if week is None:
                continue

            key = (gsis, ssn, week, r.get("season_type") or "REG")
            entry = merged.setdefault(key, {
                "player_id": gsis,
                "season": ssn,
                "week": week,
                "season_type": r.get("season_type") or "REG",
            })
            pos = r.get("player_position")
            if pos:
                entry["position"] = pos[:8]
            team = normalize_abbr(r.get("team_abbr"))
            if team in valid_teams:
                entry["team_id"] = team

            for src, (dest, cast) in mapping.items():
                val = _num(r.get(src), cast)
                if val is not None:
                    entry[dest] = val
            rows += 1
        print(f"  -> {kind}: {rows} passende Zeilen")

    out = list(merged.values())
    print(f"  -> {len(out)} Spieler-Wochen gesamt ({skipped_unknown} unbekannte Spieler uebersprungen)")

    BATCH = 500
    for i in range(0, len(out), BATCH):
        upsert("player_advanced", out[i:i + BATCH],
               on_conflict="player_id,season,week,season_type")
    print(f"  [OK] {len(out)} player_advanced gespeichert")


if __name__ == "__main__":
    run()
