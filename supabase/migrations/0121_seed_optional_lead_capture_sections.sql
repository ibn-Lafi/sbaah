-- Adds the shared CRM lead-capture section to every curated website page.
-- It stays opt-in everywhere except property_detail, where it replaces the
-- legacy hard-coded inquiry form and remains reorderable/hideable by the tenant.
insert into public.website_sections (website_id, page_id, type, order_index, is_visible, config)
select
  wp.website_id,
  wp.id,
  'property_request'::website_section_type,
  coalesce((select max(ws.order_index) + 1 from public.website_sections ws where ws.page_id = wp.id), 0),
  (wp.key = 'property_detail'),
  '{"title_ar":"سجل اهتمامك","body_ar":"اترك بياناتك وسيتواصل معك الفريق قريبًا."}'::jsonb
from public.website_pages wp
where wp.key in ('home','properties','property_detail','projects')
  and not exists (
    select 1 from public.website_sections existing
    where existing.page_id = wp.id and existing.type = 'property_request'::website_section_type
  );

update public.website_sections ws
set is_visible = true
from public.website_pages wp
where ws.page_id = wp.id
  and wp.key = 'property_detail'
  and ws.type = 'property_request'::website_section_type;
