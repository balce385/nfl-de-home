import { createClient } from '@/lib/supabase/server';
import { passerRating } from '@/lib/nfl-stats';

/**
 * Lädt die Next-Gen-Stats-Saisonwerte (week = 0) aus der Datenbank und
 * ergänzt sie um das selbst gerechnete Passer Rating.
 */

export type AdvancedRow = {
  player_id: string;
  name: string;
  position: string | null;
  team_id: string | null;
  season: number;
  headshot_url: string | null;

  // Passspiel
  attempts: number | null;
  completions: number | null;
  pass_yards: number | null;
  pass_touchdowns: number | null;
  interceptions: number | null;
  passer_rating: number | null;
  cpoe: number | null;
  avg_time_to_throw: number | null;
  aggressiveness: number | null;

  // Passempfang
  targets: number | null;
  receptions: number | null;
  rec_yards: number | null;
  rec_touchdowns: number | null;
  catch_pct: number | null;
  avg_separation: number | null;
  avg_cushion: number | null;
  avg_yac_above_expectation: number | null;

  // Laufspiel
  rush_attempts: number | null;
  rush_yards: number | null;
  rush_touchdowns: number | null;
  pct_attempts_8plus_box: number | null;
  avg_time_to_los: number | null;
  rush_yards_over_expected_per_att: number | null;
};

export type PositionGroup = 'QB' | 'REC' | 'RUSH';

const GROUP_POSITIONS: Record<PositionGroup, string[]> = {
  QB: ['QB'],
  REC: ['WR', 'TE'],
  RUSH: ['RB', 'FB', 'HB'],
};

/** Mindestvolumen, damit Kleinststichproben die Rangliste nicht verzerren. */
const MIN_VOLUME: Record<PositionGroup, { column: string; value: number }> = {
  QB: { column: 'attempts', value: 100 },
  REC: { column: 'targets', value: 30 },
  RUSH: { column: 'rush_attempts', value: 40 },
};

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export type TopPasser = {
  name: string;
  team: string | null;
  headshot: string | null;
  season: number;
  passYards: number;
  touchdowns: number;
  interceptions: number;
  passerRating: number | null;
};

/**
 * Passing-Leader der zuletzt erfassten Saison.
 *
 * Ersetzt ESPNs `/leaders`-Endpunkt, der seit September 2026 nur noch
 * `{"code":404}` liefert. Die Zahlen kommen aus den Next Gen Stats in
 * `player_advanced`, das Passer Rating rechnen wir selbst.
 */
export async function getTopPasser(): Promise<TopPasser | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from('player_advanced')
    .select(
      'season, team_id, attempts, completions, pass_yards, pass_touchdowns, interceptions, ' +
        'players(full_name, headshot_url)'
    )
    .eq('week', 0)
    .eq('position', 'QB')
    .order('season', { ascending: false })
    .order('pass_yards', { ascending: false })
    .limit(1);

  const row = (data as unknown as Record<string, any>[] | null)?.[0];
  if (!row) return null;

  const attempts = num(row.attempts);
  const completions = num(row.completions);
  const passYards = num(row.pass_yards) ?? 0;
  const tds = num(row.pass_touchdowns) ?? 0;
  const ints = num(row.interceptions) ?? 0;

  return {
    name: row.players?.full_name ?? 'Unbekannt',
    team: row.team_id ?? null,
    headshot: row.players?.headshot_url ?? null,
    season: Number(row.season),
    passYards,
    touchdowns: tds,
    interceptions: ints,
    passerRating:
      attempts && completions !== null
        ? passerRating(completions, attempts, passYards, tds, ints)
        : null,
  };
}

export async function getAdvancedStats(group: PositionGroup): Promise<{
  rows: AdvancedRow[];
  season: number | null;
}> {
  const supabase = createClient();

  // Neueste Saison ermitteln, für die überhaupt Werte vorliegen.
  const { data: seasonRow } = await supabase
    .from('player_advanced')
    .select('season')
    .eq('week', 0)
    .order('season', { ascending: false })
    .limit(1)
    .maybeSingle();

  const season = seasonRow?.season ?? null;
  if (!season) return { rows: [], season: null };

  const min = MIN_VOLUME[group];
  const { data, error } = await supabase
    .from('player_advanced')
    .select(
      'player_id, position, team_id, season, attempts, completions, pass_yards, pass_touchdowns, ' +
        'interceptions, passer_rating, cpoe, avg_time_to_throw, aggressiveness, targets, receptions, ' +
        'rec_yards, rec_touchdowns, catch_pct, avg_separation, avg_cushion, avg_yac_above_expectation, ' +
        'rush_attempts, rush_yards, rush_touchdowns, pct_attempts_8plus_box, avg_time_to_los, ' +
        'rush_yards_over_expected_per_att, players(full_name, headshot_url)'
    )
    .eq('week', 0)
    .eq('season', season)
    .in('position', GROUP_POSITIONS[group])
    .gte(min.column, min.value)
    .limit(200);

  if (error || !data) return { rows: [], season };

  // Der generierte Supabase-Typ kommt mit dem eingebetteten players(...)-Join
  // nicht zurecht; die Felder werden unten einzeln geprüft und konvertiert.
  const raw = data as unknown as Record<string, unknown>[];

  const rows: AdvancedRow[] = raw.map((r) => {
    const player = r.players as { full_name?: string; headshot_url?: string } | null;
    const attempts = num(r.attempts);
    const completions = num(r.completions);
    const passYards = num(r.pass_yards);
    const passTds = num(r.pass_touchdowns);
    const ints = num(r.interceptions);

    // Eigene Rechnung nach der offiziellen Formel; der von der NFL gelieferte
    // Wert dient nur als Rückfallebene.
    const computed =
      attempts && completions !== null && passYards !== null && passTds !== null && ints !== null
        ? passerRating(completions, attempts, passYards, passTds, ints)
        : null;

    return {
      player_id: String(r.player_id),
      name: player?.full_name ?? String(r.player_id),
      position: (r.position as string) ?? null,
      team_id: (r.team_id as string) ?? null,
      season: Number(r.season),
      headshot_url: player?.headshot_url ?? null,
      attempts,
      completions,
      pass_yards: passYards,
      pass_touchdowns: passTds,
      interceptions: ints,
      passer_rating: computed ?? num(r.passer_rating),
      cpoe: num(r.cpoe),
      avg_time_to_throw: num(r.avg_time_to_throw),
      aggressiveness: num(r.aggressiveness),
      targets: num(r.targets),
      receptions: num(r.receptions),
      rec_yards: num(r.rec_yards),
      rec_touchdowns: num(r.rec_touchdowns),
      catch_pct: num(r.catch_pct),
      avg_separation: num(r.avg_separation),
      avg_cushion: num(r.avg_cushion),
      avg_yac_above_expectation: num(r.avg_yac_above_expectation),
      rush_attempts: num(r.rush_attempts),
      rush_yards: num(r.rush_yards),
      rush_touchdowns: num(r.rush_touchdowns),
      pct_attempts_8plus_box: num(r.pct_attempts_8plus_box),
      avg_time_to_los: num(r.avg_time_to_los),
      rush_yards_over_expected_per_att: num(r.rush_yards_over_expected_per_att),
    };
  });

  return { rows, season };
}
