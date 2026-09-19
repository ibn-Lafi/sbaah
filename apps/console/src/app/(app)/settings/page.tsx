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

type Draft = { social_tiktok:string; social_instagram:string; social_x:string; contact_email:string; privacy_title_ar:string; privacy_title_en:string; privacy_content_ar:string; privacy_content_en:string; terms_title_ar:string; terms_title_en:string; terms_content_ar:string; terms_content_en:string; hero_eyebrow_ar:string; hero_eyebrow_en:string; hero_title_ar:string; hero_title_en:string; hero_subtitle_ar:string; hero_subtitle_en:string; footer_tagline_ar:string; footer_tagline_en:string };
const toDraft = (s: PlatformSettings): Draft => ({
  social_tiktok: s.social_tiktok ?? '',
  social_instagram: s.social_instagram ?? '',
  social_x: s.social_x ?? '',
  contact_email: s.contact_email ?? '',
  privacy_title_ar: s.privacy_title_ar ?? 'سياسة الخصوصية',
  privacy_title_en: s.privacy_title_en ?? 'Privacy Policy',
  privacy_content_ar: s.privacy_content_ar ?? '',
  privacy_content_en: s.privacy_content_en ?? '',
  terms_title_ar: s.terms_title_ar ?? 'الشروط والأحكام',
  terms_title_en: s.terms_title_en ?? 'Terms & Conditions',
  terms_content_ar: s.terms_content_ar ?? '',
  terms_content_en: s.terms_content_en ?? '',
  hero_eyebrow_ar: s.hero_eyebrow_ar ?? '', hero_eyebrow_en: s.hero_eyebrow_en ?? '',
  hero_title_ar: s.hero_title_ar ?? '', hero_title_en: s.hero_title_en ?? '',
  hero_subtitle_ar: s.hero_subtitle_ar ?? '', hero_subtitle_en: s.hero_subtitle_en ?? '',
  footer_tagline_ar: s.footer_tagline_ar ?? '', footer_tagline_en: s.footer_tagline_en ?? '',
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

      <Card className="mt-6 max-w-[900px] p-6">
        <h2 className="mb-1 text-base font-semibold">محتوى صفحة الهبوط</h2>
        <p className="mb-5 text-sm text-text-secondary">عدّل النصوص الأساسية للواجهة العامة. الحقول الفارغة تستخدم النص الافتراضي الموجود في الموقع.</p>
        {draft && <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2"><Input value={draft.hero_eyebrow_ar} onChange={e=>setDraft({...draft,hero_eyebrow_ar:e.target.value})} placeholder="النص العلوي بالعربية"/><Input dir="ltr" value={draft.hero_eyebrow_en} onChange={e=>setDraft({...draft,hero_eyebrow_en:e.target.value})} placeholder="Hero eyebrow"/></div>
          <div className="grid gap-3 sm:grid-cols-2"><Input value={draft.hero_title_ar} onChange={e=>setDraft({...draft,hero_title_ar:e.target.value})} placeholder="العنوان الرئيسي بالعربية"/><Input dir="ltr" value={draft.hero_title_en} onChange={e=>setDraft({...draft,hero_title_en:e.target.value})} placeholder="Main hero title"/></div>
          <div className="grid gap-3 sm:grid-cols-2"><textarea value={draft.hero_subtitle_ar} onChange={e=>setDraft({...draft,hero_subtitle_ar:e.target.value})} placeholder="وصف الهيرو بالعربية" className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm outline-none focus:border-brand"/><textarea dir="ltr" value={draft.hero_subtitle_en} onChange={e=>setDraft({...draft,hero_subtitle_en:e.target.value})} placeholder="Hero subtitle" className="min-h-24 rounded-xl border border-border-subtle bg-surface-card p-3 text-sm outline-none focus:border-brand"/></div>
          <div className="grid gap-3 sm:grid-cols-2"><Input value={draft.footer_tagline_ar} onChange={e=>setDraft({...draft,footer_tagline_ar:e.target.value})} placeholder="وصف الفوتر بالعربية"/><Input dir="ltr" value={draft.footer_tagline_en} onChange={e=>setDraft({...draft,footer_tagline_en:e.target.value})} placeholder="Footer tagline"/></div>
          <FormError message={error}/><Button type="submit" disabled={loading} className="w-fit">{loading?'جارٍ الحفظ...':saved?'تم الحفظ ✓':'حفظ محتوى الصفحة'}</Button>
        </form>}
      </Card>

      <Card className="mt-6 max-w-[900px] p-6">
        <h2 className="mb-1 text-base font-semibold">الصفحات القانونية</h2>
        <p className="mb-5 text-sm text-text-secondary">تحكم بمحتوى سياسة الخصوصية والشروط والأحكام الظاهر في صفحة سبعة.</p>
        {draft && <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="space-y-3">
            <h3 className="font-semibold">سياسة الخصوصية</h3>
            <div className="grid gap-3 sm:grid-cols-2"><Input value={draft.privacy_title_ar} onChange={e=>setDraft({...draft,privacy_title_ar:e.target.value})} placeholder="العنوان بالعربية"/><Input dir="ltr" value={draft.privacy_title_en} onChange={e=>setDraft({...draft,privacy_title_en:e.target.value})} placeholder="English title"/></div>
            <textarea dir="rtl" value={draft.privacy_content_ar} onChange={e=>setDraft({...draft,privacy_content_ar:e.target.value})} placeholder="محتوى سياسة الخصوصية بالعربية" className="min-h-64 w-full rounded-xl border border-border-subtle bg-surface-card p-4 text-sm leading-7 outline-none focus:border-brand"/>
            <textarea dir="ltr" value={draft.privacy_content_en} onChange={e=>setDraft({...draft,privacy_content_en:e.target.value})} placeholder="Privacy policy content in English" className="min-h-64 w-full rounded-xl border border-border-subtle bg-surface-card p-4 text-sm leading-7 outline-none focus:border-brand"/>
          </section>
          <section className="space-y-3 border-t border-border-subtle pt-5">
            <h3 className="font-semibold">الشروط والأحكام</h3>
            <div className="grid gap-3 sm:grid-cols-2"><Input value={draft.terms_title_ar} onChange={e=>setDraft({...draft,terms_title_ar:e.target.value})} placeholder="العنوان بالعربية"/><Input dir="ltr" value={draft.terms_title_en} onChange={e=>setDraft({...draft,terms_title_en:e.target.value})} placeholder="English title"/></div>
            <textarea dir="rtl" value={draft.terms_content_ar} onChange={e=>setDraft({...draft,terms_content_ar:e.target.value})} placeholder="محتوى الشروط والأحكام بالعربية" className="min-h-64 w-full rounded-xl border border-border-subtle bg-surface-card p-4 text-sm leading-7 outline-none focus:border-brand"/>
            <textarea dir="ltr" value={draft.terms_content_en} onChange={e=>setDraft({...draft,terms_content_en:e.target.value})} placeholder="Terms and conditions content in English" className="min-h-64 w-full rounded-xl border border-border-subtle bg-surface-card p-4 text-sm leading-7 outline-none focus:border-brand"/>
          </section>
          <FormError message={error}/><Button type="submit" disabled={loading} className="w-fit">{loading?'جارٍ الحفظ...':saved?'تم الحفظ ✓':'حفظ الصفحات القانونية'}</Button>
        </form>}
      </Card>
    </ConsoleShell>
  );
}
