/**
 * Advanced Stats aus offenen Quellen über nflverse.
 *
 * Deckt ab, was Anbieter wie SumerSports oder PFF hinter einer Bezahlschranke
 * zeigen, soweit es öffentlich verfügbar ist:
 *
 *   - Pro-Football-Reference, Release `pfr_advstats`: Druck, Wurfqualität,
 *     Tiefe der Anspiele, Yards vor/nach dem Fang, gebrochene Tackles, Drops
 *     und die Coverage-Werte der Defense. PFR selbst sperrt Server-IPs (der
 *     HTML-Scraper in scrapers/pfr_stats.py läuft deshalb in 403), nflverse
 *     spiegelt dieselben Tabellen als CSV.
 *   - ESPN Total QBR, Release `espn_data`: die einzige dieser Quellen, die
 *     schon während der laufenden Saison Werte liefert.
 *
 * Die Werte ergänzen die Next Gen Stats: dort steht, wie schnell ein
 * Quarterback wirft, hier, unter welchem Druck er das tut und wie viele
 * seiner Bälle überhaupt ankommen konnten.
 *
 * Achtung Skalen — PFR mischt sie je Datei:
 *   advstats_season_pass.csv  → pressure_pct = 19.1  (echte Prozent)
 *   advstats_season_rec.csv   → drop_percent = 0.024 (Anteil)
 *   advstats_season_def.csv   → cmp_percent  = 0.767 (Anteil)
 * Anteile werden hier einmal zentral auf Prozent gebracht, damit die Oberfläche
 * jede Spalte gleich behandeln kann.
 */

const PFR = 'https://github.com/nflverse/nflverse-data/releases/download/pfr_advstats';
const ESPN_QBR =
  'https://github.com/nflverse/nflverse-data/releases/download/espn_data/qbr_season_level.csv';

/** Einen Tag cachen — die Quellen werden höchstens täglich nachgetragen. */
const CACHE = { next: { revalidate: 60 * 60 * 24 } } as const;

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

/**
 * Eine Zeile einer Advanced-Tabelle.
 *
 * Die Kennzahlen stehen bewusst in `stats` statt als feste Felder: Receiving,
 * Rushing, Defense und QBR haben komplett andere Spalten, teilen sich aber
 * dieselbe Tabellenkomponente.
 */
export type AdvPlayerRow = {
  /** Spieler-ID der Quelle (PFR bzw. ESPN) — eindeutig, taugt als React-Key. */
  id: string;
  player: string;
  team: string;
  pos: string | null;
  season: number;
  games: number;
  stats: Record<string, number | null>;
};

/** Minimale Wurfzahl, damit ein Quarterback in der Tabelle auftaucht. */
const MIN_ATTEMPTS = 150;
/** Mindestvolumen je Tabelle, damit Kleinststichproben nichts verzerren. */
const MIN_TARGETS = 40;
const MIN_CARRIES = 60;
/** Defense: entweder genug Anspiele gegen sich oder genug Druck auf den QB. */
const MIN_DEF_TARGETS = 25;
const MIN_DEF_PRESSURES = 15;

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

/** Anteil (0,024) auf Prozent (2,4) bringen. */
const asPct = (v: string): number | null => {
  const n = num(v);
  return n === null ? null : n * 100;
};

/**
 * Team-Kürzel der Quelle auf das der App abbilden.
 *
 * nflverse nutzt "LA" für die Rams, ESPN "WSH" für Washington — unsere
 * teams-Tabelle (und das Frontend in nfl-live.ts) kennt LAR und WAS.
 */
const team = (t: string): string => (t === 'LA' ? 'LAR' : t === 'WSH' ? 'WAS' : t);

/**
 * Lädt eine nflverse-CSV und gibt nur die Zeilen der jüngsten enthaltenen
 * Saison zurück.
 *
 * Welche Saison das ist, entscheidet der Datensatz selbst: PFR trägt die Werte
 * erst nach den ersten Spieltagen nach, im September steht deshalb noch die
 * Vorsaison drin. ESPNs QBR steht dagegen sofort zur Verfügung — beide Fälle
 * deckt dieselbe Logik ab.
 */
async function latestSeasonRows(
  url: string
): Promise<{ rows: Record<string, string>[]; season: number }> {
  const res = await fetch(url, CACHE);
  if (!res.ok) return { rows: [], season: 0 };

  const rows = parseCsv(await res.text());
  const seasons = rows.map((r) => Number(r.season)).filter(Number.isFinite);
  if (seasons.length === 0) return { rows: [], season: 0 };

  const season = Math.max(...seasons);
  return { rows: rows.filter((r) => Number(r.season) === season), season };
}

/**
 * Bei einem Teamwechsel führt PFR denselben Spieler mehrfach: einmal je Team
 * und einmal als Saisonsumme ("2TM"). Ohne diesen Schritt stünde er doppelt in
 * der Rangliste — es gewinnt die Zeile mit dem größten Volumen, also die Summe.
 */
function bestPerPlayer(rows: AdvPlayerRow[], volumeKey: string): AdvPlayerRow[] {
  const best = new Map<string, AdvPlayerRow>();
  for (const row of rows) {
    const cur = best.get(row.id);
    if (!cur || (row.stats[volumeKey] ?? 0) > (cur.stats[volumeKey] ?? 0)) best.set(row.id, row);
  }
  return [...best.values()];
}

const byStat = (key: string) => (a: AdvPlayerRow, b: AdvPlayerRow) =>
  (b.stats[key] ?? 0) - (a.stats[key] ?? 0);

/**
 * Die Quarterbacks der jüngsten Saison im Datensatz, nach Druckrate sortiert.
 */
export async function getPressureLeaders(limit = 25): Promise<PressureRow[]> {
  const { rows, season } = await latestSeasonRows(`${PFR}/advstats_season_pass.csv`);

  return rows
    .map(
      (r): PressureRow => ({
        player: r.player,
        team: team(r.team),
        season,
        attempts: Number(r.pass_attempts) || 0,
        pressurePct: num(r.pressure_pct),
        badThrowPct: num(r.bad_throw_pct),
        onTargetPct: num(r.on_tgt_pct),
        pocketTime: num(r.pocket_time),
        blitzed: num(r.times_blitzed),
        dropPct: num(r.drop_pct),
      })
    )
    .filter((r) => r.player && r.attempts >= MIN_ATTEMPTS)
    .sort((a, b) => (b.pressurePct ?? 0) - (a.pressurePct ?? 0))
    .slice(0, limit);
}

/**
 * Receiving-Werte für Wide Receiver und Tight Ends.
 *
 * Das ist die Tabelle, die SumerSports "Receiving" nennt, soweit offen
 * verfügbar: wie tief ein Spieler angespielt wird, wie viel er sich selbst
 * erläuft, wie oft er Tackles bricht und wie zuverlässig er fängt.
 * Nicht dabei ist Routes Run — das chartet nur PFF kostenpflichtig, deshalb
 * gibt es hier auch kein YPRR.
 */
export async function getReceivingAdvanced(limit = 60): Promise<AdvPlayerRow[]> {
  const { rows, season } = await latestSeasonRows(`${PFR}/advstats_season_rec.csv`);

  const mapped = rows
    .filter((r) => r.player && Number(r.tgt) >= MIN_TARGETS)
    .map(
      (r): AdvPlayerRow => ({
        id: r.pfr_id || r.player,
        player: r.player,
        team: team(r.tm),
        pos: r.pos || null,
        season,
        games: Number(r.g) || 0,
        stats: {
          tgt: num(r.tgt),
          rec: num(r.rec),
          rec_yards: num(r.yds),
          rec_td: num(r.td),
          first_downs: num(r.x1d),
          adot: num(r.adot),
          ybc_r: num(r.ybc_r),
          yac_r: num(r.yac_r),
          brk_tkl: num(r.brk_tkl),
          rec_br: num(r.rec_br),
          drops: num(r.drop),
          drop_pct: asPct(r.drop_percent),
          tgt_rating: num(r.rat),
        },
      })
    );

  return bestPerPlayer(mapped, 'tgt').sort(byStat('rec_yards')).slice(0, limit);
}

/**
 * Laufwerte der Running Backs: wie viele Yards die Blocker liefern (vor dem
 * Kontakt) und wie viele der Spieler selbst holt (nach dem Kontakt).
 */
export async function getRushingAdvanced(limit = 50): Promise<AdvPlayerRow[]> {
  const { rows, season } = await latestSeasonRows(`${PFR}/advstats_season_rush.csv`);

  const mapped = rows
    .filter((r) => r.player && Number(r.att) >= MIN_CARRIES)
    .map(
      (r): AdvPlayerRow => ({
        id: r.pfr_id || r.player,
        player: r.player,
        team: team(r.tm),
        pos: r.pos || null,
        season,
        games: Number(r.g) || 0,
        stats: {
          att: num(r.att),
          rush_yards: num(r.yds),
          rush_td: num(r.td),
          first_downs: num(r.x1d),
          ybc_att: num(r.ybc_att),
          yac_att: num(r.yac_att),
          brk_tkl: num(r.brk_tkl),
          att_br: num(r.att_br),
        },
      })
    );

  return bestPerPlayer(mapped, 'att').sort(byStat('rush_yards')).slice(0, limit);
}

/**
 * Defense: Coverage und Pass Rush in einer Tabelle.
 *
 * Aufgenommen wird, wer genug angespielt wurde (Cornerbacks, Safeties,
 * Linebacker) oder genug Druck erzeugt hat (Defensive Line) — sonst fehlten
 * je nach Filter entweder die Pass-Rusher oder die Coverage-Spieler.
 */
export async function getDefenseAdvanced(limit = 60): Promise<AdvPlayerRow[]> {
  const { rows, season } = await latestSeasonRows(`${PFR}/advstats_season_def.csv`);

  const mapped = rows
    .filter(
      (r) =>
        r.player &&
        (Number(r.tgt) >= MIN_DEF_TARGETS || Number(r.prss) >= MIN_DEF_PRESSURES)
    )
    .map(
      (r): AdvPlayerRow => ({
        id: r.pfr_id || r.player,
        player: r.player,
        team: team(r.tm),
        pos: r.pos || null,
        season,
        games: Number(r.g) || 0,
        stats: {
          def_tgt: num(r.tgt),
          cmp_pct_allowed: asPct(r.cmp_percent),
          yds_per_tgt: num(r.yds_tgt),
          rating_allowed: num(r.rat),
          dadot: num(r.dadot),
          def_int: num(r.int),
          pressures: num(r.prss),
          sacks: num(r.sk),
          qb_hits: num(r.qbkd),
          hurries: num(r.hrry),
          blitzes: num(r.bltz),
          tackles: num(r.comb),
          missed_tackle_pct: asPct(r.m_tkl_percent),
        },
      })
    );

  return bestPerPlayer(mapped, 'def_tgt').sort(byStat('pressures')).slice(0, limit);
}

/**
 * ESPNs Total QBR der laufenden Saison.
 *
 * Anders als die PFR-Tabellen steht QBR sofort zur Verfügung, deshalb ist das
 * hier die einzige Quelle, die im September schon die aktuelle Saison zeigt.
 * ESPN liefert die Saisonsumme als eigene Zeile (`game_week = "Season Total"`).
 */
export async function getQbr(limit = 40): Promise<AdvPlayerRow[]> {
  const { rows, season } = await latestSeasonRows(ESPN_QBR);

  return rows
    .filter(
      (r) =>
        r.season_type === 'Regular' &&
        r.game_week === 'Season Total' &&
        (r.name_display || r.name_short)
    )
    .map(
      (r): AdvPlayerRow => ({
        id: r.player_id || r.name_display,
        player: r.name_display || r.name_short,
        team: team(r.team_abb),
        pos: 'QB',
        season,
        games: 0,
        stats: {
          qbr: num(r.qbr_total),
          qbr_raw: num(r.qbr_raw),
          qb_plays: num(r.qb_plays),
          pts_added: num(r.pts_added),
          epa_total: num(r.epa_total),
          epa_pass: num(r.pass),
          epa_run: num(r.run),
          epa_sack: num(r.sack),
          epa_penalty: num(r.penalty),
        },
      })
    )
    .sort(byStat('qbr'))
    .slice(0, limit);
}
