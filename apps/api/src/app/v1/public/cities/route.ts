import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * Unauthenticated read of cities — RLS already makes `cities` openly
 * readable (cities_public_select, migration 0005); populates the city
 * dropdown in dashboard's property forms and public-site's search
 * filters alike. Writes are console-only (/v1/console/cities).
 */
export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from('cities').select('*').order('name_ar', { ascending: true });
  if (error) {
    throw new Error(`Failed to list cities: ${error.message}`);
  }
  return okResponse({ cities: data });
});
