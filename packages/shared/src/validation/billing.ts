import { z } from 'zod';

/**
 * POST /v1/billing/checkout — `plan_id` omitted means "re-pay for the
 * tenant's current plan" (renewal after a failed payment, or the
 * registration-time checkout); a `plan_id` for a different active plan
 * means "switch to this plan" — the checkout route validates it's a real,
 * active, payable plan before creating the payment link.
 */
export const checkoutInputSchema = z.object({
  plan_id: z.string().uuid().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
