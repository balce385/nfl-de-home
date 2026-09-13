import { PlayDesigner } from '@/components/playbook/PlayDesigner';
import { getAllTeams } from '@/lib/nfl-live';

export const metadata = {
  title: 'Playbook — NFL-Spielzüge verstehen und simulieren',
  description:
    'Echte NFL-Konzepte wie Mesh, Smash oder Wide Zone per Klick laden, die Coverage wählen und zusehen, wie der Spielzug gegen eine reagierende Defense läuft — mit Erklärung, warum er funktioniert.',
  alternates: { canonical: '/playbook' },
};

export const revalidate = 3600;

export default async function PlaybookPage() {
  const teams = await getAllTeams();

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-12">
      <div className="mb-8 max-w-3xl">
        <span className="chip">Playbook</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4 leading-tight">
          Spielzüge <span className="grad-text italic">verstehen.</span>
        </h1>
        <p className="text-mute mt-3 text-lg">
          Wähle einen Spielzug, stell die Defense ein und drück auf{' '}
          <strong className="text-ink">▶ Abspielen</strong>. Die Verteidigung reagiert live, und du
          siehst, warum ein Konzept gegen eine Coverage funktioniert.
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
