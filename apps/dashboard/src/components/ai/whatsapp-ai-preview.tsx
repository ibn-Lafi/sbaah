'use client';

import { useState } from 'react';

type Panel = 'none' | 'conversations' | 'settings';
type SettingsView = 'menu' | 'analytics' | 'connection';

const conversations = [
  { name: 'عبدالله محمد', initials: 'عم', text: 'ممتاز، أرسل لي تفاصيل الوحدة الثانية', time: '11:42', unread: 2 },
  { name: 'سارة أحمد', initials: 'سأ', text: 'أحتاج موعد لزيارة المشروع', time: '10:18', unread: 0 },
  { name: 'محمد علي', initials: 'مع', text: 'شكرًا، بانتظار اتصالكم', time: 'أمس', unread: 0 },
];

function Icon({ name, className='h-5 w-5' }: { name:'list'|'settings'|'chart'|'whatsapp'|'search'|'close'|'arrow'|'back'; className?:string }) {
  const p={className,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(name==='list') return <svg {...p}><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>;
  if(name==='settings') return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.5 6A7 7 0 0 0 9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.5 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></svg>;
  if(name==='chart') return <svg {...p}><path d="M5 19V9M12 19V5M19 19v-7"/></svg>;
  if(name==='whatsapp') return <svg {...p}><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.5 2 2 3.5 4 4l1-1 2 1v1.5c0 .6-.5 1-1 1-4 0-7-3-7-7 0-.5.4-1 1-1h1.5l1 2-1 1Z"/></svg>;
  if(name==='search') return <svg {...p}><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
  if(name==='close') return <svg {...p}><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if(name==='back') return <svg {...p}><path d="m15 18-6-6 6-6"/></svg>;
  return <svg {...p}><path d="m9 18 6-6-6-6"/></svg>;
}

function Analytics({ ar }: { ar:boolean }) {
  const stats=[['124',ar?'محادثة':'Conversations'],['31',ar?'عميل مؤهل':'Qualified leads'],['18',ar?'عقار مرسل':'Properties sent'],['9',ar?'موعد':'Appointments']];
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-3">{stats.map(([v,l])=><div key={l} className="border-border-default rounded-[14px] border p-4"><p className="text-text-primary text-2xl font-bold">{v}</p><p className="text-text-secondary mt-1 text-xs">{l}</p></div>)}</div><div className="bg-surface-subtle rounded-[14px] p-4"><p className="text-text-primary text-sm font-bold">{ar?'أداء واتساب Ai':'WhatsApp AI performance'}</p><p className="text-text-secondary mt-2 text-xs leading-6">{ar?'ستظهر هنا التحليلات الحقيقية بعد تشغيل النظام وربط واتساب.':'Live analytics will appear here after WhatsApp is connected.'}</p></div></div>;
}

function ConnectionSettings({ ar }: { ar:boolean }) {
  return <div><div className="flex items-center gap-3"><span className="bg-brand-surface text-brand flex h-12 w-12 items-center justify-center rounded-[14px]"><Icon name="whatsapp" className="h-6 w-6"/></span><div><h3 className="text-text-primary text-sm font-bold">{ar?'ربط واتساب':'WhatsApp connection'}</h3><p className="text-text-secondary mt-1 text-xs">{ar?'لم يتم ربط رقم بعد':'No number connected yet'}</p></div></div><div className="border-border-default mt-5 rounded-[14px] border p-4"><p className="text-text-primary text-sm font-semibold">{ar?'رقم المنشأة':'Business number'}</p><p className="text-text-secondary mt-2 text-xs leading-6">{ar?'سيتم ربط رقم واتساب الرسمي هنا في مرحلة بناء النظام. الوكيل يعمل تلقائيًا بعد اكتمال الربط ولا يحتاج مفاتيح تشغيل إضافية.':'The official WhatsApp number will be connected here during system implementation. The agent runs automatically once connected.'}</p><button type="button" disabled className="bg-brand mt-4 w-full rounded-[10px] px-4 py-2.5 text-sm font-bold text-white opacity-60">{ar?'ربط واتساب — قريبًا':'Connect WhatsApp — soon'}</button></div></div>;
}

export function WhatsAppAiPreview({ ar }: { ar:boolean }) {
  const [selected,setSelected]=useState(0);
  const [panel,setPanel]=useState<Panel>('none');
  const [settingsView,setSettingsView]=useState<SettingsView>('menu');
  const c=conversations[selected] ?? conversations[0]!;

  const closePanel=()=>{setPanel('none');setSettingsView('menu');};
  const openSettings=()=>{setPanel('settings');setSettingsView('menu');};

  return <div className="relative flex min-h-0 flex-1">
    <section className="border-border-default bg-surface-card flex min-h-[600px] w-full flex-1 overflow-hidden rounded-card border sm:min-h-[650px]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border-default flex h-[70px] shrink-0 items-center gap-3 border-b px-3 sm:px-5">
          <span className="bg-brand-surface text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">{c.initials}</span>
          <div className="min-w-0 flex-1"><h2 className="text-text-primary truncate text-sm font-bold">{c.name}</h2><p className="text-text-secondary mt-0.5 truncate text-[11px]">{ar?'واتساب · Ai يعمل تلقائيًا':'WhatsApp · AI active'}</p></div>
          <button type="button" onClick={()=>setPanel('conversations')} aria-label={ar?'المحادثات':'Conversations'} className="bg-surface-subtle text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-brand-surface hover:text-brand"><Icon name="list"/></button>
        </header>

        <div className="bg-surface-page min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="mx-auto max-w-2xl space-y-3">
            <div className="bg-surface-card text-text-primary me-auto max-w-[86%] rounded-[17px] rounded-es-[5px] border border-border-default px-4 py-3 text-sm leading-6">{ar?'السلام عليكم، أدور شقة تمليك في جدة 4 غرف وميزانيتي حول 900 ألف.':'Hi, I am looking for a 4-bedroom apartment in Jeddah around 900k.'}<p className="text-text-secondary mt-1 text-[10px]">11:37</p></div>
            <div className="bg-brand ms-auto max-w-[86%] rounded-[17px] rounded-ee-[5px] px-4 py-3 text-sm leading-6 text-white">{ar?'وعليكم السلام عبدالله. وجدت لك خيارات قريبة من طلبك، ومنها وحدة في مشروع أكنان بسعر 875,000 ريال. أرسل لك التفاصيل؟':'Hi Abdullah. I found options close to your request, including a unit in Aknan at 875,000 SAR. Want the details?'}<p className="mt-1 text-[10px] text-white/70">11:39 ✓✓</p></div>
            <div className="bg-surface-card text-text-primary me-auto max-w-[86%] rounded-[17px] rounded-es-[5px] border border-border-default px-4 py-3 text-sm leading-6">{c.text}<p className="text-text-secondary mt-1 text-[10px]">11:42</p></div>
          </div>
        </div>

        <div className="border-border-default bg-surface-card shrink-0 border-t p-3 sm:p-4"><div className="bg-surface-subtle flex h-12 items-center rounded-full px-4"><span className="text-text-placeholder truncate text-sm">{ar?'اكتب رسالة...':'Write a message...'}</span><span className="bg-brand ms-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"><Icon name="arrow" className="h-4 w-4"/></span></div></div>
      </div>

      <aside className="border-border-default hidden w-[270px] shrink-0 border-s p-5 xl:block">
        <div className="text-center"><span className="bg-brand-surface text-brand mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold">{c.initials}</span><h3 className="text-text-primary mt-3 text-sm font-bold">{c.name}</h3><p className="text-text-secondary mt-1 text-xs" dir="ltr">+966 5X XXX XXXX</p></div>
        <div className="border-border-default mt-5 border-t pt-4"><p className="text-text-secondary text-[11px] font-semibold">{ar?'ملخص العميل':'Customer summary'}</p><p className="text-text-primary mt-2 text-xs leading-6">{ar?'عميل محتمل يبحث عن شقة تمليك في جدة، 4 غرف وبميزانية حتى 900 ألف.':'Prospect looking for a 4-bedroom apartment in Jeddah up to 900k.'}</p></div>
        <div className="mt-4 space-y-2"><div className="bg-surface-subtle rounded-[10px] p-3"><p className="text-text-secondary text-[10px]">{ar?'الحالة':'Status'}</p><p className="text-text-primary mt-1 text-xs font-bold">{ar?'عميل محتمل':'Prospect'}</p></div><div className="bg-surface-subtle rounded-[10px] p-3"><p className="text-text-secondary text-[10px]">{ar?'الاهتمام':'Interest'}</p><p className="text-text-primary mt-1 text-xs font-bold">{ar?'شراء · شقة':'Buy · Apartment'}</p></div></div>
      </aside>
    </section>

    {panel!=='none'?<div className="absolute inset-0 z-30 overflow-hidden rounded-card">
      <button type="button" aria-label={ar?'إغلاق':'Close'} onClick={closePanel} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"/>
      <aside className="border-border-default bg-surface-card absolute inset-y-0 left-0 flex w-[88%] max-w-[390px] flex-col border-e shadow-xl">
        {panel==='conversations'?<>
          <div className="border-border-default flex h-[70px] shrink-0 items-center gap-3 border-b px-4"><button type="button" onClick={closePanel} className="bg-surface-subtle text-text-primary flex h-10 w-10 items-center justify-center rounded-full"><Icon name="close"/></button><h3 className="text-text-primary ms-auto text-base font-bold">{ar?'المحادثات':'Conversations'}</h3></div>
          <div className="p-3"><div className="bg-surface-subtle text-text-secondary flex h-10 items-center gap-2 rounded-[11px] px-3"><Icon name="search" className="h-4 w-4"/><span className="text-xs">{ar?'بحث في المحادثات':'Search conversations'}</span></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2">{conversations.map((item,index)=><button key={item.name} type="button" onClick={()=>{setSelected(index);closePanel();}} className={`mb-1 flex w-full items-center gap-3 rounded-[13px] p-3 text-start ${selected===index?'bg-brand-surface':'hover:bg-surface-subtle'}`}><span className="bg-surface-subtle text-text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold">{item.initials}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-text-primary truncate text-sm font-bold">{item.name}</span>{item.unread>0?<span className="bg-brand ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">{item.unread}</span>:null}</span><span className="text-text-secondary mt-1 block truncate text-xs">{item.text}</span></span><span className="text-text-secondary text-[10px]">{item.time}</span></button>)}</div>
          <div className="border-border-default shrink-0 border-t p-3"><button type="button" onClick={openSettings} className="text-text-primary hover:bg-surface-subtle flex w-full items-center gap-3 rounded-[12px] p-3 text-sm font-bold"><span className="bg-surface-subtle flex h-10 w-10 items-center justify-center rounded-full"><Icon name="settings"/></span>{ar?'الإعدادات':'Settings'}<Icon name="back" className="ms-auto h-4 w-4"/></button></div>
        </>:<>
          <div className="border-border-default flex h-[70px] shrink-0 items-center gap-3 border-b px-4"><button type="button" onClick={()=>{setPanel('conversations');setSettingsView('menu');}} className="bg-surface-subtle text-text-primary flex h-10 w-10 items-center justify-center rounded-full"><Icon name="back"/></button><h3 className="text-text-primary ms-auto text-base font-bold">{settingsView==='analytics'?(ar?'التحليلات':'Analytics'):settingsView==='connection'?(ar?'إعدادات واتساب':'WhatsApp settings'):(ar?'الإعدادات':'Settings')}</h3></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {settingsView==='menu'?<div className="space-y-2"><button type="button" onClick={()=>setSettingsView('analytics')} className="border-border-default flex w-full items-center gap-3 rounded-[14px] border p-4 text-start"><span className="bg-brand-surface text-brand flex h-11 w-11 items-center justify-center rounded-[13px]"><Icon name="chart"/></span><span><span className="text-text-primary block text-sm font-bold">{ar?'التحليلات':'Analytics'}</span><span className="text-text-secondary mt-1 block text-xs">{ar?'أداء المحادثات والعملاء':'Conversations and customer performance'}</span></span><Icon name="back" className="text-text-secondary ms-auto h-4 w-4"/></button><button type="button" onClick={()=>setSettingsView('connection')} className="border-border-default flex w-full items-center gap-3 rounded-[14px] border p-4 text-start"><span className="bg-brand-surface text-brand flex h-11 w-11 items-center justify-center rounded-[13px]"><Icon name="whatsapp"/></span><span><span className="text-text-primary block text-sm font-bold">{ar?'إعدادات واتساب':'WhatsApp settings'}</span><span className="text-text-secondary mt-1 block text-xs">{ar?'الرقم والاتصال':'Number and connection'}</span></span><Icon name="back" className="text-text-secondary ms-auto h-4 w-4"/></button></div>:settingsView==='analytics'?<Analytics ar={ar}/>:<ConnectionSettings ar={ar}/>}
          </div>
        </>}
      </aside>
    </div>:null}
  </div>;
}
