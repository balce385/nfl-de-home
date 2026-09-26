"""
Einmalige Bereinigung der Artikel-Slugs (September 2026).

Der News-Scraper legte denselben Artikel mehrfach an (Slug aus der jeweiligen
Uebersetzung) und baute "/" und "?" aus Feed-IDs in die Slugs ein. Dieses
Skript:
  1. behaelt je Quell-URL eine Zeile (uebersetzt vor unuebersetzt, dann die
     neueste) und loescht die Dubletten,
  2. gibt allen Zeilen den stabilen Slug aus nfl_news.make_slug(),
  3. schreibt vorher alle betroffenen Zeilen nach SEO_DIR als Sicherung.

    python -m scrapers.article_slugs          # nur anzeigen, was passieren wuerde
    python -m scrapers.article_slugs --apply  # ausfuehren
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from .common import supabase_admin
from .nfl_news import make_slug

SEO_DIR = Path(os.getenv("SEO_DIR", "data/seo"))


def plan(rows: list[dict]) -> tuple[list[tuple[str, str]], list[str]]:
    """(id, neuer Slug) fuer bleibende Zeilen mit geaendertem Slug, und zu loeschende ids."""
    groups: dict[str, list[dict]] = {}
    for r in rows:
        groups.setdefault(r.get("source_url") or f"id:{r['id']}", []).append(r)

    updates, deletes = [], []
    for key, group in groups.items():
        group.sort(key=lambda r: (bool(r.get("translated")), r.get("created_at") or ""),
                   reverse=True)
        keep, dupes = group[0], group[1:]
        deletes += [d["id"] for d in dupes]
        original = keep.get("original_title") or keep["title"]
        new = make_slug(original, keep.get("source_url") or keep["id"])
        if new != keep["slug"]:
            updates.append((keep["id"], new))
    return updates, deletes


def run(apply: bool) -> None:
    sb = supabase_admin()
    rows, start = [], 0
    while True:  # PostgREST liefert hoechstens 1000 Zeilen je Abruf
        batch = (sb.table("articles")
                 .select("id, slug, title, original_title, source_url, translated, created_at")
                 .not_.is_("source_url", "null")
                 .range(start, start + 999).execute().data or [])
        rows += batch
        if len(batch) < 1000:
            break
        start += 1000

    updates, deletes = plan(rows)
    print(f"  {len(rows)} Artikel · {len(deletes)} Dubletten · {len(updates)} neue Slugs")
    for i, s in updates[:5]:
        print(f"    {next(r['slug'] for r in rows if r['id'] == i)[:60]} -> {s}")
    if not apply:
        print("  Probelauf, nichts geaendert (--apply zum Ausfuehren).")
        return

    SEO_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    backup = SEO_DIR / f"articles-backup-{stamp}.json"
    touched = {i for i, _ in updates} | set(deletes)
    backup.write_text(json.dumps([r for r in rows if r["id"] in touched]), encoding="utf-8")
    print(f"  Sicherung: {backup}")

    # Erst loeschen: sonst kann ein neuer Slug mit einer Dublette kollidieren,
    # die denselben Artikel meint (slug ist unique).
    for i in range(0, len(deletes), 100):
        sb.table("articles").delete().in_("id", deletes[i:i + 100]).execute()
    for aid, slug in updates:
        sb.table("articles").update({"slug": slug}).eq("id", aid).execute()
    print(f"  [OK] {len(deletes)} geloescht, {len(updates)} umbenannt")


if __name__ == "__main__":
    run(apply="--apply" in sys.argv)
