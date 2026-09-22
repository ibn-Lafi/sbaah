import { listingUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
interface RouteContext{params:Promise<{id:string}>}
export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase);
  const {data,error}=await supabase.from('listings').select('*, listing_assets(asset_id, assets(*))').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();
  if(error) throw new Error(`Failed to load listing: ${error.message}`);
  if(!data) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  return okResponse({listing:data});
});
export const PATCH=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase);
  if(caller.role==='agent') throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية تعديل العروض العقارية');
  const input=listingUpdateSchema.parse(await request.json());
  const {data:current,error:currentError}=await supabase.from('listings').select('listing_type,pricing_period').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();
  if(currentError) throw new Error(`Failed to load listing before update: ${currentError.message}`);
  if(!current) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  const nextPricingPeriod=input.pricing_period===undefined?current.pricing_period:input.pricing_period;
  if(current.listing_type==='rent'&&!nextPricingPeriod) throw new ApiError(400,'pricing_period_required','دورية الإيجار مطلوبة');
  if(current.listing_type==='sale'&&nextPricingPeriod!=null) throw new ApiError(400,'pricing_period_not_allowed','دورية السعر خاصة بعروض الإيجار');
  const {data,error}=await supabase.from('listings').update(input).eq('id',id).eq('tenant_id',caller.tenantId).select().maybeSingle();
  if(error) throw new Error(`Failed to update listing: ${error.message}`);
  if(!data) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  return okResponse({listing:data});
});
export const DELETE=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase);
  if(caller.role==='agent') throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية أرشفة العروض العقارية');
  const {data,error}=await supabase.from('listings').update({publication_status:'archived'}).eq('id',id).eq('tenant_id',caller.tenantId).select('id').maybeSingle();
  if(error) throw new Error(`Failed to archive listing: ${error.message}`);
  if(!data) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  return okResponse({status:'archived'});
});
