import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { createServiceRoleClient } from '@sbaah/shared';
import { runSbaahAiCore } from '@/lib/ai/core';

const paramsSchema = z.object({ id: z.string().uuid() });
const messageSchema = z.object({ content: z.string().trim().min(1).max(12000) });

export const POST = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const systemSupabase = createServiceRoleClient();
  const { id } = paramsSchema.parse(await context.params);
  const input = messageSchema.parse(await request.json());

  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .select('id, assistant_id, title')
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

  const autoTitle = conversation.title?.trim()
    ? conversation.title
    : input.content.replace(/\s+/g, ' ').trim().slice(0, 72);
  const { error: touchError } = await supabase
    .from('ai_conversations')
    .update({ title: autoTitle || null, last_message_at: now, updated_at: now })
    .eq('id', conversation.id)
    .eq('tenant_id', caller.tenantId);
  if (touchError) throw new Error(`Failed to update AI conversation: ${touchError.message}`);

  const [{ data: assistant, error: assistantError }, { data: history, error: historyError }] = await Promise.all([
    supabase.from('ai_assistants').select('name, personality, status').eq('id', conversation.assistant_id).eq('tenant_id', caller.tenantId).single(),
    supabase.from('ai_messages').select('sender, content').eq('tenant_id', caller.tenantId).eq('conversation_id', conversation.id).in('sender', ['user', 'assistant']).order('created_at', { ascending: true }).limit(60),
  ]);
  if (assistantError || !assistant) throw new Error(`Failed to load AI assistant: ${assistantError?.message}`);
  if (assistant.status !== 'active') throw new ApiError(409, 'ai_assistant_paused', 'مساعد Ai متوقف حاليًا');
  if (historyError) throw new Error(`Failed to load AI history: ${historyError.message}`);

  const generated = await runSbaahAiCore({
    supabase,
    caller,
    context: {
      channel: 'assistant',
      tenantId: caller.tenantId,
      actorUserId: caller.userId,
      actorName: caller.fullName,
      assistantId: conversation.assistant_id,
      assistantName: assistant.name,
      personality: assistant.personality,
      conversationId: conversation.id,
    },
    messages: (history ?? [])
      .filter((item) => item.sender === 'user' || item.sender === 'assistant')
      .map((item) => ({ role: item.sender as 'user' | 'assistant', content: item.content })),
  });

  const assistantMessageId = crypto.randomUUID();
  const assistantMessagePayload = {
    id: assistantMessageId,
    tenant_id: caller.tenantId,
    conversation_id: conversation.id,
    sender: 'assistant',
    content: generated.text,
    metadata: {
      provider: 'xai',
      model: generated.model,
      response_id: generated.responseId,
      tools: generated.executedTools.map((tool) => tool.name),
      tool_results: generated.executedTools
        .filter((tool) => ['get_portfolio_summary', 'search_leads', 'search_projects', 'search_listings', 'create_lead'].includes(tool.name))
        .map((tool) => ({ name: tool.name, result: tool.result })),
      ...(() => {
        const pending = generated.executedTools.find((tool) => {
          const result = tool.result as { requires_confirmation?: boolean } | null;
          return result?.requires_confirmation === true;
        });
        const result = pending?.result as { action_id?: string; tool_name?: string } | undefined;
        return result?.action_id ? { pending_action_id: result.action_id, pending_action_tool: result.tool_name, pending_action_input: (pending?.result as { input?: unknown } | undefined)?.input, pending_action_status: 'awaiting_confirmation' } : {};
      })(),
    },
    created_by: null,
    created_at: new Date().toISOString(),
  };
  const { error: assistantMessageError } = await systemSupabase
    .from('ai_messages')
    .insert(assistantMessagePayload);
  if (assistantMessageError) throw new Error(`Failed to persist AI response: ${assistantMessageError.message}`);

  const { error: conversationTouchError } = await systemSupabase
    .from('ai_conversations')
    .update({ last_message_at: assistantMessagePayload.created_at, updated_at: assistantMessagePayload.created_at })
    .eq('id', conversation.id)
    .eq('tenant_id', caller.tenantId);
  if (conversationTouchError) throw new Error(`Failed to update AI conversation after response: ${conversationTouchError.message}`);

  const assistantMessage = {
    id: assistantMessagePayload.id,
    sender: 'assistant',
    content: assistantMessagePayload.content,
    metadata: assistantMessagePayload.metadata,
    created_by: null,
    created_at: assistantMessagePayload.created_at,
  };

  return okResponse({ message, assistant_message: assistantMessage }, 201);
});
