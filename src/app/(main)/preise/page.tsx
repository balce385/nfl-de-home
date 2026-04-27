import { PricingSection } from '@/components/sections/PricingSection';
import { FAQSection } from '@/components/sections/FAQAndCTA';

export const metadata = {
  title: 'Preise — Komplett kostenlos für alle Fans',
};

export default function PreisePage() {
  return (
    <>
      <PricingSection />
      <FAQSection />
    </>
  );
}
