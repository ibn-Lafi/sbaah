import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallerContext } from '@/lib/auth/get-caller-context';
import { createServiceRoleClient } from '@sbaah/shared';
import { generateGrokReply } from '@/lib/ai/grok';
import { executeAiTool } from '@/lib/ai/tools';
import { assertToolRegistryComplete, getToolPolicy, getToolsForChannel, isToolAllowed, type AiChannel } from '@/lib/ai/tool-registry';
import { loadCustomerContextByPhone, serializeCustomerContext } from '@/lib/ai/customer-context';
import { publishAiEvent } from '@/lib/ai/events';
import { assertWhatsAppCustomerToolArgs, executeWhatsAppReadTool, type WhatsAppPrincipal } from '@/lib/whatsapp/service-principal';

type BaseAiContext = {
  tenantId: string;
  actorName: string;
  assistantId: string;
  assistantName: string;
  personality: string;
  conversationId: string;
};

export type AssistantAiContext = BaseAiContext & {
  channel: 'assistant';
  actorUserId: string;
};

export type WhatsAppAiContext = BaseAiContext & {
  channel: 'whatsapp';
  customerPhone: string;
  whatsappPrincipal: WhatsAppPrincipal;
  sourceMessageId: string;
};

type SbaahAiInput = {
  supabase: SupabaseClient;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} & (
  | { context: AssistantAiContext; caller: CallerContext }
  | { context: WhatsAppAiContext; caller?: never }
);

export async function runSbaahAiCore(input: SbaahAiInput) {
  assertToolRegistryComplete();
  const systemSupabase = createServiceRoleClient();
  const { context, supabase } = input;
  const customerContext = context.channel === 'whatsapp' && context.customerPhone
    ? await loadCustomerContextByPhone({ supabase, tenantId: context.tenantId, phone: context.customerPhone })
    : null;

  return generateGrokReply({
    assistantName: context.assistantName,
    userName: context.actorName,
    personality: context.personality,
    conversationId: context.conversationId,
    channel: context.channel,
    customerContext: serializeCustomerContext(customerContext),
    messages: input.messages,
    tools: getToolsForChannel(context.channel),
    executeTool: async (name, args) => {
      if (!isToolAllowed(context.channel, name)) {
        throw new Error(`AI tool ${name} is not allowed for channel ${context.channel}`);
      }
      const policy = getToolPolicy(name);
      if (!policy) throw new Error(`AI tool ${name} has no registry policy`);
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

      const sensitive = policy.risk === 'sensitive';
      let log: { id: string } | null = null;
      if (context.channel === 'assistant') {
        const { data, error: logError } = await systemSupabase
          .from('ai_action_logs')
          .insert({
            tenant_id: context.tenantId,
            assistant_id: context.assistantId,
            conversation_id: context.conversationId,
            requested_by: context.actorUserId,
            tool_name: name,
            risk_level: policy.risk,
            status: sensitive ? 'awaiting_confirmation' : 'running',
            input: args,
            executed_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (logError || !data) throw new Error(`Failed to create AI action log: ${logError?.message}`);
        log = data;
      }
      if (sensitive) {
        if (!log) throw new Error(`Sensitive tool ${name} is not available on WhatsApp`);
        return { requires_confirmation: true, action_id: log.id, tool_name: name, input: args };
      }

      try {
        let result: unknown;
        if (context.channel === 'whatsapp') {
          const principal = context.whatsappPrincipal;
          if (!principal) throw new Error('WhatsApp principal is required');
          if (policy.risk === 'read') {
            result = await executeWhatsAppReadTool({ systemSupabase, principal, name, arguments: args });
          } else {
            if (!policy.customerScoped) throw new Error(`WhatsApp write tool ${name} is not customer-scoped`);
            assertWhatsAppCustomerToolArgs(principal, args);
            throw new Error(`WhatsApp write tool ${name} is not enabled until its service executor is implemented`);
          }
        } else {
          result = await executeAiTool({ supabase, caller: input.caller, name, arguments: args });
        }
        if (log) {
          const { error: updateError } = await systemSupabase.from('ai_action_logs').update({ status: 'succeeded', output: result }).eq('id', log.id).eq('tenant_id', context.tenantId);
          if (updateError) console.error('Failed to mark AI action succeeded', updateError);
        }
        try {
          await publishAiEvent({
            systemSupabase,
            tenantId: context.tenantId,
            eventType: 'ai.tool.succeeded',
            source: context.channel,
            actorUserId: context.channel === 'assistant' ? context.actorUserId : null,
            correlationId: context.conversationId,
            idempotencyKey: context.channel === 'assistant'
              ? `ai-tool:assistant:${context.conversationId}:${name}:${log?.id}:succeeded`
              : `ai-tool:whatsapp:${context.sourceMessageId}:${name}:succeeded`,
            payload: { action_log_id: log?.id ?? null, tool_name: name },
          });
        } catch (eventError) {
          console.error('Failed to publish AI tool event', eventError);
        }
        return result;
      } catch (error) {
        if (log) {
          const { error: updateError } = await systemSupabase.from('ai_action_logs').update({ status: 'failed', error_message: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown tool error' }).eq('id', log.id).eq('tenant_id', context.tenantId);
          if (updateError) console.error('Failed to mark AI action failed', updateError);
        }
        throw error;
      }
    },
  });
}
