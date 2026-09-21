-- Per-tenant browser tab icon for published websites.
alter table websites
  add column if not exists favicon_url text;

comment on column websites.favicon_url is
  'Public URL of the tenant website favicon. Falls back to logo/platform icon when null.';
