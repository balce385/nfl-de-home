"""
Cron-Entrypoint: alle Scraper in der richtigen Reihenfolge.

FK-Abhaengigkeiten:
  1.  teams              (TheSportsDB)
  2.  players base       (Sleeper)
  3.  players enrich     (nflverse rosters - jersey, college, headshot)
  4.  games              (ESPN schedule)
  5.  depth_charts       (nflverse - braucht players + teams)
  6.  player_stats EPA   (nflverse PBP)
  7.  player_stats snaps (nflverse snap_counts)
  8.  injuries           (nflverse - woechentliche Reports)
  9.  team_videos        (YouTube RSS pro Team-Channel)
  10. articles           (NFL.com + ESPN, Auto-Uebersetzung)
"""
import sys
from datetime import datetime
from . import espn_schedule
from . import pfr_stats
from . import nfl_news
from . import sleeper_players
from . import nflverse_pbp
from . import nflverse_releases
from . import thesportsdb_teams
from . import youtube_team_feeds
from . import nflverse_ngs


YEAR = datetime.now().year

# (Name, Funktion, kwargs, optional)
# optional=True: Ausfall wird gemeldet, laesst den Lauf aber gruen. Nur fuer
# Quellen, die dauerhaft blocken und durch eine andere Quelle abgedeckt sind.
STEPS = [
    # Die 32 NFL-Teams aendern sich praktisch nie und stehen bereits in der DB.
    # Ein voruebergehender 503 bei TheSportsDB soll den Lauf deshalb nicht rot
    # faerben — fehlende Teams faellt ohnehin sofort ueber die Fremdschluessel
    # der abhaengigen Scraper auf.
    ("TheSportsDB Teams",          thesportsdb_teams.run,              {}, True),
    ("Sleeper Players (base)",     sleeper_players.run,                {}, False),
    ("nflverse Rosters (enrich)",  nflverse_releases.run_rosters,      {"season": YEAR}, False),
    ("ESPN Schedule",              espn_schedule.run,                  {}, False),
    ("nflverse Depth Charts",      nflverse_releases.run_depth_charts, {"season": YEAR}, False),
    ("nflverse PBP (EPA/CPOE)",    nflverse_pbp.run,                   {"season": YEAR}, False),
    ("nflverse Snap Counts",       nflverse_releases.run_snap_counts,  {"season": YEAR}, False),
    ("nflverse Injuries",          nflverse_releases.run_injuries,     {"season": YEAR}, False),
    ("Next Gen Stats",             nflverse_ngs.run,                   {"season": YEAR}, False),
    ("YouTube Team-Feeds",         youtube_team_feeds.run,             {}, False),
    # Pro-Football-Reference sperrt Server-IPs per 403. Die Zahlen kommen sonst
    # aus nflverse, deshalb kein harter Fehler.
    ("PFR Stats (HTML-fallback)",  pfr_stats.run,                      {}, True),
    ("News (NFL.com+ESPN, DE)",    nfl_news.run,                       {}, False),
]


def main():
    print("=" * 60)
    print(f"  NFL-DE-Hub Scraper Run -- {datetime.now().isoformat()}")
    print("=" * 60)
    results = []
    hard_failures = []
    for name, fn, kwargs, optional in STEPS:
        print(f"\n-- {name} --")
        try:
            fn(**kwargs)
            results.append((name, "OK"))
        except Exception as e:
            print(f"  [FAIL] {name}: {type(e).__name__}: {e}")
            results.append((name, f"FAIL: {type(e).__name__}"))
            if not optional:
                hard_failures.append(name)

    print()
    print("=" * 60)
    print("  Zusammenfassung")
    print("=" * 60)
    for name, status in results:
        marker = "OK  " if status == "OK" else "FAIL"
        print(f"  [{marker}]  {name:35s} {status}")
    print()

    # Ohne diesen Exit meldet GitHub Actions den Lauf gruen, obwohl Scraper
    # ausgefallen sind — genau so blieben die Daten monatelang unbemerkt alt.
    if hard_failures:
        print(f"  {len(hard_failures)} Scraper fehlgeschlagen: {', '.join(hard_failures)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
