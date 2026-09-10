-- =============================================================================
-- Migration 0026: platform_settings (روابط تواصل الادمن)
--
-- Founder's request: the login/register auth panel currently shows a
-- decorative "عقار ← موقع ← زائر ← Lead ← متابعة" pipeline row (see
-- AuthPanel). Replace it with 4 icon links — TikTok, Instagram, X,
-- Email — pointing at سبعة's OWN accounts (the platform owner's, not any
-- tenant's), editable only from `console`. A single-row settings table,
-- same public-read/admin-write shape as plans/themes/cities/districts
-- (migration 0005) — `is_platform_admin()` already exists there.
--
-- Singleton enforced by `id boolean primary key` + `check (id)`: only a
-- row with id = true can ever exist, so there is exactly one row, ever.
-- =============================================================================

create table platform_settings (
  id boolean primary key default true,
  social_tiktok text,
  social_instagram text,
  social_x text,
  contact_email text,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);

insert into platform_settings (id) values (true);

create trigger platform_settings_set_updated_at
  before update on platform_settings
  for each row
  execute function set_updated_at();

alter table platform_settings enable row level security;

create policy platform_settings_public_select on platform_settings for select to anon, authenticated using (true);
create policy platform_settings_admin_write on platform_settings for update to authenticated
  using (is_platform_admin()) with check (is_platform_admin());
