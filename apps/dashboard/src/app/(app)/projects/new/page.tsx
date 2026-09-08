'use client';

import { useRouter } from 'next/navigation';
import type { ProjectInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { createProject } from '@/lib/api/hierarchy';

export default function NewProjectPage() {
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();

  return (
    <AppShell
      title="إضافة مشروع"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <Card className="max-w-[720px] p-8">
        <ProjectForm
          mode="create"
          submitLabel="إضافة المشروع"
          onSubmit={async (input) => {
            const { project } = await createProject(accessToken, input as ProjectInput);
            router.push(`/projects/${project.id}`);
          }}
        />
      </Card>
    </AppShell>
  );
}
