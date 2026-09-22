'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Asset, AssetPhysicalStatus, AssetType } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { CreateAssetForm, assetTypeLabels } from '@/components/properties/create-asset-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { listAssets, listListings, type ListingWithAssets } from '@/lib/api/real-estate';

const statusLabels: Record<AssetPhysicalStatus, string> = { planned: 'مخطط', under_construction: 'تحت الإنشاء', ready: 'جاهز', maintenance: 'صيانة', inactive: 'غير نشط' };

export default function PropertiesPage() {
  const { me, accessToken } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type');
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [listings, setListings] = useState<ListingWithAssets[]>([]);
  const [status, setStatus] = useState<AssetPhysicalStatus | ''>('');
  const [type, setType] = useState<AssetType | ''>(initialType && initialType in assetTypeLabels ? initialType as AssetType : '');
  const [showCreate, setShowCreate] = useState(false);
  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    let active = true;
    setAssets(null);
    void Promise.all([listAssets(accessToken, { physical_status: status || undefined, asset_type: type || undefined, page_size: 50 }), listListings(accessToken)])
      .then(([assetResult, listingResult]) => { if (active) { setAssets(assetResult.assets); setListings(listingResult.listings); } });
    return () => { active = false; };
  }, [accessToken, status, type]);

  const offers = useMemo(() => {
    const result = new Map<string, ListingWithAssets[]>();
    for (const listing of listings) for (const relation of listing.listing_assets ?? []) result.set(relation.asset_id, [...(result.get(relation.asset_id) ?? []), listing]);
    return result;
  }, [listings]);

  return <AppShell title="العقارات" orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {canManage && <Button onClick={() => setShowCreate(true)} className="self-end sm:order-2">إضافة عقار</Button>}
      <div className="flex items-center gap-1.5 self-start sm:order-1">
        <Select value={type} onChange={event => setType(event.target.value as AssetType | '')} className="h-8 w-[118px] rounded-lg border-border-subtle bg-surface-card px-2 text-xs font-medium text-text-secondary shadow-none focus:border-brand" compact><option value="">الأنواع</option>{Object.entries(assetTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select value={status} onChange={event => setStatus(event.target.value as AssetPhysicalStatus | '')} className="h-8 w-[108px] rounded-lg border-border-subtle bg-surface-card px-2 text-xs font-medium text-text-secondary shadow-none focus:border-brand" compact><option value="">الحالة</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      </div>
    </div>
    {showCreate && <Modal title="إضافة عقار" onClose={() => setShowCreate(false)} maxWidth="860px" mobileCentered><CreateAssetForm accessToken={accessToken} onCreated={id => { setShowCreate(false); router.push(`/properties/${id}`); }} /></Modal>}
    <Card className="overflow-hidden">{assets === null ? <TableSkeleton columns={3} /> : assets.length === 0 ? <p className="p-8 text-center text-text-secondary">لا توجد عقارات مطابقة</p> : <table className="w-full table-fixed text-xs sm:text-sm"><thead className="bg-surface-header text-right text-text-secondary"><tr><th className="px-2 py-3 text-right font-medium sm:px-4">العقار</th><th className="px-2 py-3 text-right font-medium sm:px-4">النوع</th><th className="px-2 py-3 text-right font-medium sm:px-4">الحالة</th></tr></thead><tbody>{assets.map(asset => <tr key={asset.id} className="border-border-subtle border-t"><td className="px-2 py-3 text-right sm:px-4"><button onClick={() => router.push(`/properties/${asset.id}`)} className="font-medium hover:text-brand">{asset.name_ar}</button></td><td className="px-4 py-3 text-text-secondary">{assetTypeLabels[asset.asset_type]}</td><td className="px-2 py-3 text-right sm:px-4">{statusLabels[asset.physical_status]}</td></tr>)}</tbody></table>}</Card>
  </AppShell>;
}
