'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Team = { id: string; name: string };

export function RegisterForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [favorite, setFavorite] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    if (password.length < 8) {
      setLoading(false);
      setInfo('Passwort muss mindestens 8 Zeichen haben.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, favorite_team: favorite },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setInfo(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  }

  return (
    <div className="card card-glow p-8 w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Werde Teil der <span className="grad-text italic">Community.</span>
        </h1>
        <p className="text-sm text-mute mt-2">In 30 Sekunden startklar. Kostenlos für immer.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<User size={16} />} label="Name" type="text" value={name} onChange={setName} placeholder="Max Mustermann" required />
        <Field icon={<Mail size={16} />} label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@mail.de" required />
        <Field icon={<Lock size={16} />} label="Passwort" type="password" value={password} onChange={setPassword} placeholder="mind. 8 Zeichen" required />

        <label className="block">
          <span className="text-xs font-mono uppercase tracking-widest text-mute">Lieblingsteam</span>
          <select
            value={favorite}
            onChange={(e) => setFavorite(e.target.value)}
            className="mt-1.5 w-full bg-black/40 border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-primary"
          >
            <option value="">Bitte wählen…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-mute mt-1 block">
            {teams.length} Teams verfügbar — alle 32 NFL-Franchises
          </span>
        </label>

        <label className="flex items-start gap-2 text-xs text-mute">
          <input type="checkbox" required className="mt-0.5 accent-primary" />
          <span>
            Ich akzeptiere die <Link href="/agb" className="text-primary hover:text-accent">AGB</Link> und die{' '}
            <Link href="/datenschutz" className="text-primary hover:text-accent">Datenschutzerklärung</Link>.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-60"
        >
          {loading ? 'Account wird erstellt…' : 'Account kostenlos erstellen'}
        </button>

        {info && (
          <div className="flex items-start gap-2 text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg p-3">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 text-xs text-accent bg-accent/10 border border-accent/30 rounded-lg p-3">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <span>Account erstellt! Bitte E-Mail bestätigen. Leite zur Anmeldung …</span>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-mute mt-6">
        Schon ein Account?{' '}
        <Link href="/login" className="text-primary hover:text-accent font-semibold">
          Jetzt anmelden
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
