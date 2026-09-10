import Link from 'next/link';
import { Logo } from './Logo';

/**
 * Nur Links auf Seiten, die es wirklich gibt.
 *
 * Entfernt wurden „Redaktion", „Partner", „Karriere", „AGB" und
 * „Cookie-Einstellungen": Dahinter steckt bei einem privaten Fan-Projekt
 * nichts — ein Karriere-Link ohne Firma ist Fassade, und ein
 * Cookie-Banner ohne einwilligungspflichtige Cookies ist reine Deko.
 * Wer hinter dem Projekt steht und wer die Texte schreibt, steht unter /about.
 */
const sections = [
  {
    title: 'Produkt',
    links: [
      { href: '/news', label: 'Live & News' },
      { href: '/stats', label: 'Advanced Stats' },
      { href: '/playbook', label: 'Playbook' },
      { href: '/magazin', label: 'Magazin' },
      { href: '/community', label: 'Community' },
    ],
  },
  {
    title: 'Projekt',
    links: [
      { href: '/about', label: 'Über dieses Projekt' },
      { href: '/api-docs', label: 'API' },
      { href: '/kontakt', label: 'Kontakt' },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { href: '/impressum', label: 'Impressum' },
      { href: '/datenschutz', label: 'Datenschutz' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-black/40">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <Logo />
          <p className="text-sm text-mute mt-4 max-w-sm leading-relaxed">
            Live-Daten, Advanced Stats und ein Playbook für NFL-Fans im deutschsprachigen Raum.
            Ein privates Projekt, kostenlos und werbefrei, gehostet in Nürnberg.
          </p>
          <p className="text-sm text-mute mt-4">
            <Link href="/kontakt" className="text-primary hover:underline">
              Fehler gefunden? Schreib mir.
            </Link>
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <div className="text-xs font-mono uppercase tracking-widest text-mute mb-4">
              {section.title}
            </div>
            <ul className="space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-mute font-mono">
          <span>© {new Date().getFullYear()} NFL-DE-Hub · Nicht offiziell mit der NFL verbunden.</span>
          <span>Daten: ESPN · nflverse · TheSportsDB</span>
        </div>
      </div>
    </footer>
  );
}
