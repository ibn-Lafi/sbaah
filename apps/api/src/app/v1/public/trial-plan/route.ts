import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * The one free-trial plan (migration 0047), offered only at registration's
 * last step alongside the real paid plans — kept off GET /v1/public/plans
 * entirely so it can never appear as an upgrade/switch choice on /billing.
 * `plan: null` when the founder has turned it off from console (is_active
 * = false) — the registration UI just skips rendering the trial option.
 */
export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_trial', true)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load trial plan: ${error.message}`);
  }
  return okResponse({ plan: data });
});
