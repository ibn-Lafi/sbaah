import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const schema=z.object({domain:z.string().min(1),listing_type:z.enum(['sale','rent']).optional(),property_type:z.string().optional(),city_id:z.string().uuid().optional(),district_id:z.string().uuid().optional(),min_price:z.coerce.number().nonnegative().optional(),max_price:z.coerce.number().nonnegative().optional(),bedrooms:z.coerce.number().int().nonnegative().optional(),page:z.coerce.number().int().positive().default(1),page_size:z.coerce.number().int().positive().max(50).default(20)});

export const GET=withErrorHandling(async(request:NextRequest)=>{
 const q=schema.parse(Object.fromEntries(request.nextUrl.searchParams));const supabase=createAnonClient();const tenantId=await resolvePublicTenantId(q.domain,supabase);const offset=(q.page-1)*q.page_size;
 const{data,error}=await supabase.rpc('public_listing_feed',{p_tenant_id:tenantId,p_listing_type:q.listing_type??null,p_asset_type:q.property_type??null,p_city_id:q.city_id??null,p_district_id:q.district_id??null,p_min_price:q.min_price??null,p_max_price:q.max_price??null,p_bedrooms:q.bedrooms??null,p_limit:q.page_size,p_offset:offset});
 if(error)throw new Error(`Failed to load public listings: ${error.message}`);
 const rows=data??[];return okResponse({listings:rows,page:q.page,page_size:q.page_size,total:Number(rows[0]?.total_count??0)});
});
