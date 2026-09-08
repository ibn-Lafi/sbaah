import type { LeadStatus, PropertyStatus } from '@sbaah/shared';

type BadgeStatus = PropertyStatus | LeadStatus;

/** Exact bg/text pairs from the mockup's badgeBg()/badgeColor() functions — do not invent new ones ad hoc. */
const STATUS_CLASSES: Record<BadgeStatus, string> = {
  published: 'bg-success-surface text-success',
  draft: 'bg-warning-surface text-warning',
  archived: 'bg-surface-subtle-3 text-text-secondary',
  new: 'bg-brand-surface text-brand',
  contacted: 'bg-warning-surface text-warning',
  qualified: 'bg-success-surface text-success',
  won: 'bg-success-surface text-success',
  lost: 'bg-danger-surface text-danger',
};

export function Badge({ status, label }: { status: BadgeStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-medium ${STATUS_CLASSES[status]}`}
    >
      {label}
    </span>
  );
}
