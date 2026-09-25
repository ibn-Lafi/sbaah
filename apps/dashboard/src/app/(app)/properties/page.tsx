'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Asset, AssetPhysicalStatus, AssetType } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { CreateAssetForm, assetTypeLabels } from '@/components/properties/create-asset-form';
import { AddManagedPropertyForm } from '@/components/rent-plus/add-managed-property-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { listAssets } from '@/lib/api/real-estate';
import { listManagedProperties, type ManagedPropertyRow } from '@/lib/api/rent-plus';

const statusLabels: Record<AssetPhysicalStatus, string> = {
  planned: 'مخطط',
  under_construction: 'تحت الإنشاء',
  ready: 'جاهز',
  maintenance: 'صيانة',
  inactive: 'غير نشط',
};

type PropertyView = 'all' | 'rent';

const viewTabs: Array<{ value: PropertyView; label: string }> = [
  { value: 'all', label: 'العقارات المستقلة' },
  { value: 'rent', label: 'التأجير' },
];

function isPropertyView(value: string | null): value is PropertyView {
  return value === 'all' || value === 'rent';
}

export default function PropertiesPage() {
  const { me, accessToken } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const view: PropertyView = isPropertyView(requestedView) ? requestedView : 'all';
  const initialType = searchParams.get('type');

  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [managedProperties, setManagedProperties] = useState<ManagedPropertyRow[] | null>(null);
  const [status, setStatus] = useState<AssetPhysicalStatus | ''>('');
  const [type, setType] = useState<AssetType | ''>(
    initialType && initialType in assetTypeLabels ? (initialType as AssetType) : '',
  );
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [showAddToRent, setShowAddToRent] = useState(false);
  const [rentReloadKey, setRentReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    if (view === 'rent') return;
    let active = true;
    setAssets(null);
    void listAssets(accessToken, {
      scope: 'top_level',
      physical_status: status || undefined,
      asset_type: type || undefined,
      page,
      page_size: pageSize,
    }).then((result) => {
      if (!active) return;
      setAssets(result.assets);
      setTotal(result.total);
    });
    return () => {
      active = false;
    };
  }, [accessToken, status, type, page, view]);

  useEffect(() => {
    if (view !== 'rent') return;
    let active = true;
    setManagedProperties(null);
    void listManagedProperties(accessToken).then((result) => {
      if (active) setManagedProperties(result.properties);
    });
    return () => {
      active = false;
    };
  }, [accessToken, view, rentReloadKey]);

  useEffect(() => {
    setPage(1);
  }, [status, type, view]);

  function changeView(next: PropertyView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'all') params.delete('view');
    else params.set('view', next);
    router.replace(`/properties${params.size ? `?${params.toString()}` : ''}`);
  }

  return (
    <AppShell title="جميع العقارات" orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="mb-5 flex flex-col gap-4">
        <SegmentedToggle value={view} onChange={changeView} options={viewTabs} className="customer-list-tabs" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {canManage &&
            (view === 'rent' ? (
              <Button onClick={() => setShowAddToRent(true)} className="self-end sm:order-2">
                إضافة للتأجير
              </Button>
            ) : (
              <Button onClick={() => setShowCreateAsset(true)} className="self-end sm:order-2">
                إضافة عقار
              </Button>
            ))}

          {view !== 'rent' && (
            <div className="flex items-center gap-1.5 self-start sm:order-1">
              <Select
                value={type}
                onChange={(event) => setType(event.target.value as AssetType | '')}
                className="border-border-subtle bg-surface-card text-text-secondary focus:border-brand h-8 w-[118px] rounded-lg px-2 text-xs font-medium shadow-none"
                compact
              >
                <option value="">الأنواع</option>
                {Object.entries(assetTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as AssetPhysicalStatus | '')}
                className="border-border-subtle bg-surface-card text-text-secondary focus:border-brand h-8 w-[108px] rounded-lg px-2 text-xs font-medium shadow-none"
                compact
              >
                <option value="">الحالة</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {showCreateAsset && (
        <Modal title="إضافة عقار" onClose={() => setShowCreateAsset(false)} maxWidth="860px" mobileCentered>
          <CreateAssetForm
            accessToken={accessToken}
            onCreated={(id) => {
              setShowCreateAsset(false);
              window.location.href = `/properties/${id}`;
            }}
          />
        </Modal>
      )}

      {showAddToRent && (
        <Modal title="إضافة للتأجير" onClose={() => setShowAddToRent(false)} maxWidth="680px" mobileCentered>
          <AddManagedPropertyForm
            accessToken={accessToken}
            onCreated={() => {
              setShowAddToRent(false);
              setRentReloadKey((key) => key + 1);
            }}
          />
        </Modal>
      )}

      {view === 'rent' ? (
        <Card className="overflow-hidden">
          {managedProperties === null ? (
            <TableSkeleton columns={3} />
          ) : managedProperties.length === 0 ? (
            <p className="text-text-secondary p-8 text-center">لا توجد عقارات مضافة للتأجير حتى الآن</p>
          ) : (
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-2 py-3 text-right font-medium sm:px-4">العقار</th>
                  <th className="px-2 py-3 text-right font-medium sm:px-4">المرجع</th>
                  <th className="px-2 py-3 text-right font-medium sm:px-4">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {managedProperties.map((row) => (
                  <tr key={row.id} className="border-border-subtle border-t">
                    <td className="px-2 py-3 text-right sm:px-4">
                      <button
                        type="button"
                        onClick={() => { window.location.href = `/properties/${row.asset_id}`; }}
                        className="font-medium hover:text-brand"
                      >
                        {row.assets?.name_ar ?? '—'}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-right sm:px-4">{row.assets?.reference_number ?? '—'}</td>
                    <td className="px-2 py-3 text-right sm:px-4">
                      {row.status === 'active' ? 'نشط' : row.status === 'paused' ? 'متوقف مؤقتًا' : 'منتهي'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            {assets === null ? (
              <TableSkeleton columns={3} />
            ) : assets.length === 0 ? (
              <p className="text-text-secondary p-8 text-center">
                لا توجد عقارات مستقلة مطابقة
              </p>
            ) : (
              <table className="w-full table-fixed text-xs sm:text-sm">
                <thead className="bg-surface-header text-text-secondary text-right">
                  <tr>
                    <th className="px-2 py-3 text-right font-medium sm:px-4">العقار</th>
                    <th className="px-2 py-3 text-right font-medium sm:px-4">النوع</th>
                    <th className="px-2 py-3 text-right font-medium sm:px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-border-subtle border-t">
                      <td className="px-2 py-3 text-right sm:px-4">
                        <button
                          type="button"
                          onClick={() => { window.location.href = `/properties/${asset.id}`; }}
                          className="font-medium hover:text-brand"
                        >
                          {asset.name_ar}
                        </button>
                      </td>
                      <td className="text-text-secondary px-4 py-3">{assetTypeLabels[asset.asset_type]}</td>
                      <td className="px-2 py-3 text-right sm:px-4">{statusLabels[asset.physical_status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {total > pageSize && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                السابق
              </Button>
              <span className="text-text-secondary text-sm">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <Button
                variant="secondary"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((current) => current + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
