import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getPressureLeaders,
  getReceivingAdvanced,
  getRushingAdvanced,
  getDefenseAdvanced,
  getQbr,
} from './pfr-advanced';

const HEAD =
  'player,team,pass_attempts,drop_pct,bad_throw_pct,season,pocket_time,times_blitzed,pressure_pct,on_tgt_pct';

function csv(...rows: string[]) {
  return [HEAD, ...rows].join('\n');
}

function mockCsv(body: string, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, text: async () => body }));
}

/** Baut eine CSV aus Kopfzeile und Zeilen-Objekten — spart das Zählen von Kommas. */
function table(head: string, rows: Record<string, string | number>[]) {
  const cols = head.split(',');
  const lines = rows.map((r) => cols.map((c) => String(r[c] ?? '')).join(','));
  return [head, ...lines].join('\n');
}

afterEach(() => vi.unstubAllGlobals());

describe('getPressureLeaders', () => {
  it('nimmt nur die jüngste Saison im Datensatz', async () => {
    mockCsv(
      csv(
        'Alt Spieler,KC,400,4.0,15.0,2024,2.5,100,20.0,75.0',
        'Neu Spieler,KC,400,4.0,15.0,2025,2.5,100,20.0,75.0'
      )
    );
    const rows = await getPressureLeaders();
    expect(rows.map((r) => r.player)).toEqual(['Neu Spieler']);
    expect(rows[0].season).toBe(2025);
  });

  it('sortiert nach Druckrate und wirft Kurzeinsätze raus', async () => {
    mockCsv(
      csv(
        'Wenig Würfe,KC,80,4.0,15.0,2025,2.5,100,99.0,75.0',
        'Ruhig,SF,300,4.0,15.0,2025,2.5,100,10.0,75.0',
        'Gehetzt,DAL,300,4.0,15.0,2025,2.5,100,30.0,75.0'
      )
    );
    const rows = await getPressureLeaders();
    expect(rows.map((r) => r.player)).toEqual(['Gehetzt', 'Ruhig']);
  });

  it('übersetzt das Rams-Kürzel und leere Werte', async () => {
    mockCsv(csv('Matthew Stafford,LA,300,,,2025,,,18.5,'));
    const [row] = await getPressureLeaders();
    expect(row.team).toBe('LAR');
    expect(row.onTargetPct).toBeNull();
    expect(row.dropPct).toBeNull();
    expect(row.pressurePct).toBe(18.5);
  });

  it('liefert eine leere Liste, wenn nflverse nicht antwortet', async () => {
    mockCsv('', false);
    expect(await getPressureLeaders()).toEqual([]);
  });
});

const REC_HEAD =
  'season,player,pfr_id,tm,age,pos,g,gs,tgt,rec,yds,td,x1d,ybc,ybc_r,yac,yac_r,adot,brk_tkl,rec_br,drop,drop_percent,int,rat';

describe('getReceivingAdvanced', () => {
  it('rechnet die Drop-Quote von Anteil auf Prozent', async () => {
    // PFR liefert hier 0,024 — die Oberfläche zeigt aber Prozent an.
    mockCsv(
      table(REC_HEAD, [
        { season: 2025, player: 'Puka Nacua', pfr_id: 'NacuPu00', tm: 'LA', pos: 'WR', g: 17, tgt: 166, rec: 120, yds: 1500, drop_percent: 0.024, adot: 9.3 },
      ])
    );
    const [row] = await getReceivingAdvanced();
    expect(row.stats.drop_pct).toBeCloseTo(2.4, 5);
    expect(row.stats.adot).toBe(9.3);
    expect(row.team).toBe('LAR');
  });

  it('führt einen Spieler mit Teamwechsel nur einmal, mit der Saisonsumme', async () => {
    mockCsv(
      table(REC_HEAD, [
        { season: 2025, player: 'Wechsler', pfr_id: 'WechWe00', tm: '2TM', pos: 'WR', g: 17, tgt: 120, yds: 900 },
        { season: 2025, player: 'Wechsler', pfr_id: 'WechWe00', tm: 'NYJ', pos: 'WR', g: 9, tgt: 70, yds: 500 },
        { season: 2025, player: 'Wechsler', pfr_id: 'WechWe00', tm: 'PIT', pos: 'WR', g: 8, tgt: 50, yds: 400 },
      ])
    );
    const rows = await getReceivingAdvanced();
    expect(rows).toHaveLength(1);
    expect(rows[0].team).toBe('2TM');
    expect(rows[0].stats.tgt).toBe(120);
  });

  it('sortiert nach Yards und filtert zu wenige Anspiele weg', async () => {
    mockCsv(
      table(REC_HEAD, [
        { season: 2025, player: 'Kaum gespielt', pfr_id: 'a', tm: 'KC', tgt: 5, yds: 9999 },
        { season: 2025, player: 'Zweiter', pfr_id: 'b', tm: 'KC', tgt: 100, yds: 800 },
        { season: 2025, player: 'Erster', pfr_id: 'c', tm: 'KC', tgt: 100, yds: 1200 },
      ])
    );
    const rows = await getReceivingAdvanced();
    expect(rows.map((r) => r.player)).toEqual(['Erster', 'Zweiter']);
  });
});

describe('getRushingAdvanced', () => {
  it('trennt Yards vor und nach dem Kontakt', async () => {
    const head =
      'season,player,pfr_id,tm,age,pos,g,gs,att,yds,td,x1d,ybc,ybc_att,yac,yac_att,brk_tkl,att_br';
    mockCsv(
      table(head, [
        { season: 2025, player: 'Jonathan Taylor', pfr_id: 'TaylJo02', tm: 'IND', pos: 'RB', g: 17, att: 323, yds: 1500, ybc_att: 2.5, yac_att: 2.4, brk_tkl: 27, att_br: 12 },
        { season: 2025, player: 'Zu wenig', pfr_id: 'x', tm: 'IND', pos: 'WR', g: 3, att: 4, yds: 20 },
      ])
    );
    const rows = await getRushingAdvanced();
    expect(rows).toHaveLength(1);
    expect(rows[0].stats.ybc_att).toBe(2.5);
    expect(rows[0].stats.yac_att).toBe(2.4);
  });
});

const DEF_HEAD =
  'season,player,pfr_id,tm,age,pos,g,gs,int,tgt,cmp,cmp_percent,yds,yds_cmp,yds_tgt,td,rat,dadot,air,yac,bltz,hrry,qbkd,sk,prss,comb,m_tkl,m_tkl_percent';

describe('getDefenseAdvanced', () => {
  it('nimmt Coverage-Spieler und Pass-Rusher auf und rechnet Anteile in Prozent', async () => {
    mockCsv(
      table(DEF_HEAD, [
        // Cornerback: viele Anspiele, kaum Druck.
        { season: 2025, player: 'Cover Corner', pfr_id: 'a', tm: 'KC', pos: 'CB', g: 17, tgt: 90, cmp_percent: 0.6, m_tkl_percent: 0.05, rat: 70.5, prss: 1 },
        // Defensive End: kein Anspiel, viel Druck — muss trotzdem drin sein.
        { season: 2025, player: 'Edge Rusher', pfr_id: 'b', tm: 'SF', pos: 'DE', g: 17, tgt: 2, prss: 60, sk: 15 },
        // Weder noch: fliegt raus.
        { season: 2025, player: 'Ersatzmann', pfr_id: 'c', tm: 'SF', pos: 'DE', g: 4, tgt: 3, prss: 2 },
      ])
    );
    const rows = await getDefenseAdvanced();
    expect(rows.map((r) => r.player)).toEqual(['Edge Rusher', 'Cover Corner']);
    const corner = rows.find((r) => r.player === 'Cover Corner')!;
    expect(corner.stats.cmp_pct_allowed).toBeCloseTo(60, 5);
    expect(corner.stats.missed_tackle_pct).toBeCloseTo(5, 5);
  });
});

describe('getQbr', () => {
  const head =
    'season,season_type,game_week,team_abb,player_id,name_short,rank,qbr_total,pts_added,qb_plays,epa_total,pass,run,exp_sack,penalty,qbr_raw,sack,name_first,name_last,name_display,headshot_href,team,qualified';

  it('nimmt nur die Saisonsumme der Regular Season und sortiert nach QBR', async () => {
    mockCsv(
      table(head, [
        { season: 2026, season_type: 'Regular', game_week: 'Season Total', team_abb: 'BUF', player_id: '1', name_display: 'Josh Allen', qbr_total: 72.1, qb_plays: 300 },
        { season: 2026, season_type: 'Regular', game_week: '3', team_abb: 'BUF', player_id: '1', name_display: 'Josh Allen', qbr_total: 99.9 },
        { season: 2026, season_type: 'Playoffs', game_week: 'Season Total', team_abb: 'BUF', player_id: '1', name_display: 'Josh Allen', qbr_total: 99.9 },
        { season: 2026, season_type: 'Regular', game_week: 'Season Total', team_abb: 'WSH', player_id: '2', name_display: 'Jayden Daniels', qbr_total: 80.4 },
      ])
    );
    const rows = await getQbr();
    expect(rows.map((r) => r.player)).toEqual(['Jayden Daniels', 'Josh Allen']);
    // ESPN schreibt Washington als WSH, die App als WAS.
    expect(rows[0].team).toBe('WAS');
    expect(rows[0].season).toBe(2026);
  });
});
