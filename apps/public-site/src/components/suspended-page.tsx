const LABELS = {
  ar: { title: 'الحساب غير متاح حاليًا', body: 'يرجى المحاولة لاحقًا.' },
  en: { title: 'This account is currently unavailable', body: 'Please check back later.' },
};

/**
 * PRODUCT_SPEC.md section 2 — shown instead of a plain 404 for a
 * suspended/cancelled tenant's domain (task 36/42), so a visitor sees a
 * real "temporarily unavailable" message rather than the site
 * seemingly vanishing. Deliberately generic/unbranded (سبعة's own
 * purple, not the tenant's custom colors) — showing the tenant's own
 * skin on a page saying their site is down would look like a broken
 * page rather than an intentional notice, and `getTenantSiteResult()`
 * withholds the tenant's name/branding for this case on purpose.
 */
export function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="mb-2 text-2xl font-bold text-[#68458A]">٧</p>
      <p className="text-lg font-semibold">{LABELS.ar.title}</p>
      <p className="text-sm text-black/60">{LABELS.ar.body}</p>
      <div className="mt-4 h-px w-16 bg-black/10" />
      <p className="text-lg font-semibold">{LABELS.en.title}</p>
      <p className="text-sm text-black/60">{LABELS.en.body}</p>
    </div>
  );
}
