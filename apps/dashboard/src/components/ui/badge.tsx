import type { LeadStatus, PropertyStatus, RentalStatus, UserStatus } from '@sbaah/shared';

type BadgeStatus = PropertyStatus | LeadStatus | RentalStatus | UserStatus;

/**
 * Exact bg/text pairs from the mockup's badgeBg()/badgeColor() functions
 * for the statuses it covers — do not invent new ones ad hoc. `active`/
 * `ended` (rentals, PRODUCT_SPEC section 4.2) postdate the mockup, so
 * they're mapped onto the closest existing semantic pair instead
 * (active -> success, like published/won; ended -> the same neutral
 * treatment as archived). `expired` (leads, migration 0034) gets the same
 * neutral treatment as `ended`/`archived` — a stale lead, not a rejection.
 *
 * Exported so the leads list's inline status switcher (a colored `<select>`
 * pill, not a static `<Badge>`) can reuse these exact classes instead of a
 * second copy.
 */
export const STATUS_CLASSES: Record<BadgeStatus, string> = {
  published: 'bg-success-surface text-success',
  draft: 'bg-warning-surface text-warning',
  archived: 'bg-surface-subtle-3 text-text-secondary',
  new: 'bg-brand-surface text-brand',
  contacted: 'bg-warning-surface text-warning',
  qualified: 'bg-success-surface text-success',
  won: 'bg-success-surface text-success',
  lost: 'bg-danger-surface text-danger',
  expired: 'bg-surface-subtle-3 text-text-secondary',
  active: 'bg-success-surface text-success',
  ended: 'bg-surface-subtle-3 text-text-secondary',
  invited: 'bg-warning-surface text-warning',
  disabled: 'bg-surface-subtle-3 text-text-secondary',
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
