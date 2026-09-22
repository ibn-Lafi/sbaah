-- =============================================================================
-- Migration 0102: Safe project-scoped public listing feed
-- Keeps public project inventory on published Listings -> Assets only.
-- =============================================================================

create or replace function public_project_listing_feed(
  p_tenant_id uuid,
  p_project_id uuid,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  listing_id uuid,
  listing_number text,
  listing_type listing_type_v2,
  title_ar text,
  title_en text,
  asking_price numeric,
  pricing_period listing_pricing_period,
  commercial_status listing_commercial_status,
  asset_id uuid,
  asset_slug text,
  asset_type asset_type,
  asset_name_ar text,
  asset_name_en text,
  unit_type_id uuid,
  phase_id uuid,
  unit_number text,
  floor_number smallint,
  area_sqm numeric,
  bedrooms smallint,
  bathrooms smallint,
  asset_media jsonb,
  total_count bigint
)
language sql
stable
security definer
set search_path=public
as $$
  select
    l.id,
    l.listing_number,
    l.listing_type,
    l.title_ar,
    l.title_en,
    l.asking_price,
    l.pricing_period,
    l.commercial_status,
    a.id,
    a.slug,
    a.asset_type,
    a.name_ar,
    a.name_en,
    a.unit_type_id,
    a.phase_id,
    a.unit_number,
    a.floor_number,
    a.area_sqm,
    a.bedrooms,
    a.bathrooms,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',m.id,
          'media_type',m.media_type,
          'url',m.url,
          'alt_ar',m.alt_ar,
          'alt_en',m.alt_en,
          'order_index',m.order_index,
          'is_primary',m.is_primary
        )
        order by m.is_primary desc,m.order_index
      )
      from asset_media m
      where m.tenant_id=p_tenant_id
        and m.asset_id=a.id
    ),'[]'::jsonb),
    count(*) over()
  from listings l
  join listing_assets la
    on la.listing_id=l.id
   and la.tenant_id=l.tenant_id
  join assets a
    on a.id=la.asset_id
   and a.tenant_id=l.tenant_id
  join projects p
    on p.id=a.project_id
   and p.tenant_id=a.tenant_id
  join tenants t
    on t.id=l.tenant_id
  where l.tenant_id=p_tenant_id
    and a.project_id=p_project_id
    and p.status='published'
    and t.status='active'
    and l.publication_status='published'
    and l.commercial_status<>'closed'
    and a.archived_at is null
  order by l.published_at desc nulls last,l.created_at desc
  limit greatest(1,least(coalesce(p_limit,50),100))
  offset greatest(coalesce(p_offset,0),0)
$$;

revoke all on function public_project_listing_feed(uuid,uuid,integer,integer) from public;
grant execute on function public_project_listing_feed(uuid,uuid,integer,integer) to anon,authenticated;
