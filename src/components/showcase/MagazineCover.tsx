import Link from 'next/link';

/**
 * Vorher standen hier eine fest verdrahtete „Ausgabe 47" und als „Week" der
 * Monat des Erscheinungsdatums — beides ohne Bezug zum Artikel. Jetzt die
 * laufende Nummer und das echte Datum.
 */
export function MagazineCover({
  issue,
  date,
  title,
  subtitle,
  readMinutes,
  href = '#',
}: {
  issue: number;
  date: string;
  title: string;
  subtitle: string;
  readMinutes: number;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-5 bg-[#04342C] text-[#9FE1CB] hover:bg-[#085041] transition"
    >
      <div className="font-mono text-[10px] tracking-widest text-[#5DCAA5]">
        AUSGABE {issue} · {date.toUpperCase()}
      </div>
      <h3 className="font-display text-2xl font-bold leading-tight text-[#E1F5EE] mt-2 mb-1">
        {title}
      </h3>
      <p className="font-display italic text-sm text-[#9FE1CB] leading-relaxed">{subtitle}</p>
      <div className="mt-3 font-mono text-[10px] text-[#5DCAA5] uppercase tracking-wider">
        {readMinutes} min Lesezeit
      </div>
    </Link>
  );
}
