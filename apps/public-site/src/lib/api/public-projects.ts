import { apiGet } from './client';
import { getHost } from '@/lib/tenant/get-host';
import type { AssetType, ListingType } from '@sbaah/shared';

export interface PublicProject {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  city_id: string;
  district_id: string | null;
  lat?: number | null;
  lng?: number | null;
  media?: ProjectMedia[];
  status?: string | null;
  completion_percentage?: number | null;
  expected_completion_date?: string | null;
  planned_units_count?: number | null;
  models_count?: number;
}

export interface PublicProjectListResponse {
  projects: PublicProject[];
  page: number;
  page_size: number;
  total: number;
}

export type ProjectMediaCategory =
  | 'general'
  | 'exterior'
  | 'master_plan'
  | 'unit_plans'
  | 'interior'
  | 'amenities'
  | 'location'
  | 'construction'
  | 'other';
export interface ProjectMedia {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  category: ProjectMediaCategory;
  alt_ar: string | null;
  alt_en: string | null;
  order_index: number;
  is_primary: boolean;
}

export type AssetMediaCategory =
  | 'general'
  | 'exterior'
  | 'entrance'
  | 'living'
  | 'bedrooms'
  | 'kitchen'
  | 'bathrooms'
  | 'outdoor'
  | 'amenities'
  | 'parking'
  | 'floor_plan'
  | 'location'
  | 'view'
  | 'construction'
  | 'other';

export interface PublicAssetMedia {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  category: AssetMediaCategory;
  alt_ar: string | null;
  alt_en: string | null;
  order_index: number;
  is_primary: boolean;
}

export interface PublicProjectUnit {
  id: string;
  slug: string | null;
  parent_asset_id: string | null;
  unit_type_id: string | null;
  phase_id: string | null;
  unit_number: string | null;
  floor_number: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  asset_type: AssetType;
  name_ar: string;
  name_en: string | null;
  listing_id: string;
  listing_number: string;
  listing_type: ListingType;
  price: number | null;
  pricing_period: string | null;
  commercial_status: string;
  media: PublicAssetMedia[];
}

export type PublicProjectProperty = Omit<
  PublicProjectUnit,
  'listing_id' | 'listing_number' | 'listing_type' | 'commercial_status'
> & {
  listing_id: string | null;
  listing_number: string | null;
  listing_type: string | null;
  commercial_status: string | null;
  units: PublicProjectUnit[];
};

export interface PublicProjectDetailResponse {
  project: PublicProject & Record<string, unknown>;
  media: ProjectMedia[];
  unit_types: Array<{
    id: string;
    name_ar: string;
    name_en: string | null;
    asset_type: string | null;
    area_sqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    base_price: number | null;
    specifications: Record<string, unknown>;
  }>;
  properties: PublicProjectProperty[];
  units: PublicProjectUnit[];
  properties_total: number;
  nested_units_total: number;
  total: number;
}
export async function listPublicProjects(
  page = 1,
  pageSize?: number,
): Promise<PublicProjectListResponse> {
  const host = await getHost();
  const query = new URLSearchParams({ domain: host ?? '', page: String(page) });
  if (pageSize !== undefined) query.set('page_size', String(pageSize));
  return apiGet<PublicProjectListResponse>(`/public/projects?${query.toString()}`);
}

export async function getPublicProject(id: string): Promise<PublicProjectDetailResponse> {
  const host = await getHost();
  const query = new URLSearchParams({ domain: host ?? '' });
  return apiGet<PublicProjectDetailResponse>(`/public/projects/${id}?${query.toString()}`);
}
