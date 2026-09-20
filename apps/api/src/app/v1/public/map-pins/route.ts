import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const querySchema = z.object({ domain: z.string().min(1, 'الدومين مطلوب') });
const MAX_PINS = 300;

type FeedRow = {
  listing_id: string; listing_number: string; listing_type: string; title_ar: string; title_en?: string|null;
  asking_price: number|null; asset_id: string; asset_slug?: string|null; asset_type: string;
  city_id?: string|null; district_id?: string|null; bedrooms?: number|null; bathrooms?: number|null;
  area_sqm?: number|null; asset_media?: unknown[];
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);

  const [{ data: feed, error: feedError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.rpc('public_listing_feed', {
      p_tenant_id: tenantId, p_listing_type: null, p_asset_type: null, p_city_id: null, p_district_id: null,
      p_min_price: null, p_max_price: null, p_bedrooms: null, p_limit: MAX_PINS, p_offset: 0,
    }),
    supabase.from('projects').select('id,name_ar,name_en,city_id,district_id,lat,lng')
      .eq('tenant_id', tenantId).eq('status', 'published').not('lat', 'is', null).not('lng', 'is', null).limit(MAX_PINS),
  ]);
  if (feedError) throw new Error(`Failed to list map listings: ${feedError.message}`);
  if (projectsError) throw new Error(`Failed to list map projects: ${projectsError.message}`);

  const rows = (feed ?? []) as FeedRow[];
  const assetIds = [...new Set(rows.map((row) => row.asset_id))];
  const { data: locatedAssets, error: assetsError } = assetIds.length
    ? await supabase.from('assets').select('id,lat,lng').eq('tenant_id', tenantId).in('id', assetIds).not('lat', 'is', null).not('lng', 'is', null)
    : { data: [], error: null };
  if (assetsError) throw new Error(`Failed to load map asset locations: ${assetsError.message}`);
  const locations = new Map((locatedAssets ?? []).map((asset) => [asset.id, asset]));

  const properties = rows.flatMap((row) => {
    const location = locations.get(row.asset_id);
    if (!location) return [];
    return [{
      id: row.listing_id, asset_id: row.asset_id, slug: row.asset_slug ?? row.listing_number,
      title_ar: row.title_ar, title_en: row.title_en, property_type: row.asset_type, listing_type: row.listing_type,
      price: row.asking_price, city_id: row.city_id, district_id: row.district_id, bedrooms: row.bedrooms,
      bathrooms: row.bathrooms, area_sqm: row.area_sqm, property_media: row.asset_media ?? [],
      lat: location.lat, lng: location.lng,
    }];
  });

  return okResponse({ properties, projects: projects ?? [], buildings: [] });
});
