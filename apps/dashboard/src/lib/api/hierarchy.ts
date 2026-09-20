import type {
  Project,
  ProjectInput,
  ProjectUpdateInput,
  PropertyStatus,
} from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface ProjectListResponse {
  projects: Project[];
  page: number;
  page_size: number;
  total: number;
}

export function listProjects(
  accessToken: string,
  params: { status?: PropertyStatus } = {},
): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  return apiGet<ProjectListResponse>(`/projects${qs ? `?${qs}` : ''}`, accessToken);
}

export function getProject(accessToken: string, id: string): Promise<{ project: Project }> {
  return apiGet<{ project: Project }>(`/projects/${id}`, accessToken);
}

export function createProject(accessToken: string, input: ProjectInput): Promise<{ project: Project }> {
  return apiPost<{ project: Project }>('/projects', input, accessToken);
}

export function updateProject(
  accessToken: string,
  id: string,
  input: ProjectUpdateInput,
): Promise<{ project: Project }> {
  return apiPatch<{ project: Project }>(`/projects/${id}`, input, accessToken);
}

export function deleteProject(accessToken: string, id: string): Promise<{ status: string }> {
  return apiDelete<{ status: string }>(`/projects/${id}`, accessToken);
}

