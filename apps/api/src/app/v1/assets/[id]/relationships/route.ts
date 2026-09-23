import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
interface RouteContext { params: Promise<{ id:string }>; }

export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase); assertPermission(caller.role,'crm.read');
  const {data:asset}=await supabase.from('assets').select('id').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();
  if(!asset)throw new ApiError(404,'asset_not_found','العقار غير موجود');
  const {data:listingLinks,error:listingLinksError}=await supabase.from('listing_assets').select('listing_id').eq('tenant_id',caller.tenantId).eq('asset_id',id);
  if(listingLinksError)throw new Error(listingLinksError.message);
  const listingIds=[...new Set((listingLinks??[]).map(x=>x.listing_id))];
  const [assetInterests,listingInterests,viewings,reservationLinks,dealLinks,leaseLinks,ownerships,management,maintenance]=await Promise.all([
    supabase.from('lead_interests').select('id,lead_id,created_at,leads(id,full_name,phone)').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('created_at',{ascending:false}),
    listingIds.length?supabase.from('lead_interests').select('id,lead_id,created_at,leads(id,full_name,phone)').eq('tenant_id',caller.tenantId).in('listing_id',listingIds).order('created_at',{ascending:false}):Promise.resolve({data:[],error:null}),
    supabase.from('viewings').select('id,lead_id,scheduled_at,status,leads(id,full_name,phone)').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('scheduled_at',{ascending:false}),
    supabase.from('reservation_assets').select('reservation_id,reservations(id,reservation_number,status,reserved_at,lead_id,leads(id,full_name,phone))').eq('tenant_id',caller.tenantId).eq('asset_id',id),
    supabase.from('deal_assets').select('deal_id,deals(id,status,value,deal_type,closed_at,created_at,responsible_user_id,listing_id,lead_id,leads(id,full_name,phone,source),users!deals_responsible_user_id_fkey(id,full_name),listings(id,listing_number,asking_price,created_at))').eq('tenant_id',caller.tenantId).eq('asset_id',id),
    caller.role==='agent'?Promise.resolve({data:[]}):supabase.from('lease_contract_assets').select('contract_id,lease_contracts(id,contract_number,status,start_date,end_date,total_value,payment_frequency,lease_contract_parties(party_id,role,parties(id,name,lead_id)),lease_installments(id,installment_number,due_date,amount,status))').eq('tenant_id',caller.tenantId).eq('asset_id',id),
    caller.role==='agent'?Promise.resolve({data:[]}):supabase.from('asset_ownerships').select('id,party_id,ownership_percentage,started_at,ended_at,parties(id,name)').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('created_at',{ascending:false}),
    caller.role==='agent'?Promise.resolve({data:[]}):supabase.from('property_management_assignments').select('id,status,starts_at,ends_at,management_fee_type,management_fee_value').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('created_at',{ascending:false}),
    caller.role==='agent'?Promise.resolve({data:[]}):supabase.from('maintenance_requests').select('id,request_number,title,priority,status,opened_at,completed_at,contract_id,estimated_cost,actual_cost').eq('tenant_id',caller.tenantId).eq('asset_id',id).order('opened_at',{ascending:false}),
  ]);
  for(const result of [assetInterests,listingInterests,viewings,reservationLinks,dealLinks,leaseLinks,ownerships,management,maintenance])if('error' in result&&result.error)throw new Error(result.error.message);
  const interestMap=new Map<string,(typeof assetInterests.data extends Array<infer T>?T:never)>();for(const row of [...(assetInterests.data??[]),...(listingInterests.data??[])].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()))if(!interestMap.has(row.lead_id))interestMap.set(row.lead_id,row);return okResponse({relationships:{interests:[...interestMap.values()],viewings:viewings.data??[],reservations:reservationLinks.data??[],deals:dealLinks.data??[],leases:leaseLinks.data??[],ownerships:ownerships.data??[],management:management.data??[],maintenance:maintenance.data??[]}});
});
