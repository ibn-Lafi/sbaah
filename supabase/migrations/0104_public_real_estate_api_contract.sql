-- =============================================================================
-- Migration 0104: Public real-estate API contract
-- Explicit public projection for listings/projects + map coordinates.
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
  lat double precision, lng double precision,
  asset_media jsonb, total_count bigint
)
language sql stable security definer set search_path=public
as $$
  select l.id,l.listing_number,l.listing_type,l.title_ar,l.title_en,l.description_ar,l.description_en,
    l.asking_price,l.pricing_period,l.publication_status,l.commercial_status,
    l.advertisement_license_number,l.advertisement_license_expires_at,l.advertiser_name,
    l.published_at,l.created_at,
    a.id,a.slug,a.asset_type,a.name_ar,a.name_en,a.city_id,a.district_id,a.bedrooms,a.bathrooms,a.area_sqm,
    a.lat,a.lng,
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'media_type',m.media_type,'url',m.url,'alt_ar',m.alt_ar,'alt_en',m.alt_en,
      'order_index',m.order_index,'is_primary',m.is_primary
    ) order by m.is_primary desc,m.order_index)
    from asset_media m where m.tenant_id=p_tenant_id and m.asset_id=a.id),'[]'::jsonb),
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

revoke all on function public_listing_feed(uuid,listing_type_v2,asset_type,uuid,uuid,numeric,numeric,integer,integer,integer) from public;
grant execute on function public_listing_feed(uuid,listing_type_v2,asset_type,uuid,uuid,numeric,numeric,integer,integer,integer) to anon,authenticated;

create or replace function public_project_detail(p_tenant_id uuid,p_identifier text)
returns jsonb
language sql stable security definer set search_path=public
as $$
  select jsonb_build_object(
    'project',jsonb_build_object(
      'id',p.id,'slug',p.slug,'name_ar',p.name_ar,'name_en',p.name_en,
      'description_ar',p.description_ar,'description_en',p.description_en,
      'city_id',p.city_id,'district_id',p.district_id,'lat',p.lat,'lng',p.lng
    ),
    'media',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',pm.id,'url',pm.url,'media_type',pm.media_type,'alt_ar',pm.alt_ar,'alt_en',pm.alt_en,'order_index',pm.order_index
      ) order by pm.order_index)
      from project_media pm where pm.tenant_id=p_tenant_id and pm.project_id=p.id
    ),'[]'::jsonb),
    'unit_types',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',ut.id,'name_ar',ut.name_ar,'name_en',ut.name_en,'asset_type',ut.asset_type,'specifications',ut.specifications
      ) order by ut.name_ar)
      from unit_types ut where ut.tenant_id=p_tenant_id and ut.project_id=p.id
    ),'[]'::jsonb),
    'units',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'slug',a.slug,'unit_type_id',a.unit_type_id,'phase_id',a.phase_id,
        'unit_number',a.unit_number,'floor_number',a.floor_number,'area_sqm',a.area_sqm,
        'asset_type',a.asset_type,'name_ar',a.name_ar,'name_en',a.name_en,
        'listing_id',l.id,'listing_number',l.listing_number,'listing_type',l.listing_type,
        'price',l.asking_price,'pricing_period',l.pricing_period,
        'media',coalesce((select jsonb_agg(jsonb_build_object(
          'id',am.id,'media_type',am.media_type,'url',am.url,'alt_ar',am.alt_ar,'alt_en',am.alt_en,
          'order_index',am.order_index,'is_primary',am.is_primary
        ) order by am.is_primary desc,am.order_index)
        from asset_media am where am.tenant_id=p_tenant_id and am.asset_id=a.id),'[]'::jsonb)
      ) order by l.published_at desc nulls last,l.created_at desc)
      from assets a
      join listing_assets la on la.tenant_id=a.tenant_id and la.asset_id=a.id
      join listings l on l.tenant_id=la.tenant_id and l.id=la.listing_id
      where a.tenant_id=p_tenant_id and a.project_id=p.id and a.archived_at is null
        and l.publication_status='published' and l.commercial_status<>'closed'
    ),'[]'::jsonb)
  )
  from projects p join tenants t on t.id=p.tenant_id
  where p.tenant_id=p_tenant_id and t.status='active' and p.status='published'
    and (p.id::text=p_identifier or p.slug=p_identifier)
  limit 1
$$;

revoke all on function public_project_detail(uuid,text) from public;
grant execute on function public_project_detail(uuid,text) to anon,authenticated;

create or replace function public_projects_feed(
  p_tenant_id uuid,p_limit integer default 20,p_offset integer default 0
)
returns table(
  id uuid,slug text,name_ar text,name_en text,description_ar text,description_en text,
  city_id uuid,district_id uuid,lat double precision,lng double precision,media jsonb,total_count bigint
)
language sql stable security definer set search_path=public
as $$
  select p.id,p.slug,p.name_ar,p.name_en,p.description_ar,p.description_en,p.city_id,p.district_id,p.lat,p.lng,
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',pm.id,'url',pm.url,'media_type',pm.media_type,'alt_ar',pm.alt_ar,'alt_en',pm.alt_en,'order_index',pm.order_index
    ) order by pm.order_index) from project_media pm where pm.tenant_id=p_tenant_id and pm.project_id=p.id),'[]'::jsonb),
    count(*) over()
  from projects p join tenants t on t.id=p.tenant_id
  where p.tenant_id=p_tenant_id and t.status='active' and p.status='published'
  order by p.created_at desc
  limit greatest(1,least(coalesce(p_limit,20),50))
  offset greatest(coalesce(p_offset,0),0)
$$;

revoke all on function public_projects_feed(uuid,integer,integer) from public;
grant execute on function public_projects_feed(uuid,integer,integer) to anon,authenticated;
