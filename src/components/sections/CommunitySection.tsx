import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { getCommunityStats } from '@/lib/community';

/**
 * Community-Sektion mit echten Zahlen aus der Datenbank.
 *
 * Vorher standen hier erfundene Werte (12.400 Fans, 340+ Channels, 218 online)
 * und ein Chat mit ausgedachten Nutzern. Jetzt zählt die Sektion, was
 * tatsächlich da ist — und sagt es offen, wenn das noch wenig ist.
 */

const timeFmt = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'F';

export async function CommunitySection() {
  const { channels, memberCount, messageCount, latest } = await getCommunityStats();

  return (
    <section id="community" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-12 items-center">
        <div className="lg:col-span-3">
          <span className="chip">Community</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
            NFL auf Deutsch, <br />
            <span className="grad-text italic">ohne Umweg</span> über Reddit.
          </h2>
          <p className="text-mute mt-4 text-lg leading-relaxed">
            {memberCount === 0
              ? 'Die Channels stehen, die Technik läuft — es fehlen nur noch Leute. Registrieren, reinschreiben, fertig.'
              : 'Live-Threads zu jedem Spiel, Fantasy-Talk und Trash-Talk-Zonen für Rivalen-Wochen.'}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <Stat value={String(channels.length)} label={channels.length === 1 ? 'Channel' : 'Channels'} />
            <Stat value={memberCount.toLocaleString('de-DE')} label={memberCount === 1 ? 'Mitglied' : 'Mitglieder'} />
            <Stat value={messageCount.toLocaleString('de-DE')} label="Nachrichten" />
          </div>

          {channels.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {channels.map((c) => (
                <li key={c.slug}>
                  <span className="chip" title={c.description ?? undefined}>
                    # {c.name}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/community"
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            >
              Zur Community
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-line hover:border-primary transition"
            >
              Konto anlegen
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="text-accent">#</span>
              <span className="font-semibold">{channels[0]?.name ?? 'Allgemein'}</span>
            </div>
            <span className="chip">
              {messageCount.toLocaleString('de-DE')}{' '}
              {messageCount === 1 ? 'Nachricht' : 'Nachrichten'}
            </span>
          </div>

          <div className="space-y-4 text-sm min-h-[18rem]">
            {latest.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <MessageSquare size={28} className="text-mute mb-3" />
                <p className="font-semibold">Noch keine Nachricht geschrieben.</p>
                <p className="text-mute text-xs mt-1 max-w-[16rem]">
                  Der Chat läuft in Echtzeit, sobald sich jemand anmeldet. Bis dahin bleibt es hier
                  ehrlich leer.
                </p>
              </div>
            ) : (
              latest.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold shrink-0 text-white">
                    {initials(m.author)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-primary truncate">{m.author}</span>
                      <span className="text-[10px] font-mono text-mute">
                        {m.createdAt ? timeFmt.format(new Date(m.createdAt)) : ''}
                      </span>
                    </div>
                    <div className="mt-0.5 break-words">{m.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-line">
            <Link
              href="/community"
              className="block text-center text-sm font-semibold text-primary hover:text-accent transition"
            >
              Im Chat mitschreiben →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-4">
      <div className="font-display text-3xl font-bold grad-text-soft tabular-nums">{value}</div>
      <div className="text-xs text-mute font-mono uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
