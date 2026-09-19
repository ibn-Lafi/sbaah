import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';
import { MAX_WEBSITE_ASSET_SIZE_MB } from '@sbaah/shared';
import { safeExtensionFromMime } from '@/lib/storage/safe-extension';
const BUCKET='website-assets', BYTES=1024*1024;
export const POST=withErrorHandling(async(request:NextRequest,{params}:{params:Promise<{id:string}>})=>{
 const {id}=await params; const {supabase}=getAuthenticatedClient(request); const caller=await getCallerContext(supabase); assertNotAgent(caller.role);
 const {data:section}=await supabase.from('website_sections').select('id,website_id').eq('id',id).maybeSingle();
 if(!section) throw new ApiError(404,'section_not_found','القسم غير موجود');
 const form=await request.formData(); const file=form.get('file'); if(!(file instanceof File)) throw new ApiError(400,'file_required','الملف مطلوب');
 if(!file.type.startsWith('image/')) throw new ApiError(400,'unsupported_file_type','صورة فقط مسموحة');
 if(file.size>MAX_WEBSITE_ASSET_SIZE_MB*BYTES) throw new ApiError(422,'file_too_large',`الحد الأقصى لحجم الصورة ${MAX_WEBSITE_ASSET_SIZE_MB} ميجابايت`);
 const ext=safeExtensionFromMime(file.type); const path=`${caller.tenantId}/sections/${id}/${crypto.randomUUID()}.${ext}`;
 const {error}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type}); if(error) throw new Error(`Failed to upload section asset: ${error.message}`);
 const {data:url}=supabase.storage.from(BUCKET).getPublicUrl(path); return okResponse({url:url.publicUrl});
});