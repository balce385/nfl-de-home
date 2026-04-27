"""
Auto-Uebersetzung EN -> DE mit Fallback-Chain.

Backends in dieser Reihenfolge:
  1. Google Translator (deep-translator, Free)
  2. MyMemory          (deep-translator, Free, 1k Worte/Tag)
  3. Original-Text                              wenn beide ausfallen

NFL-Begriffs-Glossar: Begriffe die NICHT uebersetzt werden,
weil deutsche NFL-Fans sie als Lehnwoerter nutzen.
"""
from functools import lru_cache
import re
import time

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


_last_call = 0.0
_MIN_INTERVAL = 0.4


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

    if _google:
        try:
            _ratelimit()
            out = _google.translate(protected)
            if out:
                return _restore(out, ph)
        except Exception as e:
            print(f"  [warn] google: {str(e)[:60]}")

    if _mymem:
        try:
            _ratelimit()
            out = _mymem.translate(protected)
            if out:
                return _restore(out, ph)
        except Exception as e:
            print(f"  [warn] mymemory: {str(e)[:60]}")

    return text
