import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext { params: Promise<{ id:string }>; }

export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
  const {id}=await params;
  const {supabase}=getAuthenticatedClient(request);
  const caller=await getCallerContext(supabase);
  const {data:project,error:projectError}=await supabase.from('projects').select('id,name_ar').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();
  if(projectError)throw new Error(projectError.message);
  if(!project)throw new ApiError(404,'project_not_found','المشروع غير موجود');
  const {data:assets,error:assetsError}=await supabase.from('assets').select('id,name_ar,asset_type,physical_status,unit_number,unit_type_id,phase_id').eq('tenant_id',caller.tenantId).eq('project_id',id).is('archived_at',null).order('created_at');
  if(assetsError)throw new Error(assetsError.message);
  const assetIds=(assets??[]).map(asset=>asset.id);
  const [{data:interests,error:interestError},{data:viewings,error:viewingError},{data:reservationLinks,error:reservationError},{data:projectDeals,error:projectDealError}]=assetIds.length?await Promise.all([
    supabase.from('lead_interests').select('lead_id').eq('tenant_id',caller.tenantId).in('asset_id',assetIds),
    supabase.from('viewings').select('lead_id').eq('tenant_id',caller.tenantId).in('asset_id',assetIds),
    supabase.from('reservation_assets').select('reservations(lead_id,status)').eq('tenant_id',caller.tenantId).in('asset_id',assetIds),
    supabase.from('deal_assets').select('deals(lead_id,status,deal_type)').eq('tenant_id',caller.tenantId).in('asset_id',assetIds),
  ]):[{data:[],error:null},{data:[],error:null},{data:[],error:null},{data:[],error:null}];
  if(interestError)throw new Error(interestError.message);if(viewingError)throw new Error(viewingError.message);if(reservationError)throw new Error(reservationError.message);if(projectDealError)throw new Error(projectDealError.message);
  const unique=(values:Array<string|null|undefined>)=>new Set(values.filter((value):value is string=>Boolean(value)));
  const wonLeads=unique((projectDeals??[]).flatMap(x=>Array.isArray(x.deals)?x.deals:(x.deals?[x.deals]:[])).filter(x=>x.deal_type==='sale'&&x.status==='won').map(x=>x.lead_id));
  const projectDealRows=(projectDeals??[]).flatMap(x=>Array.isArray(x.deals)?x.deals:(x.deals?[x.deals]:[])).filter(x=>x.deal_type==='sale');
  const negotiationLeads=unique([...projectDealRows.filter(x=>x.status==='open'||x.status==='negotiation'||x.status==='won').map(x=>x.lead_id),...wonLeads]);
  const reservationRows=(reservationLinks??[]).flatMap(x=>Array.isArray(x.reservations)?x.reservations:(x.reservations?[x.reservations]:[])).filter(x=>x.status==='active'||x.status==='converted');
  const reservationLeads=unique([...reservationRows.map(x=>x.lead_id),...negotiationLeads]);
  const viewingLeads=unique([...(viewings??[]).map(x=>x.lead_id),...reservationLeads]);
  const interestLeads=unique([...(interests??[]).map(x=>x.lead_id),...viewingLeads]);
  const funnelCounts=[interestLeads.size,viewingLeads.size,reservationLeads.size,negotiationLeads.size,wonLeads.size];
  const funnelLabels=['interest','viewing','reservation','negotiation','won'] as const;
  const funnel={stages:funnelLabels.map((stage,index)=>{const count=funnelCounts[index]??0;const previous=index>0?(funnelCounts[index-1]??0):0;return{stage,count,conversion_from_previous:index===0?1:(previous?Math.min(1,count/previous):0),drop_off_from_previous:index===0?0:(previous?Math.max(0,1-count/previous):0)};}),overall_conversion:interestLeads.size?wonLeads.size/interestLeads.size:0};
  const inventory=await Promise.all((assets??[]).map(async asset=>{
    const [{data:availability,error:availabilityError},{data:listingLinks,error:listingError},{data:dealLinks,error:dealError}]=await Promise.all([
      supabase.rpc('get_asset_commercial_availability',{p_tenant_id:caller.tenantId,p_asset_id:asset.id}).maybeSingle(),
      supabase.from('listing_assets').select('listing_id,listings(id,listing_type,asking_price,publication_status,commercial_status)').eq('tenant_id',caller.tenantId).eq('asset_id',asset.id),
      supabase.from('deal_assets').select('deal_id,deals(id,status,deal_type,value,closed_at,created_at)').eq('tenant_id',caller.tenantId).eq('asset_id',asset.id),
    ]);
    if(availabilityError)throw new Error(availabilityError.message);
    if(listingError)throw new Error(listingError.message);
    if(dealError)throw new Error(dealError.message);
    const saleListings=(listingLinks??[]).flatMap(x=>Array.isArray(x.listings)?x.listings:(x.listings?[x.listings]:[])).filter(x=>x.listing_type==='sale');
    const deals=(dealLinks??[]).flatMap(x=>Array.isArray(x.deals)?x.deals:(x.deals?[x.deals]:[]));
    const wonSale=deals.find(x=>x.status==='won'&&x.deal_type==='sale')??null;
    const activeSaleDeal=deals.find(x=>(x.status==='open'||x.status==='negotiation')&&x.deal_type==='sale')??null;
    return {...asset,availability,sale_listings:saleListings,won_sale:wonSale,active_sale_deal:activeSaleDeal};
  }));
  const summary=inventory.reduce((acc,item)=>{
    acc.total+=1;
    const availabilityStatus=String((item.availability as {status?:string}|null)?.status??'available');
    const status=item.won_sale?'sold':item.active_sale_deal?'negotiation':availabilityStatus;
    if(status==='sold')acc.sold+=1;
    else if(status==='reserved')acc.reserved+=1;
    else if(status==='negotiation')acc.negotiation+=1;
    else if(status==='available')acc.available+=1;
    const listing=item.sale_listings[0];
    if(listing?.asking_price!=null)acc.asking_value+=Number(listing.asking_price);
    if(item.won_sale?.value!=null)acc.sold_value+=Number(item.won_sale.value);
    return acc;
  },{total:0,available:0,reserved:0,negotiation:0,sold:0,asking_value:0,sold_value:0});
  const wonSales=inventory.filter(item=>item.won_sale);
  const closeDurations=wonSales.map(item=>{const deal=item.won_sale;if(!deal?.closed_at||!deal.created_at)return null;return Math.max(0,(new Date(deal.closed_at).getTime()-new Date(deal.created_at).getTime())/86400000);}).filter((value):value is number=>value!=null);
  const soldAskingValue=wonSales.reduce((sum,item)=>sum+(item.sale_listings[0]?.asking_price!=null?Number(item.sale_listings[0].asking_price):0),0);
  const analytics={
    revenue:summary.sold_value,
    average_sale_price:wonSales.length?summary.sold_value/wonSales.length:0,
    average_days_to_close:closeDurations.length?closeDurations.reduce((sum,value)=>sum+value,0)/closeDurations.length:0,
    sell_through_rate:summary.total?summary.sold/summary.total:0,
    negotiation_rate:summary.total?summary.negotiation/summary.total:0,
    asking_to_sale_ratio:soldAskingValue?summary.sold_value/soldAskingValue:0,
  };
  return okResponse({project,summary,analytics,funnel,inventory});
});
