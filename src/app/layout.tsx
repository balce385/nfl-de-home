import type { Metadata } from 'next';
import { Playfair_Display, Manrope, JetBrains_Mono } from 'next/font/google';
import ShaderWallpaper from '@/components/ShaderWallpaper';
import { TeamSelectionProvider } from '@/components/TeamSelectionContext';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '700'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nfl-fan-app.de';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NFL News, Analysen & Fantasy Football auf Deutsch | NFL-DE-Hub',
    template: '%s | NFL-DE-Hub',
  },
  description:
    'Aktuelle NFL-News, tiefgehende Analysen und Fantasy-Football-Tools auf Deutsch. Bleib informiert, optimiere dein Team und diskutiere mit der Community.',
  keywords: [
    'NFL News Deutsch',
    'Fantasy Football Strategie',
    'NFL Analysen auf Deutsch',
    'NFL Community Deutschland',
    'NFL Statistiken und Prognosen',
  ],
  openGraph: {
    siteName: 'NFL-DE-Hub',
    title: 'NFL auf Deutsch — Dein Portal für News, Analysen & Fantasy Football',
    description:
      'Entdecke die neuesten NFL-News, datengetriebene Analysen und Fantasy-Football-Tools auf Deutsch.',
    locale: 'de_DE',
    type: 'website',
    url: SITE_URL,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'NFL-DE-Hub — NFL News, Analysen und Fantasy Football auf Deutsch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL auf Deutsch — News, Analysen & Fantasy Football | NFL-DE-Hub',
    description:
      'Aktuelle NFL-News, tiefgehende Analysen und Fantasy-Football-Tools auf Deutsch.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${playfair.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="font-body bg-bg text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: 'NFL-DE-Hub',
                description:
                  'NFL-News, Analysen, Advanced Stats und Fantasy Football auf Deutsch.',
                inLanguage: 'de-DE',
                publisher: { '@id': `${SITE_URL}/#organization` },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: 'NFL-DE-Hub',
                url: SITE_URL,
                description:
                  'Deutschsprachiges Portal für NFL-News, Advanced Stats und Fantasy Football.',
              },
            ]),
          }}
        />
        {/* Animierter WebGL-Hintergrund (fixiert, hinter allem, blockiert keine Klicks) */}
        <ShaderWallpaper variant="aurora" />
        {/* Inhalt liegt über dem Shader. Die Team-Wahl gilt seitenübergreifend
            (Startseite, Magazin) und wird im Browser gespeichert. */}
        <TeamSelectionProvider>
          <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </TeamSelectionProvider>
      </body>
    </html>
  );
}
