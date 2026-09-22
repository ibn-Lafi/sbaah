'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { createReservation, createTask, createViewing } from '@/lib/api/crm';
import { addLeadNote, updateLead } from '@/lib/api/leads';
import { datetimeLocalToIso } from '@/lib/lead/datetime';
import { listAssets } from '@/lib/api/real-estate';
import { LeadRequirements } from '@/components/crm/lead-requirements';

type Action='followup'|'task'|'viewing'|'reservation'|'note'|'requirements';

export function CustomerQuickActions({leadId,accessToken,currentUserId,onChanged}:{leadId:string;accessToken:string;currentUserId:string;onChanged:()=>Promise<void>|void}){
  const [action,setAction]=useState<Action|null>(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [at,setAt]=useState('');
  const [title,setTitle]=useState('');
  const [assetId,setAssetId]=useState('');
  const [note,setNote]=useState('');
  const [saving,setSaving]=useState(false);
  const [assets,setAssets]=useState<Array<{id:string;name_ar:string}>>([]);
  useEffect(()=>{if((action==='viewing'||action==='reservation')&&assets.length===0)void listAssets(accessToken,{page_size:50}).then(r=>setAssets(r.assets));},[action,accessToken,assets.length]);
  const reset=()=>{setAction(null);setMenuOpen(false);setAt('');setTitle('');setAssetId('');setNote('')};
  const choose=(value:Action)=>{setAction(value);setMenuOpen(false)};

  async function save(){
    if(!action||action==='requirements')return;
    setSaving(true);
    try{
      if(action==='followup'){const iso=datetimeLocalToIso(at);if(!iso)return;await updateLead(accessToken,leadId,{follow_up_at:iso});}
      if(action==='task'){const iso=datetimeLocalToIso(at);if(!title.trim()||!iso)return;await createTask(accessToken,{lead_id:leadId,title:title.trim(),due_at:iso});}
      if(action==='viewing'){const iso=datetimeLocalToIso(at);if(!assetId.trim()||!iso)return;await createViewing(accessToken,{lead_id:leadId,asset_id:assetId.trim(),assigned_user_id:currentUserId,scheduled_at:iso});}
      if(action==='reservation'){if(!assetId.trim())return;await createReservation(accessToken,{lead_id:leadId,asset_ids:[assetId.trim()]});}
      if(action==='note'){if(!note.trim())return;await addLeadNote(accessToken,leadId,note.trim());}
      await onChanged();reset();
    }finally{setSaving(false)}
  }

  return <>
    <div className="relative">
      <Button className="w-full sm:w-auto sm:min-w-[180px]" onClick={()=>setMenuOpen(value=>!value)}>+ إجراء سريع <span aria-hidden="true" className="ms-1 text-xs">⌄</span></Button>
      {menuOpen&&<><button aria-label="إغلاق قائمة الإجراءات" className="fixed inset-0 z-30 cursor-default" onClick={()=>setMenuOpen(false)}/><div className="absolute end-0 top-[52px] z-40 w-full overflow-hidden rounded-xl border border-border-default bg-surface-card p-1.5 shadow-xl sm:w-64">
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle" onClick={()=>choose('followup')}><span>متابعة</span><span className="text-text-secondary">↗</span></button>
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle" onClick={()=>choose('task')}><span>مهمة</span><span className="text-text-secondary">✓</span></button>
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle" onClick={()=>choose('viewing')}><span>معاينة</span><span className="text-text-secondary">◉</span></button>
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle" onClick={()=>choose('reservation')}><span>حجز عقار</span><span className="text-text-secondary">◇</span></button>
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle" onClick={()=>choose('note')}><span>ملاحظة</span><span className="text-text-secondary">＋</span></button>
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle" onClick={()=>choose('requirements')}><span>متطلبات العميل</span><span className="text-text-secondary">⌂</span></button>
      </div></>}
    </div>
    {action&&<Modal title={action==='followup'?'إضافة متابعة':action==='task'?'إضافة مهمة':action==='viewing'?'إضافة معاينة':action==='reservation'?'حجز عقار':action==='requirements'?'متطلبات العميل':'إضافة ملاحظة'} onClose={reset} maxWidth={action==='requirements'?'680px':'520px'} mobileCentered><div className="max-h-[78vh] space-y-4 overflow-y-auto px-0.5">
      {action==='requirements'&&<LeadRequirements leadId={leadId} accessToken={accessToken} embedded onSaved={onChanged}/>} 
      {action==='task'&&<Input placeholder="عنوان المهمة" value={title} onChange={e=>setTitle(e.target.value)}/>}
      {(action==='viewing'||action==='reservation')&&<Select value={assetId} onChange={e=>setAssetId(e.target.value)}><option value="">اختر العقار</option>{assets.map(asset=><option key={asset.id} value={asset.id}>{asset.name_ar}</option>)}</Select>}
      {action==='note'&&<textarea value={note} onChange={e=>setNote(e.target.value)} rows={5} maxLength={4000} placeholder="اكتب الملاحظة…" className="w-full resize-none rounded-xl border border-border-default bg-surface-card px-3 py-2 text-sm outline-none focus:border-brand"/>}
      {action!=='note'&&action!=='reservation'&&<DateTimePicker value={at} onChange={setAt} placeholder="التاريخ والوقت"/>}
      {action!=='requirements'&&<Button className="w-full" disabled={saving} onClick={()=>void save()}>{saving?'جاري الحفظ…':'حفظ'}</Button>}
    </div></Modal>}
  </>;
}
