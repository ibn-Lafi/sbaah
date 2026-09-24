'use client';
import {useEffect,useMemo,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Select} from '@/components/ui/select';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {createProjectMedia,deleteProjectMedia,listProjectMedia,updateProjectMedia,type ProjectMedia,type ProjectMediaCategory} from '@/lib/api/hierarchy';

const categories:Array<{value:ProjectMediaCategory;label:string;hint:string}>=[
 {value:'general',label:'صور المشروع',hint:'الصور العامة وأفضل اللقطات للمشروع'},
 {value:'exterior',label:'التصميم الخارجي',hint:'الواجهات والرندرات الخارجية'},
 {value:'master_plan',label:'مخطط المشروع',hint:'المخطط العام Master Plan'},
 {value:'unit_plans',label:'مخططات الوحدات',hint:'مخططات ونماذج الوحدات'},
 {value:'interior',label:'التصميم الداخلي',hint:'التصاميم والرندرات الداخلية'},
 {value:'amenities',label:'المرافق والخدمات',hint:'الحدائق والنادي والمسبح والمواقف وغيرها'},
 {value:'location',label:'الموقع والمحيط',hint:'الموقع والشوارع والمعالم المحيطة'},
 {value:'construction',label:'مراحل الإنشاء',hint:'صور تقدم وتنفيذ المشروع'},
 {value:'other',label:'أخرى',hint:'وسائط لا تنتمي للتصنيفات السابقة'},
];
export function ProjectMediaManager({projectId,tenantId,accessToken,canManage}:{projectId:string;tenantId:string;accessToken:string;canManage:boolean}){
 const[media,setMedia]=useState<ProjectMedia[]>([]),[category,setCategory]=useState<ProjectMediaCategory>('general'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{const r=await listProjectMedia(accessToken,projectId);setMedia(r.media)};
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:'تعذر تحميل الوسائط'))},[accessToken,projectId]);
 const groups=useMemo(()=>categories.map(c=>({...c,items:media.filter(x=>x.category===c.value).sort((a,b)=>a.order_index-b.order_index)})).filter(g=>g.items.length),[media]);
 async function upload(files:FileList|null){if(!files?.length)return;setBusy(true);setError('');try{const supabase=getSupabaseBrowserClient();for(const file of Array.from(files)){const type=file.type.startsWith('video/')?'video':file.type.startsWith('image/')?'image':null;if(!type)throw new Error('يسمح برفع الصور والفيديو فقط');const ext=file.name.split('.').pop()?.toLowerCase()||'bin';const objectPath=`${tenantId}/projects/${projectId}/${crypto.randomUUID()}.${ext}`;const{error:uploadError}=await supabase.storage.from('property-media').upload(objectPath,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;const{data}=supabase.storage.from('property-media').getPublicUrl(objectPath);const sameCategory=media.filter(x=>x.category===category);await createProjectMedia(accessToken,projectId,{media_type:type,category,url:data.publicUrl,alt_ar:null,alt_en:null,order_index:sameCategory.length,is_primary:media.length===0&&type==='image'});}await load();}catch(e){setError(e instanceof Error?e.message:'تعذر رفع الوسائط')}finally{setBusy(false)}}
 async function remove(item:ProjectMedia){await deleteProjectMedia(accessToken,projectId,item.id);await load()}
 async function primary(item:ProjectMedia){await updateProjectMedia(accessToken,projectId,item.id,{is_primary:true});await load()}
 return <Card className="p-5 md:p-6"><div className="mb-5"><h2 className="font-semibold">صور وفيديو المشروع</h2><p className="mt-1 text-sm text-text-secondary">صنّف الوسائط عند رفعها، وسترتبها سبعة تلقائيًا في صفحة المشروع.</p></div>{canManage&&<div className="mb-6 grid gap-3 rounded-xl border border-border-subtle p-4 sm:grid-cols-[1fr_auto]"><div><Select value={category} onChange={e=>setCategory(e.target.value as ProjectMediaCategory)}>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</Select><p className="mt-2 text-xs text-text-secondary">{categories.find(c=>c.value===category)?.hint}</p></div><label className="inline-flex cursor-pointer items-center justify-center rounded-input bg-brand px-4 py-2 text-sm font-medium text-white"><input className="hidden" type="file" accept="image/*,video/*" multiple disabled={busy} onChange={e=>{void upload(e.target.files);e.currentTarget.value=''}}/>{busy?'جارٍ الرفع...':'+ إضافة صور أو فيديو'}</label></div>}{error&&<p className="mb-4 text-sm text-danger">{error}</p>}{groups.length===0?<p className="text-sm text-text-secondary">لم تتم إضافة وسائط للمشروع بعد.</p>:<div className="space-y-6">{groups.map(group=><section key={group.value}><div className="mb-3 flex items-center gap-2"><h3 className="font-medium">{group.label}</h3><span className="text-xs text-text-secondary">({group.items.length})</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{group.items.map(item=><div key={item.id} className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card">{item.media_type==='image'?<img src={item.url} alt={item.alt_ar??group.label} className="aspect-[4/3] w-full object-cover"/>:<video src={item.url} className="aspect-[4/3] w-full object-cover" controls preload="metadata"/>}<div className="flex flex-wrap gap-2 p-2">{item.is_primary&&<span className="rounded-full bg-brand-surface px-2 py-1 text-[11px] font-medium text-brand">الصورة الرئيسية</span>}{canManage&&item.media_type==='image'&&!item.is_primary&&<Button variant="secondary" onClick={()=>void primary(item)}>رئيسية</Button>}{canManage&&<Button variant="secondary" onClick={()=>void remove(item)}>حذف</Button>}</div></div>)}</div></section>)}</div>}</Card>;
}