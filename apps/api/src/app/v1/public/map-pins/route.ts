import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const querySchema = z.object({
  domain: z.string().min(1, 'الدومين مطلوب'),
});

/** A map with hundreds of pins is already unwieldy to read — this is a display cap, not pagination (no "load more" on the map section). */
const MAX_PINS_PER_TYPE = 300;

/**
 * Unauthenticated — powers the public-site's optional "الخريطة" home
 * section (migration 0044). Same tenant-scoping convention as the other
 * `public/*` routes: RLS (`*_public_select`, migrations 0003/0009)
 * already restricts anon to published rows of active tenants, `tenant_id`
 * is stated explicitly here anyway.
 *
 * Only rows with a location actually set are returned — most existing
 * properties/projects/buildings have `lat`/`lng` null (the fields were
 * only just added to the dashboard forms), so an empty or near-empty
 * response is the expected, common case, not a bug.
 *
 * Projects/buildings carry far less public data than properties (no
 * `project_media`/media table for either — see GET /v1/public/projects —
 * and buildings have no public detail page or price/specs at all), so
 * their pins are lighter: no thumbnail/price/beds/baths, name + location
 * only.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);

  const [propertiesResult, projectsResult, buildingsResult] = await Promise.all([
    supabase
      .from('properties')
      .select(
        'id, title_ar, title_en, property_type, listing_type, price, area_sqm, bedrooms, bathrooms, city_id, district_id, lat, lng, property_media(url, media_type, order_index)',
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(MAX_PINS_PER_TYPE),
    supabase
      .from('projects')
      .select('id, name_ar, name_en, city_id, district_id, lat, lng')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(MAX_PINS_PER_TYPE),
    supabase
      .from('buildings')
      .select('id, name_ar, name_en, city_id, district_id, lat, lng')
      .eq('tenant_id', tenantId)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(MAX_PINS_PER_TYPE),
  ]);

  if (propertiesResult.error) {
    throw new Error(`Failed to list map properties: ${propertiesResult.error.message}`);
  }
  if (projectsResult.error) {
    throw new Error(`Failed to list map projects: ${projectsResult.error.message}`);
  }
  if (buildingsResult.error) {
    throw new Error(`Failed to list map buildings: ${buildingsResult.error.message}`);
  }

  return okResponse({
    properties: propertiesResult.data,
    projects: projectsResult.data,
    buildings: buildingsResult.data,
  });
});
