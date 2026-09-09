import './globals.css';

/**
 * Top-level (outside `[locale]`) and fully self-contained with its own
 * `<html>/<body>` — required because the failure this catches
 * originates in `app/[locale]/layout.tsx` itself (unresolved locale, or
 * `getTenantSite()` returning null for an unrecognized Host header), so
 * that root layout never renders its own `<html>` wrapper for this page
 * to nest inside. Locale-neutral by necessity: at this point the
 * visitor's locale (and even their tenant) couldn't be resolved, so
 * both languages are shown rather than guessing one.
 */
export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold">الموقع غير موجود</p>
          <p className="text-sm text-black/60">Site not found</p>
        </div>
      </body>
    </html>
  );
}
