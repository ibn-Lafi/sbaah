import type { WebsiteSectionType } from '@sbaah/shared';

type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
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

/** تعديل محتوى القسم — قلم رصاص، مطابق لصف القسم بمرجع الجوال. */
export function PencilIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      <path d="M14.5 5.5l3 3" />
    </Svg>
  );
}

/** إخفاء القسم عن الصفحة (يعيده لقائمة "إضافة قسم") — عين مشطوبة، بديل عن مفتاح Switch بشكل يطابق صف القسم بمرجع الجوال. */
export function EyeOffIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c5 0 9 4 10 7-.4 1.2-1.4 2.7-2.8 4M6.7 6.7C4.5 8.1 3 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
      <path d="M9.5 9.8a3 3 0 0 0 4.2 4.2" />
    </Svg>
  );
}

/** زر فتح قائمة إجراءات القسم (إخفاء/تكرار/حذف) — ثلاث نقاط رأسية، بديل عن أيقونة العين المشطوبة المباشرة. */
export function KebabIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

/** تكرار القسم — نسخ صف بمحتوى مطابق يُضاف بنهاية ترتيب الصفحة (بند "تكرار القسم" بقائمة KebabIcon). */
export function DuplicateIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </Svg>
  );
}

/** حذف القسم — سلة، بند بقائمة KebabIcon (غير نهائي فعليًا: يُخفي القسم ويُعيده لمكتبة "إضافة قسم"، مطابقًا لـ"إخفاء"، إذ لا حذف حر لنوع قسم "منسّق" أصلًا بهذا المنتج). */
export function TrashIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7" />
      <path d="M6 7l.8 12.2c0 .8.7 1.4 1.5 1.4h7.4c.8 0 1.5-.6 1.5-1.4L18 7" />
      <path d="M10 11v5M14 11v5" />
    </Svg>
  );
}

/** إضافة قسم جديد للصفحة — علامة زائد بسيطة. */
export function PlusIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

/** بحث باسم القسم في نافذة "إضافة قسم". */
export function SearchIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </Svg>
  );
}

/** اختيار قسم من قائمة "إضافة قسم" — حلقة فارغة/معبّأة، لا تُضيف بمجرد الضغط (تحديد فقط، الإضافة الفعلية بزر "إضافة" أسفل القائمة). */
export function RadioIcon({ selected, className }: IconProps & { selected: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <circle cx="12" cy="12" r="9" />
      {selected && <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />}
    </svg>
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
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 1.75a4 4 0 0 0-4 4v8.5a4 4 0 0 0 4 4h8.5a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5ZM17.5 5.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7.15A4.85 4.85 0 1 1 12 16.85 4.85 4.85 0 0 1 12 7.15Zm0 1.75a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z"/></svg>;
}

export function TiktokIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M14.1 2h3.25c.23 1.9 1.28 3.18 3.15 3.75v3.3a8.36 8.36 0 0 1-3.1-.78v6.15A6.58 6.58 0 1 1 11.1 7.85v3.34a3.3 3.3 0 1 0 3 3.28V2Z"/></svg>;
}

export function WhatsappIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M20.52 3.48A11.8 11.8 0 0 0 1.95 17.7L.3 23.7l6.14-1.61a11.8 11.8 0 0 0 14.08-18.61ZM12.02 21a9.78 9.78 0 0 1-4.99-1.37l-.36-.21-3.64.95.97-3.54-.23-.37A9.82 9.82 0 1 1 12.02 21Zm5.39-7.35c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.76.96-.94 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>;
}

export function SnapchatIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M12 2.2c-3.05 0-5.08 2.18-5.08 5.38 0 .78.12 1.66.12 2.34 0 .46-.22.76-.67.98-.54.26-1.28.32-1.83.57-.58.27-.5.92.06 1.2.76.38 1.5.43 1.7.94.15.37-.13.84.14 1.23.31.46 1 .27 1.4.58.47.36.45 1.06 1.07 1.32.78.33 1.72-.13 2.53-.13h1.12c.81 0 1.75.46 2.53.13.62-.26.6-.96 1.07-1.32.4-.31 1.09-.12 1.4-.58.27-.39-.01-.86.14-1.23.2-.51.94-.56 1.7-.94.56-.28.64-.93.06-1.2-.55-.25-1.29-.31-1.83-.57-.45-.22-.67-.52-.67-.98 0-.68.12-1.56.12-2.34 0-3.2-2.03-5.38-5.08-5.38Zm0 1.8c2.05 0 3.25 1.46 3.25 3.58 0 .73-.11 1.59-.11 2.34 0 1.14.55 2 1.55 2.5-.56.31-.94.7-1.15 1.18-.21.03-.43.11-.65.28-.61.46-.86 1.05-1 1.08-.28.12-.85-.15-1.43-.15h-.92c-.58 0-1.15.27-1.43.15-.14-.03-.39-.62-1-1.08-.22-.17-.44-.25-.65-.28-.21-.48-.59-.87-1.15-1.18 1-.5 1.55-1.36 1.55-2.5 0-.75-.11-1.61-.11-2.34C8.75 5.46 9.95 4 12 4Z"/></svg>;
}

export function FacebookIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M13.5 22v-9h3l.45-3.5H13.5V7.27c0-1.01.28-1.7 1.74-1.7H17.1V2.44A25 25 0 0 0 14.39 2C11.7 2 9.86 3.64 9.86 6.66V9.5H6.82V13h3.04v9h3.64Z"/></svg>;
}

export function TelegramIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M21.65 3.38 18.6 20.72c-.23 1.22-.83 1.52-1.69.95l-4.64-3.42-2.24 2.15c-.25.25-.46.46-.94.46l.33-4.73 8.61-7.78c.38-.33-.08-.52-.58-.19L6.81 14.87l-4.58-1.43c-1-.31-1.02-1 .21-1.48L20.35 5.05c.83-.3 1.56.2 1.3 1.33Z"/></svg>;
}

export function CallIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2C10.5 19 5 13.5 5 6a2 2 0 0 1 0-2z" />
    </Svg>
  );
}

export function XIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.26-8.3L2.98 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.73L8.44 4.05H6.58L17.8 19.84Z"/></svg>;
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

/** حسابي — العنوان. نفس دبوس الخريطة المستخدم في تذييل الموقع العام (footer-icons.tsx). */
export function LocationIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.4" />
    </Svg>
  );
}

function HeroSectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15l5-4 4 3 5-5 4 3" />
    </Svg>
  );
}

function GridSectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="8" height="8" rx="1.3" />
      <rect x="13" y="3" width="8" height="8" rx="1.3" />
      <rect x="3" y="13" width="8" height="8" rx="1.3" />
      <rect x="13" y="13" width="8" height="8" rx="1.3" />
    </Svg>
  );
}

function DocumentSectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </Svg>
  );
}

function InfoSectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.7" r=".9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

function StarSectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.5l2.6 5.6 6 .7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.4-4.2 6-.7z" />
    </Svg>
  );
}

function FooterSectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 16h18" />
    </Svg>
  );
}

const SECTION_TYPE_ICONS: Record<WebsiteSectionType, (props: IconProps) => React.ReactNode> = {
  hero: HeroSectionIcon,
  property_grid: GridSectionIcon,
  project_grid: GridSectionIcon,
  property_detail: DocumentSectionIcon,
  about: InfoSectionIcon,
  why_us: StarSectionIcon,
  contact: CallIcon,
  broker_marketer_form: DocumentSectionIcon,
  map: LocationIcon,
  footer: FooterSectionIcon,
};

/** أيقونة صغيرة لكل نوع قسم — تُستخدم في صفوف الأقسام وقائمة "إضافة قسم" بمحرر الجوال. */
export function SectionTypeIcon({ type, className }: IconProps & { type: WebsiteSectionType }) {
  const Icon = SECTION_TYPE_ICONS[type];
  return <Icon className={className} />;
}
