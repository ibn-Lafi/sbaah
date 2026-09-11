import type { AccountType } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { ACCOUNT_TYPE_LABEL } from '@/lib/tenant/account-type-labels';

const LABELS: Record<Locale, { prefix: string; brand: string }> = {
  ar: { prefix: 'جميع الحقوق محفوظة ', brand: '@سبعة' },
  en: { prefix: 'All rights reserved ', brand: '@SBAAH' },
};

function getPlatformRootDomain(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? 'sbaah.app';
}

/**
 * PRODUCT_SPEC.md section 6 — fixed part of the template, rendered
 * unconditionally in the layout's `<footer>` (never from a toggleable
 * `website_sections` row): brokers cannot hide or remove it. The
 * account-type color circle from the original design was dropped
 * (founder's explicit call) in favor of a plain copyright line, but the
 * tooltip still names the account *type* (never "verified" — no
 * CR/license check happens behind it, PRODUCT_SPEC's own wording
 * constraint). Assumes a dark footer background (white/opacity text) —
 * its only caller today.
 */
export function SiteBadge({ accountType, locale }: { accountType: AccountType; locale: Locale }) {
  const accountTypeLabel = ACCOUNT_TYPE_LABEL[locale][accountType];
  const { prefix, brand } = LABELS[locale];

  return (
    <a
      href={`https://${getPlatformRootDomain()}`}
      target="_blank"
      rel="noopener noreferrer"
      title={accountTypeLabel}
      className="text-xs text-white/50 hover:text-white/80"
    >
      {prefix}
      <span className="font-semibold text-white/70">{brand}</span>
    </a>
  );
}
