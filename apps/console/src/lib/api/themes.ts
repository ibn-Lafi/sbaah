import type { Theme, ThemeUpdateInput } from '@sbaah/shared';
import { apiGet, apiPatch } from './client';

/** No create/delete — themes are code-defined (public-site's theme registry) and shipped via migration, see docs/THEMES.md. Console only manages display metadata. */
export function listThemes(accessToken: string) {
  return apiGet<{ themes: Theme[] }>('/console/themes', accessToken);
}

export function updateTheme(accessToken: string, id: string, input: ThemeUpdateInput) {
  return apiPatch<{ theme: Theme }>(`/console/themes/${id}`, input, accessToken);
}
