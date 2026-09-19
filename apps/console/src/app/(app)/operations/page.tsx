'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { getOperations,type OperationsOverview } from '@/lib/api/operations';

export default function OperationsPage(){
 const {accessToken}=useCurrentAdmin(); const [data,setData]=useState<OperationsOverview|null>(null); const [error,setError]=useState(false);
 useEffect(()=>{void getOperations(accessToken).then(setData).catch(()=>setError(true));},[accessToken]);
 const cards=data?[['العقارات',data.totals.properties],['المشاريع',data.totals.projects],['عملاء CRM',data.totals.leads],['المواقع',data.totals.websites],['الدومينات المفعلة',data.totals.verified_domains],['التذاكر المفتوحة',data.totals.open_tickets]]: [];
 return <ConsoleShell title="تشغيل المنصة">
  <div className="mb-6"><h1 className="text-xl font-semibold text-text-primary sm:text-2xl">مراقبة تشغيل المنصة</h1><p className="mt-1 text-sm text-text-secondary">نظرة مركزية على استخدام سبعة ونشاط الخدمات عبر جميع الحسابات.</p></div>
  {!data&&!error?<LoadingState/>:error?<Card className="p-5 text-sm text-danger">تعذّر تحميل بيانات التشغيل.</Card>:data&&<>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([l,v])=><Card key={String(l)} className="p-4 sm:p-5"><p className="text-sm text-text-secondary">{l}</p><p className="mt-3 text-3xl font-semibold text-text-primary">{Number(v).toLocaleString('ar-SA')}</p></Card>)}</div>
   <div className="mt-6 grid gap-4 lg:grid-cols-2">
    <Card className="p-4 sm:p-5"><h2 className="font-semibold text-text-primary">النشاط خلال 30 يومًا</h2><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{[['عقارات جديدة',data.last_30_days.properties],['مشاريع جديدة',data.last_30_days.projects],['عملاء CRM جدد',data.last_30_days.leads]].map(([l,v])=><div key={String(l)} className="rounded-xl bg-surface-subtle p-4"><p className="text-xs text-text-secondary">{l}</p><p className="mt-2 text-xl font-semibold text-text-primary">{Number(v).toLocaleString('ar-SA')}</p></div>)}</div></Card>
    <Card className="p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-text-primary">أحدث الحسابات</h2><Link href="/accounts" className="text-sm font-medium text-brand">عرض الكل</Link></div><div className="mt-3 divide-y divide-border-subtle">{data.recent_accounts.map(a=><Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center justify-between py-3 text-sm"><span className="font-medium text-text-primary">{a.name_ar}</span><span className="text-xs text-text-secondary">{new Date(a.created_at).toLocaleDateString('ar-SA')}</span></Link>)}</div></Card>
   </div>
  </>}
 </ConsoleShell>;
}
