import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { createServiceRoleClient } from '@sbaah/shared';
import { generateGrokReply } from '@/lib/ai/grok';
import { AI_TOOL_DEFINITIONS, executeAiTool } from '@/lib/ai/tools';

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

  const [{ data: assistant, error: assistantError }, { data: history, error: historyError }] = await Promise.all([
    supabase.from('ai_assistants').select('name, personality, status').eq('id', conversation.assistant_id).eq('tenant_id', caller.tenantId).single(),
    supabase.from('ai_messages').select('sender, content').eq('tenant_id', caller.tenantId).eq('conversation_id', conversation.id).in('sender', ['user', 'assistant']).order('created_at', { ascending: true }).limit(60),
  ]);
  if (assistantError || !assistant) throw new Error(`Failed to load AI assistant: ${assistantError?.message}`);
  if (assistant.status !== 'active') throw new ApiError(409, 'ai_assistant_paused', 'مساعد Ai متوقف حاليًا');
  if (historyError) throw new Error(`Failed to load AI history: ${historyError.message}`);

  const generated = await generateGrokReply({
    assistantName: assistant.name,
    personality: assistant.personality,
    conversationId: conversation.id,
    messages: (history ?? [])
      .filter((item) => item.sender === 'user' || item.sender === 'assistant')
      .map((item) => ({ role: item.sender as 'user' | 'assistant', content: item.content })),
    tools: AI_TOOL_DEFINITIONS,
    executeTool: async (name, args) => {
      const startedAt = new Date().toISOString();
      const { data: log, error: logError } = await systemSupabase
        .from('ai_action_logs')
        .insert({
          tenant_id: caller.tenantId,
          assistant_id: conversation.assistant_id,
          conversation_id: conversation.id,
          requested_by: caller.userId,
          tool_name: name,
          risk_level: ['create_lead', 'add_lead_note', 'set_lead_follow_up'].includes(name) ? 'write' : 'read',
          status: 'running',
          input: args,
          executed_at: startedAt,
        })
        .select('id')
        .single();
      if (logError || !log) throw new Error(`Failed to create AI action log: ${logError?.message}`);
      try {
        const result = await executeAiTool({ supabase, caller, name, arguments: args });
        await systemSupabase.from('ai_action_logs').update({ status: 'succeeded', output: result }).eq('id', log.id).eq('tenant_id', caller.tenantId);
        return result;
      } catch (error) {
        await systemSupabase.from('ai_action_logs').update({
          status: 'failed',
          error_message: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown tool error',
        }).eq('id', log.id).eq('tenant_id', caller.tenantId);
        throw error;
      }
    },
  });

  const { data: assistantMessage, error: assistantMessageError } = await supabase
    .rpc('append_ai_assistant_message', {
      p_conversation_id: conversation.id,
      p_content: generated.text,
      p_metadata: { provider: 'xai', model: generated.model, response_id: generated.responseId, tools: generated.executedTools.map((tool) => tool.name) },
    })
    .single();
  if (assistantMessageError || !assistantMessage) {
    throw new Error(`Failed to persist AI response: ${assistantMessageError?.message}`);
  }

  return okResponse({ message, assistant_message: assistantMessage }, 201);
});
