import { listingUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
interface RouteContext{params:Promise<{id:string}>}
export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request);
  const {data,error}=await supabase.from('listings').select('*, listing_assets(asset_id, assets(*))').eq('id',id).maybeSingle();
  if(error) throw new Error(`Failed to load listing: ${error.message}`);
  if(!data) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  return okResponse({listing:data});
});
export const PATCH=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase);
  if(caller.role==='agent') throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية تعديل العروض العقارية');
  const input=listingUpdateSchema.parse(await request.json());
  const {data,error}=await supabase.from('listings').update(input).eq('id',id).select().maybeSingle();
  if(error) throw new Error(`Failed to update listing: ${error.message}`);
  if(!data) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  return okResponse({listing:data});
});
export const DELETE=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase);
  if(caller.role==='agent') throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية أرشفة العروض العقارية');
  const {data,error}=await supabase.from('listings').update({publication_status:'archived'}).eq('id',id).select('id').maybeSingle();
  if(error) throw new Error(`Failed to archive listing: ${error.message}`);
  if(!data) throw new ApiError(404,'listing_not_found','العرض العقاري غير موجود');
  return okResponse({status:'archived'});
});
