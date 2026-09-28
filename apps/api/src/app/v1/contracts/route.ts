import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, databaseWriteError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const source=z.enum(['ejar','rega','moj','bank','external','other']);
const status=z.enum(['active','expired','cancelled','terminated','renewed','archived','unknown']);
const party=z.object({party_id:z.string().uuid().nullable().optional(),role:z.string().trim().min(1).max(80),display_name:z.string().trim().min(1).max(200),identifier_type:z.string().trim().max(40).nullable().optional(),identifier_number:z.string().trim().max(100).nullable().optional(),representative_name:z.string().trim().max(200).nullable().optional(),representative_capacity:z.string().trim().max(120).nullable().optional(),email:z.string().email().nullable().optional(),phone:z.string().trim().max(40).nullable().optional()});
const link=z.object({link_type:z.enum(['project','asset','lead','deal','listing','party']),entity_id:z.string().uuid(),relation_type:z.string().trim().max(80).nullable().optional()});
const inputSchema=z.object({title:z.string().trim().min(1).max(240),contract_type:z.string().trim().min(1).max(120),contract_category:z.string().trim().min(1).max(80),contract_number:z.string().trim().max(120).nullable().optional(),source:source.default('external'),source_name:z.string().trim().max(120).nullable().optional(),official_reference_number:z.string().trim().max(160).nullable().optional(),official_url:z.string().url().nullable().optional(),status:status.default('unknown'),total_value:z.coerce.number().nonnegative().nullable().optional(),currency:z.string().trim().length(3).default('SAR'),start_date:z.string().date().nullable().optional(),end_date:z.string().date().nullable().optional(),auto_renew:z.boolean().default(false),renewal_period_months:z.coerce.number().int().positive().nullable().optional(),notes:z.string().trim().max(5000).nullable().optional(),parent_contract_id:z.string().uuid().nullable().optional(),parties:z.array(party).max(20).default([]),links:z.array(link).max(50).default([])}).superRefine((v,c)=>{if(v.start_date&&v.end_date&&v.end_date<v.start_date)c.addIssue({code:'custom',path:['end_date'],message:'تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية'});});

export const GET=withErrorHandling(async(request:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(request);const caller=await getCallerContext(supabase);
 const q=z.object({status:status.optional(),category:z.string().trim().optional(),search:z.string().trim().max(100).optional(),page:z.coerce.number().int().positive().default(1),page_size:z.coerce.number().int().positive().max(100).default(30)}).parse(Object.fromEntries(request.nextUrl.searchParams));
 let query=supabase.from('contracts').select('*,contract_parties(id,party_id,role,display_name),contract_links(id,link_type,project_id,asset_id,lead_id,deal_id,listing_id,party_id,relation_type),contract_documents(id,document_type,file_name,storage_path,is_primary,created_at)',{count:'exact'}).eq('tenant_id',caller.tenantId);
 if(q.status)query=query.eq('status',q.status);if(q.category)query=query.eq('contract_category',q.category);if(q.search)query=query.or(`title.ilike.%${q.search}%,contract_number.ilike.%${q.search}%,official_reference_number.ilike.%${q.search}%`);
 const from=(q.page-1)*q.page_size;const{data,error,count}=await query.order('created_at',{ascending:false}).range(from,from+q.page_size-1);
 if(error)throw new Error(`Failed to list contracts: ${error.message}`);
 return okResponse({contracts:data??[],page:q.page,page_size:q.page_size,total:count??0});
});

export const POST=withErrorHandling(async(request:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(request);const caller=await getCallerContext(supabase);
 if(caller.role==='agent')throw new ApiError(403,'forbidden','لا تملك صلاحية إضافة العقود');
 const input=inputSchema.parse(await request.json());const{parties,links,...contract}=input;
 const{data:created,error}=await supabase.from('contracts').insert({...contract,tenant_id:caller.tenantId,created_by:caller.userId}).select('*').single();
 if(error)throw databaseWriteError(error,'Failed to create contract');if(!created)throw new ApiError(500,'contract_create_failed','تعذر حفظ العقد');
 if(parties.length){const{error:e}=await supabase.from('contract_parties').insert(parties.map(p=>({...p,tenant_id:caller.tenantId,contract_id:created.id})));if(e){await supabase.from('contracts').delete().eq('id',created.id);throw databaseWriteError(e,'Failed to add contract parties');}}
 if(links.length){const rows=links.map(l=>({tenant_id:caller.tenantId,contract_id:created.id,link_type:l.link_type,relation_type:l.relation_type??null,project_id:l.link_type==='project'?l.entity_id:null,asset_id:l.link_type==='asset'?l.entity_id:null,lead_id:l.link_type==='lead'?l.entity_id:null,deal_id:l.link_type==='deal'?l.entity_id:null,listing_id:l.link_type==='listing'?l.entity_id:null,party_id:l.link_type==='party'?l.entity_id:null}));const{error:e}=await supabase.from('contract_links').insert(rows);if(e){await supabase.from('contracts').delete().eq('id',created.id);throw databaseWriteError(e,'Failed to link contract');}}
 return okResponse({contract:created},201);
});