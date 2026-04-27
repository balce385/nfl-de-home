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
from datetime import datetime
from . import espn_schedule
from . import pfr_stats
from . import nfl_news
from . import sleeper_players
from . import nflverse_pbp
from . import nflverse_releases
from . import thesportsdb_teams
from . import youtube_team_feeds


YEAR = datetime.now().year

STEPS = [
    ("TheSportsDB Teams",          thesportsdb_teams.run,              {}),
    ("Sleeper Players (base)",     sleeper_players.run,                {}),
    ("nflverse Rosters (enrich)",  nflverse_releases.run_rosters,      {"season": YEAR}),
    ("ESPN Schedule",              espn_schedule.run,                  {}),
    ("nflverse Depth Charts",      nflverse_releases.run_depth_charts, {"season": YEAR}),
    ("nflverse PBP (EPA/CPOE)",    nflverse_pbp.run,                   {"season": YEAR}),
    ("nflverse Snap Counts",       nflverse_releases.run_snap_counts,  {"season": YEAR}),
    ("nflverse Injuries",          nflverse_releases.run_injuries,     {"season": YEAR}),
    ("YouTube Team-Feeds",         youtube_team_feeds.run,             {}),
    ("PFR Stats (HTML-fallback)",  pfr_stats.run,                      {}),
    ("News (NFL.com+ESPN, DE)",    nfl_news.run,                       {}),
]


def main():
    print("=" * 60)
    print(f"  NFL-DE-Hub Scraper Run -- {datetime.now().isoformat()}")
    print("=" * 60)
    results = []
    for name, fn, kwargs in STEPS:
        print(f"\n-- {name} --")
        try:
            fn(**kwargs)
            results.append((name, "OK"))
        except Exception as e:
            print(f"  [FAIL] {name}: {type(e).__name__}: {e}")
            results.append((name, f"FAIL: {type(e).__name__}"))

    print()
    print("=" * 60)
    print("  Zusammenfassung")
    print("=" * 60)
    for name, status in results:
        marker = "OK  " if status == "OK" else "FAIL"
        print(f"  [{marker}]  {name:35s} {status}")
    print()


if __name__ == "__main__":
    main()
