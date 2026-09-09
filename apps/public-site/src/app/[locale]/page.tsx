import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionary';

/**
 * Placeholder only — the real section-driven homepage (Hero, Property
 * Grid, About, ...) is task 35/42. This task's scope is the app's
 * scaffold: locale routing + Host-based tenant resolution + shared
 * chrome (layout.tsx), proven end-to-end by rendering something real
 * per tenant.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-lg text-tenant-primary">{dict.comingSoon}</p>
    </div>
  );
}
