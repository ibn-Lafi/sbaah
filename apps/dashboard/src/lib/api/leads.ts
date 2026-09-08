import type { Lead, LeadNote, LeadSource, LeadStatus, LeadUpdateInput, ManualLeadInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface LeadListResponse {
  leads: Lead[];
  page: number;
  page_size: number;
  total: number;
}

export function listLeads(
  accessToken: string,
  params: { status?: LeadStatus; source?: LeadSource; page?: number } = {},
): Promise<LeadListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.source) query.set('source', params.source);
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return apiGet<LeadListResponse>(`/leads${qs ? `?${qs}` : ''}`, accessToken);
}

export type LeadWithNotes = Lead & { lead_notes: LeadNote[] };

export function getLead(accessToken: string, id: string): Promise<{ lead: LeadWithNotes }> {
  return apiGet<{ lead: LeadWithNotes }>(`/leads/${id}`, accessToken);
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
