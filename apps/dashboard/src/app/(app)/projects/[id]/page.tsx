'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, ProjectUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { ProjectInventory } from '@/components/hierarchy/project-inventory';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { deleteProject, getProject, updateProject } from '@/lib/api/hierarchy';
import { ApiRequestError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.projects;
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProject(accessToken, id)
      .then(({ project: loaded }) => {
        if (cancelled) return;
        setProject(loaded);
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
          <BackButton href="/projects" label="رجوع" className="self-start" />
          <ProjectInventory projectId={id} accessToken={accessToken} canManage={canManage} />

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
