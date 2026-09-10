import type { ContactSectionProps } from '../types';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import { WhatsappButton } from '@/components/properties/whatsapp-button';

/**
 * Modern theme's Contact — a full-width brand-colored card, unlike
 * Classic's plain centered text block.
 */
export function ContactSection({ locale, config, whatsappPhone, tenantId }: ContactSectionProps) {
  const title = pickLocalized(locale, config.title_ar || DEFAULT_SECTION_TITLE.contact.ar, config.title_en ?? null) || DEFAULT_SECTION_TITLE.contact[locale];

  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-14">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-tenant-primary px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p dir="ltr" className="text-lg text-white/90">
          {whatsappPhone}
        </p>
        <WhatsappButton
          locale={locale}
          phone={whatsappPhone}
          tenantId={tenantId}
          className="flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-tenant-primary hover:opacity-90"
        />
      </div>
    </section>
  );
}
