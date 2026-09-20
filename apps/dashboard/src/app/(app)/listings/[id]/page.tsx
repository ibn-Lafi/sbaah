'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ListingDetail } from '@/lib/api/real-estate';
import type { ListingCommercialStatus, ListingPricingPeriod, ListingPublicationStatus } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { archiveListing, getListing, updateListing } from '@/lib/api/real-estate';

const pub:Record<string,string>={draft:'مسودة',published:'منشور',paused:'موقوف',archived:'مؤرشف'};
const commercial:Record<string,string>={available:'متاح',reserved:'محجوز',under_negotiation:'تحت التفاوض',closed:'مغلق'};

export default function ListingPage({params}:{params:Promise<{id:string}>}){
 const {id}=use(params); const router=useRouter(); const {me,accessToken}=useCurrentUser();
 const [data,setData]=useState<ListingDetail|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 useEffect(()=>{void getListing(accessToken,id).then(r=>setData(r.listing))},[accessToken,id]);
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault(); if(!data)return; const f=new FormData(e.currentTarget); setBusy(true); setError('');
  try{
   const r=await updateListing(accessToken,id,{title_ar:String(f.get('title_ar')),asking_price:Number(f.get('asking_price')),pricing_period:data.listing_type==='rent'?(f.get('pricing_period') as ListingPricingPeriod):null,publication_status:f.get('publication_status') as ListingPublicationStatus,commercial_status:f.get('commercial_status') as ListingCommercialStatus,advertisement_license_number:String(f.get('advertisement_license_number')||'')||null,advertisement_license_expires_at:String(f.get('advertisement_license_expires_at')||'')||null,advertiser_name:String(f.get('advertiser_name')||'')||null});
   setData({...data,...r.listing});
  }catch(x){setError(x instanceof Error?x.message:'تعذر حفظ العرض')}finally{setBusy(false)}
 }
 return <AppShell title={data?.title_ar??'تفاصيل العرض'} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
 {!data?<FormPageSkeleton fields={6} extraCards={1}/>:<div className="mx-auto flex max-w-[820px] flex-col gap-5">
  <BackButton href="/properties" label="رجوع" className="self-start"/>
  <div className="grid gap-4 sm:grid-cols-3">
   <Card className="p-5"><p className="text-sm text-text-secondary">الغرض</p><p className="mt-2 font-semibold">{data.listing_type==='sale'?'بيع':'إيجار'}</p></Card>
   <Card className="p-5"><p className="text-sm text-text-secondary">النشر</p><p className="mt-2 font-semibold">{pub[data.publication_status]??data.publication_status}</p></Card>
   <Card className="p-5"><p className="text-sm text-text-secondary">الحالة التجارية</p><p className="mt-2 font-semibold">{commercial[data.commercial_status]??data.commercial_status}</p></Card>
  </div>
  <Card className="p-6"><h2 className="mb-4 font-semibold">العقارات المرتبطة</h2>{data.listing_assets.map(x=><Link key={x.asset_id} href={'/properties/'+x.asset_id} className="block py-1 text-sm font-medium text-brand hover:underline">{x.assets?.name_ar??x.asset_id}</Link>)}</Card>
  <Card className="p-6"><h2 className="mb-4 font-semibold">بيانات العرض</h2><form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
   <Input name="title_ar" defaultValue={data.title_ar} required/><Input name="asking_price" type="number" min="0" step="0.01" defaultValue={data.asking_price} required/>
   {data.listing_type==='rent'&&<Select name="pricing_period" defaultValue={data.pricing_period??'annual'}><option value="monthly">شهري</option><option value="quarterly">ربع سنوي</option><option value="semi_annual">نصف سنوي</option><option value="annual">سنوي</option></Select>}
   <Select name="publication_status" defaultValue={data.publication_status}><option value="draft">مسودة</option><option value="published">منشور</option><option value="paused">موقوف</option><option value="archived">مؤرشف</option></Select>
   <Select name="commercial_status" defaultValue={data.commercial_status}><option value="available">متاح</option><option value="reserved">محجوز</option><option value="under_negotiation">تحت التفاوض</option><option value="closed">مغلق</option></Select>
   <Input name="advertisement_license_number" placeholder="رقم ترخيص الإعلان" defaultValue={data.advertisement_license_number??''}/><Input name="advertisement_license_expires_at" type="date" defaultValue={data.advertisement_license_expires_at??''}/><Input name="advertiser_name" placeholder="اسم المعلن" defaultValue={data.advertiser_name??''}/>
  </div>{error&&<p className="text-sm text-red-600">{error}</p>}{me.user.role!=='agent'&&<Button type="submit" disabled={busy}>{busy?'جارٍ الحفظ...':'حفظ التغييرات'}</Button>}</form></Card>
  {me.user.role!=='agent'&&data.publication_status!=='archived'&&<div className="flex justify-end"><Button variant="secondary" onClick={async()=>{if(!confirm('هل تريد أرشفة العرض؟'))return;await archiveListing(accessToken,id);router.push('/properties')}}>أرشفة العرض</Button></div>}
 </div>}
 </AppShell>
}