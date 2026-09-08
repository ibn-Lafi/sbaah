import type { City, District, Theme } from '@sbaah/shared';
import { apiGet } from './client';

/** GET /v1/public/* — unauthenticated by design (RLS already makes these tables openly readable, task 22/42/23/42). */
export async function listCities(): Promise<City[]> {
  const { cities } = await apiGet<{ cities: City[] }>('/public/cities');
  return cities;
}

export async function listDistricts(cityId?: string): Promise<District[]> {
  const query = cityId ? `?city_id=${cityId}` : '';
  const { districts } = await apiGet<{ districts: District[] }>(`/public/districts${query}`);
  return districts;
}

export async function listThemes(): Promise<Theme[]> {
  const { themes } = await apiGet<{ themes: Theme[] }>('/public/themes');
  return themes;
}
