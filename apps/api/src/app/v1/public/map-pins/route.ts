import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const querySchema = z.object({ domain: z.string().min(1, 'الدومين مطلوب') });
const MAX_PINS = 300;

type FeedRow = {
  asset_id:string; asset_slug?:string|null; asset_type:string; asset_name_ar?:string|null; asset_name_en?:string|null;
  city_id?:string|null; district_id?:string|null; bedrooms?:number|null; bathrooms?:number|null; area_sqm?:number|null;
  lat?:number|null; lng?:number|null; listing_id?:string|null; listing_number?:string|null; listing_type?:string|null;
  asking_price?:number|null; asset_media?:unknown[];
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);

  const [{ data: assetRows, error: assetsError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.rpc('public_asset_catalog_feed', {
      p_tenant_id: tenantId, p_scope: 'all', p_project_id: null, p_asset_type: null,
      p_city_id: null, p_district_id: null, p_bedrooms: null, p_limit: MAX_PINS, p_offset: 0,
    }),
    supabase.from('projects').select('id,name_ar,name_en,city_id,district_id,lat,lng')
      .eq('tenant_id', tenantId).eq('is_public', true).neq('status', 'archived')
      .not('lat', 'is', null).not('lng', 'is', null).limit(MAX_PINS),
  ]);
  if (assetsError) throw new Error(`Failed to list map assets: ${assetsError.message}`);
  if (projectsError) throw new Error(`Failed to list map projects: ${projectsError.message}`);

  const properties = ((assetRows ?? []) as FeedRow[])
    .filter((asset) => asset.lat != null && asset.lng != null)
    .map((asset) => ({
      id: asset.asset_id,
      asset_id: asset.asset_id,
      slug: asset.asset_slug ?? asset.asset_id,
      title_ar: asset.asset_name_ar ?? '',
      title_en: asset.asset_name_en ?? null,
      property_type: asset.asset_type,
      listing_id: asset.listing_id ?? null,
      listing_type: asset.listing_type ?? null,
      price: asset.asking_price ?? null,
      city_id: asset.city_id ?? null,
      district_id: asset.district_id ?? null,
      bedrooms: asset.bedrooms ?? null,
      bathrooms: asset.bathrooms ?? null,
      area_sqm: asset.area_sqm ?? null,
      property_media: asset.asset_media ?? [],
      lat: Number(asset.lat),
      lng: Number(asset.lng),
    }));

  return okResponse({ properties, projects: projects ?? [], buildings: [] });
});
