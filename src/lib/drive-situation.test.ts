import { describe, it, expect } from 'vitest';
import { fieldPercent, downText } from './drive-situation';

describe('Feldposition', () => {
  it('eigene Haelfte: Yard-Linie ist der zurueckgelegte Weg', () => {
    // NE hat den Ball an der eigenen 27 -> noch 73 Yards bis zur Endzone.
    expect(fieldPercent({ yardLine: 27, possession: 'NE', possessionText: 'NE 27' })).toBe(27);
  });

  it('gegnerische Haelfte: Yard-Linie zaehlt rueckwaerts', () => {
    // NE hat den Ball an der SEA 27 -> nur noch 27 Yards, also 73 % geschafft.
    expect(fieldPercent({ yardLine: 27, possession: 'NE', possessionText: 'SEA 27' })).toBe(73);
  });

  it('Mittellinie liegt in beiden Faellen bei 50', () => {
    expect(fieldPercent({ yardLine: 50, possession: 'NE', possessionText: 'NE 50' })).toBe(50);
    expect(fieldPercent({ yardLine: 50, possession: 'NE', possessionText: 'SEA 50' })).toBe(50);
  });

  it('Red Zone des Gegners liegt ueber 80', () => {
    const pct = fieldPercent({ yardLine: 8, possession: 'KC', possessionText: 'DEN 8' })!;
    expect(pct).toBe(92);
    expect(pct).toBeGreaterThan(80);
  });

  it('eigene Red Zone liegt unter 20', () => {
    expect(fieldPercent({ yardLine: 8, possession: 'KC', possessionText: 'KC 8' })).toBe(8);
  });

  it('ignoriert Gross- und Kleinschreibung', () => {
    expect(fieldPercent({ yardLine: 30, possession: 'ne', possessionText: 'NE 30' })).toBe(30);
  });

  it('faellt ohne Haelften-Angabe auf die nackte Yard-Linie zurueck', () => {
    expect(fieldPercent({ yardLine: 35, possession: 'NE', possessionText: null })).toBe(35);
  });

  it('gibt ohne Ballbesitz oder Yard-Linie null zurueck', () => {
    expect(fieldPercent({ yardLine: null, possession: 'NE', possessionText: 'NE 20' })).toBeNull();
    expect(fieldPercent({ yardLine: 20, possession: null, possessionText: 'NE 20' })).toBeNull();
  });

  it('bleibt zwischen 0 und 100', () => {
    expect(fieldPercent({ yardLine: 120, possession: 'NE', possessionText: 'NE 120' })).toBe(100);
    expect(fieldPercent({ yardLine: -5, possession: 'NE', possessionText: 'NE -5' })).toBe(0);
  });
});

describe('Down und Distance', () => {
  it('schreibt die gaengigen Downs aus', () => {
    expect(downText(1, 10)).toBe('1st & 10');
    expect(downText(3, 7)).toBe('3rd & 7');
    expect(downText(4, 1)).toBe('4th & 1');
  });

  it('nennt Distanz 0 "Goal"', () => {
    expect(downText(2, 0)).toBe('2nd & Goal');
  });

  it('nutzt den ESPN-Text, wenn Werte fehlen', () => {
    expect(downText(null, null, '3rd & 7')).toBe('3rd & 7');
    expect(downText(null, null)).toBeNull();
  });
});
