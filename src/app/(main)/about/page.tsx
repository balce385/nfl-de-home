import Link from 'next/link';
import { siteOwner } from '@/data/site-owner';

export const metadata = {
  title: 'Über dieses Projekt',
  description:
    'Wer hinter dem NFL-DE-Hub steckt, woher die Daten kommen und was das Projekt ausdrücklich nicht ist.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <span className="chip">Über uns</span>
      <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
        Ein Fan-Projekt. <span className="grad-text italic">Kein Medienhaus.</span>
      </h1>
      <p className="text-mute mt-4 text-lg leading-relaxed">
        Der NFL-DE-Hub ist ein privates Projekt von {siteOwner.name} — gebaut, weil es für
        deutschsprachige NFL-Fans wenig gibt, das Live-Daten, Advanced Stats und einen Ort zum
        Reden zusammenbringt. Keine Firma, kein Team, keine Werbung, keine Bezahlschranke.
      </p>

      <div className="card p-6 mt-10 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold mb-2">Was hier drin steckt</h2>
          <ul className="text-mute space-y-1.5 list-disc list-inside">
            <li>Live-Spielstände, Drive-Tracker und Spielpläne aller 32 Teams</li>
            <li>Advanced und Next Gen Stats mit deutscher Erklärung zu jeder Kennzahl</li>
            <li>Ein 3D-Play-Designer mit reagierender KI-Defense</li>
            <li>Team-News, Beat Writers und Magazin-Analysen</li>
            <li>Community-Chat für angemeldete Nutzer</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Woher die Daten kommen</h2>
          <p className="text-mute">
            Spielstände, Spielpläne und News stammen von den öffentlichen Schnittstellen von ESPN.
            Kader, Verletzungen, EPA/CPOE und die Next Gen Stats kommen über{' '}
            <a
              href="https://github.com/nflverse/nflverse-data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              nflverse
            </a>{' '}
            (offene Daten, MIT-Lizenz), Teamlogos von TheSportsDB, Videos aus den offiziellen
            YouTube-Feeds der Teams. Ein nächtlicher Datenlauf hält alles aktuell.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Zu den Texten im Magazin</h2>
          <p className="text-mute">
            Die Analysen im Magazin sind redaktionelle Eigentexte dieses Projekts, keine Meldungen
            einer Nachrichtenagentur und kein Journalismus mit Presseausweis. Die Live-News unter{' '}
            <Link href="/news" className="text-primary hover:underline">
              /news
            </Link>{' '}
            und im Magazin sind dagegen unverändert von ESPN und immer als solche gekennzeichnet.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Was das Projekt nicht ist</h2>
          <p className="text-mute">
            Es steht in keiner Verbindung zur NFL und wird von ihr weder betrieben noch geprüft.
            Es ist keine Wett- oder Tippplattform und gibt keine Empfehlungen ab. Es verdient kein
            Geld — weder mit Werbung noch mit Daten.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Technik</h2>
          <p className="text-mute">
            Next.js und FastAPI, in Docker-Containern auf einem eigenen Server in Nürnberg,
            ausgeliefert über Caddy mit automatischem HTTPS. Konten und Chat laufen über Supabase
            in der EU. Details stehen in der{' '}
            <Link href="/datenschutz" className="text-primary hover:underline">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Kontakt</h2>
          <p className="text-mute">
            Fehler gefunden, Wunsch, Kritik?{' '}
            <a href={`mailto:${siteOwner.email}`} className="text-primary hover:underline">
              {siteOwner.email}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
