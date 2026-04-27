'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setInfo(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setInfo(`${provider} ist noch nicht aktiviert. Aktivierbar in Supabase unter Authentication > Providers > ${provider}.`);
    }
  }

  return (
    <div className="card card-glow p-8 w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Willkommen <span className="grad-text italic">zurück.</span>
        </h1>
        <p className="text-sm text-mute mt-2">Melde dich an, um zu deinem Dashboard zu gelangen.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<Mail size={16} />} label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@mail.de" required />
        <Field icon={<Lock size={16} />} label="Passwort" type="password" value={password} onChange={setPassword} placeholder="mind. 8 Zeichen" required />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-mute">
            <input type="checkbox" className="accent-primary" /> Eingeloggt bleiben
          </label>
          <Link href="/forgot" className="text-primary hover:text-accent">
            Passwort vergessen?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-60">
          {loading ? 'Wird angemeldet ...' : 'Anmelden'}
        </button>

        {info && (
          <div className="flex items-start gap-2 text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg p-3">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-mute font-mono uppercase tracking-widest">
        <div className="flex-1 border-t border-line" /> oder <div className="flex-1 border-t border-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuth('google')}
          className="btn-ghost py-2.5 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
          title="Google-OAuth muss in Supabase aktiviert werden"
          type="button"
        >
          Google
        </button>
        <button
          onClick={() => handleOAuth('apple')}
          className="btn-ghost py-2.5 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
          title="Apple-OAuth muss in Supabase aktiviert werden"
          type="button"
        >
          Apple
        </button>
      </div>
      <p className="text-[10px] text-mute mt-2 text-center font-mono">
        Social-Login bald - aktuell nur E-Mail/Passwort
      </p>

      <p className="text-center text-sm text-mute mt-6">
        Noch keinen Account?{' '}
        <Link href="/register" className="text-primary hover:text-accent font-semibold">
          Kostenlos registrieren
        </Link>
      </p>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-mute">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 bg-black/40 border border-line rounded-lg px-3 focus-within:border-primary transition">
        <span className="text-mute">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-mute focus:outline-none"
        />
      </div>
    </label>
  );
}
