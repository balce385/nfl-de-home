import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { articles } from '@/data/articles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nfl-fan-app.de';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ['', '/news', '/stats', '/playbook', '/magazin', '/community', '/about', '/api-docs', '/kontakt'];

  const staticEntries: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }));

  const bySlug = new Map<string, Date>();
  for (const a of articles) {
    bySlug.set(a.slug, a.publishedAt ? new Date(a.publishedAt) : now);
  }

  // Kein Cookie-Client: die Sitemap ist öffentlich und soll gecacht bleiben.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await supabase
    .from('articles')
    .select('slug, published_at')
    .order('published_at', { ascending: false })
    .limit(1000);
  for (const a of data ?? []) {
    if (a.slug) bySlug.set(a.slug, a.published_at ? new Date(a.published_at) : now);
  }

  const articleEntries: MetadataRoute.Sitemap = [...bySlug].map(([slug, lastModified]) => ({
    url: `${SITE_URL}/magazin/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries];
}
