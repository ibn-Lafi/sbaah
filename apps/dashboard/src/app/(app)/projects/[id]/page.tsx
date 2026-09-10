'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Building, BuildingInput, Project, ProjectUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Modal } from '@/components/ui/modal';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { createBuilding, deleteProject, getProject, listBuildings, updateProject } from '@/lib/api/hierarchy';
import { ApiRequestError } from '@/lib/api/client';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [project, setProject] = useState<Project | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCreateBuilding, setShowCreateBuilding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProject(accessToken, id)
      .then(({ project: loaded }) => {
        if (cancelled) return;
        setProject(loaded);
        void listBuildings(accessToken, { project_id: id }).then((result) => {
          if (!cancelled) setBuildings(result.buildings);
        });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const canManage = me.user.role !== 'agent';

  async function handleDelete() {
    if (!window.confirm('هل تريد حذف هذا المشروع نهائيًا؟')) return;
    setDeleteError(null);
    try {
      await deleteProject(accessToken, id);
      router.push('/projects');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف المشروع');
    }
  }

  if (notFound) {
    return (
      <AppShell
        title="مشروع غير موجود"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">المشروع غير موجود.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={project?.name_ar ?? 'تعديل مشروع'}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      {!project ? (
        <FormPageSkeleton fields={4} />
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <Card className="p-8">
            <ProjectForm
              mode="edit"
              initialValues={project}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                const { project: updated } = await updateProject(accessToken, id, input as ProjectUpdateInput);
                setProject(updated);
              }}
            />
          </Card>

          <Card className="p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">العمارات التابعة لهذا المشروع</h2>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreateBuilding(true)}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  + إضافة عمارة
                </button>
              )}
            </div>
            {showCreateBuilding && (
              <Modal title="إضافة عمارة" onClose={() => setShowCreateBuilding(false)}>
                <BuildingForm
                  mode="create"
                  accessToken={accessToken}
                  defaultProjectId={id}
                  submitLabel="إضافة العمارة"
                  onSubmit={async (input) => {
                    const { building } = await createBuilding(accessToken, input as BuildingInput);
                    setBuildings((prev) => [...prev, building]);
                    setShowCreateBuilding(false);
                  }}
                />
              </Modal>
            )}
            {buildings.length === 0 ? (
              <p className="text-sm text-text-secondary">لا عمارات مرتبطة بعد.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {buildings.map((building) => (
                  <li key={building.id}>
                    <Link href={`/buildings/${building.id}`} className="text-sm font-medium text-text-primary hover:text-brand">
                      {building.name_ar}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canManage && (
            <Card className="p-8">
              <FormError message={deleteError} />
              <Button variant="danger" onClick={() => void handleDelete()}>
                حذف المشروع نهائيًا
              </Button>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
