'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { City, CityInput, Region } from '@sbaah/shared';
import { cityInputSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { listRegions } from '@/lib/api/regions';

interface CityFormProps {
  initial?: City;
  submitLabel: string;
  onSubmit: (input: CityInput) => Promise<void>;
}

export function CityForm({ initial, submitLabel, onSubmit }: CityFormProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState(initial?.region_id ?? '');
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [lat, setLat] = useState(initial?.lat === null || initial?.lat === undefined ? '' : String(initial.lat));
  const [lng, setLng] = useState(initial?.lng === null || initial?.lng === undefined ? '' : String(initial.lng));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listRegions().then(setRegions);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = cityInputSchema.safeParse({
      region_id: regionId,
      name_ar: nameAr,
      name_en: nameEn,
      lat: lat === '' ? null : Number(lat),
      lng: lng === '' ? null : Number(lng),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        المنطقة
        <Select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
          <option value="">اختر المنطقة</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name_ar}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        اسم المدينة (عربي)
        <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        اسم المدينة (إنجليزي)
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          خط العرض (Lat، اختياري)
          <Input type="number" value={lat} onChange={(e) => setLat(e.target.value)} dir="ltr" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          خط الطول (Lng، اختياري)
          <Input type="number" value={lng} onChange={(e) => setLng(e.target.value)} dir="ltr" />
        </label>
      </div>
      <FormError message={error} />
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
