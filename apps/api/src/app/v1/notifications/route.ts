import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const GET=withErrorHandling(async(r:NextRequest)=>{
 const {supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);
 const {data,error}=await supabase.from('notifications').select('id,category,level,title,body,href,read_at,created_at').eq('tenant_id',c.tenantId).eq('recipient_user_id',c.userId).order('created_at',{ascending:false}).limit(100);
 if(error)throw new Error(error.message);
 return okResponse({notifications:data??[],unread:(data??[]).filter(n=>!n.read_at).length});
});