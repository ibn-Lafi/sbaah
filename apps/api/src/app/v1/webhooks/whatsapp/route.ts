import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';

const MAX_WEBHOOK_BYTES = 64 * 1024;
const payloadSchema = z.object({
  tenant_id: z.string().uuid(),
  external_contact_id: z.string().min(1).max(255),
  provider_message_id: z.string().min(1).max(255),
  body: z.string().max(16_000).optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const configuredSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const suppliedSecret = request.headers.get('x-sbaah-webhook-secret');
  if (!configuredSecret || !suppliedSecret || suppliedSecret !== configuredSecret) {
    throw new ApiError(401, 'invalid_webhook_signature', 'Webhook authentication failed');
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    throw new ApiError(413, 'payload_too_large', 'Webhook payload is too large');
  }

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ApiError(400, 'invalid_webhook_payload', 'Webhook payload is invalid');
  }
  const body = parsed.data;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('WhatsApp webhook database configuration is missing');

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', body.tenant_id)
    .maybeSingle();
  if (tenantError) throw new Error(tenantError.message);
  if (!tenant) throw new ApiError(404, 'tenant_not_found', 'Webhook tenant was not found');

  const { data: conversation, error: conversationError } = await supabase
    .from('whatsapp_conversations')
    .upsert(
      {
        tenant_id: body.tenant_id,
        external_contact_id: body.external_contact_id,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,external_contact_id' },
    )
    .select()
    .single();
  if (conversationError) throw new Error(conversationError.message);

  const { error: messageError } = await supabase.from('whatsapp_messages').upsert(
    {
      tenant_id: body.tenant_id,
      conversation_id: conversation.id,
      provider_message_id: body.provider_message_id,
      direction: 'inbound',
      sender_type: 'customer',
      body: body.body ?? null,
    },
    { onConflict: 'tenant_id,provider_message_id', ignoreDuplicates: true },
  );
  if (messageError) throw new Error(messageError.message);

  return okResponse({ received: true, conversation_id: conversation.id });
});
