import { describe, expect, it } from 'vitest';
import { isLiveOrDue } from './live-poll';

const kickoff = '2026-09-27T17:00:00Z';
const at = (iso: string) => Date.parse(iso);

describe('isLiveOrDue', () => {
  it('laufendes Spiel wird immer nachgeladen', () => {
    expect(isLiveOrDue({ state: 'in', kickoff }, at('2026-09-27T12:00:00Z'))).toBe(true);
  });

  it('angesetztes Spiel erst ab Kickoff', () => {
    expect(isLiveOrDue({ state: 'pre', kickoff }, at('2026-09-27T16:59:00Z'))).toBe(false);
    expect(isLiveOrDue({ state: 'pre', kickoff }, at('2026-09-27T17:00:00Z'))).toBe(true);
  });

  it('verlegtes Spiel nicht endlos', () => {
    expect(isLiveOrDue({ state: 'pre', kickoff }, at('2026-09-27T23:30:00Z'))).toBe(false);
  });

  it('beendetes Spiel und fehlender Kickoff nie', () => {
    expect(isLiveOrDue({ state: 'post', kickoff }, at('2026-09-27T18:00:00Z'))).toBe(false);
    expect(isLiveOrDue({ state: 'pre', kickoff: null }, at('2026-09-27T18:00:00Z'))).toBe(false);
  });
});
