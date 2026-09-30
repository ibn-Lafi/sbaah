import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface WhatsAppPrincipal {
  tenantId: string;
  contactId: string;
  leadId: string | null;
  phone: string;
}

export function assertWhatsAppCustomerToolArgs(principal: WhatsAppPrincipal, args: unknown) {
  const parsed = z.object({ lead_id: z.string().uuid() }).passthrough().parse(args);
  if (!principal.leadId || parsed.lead_id !== principal.leadId) {
    throw new Error('WhatsApp tool is not allowed to access another customer');
  }
}

export async function executeWhatsAppReadTool(input: {
  systemSupabase: SupabaseClient;
  principal: WhatsAppPrincipal;
  name: string;
  arguments: unknown;
}) {
  const query = z.object({ query: z.string().trim().max(100).default('') }).parse(input.arguments).query.replace(/[%,]/g, '');
  if (input.name === 'search_projects') {
    const { data, error } = await input.systemSupabase.from('projects')
      .select('id,name_ar,name_en,reference_number,slug,status')
      .eq('tenant_id', input.principal.tenantId).eq('status','published')
      .or(query ? `name_ar.ilike.%${query}%,name_en.ilike.%${query}%,reference_number.ilike.%${query}%` : 'id.not.is.null')
      .limit(10);
    if (error) throw new Error(`Failed to search public projects: ${error.message}`);
    return { projects: data ?? [] };
  }
  if (input.name === 'search_listings') {
    const { data, error } = await input.systemSupabase.from('listings')
      .select('id,listing_number,title_ar,title_en,listing_type,commercial_status,asking_price')
      .eq('tenant_id', input.principal.tenantId).eq('publication_status','published')
      .eq('commercial_status','available')
      .or(query ? `title_ar.ilike.%${query}%,title_en.ilike.%${query}%,listing_number.ilike.%${query}%` : 'id.not.is.null')
      .limit(10);
    if (error) throw new Error(`Failed to search public listings: ${error.message}`);
    return { listings: data ?? [] };
  }
  throw new Error(`Unsupported WhatsApp read tool: ${input.name}`);
}
