const messages = [
  { user: 'thomas_b', initials: 'TB', color: 'bg-primary', time: '21:14', text: 'Was für ein Wurf von Mahomes 🚀 60 Yard Bomb auf Worthy', textColor: 'text-primary' },
  { user: 'nina_82',  initials: 'N8', color: 'bg-warn',    time: '21:14', text: 'Eagles Defense hat keine Antwort auf das Tempo heute', textColor: 'text-warn' },
  { user: 'lukas_kbg', initials: 'LK', color: 'bg-accent',  time: '21:15', text: 'Wenn Hurts jetzt nicht antwortet, ist das Game gelaufen', textColor: 'text-accent' },
  { user: 'marc_die',  initials: 'M',  color: 'bg-danger',  time: '21:15', text: 'Spotify-Tipp während der Werbung: NFL Talk auf Deutsch ⤵', textColor: 'text-danger' },
];

export function CommunitySection() {
  return (
    <section id="community" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-12 items-center">
        <div className="lg:col-span-3">
          <span className="chip">Community</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
            12.400 Fans. <br />
            Eine <span className="grad-text italic">deutschsprachige</span> Heimat.
          </h2>
          <p className="text-mute mt-4 text-lg leading-relaxed">
            Live-Threads zu jedem Spiel, Fantasy-League-Channels, Trash-Talk-Zonen für
            Rivalen-Wochen. Moderiert von der Redaktion, gespielt von echten Fans.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <Stat value="340+" label="Channels" />
            <Stat value="24/7" label="Moderation" />
            <Stat value="DSGVO" label="konform" />
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="text-accent">#</span>
              <span className="font-semibold">chiefs-eagles-live</span>
            </div>
            <span className="chip-accent chip">218 online</span>
          </div>

          <div className="space-y-4 text-sm h-72 overflow-hidden">
            {messages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full ${m.color} flex items-center justify-center text-xs font-bold shrink-0 text-white`}
                >
                  {m.initials}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold ${m.textColor}`}>{m.user}</span>
                    <span className="text-[10px] font-mono text-mute">{m.time}</span>
                  </div>
                  <div className="mt-0.5">{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-line flex items-center gap-2">
            <input
              type="text"
              placeholder="Schreib was…"
              className="flex-1 bg-black/40 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-ink placeholder:text-mute"
              disabled
            />
            <button className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white" disabled>
              ↑
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-4">
      <div className="font-display text-3xl font-bold grad-text-soft">{value}</div>
      <div className="text-xs text-mute font-mono uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
