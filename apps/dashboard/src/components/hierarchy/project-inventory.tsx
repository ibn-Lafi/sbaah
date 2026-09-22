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
  const[search,setSearch]=useState('');
  const[phaseFilter,setPhaseFilter]=useState('all');
  const[typeFilter,setTypeFilter]=useState('all');
  const[statusFilter,setStatusFilter]=useState('all');
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
  const filteredInventory=useMemo(()=>{const q=search.trim().toLowerCase();return (sales?.inventory??[]).filter(item=>{const status=item.won_sale?'sold':item.active_sale_deal?'negotiation':String((item.availability as {status?:string}|null)?.status??'available');const matchesSearch=!q||item.name_ar.toLowerCase().includes(q)||(item.unit_number??'').toLowerCase().includes(q);return matchesSearch&&(phaseFilter==='all'||item.phase_id===phaseFilter)&&(typeFilter==='all'||item.unit_type_id===typeFilter)&&(statusFilter==='all'||status===statusFilter);});},[sales,search,phaseFilter,typeFilter,statusFilter]);
  const summarize=useCallback((items:ProjectSalesCenter['inventory'])=>items.reduce((acc,item)=>{const status=item.won_sale?'sold':item.active_sale_deal?'negotiation':String((item.availability as {status?:string}|null)?.status??'available');acc.total++;if(status==='sold')acc.sold++;else if(status==='reserved')acc.reserved++;else if(status==='negotiation')acc.negotiation++;else if(status==='available')acc.available++;else if(status==='leased')acc.leased++;else acc.unavailable++;if(item.won_sale?.value!=null)acc.soldValue+=Number(item.won_sale.value);return acc;},{total:0,available:0,reserved:0,negotiation:0,sold:0,leased:0,unavailable:0,soldValue:0}),[]);
  const phaseGroups=useMemo(()=>phases.map(phase=>({id:phase.id,name:phase.name_ar,...summarize((sales?.inventory??[]).filter(item=>item.phase_id===phase.id))})).filter(x=>x.total>0),[phases,sales,summarize]);
  const typeGroups=useMemo(()=>types.map(type=>({id:type.id,name:type.name_ar,...summarize((sales?.inventory??[]).filter(item=>item.unit_type_id===type.id))})).filter(x=>x.total>0),[types,sales,summarize]);
  const matrix=useMemo(()=>phases.map(phase=>({phase,cells:types.map(type=>({type,...summarize((sales?.inventory??[]).filter(item=>item.phase_id===phase.id&&item.unit_type_id===type.id))}))})).filter(row=>row.cells.some(cell=>cell.total>0)),[phases,types,sales,summarize]);
  const unclassified=useMemo(()=>summarize((sales?.inventory??[]).filter(item=>!item.phase_id||!item.unit_type_id)),[sales,summarize]);
  const clearFilters=()=>{setSearch('');setPhaseFilter('all');setTypeFilter('all');setStatusFilter('all')};
  const drillMatrix=(phaseId:string,typeId:string,status='all')=>{setPhaseFilter(phaseId);setTypeFilter(typeId);setStatusFilter(status);setSearch('');document.getElementById('project-inventory-table')?.scrollIntoView({behavior:'smooth',block:'start'});};

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

    {sales&&<Card className="p-5 md:p-6"><div className="mb-4"><h3 className="font-semibold">تحليلات المبيعات</h3><p className="mt-1 text-xs text-text-secondary">مؤشرات مشتقة مباشرة من الصفقات والمخزون الحالي للمشروع.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-xs text-text-secondary">الإيرادات المحققة</p><p className="mt-1 font-semibold">{money(sales.analytics.revenue)}</p></div><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-xs text-text-secondary">متوسط سعر البيع</p><p className="mt-1 font-semibold">{money(sales.analytics.average_sale_price)}</p></div><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-xs text-text-secondary">متوسط مدة الإغلاق</p><p className="mt-1 font-semibold">{Math.round(sales.analytics.average_days_to_close)} يوم</p></div><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-xs text-text-secondary">نسبة البيع من المخزون</p><p className="mt-1 font-semibold">{Math.round(sales.analytics.sell_through_rate*100)}%</p></div><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-xs text-text-secondary">نسبة الوحدات بالتفاوض</p><p className="mt-1 font-semibold">{Math.round(sales.analytics.negotiation_rate*100)}%</p></div><div className="rounded-xl bg-surface-subtle-3 p-4"><p className="text-xs text-text-secondary">سعر البيع مقابل سعر العرض</p><p className="mt-1 font-semibold">{Math.round(sales.analytics.asking_to_sale_ratio*100)}%</p></div></div></Card>}

    {sales&&<Card className="p-5 md:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">قمع المبيعات</h3><p className="mt-1 text-xs text-text-secondary">عملاء فريدون مرتبطون بوحدات هذا المشروع في كل مرحلة.</p></div><div className="text-end"><p className="text-xs text-text-secondary">التحويل من الاهتمام إلى البيع</p><p className="text-lg font-semibold">{Math.round(sales.funnel.overall_conversion*100)}%</p></div></div><div className="grid gap-2 sm:grid-cols-5">{sales.funnel.stages.map((stage,index)=>{const labels={interest:'اهتمام',viewing:'معاينة',reservation:'حجز',negotiation:'تفاوض',won:'بيع مكتمل'};return <div key={stage.stage} className="rounded-xl border border-border-subtle p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs text-text-secondary">{labels[stage.stage]}</p><strong>{stage.count}</strong></div>{index>0&&<div className="mt-3 border-t border-border-subtle pt-2 text-[11px] text-text-secondary"><p>تحويل {Math.round(stage.conversion_from_previous*100)}%</p><p>تسرب {Math.round(stage.drop_off_from_previous*100)}%</p></div>}</div>})}</div></Card>}

    {sales&&sales.inventory.length>0&&<div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5"><div className="mb-4"><h3 className="font-semibold">أداء مراحل المشروع</h3><p className="mt-1 text-xs text-text-secondary">توزيع المخزون والمبيعات على مراحل المشروع.</p></div><div className="space-y-3">{phaseGroups.length?phaseGroups.map(group=><button type="button" key={group.id} onClick={()=>setPhaseFilter(group.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border-subtle p-3 text-start hover:bg-surface-subtle-3"><div><p className="font-medium">{group.name}</p><p className="mt-1 text-xs text-text-secondary">{group.total} وحدة · {group.available} متاح · {group.reserved} محجوز · {group.negotiation} تفاوض · {group.sold} مباع</p></div><span className="text-sm font-semibold">{money(group.soldValue)}</span></button>):<p className="text-sm text-text-secondary">لا توجد وحدات مرتبطة بمراحل حتى الآن.</p>}</div></Card>
      <Card className="p-5"><div className="mb-4"><h3 className="font-semibold">أداء أنواع الوحدات</h3><p className="mt-1 text-xs text-text-secondary">مقارنة المخزون والمبيعات حسب نوع الوحدة.</p></div><div className="space-y-3">{typeGroups.length?typeGroups.map(group=><button type="button" key={group.id} onClick={()=>setTypeFilter(group.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border-subtle p-3 text-start hover:bg-surface-subtle-3"><div><p className="font-medium">{group.name}</p><p className="mt-1 text-xs text-text-secondary">{group.total} وحدة · {group.available} متاح · {group.reserved} محجوز · {group.sold} مباع</p></div><span className="text-sm font-semibold">{money(group.soldValue)}</span></button>):<p className="text-sm text-text-secondary">لا توجد وحدات مرتبطة بأنواع وحدات حتى الآن.</p>}</div></Card>
    </div>}

    {sales&&matrix.length>0&&<Card className="p-5 md:p-6"><div className="mb-4"><h3 className="font-semibold">مصفوفة المخزون</h3><p className="mt-1 text-xs text-text-secondary">المرحلة × نوع الوحدة. اضغط على أي خلية لعرض وحداتها مباشرة.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border-subtle"><th className="p-3 text-start text-text-secondary">المرحلة</th>{types.map(type=><th key={type.id} className="p-3 text-start text-text-secondary">{type.name_ar}</th>)}</tr></thead><tbody>{matrix.map(row=><tr key={row.phase.id} className="border-b border-border-subtle last:border-0"><th className="p-3 text-start font-medium">{row.phase.name_ar}</th>{row.cells.map(cell=><td key={cell.type.id} className="p-2">{cell.total?<button type="button" onClick={()=>drillMatrix(row.phase.id,cell.type.id)} className="w-full rounded-xl border border-border-subtle p-3 text-start hover:border-brand hover:bg-brand-surface"><div className="flex items-center justify-between gap-2"><strong>{cell.total}</strong><span className="text-xs text-text-secondary">وحدة</span></div><div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-text-secondary"><span className="text-success">{cell.available} متاح</span><span>{cell.reserved} محجوز</span><span>{cell.negotiation} تفاوض</span><span>{cell.sold} مباع</span></div></button>:<div className="rounded-xl border border-dashed border-border-subtle p-3 text-center text-text-secondary">—</div>}</td>)}</tr>)}</tbody></table></div>{unclassified.total>0&&<button type="button" onClick={()=>{clearFilters();document.getElementById('project-inventory-table')?.scrollIntoView({behavior:'smooth',block:'start'})}} className="mt-4 w-full rounded-xl border border-dashed border-warning p-3 text-start text-sm"><strong>{unclassified.total} وحدة غير مكتملة التصنيف</strong><span className="ms-2 text-xs text-text-secondary">تحتاج ربط مرحلة أو نوع وحدة لتظهر داخل المصفوفة.</span></button>}</Card>}

    <Card className="p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold">مركز مبيعات المشروع</h2><p className="mt-1 text-sm text-text-secondary">المخزون والحالة التجارية والمبيعات من مصدر البيانات الموحد.</p></div>{canManage&&<Button onClick={()=>setShowAssetForm(v=>!v)}>{showAssetForm?'إغلاق':'إضافة عقار'}</Button>}</div>
      {showAssetForm&&<div className="mb-6"><CreateAssetForm accessToken={accessToken} projectId={projectId} onCreated={async()=>{setShowAssetForm(false);await load();}}/></div>}
      <div className="grid gap-6 md:grid-cols-3">
        <section><h3 className="mb-2 font-medium">المراحل <span className="text-text-secondary">({phases.length})</span></h3>{canManage&&<div className="flex gap-2"><Input value={phaseName} onChange={e=>setPhaseName(e.target.value)} placeholder="اسم المرحلة"/><Button onClick={async()=>{if(!phaseName.trim())return;await createPhase(accessToken,{project_id:projectId,name_ar:phaseName});setPhaseName('');await load();}}>إضافة</Button></div>}</section>
        <section><h3 className="mb-2 font-medium">أنواع الوحدات <span className="text-text-secondary">({types.length})</span></h3>{canManage&&<div className="flex gap-2"><Input value={typeName} onChange={e=>setTypeName(e.target.value)} placeholder="اسم النوع"/><Button disabled={!typeName.trim()} onClick={async()=>{await createUnitType(accessToken,{project_id:projectId,name_ar:typeName,asset_type:'apartment',area_sqm:1});setTypeName('');await load();}}>إضافة</Button></div>}</section>
        <section><h3 className="mb-2 font-medium">العقارات <span className="text-text-secondary">({assets.length})</span></h3><p className="text-sm text-text-secondary">كل وحدة أصل موحد ويمكن تتبع عرضها وحجزها وبيعها.</p></section>
      </div>

      {sales&&sales.inventory.length>0&&<><div className="mt-6 grid gap-3 md:grid-cols-4"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو رقم الوحدة"/><select className="h-10 rounded-xl border border-border-default bg-surface-card px-3 text-sm" value={phaseFilter} onChange={e=>setPhaseFilter(e.target.value)}><option value="all">كل المراحل</option>{phases.map(p=><option key={p.id} value={p.id}>{p.name_ar}</option>)}</select><select className="h-10 rounded-xl border border-border-default bg-surface-card px-3 text-sm" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="all">كل أنواع الوحدات</option>{types.map(t=><option key={t.id} value={t.id}>{t.name_ar}</option>)}</select><select className="h-10 rounded-xl border border-border-default bg-surface-card px-3 text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">كل الحالات</option><option value="available">متاح</option><option value="reserved">محجوز</option><option value="leased">مؤجر</option><option value="negotiation">تحت التفاوض</option><option value="sold">مباع</option><option value="physically_unavailable">غير متاح</option></select></div><div className="mt-3 flex items-center justify-between text-xs text-text-secondary"><span>النتائج: {filteredInventory.length} من {sales.inventory.length}</span>{(search||phaseFilter!=='all'||typeFilter!=='all'||statusFilter!=='all')&&<button type="button" className="text-brand hover:underline" onClick={clearFilters}>مسح الفلاتر</button>}</div><div id="project-inventory-table" className="mt-3 scroll-mt-24 overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-border-subtle text-text-secondary"><th className="p-3 text-start">الوحدة</th><th className="p-3 text-start">المرحلة</th><th className="p-3 text-start">نوع الوحدة</th><th className="p-3 text-start">الحالة التجارية</th><th className="p-3 text-start">سعر العرض</th><th className="p-3 text-start">سعر البيع</th></tr></thead><tbody>{filteredInventory.map(item=>{const status=item.won_sale?'sold':item.active_sale_deal?'negotiation':String((item.availability as {status?:string}|null)?.status??'available');const listing=item.sale_listings[0];return <tr key={item.id} className="border-b border-border-subtle last:border-0"><td className="p-3"><Link href={`/properties/${item.id}`} className="font-medium text-brand hover:underline">{item.unit_number?item.unit_number+' · ':''}{item.name_ar}</Link></td><td className="p-3">{item.phase_id?phaseNames.get(item.phase_id)??'—':'—'}</td><td className="p-3">{item.unit_type_id?typeNames.get(item.unit_type_id)??item.asset_type:item.asset_type}</td><td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status]??'bg-surface-subtle-3 text-text-secondary'}`}>{statusLabels[status]??status}</span></td><td className="p-3">{listing?.asking_price!=null?money(Number(listing.asking_price)):'—'}</td><td className="p-3">{item.won_sale?.value!=null?money(Number(item.won_sale.value)):'—'}</td></tr>})}</tbody></table>{filteredInventory.length===0&&<div className="p-6 text-center text-sm text-text-secondary">لا توجد وحدات مطابقة للفلاتر الحالية.</div>}</div></>}
      {sales&&sales.inventory.length===0&&<div className="mt-6 rounded-xl bg-surface-subtle-3 p-6 text-center text-sm text-text-secondary">لا توجد وحدات في المشروع حتى الآن.</div>}
    </Card>
  </div>;
}
