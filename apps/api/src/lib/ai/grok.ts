type GrokMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ToolDefinition = {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

interface GrokOutputItem {
  type?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  content?: Array<{ type?: string; text?: string }>;
}

interface GrokResponse {
  id?: string;
  model?: string;
  output?: GrokOutputItem[];
  error?: { message?: string; type?: string; code?: string };
}

const endpoint = 'https://api.x.ai/v1/responses';

async function callXai(body: Record<string, unknown>) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY is not configured');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const raw = await response.text();
  let parsed: GrokResponse = {};
  try {
    parsed = raw ? JSON.parse(raw) as GrokResponse : {};
  } catch {
    parsed = {};
  }
  if (!response.ok) {
    const providerMessage = parsed.error?.message || raw.slice(0, 1200) || `HTTP ${response.status}`;
    throw new Error(`xAI request failed (${response.status}): ${providerMessage}`);
  }
  return parsed;
}

function responseText(body: GrokResponse) {
  return body.output
    ?.filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text' || part.type === 'text')
    .map((part) => part.text ?? '')
    .join('')
    .trim() || '';
}

export async function generateGrokReply(input: {
  assistantName: string;
  userName: string;
  personality: string;
  messages: GrokMessage[];
  conversationId: string;
  tools: readonly ToolDefinition[];
  executeTool: (name: string, args: unknown) => Promise<unknown>;
}) {
  const system = [
    `أنت ${input.assistantName}، مساعد الذكاء الاصطناعي داخل منصة سبعة العقارية.`,
    'تحدث بالعربية افتراضيًا ما لم يطلب المستخدم لغة أخرى.',
    `اسم المستخدم الحالي الذي يتحدث معك هو: ${input.userName}. استخدم هذا الاسم فقط عند مخاطبته بالاسم.`,
    'الأسماء التي تظهر في نتائج العملاء المحتملين أو المشاريع أو العقارات هي بيانات عمل وليست اسم المستخدم الحالي. لا تخاطب المستخدم باسم أي عميل أو جهة أو سجل تعيده الأدوات.',
    'استخدم أدوات سبعة عندما يسأل المستخدم عن بيانات منشأته أو يطلب إجراءً. لا تخمّن أي رقم أو سجل.',
    'لا تدّعي تنفيذ أي إجراء إلا بعد نجاح الأداة. إذا فشلت الأداة اشرح الفشل بدون اختلاق نتيجة.',
    'عند إضافة عميل، اجمع البيانات ثم استخدم create_lead لعرض مسودة قابلة للتعديل. لا تعتبر العميل مضافًا قبل تأكيد المستخدم.',
    'افهم التسلسل العقاري كالتالي: مشروع ثم عقار ثم وحدة، وقد توجد وحدة مباشرة تحت المشروع أو عقار/وحدة مستقلة. سجل أعمق هدف معروف.',
    'عند طلب رحلة CRM مركبة، نفذها بالترتيب المنطقي: ابحث أولًا عن العميل أو أنشئه عند طلب الإنشاء، ابحث عن المشروع/العقار المذكور، سجل الاهتمام، ثم أضف المتابعة أو الملاحظة المطلوبة. استخدم المعرفات التي تعيدها الأدوات ولا تخمّن UUID.',
    'إذا كان اسم مشروع أو عميل يطابق أكثر من سجل بشكل غير واضح، لا تختر عشوائيًا؛ اطلب من المستخدم التحديد.',
    'إذا نجحت بعض خطوات الرحلة وفشلت خطوة لاحقة، اذكر بوضوح ما تم وما لم يتم ولا تعِد تنفيذ الخطوات الناجحة مرة أخرى دون حاجة.',
    'الإجراءات الحساسة المتاحة لك يجب أن تتوقف عند طلب التأكيد من المستخدم، ولا تعتبرها منفذة قبل التأكيد. الحذف غير متاح.',
    input.personality ? `تعليمات وشخصية المساعد التي حددها العميل: ${input.personality}` : '',
  ].filter(Boolean).join('\n');
  const model = process.env.XAI_MODEL || 'grok-4.20';
  const base = {
    model,
    input: [{ role: 'system', content: system }, ...input.messages],
    tools: input.tools,
    tool_choice: 'auto',
    prompt_cache_key: `sbaah-ai:${input.conversationId}`,
  };
  let body = await callXai(base);
  const executedTools: Array<{ name: string; arguments: unknown; result: unknown }> = [];

  for (let round = 0; round < 8; round += 1) {
    const calls = (body.output ?? []).filter((item) => item.type === 'function_call' && item.name && item.call_id);
    if (calls.length === 0) break;
    const outputs = [];
    for (const call of calls) {
      let args: unknown = {};
      try { args = call.arguments ? JSON.parse(call.arguments) : {}; } catch { args = {}; }
      const result = await input.executeTool(call.name!, args);
      executedTools.push({ name: call.name!, arguments: args, result });
      outputs.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
    }
    body = await callXai({ model, previous_response_id: body.id, input: outputs, tools: input.tools, tool_choice: 'auto' });
  }

  const text = responseText(body);
  if (!text) throw new Error('xAI returned an empty response');
  return { text, responseId: body.id ?? null, model: body.model ?? model, executedTools };
}
