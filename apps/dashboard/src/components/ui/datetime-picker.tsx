'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, CalendarIcon } from './calendar';

/** يطابق عقد `<input type="datetime-local">` الأصلي (`YYYY-MM-DDTHH:mm`, بلا منطقة زمنية) — نفس القيمة التي يستهلكها isoToDatetimeLocal/datetimeLocalToIso، فلا حاجة لتعديل تلك التحويلات لدى المستدعي. */
function splitValue(value: string): { date: Date | null; time: string } {
  if (!value) return { date: null, time: '' };
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = (datePart ?? '').split('-').map(Number);
  if (!year || !month || !day) return { date: null, time: timePart ?? '' };
  return { date: new Date(year, month - 1, day), time: timePart ?? '' };
}

function joinValue(date: Date, time: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${datePart}T${time || '00:00'}`;
}

function formatDisplay(date: Date, time: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateLabel = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return time ? `${dateLabel} ${time}` : dateLabel;
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** يستبدل `<Input type="datetime-local">` بتقويم + حقل وقت مطابقَين لهوية المنصة، لنفس سبب DatePicker (اتساق التصميم بدل منتقي المتصفح الأصلي). */
export function DateTimePicker({ value, onChange, placeholder = 'اختر التاريخ والوقت', className = '' }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { date: selected, time } = splitValue(value);
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
        <span className={selected ? '' : 'text-text-placeholder'}>
          {selected ? formatDisplay(selected, time) : placeholder}
        </span>
        <CalendarIcon className="text-text-secondary h-[18px] w-[18px] flex-none" />
      </button>

      {open && (
        <div className="rounded-card border-border-subtle bg-surface-card absolute z-30 mt-2 border shadow-[0_10px_30px_rgba(31,29,34,.16)]">
          <Calendar
            month={viewMonth}
            onMonthChange={setViewMonth}
            selected={selected}
            onSelect={(date) => onChange(joinValue(date, time || '09:00'))}
          />
          <div className="border-border-subtle flex items-center gap-2 border-t px-4 py-3">
            <span className="text-text-secondary text-xs">الوقت</span>
            <input
              type="time"
              value={time}
              onChange={(e) => onChange(joinValue(selected ?? new Date(), e.target.value))}
              className="rounded-control border-border-default text-text-primary h-9 flex-1 border px-2 text-sm outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
