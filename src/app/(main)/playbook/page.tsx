import { PlayDesigner } from '@/components/playbook/PlayDesigner';
import { getAllTeams } from '@/lib/nfl-live';

export const metadata = {
  title: 'Playbook — 3D Play-Designer mit KI-Defense',
  description:
    'Lade echte NFL-Konzepte (Four Verticals, Mesh, Wide Zone …) aus den Playbooks aller 32 Teams, entwirf eigene Spielzüge und simuliere sie in 3D gegen eine reagierende KI-Defense.',
};

export const dynamic = 'force-dynamic';

export default async function PlaybookPage() {
  const teams = await getAllTeams();

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip">Playbook</span>
          <span className="chip-accent chip">3D · Live-Simulation</span>
          <span className="chip chip-warn">Echte Team-Spielzüge</span>
        </div>
        <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
          Play-<span className="grad-text italic">Designer.</span>
        </h1>
        <p className="text-mute mt-3 text-lg max-w-3xl">
          Lade ein echtes Konzept aus dem Playbook deines Teams — oder zeichne deine
          eigenen Routen — und sieh in der <strong className="text-ink">3D-Broadcast-Ansicht</strong>{' '}
          zu, wie sich der Spielzug gegen eine reagierende KI-Defense entwickelt.
          Formation, Coverage, <strong className="text-ink">▶ Simulieren</strong> — fertig.
        </p>
      </div>

      <PlayDesigner
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          altColor: t.altColor,
        }))}
      />
    </div>
  );
}
