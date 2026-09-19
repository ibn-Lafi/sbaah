import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { TextSectionProps } from '../types';
import { ClassicSection, ClassicSectionHeading } from './primitives';

/**
 * Used for both `about` and `why_us` (same config shape). Unlike Hero's
 * fallback-to-tenant-name (removed — see hero-section.tsx), there's no
 * data anywhere to fall back to for freeform body text — a section
 * toggled on with no authored body (true for every existing account
 * before this task's editor existed) renders nothing at all rather than
 * generic filler copy, which would make every tenant's site look
 * identically templated. لا نموذج ثنائي اللغة (الثيم الأساسي بلغة عربية
 * واحدة فقط، طلب المؤسس) — `.ar` دائمًا، حتى للعنوان الافتراضي.
 */
export function TextSection({ type, config }: TextSectionProps) {
  const body = config.body_ar ?? '';
  if (!body) return null;

  const title = config.title_ar || DEFAULT_SECTION_TITLE[type].ar;

  return (
    <ClassicSection className="bg-white">
      <div className="mx-auto max-w-3xl">
        <ClassicSectionHeading title={title} centered />
        <p className="whitespace-pre-line text-center text-base leading-8 text-black/65 sm:text-lg">{body}</p>
      </div>
    </ClassicSection>
  );
}
