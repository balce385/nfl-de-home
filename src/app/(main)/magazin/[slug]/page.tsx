import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

type Article = {
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string | null;
  cover_url: string | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  language: string | null;
  original_title: string | null;
  translated: boolean | null;
  team_id: string | null;
  published_at: string | null;
};

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  const a = article as Article;
  const published = a.published_at
    ? new Date(a.published_at).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/magazin"
        className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink transition mb-8"
      >
        <ArrowLeft size={14} />
        Zurück zum Magazin
      </Link>

      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-mute mb-4">
        {a.category && <span className="chip">{a.category}</span>}
        {a.team_id && <span className="chip-accent chip">{a.team_id}</span>}
        {a.translated && (
          <span className="chip-warn chip" title={`Original: ${a.original_title}`}>
            DE-Übersetzung
          </span>
        )}
        {a.source && <span>· {a.source}</span>}
        {published && <span>· {published}</span>}
      </div>

      <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-6">
        {a.title}
      </h1>

      {a.excerpt && (
        <p className="text-lg text-mute leading-relaxed mb-8 italic font-display">
          {a.excerpt}
        </p>
      )}

      {a.cover_url && (
        <div className="relative aspect-video w-full mb-8 rounded-xl overflow-hidden bg-black/30">
          <Image
            src={a.cover_url}
            alt={a.title}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {a.body_md && (
        <div className="prose prose-invert max-w-none text-ink leading-relaxed whitespace-pre-wrap">
          {a.body_md}
        </div>
      )}

      {a.source_url && (
        <div className="mt-12 pt-8 border-t border-line">
          <a
            href={a.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent"
          >
            Originalartikel bei {a.source} öffnen
            <ExternalLink size={14} />
          </a>
          {a.translated && a.original_title && (
            <p className="text-xs text-mute mt-3 italic">
              Original-Titel: „{a.original_title}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: a } = await supabase
    .from('articles')
    .select('title, excerpt, cover_url')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!a) return { title: 'Artikel nicht gefunden — NFL DE Hub' };
  return {
    title: `${a.title} — NFL DE Hub`,
    description: a.excerpt ?? undefined,
    openGraph: a.cover_url
      ? { images: [{ url: a.cover_url }] }
      : undefined,
  };
}
