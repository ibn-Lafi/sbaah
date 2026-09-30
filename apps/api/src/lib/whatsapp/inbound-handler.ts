import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiTask } from '@/lib/ai/task-worker';
import { runSbaahAiCore } from '@/lib/ai/core';
import { enqueueAiTask, publishAiEvent } from '@/lib/ai/events';
import { applyCreditEntry } from '@/lib/ai/credits';

export function createWhatsAppInboundHandler(systemSupabase: SupabaseClient) {
  return async (task: AiTask) => {
    const conversationId = typeof task.payload.conversation_id === 'string' ? task.payload.conversation_id : '';
    const messageId = typeof task.payload.message_id === 'string' ? task.payload.message_id : '';
    if (!conversationId || !messageId) throw new Error('WhatsApp inbound task payload is invalid');

    const { data: message, error: messageError } = await systemSupabase.from('whatsapp_messages')
      .select('id,tenant_id,conversation_id,text_body,message_type,meta_message_id')
      .eq('id',messageId).eq('tenant_id',task.tenant_id).eq('conversation_id',conversationId)
      .eq('direction','inbound').maybeSingle();
    if (messageError || !message) throw new Error(`Inbound WhatsApp message not found: ${messageError?.message ?? messageId}`);
    if (message.message_type !== 'text' || !message.text_body?.trim()) return;

    const { data: conversation, error: conversationError } = await systemSupabase.from('whatsapp_conversations')
      .select('id,tenant_id,contact_id,status,ai_enabled')
      .eq('id',conversationId).eq('tenant_id',task.tenant_id).maybeSingle();
    if (conversationError || !conversation) throw new Error(`WhatsApp conversation not found: ${conversationError?.message ?? conversationId}`);
    if (!conversation.ai_enabled || conversation.status !== 'open') return;

    const { data: contact, error: contactError } = await systemSupabase.from('whatsapp_contacts')
      .select('id,lead_id,phone_e164,profile_name').eq('id',conversation.contact_id).eq('tenant_id',task.tenant_id).maybeSingle();
    if (contactError || !contact) throw new Error(`WhatsApp contact not found: ${contactError?.message ?? conversation.contact_id}`);

    const { data: alreadyQueued } = await systemSupabase.from('ai_tasks')
      .select('id').eq('tenant_id',task.tenant_id).eq('idempotency_key',`whatsapp-send:${message.id}`).maybeSingle();
    if (alreadyQueued) return;

    const { data: assistant, error: assistantError } = await systemSupabase.from('ai_assistants')
      .select('id,name,personality,status').eq('tenant_id',task.tenant_id).eq('status','active').order('created_at',{ascending:true}).limit(1).maybeSingle();
    if (assistantError || !assistant) throw new Error(`Active AI assistant not found: ${assistantError?.message ?? task.tenant_id}`);

    const { data: history, error: historyError } = await systemSupabase.from('whatsapp_messages')
      .select('id,direction,sender_type,text_body,created_at').eq('tenant_id',task.tenant_id).eq('conversation_id',conversationId)
      .eq('message_type','text').not('text_body','is',null).order('created_at',{ascending:false}).limit(20);
    if (historyError) throw new Error(`Failed to load WhatsApp history: ${historyError.message}`);
    const messages=(history ?? []).reverse().map((row)=>({ role: row.direction === 'inbound' ? 'user' as const : 'assistant' as const, content: row.text_body as string }));

    const generated = await runSbaahAiCore({
      supabase: systemSupabase,
      context: {
        channel:'whatsapp', tenantId:task.tenant_id,
        actorName:contact.profile_name || 'العميل', assistantId:assistant.id, assistantName:assistant.name,
        personality:assistant.personality, conversationId, customerPhone:contact.phone_e164,
        sourceMessageId:message.id,
        whatsappPrincipal:{ tenantId:task.tenant_id, contactId:contact.id, leadId:contact.lead_id, phone:contact.phone_e164 },
      },
      messages,
    });

    const replyKey = `whatsapp-reply:${message.id}`;
    const replyText = generated.text?.trim();
    if (!replyText) return;

    await applyCreditEntry({
      systemSupabase,
      tenantId: task.tenant_id,
      creditType: 'ai_agent',
      direction: 'debit',
      amount: 1,
      reason: 'whatsapp_ai_reply',
      idempotencyKey: `whatsapp-ai:${message.id}`,
      referenceType: 'whatsapp_message',
      referenceId: message.id,
      metadata: { provider: 'xai', model: generated.model },
    });

    const { data: insertedReply, error: insertError } = await systemSupabase.from('whatsapp_messages').insert({
      tenant_id:task.tenant_id, conversation_id:conversationId, direction:'outbound',
      sender_type:'ai', message_type:'text', text_body:replyText, status:'pending',
      idempotency_key:replyKey,
      raw_payload:{ source_inbound_message_id:message.id, provider:'xai', model:generated.model },
    }).select('id').single();

    let outboundId = insertedReply?.id as string | undefined;
    if (insertError) {
      if (insertError.code !== '23505') throw new Error(`Failed to store AI WhatsApp reply: ${insertError.message}`);
      const { data: existingReply, error: existingReplyError } = await systemSupabase.from('whatsapp_messages')
        .select('id').eq('tenant_id',task.tenant_id).eq('idempotency_key',replyKey).single();
      if (existingReplyError || !existingReply) throw new Error(`Failed to resolve idempotent WhatsApp reply: ${existingReplyError?.message}`);
      outboundId = existingReply.id;
    }
    if (!outboundId) throw new Error('Failed to resolve outbound WhatsApp reply');

    const event=await publishAiEvent({systemSupabase,tenantId:task.tenant_id,eventType:'whatsapp.reply_generated',source:'whatsapp',entityType:'whatsapp_message',entityId:outboundId,correlationId:conversationId,idempotencyKey:replyKey,payload:{source_message_id:message.id,outbound_message_id:outboundId}});
    await enqueueAiTask({systemSupabase,tenantId:task.tenant_id,taskType:'whatsapp.send_outbound',sourceEventId:event.id,idempotencyKey:`whatsapp-send:${message.id}`,payload:{conversation_id:conversationId,message_id:outboundId}});
  };
}
