-- =============================================================================
-- Migration 0011: property-media Storage bucket + RLS
-- PRODUCT_SPEC.md section 12 (task 16/42). Run after 0010.
--
-- Object path convention (enforced by `api`, not the database):
--   {tenant_id}/{property_id}/{filename}
-- The policies below read that convention via storage.foldername(name)
-- to scope writes exactly like the properties table itself (migration
-- 0005): Owner/Admin manage all their tenant's media, Agent only media
-- under their own assigned properties.
--
-- ⚠️ UNTESTED locally, unlike every other migration in this project —
-- the `storage` schema/extension is Supabase-specific infrastructure,
-- not part of a vanilla Postgres install, so there is no way to run this
-- against the local Postgres instance used to verify every other
-- migration. Written to match Supabase's documented Storage RLS pattern
-- exactly; needs a live smoke test (upload as Owner, Agent, and a
-- cross-tenant Agent) once a real project exists.
-- =============================================================================

-- Public bucket: published listings' media must be viewable by anonymous
-- site visitors without any policy gymnastics — Supabase serves public
-- bucket objects directly, bypassing RLS for reads. Draft-property media
-- being technically fetchable by URL is an accepted risk (no sensitive
-- content, PRODUCT_SPEC section 12) — the URL itself is never surfaced
-- to anyone who doesn't already have API access to the row that named it.
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;

create policy property_media_storage_owner_admin_manage on storage.objects
  for all to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth_tenant_id()::text
    and auth_user_role() in ('owner', 'admin')
  )
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth_tenant_id()::text
    and auth_user_role() in ('owner', 'admin')
  );

create policy property_media_storage_agent_manage on storage.objects
  for all to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth_tenant_id()::text
    and auth_user_role() = 'agent'
    and exists (
      select 1 from properties
      where properties.id::text = (storage.foldername(name))[2]
        and properties.tenant_id = auth_tenant_id()
        and properties.agent_id = auth_app_user_id()
    )
  )
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth_tenant_id()::text
    and auth_user_role() = 'agent'
    and exists (
      select 1 from properties
      where properties.id::text = (storage.foldername(name))[2]
        and properties.tenant_id = auth_tenant_id()
        and properties.agent_id = auth_app_user_id()
    )
  );
