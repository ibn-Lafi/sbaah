import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling, ApiError } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const updateSchema = z.object({
  measurement_id: z.string().trim().toUpperCase().regex(/^G-[A-Z0-9]+$/, 'معرّف القياس غير صالح'),
});

function assertCanManage(role: string) {
  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لإدارة التطبيقات');
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertCanManage(caller.role);

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('status, measurement_id, external_property_id, connected_at')
    .eq('tenant_id', caller.tenantId)
    .eq('provider', 'google_analytics')
    .maybeSingle();

  if (error) throw new Error(`Failed to load Google Analytics integration: ${error.message}`);

  return okResponse({
    installed: Boolean(data),
    status: data?.status ?? null,
    measurement_id: data?.measurement_id ?? null,
    property_id: data?.external_property_id ?? null,
    connected_at: data?.connected_at ?? null,
  });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertCanManage(caller.role);
  const body = updateSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('tenant_integrations')
    .upsert(
      {
        tenant_id: caller.tenantId,
        provider: 'google_analytics',
        measurement_id: body.measurement_id,
        status: 'installed',
      },
      { onConflict: 'tenant_id,provider' },
    )
    .select('status, measurement_id, external_property_id, connected_at')
    .single();

  if (error) throw new Error(`Failed to save Google Analytics integration: ${error.message}`);

  return okResponse({
    installed: true,
    status: data.status,
    measurement_id: data.measurement_id,
    property_id: data.external_property_id,
    connected_at: data.connected_at,
  });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertCanManage(caller.role);

  const { error } = await supabase
    .from('tenant_integrations')
    .delete()
    .eq('tenant_id', caller.tenantId)
    .eq('provider', 'google_analytics');

  if (error) throw new Error(`Failed to remove Google Analytics integration: ${error.message}`);
  return okResponse({ removed: true });
});
