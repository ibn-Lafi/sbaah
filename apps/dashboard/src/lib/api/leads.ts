import type { Lead, LeadNote, LeadSource, LeadStatus, LeadUpdateInput, ManualLeadInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface LeadListResponse {
  leads: Array<Lead & { customer_kind?: 'customer' | 'prospect' }>;
  page: number;
  page_size: number;
  total: number;
}

export function listLeads(
  accessToken: string,
  params: { status?: LeadStatus; source?: LeadSource; customer_kind?: 'customer' | 'prospect'; page?: number; page_size?: number } = {},
): Promise<LeadListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.source) query.set('source', params.source);
  if (params.customer_kind) query.set('customer_kind', params.customer_kind);
  if (params.page) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));
  const qs = query.toString();
  return apiGet<LeadListResponse>(`/leads${qs ? `?${qs}` : ''}`, accessToken);
}

export type LeadWithNotes = Lead & { lead_notes: LeadNote[] };

export interface LeadInterest {
  id:string; project_id:string|null; unit_type_id:string|null; asset_id:string|null; listing_id:string|null; priority:number|null; notes:string|null; created_at:string;
  projects?:{id:string;name_ar:string}|null;
  unit_types?:{id:string;name_ar:string;project_id:string|null}|null;
  assets?:{id:string;name_ar:string;project_id:string|null;unit_type_id:string|null;parent_asset_id:string|null;unit_number:string|null;asset_type:string}|null;
  listings?:{id:string;title_ar:string;listing_type:string}|null;
}

export interface JourneyAsset { id:string;name_ar:string;reference_number:string|null;unit_number:string|null;project_id:string|null;unit_type_id:string|null; }
export interface JourneyAssetLink { asset_id:string; assets?:JourneyAsset|null; }

export interface Customer360Snapshot {
  customer_kind: 'customer' | 'prospect';
  customer_relationship: 'purchase' | 'tenant' | null;
  interests: LeadInterest[];
  tasks: Array<{id:string;title:string;due_at:string|null;completed_at:string|null;completion_notes:string|null}>;
  viewings: Array<{id:string;asset_id:string;scheduled_at:string;status:string;outcome:string|null;notes:string|null;assets?:JourneyAsset|null}>;
  deals: Array<{id:string;status:string;value:number|null;expected_close_date:string|null;deal_assets?:JourneyAssetLink[]}>;
  reservations: Array<{id:string;reservation_number:string;status:string;reserved_at:string;expires_at:string|null;deposit_amount:number|null;reservation_assets?:JourneyAssetLink[]}>;
  activities: Array<{id:string;activity_type:string;summary:string;metadata:Record<string,unknown>|null;occurred_at:string}>;
  party: {id:string;name:string;phone:string|null;email:string|null}|null;
  contracts: Array<{id:string;contract_number:string;start_date:string;end_date:string;total_value:number;status:string;customer_roles?:string[];lease_contract_assets?:JourneyAssetLink[]}>;
  installments: Array<{id:string;contract_id:string;installment_number:number;due_date:string;amount:number;status:string}>;
  payments: Array<{id:string;contract_id:string;payment_number:string;amount:number;paid_at:string;status:string}>;
  maintenance: Array<{id:string;contract_id:string|null;request_number:string;title:string;status:string;priority:string;opened_at:string;assets?:{name_ar:string;reference_number:string|null}|null}>;
}

export function getLead(accessToken: string, id: string): Promise<{ lead: LeadWithNotes; customer360: Customer360Snapshot }> {
  return apiGet<{ lead: LeadWithNotes; customer360: Customer360Snapshot }>(`/leads/${id}`, accessToken);
}

export function createLead(accessToken: string, input: ManualLeadInput): Promise<{ lead: Lead }> {
  return apiPost<{ lead: Lead }>('/leads', input, accessToken);
}

export function updateLead(accessToken: string, id: string, input: LeadUpdateInput): Promise<{ lead: Lead }> {
  return apiPatch<{ lead: Lead }>(`/leads/${id}`, input, accessToken);
}

export function deleteLead(accessToken: string, id: string): Promise<{ status: string }> {
  return apiDelete<{ status: string }>(`/leads/${id}`, accessToken);
}

export function addLeadNote(accessToken: string, id: string, noteText: string): Promise<{ note: LeadNote }> {
  return apiPost<{ note: LeadNote }>(`/leads/${id}/notes`, { note_text: noteText }, accessToken);
}

export function addLeadInterest(accessToken:string,id:string,input:{project_id?:string|null;unit_type_id?:string|null;asset_id?:string|null;listing_id?:string|null;priority?:number|null;notes?:string|null}):Promise<{interest:LeadInterest}>{return apiPost<{interest:LeadInterest}>(`/leads/${id}/interests`,input,accessToken);}
