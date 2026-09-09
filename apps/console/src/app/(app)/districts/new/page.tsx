'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { City } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { DistrictForm } from '@/components/districts/district-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listCities } from '@/lib/api/cities';
import { createDistrict } from '@/lib/api/districts';

export default function NewDistrictPage() {
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();
  const [cities, setCities] = useState<City[] | null>(null);

  useEffect(() => {
    void listCities(accessToken).then((res) => setCities(res.cities));
  }, [accessToken]);

  return (
    <ConsoleShell title="حي جديد">
      <Card className="max-w-md p-6">
        {cities === null ? (
          <p className="text-center text-black/60">جارٍ التحميل...</p>
        ) : cities.length === 0 ? (
          <p className="text-center text-black/60">أضيفوا مدينة أولًا قبل إضافة حي</p>
        ) : (
          <DistrictForm
            cities={cities}
            submitLabel="إنشاء الحي"
            onSubmit={async (input) => {
              await createDistrict(accessToken, input);
              router.push('/districts');
            }}
          />
        )}
      </Card>
    </ConsoleShell>
  );
}
