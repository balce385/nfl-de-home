import { describe, expect, it } from 'vitest';
import { rosterGroups, standingDe } from './team-page';

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
