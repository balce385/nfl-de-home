'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Mindestens 8 Zeichen.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  return (
    <div className="card card-glow p-8 w-full max-w-md">
      <h1 className="font-display text-3xl font-bold mb-6">
        Neues <span className="grad-text italic">Passwort.</span>
      </h1>
      {done ? (
        <p className="flex items-center gap-2 text-accent">
          <CheckCircle size={16} /> Geändert. Leite weiter …
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-mono uppercase text-mute">Neues Passwort</span>
            <div className="mt-1.5 flex items-center gap-2 bg-black/40 border border-line rounded-lg px-3 focus-within:border-primary">
              <Lock size={16} className="text-mute" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
                placeholder="mind. 8 Zeichen"
              />
            </div>
          </label>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Speichere …' : 'Passwort ändern'}
          </button>
        </form>
      )}
    </div>
  );
}
