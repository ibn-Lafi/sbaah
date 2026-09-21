import type { NextRequest } from 'next/server';
import { ejarPartyInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('tenant_id', caller.tenantId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list tenants: ${error.message}`);
  return okResponse({ tenants: data });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إنشاء المستأجرين');

  const input = ejarPartyInputSchema.parse(await request.json());

  if (input.lead_id) {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, full_name, phone, email')
      .eq('tenant_id', caller.tenantId)
      .eq('id', input.lead_id)
      .single();
    if (leadError || !lead) throw new ApiError(404, 'lead_not_found', 'العميل غير موجود');

    const { data: existing, error: existingError } = await supabase
      .from('parties')
      .select('*')
      .eq('tenant_id', caller.tenantId)
      .eq('lead_id', input.lead_id)
      .maybeSingle();
    if (existingError) throw new Error(`Failed to check existing tenant: ${existingError.message}`);
    if (existing) return okResponse({ party: existing, reused: true });

    const { data, error } = await supabase.from('parties').insert({
      ...input,
      name: lead.full_name,
      phone: lead.phone || input.phone || null,
      email: lead.email || input.email || null,
      tenant_id: caller.tenantId,
    }).select().single();
    if (error) throw new Error(`Failed to create party: ${error.message}`);
    return okResponse({ party: data, reused: false }, 201);
  }

  const { data, error } = await supabase.from('parties').insert({ ...input, tenant_id: caller.tenantId }).select().single();
  if (error) throw new Error(`Failed to create party: ${error.message}`);
  return okResponse({ party: data }, 201);
});
