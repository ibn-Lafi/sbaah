'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createPhase,
  createUnitType,
  createProjectAsset,\n  removeUnitType,\n  archiveProjectAsset,
  getProjectSalesCenter,
  listPhases,
  listProjectAssets,
  listUnitTypes,
  type ProjectPhase,
  type ProjectSalesCenter,
  type UnitType,
} from '@/lib/api/developer-inventory';
import type { Asset, AssetType } from '@sbaah/shared';
import { CreateAssetForm } from '@/components/properties/create-asset-form';

const statusLabels: Record<string, string> = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
  leased: 'مؤجر',
  under_negotiation: 'تحت التفاوض',
  negotiation: 'تحت التفاوض',
  physically_unavailable: 'غير متاح',
};
const statusClasses: Record<string, string> = {
  available: 'bg-success-surface text-success',
  reserved: 'bg-warning-surface text-warning',
  sold: 'bg-surface-subtle-3 text-text-secondary',
  leased: 'bg-brand-surface text-brand',
  under_negotiation: 'bg-brand-surface text-brand',
  negotiation: 'bg-brand-surface text-brand',
  physically_unavailable: 'bg-danger-surface text-danger',
};
const money = (value: number) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(value);

export function ProjectInventory({
  projectId,
  accessToken,
  canManage,
}: {
  projectId: string;
  accessToken: string;
  canManage: boolean;
}) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [types, setTypes] = useState<UnitType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sales, setSales] = useState<ProjectSalesCenter | null>(null);
  const [phaseName, setPhaseName] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeAssetType, setTypeAssetType] = useState<AssetType>('apartment');
  const [typeArea, setTypeArea] = useState('');
  const [typePrice, setTypePrice] = useState('');
  const [typeBedrooms, setTypeBedrooms] = useState('');
  const [typeBathrooms, setTypeBathrooms] = useState('');
  const [typeLandArea, setTypeLandArea] = useState('');
  const [typeBuiltArea, setTypeBuiltArea] = useState('');
  const [typeFloors, setTypeFloors] = useState('');
  const [typeParking, setTypeParking] = useState('');
  const [typeElevators, setTypeElevators] = useState('');
  const [typeStreetWidth, setTypeStreetWidth] = useState('');
  const [typeFurnishing, setTypeFurnishing] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [batchTypeId, setBatchTypeId] = useState('');
  const [batchCount, setBatchCount] = useState('1');
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchStart, setBatchStart] = useState('1');
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchError, setBatchError] = useState('');\n  const [deleteError, setDeleteError] = useState('');\n  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const load = useCallback(async () => {
    const [p, t, a, s] = await Promise.all([
      listPhases(accessToken),
      listUnitTypes(accessToken),
      listProjectAssets(accessToken, projectId),
      getProjectSalesCenter(accessToken, projectId),
    ]);
    setPhases(p.phases.filter((x) => x.project_id === projectId));
    setTypes(t.unit_types.filter((x) => x.project_id === projectId));
    setAssets(a.assets);
    setSales(s);
  }, [accessToken, projectId]);
  useEffect(() => {
    void load();
  }, [load]);
  const phaseNames = useMemo(() => new Map(phases.map((x) => [x.id, x.name_ar])), [phases]);
  const typeNames = useMemo(() => new Map(types.map((x) => [x.id, x.name_ar])), [types]);
  const filteredInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sales?.inventory ?? []).filter((item) => {
      const status = item.won_sale
        ? 'sold'
        : item.active_sale_deal
          ? 'negotiation'
          : String((item.availability as { status?: string } | null)?.status ?? 'available');
      const matchesSearch =
        !q ||
        item.name_ar.toLowerCase().includes(q) ||
        (item.unit_number ?? '').toLowerCase().includes(q);
      return (
        matchesSearch &&
        (phaseFilter === 'all' || item.phase_id === phaseFilter) &&
        (typeFilter === 'all' || item.unit_type_id === typeFilter) &&
        (statusFilter === 'all' || status === statusFilter)
      );
    });
  }, [sales, search, phaseFilter, typeFilter, statusFilter]);
  const assetById = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  const childCount = useMemo(
    () =>
      assets.reduce((counts, asset) => {
        if (asset.parent_asset_id)
          counts.set(asset.parent_asset_id, (counts.get(asset.parent_asset_id) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [assets],
  );
  const hierarchyInventory = useMemo(
    () =>
      [...filteredInventory].sort((left, right) => {
        const leftAsset = assetById.get(left.id);
        const rightAsset = assetById.get(right.id);
        const leftRoot = leftAsset?.parent_asset_id ?? left.id;
        const rightRoot = rightAsset?.parent_asset_id ?? right.id;
        if (leftRoot !== rightRoot) return leftRoot.localeCompare(rightRoot);
        return (
          Number(Boolean(leftAsset?.parent_asset_id)) - Number(Boolean(rightAsset?.parent_asset_id))
        );
      }),
    [filteredInventory, assetById],
  );
  const summarize = useCallback(
    (items: ProjectSalesCenter['inventory']) =>
      items.reduce(
        (acc, item) => {
          const status = item.won_sale
            ? 'sold'
            : item.active_sale_deal
              ? 'negotiation'
              : String((item.availability as { status?: string } | null)?.status ?? 'available');
          acc.total++;
          if (status === 'sold') acc.sold++;
          else if (status === 'reserved') acc.reserved++;
          else if (status === 'negotiation') acc.negotiation++;
          else if (status === 'available') acc.available++;
          else if (status === 'leased') acc.leased++;
          else acc.unavailable++;
          if (item.won_sale?.value != null) acc.soldValue += Number(item.won_sale.value);
          return acc;
        },
        {
          total: 0,
          available: 0,
          reserved: 0,
          negotiation: 0,
          sold: 0,
          leased: 0,
          unavailable: 0,
          soldValue: 0,
        },
      ),
    [],
  );
  const phaseGroups = useMemo(
    () =>
      phases
        .map((phase) => ({
          id: phase.id,
          name: phase.name_ar,
          ...summarize((sales?.inventory ?? []).filter((item) => item.phase_id === phase.id)),
        }))
        .filter((x) => x.total > 0),
    [phases, sales, summarize],
  );
  const typeGroups = useMemo(
    () =>
      types
        .map((type) => ({
          id: type.id,
          name: type.name_ar,
          ...summarize((sales?.inventory ?? []).filter((item) => item.unit_type_id === type.id)),
        }))
        .filter((x) => x.total > 0),
    [types, sales, summarize],
  );
  const matrix = useMemo(
    () =>
      phases
        .map((phase) => ({
          phase,
          cells: types.map((type) => ({
            type,
            ...summarize(
              (sales?.inventory ?? []).filter(
                (item) => item.phase_id === phase.id && item.unit_type_id === type.id,
              ),
            ),
          })),
        }))
        .filter((row) => row.cells.some((cell) => cell.total > 0)),
    [phases, types, sales, summarize],
  );
  const unclassified = useMemo(
    () =>
      summarize((sales?.inventory ?? []).filter((item) => !item.phase_id || !item.unit_type_id)),
    [sales, summarize],
  );
  const clearFilters = () => {
    setSearch('');
    setPhaseFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };
  const drillMatrix = (phaseId: string, typeId: string, status = 'all') => {
    setPhaseFilter(phaseId);
    setTypeFilter(typeId);
    setStatusFilter(status);
    setSearch('');
    document
      .getElementById('project-inventory-table')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-5">
      {sales && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['إجمالي الوحدات', sales.summary.total],
            ['المتاح', sales.summary.available],
            ['المحجوز', sales.summary.reserved],
            ['تحت التفاوض', sales.summary.negotiation],
            ['المباع', sales.summary.sold],
            ['قيمة أسعار العرض', money(sales.summary.asking_value)],
            ['قيمة المبيعات', money(sales.summary.sold_value)],
            [
              'نسبة البيع',
              sales.summary.total
                ? Math.round((sales.summary.sold / sales.summary.total) * 100) + '%'
                : '0%',
            ],
            ['وحدات معروضة للبيع', sales.analytics.listed_units],
            ['وحدات بلا عرض', sales.analytics.unlisted_units],
          ].map(([label, value]) => (
            <Card key={String(label)} className="p-4">
              <p className="text-text-secondary text-xs">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </Card>
          ))}
        </div>
      )}

      {sales && (
        <Card className="p-5 md:p-6">
          <div className="mb-4">
            <h3 className="font-semibold">تحليلات المبيعات</h3>
            <p className="text-text-secondary mt-1 text-xs">
              مؤشرات مشتقة مباشرة من الصفقات والمخزون الحالي للمشروع.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">الإيرادات المحققة</p>
              <p className="mt-1 font-semibold">{money(sales.analytics.revenue)}</p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">متوسط سعر البيع</p>
              <p className="mt-1 font-semibold">{money(sales.analytics.average_sale_price)}</p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">متوسط مدة الإغلاق</p>
              <p className="mt-1 font-semibold">
                {Math.round(sales.analytics.average_days_to_close)} يوم
              </p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">نسبة البيع من المخزون</p>
              <p className="mt-1 font-semibold">
                {Math.round(sales.analytics.sell_through_rate * 100)}%
              </p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">نسبة الوحدات بالتفاوض</p>
              <p className="mt-1 font-semibold">
                {Math.round(sales.analytics.negotiation_rate * 100)}%
              </p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">سعر البيع مقابل سعر العرض</p>
              <p className="mt-1 font-semibold">
                {Math.round(sales.analytics.asking_to_sale_ratio * 100)}%
              </p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">نسبة المتاح</p>
              <p className="mt-1 font-semibold">
                {Math.round(sales.analytics.available_rate * 100)}%
              </p>
            </div>
            <div className="bg-surface-subtle-3 rounded-xl p-4">
              <p className="text-text-secondary text-xs">نسبة المحجوز</p>
              <p className="mt-1 font-semibold">
                {Math.round(sales.analytics.reserved_rate * 100)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {sales && (
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold">قمع المبيعات</h3>
              <p className="text-text-secondary mt-1 text-xs">
                عملاء فريدون مرتبطون بوحدات هذا المشروع في كل مرحلة.
              </p>
            </div>
            <div className="text-end">
              <p className="text-text-secondary text-xs">التحويل من الاهتمام إلى البيع</p>
              <p className="text-lg font-semibold">
                {Math.round(sales.funnel.overall_conversion * 100)}%
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {sales.funnel.stages.map((stage, index) => {
              const labels = {
                interest: 'اهتمام',
                viewing: 'معاينة',
                reservation: 'حجز',
                negotiation: 'تفاوض',
                won: 'بيع مكتمل',
              };
              return (
                <div key={stage.stage} className="border-border-subtle rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-text-secondary text-xs">{labels[stage.stage]}</p>
                    <strong>{stage.count}</strong>
                  </div>
                  {index > 0 && (
                    <div className="border-border-subtle text-text-secondary mt-3 border-t pt-2 text-[11px]">
                      <p>تحويل {Math.round(stage.conversion_from_previous * 100)}%</p>
                      <p>تسرب {Math.round(stage.drop_off_from_previous * 100)}%</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {sales && sales.inventory.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="font-semibold">أداء مراحل المشروع</h3>
              <p className="text-text-secondary mt-1 text-xs">
                توزيع المخزون والمبيعات على مراحل المشروع.
              </p>
            </div>
            <div className="space-y-3">
              {phaseGroups.length ? (
                phaseGroups.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => setPhaseFilter(group.id)}
                    className="border-border-subtle hover:bg-surface-subtle-3 grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-3 text-start"
                  >
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-text-secondary mt-1 text-xs">
                        {group.total} وحدة · {group.available} متاح · {group.reserved} محجوز ·{' '}
                        {group.negotiation} تفاوض · {group.sold} مباع
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{money(group.soldValue)}</span>
                  </button>
                ))
              ) : (
                <p className="text-text-secondary text-sm">لا توجد وحدات مرتبطة بمراحل حتى الآن.</p>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="font-semibold">أداء أنواع الوحدات</h3>
              <p className="text-text-secondary mt-1 text-xs">
                مقارنة المخزون والمبيعات حسب نوع الوحدة.
              </p>
            </div>
            <div className="space-y-3">
              {typeGroups.length ? (
                typeGroups.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => setTypeFilter(group.id)}
                    className="border-border-subtle hover:bg-surface-subtle-3 grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-3 text-start"
                  >
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-text-secondary mt-1 text-xs">
                        {group.total} وحدة · {group.available} متاح · {group.reserved} محجوز ·{' '}
                        {group.sold} مباع
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{money(group.soldValue)}</span>
                  </button>
                ))
              ) : (
                <p className="text-text-secondary text-sm">
                  لا توجد وحدات مرتبطة بأنواع وحدات حتى الآن.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {sales && matrix.length > 0 && (
        <Card className="p-5 md:p-6">
          <div className="mb-4">
            <h3 className="font-semibold">مصفوفة المخزون</h3>
            <p className="text-text-secondary mt-1 text-xs">
              المرحلة × نوع الوحدة. اضغط على أي خلية لعرض وحداتها مباشرة.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-border-subtle border-b">
                  <th className="text-text-secondary p-3 text-start">المرحلة</th>
                  {types.map((type) => (
                    <th key={type.id} className="text-text-secondary p-3 text-start">
                      {type.name_ar}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.phase.id} className="border-border-subtle border-b last:border-0">
                    <th className="p-3 text-start font-medium">{row.phase.name_ar}</th>
                    {row.cells.map((cell) => (
                      <td key={cell.type.id} className="p-2">
                        {cell.total ? (
                          <button
                            type="button"
                            onClick={() => drillMatrix(row.phase.id, cell.type.id)}
                            className="border-border-subtle hover:border-brand hover:bg-brand-surface w-full rounded-xl border p-3 text-start"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <strong>{cell.total}</strong>
                              <span className="text-text-secondary text-xs">وحدة</span>
                            </div>
                            <div className="text-text-secondary mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px]">
                              <span className="text-success">{cell.available} متاح</span>
                              <span>{cell.reserved} محجوز</span>
                              <span>{cell.negotiation} تفاوض</span>
                              <span>{cell.sold} مباع</span>
                            </div>
                          </button>
                        ) : (
                          <div className="border-border-subtle text-text-secondary rounded-xl border border-dashed p-3 text-center">
                            —
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unclassified.total > 0 && (
            <button
              type="button"
              onClick={() => {
                clearFilters();
                document
                  .getElementById('project-inventory-table')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="border-warning mt-4 w-full rounded-xl border border-dashed p-3 text-start text-sm"
            >
              <strong>{unclassified.total} وحدة غير مكتملة التصنيف</strong>
              <span className="text-text-secondary ms-2 text-xs">
                تحتاج ربط مرحلة أو نوع وحدة لتظهر داخل المصفوفة.
              </span>
            </button>
          )}
        </Card>
      )}

      <Card className="p-5 md:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">مركز مبيعات المشروع</h2>
            <p className="text-text-secondary mt-1 text-sm">
              أضف عقارات المشروع هنا، ثم أضف وحدات كل عقار من صفحة العقار نفسه.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setShowAssetForm((v) => !v)}>
              {showAssetForm ? 'إغلاق' : 'إضافة عقار للمشروع'}
            </Button>
          )}
        </div>
        {showAssetForm && (
          <div className="mb-6">
            <CreateAssetForm
              accessToken={accessToken}
              projectId={projectId}
              onCreated={async () => {
                setShowAssetForm(false);
                await load();
              }}
            />
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          <section>
            <h3 className="mb-2 font-medium">
              المراحل <span className="text-text-secondary">({phases.length})</span>
            </h3>
            {canManage && (
              <div className="flex gap-2">
                <Input
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  placeholder="اسم المرحلة"
                />
                <Button
                  onClick={async () => {
                    if (!phaseName.trim()) return;
                    await createPhase(accessToken, { project_id: projectId, name_ar: phaseName });
                    setPhaseName('');
                    await load();
                  }}
                >
                  إضافة
                </Button>
              </div>
            )}
          </section>
          <section className="md:col-span-2">
            <h3 className="mb-2 font-medium">
              نماذج المشروع <span className="text-text-secondary">({types.length})</span>
            </h3>
            <p className="text-text-secondary mb-3 text-xs">
              أنشئ النموذج مرة واحدة ثم استخدمه لتوليد أي عدد من الوحدات المتطابقة.
            </p>
            {types.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {types.map((model) => (
                  <div key={model.id} className="border-border-default bg-surface-card flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                    <span className="font-medium">{model.name_ar}</span>
                    {canManage && (
                      <button
                        type="button"
                        className="text-danger hover:underline disabled:opacity-50"
                        disabled={deletingId === model.id}
                        onClick={async () => {
                          if (!window.confirm(`حذف النموذج «${model.name_ar}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
                          setDeleteError('');
                          setDeletingId(model.id);
                          try {
                            await removeUnitType(accessToken, model.id);
                            if (batchTypeId === model.id) setBatchTypeId('');
                            await load();
                          } catch (error) {
                            setDeleteError(error instanceof Error ? error.message : 'تعذر حذف النموذج');
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                      >
                        {deletingId === model.id ? 'جاري الحذف...' : 'حذف'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {deleteError && <p className="text-danger mb-3 text-sm">{deleteError}</p>}
            {canManage && (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="اسم النموذج — مثال: نموذج A"
                  />
                  <select
                    className="border-border-default bg-surface-card h-10 rounded-xl border px-3 text-sm"
                    value={typeAssetType}
                    onChange={(e) => setTypeAssetType(e.target.value as AssetType)}
                  >
                    <option value="apartment">شقة</option>
                    <option value="villa">فيلا</option>
                    <option value="office">مكتب</option>
                    <option value="shop">محل</option>
                    <option value="floor">دور</option>
                    <option value="land">أرض</option>
                    <option value="other">أخرى</option>
                  </select>
                  <Input
                    value={typeArea}
                    onChange={(e) => setTypeArea(e.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="المساحة م²"
                  />
                  <Input
                    value={typePrice}
                    onChange={(e) => setTypePrice(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="السعر الأساسي"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    value={typeBedrooms}
                    onChange={(e) => setTypeBedrooms(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="غرف النوم"
                  />
                  <Input
                    value={typeBathrooms}
                    onChange={(e) => setTypeBathrooms(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="دورات المياه"
                  />
                  <Input
                    value={typeLandArea}
                    onChange={(e) => setTypeLandArea(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="مساحة الأرض م²"
                  />
                  <Input
                    value={typeBuiltArea}
                    onChange={(e) => setTypeBuiltArea(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="مساحة البناء م²"
                  />
                  <Input
                    value={typeFloors}
                    onChange={(e) => setTypeFloors(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="عدد الأدوار"
                  />
                  <Input
                    value={typeParking}
                    onChange={(e) => setTypeParking(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="المواقف"
                  />
                  <Input
                    value={typeElevators}
                    onChange={(e) => setTypeElevators(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="المصاعد"
                  />
                  <Input
                    value={typeStreetWidth}
                    onChange={(e) => setTypeStreetWidth(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="عرض الشارع م"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <select
                    className="border-border-default bg-surface-card h-10 rounded-xl border px-3 text-sm"
                    value={typeFurnishing}
                    onChange={(e) => setTypeFurnishing(e.target.value)}
                  >
                    <option value="">التأثيث</option>
                    <option value="unfurnished">غير مفروش</option>
                    <option value="semi_furnished">شبه مفروش</option>
                    <option value="furnished">مفروش</option>
                  </select>
                  <Input
                    value={typeDescription}
                    onChange={(e) => setTypeDescription(e.target.value)}
                    placeholder="وصف ومواصفات النموذج"
                  />
                  <Button
                    disabled={!typeName.trim() || !typeArea || Number(typeArea) <= 0}
                    onClick={async () => {
                      const result = await createUnitType(accessToken, {
                        project_id: projectId,
                        name_ar: typeName.trim(),
                        asset_type: typeAssetType,
                        area_sqm: Number(typeArea),
                        bedrooms: typeBedrooms === '' ? null : Number(typeBedrooms),
                        bathrooms: typeBathrooms === '' ? null : Number(typeBathrooms),
                        base_price: typePrice ? Number(typePrice) : null,
                        specifications: {
                          land_area: typeLandArea === '' ? null : Number(typeLandArea),
                          built_area: typeBuiltArea === '' ? null : Number(typeBuiltArea),
                          floors_count: typeFloors === '' ? null : Number(typeFloors),
                          parking_count: typeParking === '' ? null : Number(typeParking),
                          elevators_count: typeElevators === '' ? null : Number(typeElevators),
                          street_width: typeStreetWidth === '' ? null : Number(typeStreetWidth),
                          furnishing: typeFurnishing || null,
                          description: typeDescription || null,
                        },
                      });
                      setTypeName('');
                      setTypeArea('');
                      setTypePrice('');
                      setTypeBedrooms('');
                      setTypeBathrooms('');
                      setTypeLandArea('');
                      setTypeBuiltArea('');
                      setTypeFloors('');
                      setTypeParking('');
                      setTypeElevators('');
                      setTypeStreetWidth('');
                      setTypeFurnishing('');
                      setTypeDescription('');
                      setBatchTypeId(result.unit_type.id);
                      await load();
                    }}
                  >
                    حفظ النموذج
                  </Button>
                </div>
              </div>
            )}
          </section>
          <section>
            <h3 className="mb-2 font-medium">
              المخزون <span className="text-text-secondary">({assets.length})</span>
            </h3>
            <p className="text-text-secondary text-sm">
              كل عقار يظهر تحت المشروع، ووحداته تظهر داخله. الوحدة بلا عقار أب تبقى مباشرة تحت
              المشروع.
            </p>
          </section>
        </div>

        {canManage && types.length > 0 && (
          <div className="border-border-default mt-6 rounded-xl border p-4">
            <div className="mb-4">
              <h3 className="font-semibold">إضافة عدة عقارات من نموذج</h3>
              <p className="text-text-secondary mt-1 text-xs">
                كل وحدة تُحفظ كعقار مستقل داخل المشروع ومرتبطة بالنموذج نفسه.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="border-border-default bg-surface-card h-10 rounded-xl border px-3 text-sm"
                value={batchTypeId}
                onChange={(e) => setBatchTypeId(e.target.value)}
              >
                <option value="">اختر النموذج</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name_ar}
                  </option>
                ))}
              </select>
              <Input
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                type="number"
                min="1"
                max="200"
                placeholder="عدد العقارات"
              />
              <Input
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
                placeholder="بادئة رقم الوحدة — مثال A-"
              />
              <Input
                value={batchStart}
                onChange={(e) => setBatchStart(e.target.value)}
                type="number"
                min="1"
                placeholder="رقم البداية"
              />
            </div>
            {batchError && <p className="mt-3 text-sm text-red-600">{batchError}</p>}
            <div className="mt-4 flex justify-end">
              <Button
                disabled={
                  batchBusy || !batchTypeId || Number(batchCount) < 1 || Number(batchCount) > 200
                }
                onClick={async () => {
                  const model = types.find((x) => x.id === batchTypeId);
                  if (!model) return;
                  setBatchBusy(true);
                  setBatchError('');
                  try {
                    const count = Math.floor(Number(batchCount));
                    const start = Math.floor(Number(batchStart) || 1);
                    for (let i = 0; i < count; i++) {
                      const unitNumber = `${batchPrefix}${start + i}`;
                      await createProjectAsset(accessToken, projectId, {
                        project_id: projectId,
                        unit_type_id: model.id,
                        asset_type: model.asset_type ?? 'other',
                        name_ar: `${model.name_ar} - ${unitNumber}`,
                        unit_number: unitNumber,
                        physical_status: 'ready',
                        area_sqm: model.area_sqm,
                        bedrooms: model.bedrooms ?? null,
                        bathrooms: model.bathrooms ?? null,
                        land_area:
                          typeof model.specifications?.land_area === 'number'
                            ? model.specifications.land_area
                            : null,
                        built_area:
                          typeof model.specifications?.built_area === 'number'
                            ? model.specifications.built_area
                            : null,
                        floors_count:
                          typeof model.specifications?.floors_count === 'number'
                            ? model.specifications.floors_count
                            : null,
                        parking_count:
                          typeof model.specifications?.parking_count === 'number'
                            ? model.specifications.parking_count
                            : null,
                        elevators_count:
                          typeof model.specifications?.elevators_count === 'number'
                            ? model.specifications.elevators_count
                            : null,
                        street_width:
                          typeof model.specifications?.street_width === 'number'
                            ? model.specifications.street_width
                            : null,
                        furnishing:
                          typeof model.specifications?.furnishing === 'string'
                            ? (model.specifications.furnishing as
                                'unfurnished' | 'semi_furnished' | 'furnished')
                            : null,
                        description_ar:
                          typeof model.specifications?.description === 'string'
                            ? model.specifications.description
                            : null,
                        specifications: model.specifications ?? {},
                      });
                    }
                    setBatchCount('1');
                    await load();
                  } catch (err) {
                    setBatchError(err instanceof Error ? err.message : 'تعذر إنشاء العقارات');
                  } finally {
                    setBatchBusy(false);
                  }
                }}
              >
                {batchBusy ? 'جاري إنشاء العقارات...' : 'إنشاء العقارات'}
              </Button>
            </div>
          </div>
        )}

        {sales && sales.inventory.length > 0 && (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو رقم الوحدة"
              />
              <select
                className="border-border-default bg-surface-card h-10 rounded-xl border px-3 text-sm"
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <option value="all">كل المراحل</option>
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_ar}
                  </option>
                ))}
              </select>
              <select
                className="border-border-default bg-surface-card h-10 rounded-xl border px-3 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">كل أنواع الوحدات</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name_ar}
                  </option>
                ))}
              </select>
              <select
                className="border-border-default bg-surface-card h-10 rounded-xl border px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="reserved">محجوز</option>
                <option value="leased">مؤجر</option>
                <option value="negotiation">تحت التفاوض</option>
                <option value="sold">مباع</option>
                <option value="physically_unavailable">غير متاح</option>
              </select>
            </div>
            <div className="text-text-secondary mt-3 flex items-center justify-between text-xs">
              <span>
                النتائج: {filteredInventory.length} من {sales.inventory.length}
              </span>
              {(search ||
                phaseFilter !== 'all' ||
                typeFilter !== 'all' ||
                statusFilter !== 'all') && (
                <button type="button" className="text-brand hover:underline" onClick={clearFilters}>
                  مسح الفلاتر
                </button>
              )}
            </div>
            <div id="project-inventory-table" className="mt-3 scroll-mt-24 overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-border-subtle text-text-secondary border-b">
                    <th className="p-3 text-start">العقار / الوحدة</th>
                    <th className="p-3 text-start">المرحلة</th>
                    <th className="p-3 text-start">نوع الوحدة</th>
                    <th className="p-3 text-start">الحالة التجارية</th>
                    <th className="p-3 text-start">سعر العرض</th>
                    <th className="p-3 text-start">سعر البيع</th>\n                    {canManage && <th className="p-3 text-start">الإجراءات</th>}
                  </tr>
                </thead>
                <tbody>
                  {hierarchyInventory.map((item) => {
                    const asset = assetById.get(item.id);
                    const parentAsset = asset?.parent_asset_id
                      ? assetById.get(asset.parent_asset_id)
                      : null;
                    const status = item.won_sale
                      ? 'sold'
                      : item.active_sale_deal
                        ? 'negotiation'
                        : String(
                            (item.availability as { status?: string } | null)?.status ??
                              'available',
                          );
                    const listing = item.current_sale_listing;
                    return (
                      <tr key={item.id} className="border-border-subtle border-b last:border-0">
                        <td className="p-3">
                          <div
                            className={
                              parentAsset ? 'border-border-subtle ms-5 border-s-2 ps-3' : ''
                            }
                          >
                            <a
                              href={`/properties/${item.id}`}
                              className="text-brand font-medium hover:underline"
                            >
                              {item.unit_number ? item.unit_number + ' · ' : ''}
                              {item.name_ar}
                            </a>
                            <p className="text-text-secondary mt-0.5 text-[11px]">
                              {parentAsset
                                ? `وحدة داخل ${parentAsset.name_ar}`
                                : childCount.get(item.id)
                                  ? `عقار يضم ${childCount.get(item.id)} وحدة`
                                  : 'مباشر تحت المشروع'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          {item.phase_id ? (phaseNames.get(item.phase_id) ?? '—') : '—'}
                        </td>
                        <td className="p-3">
                          {item.unit_type_id
                            ? (typeNames.get(item.unit_type_id) ?? item.asset_type)
                            : item.asset_type}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status] ?? 'bg-surface-subtle-3 text-text-secondary'}`}
                          >
                            {statusLabels[status] ?? status}
                          </span>
                        </td>
                        <td className="p-3">
                          {listing?.asking_price != null
                            ? money(Number(listing.asking_price))
                            : '—'}
                        </td>
                        <td className="p-3">
                          {item.won_sale?.value != null ? money(Number(item.won_sale.value)) : '—'}
                        </td>
                        {canManage && (
                          <td className="p-3">
                            <button
                              type="button"
                              className="text-danger text-xs font-medium hover:underline disabled:opacity-50"
                              disabled={deletingId === item.id}
                              onClick={async () => {
                                const label = parentAsset ? 'الوحدة' : 'العقار';
                                if (!window.confirm(`حذف ${label} «${item.name_ar}»؟ سيتم إخفاؤه من المشروع والموقع.`)) return;
                                setDeleteError('');
                                setDeletingId(item.id);
                                try {
                                  await archiveProjectAsset(accessToken, item.id);
                                  await load();
                                } catch (error) {
                                  setDeleteError(error instanceof Error ? error.message : `تعذر حذف ${label}`);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                            >
                              {deletingId === item.id ? 'جاري الحذف...' : 'حذف'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div className="text-text-secondary p-6 text-center text-sm">
                  لا توجد وحدات مطابقة للفلاتر الحالية.
                </div>
              )}
            </div>
          </>
        )}
        {sales && sales.inventory.length === 0 && (
          <div className="bg-surface-subtle-3 text-text-secondary mt-6 rounded-xl p-6 text-center text-sm">
            لا توجد وحدات في المشروع حتى الآن.
          </div>
        )}
      </Card>
    </div>
  );
}
