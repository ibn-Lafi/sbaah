import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface LeadInterestRow {
  id: string;
  lead_id: string;
  created_at: string;
  leads: unknown;
}

const LEAD_INTEREST_COLUMNS = 'id,lead_id,created_at,leads(id,full_name,phone)';
const EMPTY_RESULT = { data: [], error: null };

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertPermission(caller.role, 'crm.read');

  const { data: asset } = await supabase
    .from('assets')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', caller.tenantId)
    .maybeSingle();
  if (!asset) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');

  const { data: listingLinks, error: listingLinksError } = await supabase
    .from('listing_assets')
    .select('listing_id')
    .eq('tenant_id', caller.tenantId)
    .eq('asset_id', id);
  if (listingLinksError) throw new Error(listingLinksError.message);
  const listingIds = [...new Set((listingLinks ?? []).map((link) => link.listing_id))];
  // Lease, ownership, management and maintenance data is financial/legal
  // Rent Plus data that stays owner/admin-only (see leads/[id] GET).
  const canViewRentPlus = caller.role !== 'agent';

  const [
    assetInterests,
    listingInterests,
    viewings,
    reservationLinks,
    dealLinks,
    leaseLinks,
    ownerships,
    management,
    maintenance,
  ] = await Promise.all([
    supabase
      .from('lead_interests')
      .select(LEAD_INTEREST_COLUMNS)
      .eq('tenant_id', caller.tenantId)
      .eq('asset_id', id)
      .order('created_at', { ascending: false })
      .returns<LeadInterestRow[]>(),
    listingIds.length
      ? supabase
          .from('lead_interests')
          .select(LEAD_INTEREST_COLUMNS)
          .eq('tenant_id', caller.tenantId)
          .in('listing_id', listingIds)
          .order('created_at', { ascending: false })
          .returns<LeadInterestRow[]>()
      : Promise.resolve(EMPTY_RESULT),
    supabase
      .from('viewings')
      .select('id,lead_id,scheduled_at,status,leads(id,full_name,phone)')
      .eq('tenant_id', caller.tenantId)
      .eq('asset_id', id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('reservation_assets')
      .select(
        'reservation_id,reservations(id,reservation_number,status,reserved_at,lead_id,leads(id,full_name,phone))',
      )
      .eq('tenant_id', caller.tenantId)
      .eq('asset_id', id),
    supabase
      .from('deal_assets')
      .select(
        'deal_id,deals(id,status,value,deal_type,closed_at,created_at,responsible_user_id,listing_id,lead_id,leads(id,full_name,phone,source),users!deals_responsible_user_id_fkey(id,full_name),listings(id,listing_number,asking_price,created_at))',
      )
      .eq('tenant_id', caller.tenantId)
      .eq('asset_id', id),
    canViewRentPlus
      ? supabase
          .from('lease_contract_assets')
          .select(
            'contract_id,lease_contracts(id,contract_number,status,start_date,end_date,total_value,payment_frequency,lease_contract_parties(party_id,role,parties(id,name,lead_id)),lease_installments(id,installment_number,due_date,amount,status))',
          )
          .eq('tenant_id', caller.tenantId)
          .eq('asset_id', id)
      : Promise.resolve(EMPTY_RESULT),
    canViewRentPlus
      ? supabase
          .from('asset_ownerships')
          .select('id,party_id,ownership_percentage,started_at,ended_at,parties(id,name)')
          .eq('tenant_id', caller.tenantId)
          .eq('asset_id', id)
          .order('created_at', { ascending: false })
      : Promise.resolve(EMPTY_RESULT),
    canViewRentPlus
      ? supabase
          .from('property_management_assignments')
          .select('id,status,starts_at,ends_at,management_fee_type,management_fee_value')
          .eq('tenant_id', caller.tenantId)
          .eq('asset_id', id)
          .order('created_at', { ascending: false })
      : Promise.resolve(EMPTY_RESULT),
    canViewRentPlus
      ? supabase
          .from('maintenance_requests')
          .select(
            'id,request_number,title,priority,status,opened_at,completed_at,contract_id,estimated_cost,actual_cost',
          )
          .eq('tenant_id', caller.tenantId)
          .eq('asset_id', id)
          .order('opened_at', { ascending: false })
      : Promise.resolve(EMPTY_RESULT),
  ]);

  for (const result of [
    assetInterests,
    listingInterests,
    viewings,
    reservationLinks,
    dealLinks,
    leaseLinks,
    ownerships,
    management,
    maintenance,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  // A lead interested in both the asset and one of its listings is shown
  // once, with their most recent interest.
  const latestInterestByLead = new Map<string, LeadInterestRow>();
  const interests = [...(assetInterests.data ?? []), ...(listingInterests.data ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  for (const interest of interests) {
    if (!latestInterestByLead.has(interest.lead_id)) latestInterestByLead.set(interest.lead_id, interest);
  }

  return okResponse({
    relationships: {
      interests: [...latestInterestByLead.values()],
      viewings: viewings.data ?? [],
      reservations: reservationLinks.data ?? [],
      deals: dealLinks.data ?? [],
      leases: leaseLinks.data ?? [],
      ownerships: ownerships.data ?? [],
      management: management.data ?? [],
      maintenance: maintenance.data ?? [],
    },
  });
});
