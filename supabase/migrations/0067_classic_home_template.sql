-- =============================================================================
-- Migration 0067: Classic homepage template provisioning
--
-- Turns the Classic home page into a ready-to-use marketplace template:
-- existing websites receive the complete section library (missing rows only),
-- while future tenants receive the same library directly at provisioning time.
--
-- Existing visibility/order is preserved. Newly-added sections for existing
-- websites stay hidden to avoid unexpectedly changing live customer sites.
-- New tenants get a curated ready-to-use default composition.
-- =============================================================================

-- The section enum was expanded manually in some environments during the
-- Classic rollout. Keep this migration idempotent across those environments.
alter type public.website_section_type add value if not exists 'featured_properties';
alter type public.website_section_type add value if not exists 'latest_properties';
alter type public.website_section_type add value if not exists 'projects_showcase';
alter type public.website_section_type add value if not exists 'properties_by_city';
alter type public.website_section_type add value if not exists 'stats';
alter type public.website_section_type add value if not exists 'services';
alter type public.website_section_type add value if not exists 'faq';
alter type public.website_section_type add value if not exists 'cta';
alter type public.website_section_type add value if not exists 'property_request';
alter type public.website_section_type add value if not exists 'promo_banner';
alter type public.website_section_type add value if not exists 'free_content';
alter type public.website_section_type add value if not exists 'gallery';
alter type public.website_section_type add value if not exists 'video';

commit;

-- Existing sites: add only missing library rows. Do not alter current live
-- visibility/order/config. Hidden rows become available in "Add section".
insert into public.website_sections (website_id, page_id, type, order_index, is_visible, config)
select
  p.website_id,
  p.id,
  library.type::public.website_section_type,
  coalesce((select max(s.order_index) + 1 from public.website_sections s where s.page_id = p.id), 0) + library.position,
  false,
  library.config
from public.website_pages p
cross join (
  values
    ('featured_properties', 0, '{"tone":"default","heading_align":"start","columns":3}'::jsonb),
    ('latest_properties', 1, '{"limit":6,"tone":"soft","heading_align":"start","columns":3}'::jsonb),
    ('projects_showcase', 2, '{"limit":6,"tone":"default","heading_align":"start","columns":3}'::jsonb),
    ('properties_by_city', 3, '{"tone":"soft","heading_align":"start","columns":4}'::jsonb),
    ('stats', 4, '{"tone":"soft","heading_align":"center","columns":4}'::jsonb),
    ('services', 5, '{"tone":"default","heading_align":"start","columns":3}'::jsonb),
    ('faq', 6, '{"tone":"soft","heading_align":"center"}'::jsonb),
    ('cta', 7, '{}'::jsonb),
    ('promo_banner', 8, '{}'::jsonb),
    ('free_content', 9, '{}'::jsonb),
    ('gallery', 10, '{}'::jsonb),
    ('video', 11, '{}'::jsonb)
) as library(type, position, config)
where p.key = 'home'
  and not exists (
    select 1
    from public.website_sections existing
    where existing.page_id = p.id
      and existing.type = library.type::public.website_section_type
  );

-- Future tenants: replace the provisioning function so Classic is immediately
-- useful after activation, while optional author-authored sections remain in
-- the library hidden until configured.
create or replace function public.create_default_website_for_tenant()
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

  insert into website_sections (website_id, page_id, type, order_index, is_visible, config)
  values
    (v_website_id, v_home_id, 'hero', 0, true, '{"variant":"image_search"}'),
    (v_website_id, v_home_id, 'featured_properties', 1, true, '{"tone":"default","heading_align":"start","columns":3}'),
    (v_website_id, v_home_id, 'latest_properties', 2, true, '{"limit":6,"tone":"soft","heading_align":"start","columns":3}'),
    (v_website_id, v_home_id, 'projects_showcase', 3, true, '{"limit":6,"tone":"default","heading_align":"start","columns":3}'),
    (v_website_id, v_home_id, 'properties_by_city', 4, true, '{"tone":"soft","heading_align":"start","columns":4}'),
    (v_website_id, v_home_id, 'about', 5, true, '{}'),
    (v_website_id, v_home_id, 'why_us', 6, true, '{}'),
    (v_website_id, v_home_id, 'stats', 7, false, '{"tone":"soft","heading_align":"center","columns":4}'),
    (v_website_id, v_home_id, 'services', 8, false, '{"tone":"default","heading_align":"start","columns":3}'),
    (v_website_id, v_home_id, 'faq', 9, false, '{"tone":"soft","heading_align":"center"}'),
    (v_website_id, v_home_id, 'cta', 10, false, '{}'),
    (v_website_id, v_home_id, 'promo_banner', 11, false, '{}'),
    (v_website_id, v_home_id, 'free_content', 12, false, '{}'),
    (v_website_id, v_home_id, 'gallery', 13, false, '{}'),
    (v_website_id, v_home_id, 'video', 14, false, '{}'),
    (v_website_id, v_home_id, 'footer', 15, true, '{}'),
    (v_website_id, v_properties_id, 'hero', 0, true, '{"variant":"image"}'),
    (v_website_id, v_properties_id, 'property_grid', 1, true, '{}'),
    (v_website_id, v_properties_id, 'footer', 2, true, '{}'),
    (v_website_id, v_property_detail_id, 'hero', 0, false, '{"variant":"image"}'),
    (v_website_id, v_property_detail_id, 'property_detail', 1, true, '{}'),
    (v_website_id, v_property_detail_id, 'contact', 2, true, '{}'),
    (v_website_id, v_property_detail_id, 'footer', 3, true, '{}'),
    (v_website_id, v_projects_id, 'hero', 0, true, '{"variant":"image"}'),
    (v_website_id, v_projects_id, 'project_grid', 1, true, '{}'),
    (v_website_id, v_projects_id, 'footer', 2, true, '{}');

  return new;
end;
$$;
