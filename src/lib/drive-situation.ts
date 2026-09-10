/**
 * Umrechnung der ESPN-Spielsituation in Werte für die Darstellung.
 *
 * Eigene Datei, damit die Feldpositions-Rechnung testbar bleibt: ESPN zählt
 * die Yard-Linie von 0 bis 50 je Feldhälfte, der Balken im UI braucht aber
 * 0 bis 100 aus Sicht des angreifenden Teams. Ein Vorzeichenfehler zeigt den
 * Ball sonst am falschen Feldende.
 */

export type FieldInput = {
  /** Yard-Linie laut ESPN, 0–50 je Hälfte. */
  yardLine: number | null;
  /** Kürzel des Teams mit dem Ball. */
  possession: string | null;
  /** ESPN-Text der Ballposition, z.B. "NE 27" — nennt die Feldhälfte. */
  possessionText: string | null;
};

const ORDINAL = ['', '1st', '2nd', '3rd', '4th'];

/**
 * Position des Balls in Prozent, 0 = eigene Endzone, 100 = Endzone des Gegners.
 *
 * Liegt der Ball in der eigenen Hälfte ("NE 27" bei Ballbesitz NE), ist der
 * zurückgelegte Weg gleich der Yard-Linie. Liegt er in der gegnerischen Hälfte
 * ("SEA 27" bei Ballbesitz NE), sind es 100 minus Yard-Linie.
 */
export function fieldPercent({ yardLine, possession, possessionText }: FieldInput): number | null {
  if (yardLine === null || !Number.isFinite(yardLine) || !possession) return null;

  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  const half = possessionText?.trim().split(/\s+/)[0];
  if (!half) return clamp(yardLine);

  const ownHalf = half.toUpperCase() === possession.toUpperCase();
  return clamp(ownHalf ? yardLine : 100 - yardLine);
}

/** "3rd & 7", bei Distanz 0 "3rd & Goal". */
export function downText(
  down: number | null,
  distance: number | null,
  fallback: string | null = null
): string | null {
  if (down === null || distance === null) return fallback;
  const label = ORDINAL[down] ?? `${down}.`;
  return distance === 0 ? `${label} & Goal` : `${label} & ${distance}`;
}
