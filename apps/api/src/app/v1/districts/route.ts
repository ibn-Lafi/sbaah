import type { NextRequest } from 'next/server';
import { districtCreateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';

/**
 * Tenant-facing district creation (migration 0046) — any authenticated
 * dashboard user can add a missing neighborhood while placing a property
 * on the map (districts_tenant_insert RLS policy), instead of asking the
 * platform owner to add it via console. Reads stay on the existing
 * unauthenticated /v1/public/districts?city_id=... — this route is
 * write-only. `name_en` isn't collected here — filled in from `name_ar`
 * so the console can still translate it properly later.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const input = districtCreateSchema.parse(await request.json());

  // Two brokers picking the same neighborhood shouldn't produce two rows —
  // reuse an existing district under the same city with the exact same name.
  const { data: existing, error: existingError } = await supabase
    .from('districts')
    .select('*')
    .eq('city_id', input.city_id)
    .eq('name_ar', input.name_ar)
    .maybeSingle();
  if (existingError) {
    throw new Error(`Failed to check existing district: ${existingError.message}`);
  }
  if (existing) {
    return okResponse({ district: existing });
  }

  const { data, error } = await supabase
    .from('districts')
    .insert({ city_id: input.city_id, name_ar: input.name_ar, name_en: input.name_ar, lat: input.lat, lng: input.lng })
    .select()
    .single();
  if (error) {
    if (error.code === '23503') {
      throw new ApiError(400, 'invalid_city', 'المدينة المحددة غير موجودة');
    }
    throw new Error(`Failed to create district: ${error.message}`);
  }
  return okResponse({ district: data }, 201);
});
