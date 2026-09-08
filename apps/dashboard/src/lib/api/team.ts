import type { InviteTeamMemberInput, UpdateTeamMemberInput, UserRole, UserStatus } from '@sbaah/shared';
import { apiGet, apiPatch, apiPost } from './client';

export interface TeamMember {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export function listTeam(accessToken: string) {
  return apiGet<{ members: TeamMember[] }>('/team', accessToken);
}

export function inviteTeamMember(accessToken: string, input: InviteTeamMemberInput) {
  return apiPost<{ member: TeamMember }>('/team/invite', input, accessToken);
}

export function updateTeamMember(accessToken: string, id: string, input: UpdateTeamMemberInput) {
  return apiPatch<{ member: TeamMember }>(`/team/${id}`, input, accessToken);
}
