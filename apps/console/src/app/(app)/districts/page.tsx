'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { City, District } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listCities } from '@/lib/api/cities';
import { deleteDistrict, listDistricts } from '@/lib/api/districts';
import { ApiRequestError } from '@/lib/api/client';

export default function DistrictsPage() {
  const { accessToken } = useCurrentAdmin();
  const [cities, setCities] = useState<City[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [districts, setDistricts] = useState<District[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listCities(accessToken).then((res) => setCities(res.cities));
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    setDistricts(null);
    void listDistricts(accessToken, cityFilter || undefined).then((res) => {
      if (!cancelled) setDistricts(res.districts);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, cityFilter]);

  const cityNameById = Object.fromEntries(cities.map((c) => [c.id, c.name_ar]));

  async function handleDelete(district: District) {
    if (!window.confirm(`حذف حي "${district.name_ar}"؟`)) return;
    setError(null);
    try {
      await deleteDistrict(accessToken, district.id);
      setDistricts((prev) => prev && prev.filter((d) => d.id !== district.id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف الحي');
    }
  }

  return (
    <ConsoleShell title="الأحياء">
      <div className="mb-4 flex items-center justify-between">
        <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-[220px]">
          <option value="">كل المدن</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_ar}
            </option>
          ))}
        </Select>
        <Link href="/districts/new">
          <Button>+ حي جديد</Button>
        </Link>
      </div>

      <FormError message={error} />

      <Card className="mt-4 overflow-hidden">
        {districts === null ? (
          <TableSkeleton columns={4} />
        ) : districts.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد أحياء بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم (عربي)</th>
                <th className="px-5 py-3 font-medium">الاسم (إنجليزي)</th>
                <th className="px-5 py-3 font-medium">المدينة</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {districts.map((district) => (
                <tr key={district.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/districts/${district.id}`} className="font-medium hover:text-brand">
                      {district.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {district.name_en}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{cityNameById[district.city_id] ?? '—'}</td>
                  <td className="px-5 py-3 text-left">
                    <button type="button" onClick={() => void handleDelete(district)} className="text-danger hover:underline">
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
