-- =============================================================================
-- Migration 0014: website-assets Storage bucket + RLS
-- PRODUCT_SPEC.md section 6 (task 28/42) — logo + banner upload for the
-- website editor. Run after 0013.
--
-- Object path convention (enforced by `api`, not the database):
--   {tenant_id}/{logo|banner}.{ext}
-- Owner/Admin only — matches `websites_tenant_manage` (migration 0005)
-- exactly; Agent has zero website access (assertNotAgent in every
-- /v1/website* route since task 19/42), so no agent policy exists here at
-- all, unlike property-media's owner/admin + agent split (migration 0011).
--
-- ⚠️ UNTESTED locally, same as 0011 — the `storage` schema is
-- Supabase-specific infrastructure with no vanilla-Postgres equivalent to
-- verify against. Written to match Supabase's documented Storage RLS
-- pattern exactly (and 0011's own already-shipped pattern); needs a live
-- smoke test (upload as Owner, Admin, and a cross-tenant Owner) once a
-- real project exists.
-- =============================================================================

-- Public bucket: a tenant's logo/banner must be visible to anonymous
-- site visitors without any policy gymnastics, same reasoning as
-- property-media (migration 0011).
insert into storage.buckets (id, name, public)
values ('website-assets', 'website-assets', true)
on conflict (id) do nothing;

create policy website_assets_storage_owner_admin_manage on storage.objects
  for all to authenticated
  using (
    bucket_id = 'website-assets'
    and (storage.foldername(name))[1] = auth_tenant_id()::text
    and auth_user_role() in ('owner', 'admin')
  )
  with check (
    bucket_id = 'website-assets'
    and (storage.foldername(name))[1] = auth_tenant_id()::text
    and auth_user_role() in ('owner', 'admin')
  );
