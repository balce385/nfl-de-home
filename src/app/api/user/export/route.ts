import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DSGVO Art. 20: Recht auf Datenübertragbarkeit.
 * Liefert alle eigenen Daten als JSON-Download.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [profile, watchlist, messages] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('watchlist').select('*').eq('user_id', user.id),
    supabase.from('messages').select('*').eq('user_id', user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    watchlist: watchlist.data,
    messages: messages.data,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nfl-de-hub-export-${user.id}.json"`,
    },
  });
}
