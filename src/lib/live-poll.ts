/**
 * Wann der Browser Spielstaende nachladen soll.
 *
 * Die Seiten selbst sind per ISR bis zu einer Stunde alt (Playbook: 3600 s).
 * Laeuft ein Spiel, holt der Client deshalb selbst nach — aber nur dann, damit
 * ausserhalb der Spielzeiten keine Anfragen entstehen. "Faellig" deckt Seiten ab,
 * die vor dem Kickoff geladen wurden und sonst nie merken, dass es losging.
 */
export const LIVE_POLL_MS = 30_000;

/** Nach so vielen Stunden ohne Statuswechsel gilt ein Spiel nicht mehr als faellig (Verlegung). */
const DUE_WINDOW_MS = 6 * 3_600_000;

export function isLiveOrDue(
  game: { state: 'pre' | 'in' | 'post'; kickoff: string | null },
  now: number,
): boolean {
  if (game.state === 'in') return true;
  if (game.state !== 'pre' || !game.kickoff) return false;
  const since = now - Date.parse(game.kickoff);
  return since >= 0 && since < DUE_WINDOW_MS;
}
