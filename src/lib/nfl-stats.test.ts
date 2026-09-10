import { describe, it, expect } from 'vitest';
import {
  passerRating,
  passerRatingParts,
  adjustedNetYardsPerAttempt,
  epaPerPlay,
  formatMetric,
  PASSER_RATING_MAX,
} from './nfl-stats';

/**
 * Referenzwerte aus dem offiziellen Next-Gen-Stats-Datensatz der NFL
 * (nflverse-data, nextgen_stats/ngs_passing.csv.gz, Saison 2016).
 * Spalten: Name, ATT, CMP, YDS, TD, INT, passer_rating der NFL.
 */
const OFFIZIELL: [string, number, number, number, number, number, number][] = [
  ['Drew Brees', 673, 471, 5208, 37, 15, 101.687097573056],
  ['Joe Flacco', 672, 436, 4317, 20, 15, 83.5379464285714],
  ['Russell Wilson', 546, 353, 4219, 21, 11, 92.5824175824176],
  ['Josh McCown', 165, 90, 1100, 6, 6, 72.2853535353535],
  ['Eli Manning', 598, 377, 4027, 26, 16, 86.0228539576366],
  ['Marcus Mariota', 451, 276, 3426, 26, 9, 95.6347006651885],
];

describe('Passer Rating', () => {
  it.each(OFFIZIELL)(
    'trifft den offiziellen NFL-Wert für %s',
    (_name, att, cmp, yds, td, int, erwartet) => {
      expect(passerRating(cmp, att, yds, td, int)).toBeCloseTo(erwartet, 6);
    }
  );

  it('perfektes Rating ist 158,3', () => {
    // 2,375 in allen vier Faktoren: 77,5 % Completions, 12,5 Yards/Versuch,
    // 11,875 % Touchdowns, keine Interception.
    const rating = passerRating(31, 40, 500, 5, 0);
    expect(rating).toBeCloseTo(PASSER_RATING_MAX, 1);
  });

  it('braucht 12,5 Yards pro Versuch fuer den maximalen Yards-Faktor', () => {
    // Belegt den Multiplikator 0,25: mit 0,2 waere hier erst bei 14,875
    // Yards pro Versuch Schluss und das Gesamtrating rund 4 Punkte niedriger.
    expect(passerRatingParts(1, 1, 12.5, 0, 0)!.yards).toBeCloseTo(2.375, 10);
  });

  it('deckelt jeden Faktor bei 2,375 — auch bei absurden Eingaben', () => {
    const parts = passerRatingParts(100, 100, 5000, 100, 0)!;
    expect(parts.completion).toBe(2.375);
    expect(parts.yards).toBe(2.375);
    expect(parts.touchdowns).toBe(2.375);
    expect(parts.interceptions).toBe(2.375);
    expect(parts.rating).toBeCloseTo(PASSER_RATING_MAX, 1);
  });

  it('setzt negative Faktoren auf 0 statt ins Minus zu laufen', () => {
    // Nur Interceptions, keine Completions: alle Faktoren am Boden.
    const parts = passerRatingParts(0, 20, 0, 0, 10)!;
    expect(parts.completion).toBe(0);
    expect(parts.yards).toBe(0);
    expect(parts.touchdowns).toBe(0);
    expect(parts.interceptions).toBe(0);
    expect(parts.rating).toBe(0);
  });

  it('gibt ohne Passversuch null zurück statt durch null zu teilen', () => {
    expect(passerRating(0, 0, 0, 0, 0)).toBeNull();
    expect(passerRating(5, -3, 40, 1, 0)).toBeNull();
  });
});

describe('ANY/A', () => {
  it('rechnet Touchdowns, Interceptions und Sacks ein', () => {
    // (4000 + 20·30 − 45·10 − 200) / (500 + 30) = 3950/530
    expect(adjustedNetYardsPerAttempt(4000, 30, 10, 30, 200, 500)).toBeCloseTo(7.4528, 4);
  });

  it('bestraft Interceptions haerter als Touchdowns belohnen', () => {
    const mitTd = adjustedNetYardsPerAttempt(3000, 21, 10, 20, 130, 400)!;
    const mitInt = adjustedNetYardsPerAttempt(3000, 20, 11, 20, 130, 400)!;
    expect(mitTd - mitInt).toBeCloseTo(65 / 420, 6);
  });

  it('gibt ohne Dropbacks null zurück', () => {
    expect(adjustedNetYardsPerAttempt(0, 0, 0, 0, 0, 0)).toBeNull();
  });
});

describe('EPA pro Spielzug', () => {
  it('teilt die Summe durch die Anzahl', () => {
    expect(epaPerPlay(45.5, 100)).toBeCloseTo(0.455, 6);
  });
  it('vertraegt negative Summen', () => {
    expect(epaPerPlay(-12, 40)).toBeCloseTo(-0.3, 6);
  });
  it('gibt ohne Spielzuege null zurück', () => {
    expect(epaPerPlay(10, 0)).toBeNull();
  });
});

describe('Formatierung', () => {
  it('nutzt deutsches Zahlenformat und Einheit', () => {
    expect(formatMetric('passer_rating', 101.687)).toBe('101,7');
    expect(formatMetric('separation', 3.456)).toBe('3,46 yd');
    expect(formatMetric('time_to_throw', 2.7)).toBe('2,70s');
  });
  it('zeigt fehlende Werte als Gedankenstrich', () => {
    expect(formatMetric('cpoe', null)).toBe('—');
    expect(formatMetric('cpoe', undefined)).toBe('—');
    expect(formatMetric('cpoe', NaN)).toBe('—');
  });
});
