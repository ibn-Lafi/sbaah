import { Spinner } from './spinner';

/** Drop-in replacement for a plain "جارٍ التحميل..." text — every page-level loading placeholder in the app uses this. */
export function LoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-text-secondary ${className}`}>
      <Spinner className="h-4 w-4" />
      <span>جارٍ التحميل...</span>
    </div>
  );
}
