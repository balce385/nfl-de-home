import { describe, expect, it } from 'vitest';
import { cutAtWord, fitTitle, TITLE_MAX } from './seo';

describe('cutAtWord', () => {
  it('laesst kurze Texte stehen', () => {
    expect(cutAtWord('Chiefs gewinnen', 60)).toBe('Chiefs gewinnen');
  });
  it('kuerzt an der Wortgrenze mit Auslassungszeichen', () => {
    const out = cutAtWord('Die Kansas City Chiefs gewinnen ein enges Spiel gegen die Denver Broncos', 40);
    expect(out).toBe('Die Kansas City Chiefs gewinnen ein…');
    expect(out.length).toBeLessThanOrEqual(40);
  });
});

describe('fitTitle', () => {
  it('kurzer Titel bekommt die Marke ueber das Template', () => {
    expect(fitTitle('Purdy wirft vier Touchdowns')).toBe('Purdy wirft vier Touchdowns');
  });
  it('langer Titel ohne Marke und hoechstens 60 Zeichen', () => {
    const long =
      'Commanders-QB Jayden Daniels koennte frueher als erwartet von seiner Verletzung zurueckkehren';
    const t = fitTitle(long) as { absolute: string };
    expect(t.absolute.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t.absolute.endsWith('…')).toBe(true);
  });
});
