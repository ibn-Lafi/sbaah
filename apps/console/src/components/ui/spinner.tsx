/**
 * Shared loading spinner — a "comet trail" ring (faint full track + two
 * arcs fading into the leading edge). `currentColor`-based so it still
 * reads correctly wherever it sits — white on a filled brand-purple
 * button (Button's `loading` prop), brand purple on a plain page.
 * Mirrors apps/dashboard/src/components/ui/spinner.tsx exactly.
 */
export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.25" className="opacity-15" />
      <path d="M3 12a9 9 0 0 1 6.5-8.66" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" className="opacity-45" />
      <path d="M9.5 3.34A9 9 0 0 1 21 12" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}
