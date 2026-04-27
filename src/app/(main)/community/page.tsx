import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatRoom } from './ChatRoom';

export const metadata = {
  title: 'Community — der NFL-Treffpunkt für DACH',
};

export default async function CommunityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/community');

  // Lade alle Channels — keine Pro-Restriktionen mehr
  const { data: channels } = await supabase
    .from('channels')
    .select('id, slug, name, description')
    .order('created_at', { ascending: true });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
      <span className="chip">Community</span>
      <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
        12.400 Fans. <span className="grad-text italic">Eine Heimat.</span>
      </h1>
      <p className="text-mute mt-3 text-lg max-w-2xl">
        Wähle einen Channel und steig direkt in die Diskussion ein. Moderiert, deutschsprachig,
        DSGVO-konform.
      </p>

      <ChatRoom
        channels={channels ?? []}
        token={session?.access_token ?? ''}
        userId={user.id}
        userName={
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split('@')[0] ??
          'Fan'
        }
      />
    </div>
  );
}
