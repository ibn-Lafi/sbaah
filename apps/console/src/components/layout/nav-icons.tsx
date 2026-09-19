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
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.18.37.39.7.6 1 .28.35.66.56 1.1.6h.1v4h-.1c-.44.04-.82.25-1.1.6-.21.3-.42.63-.6 1z" />
    </Svg>
  );
}

export function SupportIcon({ className }: IconProps) { return <Svg className={className}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8h8M8 12h5"/></Svg>; }

export function FaqIcon({ className }: IconProps) { return <Svg className={className}><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.4 1-1.4 2"/><path d="M12 16.5h.01"/></Svg>; }

export function MenuIcon({className}:IconProps){return <Svg className={className}><path d="M4 7h16M4 12h16M4 17h16"/></Svg>}
export function CloseIcon({className}:IconProps){return <Svg className={className}><path d="M6 6l12 12M18 6L6 18"/></Svg>}
export function ChevronIcon({open,className}:IconProps&{open:boolean}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${className??''} transition-transform ${open?'rotate-180':''}`}><path d="M6 9l6 6 6-6"/></svg>}
export function SidebarToggleIcon({collapsed,className}:IconProps&{collapsed:boolean}){return <Svg className={className}><rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M9 4.5v15"/><path d={collapsed?'M5.5 12h3M7 10.3L5.5 12l1.5 1.7':'M14.5 10.3L16 12l-1.5 1.7'}/></Svg>}
