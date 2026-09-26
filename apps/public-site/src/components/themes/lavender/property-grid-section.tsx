import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities } from '@/lib/api/reference-data';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { PropertyGridSectionProps } from '../types';
import { LavenderHeading, LavenderSection } from './primitives';
import { LavenderProperty } from './cards';

export async function PropertyGridSection({ locale, config }: PropertyGridSectionProps) {
  const title = config.title_ar || DEFAULT_SECTION_TITLE.property_grid.ar;
  const href = locale === 'ar' ? '/properties' : '/en/properties';
  const [cities, { properties }] = await Promise.all([
    listCities(),
    listPublicProperties({ page: 1 }),
  ]);
  const cityMap = new Map(cities.map((c) => [c.id, c]));
  return (
    <LavenderSection className="bg-[#f4f1ea]">
      <LavenderHeading
        eyebrow={locale === 'ar' ? 'محفظتنا العقارية' : 'Our portfolio'}
        title={title}
        action={
          <a
            href={href}
            className="focus-visible:ring-tenant-primary hidden border-b border-black/40 pb-1 text-sm font-semibold text-black outline-none hover:border-black focus-visible:ring-2 sm:block"
          >
            {locale === 'ar' ? 'عرض جميع العقارات' : 'View all properties'}
          </a>
        }
      />
      {properties.length === 0 ? (
        <div className="border-y border-black/15 py-16 text-center text-black/65">
          {locale === 'ar' ? 'لا توجد عقارات منشورة بعد' : 'No published properties yet'}
        </div>
      ) : (
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {properties.slice(0, 6).map((p) => (
            <LavenderProperty
              key={p.id}
              property={p}
              city={p.city_id ? cityMap.get(p.city_id) : undefined}
              locale={locale}
            />
          ))}
        </div>
      )}
    </LavenderSection>
  );
}
