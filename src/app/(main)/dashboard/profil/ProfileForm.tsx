'use client';

import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Profile = { full_name?: string | null; bio?: string | null };

export function ProfileForm({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: Profile;
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({ full_name: fullName, bio }).eq('id', userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteAccount() {
    if (!confirm('Willst du deinen Account wirklich löschen? Das kann nicht rückgängig gemacht werden.')) return;
    const res = await fetch('/api/user/delete', { method: 'DELETE' });
    if (res.ok) window.location.href = '/';
    else alert('Löschen fehlgeschlagen.');
  }

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <p className="text-xs font-mono uppercase text-mute mb-1">E-Mail</p>
        <p className="text-sm">{email}</p>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">Persönliches</h2>
        <Field label="Name" value={fullName} onChange={setFullName} />
        <Textarea label="Bio" value={bio} onChange={setBio} />
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          {saving ? 'Speichere …' : saved ? 'Gespeichert ✓' : 'Speichern'}
        </button>
      </form>

      <div className="card p-6 space-y-3">
        <h2 className="font-display text-xl font-bold">DSGVO</h2>
        <a
          href="/api/user/export"
          className="inline-flex items-center gap-2 text-sm bg-surface2 hover:bg-line px-4 py-2 rounded-lg"
        >
          <Download size={14} /> Daten als JSON herunterladen
        </a>
        <button
          onClick={deleteAccount}
          className="inline-flex items-center gap-2 text-sm bg-danger/20 text-danger hover:bg-danger/30 px-4 py-2 rounded-lg ml-3"
        >
          <Trash2 size={14} /> Account löschen
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase text-mute">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-black/40 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase text-mute">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1.5 w-full bg-black/40 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
      />
    </label>
  );
}
