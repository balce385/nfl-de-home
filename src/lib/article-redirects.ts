import MOVED from '@/data/article-redirects.json';

/**
 * Artikel-Adressen von vor dem 26.09.2026 auf die neuen, stabilen Slugs.
 *
 * Die alten Slugs enthielten Umlaute, "/" und "?" (aus Feed-IDs wie
 * "/?p=420406"); beim Aufruf zerfallen sie in Pfad und Query. Der Schlüssel ist
 * deshalb der alte Slug ohne "/" und "?" — so trifft er in jeder Form.
 * Die Tabelle ist einmalig aus der Sicherung der Umstellung entstanden
 * (/opt/stack/data/seo/articles-backup-*.json); neue Slugs ändern sich nicht mehr.
 */
export function movedArticlePath(
  pathname: string,
  search: string,
  map: Record<string, string> = MOVED as Record<string, string>,
): string | null {
  if (!pathname.startsWith('/magazin/')) return null;
  let rest = pathname.slice('/magazin/'.length) + search;
  try {
    rest = decodeURIComponent(rest);
  } catch {
    return null;
  }
  const target = map[rest.normalize('NFC').replace(/[/?]/g, '')];
  return target ? `/magazin/${target}` : null;
}
