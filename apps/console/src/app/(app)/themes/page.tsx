'use client';

import { useEffect, useRef, useState } from 'react';
import type { Theme } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listThemes, updateTheme, uploadThemePreviewImage } from '@/lib/api/themes';

/** صورة معاينة صغيرة + زر رفع — تُستخدم داخل صف الجدول لكل ثيم (migration 0035). */
function ThemePreviewImageCell({ theme, onUploaded }: { theme: Theme; onUploaded: (theme: Theme) => void }) {
  const { accessToken } = useCurrentAdmin();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { theme: updated } = await uploadThemePreviewImage(accessToken, theme.id, file);
      onUploaded(updated);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {theme.preview_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a local/optimizable asset
        <img src={theme.preview_image_url} alt="" className="h-10 w-16 rounded border border-border-default object-cover" />
      ) : (
        <div className="flex h-10 w-16 items-center justify-center rounded border border-dashed border-border-default text-[10px] text-text-placeholder">
          بلا صورة
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileSelected(e)} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
      >
        {uploading ? 'جارٍ الرفع...' : theme.preview_image_url ? 'استبدال' : 'رفع صورة'}
      </button>
    </div>
  );
}

/**
 * "متجر الثيمات" — console side (task: theme system). Deliberately no
 * "+ ثيم جديد" button (unlike /plans): a theme is a code-defined
 * component set in public-site's registry, shipped via migration — this
 * screen only edits display metadata (name/active/order) for themes that
 * already exist. See docs/THEMES.md for how a developer actually adds one.
 */
export default function ThemesPage() {
  const { accessToken } = useCurrentAdmin();
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listThemes(accessToken).then((res) => {
      if (!cancelled) setThemes(res.themes);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function patchLocal(id: string, changes: Partial<Theme>) {
    setThemes((current) => current?.map((t) => (t.id === id ? { ...t, ...changes } : t)) ?? current);
  }

  async function handleSave(theme: Theme) {
    setSavingId(theme.id);
    try {
      await updateTheme(accessToken, theme.id, {
        name_ar: theme.name_ar,
        name_en: theme.name_en,
        order_index: theme.order_index,
        is_active: theme.is_active,
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ConsoleShell title="الثيمات">
      <Card className="overflow-hidden">
        {themes === null ? (
          <TableSkeleton columns={6} />
        ) : themes.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد ثيمات بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">صورة المعاينة</th>
                <th className="px-5 py-3 font-medium">المعرّف البرمجي</th>
                <th className="px-5 py-3 font-medium">الاسم (عربي)</th>
                <th className="px-5 py-3 font-medium">الاسم (إنجليزي)</th>
                <th className="px-5 py-3 font-medium">الترتيب</th>
                <th className="px-5 py-3 font-medium">نشط</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {themes.map((theme) => (
                <tr key={theme.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <ThemePreviewImageCell theme={theme} onUploaded={(updated) => patchLocal(theme.id, updated)} />
                  </td>
                  <td className="px-5 py-3 text-text-muted" dir="ltr">
                    {theme.key}
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      value={theme.name_ar}
                      onChange={(e) => patchLocal(theme.id, { name_ar: e.target.value })}
                      className="h-9 w-40"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      value={theme.name_en}
                      onChange={(e) => patchLocal(theme.id, { name_en: e.target.value })}
                      className="h-9 w-40"
                      dir="ltr"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      value={theme.order_index}
                      onChange={(e) => patchLocal(theme.id, { order_index: Number(e.target.value) })}
                      className="h-9 w-20"
                      dir="ltr"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={theme.is_active}
                      onChange={(e) => patchLocal(theme.id, { is_active: e.target.checked })}
                      className="h-5 w-5 cursor-pointer accent-brand"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Button onClick={() => void handleSave(theme)} disabled={savingId === theme.id} className="h-9 px-4 text-xs">
                      {savingId === theme.id ? 'جارٍ الحفظ...' : 'حفظ'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </ConsoleShell>
  );
}
