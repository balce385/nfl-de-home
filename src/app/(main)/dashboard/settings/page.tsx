import Link from 'next/link';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { Globe, Moon, Shield, User } from 'lucide-react';

export const metadata = { title: 'Einstellungen' };

export default function SettingsPage() {
  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-10 max-w-3xl">
        <span className="chip">Einstellungen</span>
        <h1 className="font-display text-4xl font-bold mt-3">
          Deine <span className="grad-text italic">Einstellungen.</span>
        </h1>
        <p className="text-mute mt-1 text-sm mb-8">
          Die App läuft aktuell ohne Account — alles ist frei zugänglich.
        </p>

        <div className="space-y-4">
          <div className="card p-5 flex items-center gap-4">
            <span className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <Globe size={16} />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-sm">Sprache</div>
              <div className="text-xs text-mute mt-0.5">Deutsch (DACH)</div>
            </div>
            <span className="chip">Aktiv</span>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <span className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 text-accent flex items-center justify-center shrink-0">
              <Moon size={16} />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-sm">Dark Mode</div>
              <div className="text-xs text-mute mt-0.5">Immer an — so gehört sich das.</div>
            </div>
            <span className="chip">Aktiv</span>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <span className="w-10 h-10 rounded-lg bg-warn/10 border border-warn/30 text-warn flex items-center justify-center shrink-0">
              <Shield size={16} />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-sm">Datenschutz (DSGVO)</div>
              <div className="text-xs text-mute mt-0.5">
                Ohne Account werden keine personenbezogenen Daten gespeichert.
              </div>
            </div>
            <span className="chip-accent chip">Konform</span>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <span className="w-10 h-10 rounded-lg bg-white/5 border border-line text-mute flex items-center justify-center shrink-0">
              <User size={16} />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-sm">Profil</div>
              <div className="text-xs text-mute mt-0.5">
                Profile, Watchlists und Alerts kommen mit einer späteren Phase zurück.
              </div>
            </div>
            <Link href="/news" className="text-xs text-primary hover:text-accent">
              Zum Team-Hub →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
