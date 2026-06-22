'use client';

/**
 * Spieler-Auswahl für ALLE NFL-Spieler:
 * Team wählen → kompletter Kader live über den server-seitigen Proxy
 * /api/team-roster (umgeht ESPNs fehlenden CORS-Header) →
 * Spieler anklicken → Detailkarte mit Foto, Nummer, Position, Bio-Daten.
 */
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Search, Users } from 'lucide-react';

export type ExplorerTeam = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string | null;
};

type RosterPlayer = {
  id: string;
  name: string;
  jersey: string;
  position: string;
  group: string;
  headshot: string | null;
  height: string;
  weight: string;
  age: number | null;
  experience: number | null;
  college: string | null;
};

const GROUP_LABELS: Record<string, string> = {
  offense: 'Offense',
  defense: 'Defense',
  specialTeam: 'Special Teams',
  injuredReserveOrOut: 'Injured Reserve',
  practiceSquad: 'Practice Squad',
};

export function PlayerExplorer({ teams }: { teams: ExplorerTeam[] }) {
  const [teamId, setTeamId] = useState('KC');
  const [roster, setRoster] = useState<RosterPlayer[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RosterPlayer | null>(null);

  const team = teams.find((t) => t.id === teamId);

  useEffect(() => {
    let cancelled = false;
    setRoster(null);
    setError(false);
    setSelected(null);
    setQuery('');
    fetch(`/api/team-roster?team=${encodeURIComponent(teamId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        const players: RosterPlayer[] = [];
        for (const grp of data?.athletes ?? []) {
          for (const a of grp?.items ?? []) {
            players.push({
              id: String(a.id),
              name: a.fullName ?? a.displayName ?? '',
              jersey: a.jersey ?? '—',
              position: a.position?.abbreviation ?? '',
              group: GROUP_LABELS[grp.position] ?? grp.position ?? '',
              headshot: a.headshot?.href ?? null,
              height: a.displayHeight ?? '',
              weight: a.displayWeight ?? '',
              age: a.age ?? null,
              experience: a.experience?.years ?? null,
              college: a.college?.name ?? null,
            });
          }
        }
        setRoster(players);
        // Ersten QB (oder ersten Spieler) vorauswählen
        setSelected(players.find((p) => p.position === 'QB') ?? players[0] ?? null);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const filtered = useMemo(() => {
    if (!roster) return [];
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (p) => p.name.toLowerCase().includes(q) || p.position.toLowerCase() === q
    );
  }, [roster, query]);

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="text-xs font-mono text-mute uppercase tracking-wider flex items-center gap-2">
            <Users size={13} /> Spieler-Auswahl · Live-Roster (ESPN)
          </div>
          <div className="font-display font-bold text-xl mt-1">
            {team?.name ?? teamId}
            {roster && (
              <span className="text-mute font-body font-normal text-sm"> · {roster.length} Spieler</span>
            )}
          </div>
        </div>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="bg-black/40 border border-line rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Spielerliste */}
        <div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Spieler oder Position suchen (z.B. QB)…"
              className="w-full bg-black/40 border border-line rounded-lg pl-9 pr-3 py-2 text-sm focus:border-primary outline-none placeholder:text-mute"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {roster === null && !error && (
              <p className="text-sm text-mute animate-pulse py-4">Lade Kader …</p>
            )}
            {error && <p className="text-sm text-mute py-4">Roster momentan nicht erreichbar.</p>}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full flex items-center justify-between gap-3 py-2 px-3 rounded-lg text-left transition ${
                  selected?.id === p.id
                    ? 'bg-primary/15 border border-primary/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <span className="text-sm font-medium truncate">{p.name}</span>
                <span className="text-xs font-mono text-mute shrink-0">
                  #{p.jersey} · {p.position}
                </span>
              </button>
            ))}
            {roster && filtered.length === 0 && (
              <p className="text-sm text-mute py-4">Kein Treffer für „{query}".</p>
            )}
          </div>
        </div>

        {/* Detailkarte */}
        <div className="bg-black/30 rounded-lg border border-line p-5">
          {selected ? (
            <>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                  style={{ backgroundColor: team?.color ?? '#1f2a44' }}
                >
                  {selected.headshot ? (
                    <Image
                      src={selected.headshot}
                      alt={selected.name}
                      width={80}
                      height={80}
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-display font-bold text-2xl text-white">
                      {selected.jersey}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-2xl leading-tight">
                    {selected.name}
                  </div>
                  <div className="text-sm text-mute font-mono mt-1">
                    #{selected.jersey} · {selected.position} · {selected.group}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <Bio label="Größe" value={selected.height || '—'} />
                <Bio label="Gewicht" value={selected.weight || '—'} />
                <Bio label="Alter" value={selected.age ? String(selected.age) : '—'} />
                <Bio
                  label="NFL-Jahre"
                  value={selected.experience != null ? String(selected.experience) : '—'}
                />
              </div>
              {selected.college && (
                <div className="mt-3">
                  <Bio label="College" value={selected.college} />
                </div>
              )}

              <a
                href={`https://www.espn.com/nfl/player/_/id/${selected.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:text-accent"
              >
                Vollständige Stats auf ESPN <ExternalLink size={13} />
              </a>
            </>
          ) : (
            <p className="text-sm text-mute">Wähle einen Spieler aus der Liste.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Bio({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/40 rounded-lg p-3 border border-line">
      <div className="text-[10px] font-mono text-mute uppercase">{label}</div>
      <div className="font-display font-bold text-lg mt-1 truncate">{value}</div>
    </div>
  );
}
