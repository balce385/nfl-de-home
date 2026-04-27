'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setShow(true);
  }, []);

  function decide(value: 'accepted' | 'rejected') {
    localStorage.setItem('cookie-consent', value);
    setShow(false);
    if (value === 'accepted') {
      // Hier ggf. Plausible/Analytics initialisieren
    }
  }

  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md z-50">
      <div className="card p-5 shadow-2xl border border-line">
        <div className="flex items-start gap-3 mb-3">
          <Cookie className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-mute">
            Wir nutzen nur essentielle Cookies und (mit deiner Zustimmung) datenschutzfreundliches
            Plausible-Analytics. Keine Drittanbieter-Tracker.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => decide('rejected')}
            className="text-xs text-mute hover:text-ink px-3 py-2">
            Nur essentielle
          </button>
          <button onClick={() => decide('accepted')}
            className="text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
