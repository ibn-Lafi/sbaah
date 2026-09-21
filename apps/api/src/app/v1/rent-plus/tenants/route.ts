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

  // A Rent Plus tenant is also a CRM customer. Reuse an existing lead by
  // contact identity when possible; otherwise create one and link party.lead_id.
  let matchedLead: { id: string } | null = null;

  if (input.phone) {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('tenant_id', caller.tenantId)
      .eq('phone', input.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to match tenant phone to CRM: ${error.message}`);
    matchedLead = data;
  }

  if (!matchedLead && input.email) {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('tenant_id', caller.tenantId)
      .eq('email', input.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to match tenant email to CRM: ${error.message}`);
    matchedLead = data;
  }

  let createdLeadId: string | null = null;
  if (!matchedLead) {
    if (!input.phone) {
      throw new ApiError(400, 'tenant_phone_required', 'رقم الجوال مطلوب للمستأجر الجديد حتى يتم إنشاء ملف العميل وربطه');
    }
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        tenant_id: caller.tenantId,
        full_name: input.name,
        phone: input.phone,
        email: input.email || null,
        source: 'manual',
        status: 'new',
      })
      .select('id')
      .single();
    if (leadError || !lead) throw new Error(`Failed to create CRM customer for tenant: ${leadError?.message ?? 'unknown error'}`);
    matchedLead = lead;
    createdLeadId = lead.id;
  }

  const { data: existingParty, error: existingPartyError } = await supabase
    .from('parties')
    .select('*')
    .eq('tenant_id', caller.tenantId)
    .eq('lead_id', matchedLead.id)
    .maybeSingle();
  if (existingPartyError) throw new Error(`Failed to check linked tenant: ${existingPartyError.message}`);
  if (existingParty) return okResponse({ party: existingParty, reused: true });

  const { data, error } = await supabase
    .from('parties')
    .insert({ ...input, lead_id: matchedLead.id, tenant_id: caller.tenantId })
    .select()
    .single();

  if (error) {
    // Best-effort compensation: do not leave a CRM customer created solely
    // for a Rent Plus operation that failed afterwards.
    if (createdLeadId) {
      await supabase.from('leads').delete().eq('tenant_id', caller.tenantId).eq('id', createdLeadId);
    }
    throw new Error(`Failed to create party: ${error.message}`);
  }

  return okResponse({ party: data, reused: false, customer_created: Boolean(createdLeadId) }, 201);
});
