import type { NextRequest } from 'next/server';
import { sectionReorderSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const { sections } = sectionReorderSchema.parse(await request.json());

  const results = await Promise.all(
    sections.map(({ id, order_index }) =>
      supabase.from('website_sections').update({ order_index }).eq('id', id).select().maybeSingle(),
    ),
  );

  const failedIndex = results.findIndex((r) => r.error || !r.data);
  if (failedIndex !== -1) {
    // RLS filters out a section id that doesn't belong (via the website
    // join) to this tenant — same 404 whether it's a foreign id or a
    // genuinely made-up one, no existence leak.
    throw new ApiError(404, 'section_not_found', `القسم بالمعرّف ${sections[failedIndex]?.id} غير موجود`);
  }

  return okResponse({ sections: results.map((r) => r.data) });
});
