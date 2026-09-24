'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { DetailLoadError } from '@/components/ui/detail-load-error';
import { ProjectInventory } from '@/components/hierarchy/project-inventory';
import { ProjectMediaManager } from '@/components/hierarchy/project-media-manager';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { deleteProject, getProject } from '@/lib/api/hierarchy';
import { ApiRequestError, isNotFoundError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.projects;
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProject(accessToken, id)
      .then(({ project: loaded }) => {
        if (cancelled) return;
        setProject(loaded);
        setNotFound(false);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isNotFoundError(err)) setNotFound(true);
        else setLoadError(err instanceof ApiRequestError ? err.message : t.detail.loadError);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loadError) {
    return (
      <AppShell title={t.detail.defaultTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
        <DetailLoadError message={loadError} retryLabel={t.detail.retry} onRetry={() => setRetryKey((value) => value + 1)} />
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
          <ProjectMediaManager projectId={id} tenantId={me.tenant.id} accessToken={accessToken} canManage={canManage} />\n          <ProjectInventory projectId={id} accessToken={accessToken} canManage={canManage} />

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
