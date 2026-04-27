"""
NFL-News-Scraper v2 — viele Quellen, inkrementelles Update, Auto-DE-Uebersetzung.

Features:
  - 13 RSS-Feeds (general + team-spezifisch via SBNation team-blogs)
  - inkrementelles Update: nur Artikel, die neuer als letzter article.published_at
    der jeweiligen source sind, werden uebersetzt + gespeichert
  - Team-Tag-Erkennung: Artikel werden automatisch mit team_id verknuepft,
    wenn Team-Name im Titel erkannt wird
  - Auto-Uebersetzung EN -> DE mit Fallback-Chain (siehe translate.py)
"""
import feedparser
import re
from datetime import datetime, timezone
from .common import upsert, supabase_admin
from .translate import translate_to_de

# ============================================================
# Feed-Definition: (url, category, source, lang, team_id_hint)
# ============================================================
FEEDS: list[tuple[str, str, str, str, str | None]] = [
    # General
    ("https://www.espn.com/espn/rss/nfl/news",                  "news",     "espn",          "en", None),
    ("https://profootballtalk.nbcsports.com/feed/",             "news",     "pft",           "en", None),
    ("https://sports.yahoo.com/nfl/rss/",                       "news",     "yahoo",         "en", None),
    ("https://www.cbssports.com/rss/headlines/nfl/",            "news",     "cbssports",     "en", None),
    ("https://www.usatoday.com/rss/sports-football",            "news",     "usatoday",      "en", None),
    ("https://www.profootballrumors.com/feed",                  "trades",   "pfrumors",      "en", None),
    ("https://www.rotowire.com/rss/news.php?sport=NFL",         "fantasy",  "rotowire",      "en", None),
    # Team-spezifisch (SBNation team-blogs)
    ("https://www.ninersnation.com/rss/index.xml",              "analyse",  "ninersnation",  "en", "SF"),
    ("https://www.bigblueview.com/rss/index.xml",               "analyse",  "bigblueview",   "en", "NYG"),
    ("https://www.bleedinggreennation.com/rss/index.xml",       "analyse",  "bleedinggn",    "en", "PHI"),
    ("https://www.windycitygridiron.com/rss/index.xml",         "analyse",  "windycity",     "en", "CHI"),
    ("https://www.acmepackingcompany.com/rss/index.xml",        "analyse",  "acmepacking",   "en", "GB"),
    ("https://www.fieldgulls.com/rss/index.xml",                "analyse",  "fieldgulls",    "en", "SEA"),
]

# Team-Erkennung im Titel (3-Letter-Code -> Team-Namen)
TEAM_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("KC",  re.compile(r"\b(?:Chiefs|Kansas City|Mahomes|Andy Reid)\b", re.I)),
    ("BUF", re.compile(r"\b(?:Bills|Buffalo|Josh Allen|McDermott)\b", re.I)),
    ("BAL", re.compile(r"\b(?:Ravens|Baltimore|Lamar Jackson|Harbaugh)\b", re.I)),
    ("CIN", re.compile(r"\b(?:Bengals|Cincinnati|Burrow)\b", re.I)),
    ("CLE", re.compile(r"\b(?:Browns|Cleveland)\b", re.I)),
    ("PIT", re.compile(r"\b(?:Steelers|Pittsburgh|Tomlin)\b", re.I)),
    ("NE",  re.compile(r"\b(?:Patriots|New England|Belichick)\b", re.I)),
    ("MIA", re.compile(r"\b(?:Dolphins|Miami|Tua)\b", re.I)),
    ("NYJ", re.compile(r"\b(?:Jets|New York Jets|Aaron Rodgers)\b", re.I)),
    ("HOU", re.compile(r"\b(?:Texans|Houston|Stroud)\b", re.I)),
    ("IND", re.compile(r"\b(?:Colts|Indianapolis)\b", re.I)),
    ("JAX", re.compile(r"\b(?:Jaguars|Jacksonville|Trevor Lawrence)\b", re.I)),
    ("TEN", re.compile(r"\b(?:Titans|Tennessee)\b", re.I)),
    ("DEN", re.compile(r"\b(?:Broncos|Denver|Sean Payton)\b", re.I)),
    ("LV",  re.compile(r"\b(?:Raiders|Las Vegas)\b", re.I)),
    ("LAC", re.compile(r"\b(?:Chargers|LA Chargers|Herbert)\b", re.I)),
    ("DAL", re.compile(r"\b(?:Cowboys|Dallas|Dak|McCarthy)\b", re.I)),
    ("PHI", re.compile(r"\b(?:Eagles|Philadelphia|Hurts|Sirianni)\b", re.I)),
    ("NYG", re.compile(r"\b(?:Giants|New York Giants|Daboll)\b", re.I)),
    ("WAS", re.compile(r"\b(?:Commanders|Washington)\b", re.I)),
    ("CHI", re.compile(r"\b(?:Bears|Chicago|Caleb Williams)\b", re.I)),
    ("DET", re.compile(r"\b(?:Lions|Detroit|Goff|Dan Campbell)\b", re.I)),
    ("GB",  re.compile(r"\b(?:Packers|Green Bay|Jordan Love)\b", re.I)),
    ("MIN", re.compile(r"\b(?:Vikings|Minnesota)\b", re.I)),
    ("ATL", re.compile(r"\b(?:Falcons|Atlanta)\b", re.I)),
    ("CAR", re.compile(r"\b(?:Panthers|Carolina|Bryce Young)\b", re.I)),
    ("NO",  re.compile(r"\b(?:Saints|New Orleans)\b", re.I)),
    ("TB",  re.compile(r"\b(?:Buccaneers|Tampa Bay|Mayfield)\b", re.I)),
    ("ARI", re.compile(r"\b(?:Cardinals|Arizona|Kyler Murray)\b", re.I)),
    ("LAR", re.compile(r"\b(?:LA Rams|Los Angeles Rams|Stafford|McVay)\b", re.I)),
    ("SF",  re.compile(r"\b(?:49ers|San Francisco|Niners|Purdy|Shanahan)\b", re.I)),
    ("SEA", re.compile(r"\b(?:Seahawks|Seattle|Geno Smith)\b", re.I)),
]


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s-]+", "-", s).strip("-")[:80]


def _strip_html(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def _detect_team(title: str, summary: str, hint: str | None) -> str | None:
    """Hint hat Vorrang (team-spezifischer Feed). Sonst Pattern-Match."""
    if hint:
        return hint
    text = f"{title} {summary}"
    for tid, pat in TEAM_PATTERNS:
        if pat.search(text):
            return tid
    return None


def _last_published_per_source() -> dict[str, datetime]:
    """Hole letztes published_at je source → fuer inkrementelles Update."""
    sb = supabase_admin()
    result: dict[str, datetime] = {}
    try:
        # Supabase-Trick: GROUP BY source, max(published_at)
        res = sb.rpc("articles_last_per_source").execute() if False else None  # noch keine RPC
    except Exception:
        pass
    # Fallback: manuell pro source
    for _, _, source, _, _ in FEEDS:
        try:
            r = sb.table("articles") \
                  .select("published_at") \
                  .eq("source", source) \
                  .order("published_at", desc=True) \
                  .limit(1) \
                  .execute()
            if r.data and r.data[0].get("published_at"):
                result[source] = datetime.fromisoformat(
                    r.data[0]["published_at"].replace("Z", "+00:00")
                )
        except Exception:
            pass
    return result


def _is_newer(entry_pub: datetime | None, last: datetime | None) -> bool:
    """True wenn Eintrag neuer als letzter bekannter."""
    if not entry_pub:
        return True
    if not last:
        return True
    return entry_pub > last


def run():
    print("=== NFL News (multi-source, incremental, DE) ===")
    last_seen = _last_published_per_source()
    if last_seen:
        print(f"  letzte bekannten posts pro source: {len(last_seen)}")

    rows: list[dict] = []
    new_per_source: dict[str, int] = {}

    for url, category, source, lang, team_hint in FEEDS:
        try:
            print(f"  [{source}] lade {url} ...")
            feed = feedparser.parse(url)
            entries = feed.entries[:30]
            new_count = 0
            for entry in entries:
                title_orig = entry.get("title", "").strip()
                if not title_orig:
                    continue
                summary_orig = _strip_html(entry.get("summary", ""))[:1500]

                pub_dt = None
                if entry.get("published_parsed"):
                    pub_dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)

                if not _is_newer(pub_dt, last_seen.get(source)):
                    continue

                # Uebersetzen (Glossar in translate.py schuetzt NFL-Begriffe)
                if lang == "de":
                    title_de, summary_de, translated = title_orig, summary_orig, False
                else:
                    title_de = translate_to_de(title_orig) or title_orig
                    summary_de = translate_to_de(summary_orig) or summary_orig
                    translated = title_de != title_orig

                team_id = _detect_team(title_orig, summary_orig, team_hint)

                slug_base = slugify(title_de or title_orig)
                slug = f"{slug_base}-{(entry.get('id') or entry.get('link', ''))[-10:]}"

                rows.append({
                    "slug": slug,
                    "title": title_de[:200],
                    "excerpt": summary_de[:300],
                    "body_md": summary_de,
                    "cover_url": next(
                        (m.get("url") for m in entry.get("media_content", [])), None
                    ),
                    "category": category,
                    "source": source,
                    "source_url": entry.get("link"),
                    "language": "de",
                    "original_title": title_orig if translated else None,
                    "translated": translated,
                    "team_id": team_id,
                    "published_at": pub_dt.isoformat() if pub_dt else None,
                })
                new_count += 1
            new_per_source[source] = new_count
            print(f"  [{source}] {new_count} neue Artikel")
        except Exception as e:
            print(f"  [{source}] FAIL: {type(e).__name__}: {str(e)[:80]}")

    # Batch-Upsert in 200er-Chunks
    BATCH = 200
    for i in range(0, len(rows), BATCH):
        upsert("articles", rows[i:i + BATCH], on_conflict="slug")

    print(f"\n  [OK] gesamt {len(rows)} neue/aktualisierte Artikel")
    for s, n in new_per_source.items():
        print(f"       {s}: {n}")


if __name__ == "__main__":
    run()
