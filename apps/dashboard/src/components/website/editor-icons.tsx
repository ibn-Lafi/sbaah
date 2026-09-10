type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

/** RTL "back" — points right (where "back" visually points in a right-to-left reading flow), not left. */
export function BackArrowIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

/** الأقسام ↔ إعدادات الصفحة — منزلقات ضبط، تمييزًا عن أي ترس إعدادات عام آخر. */
export function AdjustmentsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 6h10M17 6h3" />
      <circle cx="14" cy="6" r="2" />
      <path d="M4 12h3M10 12h10" />
      <circle cx="7" cy="12" r="2" />
      <path d="M4 18h10M17 18h3" />
      <circle cx="14" cy="18" r="2" />
    </Svg>
  );
}

export function SettingsGearIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5c.1-.5.1-1 0-1.5l1.6-1.2-1.5-2.6-1.9.5a7 7 0 0 0-1.3-.8L16 5.5h-3l-.3 2.4c-.5.2-.9.5-1.3.8l-1.9-.5L8 11.2l1.6 1.2c-.1.5-.1 1 0 1.5L8 15.1l1.5 2.6 1.9-.5c.4.3.8.6 1.3.8L13 20.5h3l.3-2.5c.5-.2.9-.5 1.3-.8l1.9.5 1.5-2.6-1.6-1.1z" />
    </Svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function DesktopIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  );
}

export function MobileIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </Svg>
  );
}

export function ChevronIcon({ open, className }: IconProps & { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${className} transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" />
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

export function XIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 4l16 16M20 4L4 20" />
    </Svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </Svg>
  );
}

/** Saudi commercial-registration (CR / السجل التجاري) badge — document-with-seal, not a copied government logo. */
export function CrIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v4h4" />
      <circle cx="10.5" cy="14" r="2.3" />
      <path d="M9.2 18.5l1.3-1.6 1.3 1.6" />
    </Svg>
  );
}

/** VAT / الرقم الضريبي badge — percent-in-document, not a copied government logo. */
export function TaxIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v4h4" />
      <path d="M9 17l5-6" />
      <circle cx="9.3" cy="11.3" r=".9" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="15.7" r=".9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Fal (فال) real-estate broker license badge — house-with-check, not a copied REGA logo. */
export function FalIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 15l1.8 1.8L15 13" />
    </Svg>
  );
}
