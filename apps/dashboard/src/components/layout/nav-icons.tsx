/** One line-icon per sidebar nav entry — replaces the old dot indicator. Same stroke style as the topbar's globe/visit-site icons (stroke-width 1.7, currentColor) so they read as one family. */

type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
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

export function BuildingsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="9" width="6.5" height="12" rx="1" />
      <rect x="13.5" y="3" width="7" height="18" rx="1" />
      <path d="M6 12.5h1.5M6 15.5h1.5M6 18.5h1.5M16 6.5h2M16 9.5h2M16 12.5h2M16 15.5h2" />
    </Svg>
  );
}

export function ProjectsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3l8 4.5-8 4.5-8-4.5 8-4.5z" />
      <path d="M4 12l8 4.5 8-4.5" />
      <path d="M4 16.5l8 4.5 8-4.5" />
    </Svg>
  );
}

export function RentalsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="7.5" cy="15.5" r="4" />
      <path d="M10.5 12.5L19 4" />
      <path d="M15.5 8l2.5 2.5M18 5.5l2.5 2.5" />
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
      {[6, 12, 18].flatMap((cy) =>
        [6, 12, 18].map((cx) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" stroke="none" />
        )),
      )}
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

export function PagesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h4" />
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

/** الشريط السفلي بعرض الجوال — أيقونة ترس للإعدادات. */
export function SettingsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.18.37.39.7.6 1 .28.35.66.56 1.1.6h.1v4h-.1c-.44.04-.82.25-1.1.6-.21.3-.42.63-.6 1z" />
    </Svg>
  );
}

/** الشريط السفلي بعرض الجوال — الزر الدائري الذي يفتح قائمة بقية الصفحات. */
export function MenuIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
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

/** بقية الصفحات (mobile-nav.tsx) — سهم قابل الاتجاه لتوسيع/طي مجموعة "الموقع الالكتروني"، مطابقًا لسلوك ▲/▼ الأكورديون بالشريط الجانبي لسطح المكتب. */
export function ChevronIcon({ open, className }: IconProps & { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** زر طي/توسيع الشريط الجانبي (sidebar.tsx) — لوحة جانبية مع سهم يعكس اتجاهه حسب الحالة، بلا حاجة لأصل جديد لكل حالة. */
export function SidebarToggleIcon({ collapsed, className }: IconProps & { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="M9 4.5v15" />
      <path d={collapsed ? 'M5.5 12h3M7 10.3L5.5 12l1.5 1.7' : 'M14.5 10.3L16 12l-1.5 1.7'} />
    </svg>
  );
}

export function SupportIcon({ className }: IconProps) {
  return <Svg className={className}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8h8M8 12h5"/></Svg>;
}
