import { apiGet } from './client';
import { getHost } from '@/lib/tenant/get-host';

export interface PublicProject {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  city_id: string;
  district_id: string | null;
}

export interface PublicProjectListResponse {
  projects: PublicProject[];
  page: number;
  page_size: number;
  total: number;
}

/** No `project_media` table exists yet (task 13/42 never built one) — projects list with text only, no photos. Known limitation, see GET /v1/public/projects. */
export async function listPublicProjects(page = 1): Promise<PublicProjectListResponse> {
  const host = await getHost();
  const query = new URLSearchParams({ domain: host ?? '', page: String(page) });
  return apiGet<PublicProjectListResponse>(`/public/projects?${query.toString()}`);
}
