import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';

const createSchema=z.object({requester_name:z.string().trim().min(2).max(120),requester_email:z.string().email().max(200),requester_phone:z.string().trim().max(30).optional(),type:z.enum(['complaint','suggestion','support']),category:z.enum(['billing','technical','account','website','domain','other']),subject:z.string().trim().min(3).max(160),description:z.string().trim().min(10).max(5000)});
const trackSchema=z.object({ticket_number:z.string().trim().min(6).max(40),requester_email:z.string().email()});
const number=()=>`SBA-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;

export const POST=withErrorHandling(async(request:NextRequest)=>{const input=createSchema.parse(await request.json());const supabase=createServiceRoleClient();const {data,error}=await supabase.from('support_tickets').insert({...input,ticket_number:number(),requester_phone:input.requester_phone||null}).select('id,ticket_number,status,created_at').single();if(error)throw new Error(error.message);return okResponse({ticket:data},201)});
export const GET=withErrorHandling(async(request:NextRequest)=>{const input=trackSchema.parse(Object.fromEntries(request.nextUrl.searchParams));const supabase=createServiceRoleClient();const {data,error}=await supabase.from('support_tickets').select('id,ticket_number,type,category,subject,status,priority,created_at,updated_at,support_ticket_messages(sender_type,message,created_at)').eq('ticket_number',input.ticket_number).ilike('requester_email',input.requester_email).maybeSingle();if(error)throw new Error(error.message);if(!data)throw new ApiError(404,'ticket_not_found','لم نعثر على تذكرة مطابقة لرقم التذكرة والبريد الإلكتروني');return okResponse({ticket:data})});
