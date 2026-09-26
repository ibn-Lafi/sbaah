-- Expose account-specific license identifiers to the public website chrome.
-- The footer still applies account-type checks before rendering:
-- institution/company => CR, VAT, FAL and Wafi; individual => FAL and freelance certificate.

drop function if exists resolve_public_tenant_chrome(text, text);

create function resolve_public_tenant_chrome(p_subdomain text, p_custom_domain text)
returns table(
  id uuid,
  status public.tenant_status,
  name_ar text,
  name_en text,
  account_type public.account_type,
  cr_number text,
  tax_number text,
  fal_license_number text,
  freelance_document_number text,
  wafi_license_number text,
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
  custom_domain_status public.custom_domain_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    id, status, name_ar, name_en, account_type,
    cr_number, tax_number, fal_license_number,
    freelance_document_number, wafi_license_number,
    social_instagram, social_tiktok, social_whatsapp, social_snapchat, social_phone,
    social_facebook, social_x, social_telegram,
    trial_ends_at, custom_domain, custom_domain_status
  from public.tenants
  where
    (p_subdomain is not null and subdomain = p_subdomain)
    or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
  limit 1;
$$;

revoke execute on function public.resolve_public_tenant_chrome(text, text) from public;
grant execute on function public.resolve_public_tenant_chrome(text, text) to anon, authenticated;
