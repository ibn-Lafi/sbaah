type GrokMessage = { role: 'system' | 'user' | 'assistant'; content: string };

interface GrokResponse {
  id?: string;
  model?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string; type?: string; code?: string };
}

export async function generateGrokReply(input: {
  assistantName: string;
  personality: string;
  messages: GrokMessage[];
  conversationId: string;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY is not configured');

  const system = [
    `أنت ${input.assistantName}، مساعد الذكاء الاصطناعي داخل منصة سبعة العقارية.`,
    'تحدث بالعربية افتراضيًا ما لم يطلب المستخدم لغة أخرى.',
    'كن دقيقًا ومختصرًا. لا تدّعي تنفيذ أي إجراء داخل سبعة ما لم تُرجع لك أداة النظام نتيجة نجاح فعلية.',
    'لا تخمّن بيانات المنشأة أو العملاء أو المشاريع أو العقارات. اطلبها من أدوات سبعة عندما تصبح متاحة.',
    input.personality ? `تعليمات وشخصية المساعد التي حددها العميل: ${input.personality}` : '',
  ].filter(Boolean).join('\n');

  const model = process.env.XAI_MODEL || 'grok-4.20';

  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [{ role: 'system', content: system }, ...input.messages],
      prompt_cache_key: `sbaah-ai:${input.conversationId}`,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const raw = await response.text();
  let body: GrokResponse = {};
  try {
    body = raw ? JSON.parse(raw) as GrokResponse : {};
  } catch {
    // Preserve non-JSON provider errors in the server log without exposing secrets.
  }

  if (!response.ok) {
    const providerMessage = body.error?.message || raw.slice(0, 1200) || `HTTP ${response.status}`;
    throw new Error(`xAI request failed (${response.status}): ${providerMessage}`);
  }

  const text = body.output
    ?.filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text' || part.type === 'text')
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) throw new Error('xAI returned an empty response');
  return { text, responseId: body.id ?? null, model: body.model ?? model };
}
