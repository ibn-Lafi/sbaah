'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AssetInput, AssetType, City, District } from '@sbaah/shared';
import { FormWizard, WizardActions } from '@/components/forms/form-wizard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationPicker, type LocationPickerValue } from '@/components/ui/location-picker';
import { createDistrict, listCities, listDistricts } from '@/lib/api/reference-data';
import { createAsset } from '@/lib/api/real-estate';
import { listUnitTypes, type UnitType } from '@/lib/api/developer-inventory';

export const assetTypeLabels: Record<AssetType, string> = {
  apartment:'شقة', villa:'فيلا', building:'عمارة', land:'أرض', plot:'قطعة أرض', office:'مكتب',
  shop:'محل', warehouse:'مستودع', floor:'دور', compound:'مجمع', chalet:'شاليه', farm:'مزرعة',
  parking:'موقف', other:'أخرى',
};

type FormState = {
  unitTypeId:string; name:string; reference:string; type:AssetType; status:NonNullable<AssetInput['physical_status']>;
  unit:string; floor:string; area:string; landArea:string; builtArea:string; streetWidth:string;
  bedrooms:string; bathrooms:string; floorsCount:string; parkingCount:string; elevatorsCount:string;
  propertyAge:string; furnishing:''|'unfurnished'|'semi_furnished'|'furnished'; description:string;
  cityId:string; districtId:string; location:LocationPickerValue|null; investment:boolean; isPublic:boolean;
};
const initial:FormState={unitTypeId:'',name:'',reference:'',type:'apartment',status:'ready',unit:'',floor:'',area:'',landArea:'',builtArea:'',streetWidth:'',bedrooms:'',bathrooms:'',floorsCount:'',parkingCount:'',elevatorsCount:'',propertyAge:'',furnishing:'',description:'',cityId:'',districtId:'',location:null,investment:false,isPublic:false};

function Counter({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const n=value===''?0:Number(value);
 return <div className="flex h-11 items-center justify-between rounded-lg border border-border-default bg-surface px-3"><span className="text-sm text-text-secondary">{label}</span><div className="flex items-center gap-2"><button type="button" className="h-7 w-7 rounded-md border border-border-default text-lg leading-none" onClick={()=>onChange(String(Math.max(0,n-1)))}>−</button><span className="w-6 text-center text-sm font-semibold">{n}</span><button type="button" className="h-7 w-7 rounded-md border border-border-default text-lg leading-none" onClick={()=>onChange(String(n+1))}>+</button></div></div>
}

export function CreateAssetForm({accessToken,onCreated,projectId,parentAssetId,parentAssetName}:{accessToken:string;onCreated:(id:string)=>void;projectId?:string;parentAssetId?:string;parentAssetName?:string;}){
 const [form,setForm]=useState(initial); const [step,setStep]=useState(0); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const [cities,setCities]=useState<City[]>([]); const [districts,setDistricts]=useState<District[]>([]); const [unitTypes,setUnitTypes]=useState<UnitType[]>([]);
 const inheritsLocation=Boolean(parentAssetId||projectId);
 const set=<K extends keyof FormState>(key:K,value:FormState[K])=>setForm(current=>({...current,[key]:value}));
 const numberOrNull=(value:string)=>(value===''?null:Number(value));
 useEffect(()=>{if(!inheritsLocation) void listCities().then(setCities); if(projectId) void listUnitTypes(accessToken).then(r=>setUnitTypes(r.unit_types));},[accessToken,projectId,inheritsLocation]);
 useEffect(()=>{if(inheritsLocation||!form.cityId){setDistricts([]);return;} void listDistricts(form.cityId).then(setDistricts);},[form.cityId,inheritsLocation]);
 const mapFocusPoint=useMemo<LocationPickerValue|null>(()=>{const d=districts.find(x=>x.id===form.districtId);if(d?.lat!=null&&d?.lng!=null)return{lat:d.lat,lng:d.lng};const c=cities.find(x=>x.id===form.cityId);return c?.lat!=null&&c?.lng!=null?{lat:c.lat,lng:c.lng}:null},[form.cityId,form.districtId,cities,districts]);
 const hasRooms=['apartment','villa','floor','compound','chalet','farm'].includes(form.type);
 const hasBuilding=!['land','plot','parking'].includes(form.type);
 function next(){setError('');if(step===0&&!form.name.trim()){setError(parentAssetId?'اسم الوحدة مطلوب':'اسم العقار مطلوب');return;}setStep(current=>Math.min(2,current+1));}
 async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{
  const input:AssetInput={project_id:projectId??null,unit_type_id:projectId?form.unitTypeId||null:null,parent_asset_id:parentAssetId??null,asset_type:form.type,name_ar:form.name,reference_number:form.reference||null,physical_status:form.status,unit_number:form.unit||null,floor_number:numberOrNull(form.floor),
   city_id:inheritsLocation?null:form.cityId||null,district_id:inheritsLocation?null:form.districtId||null,lat:inheritsLocation?null:form.location?.lat??null,lng:inheritsLocation?null:form.location?.lng??null,
   area_sqm:numberOrNull(form.area),land_area:parentAssetId?null:numberOrNull(form.landArea),built_area:parentAssetId?null:numberOrNull(form.builtArea),street_width:inheritsLocation?null:numberOrNull(form.streetWidth),
   bedrooms:numberOrNull(form.bedrooms),bathrooms:numberOrNull(form.bathrooms),floors_count:parentAssetId?null:numberOrNull(form.floorsCount),parking_count:numberOrNull(form.parkingCount),elevators_count:numberOrNull(form.elevatorsCount),property_age:parentAssetId?null:numberOrNull(form.propertyAge),furnishing:form.furnishing||null,description_ar:form.description||null,specifications:form.investment?{market_positioning:'investment'}:{},is_public:form.isPublic};
  const result=await createAsset(accessToken,input);onCreated(result.asset.id);
 }catch(cause){setError(cause instanceof Error?cause.message:'تعذر إضافة العقار')}finally{setBusy(false)}}
 return <form onSubmit={submit} className="flex flex-col gap-5">
  <FormWizard steps={['التعريف','التفاصيل','المراجعة']} current={step} onStepChange={target=>target<step&&setStep(target)}/>
  {parentAssetName&&<div className="rounded-lg bg-surface-subtle-3 p-3 text-sm">إضافة وحدة داخل: <strong>{parentAssetName}</strong><p className="mt-1 text-xs text-text-secondary">الموقع والعنوان يُورثان من العقار الرئيسي، لذلك لن نطلبهما مرة أخرى.</p></div>}
  {!parentAssetId&&projectId&&<div className="rounded-lg bg-surface-subtle-3 p-3 text-sm">هذا العقار تابع للمشروع.<p className="mt-1 text-xs text-text-secondary">الموقع الجغرافي يُورث من المشروع، ويمكن إضافة بيانات العقار ووسائطه الخاصة بعد الحفظ.</p></div>}
  {step===0&&<div className="space-y-4">
   {!projectId&&!parentAssetId&&<p className="rounded-lg bg-surface-subtle-3 p-3 text-sm text-text-secondary">عقار مستقل. لإضافة عقار لمشروع افتح المشروع، ولإضافة وحدة افتح العقار الرئيسي.</p>}
   {projectId&&<SearchableSelect options={unitTypes.filter(x=>x.project_id===projectId).map(x=>({value:x.id,label:x.name_ar}))} value={form.unitTypeId} onChange={value=>{const model=unitTypes.find(x=>x.id===value);setForm(current=>({...current,unitTypeId:value,type:model?.asset_type??current.type,area:model?.area_sqm?String(model.area_sqm):current.area,bedrooms:model?.bedrooms!=null?String(model.bedrooms):current.bedrooms,bathrooms:model?.bathrooms!=null?String(model.bathrooms):current.bathrooms}))}} placeholder="نموذج العقار (اختياري)" clearable/>}
   <div className="grid gap-3 sm:grid-cols-2"><Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder={parentAssetId?'اسم الوحدة':'اسم العقار'} required/><Input value={form.reference} onChange={e=>set('reference',e.target.value)} placeholder="الرقم المرجعي (اختياري)"/><Select value={form.type} onChange={e=>set('type',e.target.value as AssetType)}>{Object.entries(assetTypeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select><Select value={form.status} onChange={e=>set('status',e.target.value as FormState['status'])}><option value="ready">جاهز</option><option value="planned">مخطط</option><option value="under_construction">تحت الإنشاء</option><option value="maintenance">صيانة</option><option value="inactive">غير نشط</option></Select></div>
  </div>}
  {step===1&&<div className="space-y-5">
   <div className="grid gap-3 sm:grid-cols-2">
    {parentAssetId&&<><Input value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="رقم الوحدة"/><Input value={form.floor} onChange={e=>set('floor',e.target.value)} type="number" placeholder="الدور"/></>}
    <Input value={form.area} onChange={e=>set('area',e.target.value)} type="number" min="0.01" step="0.01" placeholder="المساحة م²"/>
    {hasRooms&&<><Counter label="غرف النوم" value={form.bedrooms} onChange={v=>set('bedrooms',v)}/><Counter label="دورات المياه" value={form.bathrooms} onChange={v=>set('bathrooms',v)}/></>}
    <Counter label="المواقف" value={form.parkingCount} onChange={v=>set('parkingCount',v)}/>
    {hasBuilding&&<Counter label="المصاعد" value={form.elevatorsCount} onChange={v=>set('elevatorsCount',v)}/>}
    {!parentAssetId&&<><Input value={form.landArea} onChange={e=>set('landArea',e.target.value)} type="number" min="0.01" step="0.01" placeholder="مساحة الأرض م²"/>{hasBuilding&&<Input value={form.builtArea} onChange={e=>set('builtArea',e.target.value)} type="number" min="0.01" step="0.01" placeholder="مساحة البناء م²"/>}{!inheritsLocation&&<Input value={form.streetWidth} onChange={e=>set('streetWidth',e.target.value)} type="number" min="0.01" step="0.01" placeholder="عرض الشارع م"/>}{hasBuilding&&<Counter label="عدد الأدوار" value={form.floorsCount} onChange={v=>set('floorsCount',v)}/>}<Input value={form.propertyAge} onChange={e=>set('propertyAge',e.target.value)} type="number" min="0" placeholder="عمر العقار (سنة)"/></>}
    {hasRooms&&<Select value={form.furnishing} onChange={e=>set('furnishing',e.target.value as FormState['furnishing'])}><option value="">التأثيث (اختياري)</option><option value="unfurnished">غير مفروش</option><option value="semi_furnished">شبه مفروش</option><option value="furnished">مفروش</option></Select>}
    <Input value={form.description} onChange={e=>set('description',e.target.value)} placeholder="وصف مختصر (اختياري)"/>
   </div>
   {!inheritsLocation&&<div className="border-t border-border-subtle pt-5"><p className="mb-3 text-sm font-medium">الموقع</p><div className="mb-4 grid gap-3 sm:grid-cols-2"><SearchableSelect options={cities.map(c=>({value:c.id,label:c.name_ar}))} value={form.cityId} onChange={value=>setForm(current=>({...current,cityId:value,districtId:''}))} placeholder="اختر المدينة"/><SearchableSelect options={districts.map(d=>({value:d.id,label:d.name_ar}))} value={form.districtId} onChange={value=>set('districtId',value)} placeholder="اختر الحي" disabled={!form.cityId} clearable onCreate={async name=>{const d=await createDistrict(accessToken,{city_id:form.cityId,name_ar:name});setDistricts(prev=>[...prev,d]);return{value:d.id,label:d.name_ar}}}/></div><LocationPicker value={form.location} onChange={location=>set('location',location)} focusPoint={mapFocusPoint}/></div>}
  </div>}
  {step===2&&<div className="space-y-4"><dl className="grid gap-4 rounded-xl border border-border-default p-4 text-sm sm:grid-cols-2"><div><dt className="text-text-secondary">{parentAssetId?'الوحدة':'العقار'}</dt><dd className="font-medium">{form.name}</dd></div><div><dt className="text-text-secondary">النوع</dt><dd>{assetTypeLabels[form.type]}</dd></div><div><dt className="text-text-secondary">المساحة</dt><dd>{form.area?`${form.area} م²`:'غير محددة'}</dd></div><div><dt className="text-text-secondary">الموقع</dt><dd>{inheritsLocation?'موروث من الأصل الرئيسي':form.location?'تم تحديده على الخريطة':'غير محدد'}</dd></div></dl>
   <label className="flex items-center justify-between gap-4 rounded-xl border border-border-default p-4"><span><strong className="block text-sm">إظهار في الموقع</strong><span className="text-xs text-text-secondary">مستقل عن البيع أو الإيجار. يمكنك تغييره لاحقًا.</span></span><input type="checkbox" checked={form.isPublic} onChange={e=>set('isPublic',e.target.checked)} className="h-5 w-5"/></label>
   <p className="text-xs text-text-secondary">بعد الحفظ يمكنك إضافة الصور والفيديو وإنشاء عرض بيع أو إيجار من صفحة العقار/الوحدة. لا نطلب السعر أثناء إنشاء الأصل.</p>
  </div>}
  {error&&<p className="text-sm text-red-600">{error}</p>}
  <WizardActions step={step} total={3} loading={busy} submitLabel={parentAssetId?'إضافة الوحدة':'إضافة العقار'} onBack={()=>setStep(current=>Math.max(0,current-1))} onNext={next}/>
 </form>
}
