import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { groupDepthChart, type DepthRow } from '@/lib/depth-chart';
import { TEAM_FACTS } from '@/data/team-facts';

/**
 * Depth Chart eines Teams: Starter und erster Backup je Position.
 *
 * Quelle ist die Tabelle depth_charts, die der tägliche Scraper aus nflverse
 * füllt — nur der jüngste Stand, als week = 0.
 *
 *   GET /api/team-depth?team=KC
 */
export async function GET(req: NextRequest) {
  const team = new URL(req.url).searchParams.get('team')?.toUpperCase();
  if (!team || !TEAM_FACTS[team]) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 });
  }

  const { data, error } = await createClient()
    .from('depth_charts')
    .select('season, formation, position, slot, depth_position, as_of, players(full_name)')
    .eq('team_id', team)
    .lte('depth_position', 2)
    .order('season', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'depth chart unavailable' }, { status: 502 });
  }

  const all = (data ?? []) as unknown as Record<string, any>[];
  const current = all.filter((r) => r.season === all[0]?.season);

  return NextResponse.json(
    {
      asOf: current.reduce<string | null>((max, r) => (!max || r.as_of > max ? r.as_of : max), null),
      groups: groupDepthChart(
        current.map(
          (r): DepthRow => ({
            formation: r.formation,
            position: r.position,
            slot: r.slot,
            depth_position: r.depth_position,
            name: r.players?.full_name ?? 'Unbekannt',
          })
        )
      ),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
