'use client';

import { useRouter } from 'next/navigation';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { CityForm } from '@/components/cities/city-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createCity } from '@/lib/api/cities';

export default function NewCityPage() {
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();

  return (
    <ConsoleShell title="مدينة جديدة">
      <Card className="max-w-md p-6">
        <CityForm
          submitLabel="إنشاء المدينة"
          onSubmit={async (input) => {
            await createCity(accessToken, input);
            router.push('/cities');
          }}
        />
      </Card>
    </ConsoleShell>
  );
}
