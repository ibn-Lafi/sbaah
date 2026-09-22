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
import { listProjects, createProject } from '@/lib/api/hierarchy';
import { useLocale } from '@/lib/i18n/locale-context';

/** عنصر فرعي بمجموعة "العقارات" بالشريط — كانت تبويبًا داخل /properties، أصبحت صفحتها الخاصة. */
export default function ProjectsPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.projects;
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
      title={t.list.title}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5 flex items-center justify-end">
        {canManage && <Button onClick={() => setShowCreate(true)}>{t.list.addButton}</Button>}
      </div>
      {showCreate && (
        <Modal title={t.list.createModalTitle} onClose={() => setShowCreate(false)} maxWidth="820px" mobileCentered>
          <ProjectForm
            mode="create"
            accessToken={accessToken}
            submitLabel={t.list.createSubmitLabel}
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
          <p className="text-text-secondary p-6 text-center">{t.list.emptyState}</p>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.list.table.name}</th>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.list.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-border-subtle border-t">
                    <td className="px-3 py-3 md:px-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {project.name_ar}
                      </Link>
                    </td>
                    <td className="px-3 py-3 md:px-4">
                      <Badge
                        status={project.status}
                        label={pages.properties.statusLabels[project.status]}
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
