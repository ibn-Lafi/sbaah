'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { addLeadInterest, type LeadInterest } from '@/lib/api/leads';
import { listProjects } from '@/lib/api/hierarchy';
import { listAssets } from '@/lib/api/real-estate';
import { listUnitTypes, type UnitType } from '@/lib/api/developer-inventory';
import type { Asset, Project } from '@sbaah/shared';

type TargetType='project'|'unit_type'|'asset';

export function LeadRealEstateInterests({leadId,accessToken,interests,onSaved}:{leadId:string;accessToken:string;interests:LeadInterest[];onSaved:()=>Promise<void>|void}) {
  const [targetType,setTargetType]=useState<TargetType>('project');
  const [targetId,setTargetId]=useState('');
  const [projects,setProjects]=useState<Project[]>([]);
  const [unitTypes,setUnitTypes]=useState<UnitType[]>([]);
  const [assets,setAssets]=useState<Asset[]>([]);
  const [notes,setNotes]=useState('');
  const [saving,setSaving]=useState(false);

  useEffect(()=>{void Promise.all([listProjects(accessToken),listUnitTypes(accessToken),listAssets(accessToken,{page_size:50})]).then(([p,u,a])=>{setProjects(p.projects);setUnitTypes(u.unit_types);setAssets(a.assets);});},[accessToken]);
  useEffect(()=>setTargetId(''),[targetType]);

  const options=useMemo(()=>targetType==='project'?projects.map(x=>({id:x.id,label:x.name_ar})):targetType==='unit_type'?unitTypes.map(x=>({id:x.id,label:x.name_ar})):assets.map(x=>({id:x.id,label:x.unit_number?`${x.name_ar} · ${x.unit_number}`:x.name_ar})),[targetType,projects,unitTypes,assets]);

  async function save(){
    if(!targetId)return;
    setSaving(true);
    try{
      await addLeadInterest(accessToken,leadId,{[targetType==='unit_type'?'unit_type_id':targetType+'_id']:targetId,notes:notes.trim()||null});
      setTargetId('');setNotes('');await onSaved();
    }finally{setSaving(false);}
  }

  const projectName=(id:string|null|undefined)=>projects.find(p=>p.id===id)?.name_ar;
  const unitTypeName=(id:string|null|undefined)=>unitTypes.find(u=>u.id===id)?.name_ar;

  return <div className="space-y-4">
    <Card className="p-4 md:p-5">
      <div className="mb-4"><h2 className="font-semibold">الاهتمامات العقارية</h2><p className="mt-1 text-sm text-text-secondary">حدد المشروع أو النموذج أو العقار الذي يهتم به العميل. يمكن إضافة أكثر من اهتمام.</p></div>
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <Select value={targetType} onChange={e=>setTargetType(e.target.value as TargetType)}><option value="project">مشروع</option><option value="unit_type">نموذج / نوع وحدة</option><option value="asset">عقار / وحدة</option></Select>
        <Select value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">اختر...</option>{options.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</Select>
      </div>
      <Input className="mt-3" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="ملاحظة عن اهتمام العميل (اختياري)" />
      <Button className="mt-3 w-full sm:w-auto" disabled={!targetId||saving} onClick={()=>void save()}>{saving?'جارٍ الحفظ…':'إضافة اهتمام'}</Button>
    </Card>

    {interests.length===0?<Card className="p-5 text-sm text-text-secondary">لم تتم إضافة مشروع أو نموذج أو عقار مستهدف لهذا العميل بعد.</Card>:<div className="grid gap-3 md:grid-cols-2">{interests.map(item=>{
      const asset=item.assets; const unitType=item.unit_types;
      const projectId=item.project_id??unitType?.project_id??asset?.project_id??null;
      const projectLabel=item.projects?.name_ar??projectName(projectId);
      const unitLabel=unitType?.name_ar??unitTypeName(asset?.unit_type_id);
      const mainLabel=asset?.name_ar??unitType?.name_ar??item.projects?.name_ar??item.listings?.title_ar??'اهتمام عقاري';
      const href=asset?'/properties/'+asset.id:item.project_id?'/projects/'+item.project_id:projectId?'/projects/'+projectId:null;
      return <Card key={item.id} className="p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-text-secondary">{asset?'عقار مستهدف':unitType?'نموذج مستهدف':item.project_id?'مشروع مستهدف':'عرض مستهدف'}</p>{href?<Link href={href} className="mt-1 block font-semibold text-brand hover:underline">{mainLabel}</Link>:<p className="mt-1 font-semibold">{mainLabel}</p>}</div></div>
        {(projectLabel||unitLabel||asset?.unit_number)&&<div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-text-secondary">{projectLabel&&<>{projectId?<Link href={'/projects/'+projectId} className="hover:text-brand hover:underline">{projectLabel}</Link>:<span>{projectLabel}</span>}</>}{unitLabel&&<><span>‹</span><span>{unitLabel}</span></>}{asset?.unit_number&&<><span>‹</span><span>وحدة {asset.unit_number}</span></>}</div>}
        {item.notes&&<p className="mt-3 border-t border-border-subtle pt-3 text-sm text-text-secondary">{item.notes}</p>}
      </Card>;
    })}</div>}
  </div>;
}
