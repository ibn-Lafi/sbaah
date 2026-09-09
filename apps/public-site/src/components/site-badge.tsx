import type { AccountType } from '@sbaah/shared';
import { ACCOUNT_TYPE_BADGE_COLOR } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { ACCOUNT_TYPE_LABEL } from '@/lib/tenant/account-type-labels';

const LABELS: Record<Locale, string> = { ar: 'هذا الموقع على منصة سبعة', en: 'This site runs on SBAAH' };

function getPlatformRootDomain(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? 'sbaah.app';
}

/**
 * PRODUCT_SPEC.md section 6 — fixed part of the template, rendered
 * unconditionally in the layout's `<footer>` (never from a toggleable
 * `website_sections` row): brokers cannot hide or remove it. Circle
 * color reflects `tenants.account_type` directly — the tooltip
 * describes the account *type*, never "verified", since no CR/license
 * check happens behind it (PRODUCT_SPEC's own explicit wording
 * constraint, to avoid implying the platform validated anything).
 */
export function SiteBadge({ accountType, locale }: { accountType: AccountType; locale: Locale }) {
  const color = ACCOUNT_TYPE_BADGE_COLOR[accountType];
  const accountTypeLabel = ACCOUNT_TYPE_LABEL[locale][accountType];

  return (
    <a
      href={`https://${getPlatformRootDomain()}`}
      target="_blank"
      rel="noopener noreferrer"
      title={accountTypeLabel}
      className="flex items-center gap-2 text-xs text-black/60 hover:text-black/80"
    >
      <span
        className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        7
      </span>
      {LABELS[locale]}
    </a>
  );
}
