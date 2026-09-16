-- =============================================================================
-- Migration 0051: resolve_public_tenant_chrome gains custom_domain +
-- custom_domain_status — needed so public-site can redirect a visitor who
-- arrives on the platform subdomain to the tenant's own verified custom
-- domain instead (founder's explicit choice: once a custom domain is
-- verified, the subdomain no longer serves the site directly, it only
-- redirects — task: "توقف النطاق الفرعي عن الوصول للموقع تمامًا").
--
-- Return shape changes (two new columns), so DROP + CREATE, same pattern
-- as this function's last signature change (migration 0047).
-- =============================================================================

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
    trial_ends_at, custom_domain, custom_domain_status
  from tenants
  where
    (p_subdomain is not null and subdomain = p_subdomain)
    or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
  limit 1;
$$;

grant execute on function resolve_public_tenant_chrome(text, text) to anon, authenticated;
