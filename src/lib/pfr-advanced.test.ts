import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPressureLeaders } from './pfr-advanced';

const HEAD =
  'player,team,pass_attempts,drop_pct,bad_throw_pct,season,pocket_time,times_blitzed,pressure_pct,on_tgt_pct';

function csv(...rows: string[]) {
  return [HEAD, ...rows].join('\n');
}

function mockCsv(body: string, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, text: async () => body }));
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
