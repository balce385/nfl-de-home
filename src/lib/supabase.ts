/**
 * @deprecated — verwende @/lib/supabase/client (Browser) oder @/lib/supabase/server (RSC).
 * Diese Datei existiert nur noch für Rückwärtskompatibilität.
 */
export { createClient } from './supabase/client';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
