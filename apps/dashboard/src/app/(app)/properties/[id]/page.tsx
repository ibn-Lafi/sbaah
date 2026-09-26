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
    setAsset(detail.asset); setParent(detail.parent); setChildren(detail.children); setAvailability(detail.availability); setProject(detail.project); setPhase(detail.phase); setUnitType(detail.unit_type); setListings(listingResult.listings); setRelationships(relationResult.relationships);
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
    { value: 'media', label: 'الوسائط' },
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
        {(project||parent)&&<div className="flex flex-wrap items-center gap-2 px-1 text-sm text-text-secondary">{project&&<><a href={`/projects/${project.id}`} className="font-medium text-brand">{project.name_ar}</a><span>←</span></>}{parent&&<><a href={`/properties/${parent.id}`} className="font-medium text-brand">{parent.name_ar}</a><span>←</span></>}<strong className="text-text-primary">{asset.name_ar}</strong>{phase?.name_ar&&<span>· {phase.name_ar}</span>}{unitType?.name_ar&&<span>· {unitType.name_ar}</span>}</div>}
        <Card className="p-5"><h2 className="mb-4 font-semibold">المواصفات</h2><dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">{asset.area_sqm&&<div><dt className="text-text-secondary">المساحة</dt><dd className="mt-1 font-medium">{asset.area_sqm} م²</dd></div>}{asset.bedrooms!=null&&<div><dt className="text-text-secondary">غرف النوم</dt><dd className="mt-1 font-medium">{asset.bedrooms}</dd></div>}{asset.bathrooms!=null&&<div><dt className="text-text-secondary">دورات المياه</dt><dd className="mt-1 font-medium">{asset.bathrooms}</dd></div>}{asset.parking_count!=null&&<div><dt className="text-text-secondary">المواقف</dt><dd className="mt-1 font-medium">{asset.parking_count}</dd></div>}{asset.elevators_count!=null&&<div><dt className="text-text-secondary">المصاعد</dt><dd className="mt-1 font-medium">{asset.elevators_count}</dd></div>}{asset.furnishing&&<div><dt className="text-text-secondary">التأثيث</dt><dd className="mt-1 font-medium">{asset.furnishing==='furnished'?'مفروش':asset.furnishing==='semi_furnished'?'شبه مفروش':'غير مفروش'}</dd></div>}</dl>{asset.description_ar&&<p className="mt-4 border-t border-border-subtle pt-4 text-sm text-text-secondary">{asset.description_ar}</p>}</Card>
        {(sale||activeLease)&&<Card className="p-5"><h2 className="font-semibold">الحالة الحالية</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{sale&&<span className="rounded-lg bg-surface-subtle-3 px-3 py-2">تم البيع{sale.value!=null?` · ${Number(sale.value).toLocaleString('ar-SA')} ر.س`:''}</span>}{activeLease&&<a href={`/rent-plus/contracts/${activeLease.id}`} className="rounded-lg bg-surface-subtle-3 px-3 py-2 font-medium text-brand">عقد إيجار نشط · {activeLease.contract_number}</a>}</div></Card>}
      </div>}

      {activeSection === 'media' && <AssetMediaManager assetId={id} tenantId={me.tenant.id} accessToken={accessToken} canManage={me.user.role !== 'agent'} isUnit={Boolean(parent || unitType)} />}      {activeSection === 'units' && !parent && <div className="flex flex-col gap-5">
      <Card className="overflow-hidden"><div className="flex items-start justify-between gap-3 p-5"><div><h2 className="font-semibold">الوحدات</h2><p className="mt-1 text-sm text-text-secondary">الشقق والأدوار والمحلات تُحفظ داخل هذا العقار.</p></div>{me.user.role !== 'agent' && <Button onClick={() => setShowChild(true)}>إضافة وحدة</Button>}</div>{children.length === 0 ? <p className="px-5 pb-5 text-sm text-text-secondary">لا توجد وحدات داخل العقار.</p> : <div className="divide-y divide-border-subtle">{children.map(child => <a key={child.id} href={`/properties/${child.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-surface-subtle-3"><span className="font-medium">{child.name_ar}</span><span className="text-sm text-text-secondary">{assetTypeLabels[child.asset_type]}{child.unit_number ? ` · ${child.unit_number}` : ''}</span></a>)}</div>}</Card>

            {showChild && <Modal title="إضافة وحدة" onClose={() => setShowChild(false)}><CreateAssetForm accessToken={accessToken} projectId={asset.project_id ?? undefined} parentAssetId={id} parentAssetName={asset.name_ar} onCreated={childId => { setShowChild(false); void load(); window.location.href = `/properties/${childId}`; }} /></Modal>}

      </div>}

      {activeSection === 'offers' && <div className="flex flex-col gap-5">
            <Card className="overflow-hidden"><div className="flex items-start justify-between gap-3 p-5"><div><h2 className="font-semibold">العروض العقارية</h2><p className="mt-1 text-sm text-text-secondary">عروض البيع أو الإيجار المرتبطة بهذا العقار.</p></div>{me.user.role !== 'agent' && <Button onClick={() => setShowListing(true)}>عرض العقار</Button>}</div>{offers.length === 0 ? <p className="px-5 pb-5 text-sm text-text-secondary">هذا العقار غير معروض حاليًا. استخدم «عرض العقار» لإنشاء عرض بيع أو إيجار.</p> : <div className="divide-y divide-border-subtle">{offers.map(offer => <a key={offer.id} href={`/listings/${offer.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-surface-subtle-3 sm:flex-row sm:items-center sm:justify-between"><span className="font-medium">{offer.listing_number}</span><span className="text-sm text-text-secondary">{offer.listing_type === 'sale' ? 'للبيع' : 'للإيجار'} · {Number(offer.asking_price).toLocaleString('ar-SA')} ر.س · {offer.publication_status === 'published' ? 'منشور' : offer.publication_status === 'draft' ? 'مسودة' : offer.publication_status === 'paused' ? 'موقوف' : 'مؤرشف'}</span></a>)}</div>}</Card>

      </div>}

      {activeSection === 'activity' && <div className="flex flex-col gap-5">
      {relationships&&me.user.role!=='agent'&&<div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">الإيجار والإشغال</h2><p className="mt-1 text-sm text-text-secondary">العقد النشط وحالة إشغال العقار.</p></div>{activeLease&&<a href={`/rent-plus/contracts/${activeLease.id}`} className="text-sm font-medium text-brand">فتح العقد</a>}</div>{activeLease?<div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-text-secondary">رقم العقد</p><p className="font-medium">{activeLease.contract_number}</p></div><div><p className="text-text-secondary">قيمة العقد</p><p className="font-medium">{Number(activeLease.total_value).toLocaleString('ar-SA')} ر.س</p></div><div><p className="text-text-secondary">المدة</p><p>{activeLease.start_date} — {activeLease.end_date}</p></div><div><p className="text-text-secondary">المستأجر</p><p>{activeLease.lease_contract_parties?.find(x=>x.role==='lessee')?.parties?.name??'—'}</p></div></div>:<p className="mt-4 text-sm text-text-secondary">لا يوجد عقد إيجار نشط.</p>}</Card>
        <Card className="p-5"><h2 className="font-semibold">الملكية والإدارة</h2><div className="mt-4 space-y-3 text-sm">{relationships.ownerships.filter(x=>!x.ended_at).length?relationships.ownerships.filter(x=>!x.ended_at).map(x=><div key={x.id} className="flex justify-between gap-3"><span>{x.parties?.name??'مالك'}</span><strong>{Number(x.ownership_percentage).toLocaleString('ar-SA')}%</strong></div>):<p className="text-text-secondary">لا توجد ملكية حالية مسجلة.</p>}<div className="border-t border-border-subtle pt-3"><p className="text-text-secondary">إدارة العقار</p><p className="font-medium">{relationships.management.find(x=>x.status==='active')?'نشطة':'غير مفعلة'}</p></div></div></Card>
      </div>}
      {relationships&&me.user.role!=='agent'&&<Card className="overflow-hidden"><div className="flex items-center justify-between p-5"><div><h2 className="font-semibold">الصيانة</h2><p className="mt-1 text-sm text-text-secondary">طلبات الصيانة المرتبطة مباشرة بهذا العقار.</p></div><a href="/rent-plus/maintenance" className="text-sm font-medium text-brand">إدارة الصيانة</a></div>{relationships.maintenance.length===0?<p className="px-5 pb-5 text-sm text-text-secondary">لا توجد طلبات صيانة.</p>:<div className="divide-y divide-border-subtle">{relationships.maintenance.slice(0,5).map(x=><div key={x.id} className="flex items-center justify-between gap-3 px-5 py-3"><div><p className="font-medium">{x.title}</p><p className="text-xs text-text-secondary">#{x.request_number} · {x.priority}</p></div><span className="text-xs text-text-secondary">{x.status}</span></div>)}</div>}</Card>}
      {relationships && <Card className="overflow-hidden"><div className="p-5"><h2 className="font-semibold">العملاء والنشاط العقاري</h2><p className="mt-1 text-sm text-text-secondary">كل العلاقات المرتبطة بهذا العقار عبر رحلة العميل.</p></div><div className="grid grid-cols-2 gap-px border-y border-border-subtle bg-border-subtle sm:grid-cols-5">{[['مهتمون',relationships.interests.length],['معاينات',relationships.viewings.length],['حجوزات',relationships.reservations.length],['صفقات',relationships.deals.length],['عقود إيجار',relationships.leases.length]].map(([label,value])=><div key={String(label)} className="bg-surface-card p-4 text-center"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-text-secondary">{label}</p></div>)}</div><div className="divide-y divide-border-subtle">{relationships.interests.map(x=>x.leads&&<a key={'i'+x.id} href={`/leads/${x.leads.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-subtle-3"><span className="font-medium">{x.leads.full_name}</span><span className="text-xs text-text-secondary">مهتم بالعقار</span></a>)}{relationships.viewings.map(x=>x.leads&&<a key={'v'+x.id} href={`/leads/${x.leads.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-subtle-3"><span className="font-medium">{x.leads.full_name}</span><span className="text-xs text-text-secondary">معاينة · {x.status}</span></a>)}{relationships.deals.map(x=>x.deals?.leads&&<a key={'d'+x.deal_id} href={`/leads/${x.deals.leads.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-subtle-3"><span className="font-medium">{x.deals.leads.full_name}</span><span className="text-xs text-text-secondary">صفقة · {x.deals.status}</span></a>)}</div></Card>}
      {relationships&&<Card className="overflow-hidden"><div className="p-5"><h2 className="font-semibold">السجل الزمني للعقار</h2><p className="mt-1 text-sm text-text-secondary">تسلسل موحد لأهم الأحداث التجارية والتشغيلية المرتبطة بالعقار.</p></div>{timeline.length===0?<p className="px-5 pb-5 text-sm text-text-secondary">لا توجد أحداث مسجلة بعد.</p>:<div className="divide-y divide-border-subtle">{timeline.slice(0,20).map(x=><div key={x.id} className="flex items-start justify-between gap-4 px-5 py-4"><div><p className="font-medium">{x.label}</p>{x.href?<a href={x.href} className="mt-1 block text-sm text-brand hover:underline">{x.detail}</a>:<p className="mt-1 text-sm text-text-secondary">{x.detail}</p>}</div><time className="shrink-0 text-xs text-text-secondary">{new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(x.at))}</time></div>)}</div>}</Card>}

      </div>}

      {showListing && <Modal title="إنشاء عرض عقاري" onClose={() => setShowListing(false)}><CreateListingForm accessToken={accessToken} assetId={id} assetName={asset.name_ar} onCreated={listingId => { window.location.href = `/listings/${listingId}`; }} /></Modal>}
      {me.user.role !== 'agent' && <div className="flex justify-end"><Button variant="secondary" disabled={children.length > 0} title={children.length ? 'يجب نقل أو أرشفة العقارات التابعة أولًا' : undefined} onClick={async () => { if (!confirm('هل تريد أرشفة هذا العقار؟')) return; await archiveAsset(accessToken, id); window.location.href = '/properties'; }}>أرشفة العقار</Button></div>}
    </div>}
  </AppShell>;
}
