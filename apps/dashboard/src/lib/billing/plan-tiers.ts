import type { Plan } from '@sbaah/shared';

export interface PlanTier {
  /** Groups a monthly + annual row of the same tier — `name_en` is stable and console-editable independently of `name_ar`, but both rows of one tier always share it (migration 0028's seed, and console's plan form keeps them in sync by convention). */
  key: string;
  monthly?: Plan;
  annual?: Plan;
}

/** Used by both /billing/plans and registration step 6 so "which plan tiers exist" is computed identically everywhere. */
export function groupPlansByTier(plans: Plan[]): PlanTier[] {
  const tiers = new Map<string, PlanTier>();
  for (const plan of plans) {
    const tier = tiers.get(plan.name_en) ?? { key: plan.name_en };
    if (plan.billing_cycle === 'annual') tier.annual = plan;
    else tier.monthly = plan;
    tiers.set(plan.name_en, tier);
  }
  return Array.from(tiers.values()).sort(
    (a, b) => (a.monthly ?? a.annual)!.price - (b.monthly ?? b.annual)!.price,
  );
}

/** The row to actually display for a tier at the chosen cycle — falls back to whichever cycle the tier does have, so a tier missing one cycle's row doesn't just disappear. */
export function planForCycle(tier: PlanTier, cycle: 'monthly' | 'annual'): Plan {
  const plan = cycle === 'annual' ? (tier.annual ?? tier.monthly) : (tier.monthly ?? tier.annual);
  if (!plan) {
    throw new Error(`Plan tier "${tier.key}" has no rows for either billing cycle`);
  }
  return plan;
}
