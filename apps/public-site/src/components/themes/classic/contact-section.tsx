import { pickLocalized } from '@/lib/i18n/localized-field';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import { WhatsappButton } from '@/components/properties/whatsapp-button';
import type { ContactSectionProps } from '../types';

export function ContactSection({ locale, config, whatsappPhone, tenantId }: ContactSectionProps) {
  const title = pickLocalized(locale, config.title_ar || DEFAULT_SECTION_TITLE.contact.ar, config.title_en ?? null) || DEFAULT_SECTION_TITLE.contact[locale];

  return (
    <section id="contact" className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-12 text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p dir="ltr" className="text-lg text-black/70">
        {whatsappPhone}
      </p>
      <WhatsappButton locale={locale} phone={whatsappPhone} tenantId={tenantId} />
    </section>
  );
}
