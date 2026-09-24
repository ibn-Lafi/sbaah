import Link from 'next/link';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { PropertyGridSectionProps } from '../types';
import { LavenderHeading,LavenderSection } from './primitives';

export async function PropertyGridSection({locale,config}:PropertyGridSectionProps){
 const title=config.title_ar||DEFAULT_SECTION_TITLE.property_grid.ar;
 const href=locale==='ar'?'/properties':'/en/properties';
 const [cities,{properties}]=await Promise.all([listCities(),listPublicProperties({page:1})]);
 const cityMap=new Map(cities.map(c=>[c.id,c]));
 return <LavenderSection className="bg-[#f4f1ea]"><LavenderHeading eyebrow={locale==='ar'?'مختارات عقارية':'Selected properties'} title={title} action={<Link href={href} className="hidden text-sm font-semibold text-black underline-offset-4 hover:underline sm:block">{locale==='ar'?'عرض الكل':'See all'}</Link>}/>
  {properties.length===0?<div className="border-y border-black/10 py-16 text-center text-black/50">{locale==='ar'?'لا توجد عقارات منشورة بعد':'No published properties yet'}</div>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{properties.slice(0,6).map(p=><PropertyCard key={p.id} property={p} city={p.city_id?cityMap.get(p.city_id):undefined} locale={locale}/>)}</div>}
 </LavenderSection>;
}
