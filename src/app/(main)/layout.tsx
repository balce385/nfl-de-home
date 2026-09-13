import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { LiveTicker } from '@/components/ui/LiveTicker';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LiveTicker />
      <Navbar />
      <main id="inhalt" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
    </>
  );
}
