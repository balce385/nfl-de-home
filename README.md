# NFL-DE-Home

Die deutschsprachige NFL-Heimat — News, Live-Stats, Advanced Analytics, Community-Chat
und ein eigenes Magazin. Alles kostenlos, DSGVO-konform, EU-gehostet.

![Stack](https://img.shields.io/badge/stack-Next.js%2014%20%7C%20FastAPI%20%7C%20Supabase-green)
![Region](https://img.shields.io/badge/hosting-EU%20only-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## Was die Plattform macht

| Feature | Live-Daten-Quelle |
|---|---|
| Live-Scores & Box-Scores | ESPN Public API |
| Spieler-Datenbank (~3.900) | Sleeper Public API |
| Advanced Stats (EPA, CPOE, Snap-Counts) | nflverse-data (GitHub Releases, MIT) |
| Wöchentliche Depth Charts | nflverse-data |
| Verletzungs-Reports | nflverse-data |
| Team-Logos & Stadion-Daten | TheSportsDB |
| YouTube-Videos pro Team | YouTube RSS-Feeds (kein API-Key) |
| News (auto-übersetzt EN→DE) | 13 RSS-Feeds: ESPN, PFT, Yahoo, CBS, USAToday, ProFootballRumors, RotoWire, SBNation team-blogs |
| Beat Writers pro Team | Statisch, alle 32 Teams mit X/Twitter-Handles |

NFL-Begriffs-Glossar in `scrapers/translate.py` schützt 70+ Lehnwörter
(Quarterback, Touchdown, EPA, Mahomes, Chiefs etc.) vor falscher Übersetzung.

## Stack

```
Frontend       Next.js 14 App Router · TypeScript · Tailwind
DB + Auth      Supabase (Postgres + Row-Level-Security)
Backend        FastAPI (Python 3.12)
Realtime       Socket.io (Node.js)
Scraper        Python 3.12 (httpx, feedparser, deep-translator)
Cron           GitHub Actions (stündlich News, täglich Vollscan)
```

## Schnellstart lokal

```bash
git clone https://github.com/USER/nfl-de-home.git
cd nfl-de-home
npm install
cp .env.example .env.local
# Trage Supabase-URL, Anon-Key + Service-Role-Key ein
npm run dev   # → http://localhost:3000
```

In Supabase die Migrationen ausführen (siehe
`supabase/_all_migrations_combined.sql` als Single-Paste).

Für Daten:

```bash
cd scrapers
pip install -e .
cp .env.example .env
python -m scrapers.run_all
```

## Deployment

Siehe [`DEPLOYMENT.md`](./DEPLOYMENT.md). Empfohlene EU-Hoster:

| Service | Was | Region | Free-Tier |
|---|---|---|---|
| Supabase | DB + Auth | Frankfurt/Irland | 500 MB DB |
| Vercel | Next.js | fra1 (Frankfurt) | Hobby-Plan |
| Railway | FastAPI + Realtime | europe-west4 | 5 $/Monat-Trial |
| GitHub Actions | Scraper-Cron | — | 2.000 Min/Monat |

## Projekt-Struktur

```
nfl-de-home/
├── src/                    Next.js App
│   ├── app/                Routes (App Router)
│   ├── components/         UI-Komponenten + 8 Showcase-Komponenten
│   ├── data/               Statische Daten (Team Media, Beat Writers)
│   └── lib/supabase/       Auth-Helpers
├── backend/                FastAPI
├── realtime/               Socket.io-Server
├── scrapers/               11 Scraper
├── supabase/migrations/    9 SQL-Migrationen
└── .github/workflows/      CI + Cron
```

## Lizenzen & Datenquellen

- Eigener Code: **MIT**
- nflverse-data: **MIT** (CC-BY-4.0 für Daten)
- Sleeper API: free public, no key
- TheSportsDB: free, attribution required
- ESPN/NFL.com/PFT etc.: RSS (öffentlich, fair-use)

Bezahlte Quellen (PFF, Sportradar) sind **nicht** integriert.
