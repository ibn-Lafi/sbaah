'use client';

import { useRouter } from 'next/navigation';
import type { PropertyInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { PropertyForm } from '@/components/properties/property-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { createProperty } from '@/lib/api/properties';

/** RLS (properties_owner_admin_manage) has no insert policy for Agent — this page is reached only via a link canManage already hides for them, and the API itself would 403 regardless. */
export default function NewPropertyPage() {
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();

  return (
    <AppShell
      title="إضافة عقار"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <Card className="max-w-[720px] p-8">
        <PropertyForm
          mode="create"
          submitLabel="إضافة العقار"
          onSubmit={async (input) => {
            const { property } = await createProperty(accessToken, input as PropertyInput);
            router.push(`/properties/${property.id}`);
          }}
        />
      </Card>
    </AppShell>
  );
}
