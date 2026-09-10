-- =============================================================================
-- Migration 0025: website footer content + custom pages (الصفحات)
--
-- Founder's request: an announcement bar above the header ("الشريط"), a
-- richer footer (description, business-license numbers, social links,
-- links to owner-authored pages like "سياسة الخصوصية"). Three pieces:
--   1. `websites` gains two site-wide text fields (same pattern as the
--      existing logo_url/banner_image_url — one value, used on every page,
--      edited via the existing generic `PATCH /v1/website`).
--   2. `tenants` gains 5 nullable social-link columns. These live on the
--      account (`tenants`), not the website — the founder was explicit
--      these are entered on "صفحة الحساب" (the account/settings page),
--      not the site editor, and only whichever ones are filled in show
--      on the public site footer.
--   3. A new `website_custom_pages` table — owner/admin-authored pages
--      (title + free-text content), linked from the public footer. Single-
--      language (Arabic), matching the dashboard/CRM's Arabic-first scope
--      (PRODUCT_SPEC section: public site is bilingual, but this is a
--      dashboard-authored content feature, not a translated public page).
--
-- `resolve_public_tenant_chrome` (migration 0016) is replaced (its return
-- columns change, so create-or-replace isn't enough) to also expose
-- cr_number/tax_number/fal_license_number and the 5 social columns —
-- migration 0016's own comment said "never cr_number/tax_number"; that
-- was correct for its original purpose (generic tenant chrome) but the
-- founder has now explicitly asked for these specific three numbers on
-- the public site footer, matching real KSA business-transparency norms
-- (a CR number in an e-commerce footer is standard, expected practice).
-- =============================================================================

alter table websites add column announcement_bar_text text;
alter table websites add column footer_description text;

alter table tenants add column social_instagram text;
alter table tenants add column social_tiktok text;
alter table tenants add column social_whatsapp text;
alter table tenants add column social_snapchat text;
alter table tenants add column social_phone text;

drop function resolve_public_tenant_chrome(text, text);

create function resolve_public_tenant_chrome(p_subdomain text, p_custom_domain text)
returns table(
  id uuid,
  status tenant_status,
  name_ar text,
  name_en text,
  account_type account_type,
  cr_number text,
  tax_number text,
  fal_license_number text,
  social_instagram text,
  social_tiktok text,
  social_whatsapp text,
  social_snapchat text,
  social_phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    id, status, name_ar, name_en, account_type,
    cr_number, tax_number, fal_license_number,
    social_instagram, social_tiktok, social_whatsapp, social_snapchat, social_phone
  from tenants
  where
    (p_subdomain is not null and subdomain = p_subdomain)
    or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
  limit 1;
$$;

grant execute on function resolve_public_tenant_chrome(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- website_custom_pages
-- ---------------------------------------------------------------------------
create table website_custom_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references websites (id) on delete cascade,
  title text not null,
  slug text not null,
  content text not null default '',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, slug)
);

create index website_custom_pages_website_id_idx on website_custom_pages (website_id);

create trigger website_custom_pages_set_updated_at
  before update on website_custom_pages
  for each row
  execute function set_updated_at();

alter table website_custom_pages enable row level security;

create policy website_custom_pages_tenant_manage on website_custom_pages
  for all to authenticated
  using (
    exists (
      select 1 from websites
      where websites.id = website_custom_pages.website_id
        and websites.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from websites
      where websites.id = website_custom_pages.website_id
        and websites.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  );

create policy website_custom_pages_public_select on website_custom_pages
  for select to anon
  using (
    exists (
      select 1 from websites
      where websites.id = website_custom_pages.website_id
        and is_tenant_active(websites.tenant_id)
    )
  );
