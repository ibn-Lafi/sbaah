'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { Customer360Snapshot, LeadWithNotes } from '@/lib/api/leads';
import { CustomerActivityTimeline } from '@/components/crm/customer-activity-timeline';

export type CustomerDetailTab = 'overview' | 'actions' | 'interests' | 'requirements' | 'viewings' | 'opportunities' | 'rent' | 'purchase' | 'maintenance';

const money = (value:number) => new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(value);
const date = (value:string) => new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value));
const contractStatus:Record<string,string>={draft:'مسودة',upcoming:'قادم',active:'نشط',expired:'منتهي',terminated:'منهى',cancelled:'ملغي'};
const partyRole:Record<string,string>={lessor:'مؤجر',lessee:'مستأجر',guarantor:'ضامن',representative:'ممثل'};
const maintenanceStatus:Record<string,string>={open:'مفتوح',in_review:'قيد المراجعة',scheduled:'مجدول',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي'};
const AssetLink=({asset}:{asset?:{id:string;name_ar:string;unit_number:string|null}|null})=>asset?<Link href={`/properties/${asset.id}`} className="font-medium text-brand hover:underline">{asset.name_ar}{asset.unit_number?` · وحدة ${asset.unit_number}`:''}</Link>:<span className="text-text-secondary">العقار غير متاح</span>;
const priorityLabel:Record<string,string>={low:'منخفضة',normal:'عادية',high:'عالية',urgent:'عاجلة'};

export function Customer360Overview({lead,data,tab='overview'}:{lead:LeadWithNotes;data:Customer360Snapshot;tab?:CustomerDetailTab}) {
  const now=Date.now();
  const upcomingViewings=data.viewings.filter((v)=>new Date(v.scheduled_at).getTime()>=now&&['scheduled','rescheduled'].includes(v.status));
  const openTasks=data.tasks.filter((t)=>!t.completed_at);
  const overdueInstallments=data.installments.filter((i)=>!['paid','cancelled'].includes(i.status)&&(i.status==='overdue'||new Date(`${i.due_date}T23:59:59`).getTime()<now));
  const nextInstallment=data.installments.filter((i)=>!['paid','cancelled'].includes(i.status)&&new Date(`${i.due_date}T23:59:59`).getTime()>=now).sort((a,b)=>a.due_date.localeCompare(b.due_date))[0];
  const overdueAmount=overdueInstallments.reduce((sum,i)=>sum+Number(i.amount),0);
  const paid=data.payments.filter((p)=>p.status==='recorded').reduce((sum,p)=>sum+Number(p.amount),0);
  const nextAction=[
    ...openTasks.filter(t=>t.due_at).map(t=>({at:t.due_at!,title:t.title,type:'مهمة'})),
    ...upcomingViewings.map(v=>({at:v.scheduled_at,title:'معاينة عقار',type:'معاينة'})),
    ...(lead.follow_up_at?[{at:lead.follow_up_at,title:'متابعة العميل',type:'متابعة'}]:[]),
  ].filter(x=>new Date(x.at).getTime()>=now).sort((a,b)=>a.at.localeCompare(b.at))[0];

  if(tab==='overview') return <CustomerActivityTimeline lead={lead} data={data}/>;

  if(tab==='actions') return <div className="grid gap-3 md:grid-cols-2">
    <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold text-text-primary">الإجراء القادم</h2>{nextAction?<><span className="text-xs font-medium text-brand">{nextAction.type}</span><p className="mt-1 font-semibold">{nextAction.title}</p><p className="mt-1 text-sm text-text-secondary">{date(nextAction.at)}</p></>:<p className="text-sm text-text-secondary">لا يوجد إجراء مجدول حاليًا.</p>}</Card>
    <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold text-text-primary">المهام والمتابعات</h2>{openTasks.length===0?<p className="text-sm text-text-secondary">لا توجد مهام مفتوحة.</p>:<div className="space-y-2">{openTasks.map(task=><div key={task.id} className="rounded-input border border-border-subtle p-3"><p className="font-medium">{task.title}</p>{task.due_at&&<p className="mt-1 text-xs text-text-secondary">{date(task.due_at)}</p>}</div>)}</div>}</Card>
    <Card className="p-4 md:p-5 md:col-span-2"><h2 className="mb-3 font-semibold text-text-primary">المعاينات القادمة</h2>{upcomingViewings.length===0?<p className="text-sm text-text-secondary">لا توجد معاينات قادمة.</p>:<div className="grid gap-2 sm:grid-cols-2">{upcomingViewings.map(viewing=><div key={viewing.id} className="rounded-input border border-border-subtle p-3"><AssetLink asset={viewing.assets}/><p className="mt-1 text-xs text-text-secondary">{date(viewing.scheduled_at)}</p></div>)}</div>}</Card>
  </div>;

  if(tab==='viewings') return <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold">المعاينات</h2>{data.viewings.length===0?<p className="text-sm text-text-secondary">لا توجد معاينات مسجلة لهذا العميل المحتمل.</p>:<div className="grid gap-3 md:grid-cols-2">{data.viewings.map(viewing=><div key={viewing.id} className="rounded-input border border-border-subtle p-4"><div className="flex items-start justify-between gap-3"><AssetLink asset={viewing.assets}/><span className="text-xs text-text-secondary">{viewing.status}</span></div><p className="mt-2 text-sm text-text-secondary">{date(viewing.scheduled_at)}</p>{viewing.outcome&&<p className="mt-2 text-xs text-text-secondary">النتيجة: {viewing.outcome}</p>}</div>)}</div>}</Card>;

  if(tab==='opportunities') return <div className="grid gap-3 md:grid-cols-2">
    <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold">الحجوزات</h2>{data.reservations.length===0?<p className="text-sm text-text-secondary">لا توجد حجوزات حالية.</p>:<div className="space-y-2">{data.reservations.map(r=><div key={r.id} className="rounded-input border border-border-subtle p-3"><p className="font-medium">حجز #{r.reservation_number}</p><div className="mt-1 flex flex-wrap gap-2 text-xs">{(r.reservation_assets??[]).map(x=><AssetLink key={x.asset_id} asset={x.assets}/>)}</div><p className="mt-1 text-xs text-text-secondary">{date(r.reserved_at)} · {r.status}</p></div>)}</div>}</Card>
    <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold">الصفقات المحتملة</h2>{data.deals.length===0?<p className="text-sm text-text-secondary">لا توجد صفقات مسجلة.</p>:<div className="space-y-2">{data.deals.map(d=><div key={d.id} className="rounded-input border border-border-subtle p-3"><div className="flex justify-between gap-2"><p className="font-medium">صفقة عقارية</p><span className="text-xs text-text-secondary">{d.status}</span></div><div className="mt-1 flex flex-wrap gap-2 text-xs">{(d.deal_assets??[]).map(x=><AssetLink key={x.asset_id} asset={x.assets}/>)}</div><div className="mt-1 flex flex-wrap gap-2 text-xs">{(d.deal_assets??[]).map(x=><AssetLink key={x.asset_id} asset={x.assets}/>)}</div><p className="mt-1 text-xs text-text-secondary">{d.value?money(Number(d.value)):'القيمة غير محددة'}</p></div>)}</div>}</Card>
  </div>;

  if(tab==='rent') return <div className="grid gap-3 lg:grid-cols-2">
    <Card className="p-4 md:p-5 lg:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">العقود والإيجار</h2>{data.party&&<span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-text-secondary">مرتبط بـ Rent Plus</span>}</div>{!data.party?<p className="text-sm text-text-secondary">العميل غير مرتبط بملف Rent Plus.</p>:data.contracts.length===0?<p className="text-sm text-text-secondary">لا توجد عقود مرتبطة بهذا العميل.</p>:<div className="grid gap-3 md:grid-cols-2">{data.contracts.map(c=><Link key={c.id} href={`/rent-plus/contracts/${c.id}`} className="rounded-input border border-border-default p-4 hover:border-brand"><div className="flex justify-between gap-3"><div><p className="font-semibold">عقد #{c.contract_number}</p><p className="mt-1 text-xs text-text-secondary">{date(c.start_date)} — {date(c.end_date)}</p></div><span className="text-xs text-text-secondary">{contractStatus[c.status]??c.status}</span></div><div className="mt-3 flex flex-wrap gap-2 text-xs">{(c.lease_contract_assets??[]).map(x=><AssetLink key={x.asset_id} asset={x.assets}/>)}</div><div className="mt-3 flex justify-between text-sm"><span className="text-text-secondary">{(c.customer_roles??[]).map(r=>partyRole[r]??r).join(' · ')}</span><strong>{money(Number(c.total_value))}</strong></div></Link>)}</div>}</Card>
    <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold">الأقساط</h2>{overdueInstallments.length>0?<><p className="text-xs text-red-600">متأخر</p><p className="mt-1 text-lg font-semibold text-red-700">{money(overdueAmount)}</p><p className="text-sm text-text-secondary">{overdueInstallments.length} قسط متأخر</p></>:nextInstallment?<><p className="text-xs text-text-secondary">القسط القادم</p><p className="mt-1 text-lg font-semibold">{money(Number(nextInstallment.amount))}</p><p className="text-sm text-text-secondary">استحقاق {date(nextInstallment.due_date)}</p></>:<p className="text-sm text-text-secondary">لا توجد أقساط مستحقة.</p>}</Card>
    <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold">الدفعات</h2><p className="text-lg font-semibold">{money(paid)}</p><p className="text-sm text-text-secondary">{data.payments.length} دفعة مرتبطة بالعميل</p></Card>
  </div>;

  if(tab==='purchase') return <div className="grid gap-3 md:grid-cols-3">
    <Card className="p-4 md:p-5"><p className="text-xs text-text-secondary">الصفقات</p><p className="mt-1 text-2xl font-semibold">{data.deals.length}</p></Card>
    <Card className="p-4 md:p-5"><p className="text-xs text-text-secondary">الحجوزات</p><p className="mt-1 text-2xl font-semibold">{data.reservations.length}</p></Card>
    <Card className="p-4 md:p-5"><p className="text-xs text-text-secondary">المعاينات</p><p className="mt-1 text-2xl font-semibold">{data.viewings.length}</p></Card>
    <Card className="p-4 md:p-5 md:col-span-3"><h2 className="mb-3 font-semibold">الصفقات والحجوزات</h2>{data.deals.length===0&&data.reservations.length===0?<p className="text-sm text-text-secondary">لا توجد عمليات شراء أو حجوزات مرتبطة بالعميل.</p>:<div className="space-y-2">{data.reservations.map(r=><div key={r.id} className="rounded-input border border-border-subtle p-3"><p className="font-medium">حجز #{r.reservation_number}</p><div className="mt-1 flex flex-wrap gap-2 text-xs">{(r.reservation_assets??[]).map(x=><AssetLink key={x.asset_id} asset={x.assets}/>)}</div><p className="mt-1 text-xs text-text-secondary">{date(r.reserved_at)}</p></div>)}{data.deals.map(d=><div key={d.id} className="rounded-input border border-border-subtle p-3"><p className="font-medium">صفقة عقارية</p><p className="mt-1 text-xs text-text-secondary">{d.value?money(Number(d.value)):'القيمة غير محددة'}</p></div>)}</div>}</Card>
  </div>;

  return <Card className="p-4 md:p-5"><h2 className="mb-3 font-semibold">الصيانة</h2>{data.maintenance.length===0?<p className="text-sm text-text-secondary">لا توجد طلبات صيانة مرتبطة بهذا العميل.</p>:<div className="grid gap-3 md:grid-cols-2">{data.maintenance.map(item=><div key={item.id} className="rounded-input border border-border-subtle p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-text-secondary">طلب #{item.request_number}{item.assets?.name_ar?` · ${item.assets.name_ar}`:''}</p></div><span className="text-xs text-text-secondary">{maintenanceStatus[item.status]??item.status}</span></div><p className="mt-3 text-xs text-text-secondary">الأولوية: {priorityLabel[item.priority]??item.priority} · {date(item.opened_at)}</p></div>)}</div>}</Card>;
}
