import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildLocalizedAlternates, getPublicOrigin, localizedPath } from '@/lib/routing/public-url';
import { getPublicProject } from '@/lib/api/public-projects';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { resolveTheme } from '@/components/themes/registry';
import { LavenderProjectDetail } from '@/components/themes/lavender/project-detail';
import { InquiryForm } from '@/components/properties/inquiry-form';

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
  let data; try { data = await getPublicProject(id); } catch { notFound(); }
  const project=data.project;if(id!==project.slug)permanentRedirect(localizedPath(locale,`/projects/${project.slug}`));
  const site=await getTenantSitePage('project_detail');
  if(!site) notFound();
  const isLavender=resolveTheme(site.website.theme_key).key==='lavender';
  const detailVisible=site.sections.some(s=>s.type==='project_detail');
  const leadSection=site.sections.find(s=>s.type==='property_request');
  if(isLavender) return <>{detailVisible&&<LavenderProjectDetail locale={locale} data={data}/>} {leadSection&&<section className="bg-[#f4f1ea] px-4 py-12 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[.7fr_1.3fr]"><div><p className="mb-2 text-xs text-black/45">{locale==='ar'?'تواصل معنا':'Get in touch'}</p><h2 className="text-3xl font-medium sm:text-5xl">{String(leadSection.config.title_ar??(locale==='ar'?'سجل اهتمامك بالمشروع':'Register your interest'))}</h2>{leadSection.config.body_ar&&<p className="mt-3 max-w-md text-sm leading-7 text-black/55">{String(leadSection.config.body_ar)}</p>}</div><InquiryForm locale={locale} tenantId={site.tenant.id} projectId={project.id} variant="lavender"/></div></section>}</>;
  const title=pickLocalized(locale,project.name_ar,project.name_en);
  const description=pickLocalized(locale,project.description_ar??'',project.description_en??null);
  const images=data.media.filter(m=>m.media_type==='image');
  const videos=data.media.filter(m=>m.media_type==='video');
  const primary=images.find(m=>m.is_primary)??images[0];
  const by=(category:string)=>images.filter(m=>m.category===category);
  const showcase=[...by('general'),...by('exterior')].filter(m=>m.id!==primary?.id).slice(0,6);
  const sections=[
    {key:'master_plan',title:locale==='ar'?'مخطط المشروع':'Master plan',items:by('master_plan')},
    {key:'unit_plans',title:locale==='ar'?'مخططات الوحدات':'Unit plans',items:by('unit_plans')},
    {key:'interior',title:locale==='ar'?'التصاميم والمساحات الداخلية':'Interiors',items:by('interior')},
    {key:'amenities',title:locale==='ar'?'المرافق والخدمات':'Amenities & services',items:by('amenities')},
    {key:'location',title:locale==='ar'?'الموقع والمحيط':'Location & surroundings',items:by('location')},
    {key:'construction',title:locale==='ar'?'تقدم المشروع':'Construction progress',items:by('construction')},
  ];
  const completion=typeof project.completion_percentage==='number'?project.completion_percentage:null;
  return <main className="pb-16">
    <section className="relative min-h-[420px] overflow-hidden bg-black md:min-h-[560px]">
      {primary?<img src={primary.url} alt={pickLocalized(locale,primary.alt_ar??title,primary.alt_en)} className="absolute inset-0 h-full w-full object-cover"/>:<div className="absolute inset-0 bg-neutral-900"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10"/>
      <div className="relative mx-auto flex min-h-[420px] max-w-6xl items-end px-6 pb-10 text-white md:min-h-[560px] md:pb-14"><div className="max-w-3xl"><p className="mb-3 text-sm text-white/75">{locale==='ar'?'مشروع عقاري':'Real estate project'}</p><h1 className="text-3xl font-bold md:text-5xl">{title}</h1>{description&&<p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">{description}</p>}</div></div>
    </section>
    <div className="mx-auto max-w-6xl px-6">
      {showcase.length>0&&<section className="py-8"><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{showcase.map((m,i)=><img key={m.id} src={m.url} alt={pickLocalized(locale,m.alt_ar??title,m.alt_en)} loading="lazy" className={`w-full rounded-2xl object-cover ${i===0?'col-span-2 aspect-[2/1] md:col-span-1 md:aspect-[4/3]':'aspect-[4/3]'}`}/>)}</div></section>}
      <section className="grid gap-5 border-b border-black/10 py-10 md:grid-cols-[1fr_auto]"><div><h2 className="text-2xl font-semibold">{locale==='ar'?'عن المشروع':'About the project'}</h2>{description&&<p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-black/70">{description}</p>}</div><dl className="grid min-w-[260px] grid-cols-2 gap-4 text-sm">{completion!=null&&<div><dt className="text-black/50">{locale==='ar'?'نسبة الإنجاز':'Completion'}</dt><dd className="mt-1 font-semibold">{completion}%</dd></div>}{project.planned_units_count!=null&&<div><dt className="text-black/50">{locale==='ar'?'عدد الوحدات':'Planned units'}</dt><dd className="mt-1 font-semibold">{String(project.planned_units_count)}</dd></div>}{project.expected_completion_date!=null&&<div className="col-span-2"><dt className="text-black/50">{locale==='ar'?'التسليم المتوقع':'Expected completion'}</dt><dd className="mt-1 font-semibold">{String(project.expected_completion_date)}</dd></div>}</dl></section>
      {data.unit_types.length>0&&<section className="border-b border-black/10 py-10"><h2 className="text-2xl font-semibold">{locale==='ar'?'أنواع الوحدات':'Unit types'}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.unit_types.map(type=><article key={type.id} className="rounded-2xl border border-black/10 p-5"><h3 className="font-semibold">{pickLocalized(locale,type.name_ar,type.name_en)}</h3></article>)}</div></section>}
      {sections.map(section=>section.items.length>0&&<section key={section.key} className="border-b border-black/10 py-10"><div className="mb-5 flex items-end justify-between gap-4"><h2 className="text-2xl font-semibold">{section.title}</h2><span className="text-sm text-black/50">{section.items.length}</span></div><div className={section.key==='master_plan'?'grid gap-4':'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>{section.items.map(m=><img key={m.id} src={m.url} alt={pickLocalized(locale,m.alt_ar??section.title,m.alt_en)} loading="lazy" className={section.key==='master_plan'?'max-h-[720px] w-full rounded-2xl object-contain bg-black/[.03]':'aspect-[4/3] w-full rounded-2xl object-cover'}/>)}</div></section>)}
      {videos.length>0&&<section className="border-b border-black/10 py-10"><h2 className="text-2xl font-semibold">{locale==='ar'?'فيديو المشروع':'Project video'}</h2><div className="mt-5 space-y-5">{videos.map(v=><video key={v.id} src={v.url} controls preload="metadata" className="aspect-video w-full rounded-2xl bg-black"/>)}</div></section>}
      {leadSection&&<section className="border-t border-black/10 py-10"><h2 className="mb-5 text-2xl font-semibold">{locale==='ar'?'سجل اهتمامك بالمشروع':'Register your interest'}</h2><InquiryForm locale={locale} tenantId={site.tenant.id} projectId={project.id}/></section>}
      <section className="py-10"><h2 className="text-2xl font-semibold">{locale==='ar'?'الوحدات المتاحة':'Available units'}</h2>{data.units.length===0?<p className="mt-3 text-black/60">{locale==='ar'?'لا توجد وحدات متاحة حاليًا':'No units currently available'}</p>:<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.units.map(unit=><article key={unit.id} className="rounded-2xl border border-black/10 p-5"><h3 className="font-semibold">{unit.name_ar||`${locale==='ar'?'وحدة':'Unit'} ${unit.unit_number??''}`}</h3>{unit.area_sqm!=null&&<p className="mt-2 text-sm text-black/60">{unit.area_sqm} m²</p>}{unit.price!=null&&<p className="mt-2 font-semibold">{new Intl.NumberFormat(locale==='ar'?'ar-SA':'en-SA').format(unit.price)} SAR</p>}</article>)}</div>}</section>
    </div>
  </main>;
}
