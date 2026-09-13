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
import type { PlayerExtras } from '@/lib/player-extras';

export type ExplorerTeam = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string | null;
};

type AthleteBio = {
  draft: string | null;
  birthPlace: string | null;
  debutYear: number | null;
  experience: string | null;
  status: string | null;
};

type AthleteSummary = {
  title: string;
  stats: { label: string; value: string; rank: number | null }[];
};

type AthleteProfile = {
  bio: AthleteBio;
  summary: AthleteSummary | null;
  categories: CareerCategory[];
  extras?: PlayerExtras;
};

type CareerSeason = { season: number; teamSlug: string | null; values: string[] };
type CareerCategory = { name: string; labels: string[]; seasons: CareerSeason[] };

/** ESPN benennt die Kategorien englisch; hier die deutschen Ueberschriften. */
const CATEGORY_LABELS: Record<string, string> = {
  passing: 'Passspiel',
  rushing: 'Laufspiel',
  receiving: 'Passempfang',
  defensive: 'Defensive',
  scoring: 'Punkte',
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
  const [profile, setProfile] = useState<AthleteProfile | null>(null);

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

  useEffect(() => {
    if (!selected) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfile(null);
    fetch(`/api/player-career?id=${encodeURIComponent(selected.id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('profile'))))
      .then((d) => !cancelled && setProfile(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selected]);

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
              <p className="text-sm text-mute py-4">Kein Treffer für „{query}&quot;.</p>
            )}
          </div>
        </div>

        {/* Detailkarte */}
        <div className="bg-black/30 rounded-lg border border-line p-5 min-w-0">
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

              {profile?.bio.draft && (
                <div className="mt-4">
                  <Bio label="Draft" value={profile.bio.draft} />
                </div>
              )}
              {profile?.bio.birthPlace && (
                <div className="mt-3">
                  <Bio label="Geboren in" value={profile.bio.birthPlace} />
                </div>
              )}

              {profile?.extras?.contract && <Contract c={profile.extras.contract} />}
              {profile?.extras?.honors && <Honors h={profile.extras.honors} />}

              {profile?.summary && (
                <div className="mt-5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-2">
                    {profile.summary.title}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {profile.summary.stats.slice(0, 4).map((st) => (
                      <div key={st.label}>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-mute">
                          {st.label}
                        </div>
                        <div className="font-medium mt-0.5 tabular-nums">{st.value}</div>
                        {st.rank && (
                          <div className="text-xs text-mute">Platz {st.rank} der Liga</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Career categories={profile ? profile.categories : null} />
              {profile?.extras?.combine && <Combine c={profile.extras.combine} />}

              <a
                href={`https://www.espn.com/nfl/player/_/id/${selected.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:text-accent"
              >
                Alle Werte auf ESPN <ExternalLink size={13} />
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

function Bio({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-black/40 rounded-lg p-3 border border-line">
      <div className="text-[10px] font-mono text-mute uppercase">{label}</div>
      <div className="font-display font-bold text-lg mt-1 truncate">{value}</div>
      {hint && <div className="text-xs text-mute mt-0.5">{hint}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-2">{children}</div>;
}

const decimal = (v: number, digits: number) =>
  v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const musd = (v: number | null) =>
  v === null ? '—' : `${v.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio. $`;

/** Laufender Vertrag laut OverTheCap. */
function Contract({ c }: { c: NonNullable<PlayerExtras['contract']> }) {
  return (
    <div className="mt-5">
      <SectionLabel>Vertrag{c.team ? ` · ${c.team}` : ''} · OverTheCap</SectionLabel>
      <div className="grid sm:grid-cols-3 gap-3">
        <Bio
          label="Gesamtwert"
          value={musd(c.valueMusd)}
          hint={c.years && c.yearSigned ? `${c.years} Jahre, unterschrieben ${c.yearSigned}` : undefined}
        />
        <Bio
          label="Pro Jahr"
          value={musd(c.apyMusd)}
          hint={c.capPct !== null ? `${decimal(c.capPct * 100, 1)} % des Salary Cap` : undefined}
        />
        <Bio label="Garantiert" value={musd(c.guaranteedMusd)} />
      </div>
    </div>
  );
}

/** Karriere-Auszeichnungen aus dem Draft-Datensatz (Pro Football Reference). */
function Honors({ h }: { h: NonNullable<PlayerExtras['honors']> }) {
  return (
    <div className="mt-5">
      <SectionLabel>Auszeichnungen{h.hof ? ' · Hall of Fame' : ''}</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Bio label="Pro Bowls" value={String(h.probowls)} />
        <Bio label="All-Pro" value={String(h.allpro)} />
        <Bio label="Starter-Saisons" value={h.seasonsStarted !== null ? String(h.seasonsStarted) : '—'} />
      </div>
    </div>
  );
}

const IN_TO_CM = 2.54;

/** Messwerte der NFL Combine; Sprünge von Zoll in Zentimeter umgerechnet. */
function Combine({ c }: { c: NonNullable<PlayerExtras['combine']> }) {
  const items: [string, string | null][] = [
    ['40 Yards', c.forty !== null ? `${decimal(c.forty, 2)} s` : null],
    ['Bankdrücken', c.bench !== null ? `${c.bench}× 102 kg` : null],
    ['Vertikalsprung', c.vertical !== null ? `${Math.round(c.vertical * IN_TO_CM)} cm` : null],
    ['Weitsprung', c.broadJump !== null ? `${Math.round(c.broadJump * IN_TO_CM)} cm` : null],
    ['3-Cone', c.cone !== null ? `${decimal(c.cone, 2)} s` : null],
    ['Shuttle', c.shuttle !== null ? `${decimal(c.shuttle, 2)} s` : null],
  ];
  const measured = items.filter((item): item is [string, string] => item[1] !== null);
  if (measured.length === 0) return null;

  return (
    <div className="mt-5">
      <SectionLabel>NFL Combine {c.season}</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {measured.map(([label, value]) => (
          <Bio key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

/**
 * Karriere Saison fuer Saison, live von ESPN.
 *
 * Gezeigt wird die erste gefuellte Kategorie — bei einem Quarterback also das
 * Passspiel, bei einem Linebacker die Defensive. Positionen ohne Statistik
 * (Offensive Line) liefern gar nichts, dann bleibt der Block leer.
 */
function Career({ categories }: { categories: CareerCategory[] | null }) {
  if (categories === null) {
    return <p className="mt-5 text-sm text-mute animate-pulse">Lade Karrierewerte …</p>;
  }
  const cat = categories[0];
  if (!cat) {
    return (
      <p className="mt-5 text-sm text-mute">
        Für diese Position führt ESPN keine Einzelstatistik.
      </p>
    );
  }

  const seasons = cat.seasons.slice(0, 6);
  return (
    <div className="mt-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-2">
        {CATEGORY_LABELS[cat.name] ?? cat.name} · letzte {seasons.length}{' '}
        {seasons.length === 1 ? 'Saison' : 'Saisons'}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-line text-mute">
              <th scope="col" className="text-left font-mono py-1.5 pr-3">
                Jahr
              </th>
              {cat.labels.map((l) => (
                <th key={l} scope="col" className="text-right font-mono py-1.5 px-1.5 whitespace-nowrap">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={s.season} className="border-b border-line/50 last:border-0">
                <th scope="row" className="text-left font-mono py-1.5 pr-3 font-normal">
                  {s.season}
                </th>
                {cat.labels.map((l, i) => (
                  <td key={l} className="text-right py-1.5 px-1.5 tabular-nums whitespace-nowrap">
                    {s.values[i] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
