'use client';

import { useState, type FormEvent } from 'react';
import type { City, District, DistrictInput } from '@sbaah/shared';
import { districtInputSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';

interface DistrictFormProps {
  initial?: District;
  cities: City[];
  defaultCityId?: string;
  submitLabel: string;
  onSubmit: (input: DistrictInput) => Promise<void>;
}

export function DistrictForm({ initial, cities, defaultCityId, submitLabel, onSubmit }: DistrictFormProps) {
  const [cityId, setCityId] = useState(initial?.city_id ?? defaultCityId ?? cities[0]?.id ?? '');
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = districtInputSchema.safeParse({ city_id: cityId, name_ar: nameAr, name_en: nameEn });
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
        المدينة
        <Select value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_ar}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        اسم الحي (عربي)
        <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        اسم الحي (إنجليزي)
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
      </label>
      <FormError message={error} />
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
