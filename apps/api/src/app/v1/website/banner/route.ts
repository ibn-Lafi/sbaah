import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';
import { uploadWebsiteAsset } from '@/lib/website/upload-asset';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new ApiError(400, 'file_required', 'الملف مطلوب');
  }

  const website = await uploadWebsiteAsset(supabase, caller.tenantId, file, 'banner', 'banner_image_url');
  return okResponse({ website });
});
