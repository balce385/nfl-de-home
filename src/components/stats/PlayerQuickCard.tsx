'use client';

/**
 * Karte für einen Spieler aus der ligaweiten Suche, der nicht in der Tabelle
 * steht (zu wenig Einsätze, andere Position, Free Agent). Saisonwerte samt
 * Liga-Rang und Steckbrief kommen von ESPN über /api/player-career.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { SearchPlayer } from '@/lib/player-search';

type Profile = {
  bio?: { draft: string | null; experience: string | null; birthPlace: string | null };
  summary?: { title: string; stats: { label: string; value: string; rank: number | null }[] } | null;
};

export function PlayerQuickCard({
  player,
  onClose,
  reason,
}: {
  player: SearchPlayer;
  onClose: () => void;
  /** Warum der Spieler nicht in der Tabelle steht. */
  reason: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setProfile(null);
    setFailed(false);
    if (!player.espnId) return;
    let cancelled = false;
    fetch(`/api/player-career?id=${encodeURIComponent(player.espnId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && setProfile(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [player.espnId]);

  const facts = [
    profile?.bio?.experience,
    profile?.bio?.draft,
    profile?.bio?.birthPlace && `aus ${profile.bio.birthPlace}`,
  ].filter(Boolean);

  return (
    <div className="card p-5 mb-4 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-mute hover:text-ink"
        aria-label="Spielerkarte schließen"
      >
        <X size={16} />
      </button>
      <div className="flex items-center gap-4">
        {player.headshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.headshot}
            alt=""
            width={64}
            height={64}
            className="rounded-full bg-white/5 object-cover w-16 h-16"
          />
        )}
        <div>
          <div className="font-display text-xl font-bold">{player.name}</div>
          <div className="text-sm text-mute font-mono">
            {[player.position, player.team ?? 'ohne Team', player.jersey && `#${player.jersey}`]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {facts.length > 0 && <div className="text-xs text-mute mt-1">{facts.join(' · ')}</div>}
        </div>
      </div>

      <p className="text-xs text-mute mt-4">{reason}</p>

      {profile?.summary && profile.summary.stats.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-2">
            {profile.summary.title}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile.summary.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-white/5 px-3 py-2">
                <div className="text-[11px] text-mute">{s.label}</div>
                <div className="font-mono text-lg text-ink">{s.value}</div>
                {s.rank && <div className="text-[11px] text-accent">Rang {s.rank} der Liga</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {player.espnId && !profile && !failed && (
        <p className="text-sm text-mute mt-4 animate-pulse">Lade Saisonwerte …</p>
      )}
      {(failed || !player.espnId) && (
        <p className="text-sm text-mute mt-4">Keine Saisonwerte verfügbar.</p>
      )}

      {player.espnId && (
        <a
          href={`https://www.espn.com/nfl/player/_/id/${player.espnId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-accent mt-4"
        >
          Karriere bei ESPN <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
