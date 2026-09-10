-- =============================================================================
-- Migration 0024: multi-page websites (صفحات الموقع)
--
-- Until now a tenant's website was a single page (home) with one ordered
-- list of sections. This migration adds a fixed, non-user-creatable page
-- set per website — home / properties / property_detail / projects /
-- about / contact (WEBSITE_PAGE_KEYS, packages/shared) — each with its
-- own ordered sections, editable the same way home's always were.
--
-- Two new section types exist ONLY as the data-driven "anchor" on their
-- page — they are NOT theme-branched like hero/about/contact are (see
-- apps/public-site/src/components/themes): 'property_grid' on the
-- `properties` page and 'project_grid' on `projects` still render the
-- existing, unthemed listing UI (filters/pagination) unchanged across
-- themes; likewise 'property_detail' on the `property_detail` page is
-- the existing unthemed detail layout. A tenant can toggle/reposition
-- these among that page's other (themed) sections, but not restyle them
-- per-theme in this version — that's a real, deliberate scope cut, not
-- an oversight.
-- =============================================================================

-- New value additions must commit before they can be used below.
alter type website_section_type add value if not exists 'project_grid';
alter type website_section_type add value if not exists 'property_detail';

commit;

-- ---------------------------------------------------------------------------
-- website_pages
-- ---------------------------------------------------------------------------
create type website_page_key as enum ('home', 'properties', 'property_detail', 'projects', 'about', 'contact');

create table website_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references websites (id) on delete cascade,
  key website_page_key not null,
  unique (website_id, key)
);

create index website_pages_website_id_idx on website_pages (website_id);

alter table website_pages enable row level security;

create policy website_pages_tenant_manage on website_pages
  for all to authenticated
  using (
    exists (
      select 1 from websites
      where websites.id = website_pages.website_id
        and websites.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from websites
      where websites.id = website_pages.website_id
        and websites.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  );

create policy website_pages_public_select on website_pages
  for select to anon
  using (
    exists (
      select 1 from websites
      where websites.id = website_pages.website_id
        and is_tenant_active(websites.tenant_id)
    )
  );

-- ---------------------------------------------------------------------------
-- website_sections.page_id — `website_id` stays as-is (every existing RLS
-- policy on website_sections is keyed off it, migration 0005) so none of
-- those policies need to change; page_id only adds page grouping.
-- ---------------------------------------------------------------------------
alter table website_sections add column page_id uuid references website_pages (id) on delete cascade;
create index website_sections_page_id_idx on website_sections (page_id);

-- Backfill every existing website: create its 6 pages, move its existing
-- (currently home-only) sections onto the new 'home' page, and seed
-- sensible defaults for the 5 new pages.
do $$
declare
  w record;
  v_home_id uuid;
  v_properties_id uuid;
  v_property_detail_id uuid;
  v_projects_id uuid;
  v_about_id uuid;
  v_contact_id uuid;
begin
  for w in select id from websites loop
    insert into website_pages (website_id, key) values (w.id, 'home') returning id into v_home_id;
    insert into website_pages (website_id, key) values (w.id, 'properties') returning id into v_properties_id;
    insert into website_pages (website_id, key) values (w.id, 'property_detail') returning id into v_property_detail_id;
    insert into website_pages (website_id, key) values (w.id, 'projects') returning id into v_projects_id;
    insert into website_pages (website_id, key) values (w.id, 'about') returning id into v_about_id;
    insert into website_pages (website_id, key) values (w.id, 'contact') returning id into v_contact_id;

    update website_sections set page_id = v_home_id where website_id = w.id;

    insert into website_sections (website_id, page_id, type, order_index, is_visible)
    values
      (w.id, v_properties_id, 'hero', 0, true),
      (w.id, v_properties_id, 'property_grid', 1, true),
      (w.id, v_properties_id, 'footer', 2, true),
      (w.id, v_property_detail_id, 'hero', 0, false),
      (w.id, v_property_detail_id, 'property_detail', 1, true),
      (w.id, v_property_detail_id, 'contact', 2, true),
      (w.id, v_property_detail_id, 'footer', 3, true),
      (w.id, v_projects_id, 'hero', 0, true),
      (w.id, v_projects_id, 'project_grid', 1, true),
      (w.id, v_projects_id, 'footer', 2, true),
      (w.id, v_about_id, 'hero', 0, false),
      (w.id, v_about_id, 'about', 1, true),
      (w.id, v_about_id, 'why_us', 2, true),
      (w.id, v_about_id, 'contact', 3, true),
      (w.id, v_about_id, 'footer', 4, true),
      (w.id, v_contact_id, 'hero', 0, false),
      (w.id, v_contact_id, 'contact', 1, true),
      (w.id, v_contact_id, 'footer', 2, true);
  end loop;
end $$;

alter table website_sections alter column page_id set not null;

-- ---------------------------------------------------------------------------
-- New tenants: create_default_website_for_tenant() (migration 0012) must
-- now seed all 6 pages, not just home. Replacing in place (not editing
-- 0012's file) — same reasoning 0012 itself documents: this trigger must
-- keep the invariant for every future tenant, whatever code changes.
-- Also switches the "pick a theme" query to `order by order_index` (added
-- by migration 0023) so new tenants deterministically start on the first
-- theme ('classic'), not an arbitrary active one.
-- ---------------------------------------------------------------------------
create or replace function create_default_website_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme_id uuid;
  v_website_id uuid;
  v_home_id uuid;
  v_properties_id uuid;
  v_property_detail_id uuid;
  v_projects_id uuid;
  v_about_id uuid;
  v_contact_id uuid;
begin
  select id into v_theme_id from themes where is_active = true order by order_index limit 1;

  insert into websites (tenant_id, theme_id)
  values (new.id, v_theme_id)
  returning id into v_website_id;

  insert into website_pages (website_id, key) values (v_website_id, 'home') returning id into v_home_id;
  insert into website_pages (website_id, key) values (v_website_id, 'properties') returning id into v_properties_id;
  insert into website_pages (website_id, key) values (v_website_id, 'property_detail') returning id into v_property_detail_id;
  insert into website_pages (website_id, key) values (v_website_id, 'projects') returning id into v_projects_id;
  insert into website_pages (website_id, key) values (v_website_id, 'about') returning id into v_about_id;
  insert into website_pages (website_id, key) values (v_website_id, 'contact') returning id into v_contact_id;

  insert into website_sections (website_id, page_id, type, order_index, is_visible)
  values
    (v_website_id, v_home_id, 'hero', 0, true),
    (v_website_id, v_home_id, 'property_grid', 1, true),
    (v_website_id, v_home_id, 'about', 2, true),
    (v_website_id, v_home_id, 'why_us', 3, true),
    (v_website_id, v_home_id, 'contact', 4, true),
    (v_website_id, v_home_id, 'footer', 5, true),
    (v_website_id, v_properties_id, 'hero', 0, true),
    (v_website_id, v_properties_id, 'property_grid', 1, true),
    (v_website_id, v_properties_id, 'footer', 2, true),
    (v_website_id, v_property_detail_id, 'hero', 0, false),
    (v_website_id, v_property_detail_id, 'property_detail', 1, true),
    (v_website_id, v_property_detail_id, 'contact', 2, true),
    (v_website_id, v_property_detail_id, 'footer', 3, true),
    (v_website_id, v_projects_id, 'hero', 0, true),
    (v_website_id, v_projects_id, 'project_grid', 1, true),
    (v_website_id, v_projects_id, 'footer', 2, true),
    (v_website_id, v_about_id, 'hero', 0, false),
    (v_website_id, v_about_id, 'about', 1, true),
    (v_website_id, v_about_id, 'why_us', 2, true),
    (v_website_id, v_about_id, 'contact', 3, true),
    (v_website_id, v_about_id, 'footer', 4, true),
    (v_website_id, v_contact_id, 'hero', 0, false),
    (v_website_id, v_contact_id, 'contact', 1, true),
    (v_website_id, v_contact_id, 'footer', 2, true);

  return new;
end;
$$;
