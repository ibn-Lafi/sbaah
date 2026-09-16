'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { websiteCustomPageCreateSchema, type WebsiteCustomPage } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { FormError } from '@/components/ui/form-error';
import { CardListSkeleton } from '@/components/ui/card-list-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getCustomPages, createCustomPage, updateCustomPage, deleteCustomPage } from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

type Draft = { title: string; slug: string; content: string };
const EMPTY_DRAFT: Draft = { title: '', slug: '', content: '' };

function PageForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  error,
  loading,
  submitLabel,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel?: () => void;
  error: string | null;
  loading: boolean;
  submitLabel: string;
}) {
  const { pages } = useLocale();
  const t = pages.website.customPages;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t.form.titleLabel}</label>
        <Input
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder={t.form.titlePlaceholder}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t.form.slugLabel}</label>
        <Input value={draft.slug} onChange={(e) => onChange({ ...draft, slug: e.target.value })} placeholder="privacy-policy" dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">{t.form.contentLabel}</label>
        <Textarea
          value={draft.content}
          onChange={(e) => onChange({ ...draft, content: e.target.value })}
          placeholder={t.form.contentPlaceholder}
          className="min-h-[180px]"
        />
      </div>
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? t.form.saving : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t.form.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}

/** الصفحات — صفحات حرة (عنوان + محتوى) يديرها المالك/المسؤول، تُعرض عبر رابط في تذييل الموقع العام (مثل السياسات). */
export default function CustomPagesPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages: pageLabels } = useLocale();
  const t = pageLabels.website.customPages;
  const [pages, setPages] = useState<WebsiteCustomPage[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reload() {
    void getCustomPages(accessToken).then((result) => setPages(result.pages));
  }

  useEffect(reload, [accessToken]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = websiteCustomPageCreateSchema.safeParse(newDraft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.errors.validation);
      return;
    }
    setLoading(true);
    try {
      await createCustomPage(accessToken, result.data);
      setNewDraft(EMPTY_DRAFT);
      setCreating(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.errors.create);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(event: FormEvent, id: string) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateCustomPage(accessToken, id, editDraft);
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.errors.update);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCustomPage(accessToken, id);
      reload();
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : t.errors.delete);
    }
  }

  return (
    <AppShell title={t.pageTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="mx-auto flex max-w-[640px] flex-col gap-4">
        <p className="text-sm text-text-secondary">{t.description}</p>

        {pages === null ? (
          <CardListSkeleton rows={3} />
        ) : (
          <>
            {pages.map((page) =>
              editingId === page.id ? (
                <Card key={page.id} className="p-6">
                  <PageForm
                    draft={editDraft}
                    onChange={setEditDraft}
                    onSubmit={(e) => void handleUpdate(e, page.id)}
                    onCancel={() => setEditingId(null)}
                    error={error}
                    loading={loading}
                    submitLabel={t.saveEditLabel}
                  />
                </Card>
              ) : (
                <Card key={page.id} className="flex items-center justify-between gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{page.title}</p>
                    <p className="truncate text-xs text-text-secondary" dir="ltr">
                      /pages/{page.slug}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(page.id);
                      setEditDraft({ title: page.title, slug: page.slug, content: page.content });
                      setError(null);
                    }}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    {t.editLabel}
                  </button>
                  <DeleteButton
                    compact
                    label={t.deleteLabel}
                    confirmTitle={t.deleteConfirmTitle}
                    confirmMessage={t.deleteConfirmMessage(page.title)}
                    onConfirm={() => handleDelete(page.id)}
                  />
                </Card>
              ),
            )}

            {creating ? (
              <Card className="p-6">
                <PageForm
                  draft={newDraft}
                  onChange={setNewDraft}
                  onSubmit={handleCreate}
                  onCancel={() => {
                    setCreating(false);
                    setError(null);
                  }}
                  error={error}
                  loading={loading}
                  submitLabel={t.createLabel}
                />
              </Card>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setNewDraft(EMPTY_DRAFT);
                  setError(null);
                }}
                className="w-fit"
              >
                {t.addButton}
              </Button>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
