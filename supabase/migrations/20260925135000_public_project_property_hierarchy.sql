-- =============================================================================
-- Public project detail hierarchy
--
-- Restores structured project metadata and media fields, preserves the legacy
-- flat `units` collection, and adds Project -> Properties -> Units for themes
-- that present project inventory hierarchically.
-- =============================================================================

create or replace function public.public_project_detail(
  p_tenant_id uuid,
  p_identifier text
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'project', jsonb_build_object(
      'id', p.id,
      'slug', p.slug,
      'name_ar', p.name_ar,
      'name_en', p.name_en,
      'description_ar', p.description_ar,
      'description_en', p.description_en,
      'city_id', p.city_id,
      'district_id', p.district_id,
      'lat', p.lat,
      'lng', p.lng,
      'status', p.status,
      'completion_percentage', p.completion_percentage,
      'expected_completion_date', (
        select max(phase.expected_completion_date)
        from public.project_phases phase
        where phase.tenant_id = p_tenant_id
          and phase.project_id = p.id
      ),
      'planned_units_count', p.planned_units_count
    ),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pm.id,
        'url', pm.url,
        'media_type', pm.media_type,
        'category', pm.category,
        'alt_ar', pm.alt_ar,
        'alt_en', pm.alt_en,
        'order_index', pm.order_index,
        'is_primary', pm.is_primary
      ) order by pm.is_primary desc, pm.category, pm.order_index)
      from public.project_media pm
      where pm.tenant_id = p_tenant_id
        and pm.project_id = p.id
    ), '[]'::jsonb),
    'unit_types', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ut.id,
        'name_ar', ut.name_ar,
        'name_en', ut.name_en,
        'asset_type', ut.asset_type,
        'area_sqm', ut.area_sqm,
        'bedrooms', ut.bedrooms,
        'bathrooms', ut.bathrooms,
        'base_price', ut.base_price,
        'specifications', ut.specifications
      ) order by ut.name_ar)
      from public.unit_types ut
      where ut.tenant_id = p_tenant_id
        and ut.project_id = p.id
    ), '[]'::jsonb),
    'properties', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'parent_asset_id', a.parent_asset_id,
        'unit_type_id', a.unit_type_id,
        'phase_id', a.phase_id,
        'unit_number', a.unit_number,
        'floor_number', a.floor_number,
        'area_sqm', a.area_sqm,
        'bedrooms', a.bedrooms,
        'bathrooms', a.bathrooms,
        'asset_type', a.asset_type,
        'name_ar', a.name_ar,
        'name_en', a.name_en,
        'listing_id', top_listing.id,
        'listing_number', top_listing.listing_number,
        'listing_type', top_listing.listing_type,
        'price', top_listing.asking_price,
        'pricing_period', top_listing.pricing_period,
        'commercial_status', top_listing.commercial_status,
        'media', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', am.id,
            'media_type', am.media_type,
            'category', am.category,
            'url', am.url,
            'alt_ar', am.alt_ar,
            'alt_en', am.alt_en,
            'order_index', am.order_index,
            'is_primary', am.is_primary
          ) order by am.is_primary desc, am.category, am.order_index)
          from public.asset_media am
          where am.tenant_id = p_tenant_id
            and am.asset_id = a.id
        ), '[]'::jsonb),
        'units', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', child.id,
            'slug', child.slug,
            'parent_asset_id', child.parent_asset_id,
            'unit_type_id', child.unit_type_id,
            'phase_id', child.phase_id,
            'unit_number', child.unit_number,
            'floor_number', child.floor_number,
            'area_sqm', child.area_sqm,
            'bedrooms', child.bedrooms,
            'bathrooms', child.bathrooms,
            'asset_type', child.asset_type,
            'name_ar', child.name_ar,
            'name_en', child.name_en,
            'listing_id', child_listing.id,
            'listing_number', child_listing.listing_number,
            'listing_type', child_listing.listing_type,
            'price', child_listing.asking_price,
            'pricing_period', child_listing.pricing_period,
            'commercial_status', child_listing.commercial_status,
            'media', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', child_media.id,
                'media_type', child_media.media_type,
                'category', child_media.category,
                'url', child_media.url,
                'alt_ar', child_media.alt_ar,
                'alt_en', child_media.alt_en,
                'order_index', child_media.order_index,
                'is_primary', child_media.is_primary
              ) order by child_media.is_primary desc, child_media.category, child_media.order_index)
              from public.asset_media child_media
              where child_media.tenant_id = p_tenant_id
                and child_media.asset_id = child.id
            ), '[]'::jsonb)
          ) order by child_listing.published_at desc nulls last, child.created_at desc)
          from public.assets child
          join lateral (
            select
              child_offer.id,
              child_offer.listing_number,
              child_offer.listing_type,
              child_offer.asking_price,
              child_offer.pricing_period,
              child_offer.commercial_status,
              child_offer.published_at
            from public.listing_assets child_link
            join public.listings child_offer
              on child_offer.id = child_link.listing_id
             and child_offer.tenant_id = child_link.tenant_id
            where child_link.tenant_id = p_tenant_id
              and child_link.asset_id = child.id
              and child_offer.publication_status = 'published'
              and child_offer.commercial_status <> 'closed'
            order by child_offer.published_at desc nulls last, child_offer.created_at desc
            limit 1
          ) child_listing on true
          where child.tenant_id = p_tenant_id
            and child.project_id = p.id
            and child.parent_asset_id = a.id
            and child.archived_at is null
        ), '[]'::jsonb)
      ) order by top_listing.published_at desc nulls last, a.created_at desc)
      from public.assets a
      left join lateral (
        select
          offer.id,
          offer.listing_number,
          offer.listing_type,
          offer.asking_price,
          offer.pricing_period,
          offer.commercial_status,
          offer.published_at
        from public.listing_assets link
        join public.listings offer
          on offer.id = link.listing_id
         and offer.tenant_id = link.tenant_id
        where link.tenant_id = p_tenant_id
          and link.asset_id = a.id
          and offer.publication_status = 'published'
          and offer.commercial_status <> 'closed'
        order by offer.published_at desc nulls last, offer.created_at desc
        limit 1
      ) top_listing on true
      where a.tenant_id = p_tenant_id
        and a.project_id = p.id
        and a.parent_asset_id is null
        and a.archived_at is null
        and (
          top_listing.id is not null
          or exists (
            select 1
            from public.assets visible_child
            join public.listing_assets visible_child_link
              on visible_child_link.tenant_id = visible_child.tenant_id
             and visible_child_link.asset_id = visible_child.id
            join public.listings visible_child_offer
              on visible_child_offer.tenant_id = visible_child_link.tenant_id
             and visible_child_offer.id = visible_child_link.listing_id
            where visible_child.tenant_id = p_tenant_id
              and visible_child.project_id = p.id
              and visible_child.parent_asset_id = a.id
              and visible_child.archived_at is null
              and visible_child_offer.publication_status = 'published'
              and visible_child_offer.commercial_status <> 'closed'
          )
        )
    ), '[]'::jsonb),
    'units', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'parent_asset_id', a.parent_asset_id,
        'unit_type_id', a.unit_type_id,
        'phase_id', a.phase_id,
        'unit_number', a.unit_number,
        'floor_number', a.floor_number,
        'area_sqm', a.area_sqm,
        'bedrooms', a.bedrooms,
        'bathrooms', a.bathrooms,
        'asset_type', a.asset_type,
        'name_ar', a.name_ar,
        'name_en', a.name_en,
        'listing_id', l.id,
        'listing_number', l.listing_number,
        'listing_type', l.listing_type,
        'price', l.asking_price,
        'pricing_period', l.pricing_period,
        'commercial_status', l.commercial_status,
        'media', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', am.id,
            'media_type', am.media_type,
            'category', am.category,
            'url', am.url,
            'alt_ar', am.alt_ar,
            'alt_en', am.alt_en,
            'order_index', am.order_index,
            'is_primary', am.is_primary
          ) order by am.is_primary desc, am.category, am.order_index)
          from public.asset_media am
          where am.tenant_id = p_tenant_id
            and am.asset_id = a.id
        ), '[]'::jsonb)
      ) order by l.published_at desc nulls last, l.created_at desc)
      from public.assets a
      join public.listing_assets la
        on la.tenant_id = a.tenant_id
       and la.asset_id = a.id
      join public.listings l
        on l.tenant_id = la.tenant_id
       and l.id = la.listing_id
      where a.tenant_id = p_tenant_id
        and a.project_id = p.id
        and a.archived_at is null
        and l.publication_status = 'published'
        and l.commercial_status <> 'closed'
    ), '[]'::jsonb)
  )
  from public.projects p
  join public.tenants t on t.id = p.tenant_id
  where p.tenant_id = p_tenant_id
    and t.status = 'active'
    and p.status = 'published'
    and (p.id::text = p_identifier or p.slug = p_identifier)
  limit 1
$$;

revoke all on function public.public_project_detail(uuid, text) from public;
grant execute on function public.public_project_detail(uuid, text) to anon, authenticated;
