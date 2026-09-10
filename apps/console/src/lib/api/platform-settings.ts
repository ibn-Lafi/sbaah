import type { PlatformSettings, PlatformSettingsUpdateInput } from '@sbaah/shared';
import { apiGet, apiPatch } from './client';

export function getPlatformSettings(accessToken: string) {
  return apiGet<PlatformSettings>('/console/platform-settings', accessToken);
}

export function updatePlatformSettings(accessToken: string, input: PlatformSettingsUpdateInput) {
  return apiPatch<PlatformSettings>('/console/platform-settings', input, accessToken);
}
