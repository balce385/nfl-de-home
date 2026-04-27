'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Phase 6: an Sentry / Logging-Service senden
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card p-8 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-warn mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Etwas ist schiefgelaufen.</h2>
        <p className="text-mute text-sm mb-6">
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg transition"
        >
          <RotateCw size={16} />
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
