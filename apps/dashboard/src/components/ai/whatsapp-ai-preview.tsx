'use client';

import { useState } from 'react';

type Tab = 'overview' | 'inbox' | 'agent' | 'knowledge' | 'activity' | 'analytics' | 'settings';

const tabs: Array<{ id: Tab; ar: string; en: string }> = [
  { id: 'overview', ar: 'نظرة عامة', en: 'Overview' },
  { id: 'inbox', ar: 'المحادثات', en: 'Inbox' },
  { id: 'agent', ar: 'الوكيل', en: 'Agent' },
  { id: 'knowledge', ar: 'المعرفة', en: 'Knowledge' },
  { id: 'activity', ar: 'النشاط', en: 'Activity' },
  { id: 'analytics', ar: 'التحليلات', en: 'Analytics' },
  { id: 'settings', ar: 'الإعدادات', en: 'Settings' },
];

const conversations = [
  { name: 'عبدالله محمد', initials: 'عم', text: 'ممتاز، أرسل لي تفاصيل الوحدة الثانية', time: '11:42', unread: 2, status: 'AI' },
  { name: 'سارة أحمد', initials: 'سأ', text: 'أحتاج موعد لزيارة المشروع', time: '10:18', unread: 0, status: 'AI' },
  { name: 'محمد علي', initials: 'مع', text: 'تم تحويل المحادثة للموظف', time: 'أمس', unread: 0, status: 'موظف' },
];

function Icon({ name, className = 'h-5 w-5' }: { name: 'whatsapp' | 'chat' | 'spark' | 'book' | 'pulse' | 'chart' | 'settings' | 'user' | 'calendar' | 'home' | 'arrow' | 'search' | 'more' | 'check'; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'whatsapp') return <svg {...common}><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.5 2 2 3.5 4 4l1-1 2 1v1.5c0 .6-.5 1-1 1-4 0-7-3-7-7 0-.5.4-1 1-1h1.5l1 2-1 1Z"/></svg>;
  if (name === 'chat') return <svg {...common}><path d="M5 5h14v11H9l-4 3V5Z"/><path d="M9 9h6M9 12h4"/></svg>;
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></svg>;
  if (name === 'book') return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21V5.5Z"/></svg>;
  if (name === 'pulse') return <svg {...common}><path d="M4 12h3l2-5 4 10 2-5h5"/></svg>;
  if (name === 'chart') return <svg {...common}><path d="M5 19V9M12 19V5M19 19v-7"/></svg>;
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.5 6A7 7 0 0 0 9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.5 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></svg>;
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M6 20c.5-4 2.5-6 6-6s5.5 2 6 6"/></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>;
  if (name === 'home') return <svg {...common}><path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z"/></svg>;
  if (name === 'arrow') return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
  if (name === 'more') return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></svg>;
  return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
}

function Overview({ ar, onInbox, onSettings }: { ar: boolean; onInbox: () => void; onSettings: () => void }) {
  const stats = [
    ['24', ar ? 'المحادثات اليوم' : 'Conversations today', 'chat'],
    ['8', ar ? 'عملاء محتملون' : 'New leads', 'user'],
    ['5', ar ? 'اهتمامات جديدة' : 'New interests', 'home'],
    ['3', ar ? 'مواعيد' : 'Appointments', 'calendar'],
  ] as const;
  return <div className="space-y-4 sm:space-y-5">
    <section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="bg-brand-surface text-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px]"><Icon name="whatsapp" className="h-6 w-6"/></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-text-primary text-base font-bold">{ar ? 'واتس اب Ai' : 'WhatsApp AI'}</h2><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">{ar ? 'معاينة الواجهة' : 'UI Preview'}</span></div>
          <p className="text-text-secondary mt-1 text-sm leading-6">{ar ? 'وكيل العملاء الذكي المرتبط ببيانات سبعة ومساعد Ai.' : 'Your customer-facing agent connected to Sbaah data and AI Assistant.'}</p>
        </div>
        <button type="button" onClick={onSettings} className="border-border-default bg-surface-card text-text-primary rounded-[10px] border px-4 py-2.5 text-sm font-semibold">{ar ? 'إعداد الواتساب' : 'WhatsApp setup'}</button>
      </div>
    </section>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(([value,label,icon])=><div key={label} className="border-border-default bg-surface-card rounded-card border p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-text-primary text-2xl font-bold">{value}</p><p className="text-text-secondary mt-1 text-xs sm:text-sm">{label}</p></div><span className="bg-surface-subtle text-text-secondary flex h-9 w-9 items-center justify-center rounded-[11px]"><Icon name={icon}/></span></div></div>)}
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
      <section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-text-primary text-sm font-bold">{ar ? 'آخر المحادثات' : 'Recent conversations'}</h3><p className="text-text-secondary mt-1 text-xs">{ar ? 'معاينة لتجربة صندوق الوارد' : 'Inbox experience preview'}</p></div><button type="button" onClick={onInbox} className="text-brand text-xs font-bold">{ar ? 'عرض الكل' : 'View all'}</button></div>
        <div className="divide-border-default divide-y">
          {conversations.map(c=><button type="button" key={c.name} onClick={onInbox} className="flex w-full items-center gap-3 py-3 text-start"><span className="bg-surface-subtle text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">{c.initials}</span><span className="min-w-0 flex-1"><span className="text-text-primary block truncate text-sm font-semibold">{c.name}</span><span className="text-text-secondary mt-0.5 block truncate text-xs">{c.text}</span></span><span className="text-text-secondary text-[11px]">{c.time}</span></button>)}
        </div>
      </section>
      <section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5">
        <h3 className="text-text-primary text-sm font-bold">{ar ? 'حالة الوكيل' : 'Agent status'}</h3>
        <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-emerald-50 p-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/><div><p className="text-sm font-bold text-emerald-800">{ar ? 'جاهز للعمل' : 'Ready'}</p><p className="mt-0.5 text-xs text-emerald-700">{ar ? 'سيتم التفعيل بعد ربط واتساب' : 'Activates after WhatsApp setup'}</p></div></div>
        <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-text-secondary">{ar ? 'الردود بالذكاء الاصطناعي' : 'AI replies'}</span><span className="text-text-primary font-semibold">{ar ? 'مفعلة' : 'On'}</span></div><div className="flex justify-between"><span className="text-text-secondary">{ar ? 'التحويل للموظف' : 'Human handoff'}</span><span className="text-text-primary font-semibold">{ar ? 'مفعل' : 'On'}</span></div><div className="flex justify-between"><span className="text-text-secondary">{ar ? 'التعاون مع مساعد Ai' : 'Assistant collaboration'}</span><span className="text-text-primary font-semibold">{ar ? 'مفعل' : 'On'}</span></div></div>
      </section>
    </div>
  </div>;
}

function Inbox({ ar }: { ar: boolean }) {
  const [selected, setSelected] = useState(0);
  const [mobileChat, setMobileChat] = useState(false);
  const c = conversations[selected] ?? conversations[0]!;
  return <section className="border-border-default bg-surface-card flex min-h-[560px] flex-1 overflow-hidden rounded-card border">
    <aside className={`${mobileChat ? 'hidden md:flex' : 'flex'} border-border-default w-full shrink-0 flex-col border-e md:w-[290px] lg:w-[320px]`}>
      <div className="border-border-default border-b p-3"><div className="bg-surface-subtle text-text-secondary flex h-10 items-center gap-2 rounded-[10px] px-3"><Icon name="search" className="h-4 w-4"/><span className="text-xs">{ar ? 'بحث في المحادثات' : 'Search conversations'}</span></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{conversations.map((item,index)=><button key={item.name} type="button" onClick={()=>{setSelected(index);setMobileChat(true)}} className={`mb-1 flex w-full items-center gap-3 rounded-[12px] p-3 text-start transition ${selected===index?'bg-brand-surface':'hover:bg-surface-subtle'}`}><span className="bg-surface-subtle text-text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold">{item.initials}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-text-primary truncate text-sm font-bold">{item.name}</span>{item.unread>0?<span className="bg-brand ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">{item.unread}</span>:null}</span><span className="text-text-secondary mt-1 block truncate text-xs">{item.text}</span></span></button>)}</div>
    </aside>

    <div className={`${mobileChat ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
      <header className="border-border-default flex h-[65px] shrink-0 items-center gap-3 border-b px-3 sm:px-4">
        <button type="button" onClick={()=>setMobileChat(false)} className="bg-surface-subtle text-text-primary flex h-9 w-9 items-center justify-center rounded-full md:hidden"><Icon name="arrow" className="h-4 w-4 rotate-180"/></button>
        <span className="bg-surface-subtle text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">{c.initials}</span>
        <div className="min-w-0"><h3 className="text-text-primary truncate text-sm font-bold">{c.name}</h3><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>{ar ? 'الوكيل يعمل' : 'AI active'}</p></div>
        <button type="button" className="bg-surface-subtle text-text-secondary ms-auto flex h-9 w-9 items-center justify-center rounded-full"><Icon name="more"/></button>
      </header>
      <div className="bg-surface-page min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="bg-surface-card text-text-primary me-auto max-w-[82%] rounded-[16px] rounded-es-[5px] border border-border-default px-4 py-3 text-sm leading-6">{ar ? 'السلام عليكم، أدور شقة تمليك في جدة 4 غرف وميزانيتي حول 900 ألف.' : 'Hi, I am looking for a 4-bedroom apartment in Jeddah around 900k.'}<p className="text-text-secondary mt-1 text-[10px]">11:37</p></div>
          <div className="bg-brand text-white ms-auto max-w-[82%] rounded-[16px] rounded-ee-[5px] px-4 py-3 text-sm leading-6">{ar ? 'وعليكم السلام عبدالله. وجدت لك خيارات قريبة من طلبك، ومنها وحدة في مشروع أكنان بسعر 875,000 ريال. أرسل لك التفاصيل؟' : 'Hi Abdullah. I found options close to your request, including a unit in Aknan at 875,000 SAR. Want the details?'}<p className="mt-1 text-[10px] text-white/70">11:39 ✓✓</p></div>
          <div className="bg-surface-card text-text-primary me-auto max-w-[82%] rounded-[16px] rounded-es-[5px] border border-border-default px-4 py-3 text-sm leading-6">{c.text}<p className="text-text-secondary mt-1 text-[10px]">11:42</p></div>
          <div className="border-brand/20 bg-brand-surface mx-auto max-w-md rounded-[14px] border p-3 text-center"><p className="text-brand text-xs font-bold">{ar ? 'معاينة' : 'Preview'}</p><p className="text-text-secondary mt-1 text-xs">{ar ? 'عند ربط النظام ستظهر هنا الرسائل والإجراءات الحقيقية.' : 'Real messages and actions will appear here after integration.'}</p></div>
        </div>
      </div>
      <div className="border-border-default bg-surface-card shrink-0 border-t p-3"><div className="bg-surface-subtle flex h-12 items-center rounded-full px-4"><span className="text-text-placeholder text-sm">{ar ? 'اكتب رسالة...' : 'Write a message...'}</span><span className="bg-brand ms-auto flex h-9 w-9 items-center justify-center rounded-full text-white"><Icon name="arrow" className="h-4 w-4"/></span></div></div>
    </div>

    <aside className="border-border-default hidden w-[260px] shrink-0 border-s p-4 xl:block">
      <div className="text-center"><span className="bg-surface-subtle text-text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold">{c.initials}</span><h3 className="text-text-primary mt-3 text-sm font-bold">{c.name}</h3><p className="text-text-secondary mt-1 text-xs" dir="ltr">+966 5X XXX XXXX</p></div>
      <div className="border-border-default mt-5 border-t pt-4"><p className="text-text-secondary text-[11px] font-semibold">{ar ? 'ملخص العميل' : 'Customer summary'}</p><p className="text-text-primary mt-2 text-xs leading-6">{ar ? 'عميل محتمل يبحث عن شقة تمليك في جدة، 4 غرف وبميزانية حتى 900 ألف.' : 'Prospect looking for a 4-bedroom apartment in Jeddah up to 900k.'}</p></div>
      <div className="mt-4 space-y-2"><div className="bg-surface-subtle rounded-[10px] p-3"><p className="text-text-secondary text-[10px]">{ar ? 'الحالة' : 'Status'}</p><p className="text-text-primary mt-1 text-xs font-bold">{ar ? 'عميل محتمل' : 'Prospect'}</p></div><div className="bg-surface-subtle rounded-[10px] p-3"><p className="text-text-secondary text-[10px]">{ar ? 'الاهتمام' : 'Interest'}</p><p className="text-text-primary mt-1 text-xs font-bold">{ar ? 'شراء · شقة' : 'Buy · Apartment'}</p></div></div>
    </aside>
  </section>;
}

function Agent({ ar }: { ar: boolean }) {
  const tools = [ar?'التعرف على العميل وربطه بـ CRM':'Identify customer in CRM',ar?'إنشاء وتحديث الاهتمامات':'Create and update interests',ar?'البحث في المشاريع والعقارات والوحدات':'Search inventory',ar?'إرسال روابط الموقع':'Send website links',ar?'إنشاء المواعيد والمتابعات':'Create appointments and follow-ups',ar?'إنشاء طلبات الصيانة':'Create maintenance requests'];
  return <div className="grid gap-4 lg:grid-cols-[1fr_.72fr]"><section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5"><div className="flex items-start gap-3"><span className="bg-brand-surface text-brand flex h-11 w-11 items-center justify-center rounded-[14px]"><Icon name="spark"/></span><div><h2 className="text-text-primary font-bold">{ar?'وكيل واتساب':'WhatsApp Agent'}</h2><p className="text-text-secondary mt-1 text-sm">{ar?'موظف التواصل الذكي مع عملاء المنشأة.':'Customer-facing AI agent for your business.'}</p></div></div><div className="border-border-default mt-5 border-t pt-5"><h3 className="text-text-primary text-sm font-bold">{ar?'الدور':'Role'}</h3><p className="text-text-secondary mt-2 text-sm leading-7">{ar?'يفهم رسائل العميل، يتعرف عليه من بيانات سبعة، يخدمه من خلال الأنظمة الموجودة، ويتعاون مع مساعد Ai عند الحاجة.':'Understands customer messages, identifies them from Sbaah data, serves them using existing systems, and collaborates with AI Assistant when needed.'}</p></div><div className="mt-5"><h3 className="text-text-primary text-sm font-bold">{ar?'الأدوات المتاحة':'Available tools'}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{tools.map(t=><div key={t} className="bg-surface-subtle flex items-center gap-2 rounded-[11px] p-3 text-xs font-semibold text-text-primary"><span className="text-emerald-600"><Icon name="check" className="h-4 w-4"/></span>{t}</div>)}</div></div></section><section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5"><h3 className="text-text-primary text-sm font-bold">{ar?'التعاون مع مساعد Ai':'AI Assistant collaboration'}</h3><div className="mt-4 rounded-[14px] bg-brand-surface p-4"><div className="flex items-center justify-center gap-3"><span className="bg-surface-card text-brand flex h-12 w-12 items-center justify-center rounded-full shadow-sm"><Icon name="whatsapp"/></span><span className="text-brand">↔</span><span className="bg-surface-card text-brand flex h-12 w-12 items-center justify-center rounded-full shadow-sm"><Icon name="spark"/></span></div><p className="text-text-primary mt-4 text-center text-sm font-bold">{ar?'عقل مشترك، شاشتان منفصلتان':'Shared intelligence, separate experiences'}</p><p className="text-text-secondary mt-2 text-center text-xs leading-6">{ar?'يتبادلان المهام والسياق من خلال سبعة دون دمج واجهتيهما.':'They share tasks and context through Sbaah without merging their interfaces.'}</p></div><div className="mt-4 space-y-2 text-xs"><p className="text-text-secondary">{ar?'الحماية الأساسية':'Core safeguards'}</p>{[ar?'لا وصول مباشر لقاعدة البيانات':'No direct database access',ar?'لا حذف أو تعديل أسعار':'No delete or price changes',ar?'كل إجراء يسجل في النشاط':'Every action is audited'].map(x=><div key={x} className="flex items-center gap-2 text-text-primary"><span className="text-emerald-600"><Icon name="check" className="h-4 w-4"/></span>{x}</div>)}</div></section></div>;
}

function Knowledge({ ar }: { ar: boolean }) { return <section className="border-border-default bg-surface-card rounded-card border"><div className="border-border-default flex items-center justify-between gap-3 border-b p-4 sm:p-5"><div><h2 className="text-text-primary text-sm font-bold">{ar?'مصادر المعرفة':'Knowledge sources'}</h2><p className="text-text-secondary mt-1 text-xs">{ar?'المعلومات الثابتة التي يستخدمها الوكيل في الرد.':'Static information the agent can use in replies.'}</p></div><button type="button" className="bg-brand rounded-[10px] px-3 py-2 text-xs font-bold text-white">{ar?'+ إضافة مصدر':'+ Add source'}</button></div><div className="p-4 sm:p-5"><div className="border-border-default rounded-[14px] border border-dashed p-8 text-center"><span className="bg-surface-subtle text-text-secondary mx-auto flex h-12 w-12 items-center justify-center rounded-[14px]"><Icon name="book"/></span><h3 className="text-text-primary mt-4 text-sm font-bold">{ar?'لا توجد مصادر بعد':'No sources yet'}</h3><p className="text-text-secondary mx-auto mt-2 max-w-md text-xs leading-6">{ar?'لاحقًا ستضيف الأسئلة الشائعة والسياسات والملفات. بيانات العقارات والأسعار ستبقى مباشرة من سبعة وليست من المعرفة.':'Later you can add FAQs, policies, and files. Property data and prices stay live from Sbaah, not the knowledge base.'}</p></div></div></section>; }

function Activity({ ar }: { ar: boolean }) { const rows=[[ar?'تم التعرف على العميل عبدالله محمد':'Identified Abdullah Mohammed',ar?'WhatsApp Ai · CRM':'WhatsApp AI · CRM','11:42'],[ar?'تم البحث عن عقارات مطابقة للاهتمام':'Searched matching properties',ar?'WhatsApp Ai · العقارات':'WhatsApp AI · Properties','11:39'],[ar?'تم إنشاء متابعة وإرسالها لمساعد Ai':'Created follow-up for AI Assistant',ar?'تعاون الوكلاء':'Agent collaboration','10:18']]; return <section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5"><div className="mb-4"><h2 className="text-text-primary text-sm font-bold">{ar?'نشاط الوكيل':'Agent activity'}</h2><p className="text-text-secondary mt-1 text-xs">{ar?'سيظهر هنا كل ما ينفذه الوكيل داخل سبعة.':'Every action performed inside Sbaah will appear here.'}</p></div><div className="space-y-2">{rows.map(([title,sub,time])=><div key={title} className="bg-surface-subtle flex items-center gap-3 rounded-[12px] p-3"><span className="bg-surface-card text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"><Icon name="pulse" className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="text-text-primary truncate text-xs font-bold">{title}</p><p className="text-text-secondary mt-1 text-[11px]">{sub}</p></div><span className="text-text-secondary text-[10px]">{time}</span></div>)}</div></section>; }

function Analytics({ ar }: { ar: boolean }) { return <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['124',ar?'محادثة':'Conversations'],['31',ar?'عميل مؤهل':'Qualified'],['18',ar?'عقار مرسل':'Properties sent'],['9',ar?'موعد':'Appointments']].map(([v,l])=><div key={l} className="border-border-default bg-surface-card rounded-card border p-4"><p className="text-text-primary text-2xl font-bold">{v}</p><p className="text-text-secondary mt-1 text-xs">{l}</p></div>)}</div><section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5"><h2 className="text-text-primary text-sm font-bold">{ar?'رحلة العميل من واتساب':'WhatsApp customer journey'}</h2><div className="mt-5 grid grid-cols-5 gap-1 text-center">{[[124,ar?'محادثة':'Chat'],[47,ar?'عميل':'Lead'],[31,ar?'مؤهل':'Qualified'],[18,ar?'اهتمام':'Interest'],[9,ar?'موعد':'Appointment']].map(([v,l],i)=><div key={String(l)} className="relative"><div className="bg-brand-surface text-brand mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold">{v}</div><p className="text-text-secondary mt-2 text-[9px] sm:text-xs">{l}</p>{i<4?<span className="bg-border-default absolute left-[-50%] top-5 -z-0 h-px w-full"/>:null}</div>)}</div></section></div>; }

function Settings({ ar }: { ar: boolean }) { return <div className="grid gap-4 lg:grid-cols-2"><section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5"><div className="flex items-center gap-3"><span className="bg-brand-surface text-brand flex h-11 w-11 items-center justify-center rounded-[14px]"><Icon name="whatsapp"/></span><div><h2 className="text-text-primary text-sm font-bold">{ar?'اتصال واتساب':'WhatsApp connection'}</h2><p className="text-text-secondary mt-1 text-xs">{ar?'لم يتم ربط رقم بعد':'No number connected yet'}</p></div></div><button type="button" disabled className="bg-brand mt-5 w-full rounded-[10px] px-4 py-2.5 text-sm font-bold text-white opacity-60">{ar?'ربط واتساب — المرحلة القادمة':'Connect WhatsApp — next phase'}</button><p className="text-text-secondary mt-3 text-center text-[11px]">{ar?'زر الربط غير فعال في نسخة الواجهة الحالية.':'Connection is intentionally disabled in this UI-only preview.'}</p></section><section className="border-border-default bg-surface-card rounded-card border p-4 sm:p-5"><h2 className="text-text-primary text-sm font-bold">{ar?'تشغيل الوكيل':'Agent operation'}</h2><div className="mt-4 space-y-3">{[[ar?'الرد التلقائي':'Automatic replies',true],[ar?'التحويل للموظف عند الحاجة':'Human handoff',true],[ar?'التعاون مع مساعد Ai':'AI Assistant collaboration',true]].map(([label,on])=><div key={String(label)} className="flex items-center justify-between gap-3 rounded-[11px] bg-surface-subtle p-3"><span className="text-text-primary text-xs font-semibold">{label}</span><span className={`relative h-6 w-11 rounded-full ${on?'bg-brand':'bg-border-default'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${ar?'right-1':'left-1'}`}/></span></div>)}</div></section></div>; }

export function WhatsAppAiPreview({ ar }: { ar: boolean }) {
  const [tab, setTab] = useState<Tab>('overview');
  const iconFor: Record<Tab, Parameters<typeof Icon>[0]['name']> = { overview:'home', inbox:'chat', agent:'spark', knowledge:'book', activity:'pulse', analytics:'chart', settings:'settings' };
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="-mx-1 mb-4 shrink-0 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mb-5">
      <div className="bg-surface-subtle flex min-w-max rounded-[12px] p-1">
        {tabs.map(item=><button key={item.id} type="button" onClick={()=>setTab(item.id)} className={`flex h-10 items-center gap-2 rounded-[9px] px-3 text-xs font-semibold transition sm:px-4 ${tab===item.id?'border-border-default bg-surface-card text-text-primary border shadow-sm':'text-text-secondary hover:text-text-primary'}`}><Icon name={iconFor[item.id]} className="h-4 w-4"/>{ar?item.ar:item.en}</button>)}
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto pb-2">
      {tab==='overview'?<Overview ar={ar} onInbox={()=>setTab('inbox')} onSettings={()=>setTab('settings')}/>:null}
      {tab==='inbox'?<Inbox ar={ar}/>:null}
      {tab==='agent'?<Agent ar={ar}/>:null}
      {tab==='knowledge'?<Knowledge ar={ar}/>:null}
      {tab==='activity'?<Activity ar={ar}/>:null}
      {tab==='analytics'?<Analytics ar={ar}/>:null}
      {tab==='settings'?<Settings ar={ar}/>:null}
    </div>
  </div>;
}
