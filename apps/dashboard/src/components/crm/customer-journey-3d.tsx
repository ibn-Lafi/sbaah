'use client';

import { useMemo } from 'react';
import type { Customer360Snapshot, LeadWithNotes } from '@/lib/api/leads';

type Stage={id:string;label:string;detail:string;at:string|null;icon:string;active?:boolean};
const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value)):'الآن';
const first=(values:Array<string|null|undefined>)=>values.filter((value):value is string=>Boolean(value)).sort()[0]??null;

function stagesFor(lead:LeadWithNotes,data:Customer360Snapshot):Stage[]{
  const stages:Stage[]=[{id:'start',label:'تواصل أولي',detail:'بداية العلاقة',at:lead.created_at,icon:'☎'}];
  const activity=first(data.activities.map(item=>item.occurred_at));
  if(activity||['contacted','qualified','in_progress','won'].includes(lead.status))stages.push({id:'interest',label:'اهتمام',detail:'تحديد احتياج العميل',at:activity,icon:'✦'});
  const viewing=[...data.viewings].sort((a,b)=>a.scheduled_at.localeCompare(b.scheduled_at))[0];
  if(viewing)stages.push({id:'viewing',label:'معاينة',detail:viewing.outcome?'تم تسجيل نتيجة المعاينة':'معاينة عقارية',at:viewing.scheduled_at,icon:'◉'});
  const reservation=[...data.reservations].sort((a,b)=>a.reserved_at.localeCompare(b.reserved_at))[0];
  if(reservation)stages.push({id:'reservation',label:'حجز',detail:`الحجز ${reservation.reservation_number}`,at:reservation.reserved_at,icon:'⌂'});
  const contract=[...data.contracts].sort((a,b)=>a.start_date.localeCompare(b.start_date))[0];
  if(contract)stages.push({id:'contract',label:'عقد',detail:`العقد ${contract.contract_number}`,at:contract.start_date,icon:'▤'});
  const payment=[...data.payments].filter(item=>item.status==='recorded').sort((a,b)=>a.paid_at.localeCompare(b.paid_at))[0];
  if(payment)stages.push({id:'payment',label:'مدفوعات',detail:'بدء السجل المالي',at:payment.paid_at,icon:'▣'});
  const maintenance=[...data.maintenance].sort((a,b)=>a.opened_at.localeCompare(b.opened_at))[0];
  if(maintenance)stages.push({id:'maintenance',label:'صيانة',detail:maintenance.title,at:maintenance.opened_at,icon:'⌘'});
  if(lead.status==='won'||data.contracts.some(item=>item.status==='active'))stages.push({id:'current',label:'علاقة مستمرة',detail:'العميل نشط حاليًا',at:null,icon:'★',active:true});
  return stages;
}

export function CustomerJourney3D({lead,data}:{lead:LeadWithNotes;data:Customer360Snapshot}){
  const stages=useMemo(()=>stagesFor(lead,data),[lead,data]);
  return <section className="rounded-card border border-border-subtle bg-surface-card p-4 md:p-5">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div><h2 className="font-semibold text-text-primary">رحلة العميل</h2><p className="mt-1 text-xs text-text-secondary">ملخص مرتب لأهم مراحل العلاقة</p></div>
      <span className="rounded-full bg-brand/[.08] px-2.5 py-1 text-xs font-semibold text-brand">{stages.length} مراحل</span>
    </div>
    <div className="relative">
      <div className="absolute bottom-5 end-[21px] top-5 w-px bg-border-default md:bottom-auto md:end-5 md:start-5 md:top-[21px] md:h-px md:w-auto" aria-hidden="true"/>
      <div className="relative grid gap-4 md:grid-flow-col md:auto-cols-fr md:gap-3">
        {stages.map((stage,index)=><div key={stage.id} className="group relative flex min-w-0 items-start gap-3 md:flex-col md:items-start">
          <span className={`relative z-10 grid h-11 w-11 flex-none place-items-center rounded-full border text-sm font-bold transition-transform duration-200 group-hover:scale-105 ${stage.active?'border-brand bg-brand text-white shadow-[0_6px_20px_rgba(104,69,138,.25)]':'border-border-default bg-surface-card text-brand'}`}>{stage.icon}</span>
          <div className="min-w-0 pb-1 md:pe-2">
            <div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-primary">{stage.label}</p>{index===stages.length-1&&<span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>}</div>
            <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{stage.detail}</p>
            <p className="mt-1 text-[11px] text-text-tertiary">{formatDate(stage.at)}</p>
          </div>
        </div>)}
      </div>
    </div>
  </section>;
}
