import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const paramsSchema = z.object({ id: z.string().uuid() });
const messageSchema = z.object({ content: z.string().trim().min(1).max(12000) });

export const POST = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { id } = paramsSchema.parse(await context.params);
  const input = messageSchema.parse(await request.json());

  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .select('id, assistant_id')
    .eq('id', id)
    .eq('tenant_id', caller.tenantId)
    .eq('created_by', caller.userId)
    .maybeSingle();
  if (conversationError) throw new Error(`Failed to load AI conversation: ${conversationError.message}`);
  if (!conversation) throw new ApiError(404, 'ai_conversation_not_found', 'المحادثة غير موجودة');

  const now = new Date().toISOString();
  const { data: message, error: messageError } = await supabase
    .from('ai_messages')
    .insert({
      tenant_id: caller.tenantId,
      conversation_id: conversation.id,
      sender: 'user',
      content: input.content,
      created_by: caller.userId,
    })
    .select('id, sender, content, metadata, created_by, created_at')
    .single();
  if (messageError || !message) throw new Error(`Failed to save AI message: ${messageError?.message}`);

  const { error: touchError } = await supabase
    .from('ai_conversations')
    .update({ last_message_at: now, updated_at: now })
    .eq('id', conversation.id)
    .eq('tenant_id', caller.tenantId);
  if (touchError) throw new Error(`Failed to update AI conversation: ${touchError.message}`);

  return okResponse({ message, generation: 'pending_model_connection' }, 201);
});
