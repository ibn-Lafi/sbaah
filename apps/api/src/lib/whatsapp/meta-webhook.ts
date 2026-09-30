import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { enqueueAiTask, publishAiEvent } from '@/lib/ai/events';

type MetaMessage = { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string } };
type MetaStatus = { id?: string; status?: string; timestamp?: string; errors?: Array<{ code?: number; title?: string; message?: string }> };

export function verifyMetaSignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature?.startsWith('sha256=') || !appSecret) return false;
  const expected = Buffer.from(createHmac('sha256', appSecret).update(rawBody).digest('hex'), 'utf8');
  const received = Buffer.from(signature.slice(7), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function ingestMetaWebhook(systemSupabase: SupabaseClient, payload: Record<string, unknown>) {
  if (payload.object !== 'whatsapp_business_account') return { accepted: 0 };
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  let accepted = 0;
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const changes = Array.isArray((entry as { changes?: unknown[] }).changes) ? (entry as { changes: unknown[] }).changes : [];
    for (const change of changes) {
      if (!change || typeof change !== 'object') continue;
      if ((change as { field?: unknown }).field !== 'messages') continue;
      const value = (change as { value?: Record<string, unknown> }).value;
      if (!value) continue;
      const metadata = value.metadata as { phone_number_id?: string } | undefined;
      const phoneNumberId = metadata?.phone_number_id;
      if (!phoneNumberId) continue;
      const { data: connection } = await systemSupabase.from('whatsapp_connections').select('id,tenant_id').eq('meta_phone_number_id', phoneNumberId).eq('status','connected').maybeSingle();
      if (!connection) continue;

      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      const profileByWaId = new Map<string,string>();
      for (const item of contacts) {
        const contact=item as { wa_id?:string; profile?:{name?:string} };
        if(contact.wa_id) profileByWaId.set(contact.wa_id,contact.profile?.name ?? '');
      }

      for (const message of (Array.isArray(value.messages) ? value.messages : []) as MetaMessage[]) {
        if (!message.id || !message.from) continue;
        const phoneE164 = message.from.startsWith('+') ? message.from : `+${message.from}`;
        const { data: contact, error: contactError } = await systemSupabase.from('whatsapp_contacts').upsert({
          tenant_id: connection.tenant_id, wa_id: message.from, phone_e164: phoneE164,
          profile_name: profileByWaId.get(message.from) || null, updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id,wa_id' }).select('id').single();
        if (contactError || !contact) throw new Error(`Failed to upsert WhatsApp contact: ${contactError?.message}`);

        const { data: conversation, error: conversationError } = await systemSupabase.from('whatsapp_conversations').upsert({
          tenant_id: connection.tenant_id, connection_id: connection.id, contact_id: contact.id,
          last_message_at: new Date().toISOString(), last_inbound_at: new Date().toISOString(),
        }, { onConflict: 'connection_id,contact_id', ignoreDuplicates: false }).select('id').single();
        if (conversationError || !conversation) throw new Error(`Failed to upsert WhatsApp conversation: ${conversationError?.message}`);

        const { data: stored, error: messageError } = await systemSupabase.from('whatsapp_messages').upsert({
          tenant_id: connection.tenant_id, conversation_id: conversation.id, meta_message_id: message.id,
          direction: 'inbound', sender_type: 'customer', message_type: message.type ?? 'unsupported',
          text_body: message.text?.body ?? null, status: 'received', raw_payload: message,
          created_at: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
        }, { onConflict: 'tenant_id,meta_message_id', ignoreDuplicates: true }).select('id').maybeSingle();
        if (messageError) throw new Error(`Failed to store WhatsApp message: ${messageError.message}`);

        let storedId = stored?.id as string | undefined;
        if (!storedId) {
          const { data: existing, error: existingError } = await systemSupabase.from('whatsapp_messages')
            .select('id,conversation_id').eq('tenant_id',connection.tenant_id).eq('meta_message_id',message.id).single();
          if (existingError || !existing) throw new Error(`Failed to resolve idempotent inbound WhatsApp message: ${existingError?.message}`);
          storedId = existing.id;
        }

        const event = await publishAiEvent({ systemSupabase, tenantId: connection.tenant_id, eventType:'whatsapp.message_received', source:'whatsapp', entityType:'whatsapp_message', entityId:storedId, correlationId:conversation.id, idempotencyKey:`whatsapp-in:${message.id}`, payload:{ conversation_id:conversation.id, message_id:storedId } });
        await enqueueAiTask({ systemSupabase, tenantId:connection.tenant_id, taskType:'whatsapp.process_inbound', sourceEventId:event.id, idempotencyKey:`whatsapp-process:${message.id}`, payload:{ conversation_id:conversation.id, message_id:storedId } });
        accepted++;
      }

      for (const status of (Array.isArray(value.statuses) ? value.statuses : []) as MetaStatus[]) {
        if (!status.id || !status.status || !['sent','delivered','read','failed'].includes(status.status)) continue;
        const patch: Record<string,unknown>={ status:status.status };
        const at=status.timestamp ? new Date(Number(status.timestamp)*1000).toISOString() : new Date().toISOString();
        if(status.status==='sent') patch.sent_at=at;
        if(status.status==='delivered') patch.delivered_at=at;
        if(status.status==='read') patch.read_at=at;
        if(status.status==='failed'){patch.error_code=String(status.errors?.[0]?.code ?? '');patch.error_message=status.errors?.[0]?.message ?? status.errors?.[0]?.title ?? null;}
        await systemSupabase.from('whatsapp_messages').update(patch).eq('tenant_id',connection.tenant_id).eq('meta_message_id',status.id);
      }
    }
  }
  return { accepted };
}
