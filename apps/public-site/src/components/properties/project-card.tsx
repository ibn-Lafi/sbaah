import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { PublicProject } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';

/** No detail page or photos for projects yet (no `project_media` table, task 13/42) — a plain info card, not a link. */
export function ProjectCard({ project, city, locale }: { project: PublicProject; city: City | undefined; locale: Locale }) {
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(locale, project.description_ar ?? '', project.description_en ?? null);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-5">
      <h3 className="font-semibold">{title}</h3>
      {city && <p className="text-sm text-black/60">{pickLocalized(locale, city.name_ar, city.name_en)}</p>}
      {description && <p className="text-sm text-black/70">{description}</p>}
    </div>
  );
}
