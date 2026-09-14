'use client';

/**
 * شبكة تقويم شهر واحد — مبنية يدويًا (بلا react-day-picker أو أي مكتبة
 * تقويم خارجية) لتطابق هوية المنصة تمامًا (بنفسجي العلامة للتحديد، عربي
 * كامل) بدل محاولة تلوين مكتبة جاهزة فوق تصميمها الخاص. أسماء الأشهر
 * عربية يدويًا (لا Intl('ar')) لتبقى أرقام السنة غربية مطابقةً لبقية
 * تنسيقات التاريخ بالمنصة (lib/format/date.ts). الأسبوع يبدأ بالأحد
 * (العرف السعودي/الخليجي)، ويُترك الاتجاه الطبيعي RTL للصفحة بلا فرض
 * dir="ltr" — فيظهر الأحد يمينًا والسبت يسارًا، وهو الترتيب المعتاد
 * بتقاويم الجوال العربية.
 */
const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const WEEKDAY_LABELS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

interface CalendarProps {
  /** الشهر المعروض حاليًا (أي يوم منه — يُستخدم شهره وسنته فقط). */
  month: Date;
  onMonthChange: (month: Date) => void;
  selected: Date | null;
  onSelect: (date: Date) => void;
}

export function Calendar({ month, onMonthChange, selected, onSelect }: CalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-[280px] p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="الشهر السابق"
          className="text-text-secondary hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon className="h-[18px] w-[18px]" />
        </button>
        <span className="text-text-primary text-sm font-semibold">
          {ARABIC_MONTHS[monthIndex]} {year}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="الشهر التالي"
          className="text-text-secondary hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-full"
        >
          <ChevronRightIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-text-tertiary flex h-8 items-center justify-center text-xs font-medium">
            {label}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const cellDate = new Date(year, monthIndex, day);
          const isSelected = selected !== null && isSameDay(cellDate, selected);
          const isToday = isSameDay(cellDate, today);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(cellDate)}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] ${
                isSelected
                  ? 'bg-brand font-semibold text-white'
                  : isToday
                    ? 'bg-brand-surface text-brand font-semibold'
                    : 'text-text-primary hover:bg-surface-subtle'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
