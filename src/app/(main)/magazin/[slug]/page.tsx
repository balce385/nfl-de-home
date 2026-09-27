import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import { getArticle } from '@/data/articles';
import { siteOwner } from '@/data/site-owner';
import { cutAtWord, DESC_MAX, fitTitle, OG_BASE } from '@/lib/seo';

// Auf Abruf erzeugt und eine Stunde gecacht (ISR) statt bei jedem Aufruf
// gestreamt: nur so kommt ein notFound() als echter 404 an.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

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
  // 1) Lokale Redaktions-Artikel (volle Texte, immer verfügbar)
  const local = getArticle(params.slug);
  let article: Article | null = local
    ? {
        slug: local.slug,
        title: local.title,
        excerpt: local.excerpt,
        body_md: local.body,
        cover_url: null,
        category: local.category,
        source: local.source ?? null,
        source_url: local.sourceUrl ?? null,
        language: 'de',
        original_title: null,
        translated: false,
        team_id: local.teamId ?? null,
        published_at: local.publishedAt,
      }
    : null;

  // 2) Fallback: Supabase (News-Scraper-Artikel)
  if (!article) {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', params.slug)
      .maybeSingle();
    article = (data as Article) ?? null;
  }

  if (!article) {
    notFound();
  }

  const a = article;
  // Uebersetzung gescheitert: Text ist englisch, fuer Screenreader und Suchmaschinen markieren.
  const lang = a.language === 'en' ? 'en' : undefined;
  const published = a.published_at
    ? new Date(a.published_at).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nfl-fan-app.de';
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.excerpt ?? undefined,
    // Google verlangt fuer Artikel-Rich-Results ein Bild; ohne Cover das Vorschaubild.
    image: [a.cover_url ?? `${siteUrl}/og.png`],
    datePublished: a.published_at ?? undefined,
    dateModified: a.published_at ?? undefined,
    inLanguage: a.language ?? 'de',
    mainEntityOfPage: `${siteUrl}/magazin/${a.slug}`,
    author: local
      ? { '@type': 'Person', name: siteOwner.name, url: `${siteUrl}/about` }
      : { '@type': 'Organization', name: a.source ?? 'NFL-Fan-App' },
    publisher: {
      '@type': 'Organization',
      name: 'NFL-Fan-App',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.png`, width: 512, height: 512 },
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
        {lang && <span className="chip">englisch</span>}
        {a.source && <span>· {a.source}</span>}
        {published && <span>· {published}</span>}
      </div>

      <h1 lang={lang} className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-6">
        {a.title}
      </h1>

      {a.excerpt && (
        <p lang={lang} className="text-lg text-mute leading-relaxed mb-8 italic font-display">
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
        <div lang={lang} className="prose prose-invert max-w-none text-ink leading-relaxed whitespace-pre-wrap">
          {a.body_md}
        </div>
      )}

      {local?.related && (
        <p className="mt-8">
          <Link href={local.related.href} className="font-semibold text-primary hover:text-accent">
            {`${local.related.label} →`}
          </Link>
        </p>
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
              Original-Titel: „{a.original_title}“
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
  const local = getArticle(params.slug);
  let a: {
    title: string;
    excerpt: string | null;
    body_md: string | null;
    cover_url: string | null;
    published_at: string | null;
  } | null = local
    ? {
        title: local.title,
        excerpt: local.excerpt,
        body_md: local.body,
        cover_url: null,
        published_at: local.publishedAt ?? null,
      }
    : null;
  if (!a) {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('articles')
      .select('title, excerpt, body_md, cover_url, published_at')
      .eq('slug', params.slug)
      .maybeSingle();
    a = data ?? null;
  }
  // Schon hier abbrechen: Die Seite streamt, ein notFound() erst im Seiteninhalt
  // kam mit HTTP 200 an — Google wertet das als Soft-404.
  if (!a) notFound();
  // Feed-Teaser sind oft nur ein halber Satz ("Hoffentlich besser als die Picks
  // der letzten Woche"). Dann den Titel voranstellen, damit das Snippet sagt,
  // worum es geht.
  const teaser = a.excerpt?.trim() ?? '';
  const raw = teaser.length >= 70 ? teaser : [a.title, teaser].filter(Boolean).join(' – ');
  const description = raw ? cutAtWord(raw, DESC_MAX) : undefined;
  const path = `/magazin/${params.slug}`;
  return {
    // Vorher "Titel — NFL DE Hub | NFL-Fan-App": Marke doppelt, Titel meist gekürzt.
    title: fitTitle(a.title),
    description,
    alternates: { canonical: path },
    // Nur eigene Texte in den Suchindex. Scraper-Artikel sind fremde Meldungen,
    // meist maschinell uebersetzt — Google wertet sie als "scaled content", und
    // viele davon ziehen die ganze Domain herunter. Lesbar bleiben sie trotzdem.
    robots: local ? undefined : { index: false, follow: true },
    openGraph: {
      ...OG_BASE,
      type: 'article',
      url: path,
      title: a.title,
      description,
      publishedTime: a.published_at ?? undefined,
      images: a.cover_url ? [{ url: a.cover_url }] : OG_BASE.images,
    },
  };
}
