import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getTeamOverview, type TeamOverview } from '@/lib/nfl-live';
import { standingDe } from '@/lib/team-page';
import { SITE_URL, withSeo } from '@/lib/seo';

/**
 * Landingpage zum NFL-Spiel in München. Das Suchvolumen für "NFL München",
 * "Munich Game Tickets" oder "NFL München TV" steigt bis zum Spieltag stark an.
 * Feste Angaben stehen unten mit Quelle; Bilanz und Form beider Teams kommen
 * live von ESPN, deshalb stündlich neu gerendert.
 *
 * Pflege: Stand-Datum und Fakten aktualisieren, sobald die NFL Fan-Festival,
 * Einlasszeiten o. Ä. bekanntgibt.
 */

export const revalidate = 3600;

const UPDATED = '2026-09-27';
const KICKOFF = '2026-11-15T15:30:00+01:00';
const PATH = '/nfl-munich-game-2026';

export const metadata = withSeo({
  title: 'NFL Munich Game 2026: Tickets, Anstoß, TV & Anreise',
  description:
    'Patriots @ Lions am 15.11.2026 in der Allianz Arena: Anstoß 15:30 Uhr, live und kostenlos bei RTL. Alles zu Tickets, Preisen, Anreise mit der U6 und Halbzeitshow.',
  path: PATH,
});

const SOURCES = [
  { href: 'https://www.nfl.com/international/games/munich/', label: 'NFL.com – Munich Game' },
  { href: 'https://www.muenchen.de/veranstaltungen/sport/nfl-muenchen-2026', label: 'muenchen.de – NFL Munich Game 2026' },
  {
    href: 'https://www.nfl.com/news/cage-the-elephant-halftime-show-2026-nfl-munich-game',
    label: 'NFL.com – Halbzeitshow mit Cage The Elephant',
  },
  { href: 'https://www.nfl.com/international/global-markets-program', label: 'NFL.com – Global Markets Program' },
];

const FAQ = [
  {
    q: 'Wann ist das NFL-Spiel in München 2026?',
    a: 'Am Sonntag, 15. November 2026. Anstoß ist um 15:30 Uhr deutscher Zeit, es ist ein Spiel der Week 10 der regulären Saison.',
  },
  {
    q: 'Wer spielt beim Munich Game 2026?',
    a: 'Die Detroit Lions empfangen als Heimteam die New England Patriots. Die Lions besitzen seit 2024 die Marketingrechte der NFL für Deutschland, Österreich und die Schweiz.',
  },
  {
    q: 'Wo wird das NFL-Spiel in München übertragen?',
    a: 'RTL zeigt das Spiel live und kostenlos im Free-TV.',
  },
  {
    q: 'Gibt es noch Tickets für das Munich Game?',
    a: 'Nein, das Spiel ist ausverkauft. Freie Karten gibt es nur noch über die offiziellen Kanäle, für die man sich auf nfl.com/munich registrieren kann. Von überteuerten Tickets aus privatem Weiterverkauf ist abzuraten: Die NFL kann solche Karten stornieren.',
  },
  {
    q: 'Was haben die Tickets gekostet?',
    a: 'Zwischen 83,59 € (Kategorie 8) und 413,75 € (Kategorie 1), jeweils inklusive Gebühren. Kinder unter 16 Jahren bekamen Karten ab 42,17 €.',
  },
  {
    q: 'Wie komme ich zur Allianz Arena?',
    a: 'Mit der U6 bis zur Station Fröttmaning, von dort sind es etwa zehn Minuten zu Fuß über die Esplanade. Ab Marienplatz dauert die Fahrt rund 20 Minuten.',
  },
  {
    q: 'Wer spielt die Halbzeitshow?',
    a: 'Die US-Rockband Cage The Elephant, das hat die NFL am 8. September 2026 bekanntgegeben.',
  },
];

const dayFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

function FormCard({ t, role, slug }: { t: TeamOverview | null; role: string; slug: string }) {
  if (!t) return null;
  const last = t.last;
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        {t.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logo} alt={`Logo ${t.name}`} width={56} height={56} className="w-14 h-14" />
        )}
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-mute">{role}</div>
          <h3 className="font-display text-2xl font-bold">{t.name}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm">
        {`Bilanz ${t.record}`}
        {t.standingSummary && ` · ${standingDe(t.standingSummary)}`}
        {` · ${t.pointsFor}:${t.pointsAgainst} Punkte`}
      </p>
      {last && last.teamScore !== null && last.opponentScore !== null && (
        <p className="mt-1 text-sm text-mute">
          {`Zuletzt: ${last.home ? 'vs.' : '@'} ${last.opponentName} ${last.teamScore}:${last.opponentScore}`}
        </p>
      )}
      <Link href={`/teams/${slug}`} className="inline-block mt-4 text-sm text-primary hover:text-accent">
        {`Kader & Spielplan der ${t.shortName} →`}
      </Link>
    </div>
  );
}

export default async function MunichGamePage() {
  const [lions, patriots] = await Promise.all([getTeamOverview('DET'), getTeamOverview('NE')]);
  const days = Math.ceil((new Date(KICKOFF).getTime() - Date.now()) / 86_400_000);

  const lionsRef = { '@type': 'SportsTeam', name: 'Detroit Lions', url: `${SITE_URL}/teams/det` };
  const patsRef = { '@type': 'SportsTeam', name: 'New England Patriots', url: `${SITE_URL}/teams/ne` };
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: 'NFL Munich Game 2026: New England Patriots @ Detroit Lions',
      description: 'Spiel der Week 10 der NFL-Saison 2026 in der Allianz Arena München.',
      startDate: KICKOFF,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      sport: 'American Football',
      image: [`${SITE_URL}/og.png`],
      location: {
        '@type': 'StadiumOrArena',
        name: 'Allianz Arena',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Werner-Heisenberg-Allee 25',
          postalCode: '80939',
          addressLocality: 'München',
          addressCountry: 'DE',
        },
      },
      homeTeam: lionsRef,
      awayTeam: patsRef,
      competitor: [lionsRef, patsRef],
      organizer: { '@type': 'SportsOrganization', name: 'National Football League', url: 'https://www.nfl.com' },
      offers: {
        '@type': 'AggregateOffer',
        url: 'https://www.nfl.com/international/games/munich/',
        priceCurrency: 'EUR',
        lowPrice: 83.59,
        highPrice: 413.75,
        availability: 'https://schema.org/SoldOut',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <span className="chip-warn chip">International Game</span>
      <h1 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
        NFL Munich Game 2026: <span className="grad-text italic">Patriots @ Lions</span> in der Allianz
        Arena
      </h1>
      <p className="text-mute mt-4 text-lg leading-relaxed max-w-3xl">
        Am 15. November 2026 kommt die NFL zurück nach München. Die Detroit Lions — das Team mit den
        Deutschland-Rechten der NFL — empfangen die New England Patriots. Hier steht alles, was du zu
        Anstoß, TV-Übertragung, Tickets und Anreise wissen musst.
        {days > 0 && ` Noch ${days} ${days === 1 ? 'Tag' : 'Tage'} bis zum Kickoff.`}
      </p>
      <p className="text-xs text-mute mt-2 font-mono">{`Stand: ${dayFmt.format(new Date(UPDATED))} · wird laufend aktualisiert`}</p>

      <section aria-labelledby="fakten" className="card p-6 mt-10">
        <h2 id="fakten" className="font-display text-2xl font-bold">
          Das Wichtigste auf einen Blick
        </h2>
        <dl className="mt-4 grid sm:grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-mute">Datum</dt>
          <dd>Sonntag, 15. November 2026 (Week 10)</dd>
          <dt className="text-mute">Anstoß</dt>
          <dd>15:30 Uhr deutscher Zeit</dd>
          <dt className="text-mute">Stadion</dt>
          <dd>Allianz Arena, Werner-Heisenberg-Allee 25, 80939 München-Fröttmaning</dd>
          <dt className="text-mute">Heimteam</dt>
          <dd>
            <Link href="/teams/det" className="text-primary hover:text-accent">
              Detroit Lions
            </Link>
          </dd>
          <dt className="text-mute">Gast</dt>
          <dd>
            <Link href="/teams/ne" className="text-primary hover:text-accent">
              New England Patriots
            </Link>
          </dd>
          <dt className="text-mute">TV</dt>
          <dd>RTL, live und kostenlos im Free-TV</dd>
          <dt className="text-mute">Tickets</dt>
          <dd>ausverkauft (83,59 € bis 413,75 €)</dd>
          <dt className="text-mute">Halbzeitshow</dt>
          <dd>Cage The Elephant</dd>
        </dl>
      </section>

      <section aria-labelledby="form" className="mt-12">
        <h2 id="form" className="font-display text-3xl font-bold">
          Formcheck: So stehen Lions und Patriots
        </h2>
        <p className="text-mute text-sm mt-1">Live-Bilanz der Saison 2026, stündlich aktualisiert.</p>
        <div className="grid md:grid-cols-2 gap-6 mt-5">
          <FormCard t={lions} role="Heimteam" slug="det" />
          <FormCard t={patriots} role="Gast" slug="ne" />
        </div>
      </section>

      <div className="mt-12 grid md:grid-cols-2 gap-6 text-sm leading-relaxed">
        <section aria-labelledby="tickets" className="card p-6">
          <h2 id="tickets" className="font-display text-xl font-bold">
            Tickets
          </h2>
          <p className="text-mute mt-3">
            Der Vorverkauf lief exklusiv über die NFL, das Spiel ist ausverkauft. Die Preise lagen
            zwischen 83,59 € in Kategorie 8 und 413,75 € in Kategorie 1, jeweils inklusive Gebühren;
            Kinder unter 16 Jahren zahlten ab 42,17 €.
          </p>
          <p className="text-mute mt-3">
            Wer noch hinwill, sollte sich auf{' '}
            <a
              href="https://www.nfl.com/international/games/munich/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              nfl.com/munich
            </a>{' '}
            für Ticket-News registrieren. Dort stehen auch die offiziellen Anbieter von Reise- und
            Hotelpaketen. Vorsicht bei privatem Weiterverkauf zu Mondpreisen: Die NFL kann solche
            Tickets stornieren.
          </p>
        </section>

        <section aria-labelledby="anreise" className="card p-6">
          <h2 id="anreise" className="font-display text-xl font-bold">
            Anreise zur Allianz Arena
          </h2>
          <p className="text-mute mt-3">
            Am einfachsten mit der <strong className="text-ink">U6</strong> bis zur Station{' '}
            <strong className="text-ink">Fröttmaning</strong>. Von dort sind es etwa zehn Minuten zu
            Fuß über die Esplanade zum Stadion. Ab Marienplatz dauert die Fahrt rund 20 Minuten.
          </p>
          <p className="text-mute mt-3">
            Plane an einem ausverkauften Spieltag mit rund 70.000 Fans mehr Zeit ein: Rund um den
            Anstoß sind die Züge voll, und an den Eingängen bilden sich Schlangen.
          </p>
        </section>

        <section aria-labelledby="tv" className="card p-6">
          <h2 id="tv" className="font-display text-xl font-bold">
            TV-Übertragung
          </h2>
          <p className="text-mute mt-3">
            RTL überträgt das Munich Game live und kostenlos im Free-TV. Anstoß ist um 15:30 Uhr —
            ungewöhnlich früh für NFL-Fans in Deutschland, die sonst erst ab 19 Uhr Football schauen.
            Die Live-Spielstände und den Drive-Tracker gibt es während des Spiels auf unserer{' '}
            <Link href="/news" className="text-primary hover:underline">
              Live-Seite
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="stbrown" className="card p-6">
          <h2 id="stbrown" className="font-display text-xl font-bold">
            Warum die Lions für Deutschland wichtig sind
          </h2>
          <p className="text-mute mt-3">
            Detroit hält seit 2024 im Global Markets Program der NFL die Marketingrechte für
            Deutschland, Österreich und die Schweiz. Mit Receiver Amon-Ra St. Brown steht dazu einer
            der besten Passempfänger der Liga im Kader, der fließend Deutsch spricht — seine Mutter
            stammt aus Deutschland. Für viele Fans hierzulande ist das Spiel deshalb ein Heimspiel im
            doppelten Sinn.
          </p>
        </section>
      </div>

      <section aria-labelledby="historie" className="mt-12 card p-6 text-sm leading-relaxed">
        <h2 id="historie" className="font-display text-xl font-bold">
          Die NFL in München
        </h2>
        <p className="text-mute mt-3">
          2026 ist das dritte Spiel der regulären Saison in der Allianz Arena. Die Premiere 2022
          gewannen die Tampa Bay Buccaneers mit 21:16 gegen die Seattle Seahawks, 2024 setzten sich
          die Carolina Panthers mit 20:17 nach Verlängerung gegen die New York Giants durch.
        </p>
      </section>

      <section aria-labelledby="faq" className="mt-12">
        <h2 id="faq" className="font-display text-3xl font-bold">
          Häufige Fragen zum Munich Game
        </h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card p-5 group">
              <summary className="font-semibold cursor-pointer">{f.q}</summary>
              <p className="text-mute text-sm mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="quellen" className="mt-12 text-sm">
        <h2 id="quellen" className="font-display text-xl font-bold">
          Quellen
        </h2>
        <ul className="mt-3 space-y-1.5">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {s.label} <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-mute mt-4">
          Mehr zum Spiel im{' '}
          <Link href="/magazin/nfl-munich-game-2026-patriots-lions" className="text-primary hover:underline">
            Magazin-Artikel zur Ankündigung
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
