'use client';

import { useState, type FormEvent } from 'react';
import type { City, CityInput } from '@sbaah/shared';
import { cityInputSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';

interface CityFormProps {
  initial?: City;
  submitLabel: string;
  onSubmit: (input: CityInput) => Promise<void>;
}

export function CityForm({ initial, submitLabel, onSubmit }: CityFormProps) {
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = cityInputSchema.safeParse({ name_ar: nameAr, name_en: nameEn });
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
        اسم المدينة (عربي)
        <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        اسم المدينة (إنجليزي)
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
      </label>
      <FormError message={error} />
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
