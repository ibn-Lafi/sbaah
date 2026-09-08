'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { RentalInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { RentalForm } from '@/components/rentals/rental-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { createRental } from '@/lib/api/rentals';

export default function NewRentalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, accessToken } = useCurrentUser();
  const defaultPropertyId = searchParams.get('property_id') ?? undefined;

  return (
    <AppShell
      title="إضافة إيجار"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <Card className="max-w-[720px] p-8">
        <RentalForm
          mode="create"
          accessToken={accessToken}
          defaultPropertyId={defaultPropertyId}
          submitLabel="إضافة الإيجار"
          onSubmit={async (input) => {
            const { rental } = await createRental(accessToken, input as RentalInput);
            router.push(`/rentals/${rental.id}`);
          }}
        />
      </Card>
    </AppShell>
  );
}
