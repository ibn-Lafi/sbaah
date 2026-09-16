'use client';

import { useLocale } from '@/lib/i18n/locale-context';

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
    </svg>
  );
}

/**
 * Text pill (not an icon) by default since "AR"/"EN" already reads at a
 * glance — same rounded-full/bg-surface-subtle treatment as the topbar's
 * other round icon buttons (visit-site, account), just wide enough for
 * two letters. Shows the language it switches *to*, matching the
 * mockup's "visit site" pattern of labeling the action rather than the
 * state. `iconOnly` (auth pages' in-card toggle row, founder's request)
 * swaps the "AR"/"EN" text for a plain globe icon instead — same button,
 * same behavior, just a different glyph.
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
  iconOnly = false,
}: {
  className?: string;
  variant?: 'header' | 'surface';
  iconOnly?: boolean;
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
      {iconOnly ? <GlobeIcon className="h-[19px] w-[19px]" /> : nextLabel}
    </button>
  );
}
