"""Laeuft ohne Netz: python -m pytest scrapers/test_article_slugs.py"""
from scrapers.article_slugs import plan
from scrapers.nfl_news import make_slug, slugify

PFT = "https://profootballtalk.nbcsports.com/2026/09/26/jayden-daniels/"


def test_slug_ist_ascii_und_ohne_pfadzeichen():
    s = make_slug("Commanders QB könnte früher zurückkehren?", "https://x/?p=420943")
    assert s.startswith("commanders-qb-koennte-frueher-zurueckkehren-")
    assert all(c.isascii() and (c.isalnum() or c == "-") for c in s)
    assert slugify("") == ""


def test_slug_haengt_nicht_von_der_uebersetzung_ab():
    # Dieselbe Quelle gibt denselben Slug, egal welcher Uebersetzer lief.
    assert make_slug("Daniels could return early", PFT) == make_slug("Daniels could return early", PFT)
    assert make_slug("Daniels could return early", PFT) != make_slug("Daniels could return early",
                                                                     PFT + "x")


def test_plan_behaelt_uebersetzte_neueste_zeile():
    rows = [
        {"id": "1", "slug": "alt-deutsch", "title": "Daniels könnte zurückkehren",
         "original_title": "Daniels could return", "source_url": PFT, "translated": True,
         "created_at": "2026-09-26T15:00"},
        {"id": "2", "slug": "daniels-could-return", "title": "Daniels could return",
         "original_title": None, "source_url": PFT, "translated": False,
         "created_at": "2026-09-26T16:00"},
    ]
    updates, deletes = plan(rows)
    assert deletes == ["2"]
    assert updates == [("1", make_slug("Daniels could return", PFT))]


def test_plan_laesst_stabile_slugs_in_ruhe():
    slug = make_slug("Title", PFT)
    rows = [{"id": "1", "slug": slug, "title": "Titel", "original_title": "Title",
             "source_url": PFT, "translated": True, "created_at": "x"}]
    assert plan(rows) == ([], [])


def test_clean_text_repariert_zerlegte_entitaeten():
    from scrapers.nfl_news import clean_text
    assert clean_text("Die Bills & # 8217; Offensive") == "Die Bills ’ Offensive"
    assert clean_text("Bills&#8217; Offense &amp; Defense") == "Bills’ Offense & Defense"
    assert clean_text("A & B") == "A & B"


def test_repair_text_nur_betroffene_felder():
    from scrapers.article_slugs import repair_text
    rows = [{"id": "1", "title": "Ok", "original_title": None,
             "excerpt": "Die Bills & # 8217; Offensive", "body_md": "Die Bills & # 8217; Offensive"},
            {"id": "2", "title": "Rot & Gold", "original_title": None, "excerpt": None, "body_md": None}]
    assert repair_text(rows) == [("1", {"excerpt": "Die Bills ’ Offensive",
                                        "body_md": "Die Bills ’ Offensive"})]
