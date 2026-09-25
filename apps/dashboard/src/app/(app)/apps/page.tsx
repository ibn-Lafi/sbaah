'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { createAiConversation, decideAiAction, getAiAssistant, getAiConversation, listAiConversations, saveAiAssistant, sendAiMessage, type AiAssistant, type AiConversation, type AiMessage } from '@/lib/api/ai';

type Section = 'assistant' | 'whatsapp';

type AiToolResult = { name?: string; result?: Record<string, unknown> };

function RichToolResults({ metadata, ar }: { metadata: Record<string, unknown>; ar: boolean }) {
  const raw = Array.isArray(metadata.tool_results) ? metadata.tool_results : [];
  const results = raw.filter((item): item is AiToolResult => Boolean(item && typeof item === 'object'));

  if (results.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {results.map((tool, index) => {
        const result = tool.result ?? {};
        if (tool.name === 'get_portfolio_summary') {
          const stats = [
            [ar ? 'العملاء' : 'Leads', result.leads, '/leads'],
            [ar ? 'المشاريع' : 'Projects', result.projects, '/projects'],
            [ar ? 'العقارات' : 'Properties', result.listings, '/listings'],
          ];
          return (
            <div key={`summary-${index}`} className="grid grid-cols-3 gap-2">
              {stats.map(([label, value, href]) => (
                <Link key={String(label)} href={String(href)} className="border-border-default bg-surface-card hover:border-brand/40 hover:bg-brand-surface rounded-[12px] border p-3 text-center transition">
                  <div className="text-brand text-lg font-bold">{typeof value === 'number' ? value : 0}</div>
                  <div className="text-text-secondary mt-0.5 text-[11px] font-medium">{String(label)}</div>
                </Link>
              ))}
            </div>
          );
        }

        const rows = tool.name === 'search_leads'
          ? result.leads
          : tool.name === 'search_projects'
            ? result.projects
            : tool.name === 'search_listings'
              ? result.listings
              : null;
        if (!Array.isArray(rows) || rows.length === 0) return null;

        return (
          <div key={`${tool.name}-${index}`} className="flex flex-col gap-2">
            {rows.slice(0, 5).map((row, rowIndex) => {
              if (!row || typeof row !== 'object') return null;
              const item = row as Record<string, unknown>;
              const title = String(item.full_name ?? item.name_ar ?? item.name_en ?? item.title_ar ?? item.title_en ?? item.listing_number ?? (ar ? 'نتيجة' : 'Result'));
              const subtitle = tool.name === 'search_leads'
                ? [item.phone, item.status].filter(Boolean).join(' · ')
                : tool.name === 'search_projects'
                  ? [item.reference_number, item.status].filter(Boolean).join(' · ')
                  : [item.listing_number, item.listing_type, item.commercial_status].filter(Boolean).join(' · ');
              const entityId = typeof item.id === 'string' ? item.id : null;
              const href = entityId
                ? tool.name === 'search_leads'
                  ? `/leads/${entityId}`
                  : tool.name === 'search_projects'
                    ? `/projects/${entityId}`
                    : tool.name === 'search_listings'
                      ? `/listings/${entityId}`
                      : null
                : null;
              const card = (
                <>
                  <div className="text-text-primary truncate text-sm font-bold">{title}</div>
                  {subtitle ? <div className="text-text-secondary mt-1 truncate text-xs" dir={tool.name === 'search_leads' ? 'ltr' : undefined}>{subtitle}</div> : null}
                </>
              );
              return href ? (
                <Link key={entityId} href={href} className="border-border-default bg-surface-card hover:border-brand/40 hover:bg-brand-surface block rounded-[12px] border px-3.5 py-3 transition">
                  {card}
                </Link>
              ) : (
                <div key={String(item.id ?? rowIndex)} className="border-border-default bg-surface-card rounded-[12px] border px-3.5 py-3">
                  {card}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AppsPage() {
  const { me, accessToken } = useCurrentUser();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const [section, setSection] = useState<Section>('assistant');
  const [assistant, setAssistant] = useState<AiAssistant | null>(null);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [decidingActionId, setDecidingActionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openingConversationId, setOpeningConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void getAiAssistant(accessToken)
      .then((data) => {
        if (!active) return;
        setAssistant(data);
        if (data) {
          setName(data.name);
          setPersonality(data.personality);
        }
      })
      .catch(() => {
        if (active) setError(ar ? 'تعذر تحميل مساعد Ai.' : 'Could not load AI assistant.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, ar]);

  useEffect(() => {
    if (!assistant) return;
    let active = true;
    void listAiConversations(accessToken).then(async ({ conversations: rows }) => {
      if (!active) return;
      setConversations(rows);
      if (rows[0]) {
        setConversationId(rows[0].id);
        const detail = await getAiConversation(accessToken, rows[0].id);
        if (active) setMessages(detail.messages);
      }
    }).catch(() => {
      if (active) setError(ar ? 'تعذر تحميل المحادثات.' : 'Could not load conversations.');
    });
    return () => { active = false; };
  }, [accessToken, assistant, ar]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending || !assistant) return;
    setSending(true);
    setError('');
    setDraft('');
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: AiMessage = {
      id: optimisticId,
      sender: 'user',
      content,
      metadata: {},
      created_by: null,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    try {
      let id = conversationId;
      if (!id) {
        const created = await createAiConversation(accessToken);
        id = created.id;
        setConversationId(created.id);
        setConversations((current) => [created, ...current]);
      }
      const result = await sendAiMessage(accessToken, id, content);
      setMessages((current) => [
        ...current.map((item) => item.id === optimisticId ? result.message : item),
        result.assistant_message,
      ]);
    } catch {
      setMessages((current) => current.filter((item) => item.id !== optimisticId));
      setDraft(content);
      setError(ar ? 'تعذر الحصول على رد المساعد. أعد المحاولة.' : 'Could not get an assistant response. Please retry.');
    } finally {
      setSending(false);
    }
  }

  function handleNewConversation() {
    setConversationId(null);
    setMessages([]);
    setDraft('');
    setError('');
    setHistoryOpen(false);
  }

  async function handleOpenConversation(id: string) {
    if (id === conversationId) {
      setHistoryOpen(false);
      return;
    }
    setOpeningConversationId(id);
    setError('');
    try {
      const detail = await getAiConversation(accessToken, id);
      setConversationId(id);
      setMessages(detail.messages);
      setHistoryOpen(false);
    } catch {
      setError(ar ? 'تعذر فتح المحادثة.' : 'Could not open the conversation.');
    } finally {
      setOpeningConversationId(null);
    }
  }

  async function handleActionDecision(actionId: string, decision: 'confirm' | 'cancel') {
    if (decidingActionId) return;
    setDecidingActionId(actionId);
    setError('');
    try {
      await decideAiAction(accessToken, actionId, decision);
      setMessages((current) => current.map((message) => {
        if (message.sender !== 'assistant' || message.metadata?.pending_action_id !== actionId) return message;
        return { ...message, metadata: { ...message.metadata, pending_action_status: decision === 'confirm' ? 'succeeded' : 'cancelled' } };
      }));
    } catch {
      setError(ar ? 'تعذر تنفيذ قرار الإجراء.' : 'Could not process the action decision.');
    } finally {
      setDecidingActionId(null);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const saved = await saveAiAssistant(accessToken, { name: name.trim(), personality: personality.trim() });
      setAssistant(saved);
      setName(saved.name);
      setPersonality(saved.personality);
    } catch {
      setError(ar ? 'تعذر حفظ المساعد. حاول مرة أخرى.' : 'Could not save the assistant. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={ar ? 'سبعة Ai' : 'Sbaah AI'} orgName={me.tenant.name_ar} accountType={me.tenant.account_type} mobileImmersive>
      <div className="mx-auto flex h-dvh min-h-0 w-full max-w-5xl flex-col overflow-hidden md:h-[calc(100dvh-8.5rem)]">
        <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
          <Link href="/" aria-label={ar ? 'الخروج إلى الرئيسية' : 'Exit to home'} className="text-text-primary bg-surface-subtle flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </Link>
          <span className="text-text-primary text-sm font-semibold">{ar ? 'سبعة Ai' : 'Sbaah AI'}</span>
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label={ar ? 'سجل المحادثات' : 'Conversation history'} className="text-text-primary bg-surface-subtle flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M13 9h4M13 13h4"/></svg>
          </button>
        </div>
        <div className="bg-surface-subtle mb-4 grid w-full shrink-0 grid-cols-2 rounded-[12px] p-1 sm:mb-6">
          {([
            ['assistant', ar ? 'مساعد Ai' : 'AI Assistant'],
            ['whatsapp', ar ? 'واتس اب Ai' : 'WhatsApp AI'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value)}
              aria-pressed={section === value}
              className={`h-10 rounded-[9px] px-3 text-sm font-semibold transition ${
                section === value
                  ? 'bg-surface-card text-text-primary border-border-default border shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'assistant' ? (
          loading ? (
            <div className="border-border-default bg-surface-card rounded-card border p-6">
              <div className="bg-surface-subtle h-5 w-32 animate-pulse rounded" />
              <div className="bg-surface-subtle mt-3 h-4 w-64 max-w-full animate-pulse rounded" />
            </div>
          ) : assistant ? (
            <div className="flex min-h-0 flex-1 gap-3">
              <aside className="border-border-default bg-surface-card hidden w-64 shrink-0 flex-col overflow-hidden rounded-card border md:flex">
                <div className="border-border-default border-b p-3">
                  <button type="button" onClick={handleNewConversation} className="bg-brand w-full rounded-[10px] px-3 py-2.5 text-sm font-semibold text-white">
                    {ar ? '+ محادثة جديدة' : '+ New conversation'}
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  <p className="text-text-secondary px-2 pb-2 text-xs font-semibold">{ar ? 'سجل المحادثات' : 'Conversation history'}</p>
                  {conversations.length === 0 ? <p className="text-text-secondary px-2 py-4 text-xs">{ar ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p> : conversations.map((conversation) => (
                    <button key={conversation.id} type="button" onClick={() => void handleOpenConversation(conversation.id)} disabled={openingConversationId === conversation.id} className={`mb-1 w-full rounded-[9px] px-3 py-2.5 text-start text-sm transition disabled:opacity-50 ${conversationId === conversation.id ? 'bg-brand-surface text-brand font-semibold' : 'text-text-primary hover:bg-surface-subtle'}`}>
                      <span className="block truncate">{conversation.title || (ar ? 'محادثة جديدة' : 'New conversation')}</span>
                      <span className="text-text-secondary mt-1 block text-[10px]">{new Date(conversation.last_message_at).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}</span>
                    </button>
                  ))}
                </div>
              </aside>
              <section className="border-border-default bg-surface-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border">
              <header className="border-border-default flex shrink-0 items-center gap-3 border-b px-4 py-4 sm:px-5">
                <div className="bg-brand-surface text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {assistant.name.trim().slice(0, 1) || 'Ai'}
                </div>
                <div className="min-w-0">
                  <h1 className="text-text-primary truncate text-base font-bold">{assistant.name}</h1>
                  <p className="text-text-secondary text-xs">{ar ? 'مساعدك في سبعة' : 'Your Sbaah assistant'}</p>
                </div>
                <span className="ms-auto flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {ar ? 'نشط' : 'Active'}
                </span>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
                {messages.length === 0 ? (
                  <div className="m-auto max-w-md text-center">
                    <h2 className="text-text-primary text-lg font-bold">
                      {ar ? `مرحبًا، أنا ${assistant.name}` : `Hi, I'm ${assistant.name}`}
                    </h2>
                    <p className="text-text-secondary mt-2 text-sm leading-6">
                      {ar ? 'ابدأ محادثتك. يتم الآن حفظ المحادثات بأمان داخل سبعة، وسيتم توصيل الردود الذكية مع Grok في الخطوة التالية.' : 'Start chatting. Conversations are now stored in Sbaah; Grok responses will be connected next.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.filter((message) => message.sender === 'user' || message.sender === 'assistant').map((message) => (
                      <div key={message.id} className={`max-w-[85%] rounded-[14px] px-4 py-3 text-sm leading-6 ${
                        message.sender === 'user' ? 'bg-brand ms-auto text-white' : 'bg-surface-subtle text-text-primary me-auto'
                      }`}>
                        <span className="whitespace-pre-wrap">{message.content}</span>
                        {message.sender === 'assistant' ? <RichToolResults metadata={message.metadata} ar={ar} /> : null}
                        {message.sender === 'assistant' && typeof message.metadata?.pending_action_id === 'string' ? (
                          <div className="border-border-default mt-3 flex flex-wrap gap-2 border-t pt-3">
                            {message.metadata?.pending_action_status === 'succeeded' ? (
                              <span className="text-xs font-semibold text-emerald-700">{ar ? 'تم تنفيذ الإجراء' : 'Action completed'}</span>
                            ) : message.metadata?.pending_action_status === 'cancelled' ? (
                              <span className="text-text-secondary text-xs font-semibold">{ar ? 'تم إلغاء الإجراء' : 'Action cancelled'}</span>
                            ) : (
                              <>
                                <button type="button" disabled={decidingActionId === message.metadata.pending_action_id} onClick={() => void handleActionDecision(message.metadata.pending_action_id as string, 'confirm')} className="bg-brand rounded-[8px] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                                  {ar ? 'تأكيد التنفيذ' : 'Confirm'}
                                </button>
                                <button type="button" disabled={decidingActionId === message.metadata.pending_action_id} onClick={() => void handleActionDecision(message.metadata.pending_action_id as string, 'cancel')} className="border-border-default bg-surface-card text-text-primary rounded-[8px] border px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                                  {ar ? 'إلغاء' : 'Cancel'}
                                </button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {sending ? (
                      <div role="status" aria-live="polite" aria-label={ar ? 'المساعد يفكر' : 'Assistant is thinking'} className="me-auto flex min-h-10 items-center gap-2.5 rounded-[14px] bg-surface-subtle px-4 py-3">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                          <span className="absolute h-5 w-5 animate-ping rounded-full bg-brand/15" />
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
                        </span>
                        <span className="flex items-center gap-1" aria-hidden="true">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/90 [animation-delay:-0.24s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/70 [animation-delay:-0.12s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/50" />
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={(event) => void handleSend(event)} className="shrink-0 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:p-4 md:border-t md:border-border-default">
                <div className="border-border-default bg-surface-subtle flex min-h-[58px] items-end gap-2 rounded-[29px] border p-1.5 shadow-sm md:min-h-12 md:rounded-[12px] md:p-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={1}
                    placeholder={ar ? `اكتب رسالة إلى ${assistant.name}...` : `Message ${assistant.name}...`}
                    className="text-text-primary placeholder:text-text-placeholder max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none md:min-h-9 md:px-2 md:py-2"
                  />
                  <button type="submit" disabled={!draft.trim() || sending} aria-label={ar ? 'إرسال' : 'Send'} className="bg-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:opacity-40 md:h-auto md:w-auto md:rounded-[9px] md:px-4 md:py-2">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 md:hidden" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" /></svg>
                    <span className="hidden text-sm font-semibold md:inline">{ar ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </section>
            </div>
          ) : (
            <section className="mx-auto max-w-2xl">
              <div className="mb-6">
                <h1 className="text-text-primary text-xl font-bold sm:text-2xl">{ar ? 'أنشئ مساعدك' : 'Create your assistant'}</h1>
                <p className="text-text-secondary mt-2 text-sm leading-6">
                  {ar
                    ? 'سمّ مساعدك وحدد شخصيته مرة واحدة. بعدها سيكون مساعدك داخل سبعة للمحادثة معك وتنفيذ المهام المسموحة.'
                    : 'Name your assistant and define its personality once. It will then become your assistant inside Sbaah.'}
                </p>
              </div>

              <form onSubmit={(event) => void handleCreate(event)} className="border-border-default bg-surface-card rounded-card border p-4 sm:p-6">
                <label className="flex flex-col gap-2">
                  <span className="text-text-primary text-sm font-semibold">{ar ? 'اسم المساعد' : 'Assistant name'}</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    placeholder={ar ? 'مثال: سعود' : 'Example: Saud'}
                    className="border-border-default bg-surface-card text-text-primary placeholder:text-text-placeholder h-11 rounded-[10px] border px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                </label>

                <label className="mt-5 flex flex-col gap-2">
                  <span className="text-text-primary text-sm font-semibold">{ar ? 'الشخصية والتعليمات' : 'Personality and instructions'}</span>
                  <textarea
                    value={personality}
                    onChange={(event) => setPersonality(event.target.value)}
                    maxLength={6000}
                    rows={6}
                    placeholder={ar ? 'مثال: تحدث معي باختصار وبأسلوب مهني، ووضح لي الأرقام والنتائج بشكل مباشر...' : 'Example: Be concise, professional, and explain numbers and results clearly...'}
                    className="border-border-default bg-surface-card text-text-primary placeholder:text-text-placeholder min-h-36 resize-y rounded-[10px] border px-3 py-3 text-sm leading-6 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                </label>

                {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

                <div className="border-border-default mt-6 flex justify-end border-t pt-4">
                  <button
                    type="submit"
                    disabled={!name.trim() || saving}
                    className="bg-brand rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (ar ? 'جاري الإنشاء...' : 'Creating...') : ar ? 'إنشاء المساعد' : 'Create assistant'}
                  </button>
                </div>
              </form>
            </section>
          )
        ) : (
          <section className="border-border-default bg-surface-card rounded-card border p-6 sm:p-8">
            <h2 className="text-text-primary text-lg font-bold">{ar ? 'واتس اب Ai' : 'WhatsApp AI'}</h2>
            <p className="text-text-secondary mt-2 text-sm leading-6">
              {ar ? 'سيتم بناء واتس اب Ai كقسم مستقل بعد اكتمال مساعد Ai.' : 'WhatsApp AI will remain a separate section and will be built after the AI Assistant.'}
            </p>
          </section>
        )}

        {error && assistant ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
      {historyOpen ? (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button type="button" aria-label={ar ? 'إغلاق سجل المحادثات' : 'Close conversation history'} className="absolute inset-0 bg-black/35" onClick={() => setHistoryOpen(false)} />
          <aside className={`bg-surface-page absolute inset-y-0 w-[84%] max-w-sm shadow-2xl ${ar ? 'right-0' : 'left-0'} flex flex-col pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]`}>
            <div className="flex items-center justify-between px-4 pb-4">
              <h2 className="text-text-primary text-base font-bold">{ar ? 'المحادثات' : 'Conversations'}</h2>
              <button type="button" onClick={() => setHistoryOpen(false)} className="bg-surface-subtle flex h-10 w-10 items-center justify-center rounded-full" aria-label={ar ? 'إغلاق' : 'Close'}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
            <div className="px-4 pb-3">
              <button type="button" onClick={handleNewConversation} className="bg-brand w-full rounded-[12px] px-4 py-3 text-sm font-semibold text-white">{ar ? '+ محادثة جديدة' : '+ New conversation'}</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3">
              {conversations.length === 0 ? <p className="text-text-secondary px-2 py-6 text-sm">{ar ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p> : conversations.map((conversation) => (
                <button key={conversation.id} type="button" onClick={() => void handleOpenConversation(conversation.id)} disabled={openingConversationId === conversation.id} className={`mb-1 w-full rounded-[12px] px-3 py-3 text-start transition disabled:opacity-50 ${conversationId === conversation.id ? 'bg-brand-surface text-brand' : 'text-text-primary active:bg-surface-subtle'}`}>
                  <span className="block truncate text-sm font-semibold">{conversation.title || (ar ? 'محادثة جديدة' : 'New conversation')}</span>
                  <span className="text-text-secondary mt-1 block text-[11px]">{new Date(conversation.last_message_at).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}
