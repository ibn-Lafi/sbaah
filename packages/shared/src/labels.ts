/**
 * Label values duplicated verbatim across apps (code-quality audit
 * finding) — a single source here instead of copies drifting apart.
 * Purely display strings, not business logic; each app's own per-domain
 * labels file still owns labels that only it needs (e.g. dashboard's
 * PROPERTY_STATUS_LABELS has no public-site equivalent).
 */
import type { AccountType, ListingType, PropertyType } from './types/enums';

/** Was duplicated in dashboard's settings page (inline) and console's tenant/labels.ts. */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};

/** Bilingual source — dashboard (Arabic-only) reads `.ar`, public-site reads either by locale. */
export const PROPERTY_TYPE_LABELS_BILINGUAL: Record<PropertyType, { ar: string; en: string }> = {
  apartment: { ar: 'شقة', en: 'Apartment' },
  villa: { ar: 'فيلا', en: 'Villa' },
  land: { ar: 'أرض', en: 'Land' },
  office: { ar: 'مكتب', en: 'Office' },
  shop: { ar: 'محل', en: 'Shop' },
  building: { ar: 'عمارة', en: 'Building' },
};

export const LISTING_TYPE_LABELS_BILINGUAL: Record<ListingType, { ar: string; en: string }> = {
  sale: { ar: 'بيع', en: 'For sale' },
  rent: { ar: 'إيجار', en: 'For rent' },
};
