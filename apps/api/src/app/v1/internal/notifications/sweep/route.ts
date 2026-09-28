import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';

function authorize(request:NextRequest){
 const expected=process.env.INTERNAL_CRON_SECRET;
 if(!expected||request.headers.get('x-internal-cron-secret')!==expected)throw new ApiError(401,'unauthorized','Unauthorized');
}
export const POST=withErrorHandling(async(request:NextRequest)=>{
 authorize(request);
 const db=createServiceRoleClient();
 const now=new Date(), soon=new Date(now.getTime()+24*60*60*1000);
 const today=now.toISOString().slice(0,10), in7=new Date(now.getTime()+7*86400000).toISOString().slice(0,10);

 const {data:viewings,error:vErr}=await db.from('viewings').select('id,tenant_id,assigned_user_id,scheduled_at').gte('scheduled_at',now.toISOString()).lte('scheduled_at',soon.toISOString());
 if(vErr)throw new Error(vErr.message);
 const {data:installments,error:iErr}=await db.from('lease_installments').select('id,tenant_id,contract_id,due_date,status,amount').lte('due_date',in7).neq('status','paid');
 if(iErr)throw new Error(iErr.message);
 const {data:contracts,error:cErr}=await db.from('lease_contracts').select('id,tenant_id,contract_number,end_date,status').eq('status','active').gte('end_date',today).lte('end_date',in7);
 const {data:contractReminders,error:rErr}=await db.from('contract_reminders').select('id,tenant_id,contract_id,remind_at,kind,note,contracts(title,contract_number)').is('sent_at',null).lte('remind_at',now.toISOString());
 if(rErr)throw new Error(rErr.message);
 if(cErr)throw new Error(cErr.message);

 const rows:Array<Record<string,unknown>>=[];
 for(const v of viewings??[])rows.push({tenant_id:v.tenant_id,recipient_user_id:v.assigned_user_id,category:'calendar',level:'important',title:'معاينة قريبة',body:'لديك موعد معاينة خلال 24 ساعة.',href:'/viewings',event_key:`viewing:${v.id}:24h`});
 const tenantUsers=new Map<string,string[]>();
 async function users(tenant:string){if(tenantUsers.has(tenant))return tenantUsers.get(tenant)!;const {data}=await db.from('users').select('id').eq('tenant_id',tenant).eq('status','active');const ids=(data??[]).map(x=>x.id);tenantUsers.set(tenant,ids);return ids}
 for(const i of installments??[]){const overdue=i.due_date<today;for(const uid of await users(i.tenant_id))rows.push({tenant_id:i.tenant_id,recipient_user_id:uid,category:'rent',level:overdue?'high':'important',title:overdue?'دفعة متأخرة':'دفعة قريبة الاستحقاق',body:overdue?`يوجد استحقاق متأخر بقيمة ${i.amount}.`:`يوجد استحقاق بقيمة ${i.amount} خلال 7 أيام.`,href:`/rent-plus/contracts/${i.contract_id}`,event_key:`installment:${i.id}:${overdue?'overdue':'due-7d'}`})}
 for(const c of contracts??[]){for(const uid of await users(c.tenant_id))rows.push({tenant_id:c.tenant_id,recipient_user_id:uid,category:'rent',level:'important',title:'عقد قريب من الانتهاء',body:`عقد الإيجار ${c.contract_number||''} ينتهي خلال 7 أيام.`.trim(),href:`/rent-plus/contracts/${c.id}`,event_key:`lease:${c.id}:expires-7d`})}
 for(const r of contractReminders??[]){const contract=Array.isArray(r.contracts)?r.contracts[0]:r.contracts;for(const uid of await users(r.tenant_id))rows.push({tenant_id:r.tenant_id,recipient_user_id:uid,category:'system',level:'important',title:'تذكير بعقد',body:r.note||`حان تذكير العقد ${contract?.title||contract?.contract_number||''}`.trim(),href:`/contracts/${r.contract_id}`,event_key:`contract-reminder:${r.id}`})}
 if(rows.length){for(const row of rows){const {data:existing,error:lookupError}=await db.from('notifications').select('id').eq('recipient_user_id',row.recipient_user_id).eq('event_key',row.event_key).maybeSingle();if(lookupError)throw new Error(lookupError.message);if(existing)continue;const {error}=await db.from('notifications').insert(row);if(error&&error.code!=='23505')throw new Error(error.message)}}
 if((contractReminders??[]).length){const ids=(contractReminders??[]).map(r=>r.id);const {error:markError}=await db.from('contract_reminders').update({sent_at:now.toISOString()}).in('id',ids).is('sent_at',null);if(markError)throw new Error(markError.message)}
 const cutoff=new Date(now.getTime()-7*86400000).toISOString();
 const {error:cleanupError}=await db.from('notifications').delete().not('read_at','is',null).lt('read_at',cutoff);
 if(cleanupError)throw new Error(cleanupError.message);
 return okResponse({generated:rows.length,cleaned_before:cutoff});
});
