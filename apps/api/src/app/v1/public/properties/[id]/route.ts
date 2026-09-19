import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const publicPropertyQuerySchema = z.object({
  domain: z.string().min(1, 'الدومين مطلوب'),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Single-property page (task 34/42) — `domain` re-resolves the tenant
 * and `.eq('tenant_id', tenantId)` below (on top of RLS) exists
 * specifically to stop one tenant's property id being viewable under a
 * *different* tenant's domain just by guessing a UUID (PRODUCT_SPEC
 * section 10's explicit-filtering principle, same as the list endpoint,
 * task 22/42). The full ordered gallery is embedded here — unlike the
 * listing page's single-thumbnail selection (task 33/42), a detail page
 * genuinely needs every photo/video.
 */
export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { domain } = publicPropertyQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);

  // Do not put a human-readable slug into an `id.eq` UUID filter.
  // PostgREST/Postgres attempts to cast every OR operand to its column type,
  // so a slug such as "villa-riyadh" can make the whole query fail before
  // `slug.eq` is evaluated. Route UUIDs to id, everything else to slug.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  let query = supabase
    .from('properties')
    .select('*, property_media(id, media_type, url, order_index)')
    .eq('tenant_id', tenantId)
    .eq('status', 'published');

  query = isUuid ? query.eq('id', id) : query.eq('slug', id);
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Failed to load public property: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
  }

  return okResponse({ property: data });
});
