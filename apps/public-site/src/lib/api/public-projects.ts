import { apiGet } from './client';
import { getHost } from '@/lib/tenant/get-host';

export interface PublicProject {
  id: string;
  slug: string;
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

export interface PublicProjectDetailResponse { project: PublicProject & Record<string, unknown>; media: Array<{id:string;url:string;media_type:'image'|'video';alt_ar:string|null;alt_en:string|null;order_index:number}>; unit_types: Array<Record<string, unknown>>; units: Array<{id:string;unit_type_id:string;unit_number:string;floor_number:number|null;area_sqm:number|null;price:number|null;orientation:string|null;availability:string}>; }
export async function listPublicProjects(page = 1): Promise<PublicProjectListResponse> {
  const host = await getHost();
  const query = new URLSearchParams({ domain: host ?? '', page: String(page) });
  return apiGet<PublicProjectListResponse>(`/public/projects?${query.toString()}`);
}

export async function getPublicProject(id:string):Promise<PublicProjectDetailResponse>{const host=await getHost();const query=new URLSearchParams({domain:host??''});return apiGet<PublicProjectDetailResponse>(`/public/projects/${id}?${query.toString()}`);}
