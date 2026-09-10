type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export function ExitIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
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
