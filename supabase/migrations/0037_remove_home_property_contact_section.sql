-- =============================================================================
-- Migration 0037: remove the "تواصل معنا" (contact) section from the home
-- and property_detail pages, permanently — founder's explicit call: the
-- footer already carries the tenant's phone/WhatsApp/address (migration
-- 0035's footer redesign), and the property_detail page already has its
-- own property-specific WhatsApp button + inquiry form, so a second
-- generic "تواصل معنا" block on either page was redundant. The /about
-- and /contact pages keep their `contact` section untouched — that's
-- the actual purpose of the /contact page.
--
-- Two parts: (1) existing tenants — delete the now-unwanted rows outright
-- (public-site's rendering already ignores them unconditionally as of
-- this same change, but leaving dead rows would still show a pointless
-- "تواصل" toggle in the dashboard's site editor); (2) new tenants —
-- `create_default_website_for_tenant()` (migration 0024, last replaced
-- in 0032) must stop seeding these two rows going forward.
-- =============================================================================

delete from website_sections
where type = 'contact'
  and page_id in (
    select wp.id
    from website_pages wp
    where wp.key in ('home', 'property_detail')
  );

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
