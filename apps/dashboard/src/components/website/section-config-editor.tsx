'use client';

import { useState } from 'react';
import type { WebsiteSection } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateSection } from '@/lib/api/website';

interface SectionConfigEditorProps {
  section: WebsiteSection;
  accessToken: string;
  onSaved: (section: WebsiteSection) => void;
}

/**
 * public-site (task 35/42) renders these fields for real — this is the
 * editing side task 28/42 deliberately deferred ("لا تحرير حر لمحتوى
 * نصي داخل الأقسام... يحتاج قرارًا منفصلًا"). Arabic required/English
 * optional, same convention as every bilingual field already in the
 * product (e.g. property title_ar/title_en). `footer`/`property_grid`
 * have no free-text content worth editing here — `property_grid` shows
 * real listings, `footer` is just the tenant name + the fixed سبعة badge.
 */
export function SectionConfigEditor({ section, accessToken, onSaved }: SectionConfigEditorProps) {
  const hasBody = section.type === 'about' || section.type === 'why_us';
  const hasSubtitle = section.type === 'hero';
  const config = section.config as { title_ar?: string; title_en?: string; subtitle_ar?: string; subtitle_en?: string; body_ar?: string; body_en?: string };

  const [titleAr, setTitleAr] = useState(config.title_ar ?? '');
  const [titleEn, setTitleEn] = useState(config.title_en ?? '');
  const [subtitleAr, setSubtitleAr] = useState(config.subtitle_ar ?? '');
  const [subtitleEn, setSubtitleEn] = useState(config.subtitle_en ?? '');
  const [bodyAr, setBodyAr] = useState(config.body_ar ?? '');
  const [bodyEn, setBodyEn] = useState(config.body_en ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const nextConfig: Record<string, string> = {};
      if (titleAr) nextConfig.title_ar = titleAr;
      if (titleEn) nextConfig.title_en = titleEn;
      if (hasSubtitle && subtitleAr) nextConfig.subtitle_ar = subtitleAr;
      if (hasSubtitle && subtitleEn) nextConfig.subtitle_en = subtitleEn;
      if (hasBody && bodyAr) nextConfig.body_ar = bodyAr;
      if (hasBody && bodyEn) nextConfig.body_en = bodyEn;

      const { section: updated } = await updateSection(accessToken, section.id, { config: nextConfig });
      onSaved(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-input border border-border-subtle bg-surface-subtle p-4">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="العنوان (عربي)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        <Input placeholder="العنوان (إنجليزي، اختياري)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
      </div>

      {hasSubtitle && (
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="العنوان الفرعي (عربي)" value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} />
          <Input placeholder="العنوان الفرعي (إنجليزي، اختياري)" value={subtitleEn} onChange={(e) => setSubtitleEn(e.target.value)} />
        </div>
      )}

      {hasBody && (
        <div className="grid grid-cols-2 gap-3">
          <Textarea placeholder="النص (عربي)" value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} />
          <Textarea placeholder="النص (إنجليزي، اختياري)" value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
        </div>
      )}

      <Button type="button" variant="secondary" onClick={() => void handleSave()} disabled={loading} className="w-fit">
        {loading ? 'جارٍ الحفظ...' : 'حفظ المحتوى'}
      </Button>
    </div>
  );
}
