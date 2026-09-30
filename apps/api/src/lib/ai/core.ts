import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallerContext } from '@/lib/auth/get-caller-context';
import { createServiceRoleClient } from '@sbaah/shared';
import { generateGrokReply } from '@/lib/ai/grok';
import { AI_TOOL_DEFINITIONS, executeAiTool } from '@/lib/ai/tools';

export type AiChannel = 'assistant' | 'whatsapp';

export interface SbaahAiContext {
  channel: AiChannel;
  tenantId: string;
  actorUserId: string;
  actorName: string;
  assistantId: string;
  assistantName: string;
  personality: string;
  conversationId: string;
}

const SENSITIVE_TOOLS = new Set(['update_lead_status', 'create_lead']);
const WRITE_TOOLS = new Set(['add_lead_interest', 'add_lead_note', 'set_lead_follow_up']);

export async function runSbaahAiCore(input: {
  supabase: SupabaseClient;
  caller: CallerContext;
  context: SbaahAiContext;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  const systemSupabase = createServiceRoleClient();
  const { caller, context, supabase } = input;

  return generateGrokReply({
    assistantName: context.assistantName,
    userName: context.actorName,
    personality: context.personality,
    conversationId: context.conversationId,
    channel: context.channel,
    messages: input.messages,
    tools: AI_TOOL_DEFINITIONS,
    executeTool: async (name, args) => {
      if (name === 'create_lead' && args && typeof args === 'object' && typeof (args as { phone?: unknown }).phone === 'string') {
        const phone = (args as { phone: string }).phone;
        const { data: existing, error } = await supabase
          .from('leads')
          .select('id,full_name,phone,email,status')
          .eq('tenant_id', context.tenantId)
          .eq('phone', phone)
          .maybeSingle();
        if (error) throw new Error(`Failed to check duplicate lead: ${error.message}`);
        if (existing) return { duplicate_phone: true, existing_lead: existing };
      }

      const sensitive = SENSITIVE_TOOLS.has(name);
      const { data: log, error: logError } = await systemSupabase
        .from('ai_action_logs')
        .insert({
          tenant_id: context.tenantId,
          assistant_id: context.assistantId,
          conversation_id: context.conversationId,
          requested_by: context.actorUserId,
          tool_name: name,
          risk_level: sensitive ? 'sensitive' : WRITE_TOOLS.has(name) ? 'write' : 'read',
          status: sensitive ? 'awaiting_confirmation' : 'running',
          input: args,
          executed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (logError || !log) throw new Error(`Failed to create AI action log: ${logError?.message}`);

      if (sensitive) {
        return { requires_confirmation: true, action_id: log.id, tool_name: name, input: args };
      }

      try {
        const result = await executeAiTool({ supabase, caller, name, arguments: args });
        const { error: updateError } = await systemSupabase
          .from('ai_action_logs')
          .update({ status: 'succeeded', output: result })
          .eq('id', log.id)
          .eq('tenant_id', context.tenantId);
        if (updateError) console.error('Failed to mark AI action succeeded', updateError);
        return result;
      } catch (error) {
        const { error: updateError } = await systemSupabase
          .from('ai_action_logs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown tool error',
          })
          .eq('id', log.id)
          .eq('tenant_id', context.tenantId);
        if (updateError) console.error('Failed to mark AI action failed', updateError);
        throw error;
      }
    },
  });
}
