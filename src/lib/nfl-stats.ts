/**
 * Kennzahlen der NFL-Statistik — Formeln und deutsche Erklärungen.
 *
 * Alles hier sind reine Funktionen ohne Datenquelle, damit die Rechnung
 * testbar bleibt (siehe nfl-stats.test.ts, geprüft gegen die offiziellen
 * Werte aus dem Next-Gen-Stats-Datensatz der NFL).
 */

/* --------------------------- Passer Rating (NFL) -------------------------- */

/** Jeder der vier Faktoren liegt zwischen 0 und 2,375. */
const clampFactor = (v: number) => Math.min(2.375, Math.max(0, v));

export type PasserRatingParts = {
  /** Anteil angekommener Pässe */
  completion: number;
  /** Raumgewinn pro Versuch */
  yards: number;
  /** Touchdowns pro Versuch */
  touchdowns: number;
  /** Interceptions pro Versuch (invertiert: weniger ist mehr) */
  interceptions: number;
  rating: number;
};

/**
 * Passer Rating nach der offiziellen NFL-Formel.
 *
 *   A = (CMP/ATT − 0,3) · 5
 *   B = (YDS/ATT − 3)   · 0,25
 *   C = (TD/ATT)        · 20
 *   D = 2,375 − (INT/ATT · 25)
 *   Rating = (A + B + C + D) / 6 · 100
 *
 * Jeder Faktor wird auf [0; 2,375] begrenzt. Damit liegt das Ergebnis
 * zwischen 0,0 und dem perfekten Wert 158,3.
 *
 * Achtung beim Yards-Faktor: der Multiplikator ist 0,25, nicht 0,2. Mit 0,2
 * kaeme man nie auf 158,3 (der Faktor braucht 12,5 Yards pro Versuch fuer
 * das Maximum) und jeder Wert laege rund 4 Punkte zu niedrig. Nachgerechnet
 * gegen die offiziellen Werte der NFL in nfl-stats.test.ts.
 */
export function passerRatingParts(
  completions: number,
  attempts: number,
  yards: number,
  touchdowns: number,
  interceptions: number
): PasserRatingParts | null {
  if (!Number.isFinite(attempts) || attempts <= 0) return null;

  const completion = clampFactor((completions / attempts - 0.3) * 5);
  const yardsF = clampFactor((yards / attempts - 3) * 0.25);
  const tdF = clampFactor((touchdowns / attempts) * 20);
  const intF = clampFactor(2.375 - (interceptions / attempts) * 25);

  return {
    completion,
    yards: yardsF,
    touchdowns: tdF,
    interceptions: intF,
    rating: ((completion + yardsF + tdF + intF) / 6) * 100,
  };
}

export function passerRating(
  completions: number,
  attempts: number,
  yards: number,
  touchdowns: number,
  interceptions: number
): number | null {
  return passerRatingParts(completions, attempts, yards, touchdowns, interceptions)?.rating ?? null;
}

/** Höchstmögliches (158,3) und schlechtestes (0,0) Rating. */
export const PASSER_RATING_MAX = 158.3;

/** Einordnung eines Ratings in Worte — für Tooltips und Badges. */
export function ratingLabel(rating: number): 'elite' | 'stark' | 'solide' | 'schwach' {
  if (rating >= 110) return 'elite';
  if (rating >= 95) return 'stark';
  if (rating >= 80) return 'solide';
  return 'schwach';
}

/* ------------------------------- ANY/A ------------------------------------ */

/**
 * Adjusted Net Yards per Attempt.
 *
 *   (YDS + 20·TD − 45·INT − SackYards) / (ATT + Sacks)
 *
 * Belohnt Touchdowns, bestraft Interceptions und Raumverlust durch Sacks
 * deutlich — deshalb aussagekräftiger als reine Yards pro Versuch.
 */
export function adjustedNetYardsPerAttempt(
  yards: number,
  touchdowns: number,
  interceptions: number,
  sacks: number,
  sackYards: number,
  attempts: number
): number | null {
  const dropbacks = attempts + sacks;
  if (dropbacks <= 0) return null;
  return (yards + 20 * touchdowns - 45 * interceptions - sackYards) / dropbacks;
}

/* ------------------------------ EPA / Play -------------------------------- */

/** Expected Points Added pro Spielzug — Netto-Wert eines Spielers je Play. */
export function epaPerPlay(epaSum: number, plays: number): number | null {
  if (plays <= 0) return null;
  return epaSum / plays;
}

/* ---------------------- Beschreibungen für die Oberfläche ------------------ */

export type MetricInfo = {
  key: string;
  label: string;
  /** Kurzerklärung in einem Satz, für Tooltip und Legende. */
  hint: string;
  /** Nachkommastellen in der Anzeige. */
  digits: number;
  unit?: string;
  /** true, wenn ein niedrigerer Wert besser ist. */
  lowerIsBetter?: boolean;
};

export const METRICS: Record<string, MetricInfo> = {
  passer_rating: {
    key: 'passer_rating',
    label: 'Passer Rating',
    hint: 'Offizielle NFL-Formel aus Passquote, Yards, Touchdowns und Interceptions. 158,3 ist der perfekte Wert.',
    digits: 1,
  },
  cpoe: {
    key: 'cpoe',
    label: 'CPOE',
    hint: 'Completion Percentage Over Expectation: um wie viele Prozentpunkte der Quarterback genauer wirft, als es Wurfdistanz und Gegnerdruck erwarten lassen.',
    digits: 1,
    unit: '%',
  },
  any_a: {
    key: 'any_a',
    label: 'ANY/A',
    hint: 'Adjusted Net Yards per Attempt: Yards pro Passversuch, mit Bonus für Touchdowns und deutlichem Abzug für Interceptions und Sacks.',
    digits: 2,
  },
  epa_per_play: {
    key: 'epa_per_play',
    label: 'EPA/Play',
    hint: 'Expected Points Added: wie viele Punkte ein Spielzug dem Team im Schnitt einbringt, verglichen mit der historischen Erwartung.',
    digits: 3,
  },
  time_to_throw: {
    key: 'time_to_throw',
    label: 'Time to Throw',
    hint: 'Sekunden vom Snap bis zum Loslassen des Balls oder bis zum Sack.',
    digits: 2,
    unit: 's',
    lowerIsBetter: true,
  },
  aggressiveness: {
    key: 'aggressiveness',
    label: 'Aggressiveness',
    hint: 'Anteil der Pässe in enge Deckung — Verteidiger höchstens ein Yard vom Receiver entfernt.',
    digits: 1,
    unit: '%',
  },
  separation: {
    key: 'separation',
    label: 'Separation',
    hint: 'Durchschnittlicher Abstand in Yards zum nächsten Verteidiger im Moment des Wurfs.',
    digits: 2,
    unit: ' yd',
  },
  yac_oe: {
    key: 'yac_oe',
    label: 'YAC über Erwartung',
    hint: 'Yards nach dem Fang im Vergleich zu dem, was ein durchschnittlicher Spieler in derselben Lage geschafft hätte.',
    digits: 2,
    unit: ' yd',
  },
  cushion: {
    key: 'cushion',
    label: 'Cushion',
    hint: 'Abstand des Verteidigers zum Receiver beim Snap.',
    digits: 2,
    unit: ' yd',
  },
  time_to_los: {
    key: 'time_to_los',
    label: 'Zeit hinter der Linie',
    hint: 'Sekunden, die der Running Back hinter der Anspiellinie verbringt. Weniger heißt entschlossener.',
    digits: 2,
    unit: 's',
    lowerIsBetter: true,
  },
  eight_in_box: {
    key: 'eight_in_box',
    label: '8+ in der Box',
    hint: 'Anteil der Läufe gegen acht oder mehr Verteidiger nahe der Linie.',
    digits: 1,
    unit: '%',
  },
  ryoe_per_att: {
    key: 'ryoe_per_att',
    label: 'Yards über Erwartung',
    hint: 'Laufyards pro Versuch über dem, was die Situation erwarten ließ.',
    digits: 2,
    unit: ' yd',
  },
};

/** Formatiert einen Messwert deutsch, inklusive Einheit. */
export function formatMetric(key: string, value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const m = METRICS[key];
  const digits = m?.digits ?? 1;
  const formatted = value.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return m?.unit ? `${formatted}${m.unit}` : formatted;
}
