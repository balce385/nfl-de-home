import { describe, it, expect } from 'vitest';
import { gameStatusText } from './nfl-live';

describe('gameStatusText', () => {
  it('macht aus der US-Anstosszeit eine deutsche Zeitangabe', () => {
    // 2026-09-15T00:15Z entspricht 02:15 Uhr in Europe/Berlin (Sommerzeit)
    const text = gameStatusText('pre', '9/14 - 8:15 PM EDT', '2026-09-15T00:15:00Z');
    expect(text).toContain('02:15');
    expect(text).toContain('Uhr');
    expect(text).not.toContain('EDT');
  });

  it('laesst laufende und beendete Spiele unveraendert', () => {
    expect(gameStatusText('in', 'Q3 5:12', '2026-09-15T00:15:00Z')).toBe('Q3 5:12');
    expect(gameStatusText('post', 'Final', '2026-09-15T00:15:00Z')).toBe('Final');
  });

  it('faellt ohne brauchbares Datum auf den ESPN-Text zurueck', () => {
    expect(gameStatusText('pre', '9/14 - 8:15 PM EDT', null)).toBe('9/14 - 8:15 PM EDT');
    expect(gameStatusText('pre', '9/14 - 8:15 PM EDT', 'kaputt')).toBe('9/14 - 8:15 PM EDT');
    expect(gameStatusText('pre', undefined, null)).toBe('');
  });
});
