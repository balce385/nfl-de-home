import { describe, it, expect } from 'vitest';
import { TEAM_FACTS } from '@/data/team-facts';

const CODES = [
  'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND',
  'JAX','KC','LV','LAC','LAR','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SF','SEA',
  'TB','TEN','WAS',
];

describe('TEAM_FACTS', () => {
  it('kennt genau die 32 NFL-Teams', () => {
    expect(Object.keys(TEAM_FACTS).sort()).toEqual([...CODES].sort());
  });

  it('hat für jedes Team vollständige Stammdaten', () => {
    for (const [code, f] of Object.entries(TEAM_FACTS)) {
      expect(f.espnId, `${code}: espnId`).toMatch(/^\d+$/);
      expect(f.stadium.length, `${code}: stadium`).toBeGreaterThan(3);
      expect(f.location, `${code}: location`).toContain(',');
      expect(f.website, `${code}: website`).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
    }
  });

  it('hält Kapazität und Gründungsjahr in plausiblen Grenzen', () => {
    for (const [code, f] of Object.entries(TEAM_FACTS)) {
      expect(f.capacity, `${code}: capacity`).toBeGreaterThan(50_000);
      expect(f.capacity, `${code}: capacity`).toBeLessThan(110_000);
      expect(f.founded, `${code}: founded`).toBeGreaterThan(1890);
      expect(f.founded, `${code}: founded`).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });

  it('vergibt jede ESPN-Team-ID nur einmal', () => {
    const ids = Object.values(TEAM_FACTS).map((f) => f.espnId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('führt für HOU, LAC und LAR das aktuelle Stadion, nicht das von ESPN', () => {
    // ESPNs Core-API nennt hier noch Reliant Stadium bzw. die Spielstätten
    // von vor dem Umzug 2020. Diese Werte sind der Grund für die Datei.
    expect(TEAM_FACTS.HOU.stadium).toBe('NRG Stadium');
    expect(TEAM_FACTS.LAC.stadium).toBe('SoFi Stadium');
    expect(TEAM_FACTS.LAR.stadium).toBe('SoFi Stadium');
    expect(TEAM_FACTS.LAC.indoor).toBe(true);
  });
});
