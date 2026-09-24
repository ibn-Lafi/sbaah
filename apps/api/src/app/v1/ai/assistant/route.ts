import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

const assistantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  personality: z.string().trim().max(6000).default(''),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data, error } = await supabase
    .from('ai_assistants')
    .select('id, tenant_id, name, personality, status, created_at, updated_at')
    .eq('tenant_id', caller.tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load AI assistant: ${error.message}`);
  return okResponse(data);
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const input = assistantSchema.parse(await request.json());
  const { data, error } = await supabase
    .from('ai_assistants')
    .upsert(
      {
        tenant_id: caller.tenantId,
        name: input.name,
        personality: input.personality,
        status: 'active',
        created_by: caller.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' },
    )
    .select('id, tenant_id, name, personality, status, created_at, updated_at')
    .single();

  if (error) throw new Error(`Failed to save AI assistant: ${error.message}`);
  return okResponse(data);
});
