/** One line-icon per sidebar nav entry — replaces the old dot indicator. Same stroke style as the topbar's globe/visit-site icons (stroke-width 1.7, currentColor) so they read as one family. */

type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Svg>
  );
}

export function ClientsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.8" />
    </Svg>
  );
}

export function PropertiesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  );
}

export function StaffIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <circle cx="12" cy="10" r="2.3" />
      <path d="M8 17c0-2 1.8-3.2 4-3.2s4 1.2 4 3.2" />
    </Svg>
  );
}

export function ApplicantsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </Svg>
  );
}

export function WebsiteIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
    </Svg>
  );
}

export function AppsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      {[6, 12, 18].flatMap((cy) => [6, 12, 18].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" stroke="none" />))}
    </Svg>
  );
}

export function ThemeCustomizeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h1.5A4.5 4.5 0 0 0 21 12c0-5-4-9-9-9z" />
      <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="7.3" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function ThemeStoreIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 9l1-5h14l1 5" />
      <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M9 20v-5h6v5" />
    </Svg>
  );
}

export function DomainIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 6.3l.8-.8a4 4 0 0 1 5.7 5.7l-.8.8" />
      <path d="M13 17.7l-.8.8a4 4 0 0 1-5.7-5.7l.8-.8" />
    </Svg>
  );
}
