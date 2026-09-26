import Link from 'next/link';
import { getAllTeams, getStandings } from '@/lib/nfl-live';
import { SITE_URL, withSeo } from '@/lib/seo';

export const revalidate = 900;

export const metadata = withSeo({
  title: 'Alle 32 NFL-Teams — Kader, Spielplan & News auf Deutsch',
  description:
    'Alle 32 NFL-Teams der AFC und NFC auf einen Blick: aktuelle Bilanz, Spielplan, kompletter Kader, Head Coach, Stadion und News — auf Deutsch.',
  path: '/teams',
});

export default async function TeamsPage() {
  const [teams, standings] = await Promise.all([getAllTeams(), getStandings()]);
  const byCode = new Map(standings.map((s) => [s.code, s]));

  const conferences = ['AFC', 'NFC'].map((conf) => ({
    conf,
    teams: teams.filter((t) => byCode.get(t.id)?.conference?.includes(conf)),
  }));
  // Fällt die Tabelle aus, stehen alle Teams ohne Konferenz in einer Liste.
  const grouped = conferences.every((c) => c.teams.length > 0)
    ? conferences
    : [{ conf: 'NFL', teams }];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'NFL-Teams',
    itemListElement: teams.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/teams/${t.id.toLowerCase()}`,
      name: t.name,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mb-10">
        <span className="chip">32 Teams</span>
        <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
          Alle <span className="grad-text italic">NFL-Teams</span>.
        </h1>
        <p className="text-mute mt-3 text-lg">
          Bilanz, Spielplan, Kader mit Trikotnummern, Head Coach, Stadion und News — für jedes
          Team eine eigene Seite, live aktualisiert.
        </p>
      </div>

      {grouped.map(({ conf, teams: list }) => (
        <section key={conf} className="mb-12" aria-labelledby={`conf-${conf}`}>
          <h2 id={`conf-${conf}`} className="font-display text-3xl font-bold mb-5">
            {conf}
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {list.map((t) => {
              const s = byCode.get(t.id);
              return (
                <li key={t.id}>
                  <Link
                    href={`/teams/${t.id.toLowerCase()}`}
                    className="card p-4 flex items-center gap-3 hover:bg-white/5 transition"
                  >
                    {t.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.logo} alt="" width={40} height={40} className="w-10 h-10" />
                    )}
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{t.name}</span>
                      <span className="block text-xs font-mono text-mute">
                        {s ? `${s.record} · ${s.conference}` : t.id}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
