import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-blue-700 to-accent flex items-center justify-center font-mono font-bold text-sm text-white">
        DE
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold tracking-tight">
          NFL<span className="text-accent">·</span>Hub
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-mute -mt-0.5">
          Deutschland
        </div>
      </div>
    </Link>
  );
}
