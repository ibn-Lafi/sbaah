import { listCities } from '@/lib/api/reference-data';
import { PropertySearchBar } from '@/components/properties/property-search-bar';
import type { HeroSectionProps } from '../types';

export async function HeroSection({locale,config,bannerUrl,bannerVideoUrl}:HeroSectionProps){
 const title=config.title_ar??''; const subtitle=config.subtitle_ar??''; const variant=config.variant??'image_search';
 const showSearch=variant==='image_search'||variant==='video_search';
 const useVideo=(variant==='video'||variant==='video_search')&&Boolean(bannerVideoUrl);
 const useImage=(variant==='image'||variant==='image_search')&&Boolean(bannerUrl);
 const cities=showSearch?await listCities():[];
 return <section className="relative -mt-24 min-h-[78vh] overflow-hidden bg-[#171713] text-white sm:min-h-[86vh]">
  {useVideo&&<video src={bannerVideoUrl??undefined} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" aria-hidden="true"/>}
  {useImage&&<div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url(${bannerUrl})`}}/>}
  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35"/>
  <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-5 pb-10 pt-40 sm:min-h-[86vh] sm:px-6 sm:pb-14 lg:pb-16">
   <div className="max-w-5xl border-t border-white/35 pt-6">
    {title&&<h1 className="max-w-4xl text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">{title}</h1>}
    {subtitle&&<p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">{subtitle}</p>}
   </div>
   {showSearch&&<div className="mt-8 max-w-5xl rounded-2xl bg-white/95 p-1 text-black shadow-2xl backdrop-blur"><PropertySearchBar locale={locale} cities={cities}/></div>}
  </div>
 </section>;
}
