import type { Locale } from '@/lib/i18n/locales';
import type { PublicPropertyDetail } from '@/lib/api/public-properties';
import type { City, District } from '@sbaah/shared';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { formatPrice,getListingTypeLabel,getPropertyTypeLabel } from '@/lib/property/labels';

export function LavenderPropertyDetail({locale,property,city,district}:{locale:Locale;property:PublicPropertyDetail;city?:City;district?:District}){
 const title=pickLocalized(locale,property.title_ar,property.title_en), desc=pickLocalized(locale,property.description_ar,property.description_en);
 const images=property.property_media.filter(m=>m.media_type==='image').sort((a,b)=>a.order_index-b.order_index);
 return <div className="bg-[#f4f1ea] text-black">
  <section className="px-5 pb-10 pt-10 sm:px-6 sm:pb-16"><div className="mx-auto max-w-7xl"><div className="mb-6 border-b border-black/20 pb-6"><p className="mb-3 text-xs uppercase tracking-[.16em] text-black/45">{getListingTypeLabel(locale,property.listing_type)}{city?' · '+pickLocalized(locale,city.name_ar,city.name_en):''}</p><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><h1 className="max-w-4xl text-4xl font-medium leading-tight sm:text-6xl">{title}</h1><p className="text-xl font-medium sm:text-2xl">{formatPrice(locale,property.price)}</p></div></div>
  {images.length>0&&<div className="grid gap-2 md:grid-cols-[2fr_1fr]"><img src={images[0].url} alt={title} className="aspect-[16/10] h-full w-full object-cover"/>{images.length>1&&<div className="grid grid-cols-2 gap-2 md:grid-cols-1">{images.slice(1,3).map(m=><img key={m.id??m.url} src={m.url} alt={title} className="aspect-[16/10] h-full w-full object-cover md:aspect-auto"/>)}</div>}</div>}</div></section>
  <section className="bg-white px-5 py-14 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr]"><h2 className="text-3xl font-medium sm:text-5xl">{locale==='ar'?'تفاصيل العقار':'Property details'}</h2><div><dl className="grid grid-cols-2 border-t border-black/20 sm:grid-cols-3">
   {[[locale==='ar'?'النوع':'Type',getPropertyTypeLabel(locale,property.property_type)],[locale==='ar'?'المساحة':'Area',property.area_sqm?property.area_sqm+' m²':'—'],[locale==='ar'?'غرف النوم':'Bedrooms',property.bedrooms??'—'],[locale==='ar'?'دورات المياه':'Bathrooms',property.bathrooms??'—'],[locale==='ar'?'الحي':'District',district?pickLocalized(locale,district.name_ar,district.name_en):'—'],[locale==='ar'?'الرقم':'Reference',property.listing_number]].map(([k,v])=><div key={String(k)} className="border-b border-black/20 py-5"><dt className="text-xs text-black/45">{k}</dt><dd className="mt-2 text-lg">{v}</dd></div>)}
  </dl>{desc&&<div className="mt-12"><h3 className="mb-4 text-xl font-medium">{locale==='ar'?'عن العقار':'About the property'}</h3><p className="max-w-3xl whitespace-pre-line text-base leading-8 text-black/60">{desc}</p></div>}</div></div></section>
 </div>;
}