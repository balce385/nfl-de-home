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

export default function HomePage() {
  return (
    <>
      <LiveTicker />
      <Navbar />
      <main>
        <Hero />
        <FeaturesBento />
        <DashboardPreview />
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
