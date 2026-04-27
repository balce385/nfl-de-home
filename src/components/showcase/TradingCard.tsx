import Image from 'next/image';

export function TradingCard({
  name,
  position,
  jersey,
  team,
  photoUrl,
  stats,
}: {
  name: string;
  position: string;
  jersey?: number | null;
  team: string;
  photoUrl?: string | null;
  stats: { label: string; value: string | number }[];
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="rounded-xl p-3 bg-[#FAEEDA]">
      <div className="bg-white border-2 border-[#BA7517] rounded-lg p-4">
        <div className="flex gap-3 items-center">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover bg-[#412402]"
              unoptimized
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#412402] text-[#FAC775] flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
          )}
          <div>
            <div className="text-[#412402] font-bold text-base">{name}</div>
            <div className="text-[#854F0B] text-xs font-mono">
              {position}
              {jersey ? ` · #${jersey}` : ''} · {team}
            </div>
          </div>
        </div>
        <div
          className="grid gap-2 mt-3 font-mono"
          style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)` }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#FAC775] py-1.5 px-2 rounded text-center"
            >
              <div className="text-[9px] text-[#633806] uppercase">{s.label}</div>
              <div className="text-sm font-bold text-[#412402] tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
