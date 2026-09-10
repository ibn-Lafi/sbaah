/** One line-icon per sidebar nav entry — same stroke style as dashboard's nav-icons.tsx so both apps' sidebars read as one family. */

type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export function AccountsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.8" />
    </Svg>
  );
}

export function DomainsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 6.3l.8-.8a4 4 0 0 1 5.7 5.7l-.8.8" />
      <path d="M13 17.7l-.8.8a4 4 0 0 1-5.7-5.7l.8-.8" />
    </Svg>
  );
}

export function PlansIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 12.5V5a1 1 0 0 1 1-1h7.5L20 11.5a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0L3 12.5z" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function ThemesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 9l1-5h14l1 5" />
      <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M9 20v-5h6v5" />
    </Svg>
  );
}

export function CitiesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  );
}

export function DistrictsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
    </Svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5c.1-.5.1-1 0-1.5l1.6-1.2-1.5-2.6-1.9.5a7 7 0 0 0-1.3-.8L16 5.5h-3l-.3 2.4c-.5.2-.9.5-1.3.8l-1.9-.5L8 11.2l1.6 1.2c-.1.5-.1 1 0 1.5L8 15.1l1.5 2.6 1.9-.5c.4.3.8.6 1.3.8L13 20.5h3l.3-2.5c.5-.2.9-.5 1.3-.8l1.9.5 1.5-2.6-1.6-1.1z" />
    </Svg>
  );
}
