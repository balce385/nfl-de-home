import { NextResponse } from 'next/server';

// Bezahl-Funktion entfernt — kein Webhook-Handling mehr nötig.
export async function POST() {
  return NextResponse.json(
    { error: 'Bezahl-Funktion ist deaktiviert.' },
    { status: 410 },
  );
}
