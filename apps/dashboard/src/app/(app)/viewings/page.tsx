'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { createTask, createViewing, listTasks, listViewings, updateTask, updateViewing, type CrmTask, type Viewing } from '@/lib/api/crm';
import { listLeads, updateLead } from '@/lib/api/leads';
import { listAssets } from '@/lib/api/real-estate';
import { listTeam } from '@/lib/api/team';
import { listInstallments, listLeaseContracts, type InstallmentRow, type LeaseContractRow } from '@/lib/api/rent-plus';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { datetimeLocalToIso } from '@/lib/lead/datetime';

type CalendarItem = {
  id: string;
  type: 'viewing' | 'task' | 'followup' | 'installment' | 'contract';
  title: string;
  at: string;
  href?: string;
  status: 'upcoming' | 'overdue' | 'done';
  sourceId?: string;
};

const typeLabel = { viewing: 'معاينة', task: 'مهمة', followup: 'متابعة', installment: 'استحقاق', contract: 'عقد' } as const;
const typeClass = {
  viewing: 'bg-orange-50 text-orange-700 border-orange-100',
  task: 'bg-violet-50 text-violet-700 border-violet-100',
  followup: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  installment: 'bg-blue-50 text-blue-700 border-blue-100',
  contract: 'bg-slate-50 text-slate-700 border-slate-200',
} as const;

function dayKey(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { me, accessToken } = useCurrentUser();
  const [viewings, setViewings] = useState<Viewing[] | null>(null);
  const [tasks, setTasks] = useState<CrmTask[] | null>(null);
  const [leads, setLeads] = useState<Awaited<ReturnType<typeof listLeads>>['leads'] | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [contracts, setContracts] = useState<LeaseContractRow[]>([]);
  const [assets, setAssets] = useState<Array<{id:string;name_ar:string}>>([]);
  const [team, setTeam] = useState<Array<{id:string;full_name:string}>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'task'|'followup'|'viewing'>('task');
  const [form, setForm] = useState({ title:'', leadId:'', assetId:'', userId:'', at:'' });
  const [saving, setSaving] = useState(false);
  const [activeItem, setActiveItem] = useState<CalendarItem|null>(null);
  const [actionAt, setActionAt] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([listViewings(accessToken), listTasks(accessToken), listLeads(accessToken, {})]).then(([v, t, l]) => {
      if (!active) return;
      setViewings(v.viewings);
      setTasks(t.tasks);
      setLeads(l.leads);
      void Promise.all([listInstallments(accessToken), listLeaseContracts(accessToken), listAssets(accessToken,{page_size:50}), listTeam(accessToken)])
        .then(([i,c,a,m])=>{ if(active){setInstallments(i.installments);setContracts(c.contracts);setAssets(a.assets);setTeam(m.members);} })
        .catch(()=>{});
    });
    return () => { active = false; };
  }, [accessToken]);

  const items = useMemo<CalendarItem[]>(() => {
    const now = new Date();
    const result: CalendarItem[] = [];
    for (const viewing of viewings ?? []) {
      const at = new Date(viewing.scheduled_at);
      result.push({
        id: `viewing-${viewing.id}`,
        type: 'viewing',
        title: 'معاينة عقار',
        at: viewing.scheduled_at,
        href: `/leads/${viewing.lead_id}`,
        status: ['completed', 'cancelled'].includes(viewing.status) ? 'done' : at < now ? 'overdue' : 'upcoming', sourceId: viewing.id,
      });
    }
    for (const task of tasks ?? []) {
      if (!task.due_at) continue;
      const at = new Date(task.due_at);
      result.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.title,
        at: task.due_at,
        href: task.lead_id ? `/leads/${task.lead_id}` : undefined,
        status: task.completed_at ? 'done' : at < now ? 'overdue' : 'upcoming', sourceId: task.id,
      });
    }
    for (const lead of leads ?? []) {
      if (!lead.follow_up_at) continue;
      const at = new Date(lead.follow_up_at);
      result.push({
        id: `followup-${lead.id}`,
        type: 'followup',
        title: `متابعة ${lead.full_name}`,
        at: lead.follow_up_at,
        href: `/leads/${lead.id}`,
        status: at < now ? 'overdue' : 'upcoming',
      });
    }
    for (const installment of installments) {
      result.push({
        id: `installment-${installment.id}`, type: 'installment',
        title: `استحقاق قسط #${installment.installment_number} · ${installment.remaining_amount} ر.س`,
        at: `${installment.due_date}T12:00:00`, href: `/rent-plus/contracts/${installment.contract_id}`,
        status: installment.status === 'paid' ? 'done' : new Date(`${installment.due_date}T23:59:59`) < now ? 'overdue' : 'upcoming',
      });
    }
    for (const contract of contracts) {
      result.push({
        id: `contract-${contract.id}`, type: 'contract', title: `انتهاء العقد ${contract.contract_number}`,
        at: `${contract.end_date}T12:00:00`, href: `/rent-plus/contracts/${contract.id}`,
        status: contract.status === 'terminated' ? 'done' : new Date(`${contract.end_date}T23:59:59`) < now ? 'overdue' : 'upcoming',
      });
    }
    return result.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [viewings, tasks, leads, installments, contracts]);

  const selectedKey = dayKey(selectedDate);
  const selectedItems = items.filter(item => dayKey(item.at) === selectedKey);
  const overdue = items.filter(item => item.status === 'overdue');
  const todayItems = items.filter(item => dayKey(item.at) === dayKey(new Date()));
  const monthLabel = new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(selectedDate);

  const days = useMemo(() => {
    const y = selectedDate.getFullYear(), m = selectedDate.getMonth();
    const first = new Date(y, m, 1);
    const count = new Date(y, m + 1, 0).getDate();
    const leading = first.getDay();
    return Array.from({ length: leading + count }, (_, i) => i < leading ? null : new Date(y, m, i - leading + 1));
  }, [selectedDate]);

  const loading = viewings === null || tasks === null || leads === null;
  const moveMonth = (delta: number) => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  async function refreshCrmCalendar(){const [v,t,l]=await Promise.all([listViewings(accessToken),listTasks(accessToken),listLeads(accessToken,{})]);setViewings(v.viewings);setTasks(t.tasks);setLeads(l.leads);}
  async function actOnItem(action:'complete'|'interested'|'follow_up'|'not_interested'|'reschedule'){
    if(!activeItem?.sourceId)return; setSaving(true);
    try{
      if(action==='reschedule'){const iso=datetimeLocalToIso(actionAt);if(!iso)return;if(activeItem.type==='task')await updateTask(accessToken,activeItem.sourceId,{due_at:iso});else if(activeItem.type==='viewing')await updateViewing(accessToken,activeItem.sourceId,{scheduled_at:iso,status:'rescheduled'});}
      else if(activeItem.type==='task'&&action==='complete'){await updateTask(accessToken,activeItem.sourceId,{completed_at:new Date().toISOString()});}
      else if(activeItem.type==='viewing'){await updateViewing(accessToken,activeItem.sourceId,{status:'completed',outcome:action==='complete'?null:action});}
      await refreshCrmCalendar();setActiveItem(null);setActionAt('');
    }finally{setSaving(false)}
  }
  async function addCalendarItem() {
    if (!form.at) return;
    setSaving(true);
    try {
      if (addType === 'task') {
        if (!form.title.trim()) return;
        const dueAt=datetimeLocalToIso(form.at); if(!dueAt)return;
        await createTask(accessToken,{title:form.title.trim(),lead_id:form.leadId||null,assigned_user_id:form.userId||null,due_at:dueAt});
      } else if (addType === 'followup') {
        if (!form.leadId) return;
        const followAt=datetimeLocalToIso(form.at); if(!followAt)return;
        await updateLead(accessToken,form.leadId,{follow_up_at:followAt});
      } else {
        if (!form.leadId || !form.assetId) return;
        const scheduledAt=datetimeLocalToIso(form.at); if(!scheduledAt)return;
        await createViewing(accessToken,{lead_id:form.leadId,asset_id:form.assetId,assigned_user_id:form.userId||me.user.id,scheduled_at:scheduledAt});
      }
      setShowAdd(false); setForm({title:'',leadId:'',assetId:'',userId:'',at:''});
      await refreshCrmCalendar();
    } finally { setSaving(false); }
  }

  return (
    <AppShell title="التقويم" orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">التقويم</h1>
          <p className="mt-1 text-sm text-text-secondary">مواعيدك ومعايناتك ومتابعات العملاء في مكان واحد.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ إضافة</Button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4"><p className="text-xs text-text-secondary">اليوم</p><strong className="mt-1 block text-2xl">{todayItems.length}</strong></Card>
        <Card className="p-4"><p className="text-xs text-text-secondary">متأخرة</p><strong className="mt-1 block text-2xl text-red-600">{overdue.length}</strong></Card>
        <Card className="p-4"><p className="text-xs text-text-secondary">القادمة</p><strong className="mt-1 block text-2xl">{items.filter(x => x.status === 'upcoming').length}</strong></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden p-4 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <button className="rounded-xl border border-border-default px-3 py-2" onClick={() => moveMonth(1)}>›</button>
            <h2 className="font-bold">{monthLabel}</h2>
            <button className="rounded-xl border border-border-default px-3 py-2" onClick={() => moveMonth(-1)}>‹</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-text-secondary">
            {['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map(x => <div key={x} className="py-2">{x}</div>)}
          </div>
          <div className="grid grid-cols-7 border-r border-t border-border-subtle">
            {days.map((date, index) => {
              if (!date) return <div key={`blank-${index}`} className="min-h-20 border-b border-l border-border-subtle bg-surface-subtle-3/30 md:min-h-28" />;
              const key = dayKey(date);
              const dayItems = items.filter(x => dayKey(x.at) === key);
              const active = key === selectedKey;
              return <button key={key} onClick={() => setSelectedDate(date)} className={`min-h-20 border-b border-l border-border-subtle p-1.5 text-right align-top transition-colors md:min-h-28 md:p-2 ${active ? 'bg-brand/[.06]' : 'hover:bg-surface-subtle-3/50'}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${active ? 'bg-brand text-white' : ''}`}>{date.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 2).map(item => <div key={item.id} className={`truncate rounded-md border px-1.5 py-1 text-[10px] md:text-xs ${typeClass[item.type]}`}>{item.title}</div>)}
                  {dayItems.length > 2 && <div className="text-[10px] text-text-secondary">+{dayItems.length - 2}</div>}
                </div>
              </button>;
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-medium text-brand">أجندة اليوم المحدد</p>
            <h2 className="mt-1 font-bold">{new Intl.DateTimeFormat('ar-SA', { weekday:'long', day:'numeric', month:'long' }).format(selectedDate)}</h2>
            <div className="mt-4 space-y-2">
              {loading ? <p className="text-sm text-text-secondary">جاري التحميل…</p> : selectedItems.length === 0 ? <p className="py-5 text-center text-sm text-text-secondary">لا توجد أنشطة في هذا اليوم.</p> : selectedItems.map(item => {
                const body = <div className="flex items-center gap-3 rounded-xl border border-border-subtle p-3">
                  <span className={`rounded-lg border px-2 py-1 text-xs ${typeClass[item.type]}`}>{typeLabel[item.type]}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-text-secondary">{new Intl.DateTimeFormat('ar-SA',{timeStyle:'short'}).format(new Date(item.at))}</p></div>
                  {item.status === 'overdue' && <span className="text-[11px] font-medium text-red-600">متأخر</span>}
                </div>;
                return <button type="button" className="block w-full text-right" key={item.id} onClick={()=>{setActiveItem(item);setActionAt('')}}>{body}</button>;
              })}
            </div>
          </Card>

          {overdue.length > 0 && <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="font-bold">المهام والمتابعات المتأخرة</h2><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">{overdue.length}</span></div>
            <div className="mt-3 space-y-2">{overdue.slice(0,5).map(item => <div key={item.id} className="rounded-xl bg-red-50/60 p-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-red-600">{new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.at))}</p></div>)}</div>
          </Card>}
        </div>
      </div>
      {activeItem && <Modal title={activeItem.title} onClose={()=>setActiveItem(null)} maxWidth="520px"><div className="space-y-4"><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-sm text-text-secondary">{typeLabel[activeItem.type]}</p><p className="mt-1 font-semibold">{new Intl.DateTimeFormat('ar-SA',{dateStyle:'full',timeStyle:'short'}).format(new Date(activeItem.at))}</p></div>{activeItem.href&&<Link href={activeItem.href} className="block rounded-xl border border-border-default px-4 py-3 text-center text-sm font-semibold">فتح المصدر</Link>}{activeItem.type==='viewing'&&activeItem.status!=='done'&&<div><p className="mb-2 text-sm font-semibold">نتيجة المعاينة</p><div className="grid grid-cols-3 gap-2"><Button variant="secondary" onClick={()=>void actOnItem('interested')}>مهتم</Button><Button variant="secondary" onClick={()=>void actOnItem('follow_up')}>متابعة</Button><Button variant="secondary" onClick={()=>void actOnItem('not_interested')}>غير مهتم</Button></div></div>}{activeItem.type==='task'&&activeItem.status!=='done'&&<Button className="w-full" disabled={saving} onClick={()=>void actOnItem('complete')}>تم إنجاز المهمة</Button>}{(activeItem.type==='viewing'||activeItem.type==='task')&&activeItem.status!=='done'&&<div className="space-y-2"><p className="text-sm font-semibold">إعادة الجدولة</p><DateTimePicker value={actionAt} onChange={setActionAt}/><Button className="w-full" disabled={!actionAt||saving} onClick={()=>void actOnItem('reschedule')}>حفظ الموعد الجديد</Button></div>}</div></Modal>}
      {showAdd && <Modal title="إضافة إلى التقويم" onClose={()=>setShowAdd(false)} maxWidth="560px"><div className="space-y-4"><div className="grid grid-cols-3 gap-2">{(['task','followup','viewing'] as const).map(type=><button key={type} type="button" onClick={()=>setAddType(type)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${addType===type?'border-brand bg-brand/[.06] text-brand':'border-border-default'}`}>{type==='task'?'مهمة':type==='followup'?'متابعة':'معاينة'}</button>)}</div>{addType==='task'&&<Input placeholder="عنوان المهمة" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>}<Select value={form.leadId} onChange={e=>setForm({...form,leadId:e.target.value})}><option value="">{addType==='task'?'بدون عميل (اختياري)':'اختر العميل'}</option>{(leads??[]).map(l=><option key={l.id} value={l.id}>{l.full_name}</option>)}</Select>{addType==='viewing'&&<><Select value={form.assetId} onChange={e=>setForm({...form,assetId:e.target.value})}><option value="">اختر العقار</option>{assets.map(a=><option key={a.id} value={a.id}>{a.name_ar}</option>)}</Select><Select value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})}><option value="">الموظف المسؤول (أنا)</option>{team.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</Select></>}<DateTimePicker value={form.at} onChange={at=>setForm({...form,at})} placeholder="التاريخ والوقت"/><Button className="w-full" disabled={saving} onClick={()=>void addCalendarItem()}>{saving?'جاري الحفظ…':'حفظ'}</Button></div></Modal>}
    </AppShell>
  );
}
