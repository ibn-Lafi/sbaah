'use client';
import { useCallback,useEffect,useState } from 'react';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createFaq,deleteFaq,listFaqs,updateFaq,type PlatformFaq,type PlatformFaqInput } from '@/lib/api/faqs';

const empty:PlatformFaqInput={question_ar:'',answer_ar:'',question_en:'',answer_en:'',order_index:0,is_active:true};
type EditDraft=Pick<PlatformFaqInput,'question_ar'|'answer_ar'|'question_en'|'answer_en'>;

export default function FaqManagementPage(){
 const {accessToken}=useCurrentAdmin();
 const [items,setItems]=useState<PlatformFaq[]|null>(null);
 const [draft,setDraft]=useState<PlatformFaqInput>(empty);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [editDraft,setEditDraft]=useState<EditDraft|null>(null);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const load=useCallback(()=>listFaqs(accessToken).then(setItems).catch(()=>setError('تعذّر تحميل الأسئلة')),[accessToken]);
 useEffect(()=>{void load()},[load]);

 async function add(){
  setError('');setSaving(true);
  try{await createFaq(accessToken,{...draft,order_index:items?.length??0});setDraft(empty);await load()}
  catch{setError('تعذّر إضافة السؤال')}finally{setSaving(false)}
 }
 function startEdit(item:PlatformFaq){
  setEditingId(item.id);
  setEditDraft({question_ar:item.question_ar,answer_ar:item.answer_ar,question_en:item.question_en,answer_en:item.answer_en});
 }
 async function saveEdit(){
  if(!editingId||!editDraft)return;
  setSaving(true);setError('');
  try{await updateFaq(accessToken,editingId,editDraft);setEditingId(null);setEditDraft(null);await load()}
  catch{setError('تعذّر حفظ التعديلات')}finally{setSaving(false)}
 }
 async function patch(id:string,input:Partial<PlatformFaqInput>){try{await updateFaq(accessToken,id,input);await load()}catch{setError('تعذّر تحديث السؤال')}}
 async function move(index:number,direction:-1|1){
  if(!items)return; const target=index+direction; if(target<0||target>=items.length)return;
  const current=items[index],other=items[target]; if(!current||!other)return; setError('');
  try{await updateFaq(accessToken,current.id,{order_index:other.order_index});await updateFaq(accessToken,other.id,{order_index:current.order_index});await load()}
  catch{setError('تعذّر تغيير ترتيب الأسئلة')}
 }
 async function remove(id:string){if(!confirm('حذف هذا السؤال؟'))return;try{await deleteFaq(accessToken,id);await load()}catch{setError('تعذّر حذف السؤال')}}

 return <ConsoleShell title="الأسئلة الشائعة">
  <Card className="max-w-[900px] p-6">
   <h2 className="font-semibold">إضافة سؤال</h2>
   <p className="mt-1 text-sm text-text-secondary">أضف السؤال والإجابة باللغتين ليظهر في صفحة سبعة العامة.</p>
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <Input value={draft.question_ar} onChange={e=>setDraft({...draft,question_ar:e.target.value})} placeholder="السؤال بالعربية"/>
    <Input dir="ltr" value={draft.question_en} onChange={e=>setDraft({...draft,question_en:e.target.value})} placeholder="Question in English"/>
    <textarea value={draft.answer_ar} onChange={e=>setDraft({...draft,answer_ar:e.target.value})} className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm outline-none focus:border-brand" placeholder="الإجابة بالعربية"/>
    <textarea dir="ltr" value={draft.answer_en} onChange={e=>setDraft({...draft,answer_en:e.target.value})} className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm outline-none focus:border-brand" placeholder="Answer in English"/>
   </div>
   {error&&<p className="mt-3 text-sm text-danger">{error}</p>}
   <Button onClick={add} disabled={saving||!draft.question_ar.trim()||!draft.answer_ar.trim()||!draft.question_en.trim()||!draft.answer_en.trim()} className="mt-4">{saving?'جارٍ الحفظ...':'إضافة السؤال'}</Button>
  </Card>

  <div className="mt-6 max-w-[900px] space-y-3">
   {items===null?<LoadingState/>:items.length===0?<Card className="p-6 text-sm text-text-secondary">لا توجد أسئلة مضافة بعد. سيستمر الموقع باستخدام المحتوى الافتراضي حتى تضيف أول سؤال.</Card>:items.map((item,index)=>{
    const editing=editingId===item.id;
    return <Card key={item.id} className="p-5">
     {editing&&editDraft?
      <div className="grid gap-3 sm:grid-cols-2">
       <Input value={editDraft.question_ar} onChange={e=>setEditDraft({...editDraft,question_ar:e.target.value})} placeholder="السؤال بالعربية"/>
       <Input dir="ltr" value={editDraft.question_en} onChange={e=>setEditDraft({...editDraft,question_en:e.target.value})} placeholder="Question in English"/>
       <textarea value={editDraft.answer_ar} onChange={e=>setEditDraft({...editDraft,answer_ar:e.target.value})} className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm outline-none focus:border-brand"/>
       <textarea dir="ltr" value={editDraft.answer_en} onChange={e=>setEditDraft({...editDraft,answer_en:e.target.value})} className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm outline-none focus:border-brand"/>
       <div className="flex gap-2 sm:col-span-2"><Button onClick={saveEdit} disabled={saving||!editDraft.question_ar.trim()||!editDraft.answer_ar.trim()||!editDraft.question_en.trim()||!editDraft.answer_en.trim()}>{saving?'جارٍ الحفظ...':'حفظ التعديل'}</Button><Button onClick={()=>{setEditingId(null);setEditDraft(null)}}>إلغاء</Button></div>
      </div>:
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold">{item.question_ar}</p><span className={`rounded-full px-2 py-0.5 text-[11px] ${item.is_active?'bg-success-surface text-success':'bg-surface-subtle text-text-secondary'}`}>{item.is_active?'ظاهر':'مخفي'}</span></div><p dir="ltr" className="mt-1 text-sm text-text-secondary">{item.question_en}</p><p className="mt-3 text-sm leading-6 text-text-secondary">{item.answer_ar}</p></div>
       <div className="flex flex-wrap gap-2"><Button onClick={()=>startEdit(item)}>تعديل</Button><Button onClick={()=>patch(item.id,{is_active:!item.is_active})}>{item.is_active?'إخفاء':'إظهار'}</Button><Button onClick={()=>move(index,-1)} disabled={index===0}>↑</Button><Button onClick={()=>move(index,1)} disabled={index===items.length-1}>↓</Button><Button onClick={()=>remove(item.id)}>حذف</Button></div>
      </div>}
    </Card>
   })}
  </div>
 </ConsoleShell>
}
