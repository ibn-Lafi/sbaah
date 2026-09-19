import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

const updateSchema=z.object({
 question_ar:z.string().trim().min(2).optional(), answer_ar:z.string().trim().min(2).optional(),
 question_en:z.string().trim().min(2).optional(), answer_en:z.string().trim().min(2).optional(),
 order_index:z.number().int().nonnegative().optional(), is_active:z.boolean().optional(),
});
export const PATCH=withErrorHandling(async(request:NextRequest,{params}:{params:Promise<{id:string}>})=>{
 const {supabase}=await getPlatformAdminClient(request); const {id}=await params; const input=updateSchema.parse(await request.json());
 const {data,error}=await supabase.from('platform_faq_items').update({...input,updated_at:new Date().toISOString()}).eq('id',id).select().single();
 if(error||!data) throw new Error(`Failed to update FAQ: ${error?.message}`); return okResponse(data);
});
export const DELETE=withErrorHandling(async(request:NextRequest,{params}:{params:Promise<{id:string}>})=>{
 const {supabase}=await getPlatformAdminClient(request); const {id}=await params;
 const {error}=await supabase.from('platform_faq_items').delete().eq('id',id);
 if(error) throw new Error(`Failed to delete FAQ: ${error.message}`); return okResponse({status:'deleted'});
});
