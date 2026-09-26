"""Laeuft ohne Netz: python -m pytest scrapers/test_seo_bot.py"""
from scrapers.seo_bot import audit_page, changed_urls, find_duplicates, score

URL = "https://nfl-fan-app.de/teams/kc"
WORDS = " ".join(["Kader"] * 200)


def page(title="Kansas City Chiefs: Kader & Spielplan", desc="x" * 120, canonical=URL,
         robots="index", h1s=("Kansas City Chiefs",), ld='{"@type":"SportsTeam"}'):
    h1 = "".join(f"<h1>{h}</h1>" for h in h1s)
    return (
        f'<html lang="de"><head><title>{title}</title>'
        f'<meta name="description" content="{desc}"><meta name="robots" content="{robots}">'
        f'<link rel="canonical" href="{canonical}"><meta property="og:title" content="t">'
        f'<meta property="og:url" content="{canonical}">'
        f'<script type="application/ld+json">{ld}</script></head>'
        f"<body><main>{h1}<p>{WORDS}</p></main></body></html>"
    )


def msgs(result):
    return [m for _, m in result["issues"]]


def test_saubere_seite_ohne_befund():
    r = audit_page(URL, 200, page())
    assert r["issues"] == []
    assert r["structured_data"] == ["SportsTeam"]


def test_snippet_fehler_werden_erkannt():
    r = audit_page(URL, 200, page(title="x" * 70, desc="", canonical="https://nfl-fan-app.de/",
                                  robots="noindex", h1s=(), ld="{kaputt"))
    text = " | ".join(msgs(r))
    for expected in ("Title zu lang", "Description fehlt", "noindex", "Canonical zeigt auf",
                     "0 H1", "JSON-LD nicht lesbar"):
        assert expected in text, expected


def test_http_fehler():
    assert msgs(audit_page(URL, 404, "")) == ["HTTP 404"]


def test_duplikate_und_aenderungen():
    a = audit_page(URL, 200, page())
    b = audit_page(URL + "x", 200, page(canonical=URL + "x"))
    dups = find_duplicates([a, b])
    assert [(f, len(u)) for f, _, u in dups] == [("title", 2), ("description", 2)]
    assert changed_urls([a, b], {URL: a["content_hash"]}) == [URL + "x"]


def test_score():
    ok = audit_page(URL, 200, page())
    broken = audit_page(URL, 500, "")
    assert score([ok, ok]) == 100
    assert score([ok, broken]) == 50
