'use client';

/**
 * Suchfeld mit Vorschlägen für die Stats-Tabellen: Spieler aus der Tabelle,
 * Teams und — über /api/search — jeder Spieler der Liga. Pfeiltasten wählen,
 * Enter übernimmt, Escape schließt.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { normalizeName, type SearchPlayer } from '@/lib/player-search';

export type SearchTeam = { id: string; name: string; shortName: string; logo: string | null };

type Option =
  | { kind: 'local'; label: string }
  | { kind: 'team'; team: SearchTeam }
  | { kind: 'league'; player: SearchPlayer };

/** Spitznamen, die Fans tippen, die aber in keinem offiziellen Teamnamen stehen. */
const TEAM_ALIASES: Record<string, string[]> = {
  SF: ['niners'],
  TB: ['bucs'],
  NE: ['pats'],
  JAX: ['jags'],
  GB: ['pack'],
  MIA: ['fins'],
  SEA: ['hawks'],
  LV: ['vegas'],
  WAS: ['washington', 'commies'],
  LAR: ['la rams'],
  LAC: ['bolts'],
};

const GROUP_TITLE: Record<Option['kind'], string> = {
  local: 'In dieser Tabelle',
  team: 'Teams',
  league: 'Ganze Liga',
};

export function StatsSearch({
  value,
  onChange,
  localNames,
  teams,
  onPickPlayer,
  placeholder = 'Spieler oder Team suchen …',
}: {
  value: string;
  onChange: (v: string) => void;
  localNames: string[];
  teams: SearchTeam[];
  /** Spieler, der nicht in der Tabelle steht. */
  onPickPlayer: (p: SearchPlayer) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [league, setLeague] = useState<SearchPlayer[]>([]);
  const cache = useRef(new Map<string, SearchPlayer[]>());
  const listId = useId();
  const q = normalizeName(value);

  // Ligaweite Treffer verzögert holen, damit nicht jeder Tastendruck anfragt.
  useEffect(() => {
    if (q.length < 2) {
      setLeague([]);
      return;
    }
    const hit = cache.current.get(q);
    if (hit) {
      setLeague(hit);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(value.trim())}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { players: [] }))
        .then((d) => {
          cache.current.set(q, d.players ?? []);
          setLeague(d.players ?? []);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, value]);

  const options = useMemo<Option[]>(() => {
    if (!q) return [];
    const local = [...new Set(localNames)]
      .filter((n) => normalizeName(n).includes(q))
      .slice(0, 5);
    const localSet = new Set(local.map(normalizeName));
    const teamHits = teams
      .filter(
        (t) =>
          t.id.toLowerCase() === q ||
          normalizeName(t.name).includes(q) ||
          normalizeName(t.shortName).includes(q) ||
          (TEAM_ALIASES[t.id] ?? []).some((a) => a.startsWith(q))
      )
      .slice(0, 3);
    const inTable = new Set(localNames.map(normalizeName));
    const leagueHits = league
      .filter((p) => !inTable.has(normalizeName(p.name)) && !localSet.has(normalizeName(p.name)))
      .slice(0, 5);
    return [
      ...local.map((label): Option => ({ kind: 'local', label })),
      ...teamHits.map((team): Option => ({ kind: 'team', team })),
      ...leagueHits.map((player): Option => ({ kind: 'league', player })),
    ];
  }, [q, localNames, teams, league]);

  useEffect(() => setActive(0), [options.length]);

  const pick = (o: Option) => {
    if (o.kind === 'local') onChange(o.label);
    if (o.kind === 'team') onChange(o.team.id);
    if (o.kind === 'league') {
      onChange(o.player.name);
      onPickPlayer(o.player);
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return setOpen(false);
    if (!options.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      pick(options[active]);
    }
  };

  const showList = open && options.length > 0;

  return (
    <div className="relative">
      <label className="flex items-center gap-2 card px-3 py-2">
        <Search size={14} className="text-mute shrink-0" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="bg-transparent text-sm outline-none w-60"
          role="combobox"
          aria-label="Spieler oder Team suchen"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        />
      </label>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-30 mt-1 w-80 max-h-96 overflow-y-auto card bg-bg/95 backdrop-blur py-1 shadow-xl"
        >
          {options.map((o, i) => {
            const first = i === 0 || options[i - 1].kind !== o.kind;
            return (
              <li key={`${o.kind}-${i}`} role="presentation">
                {first && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-mute">
                    {GROUP_TITLE[o.kind]}
                  </div>
                )}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown statt click: sonst schließt onBlur die Liste vorher
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(o);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                    i === active ? 'bg-primary/15 text-ink' : 'text-mute'
                  }`}
                >
                  <OptionBody o={o} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OptionBody({ o }: { o: Option }) {
  if (o.kind === 'local') return <span className="text-ink">{o.label}</span>;
  if (o.kind === 'team') {
    return (
      <>
        {o.team.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.team.logo} alt="" width={18} height={18} className="shrink-0" />
        )}
        <span className="text-ink">{o.team.name}</span>
        <span className="ml-auto font-mono text-[11px]">{o.team.id}</span>
      </>
    );
  }
  const p = o.player;
  return (
    <>
      <span className="text-ink truncate">{p.name}</span>
      <span className="ml-auto font-mono text-[11px] shrink-0">
        {[p.position, p.team ?? (p.active ? null : 'inaktiv')].filter(Boolean).join(' · ')}
      </span>
    </>
  );
}
