import { createClient } from '@supabase/supabase-js';

/**
 * Supabase ohne Cookies, nur mit dem öffentlichen Schlüssel — für Seiten, die
 * für alle gleich aussehen (Artikel, Sitemap, Feed). Der Cookie-Client aus
 * ./server macht jede Seite dynamisch: Sie wird gestreamt, nicht gecacht, und
 * ein notFound() kommt dann mit HTTP 200 statt 404 an.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
