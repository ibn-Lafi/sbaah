'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listProjects } from '@/lib/api/hierarchy';
import { PROPERTY_STATUS_LABELS } from '@/lib/property/labels';

export default function ProjectsListPage() {
  const { me, accessToken } = useCurrentUser();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listProjects(accessToken).then((result) => {
      if (!cancelled) setProjects(result.projects);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // PRODUCT_SPEC.md section 4.1 / RLS (projects_owner_admin_manage): Agent has no write policy on projects.
  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title="المشاريع"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-end">
        {canManage && (
          <Link href="/projects/new">
            <Button>+ إضافة مشروع</Button>
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {projects === null ? (
          <p className="p-6 text-center text-text-secondary">جارٍ التحميل...</p>
        ) : projects.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">
            لا توجد مشاريع بعد — تجميع اختياري لعقاراتك تحت مشروع واحد (مثل مشروع سكني متعدد العمارات)
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">اسم المشروع</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/projects/${project.id}`} className="font-medium text-text-primary hover:text-brand">
                      {project.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={project.status} label={PROPERTY_STATUS_LABELS[project.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
