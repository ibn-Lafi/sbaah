'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Customer360Snapshot, LeadWithNotes } from '@/lib/api/leads';
import { formatRelativeTime } from '@/lib/format/date';

const money=(value:number)=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(value);
type TimelineItem={id:string;at:string;title:string;type:'interest'|'crm'|'viewing'|'reservation'|'deal'|'lease'|'payment'|'maintenance'|'note';label:string;assetId?:string;assetName?:string};

export function CustomerActivityTimeline({lead,data}:{lead:LeadWithNotes;data:Customer360Snapshot}){
  const [expanded,setExpanded]=useState(false);
  const items=useMemo(()=>{
    const assetContext=(links?:Array<{asset_id:string;assets?:{id:string;name_ar:string;unit_number:string|null}|null}>)=>{
      const asset=links?.find(link=>link.assets)?.assets;
      return asset?{assetId:asset.id,assetName:`${asset.name_ar}${asset.unit_number?` · وحدة ${asset.unit_number}`:''}`}:{assetId:undefined,assetName:undefined};
    };
    const timelineItems: TimelineItem[]=[
      ...data.interests.map(i=>({id:'i'+i.id,at:i.created_at,title:'تم تسجيل اهتمام عقاري',type:'interest' as const,label:'اهتمام',assetId:i.assets?.id,assetName:i.assets?.name_ar ?? i.listings?.title_ar ?? i.unit_types?.name_ar ?? i.projects?.name_ar})),
      ...data.activities.map(a=>({id:'a'+a.id,at:a.occurred_at,title:a.summary,type:'crm' as const,label:'نشاط CRM'})),
      ...data.viewings.map(v=>({id:'v'+v.id,at:v.scheduled_at,title:v.status==='completed'?'اكتملت معاينة العقار':'موعد معاينة عقار',type:'viewing' as const,label:'معاينة',assetId:v.assets?.id,assetName:v.assets?.name_ar})),
      ...data.reservations.map(r=>({id:'r'+r.id,at:r.reserved_at,title:`حجز #${r.reservation_number}`,type:'reservation' as const,label:'حجز',...assetContext(r.reservation_assets)})),
      ...data.deals.map(d=>({id:'d'+d.id,at:d.updated_at??d.created_at??d.expected_close_date??new Date(0).toISOString(),title:d.status==='won'?'اكتملت الصفقة العقارية':'تحديث صفقة عقارية',type:'deal' as const,label:'صفقة',...assetContext(d.deal_assets)})),
      ...data.contracts.map(contract=>({id:'c'+contract.id,at:contract.created_at??contract.start_date,title:`عقد إيجار #${contract.contract_number}`,type:'lease' as const,label:'إيجار',...assetContext(contract.lease_contract_assets)})),
      ...data.payments.map(p=>({id:'p'+p.id,at:p.paid_at,title:`تم تسجيل دفعة بقيمة ${money(Number(p.amount))}`,type:'payment' as const,label:'دفعة'})),
      ...data.maintenance.map(m=>({id:'m'+m.id,at:m.opened_at,title:`طلب صيانة: ${m.title}`,type:'maintenance' as const,label:'صيانة',assetName:m.assets?.name_ar})),
      ...lead.lead_notes.map(n=>({id:'n'+n.id,at:n.created_at,title:n.note_text,type:'note' as const,label:'ملاحظة'})),
    ];
    return timelineItems.filter(item=>new Date(item.at).getTime()>0).sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime());
  },[data,lead.lead_notes]);

  const shown=expanded?items:items.slice(0,8);

  return <Card className="p-3 md:p-5">
    <div className="mb-3 flex items-center justify-between gap-2 md:mb-4"><div><h2 className="font-semibold text-text-primary">سجل العميل</h2><p className="mt-0.5 text-[11px] text-text-secondary md:mt-1 md:text-xs">رحلة العميل الفعلية من أحدث حدث إلى البداية.</p></div><span className="text-xs text-text-secondary">{items.length} حدث</span></div>
    {shown.length===0?<p className="text-sm text-text-secondary">لا توجد أحداث مسجلة لهذا العميل بعد.</p>:<div className="flex flex-col">{shown.map((item,index)=><div key={item.id} className="relative flex gap-2.5 pb-4 last:pb-0 md:gap-3 md:pb-5"><div className="flex w-3 flex-col items-center"><span className="mt-1.5 h-2 w-2 rounded-full bg-brand ring-4 ring-brand/[.08] md:h-2.5 md:w-2.5"/>{index<shown.length-1&&<span className="mt-1 w-px flex-1 bg-border-subtle"/>}</div><div className="min-w-0"><p className="text-xs text-text-secondary">{item.label}</p><p className="mt-0.5 text-[13px] font-medium leading-5 text-text-primary md:text-sm">{item.title}</p>{item.assetName&&(item.assetId?<a href={`/properties/${item.assetId}`} className="mt-1 block text-xs font-medium text-brand hover:underline">{item.assetName}</a>:<p className="mt-1 text-xs font-medium text-text-secondary">{item.assetName}</p>)}<p className="mt-1 text-xs text-text-secondary">{formatRelativeTime(item.at)}</p></div></div>)}</div>}
    {items.length>8&&<Button variant="secondary" className="mt-4 w-full" onClick={()=>setExpanded(v=>!v)}>{expanded?'عرض أحدث 8 أحداث':`عرض السجل الكامل (${items.length})`}</Button>}
  </Card>;
}
