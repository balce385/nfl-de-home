import { describe, expect, it } from 'vitest';
import { rosterGroups, standingDe, teamIntro } from './team-page';

describe('standingDe', () => {
  it('uebersetzt ESPNs Platzierung', () => {
    expect(standingDe('1st in NFC West')).toBe('Platz 1 in der NFC West');
    expect(standingDe('3rd in AFC North')).toBe('Platz 3 in der AFC North');
    expect(standingDe('T-2nd in AFC East')).toBe('geteilter Platz 2 in der AFC East');
  });
  it('laesst Unbekanntes stehen', () => {
    expect(standingDe('')).toBe('');
    expect(standingDe('Clinched Division')).toBe('Clinched Division');
  });
});

describe('rosterGroups', () => {
  it('flacht ab, sortiert nach Nummer, verwirft leere Gruppen', () => {
    const groups = rosterGroups([
      {
        position: 'offense',
        items: [
          { fullName: 'Christian McCaffrey', jersey: '23', position: { abbreviation: 'RB' } },
          { fullName: 'Brock Purdy', jersey: '13', position: { abbreviation: 'QB' } },
        ],
      },
      { position: 'practiceSquad', items: [] },
    ]);
    expect(groups).toEqual([
      {
        key: 'offense',
        label: 'Offense',
        players: [
          { name: 'Brock Purdy', position: 'QB', jersey: '13' },
          { name: 'Christian McCaffrey', position: 'RB', jersey: '23' },
        ],
      },
    ]);
  });
});

describe('teamIntro', () => {
  const base = {
    abbr: 'KC',
    name: 'Kansas City Chiefs',
    shortName: 'Chiefs',
    record: '2-0',
    standingSummary: '1st in AFC West',
    pointsFor: 51,
    pointsAgainst: 30,
    gamesPlayed: true,
    venue: { name: 'GEHA Field at Arrowhead Stadium', location: 'Kansas City, Missouri', capacity: 76416 },
    founded: 1960,
    coach: { name: 'Andy Reid', experience: 27 },
    next: { opponentName: 'Denver Broncos', home: true, when: 'So., 28. Sep., 22:25 Uhr' },
  };

  it('nennt Division, Stadion, Bilanz, naechstes Spiel und den Deutschland-Bezug', () => {
    const text = teamIntro(base).join(' ');
    expect(text).toContain('in der AFC West und wurden 1960 gegründet');
    expect(text).toContain('(76.416 Plätze)');
    expect(text).toContain('Bilanz von 2-0 (Platz 1 in der AFC West)');
    expect(text).toContain('zu Hause gegen die Denver Broncos');
    expect(text).toContain('mit 27 Jahren Erfahrung als NFL-Cheftrainer');
    expect(text).toContain('Global Markets Program');
  });

  it('kommt ohne Spiele, Trainer und Deutschland-Rechte aus', () => {
    const text = teamIntro({ ...base, abbr: 'LV', gamesPlayed: false, coach: null, next: null }).join(' ');
    expect(text).toContain('noch kein Spiel');
    expect(text).not.toContain('Head Coach');
    expect(text).not.toContain('Global Markets');
  });
});
