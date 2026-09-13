import { describe, expect, it } from 'vitest';
import { formationLabel, groupDepthChart } from './depth-chart';

const rows = [
  { formation: 'Special Teams', position: 'PK', slot: 1, depth_position: 1, name: 'Harrison Butker' },
  { formation: 'Base 4-3 D', position: 'MLB', slot: 5, depth_position: 1, name: 'Nick Bolton' },
  { formation: '3WR 1TE', position: 'WR', slot: 3, depth_position: 1, name: 'Xavier Worthy' },
  { formation: '3WR 1TE', position: 'QB', slot: 1, depth_position: 2, name: 'Gardner Minshew' },
  { formation: '3WR 1TE', position: 'QB', slot: 1, depth_position: 1, name: 'Patrick Mahomes' },
  { formation: '3WR 1TE', position: 'WR', slot: 2, depth_position: 2, name: 'Nur Backup' },
];

describe('groupDepthChart', () => {
  const groups = groupDepthChart(rows);

  it('ordnet Offense vor Defense vor Special Teams', () => {
    expect(groups.map((g) => g.label)).toEqual(['Offense · 3WR 1TE', 'Defense · 4-3', 'Special Teams']);
  });

  it('sortiert nach Slot und reiht Spieler nach Rang', () => {
    expect(groups[0].lines.map((l) => [l.position, l.slot])).toEqual([
      ['QB', 1],
      ['WR', 2],
      ['WR', 3],
    ]);
    expect(groups[0].lines[0].players).toEqual(['Patrick Mahomes', 'Gardner Minshew']);
  });

  it('lässt einen fehlenden Starter leer, statt den Backup aufrücken zu lassen', () => {
    expect(groups[0].lines[1].players).toEqual([null, 'Nur Backup']);
  });
});

describe('formationLabel', () => {
  it('erkennt 3-4- und 4-3-Defense', () => {
    expect(formationLabel('Base 3-4 D')).toBe('Defense · 3-4');
    expect(formationLabel('Base 4-3 D')).toBe('Defense · 4-3');
  });
});
