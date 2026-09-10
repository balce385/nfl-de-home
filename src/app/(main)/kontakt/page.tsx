import Link from 'next/link';
import { Mail, Bug, Shield } from 'lucide-react';
import { siteOwner } from '@/data/site-owner';

export const metadata = {
  title: 'Kontakt',
  description: 'Fehler melden, Fragen stellen oder Auskunft nach DSGVO anfordern.',
  alternates: { canonical: '/kontakt' },
};

const wege = [
  {
    icon: Mail,
    title: 'Allgemeine Fragen',
    text: 'Anregungen, Kritik, Wünsche für neue Funktionen.',
    subject: 'NFL-DE-Hub: Frage',
  },
  {
    icon: Bug,
    title: 'Fehler melden',
    text: 'Falsche Zahlen, kaputte Seite, etwas hängt? Am besten mit der Adresse der Seite und dem, was du erwartet hättest.',
    subject: 'NFL-DE-Hub: Fehlermeldung',
  },
  {
    icon: Shield,
    title: 'Datenschutz',
    text: 'Auskunft, Berichtigung oder Löschung deiner Daten nach DSGVO.',
    subject: 'NFL-DE-Hub: Datenschutzanfrage',
  },
];

export default function KontaktPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <span className="chip">Kontakt</span>
      <h1 className="font-display text-5xl font-bold mt-4">Schreib einfach.</h1>
      <p className="text-mute mt-3 text-lg leading-relaxed">
        Hinter dem Projekt steckt eine Person, kein Support-Team — Antworten können also ein paar
        Tage dauern. Ein Kontaktformular gibt es bewusst nicht: E-Mail ist direkter und spart es,
        deine Daten durch ein weiteres System zu schicken.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {wege.map((w) => {
          const Icon = w.icon;
          return (
            <a
              key={w.title}
              href={`mailto:${siteOwner.email}?subject=${encodeURIComponent(w.subject)}`}
              className="card p-5 hover:border-primary/50 transition flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                <Icon size={18} className="text-primary" />
              </div>
              <h2 className="font-display text-base font-bold">{w.title}</h2>
              <p className="text-xs text-mute mt-1 leading-relaxed flex-1">{w.text}</p>
              <span className="text-xs font-mono text-primary mt-3">{siteOwner.email}</span>
            </a>
          );
        })}
      </div>

      <div className="card p-6 mt-8 text-sm">
        <h2 className="font-display text-lg font-bold mb-2">Postanschrift</h2>
        <p className="text-mute">
          Die vollständige Anbieterkennzeichnung steht im{' '}
          <Link href="/impressum" className="text-primary hover:underline">
            Impressum
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
