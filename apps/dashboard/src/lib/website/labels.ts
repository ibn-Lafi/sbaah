import type { WebsitePageKey } from '@sbaah/shared';

/**
 * Public path for each page — used to build the device-preview iframe's URL.
 * `property_detail` deliberately excluded: it has no fixed path (every
 * property has its own `/properties/{id}`) — `SitePreview` resolves that
 * one dynamically to an actual published property instead.
 */
export const WEBSITE_PAGE_PATHS: Record<Exclude<WebsitePageKey, 'property_detail'>, string> = {
  home: '/',
  properties: '/properties',
  projects: '/projects',
};
