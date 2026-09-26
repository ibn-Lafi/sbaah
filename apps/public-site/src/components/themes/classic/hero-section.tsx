import { listCities } from '@/lib/api/reference-data';
import type { HeroSectionProps } from '../types';
import { PropertySearchBar } from '@/components/properties/property-search-bar';
import { resolveHeroSearchMode } from '@sbaah/shared';

/**
 * أربعة أشكال (HeroSectionConfig.variant، packages/shared — طلب المؤسس،
 * ترتيب أقسام الصفحة الرئيسية لثيم الأساسي): صورة فقط / صورة مع فلتر
 * بحث العقارات / فيديو فقط / فيديو مع فلتر بحث العقارات. بلا `variant`
 * محفوظ (كل حساب قائم اليوم) = 'image_search' — نفس السلوك الحي القديم
 * بالضبط (صورة إن وُجدت + فلتر بحث دائمًا)، فلا يتغيّر شيء لحساب لم
 * يلمس هذا الإعداد بعد.
 *
 * فيديو الخلفية `<video>` حقيقي (لا CSS background-image، الذي لا يدعم
 * الفيديو) — autoPlay+muted+loop+playsInline إلزامي لتشغيله تلقائيًا
 * على الجوال (خصوصًا Safari iOS الذي يرفض autoplay بصوت أو بلا
 * playsInline). لا رفع فيديو بعد = يتصرف القسم وكأنه بلا خلفية إطلاقًا
 * (نفس تعامل غياب bannerUrl بالضبط)، لا نص مكسور بانتظار ملف لم يُرفع.
 *
 * `bannerUrl`/فيديو يسحبان القسم للأعلى (`-mt-20`) خلف الهيدر الشفاف
 * فقط عند وجود خلفية فعلية — نفس تعليق `header.tsx`، لم يتغيّر.
 *
 * لا نموذج ثنائي اللغة هنا (الثيم الأساسي بلغة عربية واحدة فقط، طلب
 * المؤسس) ولا احتياط باسم المستأجر عند غياب العنوان — قسم بلا عنوان/
 * عنوان فرعي مكتوبين يعرض الخلفية والبحث فقط، بلا نص بديل.
 */
export async function HeroSection({ locale, config, bannerUrl, bannerVideoUrl }: HeroSectionProps) {
  const title = config.title_ar ?? '';
  const subtitle = config.subtitle_ar ?? '';
  const variant = config.variant ?? 'image_search';
  const showSearch = resolveHeroSearchMode(config) !== 'none';
  const useVideo = (variant === 'video' || variant === 'video_search') && Boolean(bannerVideoUrl);
  const useImage = (variant === 'image' || variant === 'image_search') && Boolean(bannerUrl);
  const hasBackground = useVideo || useImage;
  const cities = showSearch ? await listCities() : [];

  return (
    <section
      className={`relative flex min-h-[500px] flex-col items-center justify-center gap-8 overflow-hidden px-5 pb-16 text-center text-white sm:min-h-[560px] sm:px-6 sm:pb-20 lg:min-h-[640px] ${hasBackground ? '-mt-20 pt-36' : 'pt-24'}`}
      style={
        useImage
          ? {
              backgroundImage: `url(${bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {useVideo && (
        <video
          src={bannerVideoUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      )}
      {hasBackground && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/65" />
      )}
      <div className="relative flex max-w-4xl flex-col items-center gap-5">
        {title && (
          <h1
            className={`text-3xl font-bold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl ${hasBackground ? 'text-white' : 'text-tenant-primary'}`}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            className={`max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${hasBackground ? 'text-white/90' : 'text-black/65'}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {showSearch && (
        <div className="relative w-full max-w-5xl rounded-2xl">
          <PropertySearchBar locale={locale} cities={cities} />
        </div>
      )}
    </section>
  );
}
