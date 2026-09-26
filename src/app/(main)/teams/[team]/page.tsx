import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { TEAM_FACTS } from '@/data/team-facts';
import { TEAM_MEDIA } from '@/data/team-media';
import {
  denormalizeAbbr,
  getNews,
  getRoster,
  getTeamOverview,
  getTeamProfile,
  type TeamGame,
} from '@/lib/nfl-live';
import { rosterGroups, standingDe } from '@/lib/team-page';
import { SITE_URL, withSeo } from '@/lib/seo';

/**
 * Eine Seite je Team: Bilanz, Spielplan, Steckbrief, kompletter Kader und
 * News. Vor allem für Suchmaschinen — Anfragen wie "49ers Kader" oder
 * "Chiefs deutsch" hatten vorher keine passende Seite.
 */

export const revalidate = 900;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TEAM_FACTS).map((t) => ({ team: t.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: { team: string } }) {
  const abbr = params.team.toUpperCase();
  const o = await getTeamOverview(abbr);
  if (!o) return {};
  const standing = o.standingSummary ? `, ${standingDe(o.standingSummary)}` : '';
  return withSeo({
    title: `${o.name}: Kader, Spielplan & News auf Deutsch`,
    description: `${o.name} auf Deutsch: Bilanz ${o.record}${standing}, nächstes Spiel, kompletter Kader mit Trikotnummern, Head Coach, Stadion und aktuelle News.`,
    path: `/teams/${params.team}`,
    image: o.logo,
  });
}

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});

function gameLine(g: TeamGame) {
  const where = g.home ? 'vs.' : '@';
  const when = g.date ? dateFmt.format(new Date(g.date)) : 'Termin offen';
  if (g.state === 'post' && g.teamScore !== null && g.opponentScore !== null) {
    const res = g.teamScore > g.opponentScore ? 'S' : g.teamScore < g.opponentScore ? 'N' : 'U';
    return `${where} ${g.opponentName} · ${res} ${g.teamScore}:${g.opponentScore}`;
  }
  return `${where} ${g.opponentName} · ${when} Uhr`;
}

export default async function TeamPage({ params }: { params: { team: string } }) {
  const abbr = params.team.toUpperCase();
  if (!TEAM_FACTS[abbr]) notFound();

  const [o, profile, athletes, news] = await Promise.all([
    getTeamOverview(abbr),
    getTeamProfile(abbr),
    getRoster(abbr),
    getNews(denormalizeAbbr(abbr), 6),
  ]);
  if (!o) notFound();

  const roster = rosterGroups(athletes);
  const media = TEAM_MEDIA.find((m) => m.teamId === abbr);
  const path = `/teams/${params.team}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: o.name,
      sport: 'American Football',
      url: `${SITE_URL}${path}`,
      logo: o.logo ?? undefined,
      memberOf: { '@type': 'SportsOrganization', name: 'National Football League' },
      location: profile && {
        '@type': 'StadiumOrArena',
        name: profile.venue.name,
        address: profile.venue.location,
      },
      coach: profile?.coach ? { '@type': 'Person', name: profile.coach.name } : undefined,
      athlete: roster
        .filter((g) => g.key !== 'practiceSquad')
        .flatMap((g) => g.players)
        .map((p) => ({ '@type': 'Person', name: p.name })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Teams', item: `${SITE_URL}/teams` },
        { '@type': 'ListItem', position: 3, name: o.name, item: `${SITE_URL}${path}` },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Brotkrumen" className="text-xs text-mute mb-6">
        <Link href="/teams" className="hover:text-ink">
          Alle Teams
        </Link>
        {' / '}
        <span className="text-ink">{o.name}</span>
      </nav>

      <header className="flex items-center gap-5 flex-wrap">
        {o.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.logo} alt={`Logo ${o.name}`} width={88} height={88} className="w-20 h-20" />
        )}
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight">{o.name}</h1>
          <p className="text-mute mt-2 text-lg">
            {`Bilanz ${o.record}`}
            {o.standingSummary && ` · ${standingDe(o.standingSummary)}`}
            {` · ${o.pointsFor}:${o.pointsAgainst} Punkte`}
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <section className="card p-6" aria-labelledby="spielplan">
          <h2 id="spielplan" className="font-display text-xl font-bold">
            Spielplan
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {o.last && (
              <li>
                <span className="text-mute">{`Zuletzt (Week ${o.last.week ?? '–'}): `}</span>
                {gameLine(o.last)}
              </li>
            )}
            {o.upcoming.map((g) => (
              <li key={`${g.week}-${g.opponent}`}>
                <span className="text-mute">{`Week ${g.week ?? '–'}: `}</span>
                {gameLine(g)}
              </li>
            ))}
            {!o.last && o.upcoming.length === 0 && <li className="text-mute">Kein Spielplan verfügbar.</li>}
          </ul>
        </section>

        <section className="card p-6" aria-labelledby="steckbrief">
          <h2 id="steckbrief" className="font-display text-xl font-bold">
            Steckbrief
          </h2>
          {profile ? (
            <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-mute">Head Coach</dt>
              <dd>
                {profile.coach
                  ? `${profile.coach.name}${profile.coach.experience ? ` (${profile.coach.experience}. Saison)` : ''}`
                  : '—'}
              </dd>
              <dt className="text-mute">Stadion</dt>
              <dd>{profile.venue.name}</dd>
              <dt className="text-mute">Ort</dt>
              <dd>{profile.venue.location}</dd>
              {profile.venue.capacity && (
                <>
                  <dt className="text-mute">Plätze</dt>
                  <dd>{profile.venue.capacity.toLocaleString('de-DE')}</dd>
                </>
              )}
              <dt className="text-mute">Spielfeld</dt>
              <dd>{`${profile.venue.grass ? 'Naturrasen' : 'Kunstrasen'}, ${profile.venue.indoor ? 'mit Dach' : 'offen'}`}</dd>
              {profile.founded && (
                <>
                  <dt className="text-mute">Gegründet</dt>
                  <dd>{profile.founded}</dd>
                </>
              )}
              <dt className="text-mute">Website</dt>
              <dd>
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-accent"
                >
                  {profile.website}
                </a>
              </dd>
            </dl>
          ) : (
            <p className="text-sm text-mute mt-4">Keine Daten verfügbar.</p>
          )}
        </section>

        <section className="card p-6" aria-labelledby="medien">
          <h2 id="medien" className="font-display text-xl font-bold">
            Medien & Beat Writer
          </h2>
          {media ? (
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={`https://www.youtube.com/${media.youtubeHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-accent inline-flex items-center gap-1"
                >
                  {`YouTube ${media.youtubeHandle}`} <ExternalLink size={12} />
                </a>
              </li>
              {media.writers.map((w) => (
                <li key={w.handle}>
                  <a
                    href={`https://x.com/${w.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ink"
                  >
                    {w.name}
                  </a>
                  {w.outlet && <span className="text-mute">{` · ${w.outlet}`}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute mt-4">—</p>
          )}
        </section>
      </div>

      {news.length > 0 && (
        <section className="mt-12" aria-labelledby="news">
          <h2 id="news" className="font-display text-3xl font-bold">
            {`News zu den ${o.shortName}`}
          </h2>
          <p className="text-mute text-sm mt-1">Von ESPN, englisch.</p>
          <ul className="grid md:grid-cols-2 gap-4 mt-5">
            {news.map((n) => (
              <li key={n.headline} className="card p-5" lang="en">
                <a
                  href={n.link ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-primary"
                >
                  {n.headline}
                </a>
                {n.description && <p className="text-sm text-mute mt-2">{n.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {roster.length > 0 && (
        <section className="mt-12" aria-labelledby="kader">
          <h2 id="kader" className="font-display text-3xl font-bold">
            {`Kader der ${o.shortName}`}
          </h2>
          <p className="text-mute text-sm mt-1">
            Live von ESPN, sortiert nach Trikotnummer. Werte zu jedem Spieler findest du über die
            Suche auf der <Link href="/stats" className="text-primary hover:text-accent">Stats-Seite</Link>.
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-5">
            {roster.map((g) => (
              <div key={g.key} className="card p-5">
                <h3 className="font-display text-lg font-bold">{`${g.label} (${g.players.length})`}</h3>
                <ul className="mt-3 text-sm divide-y divide-line/50">
                  {g.players.map((p) => (
                    <li key={`${p.name}-${p.jersey}`} className="flex items-center gap-3 py-1.5">
                      <span className="font-mono text-mute w-8 text-right">{p.jersey ? `#${p.jersey}` : ''}</span>
                      <span className="flex-1">{p.name}</span>
                      <span className="font-mono text-[11px] text-mute">{p.position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
