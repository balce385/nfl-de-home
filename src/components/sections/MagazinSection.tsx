import Link from 'next/link';
import { ArticleCard } from '@/components/ui/ArticleCard';
import { articles } from '@/lib/mock-data';

export function MagazinSection() {
  return (
    <section id="magazin" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="chip-warn chip">Magazin</span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
              Aus der <span className="grad-text italic">Redaktion.</span>
            </h2>
          </div>
          <Link
            href="/magazin"
            className="text-sm font-semibold text-primary hover:text-accent transition"
          >
            Alle Artikel →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
