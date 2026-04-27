import Link from 'next/link';

export function MagazineCover({
  issue,
  week,
  title,
  subtitle,
  readMinutes,
  author,
  href = '#',
}: {
  issue: number;
  week: number;
  title: string;
  subtitle: string;
  readMinutes: number;
  author: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-5 bg-[#04342C] text-[#9FE1CB] hover:bg-[#085041] transition"
    >
      <div className="font-mono text-[10px] tracking-widest text-[#5DCAA5]">
        AUSGABE {issue} · WEEK {week}
      </div>
      <h3 className="font-display text-2xl font-bold leading-tight text-[#E1F5EE] mt-2 mb-1">
        {title}
      </h3>
      <p className="font-display italic text-sm text-[#9FE1CB] leading-relaxed">{subtitle}</p>
      <div className="mt-3 font-mono text-[10px] text-[#5DCAA5] uppercase tracking-wider">
        {readMinutes} min Lesezeit · {author}
      </div>
    </Link>
  );
}
