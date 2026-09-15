'use client';

import { useLocale } from '@/lib/i18n/locale-context';

/**
 * Text pill (not an icon) since "AR"/"EN" already reads at a glance —
 * same rounded-full/bg-surface-subtle treatment as the topbar's other
 * round icon buttons (visit-site, account), just wide enough for two
 * letters. Shows the language it switches *to*, matching the mockup's
 * "visit site" pattern of labeling the action rather than the state.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, toggleLocale, t } = useLocale();
  const nextLabel = locale === 'ar' ? 'EN' : 'AR';
  const title = locale === 'ar' ? t.toggles.switchToEnglish : t.toggles.switchToArabic;

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={title}
      title={title}
      className={`md:bg-surface-subtle flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15 text-[13px] font-semibold text-white md:h-[42px] md:w-[42px] md:text-text-primary ${className}`}
    >
      {nextLabel}
    </button>
  );
}
