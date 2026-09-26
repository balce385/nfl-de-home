/**
 * Welche Saison die Next-Gen-Tabelle zeigt und ab welchem Volumen ein Spieler
 * in die Rangliste kommt.
 *
 * Feste Schwellen (100 Würfe) passen nur zu einer vollen Saison. Im September
 * 2026 hatte nach zwei Spieltagen genau ein Quarterback 100 Würfe — die neue
 * Saison gewann trotzdem, und die Tabelle zeigte einen einzigen Spieler.
 *
 * Jetzt wächst die Schwelle mit der Saison: höchstens `min`, früh in der Saison
 * die Hälfte dessen, was der `minPlayers`-beste Spieler hat. Nicht die Hälfte
 * des Spitzenwerts — ein Team mit schon drei Spielen (Thursday Night) setzt
 * sonst die Latte so hoch, dass kaum ein Starter darüber kommt. Hat eine
 * Saison weniger als `minPlayers` Spieler, bleibt die Vorsaison stehen.
 */

/** Anteil am Bezugswert, ab dem ein Spieler früh in der Saison zählt. */
const EARLY_SHARE = 0.5;

export function pickSeason(
  rows: { season: number; volume: number | null }[],
  min: number,
  minPlayers: number,
): { season: number; threshold: number } | null {
  const seasons = [...new Set(rows.map((r) => r.season))].sort((a, b) => b - a);
  for (const season of seasons) {
    const volumes = rows
      .filter((r) => r.season === season && r.volume !== null)
      .map((r) => r.volume as number)
      .sort((a, b) => b - a);
    if (volumes.length < minPlayers) continue;
    const reference = volumes[minPlayers - 1];
    return { season, threshold: Math.min(min, Math.ceil(reference * EARLY_SHARE)) };
  }
  return null;
}
