import type { Permission, UserRole, UserStatus } from '@sbaah/shared';
import { apiGet, apiPatch, apiPost } from './client';

export interface TeamMember {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
  created_at: string;
  permissions: Permission[];
}

export function getTeam(accessToken: string) {
  return apiGet<{ members: TeamMember[] }>('/team', accessToken);
}

export function createTeamMember(accessToken: string, input: {
  full_name: string;
  phone: string;
  email: string;
  temporary_password: string;
  permissions: Permission[];
}) {
  return apiPost<{ member: TeamMember }>('/team', input, accessToken);
}

export function updateTeamMember(accessToken: string, id: string, input: {
  full_name?: string;
  status?: 'active' | 'disabled';
  permissions?: Permission[];
}) {
  return apiPatch<{ member: TeamMember }>('/team/' + id, input, accessToken);
}
