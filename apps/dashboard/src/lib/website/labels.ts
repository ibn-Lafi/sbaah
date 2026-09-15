import type { WebsitePageKey } from '@sbaah/shared';

/** Public path for each page — used to build the device-preview iframe's URL. */
export const WEBSITE_PAGE_PATHS: Record<WebsitePageKey, string> = {
  home: '/',
  properties: '/properties',
  property_detail: '/properties',
  projects: '/projects',
};
