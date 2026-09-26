import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient, createServiceRoleClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const querySchema = z.object({ domain: z.string().min(1, 'الدومين مطلوب') });
const MAX_PINS = 300;

type ListingRow = {
  id: string;
  listing_number: string;
  listing_type: string;
  title_ar: string;
  title_en?: string | null;
  asking_price: number | null;
  listing_assets?: Array<{ asset_id: string }>;
};
type AssetRow = {
  id: string;
  slug?: string | null;
  asset_type: string;
  city_id?: string | null;
  district_id?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: number | null;
  lat: number;
  lng: number;
  asset_media?: unknown[];
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const tenantId = await resolvePublicTenantId(domain, createAnonClient());
  const supabase = createServiceRoleClient();

  const [{ data: listings, error: listingsError }, { data: projects, error: projectsError }] =
    await Promise.all([
      supabase
        .from('listings')
        .select(
          'id,listing_number,listing_type,title_ar,title_en,asking_price,listing_assets(asset_id)',
        )
        .eq('tenant_id', tenantId)
        .eq('publication_status', 'published')
        .neq('commercial_status', 'closed')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(MAX_PINS),
      supabase
        .from('projects')
        .select('id,name_ar,name_en,city_id,district_id,lat,lng')
        .eq('tenant_id', tenantId)
        .eq('status', 'published')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(MAX_PINS),
    ]);
  if (listingsError) throw new Error(`Failed to list map listings: ${listingsError.message}`);
  if (projectsError) throw new Error(`Failed to list map projects: ${projectsError.message}`);

  const rows = (listings ?? []) as ListingRow[];
  const assetIds = [
    ...new Set(rows.flatMap((row) => row.listing_assets?.map((item) => item.asset_id) ?? [])),
  ];
  let assets: AssetRow[] = [];
  if (assetIds.length > 0) {
    const { data, error } = await supabase
      .from('assets')
      .select(
        'id,slug,asset_type,city_id,district_id,bedrooms,bathrooms,area_sqm,lat,lng,asset_media(url,media_type,order_index)',
      )
      .eq('tenant_id', tenantId)
      .is('archived_at', null)
      .in('id', assetIds)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(MAX_PINS);
    if (error) throw new Error(`Failed to list map assets: ${error.message}`);
    assets = (data ?? []) as AssetRow[];
  }
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const properties = rows.flatMap((listing) =>
    (listing.listing_assets ?? []).flatMap((link) => {
      const asset = assetById.get(link.asset_id);
      if (!asset) return [];
      return [
        {
          id: listing.id,
          asset_id: asset.id,
          slug: asset.slug ?? listing.listing_number,
          title_ar: listing.title_ar,
          title_en: listing.title_en,
          property_type: asset.asset_type,
          listing_type: listing.listing_type,
          price: listing.asking_price,
          city_id: asset.city_id,
          district_id: asset.district_id,
          bedrooms: asset.bedrooms,
          bathrooms: asset.bathrooms,
          area_sqm: asset.area_sqm,
          property_media: asset.asset_media ?? [],
          lat: Number(asset.lat),
          lng: Number(asset.lng),
        },
      ];
    }),
  );

  return okResponse({ properties, projects: projects ?? [], buildings: [] });
});
