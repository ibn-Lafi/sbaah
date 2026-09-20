-- =============================================================================
-- Migration 0076: Safe public listing feed
-- Public website reads published Listings -> Assets -> Asset Media only.
-- =============================================================================

create or replace function public_listing_feed(
  p_tenant_id uuid,
  p_listing_type listing_type_v2 default null,
  p_asset_type asset_type default null,
  p_city_id uuid default null,
  p_district_id uuid default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_bedrooms integer default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  listing_id uuid, listing_number text, listing_type listing_type_v2,
  title_ar text, title_en text, description_ar text, description_en text,
  asking_price numeric, pricing_period listing_pricing_period,
  publication_status listing_publication_status, commercial_status listing_commercial_status,
  advertisement_license_number text, advertisement_license_expires_at date, advertiser_name text,
  published_at timestamptz, created_at timestamptz,
  asset_id uuid, asset_slug text, asset_type asset_type, asset_name_ar text, asset_name_en text,
  city_id uuid, district_id uuid, bedrooms smallint, bathrooms smallint, area_sqm numeric,
  asset_media jsonb, total_count bigint
)
language sql
stable
security definer
set search_path=public
as $$
  select l.id,l.listing_number,l.listing_type,l.title_ar,l.title_en,l.description_ar,l.description_en,
    l.asking_price,l.pricing_period,l.publication_status,l.commercial_status,
    l.advertisement_license_number,l.advertisement_license_expires_at,l.advertiser_name,
    l.published_at,l.created_at,
    a.id,a.slug,a.asset_type,a.name_ar,a.name_en,a.city_id,a.district_id,a.bedrooms,a.bathrooms,a.area_sqm,
    coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'media_type',m.media_type,'url',m.url,'alt_ar',m.alt_ar,'alt_en',m.alt_en,'order_index',m.order_index,'is_primary',m.is_primary) order by m.is_primary desc,m.order_index) from asset_media m where m.tenant_id=p_tenant_id and m.asset_id=a.id),'[]'::jsonb),
    count(*) over()
  from listings l
  join listing_assets la on la.listing_id=l.id and la.tenant_id=l.tenant_id
  join assets a on a.id=la.asset_id and a.tenant_id=l.tenant_id
  join tenants t on t.id=l.tenant_id
  where l.tenant_id=p_tenant_id and t.status='active'
    and l.publication_status='published' and l.commercial_status<>'closed'
    and a.archived_at is null
    and (p_listing_type is null or l.listing_type=p_listing_type)
    and (p_asset_type is null or a.asset_type=p_asset_type)
    and (p_city_id is null or a.city_id=p_city_id)
    and (p_district_id is null or a.district_id=p_district_id)
    and (p_min_price is null or l.asking_price>=p_min_price)
    and (p_max_price is null or l.asking_price<=p_max_price)
    and (p_bedrooms is null or a.bedrooms=p_bedrooms)
  order by l.published_at desc nulls last,l.created_at desc
  limit greatest(1,least(coalesce(p_limit,20),50))
  offset greatest(coalesce(p_offset,0),0)
$$;

create or replace function public_listing_detail(p_tenant_id uuid,p_identifier text)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
 select to_jsonb(x) from (
  select l.*, jsonb_agg(jsonb_build_object(
   'asset_id',a.id,'slug',a.slug,'reference_number',a.reference_number,'asset_type',a.asset_type,
   'name_ar',a.name_ar,'name_en',a.name_en,'description_ar',a.description_ar,'description_en',a.description_en,
   'unit_number',a.unit_number,'floor_number',a.floor_number,'city_id',a.city_id,'district_id',a.district_id,
   'lat',a.lat,'lng',a.lng,'area_sqm',a.area_sqm,'land_area',a.land_area,'built_area',a.built_area,
   'street_width',a.street_width,'frontage',a.frontage,'bedrooms',a.bedrooms,'bathrooms',a.bathrooms,
   'floors_count',a.floors_count,'parking_count',a.parking_count,'elevators_count',a.elevators_count,
   'furnishing',a.furnishing,'property_age',a.property_age,'physical_status',a.physical_status,
   'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'media_type',m.media_type,'url',m.url,'alt_ar',m.alt_ar,'alt_en',m.alt_en,'order_index',m.order_index,'is_primary',m.is_primary) order by m.is_primary desc,m.order_index) from asset_media m where m.tenant_id=p_tenant_id and m.asset_id=a.id),'[]'::jsonb)
  )) as assets
  from listings l
  join listing_assets la on la.listing_id=l.id and la.tenant_id=l.tenant_id
  join assets a on a.id=la.asset_id and a.tenant_id=l.tenant_id
  join tenants t on t.id=l.tenant_id
  where l.tenant_id=p_tenant_id and t.status='active' and l.publication_status='published' and l.commercial_status<>'closed'
    and a.archived_at is null
    and (l.id::text=p_identifier or l.listing_number=p_identifier or a.slug=p_identifier)
  group by l.id
  limit 1
 ) x
$$;

revoke all on function public_listing_feed(uuid,listing_type_v2,asset_type,uuid,uuid,numeric,numeric,integer,integer,integer) from public;
revoke all on function public_listing_detail(uuid,text) from public;
grant execute on function public_listing_feed(uuid,listing_type_v2,asset_type,uuid,uuid,numeric,numeric,integer,integer,integer) to anon,authenticated;
grant execute on function public_listing_detail(uuid,text) to anon,authenticated;
