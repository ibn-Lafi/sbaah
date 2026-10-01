import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { projectInputSchema, PROJECT_STATUSES } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { requireUserPermission } from '@/lib/auth/permissions';
import { notifyTenant } from '@/lib/notifications/notify';

const listQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  await requireUserPermission(supabase, 'projects.read');
  const { status, page, page_size } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('projects').select('*', { count: 'exact' }).eq('tenant_id', caller.tenantId)
    .neq('status', 'archived');
  if (status) query = query.eq('status', status);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  return okResponse({ projects: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  await requireUserPermission(supabase, 'projects.create');

  const input = projectInputSchema.parse(await request.json());

  const {data:tenantPlan,error:planError}=await supabase.from('tenants').select('plans(features)').eq('id',caller.tenantId).single();
  if(planError) throw new Error(`Failed to load project entitlement: ${planError.message}`);
  const maxProjects=Number((tenantPlan.plans as unknown as {features?:Record<string,unknown>}|null)?.features?.max_projects??0);
  if(maxProjects>0){const {count,error:countError}=await supabase.from('projects').select('id',{count:'exact',head:true}).eq('tenant_id',caller.tenantId).neq('status','archived');if(countError)throw new Error(`Failed to check project limit: ${countError.message}`);if((count??0)>=maxProjects)throw new ApiError(403,'plan_project_limit',`وصلت للحد المسموح في باقتك (${maxProjects} مشروع). رقِّ باقتك لإضافة المزيد.`);}

  // Public project URLs require a non-null, tenant-unique slug. Generate it
  // server-side so dashboard forms never need to know about URL internals.
  const baseSlug = `project-${crypto.randomUUID().slice(0, 8)}`; // required public URL slug
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...input, tenant_id: caller.tenantId, slug: baseSlug })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  await notifyTenant({tenantId:caller.tenantId,category:'real_estate',level:'info',title:'مشروع جديد',body:`تم إنشاء مشروع ${data.name}.`,href:`/projects/${data.id}`,eventKey:`project:${data.id}:created`});
  return okResponse({ project: data }, 201);
});
