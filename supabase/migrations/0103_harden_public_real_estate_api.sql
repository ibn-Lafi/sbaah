-- =============================================================================
-- Migration 0103: Harden public real-estate API
-- Keep SECURITY DEFINER public reads explicit: never expose internal listing
-- ownership, assignment, mandate or audit columns through listing detail.
-- =============================================================================

create or replace function public_listing_detail(p_tenant_id uuid,p_identifier text)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
 select jsonb_build_object(
  'id',l.id,
  'listing_number',l.listing_number,
  'listing_type',l.listing_type,
  'title_ar',l.title_ar,
  'title_en',l.title_en,
  'description_ar',l.description_ar,
  'description_en',l.description_en,
  'asking_price',l.asking_price,
  'pricing_period',l.pricing_period,
  'publication_status',l.publication_status,
  'commercial_status',l.commercial_status,
  'advertisement_license_number',l.advertisement_license_number,
  'advertisement_license_expires_at',l.advertisement_license_expires_at,
  'advertiser_name',l.advertiser_name,
  'published_at',l.published_at,
  'created_at',l.created_at,
  'assets',coalesce(jsonb_agg(jsonb_build_object(
   'asset_id',a.id,'slug',a.slug,'reference_number',a.reference_number,'asset_type',a.asset_type,
   'name_ar',a.name_ar,'name_en',a.name_en,'description_ar',a.description_ar,'description_en',a.description_en,
   'unit_number',a.unit_number,'floor_number',a.floor_number,'city_id',a.city_id,'district_id',a.district_id,
   'lat',a.lat,'lng',a.lng,'area_sqm',a.area_sqm,'land_area',a.land_area,'built_area',a.built_area,
   'street_width',a.street_width,'frontage',a.frontage,'bedrooms',a.bedrooms,'bathrooms',a.bathrooms,
   'floors_count',a.floors_count,'parking_count',a.parking_count,'elevators_count',a.elevators_count,
   'furnishing',a.furnishing,'property_age',a.property_age,'physical_status',a.physical_status,
   'media',coalesce((select jsonb_agg(jsonb_build_object(
     'id',m.id,'media_type',m.media_type,'url',m.url,'alt_ar',m.alt_ar,'alt_en',m.alt_en,
     'order_index',m.order_index,'is_primary',m.is_primary
   ) order by m.is_primary desc,m.order_index)
   from asset_media m where m.tenant_id=p_tenant_id and m.asset_id=a.id),'[]'::jsonb)
  )),'[]'::jsonb)
 )
 from listings l
 join listing_assets la on la.listing_id=l.id and la.tenant_id=l.tenant_id
 join assets a on a.id=la.asset_id and a.tenant_id=l.tenant_id
 join tenants t on t.id=l.tenant_id
 where l.tenant_id=p_tenant_id
   and t.status='active'
   and l.publication_status='published'
   and l.commercial_status<>'closed'
   and a.archived_at is null
   and (l.id::text=p_identifier or l.listing_number=p_identifier or a.slug=p_identifier)
 group by l.id
 limit 1
$$;

revoke all on function public_listing_detail(uuid,text) from public;
grant execute on function public_listing_detail(uuid,text) to anon,authenticated;
