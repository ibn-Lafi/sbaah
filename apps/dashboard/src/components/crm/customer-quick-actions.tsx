'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { createTask, createViewing } from '@/lib/api/crm';
import { addLeadNote, updateLead } from '@/lib/api/leads';
import { datetimeLocalToIso } from '@/lib/lead/datetime';
import { listAssets } from '@/lib/api/real-estate';

type Action='followup'|'task'|'viewing'|'note';

export function CustomerQuickActions({leadId,accessToken,currentUserId,onChanged}:{leadId:string;accessToken:string;currentUserId:string;onChanged:()=>Promise<void>|void}){
  const [action,setAction]=useState<Action|null>(null);
  const [at,setAt]=useState('');
  const [title,setTitle]=useState('');
  const [assetId,setAssetId]=useState('');
  const [note,setNote]=useState('');
  const [saving,setSaving]=useState(false);
  const [assets,setAssets]=useState<Array<{id:string;name_ar:string}>>([]);
  useEffect(()=>{if(action==='viewing'&&assets.length===0)void listAssets(accessToken,{page_size:50}).then(r=>setAssets(r.assets));},[action,accessToken,assets.length]);
  const reset=()=>{setAction(null);setAt('');setTitle('');setAssetId('');setNote('')};

  async function save(){
    if(!action)return;
    setSaving(true);
    try{
      if(action==='followup'){const iso=datetimeLocalToIso(at);if(!iso)return;await updateLead(accessToken,leadId,{follow_up_at:iso});}
      if(action==='task'){const iso=datetimeLocalToIso(at);if(!title.trim()||!iso)return;await createTask(accessToken,{lead_id:leadId,title:title.trim(),due_at:iso});}
      if(action==='viewing'){const iso=datetimeLocalToIso(at);if(!assetId.trim()||!iso)return;await createViewing(accessToken,{lead_id:leadId,asset_id:assetId.trim(),assigned_user_id:currentUserId,scheduled_at:iso});}
      if(action==='note'){if(!note.trim())return;await addLeadNote(accessToken,leadId,note.trim());}
      await onChanged();reset();
    }finally{setSaving(false)}
  }

  return <>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button variant="secondary" onClick={()=>setAction('followup')}>+ متابعة</Button>
      <Button variant="secondary" onClick={()=>setAction('task')}>+ مهمة</Button>
      <Button variant="secondary" onClick={()=>setAction('viewing')}>+ معاينة</Button>
      <Button variant="secondary" onClick={()=>setAction('note')}>+ ملاحظة</Button>
    </div>
    {action&&<Modal title={action==='followup'?'إضافة متابعة':action==='task'?'إضافة مهمة':action==='viewing'?'إضافة معاينة':'إضافة ملاحظة'} onClose={reset} maxWidth="520px"><div className="space-y-4">
      {action==='task'&&<Input placeholder="عنوان المهمة" value={title} onChange={e=>setTitle(e.target.value)}/>}
      {action==='viewing'&&<Select value={assetId} onChange={e=>setAssetId(e.target.value)}><option value="">اختر العقار</option>{assets.map(asset=><option key={asset.id} value={asset.id}>{asset.name_ar}</option>)}</Select>}
      {action==='note'&&<textarea value={note} onChange={e=>setNote(e.target.value)} rows={5} maxLength={4000} placeholder="اكتب الملاحظة…" className="w-full resize-none rounded-xl border border-border-default bg-surface-card px-3 py-2 text-sm outline-none focus:border-brand"/>}
      {action!=='note'&&<DateTimePicker value={at} onChange={setAt} placeholder="التاريخ والوقت"/>}
      <Button className="w-full" disabled={saving} onClick={()=>void save()}>{saving?'جاري الحفظ…':'حفظ'}</Button>
    </div></Modal>}
  </>;
}
