import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="font-display text-3xl font-bold mb-2">Dein Profil</h1>
      <p className="text-sm text-mute mb-8">Verwalte deine Daten und DSGVO-Optionen.</p>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        profile={profile ?? { full_name: '', bio: '' }}
      />
    </div>
  );
}
