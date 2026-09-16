import Image from 'next/image';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';

/**
 * لقطة شاشة حقيقية من لوحة تحكم سبعة الفعلية (بيانات تجريبية مُعبَّأة
 * لغرض العرض فقط — لا حساب عميل حقيقي)، لا رسم توضيحي مُقلَّد — طلب
 * المؤسس صراحة. الصورة بصيغة WebP مضغوطة (~32 كيلوبايت) في
 * public/marketing/dashboard-preview.webp.
 */
export function ProductShowcase({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].productShowcase;

  return (
    <section className="px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-sm font-semibold text-brand">{t.eyebrow}</span>
        <h2 className="font-display mt-3 text-3xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <Reveal delayMs={150} className="mx-auto mt-12 max-w-4xl">
        <div className="rounded-card overflow-hidden border border-border-default bg-surface-card shadow-[0_20px_60px_-15px_rgba(31,29,34,.25)]">
          {/* شريط المتصفح الزخرفي — الصورة أسفله حقيقية، لا زخرفة. */}
          <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-subtle-2 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ms-3 flex-1 truncate rounded-full bg-surface-card px-3 py-1 text-center text-xs text-text-placeholder" dir="ltr">
              yourname.sbaah.app
            </span>
          </div>

          <Image
            src="/marketing/dashboard-preview.webp"
            alt={t.imageAlt}
            width={1600}
            height={1000}
            sizes="(max-width: 896px) 100vw, 896px"
            className="h-auto w-full"
          />
        </div>
      </Reveal>
    </section>
  );
}
