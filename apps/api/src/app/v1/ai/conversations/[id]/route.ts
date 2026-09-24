import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { id } = paramsSchema.parse(await context.params);

  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .select('id, assistant_id, title, last_message_at, created_at, updated_at')
    .eq('id', id)
    .eq('tenant_id', caller.tenantId)
    .eq('created_by', caller.userId)
    .maybeSingle();

  if (conversationError) throw new Error(`Failed to load AI conversation: ${conversationError.message}`);
  if (!conversation) throw new ApiError(404, 'ai_conversation_not_found', 'المحادثة غير موجودة');

  const { data: messages, error: messagesError } = await supabase
    .from('ai_messages')
    .select('id, sender, content, metadata, created_by, created_at')
    .eq('tenant_id', caller.tenantId)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200);

  if (messagesError) throw new Error(`Failed to load AI messages: ${messagesError.message}`);
  return okResponse({ conversation, messages: messages ?? [] });
});
