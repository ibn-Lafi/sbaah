'use client';

import { use, useEffect, useState } from 'react';
import type { Project, ProjectUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { DeleteButton } from '@/components/ui/delete-button';
import { DetailLoadError } from '@/components/ui/detail-load-error';
import { ProjectInventory } from '@/components/hierarchy/project-inventory';
import { ProjectMediaManager } from '@/components/hierarchy/project-media-manager';
import { ProjectPublishingPanel } from '@/components/hierarchy/project-publishing-panel';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { deleteProject, getProject, updateProject } from '@/lib/api/hierarchy';
import { ApiRequestError, isNotFoundError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

type ProjectSection = 'overview' | 'media' | 'inventory' | 'publishing';

const projectStatusLabels: Record<Project['status'], string> = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
};

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.projects;
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeSection, setActiveSection] = useState<ProjectSection>('overview');
  const [showEdit, setShowEdit] = useState(false);

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
  const sections: Array<{ value: ProjectSection; label: string }> = [
    { value: 'overview', label: 'نظرة عامة' },
    { value: 'media', label: 'الوسائط' },
    { value: 'inventory', label: 'العقارات والوحدات' },
    ...(canManage ? [{ value: 'publishing' as const, label: 'البيانات والنشر' }] : []),
  ];

  async function handleDelete() {
    try {
      await deleteProject(accessToken, id);
      window.location.href = '/projects';
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <BackButton href="/projects" label="رجوع" className="self-start" />

          <SegmentedToggle value={activeSection} onChange={setActiveSection} options={sections} className="settings-tabs" />

          {activeSection === 'overview' && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-5">
                  <p className="text-sm text-text-secondary">حالة المشروع</p>
                  <p className="mt-2 font-semibold">{projectStatusLabels[project.status]}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-text-secondary">نسبة الإنجاز</p>
                  <p className="mt-2 font-semibold">{project.completion_percentage ?? 0}%</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-text-secondary">الوحدات المخطط لها</p>
                  <p className="mt-2 font-semibold">{project.planned_units_count?.toLocaleString('ar-SA') ?? '—'}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-text-secondary">الرقم المرجعي</p>
                  <p className="mt-2 font-semibold">{project.reference_number ?? '—'}</p>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-text-primary">بيانات المشروع</h2>
                  {canManage && <Button variant="secondary" onClick={() => setShowEdit(true)}>تعديل بيانات المشروع</Button>}
                </div>
                <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-text-secondary">اسم المشروع بالعربية</dt>
                    <dd className="mt-1 font-medium">{project.name_ar}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">اسم المشروع بالإنجليزية</dt>
                    <dd className="mt-1 font-medium" dir="ltr">{project.name_en ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">تاريخ الإنجاز المتوقع</dt>
                    <dd className="mt-1 font-medium">
                      {project.expected_completion_date
                        ? new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(new Date(project.expected_completion_date))
                        : '—'}
                    </dd>
                  </div>
                </dl>
                {project.description_ar && (
                  <div className="mt-5 border-t border-border-subtle pt-5">
                    <p className="text-sm text-text-secondary">وصف المشروع</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-text-primary">{project.description_ar}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {showEdit && canManage && (
            <Modal title="تعديل بيانات المشروع" onClose={() => setShowEdit(false)} maxWidth="820px" mobileCentered>
              <ProjectForm
                mode="edit"
                initialValues={project}
                accessToken={accessToken}
                submitLabel="حفظ التعديلات"
                onSubmit={async (input) => {
                  const { project: updated } = await updateProject(accessToken, id, input as ProjectUpdateInput);
                  setProject(updated);
                  setShowEdit(false);
                }}
              />
            </Modal>
          )}

          {activeSection === 'media' && (
            <ProjectMediaManager projectId={id} tenantId={me.tenant.id} accessToken={accessToken} canManage={canManage} />
          )}

          {activeSection === 'inventory' && (
            <ProjectInventory projectId={id} accessToken={accessToken} canManage={canManage} />
          )}

          {activeSection === 'publishing' && canManage && (
            <div className="flex flex-col gap-6">
              <ProjectPublishingPanel project={project} accessToken={accessToken} onChange={setProject} />
              <div className="flex justify-end">
                <DeleteButton
                  label={t.detail.deleteLabel}
                  confirmTitle={t.detail.deleteConfirmTitle}
                  confirmMessage={t.detail.deleteConfirmMessage}
                  onConfirm={handleDelete}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
