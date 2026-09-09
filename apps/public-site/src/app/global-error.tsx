'use client';

import './globals.css';

/**
 * Catches exceptions thrown from `app/[locale]/layout.tsx` itself (e.g.
 * `api` unreachable) — distinct from the "domain not found" business
 * case, which uses `notFound()` and renders `not-found.tsx` instead.
 * Must be its own `<html>/<body>` and a Client Component (Next.js
 * convention for `global-error.tsx`) since the root layout never
 * rendered its shell for this to nest inside.
 */
export default function GlobalError() {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold">حدث خطأ غير متوقع</p>
          <p className="text-sm text-black/60">Something went wrong</p>
        </div>
      </body>
    </html>
  );
}
