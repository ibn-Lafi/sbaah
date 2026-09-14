'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, CalendarIcon } from './calendar';

/** أرقام غربية بصيغة YYYY-MM-DD محليًا (بلا تحويل UTC) — يطابق عقد `<input type="date">` الأصلي الذي يستبدله هذا المكوّن، فلا حاجة لتعديل أي منطق تحقّق/حفظ لدى المستدعي. */
function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** يستبدل `<Input type="date">` بتقويم مطابق لهوية المنصة (بنفسجي العلامة، عربي بالكامل) بدل منتقي المتصفح الأصلي غير المتّسق بين المنصات. */
export function DatePicker({ value, onChange, placeholder = 'اختر التاريخ', className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = parseDateValue(value);
  const [viewMonth, setViewMonth] = useState<Date>(selected ?? new Date());

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setViewMonth(selected ?? new Date());
          setOpen((current) => !current);
        }}
        className="rounded-input border-border-default text-text-primary focus:border-text-primary flex h-[54px] w-full min-w-0 items-center justify-between border px-4 text-base outline-none"
      >
        <span className={selected ? '' : 'text-text-placeholder'}>{selected ? formatDisplay(selected) : placeholder}</span>
        <CalendarIcon className="text-text-secondary h-[18px] w-[18px] flex-none" />
      </button>

      {open && (
        <div className="rounded-card border-border-subtle bg-surface-card absolute z-30 mt-2 border shadow-[0_10px_30px_rgba(31,29,34,.16)]">
          <Calendar
            month={viewMonth}
            onMonthChange={setViewMonth}
            selected={selected}
            onSelect={(date) => {
              onChange(toDateValue(date));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
