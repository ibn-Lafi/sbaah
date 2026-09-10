import { BrandSpinner } from './brand-spinner';

/** Drop-in replacement for a plain "جارٍ التحميل..." text — every loading placeholder across the dashboard uses this. Icon-only (سبعة's own "7" badge, BrandSpinner) — no caption. */
export function LoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <BrandSpinner size={48} />
    </div>
  );
}
