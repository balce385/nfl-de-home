"""
YouTube-Team-Channel-Feeds via RSS (kein API-Key noetig).

Quelle pro Team:
  https://www.youtube.com/feeds/videos.xml?channel_id={UC...}

UC-IDs sind die OFFIZIELLEN Channel-IDs, im April 2026 verifiziert.
Kein Handle-Lookup mehr — direkt die UC-ID, das geht nicht schief.

Thumbnails:
  https://img.youtube.com/vi/{video_id}/mqdefault.jpg   (320x180)
"""
import feedparser
import re
from datetime import datetime
from .common import upsert, USER_AGENT

# Offizielle UC-Channel-IDs aller 32 NFL-Teams (April 2026 verifiziert).
# Match mit src/data/team-media.ts (youtubeChannelId).
TEAM_CHANNELS: dict[str, str] = {
    "ARI": "UCzNfiKcvNjLHljohEkO83Rg",
    "ATL": "UCzjCfV3LHyarKbdb-2ScGZg",
    "BAL": "UCbpj2JAUMb8G_oQQFPeGrhg",
    "BUF": "UCcEvCxUe2Sm5W6MliEUv0vg",
    "CAR": "UC6vl4XAyO5mZLczhFC8MgpA",
    "CHI": "UCP0Cdc6moLMyDJiO0s-yhbQ",
    "CIN": "UCnQUpSnJ39KsjZKbT0CprHQ",
    "CLE": "UCQQQO7Kdo0cu9iEb19qOoYA",
    "DAL": "UCC0BPKJxAyxjQoRTYbpW0FQ",
    "DEN": "UCDGdBexlDZA8T7hnweWWyow",
    "DET": "UCv5J06V-ESk5_1uriG65f3w",
    "GB":  "UCJtI-l6La0zniodFtSHYrBg",
    "HOU": "UCa_FcpOBe8G6VAR18RYS-aA",
    "IND": "UCyYn26HPC4HIedifGnNbjBw",
    "JAX": "UCsGacW6z0GedR-Wv45SBRZg",
    "KC":  "UC-hXefb6XBFSubWz6Ezf_lA",
    "LV":  "UC1es5fp8FEK1L0EgHjCvmtQ",
    "LAC": "UCUyz_gEY_N-KBU4zjt2s-uQ",
    "LAR": "UCyJ6yZdVUkBvt2vl4R03jcA",
    "MIA": "UCHUSfEzpSRkUUsRkk_aJwDw",
    "MIN": "UCcsw_KrB_wg5lQ5nXWR_LFA",
    "NE":  "UCMm_V8YjmnZRhToXIqDYDuw",
    "NO":  "UCwuddf1JrodMlc5fYpVlrQA",
    "NYG": "UCk2FqoG8dN5EAz5WU3A0D7A",
    "NYJ": "UCROj9vBjc4ZW3AL4cd_BjHg",
    "PHI": "UCaogx6OHpsGg0zuGRKsjbtQ",
    "PIT": "UChaRXjMDs4ppKfnTPE6Z89w",
    "SF":  "UCeIOarQkwmGhimim9cDUTng",
    "SEA": "UCzkFCRiMcOBeef8xcaqipmw",
    "TB":  "UC0Wwu7r1ybaaR09ANhudTzA",
    "TEN": "UCHBsqVkFraWvtNd1w0Qx4_g",
    "WAS": "UC2a0ENbCZqIO5C1fWXGXZXA",
}

VIDEO_ID_RE = re.compile(r"(?:v=|youtu\.be/|/watch\?v=)([A-Za-z0-9_-]{11})")


def _extract_video_id(url: str) -> str | None:
    m = VIDEO_ID_RE.search(url or "")
    return m.group(1) if m else None


def _fetch_team(team_id: str, channel_id: str) -> list[dict]:
    """Hole letzte 15 Videos via RSS-Feed des Channels."""
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    feed = feedparser.parse(url, agent=USER_AGENT)
    if not feed.get("entries"):
        print(f"  [WARN] {team_id}: kein Feed (channel_id={channel_id})")
        return []

    rows = []
    for e in feed.entries[:15]:
        vid = e.get("yt_videoid") or _extract_video_id(e.get("link", ""))
        if not vid:
            continue
        rows.append({
            "team_id": team_id,
            "video_id": vid,
            "title": e.get("title", "")[:200],
            "description": (e.get("summary") or "")[:1000],
            "thumbnail_url": f"https://img.youtube.com/vi/{vid}/mqdefault.jpg",
            "channel_id": e.get("yt_channelid") or channel_id,
            "channel_title": e.get("author"),
            "published_at": (
                datetime(*e.published_parsed[:6]).isoformat()
                if e.get("published_parsed") else None
            ),
        })
    return rows


def run():
    print("=== YouTube Team-Feeds ===")
    total = 0
    for team_id, channel_id in TEAM_CHANNELS.items():
        rows = _fetch_team(team_id, channel_id)
        if rows:
            upsert("team_videos", rows, on_conflict="team_id,video_id")
            total += len(rows)
            print(f"  {team_id}: {len(rows)} videos")
    print(f"  [OK] gesamt {total} videos in team_videos")


if __name__ == "__main__":
    run()
