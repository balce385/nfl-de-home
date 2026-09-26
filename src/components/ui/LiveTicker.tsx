import { getScoreboard } from '@/lib/nfl-live';
import { LiveTickerItems } from './LiveTickerItems';

/**
 * Live-Ticker mit echten Spielen von der ESPN-API (60s-Cache).
 * In der Offseason zeigt er die anstehenden Spiele der neuen Saison.
 * Das HTML kommt per ISR; waehrend laufender Spiele laedt der Client nach.
 */
export async function LiveTicker() {
  const games = await getScoreboard();

  return (
    <div className="border-b border-line bg-black/30 backdrop-blur-sm overflow-hidden">
      <LiveTickerItems initialGames={games.slice(0, 8)} />
    </div>
  );
}
