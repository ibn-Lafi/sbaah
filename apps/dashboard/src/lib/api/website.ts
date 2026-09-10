import type { SectionUpdateInput, Website, WebsitePage, WebsiteSection, WebsiteUpdateInput } from '@sbaah/shared';
import { apiGet, apiPatch, apiUpload } from './client';

export type WebsitePageWithSections = WebsitePage & { website_sections: WebsiteSection[] };

export function getWebsite(accessToken: string): Promise<{ website: Website; pages: WebsitePageWithSections[] }> {
  return apiGet<{ website: Website; pages: WebsitePageWithSections[] }>('/website', accessToken);
}

export function updateWebsite(accessToken: string, input: WebsiteUpdateInput): Promise<{ website: Website }> {
  return apiPatch<{ website: Website }>('/website', input, accessToken);
}

export function updateSection(
  accessToken: string,
  sectionId: string,
  input: SectionUpdateInput,
): Promise<{ section: WebsiteSection }> {
  return apiPatch<{ section: WebsiteSection }>(`/website/sections/${sectionId}`, input, accessToken);
}

export function reorderSections(
  accessToken: string,
  sections: { id: string; order_index: number }[],
): Promise<{ sections: WebsiteSection[] }> {
  return apiPatch<{ sections: WebsiteSection[] }>('/website/sections/reorder', { sections }, accessToken);
}

function uploadAsset(accessToken: string, path: '/website/logo' | '/website/banner', file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<{ website: Website }>(path, formData, accessToken);
}

export function uploadLogo(accessToken: string, file: File): Promise<{ website: Website }> {
  return uploadAsset(accessToken, '/website/logo', file);
}

export function uploadBanner(accessToken: string, file: File): Promise<{ website: Website }> {
  return uploadAsset(accessToken, '/website/banner', file);
}
