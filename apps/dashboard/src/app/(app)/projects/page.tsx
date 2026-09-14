'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Project, ProjectInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listProjects, createProject } from '@/lib/api/hierarchy';
import { PROPERTY_STATUS_LABELS } from '@/lib/property/labels';

/** عنصر فرعي بمجموعة "العقارات" بالشريط — كانت تبويبًا داخل /properties، أصبحت صفحتها الخاصة. */
export default function ProjectsPage() {
  const { me, accessToken } = useCurrentUser();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    let cancelled = false;
    void listProjects(accessToken).then((result) => {
      if (!cancelled) setProjects(result.projects);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <AppShell
      title="المشاريع"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-end">
        {canManage && <Button onClick={() => setShowCreate(true)}>+ إضافة مشروع</Button>}
      </div>
      {showCreate && (
        <Modal title="إضافة مشروع" onClose={() => setShowCreate(false)}>
          <ProjectForm
            mode="create"
            submitLabel="إضافة المشروع"
            onSubmit={async (input) => {
              const { project } = await createProject(accessToken, input as ProjectInput);
              router.push(`/projects/${project.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {projects === null ? (
          <TableSkeleton columns={2} />
        ) : projects.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">
            لا توجد مشاريع بعد — تجميع اختياري لعقاراتك تحت مشروع واحد (مثل مشروع سكني متعدد
            العمارات)
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">اسم المشروع</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {project.name_ar}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        status={project.status}
                        label={PROPERTY_STATUS_LABELS[project.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
