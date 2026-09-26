import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    q: 'Woher stammen die Daten?',
    a: 'Aus offenen Quellen: nflverse (Play-by-Play, EPA, CPOE, Next Gen Stats und Kennzahlen von Pro Football Reference), Sleeper (Spieler & Verletzungen), ESPN (Spielplan, Live-Scores, Kader) und die Nachrichten-Feeds von ESPN, ProFootballTalk, CBS Sports, Yahoo und weiteren, automatisch ins Deutsche übersetzt. News werden stündlich aktualisiert, alles andere täglich.',
  },
  {
    q: 'Ist der Hub DSGVO-konform?',
    a: 'Ja. Die Seite läuft auf einem Server der netcup GmbH in Deutschland, Konten und Chat liegen bei Supabase in der EU (Irland). Es gibt kein Tracking und keine Werbe-Cookies.',
  },
  {
    q: 'Was kostet der Hub?',
    a: 'Nichts. Alle Features sind dauerhaft kostenlos — Live-Scores, Watchlist, Magazin, Community-Chat, Advanced Stats (EPA/CPOE), Push-Alerts. Keine Paywall, keine Kreditkarte, kein Abo.',
  },
  {
    q: 'Gibt es eine Mobile-App?',
    a: 'Noch nicht. Die Seite ist fürs Handy gebaut; über „Zum Startbildschirm hinzufügen“ im Browser liegt sie wie eine App auf dem Homescreen.',
  },
];

export function FAQSection() {
  // Google zeigt FAQ-Rich-Results nur, wenn das Schema exakt den sichtbaren
  // Text spiegelt — darum aus demselben `faqs`-Array erzeugt.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <section className="py-24 border-t border-line bg-black/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="chip">FAQ</span>
          <h2 className="font-display text-4xl font-bold mt-4">Häufige Fragen.</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="card p-5 group">
              <summary className="flex justify-between items-center font-semibold cursor-pointer list-none">
                {faq.q}
                <span className="text-mute transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="text-sm text-mute mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-display text-5xl lg:text-6xl font-black leading-[1] tracking-tight">
          Bereit für
          <br />
          <span className="grad-text italic">die nächste Snap?</span>
        </h2>
        <p className="text-mute mt-6 text-lg max-w-xl mx-auto">
          Kein Account nötig — alles ist frei zugänglich. Spring direkt rein.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="btn-primary text-sm font-semibold px-7 py-4 rounded-lg inline-flex items-center gap-2 text-white"
          >
            Zum Dashboard <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link href="/news" className="btn-ghost text-sm font-semibold px-7 py-4 rounded-lg">
            News &amp; Team-Hub
          </Link>
        </div>
      </div>
    </section>
  );
}
