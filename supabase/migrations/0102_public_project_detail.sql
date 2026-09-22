-- =============================================================================
-- Migration 0102: Safe public project detail
-- Public websites must never query assets/unit_types directly through anon RLS.
-- =============================================================================

create or replace function public_project_detail(
  p_tenant_id uuid,
  p_identifier text
)
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'project', to_jsonb(p),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pm.id,
        'url', pm.url,
        'media_type', pm.media_type,
        'alt_ar', pm.alt_ar,
        'alt_en', pm.alt_en,
        'order_index', pm.order_index
      ) order by pm.order_index)
      from project_media pm
      where pm.tenant_id = p_tenant_id
        and pm.project_id = p.id
    ), '[]'::jsonb),
    'unit_types', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ut.id,
        'name_ar', ut.name_ar,
        'name_en', ut.name_en,
        'asset_type', ut.asset_type,
        'specifications', ut.specifications
      ) order by ut.name_ar)
      from unit_types ut
      where ut.tenant_id = p_tenant_id
        and ut.project_id = p.id
    ), '[]'::jsonb),
    'units', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'unit_type_id', a.unit_type_id,
        'unit_number', a.unit_number,
        'floor_number', a.floor_number,
        'area_sqm', a.area_sqm,
        'asset_type', a.asset_type,
        'name_ar', a.name_ar,
        'name_en', a.name_en,
        'listing_id', l.id,
        'listing_number', l.listing_number,
        'listing_type', l.listing_type,
        'price', l.asking_price,
        'pricing_period', l.pricing_period,
        'media', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', am.id,
            'media_type', am.media_type,
            'url', am.url,
            'alt_ar', am.alt_ar,
            'alt_en', am.alt_en,
            'order_index', am.order_index,
            'is_primary', am.is_primary
          ) order by am.is_primary desc, am.order_index)
          from asset_media am
          where am.tenant_id = p_tenant_id
            and am.asset_id = a.id
        ), '[]'::jsonb)
      ) order by l.published_at desc nulls last, l.created_at desc)
      from assets a
      join listing_assets la
        on la.tenant_id = a.tenant_id
       and la.asset_id = a.id
      join listings l
        on l.tenant_id = la.tenant_id
       and l.id = la.listing_id
      where a.tenant_id = p_tenant_id
        and a.project_id = p.id
        and a.archived_at is null
        and l.publication_status = 'published'
        and l.commercial_status <> 'closed'
    ), '[]'::jsonb)
  )
  from projects p
  join tenants t on t.id = p.tenant_id
  where p.tenant_id = p_tenant_id
    and t.status = 'active'
    and p.status = 'published'
    and (p.id::text = p_identifier or p.slug = p_identifier)
  limit 1
$$;

revoke all on function public_project_detail(uuid,text) from public;
grant execute on function public_project_detail(uuid,text) to anon, authenticated;
