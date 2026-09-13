import Link from 'next/link';
import { AdvancedStatsTable } from '@/components/stats/AdvancedStatsTable';
import { getAdvancedStats, type PositionGroup } from '@/lib/advanced-stats';
import { PressureTable } from '@/components/stats/PressureTable';
import { getPressureLeaders } from '@/lib/pfr-advanced';

export const metadata = {
  title: 'Advanced Stats — Passer Rating, CPOE, Separation & Next Gen Stats',
  description:
    'Passer Rating, CPOE, Time to Throw, Separation, YAC über Erwartung und 8+ in der Box — die Tracking-Daten der NFL für alle Spieler, auf Deutsch erklärt.',
  alternates: { canonical: '/stats' },
};

export const revalidate = 900;

const GROUPS: { key: PositionGroup; label: string }[] = [
  { key: 'QB', label: 'Quarterbacks' },
  { key: 'REC', label: 'Receiver & TE' },
  { key: 'RUSH', label: 'Running Backs' },
];

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { pos?: string };
}) {
  const group: PositionGroup = GROUPS.some((g) => g.key === searchParams.pos)
    ? (searchParams.pos as PositionGroup)
    : 'QB';

  const [{ rows, season }, pressure] = await Promise.all([
    getAdvancedStats(group),
    getPressureLeaders(20),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip">Advanced Stats</span>
          <span className="chip-accent chip">Next Gen Stats</span>
        </div>
        <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
          Zahlen, die das <span className="grad-text italic">Boxscore</span> nicht zeigt.
        </h1>
        <p className="text-mute mt-3 text-lg">
          Die NFL misst per Chip in Schulterpolstern und Ball, wie schnell ein Quarterback wirft, wie
          frei ein Receiver steht und wie voll die Box beim Lauf war. Hier stehen diese Werte für
          alle Spieler — mit deutscher Erklärung zu jeder Kennzahl.
        </p>
      </div>

      {/* Positionsgruppen */}
      <div className="flex flex-wrap gap-2 mb-8">
        {GROUPS.map((g) => (
          <Link
            key={g.key}
            href={`/stats?pos=${g.key}`}
            scroll={false}
            className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
              group === g.key
                ? 'border-primary bg-primary/10 text-ink'
                : 'border-line bg-white/5 text-mute hover:bg-white/10'
            }`}
          >
            {g.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-mute">
            Für diese Position liegen noch keine Tracking-Daten vor. Die Werte kommen aus dem
            nächtlichen Datenlauf und erscheinen, sobald die NFL sie veröffentlicht.
          </p>
        </div>
      ) : (
        <AdvancedStatsTable group={group} rows={rows} season={season} />
      )}

      {/* Druck und Wurfqualitaet (Pro-Football-Reference ueber nflverse) */}
      {pressure.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
            <div>
              <span className="chip">Pro Football Reference</span>
              <h2 className="font-display text-3xl font-bold mt-3">
                Unter <span className="grad-text italic">Druck</span>.
              </h2>
              <p className="text-mute mt-2 max-w-2xl">
                Next Gen Stats messen, wie schnell ein Quarterback wirft. Diese Zahlen zeigen, unter
                welchen Bedingungen er das tut: wie oft die Defense durchkam, wie lange die Pocket
                hielt und wie viele Bälle überhaupt fangbar waren. Sortiert nach Druckrate, ab 150
                Würfen.
              </p>
            </div>
            <span className="text-xs font-mono text-mute">Saison {pressure[0].season}</span>
          </div>
          <PressureTable rows={pressure} />
        </section>
      )}

      {/* Ehrlichkeit zur Datenlage */}
      <div className="card p-6 mt-10 max-w-3xl">
        <h2 className="font-display text-lg font-bold">Woher die Zahlen kommen</h2>
        <p className="text-sm text-mute mt-2 leading-relaxed">
          Tracking-Werte stammen aus den Next Gen Stats der NFL, bereitgestellt über{' '}
          <a
            href="https://github.com/nflverse/nflverse-data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            nflverse
          </a>
          . Das Passer Rating rechnen wir selbst nach der offiziellen NFL-Formel und prüfen die
          Rechnung gegen die Werte der Liga.
        </p>
        <p className="text-sm text-mute mt-3 leading-relaxed">
          Druckrate, Blitzes, Pocket-Zeit und Wurfqualität chartet{' '}
          <a
            href="https://www.pro-football-reference.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Pro Football Reference
          </a>{' '}
          von Hand; nflverse spiegelt die Tabellen, deshalb stehen sie hier ohne Scraping und ohne
          Lizenzkosten. PFR trägt sie erst im Saisonverlauf nach — im September steht deshalb noch
          die Vorsaison in der Tabelle.
        </p>
        <p className="text-sm text-mute mt-3 leading-relaxed">
          <strong className="text-ink">Nicht dabei:</strong> Pass Block Win Rate, Pass Rush Win
          Rate, Burn Rate und Route Run Percentage. Diese Kennzahlen entstehen durch manuelles
          Charting bei ESPN und PFF, sind kostenpflichtig lizenziert und lassen sich aus
          Tracking-Daten nicht nachbauen. Lieber gar kein Wert als ein erfundener.
        </p>
      </div>
    </div>
  );
}
