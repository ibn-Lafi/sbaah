'use client';

import { useState } from 'react';
import type { AssetInput, AssetType } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createAsset } from '@/lib/api/real-estate';

export const assetTypeLabels: Record<AssetType, string> = {
  apartment: 'شقة', villa: 'فيلا', building: 'عمارة', land: 'أرض', plot: 'قطعة أرض',
  office: 'مكتب', shop: 'محل', warehouse: 'مستودع', floor: 'دور', compound: 'مجمع',
  chalet: 'شاليه', farm: 'مزرعة', parking: 'موقف', other: 'أخرى',
};

interface Props {
  accessToken: string;
  onCreated: (id: string) => void;
  projectId?: string;
  parentAssetId?: string;
  parentAssetName?: string;
}

export function CreateAssetForm({ accessToken, onCreated, projectId, parentAssetId, parentAssetName }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numberOrNull = (key: string) => form.get(key) ? Number(form.get(key)) : null;
    setBusy(true);
    setError('');
    try {
      const input: AssetInput = {
        project_id: projectId ?? null,
        parent_asset_id: parentAssetId ?? null,
        asset_type: form.get('asset_type') as AssetType,
        name_ar: String(form.get('name_ar')),
        reference_number: String(form.get('reference_number') || '') || null,
        physical_status: form.get('physical_status') as AssetInput['physical_status'],
        unit_number: String(form.get('unit_number') || '') || null,
        floor_number: numberOrNull('floor_number'),
        area_sqm: numberOrNull('area_sqm'),
        bedrooms: numberOrNull('bedrooms'),
        bathrooms: numberOrNull('bathrooms'),
        description_ar: String(form.get('description_ar') || '') || null,
      };
      const result = await createAsset(accessToken, input);
      onCreated(result.asset.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر إضافة العقار');
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    {parentAssetName && <div className="rounded-lg bg-surface-subtle-3 p-3 text-sm">العقار الرئيسي: <strong>{parentAssetName}</strong></div>}
    <div className="grid gap-4 sm:grid-cols-2">
      <Input name="name_ar" placeholder="اسم العقار" required />
      <Input name="reference_number" placeholder="الرقم المرجعي" />
      <Select name="asset_type" required>{Object.entries(assetTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Select name="physical_status"><option value="ready">جاهز</option><option value="planned">مخطط</option><option value="under_construction">تحت الإنشاء</option><option value="maintenance">صيانة</option><option value="inactive">غير نشط</option></Select>
      {parentAssetId && <><Input name="unit_number" placeholder="رقم الوحدة (اختياري)" /><Input name="floor_number" type="number" placeholder="رقم الدور (اختياري)" /></>}
      <Input name="area_sqm" type="number" min="0.01" step="0.01" placeholder="المساحة م²" />
      <Input name="bedrooms" type="number" min="0" placeholder="غرف النوم" />
      <Input name="bathrooms" type="number" min="0" placeholder="دورات المياه" />
      <Input name="description_ar" placeholder="وصف مختصر" />
    </div>
    {error && <p className="text-sm text-red-600">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? 'جارٍ الحفظ...' : parentAssetId ? 'إضافة العقار التابع' : 'إضافة العقار'}</Button>
  </form>;
}
