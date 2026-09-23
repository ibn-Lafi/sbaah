import type { NextRequest } from 'next/server';
import { dealInputSchema } from '@sbaah/shared';
import { ApiError,okResponse,withErrorHandling, databaseWriteError } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';

export const GET=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.read');
 let query=supabase.from('deals').select('*,deal_assets(asset_id)').eq('tenant_id',c.tenantId);if(isAssignedScope(grant))query=query.eq('responsible_user_id',c.userId);
 const{data,error}=await query.order('created_at',{ascending:false});
 if(error)throw new Error(error.message);return okResponse({deals:data??[]});
});
export const POST=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.create');
 const i=dealInputSchema.parse(await r.json());if(isAssignedScope(grant)){await assertAssignedLeadAccess(supabase,c.tenantId,c.userId,i.lead_id);if(i.responsible_user_id&&i.responsible_user_id!==c.userId)throw new ApiError(403,'forbidden_scope','لا يمكنك إنشاء صفقة لمستخدم آخر');}
 if(i.listing_id){const{data:listing,error:listingError}=await supabase.from('listings').select('id,listing_type,archived_at,commercial_status').eq('id',i.listing_id).eq('tenant_id',c.tenantId).maybeSingle();if(listingError)throw new Error(`Failed to validate deal listing: ${listingError.message}`);if(!listing||listing.archived_at||listing.commercial_status==='closed')throw new ApiError(400,'invalid_deal_listing','العرض العقاري غير متاح للصفقة');if(listing.listing_type!==i.deal_type)throw new ApiError(400,'deal_listing_type_mismatch','نوع الصفقة لا يطابق نوع العرض العقاري');const{data:links,error:linksError}=await supabase.from('listing_assets').select('asset_id').eq('tenant_id',c.tenantId).eq('listing_id',i.listing_id).in('asset_id',i.asset_ids);if(linksError)throw new Error(`Failed to validate deal listing assets: ${linksError.message}`);if((links??[]).length!==new Set(i.asset_ids).size)throw new ApiError(400,'listing_asset_mismatch','أحد العقارات المحددة غير مرتبط بهذا العرض العقاري');}
 if(i.reservation_id){const{data:reservation,error:reservationError}=await supabase.from('reservations').select('id,lead_id,listing_id,status').eq('id',i.reservation_id).eq('tenant_id',c.tenantId).maybeSingle();if(reservationError)throw new Error(`Failed to validate deal reservation: ${reservationError.message}`);if(!reservation||!['pending','active'].includes(reservation.status))throw new ApiError(400,'invalid_deal_reservation','الحجز غير متاح للتحويل إلى صفقة');if(reservation.lead_id&&reservation.lead_id!==i.lead_id)throw new ApiError(400,'reservation_lead_mismatch','الحجز مرتبط بعميل مختلف');if(i.listing_id&&reservation.listing_id&&reservation.listing_id!==i.listing_id)throw new ApiError(400,'reservation_listing_mismatch','الحجز مرتبط بعرض عقاري مختلف');const{data:reservationAssets,error:reservationAssetsError}=await supabase.from('reservation_assets').select('asset_id').eq('tenant_id',c.tenantId).eq('reservation_id',i.reservation_id).in('asset_id',i.asset_ids);if(reservationAssetsError)throw new Error(`Failed to validate deal reservation assets: ${reservationAssetsError.message}`);if((reservationAssets??[]).length!==new Set(i.asset_ids).size)throw new ApiError(400,'reservation_asset_mismatch','عقارات الصفقة لا تطابق عقارات الحجز');}
 const{asset_ids,...rawDeal}=i;const deal=isAssignedScope(grant)?{...rawDeal,responsible_user_id:c.userId}:rawDeal;
 const{data,error}=await supabase.rpc('create_deal_with_assets',{p_deal:deal,p_asset_ids:asset_ids}).single();
 if(error)throw databaseWriteError(error,'Failed to create deal');
 const createdDeal = data as Record<string, unknown> | null;
 if(!createdDeal)throw new Error('Deal RPC returned no row');
 return okResponse({deal:{...createdDeal,asset_ids}},201);
});