'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { BuildingInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { createBuilding } from '@/lib/api/hierarchy';

export default function NewBuildingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, accessToken } = useCurrentUser();
  const defaultProjectId = searchParams.get('project_id') ?? undefined;

  return (
    <AppShell
      title="إضافة عمارة"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <Card className="max-w-[720px] p-8">
        <BuildingForm
          mode="create"
          accessToken={accessToken}
          defaultProjectId={defaultProjectId}
          submitLabel="إضافة العمارة"
          onSubmit={async (input) => {
            const { building } = await createBuilding(accessToken, input as BuildingInput);
            router.push(`/buildings/${building.id}`);
          }}
        />
      </Card>
    </AppShell>
  );
}
