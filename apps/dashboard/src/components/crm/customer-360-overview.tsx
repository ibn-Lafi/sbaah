'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { Customer360Snapshot, LeadWithNotes } from '@/lib/api/leads';
import { CustomerActivityTimeline } from '@/components/crm/customer-activity-timeline';

const money = (value:number) => new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(value);
const date = (value:string) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value));
const crmStatus:Record<string,string>={new:'جديد',contacted:'تم التواصل',qualified:'مؤهل',in_progress:'قيد المتابعة',won:'مكتسب',lost:'مفقود',expired:'منتهي'};
const contractStatus:Record<string,string>={draft:'مسودة',upcoming:'قادم',active:'نشط',expired:'منتهي',terminated:'منهى',cancelled:'ملغي'};
const partyRole:Record<string,string>={lessor:'مؤجر',lessee:'مستأجر',guarantor:'ضامن',representative:'ممثل'};

export function Customer360Overview({lead,data}:{lead:LeadWithNotes;data:Customer360Snapshot}) {
  const now=Date.now();
  const activeContracts=data.contracts.filter((c)=>['active','upcoming'].includes(c.status));
  const openDeals=data.deals.filter((d)=>!['won','lost'].includes(d.status));
  const activeReservations=data.reservations.filter((r)=>['pending','active'].includes(r.status));
  const openMaintenance=data.maintenance.filter((m)=>!['completed','cancelled'].includes(m.status));
  const upcomingViewings=data.viewings.filter((v)=>new Date(v.scheduled_at).getTime()>=now&&['scheduled','rescheduled'].includes(v.status));
  const openTasks=data.tasks.filter((t)=>!t.completed_at);
  const overdueInstallments=data.installments.filter((i)=>!['paid','cancelled'].includes(i.status)&&(i.status==='overdue'||new Date(`${i.due_date}T23:59:59`).getTime()<now));
  const nextInstallment=data.installments.filter((i)=>!['paid','cancelled'].includes(i.status)&&new Date(`${i.due_date}T23:59:59`).getTime()>=now).sort((a,b)=>a.due_date.localeCompare(b.due_date))[0];
  const overdueAmount=overdueInstallments.reduce((sum,i)=>sum+Number(i.amount),0);
  const activeLessee=data.contracts.some(c=>c.status==='active'&&(c.customer_roles??[]).includes('lessee'));
  const activeLessor=data.contracts.some(c=>c.status==='active'&&(c.customer_roles??[]).includes('lessor'));
  const paid=data.payments.filter((p)=>p.status==='recorded').reduce((s,p)=>s+Number(p.amount),0);
  const nextAction=[
    ...openTasks.filter(t=>t.due_at).map(t=>({at:t.due_at!,title:t.title,type:'مهمة'})),
    ...upcomingViewings.map(v=>({at:v.scheduled_at,title:'معاينة عقار',type:'معاينة'})),
    ...(lead.follow_up_at?[{at:lead.follow_up_at,title:'متابعة العميل',type:'متابعة'}]:[]),
  ].filter(x=>new Date(x.at).getTime()>=now).sort((a,b)=>a.at.localeCompare(b.at))[0];

  const smartStatuses:Array<{label:string;tone:'danger'|'warning'|'success'|'brand'|'neutral'}>=[];
  if(overdueInstallments.length)smartStatuses.push({label:`قسط متأخر · ${money(overdueAmount)}`,tone:'danger'});
  if(openMaintenance.some(m=>m.priority==='urgent'))smartStatuses.push({label:'صيانة عاجلة',tone:'danger'});
  if(openMaintenance.length)smartStatuses.push({label:`${openMaintenance.length} طلب صيانة مفتوح`,tone:'warning'});
  if(activeLessee)smartStatuses.push({label:'مستأجر حالي',tone:'success'});
  if(activeLessor)smartStatuses.push({label:'مؤجر حالي',tone:'success'});
  if(activeContracts.length)smartStatuses.push({label:`${activeContracts.length} عقد نشط/قادم`,tone:'brand'});
  if(activeReservations.length)smartStatuses.push({label:`${activeReservations.length} حجز نشط`,tone:'brand'});
  if(upcomingViewings.length)smartStatuses.push({label:`${upcomingViewings.length} معاينة قادمة`,tone:'neutral'});
  if(openDeals.length)smartStatuses.push({label:`${openDeals.length} صفقة مفتوحة`,tone:'neutral'});
  const toneClass={danger:'border-red-200 bg-red-50 text-red-700',warning:'border-amber-200 bg-amber-50 text-amber-700',success:'border-emerald-200 bg-emerald-50 text-emerald-700',brand:'border-brand/20 bg-brand/[.06] text-brand',neutral:'border-border-default bg-surface-subtle text-text-secondary'} as const;

  const stats:Array<[string,string]>=[['CRM',crmStatus[lead.status]??lead.status]];
  if(data.viewings.length)stats.push(['المعاينات',`${data.viewings.length} معاينة`]);
  if(activeReservations.length)stats.push(['الحجوزات',`${activeReservations.length} نشط`]);
  if(openDeals.length)stats.push(['الصفقات',`${openDeals.length} مفتوحة`]);
  if(activeContracts.length)stats.push(['العقود',`${activeContracts.length} نشط`]);
  if(paid)stats.push(['المدفوعات',money(paid)]);
  if(openMaintenance.length)stats.push(['الصيانة',`${openMaintenance.length} مفتوح`]);

  return <div className="flex flex-col gap-4">
    {smartStatuses.length>0&&<Card className="p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-text-primary">الحالة الحالية</h2><p className="mt-1 text-xs text-text-secondary">مستنتجة تلقائيًا من علاقات العميل الحالية.</p></div>{overdueInstallments.length>0&&<span className="text-xs font-semibold text-red-600">يتطلب انتباه</span>}</div>
      <div className="flex flex-wrap gap-2">{smartStatuses.map((status,index)=><span key={`${status.label}-${index}`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass[status.tone]}`}>{status.label}</span>)}</div>
    </Card>}

    <Card className="p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold text-text-primary">حالة العميل في المنصة</h2><span className="text-xs text-text-secondary">ملف موحّد</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{stats.map(([label,value])=><div key={label} className="rounded-input border border-border-subtle bg-surface-subtle p-3"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 truncate text-sm font-semibold text-text-primary">{value}</p></div>)}</div>
    </Card>

    <div className="grid items-start gap-4 xl:grid-cols-[0.8fr_1.2fr_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-text-primary">الإجراء القادم</h2>
          {nextAction?<><span className="text-xs font-medium text-brand">{nextAction.type}</span><p className="mt-1 font-semibold text-text-primary">{nextAction.title}</p><p className="mt-1 text-sm text-text-secondary">{date(nextAction.at)}</p></>:<p className="text-sm text-text-secondary">لا يوجد إجراء مجدول حاليًا.</p>}
        </Card>
        {overdueInstallments.length>0?<Card className="border-red-200 p-5"><p className="text-xs font-medium text-red-600">مبالغ متأخرة</p><p className="mt-1 text-lg font-semibold text-red-700">{money(overdueAmount)}</p><p className="text-sm text-text-secondary">{overdueInstallments.length} قسط متأخر</p></Card>:nextInstallment&&<Card className="p-5"><p className="text-xs text-text-secondary">القسط القادم</p><p className="mt-1 text-lg font-semibold text-text-primary">{money(Number(nextInstallment.amount))}</p><p className="text-sm text-text-secondary">استحقاق {date(nextInstallment.due_date)}</p></Card>}
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-text-primary">العقود والإيجار</h2>{data.party&&<span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-text-secondary">مرتبط بـ Rent Plus</span>}</div>
          {!data.party?<p className="text-sm text-text-secondary">العميل غير مرتبط حاليًا بملف في Rent Plus.</p>:data.contracts.length===0?<p className="text-sm text-text-secondary">لا توجد عقود مرتبطة بهذا العميل.</p>:<div className="flex flex-col gap-3">{data.contracts.slice(0,3).map(c=><Link key={c.id} href={`/rent-plus/contracts/${c.id}`} className="rounded-input border border-border-default p-4 transition-colors hover:border-brand"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-text-primary">عقد #{c.contract_number}</p><p className="mt-1 text-xs text-text-secondary">{date(c.start_date)} — {date(c.end_date)}</p></div><span className="rounded-full bg-surface-subtle px-2 py-1 text-xs text-text-secondary">{contractStatus[c.status]??c.status}</span></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-text-secondary">{(c.customer_roles??[]).map(r=>partyRole[r]??r).join(' · ')}</span><span className="font-semibold text-text-primary">{money(Number(c.total_value))}</span></div></Link>)}</div>}
        </Card>

        {(data.deals.length>0||data.viewings.length>0||data.reservations.length>0)&&<Card className="p-5"><h2 className="mb-3 font-semibold text-text-primary">العلاقة العقارية</h2><div className="grid grid-cols-3 gap-2"><div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">المعاينات</p><p className="mt-1 font-semibold">{data.viewings.length}</p></div><div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">الحجوزات</p><p className="mt-1 font-semibold">{data.reservations.length}</p></div><div className="rounded-input bg-surface-subtle p-3"><p className="text-xs text-text-secondary">الصفقات</p><p className="mt-1 font-semibold">{data.deals.length}</p></div></div></Card>}
      </div>

      <CustomerActivityTimeline lead={lead} data={data} />
    </div>
  </div>;
}
