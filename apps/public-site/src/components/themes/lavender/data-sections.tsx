import Link from 'next/link';
import type { FeaturedPropertiesSectionConfig, LatestPropertiesSectionConfig, ProjectsShowcaseSectionConfig, PropertiesByCitySectionConfig } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { listPublicProperties } from '@/lib/api/public-properties';
import { getPublicProject, listPublicProjects } from '@/lib/api/public-projects';
import { listCities } from '@/lib/api/reference-data';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { localizedPath } from '@/lib/routing/public-url';
import { LavenderHeading,LavenderSection } from './primitives';
import { LavenderProperty,LavenderProject } from './cards';

const copy={ar:{featured:'العقارات المميزة',latest:'أحدث العقارات',projects:'المشاريع العقارية',cities:'اكتشف حسب المدينة',all:'عرض الكل'},en:{featured:'Featured properties',latest:'Latest properties',projects:'Real estate projects',cities:'Explore by city',all:'View all'}} as const;
const More=({locale,href}:{locale:Locale;href:string})=><Link href={localizedPath(locale,href)} className="hidden border-b border-black/40 pb-1 text-sm text-black sm:block">{copy[locale].all}</Link>;

export async function LavenderFeaturedProperties({locale,config}:{locale:Locale;config:FeaturedPropertiesSectionConfig}){
 const[result,cities]=await Promise.all([listPublicProperties({page_size:50}),listCities()]);const ids=new Set(config.property_ids??[]);const items=(ids.size?result.properties.filter(p=>ids.has(p.asset_id)):result.properties).slice(0,5);const city=new Map(cities.map(c=>[c.id,c]));
 return <LavenderSection className="bg-[#f4f1ea]"><LavenderHeading eyebrow={locale==='ar'?'مختارات':'Selected'} title={config.title_ar||copy[locale].featured} action={<More locale={locale} href="/properties"/>}/><div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{items.map((p,i)=><LavenderProperty key={p.id} property={p} city={p.city_id?city.get(p.city_id):undefined} locale={locale} featured={i===0}/>)}</div></LavenderSection>;
}
export async function LavenderLatestProperties({locale,config}:{locale:Locale;config:LatestPropertiesSectionConfig}){
 const[result,cities]=await Promise.all([listPublicProperties({page_size:12}),listCities()]);const city=new Map(cities.map(c=>[c.id,c]));const items=result.properties.slice(0,Math.min(Math.max(config.limit??6,1),12));
 return <LavenderSection><LavenderHeading eyebrow={locale==='ar'?'الجديد':'New'} title={config.title_ar||copy[locale].latest} action={<More locale={locale} href="/properties"/>}/><div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{items.map(p=><LavenderProperty key={p.id} property={p} city={p.city_id?city.get(p.city_id):undefined} locale={locale}/>)}</div></LavenderSection>;
}
export async function LavenderProjects({locale,config}:{locale:Locale;config:ProjectsShowcaseSectionConfig}){
 const[result,cities]=await Promise.all([listPublicProjects(),listCities()]);const city=new Map(cities.map(c=>[c.id,c]));const base=result.projects.slice(0,Math.min(Math.max(config.limit??5,1),12));const details=await Promise.all(base.map(async p=>{try{const d=await getPublicProject(p.slug||p.id);return {...p,status:String(d.project.status??'published'),completion_percentage:typeof d.project.completion_percentage==='number'?d.project.completion_percentage:null,planned_units_count:typeof d.project.planned_units_count==='number'?d.project.planned_units_count:null,models_count:d.unit_types.length}}catch{return p}}));
 return <LavenderSection className="bg-[#171713] text-white"><div className="mb-10 flex items-end justify-between border-b border-white/20 pb-5 sm:mb-14"><h2 className="text-3xl font-medium sm:text-5xl">{config.title_ar||copy[locale].projects}</h2><Link href={localizedPath(locale,'/projects')} className="hidden border-b border-white/50 pb-1 text-sm sm:block">{copy[locale].all}</Link></div><div className="grid gap-5 lg:grid-cols-3">{details.map((p,i)=><LavenderProject key={p.id} project={p} city={city.get(p.city_id)} locale={locale} featured={i===0}/>)}</div></LavenderSection>;
}
export async function LavenderCities({locale,config}:{locale:Locale;config:PropertiesByCitySectionConfig}){
 const[cities,result]=await Promise.all([listCities(),listPublicProperties({page_size:50})]);const inventory=new Set(result.properties.map(p=>p.city_id));const wanted=new Set(config.city_ids??[]);const items=cities.filter(c=>inventory.has(c.id)).filter(c=>!wanted.size||wanted.has(c.id)).slice(0,8);
 return <LavenderSection><LavenderHeading eyebrow={locale==='ar'?'المواقع':'Locations'} title={config.title_ar||copy[locale].cities}/><div className="border-t border-black/20">{items.map((city,i)=><Link key={city.id} href={localizedPath(locale,'/properties')+'?city_id='+city.id} className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-black/20 py-5 sm:py-7"><span className="text-xs text-black/35">{String(i+1).padStart(2,'0')}</span><span className="text-xl font-medium sm:text-3xl">{pickLocalized(locale,city.name_ar,city.name_en)}</span><span className="text-xl transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">↗</span></Link>)}</div></LavenderSection>;
}
