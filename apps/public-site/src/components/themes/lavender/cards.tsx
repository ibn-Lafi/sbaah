import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import type { City } from '@sbaah/shared';
import type { PublicProperty } from '@/lib/api/public-properties';
import type { PublicProject } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { formatPrice, getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import { localizedPath } from '@/lib/routing/public-url';

function propertyImage(property: PublicProperty) {
  return [...property.property_media].filter((m)=>m.media_type==='image').sort((a,b)=>a.order_index-b.order_index)[0]?.url;
}

export function LavenderProperty({property,city,locale,featured=false}:{property:PublicProperty;city?:City;locale:Locale;featured?:boolean}){
 const title=pickLocalized(locale,property.title_ar,property.title_en); const image=propertyImage(property);
 return <Link href={localizedPath(locale,`/properties/${property.slug}`)} className={`group block ${featured?'sm:col-span-2':''}`}>
  <div className={`overflow-hidden bg-[#dedbd3] ${featured?'aspect-[16/9]':'aspect-[4/3]'}`}>{image&&<img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"/>}</div>
  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/20 py-4">
   <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[.16em] text-black/45">{getListingTypeLabel(locale,property.listing_type)}{city?` · ${pickLocalized(locale,city.name_ar,city.name_en)}`:''}</p><h3 className="text-xl font-medium leading-tight text-black">{title}</h3><p className="mt-2 text-sm text-black/50">{getPropertyTypeLabel(locale,property.property_type)}{property.area_sqm?` · ${property.area_sqm} m²`:''}</p></div>
   <p className="self-end whitespace-nowrap text-sm font-semibold text-black">{formatPrice(locale,property.price)}</p>
  </div>
 </Link>;
}

export function LavenderProject({project,city,locale,featured=false}:{project:PublicProject;city?:City;locale:Locale;featured?:boolean}){
 const title=pickLocalized(locale,project.name_ar,project.name_en); const description=pickLocalized(locale,project.description_ar??'',project.description_en??null); const image=project.media?.find(m=>m.media_type==='image')?.url;
 return <Link href={localizedPath(locale,`/projects/${project.slug}`)} className={`group block ${featured?'lg:col-span-2':''}`}>
  <div className={`relative overflow-hidden bg-[#272720] ${featured?'aspect-[16/8]':'aspect-[4/3]'}`}>{image&&<img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">{city&&<p className="mb-2 text-xs text-white/65">{pickLocalized(locale,city.name_ar,city.name_en)}</p>}<h3 className="text-2xl font-medium sm:text-3xl">{title}</h3>{description&&<p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-white/65">{description}</p>}<div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/25 pt-4 text-xs text-white/75">{project.completion_percentage!=null&&<span>{locale==='ar'?'نسبة الإنجاز':'Progress'} <strong className="text-white">{project.completion_percentage}%</strong></span>}{project.models_count!=null&&<span>{locale==='ar'?'النماذج':'Models'} <strong className="text-white">{project.models_count}</strong></span>}{project.planned_units_count!=null&&<span>{locale==='ar'?'الوحدات':'Units'} <strong className="text-white">{project.planned_units_count}</strong></span>}</div></div></div>
 </Link>;
}
