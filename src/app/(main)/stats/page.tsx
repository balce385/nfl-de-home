import Link from 'next/link';
import { AdvancedStatsTable } from '@/components/stats/AdvancedStatsTable';
import { getAdvancedStats, type PositionGroup } from '@/lib/advanced-stats';
import { PressureTable } from '@/components/stats/PressureTable';
import { AdvTable, type AdvColumn } from '@/components/stats/AdvTable';
import {
  getPressureLeaders,
  getReceivingAdvanced,
  getRushingAdvanced,
  getDefenseAdvanced,
  getQbr,
  type AdvPlayerRow,
} from '@/lib/pfr-advanced';
import { getAllTeams } from '@/lib/nfl-live';
import { withSeo } from '@/lib/seo';

export const metadata = withSeo({
  title: 'NFL Advanced Stats: QBR, ADoT & Next Gen Stats',
  description:
    'Total QBR, Druckrate, ADoT, Yards nach dem Kontakt, gebrochene Tackles, zugelassenes Passer Rating, Separation und 8+ in der Box — Advanced Stats für Quarterbacks, Receiver, Tight Ends, Running Backs und die Defense, auf Deutsch erklärt.',
  path: '/stats',
});

export const revalidate = 900;

/** "DEF" hat keine Next Gen Stats — die Defense-Werte kommen allein von PFR. */
type Tab = PositionGroup | 'DEF';

const GROUPS: { key: Tab; label: string }[] = [
  { key: 'QB', label: 'Quarterbacks' },
  { key: 'REC', label: 'Receiver & TE' },
  { key: 'RUSH', label: 'Running Backs' },
  { key: 'DEF', label: 'Defense' },
];

/* Spalten der PFR- und QBR-Tabellen. `metric` verweist auf METRICS in
   nfl-stats.ts und liefert Label, Tooltip und die Legende unter der Tabelle. */

const QBR_COLUMNS: AdvColumn[] = [
  { key: 'qbr', metric: 'qbr' },
  { key: 'qb_plays', label: 'Plays', plain: true },
  { key: 'pts_added', metric: 'pts_added' },
  { key: 'epa_total', metric: 'epa_total' },
  { key: 'epa_pass', metric: 'epa_pass' },
  { key: 'epa_run', metric: 'epa_run' },
  { key: 'epa_sack', metric: 'epa_sack' },
];

const REC_COLUMNS: AdvColumn[] = [
  { key: 'tgt', label: 'Targets', plain: true },
  { key: 'rec', label: 'Fänge', plain: true },
  { key: 'rec_yards', label: 'Yards', plain: true },
  { key: 'rec_td', label: 'TD', plain: true },
  { key: 'adot', metric: 'adot' },
  { key: 'ybc_r', metric: 'ybc_r' },
  { key: 'yac_r', metric: 'yac_r' },
  { key: 'brk_tkl', label: 'Tackles gebr.', plain: true },
  { key: 'rec_br', metric: 'rec_br' },
  { key: 'drop_pct', metric: 'drop_pct' },
  { key: 'tgt_rating', metric: 'tgt_rating' },
];

const RUSH_COLUMNS: AdvColumn[] = [
  { key: 'att', label: 'Läufe', plain: true },
  { key: 'rush_yards', label: 'Yards', plain: true },
  { key: 'rush_td', label: 'TD', plain: true },
  { key: 'first_downs', label: 'First Downs', plain: true },
  { key: 'ybc_att', metric: 'ybc_att' },
  { key: 'yac_att', metric: 'yac_att' },
  { key: 'brk_tkl', label: 'Tackles gebr.', plain: true },
  { key: 'att_br', metric: 'att_br' },
];

const DEF_COLUMNS: AdvColumn[] = [
  { key: 'def_tgt', label: 'Angespielt', plain: true },
  { key: 'cmp_pct_allowed', metric: 'cmp_pct_allowed' },
  { key: 'yds_per_tgt', metric: 'yds_per_tgt' },
  { key: 'rating_allowed', metric: 'rating_allowed' },
  { key: 'dadot', metric: 'dadot' },
  { key: 'def_int', label: 'INT', plain: true },
  { key: 'pressures', label: 'Pressures', plain: true },
  { key: 'sacks', label: 'Sacks', plain: true },
  { key: 'qb_hits', label: 'QB-Treffer', plain: true },
  { key: 'blitzes', label: 'Blitzes', plain: true },
  { key: 'tackles', label: 'Tackles', plain: true },
  { key: 'missed_tackle_pct', metric: 'missed_tackle_pct' },
];

/** Welche PFR-Tabelle unter welchem Reiter steht. */
const EXTRA: Record<
  Tab,
  {
    load: () => Promise<AdvPlayerRow[]>;
    columns: AdvColumn[];
    sort: string;
    chip: string;
    heading: string;
    accent: string;
    intro: string;
  } | null
> = {
  QB: {
    load: () => getQbr(40),
    columns: QBR_COLUMNS,
    sort: 'qbr',
    chip: 'ESPN Total QBR',
    heading: 'Der ganze',
    accent: 'Spielzug',
    intro:
      'Passer Rating zählt nur Würfe. Total QBR bezieht Läufe, Sacks, Strafen und die Spielsituation mit ein und gewichtet einen Wurf im vierten Viertel höher als einen bei zwanzig Punkten Vorsprung. 50 ist Liga-Durchschnitt. Als einzige Quelle hier liefert ESPN die Werte schon während der laufenden Saison.',
  },
  REC: {
    load: () => getReceivingAdvanced(60),
    columns: REC_COLUMNS,
    sort: 'rec_yards',
    chip: 'Pro Football Reference',
    heading: 'Wer den Raum',
    accent: 'selbst holt',
    intro:
      'Ein Fang über 20 Yards kann ein tiefer Wurf sein oder ein kurzer Ball mit 18 Yards Lauf danach. Diese Tabelle trennt beides: ADoT zeigt die Tiefe des Anspiels, Yards vor und nach dem Fang die Aufteilung der Arbeit. Ab 40 Anspielen.',
  },
  RUSH: {
    load: () => getRushingAdvanced(50),
    columns: RUSH_COLUMNS,
    sort: 'rush_yards',
    chip: 'Pro Football Reference',
    heading: 'Line oder',
    accent: 'Running Back',
    intro:
      'Yards vor dem Kontakt gehen aufs Konto der Offensive Line, Yards nach dem Kontakt auf das des Running Backs. Wer viel von Letzterem hat, läuft hinter schlechter Blockarbeit — oder ist einfach schwer zu Boden zu bringen. Ab 60 Läufen.',
  },
  DEF: {
    load: () => getDefenseAdvanced(60),
    columns: DEF_COLUMNS,
    sort: 'pressures',
    chip: 'Pro Football Reference',
    heading: 'Die andere',
    accent: 'Seite des Balls',
    intro:
      'Coverage und Pass Rush in einer Tabelle: links, was Quarterbacks gegen diesen Spieler erreichen, rechts, wie oft er selbst beim Quarterback ankommt. Aufgenommen wird, wer oft angespielt wurde oder viel Druck erzeugt hat — sonst fehlten je nach Filter die Defensive Line oder die Cornerbacks.',
  },
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { pos?: string };
}) {
  const group: Tab = GROUPS.some((g) => g.key === searchParams.pos)
    ? (searchParams.pos as Tab)
    : 'QB';

  const extra = EXTRA[group];
  const [{ rows, season, minVolume }, pressure, extraRows, allTeams] = await Promise.all([
    // Die Defense hat keine Next-Gen-Stats-Zeilen; der Aufruf entfällt.
    group === 'DEF'
      ? Promise.resolve({ rows: [], season: null, minVolume: null })
      : getAdvancedStats(group as PositionGroup),
    group === 'QB' ? getPressureLeaders(20) : Promise.resolve([]),
    extra ? extra.load() : Promise.resolve([]),
    getAllTeams(),
  ]);
  // Fuer die Vorschlaege im Suchfeld; das Logo steht schon im ESPN-Teamabruf.
  const teams = allTeams.map((t) => ({ id: t.id, name: t.name, shortName: t.shortName, logo: t.logo }));

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

      {group !== 'DEF' && rows.length === 0 && (
        <div className="card p-6">
          <p className="text-sm text-mute">
            Für diese Position liegen noch keine Tracking-Daten vor. Die Werte kommen aus dem
            nächtlichen Datenlauf und erscheinen, sobald die NFL sie veröffentlicht.
          </p>
        </div>
      )}
      {group !== 'DEF' && rows.length > 0 && (
        <AdvancedStatsTable
          group={group as PositionGroup}
          rows={rows}
          season={season}
          minVolume={minVolume}
          teams={teams}
        />
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

      {/* Charting-Daten je Positionsgruppe (PFR bzw. ESPN QBR ueber nflverse) */}
      {extra && extraRows.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
            <div>
              <span className="chip">{extra.chip}</span>
              <h2 className="font-display text-3xl font-bold mt-3">
                {extra.heading} <span className="grad-text italic">{extra.accent}</span>.
              </h2>
              <p className="text-mute mt-2 max-w-2xl">{extra.intro}</p>
            </div>
            <span className="text-xs font-mono text-mute">Saison {extraRows[0].season}</span>
          </div>
          <AdvTable
            teams={teams}
            rows={extraRows}
            columns={extra.columns}
            defaultSort={extra.sort}
            caption={`${GROUPS.find((g) => g.key === group)?.label} · Saison ${extraRows[0].season}`}
          />
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
          Druckrate, Pocket-Zeit, Wurfqualität, die Tiefe der Anspiele, Yards vor und nach dem
          Kontakt, gebrochene Tackles sowie die Coverage- und Pass-Rush-Werte der Defense chartet{' '}
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
          Total QBR kommt von{' '}
          <a
            href="https://www.espn.com/nfl/qbr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ESPN
          </a>{' '}
          und ist die einzige Tabelle hier, die schon während der laufenden Saison gefüllt ist.
        </p>
        <p className="text-sm text-mute mt-3 leading-relaxed">
          <strong className="text-ink">Nicht dabei:</strong> Pass Block Win Rate, Pass Rush Win
          Rate, Burn Rate, Routes Run und damit auch YPRR. Diese Kennzahlen entstehen durch
          manuelles Charting bei ESPN, PFF und SumerSports, sind kostenpflichtig lizenziert und
          lassen sich aus offenen Tracking-Daten nicht nachbauen. Lieber gar kein Wert als ein
          erfundener.
        </p>
      </div>
    </div>
  );
}
