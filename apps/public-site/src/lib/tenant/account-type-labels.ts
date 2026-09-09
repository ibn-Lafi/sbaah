import type { AccountType } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';

/** The سبعة badge's tooltip describes "account type", never "verified" (PRODUCT_SPEC section 6 — no license/CR check happens behind it). */
export const ACCOUNT_TYPE_LABEL: Record<Locale, Record<AccountType, string>> = {
  ar: { individual: 'فرد', institution: 'مؤسسة', company: 'شركة' },
  en: { individual: 'Individual', institution: 'Institution', company: 'Company' },
};
