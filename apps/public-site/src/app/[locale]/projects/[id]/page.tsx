import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildLocalizedAlternates, getPublicOrigin, localizedPath } from '@/lib/routing/public-url';
import { getPublicProject } from '@/lib/api/public-projects';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  let data;
  try {
    data = await getPublicProject(id);
  } catch {
    return { robots: { index: false, follow: false } };
  }

  const project = data.project;
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(locale, project.description_ar ?? '', project.description_en ?? null) || undefined;
  const pathname = `/projects/${project.slug}`;
  const [alternates, origin] = await Promise.all([
    buildLocalizedAlternates(locale, pathname),
    getPublicOrigin(),
  ]);
  const url = origin ? `${origin}${localizedPath(locale, pathname)}` : undefined;
  const image = data.media.find((media) => media.media_type === 'image')?.url;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_SA',
      url,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  let data;
  try {
    data = await getPublicProject(id);
  } catch {
    notFound();
  }

  const project = data.project;
  if (id !== project.slug) {
    permanentRedirect(localizedPath(locale, `/projects/${project.slug}`));
  }

  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(locale, project.description_ar ?? '', project.description_en ?? null);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      {description && <p className="mt-3 max-w-3xl text-black/70">{description}</p>}
      {data.media.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {data.media.map((media) =>
            media.media_type === 'image' ? (
              <img
                key={media.id}
                src={media.url}
                loading="lazy"
                decoding="async"
                alt={pickLocalized(locale, media.alt_ar ?? title, media.alt_en)}
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
            ) : (
              <video key={media.id} src={media.url} controls preload="metadata" className="aspect-video w-full rounded-xl" />
            ),
          )}
        </div>
      )}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">{locale === 'ar' ? 'الوحدات المتاحة' : 'Available units'}</h2>
        {data.units.length === 0 ? (
          <p className="mt-3 text-black/60">{locale === 'ar' ? 'لا توجد وحدات متاحة حاليًا' : 'No units currently available'}</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.units.map((unit) => (
              <article key={unit.id} className="rounded-xl border border-black/10 p-5">
                <h3 className="font-semibold">{locale === 'ar' ? 'وحدة' : 'Unit'} {unit.unit_number}</h3>
                {unit.area_sqm != null && <p className="mt-2 text-sm">{unit.area_sqm} m²</p>}
                {unit.price != null && (
                  <p className="mt-1 font-semibold">
                    {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(unit.price)} SAR
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
