'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ASSET_TYPES, LISTING_TYPES, type City, type District } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import type { PropertyFiltersValue } from '@/components/properties/property-filters';

const LABELS={ar:{city:'المدينة',district:'الحي',type:'نوع العقار',listing:'الغرض',min:'أقل سعر',max:'أعلى سعر',bedrooms:'الغرف',any:'الكل'},en:{city:'City',district:'District',type:'Property type',listing:'Purpose',min:'Min price',max:'Max price',bedrooms:'Bedrooms',any:'Any'}};

export function LavenderPropertyFilters({locale,cities,districts,value}:{locale:Locale;cities:City[];districts:District[];value:PropertyFiltersValue}){
 const router=useRouter(), pathname=usePathname(), t=LABELS[locale];
 const update=(patch:Partial<PropertyFiltersValue>)=>{const next={...value,...patch};if(patch.city_id!==undefined&&patch.city_id!==value.city_id)next.district_id=undefined;const q=new URLSearchParams();Object.entries(next).forEach(([k,v])=>{if(v)q.set(k,v)});router.push(pathname+(q.size?'?'+q:''));};
 const cls='min-h-12 border-0 border-b border-black/25 bg-transparent px-0 text-sm outline-none focus:border-black disabled:opacity-40';
 return <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
  <select value={value.listing_type??''} onChange={e=>update({listing_type:e.target.value||undefined})} className={cls}><option value="">{t.any}</option>{LISTING_TYPES.map(x=><option key={x} value={x}>{getListingTypeLabel(locale,x)}</option>)}</select>
  <select value={value.property_type??''} onChange={e=>update({property_type:e.target.value||undefined})} className={cls}><option value="">{t.type}</option>{ASSET_TYPES.map(x=><option key={x} value={x}>{getPropertyTypeLabel(locale,x)}</option>)}</select>
  <select value={value.city_id??''} onChange={e=>update({city_id:e.target.value||undefined})} className={cls}><option value="">{t.city}</option>{cities.map(x=><option key={x.id} value={x.id}>{pickLocalized(locale,x.name_ar,x.name_en)}</option>)}</select>
  <select value={value.district_id??''} disabled={!value.city_id} onChange={e=>update({district_id:e.target.value||undefined})} className={cls}><option value="">{t.district}</option>{districts.map(x=><option key={x.id} value={x.id}>{pickLocalized(locale,x.name_ar,x.name_en)}</option>)}</select>
  <input type="number" placeholder={t.min} value={value.min_price??''} onChange={e=>update({min_price:e.target.value||undefined})} className={cls}/>
  <input type="number" placeholder={t.max} value={value.max_price??''} onChange={e=>update({max_price:e.target.value||undefined})} className={cls}/>
  <select value={value.bedrooms??''} onChange={e=>update({bedrooms:e.target.value||undefined})} className={cls}><option value="">{t.bedrooms}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}</select>
 </div>;
}