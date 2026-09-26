import { assetUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext { params: Promise<{ id: string }>; }

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { data, error } = await supabase.from('assets').select('*, asset_media(*)').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();
  if (error) throw new Error(`Failed to load asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  const [parentResult, childrenResult, availabilityResult, projectResult, phaseResult, unitTypeResult] = await Promise.all([
    data.parent_asset_id
      ? supabase.from('assets').select('*').eq('id', data.parent_asset_id).eq('tenant_id', caller.tenantId).is('archived_at', null).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('assets').select('*').eq('parent_asset_id', id).eq('tenant_id', caller.tenantId).is('archived_at', null).order('created_at'),
    supabase.rpc('get_asset_commercial_availability', { p_tenant_id: caller.tenantId, p_asset_id: id }).maybeSingle(),
    data.project_id ? supabase.from('projects').select('id,name_ar,city_id,district_id,lat,lng').eq('id',data.project_id).eq('tenant_id',caller.tenantId).maybeSingle() : Promise.resolve({data:null,error:null}),
    data.phase_id ? supabase.from('project_phases').select('id,name_ar').eq('id',data.phase_id).eq('tenant_id',caller.tenantId).maybeSingle() : Promise.resolve({data:null,error:null}),
    data.unit_type_id ? supabase.from('unit_types').select('id,name_ar').eq('id',data.unit_type_id).eq('tenant_id',caller.tenantId).maybeSingle() : Promise.resolve({data:null,error:null}),
  ]);
  if (parentResult.error) throw new Error(`Failed to load parent asset: ${parentResult.error.message}`);
  if (childrenResult.error) throw new Error(`Failed to load child assets: ${childrenResult.error.message}`);
  if (availabilityResult.error) throw new Error(`Failed to load asset availability: ${availabilityResult.error.message}`);
  if (projectResult.error) throw new Error(`Failed to load asset project: ${projectResult.error.message}`);
  if (phaseResult.error) throw new Error(`Failed to load asset phase: ${phaseResult.error.message}`);
  if (unitTypeResult.error) throw new Error(`Failed to load asset unit type: ${unitTypeResult.error.message}`);
  const childIds=(childrenResult.data??[]).map((child)=>child.id);
  let childOffers: Array<Record<string, unknown>>=[];
  if(childIds.length){
    const {data:rows,error:childOffersError}=await supabase.from('listing_assets')
      .select('asset_id,listings(id,listing_number,listing_type,asking_price,pricing_period,publication_status,commercial_status,created_at)')
      .eq('tenant_id',caller.tenantId).in('asset_id',childIds);
    if(childOffersError)throw new Error(`Failed to load child offers: ${childOffersError.message}`);
    childOffers=(rows??[]) as Array<Record<string, unknown>>;
  }
  const offersByAsset=new Map<string,unknown>();
  for(const row of childOffers){
    const assetId=String(row.asset_id);
    const listing=Array.isArray(row.listings)?row.listings[0]:row.listings;
    if(!listing)continue;
    const current=offersByAsset.get(assetId) as {publication_status?:string;created_at?:string}|undefined;
    const candidate=listing as {publication_status?:string;created_at?:string};
    const candidatePriority=candidate.publication_status==='published'?1:0;
    const currentPriority=current?.publication_status==='published'?1:0;
    if(!current||candidatePriority>currentPriority||(candidatePriority===currentPriority&&String(candidate.created_at??'')>String(current.created_at??'')))offersByAsset.set(assetId,candidate);
  }
  const children=(childrenResult.data??[]).map(child=>({...child,current_offer:offersByAsset.get(child.id)??null}));
  const parent=parentResult.data;
  const project=projectResult.data;
  const effective_location={city_id:data.city_id??parent?.city_id??project?.city_id??null,district_id:data.district_id??parent?.district_id??project?.district_id??null,lat:data.lat??parent?.lat??project?.lat??null,lng:data.lng??parent?.lng??project?.lng??null,source:data.city_id||data.district_id||data.lat!=null||data.lng!=null?'asset':parent&&(parent.city_id||parent.district_id||parent.lat!=null||parent.lng!=null)?'parent':project?'project':null};
  return okResponse({ asset: data, parent, children, availability: availabilityResult.data, project, phase:phaseResult.data, unit_type:unitTypeResult.data, effective_location });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية تعديل العقارات');
  const input = assetUpdateSchema.parse(await request.json());
  const { data: current, error: currentError } = await supabase.from('assets').select('asset_type,project_id,phase_id,unit_type_id,parent_asset_id').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();
  if (currentError) throw new Error(`Failed to load asset before update: ${currentError.message}`);
  if (!current) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  const next={...current,...input};
  if (next.parent_asset_id) {
    if (next.parent_asset_id===id) throw new ApiError(400,'invalid_parent_asset','لا يمكن أن يكون العقار تابعًا لنفسه');
    const { data: parent, error: parentError } = await supabase.from('assets').select('id,project_id,parent_asset_id').eq('id', next.parent_asset_id).eq('tenant_id', caller.tenantId).is('archived_at', null).maybeSingle();
    if (parentError) throw new Error(`Failed to validate parent asset: ${parentError.message}`);
    if (!parent) throw new ApiError(400, 'invalid_parent_asset', 'العقار الرئيسي غير موجود أو مؤرشف');
    if (parent.parent_asset_id) throw new ApiError(400, 'unit_cannot_have_children', 'لا يمكن جعل الوحدة تابعة لوحدة أخرى');
    if (next.project_id && parent.project_id && next.project_id !== parent.project_id) throw new ApiError(400,'parent_project_mismatch','العقار الرئيسي مرتبط بمشروع مختلف');
  }
  if (next.project_id) {
    const {data:project,error:projectError}=await supabase.from('projects').select('id,status').eq('id',next.project_id).eq('tenant_id',caller.tenantId).maybeSingle();
    if(projectError)throw new Error(`Failed to validate project: ${projectError.message}`);
    if(!project||project.status==='archived')throw new ApiError(400,'invalid_project','المشروع غير موجود أو مؤرشف');
  }
  if(next.phase_id){if(!next.project_id)throw new ApiError(400,'phase_requires_project','لا يمكن ربط مرحلة بدون مشروع');const{data:phase,error:phaseError}=await supabase.from('project_phases').select('id,project_id').eq('id',next.phase_id).eq('tenant_id',caller.tenantId).maybeSingle();if(phaseError)throw new Error(`Failed to validate project phase: ${phaseError.message}`);if(!phase||phase.project_id!==next.project_id)throw new ApiError(400,'phase_project_mismatch','المرحلة لا تتبع المشروع المحدد');}
  if(next.unit_type_id){const{data:unitType,error:unitTypeError}=await supabase.from('unit_types').select('id,project_id,asset_type').eq('id',next.unit_type_id).eq('tenant_id',caller.tenantId).maybeSingle();if(unitTypeError)throw new Error(`Failed to validate unit type: ${unitTypeError.message}`);if(!unitType)throw new ApiError(400,'invalid_unit_type','نوع الوحدة غير موجود');if(unitType.project_id&&unitType.project_id!==next.project_id)throw new ApiError(400,'unit_type_project_mismatch','نوع الوحدة لا يتبع المشروع المحدد');if(unitType.asset_type&&unitType.asset_type!==next.asset_type)throw new ApiError(400,'unit_type_asset_mismatch','نوع العقار لا يطابق نوع الوحدة المحدد');}
  const updatePayload = { ...input };
  if (next.parent_asset_id || next.project_id) Object.assign(updatePayload, { city_id: null, district_id: null, lat: null, lng: null });
  if (next.parent_asset_id) Object.assign(updatePayload, { street_width: null });
  const { data, error } = await supabase.from('assets').update(updatePayload).eq('id', id).eq('tenant_id', caller.tenantId).select().maybeSingle();
  if (error) throw new Error(`Failed to update asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ asset: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية أرشفة العقارات');
  const { count: childrenCount, error: childrenError } = await supabase.from('assets').select('id', { count: 'exact', head: true }).eq('parent_asset_id', id).eq('tenant_id', caller.tenantId).is('archived_at', null);
  if (childrenError) throw new Error(`Failed to validate child assets: ${childrenError.message}`);
  if ((childrenCount ?? 0) > 0) throw new ApiError(409, 'asset_has_children', 'انقل أو أرشف العقارات التابعة أولًا');
  const { data, error } = await supabase.from('assets').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', caller.tenantId).select('id').maybeSingle();
  if (error) throw new Error(`Failed to archive asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ status: 'archived' });
});
