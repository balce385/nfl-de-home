import { ArticleCard } from '@/components/ui/ArticleCard';
import { articles } from '@/lib/mock-data';

export const metadata = {
  title: 'Magazin — NFL-Analysen, News und Fantasy auf Deutsch',
  description:
    'Tiefenanalysen, Spieltagsberichte, Fantasy-Tipps und Hintergründe — von der Redaktion des NFL-DE-Hub.',
};

export default function MagazinPage() {
  const [featured, ...rest] = articles;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <span className="chip-warn chip">Magazin</span>
        <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
          Aus der <span className="grad-text italic">Redaktion.</span>
        </h1>
        <p className="text-mute mt-3 text-lg max-w-2xl">
          Wöchentliche Analysen, Game-Recaps und Hintergründe — kuratiert von echten NFL-Fans.
        </p>
      </div>

      {/* Featured */}
      <div className="card overflow-hidden mb-12 grid md:grid-cols-2">
        <div className="h-64 md:h-auto bg-gradient-to-br from-red-900/40 via-bg to-bg relative overflow-hidden">
          <div className="absolute inset-0 field-lines opacity-40" />
          <div className="absolute bottom-6 left-6 font-display text-9xl font-black opacity-20">
            {featured.accentTeam}
          </div>
        </div>
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="chip">Featured</span>
            <span className="text-xs font-mono text-mute uppercase tracking-wider">
              {new Date(featured.publishedAt).toLocaleDateString('de-DE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              · {featured.readingMinutes} Min
            </span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
            {featured.title}
          </h2>
          <p className="text-mute mt-4 leading-relaxed">{featured.excerpt}</p>
          <a
            href={`/magazin/${featured.slug}`}
            className="text-sm font-semibold text-primary hover:text-accent mt-5 inline-flex items-center gap-2"
          >
            Artikel lesen →
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
