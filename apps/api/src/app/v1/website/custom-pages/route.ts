import type { NextRequest } from 'next/server';
import { websiteCustomPageCreateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

/**
 * الصفحات (site/pages) — صفحات حرة يكتبها المالك/المسؤول (عنوان + محتوى)
 * تُعرض عبر رابط في تذييل الموقع العام، مثل "سياسة الخصوصية". لا صفحة
 * ثابتة هنا (بخلاف website_pages، migration 0024) — عدد حر لكل حساب.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id')
    .eq('tenant_id', caller.tenantId)
    .single();
  if (websiteError || !website) {
    throw new Error(`Failed to load website: ${websiteError?.message}`);
  }

  const { data: pages, error } = await supabase
    .from('website_custom_pages')
    .select('*')
    .eq('website_id', website.id)
    .order('order_index', { ascending: true });
  if (error) {
    throw new Error(`Failed to load custom pages: ${error.message}`);
  }

  return okResponse({ pages });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const input = websiteCustomPageCreateSchema.parse(await request.json());

  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id')
    .eq('tenant_id', caller.tenantId)
    .single();
  if (websiteError || !website) {
    throw new Error(`Failed to load website: ${websiteError?.message}`);
  }

  const { count } = await supabase
    .from('website_custom_pages')
    .select('id', { count: 'exact', head: true })
    .eq('website_id', website.id);

  const { data, error } = await supabase
    .from('website_custom_pages')
    .insert({ ...input, website_id: website.id, order_index: count ?? 0 })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'slug_taken', 'رابط الصفحة هذا مستخدَم بالفعل، اختر رابطًا آخر');
    }
    throw new Error(`Failed to create custom page: ${error.message}`);
  }

  return okResponse({ page: data }, 201);
});
