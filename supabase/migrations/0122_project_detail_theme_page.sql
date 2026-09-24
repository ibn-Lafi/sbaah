-- Add project detail as a first-class theme editor page.
alter type public.website_page_key add value if not exists 'project_detail';
alter type public.website_section_type add value if not exists 'project_detail';
commit;

insert into public.website_pages(website_id,key)
select w.id,'project_detail'::public.website_page_key from public.websites w
where not exists(select 1 from public.website_pages p where p.website_id=w.id and p.key='project_detail');

insert into public.website_sections(website_id,page_id,type,order_index,is_visible,config)
select p.website_id,p.id,'project_detail'::public.website_section_type,0,true,'{}'::jsonb
from public.website_pages p where p.key='project_detail'
and not exists(select 1 from public.website_sections s where s.page_id=p.id and s.type='project_detail');

insert into public.website_sections(website_id,page_id,type,order_index,is_visible,config)
select p.website_id,p.id,'property_request'::public.website_section_type,1,true,
 jsonb_build_object('title_ar','سجل اهتمامك','body_ar','اترك بياناتك وسيتواصل معك الفريق بخصوص المشروع.')
from public.website_pages p where p.key='project_detail'
and not exists(select 1 from public.website_sections s where s.page_id=p.id and s.type='property_request');
