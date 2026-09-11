import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { BROKER_MARKETER_APPLICANT_TYPES } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';

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
