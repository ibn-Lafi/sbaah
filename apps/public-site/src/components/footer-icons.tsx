/** تذييل الموقع العام — أيقونات حسابات التواصل + الأرقام النظامية (سجل/ضريبي/فال). خطوط بسيطة أصلية، ليست شعارات رسمية منسوخة. */

type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5c.35 0 .69.04 1 .12" />
      <path d="M14 3c.3 2.2 2 4 4.5 4.2" />
    </Svg>
  );
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20l1.3-3.8A8 8 0 1 1 8.4 19L4 20z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.5-1 .3-1.4-.2-1.7l-1.3-.8c-.4-.2-.7-.1-1 .2l-.4.4c-1-.5-1.9-1.4-2.4-2.4l.4-.4c.3-.3.4-.6.2-1l-.8-1.3c-.3-.5-.7-.7-1.7-.2" />
    </Svg>
  );
}

export function SnapchatIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 4c2.5 0 4 1.8 4 4.3 0 1 .1 1.9.3 2.4.3.6 1 .9 1.7 1.1-.1.6-.9 1-1.5 1.2 0 .4.1.9-.4 1.1-.4.2-1 .1-1.4.3-.4.2-.5.9-1.2 1.2-.7.3-1.5-.2-2.5-.2s-1.8.5-2.5.2c-.7-.3-.8-1-1.2-1.2-.4-.2-1-.1-1.4-.3-.5-.2-.4-.7-.4-1.1-.6-.2-1.4-.6-1.5-1.2.7-.2 1.4-.5 1.7-1.1.2-.5.3-1.4.3-2.4C8 5.8 9.5 4 12 4z" />
    </Svg>
  );
}

export function CallIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2C10.5 19 5 13.5 5 6a2 2 0 0 1 0-2z" />
    </Svg>
  );
}

/**
 * Business-number badges (footer, حسابي) — three deliberately DIFFERENT
 * shapes (registration certificate / regulatory shield / license medal),
 * each with its own accent color (BUSINESS_BADGE_COLOR below), so they
 * read as three distinct official marks rather than one grey icon
 * reused three times. Still original line art, not copied government
 * artwork — the real ZATCA/REGA/Ministry of Commerce emblems are
 * protected marks, and this badge shows for any tenant who merely typed
 * a number into a field (self-reported, unverified), so embedding the
 * literal government logo here would misleadingly imply an official
 * verification that never happened.
 */

/** المركز السعودي للأعمال (Saudi Business Center) — السجل التجاري: registration certificate with a seal/ribbon. */
export function CrIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5.5 2.5h7.5l4 4v9.3" />
      <path d="M13 2.5v4h4" />
      <path d="M5.5 2.5v11.8" />
      <circle cx="8.5" cy="15.7" r="3.1" />
      <path d="M7.1 15.6l1 1 1.9-1.9" />
      <path d="M6.9 18.4v3l1.6-1 1.6 1v-3" />
    </Svg>
  );
}

/** هيئة الزكاة والضريبة والجمارك (ZATCA) — الرقم الضريبي: regulatory shield with a percent mark. */
export function TaxIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 2.7l6.5 2.6v5.2c0 4.3-2.7 7.4-6.5 8.8-3.8-1.4-6.5-4.5-6.5-8.8V5.3L12 2.7z" />
      <circle cx="9.6" cy="9.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="14.2" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.9 14.5l4.5-5.2" />
    </Svg>
  );
}

/** الهيئة العامة للعقار — رخصة فال للوساطة والتسويق العقاري: house-in-medal license badge. */
export function FalIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="9.3" r="6.8" />
      <path d="M8.6 9.6l3.4-2.9 3.4 2.9" />
      <path d="M9.2 9.1v3.3c0 .3.3.6.6.6h4.4c.3 0 .6-.3.6-.6V9.1" />
      <path d="M9.7 17.3v4.2l2.3-1.4 2.3 1.4v-4.2" />
    </Svg>
  );
}

/** Per-badge accent color (footer's business-number badges) — matches each icon above 1:1. */
export const BUSINESS_BADGE_COLOR = {
  cr: '#0C6B58',
  tax: '#0B4F6C',
  fal: '#B8860B',
} as const;
