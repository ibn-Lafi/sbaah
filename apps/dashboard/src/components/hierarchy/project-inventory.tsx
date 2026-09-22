'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createPhase,
  createUnitType,
  getProjectSalesCenter,
  listPhases,
  listProjectAssets,
  listUnitTypes,
  type ProjectPhase,
  type ProjectSalesCenter,
  type UnitType,
} from '@/lib/api/developer-inventory';
import type { Asset } from '@sbaah/shared';
import { CreateAssetForm } from '@/components/properties/create-asset-form';

const statusLabels:Record<string,string>={available:'متاح',reserved:'محجوز',sold:'مباع',leased:'مؤجر',under_negotiation:'تحت التفاوض',negotiation:'تحت التفاوض',physically_unavailable:'غير متاح'};
const statusClasses:Record<string,string>={available:'bg-success-surface text-success',reserved:'bg-warning-surface text-warning',sold:'bg-surface-subtle-3 text-text-secondary',leased:'bg-brand-surface text-brand',under_negotiation:'bg-brand-surface text-brand',negotiation:'bg-brand-surface text-brand',physically_unavailable:'bg-danger-surface text-danger'};
const money=(value:number)=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(value);

export function ProjectInventory({projectId,accessToken,canManage}:{projectId:string;accessToken:string;canManage:boolean}){
  const[phases,setPhases]=useState<ProjectPhase[]>([]);
  const[types,setTypes]=useState<UnitType[]>([]);
  const[assets,setAssets]=useState<Asset[]>([]);
  const[sales,setSales]=useState<ProjectSalesCenter|null>(null);
  const[phaseName,setPhaseName]=useState('');
  const[typeName,setTypeName]=useState('');
  const[showAssetForm,setShowAssetForm]=useState(false);
  const load=useCallback(async()=>{
    const[p,t,a,s]=await Promise.all([listPhases(accessToken),listUnitTypes(accessToken),listProjectAssets(accessToken,projectId),getProjectSalesCenter(accessToken,projectId)]);
    setPhases(p.phases.filter(x=>x.project_id===projectId));
    setTypes(t.unit_types.filter(x=>x.project_id===projectId));
    setAssets(a.assets);
    setSales(s);
  },[accessToken,projectId]);
  useEffect(()=>{void load();},[load]);
  const phaseNames=useMemo(()=>new Map(phases.map(x=>[x.id,x.name_ar])),[phases]);
  const typeNames=useMemo(()=>new Map(types.map(x=>[x.id,x.name_ar])),[types]);

  return <div className="space-y-5">
    {sales&&<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ['إجمالي الوحدات',sales.summary.total],
        ['المتاح',sales.summary.available],
        ['المحجوز',sales.summary.reserved],
        ['تحت التفاوض',sales.summary.negotiation],
        ['المباع',sales.summary.sold],
        ['قيمة أسعار العرض',money(sales.summary.asking_value)],
        ['قيمة المبيعات',money(sales.summary.sold_value)],
        ['نسبة البيع',sales.summary.total?Math.round((sales.summary.sold/sales.summary.total)*100)+'%':'0%'],
      ].map(([label,value])=><Card key={String(label)} className="p-4"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></Card>)}
    </div>}

    <Card className="p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold">مركز مبيعات المشروع</h2><p className="mt-1 text-sm text-text-secondary">المخزون والحالة التجارية والمبيعات من مصدر البيانات الموحد.</p></div>{canManage&&<Button onClick={()=>setShowAssetForm(v=>!v)}>{showAssetForm?'إغلاق':'إضافة عقار'}</Button>}</div>
      {showAssetForm&&<div className="mb-6"><CreateAssetForm accessToken={accessToken} projectId={projectId} onCreated={async()=>{setShowAssetForm(false);await load();}}/></div>}
      <div className="grid gap-6 md:grid-cols-3">
        <section><h3 className="mb-2 font-medium">المراحل <span className="text-text-secondary">({phases.length})</span></h3>{canManage&&<div className="flex gap-2"><Input value={phaseName} onChange={e=>setPhaseName(e.target.value)} placeholder="اسم المرحلة"/><Button onClick={async()=>{if(!phaseName.trim())return;await createPhase(accessToken,{project_id:projectId,name_ar:phaseName});setPhaseName('');await load();}}>إضافة</Button></div>}</section>
        <section><h3 className="mb-2 font-medium">أنواع الوحدات <span className="text-text-secondary">({types.length})</span></h3>{canManage&&<div className="flex gap-2"><Input value={typeName} onChange={e=>setTypeName(e.target.value)} placeholder="اسم النوع"/><Button disabled={!typeName.trim()} onClick={async()=>{await createUnitType(accessToken,{project_id:projectId,name_ar:typeName,asset_type:'apartment',area_sqm:1});setTypeName('');await load();}}>إضافة</Button></div>}</section>
        <section><h3 className="mb-2 font-medium">العقارات <span className="text-text-secondary">({assets.length})</span></h3><p className="text-sm text-text-secondary">كل وحدة أصل موحد ويمكن تتبع عرضها وحجزها وبيعها.</p></section>
      </div>

      {sales&&sales.inventory.length>0&&<div className="mt-6 overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-border-subtle text-text-secondary"><th className="p-3 text-start">الوحدة</th><th className="p-3 text-start">المرحلة</th><th className="p-3 text-start">نوع الوحدة</th><th className="p-3 text-start">الحالة التجارية</th><th className="p-3 text-start">سعر العرض</th><th className="p-3 text-start">سعر البيع</th></tr></thead><tbody>{sales.inventory.map(item=>{const status=String((item.availability as {status?:string}|null)?.status??(item.won_sale?'sold':'available'));const listing=item.sale_listings[0];return <tr key={item.id} className="border-b border-border-subtle last:border-0"><td className="p-3"><Link href={`/properties/${item.id}`} className="font-medium text-brand hover:underline">{item.unit_number?item.unit_number+' · ':''}{item.name_ar}</Link></td><td className="p-3">{item.phase_id?phaseNames.get(item.phase_id)??'—':'—'}</td><td className="p-3">{item.unit_type_id?typeNames.get(item.unit_type_id)??item.asset_type:item.asset_type}</td><td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status]??'bg-surface-subtle-3 text-text-secondary'}`}>{statusLabels[status]??status}</span></td><td className="p-3">{listing?.asking_price!=null?money(Number(listing.asking_price)):'—'}</td><td className="p-3">{item.won_sale?.value!=null?money(Number(item.won_sale.value)):'—'}</td></tr>})}</tbody></table></div>}
      {sales&&sales.inventory.length===0&&<div className="mt-6 rounded-xl bg-surface-subtle-3 p-6 text-center text-sm text-text-secondary">لا توجد وحدات في المشروع حتى الآن.</div>}
    </Card>
  </div>;
}
