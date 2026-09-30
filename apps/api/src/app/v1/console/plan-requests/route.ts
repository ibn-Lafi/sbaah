import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

const updateSchema=z.object({status:z.enum(['new','contacted','negotiating','accepted','closed'])});

export const GET=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=await getPlatformAdminClient(request);
 const {data,error}=await supabase.from('plan_requests').select('*, plans(name_ar,name_en,billing_cycle)').order('created_at',{ascending:false});
 if(error) throw new Error(`Failed to list plan requests: ${error.message}`);
 return okResponse({requests:data??[]});
});

export const PATCH=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=await getPlatformAdminClient(request);
 const body=await request.json();
 const id=z.string().uuid().parse(body.id);
 const {status}=updateSchema.parse(body);
 const {data,error}=await supabase.from('plan_requests').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*, plans(name_ar,name_en,billing_cycle)').single();
 if(error) throw new Error(`Failed to update plan request: ${error.message}`);
 return okResponse({request:data});
});
