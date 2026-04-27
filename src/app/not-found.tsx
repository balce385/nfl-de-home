import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card p-8 max-w-md text-center">
        <p className="font-mono text-7xl font-bold grad-text mb-2">404</p>
        <h2 className="font-display text-2xl font-bold mb-2">Seite nicht gefunden.</h2>
        <p className="text-mute text-sm mb-6">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg transition"
        >
          <Home size={16} />
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
