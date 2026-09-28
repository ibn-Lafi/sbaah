import { createServiceRoleClient } from '@sbaah/shared';

type Category='customers'|'real_estate'|'calendar'|'rent'|'system';
type Level='high'|'important'|'new'|'info';
interface NotifyInput {tenantId:string;recipientUserId:string;category:Category;level?:Level;title:string;body:string;href?:string|null;eventKey:string}

/** Trusted server-side notification write. event_key makes retries idempotent per recipient. */
export async function notifyUser(input:NotifyInput){
 const db=createServiceRoleClient();
 const {error}=await db.from('notifications').upsert({
  tenant_id:input.tenantId,recipient_user_id:input.recipientUserId,category:input.category,level:input.level??'info',
  title:input.title,body:input.body,href:input.href??null,event_key:input.eventKey,
 },{onConflict:'recipient_user_id,event_key',ignoreDuplicates:true});
 if(error)console.error('Failed to create notification',error.message);
}
export async function notifyTenant(input:Omit<NotifyInput,'recipientUserId'>){
 const db=createServiceRoleClient();
 const {data:users,error}=await db.from('users').select('id').eq('tenant_id',input.tenantId).eq('status','active');
 if(error){console.error('Failed to resolve notification recipients',error.message);return}
 await Promise.all((users??[]).map(u=>notifyUser({...input,recipientUserId:u.id})));
}
