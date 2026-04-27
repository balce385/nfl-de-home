import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

const allFeatures = [
  'Live-Scores & Box-Scores in Echtzeit',
  'Personalisiertes Dashboard mit Watchlist',
  'Magazin: Analysen, Recaps, Tactical Breakdowns',
  'Community-Chat in deutschsprachigen Channels',
  'Advanced Stats aus nflverse (EPA, CPOE, Snap-Counts)',
  'Push-Alerts für deine Lieblingsspieler & Teams',
  'Suche & Filter über alle Spieler und Teams',
  'DSGVO-konform · Server in Frankfurt',
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 border-t border-line bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="chip">Preise</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
            Komplett <span className="grad-text italic">kostenlos.</span>
          </h2>
          <p className="text-mute mt-4 text-lg">
            Keine Paywall. Kein Pro-Tier. Alle Features für jeden Fan, für immer.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card card-glow p-10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 chip-accent chip flex items-center gap-1">
              <Sparkles size={12} /> Alles inklusive
            </div>

            <div className="text-center">
              <h3 className="font-display text-2xl font-bold">NFL DE Hub</h3>
              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="font-display text-6xl font-black grad-text">0&nbsp;€</span>
              </div>
              <p className="text-sm text-mute mt-2">Für immer. Ohne Wenn und Aber.</p>
            </div>

            <ul className="mt-10 grid sm:grid-cols-2 gap-3 text-sm">
              {allFeatures.map((f) => (
                <li key={f} className="flex gap-3">
                  <Check size={18} className="text-accent shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-10 block text-center btn-primary py-3 rounded-lg font-semibold text-sm text-white"
            >
              Kostenlos registrieren
            </Link>
            <p className="text-center text-xs text-mute mt-3">
              Kein Bezahl-Mittel nötig. Account in 30 Sekunden.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
