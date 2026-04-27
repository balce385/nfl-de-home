import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-xs font-mono text-mute hover:text-ink uppercase tracking-widest">
          ← Zurück zur Startseite
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">{children}</main>
    </div>
  );
}
