import { BrandSpinner } from './brand-spinner';

/** Drop-in replacement for a plain "جارٍ التحميل..." text. Matches apps/dashboard/src/components/ui/loading-state.tsx. */
export function LoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <BrandSpinner size={48} />
    </div>
  );
}
