import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError,okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess,isAssignedScope } from '@/lib/auth/crm-scope';

const schema=z.object({
 lead_id:z.string().uuid(),asset_ids:z.array(z.string().uuid()).min(1),listing_id:z.string().uuid().nullable().optional(),
 expires_at:z.string().datetime().nullable().optional(),deposit_amount:z.number().nonnegative().nullable().optional(),notes:z.string().max(2000).nullable().optional(),
});

export const POST=withErrorHandling(async(r:NextRequest)=>{
 const {supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.create');const i=schema.parse(await r.json());
 if(isAssignedScope(grant))await assertAssignedLeadAccess(supabase,c.tenantId,c.userId,i.lead_id);
 const number=`RSV-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
 const {asset_ids,...rest}=i;
 const {data,error}=await supabase.rpc('create_reservation_with_assets',{p_reservation:{...rest,reservation_number:number,status:'active',reserved_at:new Date().toISOString()},p_asset_ids:asset_ids}).single();
 if(error)throw new Error(error.message);if(!data)throw new ApiError(500,'reservation_create_failed','تعذر إنشاء الحجز');
 return okResponse({reservation:{...(data as Record<string,unknown>),asset_ids}},201);
});
