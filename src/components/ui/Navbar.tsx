'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/#features', label: 'Features' },
  { href: '/magazin', label: 'Magazin' },
  { href: '/community', label: 'Community' },
  { href: '/design', label: 'Design' },
  { href: '/preise', label: 'Preise' },
];

export function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <Link
                href="/dashboard/profil"
                className="hidden sm:flex items-center gap-2 text-sm text-mute hover:text-ink"
                title={email}
              >
                <User size={16} /> {email.split('@')[0]}
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-sm text-mute hover:text-danger transition"
                  title="Abmelden"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Abmelden</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm text-mute hover:text-ink"
              >
                Anmelden
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm font-semibold px-4 py-2 rounded-lg text-white"
              >
                Kostenlos starten
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
