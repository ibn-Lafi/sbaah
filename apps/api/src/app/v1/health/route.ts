import { NextResponse } from 'next/server';

/** Liveness check — no auth, no database access. */
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
