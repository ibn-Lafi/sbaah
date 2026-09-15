'use client';

import { useTheme } from '@/lib/theme/theme-context';
import { useLocale } from '@/lib/i18n/locale-context';

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

/**
 * Same round icon-button treatment as the topbar's visit-site/account
 * buttons — swaps sun/moon to show the mode it switches *to*, same
 * pattern as `LanguageToggle` (see its `variant` doc — same two options
 * here, for the same reason).
 */
export function ThemeToggle({
  className = '',
  variant = 'header',
}: {
  className?: string;
  variant?: 'header' | 'surface';
}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const title = theme === 'light' ? t.toggles.switchToDark : t.toggles.switchToLight;
  const variantClasses =
    variant === 'header'
      ? 'md:bg-surface-subtle h-9 w-9 bg-white/15 text-white md:h-[42px] md:w-[42px] md:text-text-primary'
      : 'bg-surface-subtle text-text-primary h-[42px] w-[42px]';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      className={`flex flex-none items-center justify-center rounded-full ${variantClasses} ${className}`}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-[17px] w-[17px] md:h-[19px] md:w-[19px]" />
      ) : (
        <SunIcon className="h-[17px] w-[17px] md:h-[19px] md:w-[19px]" />
      )}
    </button>
  );
}
