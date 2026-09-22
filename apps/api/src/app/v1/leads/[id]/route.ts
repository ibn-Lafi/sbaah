import { leadUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';
import { sendEmail } from '@/lib/email/send';
import { newLeadAssignedEmail } from '@/lib/email/templates';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.read');

  const { data, error } = await supabase
    .from('leads')
    .select('*, lead_notes(*)')
    .eq('id', id)
    .eq('tenant_id', caller.tenantId)
    .order('created_at', { foreignTable: 'lead_notes', ascending: false })
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }
  if (isAssignedScope(grant)) await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, id);

  const [tasksResult, viewingsResult, dealsResult, reservationsResult, activitiesResult, partyResult] = await Promise.all([
    supabase.from('crm_tasks').select('*').eq('tenant_id', caller.tenantId).eq('lead_id', id).order('due_at'),
    supabase.from('viewings').select('*').eq('tenant_id', caller.tenantId).eq('lead_id', id).order('scheduled_at', { ascending: false }),
    supabase.from('deals').select('*, deal_assets(asset_id)').eq('tenant_id', caller.tenantId).eq('lead_id', id).order('created_at', { ascending: false }),
    supabase.from('reservations').select('*, reservation_assets(asset_id)').eq('tenant_id', caller.tenantId).eq('lead_id', id).order('reserved_at', { ascending: false }),
    supabase.from('crm_activities').select('*').eq('tenant_id', caller.tenantId).eq('lead_id', id).order('occurred_at', { ascending: false }),
    supabase.from('parties').select('*').eq('tenant_id', caller.tenantId).eq('lead_id', id).maybeSingle(),
  ]);

  const party = partyResult.data ?? null;
  let contracts: Record<string, unknown>[] = [];
  let installments: Record<string, unknown>[] = [];
  let payments: Record<string, unknown>[] = [];
  let maintenance: Record<string, unknown>[] = [];
  const canViewRentPlus = caller.role !== 'agent';

  // Rent Plus contains financial/legal data. Keep the existing legacy role boundary:
  // agents can work their assigned CRM lead, but rental contracts/payments remain owner/admin only.
  if (party && canViewRentPlus) {
    const contractLinks = await supabase.from('lease_contract_parties').select('contract_id, role').eq('tenant_id', caller.tenantId).eq('party_id', party.id);
    const contractIds = [...new Set((contractLinks.data ?? []).map((row) => row.contract_id))];
    if (contractIds.length > 0) {
      const [contractsResult, installmentsResult, paymentsResult, maintenanceResult] = await Promise.all([
        supabase.from('lease_contracts').select('*, lease_contract_assets(asset_id), lease_contract_parties(party_id,role)').eq('tenant_id', caller.tenantId).in('id', contractIds).order('created_at', { ascending: false }),
        supabase.from('lease_installments').select('*').eq('tenant_id', caller.tenantId).in('contract_id', contractIds).order('due_date'),
        supabase.from('lease_payments').select('*').eq('tenant_id', caller.tenantId).in('contract_id', contractIds).order('paid_at', { ascending: false }),
        supabase.from('maintenance_requests').select('*, assets(name_ar,reference_number)').eq('tenant_id', caller.tenantId).or(`contract_id.in.(${contractIds.join(',')}),reported_by_party_id.eq.${party.id}`).order('opened_at', { ascending: false }),
      ]);
      contracts = (contractsResult.data ?? []).map((contract) => ({ ...contract, customer_roles: (contractLinks.data ?? []).filter((link) => link.contract_id === contract.id).map((link) => link.role) }));
      installments = installmentsResult.data ?? [];
      payments = paymentsResult.data ?? [];
      maintenance = maintenanceResult.data ?? [];
    }
  }

  const hasWonPurchase = (dealsResult.data ?? []).some((deal) => deal.status === 'won');
  const hasRentalContract = contracts.some((contract) => Array.isArray(contract.customer_roles) && contract.customer_roles.includes('lessee'));
  const customerKind = data.customer_relationship || hasWonPurchase || hasRentalContract ? 'customer' : 'prospect';
  const customerRelationship = hasRentalContract ? 'tenant' : hasWonPurchase ? 'purchase' : data.customer_relationship ?? null;

  return okResponse({ lead: data, customer360: {
    customer_kind: customerKind,
    customer_relationship: customerRelationship,
    tasks: tasksResult.data ?? [], viewings: viewingsResult.data ?? [], deals: dealsResult.data ?? [],
    reservations: reservationsResult.data ?? [], activities: activitiesResult.data ?? [], party: canViewRentPlus ? party : null, contracts, installments, payments, maintenance,
  }});
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.update');
  if (isAssignedScope(grant)) await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, id);
  const input = leadUpdateSchema.parse(await request.json());
  if (isAssignedScope(grant) && input.assigned_agent_id !== undefined && input.assigned_agent_id !== caller.userId) {
    throw new ApiError(403, 'forbidden_scope', 'لا يمكنك إعادة إسناد العميل إلى مستخدم آخر');
  }

  // Read before the update so a re-save of the same agent (or any other
  // field-only change) doesn't re-notify — only an actual assignment
  // change should email the agent.
  const { data: previous } = await supabase.from('leads').select('assigned_agent_id,status,follow_up_at').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();

  const { data, error } = await supabase.from('leads').update(input).eq('id', id).eq('tenant_id', caller.tenantId).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }

  const activityRows: Array<Record<string, unknown>> = [];
  if (input.status !== undefined && input.status !== previous?.status) {
    activityRows.push({ tenant_id: caller.tenantId, lead_id: id, user_id: caller.userId, activity_type: 'status_changed', summary: 'تم تغيير حالة العميل', metadata: { from: previous?.status ?? null, to: input.status } });
  }
  if (input.assigned_agent_id !== undefined && input.assigned_agent_id !== previous?.assigned_agent_id) {
    activityRows.push({ tenant_id: caller.tenantId, lead_id: id, user_id: caller.userId, activity_type: 'assignment_changed', summary: 'تم تغيير المسؤول عن العميل', metadata: { from: previous?.assigned_agent_id ?? null, to: input.assigned_agent_id ?? null } });
  }
  if (input.follow_up_at !== undefined && input.follow_up_at !== previous?.follow_up_at) {
    activityRows.push({ tenant_id: caller.tenantId, lead_id: id, user_id: caller.userId, activity_type: 'follow_up_changed', summary: input.follow_up_at ? 'تم تحديد موعد متابعة للعميل' : 'تم إلغاء موعد متابعة العميل', metadata: { from: previous?.follow_up_at ?? null, to: input.follow_up_at ?? null } });
  }
  if (activityRows.length > 0) {
    const { error: activityError } = await supabase.from('crm_activities').insert(activityRows);
    if (activityError) console.error('Failed to record CRM activity', activityError);
  }

  const agentAssignmentChanged =
    input.assigned_agent_id != null && input.assigned_agent_id !== previous?.assigned_agent_id;
  if (agentAssignmentChanged) {
    // Best-effort, mirrors team/invite/route.ts — the assignment itself
    // already succeeded above, a flaky email provider shouldn't fail it.
    const { data: agent } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', input.assigned_agent_id as string)
      .eq('tenant_id', caller.tenantId)
      .maybeSingle();
    if (agent?.email) {
      try {
        await sendEmail({
          to: agent.email,
          ...newLeadAssignedEmail({ agentName: agent.full_name, leadName: data.full_name, leadPhone: data.phone }),
        });
      } catch (emailError) {
        console.error('Failed to send new-lead-assigned email', emailError);
      }
    }
  }

  return okResponse({ lead: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  // No agent DELETE policy on `leads` (migration 0005).
  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية حذف عملاء محتملين');
  }

  const { data, error } = await supabase.from('leads').delete().eq('id', id).eq('tenant_id', caller.tenantId).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to delete lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }

  return okResponse({ status: 'deleted' });
});
