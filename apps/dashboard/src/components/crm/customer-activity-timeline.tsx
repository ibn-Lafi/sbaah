'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Customer360Snapshot, LeadWithNotes } from '@/lib/api/leads';
import { formatRelativeTime } from '@/lib/format/date';

type Filter='all'|'crm'|'viewing'|'reservation'|'payment'|'maintenance'|'note';
const labels:Record<Filter,string>={all:'الكل',crm:'CRM',viewing:'المعاينات',reservation:'الحجوزات',payment:'الدفعات',maintenance:'الصيانة',note:'الملاحظات'};
const money=(value:number)=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(value);

export function CustomerActivityTimeline({lead,data}:{lead:LeadWithNotes;data:Customer360Snapshot}){
  const [filter,setFilter]=useState<Filter>('all');
  const [expanded,setExpanded]=useState(false);
  const items=useMemo(()=>[
    ...data.activities.map(a=>({id:'a'+a.id,at:a.occurred_at,title:a.summary,type:'crm' as const,label:'نشاط CRM'})),
    ...data.viewings.map(v=>({id:'v'+v.id,at:v.scheduled_at,title:v.status==='completed'?'اكتملت معاينة العقار':'موعد معاينة عقار',type:'viewing' as const,label:'معاينة'})),
    ...data.reservations.map(r=>({id:'r'+r.id,at:r.reserved_at,title:`حجز #${r.reservation_number}`,type:'reservation' as const,label:'حجز'})),
    ...data.payments.map(p=>({id:'p'+p.id,at:p.paid_at,title:`تم تسجيل دفعة بقيمة ${money(Number(p.amount))}`,type:'payment' as const,label:'دفعة'})),
    ...data.maintenance.map(m=>({id:'m'+m.id,at:m.opened_at,title:`طلب صيانة: ${m.title}`,type:'maintenance' as const,label:'صيانة'})),
    ...lead.lead_notes.map(n=>({id:'n'+n.id,at:n.created_at,title:n.note_text,type:'note' as const,label:'ملاحظة'})),
  ].sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime()),[data,lead.lead_notes]);

  const filtered=filter==='all'?items:items.filter(i=>i.type===filter);
  const shown=expanded?filtered:filtered.slice(0,8);

  return <Card className="p-3 md:p-5">
    <div className="mb-3 flex items-center justify-between gap-2 md:mb-4"><div><h2 className="font-semibold text-text-primary">سجل العميل</h2><p className="mt-0.5 text-[11px] text-text-secondary md:mt-1 md:text-xs">رحلة العميل الفعلية من أحدث حدث إلى البداية.</p></div><span className="text-xs text-text-secondary">{items.length} حدث</span></div>
    <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1 md:mb-5">{(Object.keys(labels) as Filter[]).map(key=><button key={key} type="button" onClick={()=>{setFilter(key);setExpanded(false)}} className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] transition-colors md:px-3 md:py-1.5 md:text-xs ${filter===key?'border-brand bg-brand text-white':'border-border-default bg-surface-card text-text-secondary hover:border-brand'}`}>{labels[key]}</button>)}</div>
    {shown.length===0?<p className="text-sm text-text-secondary">لا توجد أحداث ضمن هذا التصنيف.</p>:<div className="flex flex-col">{shown.map((item,index)=><div key={item.id} className="relative flex gap-2.5 pb-4 last:pb-0 md:gap-3 md:pb-5"><div className="flex w-3 flex-col items-center"><span className="mt-1.5 h-2 w-2 rounded-full bg-brand ring-4 ring-brand/[.08] md:h-2.5 md:w-2.5"/>{index<shown.length-1&&<span className="mt-1 w-px flex-1 bg-border-subtle"/>}</div><div className="min-w-0"><p className="text-xs text-text-secondary">{item.label}</p><p className="mt-0.5 text-[13px] font-medium leading-5 text-text-primary md:text-sm">{item.title}</p><p className="mt-1 text-xs text-text-secondary">{formatRelativeTime(item.at)}</p></div></div>)}</div>}
    {filtered.length>8&&<Button variant="secondary" className="mt-4 w-full" onClick={()=>setExpanded(v=>!v)}>{expanded?'عرض أحدث 8 أحداث':`عرض السجل الكامل (${filtered.length})`}</Button>}
  </Card>;
}
