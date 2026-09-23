-- =============================================================================
-- Migration 0111: Facebook, X and Telegram links for a tenant's site
-- Run after 0110.
--
-- حسابي → معلومات التواصل already lets owners/admins enter Facebook, X and
-- Telegram links, and PATCH /v1/tenant/social-links accepts them, but no
-- migration ever created these tenant columns — saving one failed, and
-- nothing could read them back or show them in the site footer.
--
-- resolve_public_tenant_chrome() returns the three links too. Its return
-- shape changes, so DROP + CREATE, same pattern as migrations 0047/0051.
-- =============================================================================

alter table tenants
  add column if not exists social_facebook text,
  add column if not exists social_x text,
  add column if not exists social_telegram text;

drop function if exists resolve_public_tenant_chrome(text, text);

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
  social_phone text,
  social_facebook text,
  social_x text,
  social_telegram text,
  trial_ends_at timestamptz,
  custom_domain text,
  custom_domain_status custom_domain_status
)
language sql
stable
security definer
set search_path = public
as $$
  select
    id, status, name_ar, name_en, account_type,
    cr_number, tax_number, fal_license_number,
    social_instagram, social_tiktok, social_whatsapp, social_snapchat, social_phone,
    social_facebook, social_x, social_telegram,
    trial_ends_at, custom_domain, custom_domain_status
  from tenants
  where
    (p_subdomain is not null and subdomain = p_subdomain)
    or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
  limit 1;
$$;

grant execute on function resolve_public_tenant_chrome(text, text) to anon, authenticated;
