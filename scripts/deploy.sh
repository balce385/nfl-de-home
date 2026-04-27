#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# deploy.sh — One-Shot Deploy für Vercel + Railway + Supabase
#
# Erforderliche Env-Vars (in .env.deploy oder als Environment exportiert):
#   VERCEL_TOKEN              Personal Access Token (vercel.com/account/tokens)
#   VERCEL_ORG_ID             optional, sonst per `vercel link` initialisieren
#   VERCEL_PROJECT_ID         optional, dito
#   RAILWAY_TOKEN             Project Token (railway.app/account/tokens)
#   SUPABASE_ACCESS_TOKEN     Personal Token (supabase.com/dashboard/account/tokens)
#   SUPABASE_PROJECT_REF      z.B. "abcdefghijk"
#   SUPABASE_DB_PASSWORD      Datenbank-Passwort (für db push)
#
# Optional Env-Vars für Vercel-Build (werden automatisch gesetzt, wenn vorhanden):
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   NEXT_PUBLIC_API_URL
#   NEXT_PUBLIC_SOCKET_URL
#
# Aufruf:
#   ./scripts/deploy.sh                 # alles
#   ./scripts/deploy.sh vercel          # nur Frontend
#   ./scripts/deploy.sh railway         # nur Backend/Realtime
#   ./scripts/deploy.sh supabase        # nur Migrations
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# .env.deploy einlesen (Git-ignored), falls vorhanden
if [[ -f .env.deploy ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.deploy
  set +a
fi

TARGET="${1:-all}"

log()  { printf "\033[1;36m[deploy]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m[error]\033[0m %s\n" "$*" >&2; }

require() {
  local var="$1"
  if [[ -z "${!var:-}" ]]; then
    err "Env-Var \$$var fehlt. Trage sie in .env.deploy ein oder exportiere sie."
    exit 1
  fi
}

ensure_npx_pkg() {
  local pkg="$1"
  if ! npx --yes --quiet "$pkg" --version >/dev/null 2>&1; then
    log "Installiere $pkg via npx..."
  fi
}

deploy_vercel() {
  log "==> Vercel-Deploy (Frontend / Next.js)"
  require VERCEL_TOKEN

  ensure_npx_pkg vercel

  # .vercel/project.json anlegen, wenn ORG_ID + PROJECT_ID gesetzt sind
  if [[ -n "${VERCEL_ORG_ID:-}" && -n "${VERCEL_PROJECT_ID:-}" ]]; then
    mkdir -p .vercel
    cat > .vercel/project.json <<EOF
{ "orgId": "$VERCEL_ORG_ID", "projectId": "$VERCEL_PROJECT_ID" }
EOF
  fi

  # Env-Vars in Vercel pushen (idempotent: erst rm, dann add)
  push_env() {
    local key="$1"
    local val="${!key:-}"
    [[ -z "$val" ]] && return 0
    log "  -> set Vercel env $key (production)"
    npx --yes vercel env rm "$key" production --token "$VERCEL_TOKEN" --yes >/dev/null 2>&1 || true
    printf '%s' "$val" | npx --yes vercel env add "$key" production --token "$VERCEL_TOKEN" >/dev/null
  }

  for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY \
           SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_API_URL \
           NEXT_PUBLIC_SOCKET_URL NEXT_PUBLIC_SITE_URL; do
    push_env "$k"
  done

  log "  -> vercel pull (production env)"
  npx --yes vercel pull --yes --environment=production --token "$VERCEL_TOKEN"

  log "  -> vercel build --prod"
  npx --yes vercel build --prod --token "$VERCEL_TOKEN"

  log "  -> vercel deploy --prebuilt --prod"
  local url
  url=$(npx --yes vercel deploy --prebuilt --prod --token "$VERCEL_TOKEN")
  log "Vercel live: $url"
}

deploy_railway() {
  log "==> Railway-Deploy (Backend + Realtime)"
  require RAILWAY_TOKEN

  ensure_npx_pkg @railway/cli

  export RAILWAY_TOKEN
  log "  -> railway up (Backend)"
  npx --yes @railway/cli up --service "${RAILWAY_BACKEND_SERVICE:-backend}" --detach || \
    warn "Backend-Service nicht gefunden – ggf. zuerst 'railway link' lokal ausführen."

  if [[ -d realtime ]]; then
    log "  -> railway up (Realtime)"
    ( cd realtime && npx --yes @railway/cli up --service "${RAILWAY_REALTIME_SERVICE:-realtime}" --detach ) || \
      warn "Realtime-Service nicht gefunden."
  fi

  log "Railway-Deploy gestartet (Status im Railway-Dashboard verfolgen)."
}

deploy_supabase() {
  log "==> Supabase Migrations"
  require SUPABASE_ACCESS_TOKEN
  require SUPABASE_PROJECT_REF

  ensure_npx_pkg supabase

  export SUPABASE_ACCESS_TOKEN
  log "  -> supabase link --project-ref $SUPABASE_PROJECT_REF"
  npx --yes supabase link --project-ref "$SUPABASE_PROJECT_REF" \
    ${SUPABASE_DB_PASSWORD:+--password "$SUPABASE_DB_PASSWORD"} >/dev/null

  log "  -> supabase db push"
  npx --yes supabase db push \
    ${SUPABASE_DB_PASSWORD:+--password "$SUPABASE_DB_PASSWORD"}

  log "Supabase-Migrations angewendet."
}

case "$TARGET" in
  all)      deploy_supabase; deploy_vercel; deploy_railway ;;
  vercel)   deploy_vercel ;;
  railway)  deploy_railway ;;
  supabase) deploy_supabase ;;
  *)        err "Unbekanntes Target: $TARGET"; exit 2 ;;
esac

log "Deploy-Run abgeschlossen."
