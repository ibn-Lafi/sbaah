import { okResponse } from '@/lib/http';

/** Liveness check — no auth, no database access. */
export function GET() {
  return okResponse({ status: 'ok' });
}
