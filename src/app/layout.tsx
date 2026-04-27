import type { Metadata } from 'next';
import { Playfair_Display, Manrope, JetBrains_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  metadataBase: new URL('https://nfl-de-hub.example.com'),
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
    title: 'NFL auf Deutsch — Dein Portal für News, Analysen & Fantasy Football',
    description:
      'Entdecke die neuesten NFL-News, datengetriebene Analysen und Fantasy-Football-Tools auf Deutsch.',
    locale: 'de_DE',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${playfair.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="font-body bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
