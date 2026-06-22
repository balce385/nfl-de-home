import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { LiveTicker } from '@/components/ui/LiveTicker';
import { Hero } from '@/components/sections/Hero';
import { FeaturesBento } from '@/components/sections/FeaturesBento';
import { DashboardPreview } from '@/components/sections/DashboardPreview';
import { MagazinSection } from '@/components/sections/MagazinSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { CommunitySection } from '@/components/sections/CommunitySection';
import { FAQSection, CTASection } from '@/components/sections/FAQAndCTA';
import { TeamMediaExplorer } from '@/components/showcase/TeamMediaExplorer';
import { TeamSelectionProvider } from '@/components/TeamSelectionContext';
import { getAllTeams } from '@/lib/nfl-live';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const teams = await getAllTeams();

  return (
    <>
      <LiveTicker />
      <Navbar />
      <main>
        <Hero />
        <FeaturesBento />

        {/* Gemeinsamer Team-Status: die Vorschau-Karte zeigt den QB des Teams,
            das unten in der Team-Auswahl angeklickt wird. */}
        <TeamSelectionProvider initial="KC">
          <DashboardPreview />

          {/* Team-Auswahl: alle 32 Teams mit Beat Writers + Live-News */}
          <section className="max-w-7xl mx-auto px-6 py-20" id="teams">
            <span className="chip-accent chip">Dein Team</span>
            <h2 className="font-display text-4xl font-bold mt-3">
              Wähle dein <span className="grad-text italic">Team.</span>
            </h2>
            <p className="text-mute mt-2 max-w-2xl">
              Beat Writers, offizieller YouTube-Channel und Live-News von ESPN —
              für alle 32 NFL-Teams.
            </p>
            <div className="mt-8">
              <TeamMediaExplorer
                teams={teams.map((t) => ({
                  id: t.id,
                  name: t.name,
                  shortName: t.shortName,
                  color: t.color,
                  logo: t.logo,
                }))}
              />
            </div>
          </section>
        </TeamSelectionProvider>

        <MagazinSection />
        <PricingSection />
        <CommunitySection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
