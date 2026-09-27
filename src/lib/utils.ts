import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ESPN liefert Teamlogos als 500-px-PNG (bis 77 kB), angezeigt werden sie mit
 * 16–88 px. ESPNs Bild-Combiner skaliert serverseitig (LV: 77 kB -> 8 kB).
 * `px` ist die Anzeigegröße; geliefert wird die doppelte für Retina-Displays.
 */
export function espnLogo<T extends string | null | undefined>(url: T, px: number): T | string {
  const m = url?.match(/^https?:\/\/a\.espncdn\.com(\/i\/teamlogos\/[^?]+\.png)$/);
  return m ? `https://a.espncdn.com/combiner/i?img=${m[1]}&w=${px * 2}&h=${px * 2}` : url;
}
