import type { NextRequest } from 'next/server';
import { reservationInputSchema, RESERVATION_STATUSES } from '@sbaah/shared';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
const querySchema=z.object({status:z.enum(RESERVATION_STATUSES).optional(),page:z.coerce.number().int().positive().default(1),page_size:z.coerce.number().int().positive().max(50).default(20)});
export const GET=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase); assertPermission(caller.role,'crm.read'); const {status,page,page_size}=querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
 let query=supabase.from('reservations').select('*, reservation_assets(asset_id)',{count:'exact'}); if(status) query=query.eq('status',status);
 const from=(page-1)*page_size; const {data,error,count}=await query.order('created_at',{ascending:false}).range(from,from+page_size-1);
 if(error) throw new Error(`Failed to list reservations: ${error.message}`); return okResponse({reservations:data,page,page_size,total:count??0});
});
export const POST=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase); assertPermission(caller.role,'crm.create'); const input=reservationInputSchema.parse(await request.json()); const {asset_ids,...payload}=input;
 const {data,error}=await supabase.rpc('create_reservation_with_assets',{p_reservation:payload,p_asset_ids:asset_ids}).single();
 if(error) throw new Error(`Failed to create reservation: ${error.message}`); return okResponse({reservation:data},201);
});
