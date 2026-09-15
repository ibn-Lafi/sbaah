const LABELS = {
  suspended: {
    ar: { title: 'الحساب غير متاح حاليًا', body: 'يرجى المحاولة لاحقًا.' },
    en: { title: 'This account is currently unavailable', body: 'Please check back later.' },
  },
  /** migration 0047 — فال/CR/tax number still missing from حسابي, so the site simply hasn't published yet (never "unavailable", nothing is actually wrong). */
  incomplete_profile: {
    ar: { title: 'هذا الموقع غير منشور بعد', body: 'يرجى المحاولة لاحقًا.' },
    en: { title: "This site isn't published yet", body: 'Please check back later.' },
  },
};

/**
 * PRODUCT_SPEC.md section 2 — shown instead of a plain 404 for a
 * suspended/cancelled (or trial-expired, migration 0047) tenant's domain
 * (task 36/42), so a visitor sees a real "temporarily unavailable"
 * message rather than the site seemingly vanishing. Also reused, with a
 * different `reason`, for a tenant that hasn't finished حسابي yet
 * (migration 0047) — same shell, different wording, since that's not an
 * outage. Deliberately generic/unbranded either way (سبعة's own purple,
 * not the tenant's custom colors) — showing the tenant's own skin on a
 * page saying their site is down would look like a broken page rather
 * than an intentional notice, and `getTenantSiteResult()` withholds the
 * tenant's name/branding for both cases on purpose.
 */
export function SuspendedPage({ reason = 'suspended' }: { reason?: 'suspended' | 'incomplete_profile' }) {
  const labels = LABELS[reason];
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="mb-2 text-2xl font-bold text-[#68458A]">٧</p>
      <p className="text-lg font-semibold">{labels.ar.title}</p>
      <p className="text-sm text-black/60">{labels.ar.body}</p>
      <div className="mt-4 h-px w-16 bg-black/10" />
      <p className="text-lg font-semibold">{labels.en.title}</p>
      <p className="text-sm text-black/60">{labels.en.body}</p>
    </div>
  );
}
