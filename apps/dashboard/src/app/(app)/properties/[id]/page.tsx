'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { isNotFoundError, type Asset } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { CreateAssetForm, assetTypeLabels } from '@/components/properties/create-asset-form';
import { AssetMediaManager } from '@/components/properties/asset-media-manager';
import { CreateListingForm } from '@/components/properties/create-listing-form';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DetailLoadError } from '@/components/ui/detail-load-error';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { Modal } from '@/components/ui/modal';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { archiveAsset, getAsset, getAssetRelationships, listListings, updateAsset, type AssetDetailResponse, type AssetRelationships, type AssetWithMedia, type ListingWithAssets } from '@/lib/api/real-estate';

type AssetSection = 'overview' | 'media' | 'units' | 'offers' | 'activity';

const statuses: Record<string, string> = { planned: 'مخطط', under_construction: 'تحت الإنشاء', ready: 'جاهز', maintenance: 'صيانة', inactive: 'غير نشط' };

export default function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, accessToken } = useCurrentUser();
  const [asset, setAsset] = useState<AssetWithMedia | null>(null);
  const [parent, setParent] = useState<Asset | null>(null);
  const [children, setChildren] = useState<AssetDetailResponse['children']>([]);
  const [listings, setListings] = useState<ListingWithAssets[]>([]);
  const [relationships, setRelationships] = useState<AssetRelationships | null>(null);
  const [availability,setAvailability]=useState<{status:string;reason?:string|null}|null>(null);
  const [effectiveLocation,setEffectiveLocation]=useState<AssetDetailResponse['effective_location']|null>(null);
  const [project,setProject]=useState<{id:string;name_ar:string}|null>(null); const [phase,setPhase]=useState<{id:string;name_ar:string}|null>(null); const [unitType,setUnitType]=useState<{id:string;name_ar:string}|null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showListing, setShowListing] = useState(false);
  const [showChild, setShowChild] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AssetSection>('overview');

  const load = () => Promise.all([getAsset(accessToken, id), listListings(accessToken), getAssetRelationships(accessToken, id)]).then(([detail, listingResult, relationResult]) => {
    setAsset(detail.asset); setParent(detail.parent); setChildren(detail.children); setAvailability(detail.availability); setEffectiveLocation(detail.effective_location); setProject(detail.project); setPhase(detail.phase); setUnitType(detail.unit_type); setListings(listingResult.listings); setRelationships(relationResult.relationships);
    setNotFound(false); setLoadError(null);
  });

  useEffect(() => { let active = true; void load().catch((err) => { if (!active) return; if (isNotFoundError(err)) setNotFound(true); else setLoadError(err instanceof Error ? err.message : 'تعذّر تحميل بيانات العقار.'); }); return () => { active = false; }; }, [accessToken, id, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const offers = useMemo(() => listings.filter(listing => (listing.listing_assets ?? []).some(relation => relation.asset_id === id)), [listings, id]);
  const sale = useMemo(() => relationships?.deals.map(link => link.deals).find(deal => deal?.status === 'won' && deal.deal_type === 'sale') ?? null, [relationships]);
  const activeLease=useMemo(()=>relationships?.leases.map(x=>x.lease_contracts).find(x=>x?.status==='active')??null,[relationships]);
  const availabilityLabels:Record<string,string>={available:'متاح',reserved:'محجوز',leased:'مؤجر',sold:'مباع',physically_unavailable:'غير متاح'};
  const timeline=useMemo(()=>{if(!relationships)return[];const rows:Array<{id:string;at:string;label:string;detail:string;href?:string}>=[];relationships.interests.forEach(x=>rows.push({id:`interest-${x.id}`,at:x.created_at,label:'اهتمام',detail:x.leads?.full_name??'عميل',href:x.leads?`/leads/${x.leads.id}`:undefined}));relationships.viewings.forEach(x=>rows.push({id:`viewing-${x.id}`,at:x.scheduled_at,label:'معاينة',detail:`${x.leads?.full_name??'عميل'} · ${x.status}`,href:x.leads?`/leads/${x.leads.id}`:undefined}));relationships.reservations.forEach(x=>x.reservations&&rows.push({id:`reservation-${x.reservation_id}`,at:x.reservations.reserved_at,label:'حجز',detail:`#${x.reservations.reservation_number} · ${x.reservations.status}`}));relationships.deals.forEach(x=>x.deals&&rows.push({id:`deal-${x.deal_id}`,at:x.deals.closed_at??x.deals.created_at,label:x.deals.deal_type==='sale'?'صفقة بيع':'صفقة إيجار',detail:`${x.deals.leads?.full_name??'عميل'} · ${x.deals.status}`,href:x.deals.leads?`/leads/${x.deals.leads.id}`:undefined}));relationships.leases.forEach(x=>x.lease_contracts&&rows.push({id:`lease-${x.contract_id}`,at:x.lease_contracts.start_date,label:'عقد إيجار',detail:`#${x.lease_contracts.contract_number} · ${x.lease_contracts.status}`,href:`/rent-plus/contracts/${x.contract_id}`}));relationships.maintenance.forEach(x=>rows.push({id:`maintenance-${x.id}`,at:x.opened_at,label:'صيانة',detail:`#${x.request_number} · ${x.title}`}));return rows.sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime())},[relationships]);
  const canManage = me.user.role !== 'agent';
  const sections: Array<{ value: AssetSection; label: string }> = [
    { value: 'overview', label: 'نظرة عامة' },
    ...(!asset?.project_id ? [{ value: 'media' as const, label: 'الوسائط' }] : []),
    ...(!parent ? [{ value: 'units' as const, label: 'الوحدات' }] : []),
    { value: 'offers', label: parent ? 'العرض' : 'العروض' },
    { value: 'activity', label: 'النشاط' },
  ];

  if (notFound) return <AppShell title="العقار غير موجود" orgName={me.tenant.name_ar} accountType={me.tenant.account_type}><p className="text-text-secondary">تعذر العثور على العقار.</p></AppShell>;
  if (loadError) return <AppShell title="تفاصيل العقار" orgName={me.tenant.name_ar} accountType={me.tenant.account_type}><DetailLoadError message={loadError} onRetry={() => setRetryKey((value) => value + 1)} /></AppShell>;
  return <AppShell title={asset?.name_ar ?? 'تفاصيل العقار'} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
    {!asset ? <FormPageSkeleton fields={6} extraCards={2} /> : <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <BackButton href={parent ? `/properties/${parent.id}` : project ? `/projects/${project.id}` : '/properties'} label="رجوع" className="self-start" />
      {parent && <Card className="p-4 text-sm">يتبع هذا العقار إلى <a href={`/properties/${parent.id}`} className="font-semibold text-brand hover:underline">{parent.name_ar}</a></Card>}
      <SegmentedToggle value={activeSection} onChange={setActiveSection} options={sections} className="project-tabs mx-auto max-w-4xl" />

      {activeSection === 'overview' && <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-subtle-3 px-2.5 py-1 text-xs font-medium">{assetTypeLabels[asset.asset_type]}</span>
                <span className="rounded-full bg-surface-subtle-3 px-2.5 py-1 text-xs">{statuses[asset.physical_status]}</span>
                <span className="rounded-full bg-surface-subtle-3 px-2.5 py-1 text-xs">{availabilityLabels[availability?.status??'']??availability?.status??'—'}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs ${asset.is_public?'bg-success-subtle text-success':'bg-surface-subtle-3 text-text-secondary'}`}>{asset.is_public?'ظاهر في الموقع':'داخلي'}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
                {asset.area_sqm&&<span>{asset.area_sqm} م²</span>}{parent&&asset.unit_number&&<span>وحدة {asset.unit_number}</span>}{parent&&asset.floor_number!=null&&<span>الدور {asset.floor_number}</span>}{asset.reference_number&&<span>مرجع {asset.reference_number}</span>}
              </div>
            </div>
            {canManage&&<Button variant="secondary" disabled={savingVisibility} onClick={()=>{setSavingVisibility(true);setVisibilityError(null);void updateAsset(accessToken,id,{is_public:!asset.is_public}).then(({asset:updated})=>setAsset(current=>current?{...current,...updated}:current)).catch(error=>setVisibilityError(error instanceof Error?error.message:'تعذر تحديث الظهور')).finally(()=>setSavingVisibility(false));}}>{savingVisibility?'جارٍ الحفظ...':asset.is_public?'إخفاء من الموقع':'إظهار في الموقع'}</Button>}
          </div>
          {visibilityError&&<p className="mt-3 text-sm text-danger">{visibilityError}</p>}
        </Card>
        {asset.project_id&&project&&<Card className="p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">وسائط المشروع</p><p className="mt-1 text-xs text-text-secondary">صور وفيديو هذا العقار ووحداته تُدار من معرض المشروع، ولا يوجد معرض مستقل هنا.</p></div><a href={`/projects/${project.id}`} className="text-sm font-medium text-brand">فتح المشروع</a></div></Card>}
        {(project||parent)&&<div className="flex flex-wrap items-center gap-2 px-1 text-sm text-text-secondary">{project&&<><a href={`/projects/${project.id}`} className="font-medium text-brand">{project.name_ar}</a><span>←</span></>}{parent&&<><a href={`/properties/${parent.id}`} className="font-medium text-brand">{parent.name_ar}</a><span>←</span></>}<strong className="text-text-primary">{asset.name_ar}</strong>{phase?.name_ar&&<span>· {phase.name_ar}</span>}{unitType?.name_ar&&<span>· {unitType.name_ar}</span>}</div>}
        {effectiveLocation&&(effectiveLocation.city_id||effectiveLocation.district_id||effectiveLocation.lat!=null||effectiveLocation.lng!=null)&&<Card className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium">الموقع</p><p className="mt-1 text-xs text-text-secondary">{effectiveLocation.source==='project'&&project?`موروث من مشروع ${project.name_ar}`:effectiveLocation.source==='parent'&&parent?`موروث من ${parent.name_ar}`:'محدد لهذا العقار'}{effectiveLocation.lat!=null&&effectiveLocation.lng!=null?` · ${Number(effectiveLocation.lat).toFixed(5)}, ${Number(effectiveLocation.lng).toFixed(5)}`:''}</p></div>{effectiveLocation.source==='project'&&project?<a href={`/projects/${project.id}`} className="text-xs font-medium text-brand">إدارة موقع المشروع</a>:effectiveLocation.source==='parent'&&parent?<a href={`/properties/${parent.id}`} className="text-xs font-medium text-brand">فتح العقار الرئيسي</a>:null}</div></Card>}
        <Card className="p-5"><h2 className="mb-4 font-semibold">المواصفات</h2><dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">{asset.area_sqm&&<div><dt className="text-text-secondary">المساحة</dt><dd className="mt-1 font-medium">{asset.area_sqm} م²</dd></div>}{asset.bedrooms!=null&&<div><dt className="text-text-secondary">غرف النوم</dt><dd className="mt-1 font-medium">{asset.bedrooms}</dd></div>}{asset.bathrooms!=null&&<div><dt className="text-text-secondary">دورات المياه</dt><dd className="mt-1 font-medium">{asset.bathrooms}</dd></div>}{asset.parking_count!=null&&<div><dt className="text-text-secondary">المواقف</dt><dd className="mt-1 font-medium">{asset.parking_count}</dd></div>}{asset.elevators_count!=null&&<div><dt className="text-text-secondary">المصاعد</dt><dd className="mt-1 font-medium">{asset.elevators_count}</dd></div>}{asset.furnishing&&<div><dt className="text-text-secondary">التأثيث</dt><dd className="mt-1 font-medium">{asset.furnishing==='furnished'?'مفروش':asset.furnishing==='semi_furnished'?'شبه مفروش':'غير مفروش'}</dd></div>}</dl>{asset.description_ar&&<p className="mt-4 border-t border-border-subtle pt-4 text-sm text-text-secondary">{asset.description_ar}</p>}</Card>
        {(sale||activeLease)&&<Card className="p-5"><h2 className="font-semibold">الحالة الحالية</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{sale&&<span className="rounded-lg bg-surface-subtle-3 px-3 py-2">تم البيع{sale.value!=null?` · ${Number(sale.value).toLocaleString('ar-SA')} ر.س`:''}</span>}{activeLease&&<a href={`/rent-plus/contracts/${activeLease.id}`} className="rounded-lg bg-surface-subtle-3 px-3 py-2 font-medium text-brand">عقد إيجار نشط · {activeLease.contract_number}</a>}</div></Card>}
      </div>}

      {activeSection === 'media' && !asset.project_id && <AssetMediaManager assetId={id} tenantId={me.tenant.id} accessToken={accessToken} canManage={me.user.role !== 'agent'} isUnit={Boolean(parent || unitType)} />}      {activeSection === 'units' && !parent && <div className="flex flex-col gap-5">
      <Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 p-4"><div><h2 className="font-semibold">الوحدات</h2><p className="mt-1 text-xs text-text-secondary">{children.length} وحدة داخل العقار</p></div>{canManage&&<Button onClick={()=>setShowChild(true)}>إضافة وحدة</Button>}</div>{children.length===0?<p className="px-4 pb-5 text-sm text-text-secondary">لا توجد وحدات بعد.</p>:<div className="divide-y divide-border-subtle">{children.map(child=>{const offer=child.current_offer;return <a key={child.id} href={`/properties/${child.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-surface-subtle-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{child.name_ar}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${child.is_public?'bg-success-subtle text-success':'bg-surface-subtle-3 text-text-secondary'}`}>{child.is_public?'ظاهر':'داخلي'}</span></div><p className="mt-1 truncate text-xs text-text-secondary">{child.unit_number?`#${child.unit_number} · `:''}{child.floor_number!=null?`الدور ${child.floor_number} · `:''}{child.area_sqm?`${child.area_sqm} م²`:assetTypeLabels[child.asset_type]}</p></div><div className="text-end">{offer?<><p className="text-xs font-medium">{offer.listing_type==='sale'?'بيع':'إيجار'}{offer.asking_price!=null?` · ${Number(offer.asking_price).toLocaleString('ar-SA')}`:''}</p><p className="mt-1 text-[10px] text-text-secondary">{offer.publication_status==='published'?'منشور':offer.publication_status==='draft'?'مسودة':offer.publication_status==='paused'?'موقوف':'مؤرشف'}</p></>:<span className="text-xs text-text-secondary">بدون عرض</span>}</div></a>})}</div>}</Card>

            {showChild && <Modal title="إضافة وحدة" onClose={() => setShowChild(false)}><CreateAssetForm accessToken={accessToken} projectId={asset.project_id ?? undefined} parentAssetId={id} parentAssetName={asset.name_ar} onCreated={childId => { setShowChild(false); void load(); window.location.href = `/properties/${childId}`; }} /></Modal>}

      </div>}

      {activeSection === 'offers' && <div className="flex flex-col gap-5">
            <Card className="overflow-hidden"><div className="flex items-start justify-between gap-3 p-5"><div><h2 className="font-semibold">العروض العقارية</h2><p className="mt-1 text-sm text-text-secondary">عروض البيع أو الإيجار المرتبطة بهذا العقار.</p></div>{me.user.role !== 'agent' && <Button onClick={() => setShowListing(true)}>عرض العقار</Button>}</div>{offers.length === 0 ? <p className="px-5 pb-5 text-sm text-text-secondary">هذا العقار غير معروض حاليًا. استخدم «عرض العقار» لإنشاء عرض بيع أو إيجار.</p> : <div className="divide-y divide-border-subtle">{offers.map(offer => <a key={offer.id} href={`/listings/${offer.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-surface-subtle-3 sm:flex-row sm:items-center sm:justify-between"><span className="font-medium">{offer.listing_number}</span><span className="text-sm text-text-secondary">{offer.listing_type === 'sale' ? 'للبيع' : 'للإيجار'} · {Number(offer.asking_price).toLocaleString('ar-SA')} ر.س · {offer.publication_status === 'published' ? 'منشور' : offer.publication_status === 'draft' ? 'مسودة' : offer.publication_status === 'paused' ? 'موقوف' : 'مؤرشف'}</span></a>)}</div>}</Card>

      </div>}

      {activeSection === 'activity' && <div className="flex flex-col gap-4">
        {relationships&&<Card className="overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-border-subtle sm:grid-cols-6">
            {[
              ['اهتمامات',relationships.interests.length],
              ['معاينات',relationships.viewings.length],
              ['حجوزات',relationships.reservations.length],
              ['صفقات',relationships.deals.length],
              ['عقود',relationships.leases.length],
              ['صيانة',relationships.maintenance.length],
            ].map(([label,value])=><div key={String(label)} className="bg-surface-card p-3 text-center"><p className="text-lg font-semibold">{value}</p><p className="mt-0.5 text-[11px] text-text-secondary">{label}</p></div>)}
          </div>
        </Card>}
        {relationships&&<Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 p-4"><div><h2 className="font-semibold">النشاط</h2><p className="mt-1 text-xs text-text-secondary">آخر الأحداث المرتبطة بهذا {parent?'الوحدة':'العقار'}.</p></div>{activeLease&&<a href={`/rent-plus/contracts/${activeLease.id}`} className="text-xs font-medium text-brand">العقد النشط</a>}</div>{timeline.length===0?<p className="px-4 pb-5 text-sm text-text-secondary">لا يوجد نشاط مسجل بعد.</p>:<div className="divide-y divide-border-subtle">{timeline.slice(0,15).map(x=><div key={x.id} className="flex items-start justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="text-sm font-medium">{x.label}</p>{x.href?<a href={x.href} className="mt-0.5 block truncate text-xs text-brand">{x.detail}</a>:<p className="mt-0.5 truncate text-xs text-text-secondary">{x.detail}</p>}</div><time className="shrink-0 text-[11px] text-text-secondary">{new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(x.at))}</time></div>)}</div>}</Card>}
      </div>}

      {showListing && <Modal title="إنشاء عرض عقاري" onClose={() => setShowListing(false)}><CreateListingForm accessToken={accessToken} assetId={id} assetName={asset.name_ar} onCreated={listingId => { window.location.href = `/listings/${listingId}`; }} /></Modal>}
      {me.user.role !== 'agent' && <details className="self-end relative"><summary className="cursor-pointer list-none rounded-lg border border-border-default px-3 py-2 text-sm text-text-secondary">•••</summary><div className="absolute bottom-11 end-0 z-20 min-w-44 rounded-lg border border-border-default bg-surface-card p-1 shadow-lg"><button type="button" disabled={children.length > 0} title={children.length ? 'يجب نقل أو أرشفة الوحدات التابعة أولًا' : undefined} onClick={async()=>{if(!confirm(`هل تريد أرشفة هذا ${parent?'الوحدة':'العقار'}؟`))return;await archiveAsset(accessToken,id);window.location.href=parent?`/properties/${parent.id}`:'/properties';}} className="w-full rounded-md px-3 py-2 text-start text-sm text-danger hover:bg-surface-subtle-3 disabled:cursor-not-allowed disabled:opacity-40">أرشفة {parent?'الوحدة':'العقار'}</button></div></details>}
    </div>}
  </AppShell>;
}
