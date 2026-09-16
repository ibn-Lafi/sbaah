'use client';

import { useTheme } from '@/lib/theme/theme-context';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.7 6.7 0 0 0 9.5 9.5Z" />
    </svg>
  );
}

/** Same sun/moon-showing-the-mode-it-switches-to pattern as dashboard's ThemeToggle — labels come from MARKETING_CONTENT (public-site has no shared locale-dictionary context like dashboard's `useLocale()`). */
export function ThemeToggle({
  labels,
  className = '',
}: {
  labels: { switchToDark: string; switchToLight: string };
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const title = theme === 'light' ? labels.switchToDark : labels.switchToLight;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      className={`flex flex-none items-center justify-center rounded-full bg-white/15 hover:bg-white/25 ${className}`}
    >
      {theme === 'light' ? <MoonIcon className="h-[17px] w-[17px]" /> : <SunIcon className="h-[17px] w-[17px]" />}
    </button>
  );
}
