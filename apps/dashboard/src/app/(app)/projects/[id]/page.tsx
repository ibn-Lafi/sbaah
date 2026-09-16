'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Building, BuildingInput, Project, ProjectUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { Modal } from '@/components/ui/modal';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { createBuilding, deleteProject, getProject, listBuildings, updateProject } from '@/lib/api/hierarchy';
import { ApiRequestError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.projects;
  const [project, setProject] = useState<Project | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [notFound, setNotFound] = useState(false);
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
    try {
      await deleteProject(accessToken, id);
      router.push('/projects');
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : t.detail.deleteFallbackError);
    }
  }

  if (notFound) {
    return (
      <AppShell
        title={t.detail.notFoundTitle}
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
      >
        <p className="text-text-secondary">{t.detail.notFoundMessage}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={project?.name_ar ?? t.detail.defaultTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      {!project ? (
        <FormPageSkeleton fields={4} />
      ) : (
        <div className="mx-auto flex max-w-[720px] flex-col gap-6">
          <Card className="p-8">
            <ProjectForm
              mode="edit"
              initialValues={project}
              accessToken={accessToken}
              submitLabel={t.detail.editSubmitLabel}
              onSubmit={async (input) => {
                const { project: updated } = await updateProject(accessToken, id, input as ProjectUpdateInput);
                setProject(updated);
              }}
            />
          </Card>

          <Card className="p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">{t.detail.buildingsSectionTitle}</h2>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreateBuilding(true)}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  {t.detail.addBuildingButton}
                </button>
              )}
            </div>
            {showCreateBuilding && (
              <Modal title={t.detail.createBuildingModalTitle} onClose={() => setShowCreateBuilding(false)}>
                <BuildingForm
                  mode="create"
                  accessToken={accessToken}
                  defaultProjectId={id}
                  submitLabel={t.detail.createBuildingSubmitLabel}
                  onSubmit={async (input) => {
                    const { building } = await createBuilding(accessToken, input as BuildingInput);
                    setBuildings((prev) => [...prev, building]);
                    setShowCreateBuilding(false);
                  }}
                />
              </Modal>
            )}
            {buildings.length === 0 ? (
              <p className="text-sm text-text-secondary">{t.detail.noBuildings}</p>
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
            <DeleteButton
              label={t.detail.deleteLabel}
              confirmTitle={t.detail.deleteConfirmTitle}
              confirmMessage={t.detail.deleteConfirmMessage}
              onConfirm={handleDelete}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
