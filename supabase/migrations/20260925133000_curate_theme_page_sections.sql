-- Keep every website's fixed page set complete and give each page a curated
-- section library. Existing content, visibility, order and config are never
-- overwritten; missing optional sections are added hidden.

insert into public.website_pages (website_id, key)
select w.id, page_key::public.website_page_key
from public.websites w
cross join unnest(array['home', 'properties', 'property_detail', 'projects', 'project_detail']) as page_keys(page_key)
where not exists (
  select 1
  from public.website_pages existing
  where existing.website_id = w.id
    and existing.key = page_key::public.website_page_key
);

with section_library(page_key, type, position, is_visible, config) as (
  values
    ('home', 'hero', 0, true, '{"variant":"image_search","search_mode":"both"}'::jsonb),
    ('home', 'projects_showcase', 1, false, '{"limit":6,"tone":"default","heading_align":"start","columns":3}'::jsonb),
    ('home', 'featured_properties', 2, false, '{"tone":"default","heading_align":"start","columns":3}'::jsonb),
    ('home', 'latest_properties', 3, false, '{"limit":6,"tone":"soft","heading_align":"start","columns":3}'::jsonb),
    ('home', 'services', 4, false, '{"tone":"default","heading_align":"start","columns":3}'::jsonb),
    ('home', 'about', 5, false, '{}'::jsonb),
    ('home', 'why_us', 6, false, '{}'::jsonb),
    ('home', 'stats', 7, false, '{"tone":"soft","heading_align":"center","columns":4}'::jsonb),
    ('home', 'properties_by_city', 8, false, '{"tone":"soft","heading_align":"start","columns":4}'::jsonb),
    ('home', 'map', 9, false, '{}'::jsonb),
    ('home', 'gallery', 10, false, '{}'::jsonb),
    ('home', 'video', 11, false, '{}'::jsonb),
    ('home', 'faq', 12, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
    ('home', 'property_request', 13, false, '{"title_ar":"سجل اهتمامك","body_ar":"اترك بياناتك وسيتواصل معك الفريق قريبًا."}'::jsonb),
    ('home', 'cta', 14, false, '{}'::jsonb),
    ('home', 'promo_banner', 15, false, '{}'::jsonb),
    ('home', 'free_content', 16, false, '{}'::jsonb),
    ('home', 'footer', 17, true, '{}'::jsonb),

    ('properties', 'hero', 0, true, '{"variant":"image_search","search_mode":"properties"}'::jsonb),
    ('properties', 'property_grid', 1, true, '{}'::jsonb),
    ('properties', 'properties_by_city', 2, false, '{"tone":"soft","heading_align":"start","columns":4}'::jsonb),
    ('properties', 'map', 3, false, '{}'::jsonb),
    ('properties', 'property_request', 4, false, '{"title_ar":"لم تجد العقار المناسب؟","body_ar":"أرسل متطلباتك وسيتواصل معك الفريق."}'::jsonb),
    ('properties', 'free_content', 5, false, '{}'::jsonb),
    ('properties', 'faq', 6, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
    ('properties', 'cta', 7, false, '{}'::jsonb),
    ('properties', 'footer', 8, true, '{}'::jsonb),

    ('property_detail', 'hero', 0, false, '{"variant":"image","search_mode":"none"}'::jsonb),
    ('property_detail', 'property_detail', 1, true, '{}'::jsonb),
    ('property_detail', 'property_request', 2, true, '{"title_ar":"سجل اهتمامك بالعقار","body_ar":"اترك بياناتك وسيتواصل معك الفريق بخصوص هذا العقار."}'::jsonb),
    ('property_detail', 'map', 3, false, '{}'::jsonb),
    ('property_detail', 'free_content', 4, false, '{}'::jsonb),
    ('property_detail', 'faq', 5, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
    ('property_detail', 'cta', 6, false, '{}'::jsonb),
    ('property_detail', 'footer', 7, true, '{}'::jsonb),

    ('projects', 'hero', 0, true, '{"variant":"image_search","search_mode":"projects"}'::jsonb),
    ('projects', 'project_grid', 1, true, '{}'::jsonb),
    ('projects', 'stats', 2, false, '{"tone":"soft","heading_align":"center","columns":4}'::jsonb),
    ('projects', 'map', 3, false, '{}'::jsonb),
    ('projects', 'property_request', 4, false, '{"title_ar":"مهتم بأحد مشاريعنا؟","body_ar":"اترك بياناتك وسيتواصل معك الفريق."}'::jsonb),
    ('projects', 'free_content', 5, false, '{}'::jsonb),
    ('projects', 'faq', 6, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
    ('projects', 'cta', 7, false, '{}'::jsonb),
    ('projects', 'footer', 8, true, '{}'::jsonb),

    ('project_detail', 'hero', 0, false, '{"variant":"image","search_mode":"none"}'::jsonb),
    ('project_detail', 'project_detail', 1, true, '{}'::jsonb),
    ('project_detail', 'property_request', 2, true, '{"title_ar":"سجل اهتمامك بالمشروع","body_ar":"اترك بياناتك وسيتواصل معك الفريق بخصوص هذا المشروع."}'::jsonb),
    ('project_detail', 'map', 3, false, '{}'::jsonb),
    ('project_detail', 'free_content', 4, false, '{}'::jsonb),
    ('project_detail', 'faq', 5, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
    ('project_detail', 'cta', 6, false, '{}'::jsonb),
    ('project_detail', 'footer', 7, true, '{}'::jsonb)
)
insert into public.website_sections (website_id, page_id, type, order_index, is_visible, config)
select
  page.website_id,
  page.id,
  library.type::public.website_section_type,
  coalesce((select max(existing.order_index) + 1 from public.website_sections existing where existing.page_id = page.id), 0)
    + library.position,
  case
    when library.type in ('property_grid', 'property_detail', 'project_grid', 'project_detail', 'footer') then true
    when library.type = 'property_request' and page.key in ('property_detail', 'project_detail') then true
    else false
  end,
  library.config
from public.website_pages page
join section_library library on library.page_key = page.key::text
where not exists (
  select 1
  from public.website_sections existing
  where existing.page_id = page.id
    and existing.type = library.type::public.website_section_type
);

create or replace function public.create_default_website_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme_id uuid;
  v_website_id uuid;
begin
  select id
  into v_theme_id
  from public.themes
  where is_active = true
  order by order_index
  limit 1;

  insert into public.websites (tenant_id, theme_id)
  values (new.id, v_theme_id)
  returning id into v_website_id;

  insert into public.website_pages (website_id, key)
  select v_website_id, page_key::public.website_page_key
  from unnest(array['home', 'properties', 'property_detail', 'projects', 'project_detail']) as page_keys(page_key);

  insert into public.website_sections (website_id, page_id, type, order_index, is_visible, config)
  select
    v_website_id,
    page.id,
    library.type::public.website_section_type,
    library.position,
    library.is_visible,
    library.config
  from public.website_pages page
  join (
    values
      ('home', 'hero', 0, true, '{"variant":"image_search","search_mode":"both"}'::jsonb),
      ('home', 'projects_showcase', 1, true, '{"limit":6,"tone":"default","heading_align":"start","columns":3}'::jsonb),
      ('home', 'featured_properties', 2, true, '{"tone":"default","heading_align":"start","columns":3}'::jsonb),
      ('home', 'latest_properties', 3, false, '{"limit":6,"tone":"soft","heading_align":"start","columns":3}'::jsonb),
      ('home', 'services', 4, true, '{"tone":"default","heading_align":"start","columns":3}'::jsonb),
      ('home', 'about', 5, true, '{}'::jsonb),
      ('home', 'why_us', 6, false, '{}'::jsonb),
      ('home', 'stats', 7, true, '{"tone":"soft","heading_align":"center","columns":4}'::jsonb),
      ('home', 'properties_by_city', 8, false, '{"tone":"soft","heading_align":"start","columns":4}'::jsonb),
      ('home', 'map', 9, false, '{}'::jsonb),
      ('home', 'gallery', 10, false, '{}'::jsonb),
      ('home', 'video', 11, false, '{}'::jsonb),
      ('home', 'faq', 12, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
      ('home', 'property_request', 13, true, '{"title_ar":"سجل اهتمامك","body_ar":"اترك بياناتك وسيتواصل معك الفريق قريبًا."}'::jsonb),
      ('home', 'cta', 14, false, '{}'::jsonb),
      ('home', 'promo_banner', 15, false, '{}'::jsonb),
      ('home', 'free_content', 16, false, '{}'::jsonb),
      ('home', 'footer', 17, true, '{}'::jsonb),

      ('properties', 'hero', 0, true, '{"variant":"image_search","search_mode":"properties"}'::jsonb),
      ('properties', 'property_grid', 1, true, '{}'::jsonb),
      ('properties', 'properties_by_city', 2, false, '{"tone":"soft","heading_align":"start","columns":4}'::jsonb),
      ('properties', 'map', 3, false, '{}'::jsonb),
      ('properties', 'property_request', 4, false, '{"title_ar":"لم تجد العقار المناسب؟","body_ar":"أرسل متطلباتك وسيتواصل معك الفريق."}'::jsonb),
      ('properties', 'free_content', 5, false, '{}'::jsonb),
      ('properties', 'faq', 6, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
      ('properties', 'cta', 7, false, '{}'::jsonb),
      ('properties', 'footer', 8, true, '{}'::jsonb),

      ('property_detail', 'hero', 0, false, '{"variant":"image","search_mode":"none"}'::jsonb),
      ('property_detail', 'property_detail', 1, true, '{}'::jsonb),
      ('property_detail', 'property_request', 2, true, '{"title_ar":"سجل اهتمامك بالعقار","body_ar":"اترك بياناتك وسيتواصل معك الفريق بخصوص هذا العقار."}'::jsonb),
      ('property_detail', 'map', 3, false, '{}'::jsonb),
      ('property_detail', 'free_content', 4, false, '{}'::jsonb),
      ('property_detail', 'faq', 5, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
      ('property_detail', 'cta', 6, false, '{}'::jsonb),
      ('property_detail', 'footer', 7, true, '{}'::jsonb),

      ('projects', 'hero', 0, true, '{"variant":"image_search","search_mode":"projects"}'::jsonb),
      ('projects', 'project_grid', 1, true, '{}'::jsonb),
      ('projects', 'stats', 2, false, '{"tone":"soft","heading_align":"center","columns":4}'::jsonb),
      ('projects', 'map', 3, false, '{}'::jsonb),
      ('projects', 'property_request', 4, false, '{"title_ar":"مهتم بأحد مشاريعنا؟","body_ar":"اترك بياناتك وسيتواصل معك الفريق."}'::jsonb),
      ('projects', 'free_content', 5, false, '{}'::jsonb),
      ('projects', 'faq', 6, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
      ('projects', 'cta', 7, false, '{}'::jsonb),
      ('projects', 'footer', 8, true, '{}'::jsonb),

      ('project_detail', 'hero', 0, false, '{"variant":"image","search_mode":"none"}'::jsonb),
      ('project_detail', 'project_detail', 1, true, '{}'::jsonb),
      ('project_detail', 'property_request', 2, true, '{"title_ar":"سجل اهتمامك بالمشروع","body_ar":"اترك بياناتك وسيتواصل معك الفريق بخصوص هذا المشروع."}'::jsonb),
      ('project_detail', 'map', 3, false, '{}'::jsonb),
      ('project_detail', 'free_content', 4, false, '{}'::jsonb),
      ('project_detail', 'faq', 5, false, '{"tone":"soft","heading_align":"center"}'::jsonb),
      ('project_detail', 'cta', 6, false, '{}'::jsonb),
      ('project_detail', 'footer', 7, true, '{}'::jsonb)
  ) as library(page_key, type, position, is_visible, config)
    on library.page_key = page.key::text
  where page.website_id = v_website_id;

  return new;
end;
$$;
