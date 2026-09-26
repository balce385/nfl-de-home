"""
Auto-Uebersetzung EN -> DE mit Fallback-Chain.

Backends in dieser Reihenfolge:
  1. Google Translator (deep-translator, Free; drosselt Server-IPs)
  2. LibreTranslate    (eigene Instanz, nur wenn LIBRETRANSLATE_URL gesetzt)
  3. MyMemory          (deep-translator, Free, 1k Worte/Tag)
  4. Original-Text                              wenn alle ausfallen

NFL-Begriffs-Glossar: Begriffe die NICHT uebersetzt werden,
weil deutsche NFL-Fans sie als Lehnwoerter nutzen.
"""
import os
import re
import time
from functools import lru_cache

import httpx

# NFL-Lehnwoerter im Deutschen
NFL_TERMS = [
    "Quarterback", "Wide Receiver", "Tight End", "Running Back",
    "Cornerback", "Safety", "Linebacker", "Pick-Six",
    "Snap Count", "Snap", "Sack", "Touchdown",
    "Field Goal", "Two-Point Conversion", "Onside Kick", "Pass Rush",
    "Red Zone", "End Zone", "First Down", "Hail Mary",
    "Play Action", "RPO", "Cover-2", "Cover-3", "Zone Defense",
    "Man Coverage", "Blitz", "Audible", "No-Huddle",
    "EPA", "CPOE", "WPA", "DVOA", "PFF", "NFL", "AFC", "NFC",
    "Mahomes", "Brady", "Manning", "Allen", "Hurts", "Burrow", "Lamar",
    "Chiefs", "Eagles", "Cowboys", "Giants", "Patriots", "Packers",
    "Steelers", "Bears", "Lions", "Vikings", "49ers", "Rams",
    "Seahawks", "Saints", "Falcons", "Panthers", "Buccaneers",
    "Cardinals", "Broncos", "Raiders", "Chargers", "Jets", "Bills",
    "Dolphins", "Ravens", "Bengals", "Browns", "Texans", "Colts",
    "Jaguars", "Titans", "Commanders",
]

_PATTERN = re.compile(
    "|".join(re.escape(t) for t in sorted(NFL_TERMS, key=len, reverse=True)),
    re.IGNORECASE,
)


def _protect(text: str):
    placeholders = {}
    counter = [0]
    def sub(m):
        ph = f"NFLTERM{counter[0]}X"
        placeholders[ph] = m.group(0)
        counter[0] += 1
        return ph
    return _PATTERN.sub(sub, text), placeholders


def _restore(text: str, placeholders) -> str:
    for ph, orig in placeholders.items():
        text = text.replace(ph, orig)
    return text


# Backends
_google = None
try:
    from deep_translator import GoogleTranslator
    _google = GoogleTranslator(source="en", target="de")
except Exception as e:
    print(f"  [warn] GoogleTranslator nicht verfuegbar: {e}")

_mymem = None
try:
    from deep_translator import MyMemoryTranslator
    _mymem = MyMemoryTranslator(source="en-US", target="de-DE")
except Exception as e:
    print(f"  [warn] MyMemoryTranslator nicht verfuegbar: {e}")


class _LibreTranslate:
    """Eigene LibreTranslate-Instanz auf dem VPS (deploy-stack, Dienst libretranslate).

    Kein Tageslimit und keine IP-Sperre, uebersetzt aber holpriger als Google —
    deshalb nur Rueckfallebene, wenn Google die Server-IP drosselt.
    """

    def __init__(self, url: str):
        self.url = url.rstrip("/") + "/translate"

    def translate(self, text: str) -> str:
        r = httpx.post(self.url, json={"q": text, "source": "en", "target": "de",
                                       "format": "text"}, timeout=60)
        r.raise_for_status()
        return r.json()["translatedText"]


_LIBRE_URL = os.getenv("LIBRETRANSLATE_URL")
_libre = _LibreTranslate(_LIBRE_URL) if _LIBRE_URL else None


_last_call = 0.0
# 0.4 s liess Google die VPS-IP nach ~170 Anfragen am Stueck sperren.
_MIN_INTERVAL = 1.0
_blocked: set[str] = set()


def _ratelimit():
    global _last_call
    elapsed = time.time() - _last_call
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _last_call = time.time()


@lru_cache(maxsize=8192)
def translate_to_de(text):
    if not text:
        return text
    text = text.strip()
    if not text:
        return text
    if len(text) > 4500:
        text = text[:4500] + "..."

    protected, ph = _protect(text)

    backends = (("google", _google), ("libretranslate", _libre), ("mymemory", _mymem))
    for name, backend in backends:
        if not backend or name in _blocked:
            continue
        try:
            _ratelimit()
            out = backend.translate(protected)
            if out:
                return _restore(out, ph)
        except Exception as e:
            msg = str(e)
            print(f"  [warn] {name}: {msg[:60]}")
            # Gesperrt bleibt gesperrt: Nach 13 Tagen Rueckstand lief der Lauf
            # sonst in Hunderte identische "too many requests"-Fehler.
            if "too many requests" in msg.lower() or "quota" in msg.lower():
                print(f"  [warn] {name}: fuer diesen Lauf abgeschaltet")
                _blocked.add(name)

    return text
