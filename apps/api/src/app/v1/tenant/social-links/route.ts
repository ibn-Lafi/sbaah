import type { NextRequest } from 'next/server';
import { socialLinksUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

const SOCIAL_COLUMNS = 'social_instagram, social_tiktok, social_whatsapp, social_snapchat, social_phone';

/**
 * حسابي (Settings) — حسابات التواصل الاجتماعي. المالك/المسؤول يعبّئان ما
 * يريدان؛ تذييل الموقع العام (GET /v1/public/website) يعرض فقط ما تمت
 * تعبئته من هذه الحقول (سبعة عن طريق resolve_public_tenant_chrome).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data, error } = await supabase.from('tenants').select(SOCIAL_COLUMNS).eq('id', caller.tenantId).single();
  if (error || !data) {
    throw new Error(`Failed to load social links: ${error?.message}`);
  }

  return okResponse(data);
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const input = socialLinksUpdateSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('tenants')
    .update(input)
    .eq('id', caller.tenantId)
    .select(SOCIAL_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(`Failed to update social links: ${error?.message}`);
  }

  return okResponse(data);
});
