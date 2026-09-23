import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { databaseWriteError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';

// Pixel ids are embedded into third-party tracking snippets on the public
// site, so anything beyond the providers' id alphabet is rejected up front.
const pixelSchema = z.object({
  provider: z.enum(['meta', 'tiktok', 'snapchat']),
  pixel_id: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{1,64}$/, 'معرّف البكسل يقبل الحروف الإنجليزية والأرقام والشرطة فقط'),
  is_enabled: z.boolean().default(true),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertPermission(caller.role, 'tenant.settings.read');
  const { data, error } = await supabase.from('tracking_pixels').select('*').eq('tenant_id', caller.tenantId);
  if (error) throw new Error(`Failed to list tracking pixels: ${error.message}`);
  return okResponse({ pixels: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertPermission(caller.role, 'tenant.settings.manage');
  const input = pixelSchema.parse(await request.json());
  const { data, error } = await supabase
    .from('tracking_pixels')
    .upsert({ ...input, tenant_id: caller.tenantId }, { onConflict: 'tenant_id,provider,pixel_id' })
    .select()
    .single();
  if (error) throw databaseWriteError(error, 'Failed to save tracking pixel');
  return okResponse({ pixel: data }, 201);
});
