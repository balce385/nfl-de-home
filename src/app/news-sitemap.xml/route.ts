import { fullArticles } from '@/data/articles';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

/**
 * Google-News-Sitemap: nur eigene Artikel der letzten zwei Tage, so verlangt es
 * Google News. Scraper-Meldungen fehlen bewusst, sie sind noindex.
 */
export const revalidate = 900;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TWO_DAYS = 2 * 86_400_000;

export async function GET() {
  const recent = fullArticles.filter((a) => Date.now() - new Date(a.publishedAt).getTime() < TWO_DAYS);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recent
  .map(
    (a) => `<url><loc>${SITE_URL}/magazin/${encodeURIComponent(a.slug)}</loc><news:news><news:publication><news:name>${SITE_NAME}</news:name><news:language>de</news:language></news:publication><news:publication_date>${a.publishedAt}</news:publication_date><news:title>${esc(a.title)}</news:title></news:news></url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
