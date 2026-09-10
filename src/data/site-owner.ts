/**
 * Betreiberangaben für Impressum und Datenschutzerklärung.
 *
 * § 5 DDG (früher TMG) verlangt für eine öffentlich erreichbare Website
 * Name UND ladungsfähige Anschrift des Betreibers — ein Postfach genügt nicht.
 * Diese Angaben kann nur der Betreiber selbst eintragen; erfundene Daten wären
 * schlimmer als gar keine.
 *
 * Solange `street`, `postalCode` oder `city` leer sind, zeigen /impressum und
 * /datenschutz einen deutlich sichtbaren Hinweis, dass die Angaben fehlen.
 */

export const siteOwner = {
  name: 'Pierre Balerek',
  /** Straße und Hausnummer — BITTE EINTRAGEN */
  street: '',
  /** Postleitzahl — BITTE EINTRAGEN */
  postalCode: '',
  /** Ort — BITTE EINTRAGEN */
  city: '',
  country: 'Deutschland',
  email: 'balce385@gmail.com',
  /** Optional. Keine Pflicht, wenn eine E-Mail-Adresse angegeben ist. */
  phone: '',
  /**
   * Umsatzsteuer-ID nur angeben, wenn vorhanden. Für ein privates,
   * nicht-kommerzielles Projekt gibt es in aller Regel keine.
   */
  vatId: '',
} as const;

/** true, sobald die gesetzlich nötigen Angaben vollständig sind. */
export const ownerAddressComplete = Boolean(
  siteOwner.name && siteOwner.street && siteOwner.postalCode && siteOwner.city
);
