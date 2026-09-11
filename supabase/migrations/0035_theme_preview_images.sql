-- =============================================================================
-- Migration 0035: صور معاينة الثيمات (متجر الثيمات)
--
-- Founder's request: "متجر الثيمات" cards should show a real uploaded
-- preview image per theme instead of the small CSS mockup
-- (apps/dashboard/src/components/website/theme-preview.tsx already
-- documents this gap: "not a real screenshot — no rendering pipeline for
-- that exists"). Themes stay code-defined (docs/THEMES.md) — this only
-- adds one more piece of console-managed display metadata alongside
-- name/order/active, same category as those, not a step toward no-code
-- theme creation.
--
-- Storage bucket mirrors website-assets (migration 0014) exactly, except
-- scoped to platform admins instead of a tenant: a theme's preview image
-- is platform-wide data (every tenant sees the same gallery), not
-- tenant-owned, so the folder-per-tenant convention doesn't apply — the
-- object path is {theme_id}/preview.{ext} instead.
-- =============================================================================

alter table themes add column preview_image_url text;

insert into storage.buckets (id, name, public)
values ('theme-assets', 'theme-assets', true)
on conflict (id) do nothing;

create policy theme_assets_storage_platform_admin_manage on storage.objects
  for all to authenticated
  using (bucket_id = 'theme-assets' and is_platform_admin())
  with check (bucket_id = 'theme-assets' and is_platform_admin());
