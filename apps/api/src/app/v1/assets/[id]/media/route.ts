import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

interface RouteContext { params: Promise<{ id: string }>; }

const createMediaSchema = z.object({
  media_type: z.enum(['image', 'video']),
  category: z.enum(['general','exterior','entrance','living','bedrooms','kitchen','bathrooms','outdoor','amenities','parking','floor_plan','location','view','construction','other']).default('general'),
  url: z.string().url(),
  alt_ar: z.string().optional().nullable(),
  alt_en: z.string().optional().nullable(),
  order_index: z.number().int().nonnegative().default(0),
  is_primary: z.boolean().default(false),
});

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  await assertTenantOwnedRow({ supabase, table: 'assets', id, tenantId: caller.tenantId, label: 'العقار' });
  const { data: asset, error: assetError } = await supabase.from('assets').select('project_id').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();
  if (assetError) throw new Error(assetError.message);
  if (asset?.project_id) return okResponse({ media: [] });
  const { data, error } = await supabase.from('asset_media').select('*').eq('tenant_id', caller.tenantId).eq('asset_id', id).order('order_index');
  if (error) throw new Error(error.message);
  return okResponse({ media: data ?? [] });
});

export const POST = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إدارة وسائط العقار');
  await assertTenantOwnedRow({ supabase, table: 'assets', id, tenantId: caller.tenantId, label: 'العقار' });
  const { data: asset, error: assetError } = await supabase.from('assets').select('project_id').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();
  if (assetError) throw new Error(assetError.message);
  if (asset?.project_id) throw new ApiError(409, 'project_asset_media_disabled', 'وسائط عقارات المشروع تُدار من معرض المشروع فقط');
  const input = createMediaSchema.parse(await request.json());

  if (input.is_primary) {
    const { error: clearError } = await supabase.from('asset_media').update({ is_primary: false }).eq('tenant_id', caller.tenantId).eq('asset_id', id).eq('is_primary', true);
    if (clearError) throw new Error(clearError.message);
  }
  const { data, error } = await supabase.from('asset_media').insert({ ...input, tenant_id: caller.tenantId, asset_id: id }).select().single();
  if (error) throw new Error(error.message);
  return okResponse({ media: data }, 201);
});
