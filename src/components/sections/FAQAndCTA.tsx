import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    q: 'Woher stammen die Daten?',
    a: 'Wir aggregieren aus offenen Quellen: nflverse (Play-by-Play, EPA, CPOE), Sleeper API (Spieler & Verletzungen), Pro Football Reference (historische Stats), ESPN (Spielplan, Live-Scores), NFL.com (News, automatisch ins Deutsche übersetzt) und TheSportsDB (Team-Logos). Updates täglich per Cron.',
  },
  {
    q: 'Ist der Hub DSGVO-konform?',
    a: 'Ja. Hosting in der EU (Vercel/Frankfurt), Auth via Supabase mit verschlüsselter Speicherung. Tracking nur nach Opt-in.',
  },
  {
    q: 'Was kostet der Hub?',
    a: 'Nichts. Alle Features sind dauerhaft kostenlos — Live-Scores, Watchlist, Magazin, Community-Chat, Advanced Stats (EPA/CPOE), Push-Alerts. Keine Paywall, keine Kreditkarte, kein Abo.',
  },
  {
    q: 'Gibt es eine Mobile-App?',
    a: 'Aktuell als Progressive Web App (PWA) — installierbar aus dem Browser. Native iOS/Android-Apps sind für Q4 2026 geplant.',
  },
];

export function FAQSection() {
  return (
    <section className="py-24 border-t border-line bg-black/20">
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
          Erstelle deinen kostenlosen Account in 30 Sekunden. Kein Credit-Card-Quatsch.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="btn-primary text-sm font-semibold px-7 py-4 rounded-lg inline-flex items-center gap-2 text-white"
          >
            Account erstellen <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link href="/dashboard" className="btn-ghost text-sm font-semibold px-7 py-4 rounded-lg">
            Erst mal stöbern
          </Link>
        </div>
      </div>
    </section>
  );
}
