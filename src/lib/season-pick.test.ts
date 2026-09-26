import { describe, expect, it } from 'vitest';
import { pickSeason } from './season-pick';

const qbs = (season: number, volumes: number[]) => volumes.map((volume) => ({ season, volume }));

describe('pickSeason', () => {
  it('volle Saison: feste Schwelle', () => {
    const rows = qbs(2025, [600, 550, 500, 120, 90, 40]);
    expect(pickSeason(rows, 100, 3)).toEqual({ season: 2025, threshold: 100 });
  });

  it('Saisonstart mit echten Zahlen vom 26.09.2026: Ausreisser verschiebt nichts', () => {
    // Jordan Love hatte nach drei Spielen 124 Wuerfe, die meisten Starter nach
    // zwei Spielen 50-65. Brock Purdy (56) muss in der Rangliste stehen.
    const season2026 = [
      124, 93, 90, 79, 77, 74, 73, 66, 65, 65, 65, 62, 62, 62, 60, 59, 59, 56, 56, 56, 55, 55,
      54, 52, 52, 52, 51, 50, 48, 39, 39, 34, 27, 25,
    ];
    const rows = [...qbs(2026, season2026), ...qbs(2025, [600, 550, 500])];
    const picked = pickSeason(rows, 100, 16);
    expect(picked).toEqual({ season: 2026, threshold: 30 });
    expect(season2026.filter((v) => v >= picked!.threshold)).toHaveLength(32);
  });

  it('zu wenige Spieler in der neuen Saison: Vorsaison bleibt', () => {
    const rows = [...qbs(2026, [40, 12]), ...qbs(2025, [600, 550, 500])];
    expect(pickSeason(rows, 100, 3)).toEqual({ season: 2025, threshold: 100 });
  });

  it('keine Daten', () => {
    expect(pickSeason([], 100, 3)).toBeNull();
    expect(pickSeason([{ season: 2026, volume: null }], 100, 1)).toBeNull();
  });
});
