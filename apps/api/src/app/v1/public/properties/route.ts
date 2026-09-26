import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const querySchema = z
  .object({
    domain: z.string().min(1),
    city_id: z.string().uuid().optional(),
    district_id: z.string().uuid().optional(),
    property_type: z
      .enum([
        'apartment',
        'villa',
        'building',
        'land',
        'plot',
        'office',
        'shop',
        'warehouse',
        'floor',
        'compound',
        'chalet',
        'farm',
        'parking',
        'other',
      ])
      .optional(),
    listing_type: z.enum(['sale', 'rent']).optional(),
    min_price: z.coerce.number().nonnegative().optional(),
    max_price: z.coerce.number().nonnegative().optional(),
    bedrooms: z.coerce.number().int().nonnegative().optional(),
    page: z.coerce.number().int().positive().default(1),
    page_size: z.coerce.number().int().positive().max(50).default(20),
    scope: z.enum(['independent', 'project', 'all']).default('independent'),
    project_id: z.string().uuid().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.min_price != null && q.max_price != null && q.min_price > q.max_price)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'الحد الأدنى للسعر يجب ألا يتجاوز الحد الأعلى',
      });
    if (q.project_id && q.scope !== 'project')
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['project_id'],
        message: 'معرف المشروع متاح فقط عند اختيار نطاق عقارات المشروع',
      });
  });

export const GET = withErrorHandling(async (request: NextRequest) => {
  const q = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(q.domain, supabase);
  const offset = (q.page - 1) * q.page_size;
  const { data, error } = await supabase.rpc('public_asset_catalog_feed', {
    p_tenant_id: tenantId,
    p_scope: q.scope,
    p_project_id: q.project_id ?? null,
    p_asset_type: q.property_type ?? null,
    p_city_id: q.city_id ?? null,
    p_district_id: q.district_id ?? null,
    p_bedrooms: q.bedrooms ?? null,
    p_limit: q.page_size,
    p_offset: offset,
  });
  if (error) throw new Error(`Failed to list public properties: ${error.message}`);
  type PublicListingFeedRow = {
    listing_id: string;
    asset_slug?: string | null;
    listing_number?: string | null;
    title_ar?: string | null;
    title_en?: string | null;
    asset_name_ar?: string | null;
    asset_name_en?: string | null;
    description_ar?: string | null;
    description_en?: string | null;
    asset_type: string;
    listing_type?: string | null;
    asking_price?: number | null;
    project_id?: string | null;
    parent_asset_id?: string | null;
    city_id?: string | null;
    district_id?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area_sqm?: number | null;
    advertisement_license_number?: string | null;
    advertiser_name?: string | null;
    created_at: string;
    asset_media?: unknown[];
    pricing_period?: string | null;
    commercial_status?: string | null;
    asset_id: string;
    lat?: number | null;
    lng?: number | null;
    total_count?: number | string | null;
  };
  let rows = (data ?? []) as PublicListingFeedRow[];
  if (q.listing_type) rows = rows.filter((r) => r.listing_type === q.listing_type);
  if (q.min_price != null) rows = rows.filter((r) => r.asking_price != null && Number(r.asking_price) >= q.min_price!);
  if (q.max_price != null) rows = rows.filter((r) => r.asking_price != null && Number(r.asking_price) <= q.max_price!);
  // Temporary compatibility shape for the current public-site. Source of truth is now Listing + Asset.
  const properties = rows.map((r) => ({
    id: r.asset_id,
    slug: r.asset_slug ?? r.asset_id,
    tenant_id: tenantId,
    title_ar: r.asset_name_ar ?? r.title_ar,
    title_en: r.asset_name_en ?? r.title_en,
    description_ar: r.description_ar,
    description_en: r.description_en,
    property_type: r.asset_type,
    listing_type: r.listing_type,
    price: r.asking_price,
    project_id: r.project_id,
    parent_asset_id: r.parent_asset_id,
    city_id: r.city_id,
    district_id: r.district_id,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    area_sqm: r.area_sqm,
    status: 'active',
    advertisement_license_number: r.advertisement_license_number,
    advertiser_name: r.advertiser_name,
    created_at: r.created_at,
    property_media: r.asset_media ?? [],
    listing_number: r.listing_number ?? null,
    pricing_period: r.pricing_period,
    commercial_status: r.commercial_status ?? 'available',
    asset_id: r.asset_id,
    lat: r.lat,
    lng: r.lng,
  }));
  return okResponse({
    properties,
    scope: q.scope,
    project_id: q.project_id ?? null,
    page: q.page,
    page_size: q.page_size,
    total: Number(rows[0]?.total_count ?? 0),
  });
});
