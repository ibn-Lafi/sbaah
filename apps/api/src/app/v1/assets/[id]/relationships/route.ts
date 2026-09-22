import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
interface RouteContext { params: Promise<{ id:string }>; }

export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase); assertPermission(caller.role,'crm.read');
  const {data:asset}=await supabase.from('assets').select('id').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();
  if(!asset)throw new ApiError(404,'asset_not_found','العقار غير موجود');
  const [interests,viewings,reservationLinks,dealLinks,leaseLinks]=await Promise.all([
    supabase.from('lead_interests').select('id,lead_id,created_at,leads(id,full_name,phone)').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('created_at',{ascending:false}),
    supabase.from('viewings').select('id,lead_id,scheduled_at,status,leads(id,full_name,phone)').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('scheduled_at',{ascending:false}),
    supabase.from('reservation_assets').select('reservation_id,reservations(id,reservation_number,status,reserved_at,lead_id,leads(id,full_name,phone))').eq('tenant_id',caller.tenantId).eq('asset_id',id),
    supabase.from('deal_assets').select('deal_id,deals(id,status,value,lead_id,leads(id,full_name,phone))').eq('tenant_id',caller.tenantId).eq('asset_id',id),
    caller.role==='agent'?Promise.resolve({data:[]}):supabase.from('lease_contract_assets').select('contract_id,lease_contracts(id,contract_number,status,lease_contract_parties(party_id,role,parties(id,name,lead_id)))').eq('tenant_id',caller.tenantId).eq('asset_id',id),
  ]);
  return okResponse({relationships:{interests:interests.data??[],viewings:viewings.data??[],reservations:reservationLinks.data??[],deals:dealLinks.data??[],leases:leaseLinks.data??[]}});
});
