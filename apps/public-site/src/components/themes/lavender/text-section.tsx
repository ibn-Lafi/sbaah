import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { TextSectionProps } from '../types';
import { LavenderSection } from './primitives';

export function TextSection({ type, locale, config }: TextSectionProps) {
  const body = config.body_ar ?? '';
  if (!body) return null;
  const title = config.title_ar || DEFAULT_SECTION_TITLE[type].ar;
  return (
    <LavenderSection className={type === 'about' ? 'bg-white' : 'bg-[#171713] text-white'}>
      <div className="border-current/20 grid gap-10 border-t pt-7 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div>
          <span
            className={`text-xs font-semibold tracking-[.16em] ${type === 'about' ? 'text-tenant-primary' : 'text-white/75'}`}
          >
            {type === 'about'
              ? locale === 'ar'
                ? 'عن الشركة'
                : 'ABOUT THE COMPANY'
              : locale === 'ar'
                ? 'قيمتنا المضافة'
                : 'WHY CHOOSE US'}
          </span>
          <h2
            className={`mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl ${type === 'about' ? 'text-black' : 'text-white'}`}
          >
            {title}
          </h2>
        </div>
        <p
          className={`max-w-3xl whitespace-pre-line text-lg leading-9 sm:text-xl ${type === 'about' ? 'text-black/70' : 'text-white/75'}`}
        >
          {body}
        </p>
      </div>
    </LavenderSection>
  );
}
