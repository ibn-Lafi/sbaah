import type { Region } from '@sbaah/shared';
import { apiGet } from './client';

/** GET /v1/public/regions — unauthenticated (RLS already makes it openly readable), same as apps/dashboard's listCities. */
export async function listRegions(): Promise<Region[]> {
  const { regions } = await apiGet<{ regions: Region[] }>('/public/regions');
  return regions;
}
