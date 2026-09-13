import { createClient } from '@/lib/supabase/server';

/**
 * Ergänzt die ESPN-Spielerkarte um nflverse-Daten aus Supabase: Combine-
 * Messwerte, Auszeichnungen aus dem Draft-Datensatz und den laufenden Vertrag
 * von OverTheCap.
 *
 * Verknüpft wird über players.espn_id → players.id (GSIS) bzw. players.pfr_id.
 * Die espn_id stammt aus den nflverse-Rostern, fehlt also bei Spielern ohne
 * aktuellen Kaderplatz — dann bleibt die Karte beim ESPN-Teil.
 */
export type PlayerExtras = {
  combine: {
    season: number;
    forty: number | null;
    bench: number | null;
    /** Zoll */
    vertical: number | null;
    /** Zoll */
    broadJump: number | null;
    cone: number | null;
    shuttle: number | null;
  } | null;
  honors: { probowls: number; allpro: number; seasonsStarted: number | null; hof: boolean } | null;
  contract: {
    team: string | null;
    yearSigned: number | null;
    years: number | null;
    /** Mio. US-Dollar */
    valueMusd: number | null;
    apyMusd: number | null;
    guaranteedMusd: number | null;
    /** Anteil am Salary Cap, 0..1 */
    capPct: number | null;
  } | null;
};

export const NO_EXTRAS: PlayerExtras = { combine: null, honors: null, contract: null };

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export async function getPlayerExtras(espnId: string): Promise<PlayerExtras> {
  const supabase = createClient();
  const { data: player } = await supabase
    .from('players')
    .select('id, pfr_id')
    .eq('espn_id', espnId)
    .limit(1)
    .maybeSingle();
  if (!player) return NO_EXTRAS;

  // IDs sind "00-0033873" bzw. "MahoPa00" — nichts, was den Filter aufbrechen könnte.
  const draftFilter = [`gsis_id.eq.${player.id}`, player.pfr_id && `pfr_id.eq.${player.pfr_id}`]
    .filter(Boolean)
    .join(',');

  const [combine, draft, contract] = await Promise.all([
    player.pfr_id
      ? supabase.from('player_combine').select('*').eq('pfr_id', player.pfr_id).maybeSingle()
      : { data: null },
    supabase
      .from('player_draft')
      .select('probowls, allpro, seasons_started, hof')
      .or(draftFilter)
      .limit(1)
      .maybeSingle(),
    supabase.from('player_contracts').select('*').eq('gsis_id', player.id).maybeSingle(),
  ]);

  const c = combine.data as Record<string, any> | null;
  const d = draft.data as Record<string, any> | null;
  const k = contract.data as Record<string, any> | null;

  return {
    combine: c
      ? {
          season: Number(c.season),
          forty: num(c.forty),
          bench: num(c.bench),
          vertical: num(c.vertical),
          broadJump: num(c.broad_jump),
          cone: num(c.cone),
          shuttle: num(c.shuttle),
        }
      : null,
    honors: d
      ? {
          probowls: num(d.probowls) ?? 0,
          allpro: num(d.allpro) ?? 0,
          seasonsStarted: num(d.seasons_started),
          hof: Boolean(d.hof),
        }
      : null,
    contract: k
      ? {
          team: k.team ?? null,
          yearSigned: num(k.year_signed),
          years: num(k.years),
          valueMusd: num(k.value_musd),
          apyMusd: num(k.apy_musd),
          guaranteedMusd: num(k.guaranteed_musd),
          capPct: num(k.apy_cap_pct),
        }
      : null,
  };
}
