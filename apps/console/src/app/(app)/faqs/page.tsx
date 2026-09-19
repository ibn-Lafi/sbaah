'use client';
import { useEffect,useState } from 'react';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createFaq,deleteFaq,listFaqs,updateFaq,type PlatformFaq,type PlatformFaqInput } from '@/lib/api/faqs';

const empty:PlatformFaqInput={question_ar:'',answer_ar:'',question_en:'',answer_en:'',order_index:0,is_active:true};

export default function FaqManagementPage(){
 const {accessToken}=useCurrentAdmin(); const [items,setItems]=useState<PlatformFaq[]|null>(null); const [draft,setDraft]=useState(empty); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
 const load=()=>listFaqs(accessToken).then(setItems).catch(()=>setError('تعذّر تحميل الأسئلة'));
 useEffect(()=>{void load()},[accessToken]);
 async function add(){setError('');setSaving(true);try{await createFaq(accessToken,{...draft,order_index:items?.length??0});setDraft(empty);await load()}catch{setError('تعذّر إضافة السؤال')}finally{setSaving(false)}}
 async function patch(id:string,input:Partial<PlatformFaqInput>){try{await updateFaq(accessToken,id,input);await load()}catch{setError('تعذّر تحديث السؤال')}}
 async function remove(id:string){if(!confirm('حذف هذا السؤال؟'))return;try{await deleteFaq(accessToken,id);await load()}catch{setError('تعذّر حذف السؤال')}}
 return <ConsoleShell title="الأسئلة الشائعة">
  <Card className="max-w-[900px] p-6"><h2 className="font-semibold">إضافة سؤال</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
   <Input value={draft.question_ar} onChange={e=>setDraft({...draft,question_ar:e.target.value})} placeholder="السؤال بالعربية"/><Input dir="ltr" value={draft.question_en} onChange={e=>setDraft({...draft,question_en:e.target.value})} placeholder="Question in English"/>
   <textarea value={draft.answer_ar} onChange={e=>setDraft({...draft,answer_ar:e.target.value})} className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm" placeholder="الإجابة بالعربية"/><textarea dir="ltr" value={draft.answer_en} onChange={e=>setDraft({...draft,answer_en:e.target.value})} className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm" placeholder="Answer in English"/>
  </div>{error&&<p className="mt-3 text-sm text-danger">{error}</p>}<Button onClick={add} disabled={saving||!draft.question_ar||!draft.answer_ar||!draft.question_en||!draft.answer_en} className="mt-4">{saving?'جارٍ الإضافة...':'إضافة السؤال'}</Button></Card>
  <div className="mt-6 max-w-[900px] space-y-3">{items===null?<LoadingState/>:items.map((item,index)=><Card key={item.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{item.question_ar}</p><p dir="ltr" className="mt-1 text-sm text-text-secondary">{item.question_en}</p><p className="mt-3 text-sm text-text-secondary">{item.answer_ar}</p></div><div className="flex gap-2"><Button onClick={()=>patch(item.id,{is_active:!item.is_active})}>{item.is_active?'إخفاء':'إظهار'}</Button><Button onClick={()=>patch(item.id,{order_index:Math.max(0,index-1)})} disabled={index===0}>↑</Button><Button onClick={()=>patch(item.id,{order_index:index+1})} disabled={index===items.length-1}>↓</Button><Button onClick={()=>remove(item.id)}>حذف</Button></div></div></Card>)}</div>
 </ConsoleShell>
}
