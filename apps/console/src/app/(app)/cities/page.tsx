'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { City } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { CityForm } from '@/components/cities/city-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createCity, deleteCity, listCities } from '@/lib/api/cities';
import { ApiRequestError } from '@/lib/api/client';

export default function CitiesPage() {
  const { accessToken } = useCurrentAdmin();
  const [cities, setCities] = useState<City[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    void listCities(accessToken).then((res) => setCities(res.cities));
  }, [accessToken]);

  async function handleDelete(city: City) {
    if (!window.confirm(`حذف مدينة "${city.name_ar}"؟`)) return;
    setError(null);
    try {
      await deleteCity(accessToken, city.id);
      setCities((prev) => prev && prev.filter((c) => c.id !== city.id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف المدينة');
    }
  }

  return (
    <ConsoleShell title="المدن">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreate(true)}>+ مدينة جديدة</Button>
      </div>

      {showCreate && (
        <Modal title="مدينة جديدة" onClose={() => setShowCreate(false)}>
          <CityForm
            submitLabel="إنشاء المدينة"
            onSubmit={async (input) => {
              const { city } = await createCity(accessToken, input);
              setCities((prev) => (prev ? [...prev, city] : [city]));
              setShowCreate(false);
            }}
          />
        </Modal>
      )}

      <FormError message={error} />

      <Card className="mt-4 overflow-hidden">
        {cities === null ? (
          <TableSkeleton columns={3} />
        ) : cities.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد مدن بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم (عربي)</th>
                <th className="px-5 py-3 font-medium">الاسم (إنجليزي)</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/cities/${city.id}`} className="font-medium hover:text-brand">
                      {city.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {city.name_en}
                  </td>
                  <td className="px-5 py-3 text-left">
                    <button type="button" onClick={() => void handleDelete(city)} className="text-danger hover:underline">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </ConsoleShell>
  );
}
