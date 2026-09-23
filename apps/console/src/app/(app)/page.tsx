'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { getConsoleOverview, type ConsoleOverview } from '@/lib/api/overview';

const adminShortcuts = [
 ['الحسابات','/accounts'],['الباقات','/plans'],['الثيمات','/themes'],['التذاكر والدعم','/support'],['إعدادات المنصة','/settings'],
] as const;

const metricMeta=[
 ['accounts','الحسابات','/accounts'],['active_accounts','الحسابات النشطة','/accounts'],['properties','العقارات','/accounts'],
 ['projects','المشاريع','/accounts'],['leads','العملاء المحتملون','/accounts'],['websites','المواقع','/themes'],['open_tickets','التذاكر المفتوحة','/support'],
] as const;

export default function ConsoleHomePage(){
 const {accessToken}=useCurrentAdmin(); const [data,setData]=useState<ConsoleOverview|null>(null); const [error,setError]=useState(false);
 useEffect(()=>{void getConsoleOverview(accessToken).then(setData).catch(()=>setError(true));},[accessToken]);
 return <ConsoleShell title="نظرة عامة">
  <div className="mb-6"><h1 className="text-xl font-semibold text-text-primary sm:text-2xl">إدارة منصة سبعة</h1><p className="mt-1 text-sm text-text-secondary">متابعة تشغيل المنصة والعملاء والمحتوى من مكان واحد.</p></div>
  {!data&&!error?<LoadingState/>:error?<Card className="p-5 text-sm text-danger">تعذّر تحميل إحصائيات المنصة.</Card>:data&&<>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {metricMeta.map(([key,label,href])=><Link key={key} href={href}><Card className="h-full p-5 transition-shadow hover:shadow-[0_4px_20px_rgba(31,29,34,.12)]"><p className="text-sm text-text-secondary">{label}</p><p className="mt-3 text-3xl font-semibold text-text-primary">{data.metrics[key].toLocaleString('ar-SA')}</p></Card></Link>)}
   </div>
   <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
    <Card className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-text-primary">أحدث الحسابات</h2><Link href="/accounts" className="text-sm font-medium text-brand">عرض الكل</Link></div>
     <div className="divide-y divide-border-subtle">{data.recent_accounts.map(a=><Link href={`/accounts/${a.id}`} key={a.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-text-primary">{a.name_ar||a.name_en}</p><p className="mt-1 text-xs text-text-secondary">{new Date(a.created_at).toLocaleDateString('ar-SA')}</p></div><span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-text-secondary">{a.status}</span></Link>)}</div>
    </Card>
    <Card className="p-4 sm:p-5"><h2 className="font-semibold text-text-primary">اختصارات الإدارة</h2><div className="mt-4 grid gap-2">{adminShortcuts.map(([l,h])=><Link key={h} href={h} className="rounded-xl bg-surface-subtle px-4 py-3 text-sm font-medium text-text-primary hover:bg-brand-surface hover:text-brand">{l}</Link>)}</div></Card>
   </div>
  </>}
 </ConsoleShell>;
}
