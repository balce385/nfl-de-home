import Link from 'next/link';
import { Logo } from './Logo';

const sections = [
  {
    title: 'Produkt',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/magazin', label: 'Magazin' },
      { href: '/community', label: 'Community' },
      { href: '/api-docs', label: 'API' },
      { href: '/preise', label: 'Preise' },
    ],
  },
  {
    title: 'Unternehmen',
    links: [
      { href: '/about', label: 'Über uns' },
      { href: '/redaktion', label: 'Redaktion' },
      { href: '/partner', label: 'Partner' },
      { href: '/karriere', label: 'Karriere' },
      { href: '/kontakt', label: 'Kontakt' },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { href: '/impressum', label: 'Impressum' },
      { href: '/datenschutz', label: 'Datenschutz' },
      { href: '/agb', label: 'AGB' },
      { href: '/cookies', label: 'Cookie-Einstellungen' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-black/40">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <Logo />
          <p className="text-sm text-mute mt-4 max-w-sm">
            Die zentrale Anlaufstelle für NFL-Fans im deutschsprachigen Raum. Made in Germany,
            gehostet in der EU.
          </p>

          <form className="mt-6 flex gap-2 max-w-sm">
            <input
              type="email"
              placeholder="deine@mail.de"
              className="flex-1 bg-black/40 border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-ink placeholder:text-mute"
            />
            <button
              type="button"
              className="btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            >
              Newsletter
            </button>
          </form>
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
          <span>© 2026 NFL-DE-Fan Hub · Nicht offiziell mit der NFL verbunden.</span>
          <span className="flex items-center gap-2">
            <span className="live-dot" /> Status: alle Systeme online
          </span>
        </div>
      </div>
    </footer>
  );
}
