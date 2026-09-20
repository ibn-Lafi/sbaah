/**
 * Label values duplicated verbatim across apps (code-quality audit
 * finding) — a single source here instead of copies drifting apart.
 * Purely display strings, not business logic; each app's own per-domain
 * labels file still owns labels that only it needs (e.g. dashboard's
 * PROPERTY_STATUS_LABELS has no public-site equivalent).
 */
import type { AccountType, AssetType, ListingType } from './types/enums';

/** Was duplicated in dashboard's settings page (inline) and console's tenant/labels.ts. */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};

/** Bilingual — public-site's سبعة badge reads by locale (its tooltip describes "account type", never "verified": PRODUCT_SPEC section 6, no license/CR check behind it). Was a separate copy in public-site's own lib/tenant/account-type-labels.ts. */
export const ACCOUNT_TYPE_LABELS_BILINGUAL: Record<AccountType, { ar: string; en: string }> = {
  individual: { ar: 'فرد', en: 'Individual' },
  institution: { ar: 'مؤسسة', en: 'Institution' },
  company: { ar: 'شركة', en: 'Company' },
};

/** Bilingual source — dashboard (Arabic-only) reads `.ar`, public-site reads either by locale. */
export const PROPERTY_TYPE_LABELS_BILINGUAL: Record<AssetType, { ar: string; en: string }> = {
  apartment: { ar: 'شقة', en: 'Apartment' },
  villa: { ar: 'فيلا', en: 'Villa' },
  building: { ar: 'عمارة', en: 'Building' },
  land: { ar: 'أرض', en: 'Land' },
  plot: { ar: 'قطعة أرض', en: 'Plot' },
  office: { ar: 'مكتب', en: 'Office' },
  shop: { ar: 'محل', en: 'Shop' },
  warehouse: { ar: 'مستودع', en: 'Warehouse' },
  floor: { ar: 'دور', en: 'Floor' },
  compound: { ar: 'مجمع', en: 'Compound' },
  chalet: { ar: 'شاليه', en: 'Chalet' },
  farm: { ar: 'مزرعة', en: 'Farm' },
  parking: { ar: 'موقف', en: 'Parking' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const LISTING_TYPE_LABELS_BILINGUAL: Record<ListingType, { ar: string; en: string }> = {
  sale: { ar: 'بيع', en: 'For sale' },
  rent: { ar: 'إيجار', en: 'For rent' },
};
