import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

const schema=z.object({
 plan_id:z.string().uuid(),
 full_name:z.string().trim().min(2).max(120),
 email:z.string().trim().email().max(254),
 phone:z.string().trim().min(5).max(40),
 details:z.string().trim().max(2000).optional().nullable(),
});

export const POST=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=getAuthenticatedClient(request);
 const caller=await getCallerContext(supabase);
 assertOwner(caller.role);
 const input=schema.parse(await request.json());
 const serviceRole=createServiceRoleClient();
 const {data:plan,error:planError}=await serviceRole.from('plans').select('id,purchase_mode,billing_cycle,is_active').eq('id',input.plan_id).maybeSingle();
 if(planError||!plan||!plan.is_active||plan.purchase_mode!=='request'||plan.billing_cycle!=='annual') throw new Error('Invalid request-only plan');
 const {data,error}=await serviceRole.from('plan_requests').insert({tenant_id:caller.tenantId,...input}).select().single();
 if(error) throw new Error(`Failed to create plan request: ${error.message}`);
 return okResponse({request:data},201);
});
