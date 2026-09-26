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
from .nfl_news import clean_text, make_slug

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


TEXT_FIELDS = ("title", "original_title", "excerpt", "body_md")


def repair_text(rows: list[dict]) -> list[tuple[str, dict]]:
    """(id, geaenderte Felder) fuer Zeilen mit zerlegten HTML-Entitaeten ("& # 8217;")."""
    out = []
    for r in rows:
        changes = {f: clean_text(r[f]) for f in TEXT_FIELDS
                   if r.get(f) and clean_text(r[f]) != r[f].strip()}
        if changes:
            out.append((r["id"], changes))
    return out


def run_fix_text(apply: bool) -> None:
    sb = supabase_admin()
    rows = (sb.table("articles").select("id, " + ", ".join(TEXT_FIELDS))
            .or_(",".join(f"{f}.like.*&*" for f in TEXT_FIELDS)).limit(2000).execute().data or [])
    fixes = repair_text(rows)
    print(f"  {len(rows)} Artikel mit '&' · {len(fixes)} zu reparieren")
    for aid, ch in fixes[:3]:
        print(f"    {aid}: {next(iter(ch.values()))[:80]}")
    if apply:
        for aid, ch in fixes:
            sb.table("articles").update(ch).eq("id", aid).execute()
        print(f"  [OK] {len(fixes)} repariert")


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
    if "--fix-text" in sys.argv:
        run_fix_text(apply="--apply" in sys.argv)
    else:
        run(apply="--apply" in sys.argv)
