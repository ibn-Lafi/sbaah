'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { listTasks, listViewings, type CrmTask, type Viewing } from '@/lib/api/crm';
import { listLeads } from '@/lib/api/leads';

type CalendarItem = {
  id: string;
  type: 'viewing' | 'task' | 'followup';
  title: string;
  at: string;
  href?: string;
  status: 'upcoming' | 'overdue' | 'done';
};

const typeLabel = { viewing: 'معاينة', task: 'مهمة', followup: 'متابعة' } as const;
const typeClass = {
  viewing: 'bg-orange-50 text-orange-700 border-orange-100',
  task: 'bg-violet-50 text-violet-700 border-violet-100',
  followup: 'bg-emerald-50 text-emerald-700 border-emerald-100',
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

  useEffect(() => {
    let active = true;
    void Promise.all([listViewings(accessToken), listTasks(accessToken), listLeads(accessToken, {})]).then(([v, t, l]) => {
      if (!active) return;
      setViewings(v.viewings);
      setTasks(t.tasks);
      setLeads(l.leads);
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
        status: ['completed', 'cancelled'].includes(viewing.status) ? 'done' : at < now ? 'overdue' : 'upcoming',
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
        status: task.completed_at ? 'done' : at < now ? 'overdue' : 'upcoming',
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
    return result.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [viewings, tasks, leads]);

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

  return (
    <AppShell title="التقويم" orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">التقويم</h1>
          <p className="mt-1 text-sm text-text-secondary">مواعيدك ومعايناتك ومتابعات العملاء في مكان واحد.</p>
        </div>
        <Button onClick={() => location.assign('/leads')}>+ إضافة</Button>
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
                return item.href ? <Link key={item.id} href={item.href}>{body}</Link> : <div key={item.id}>{body}</div>;
              })}
            </div>
          </Card>

          {overdue.length > 0 && <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="font-bold">المهام والمتابعات المتأخرة</h2><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">{overdue.length}</span></div>
            <div className="mt-3 space-y-2">{overdue.slice(0,5).map(item => <div key={item.id} className="rounded-xl bg-red-50/60 p-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-red-600">{new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.at))}</p></div>)}</div>
          </Card>}
        </div>
      </div>
    </AppShell>
  );
}
