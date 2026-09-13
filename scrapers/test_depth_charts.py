"""Laeuft ohne Netz: python -m pytest scrapers/test_depth_charts.py"""
from scrapers.nflverse_releases import parse_depth_charts

# Echte Struktur aus depth_charts_2026.csv (KC, 13.09.2026): pos_rank zaehlt
# ueber alle WR-Slots hinweg, Rang 4 ist der Backup in Slot 1.
CSV = """dt,team,player_name,espn_id,gsis_id,pos_grp_id,pos_grp,pos_id,pos_name,pos_abb,pos_slot,pos_rank
2026-09-12T10:00:00Z,KC,Alter Stand,1,00-0000001,1,3WR 1TE,1,Wide Receiver,WR,1,1
2026-09-13T10:00:00Z,KC,Rashee Rice,2,00-0039067,1,3WR 1TE,1,Wide Receiver,WR,1,1
2026-09-13T10:00:00Z,KC,Xavier Worthy,3,00-0039894,1,3WR 1TE,2,Wide Receiver,WR,2,2
2026-09-13T10:00:00Z,KC,Patrick Mahomes,4, 00-0033873,1,3WR 1TE,9,Quarterback,QB,9,1
2026-09-13T10:00:00Z,KC,Unbekannter QB,5,00-0099999,1,3WR 1TE,9,Quarterback,QB,9,2
2026-09-13T10:00:00Z,KC,Cyrus Allen,6,00-0040890,1,3WR 1TE,1,Wide Receiver,WR,1,4
2026-09-11T08:00:00Z,LA,Matthew Stafford,7,00-0026498,1,3WR 1TE,9,Quarterback,QB,9,1
"""

KNOWN = {"00-0000001", "00-0039067", "00-0039894", "00-0033873", "00-0040890", "00-0026498"}


def test_depth_per_slot_from_latest_snapshot():
    rows = parse_depth_charts(CSV, 2026, valid_p=KNOWN, valid_t={"KC", "LAR"})
    # Nur der juengste Stand je Team; LA wird zu LAR, die ID mit Leerzeichen
    # getrimmt, der unbekannte QB faellt raus.
    assert [(r["team_id"], r["position"], r["slot"], r["depth_position"], r["player_id"]) for r in rows] == [
        ("KC", "WR", 1, 1, "00-0039067"),
        ("KC", "WR", 1, 2, "00-0040890"),
        ("KC", "WR", 2, 1, "00-0039894"),
        ("KC", "QB", 9, 1, "00-0033873"),
        ("LAR", "QB", 9, 1, "00-0026498"),
    ]
    assert rows[0]["week"] == 0 and rows[0]["as_of"] == "2026-09-13T10:00:00Z"


def test_unknown_starter_leaves_gap_instead_of_promoting_backup():
    rows = parse_depth_charts(CSV, 2026, valid_p=KNOWN - {"00-0039067"}, valid_t={"KC"})
    slot1 = [(r["depth_position"], r["player_id"]) for r in rows if r["slot"] == 1]
    assert slot1 == [(2, "00-0040890")]
