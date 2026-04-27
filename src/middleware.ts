import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Phase 2: Supabase Session Refresh Middleware.
 * - Aktualisiert ablaufende Tokens automatisch
 * - Schützt /dashboard vor nicht-eingeloggten Usern (in Phase 2 aktivieren)
 *
 * In Phase 1 läuft die Middleware durch, ohne zu blockieren —
 * Supabase ist dann noch nicht konfiguriert.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // Phase 1: einfach durchlassen

  const supabase = createServerClient(url, key, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/dashboard');
  const isAuthPage = path === '/login' || path === '/register';

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
