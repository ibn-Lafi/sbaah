'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { City, District } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { DistrictForm } from '@/components/districts/district-form';
import { FormError } from '@/components/ui/form-error';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listCities } from '@/lib/api/cities';
import { deleteDistrict, listDistricts, updateDistrict } from '@/lib/api/districts';
import { ApiRequestError } from '@/lib/api/client';

export default function EditDistrictPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();
  const [cities, setCities] = useState<City[] | null>(null);
  const [district, setDistrict] = useState<District | null | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([listCities(accessToken), listDistricts(accessToken)]).then(([citiesRes, districtsRes]) => {
      setCities(citiesRes.cities);
      setDistrict(districtsRes.districts.find((d) => d.id === params.id) ?? null);
    });
  }, [accessToken, params.id]);

  async function handleDelete() {
    if (!district || !window.confirm(`حذف حي "${district.name_ar}"؟`)) return;
    setDeleteError(null);
    try {
      await deleteDistrict(accessToken, district.id);
      router.push('/districts');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف الحي');
    }
  }

  return (
    <ConsoleShell title="تعديل الحي">
      <Card className="max-w-md p-6">
        {district === undefined || cities === null ? (
          <p className="text-center text-text-secondary">جارٍ التحميل...</p>
        ) : district === null ? (
          <p className="text-center text-text-secondary">الحي غير موجود</p>
        ) : (
          <>
            <DistrictForm
              initial={district}
              cities={cities}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                await updateDistrict(accessToken, district.id, input);
                router.push('/districts');
              }}
            />
            <div className="mt-6 border-t border-border-subtle pt-4">
              <FormError message={deleteError} />
              <button type="button" onClick={() => void handleDelete()} className="text-sm text-red-600 hover:underline">
                حذف هذا الحي
              </button>
            </div>
          </>
        )}
      </Card>
    </ConsoleShell>
  );
}
