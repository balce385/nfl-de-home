/**
 * Pro-Football-Reference Advanced Passing über nflverse.
 *
 * PFR selbst sperrt Server-IPs (der HTML-Scraper in scrapers/pfr_stats.py
 * läuft deshalb in 403). nflverse spiegelt dieselben Zahlen als CSV im
 * Release `pfr_advstats` — 91 kB, keine Anmeldung, kein Scraping.
 *
 * Die Werte ergänzen die Next Gen Stats: dort steht, wie schnell ein
 * Quarterback wirft, hier, unter welchem Druck er das tut und wie viele
 * seiner Bälle überhaupt ankommen konnten.
 */

const URL =
  'https://github.com/nflverse/nflverse-data/releases/download/pfr_advstats/advstats_season_pass.csv';

export type PressureRow = {
  player: string;
  team: string;
  season: number;
  attempts: number;
  /** Anteil der Dropbacks unter gegnerischem Druck. */
  pressurePct: number | null;
  /** Anteil schlechter Würfe (ohne Throwaways und Spikes). */
  badThrowPct: number | null;
  /** Anteil Würfe, die den Receiver erreichbar trafen. */
  onTargetPct: number | null;
  /** Sekunden in der Pocket bis zum Wurf. */
  pocketTime: number | null;
  /** Wie oft die Defense geblitzt hat. */
  blitzed: number | null;
  /** Anteil gefangener Bälle, die der Receiver fallen ließ. */
  dropPct: number | null;
};

/** Minimale Wurfzahl, damit ein Quarterback in der Tabelle auftaucht. */
const MIN_ATTEMPTS = 150;

/** CSV mit Anführungszeichen-Unterstützung; nflverse liefert Felder unquoted, Namen können aber Kommas enthalten. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    head.forEach((key, i) => (row[key] = cells[i] ?? ''));
    return row;
  });
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const num = (v: string): number | null => {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) ? n : null;
};

/**
 * Die Quarterbacks der jüngsten Saison im Datensatz, nach Würfen sortiert.
 *
 * Welche Saison das ist, entscheidet der Datensatz selbst: PFR trägt die
 * Werte erst nach den ersten Spieltagen nach, im September steht deshalb noch
 * die Vorsaison drin.
 */
export async function getPressureLeaders(limit = 25): Promise<PressureRow[]> {
  const res = await fetch(URL, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return [];

  const rows = parseCsv(await res.text());
  const seasons = rows.map((r) => Number(r.season)).filter(Number.isFinite);
  if (seasons.length === 0) return [];
  const latest = Math.max(...seasons);

  return rows
    .filter((r) => Number(r.season) === latest)
    .map((r): PressureRow => ({
      player: r.player,
      // nflverse nutzt "LA" für die Rams, der Rest der App "LAR".
      team: r.team === 'LA' ? 'LAR' : r.team,
      season: latest,
      attempts: Number(r.pass_attempts) || 0,
      pressurePct: num(r.pressure_pct),
      badThrowPct: num(r.bad_throw_pct),
      onTargetPct: num(r.on_tgt_pct),
      pocketTime: num(r.pocket_time),
      blitzed: num(r.times_blitzed),
      dropPct: num(r.drop_pct),
    }))
    .filter((r) => r.player && r.attempts >= MIN_ATTEMPTS)
    .sort((a, b) => (b.pressurePct ?? 0) - (a.pressurePct ?? 0))
    .slice(0, limit);
}
