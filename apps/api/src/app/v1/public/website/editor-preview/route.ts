import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';

const querySchema = z.object({
  token: z.string().uuid(),
  page: z.enum(['home', 'properties', 'projects']),
});

type DraftSection = {
  id: string;
  page_id: string;
  is_visible: boolean;
  order_index: number;
  config: Record<string, unknown>;
};

type SectionTypeRow = {
  id: string;
  type: string;
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const input = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createServiceRoleClient();

  const { data: draft, error } = await supabase
    .from('website_editor_drafts')
    .select('website_id,website,sections')
    .eq('preview_token', input.token)
    .maybeSingle();

  if (error) throw new Error(`Failed to load preview: ${error.message}`);
  if (!draft) throw new ApiError(404, 'preview_not_found', 'Preview not found');

  const { data: page, error: pageError } = await supabase
    .from('website_pages')
    .select('id')
    .eq('website_id', draft.website_id)
    .eq('key', input.page)
    .maybeSingle();

  if (pageError) throw new Error(`Failed to resolve preview page: ${pageError.message}`);
  if (!page) throw new ApiError(404, 'preview_page_not_found', 'Preview page not found');

  const rawSections = Array.isArray(draft.sections) ? draft.sections : [];
  const draftSections = (rawSections as DraftSection[])
    .filter((section) => section.page_id === page.id && section.is_visible)
    .sort((a, b) => a.order_index - b.order_index);

  const ids = draftSections.map((section) => section.id);
  let rows: SectionTypeRow[] = [];

  if (ids.length > 0) {
    const { data, error: sectionsError } = await supabase
      .from('website_sections')
      .select('id,type')
      .in('id', ids);

    if (sectionsError) {
      throw new Error(`Failed to resolve preview sections: ${sectionsError.message}`);
    }
    rows = (data ?? []) as SectionTypeRow[];
  }

  const types = new Map(rows.map((section) => [section.id, section.type]));
  const sections = draftSections.flatMap((section) => {
    const type = types.get(section.id);
    return type ? [{ ...section, type }] : [];
  });

  return okResponse({ website: draft.website, sections });
});
