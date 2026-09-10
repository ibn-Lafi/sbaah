'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { websiteCustomPageCreateSchema, type WebsiteCustomPage } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
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
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">عنوان الصفحة</label>
        <Input
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="مثال: سياسة الخصوصية"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">رابط الصفحة</label>
        <Input value={draft.slug} onChange={(e) => onChange({ ...draft, slug: e.target.value })} placeholder="privacy-policy" dir="ltr" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">المحتوى</label>
        <Textarea
          value={draft.content}
          onChange={(e) => onChange({ ...draft, content: e.target.value })}
          placeholder="اكتب محتوى الصفحة هنا..."
          className="min-h-[180px]"
        />
      </div>
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'جارٍ الحفظ...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        )}
      </div>
    </form>
  );
}

/** الصفحات — صفحات حرة (عنوان + محتوى) يديرها المالك/المسؤول، تُعرض عبر رابط في تذييل الموقع العام (مثل السياسات). */
export default function CustomPagesPage() {
  const { me, accessToken } = useCurrentUser();
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
      setError(result.error.issues[0]?.message ?? 'تحقق من البيانات المدخلة');
      return;
    }
    setLoading(true);
    try {
      await createCustomPage(accessToken, result.data);
      setNewDraft(EMPTY_DRAFT);
      setCreating(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إنشاء الصفحة');
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
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteCustomPage(accessToken, id);
    reload();
  }

  return (
    <AppShell title="الصفحات" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      <div className="flex max-w-[640px] flex-col gap-4">
        <p className="text-sm text-text-secondary">
          صفحات إضافية (مثل سياسة الخصوصية) تظهر روابطها تلقائيًا في تذييل موقعك الإلكتروني.
        </p>

        {pages === null ? (
          <LoadingState />
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
                    submitLabel="حفظ التعديلات"
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
                    تعديل
                  </button>
                  <button type="button" onClick={() => void handleDelete(page.id)} className="text-xs font-semibold text-danger hover:underline">
                    حذف
                  </button>
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
                  submitLabel="إنشاء الصفحة"
                />
              </Card>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreating(true);
                  setNewDraft(EMPTY_DRAFT);
                  setError(null);
                }}
                className="w-fit"
              >
                + إضافة صفحة
              </Button>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
