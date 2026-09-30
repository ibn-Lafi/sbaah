import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ingestMetaWebhook, verifyMetaSignature } from '@/lib/whatsapp/meta-webhook';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.META_WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET ?? '';
  if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'), appSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody) as Record<string, unknown>; }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  try {
    await ingestMetaWebhook(createServiceRoleClient(), payload);
    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Meta WhatsApp webhook ingestion failed', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}
