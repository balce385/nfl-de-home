"""
SEO-Bot: prueft, wie nfl-fan-app.de im Google-Suchergebnis erscheint, und
meldet geaenderte Seiten an Suchmaschinen.

Nur erlaubte Mittel (Google Search Essentials): Seiten besser beschreiben und
schneller melden. Keine Klick-Simulation, keine Linkfarmen — das fuehrt zur
Abstrafung statt zu besseren Plaetzen.

Ablauf:
  1. Alle URLs aus der Sitemap abrufen (gedrosselt).
  2. Je Seite die Snippet-Bausteine pruefen: Title, Description, Canonical,
     noindex, H1, JSON-LD, Open Graph, Sprache.
  3. Seitenuebergreifend doppelte Titel und Beschreibungen finden.
  4. Seiten mit geaendertem Inhalt seit dem letzten Lauf per IndexNow melden.
  5. Optional (GSC_CREDENTIALS gesetzt): Search-Console-Abfragen mit guter
     Position, aber schwacher Klickrate — dort lohnt ein besserer Titel.
  6. Bericht nach SEO_DIR (Markdown fuer Menschen, JSON fuer Vergleiche).

    python -m scrapers.seo_bot            # voller Lauf
    python -m scrapers.seo_bot --limit 50 # nur die ersten 50 URLs
"""
import hashlib
import json
import os
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from xml.etree import ElementTree

import httpx
from bs4 import BeautifulSoup

from . import indexnow

SITE = indexnow.SITE
SEO_DIR = Path(os.getenv("SEO_DIR", "data/seo"))

# Grenzen, ab denen Google Title und Description im Suchergebnis abschneidet
# (gemessen wird in Pixeln; ~60 bzw. ~160 Zeichen sind die uebliche Naeherung).
TITLE_MAX, TITLE_MIN = 60, 25
DESC_MAX, DESC_MIN = 160, 70

SEVERITY = {"error": 3, "warn": 2, "info": 1}


def _norm(url: str) -> str:
    return url.rstrip("/") or url


def audit_page(url: str, status: int, html: str) -> dict:
    """Prueft eine Seite; liefert die Snippet-Daten und eine Liste von Befunden."""
    issues: list[tuple[str, str]] = []
    if status != 200:
        return {"url": url, "status": status, "issues": [("error", f"HTTP {status}")]}

    soup = BeautifulSoup(html, "lxml")
    meta = lambda name: (soup.find("meta", attrs={"name": name}) or {}).get("content")  # noqa: E731
    prop = lambda name: (soup.find("meta", attrs={"property": name}) or {}).get("content")  # noqa: E731

    title = (soup.title.string or "").strip() if soup.title else ""
    desc = (meta("description") or "").strip()
    robots = (meta("robots") or "").lower()
    canon_tag = soup.find("link", attrs={"rel": "canonical"})
    canonical = canon_tag.get("href") if canon_tag else None
    h1s = [h.get_text(" ", strip=True) for h in soup.find_all("h1")]
    lang = (soup.html or {}).get("lang") if soup.html else None

    if not title:
        issues.append(("error", "Title fehlt"))
    elif len(title) > TITLE_MAX:
        issues.append(("warn", f"Title zu lang ({len(title)} > {TITLE_MAX}), Google kuerzt"))
    elif len(title) < TITLE_MIN:
        issues.append(("warn", f"Title zu kurz ({len(title)} < {TITLE_MIN})"))

    if not desc:
        issues.append(("error", "Description fehlt — Google baut dann selbst einen Text"))
    elif len(desc) > DESC_MAX:
        issues.append(("info", f"Description zu lang ({len(desc)} > {DESC_MAX})"))
    elif len(desc) < DESC_MIN:
        issues.append(("warn", f"Description zu kurz ({len(desc)} < {DESC_MIN})"))

    if "noindex" in robots:
        issues.append(("error", "noindex, steht aber in der Sitemap"))
    if not canonical:
        issues.append(("error", "Canonical fehlt"))
    elif _norm(canonical) != _norm(url):
        issues.append(("error", f"Canonical zeigt auf {canonical}"))

    og_url = prop("og:url")
    if not prop("og:title"):
        issues.append(("warn", "og:title fehlt"))
    if og_url and canonical and _norm(og_url) != _norm(canonical):
        issues.append(("warn", f"og:url ({og_url}) weicht vom Canonical ab"))

    if len(h1s) != 1:
        issues.append(("warn", f"{len(h1s)} H1-Ueberschriften statt einer"))
    if not lang:
        issues.append(("warn", "html lang fehlt"))

    ld_types: list[str] = []
    for s in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(s.string or "")
        except json.JSONDecodeError:
            issues.append(("error", "JSON-LD nicht lesbar"))
            continue
        for item in data if isinstance(data, list) else [data]:
            if isinstance(item, dict) and item.get("@type"):
                ld_types.append(str(item["@type"]))

    main = soup.find("main") or soup.body
    text = main.get_text(" ", strip=True) if main else ""
    if len(text.split()) < 150:
        issues.append(("info", f"wenig Text ({len(text.split())} Woerter)"))

    return {
        "url": url,
        "status": status,
        "title": title,
        "description": desc,
        "canonical": canonical,
        "h1": h1s[0] if h1s else None,
        "structured_data": sorted(set(ld_types)),
        "content_hash": hashlib.sha256(text.encode()).hexdigest()[:16],
        "issues": issues,
    }


def find_duplicates(pages: list[dict]) -> list[tuple[str, str, list[str]]]:
    """Titel und Beschreibungen, die mehrere Seiten teilen — Google waehlt dann eine aus."""
    out = []
    for field in ("title", "description"):
        groups: dict[str, list[str]] = defaultdict(list)
        for p in pages:
            if p.get(field):
                groups[p[field]].append(p["url"])
        out += [(field, value, urls) for value, urls in groups.items() if len(urls) > 1]
    return out


def changed_urls(pages: list[dict], previous: dict[str, str]) -> list[str]:
    """Seiten, deren Inhalt sich seit dem letzten Lauf geaendert hat (oder neu sind)."""
    return [
        p["url"] for p in pages
        if p.get("content_hash") and previous.get(p["url"]) != p["content_hash"]
    ]


def score(pages: list[dict]) -> int:
    """0-100: Anteil der Seiten ohne Fehler, Warnungen zaehlen halb."""
    if not pages:
        return 0
    bad = 0.0
    for p in pages:
        sev = max((SEVERITY[s] for s, _ in p["issues"]), default=0)
        bad += 1 if sev >= 3 else 0.5 if sev == 2 else 0
    return round(100 * (1 - bad / len(pages)))


# ---------------------------------------------------------------- Netzwerk --

def sitemap_urls(client: httpx.Client) -> list[str]:
    r = client.get(f"{SITE}/sitemap.xml")
    r.raise_for_status()
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in ElementTree.fromstring(r.content).findall(".//s:loc", ns)]


def fetch(client: httpx.Client, url: str) -> dict:
    try:
        r = client.get(url)
        return audit_page(url, r.status_code, r.text)
    except httpx.HTTPError as e:
        return {"url": url, "status": 0, "issues": [("error", f"nicht erreichbar: {type(e).__name__}")]}


def gsc_opportunities() -> list[dict]:
    """Search-Console-Abfragen auf Platz 1-15 mit unterdurchschnittlicher Klickrate.

    Braucht ein Service-Konto mit Lesezugriff auf die Property (GSC_CREDENTIALS =
    Pfad zur JSON-Datei). Ohne Zugang wird der Schritt uebersprungen.
    """
    cred = os.getenv("GSC_CREDENTIALS")
    if not cred or not Path(cred).exists():
        return []
    from google.oauth2 import service_account  # nur mit Zugang installiert
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        cred, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    end = date.today() - timedelta(days=3)
    body = {"startDate": str(end - timedelta(days=28)), "endDate": str(end),
            "dimensions": ["page", "query"], "rowLimit": 1000}
    rows = svc.searchanalytics().query(siteUrl=f"{SITE}/", body=body).execute().get("rows", [])
    # Grobe Erwartung an die Klickrate je Position (Branchenmittel, nur als Schwelle).
    expected = {1: 0.25, 2: 0.15, 3: 0.10, 4: 0.07, 5: 0.05}
    out = []
    for r in rows:
        pos, ctr, imp = r["position"], r["ctr"], r["impressions"]
        if imp >= 30 and pos <= 15 and ctr < expected.get(round(pos), 0.02) * 0.6:
            out.append({"page": r["keys"][0], "query": r["keys"][1], "position": round(pos, 1),
                        "ctr": round(ctr * 100, 1), "impressions": imp})
    return sorted(out, key=lambda x: -x["impressions"])[:30]


def write_report(pages, dups, changed, opportunities, started) -> Path:
    SEO_DIR.mkdir(parents=True, exist_ok=True)
    stamp = started.strftime("%Y-%m-%d")
    counter = Counter(msg.split(" (")[0] for p in pages for _, msg in p["issues"])
    lines = [
        f"# SEO-Bericht {stamp}",
        "",
        f"Seiten geprueft: {len(pages)} · Score: **{score(pages)}/100** · "
        f"geaendert und gemeldet: {len(changed)}",
        "",
        "## Befunde nach Art",
        "",
        *[f"- {n}× {msg}" for msg, n in counter.most_common()],
        "",
        "## Seiten mit Fehlern",
        "",
    ]
    errs = [p for p in pages if any(s == "error" for s, _ in p["issues"])]
    for p in errs[:40]:
        lines.append(f"- {p['url']}: " + "; ".join(m for s, m in p["issues"] if s == "error"))
    if dups:
        lines += ["", "## Doppelte Titel/Beschreibungen", ""]
        for field, value, urls in dups[:20]:
            lines.append(f"- {field} \"{value[:80]}\" auf {len(urls)} Seiten, z. B. {urls[0]}")
    if opportunities:
        lines += ["", "## Search Console: guter Platz, wenig Klicks", "",
                  "Hier lohnt ein treffenderer Titel oder eine bessere Description.", ""]
        for o in opportunities:
            lines.append(f"- \"{o['query']}\" → {o['page']} · Platz {o['position']}, "
                         f"CTR {o['ctr']} %, {o['impressions']} Impressionen")
    report = "\n".join(lines) + "\n"
    (SEO_DIR / f"report-{stamp}.md").write_text(report, encoding="utf-8")
    (SEO_DIR / "latest.md").write_text(report, encoding="utf-8")
    (SEO_DIR / "pages.json").write_text(
        json.dumps({p["url"]: p.get("content_hash") for p in pages}, indent=0), encoding="utf-8")
    return SEO_DIR / "latest.md"


def run(limit: int | None = None) -> int:
    started = datetime.now(timezone.utc)
    print(f"=== SEO-Bot {started.isoformat(timespec='seconds')} ===")
    state_file = SEO_DIR / "pages.json"
    previous = json.loads(state_file.read_text()) if state_file.exists() else {}

    with httpx.Client(timeout=30, follow_redirects=False, headers={"Accept-Language": "de"}) as c:
        urls = sitemap_urls(c)[:limit]
        print(f"  {len(urls)} URLs aus der Sitemap")
        # Vier parallele Abrufe schonen den eigenen Server und reichen fuer ~750 Seiten.
        with ThreadPoolExecutor(max_workers=4) as pool:
            pages = list(pool.map(lambda u: fetch(c, u), urls))

    dups = find_duplicates(pages)
    changed = changed_urls(pages, previous)
    # Beim allerersten Lauf ist alles "neu" — das waere eine Flut, die Sitemap
    # kennen die Suchmaschinen ohnehin. Gemeldet wird erst ab dem zweiten Lauf.
    if previous and changed:
        indexnow.submit(changed)
    try:
        opportunities = gsc_opportunities()
    except Exception as e:  # noqa: BLE001 — Search Console ist Beiwerk
        print(f"  [warn] Search Console: {type(e).__name__}: {e}")
        opportunities = []

    path = write_report(pages, dups, changed if previous else [], opportunities, started)
    print(f"  Score {score(pages)}/100 · Bericht: {path} · {time.time() - started.timestamp():.0f} s")
    for line in path.read_text(encoding="utf-8").splitlines()[4:16]:
        print("  " + line)
    return 0


if __name__ == "__main__":
    lim = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    sys.exit(run(lim))
