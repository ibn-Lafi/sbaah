-- Public property catalog is asset-driven. A property is visible independently of sale/rent listing lifecycle.
create or replace function public.public_asset_catalog_feed(
  p_tenant_id uuid, p_scope text default 'independent', p_project_id uuid default null,
  p_asset_type public.asset_type default null, p_city_id uuid default null, p_district_id uuid default null,
  p_bedrooms integer default null, p_limit integer default 20, p_offset integer default 0
)
returns table (
  asset_id uuid, asset_slug text, asset_type public.asset_type, asset_name_ar text, asset_name_en text,
  description_ar text, description_en text, project_id uuid, parent_asset_id uuid, city_id uuid, district_id uuid,
  bedrooms smallint, bathrooms smallint, area_sqm numeric, lat double precision, lng double precision,
  listing_id uuid, listing_number text, listing_type public.listing_type_v2, asking_price numeric,
  pricing_period public.listing_pricing_period, commercial_status public.listing_commercial_status,
  created_at timestamptz, asset_media jsonb, total_count bigint
)
language sql stable security definer set search_path=public
as $$
 select a.id,a.slug,a.asset_type,a.name_ar,a.name_en,a.description_ar,a.description_en,a.project_id,a.parent_asset_id,
 a.city_id,a.district_id,a.bedrooms,a.bathrooms,a.area_sqm,a.lat,a.lng,l.id,l.listing_number,l.listing_type,l.asking_price,
 l.pricing_period,l.commercial_status,a.created_at,
 coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'media_type',m.media_type,'url',m.url,'alt_ar',m.alt_ar,'alt_en',m.alt_en,'order_index',m.order_index,'is_primary',m.is_primary) order by m.is_primary desc,m.order_index)
 from public.asset_media m where m.tenant_id=p_tenant_id and m.asset_id=a.id),'[]'::jsonb),count(*) over()
 from public.assets a join public.tenants t on t.id=a.tenant_id
 left join lateral (
  select li.id,li.listing_number,li.listing_type,li.asking_price,li.pricing_period,li.commercial_status
  from public.listing_assets la join public.listings li on li.id=la.listing_id and li.tenant_id=la.tenant_id
  where la.asset_id=a.id and la.tenant_id=a.tenant_id and li.publication_status <> 'archived'
  order by (li.publication_status='published') desc,li.created_at desc limit 1
 ) l on true
 where a.tenant_id=p_tenant_id and t.status='active' and a.archived_at is null
 and p_scope in ('independent','project','all')
 and (p_scope='all' or (p_scope='independent' and a.project_id is null and a.parent_asset_id is null) or (p_scope='project' and a.project_id is not null))
 and (p_project_id is null or (p_scope='project' and a.project_id=p_project_id))
 and (p_asset_type is null or a.asset_type=p_asset_type) and (p_city_id is null or a.city_id=p_city_id)
 and (p_district_id is null or a.district_id=p_district_id) and (p_bedrooms is null or a.bedrooms=p_bedrooms)
 order by a.created_at desc limit greatest(1,least(coalesce(p_limit,20),50)) offset greatest(coalesce(p_offset,0),0)
$$;
revoke all on function public.public_asset_catalog_feed(uuid,text,uuid,public.asset_type,uuid,uuid,integer,integer,integer) from public;
grant execute on function public.public_asset_catalog_feed(uuid,text,uuid,public.asset_type,uuid,uuid,integer,integer,integer) to anon,authenticated;