import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { isThin } from '@/lib/seo';
import { articles } from '@/data/articles';
import { TEAM_FACTS } from '@/data/team-facts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nfl-fan-app.de';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ['', '/news', '/teams', '/stats', '/playbook', '/magazin', '/community', '/about', '/api-docs', '/kontakt'];

  const staticEntries: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }));

  // Team-Seiten: Kader und Spielplan aendern sich waehrend der Saison woechentlich.
  const teamEntries: MetadataRoute.Sitemap = Object.keys(TEAM_FACTS).map((t) => ({
    url: `${SITE_URL}/teams/${t.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const bySlug = new Map<string, Date>();
  for (const a of articles) {
    bySlug.set(a.slug, a.publishedAt ? new Date(a.publishedAt) : now);
  }

  const { data } = await createPublicClient()
    .from('articles')
    .select('slug, published_at, body_md')
    .order('published_at', { ascending: false })
    .limit(1000);
  // Nur Artikel mit eigenem Text: Feed-Anrisse sind noindex (siehe isThin) und
  // gehoeren deshalb auch nicht in die Sitemap.
  for (const a of data ?? []) {
    if (a.slug && !isThin(a.body_md)) bySlug.set(a.slug, a.published_at ? new Date(a.published_at) : now);
  }

  const articleEntries: MetadataRoute.Sitemap = [...bySlug].map(([slug, lastModified]) => ({
    url: `${SITE_URL}/magazin/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...teamEntries, ...articleEntries];
}
