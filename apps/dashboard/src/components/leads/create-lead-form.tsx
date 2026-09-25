'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { manualLeadInputSchema, type Asset, type Lead, type LeadSource, type Project } from '@sbaah/shared';
import { FormWizard, WizardActions } from '@/components/forms/form-wizard';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select } from '@/components/ui/select';
import { ApiRequestError } from '@/lib/api/client';
import { listProjects } from '@/lib/api/hierarchy';
import { createLead } from '@/lib/api/leads';
import { listAssets } from '@/lib/api/real-estate';
import { useLocale } from '@/lib/i18n/locale-context';

interface CreateLeadFormProps { accessToken:string; onCreated:(lead:Lead)=>void; initialKind?:'customer'|'prospect' }
type CustomerKind='customer'|'prospect';
type Relationship='purchase'|'tenant'|'owner'|'former';
const relationshipLabels:Record<Relationship,string>={purchase:'مشترٍ',tenant:'مستأجر',owner:'مالك',former:'عميل سابق'};
const sourceLabels:Record<LeadSource,string>={manual:'إدخال يدوي',website_form:'الموقع الإلكتروني',whatsapp_click:'واتساب'};

export function CreateLeadForm({accessToken,onCreated,initialKind='prospect'}:CreateLeadFormProps){
  const{pages}=useLocale();const t=pages.leads;
  const[assets,setAssets]=useState<Asset[]>([]);const[projects,setProjects]=useState<Project[]>([]);
  const[fullName,setFullName]=useState('');const[phone,setPhone]=useState('');const[email,setEmail]=useState('');
  const[kind,setKind]=useState<CustomerKind>(initialKind);const[relationship,setRelationship]=useState<Relationship>('purchase');const[source,setSource]=useState<LeadSource>('manual');
  const[projectId,setProjectId]=useState('');const[propertyId,setPropertyId]=useState('');const[unitId,setUnitId]=useState('');
  const[followUp,setFollowUp]=useState('');const[notes,setNotes]=useState('');const[error,setError]=useState<string|null>(null);const[loading,setLoading]=useState(false);const[step,setStep]=useState(0);

  useEffect(()=>{void Promise.all([listAssets(accessToken,{page_size:50}),listProjects(accessToken,{page_size:50})]).then(([a,p])=>{setAssets(a.assets);setProjects(p.projects);});},[accessToken]);
  const rootAssets=useMemo(()=>assets.filter(asset=>!asset.parent_asset_id&&(projectId?asset.project_id===projectId:asset.project_id===null)),[assets,projectId]);
  const childUnits=useMemo(()=>assets.filter(asset=>asset.parent_asset_id===propertyId),[assets,propertyId]);
  const chosenAsset=assets.find(asset=>asset.id===(unitId||propertyId));
  const interestLabel=chosenAsset?.name_ar??projects.find(project=>project.id===projectId)?.name_ar??'غير محدد';
  const selectProject=(value:string)=>{setProjectId(value);setPropertyId('');setUnitId('');};
  const selectProperty=(value:string)=>{setPropertyId(value);setUnitId('');};

  async function handleSubmit(event:FormEvent){event.preventDefault();setError(null);const interestAssetId=unitId||propertyId||null;const candidate={full_name:fullName,phone,email:email||null,source,customer_relationship:kind==='customer'?relationship:null,follow_up_at:followUp?new Date(followUp).toISOString():null,notes:notes||null,project_id:interestAssetId?null:(projectId||null),unit_type_id:null,asset_id:interestAssetId,listing_id:null};const result=manualLeadInputSchema.safeParse(candidate);if(!result.success){setError(result.error.issues[0]?.message??t.createForm.validationError);return;}setLoading(true);try{const{lead}=await createLead(accessToken,result.data);onCreated(lead);}catch(err){setError(err instanceof ApiRequestError?err.message:t.createForm.createError);}finally{setLoading(false);}}
  function nextStep(){setError(null);if(step===0&&(!fullName.trim()||!phone.trim())){setError('أدخل اسم العميل ورقم الجوال للمتابعة');return;}setStep(current=>Math.min(3,current+1));}

  return <form onSubmit={handleSubmit} className="flex flex-col gap-4">
    <FormWizard steps={['البيانات','العلاقة','الاهتمام','المتابعة']} current={step} onStepChange={target=>target<step&&setStep(target)}/>
    {step===0&&<div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input placeholder={t.createForm.namePlaceholder} value={fullName} onChange={e=>setFullName(e.target.value)}/><PhoneInput placeholder={t.createForm.phonePlaceholder} value={phone} onChange={setPhone}/><Input type="email" placeholder={t.createForm.emailPlaceholder} value={email} onChange={e=>setEmail(e.target.value)} dir="ltr"/><Select value={source} onChange={e=>setSource(e.target.value as LeadSource)}>{Object.entries(sourceLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></div>}
    {step===1&&<div className="space-y-4"><div><p className="mb-2 text-sm font-medium">مرحلة العلاقة</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setKind('prospect')} className={`rounded-xl border p-4 text-start ${kind==='prospect'?'border-brand bg-brand-surface':'border-border-default'}`}><strong className="block">عميل محتمل</strong><span className="mt-1 block text-xs text-text-secondary">لا توجد عملية مكتملة بعد</span></button><button type="button" onClick={()=>setKind('customer')} className={`rounded-xl border p-4 text-start ${kind==='customer'?'border-brand bg-brand-surface':'border-border-default'}`}><strong className="block">عميل حالي</strong><span className="mt-1 block text-xs text-text-secondary">له علاقة قائمة أو سابقة</span></button></div></div>{kind==='customer'&&<label className="block"><span className="mb-2 block text-sm font-medium">نوع العميل</span><Select value={relationship} onChange={e=>setRelationship(e.target.value as Relationship)}>{Object.entries(relationshipLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></label>}<p className="rounded-xl bg-surface-subtle-3 p-3 text-xs text-text-secondary">العميل المحتمل يتحول آليًا إلى عميل عند اكتمال صفقة بيع أو تفعيل عقد إيجار.</p></div>}
    {step===2&&<div className="space-y-4"><p className="text-sm text-text-secondary">اختر أعمق مستوى معروف. يمكن الاكتفاء بالمشروع أو العقار.</p><Select value={projectId} onChange={e=>selectProject(e.target.value)}><option value="">عقار مستقل أو بلا اهتمام محدد</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name_ar}</option>)}</Select><Select value={propertyId} onChange={e=>selectProperty(e.target.value)}><option value="">{projectId?'المشروع كله':'اختر عقارًا مستقلًا (اختياري)'}</option>{rootAssets.map(asset=><option key={asset.id} value={asset.id}>{asset.name_ar}{asset.unit_type_id?' · وحدة مباشرة':''}</option>)}</Select>{propertyId&&childUnits.length>0&&<Select value={unitId} onChange={e=>setUnitId(e.target.value)}><option value="">العقار كله</option>{childUnits.map(unit=><option key={unit.id} value={unit.id}>{unit.unit_number?`${unit.unit_number} · `:''}{unit.name_ar}</option>)}</Select>}</div>}
    {step===3&&<div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-medium">موعد المتابعة</span><Input type="datetime-local" value={followUp} onChange={e=>setFollowUp(e.target.value)}/></label><label><span className="mb-2 block text-sm font-medium">ملاحظة أولى</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-border-default bg-surface-card p-3 text-sm" placeholder="ملاحظة اختيارية"/></label></div><dl className="grid gap-3 rounded-xl border border-border-default p-4 text-sm sm:grid-cols-2"><div><dt className="text-text-secondary">التصنيف</dt><dd className="font-medium">{kind==='prospect'?'عميل محتمل':relationshipLabels[relationship]}</dd></div><div><dt className="text-text-secondary">الاسم</dt><dd className="font-medium">{fullName}</dd></div><div><dt className="text-text-secondary">الجوال</dt><dd dir="ltr">{phone}</dd></div><div><dt className="text-text-secondary">الاهتمام</dt><dd>{interestLabel}</dd></div></dl></div>}
    <FormError message={error}/><WizardActions step={step} total={4} loading={loading} submitLabel="إضافة العميل" onBack={()=>setStep(current=>Math.max(0,current-1))} onNext={nextStep}/>
  </form>;
}
