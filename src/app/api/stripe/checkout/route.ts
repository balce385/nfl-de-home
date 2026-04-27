import { NextResponse } from 'next/server';

// Bezahl-Funktion entfernt — Seite ist 100% kostenlos.
// Diese Route bleibt nur als Platzhalter, damit alte Bookmarks/Links keinen 500-Crash auslösen.
export async function POST() {
  return NextResponse.json(
    { error: 'Bezahl-Funktion ist deaktiviert. Alle Features sind kostenlos.' },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'Bezahl-Funktion ist deaktiviert. Alle Features sind kostenlos.' },
    { status: 410 },
  );
}
