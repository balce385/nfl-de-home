import { describe, expect, it } from 'vitest';
import {
  mapEspnItem,
  matchesQuery,
  mergePlayers,
  normalizeName,
  type SearchPlayer,
} from './player-search';

const p = (name: string, espnId: string | null, active = true): SearchPlayer => ({
  espnId,
  name,
  position: 'QB',
  team: 'SF',
  jersey: null,
  headshot: null,
  active,
});

describe('normalizeName', () => {
  it('ignoriert Akzente, Apostrophe und Punkte', () => {
    expect(normalizeName("Ja'Marr Chase")).toBe('jamarr chase');
    expect(normalizeName('A.J. Brown')).toBe('aj brown');
    expect(normalizeName('  José   Ramírez ')).toBe('jose ramirez');
  });
});

describe('matchesQuery', () => {
  const teams = new Set(['SF', 'NE', 'KC']);
  const purdy = { name: 'Brock Purdy', team: 'SF', pos: 'QB' };
  const stone = { name: 'Rashad Stone', team: 'KC', pos: 'CB' };

  it('findet Namensteile, gross/klein egal', () => {
    expect(matchesQuery(purdy, 'brock pur', teams)).toBe(true);
    expect(matchesQuery(purdy, 'Brock Purdy', teams)).toBe(true);
    expect(matchesQuery(purdy, 'mahomes', teams)).toBe(false);
  });

  it('Teamkuerzel filtert nur nach Team', () => {
    expect(matchesQuery(purdy, 'sf', teams)).toBe(true);
    expect(matchesQuery(stone, 'NE', teams)).toBe(false);
  });

  it('Positionskuerzel', () => {
    expect(matchesQuery(stone, 'cb', teams)).toBe(true);
  });
});

describe('mapEspnItem', () => {
  it('liest Team, Position und Foto; ESPN-Kuerzel werden umgesetzt', () => {
    const item = {
      id: 4361741,
      displayName: 'Brock Purdy',
      jersey: '13',
      position: { abbreviation: 'QB' },
      teamRelationships: [{ core: { abbreviation: 'WSH' } }],
      headshot: { href: 'https://a.espncdn.com/x.png' },
      isActive: true,
      isRetired: false,
    };
    expect(mapEspnItem(item)).toEqual({
      espnId: '4361741',
      name: 'Brock Purdy',
      position: 'QB',
      team: 'WAS',
      jersey: '13',
      headshot: 'https://a.espncdn.com/x.png',
      active: true,
    });
    expect(mapEspnItem({ displayName: 'ohne id' })).toBeNull();
  });
});

describe('mergePlayers', () => {
  it('entfernt Dubletten ueber ID und Namen, Aktive zuerst', () => {
    const espn = [p('Joe Montana', '1', false), p('Brock Purdy', '4361741')];
    const db = [p('Brock Purdy', null), p('Brock Bowers', '5')];
    expect(mergePlayers(espn, db).map((x) => x.name)).toEqual([
      'Brock Purdy',
      'Brock Bowers',
      'Joe Montana',
    ]);
  });
});
