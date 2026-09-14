-- =============================================================================
-- Migration 0044: خريطة تفاعلية للعقارات/المشاريع/العمارات
--
-- Founder's request: عند إضافة عقار/مشروع/عمارة يمكن تحديد موقعه على
-- خريطة، وقسم اختياري جديد بالثيم الأساسي ("الخريطة") يعرض كل عقارات/
-- مشاريع/عمائر صاحب الموقع كنقاط على خريطة عامة.
--
-- `properties.lat`/`lng` already exist (migration 0003) — only
-- `projects`/`buildings` are missing the columns here. Both nullable:
-- setting a location stays optional, matching how lat/lng already behave
-- on properties (propertyInputSchema.lat/lng are optional/nullable).
--
-- `map` follows the exact same new-section-type pattern as
-- `broker_marketer_form` (migration 0032): add the enum value, commit,
-- then backfill existing tenants' home page (hidden by default — opt-in,
-- nothing changes for a tenant until they explicitly turn it on) and
-- update create_default_website_for_tenant() for future tenants.
-- =============================================================================

alter table projects add column lat double precision;
alter table projects add column lng double precision;

alter table buildings add column lat double precision;
alter table buildings add column lng double precision;

alter type website_section_type add value if not exists 'map';

commit;

-- ---------------------------------------------------------------------------
-- Seed the new (hidden by default) section on every existing tenant's
-- home page — order_index placed last so it doesn't reflow whatever the
-- tenant already arranged.
-- ---------------------------------------------------------------------------
insert into website_sections (website_id, page_id, type, order_index, is_visible)
select
  wp.website_id,
  wp.id,
  'map',
  coalesce((select max(order_index) + 1 from website_sections where page_id = wp.id), 0),
  false
from website_pages wp
where wp.key = 'home';

-- ---------------------------------------------------------------------------
-- New tenants: create_default_website_for_tenant() (last replaced in
-- migration 0038) must also seed this section on their home page.
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
begin
  select id into v_theme_id from themes where is_active = true order by order_index limit 1;

  insert into websites (tenant_id, theme_id)
  values (new.id, v_theme_id)
  returning id into v_website_id;

  insert into website_pages (website_id, key) values (v_website_id, 'home') returning id into v_home_id;
  insert into website_pages (website_id, key) values (v_website_id, 'properties') returning id into v_properties_id;
  insert into website_pages (website_id, key) values (v_website_id, 'property_detail') returning id into v_property_detail_id;
  insert into website_pages (website_id, key) values (v_website_id, 'projects') returning id into v_projects_id;

  insert into website_sections (website_id, page_id, type, order_index, is_visible)
  values
    (v_website_id, v_home_id, 'hero', 0, true),
    (v_website_id, v_home_id, 'property_grid', 1, true),
    (v_website_id, v_home_id, 'about', 2, true),
    (v_website_id, v_home_id, 'why_us', 3, true),
    (v_website_id, v_home_id, 'map', 4, false),
    (v_website_id, v_home_id, 'broker_marketer_form', 5, false),
    (v_website_id, v_home_id, 'footer', 6, true),
    (v_website_id, v_properties_id, 'hero', 0, true),
    (v_website_id, v_properties_id, 'property_grid', 1, true),
    (v_website_id, v_properties_id, 'footer', 2, true),
    (v_website_id, v_property_detail_id, 'hero', 0, false),
    (v_website_id, v_property_detail_id, 'property_detail', 1, true),
    (v_website_id, v_property_detail_id, 'broker_marketer_form', 2, false),
    (v_website_id, v_property_detail_id, 'footer', 3, true),
    (v_website_id, v_projects_id, 'hero', 0, true),
    (v_website_id, v_projects_id, 'project_grid', 1, true),
    (v_website_id, v_projects_id, 'footer', 2, true);

  return new;
end;
$$;
