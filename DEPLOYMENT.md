# Deployment Runbook — NFL-DE-Fan Hub

End-to-End Anleitung vom leeren Repo zum Live-Betrieb.

---

## 0. Voraussetzungen

- GitHub-Account (kostenlos)
- Supabase-Account (kostenlos, EU-Region)
- Vercel-Account (kostenlos, mit GitHub verknüpft)
- Railway- oder Render-Account (Free-Tier)
- Domain (z. B. nfl-de-hub.de bei INWX/Hetzner/Cloudflare)

---

## 1. Lokale Vorbereitung

```powershell
cd E:\Balce-AI\NFL-DE-Fan-app\nfl-de-fan-hub
npm install
npm run dev   # Smoke-Test: läuft mit Mock-Daten
```

Backend lokal:
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
copy .env.example .env
# Werte kommen erst nach Schritt 3 — vorerst nur Frontend testen
```

---

## 2. Git-Repo

```powershell
cd E:\Balce-AI\NFL-DE-Fan-app\nfl-de-fan-hub
git init
git add .
git commit -m "feat: initial scaffold (Phase 1-6)"
git branch -M main
git remote add origin https://github.com/<DEIN-USER>/nfl-de-fan-hub.git
git push -u origin main
git checkout -b develop && git push -u origin develop
```

---

## 3. Supabase einrichten

1. supabase.com → New Project, **Region: Frankfurt (eu-central-1)**
2. Projekt-Settings → API kopieren:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (geheim!)
3. Settings → API → JWT Settings: `JWT Secret` → `SUPABASE_JWT_SECRET`
4. SQL Editor → die 6 Migrations in Reihenfolge ausführen:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_seed.sql`
   - `supabase/migrations/0004_remove_pro.sql` (idempotent — räumt alte Pro-Spalten auf)
   - `supabase/migrations/0005_advanced_stats.sql` (Advanced Stats: EPA, CPOE, Sleeper-IDs, Badges)
   - `supabase/migrations/0006_rosters_depth_charts_injuries.sql` (Roster-Felder + neue Tables: depth_charts, injuries)
5. Authentication → Providers → Email aktivieren, ggf. Google/Apple OAuth einrichten
6. Authentication → URL Configuration → Site URL = deine künftige Vercel-URL

---

## 4. Frontend → Vercel

1. vercel.com → Import GitHub repo → root = repo-root, framework Next.js
2. Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_SITE_URL=https://nfl-de-hub.de
   NEXT_PUBLIC_API_URL=https://api.nfl-de-hub.de
   NEXT_PUBLIC_SOCKET_URL=wss://rt.nfl-de-hub.de
   ```
3. Deploy → URL ist erreichbar

---

## 5. Backend → Railway

1. railway.app → New Project → Deploy from GitHub
2. Service-Root: `/backend` (oder Dockerfile auto-detect via railway.json)
3. Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_JWT_SECRET`, `CORS_ORIGINS=https://nfl-de-hub.de`
4. Deploy → public URL generieren → DNS-CNAME `api.nfl-de-hub.de`
5. Healthcheck: `https://api.nfl-de-hub.de/health` muss `{"status":"ok"}` liefern

---

## 6. Realtime → Railway (zweiter Service)

1. New Service im selben Railway-Projekt → root `/realtime`
2. Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
   `CORS_ORIGINS`, `PORT=3001`
3. Deploy → CNAME `rt.nfl-de-hub.de`

---

## 7. GitHub Secrets (für CI + Cron)

Repo → Settings → Secrets:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (für Scraper-Cron)

---

## 8. Domain + DNS

| Subdomain | Ziel | Provider |
|---|---|---|
| `nfl-de-hub.de` | Vercel | A/CNAME laut Vercel-Anleitung |
| `api.nfl-de-hub.de` | Railway-Backend | CNAME |
| `rt.nfl-de-hub.de` | Railway-Realtime | CNAME |

Bei Cloudflare: SSL-Mode "Full (Strict)" — sonst läuft der Health-Check ins Leere.

---

## 9. Smoke-Test im Live-Betrieb

- [ ] `https://nfl-de-hub.de` lädt mit echtem Favicon
- [ ] Registrierung legt User in Supabase an (Tabelle `auth.users` + Trigger erzeugt `profiles`-Row)
- [ ] Login leitet zu `/dashboard`
- [ ] Alle Features kostenlos zugänglich (kein Paywall)
- [ ] `https://api.nfl-de-hub.de/docs` zeigt OpenAPI-UI
- [ ] Socket.io connected (Browser-Devtools → Network → WS)
- [ ] GitHub Actions: CI grün, Scraper-Cron läuft nachts und füllt `articles`/`games`
- [ ] Lighthouse-Score ≥ 90 (Performance, A11y, Best Practices, SEO)

---

## 10. Post-Launch

- Sentry für Error-Tracking (frontend + backend)
- Plausible Analytics (cookie-frei, DSGVO-konform)
- Uptime-Monitoring: UptimeRobot kostenlos auf alle 3 URLs
