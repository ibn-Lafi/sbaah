import { sectionUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const input = sectionUpdateSchema.parse(await request.json());
  const {data:website,error:websiteError}=await supabase.from('websites').select('id').eq('tenant_id',caller.tenantId).maybeSingle();
  if(websiteError)throw new Error(`Failed to resolve website: ${websiteError.message}`);
  if(!website)throw new ApiError(404,'website_not_found','الموقع غير موجود');
  const {data:pageRows,error:pagesError}=await supabase.from('website_pages').select('id').eq('website_id',website.id);
  if(pagesError)throw new Error(`Failed to resolve website pages: ${pagesError.message}`);
  const pageIds=(pageRows??[]).map(page=>page.id);
  if(!pageIds.length)throw new ApiError(404,'section_not_found','القسم غير موجود');

  const { data, error } = await supabase
    .from('website_sections')
    .update(input)
    .eq('id', id)
    .in('page_id',pageIds)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to update section: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'section_not_found', 'القسم غير موجود');
  }

  return okResponse({ section: data });
});
