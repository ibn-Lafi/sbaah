'use client';
import { useState } from 'react';
import type { Project } from '@sbaah/shared';
import { updateProject } from '@/lib/api/hierarchy';

export function ProjectPublishingPanel({project,accessToken,onChange}:{project:Project;accessToken:string;onChange:(p:Project)=>void}){
 const [completion,setCompletion]=useState(project.completion_percentage?.toString()??'');
 const [planned,setPlanned]=useState(project.planned_units_count?.toString()??'');
 const [expected,setExpected]=useState(project.expected_completion_date??'');
 const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null);
 const save=async(patch:Partial<{is_public:boolean}>= {})=>{setSaving(true);setError(null);try{const {project:p}=await updateProject(accessToken,project.id,{completion_percentage:completion===''?null:Number(completion),planned_units_count:planned===''?null:Number(planned),expected_completion_date:expected||null,...patch});onChange(p)}catch(e){setError(e instanceof Error?e.message:'تعذر حفظ المشروع')}finally{setSaving(false)}};
 return <section className="rounded-card border border-border-default bg-surface-card p-5">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-text-primary">بيانات المشروع والظهور في الموقع</h2><p className="mt-1 text-xs text-text-secondary">وجود المشروع في النظام مستقل عن ظهوره للزوار. يمكنك تشغيل المشروع داخليًا وإظهاره في الموقع عندما يكون جاهزًا.</p></div><span className="rounded-full border border-border-default px-3 py-1 text-xs">{project.is_public?'ظاهر في الموقع':'غير ظاهر في الموقع'}</span></div>
  <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm text-text-secondary">نسبة الإنجاز %<input type="number" min="0" max="100" value={completion} onChange={e=>setCompletion(e.target.value)} className="mt-2 h-10 w-full rounded-input border border-border-default bg-surface px-3 text-text-primary"/></label><label className="text-sm text-text-secondary">عدد الوحدات المخطط<input type="number" min="0" value={planned} onChange={e=>setPlanned(e.target.value)} className="mt-2 h-10 w-full rounded-input border border-border-default bg-surface px-3 text-text-primary"/></label><label className="text-sm text-text-secondary">تاريخ الإنجاز المتوقع<input type="date" value={expected} onChange={e=>setExpected(e.target.value)} className="mt-2 h-10 w-full rounded-input border border-border-default bg-surface px-3 text-text-primary"/></label></div>
  {error&&<p className="mt-3 text-sm text-danger">{error}</p>}
  <div className="mt-5 flex flex-wrap gap-2"><button disabled={saving} onClick={()=>void save()} className="rounded-button border border-border-default px-4 py-2 text-sm font-medium disabled:opacity-50">حفظ البيانات</button><button disabled={saving} onClick={()=>void save({is_public:!project.is_public})} className="rounded-button bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving?'جارٍ الحفظ...':project.is_public?'إخفاء من الموقع':'إظهار في الموقع'}</button></div>
 </section>;
}
