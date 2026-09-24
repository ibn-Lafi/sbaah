import type { WebsitePageKey } from '@sbaah/shared';

/**
 * Public path for each page — used to build the device-preview iframe's URL.
 * `property_detail` and `project_detail` deliberately excluded: it has no fixed path (every
 * property/project has its own dynamic detail URL) — `SitePreview` resolves that
 * one dynamically to an actual published property instead.
 */
export const WEBSITE_PAGE_PATHS: Record<Exclude<WebsitePageKey, 'property_detail' | 'project_detail'>, string> = {
  home: '/',
  properties: '/properties',
  projects: '/projects',
};
