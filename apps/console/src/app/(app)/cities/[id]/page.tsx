'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { City } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { CityForm } from '@/components/cities/city-form';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { deleteCity, listCities, updateCity } from '@/lib/api/cities';
import { ApiRequestError } from '@/lib/api/client';

/** No single-city GET endpoint — cities are few, list is fetched and filtered client-side, same as plans/[id]. */
export default function EditCityPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();
  const [city, setCity] = useState<City | null | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void listCities(accessToken).then((res) => setCity(res.cities.find((c) => c.id === params.id) ?? null));
  }, [accessToken, params.id]);

  async function handleDelete() {
    if (!city || !window.confirm(`حذف مدينة "${city.name_ar}"؟`)) return;
    setDeleteError(null);
    try {
      await deleteCity(accessToken, city.id);
      router.push('/cities');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف المدينة');
    }
  }

  return (
    <ConsoleShell title="تعديل المدينة">
      <Card className="max-w-md p-6">
        {city === undefined ? (
          <LoadingState />
        ) : city === null ? (
          <p className="text-center text-text-secondary">المدينة غير موجودة</p>
        ) : (
          <>
            <CityForm
              initial={city}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                await updateCity(accessToken, city.id, input);
                router.push('/cities');
              }}
            />
            <div className="mt-6 border-t border-border-subtle pt-4">
              <FormError message={deleteError} />
              <button type="button" onClick={() => void handleDelete()} className="text-sm text-danger hover:underline">
                حذف هذه المدينة
              </button>
            </div>
          </>
        )}
      </Card>
    </ConsoleShell>
  );
}
