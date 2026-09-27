'use client';

import { useEffect, useState } from 'react';
import type { GameSituation, LiveGame } from '@/lib/nfl-live';
import { isLiveOrDue, LIVE_POLL_MS } from '@/lib/live-poll';

// Laut ESPN-Spielplan 2026 (Woche 10). Danach verschwindet der Hinweis.
const MUNICH_GAME_END = Date.parse('2026-11-15T18:00:00Z');

export function LiveTickerItems({ initialGames }: { initialGames: LiveGame[] }) {
  const [games, setGames] = useState(initialGames);

  // Solange ein Spiel laeuft (oder laut Kickoff laufen muesste), Spielstaende
  // ueber den Proxy nachladen; die Seite selbst ist per ISR bis zu 1 h alt.
  // Die Pruefung steckt im Takt, damit eine vor Kickoff geladene Seite den
  // Spielbeginn noch mitbekommt; ohne faelliges Spiel geht keine Anfrage raus.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden || !games.some((g) => isLiveOrDue(g, Date.now()))) return;
      try {
        const res = await fetch('/api/game-situation');
        if (!res.ok) return;
        const { games: live } = (await res.json()) as { games: GameSituation[] };
        const byId = new Map(live.map((s) => [s.eventId, s]));
        setGames((prev) =>
          prev.map((g) => {
            const s = byId.get(g.id);
            return s
              ? {
                  ...g,
                  state: s.state,
                  statusText: s.statusText,
                  home: { ...g.home, score: s.home.score },
                  away: { ...g.away, score: s.away.score },
                }
              : g;
          })
        );
      } catch {
        // Netzfehler: letzter bekannter Stand bleibt stehen.
      }
    }, LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [games]);

  const items = (
    <div className="flex items-center gap-12">
      {games.length === 0 && (
        <span className="text-mute">NFL-Fan-App · Live-Scores starten mit dem Kickoff der Saison</span>
      )}
      {games.map((g) => (
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
      {games[0]?.season && (
        <span className="text-accent">
          ▲ Saison {games[0].season} · Week {games[0].week ?? 1}
        </span>
      )}
      {Date.now() < MUNICH_GAME_END && (
        <span className="text-warn">★ Munich Game: NE vs. DET · 15.11.2026 · Allianz Arena</span>
      )}
    </div>
  );

  return (
    <div className="flex gap-12 py-2 text-xs font-mono tracking-wider whitespace-nowrap animate-ticker">
      {items}
      <div aria-hidden="true">{items}</div>
    </div>
  );
}
