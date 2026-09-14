import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * Unauthenticated read of the 13 fixed Saudi regions (migration 0046) —
 * RLS already makes `regions` openly readable (regions_public_select).
 * No console CRUD for this list — it doesn't change in practice, so it's
 * seeded once by the migration, unlike cities/districts.
 */
export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from('regions').select('*').order('name_ar', { ascending: true });
  if (error) {
    throw new Error(`Failed to list regions: ${error.message}`);
  }
  return okResponse({ regions: data });
});
