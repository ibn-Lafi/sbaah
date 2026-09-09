import type { City, District } from '@sbaah/shared';
import { apiGet } from './client';

/** Cities/districts are global reference data (not tenant-scoped), same endpoints `dashboard` uses (task 22/42) — no `domain` param needed. */
export async function listCities(): Promise<City[]> {
  const { cities } = await apiGet<{ cities: City[] }>('/public/cities');
  return cities;
}

export async function listDistricts(cityId?: string): Promise<District[]> {
  const query = cityId ? `?city_id=${cityId}` : '';
  const { districts } = await apiGet<{ districts: District[] }>(`/public/districts${query}`);
  return districts;
}
