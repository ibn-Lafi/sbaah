import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * Unauthenticated read of active themes — RLS already makes `themes`
 * openly readable (themes_public_select, migration 0005). PRODUCT_SPEC
 * section 6: only one theme exists in this version ("الثيم الأساسي"),
 * but the table is deliberately separate so dashboard's website editor
 * (task 28/42) can show a real theme picker now that grows with the
 * table instead of hardcoding today's single option.
 */
export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from('themes').select('*').eq('is_active', true);
  if (error) {
    throw new Error(`Failed to list themes: ${error.message}`);
  }
  return okResponse({ themes: data });
});
