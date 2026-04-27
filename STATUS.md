# NFL DE Fan Hub — Status nach Phase 1-11

**Stand:** 25. April 2026
**Repo:** `E:\Balce-AI\NFL-DE-Fan-app\nfl-de-fan-hub`

---

## Was steht (alle Phasen abgeschlossen)

### Phase 1 + 1.5 — UI-Scaffold & Setup
- Next.js 14 + Tailwind, alle Marketing-Seiten + Dashboard-UI
- `middleware.ts`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `robots.ts`, `sitemap.ts`
- ESLint + Prettier konfiguriert

### Phase 2 — Supabase Auth & Datenbank
- 4 SQL-Migrationen: `0001_initial_schema.sql`, `0002_rls_policies.sql`, `0003_seed.sql`, `0004_remove_pro.sql`
- 9 Tables: profiles, teams, players, player_stats, games, articles, watchlist, channels, messages
- RLS-Policies + `handle_new_user`-Trigger
- `lib/supabase/client.ts` & `lib/supabase/server.ts` (SSR-fähig)
- Login, Register, Forgot, Reset — alle mit echtem Supabase-Auth
- OAuth-Callback-Route + Signout-Route

### Phase 3 — FastAPI Backend
- `backend/` mit pyproject.toml, Dockerfile
- 6 Endpoints in `src/main.py`, JWT-Verify, slowapi rate limiting, CORS

### Phase 4 — Daten-Scraper (erweitert in Phase 11)
- `scrapers/`: ESPN-Schedule, PFR-Stats, NFL-News (RSS), `run_all.py` als Orchestrator
- **Phase 11:** + nflverse (EPA/CPOE), Sleeper (Players), TheSportsDB (Logos), Auto-Translate

### Phase 5 — Realtime
- `realtime/server.js` — Socket.io mit JWT-Auth, History-on-Join, alle Channels offen
- (Stripe entfernt — siehe Phase 10)

### Phase 6 — Quality, Security, SEO
- CSP-Header in `next.config.js`
- Vitest + Playwright konfiguriert
- Cookie-Banner
- DSGVO-Routen: `/api/user/export` + `/api/user/delete`

### Phase 7 — CI/CD + Deployment
- `.github/workflows/ci.yml` + `scrape-cron.yml`
- `vercel.json` (Region fra1) + `railway.json`
- `DEPLOYMENT.md` (12-Schritt-Runbook)

### Phase 8 — Code-Integration & Wiring
- **Navbar** zeigt Login-Status + Logout-Button
- **Profil-Seite** `/dashboard/profil` mit Name/Bio + DSGVO-Buttons
- **Forgot/Reset** Passwort-Flow
- **Dashboard** lädt aus FastAPI `/api/v1/data` (Mock-Fallback bei Offline)
- **Community** mit echtem Socket.io-Chat (`ChatRoom.tsx`), History, Multi-Channel
- **Pricing** zeigt einen einzigen kostenlosen Plan
- Realtime-Server an Client-API angepasst (Object-Payloads, History, user_name)

### Phase 9 — Lokaler Build-Test
- TypeScript type-check: **clean** (`tsc --noEmit` ohne Fehler)
- Drei Korrekturen während Verifikation:
  1. `package.json` war abgeschnitten → neu geschrieben
  2. `dashboard/page.tsx` hatte Null-Byte-Padding → bereinigt
  3. KPI-Komponente: `LucideIcon`-Typ statt `ComponentType`
- `next build` und `npm run lint` müssen lokal gegen volle Installation laufen

### Phase 11 — Freie Datenquellen + Auto-Übersetzung
- **`scrapers/sleeper_players.py`** — Sleeper Public API → 3.893 NFL-Spieler mit GSIS-ID
- **`scrapers/nflverse_pbp.py`** — Play-by-Play CSV.GZ von nflverse-Releases → EPA, CPOE pro Player-Week (open-source, MIT-Lizenz)
- **`scrapers/nflverse_releases.py`** — generischer Loader für 4 weitere nflverse-Quellen:
  - `run_rosters()` → Saison-Kader (Jersey-Nummer, College, Headshot-URL, ESPN/PFR/Yahoo/Rotowire-IDs)
  - `run_depth_charts()` → wöchentliche Aufstellung pro Team & Position (1st/2nd/3rd String)
  - `run_snap_counts()` → tatsächliche Spielanteile pro Game (Offense/Defense/ST)
  - `run_injuries()` → wöchentlicher Verletztenreport (Out/Doubtful/Questionable + Body-Part)
- **`scrapers/thesportsdb_teams.py`** — 32 NFL-Teams mit Logos, Stadium, Website (free key 3)
- **`scrapers/translate.py`** — `deep-translator` (Google free) wrapped mit lru_cache + Rate-Limiting
- **`scrapers/nfl_news.py`** — erweitert: übersetzt EN→DE automatisch, speichert `original_title` + `translated=true`
- **`scrapers/run_all.py`** — 10-stufige Orchestrator-Reihenfolge (teams → players base → players enrich → games → depth_charts → PBP → snap_counts → injuries → PFR-fallback → news), pro Schritt Try/Except
- **Migration `0005_advanced_stats.sql`** — `epa`, `cpoe`, `targets`, `receptions`, `snap_count`, `gsis_id`, `sleeper_id`, `injury_status`, `badge_url`, `stadium`, `language`, `source`, `translated`
- **Migration `0006_rosters_depth_charts_injuries.sql`** — neue Tables: `depth_charts`, `injuries` + Player-Roster-Felder (`college`, `draft_year`, `headshot_url`, `espn_id`, `pfr_id`, `rotowire_id`, `yahoo_id`, `years_exp`)
- **6 Showcase-Komponenten** in `src/components/showcase/` + Demo-Seite `/design` (StadiumScoreboard, TradingCard, MagazineCover, DriveTracker, PowerRankings, HighlightBanner)
- **UI ehrlich gemacht**: Hero/FAQ/Pricing/DashboardPreview erwähnen jetzt **echte** Quellen (nflverse, Sleeper, PFR, ESPN, NFL.com, TheSportsDB) statt PFF/FootballDB/„offizielle NFL-API"

### Phase 10 — Bezahl-Funktion entfernt
- **Stripe-Dependency** aus `package.json` entfernt
- **API-Routen** `/api/stripe/checkout` + `/api/stripe/webhook` als 410-Stubs (alte Bookmarks crashen nicht)
- **`ProCheckoutButton`** zu No-op-Wrapper degradiert
- **`PricingSection`** komplett umgeschrieben: eine einzige "Komplett kostenlos"-Karte, CTA → `/register`
- **Profile**: `is_pro`-Spalten + Pro-Badge entfernt
- **Migration `0004_remove_pro.sql`**: idempotent, droppt alte `is_pro`/`pro_until`-Spalten
- **Community**: alle Channels offen, kein `is_pro_only` mehr, `Lock`/`Pin`-Icons raus
- **`realtime/server.js`**: `canAccessChannel` simplifiziert (nur noch Existenz-Check)
- **CSP** in `next.config.js`: stripe.com-Hosts entfernt
- **`.env.example`**: Stripe-Block raus
- **`DEPLOYMENT.md`**: Stripe-Schritte raus, Schritte renumeriert

---

## Was du jetzt tun musst (lokal auf Windows)

```powershell
cd E:\Balce-AI\NFL-DE-Fan-app\nfl-de-fan-hub

# 1. Dependencies installieren
npm install

# 2. .env.local anlegen (kopiere .env.example, trage echte Werte ein)
copy .env.example .env.local
# Editiere .env.local mit Supabase-Keys, Socket-URL, etc.

# 3. Type-Check + Build
npm run type-check
npm run lint
npm run build

# 4. Tests
npm test

# 5. Dev-Server starten
npm run dev
```

## Externe Setups (nicht-Code)

| Service  | Schritt                                                                                |
| -------- | -------------------------------------------------------------------------------------- |
| Supabase | Projekt anlegen (Frankfurt), 4 Migrationen ausführen, Anon + Service-Role-Keys kopieren |
| Vercel   | Repo verbinden, env-Variablen setzen, `region: fra1`                                    |
| Railway  | Backend (FastAPI) + Realtime (Node) als 2 Services deployen, Dockerfile-Builder         |
| GitHub   | Secrets für CI: SUPABASE_*, NEXT_PUBLIC_*                                               |

Vollständige Anleitung: siehe `DEPLOYMENT.md`
