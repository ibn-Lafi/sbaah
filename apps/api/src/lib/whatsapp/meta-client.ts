export interface MetaSendTextInput {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
  graphApiVersion: string;
}

export async function sendMetaTextMessage(input: MetaSendTextInput) {
  if (!/^v\d+\.\d+$/.test(input.graphApiVersion)) throw new Error('META_GRAPH_API_VERSION is invalid');
  if (!input.phoneNumberId || !input.accessToken || !input.to) throw new Error('Meta WhatsApp credentials are incomplete');
  const response = await fetch(`https://graph.facebook.com/${input.graphApiVersion}/${encodeURIComponent(input.phoneNumberId)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: input.to.replace(/^\+/, ''), type: 'text', text: { preview_url: false, body: input.text } }),
    signal: AbortSignal.timeout(20_000),
  });
  const raw = await response.text();
  let body: { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number } } = {};
  try { body = raw ? JSON.parse(raw) as typeof body : {}; } catch { body = {}; }
  if (!response.ok) throw new Error(`Meta send failed (${response.status}): ${body.error?.message ?? raw.slice(0,500)}`);
  const messageId = body.messages?.[0]?.id;
  if (!messageId) throw new Error('Meta send succeeded without a message id');
  return { messageId };
}
