'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/#features', label: 'Features' },
  { href: '/magazin', label: 'Magazin' },
  { href: '/community', label: 'Community' },
  { href: '/news', label: 'News' },
  { href: '/stats', label: 'Stats' },
  { href: '/playbook', label: 'Playbook' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-line">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />

        <ul className="hidden lg:flex items-center gap-7 text-sm text-mute font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn('hover:text-ink transition', isActive && 'text-ink')}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/dashboard"
          className="btn-primary text-sm font-semibold px-4 py-2 rounded-lg text-white"
        >
          Zum Dashboard
        </Link>
      </nav>

      {/* Unter lg ist oben kein Platz fuer sieben Punkte: gleiche Navigation als
          horizontal scrollbare Leiste, damit alle Reiter auch am Handy
          erreichbar bleiben. */}
      <ul className="lg:hidden flex items-center gap-5 overflow-x-auto px-6 pb-2 text-sm text-mute font-medium whitespace-nowrap">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn('hover:text-ink transition', isActive && 'text-ink')}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
