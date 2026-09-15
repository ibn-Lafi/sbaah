'use client';

import { useLocale } from '@/lib/i18n/locale-context';

/**
 * Text pill (not an icon) since "AR"/"EN" already reads at a glance —
 * same rounded-full/bg-surface-subtle treatment as the topbar's other
 * round icon buttons (visit-site, account), just wide enough for two
 * letters. Shows the language it switches *to*, matching the mockup's
 * "visit site" pattern of labeling the action rather than the state.
 *
 * `variant="header"` (default) assumes the topbar's purple-on-mobile/
 * white-on-desktop background (transparent white circle below md, solid
 * surface-subtle at md+). `variant="surface"` is for chrome-less pages
 * (login/register/forgot-password) that never have that purple ground —
 * plain surface-subtle circle at every breakpoint.
 */
export function LanguageToggle({
  className = '',
  variant = 'header',
}: {
  className?: string;
  variant?: 'header' | 'surface';
}) {
  const { locale, toggleLocale, t } = useLocale();
  const nextLabel = locale === 'ar' ? 'EN' : 'AR';
  const title = locale === 'ar' ? t.toggles.switchToEnglish : t.toggles.switchToArabic;
  const variantClasses =
    variant === 'header'
      ? 'md:bg-surface-subtle h-9 w-9 bg-white/15 text-white md:h-[42px] md:w-[42px] md:text-text-primary'
      : 'bg-surface-subtle text-text-primary h-[42px] w-[42px]';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={title}
      title={title}
      className={`flex flex-none items-center justify-center rounded-full text-[13px] font-semibold ${variantClasses} ${className}`}
    >
      {nextLabel}
    </button>
  );
}
