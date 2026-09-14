-- =============================================================================
-- Migration 0038: remove the "من نحن" (about) and "تواصل معنا" (contact)
-- pages entirely — founder's explicit call: the classic theme only has 4
-- real pages (الرئيسية/العقارات/تفاصيل العقار/المشاريع); /about and
-- /contact were leftover from migration 0024's original 6-page design but
-- nothing in the site links to them anymore (nav only has
-- properties/projects since migration 0046's header rewrite, and the
-- generic "تواصل معنا" section was already dropped from home/property_detail
-- in migration 0037).
--
-- Three parts: (1) existing tenants — delete the now-unwanted `website_pages`
-- rows (cascades to their `website_sections` via page_id FK); (2) new
-- tenants — `create_default_website_for_tenant()` (last replaced in 0037)
-- must stop seeding these two pages going forward; (3) the `website_page_key`
-- enum keeps its unused 'about'/'contact' values (Postgres can't drop enum
-- values in place, and a full type-rebuild is unnecessary risk for two
-- values the application will simply never reference again).
-- =============================================================================

delete from website_pages
where key in ('about', 'contact');

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
    (v_website_id, v_home_id, 'broker_marketer_form', 4, false),
    (v_website_id, v_home_id, 'footer', 5, true),
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
