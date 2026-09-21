'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createRequirement, getMatches, listRequirements, type LeadRequirement } from '@/lib/api/crm';

const money=(value:number)=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(value);

export function LeadRequirements({leadId,accessToken,embedded=false,onSaved}:{leadId:string;accessToken:string;embedded?:boolean;onSaved?:()=>Promise<void>|void}) {
  const [requirements,setRequirements]=useState<LeadRequirement[]>([]);
  const [matches,setMatches]=useState<Array<{id:string;title_ar:string;price:number;area_sqm:number}>>([]);
  const [min,setMin]=useState('');
  const [max,setMax]=useState('');
  const [saving,setSaving]=useState(false);

  const load=useCallback(async()=>{
    const result=await listRequirements(accessToken,leadId);
    setRequirements(result.requirements);
    const latest=result.requirements[0];
    if(latest){
      setMin(latest.budget_min!=null?String(latest.budget_min):'');
      setMax(latest.budget_max!=null?String(latest.budget_max):'');
      setMatches((await getMatches(accessToken,leadId)).matches);
    } else setMatches([]);
  },[accessToken,leadId]);

  useEffect(()=>{void load();},[load]);

  async function save(){
    setSaving(true);
    try{
      await createRequirement(accessToken,{lead_id:leadId,budget_min:min?Number(min):null,budget_max:max?Number(max):null});
      await load();
      await onSaved?.();
    } finally { setSaving(false); }
  }

  const latest=requirements[0];

  const content=<>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="font-semibold text-text-primary">متطلبات العميل</h2><p className="mt-1 text-sm text-text-secondary">احتياج العميل العقاري والميزانية والعقارات المطابقة.</p></div>
      {latest&&<span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-text-secondary">{matches.length} عقار مطابق</span>}
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="mb-1.5 block text-xs text-text-secondary">الميزانية من</label><Input type="number" placeholder="مثال: 500000" value={min} onChange={e=>setMin(e.target.value)}/></div>
      <div><label className="mb-1.5 block text-xs text-text-secondary">الميزانية إلى</label><Input type="number" placeholder="مثال: 900000" value={max} onChange={e=>setMax(e.target.value)}/></div>
    </div>
    <Button className="mt-3 w-full sm:w-auto" disabled={saving} onClick={()=>void save()}>{saving?'جارٍ الحفظ…':latest?'تحديث المتطلبات':'حفظ المتطلبات'}</Button>

    {latest&&<div className="mt-5 border-t border-border-subtle pt-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">الحد الأدنى</p><p className="mt-1 text-sm font-semibold text-text-primary">{latest.budget_min!=null?money(latest.budget_min):'غير محدد'}</p></div>
        <div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">الحد الأعلى</p><p className="mt-1 text-sm font-semibold text-text-primary">{latest.budget_max!=null?money(latest.budget_max):'غير محدد'}</p></div>
        <div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">المساحة</p><p className="mt-1 text-sm font-semibold text-text-primary">{latest.area_min!=null?`من ${latest.area_min} م²`:'غير محددة'}</p></div>
        <div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">الغرف</p><p className="mt-1 text-sm font-semibold text-text-primary">{latest.bedrooms_min!=null?`${latest.bedrooms_min}+`:'غير محددة'}</p></div>
      </div>
    </div>}

    {matches.length>0&&<div className="mt-5"><h3 className="mb-3 text-sm font-semibold text-text-primary">عقارات مقترحة</h3><div className="grid gap-2 sm:grid-cols-2">{matches.slice(0,4).map(m=><Link key={m.id} href={`/properties/${m.id}`} className="rounded-input border border-border-default p-3 transition-colors hover:border-brand"><p className="truncate font-medium text-text-primary">{m.title_ar}</p><p className="mt-1 text-xs text-text-secondary">{m.area_sqm} م² · {money(m.price)}</p></Link>)}</div></div>}
  </>;
  return embedded?content:<div className="rounded-card border border-border-subtle bg-surface-card p-4 md:p-6">{content}</div>;
}
