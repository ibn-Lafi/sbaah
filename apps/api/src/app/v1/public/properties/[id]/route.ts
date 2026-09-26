import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const schema = z.object({ domain: z.string().min(1) });
interface RouteContext { params: Promise<{ id: string }> }

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { domain } = schema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);
  const { data, error } = await supabase.rpc('public_asset_detail', { p_tenant_id: tenantId, p_identifier: id });
  if (error) throw new Error(`Failed to load public asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'property_not_found', 'العقار غير موجود');

  const a = data as Record<string, unknown> & {
    id: string; slug?: string | null; asset_type?: string; name_ar?: string; name_en?: string | null;
    description_ar?: string | null; description_en?: string | null; media?: unknown[];
    listing?: null | { id:string; listing_number:string; listing_type:string; asking_price:number|null; pricing_period?:string|null; commercial_status:string; advertisement_license_number?:string|null; advertisement_license_expires_at?:string|null; advertiser_name?:string|null };
  };
  const l = a.listing ?? null;
  const property = {
    ...a,
    id: a.id,
    asset_id: a.id,
    slug: a.slug ?? a.id,
    tenant_id: tenantId,
    title_ar: a.name_ar,
    title_en: a.name_en,
    description_ar: a.description_ar,
    description_en: a.description_en,
    property_type: a.asset_type,
    listing_type: l?.listing_type ?? null,
    price: l?.asking_price ?? null,
    status: 'published',
    property_media: a.media ?? [],
    listing_id: l?.id ?? null,
    listing_number: l?.listing_number ?? null,
    pricing_period: l?.pricing_period ?? null,
    commercial_status: l?.commercial_status ?? null,
    advertisement_license_number: l?.advertisement_license_number ?? null,
    advertisement_license_expires_at: l?.advertisement_license_expires_at ?? null,
    advertiser_name: l?.advertiser_name ?? null,
  };
  return okResponse({ property });
});
