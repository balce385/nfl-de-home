import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nfl-fan-app.de';
export const SITE_NAME = 'NFL-DE-Hub';

/** Gemeinsame Open-Graph-Angaben; Titel, Text und URL setzt jede Seite selbst. */
export const OG_BASE = {
  siteName: SITE_NAME,
  locale: 'de_DE',
  type: 'website' as const,
  images: [
    {
      url: '/og.png',
      width: 1200,
      height: 630,
      alt: 'NFL-DE-Hub — NFL News, Analysen und Fantasy Football auf Deutsch',
    },
  ],
};

/** Ab hier kürzt Google Titel bzw. Beschreibungen im Suchergebnis (Näherung in Zeichen). */
export const TITLE_MAX = 60;
export const DESC_MAX = 155;
const BRAND = ` | ${SITE_NAME}`;

/** Kürzt an einer Wortgrenze und hängt "…" an; kurze Texte bleiben unverändert. */
export function cutAtWord(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max - 1);
  const space = head.lastIndexOf(' ');
  return `${(space > max * 0.6 ? head.slice(0, space) : head).replace(/[\s,;:–—-]+$/, '')}…`;
}

/**
 * Titel für lange, fremde Überschriften (Magazin-Artikel): die Marke nur, wenn
 * sie noch in die ~60 Zeichen passt, sonst der gekürzte Titel allein. Sonst
 * schneidet Google mitten im Wort ab — oder die Marke steht doppelt da.
 */
export function fitTitle(title: string): Metadata['title'] {
  const t = title.replace(/\s+/g, ' ').trim();
  return t.length + BRAND.length <= TITLE_MAX ? t : { absolute: cutAtWord(t, TITLE_MAX) };
}

/**
 * Metadaten einer Seite mit eigenem Canonical, og:url und og:title.
 *
 * Next.js mischt `openGraph` nicht mit dem Root-Layout, sondern erbt es nur,
 * solange die Seite keins setzt. Bis September 2026 trug deshalb jede Seite
 * og:title und og:url der Startseite — geteilte Links zeigten alle auf "/".
 */
export function withSeo({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  /** Eigenes Vorschaubild, z. B. das Teamlogo. */
  image?: string | null;
}): Metadata {
  const full = `${title} | ${SITE_NAME}`;
  const images = image ? [{ url: image, alt: title }] : OG_BASE.images;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_BASE, images, title: full, description, url: path },
    twitter: {
      card: image ? 'summary' : 'summary_large_image',
      title: full,
      description,
      images: images.map((i) => i.url),
    },
  };
}
