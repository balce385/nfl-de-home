import { describe, it, expect } from 'vitest';
import { cn, espnLogo } from './utils';

describe('cn (classname helper)', () => {
  it('merges classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('dedupes Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
  it('handles falsy', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});

describe('espnLogo', () => {
  it('laesst ESPN verkleinern, doppelte Groesse fuer Retina', () => {
    expect(espnLogo('https://a.espncdn.com/i/teamlogos/nfl/500/kc.png', 40)).toBe(
      'https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/kc.png&w=80&h=80',
    );
  });
  it('laesst fremde und leere Adressen stehen', () => {
    expect(espnLogo('https://example.com/logo.png', 40)).toBe('https://example.com/logo.png');
    expect(espnLogo(null, 40)).toBe(null);
  });
});
