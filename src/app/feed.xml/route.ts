import { createPublicClient } from '@/lib/supabase/public';
import { articles as editorial } from '@/data/articles';
import { SITE_URL } from '@/lib/seo';

/**
 * RSS-Feed der neuesten Artikel für Feed-Reader und Aggregatoren. Bing nimmt
 * Feeds außerdem wie eine Sitemap an und findet neue Artikel darüber schneller.
 */
export const revalidate = 900;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const { data } = await createPublicClient()
    .from('articles')
    .select('slug, title, excerpt, published_at')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const items = [
    ...(data ?? []).map((a) => ({
      slug: a.slug as string,
      title: a.title as string,
      excerpt: (a.excerpt as string | null) ?? '',
      date: a.published_at as string | null,
    })),
    ...editorial.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, date: a.publishedAt })),
  ]
    .filter((a) => a.slug && a.title)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 50);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>NFL-DE-Hub — NFL-News auf Deutsch</title>
<link>${SITE_URL}</link>
<description>NFL-News, Analysen und Advanced Stats auf Deutsch.</description>
<language>de-de</language>
<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map((a) => {
    const url = `${SITE_URL}/magazin/${encodeURIComponent(a.slug)}`;
    const date = a.date ? `<pubDate>${new Date(a.date).toUTCString()}</pubDate>` : '';
    return `<item><title>${esc(a.title)}</title><link>${url}</link><guid>${url}</guid>${date}<description>${esc(a.excerpt)}</description></item>`;
  })
  .join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
