import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const createSchema = z.object({
  title: z.string().trim().max(120).optional(),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, assistant_id, title, last_message_at, created_at, updated_at')
    .eq('tenant_id', caller.tenantId)
    .eq('created_by', caller.userId)
    .order('last_message_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to list AI conversations: ${error.message}`);
  return okResponse({ conversations: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const input = createSchema.parse(await request.json().catch(() => ({})));

  const { data: assistant, error: assistantError } = await supabase
    .from('ai_assistants')
    .select('id, status')
    .eq('tenant_id', caller.tenantId)
    .maybeSingle();
  if (assistantError) throw new Error(`Failed to load AI assistant: ${assistantError.message}`);
  if (!assistant) throw new ApiError(409, 'ai_assistant_required', 'أنشئ مساعد Ai أولًا');
  if (assistant.status !== 'active') throw new ApiError(409, 'ai_assistant_paused', 'مساعد Ai متوقف حاليًا');

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      tenant_id: caller.tenantId,
      assistant_id: assistant.id,
      created_by: caller.userId,
      title: input.title || null,
    })
    .select('id, assistant_id, title, last_message_at, created_at, updated_at')
    .single();

  if (error || !data) throw new Error(`Failed to create AI conversation: ${error?.message}`);
  return okResponse(data, 201);
});
