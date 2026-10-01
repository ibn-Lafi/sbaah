'use client';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { createAiConversation, decideAiAction, getAiAssistant, getAiConversation, listAiConversations, saveAiAssistant, sendAiMessage, getAiCredits, type AiCreditBalance, type AiAssistant, type AiConversation, type AiMessage } from '@/lib/api/ai';
import { WhatsAppAiPreview } from '@/components/ai/whatsapp-ai-preview';

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
        if(tool.name==='create_lead'&&result.duplicate_phone===true&&result.existing_lead&&typeof result.existing_lead==='object'){
          const lead=result.existing_lead as Record<string,unknown>;
          return <a key={`duplicate-${index}`} href={`/leads/${String(lead.id)}`} className="block rounded-[12px] border border-warning bg-warning-surface p-3"><p className="text-xs font-semibold text-warning">{ar?'رقم الجوال مسجل مسبقًا':'Phone already exists'}</p><p className="mt-1 font-bold text-text-primary">{String(lead.full_name??'')}</p><p className="mt-1 text-xs text-text-secondary" dir="ltr">{String(lead.phone??'')}</p></a>;
        }
        if (tool.name === 'get_portfolio_summary') {
          const stats = [
            [ar ? 'العملاء' : 'Leads', result.leads, '/leads'],
            [ar ? 'المشاريع' : 'Projects', result.projects, '/projects'],
            [ar ? 'العقارات' : 'Properties', result.listings, '/listings'],
          ];
          return (
            <div key={`summary-${index}`} className="grid grid-cols-3 gap-2">
              {stats.map(([label, value, href]) => (
                <a key={String(label)} href={String(href)} className="border-border-default bg-surface-card hover:border-brand/40 hover:bg-brand-surface rounded-[12px] border p-3 text-center transition">
                  <div className="text-brand text-lg font-bold">{typeof value === 'number' ? value : 0}</div>
                  <div className="text-text-secondary mt-0.5 text-[11px] font-medium">{String(label)}</div>
                </a>
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
                <a key={entityId} href={href} className="border-border-default bg-surface-card hover:border-brand/40 hover:bg-brand-surface block rounded-[12px] border px-3.5 py-3 transition">
                  {card}
                </a>
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

function LeadDraftCard({metadata,ar,busy,onDecision}:{metadata:Record<string,unknown>;ar:boolean;busy:boolean;onDecision:(decision:'confirm'|'cancel',input?:Record<string,unknown>)=>void}){
  const initial=(metadata.pending_action_input&&typeof metadata.pending_action_input==='object'?metadata.pending_action_input:{}) as Record<string,unknown>;
  const[form,setForm]=useState<Record<string,unknown>>(initial);
  const status=metadata.pending_action_status;
  const set=(key:string,value:string)=>setForm(current=>({...current,[key]:value||null}));
  if(status==='succeeded'){const leadId=typeof metadata.created_lead_id==='string'?metadata.created_lead_id:null;return <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800"><p className="font-semibold">{ar?'تمت إضافة العميل بنجاح':'Customer added successfully'}</p>{leadId&&<a href={`/leads/${leadId}`} className="mt-2 inline-block text-xs font-semibold underline">{ar?'فتح ملف العميل':'Open customer'}</a>}</div>}
  if(status==='cancelled')return <p className="mt-3 border-t border-border-default pt-3 text-xs font-semibold text-text-secondary">{ar?'تم إلغاء المسودة':'Draft cancelled'}</p>;
  return <div className="mt-3 rounded-xl border border-border-default bg-surface-card p-3 text-text-primary"><div className="mb-3"><p className="font-bold">{ar?'مراجعة بيانات العميل':'Review customer'}</p><p className="mt-1 text-xs text-text-secondary">{ar?'يمكنك تعديل أي حقل قبل الحفظ.':'Edit any field before saving.'}</p></div><div className="grid gap-2 sm:grid-cols-2"><input value={String(form.full_name??'')} onChange={e=>set('full_name',e.target.value)} placeholder={ar?'الاسم':'Name'} className="rounded-lg border border-border-default px-3 py-2 text-sm"/><input value={String(form.phone??'')} onChange={e=>set('phone',e.target.value)} placeholder={ar?'الجوال':'Phone'} dir="ltr" className="rounded-lg border border-border-default px-3 py-2 text-sm"/><input value={String(form.email??'')} onChange={e=>set('email',e.target.value)} placeholder={ar?'البريد الإلكتروني':'Email'} dir="ltr" className="rounded-lg border border-border-default px-3 py-2 text-sm"/><select value={String(form.customer_relationship??'')} onChange={e=>set('customer_relationship',e.target.value)} className="rounded-lg border border-border-default px-3 py-2 text-sm"><option value="">{ar?'عميل محتمل':'Prospect'}</option><option value="purchase">{ar?'مشترٍ':'Buyer'}</option><option value="tenant">{ar?'مستأجر':'Tenant'}</option><option value="owner">{ar?'مالك':'Owner'}</option><option value="former">{ar?'عميل سابق':'Former customer'}</option></select><input value={String(form.follow_up_at??'')} onChange={e=>set('follow_up_at',e.target.value)} placeholder={ar?'موعد المتابعة ISO':'Follow-up ISO'} className="rounded-lg border border-border-default px-3 py-2 text-sm sm:col-span-2"/><textarea value={String(form.notes??'')} onChange={e=>set('notes',e.target.value)} placeholder={ar?'ملاحظات':'Notes'} rows={2} className="rounded-lg border border-border-default px-3 py-2 text-sm sm:col-span-2"/></div><div className="mt-3 flex gap-2 border-t border-border-default pt-3"><button type="button" disabled={busy||!String(form.full_name??'').trim()||!String(form.phone??'').trim()} onClick={()=>onDecision('confirm',form)} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{ar?'إضافة العميل':'Add customer'}</button><button type="button" disabled={busy} onClick={()=>onDecision('cancel')} className="rounded-lg border border-border-default px-3 py-2 text-xs font-semibold disabled:opacity-50">{ar?'إلغاء':'Cancel'}</button></div></div>;
}

export default function AppsPage() {
  const { me, accessToken } = useCurrentUser();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const [section, setSection] = useState<Section>('assistant');
  const [mobileFullscreen, setMobileFullscreen] = useState(false);
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
  const [thinkingStage, setThinkingStage] = useState(0);
  const [decidingActionId, setDecidingActionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditType, setCreditType] = useState<'whatsapp' | 'agent' | null>(null);
  const [creditBalances, setCreditBalances] = useState<{ whatsapp_message: AiCreditBalance; ai_agent: AiCreditBalance } | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsError, setCreditsError] = useState('');
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

  useEffect(() => {
    if (!sending) {
      setThinkingStage(0);
      return;
    }
    setThinkingStage(0);
    const timers = [
      window.setTimeout(() => setThinkingStage(1), 2200),
      window.setTimeout(() => setThinkingStage(2), 5200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [sending]);


  async function loadCredits() {
    setCreditsLoading(true);
    setCreditsError('');
    try {
      const data = await getAiCredits(accessToken);
      setCreditBalances(data.balances);
    } catch {
      setCreditsError(ar ? 'تعذر تحميل الرصيد.' : 'Could not load credits.');
    } finally {
      setCreditsLoading(false);
    }
  }

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
      if (creditBalances) void loadCredits();
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

  async function handleActionDecision(actionId: string, decision: 'confirm' | 'cancel', input?:Record<string,unknown>) {
    if (decidingActionId) return;
    setDecidingActionId(actionId);
    setError('');
    try {
      const response=await decideAiAction(accessToken, actionId, decision, input);
      setMessages((current) => current.map((message) => {
        if (message.sender !== 'assistant' || message.metadata?.pending_action_id !== actionId) return message;
        const result=response.result&&typeof response.result==='object'?response.result as Record<string,unknown>:{};const lead=result.lead&&typeof result.lead==='object'?result.lead as Record<string,unknown>:{};
        return { ...message, metadata: { ...message.metadata, pending_action_status: decision === 'confirm' ? 'succeeded' : 'cancelled',created_lead_id:typeof lead.id==='string'?lead.id:undefined } };
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
    <AppShell title={ar ? 'سبعة Ai' : 'Sbaah AI'} orgName={me.tenant.name_ar} accountType={me.tenant.account_type} mobileImmersive={mobileFullscreen}>
      <div className={`mx-auto flex min-h-0 w-full max-w-5xl flex-col overflow-hidden ${mobileFullscreen ? 'h-dvh' : 'h-[calc(100dvh-8.5rem)]'}`}>
        <div className={`mb-4 flex w-full shrink-0 items-center gap-2 sm:mb-5 ${mobileFullscreen ? 'px-3 pt-[calc(env(safe-area-inset-top)+12px)]' : ''}`}>
          <button type="button" onClick={() => setMobileFullscreen((value) => !value)} aria-label={mobileFullscreen ? (ar ? 'إظهار واجهة النظام' : 'Show dashboard navigation') : (ar ? 'ملء الشاشة' : 'Full screen')} title={mobileFullscreen ? (ar ? 'إظهار واجهة النظام' : 'Show dashboard navigation') : (ar ? 'ملء الشاشة' : 'Full screen')} className={`bg-surface-subtle text-text-primary flex shrink-0 items-center justify-center transition active:scale-95 md:hidden ${mobileFullscreen ? 'h-12 w-12 rounded-[14px]' : 'h-10 w-10 rounded-[11px]'}` }>
            {mobileFullscreen ? <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>}
          </button>
          <div className={`bg-surface-subtle grid min-w-0 flex-1 grid-cols-2 ${mobileFullscreen ? 'h-12 rounded-[14px] p-1.5' : 'rounded-[12px] p-1'}` }>
            {([
              ['assistant', ar ? 'مساعد Ai' : 'AI Assistant'],
              ['whatsapp', ar ? 'واتس اب Ai' : 'WhatsApp AI'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setSection(value)} aria-pressed={section === value} className={`${mobileFullscreen ? 'h-9 rounded-[10px] px-2.5 text-[13px]' : 'h-9 rounded-[9px] px-2 text-xs'} font-semibold transition sm:h-10 sm:px-3 sm:text-sm ${section === value ? 'bg-surface-card text-text-primary border-border-default border shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setCreditType(null); setCreditsOpen(true); void loadCredits(); }} aria-label={ar ? 'الرصيد' : 'Credits'} className={`bg-brand flex shrink-0 items-center justify-center text-white shadow-sm transition active:scale-95 sm:h-11 sm:w-11 ${mobileFullscreen ? 'h-12 w-12 rounded-[14px]' : 'h-10 w-10 rounded-[11px]'}` }>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="3"/><path d="M16 10h4.5v4H16a2 2 0 1 1 0-4ZM7 6V4.5h9V6"/></svg>
          </button>
        </div>

        {creditsOpen ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 sm:p-5" role="dialog" aria-modal="true">
            <button type="button" aria-label={ar ? 'إغلاق' : 'Close'} onClick={() => { setCreditsOpen(false); setCreditType(null); }} className="absolute inset-0" />
            <section className="bg-surface-card relative z-10 flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-[22px] shadow-2xl">
              <header className="border-border-default flex shrink-0 items-start gap-3 border-b px-4 py-4 sm:px-5">
                {creditType ? <button type="button" onClick={() => setCreditType(null)} className="bg-surface-subtle text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full" aria-label={ar ? 'رجوع' : 'Back'}><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button> : null}
                <div className="min-w-0 flex-1"><h2 className="text-text-primary text-lg font-bold">{creditType ? (ar ? 'شحن الرصيد' : 'Top up credits') : (ar ? 'رصيد سبعة Ai' : 'Sbaah AI credits')}</h2><p className="text-text-secondary mt-1 text-xs leading-5">{creditType ? (ar ? 'اختر الباقة وطريقة الدفع.' : 'Choose a package and payment method.') : (ar ? 'رصيد الرسائل والـ Ai في مكان واحد.' : 'WhatsApp and AI credits in one place.')}</p></div>
                <button type="button" onClick={() => { setCreditsOpen(false); setCreditType(null); }} className="bg-surface-subtle text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full" aria-label={ar ? 'إغلاق' : 'Close'}><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
              </header>
              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                {!creditType ? <div className="space-y-3">{creditsError ? <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{creditsError}</p> : null}
                  {([
                    ['whatsapp', ar ? 'رصيد رسائل واتساب' : 'WhatsApp message credits', ar ? 'لإرسال واستقبال رسائل العملاء' : 'For customer WhatsApp messages'],
                    ['agent', ar ? 'رصيد Ai Agent' : 'AI Agent credits', ar ? 'لاستخدام الوكلاء والردود الذكية' : 'For agents and AI responses'],
                  ] as const).map(([type,title,desc]) => <div key={type} className="border-border-default rounded-[16px] border p-4 sm:p-5"><div className="flex items-start gap-3"><span className="bg-brand-surface text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]">{type==='whatsapp'?<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.5 2 2 3.5 4 4"/></svg>:<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="7" width="14" height="11" rx="3"/><path d="M9 12h.01M15 12h.01M9 15h6M12 7V4M10 4h4"/></svg>}</span><div className="min-w-0 flex-1"><h3 className="text-text-primary text-sm font-bold">{title}</h3><p className="text-text-secondary mt-1 text-xs">{desc}</p><p className="text-text-primary mt-3 text-xl font-bold">{creditsLoading ? '…' : (type === 'whatsapp' ? creditBalances?.whatsapp_message.balance : creditBalances?.ai_agent.balance)?.toLocaleString(ar ? 'ar-SA' : 'en-US') ?? '0'} <span className="text-text-secondary text-xs font-medium">{ar ? 'كريدت متاح' : 'credits available'}</span></p></div></div><button type="button" onClick={() => setCreditType(type)} className="bg-brand mt-4 w-full rounded-[11px] px-4 py-2.5 text-sm font-bold text-white">{ar ? 'شحن الرصيد +' : 'Top up +'}</button></div>)}
                </div> : <div className="space-y-3">
                  {[
                    ['basic', creditType==='whatsapp'?'10,000':'1,000','50'],
                    ['normal', creditType==='whatsapp'?'25,000':'2,500','100'],
                    ['advanced', creditType==='whatsapp'?'50,000':'5,000','180'],
                    ['professional', creditType==='whatsapp'?'100,000':'10,000','300'],
                  ].map(([plan,amount,price]) => <button type="button" key={plan} className="border-border-default hover:border-brand/50 flex w-full items-center justify-between rounded-[15px] border-2 px-4 py-4 text-start transition"><span><span className="text-text-primary block text-sm font-bold">{plan}</span><span className="text-text-secondary mt-1 block text-xs">{amount} {creditType==='whatsapp'?(ar?'رسالة':'messages'):(ar?'كريدت':'credits')}</span></span><span className="text-brand text-base font-bold">SAR {price}.00</span></button>)}
                  <div className="pt-2"><p className="text-text-primary mb-2 text-sm font-bold">{ar ? 'طريقة الدفع' : 'Payment method'}</p><div className="border-border-default rounded-[14px] border-2 p-4 text-center text-sm font-semibold">{ar ? 'بنك الراجحي' : 'Al Rajhi Bank'}</div></div>
                  <button type="button" disabled className="bg-brand mt-2 w-full rounded-[12px] px-4 py-3 text-sm font-bold text-white opacity-60">{ar ? 'تأكيد والدفع — قريبًا' : 'Confirm & pay — soon'}</button>
                </div>}
              </div>
            </section>
          </div>
        ) : null}

        {section === 'assistant' ? (
          loading ? (
            <div className="border-border-default bg-surface-card rounded-card border p-6">
              <div className="bg-surface-subtle h-5 w-32 animate-pulse rounded" />
              <div className="bg-surface-subtle mt-3 h-4 w-64 max-w-full animate-pulse rounded" />
            </div>
          ) : assistant ? (
            <div className="flex min-h-0 flex-1 gap-3">
              <section className="border-border-default bg-surface-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border">
              <header className="border-border-default flex shrink-0 items-center gap-3 border-b px-4 py-4 sm:px-5">
                <div className="bg-brand-surface text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {assistant.name.trim().slice(0, 1) || 'Ai'}
                </div>
                <div className="min-w-0">
                  <h1 className="text-text-primary truncate text-base font-bold">{assistant.name}</h1>
                  <p className="text-text-secondary text-xs">{ar ? 'مساعدك في سبعة' : 'Your Sbaah assistant'}</p>
                </div>
                <div className="ms-auto flex items-center gap-2">
                  <span className="hidden items-center gap-1.5 text-xs font-medium text-emerald-700 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {ar ? 'نشط' : 'Active'}
                  </span>
                  <button type="button" onClick={() => setHistoryOpen(true)} aria-label={ar ? 'سجل المحادثات' : 'Conversation history'} className="text-text-primary bg-surface-subtle flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M13 9h4M13 13h4"/></svg>
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
                {messages.length === 0 ? (
                  <div className="m-auto max-w-md text-center">
                    <h2 className="text-text-primary text-lg font-bold">
                      {ar ? `مرحبًا، أنا ${assistant.name}` : `Hi, I'm ${assistant.name}`}
                    </h2>
                    <p className="text-text-secondary mt-2 text-sm leading-6">
                      {ar ? 'ابدأ محادثتك مع مساعدك.' : 'Start a conversation with your assistant.'}
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
                          message.metadata.pending_action_tool==='create_lead'?<LeadDraftCard metadata={message.metadata} ar={ar} busy={decidingActionId===message.metadata.pending_action_id} onDecision={(decision,input)=>void handleActionDecision(message.metadata.pending_action_id as string,decision,input)}/>:<div className="border-border-default mt-3 flex flex-wrap gap-2 border-t pt-3">
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
                      <div role="status" aria-live="polite" aria-label={ar ? 'المساعد يعمل على الرد' : 'Assistant is working on the response'} className="me-auto flex min-h-11 items-center gap-3 rounded-[16px] bg-surface-subtle px-4 py-3">
                        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                          <span className="absolute h-5 w-5 animate-ping rounded-full bg-brand/15" />
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
                        </span>
                        <span className="text-text-secondary text-sm font-medium">
                          {thinkingStage === 0
                            ? (ar ? 'جاري التفكير' : 'Thinking')
                            : thinkingStage === 1
                              ? (ar ? 'أراجع طلبك' : 'Reviewing your request')
                              : (ar ? 'أرتب النتيجة' : 'Preparing the result')}
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

              {historyOpen ? (
                <div className="absolute inset-0 z-40 overflow-hidden rounded-card">
                  <button type="button" aria-label={ar ? 'إغلاق سجل المحادثات' : 'Close conversation history'} className="absolute inset-0 bg-black/20" onClick={() => setHistoryOpen(false)} />
                  <aside className={`bg-surface-page absolute inset-y-0 w-[86%] max-w-sm shadow-xl ${ar ? 'left-0' : 'right-0'} flex flex-col`}>
                    <div className="border-border-default flex items-center justify-between border-b px-4 py-3">
                      <h2 className="text-text-primary text-sm font-bold">{ar ? 'سجل المحادثات' : 'Conversation history'}</h2>
                      <button type="button" onClick={() => setHistoryOpen(false)} className="bg-surface-subtle flex h-10 w-10 items-center justify-center rounded-full" aria-label={ar ? 'إغلاق' : 'Close'}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                      {conversations.length === 0 ? <p className="text-text-secondary px-2 py-6 text-sm">{ar ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p> : conversations.map((conversation) => (
                        <button key={conversation.id} type="button" onClick={() => void handleOpenConversation(conversation.id)} disabled={openingConversationId === conversation.id} className={`mb-1 w-full rounded-[12px] px-3 py-3 text-start transition disabled:opacity-50 ${conversationId === conversation.id ? 'bg-brand-surface text-brand' : 'text-text-primary hover:bg-surface-subtle'}`}>
                          <span className="block truncate text-sm font-semibold">{conversation.title || (ar ? 'محادثة جديدة' : 'New conversation')}</span>
                          <span className="text-text-secondary mt-1 block text-[11px]">{new Date(conversation.last_message_at).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}</span>
                        </button>
                      ))}
                    </div>
                    <div className="border-border-default flex shrink-0 justify-end border-t p-3">
                      <button type="button" onClick={handleNewConversation} className="bg-brand rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white">
                        {ar ? 'محادثة جديدة' : 'New conversation'}
                      </button>
                    </div>
                  </aside>
                </div>
              ) : null}

              <form onSubmit={(event) => void handleSend(event)} className="shrink-0 px-3 pb-[max(1.15rem,env(safe-area-inset-bottom))] pt-2 md:px-5 md:pb-5 md:pt-3">
                <div className="bg-surface-subtle flex min-h-[54px] w-full items-end gap-2 rounded-[999px] px-2 py-1.5 shadow-sm ring-1 ring-border-default md:min-h-[58px] md:px-2.5 md:py-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={1}
                    placeholder={ar ? `اكتب رسالة إلى ${assistant.name}...` : `Message ${assistant.name}...`}
                    className="text-text-primary placeholder:text-text-placeholder max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-[11px] text-[15px] leading-5 outline-none md:min-h-[42px] md:text-sm"
                  />
                  <button type="submit" disabled={!draft.trim() || sending} aria-label={ar ? 'إرسال' : 'Send'} className="bg-brand flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-white shadow-sm transition active:scale-95 disabled:opacity-40 md:h-[42px] md:w-[42px]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" /></svg>
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
                    ? 'اختر اسم مساعدك وطريقة تعامله معك.'
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
          <WhatsAppAiPreview ar={ar} />
        )}

        {error && assistant ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </AppShell>
  );
}
