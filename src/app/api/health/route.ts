import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Datenfrische der Scraper, fuer Uptime-Monitore: 200 = frisch, 503 = veraltet.
 *
 * Die Scraper liefen vom 24.08. bis 26.09.2026 unbemerkt nicht, weil GitHub den
 * Zeitplan nicht mehr ausloeste. Seitdem startet sie ein Cron auf dem VPS
 * (balce385/deploy-stack: crontab, scrape.sh) — dieser Endpunkt zeigt, ob er laeuft.
 *
 * ponytail: juengster Datensatz zweier Tabellen statt eigener Lauf-Tabelle.
 * Erkennt einen toten Zeitplan, nicht einzelne ausgefallene Scraper (die stehen
 * in /opt/stack/logs).
 */
const CHECKS = [
  // stuendlicher News-Lauf; created_at entsteht nur bei neuen Artikeln
  { name: 'news', table: 'articles', column: 'created_at', maxHours: 4 },
  // taeglicher Voll-Lauf; depth_charts wird dabei geloescht und neu eingefuegt
  { name: 'full', table: 'depth_charts', column: 'updated_at', maxHours: 30 },
] as const;

export async function GET() {
  const supabase = createClient();
  const now = Date.now();

  const checks = await Promise.all(
    CHECKS.map(async ({ name, table, column, maxHours }) => {
      const { data } = await supabase
        .from(table)
        .select(column)
        .order(column, { ascending: false })
        .limit(1)
        .maybeSingle();
      const latest = (data as Record<string, string> | null)?.[column] ?? null;
      const ageHours = latest ? (now - Date.parse(latest)) / 3_600_000 : null;
      return {
        name,
        latest,
        ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
        maxHours,
        ok: ageHours !== null && ageHours <= maxHours,
      };
    })
  );

  const ok = checks.every((c) => c.ok);
  return NextResponse.json(
    { ok, checks },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
