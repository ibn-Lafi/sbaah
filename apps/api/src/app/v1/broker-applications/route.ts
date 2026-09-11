import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BROKER_MARKETER_APPLICANT_TYPES, manualBrokerMarketerApplicationInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const listQuerySchema = z.object({
  applicant_type: z.enum(BROKER_MARKETER_APPLICANT_TYPES).optional(),
  property_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * "الوسطاء والمسوقين" list (migration 0032). No explicit role check here
 * — `broker_marketer_applications_owner_admin_select` (RLS) already
 * scopes reads to the tenant's Owner/Admin, same pattern as GET
 * /v1/leads: an Agent hitting this directly just gets an empty result,
 * not a 403.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const { applicant_type, property_id, page, page_size } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase
    .from('broker_marketer_applications')
    .select('*, cities(name_ar, name_en), properties(id, title_ar, title_en)', { count: 'exact' });
  if (applicant_type) query = query.eq('applicant_type', applicant_type);
  if (property_id) query = query.eq('property_id', property_id);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list broker/marketer applications: ${error.message}`);
  }

  return okResponse({ applications: data, page, page_size, total: count ?? 0 });
});

/**
 * Manual "+ إضافة" from /applicants (migration 0033). No agent INSERT
 * policy on broker_marketer_applications, same reasoning as POST
 * /v1/leads: this is an Owner/Admin action, not something an Agent does.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إضافة وسطاء أو مسوّقين يدويًا');
  }

  const input = manualBrokerMarketerApplicationInputSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('broker_marketer_applications')
    .insert({ ...input, tenant_id: caller.tenantId })
    .select('*, cities(name_ar, name_en), properties(id, title_ar, title_en)')
    .single();
  if (error) {
    throw new Error(`Failed to create broker/marketer application: ${error.message}`);
  }

  return okResponse({ application: data }, 201);
});
