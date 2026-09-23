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

  // RLS remains the final database boundary, but resolve the caller's website
  // explicitly so this bulk mutation does not rely on an implicit join policy
  // for object-level authorization.
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id')
    .eq('tenant_id', caller.tenantId)
    .maybeSingle();
  if (websiteError) throw new Error(`Failed to resolve tenant website: ${websiteError.message}`);
  if (!website) throw new ApiError(404, 'website_not_found', 'الموقع غير موجود');

  const { data: pages, error: pagesError } = await supabase
    .from('website_pages')
    .select('id')
    .eq('website_id', website.id);
  if (pagesError) throw new Error(`Failed to resolve tenant website pages: ${pagesError.message}`);
  const pageIds = (pages ?? []).map((page) => page.id);
  if (pageIds.length === 0 && sections.length > 0) throw new ApiError(404, 'section_not_found', 'القسم غير موجود');

  // Validate the complete batch before mutating anything. Without this
  // preflight, Promise.all could update valid rows and only afterwards
  // discover one foreign/missing id, returning 404 after a partial reorder.
  const sectionIds = sections.map(({ id }) => id);
  const { data: ownedSections, error: ownedSectionsError } = await supabase
    .from('website_sections')
    .select('id')
    .in('id', sectionIds)
    .in('page_id', pageIds);
  if (ownedSectionsError) throw new Error(`Failed to validate website sections: ${ownedSectionsError.message}`);
  const ownedIds = new Set((ownedSections ?? []).map(({ id }) => id));
  const missingSection = sections.find(({ id }) => !ownedIds.has(id));
  if (missingSection) throw new ApiError(404, 'section_not_found', `القسم بالمعرّف ${missingSection.id} غير موجود`);

  const results = await Promise.all(
    sections.map(({ id, order_index }) =>
      supabase.from('website_sections').update({ order_index }).eq('id', id).in('page_id', pageIds).select().maybeSingle(),
    ),
  );

  const failedIndex = results.findIndex((r) => r.error || !r.data);
  if (failedIndex !== -1) {
    throw new ApiError(404, 'section_not_found', `القسم بالمعرّف ${sections[failedIndex]?.id} غير موجود`);
  }

  return okResponse({ sections: results.map((r) => r.data) });
});
