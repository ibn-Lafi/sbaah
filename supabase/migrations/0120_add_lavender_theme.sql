-- Theme marketplace: add the Lavender presentation without changing tenant content.
insert into public.themes (key,name_ar,name_en,is_active,order_index)
values ('lavender','الخزامى','Lavender',true,1)
on conflict (key) do update
set name_ar=excluded.name_ar,name_en=excluded.name_en,is_active=excluded.is_active,order_index=excluded.order_index;
