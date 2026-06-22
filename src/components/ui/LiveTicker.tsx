import { getScoreboard } from '@/lib/nfl-live';

/**
 * Live-Ticker mit echten Spielen von der ESPN-API (60s-Cache).
 * In der Offseason zeigt er die anstehenden Spiele der neuen Saison.
 */
export async function LiveTicker() {
  const games = await getScoreboard();

  const shown = games.slice(0, 8);

  const items = (
    <div className="flex items-center gap-12">
      {shown.length === 0 && (
        <span className="text-mute">NFL-DE-Hub · Live-Scores starten mit dem Kickoff der Saison</span>
      )}
      {shown.map((g) => (
        <span key={g.id} className="flex items-center gap-2 text-mute">
          {g.state === 'in' && (
            <>
              <span className="live-dot" />
              <span className="text-danger font-bold">LIVE</span>
            </>
          )}
          <span>{g.away.code}</span>
          <span className="text-ink">{g.away.score}</span>
          <span>—</span>
          <span>{g.home.code}</span>
          <span className="text-ink">{g.home.score}</span>
          <span>· {g.statusText}</span>
        </span>
      ))}
      {shown[0]?.season && (
        <span className="text-accent">
          ▲ Saison {shown[0].season} · Week {shown[0].week ?? 1}
        </span>
      )}
      <span className="text-warn">★ Munich Game: NE vs. DET · 15.11.2026 · Allianz Arena</span>
    </div>
  );

  return (
    <div className="border-b border-line bg-black/30 backdrop-blur-sm overflow-hidden">
      <div className="flex gap-12 py-2 text-xs font-mono tracking-wider whitespace-nowrap animate-ticker">
        {items}
        <div aria-hidden="true">{items}</div>
      </div>
    </div>
  );
}
