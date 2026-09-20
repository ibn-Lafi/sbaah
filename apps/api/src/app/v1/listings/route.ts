import type { NextRequest } from 'next/server';
import { listingInputSchema, LISTING_COMMERCIAL_STATUSES, LISTING_PUBLICATION_STATUSES, LISTING_TYPES } from '@sbaah/shared';
import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const querySchema=z.object({
  listing_type:z.enum(LISTING_TYPES).optional(),
  publication_status:z.enum(LISTING_PUBLICATION_STATUSES).optional(),
  commercial_status:z.enum(LISTING_COMMERCIAL_STATUSES).optional(),
  page:z.coerce.number().int().positive().default(1),
  page_size:z.coerce.number().int().positive().max(50).default(20),
});

export const GET=withErrorHandling(async(request:NextRequest)=>{
  const {supabase}=getAuthenticatedClient(request);
  const caller=await getCallerContext(supabase);
  const {page,page_size,...filters}=querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  let query=supabase.from('listings').select('*, listing_assets(asset_id)',{count:'exact'}).eq('tenant_id',caller.tenantId);
  for(const [key,value] of Object.entries(filters)) if(value!=null) query=query.eq(key,value);
  const from=(page-1)*page_size;
  const {data,error,count}=await query.order('created_at',{ascending:false}).range(from,from+page_size-1);
  if(error) throw new Error(`Failed to list listings: ${error.message}`);
  return okResponse({listings:data,page,page_size,total:count??0});
});

export const POST=withErrorHandling(async(request:NextRequest)=>{
  const {supabase}=getAuthenticatedClient(request);
  const caller=await getCallerContext(supabase);
  if(caller.role==='agent') throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية إنشاء عروض عقارية');
  const input=listingInputSchema.parse(await request.json());
  const {asset_ids,...payload}=input;
  const {data,error}=await supabase.rpc('create_listing_with_assets',{p_listing:payload,p_asset_ids:asset_ids}).single();
  if(error) throw new Error(`Failed to create listing: ${error.message}`);
  return okResponse({listing:data},201);
});
