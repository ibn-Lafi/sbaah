import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * Unauthenticated read of active plans — RLS already makes `plans` openly
 * readable (plans_public_select, migration 0005); used by dashboard's own
 * "current plan"/upgrade UI and any future public pricing page. Writes are
 * console-only (/v1/console/plans).
 *
 * Excludes the one free-trial plan (migration 0047) — it's never a normal
 * upgrade/switch choice, only offered at registration's last step via its
 * own dedicated GET /v1/public/trial-plan.
 */
export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_trial', false)
    .order('price', { ascending: true });
  if (error) {
    throw new Error(`Failed to list plans: ${error.message}`);
  }
  return okResponse({ plans: data });
});
