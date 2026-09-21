'use client';

import { useState } from 'react';
import type { AssetInput, AssetType } from '@sbaah/shared';
import { FormWizard, WizardActions } from '@/components/forms/form-wizard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createAsset } from '@/lib/api/real-estate';

export const assetTypeLabels: Record<AssetType, string> = { apartment: 'شقة', villa: 'فيلا', building: 'عمارة', land: 'أرض', plot: 'قطعة أرض', office: 'مكتب', shop: 'محل', warehouse: 'مستودع', floor: 'دور', compound: 'مجمع', chalet: 'شاليه', farm: 'مزرعة', parking: 'موقف', other: 'أخرى' };
type FormState = { name:string; reference:string; type:AssetType; status:NonNullable<AssetInput['physical_status']>; unit:string; floor:string; area:string; bedrooms:string; bathrooms:string; description:string };
const initial:FormState={name:'',reference:'',type:'apartment',status:'ready',unit:'',floor:'',area:'',bedrooms:'',bathrooms:'',description:''};

export function CreateAssetForm({ accessToken, onCreated, projectId, parentAssetId, parentAssetName }: { accessToken:string; onCreated:(id:string)=>void; projectId?:string; parentAssetId?:string; parentAssetName?:string }) {
  const [form,setForm]=useState(initial); const [step,setStep]=useState(0); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const set=(key:keyof FormState,value:string)=>setForm(current=>({...current,[key]:value}));
  const numberOrNull=(value:string)=>value===''?null:Number(value);
  function next(){setError('');if(step===0&&!form.name.trim()){setError('اسم العقار مطلوب');return}setStep(current=>Math.min(2,current+1));}
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{const input:AssetInput={project_id:projectId??null,parent_asset_id:parentAssetId??null,asset_type:form.type,name_ar:form.name,reference_number:form.reference||null,physical_status:form.status,unit_number:form.unit||null,floor_number:numberOrNull(form.floor),area_sqm:numberOrNull(form.area),bedrooms:numberOrNull(form.bedrooms),bathrooms:numberOrNull(form.bathrooms),description_ar:form.description||null};const result=await createAsset(accessToken,input);onCreated(result.asset.id)}catch(cause){setError(cause instanceof Error?cause.message:'تعذر إضافة العقار')}finally{setBusy(false)}}
  return <form onSubmit={submit} className="flex flex-col gap-5">
    <FormWizard steps={['التعريف', 'التفاصيل', 'المراجعة']} current={step} onStepChange={target=>target<step&&setStep(target)}/>
    {parentAssetName&&<div className="rounded-lg bg-surface-subtle-3 p-3 text-sm">العقار الرئيسي: <strong>{parentAssetName}</strong></div>}
    {step===0&&<div className="grid gap-4 sm:grid-cols-2"><Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="اسم العقار" required/><Input value={form.reference} onChange={e=>set('reference',e.target.value)} placeholder="الرقم المرجعي"/><Select value={form.type} onChange={e=>set('type',e.target.value)}>{Object.entries(assetTypeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select><Select value={form.status} onChange={e=>set('status',e.target.value)}><option value="ready">جاهز</option><option value="planned">مخطط</option><option value="under_construction">تحت الإنشاء</option><option value="maintenance">صيانة</option><option value="inactive">غير نشط</option></Select></div>}
    {step===1&&<div className="grid gap-4 sm:grid-cols-2">{parentAssetId&&<><Input value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="رقم الوحدة"/><Input value={form.floor} onChange={e=>set('floor',e.target.value)} type="number" placeholder="رقم الدور"/></>}<Input value={form.area} onChange={e=>set('area',e.target.value)} type="number" min="0.01" step="0.01" placeholder="المساحة م²"/><Input value={form.bedrooms} onChange={e=>set('bedrooms',e.target.value)} type="number" min="0" placeholder="غرف النوم"/><Input value={form.bathrooms} onChange={e=>set('bathrooms',e.target.value)} type="number" min="0" placeholder="دورات المياه"/><Input value={form.description} onChange={e=>set('description',e.target.value)} placeholder="وصف مختصر"/></div>}
    {step===2&&<dl className="grid gap-4 rounded-xl border border-border-default p-4 text-sm sm:grid-cols-2"><div><dt className="text-text-secondary">العقار</dt><dd className="font-medium">{form.name}</dd></div><div><dt className="text-text-secondary">النوع</dt><dd>{assetTypeLabels[form.type]}</dd></div><div><dt className="text-text-secondary">الحالة</dt><dd>{form.status}</dd></div><div><dt className="text-text-secondary">المساحة</dt><dd>{form.area?`${form.area} م²`:'غير محددة'}</dd></div></dl>}
    {error&&<p className="text-sm text-red-600">{error}</p>}<WizardActions step={step} total={3} loading={busy} submitLabel={parentAssetId?'إضافة العقار التابع':'إضافة العقار'} onBack={()=>setStep(current=>Math.max(0,current-1))} onNext={next}/>
  </form>;
}
