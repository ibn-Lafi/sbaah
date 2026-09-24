-- Structured media for projects, properties and units.
-- Categories drive public presentation order; order_index only orders items within a category.
alter table public.asset_media add column if not exists category text not null default 'general';
alter table public.asset_media drop constraint if exists asset_media_category_check;
alter table public.asset_media add constraint asset_media_category_check check (category in ('general','exterior','entrance','living','bedrooms','kitchen','bathrooms','outdoor','amenities','parking','floor_plan','location','view','construction','other'));

create table if not exists public.project_media (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade,
 media_type public.media_type not null, category text not null default 'general' check(category in ('general','exterior','master_plan','unit_plans','interior','amenities','location','construction','other')),
 url text not null, alt_ar text, alt_en text, order_index integer not null default 0 check(order_index>=0), is_primary boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists project_media_project_order_idx on public.project_media(tenant_id,project_id,category,order_index);
create unique index if not exists project_media_one_primary_idx on public.project_media(project_id) where is_primary;
alter table public.project_media enable row level security;
create policy project_media_tenant_select on public.project_media for select to authenticated using(tenant_id=auth_tenant_id());
create policy project_media_owner_admin_insert on public.project_media for insert to authenticated with check(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin'));
create policy project_media_owner_admin_update on public.project_media for update to authenticated using(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin')) with check(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin'));
create policy project_media_owner_admin_delete on public.project_media for delete to authenticated using(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin'));
create policy property_media_storage_owner_admin_manage on storage.objects for all to authenticated using(bucket_id='property-media' and (storage.foldername(name))[1]=auth_tenant_id()::text and auth_user_role() in ('owner','admin')) with check(bucket_id='property-media' and (storage.foldername(name))[1]=auth_tenant_id()::text and auth_user_role() in ('owner','admin'));
-- public_project_detail is redefined in production migration to include categorized project_media and categorized unit media.
