import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('platform_faq_items')
    .select('id, question_ar, answer_ar, question_en, answer_en, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) throw new Error(`Failed to load platform FAQs: ${error.message}`);
  return okResponse(data ?? []);
});
