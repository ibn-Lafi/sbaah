import type {
  Project,
  ProjectInput,
  ProjectUpdateInput,
  ProjectStatus,
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
  params: { status?: ProjectStatus; page?: number; page_size?: number } = {},
): Promise<ProjectListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));
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


export type ProjectMediaCategory='general'|'exterior'|'master_plan'|'unit_plans'|'interior'|'amenities'|'location'|'construction'|'other';
export interface ProjectMedia {id:string;tenant_id:string;project_id:string;media_type:'image'|'video';category:ProjectMediaCategory;url:string;alt_ar:string|null;alt_en:string|null;order_index:number;is_primary:boolean;created_at:string}
export const listProjectMedia=(token:string,id:string)=>apiGet<{media:ProjectMedia[]}>(`/projects/${id}/media`,token);
export const createProjectMedia=(token:string,id:string,input:Omit<ProjectMedia,'id'|'tenant_id'|'project_id'|'created_at'>)=>apiPost<{media:ProjectMedia}>(`/projects/${id}/media`,input,token);
export const updateProjectMedia=(token:string,id:string,mediaId:string,input:Partial<Pick<ProjectMedia,'category'|'alt_ar'|'alt_en'|'order_index'|'is_primary'>>)=>apiPatch<{media:ProjectMedia}>(`/projects/${id}/media/${mediaId}`,input,token);
export const deleteProjectMedia=(token:string,id:string,mediaId:string)=>apiDelete<{status:string}>(`/projects/${id}/media/${mediaId}`,token);
