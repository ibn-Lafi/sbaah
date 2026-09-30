'use client';
import {useEffect,useState} from 'react';
import {ConsoleShell} from '@/components/layout/console-shell';
import {Card} from '@/components/ui/card';
import {useCurrentAdmin} from '@/lib/auth/current-admin-context';
import {listPlanRequests,updatePlanRequest,type PlanRequest,type PlanRequestStatus} from '@/lib/api/plan-requests';

const labels:Record<PlanRequestStatus,string>={new:'جديد',contacted:'تم التواصل',negotiating:'قيد التفاوض',accepted:'تم القبول',closed:'مغلق'};
export default function PlanRequestsPage(){
 const {accessToken}=useCurrentAdmin(); const [items,setItems]=useState<PlanRequest[]|null>(null);
 useEffect(()=>{void listPlanRequests(accessToken).then(r=>setItems(r.requests))},[accessToken]);
 async function change(id:string,status:PlanRequestStatus){const r=await updatePlanRequest(accessToken,id,status);setItems(v=>v?.map(x=>x.id===id?r.request:x)??null)}
 return <ConsoleShell title="طلبات الباقات"><Card className="overflow-x-auto">{items===null?<p className="p-6 text-text-secondary">جاري التحميل...</p>:items.length===0?<p className="p-6 text-center text-text-secondary">لا توجد طلبات باقات</p>:<table className="min-w-[900px] w-full text-sm"><thead className="bg-surface-header text-right text-text-secondary"><tr><th className="px-5 py-3">الباقة</th><th className="px-5 py-3">الاسم</th><th className="px-5 py-3">التواصل</th><th className="px-5 py-3">التفاصيل</th><th className="px-5 py-3">التاريخ</th><th className="px-5 py-3">الحالة</th></tr></thead><tbody>{items.map(x=><tr key={x.id} className="border-t border-border-subtle align-top"><td className="px-5 py-4 font-semibold">{x.plans?.name_ar??'الخزامى'}</td><td className="px-5 py-4">{x.full_name}</td><td className="px-5 py-4"><div dir="ltr">{x.phone}</div><div className="text-text-secondary">{x.email}</div></td><td className="max-w-xs px-5 py-4 text-text-secondary">{x.details||'—'}</td><td className="px-5 py-4 text-text-secondary">{new Date(x.created_at).toLocaleDateString('ar-SA')}</td><td className="px-5 py-4"><select value={x.status} onChange={e=>void change(x.id,e.target.value as PlanRequestStatus)} className="rounded-xl border border-border-subtle bg-surface-page px-3 py-2">{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td></tr>)}</tbody></table>}</Card></ConsoleShell>
}