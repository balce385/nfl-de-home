import { NextRequest, NextResponse } from 'next/server';
import { getTeamProfile } from '@/lib/nfl-live';

/**
 * Steckbrief eines Teams: Stadion, Cheftrainer, Gründung, Vereinsseite.
 *
 * Server-seitig, weil der Cheftrainer über ESPNs Core-API kommt und die
 * keine CORS-Header sendet.
 *
 *   GET /api/team-profile?team=KC
 */
export async function GET(req: NextRequest) {
  const team = new URL(req.url).searchParams.get('team')?.toUpperCase();
  if (!team) {
    return NextResponse.json({ error: 'team required' }, { status: 400 });
  }

  const profile = await getTeamProfile(team);
  if (!profile) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 });
  }

  return NextResponse.json(profile, {
    headers: {
      // Nur der Trainer ist beweglich, der Rest steht fest.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
