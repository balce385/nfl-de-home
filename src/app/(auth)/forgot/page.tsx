'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="card card-glow p-8 w-full max-w-md">
      <Link href="/login" className="inline-flex items-center gap-1 text-xs text-mute hover:text-ink mb-4">
        <ArrowLeft size={12} /> Zurück zur Anmeldung
      </Link>

      <h1 className="font-display text-3xl font-bold mb-2">
        Passwort <span className="grad-text italic">vergessen?</span>
      </h1>
      <p className="text-sm text-mute mb-6">Wir senden dir einen Link zum Zurücksetzen.</p>

      {sent ? (
        <div className="flex items-start gap-2 text-sm bg-accent/10 border border-accent/30 rounded-lg p-4">
          <CheckCircle size={16} className="text-accent shrink-0 mt-0.5" />
          <span>E-Mail versandt. Bitte prüfe dein Postfach (auch Spam).</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-mono uppercase text-mute">E-Mail</span>
            <div className="mt-1.5 flex items-center gap-2 bg-black/40 border border-line rounded-lg px-3 focus-within:border-primary">
              <Mail size={16} className="text-mute" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
                placeholder="deine@mail.de"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Sende …' : 'Link anfordern'}
          </button>
        </form>
      )}
    </div>
  );
}
