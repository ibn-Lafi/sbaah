import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const PATCH=withErrorHandling(async(r:NextRequest,{params}:{params:Promise<{id:string}>})=>{
 const {id}=await params;const {supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);
 const {data,error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('tenant_id',c.tenantId).eq('recipient_user_id',c.userId).select('id,read_at').maybeSingle();
 if(error)throw new Error(error.message);if(!data)throw new ApiError(404,'notification_not_found','التنبيه غير موجود');
 return okResponse({notification:data});
});