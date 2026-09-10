import { createClient } from '@/lib/supabase/server';

/**
 * Echte Kennzahlen der Community — keine Schätzungen, keine Platzhalter.
 * Zählt direkt in der Datenbank; ist noch nichts da, steht dort eben eine 0.
 */

export type CommunityChannel = {
  slug: string;
  name: string;
  description: string | null;
};

export type CommunityMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  channel: string | null;
};

export type CommunityStats = {
  channels: CommunityChannel[];
  memberCount: number;
  messageCount: number;
  latest: CommunityMessage[];
};

/** Zeilenzahl einer Tabelle über den count-Header, ohne die Daten zu laden. */
async function countRows(
  supabase: ReturnType<typeof createClient>,
  table: 'profiles' | 'messages'
): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return error ? 0 : count ?? 0;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = createClient();

  const [channelsRes, memberCount, messageCount, latestRes] = await Promise.all([
    supabase.from('channels').select('slug, name, description').order('created_at'),
    countRows(supabase, 'profiles'),
    countRows(supabase, 'messages'),
    supabase
      .from('messages')
      .select('id, content, created_at, profiles(full_name), channels(name)')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const latest: CommunityMessage[] = ((latestRes.data ?? []) as unknown as Record<string, any>[]).map(
    (m) => ({
      id: String(m.id),
      content: String(m.content ?? ''),
      createdAt: String(m.created_at ?? ''),
      author: m.profiles?.full_name ?? 'Fan',
      channel: m.channels?.name ?? null,
    })
  );

  return {
    channels: (channelsRes.data ?? []) as CommunityChannel[],
    memberCount,
    messageCount,
    // Neueste zuletzt, damit der Verlauf wie im Chat von oben nach unten liest.
    latest: latest.reverse(),
  };
}
