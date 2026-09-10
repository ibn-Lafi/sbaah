'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { platformSettingsUpdateSchema, type PlatformSettings } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/api/platform-settings';
import { ApiRequestError } from '@/lib/api/client';

type Draft = { social_tiktok: string; social_instagram: string; social_x: string; contact_email: string };
const toDraft = (s: PlatformSettings): Draft => ({
  social_tiktok: s.social_tiktok ?? '',
  social_instagram: s.social_instagram ?? '',
  social_x: s.social_x ?? '',
  contact_email: s.contact_email ?? '',
});

/** إعدادات المنصة — روابط حسابات سبعة نفسها (تيك توك/إنستغرام/إكس/البريد)، تظهر بدل شريط "عقار←موقع←زائر←Lead←متابعة" في لوحة تسجيل الدخول/إنشاء حساب. */
export default function PlatformSettingsPage() {
  const { accessToken } = useCurrentAdmin();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getPlatformSettings(accessToken).then((s) => setDraft(toDraft(s)));
  }, [accessToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setError(null);
    setSaved(false);
    const result = platformSettingsUpdateSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'تحقق من البيانات المدخلة');
      return;
    }
    setLoading(true);
    try {
      const updated = await updatePlatformSettings(accessToken, result.data);
      setDraft(toDraft(updated));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConsoleShell title="إعدادات المنصة">
      <Card className="max-w-[560px] p-6">
        <h2 className="mb-1 text-base font-semibold">حسابات سبعة على التواصل الاجتماعي</h2>
        <p className="mb-4 text-sm text-text-secondary">
          تظهر هذه الروابط كأيقونات في لوحة تسجيل الدخول وإنشاء حساب جديد — حسابات المنصة نفسها، وليست حسابات المستأجرين.
        </p>

        {draft === null ? (
          <LoadingState />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">تيك توك</label>
              <Input
                value={draft.social_tiktok}
                onChange={(e) => setDraft({ ...draft, social_tiktok: e.target.value })}
                placeholder="https://www.tiktok.com/@sbaah"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">إنستغرام</label>
              <Input
                value={draft.social_instagram}
                onChange={(e) => setDraft({ ...draft, social_instagram: e.target.value })}
                placeholder="https://www.instagram.com/sbaah"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">إكس (X)</label>
              <Input
                value={draft.social_x}
                onChange={(e) => setDraft({ ...draft, social_x: e.target.value })}
                placeholder="https://x.com/sbaah"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                value={draft.contact_email}
                onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
                placeholder="hello@sbaah.app"
                dir="ltr"
              />
            </div>
            <FormError message={error} />
            <Button type="submit" disabled={loading} className="w-fit">
              {loading ? 'جارٍ الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ'}
            </Button>
          </form>
        )}
      </Card>
    </ConsoleShell>
  );
}
