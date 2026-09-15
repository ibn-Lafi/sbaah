import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * ينسخ قسمًا موجودًا (نفس النوع والمحتوى) كصف جديد، بنهاية ترتيب صفحته
 * — لا حذف نهائي مقابله في هذا المنتج (كل نوع قسم "منسّق" مسبقًا،
 * migration 0024)، لكن التكرار مسموح صراحة (طلب المؤسس) لإتاحة أكثر من
 * نسخة بمحتوى مختلف من نفس نوع القسم بالصفحة الواحدة. النسخة تبدأ
 * بنفس ظهور الأصل (is_visible)، ويُرتّبها المستخدم بالسحب بعد ذلك.
 */
export const POST = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const { data: original, error: fetchError } = await supabase
    .from('website_sections')
    .select('website_id, page_id, type, is_visible, config')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) {
    throw new Error(`Failed to load section: ${fetchError.message}`);
  }
  if (!original) {
    throw new ApiError(404, 'section_not_found', 'القسم غير موجود');
  }

  const { data: lastSection, error: lastError } = await supabase
    .from('website_sections')
    .select('order_index')
    .eq('page_id', original.page_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) {
    throw new Error(`Failed to compute order_index: ${lastError.message}`);
  }

  const { data, error } = await supabase
    .from('website_sections')
    .insert({
      website_id: original.website_id,
      page_id: original.page_id,
      type: original.type,
      order_index: (lastSection?.order_index ?? -1) + 1,
      is_visible: original.is_visible,
      config: original.config,
    })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to duplicate section: ${error.message}`);
  }

  return okResponse({ section: data });
});
