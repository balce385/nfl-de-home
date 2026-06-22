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
  { href: '/playbook', label: 'Playbook' },
  { href: '/preise', label: 'Preise' },
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
    </header>
  );
}
