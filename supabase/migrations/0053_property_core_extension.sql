create type furnishing_status as enum ('unfurnished','semi_furnished','furnished');
create type property_frontage as enum ('north','south','east','west','northeast','northwest','southeast','southwest');

alter table properties
  add column land_area numeric(12,2) check (land_area > 0),
  add column built_area numeric(12,2) check (built_area > 0),
  add column street_width numeric(8,2) check (street_width > 0),
  add column frontage property_frontage,
  add column property_age smallint check (property_age >= 0),
  add column floor_number smallint,
  add column floors_count smallint check (floors_count > 0),
  add column parking_count smallint check (parking_count >= 0),
  add column elevators_count smallint check (elevators_count >= 0),
  add column furnishing furnishing_status,
  add column reference_number text,
  add column advertisement_license_number text,
  add column advertisement_license_expires_at timestamptz,
  add column advertiser_name text,
  add column marketing_mandate_id uuid;

create unique index properties_tenant_reference_number_uidx on properties(tenant_id, reference_number) where reference_number is not null;
create index properties_ad_license_idx on properties(tenant_id, advertisement_license_number) where advertisement_license_number is not null;