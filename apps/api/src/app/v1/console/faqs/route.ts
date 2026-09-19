import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

const faqInput = z.object({
  question_ar:z.string().trim().min(2), answer_ar:z.string().trim().min(2),
  question_en:z.string().trim().min(2), answer_en:z.string().trim().min(2),
  order_index:z.number().int().nonnegative().default(0), is_active:z.boolean().default(true),
});

export const GET=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=await getPlatformAdminClient(request);
 const {data,error}=await supabase.from('platform_faq_items').select('*').order('order_index',{ascending:true});
 if(error) throw new Error(`Failed to list FAQs: ${error.message}`);
 return okResponse(data??[]);
});

export const POST=withErrorHandling(async(request:NextRequest)=>{
 const {supabase}=await getPlatformAdminClient(request); const input=faqInput.parse(await request.json());
 const {data,error}=await supabase.from('platform_faq_items').insert(input).select().single();
 if(error||!data) throw new Error(`Failed to create FAQ: ${error?.message}`);
 return okResponse(data,201);
});
