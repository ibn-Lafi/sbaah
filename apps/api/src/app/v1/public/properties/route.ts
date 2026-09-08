import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient, propertySearchSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const publicPropertiesQuerySchema = propertySearchSchema.extend({
  domain: z.string().min(1, 'الدومين مطلوب'),
});

/**
 * Unauthenticated — public-site's search/filter page. `domain` is the
 * incoming Host header, forwarded by public-site since visitors carry no
 * JWT to identify a tenant (PRODUCT_SPEC section 10).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain, city_id, district_id, property_type, listing_type, min_price, max_price, bedrooms, page, page_size } =
    publicPropertiesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);

  // properties_public_select (RLS) already restricts anon to
  // status='published' rows of active tenants — tenant_id/status here are
  // explicit anyway, per PRODUCT_SPEC section 10 ("فلترة tenant_id صريحة
  // داخل api قبل أي استعلام"), not relied on as the only guard.
  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'published');

  if (city_id) query = query.eq('city_id', city_id);
  if (district_id) query = query.eq('district_id', district_id);
  if (property_type) query = query.eq('property_type', property_type);
  if (listing_type) query = query.eq('listing_type', listing_type);
  if (min_price !== undefined) query = query.gte('price', min_price);
  if (max_price !== undefined) query = query.lte('price', max_price);
  if (bedrooms !== undefined) query = query.eq('bedrooms', bedrooms);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list public properties: ${error.message}`);
  }

  return okResponse({ properties: data, page, page_size, total: count ?? 0 });
});
