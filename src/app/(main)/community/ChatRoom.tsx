'use client';

import { useEffect, useRef, useState } from 'react';
import { Hash, Send, AlertTriangle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

type Channel = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  user_name?: string | null;
  content: string;
  created_at: string;
};

export function ChatRoom({
  channels,
  token,
  userId,
  userName,
}: {
  channels: Channel[];
  token: string;
  userId: string;
  userName: string;
}) {
  const [active, setActive] = useState<Channel | null>(channels[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Verbindung initialisieren
  useEffect(() => {
    if (!token) return;
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) {
      setError('Socket-URL nicht konfiguriert.');
      return;
    }

    const socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      setConnected(false);
      setError(`Verbindung fehlgeschlagen: ${err.message}`);
    });
    socket.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('history', (msgs: Message[]) => {
      setMessages(msgs);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Channel wechseln
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !active) return;
    setMessages([]);
    socket.emit('join', { channelId: active.id });
    return () => {
      socket.emit('leave', { channelId: active.id });
    };
  }, [active]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket || !active || !input.trim()) return;
    socket.emit('message', { channelId: active.id, content: input.trim() }, (ack: { ok: boolean; error?: string }) => {
      if (!ack?.ok) setError(ack?.error ?? 'Senden fehlgeschlagen.');
    });
    setInput('');
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4 mt-10 min-h-[600px]">
      {/* Channel-Liste */}
      <aside className="card p-3 space-y-1 h-fit">
        {channels.length === 0 && (
          <p className="text-sm text-mute p-3">Keine Channels verfügbar.</p>
        )}
        {channels.map((c) => {
          const isActive = active?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${
                isActive ? 'bg-primary/15 text-ink' : 'hover:bg-white/5 text-mute'
              }`}
            >
              <Hash size={14} />
              <span className="font-medium">{c.name || c.slug}</span>
            </button>
          );
        })}
      </aside>

      {/* Chat-Bereich */}
      <div className="card flex flex-col min-h-[600px]">
        {/* Header */}
        <div className="border-b border-line p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-mute" />
            <span className="font-display text-lg font-bold">
              {active?.name ?? 'Kein Channel'}
            </span>
          </div>
          <span
            className={`text-xs font-mono flex items-center gap-1 ${
              connected ? 'text-accent' : 'text-mute'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent' : 'bg-mute'}`} />
            {connected ? 'verbunden' : 'offline'}
          </span>
        </div>

        {active?.description && (
          <p className="text-xs text-mute px-4 pt-3">{active.description}</p>
        )}

        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 text-xs bg-danger/10 border border-danger/30 rounded p-3 text-danger">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-mute text-center py-12">
              Noch keine Nachrichten. Schreib die erste!
            </p>
          )}
          {messages.map((m) => {
            const isMe = m.user_id === userId;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                    isMe ? 'bg-primary/20 text-ink' : 'bg-white/5 text-ink'
                  }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-mono text-mute mb-0.5">
                      {m.user_name ?? m.user_id.slice(0, 6)}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-line p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!connected || !active}
            placeholder={
              !connected ? 'Verbinde …' : active ? `In #${active.slug} schreiben …` : 'Channel wählen'
            }
            className="flex-1 bg-black/40 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!connected || !input.trim()}
            className="btn-primary px-4 py-2 rounded-lg text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[10px] text-mute px-3 pb-3">
          Eingeloggt als <strong>{userName}</strong> · Bitte respektvoll bleiben.
        </p>
      </div>
    </div>
  );
}
