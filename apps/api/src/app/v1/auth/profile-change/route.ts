import type { NextRequest } from 'next/server';
import { createServiceRoleClient, verifyProfileChangeSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { verifyOtpSms } from '@/lib/authentica/client';
import { verifyEmailOtpCode } from '@/lib/otp/hash-email-code';
import { isExpired,isLocked,computeLockedUntil,shouldLockAfterFailedAttempt } from '@/lib/otp/otp-policy';

export const POST=withErrorHandling(async(request:NextRequest)=>{
 const {supabase:userClient}=getAuthenticatedClient(request);const caller=await getCallerContext(userClient);const input=verifyProfileChangeSchema.parse(await request.json());
 const service=createServiceRoleClient();const purpose=input.channel==='sms'?'change_phone':'change_email';const target=input.channel==='sms'?input.phone:input.email;
 let q=service.from('otp_verifications').select('id,attempt_count,locked_until,expires_at,code_hash').eq('purpose',purpose).eq('channel',input.channel).is('consumed_at',null).order('created_at',{ascending:false}).limit(1);
 q=input.channel==='sms'?q.eq('phone',target):q.eq('email',target);const {data:row,error}=await q.maybeSingle();if(error)throw new Error(error.message);if(!row)throw new ApiError(400,'otp_not_found','لا يوجد رمز تحقق فعّال');
 if(isLocked(row.locked_until))throw new ApiError(429,'otp_locked','محاولات كثيرة خاطئة، حاول لاحقًا');if(isExpired(row.expires_at))throw new ApiError(400,'otp_expired','انتهت صلاحية الرمز، اطلب رمزًا جديدًا');
 const verified=input.channel==='sms'?await verifyOtpSms(input.phone,input.code):verifyEmailOtpCode(input.code,row.code_hash as string);
 if(!verified){const lock=shouldLockAfterFailedAttempt(row.attempt_count);await service.from('otp_verifications').update({attempt_count:row.attempt_count+1,locked_until:lock?computeLockedUntil():null}).eq('id',row.id);throw new ApiError(401,'otp_incorrect','رمز التحقق غير صحيح')}
 if(input.channel==='sms'){const {data:exists}=await service.from('users').select('id').eq('phone',input.phone).neq('id',caller.userId).maybeSingle();if(exists)throw new ApiError(409,'phone_already_registered','رقم الجوال مستخدم لحساب آخر');const {error:updateError}=await service.from('users').update({phone:input.phone}).eq('id',caller.userId);if(updateError)throw new Error(updateError.message)}
 else{const {data:exists}=await service.from('users').select('id').eq('email',input.email).neq('id',caller.userId).maybeSingle();if(exists)throw new ApiError(409,'email_already_used','البريد الإلكتروني مستخدم لحساب آخر');const {error:updateError}=await service.from('users').update({email:input.email}).eq('id',caller.userId);if(updateError)throw new Error(updateError.message)}
 await service.from('otp_verifications').update({consumed_at:new Date().toISOString()}).eq('id',row.id);return okResponse({status:'updated'});
});
