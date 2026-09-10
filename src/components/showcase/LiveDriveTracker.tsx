'use client';

/**
 * Live-Drive-Tracker: echter Spielstand, Ballbesitz, Down und Distance,
 * Feldposition, Siegwahrscheinlichkeit und der letzte Spielzug.
 *
 * Daten vom server-seitigen Proxy /api/game-situation (ESPN). Solange ein
 * Spiel laeuft, wird alle 20 Sekunden nachgeladen; bei beendeten oder noch
 * nicht gestarteten Spielen ruht der Abruf.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { fieldPercent, downText } from '@/lib/drive-situation';

type Side = {
  code: string;
  name: string;
  score: number;
  color: string;
  logo: string | null;
  timeouts: number | null;
};

export type Situation = {
  eventId: string;
  shortName: string;
  state: 'pre' | 'in' | 'post';
  statusText: string;
  period: number | null;
  clock: string | null;
  venue: string;
  kickoff: string | null;
  home: Side;
  away: Side;
  possession: string | null;
  down: number | null;
  distance: number | null;
  yardLine: number | null;
  downDistanceText: string | null;
  possessionText: string | null;
  isRedZone: boolean;
  homeWinPercent: number | null;
  lastPlay: string | null;
  drive: { team: string | null; start: string | null; yards: number | null; plays: number | null } | null;
};

const POLL_MS = 20_000;

const kickoffFmt = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});


export function LiveDriveTracker({ initialGames }: { initialGames: Situation[] }) {
  const [games] = useState(initialGames);
  const [selected, setSelected] = useState(initialGames[0]?.eventId ?? '');
  const [game, setGame] = useState<Situation | null>(initialGames[0] ?? null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/game-situation?event=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        setGame(await res.json());
        setUpdatedAt(new Date());
      }
    } catch {
      // Netzfehler: der letzte bekannte Stand bleibt sichtbar.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selected);
  }, [selected, load]);

  // Nur nachladen, solange das gewaehlte Spiel wirklich laeuft.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (game?.state === 'in') {
      timer.current = setInterval(() => load(selected), POLL_MS);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [game?.state, selected, load]);

  if (!game) {
    return (
      <div className="card p-6 text-sm text-mute">
        Gerade sind keine Spiele angesetzt. Der Tracker meldet sich zum nächsten Spieltag zurück.
      </div>
    );
  }

  const pct = fieldPercent(game);
  const offense = game.possession === game.home.code ? game.home : game.possession === game.away.code ? game.away : null;
  const live = game.state === 'in';
  const homeWin = game.homeWinPercent;

  return (
    <div className="space-y-4">
      {/* Spielauswahl */}
      <div className="flex flex-wrap gap-2">
        {games.map((g) => (
          <button
            key={g.eventId}
            onClick={() => setSelected(g.eventId)}
            aria-pressed={selected === g.eventId}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              selected === g.eventId
                ? 'border-primary bg-primary/10 text-ink'
                : 'border-line bg-white/5 text-mute hover:bg-white/10'
            }`}
          >
            {g.state === 'in' && (
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" aria-hidden />
            )}
            <span className="font-mono">{g.shortName}</span>
          </button>
        ))}
      </div>

      <div className={`card p-6 ${game.isRedZone ? 'border-danger/50' : ''}`}>
        {/* Kopf: Spielstand */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {[game.away, game.home].map((t, i) => (
              <div key={t.code} className="flex items-center gap-2">
                {i === 1 && <span className="text-mute text-xs font-mono">@</span>}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                  aria-hidden
                />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-mute">{t.code}</span>
                    <span className="font-display text-2xl font-bold tabular-nums">{t.score}</span>
                    {game.possession === t.code && (
                      <span className="text-[9px] font-mono text-accent" title="Ballbesitz">
                        ●
                      </span>
                    )}
                  </div>
                  {t.timeouts !== null && (
                    <div className="flex gap-0.5 mt-0.5" title={`${t.timeouts} Auszeiten`}>
                      {[0, 1, 2].map((n) => (
                        <span
                          key={n}
                          className={`h-0.5 w-3 rounded ${n < (t.timeouts ?? 0) ? 'bg-ink/60' : 'bg-line'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {live && <Radio size={12} className="text-danger animate-pulse" />}
              <span className={`chip ${live ? 'chip-warn' : ''} text-[10px]`}>
                {live ? 'LIVE' : game.state === 'pre' ? 'Angesetzt' : 'Beendet'}
              </span>
            </div>
            <p className="text-xs text-mute mt-1 font-mono">
              {game.state === 'pre' && game.kickoff
                ? `${kickoffFmt.format(new Date(game.kickoff))} Uhr`
                : game.statusText}
            </p>
          </div>
        </div>

        {/* Feld mit Ballposition */}
        {live && pct !== null && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] font-mono text-mute mb-1.5">
              <span>eigene Endzone</span>
              {game.isRedZone && <span className="text-danger font-bold">RED ZONE</span>}
              <span>Endzone Gegner</span>
            </div>
            <div className="relative h-8 rounded-lg overflow-hidden bg-black/40 border border-line">
              {/* 10-Yard-Raster */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((n) => (
                <span
                  key={n}
                  className="absolute top-0 bottom-0 w-px bg-white/10"
                  style={{ left: `${n}%` }}
                  aria-hidden
                />
              ))}
              {/* zurückgelegter Weg */}
              <div
                className="absolute inset-y-0 left-0 opacity-25"
                style={{ width: `${pct}%`, backgroundColor: offense?.color ?? '#3b82f6' }}
              />
              {/* Ball */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700"
                style={{ left: `${pct}%` }}
              >
                <span
                  className="block w-3 h-3 rounded-full ring-2 ring-bg"
                  style={{ backgroundColor: offense?.color ?? '#3b82f6' }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="font-mono text-mute">{game.possessionText ?? '—'}</span>
              <span className="font-display font-bold">{downText(game.down, game.distance, game.downDistanceText) ?? '—'}</span>
            </div>
          </div>
        )}

        {/* Kennzahlen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Stat label="Ballbesitz" value={offense ? offense.code : '—'} />
          <Stat label="Drive" value={game.drive?.start ? game.drive.start : '—'} />
          <Stat
            label="Drive-Yards"
            value={game.drive?.yards !== null && game.drive?.yards !== undefined ? String(game.drive.yards) : '—'}
          />
          <Stat
            label="Spielzüge"
            value={game.drive?.plays !== null && game.drive?.plays !== undefined ? String(game.drive.plays) : '—'}
          />
        </div>

        {/* Siegwahrscheinlichkeit */}
        {homeWin !== null && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] font-mono text-mute mb-1.5">
              <span>{game.away.code} {(100 - homeWin).toFixed(0)} %</span>
              <span>Siegwahrscheinlichkeit</span>
              <span>{game.home.code} {homeWin.toFixed(0)} %</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex border border-line">
              <div style={{ width: `${100 - homeWin}%`, backgroundColor: game.away.color }} />
              <div style={{ width: `${homeWin}%`, backgroundColor: game.home.color }} />
            </div>
          </div>
        )}

        {/* Letzter Spielzug */}
        {game.lastPlay && (
          <div className="mt-6 border-t border-line pt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-1">
              Letzter Spielzug
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{game.lastPlay}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-5 text-[10px] font-mono text-mute">
          <span>{game.venue}</span>
          <button
            onClick={() => load(selected)}
            className="flex items-center gap-1 hover:text-ink transition"
            title="Jetzt aktualisieren"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            {updatedAt
              ? `${updatedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'aktualisieren'}
            {live && ' · alle 20s'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
