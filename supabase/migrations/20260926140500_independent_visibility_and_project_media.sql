-- Public visibility is independent from commercial listings.
-- Project-owned assets inherit geographic context from their parent/project and do not expose duplicate asset media.
alter table public.assets add column if not exists is_public boolean not null default false;
alter table public.projects add column if not exists is_public boolean not null default false;

create index if not exists assets_tenant_public_idx on public.assets(tenant_id,created_at desc) where is_public=true and archived_at is null;
create index if not exists projects_tenant_public_idx on public.projects(tenant_id,created_at desc) where is_public=true;

-- Existing content that was already explicitly public remains public.
update public.projects set is_public=true where status='published' and is_public=false;
update public.assets a set is_public=true where is_public=false and exists (
  select 1 from public.listing_assets la join public.listings l on l.id=la.listing_id and l.tenant_id=la.tenant_id
  where la.asset_id=a.id and la.tenant_id=a.tenant_id and l.publication_status='published' and l.commercial_status<>'closed'
);
update public.assets a set is_public=true where is_public=false and exists (
  select 1 from public.website_sections ws join public.websites w on w.id=ws.website_id
  where w.tenant_id=a.tenant_id and ws.type='featured_properties'
    and coalesce(ws.config->'property_ids','[]'::jsonb) ? a.id::text
);

-- NOTE: public_asset_catalog_feed/public_asset_detail/public_projects_feed/public_project_detail
-- are installed in production by migrations independent_public_visibility_and_asset_inheritance
-- and enforce_project_level_media_public_feed. Their canonical definitions should be kept in
-- the schema snapshot on the next database consolidation.
