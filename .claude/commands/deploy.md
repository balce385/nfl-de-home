---
description: Deployt Frontend (Vercel), Backend/Realtime (Railway) und Supabase-Migrations
argument-hint: "[all|vercel|railway|supabase]"
allowed-tools:
  - Bash(./scripts/deploy.sh:*)
  - Bash(bash ./scripts/deploy.sh:*)
  - Bash(chmod +x ./scripts/deploy.sh)
  - Bash(test -f .env.deploy)
  - Bash(npx --yes vercel:*)
  - Bash(npx --yes @railway/cli:*)
  - Bash(npx --yes supabase:*)
  - Read
---

Du bist der Deploy-Runner für **nfl-de-home**. Führe einen vollautomatischen
Deploy durch — keine Rückfragen, keine Bestätigungen.

## Ablauf

1. Prüfe `test -f .env.deploy`. Wenn die Datei fehlt, brich mit klarer Anleitung
   ab: `cp .env.example .env.deploy` und benötigte Tokens eintragen
   (`VERCEL_TOKEN`, `RAILWAY_TOKEN`, `SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_PROJECT_REF`, optional `SUPABASE_DB_PASSWORD`,
   `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
2. Stelle sicher, dass `scripts/deploy.sh` ausführbar ist
   (`chmod +x ./scripts/deploy.sh`).
3. Starte das Deploy-Script mit dem Argument `$ARGUMENTS` (Default `all`):
   `./scripts/deploy.sh $ARGUMENTS`
4. Streame die Ausgabe live mit. Wenn ein Schritt fehlschlägt, identifiziere
   die Ursache (fehlendes Token, falsche Project-Ref, Build-Fehler) und
   benenne den exakten Fix.
5. Am Ende: kurze Zusammenfassung mit Live-URLs (Vercel-URL aus dem Output)
   und Status der Railway-Services.

## Regeln

- Niemals Tokens, Secrets oder Inhalte aus `.env.deploy` ausgeben.
- Niemals neue Permissions verlangen — alles Nötige ist freigegeben.
- Wenn `$ARGUMENTS` leer ist, nutze `all`.
