import Link from 'next/link';

export const metadata = {
  title: 'API',
  description:
    'Die öffentlichen JSON-Endpunkte des NFL-DE-Hub: Team-Übersicht, News, Kader, Spielsituation.',
  alternates: { canonical: '/api-docs' },
};

/**
 * Ehrliche API-Dokumentation: nur die Endpunkte, die es wirklich gibt.
 * Sie existieren als Proxy für den eigenen Browser-Code, sind aber offen
 * erreichbar — deshalb hier beschrieben statt als „API v1" beworben.
 */
const endpoints = [
  {
    path: '/api/team-overview',
    params: 'team=KC',
    desc: 'Bilanz, Divisionsplatz, nächstes und letztes Spiel, kommender Spielplan.',
    cache: '15 Min.',
  },
  {
    path: '/api/team-news',
    params: 'team=KC&limit=5',
    desc: 'Aktuelle Meldungen zu einem Team. Ohne team-Parameter ligaweite News.',
    cache: '5 Min.',
  },
  {
    path: '/api/team-roster',
    params: 'team=KC',
    desc: 'Kompletter Kader, nach Positionsgruppen gegliedert.',
    cache: '1 Std.',
  },
  {
    path: '/api/team-stats',
    params: 'team=KC',
    desc: 'Saisonwerte des Starting-Quarterbacks samt Yards-Verlauf der letzten Spiele.',
    cache: '30 Min.',
  },
  {
    path: '/api/game-situation',
    params: 'event=401872656',
    desc: 'Live-Spielstand mit Ballbesitz, Down & Distance, Siegwahrscheinlichkeit und laufendem Drive. Ohne event-Parameter alle Spiele des Spieltags.',
    cache: '15 Sek.',
  },
];

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <span className="chip">Entwickler</span>
      <h1 className="font-display text-5xl font-bold mt-4">API.</h1>
      <p className="text-mute mt-3 text-lg leading-relaxed max-w-2xl">
        Diese Endpunkte holen die Sportdaten server-seitig und geben sie als JSON zurück. Sie
        existieren, weil ESPN keine CORS-Header sendet und der Browser dort nicht direkt anfragen
        kann. Sie sind offen erreichbar — kein Schlüssel, keine Anmeldung.
      </p>

      <div className="card p-5 mt-8 text-sm">
        <p className="text-mute leading-relaxed">
          <strong className="text-ink">Fair use:</strong> Es gibt keine Zugangsbeschränkung, aber
          auch keine Zusage auf Verfügbarkeit oder feste Antwortformate. Die Daten gehören ihren
          Quellen (ESPN, nflverse, TheSportsDB) — wer sie weiterverwendet, hält sich an deren
          Bedingungen. Für ernsthafte Nutzung bitte direkt bei der Quelle abfragen statt hier.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {endpoints.map((e) => (
          <div key={e.path} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <code className="font-mono text-sm text-primary break-all">
                GET {e.path}?{e.params}
              </code>
              <span className="chip text-[10px]">Cache {e.cache}</span>
            </div>
            <p className="text-sm text-mute mt-2 leading-relaxed">{e.desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-10 text-sm">
        <h2 className="font-display text-lg font-bold mb-2">Beispiel</h2>
        <pre className="bg-black/40 border border-line rounded-lg p-4 overflow-x-auto text-xs font-mono">
          <code>{`curl https://nfl-fan-app.de/api/team-overview?team=KC`}</code>
        </pre>
        <p className="text-mute mt-3">
          Team-Kürzel sind die üblichen drei Zeichen (KC, SF, NE …). Washington ist{' '}
          <code className="font-mono text-ink">WAS</code>, die Rams sind{' '}
          <code className="font-mono text-ink">LAR</code>.
        </p>
      </div>

      <p className="text-sm text-mute mt-8">
        Fragen dazu?{' '}
        <Link href="/kontakt" className="text-primary hover:underline">
          Kontakt
        </Link>
      </p>
    </div>
  );
}
