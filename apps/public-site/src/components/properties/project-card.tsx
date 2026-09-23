import Link from 'next/link';
import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { PublicProject } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { localizedPath } from '@/lib/routing/public-url';

/** Public project card — designed to remain useful even before project media is available in the list endpoint. */
export function ProjectCard({ project, city, locale }: { project: PublicProject; city: City | undefined; locale: Locale }) {
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(locale, project.description_ar ?? '', project.description_en ?? null);
  const thumbnail = project.media?.find((media) => media.media_type === 'image');

  return (
    <Link
      href={localizedPath(locale, `/projects/${project.slug}`)}
      className="group flex min-h-48 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-tenant-secondary/60 hover:shadow-md"
    >
      {thumbnail ? <img src={thumbnail.url} alt={title} className="aspect-[16/9] w-full object-cover" /> : <div className="h-1.5 w-full bg-tenant-secondary" aria-hidden="true" />}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {city && (
          <p className="mb-3 text-xs font-semibold text-tenant-primary">
            {pickLocalized(locale, city.name_ar, city.name_en)}
          </p>
        )}
        <h3 className="text-lg font-bold leading-7 text-black transition-colors group-hover:text-tenant-primary">{title}</h3>
        {description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/60">{description}</p>}
        <span className="mt-auto pt-5 text-sm font-semibold text-tenant-primary">
          {locale === 'ar' ? 'عرض المشروع' : 'View project'}
        </span>
      </div>
    </Link>
  );
}
