import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { PlayerExplorer } from '@/components/dashboard/PlayerExplorer';
import { getAllTeams } from '@/lib/nfl-live';

export const metadata = { title: 'Watchlist — Spieler entdecken' };
export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const teams = await getAllTeams();

  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-10">
        <span className="chip">Watchlist</span>
        <h1 className="font-display text-4xl font-bold mt-3">
          Alle <span className="grad-text italic">Spieler.</span>
        </h1>
        <p className="text-mute mt-1 text-sm mb-8">
          Wähle ein Team und stöbere durch den kompletten Live-Kader (ESPN-Roster).
        </p>
        <PlayerExplorer
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            shortName: t.shortName,
            color: t.color,
            logo: t.logo,
          }))}
        />
      </div>
    </div>
  );
}
