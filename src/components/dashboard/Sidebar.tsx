'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Star, Activity, MessageSquare, Bell, Settings, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard',          label: 'Übersicht',  icon: LayoutDashboard },
  { href: '/dashboard/watchlist', label: 'Watchlist', icon: Star },
  { href: '/dashboard/live',     label: 'Live-Games', icon: Activity },
  { href: '/dashboard/feed',     label: 'News-Feed',  icon: Newspaper },
  { href: '/dashboard/chat',     label: 'Channels',   icon: MessageSquare },
  { href: '/dashboard/alerts',   label: 'Alerts',     icon: Bell },
  { href: '/dashboard/settings', label: 'Einstellungen', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-60 shrink-0 border-r border-line min-h-screen p-5">
      <div className="text-xs font-mono uppercase tracking-widest text-mute mb-4">Navigation</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-mute hover:bg-white/5 hover:text-ink'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 card p-4">
        <div className="text-xs font-mono uppercase tracking-widest text-accent">Free Forever</div>
        <div className="text-sm font-semibold mt-1">Alle Features ohne Paywall</div>
        <p className="text-[11px] text-mute mt-2">
          Keine versteckten Kosten, keine Kreditkarte nötig.
        </p>
      </div>
    </aside>
  );
}
