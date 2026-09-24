-- Account-specific license identifiers shown under Settings > بيانات الجهة.
-- Individual accounts may store a freelance work document number.
-- Institution/company accounts may store a Wafi license number.

alter table public.tenants
  add column if not exists freelance_document_number text,
  add column if not exists wafi_license_number text;

alter table public.tenants
  drop constraint if exists tenants_account_specific_licenses_check;

alter table public.tenants
  add constraint tenants_account_specific_licenses_check
  check (
    (account_type = 'individual' and wafi_license_number is null)
    or
    (account_type in ('institution', 'company') and freelance_document_number is null)
  );
