import { BrandSpinner } from './brand-spinner';

/** Drop-in replacement for a plain "جارٍ التحميل..." text — every page-level loading placeholder in the app uses this, with سبعة's own "٧" badge spinner (BrandSpinner) rather than a generic ring. */
export function LoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-text-secondary ${className}`}>
      <BrandSpinner size={20} />
      <span>جارٍ التحميل...</span>
    </div>
  );
}
