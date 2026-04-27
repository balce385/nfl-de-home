import Link from 'next/link';

export function HighlightBanner({
  label = 'Play of the Week',
  title,
  description,
  metric,
  matchup,
  href,
}: {
  label?: string;
  title: string;
  description: string;
  metric: string;
  matchup: string;
  href?: string;
}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      <Link href={href} className="block">
        {children}
      </Link>
    ) : (
      <div>{children}</div>
    );

  return (
    <Wrapper>
      <div
        className="rounded-xl overflow-hidden text-white p-4"
        style={{
          background: 'linear-gradient(135deg, #185FA5 0%, #042C53 100%)',
        }}
      >
        <div className="font-mono text-[10px] tracking-widest text-[#85B7EB] uppercase">
          {label}
        </div>
        <div className="text-2xl font-bold mt-1.5 leading-tight">{title}</div>
        <p className="text-xs text-[#B5D4F4] mt-1.5">{description}</p>
        <div className="flex gap-2 mt-3">
          <span className="bg-white text-[#042C53] px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">
            {metric}
          </span>
          <span className="bg-white/15 text-[#E6F1FB] px-2.5 py-1 rounded-full text-[10px] font-mono">
            {matchup}
          </span>
        </div>
      </div>
    </Wrapper>
  );
}
