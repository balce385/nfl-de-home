/**
 * Feldgeometrie und Kamera des Play-Designers.
 *
 * Eigene Datei, damit die Projektionsmathematik ohne Canvas testbar bleibt —
 * ein falsch gewähltes Preset schiebt sonst unbemerkt das halbe Feld aus dem Bild.
 */

export type Pt = { x: number; y: number };

/* ------------------------------- Geometrie -------------------------------- */

export const FIELD_W = 53.3;
export const VIEW_TOP = -33; // Yards downfield (oben/fern)
export const VIEW_BOT = 12; // Backfield (unten/nah)
export const GOAL_Y = -25; // Torlinie
export const W = 980;
export const H = 600;

/* --------------------------------- Kamera --------------------------------- */

export type CamKey = 'broadcast' | 'sideline' | 'endzone' | 'all22';

export type CamPreset = {
  label: string;
  hint: string;
  back: number;
  height: number;
  focal: number;
  horizon: number;
};

/**
 * Perspektivische Pinhole-Kamera auf der Bodenebene:
 *
 *   Y(y) = horizon + (height − z) · focal / (VIEW_BOT − y + back)
 *   X(x) = cx + x · focal / (VIEW_BOT − y + back)
 *
 * `back` steuert die Perspektivstärke: das Verhältnis von nahem zu fernem
 * Maßstab ist (45 + back) / back. Klein = dramatisch, groß = fast senkrecht.
 * `focal` hält die Seitenlinien in der Bildbreite, `height`/`horizon` sorgen
 * dafür, dass das Feld vertikal vollständig sichtbar bleibt.
 * Die Werte prüft `playbook-camera.test.ts` gegen die Leinwandmaße.
 */
export const CAM_PRESETS: Record<CamKey, CamPreset> = {
  broadcast: { label: 'Broadcast', hint: 'Klassische TV-Perspektive', back: 15, height: 24, focal: 270, horizon: 120 },
  sideline: { label: 'Seitenlinie', hint: 'Tief und dicht am Rasen', back: 8, height: 29, focal: 140, horizon: 78 },
  endzone: { label: 'Endzone', hint: 'Hinter dem Quarterback', back: 27, height: 40, focal: 430, horizon: -70 },
  all22: { label: 'All-22', hint: 'Coaching-Sicht von oben', back: 90, height: 156, focal: 900, horizon: -980 },
};

/** Aktive Kamera. Wird vom UI überschrieben, die Zeichenschleife liest live mit. */
export const CAM = { ...CAM_PRESETS.broadcast, cx: W / 2, zoom: 1 };

export function applyCamPreset(key: CamKey, zoom = 1) {
  const p = CAM_PRESETS[key];
  CAM.back = p.back;
  CAM.height = p.height;
  CAM.focal = p.focal;
  CAM.horizon = p.horizon;
  CAM.zoom = zoom;
}

export function project(x: number, y: number, z = 0) {
  const depth = VIEW_BOT - y + CAM.back; // > 0
  const s = (CAM.focal * CAM.zoom) / depth;
  return { X: CAM.cx + x * s, Y: CAM.horizon + (CAM.height - z) * s, s };
}

export function unproject(X: number, Y: number): Pt | null {
  const s = (Y - CAM.horizon) / CAM.height;
  if (s <= 0.0001) return null;
  const depth = (CAM.focal * CAM.zoom) / s;
  return { x: (X - CAM.cx) / s, y: VIEW_BOT - (depth - CAM.back) };
}
