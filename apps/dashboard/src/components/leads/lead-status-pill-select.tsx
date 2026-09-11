'use client';

import { LEAD_STATUSES, type LeadStatus } from '@sbaah/shared';
import { STATUS_CLASSES } from '@/components/ui/badge';
import { LEAD_STATUS_LABELS } from '@/lib/lead/labels';

interface LeadStatusPillSelectProps {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
}

/** قائمة منسدلة ملوّنة داخل صف الجدول — تبديل حالة العميل المحتمل مباشرة دون فتح صفحة التفاصيل. */
export function LeadStatusPillSelect({ value, onChange }: LeadStatusPillSelectProps) {
  return (
    <select
      value={value}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value as LeadStatus)}
      className={`h-[30px] cursor-pointer rounded-full border-0 px-3 text-[12px] font-medium outline-none ${STATUS_CLASSES[value]}`}
    >
      {LEAD_STATUSES.map((status) => (
        <option key={status} value={status}>
          {LEAD_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
