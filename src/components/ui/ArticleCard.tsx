import Link from 'next/link';
import type { Article } from '@/types';

const accentBg: Record<string, string> = {
  red: 'from-red-900/40',
  emerald: 'from-emerald-900/40',
  blue: 'from-blue-900/40',
  purple: 'from-purple-900/40',
  orange: 'from-orange-900/40',
};

const chipClass: Record<string, string> = {
  primary: 'chip',
  accent: 'chip-accent chip',
  warn: 'chip-warn chip',
};

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/magazin/${article.slug}`}>
      <article className="card overflow-hidden group cursor-pointer h-full">
        <div
          className={`h-48 bg-gradient-to-br ${accentBg[article.accentColor]} via-bg to-bg relative overflow-hidden`}
        >
          <div className="absolute inset-0 field-lines opacity-40" />
          <div className="absolute bottom-4 left-5 font-display text-7xl font-black opacity-20">
            {article.accentTeam}
          </div>
          <span className={`absolute top-4 left-4 ${chipClass[article.categoryColor]}`}>
            {article.category}
          </span>
        </div>
        <div className="p-6">
          <div className="text-xs font-mono text-mute uppercase tracking-wider">
            {new Date(article.publishedAt).toLocaleDateString('de-DE', {
              day: 'numeric',
              month: 'long',
            })}{' '}
            · {article.readingMinutes} Min Lesezeit
          </div>
          <h3 className="font-display text-xl font-bold mt-2 leading-snug group-hover:text-primary transition">
            {article.title}
          </h3>
          <p className="text-sm text-mute mt-2 leading-relaxed">{article.excerpt}</p>
        </div>
      </article>
    </Link>
  );
}
