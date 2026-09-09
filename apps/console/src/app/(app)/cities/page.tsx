'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { City } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { deleteCity, listCities } from '@/lib/api/cities';
import { ApiRequestError } from '@/lib/api/client';

export default function CitiesPage() {
  const { accessToken } = useCurrentAdmin();
  const [cities, setCities] = useState<City[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <Link href="/cities/new">
          <Button>+ مدينة جديدة</Button>
        </Link>
      </div>

      <FormError message={error} />

      <Card className="mt-4 overflow-hidden">
        {cities === null ? (
          <p className="p-6 text-center text-black/60">جارٍ التحميل...</p>
        ) : cities.length === 0 ? (
          <p className="p-6 text-center text-black/60">لا توجد مدن بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-right text-black/60">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم (عربي)</th>
                <th className="px-5 py-3 font-medium">الاسم (إنجليزي)</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} className="border-t border-black/10">
                  <td className="px-5 py-3">
                    <Link href={`/cities/${city.id}`} className="font-medium hover:text-brand">
                      {city.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-black/60" dir="ltr">
                    {city.name_en}
                  </td>
                  <td className="px-5 py-3 text-left">
                    <button type="button" onClick={() => void handleDelete(city)} className="text-red-600 hover:underline">
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
