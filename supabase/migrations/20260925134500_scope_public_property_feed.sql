-- =============================================================================
-- Public property feed scope
--
-- Keep the legacy public_listing_feed contract unchanged for existing clients,
-- while giving the public website an explicit boundary between standalone
-- properties and assets that belong to a project.
-- =============================================================================

create index if not exists assets_tenant_standalone_public_idx
  on public.assets (tenant_id, created_at desc)
  where project_id is null
    and parent_asset_id is null
    and archived_at is null;

create or replace function public.public_property_feed(
  p_tenant_id uuid,
  p_scope text default 'independent',
  p_project_id uuid default null,
  p_listing_type public.listing_type_v2 default null,
  p_asset_type public.asset_type default null,
  p_city_id uuid default null,
  p_district_id uuid default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_bedrooms integer default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  listing_id uuid,
  listing_number text,
  listing_type public.listing_type_v2,
  title_ar text,
  title_en text,
  description_ar text,
  description_en text,
  asking_price numeric,
  pricing_period public.listing_pricing_period,
  publication_status public.listing_publication_status,
  commercial_status public.listing_commercial_status,
  advertisement_license_number text,
  advertisement_license_expires_at date,
  advertiser_name text,
  published_at timestamptz,
  created_at timestamptz,
  asset_id uuid,
  asset_slug text,
  asset_type public.asset_type,
  asset_name_ar text,
  asset_name_en text,
  project_id uuid,
  parent_asset_id uuid,
  city_id uuid,
  district_id uuid,
  bedrooms smallint,
  bathrooms smallint,
  area_sqm numeric,
  lat double precision,
  lng double precision,
  asset_media jsonb,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.listing_number,
    l.listing_type,
    l.title_ar,
    l.title_en,
    l.description_ar,
    l.description_en,
    l.asking_price,
    l.pricing_period,
    l.publication_status,
    l.commercial_status,
    l.advertisement_license_number,
    l.advertisement_license_expires_at,
    l.advertiser_name,
    l.published_at,
    l.created_at,
    a.id,
    a.slug,
    a.asset_type,
    a.name_ar,
    a.name_en,
    a.project_id,
    a.parent_asset_id,
    a.city_id,
    a.district_id,
    a.bedrooms,
    a.bathrooms,
    a.area_sqm,
    a.lat,
    a.lng,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'media_type', m.media_type,
        'url', m.url,
        'alt_ar', m.alt_ar,
        'alt_en', m.alt_en,
        'order_index', m.order_index,
        'is_primary', m.is_primary
      ) order by m.is_primary desc, m.order_index)
      from public.asset_media m
      where m.tenant_id = p_tenant_id
        and m.asset_id = a.id
    ), '[]'::jsonb),
    count(*) over()
  from public.listings l
  join public.listing_assets la
    on la.listing_id = l.id
   and la.tenant_id = l.tenant_id
  join public.assets a
    on a.id = la.asset_id
   and a.tenant_id = l.tenant_id
  join public.tenants t on t.id = l.tenant_id
  where l.tenant_id = p_tenant_id
    and t.status = 'active'
    and l.publication_status = 'published'
    and l.commercial_status <> 'closed'
    and a.archived_at is null
    and p_scope in ('independent', 'project', 'all')
    and (
      p_scope = 'all'
      or (p_scope = 'independent' and a.project_id is null and a.parent_asset_id is null)
      or (p_scope = 'project' and a.project_id is not null)
    )
    and (p_project_id is null or (p_scope = 'project' and a.project_id = p_project_id))
    and (p_listing_type is null or l.listing_type = p_listing_type)
    and (p_asset_type is null or a.asset_type = p_asset_type)
    and (p_city_id is null or a.city_id = p_city_id)
    and (p_district_id is null or a.district_id = p_district_id)
    and (p_min_price is null or l.asking_price >= p_min_price)
    and (p_max_price is null or l.asking_price <= p_max_price)
    and (p_bedrooms is null or a.bedrooms = p_bedrooms)
  order by l.published_at desc nulls last, l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50))
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke all on function public.public_property_feed(
  uuid, text, uuid, public.listing_type_v2, public.asset_type, uuid, uuid,
  numeric, numeric, integer, integer, integer
) from public;

grant execute on function public.public_property_feed(
  uuid, text, uuid, public.listing_type_v2, public.asset_type, uuid, uuid,
  numeric, numeric, integer, integer, integer
) to anon, authenticated;
