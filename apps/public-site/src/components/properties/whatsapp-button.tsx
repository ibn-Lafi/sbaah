'use client';

import type { Locale } from '@/lib/i18n/locales';
import { logWhatsappClick } from '@/lib/api/public-leads';

const LABELS: Record<Locale, string> = { ar: 'تواصل عبر واتساب', en: 'Chat on WhatsApp' };

function buildMessage(locale: Locale, propertyTitle?: string): string {
  if (propertyTitle) {
    return locale === 'ar' ? `مرحبًا، أنا مهتم بالعقار: ${propertyTitle}` : `Hi, I'm interested in this property: ${propertyTitle}`;
  }
  return locale === 'ar' ? 'مرحبًا، أرغب في الاستفسار' : "Hi, I'd like to inquire";
}

interface WhatsappButtonProps {
  locale: Locale;
  phone: string;
  tenantId: string;
  /** Omit for a general (non-property-specific) WhatsApp button, e.g. the homepage contact section. */
  propertyTitle?: string;
  propertyId?: string;
  className?: string;
}

/**
 * A click both logs a Lead (source='whatsapp_click', PRODUCT_SPEC
 * section 4) AND opens wa.me — fire-and-forget on the log call so a
 * slow/failed request never blocks the visitor from actually chatting;
 * the anchor's own href navigation isn't prevented either way.
 */
export function WhatsappButton({ locale, phone, tenantId, propertyTitle, propertyId, className }: WhatsappButtonProps) {
  const href = `https://wa.me/${phone.replace(/^\+/, '')}?text=${encodeURIComponent(buildMessage(locale, propertyTitle))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        logWhatsappClick({ tenant_id: tenantId, property_id: propertyId ?? null }).catch(() => {
          // Best-effort only — never block or alert the visitor over a logging failure.
        });
      }}
      className={className ?? 'flex h-12 items-center justify-center rounded-lg bg-[#25D366] px-6 text-sm font-semibold text-white hover:opacity-90'}
    >
      {LABELS[locale]}
    </a>
  );
}
