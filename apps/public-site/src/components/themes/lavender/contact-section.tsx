import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { ContactSectionProps } from '../types';

export function ContactSection({ locale, config, whatsappPhone }: ContactSectionProps) {
  const title = config.title_ar || DEFAULT_SECTION_TITLE.contact.ar;
  return (
    <section
      id="contact"
      className="bg-tenant-primary px-5 py-16 text-white sm:px-6 sm:py-24"
      aria-labelledby="lavender-contact-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/40 pt-7 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
        <div>
          <p className="mb-4 text-xs font-semibold text-white/80">
            {locale === 'ar' ? 'ابدأ محادثة معنا' : 'START A CONVERSATION'}
          </p>
          <h2
            id="lavender-contact-title"
            className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl"
          >
            {title}
          </h2>
        </div>
        {whatsappPhone && (
          <a
            dir="ltr"
            href={'https://wa.me/' + whatsappPhone.replace(/[^0-9]/g, '')}
            className="inline-flex min-h-12 w-fit items-center border-b border-white/70 text-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {whatsappPhone}
            <span aria-hidden="true" className="ms-3">
              ↗
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
