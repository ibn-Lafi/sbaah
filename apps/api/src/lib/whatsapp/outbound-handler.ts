import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiTask } from '@/lib/ai/task-worker';
import { sendMetaTextMessage } from '@/lib/whatsapp/meta-client';
import { applyCreditEntry } from '@/lib/ai/credits';
import { publishAiEvent } from '@/lib/ai/events';

export type WhatsAppTokenResolver = (connection: { id:string; tenant_id:string; access_token_ciphertext:string|null }) => Promise<string>;

export function createWhatsAppOutboundHandler(input: {
  systemSupabase: SupabaseClient;
  resolveAccessToken: WhatsAppTokenResolver;
  graphApiVersion: string;
}) {
  return async (task: AiTask) => {
    const conversationId=typeof task.payload.conversation_id==='string'?task.payload.conversation_id:'';
    const messageId=typeof task.payload.message_id==='string'?task.payload.message_id:'';
    if(!conversationId||!messageId) throw new Error('WhatsApp outbound task payload is invalid');

    const {data:message,error:messageError}=await input.systemSupabase.from('whatsapp_messages')
      .select('id,tenant_id,conversation_id,text_body,status,meta_message_id')
      .eq('id',messageId).eq('tenant_id',task.tenant_id).eq('conversation_id',conversationId).eq('direction','outbound').maybeSingle();
    if(messageError||!message) throw new Error(`Outbound WhatsApp message not found: ${messageError?.message ?? messageId}`);
    if(message.meta_message_id && ['sent','delivered','read'].includes(message.status)) return;
    if(!message.text_body?.trim()) throw new Error('Outbound WhatsApp text is empty');

    const {data:conversation,error:conversationError}=await input.systemSupabase.from('whatsapp_conversations')
      .select('id,connection_id,contact_id,status').eq('id',conversationId).eq('tenant_id',task.tenant_id).maybeSingle();
    if(conversationError||!conversation) throw new Error(`WhatsApp conversation not found: ${conversationError?.message ?? conversationId}`);
    if(conversation.status==='closed') return;

    const [{data:connection,error:connectionError},{data:contact,error:contactError}]=await Promise.all([
      input.systemSupabase.from('whatsapp_connections').select('id,tenant_id,status,meta_phone_number_id,access_token_ciphertext').eq('id',conversation.connection_id).eq('tenant_id',task.tenant_id).maybeSingle(),
      input.systemSupabase.from('whatsapp_contacts').select('id,wa_id').eq('id',conversation.contact_id).eq('tenant_id',task.tenant_id).maybeSingle(),
    ]);
    if(connectionError||!connection||connection.status!=='connected'||!connection.meta_phone_number_id) throw new Error('WhatsApp Meta connection is not ready');
    if(contactError||!contact?.wa_id) throw new Error('WhatsApp recipient is not available');

    const token=await input.resolveAccessToken(connection);
    const sent=await sendMetaTextMessage({phoneNumberId:connection.meta_phone_number_id,accessToken:token,to:contact.wa_id,text:message.text_body,graphApiVersion:input.graphApiVersion});

    const sentAt=new Date().toISOString();
    const {error:updateError}=await input.systemSupabase.from('whatsapp_messages').update({meta_message_id:sent.messageId,status:'sent',sent_at:sentAt,error_code:null,error_message:null})
      .eq('id',message.id).eq('tenant_id',task.tenant_id).is('meta_message_id',null);
    if(updateError) throw new Error(`Failed to persist Meta message id: ${updateError.message}`);

    await applyCreditEntry({systemSupabase:input.systemSupabase,tenantId:task.tenant_id,creditType:'whatsapp_message',direction:'debit',amount:1,reason:'whatsapp_message_sent',idempotencyKey:`whatsapp-message:${message.id}`,referenceType:'whatsapp_message',referenceId:message.id,metadata:{meta_message_id:sent.messageId}});
    await input.systemSupabase.from('whatsapp_conversations').update({last_message_at:sentAt,last_outbound_at:sentAt,updated_at:sentAt}).eq('id',conversation.id).eq('tenant_id',task.tenant_id);
    await publishAiEvent({systemSupabase:input.systemSupabase,tenantId:task.tenant_id,eventType:'whatsapp.message_sent',source:'whatsapp',entityType:'whatsapp_message',entityId:message.id,correlationId:conversation.id,idempotencyKey:`whatsapp-sent:${message.id}`,payload:{meta_message_id:sent.messageId}});
  };
}
