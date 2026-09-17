import Image from 'next/image';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';

/** لقطة شاشة حقيقية من لوحة تحكم سبعة الفعلية. */
export function ProductShowcase({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].productShowcase;

  return (
    <section className="overflow-hidden bg-[#faf9fb] px-5 py-14 sm:px-6 sm:py-18">
      <Reveal className="mx-auto max-w-5xl">
        <span className="text-xs font-semibold text-brand sm:text-sm">{t.eyebrow}</span>
        <h2 className="font-display mt-2 max-w-2xl text-2xl font-semibold text-text-primary sm:text-3xl">{t.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">{t.subtitle}</p>
      </Reveal>

      <Reveal delayMs={120} className="mx-auto mt-8 max-w-5xl">
        <div className="relative rounded-[1.75rem] bg-gradient-to-br from-brand/[.12] via-white to-brand/[.05] px-3 pb-0 pt-5 sm:px-8 sm:pt-8">
          <div className="overflow-hidden rounded-t-2xl border border-border-subtle bg-surface-card shadow-[0_24px_70px_-35px_rgba(72,42,94,.4)]">
            <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-subtle-2 px-3 py-2.5 sm:px-4">
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
              <span className="ms-2 flex-1 truncate text-center text-[10px] text-text-placeholder sm:text-xs" dir="ltr">yourname.sbaah.app</span>
            </div>
            <Image src="/marketing/dashboard-preview.webp" alt={t.imageAlt} width={1600} height={1000} sizes="(max-width: 1024px) 100vw, 1024px" className="h-auto w-full" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
