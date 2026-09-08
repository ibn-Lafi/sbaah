import type {
  Building,
  BuildingInput,
  BuildingUpdateInput,
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

export interface BuildingListResponse {
  buildings: Building[];
  page: number;
  page_size: number;
  total: number;
}

export function listBuildings(
  accessToken: string,
  params: { project_id?: string } = {},
): Promise<BuildingListResponse> {
  const query = new URLSearchParams();
  if (params.project_id) query.set('project_id', params.project_id);
  const qs = query.toString();
  return apiGet<BuildingListResponse>(`/buildings${qs ? `?${qs}` : ''}`, accessToken);
}

export function getBuilding(accessToken: string, id: string): Promise<{ building: Building }> {
  return apiGet<{ building: Building }>(`/buildings/${id}`, accessToken);
}

export function createBuilding(accessToken: string, input: BuildingInput): Promise<{ building: Building }> {
  return apiPost<{ building: Building }>('/buildings', input, accessToken);
}

export function updateBuilding(
  accessToken: string,
  id: string,
  input: BuildingUpdateInput,
): Promise<{ building: Building }> {
  return apiPatch<{ building: Building }>(`/buildings/${id}`, input, accessToken);
}

export function deleteBuilding(accessToken: string, id: string): Promise<{ status: string }> {
  return apiDelete<{ status: string }>(`/buildings/${id}`, accessToken);
}
