import { pickLocalized } from '@/lib/i18n/localized-field';
import { listCities } from '@/lib/api/reference-data';
import type { HeroSectionProps } from '../types';
import { PropertySearchBar } from '@/components/properties/property-search-bar';

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
 */
export async function HeroSection({ locale, config, bannerUrl, bannerVideoUrl, tenantName }: HeroSectionProps) {
  const title = pickLocalized(locale, config.title_ar || tenantName, config.title_en ?? null) || tenantName;
  const subtitle = pickLocalized(locale, config.subtitle_ar ?? '', config.subtitle_en ?? null);
  const variant = config.variant ?? 'image_search';
  const showSearch = variant === 'image_search' || variant === 'video_search';
  const useVideo = (variant === 'video' || variant === 'video_search') && Boolean(bannerVideoUrl);
  const useImage = (variant === 'image' || variant === 'image_search') && Boolean(bannerUrl);
  const hasBackground = useVideo || useImage;
  const cities = showSearch ? await listCities() : [];

  return (
    <section
      className={`relative flex min-h-[420px] flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-20 text-center text-white ${hasBackground ? '-mt-20 pt-36' : 'pt-16'}`}
      style={useImage ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {useVideo && (
        <video
          src={bannerVideoUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {hasBackground && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative flex flex-col items-center gap-4">
        <h1 className={`text-3xl font-bold md:text-4xl ${hasBackground ? 'text-white' : 'text-tenant-primary'}`}>{title}</h1>
        {subtitle && <p className={`max-w-xl text-lg ${hasBackground ? 'text-white/90' : 'text-black/70'}`}>{subtitle}</p>}
      </div>
      {showSearch && (
        <div className="relative w-full max-w-4xl">
          <PropertySearchBar locale={locale} cities={cities} />
        </div>
      )}
    </section>
  );
}
