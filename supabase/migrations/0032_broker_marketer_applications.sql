-- =============================================================================
-- Migration 0032: الوسطاء والمسوقين (broker/marketer applications)
--
-- Founder's request: a tenant can add a "طلب انضمام كوسيط أو مسوّق" form
-- to their public site — either on the home page (site-wide, no specific
-- property) or on the property_detail page template (captures whichever
-- property the visitor was viewing). Modeled as a new
-- website_section_type ('broker_marketer_form') so it reuses the existing
-- section toggle/reorder machinery (migration 0024) — no new "add a
-- section" UI needed. New tenants get it seeded (hidden by default, like
-- hero is on non-home pages) via create_default_website_for_tenant();
-- existing tenants are backfilled the same row, also hidden by default,
-- so nothing changes for a tenant until they explicitly turn it on.
--
-- Same "no anon INSERT policy" pattern as `leads` (migration 0005) — the
-- public form is inserted by `api` using the service role after
-- validating tenant_id/property_id server-side, never a direct anon
-- write.
-- =============================================================================

alter type website_section_type add value if not exists 'broker_marketer_form';

commit;

create type broker_marketer_applicant_type as enum ('broker', 'marketer');

create table broker_marketer_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  -- null = submitted from the home page (applies site-wide, not to one
  -- property); set = submitted from that property's detail page.
  property_id uuid references properties (id) on delete cascade,
  full_name text not null,
  city_id uuid not null references cities (id),
  fal_license_number text not null,
  applicant_type broker_marketer_applicant_type not null,
  created_at timestamptz not null default now()
);

create index broker_marketer_applications_tenant_id_idx on broker_marketer_applications (tenant_id);
create index broker_marketer_applications_property_id_idx on broker_marketer_applications (property_id);

alter table broker_marketer_applications enable row level security;

create policy broker_marketer_applications_owner_admin_select on broker_marketer_applications
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

comment on table broker_marketer_applications is
  'No anon/authenticated INSERT policy by design — written only by api''s service role from POST /v1/public/broker-applications, after re-validating tenant_id/property_id server-side (same pattern as leads).';

-- ---------------------------------------------------------------------------
-- Rate limiting for the new public endpoint — same IP-only, no-tenant-FK
-- shape as lead_submission_attempts (migration 0029), for the same reason:
-- logged before tenant_id is validated, so a bogus tenant_id can't itself
-- break the bookkeeping insert.
-- ---------------------------------------------------------------------------
create table broker_marketer_application_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index broker_marketer_application_attempts_ip_idx on broker_marketer_application_attempts (ip, created_at desc);

alter table broker_marketer_application_attempts enable row level security;

comment on table broker_marketer_application_attempts is
  'No RLS policies by design — accessed only via the service role from api''s POST /v1/public/broker-applications (rate-limit bookkeeping, not application content).';

-- ---------------------------------------------------------------------------
-- Seed the new (hidden by default) section on every existing tenant's
-- home and property_detail pages — order_index placed last on each page
-- so it doesn't reflow whatever the tenant already arranged.
-- ---------------------------------------------------------------------------
insert into website_sections (website_id, page_id, type, order_index, is_visible)
select
  wp.website_id,
  wp.id,
  'broker_marketer_form',
  coalesce((select max(order_index) + 1 from website_sections where page_id = wp.id), 0),
  false
from website_pages wp
where wp.key in ('home', 'property_detail');

-- ---------------------------------------------------------------------------
-- New tenants: create_default_website_for_tenant() (migration 0024) must
-- also seed this section on their home/property_detail pages. Replacing
-- in place, same reasoning 0012/0024 both document: this trigger must
-- keep the invariant for every future tenant regardless of later schema
-- additions.
-- ---------------------------------------------------------------------------
create or replace function create_default_website_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme_id uuid;
  v_website_id uuid;
  v_home_id uuid;
  v_properties_id uuid;
  v_property_detail_id uuid;
  v_projects_id uuid;
  v_about_id uuid;
  v_contact_id uuid;
begin
  select id into v_theme_id from themes where is_active = true order by order_index limit 1;

  insert into websites (tenant_id, theme_id)
  values (new.id, v_theme_id)
  returning id into v_website_id;

  insert into website_pages (website_id, key) values (v_website_id, 'home') returning id into v_home_id;
  insert into website_pages (website_id, key) values (v_website_id, 'properties') returning id into v_properties_id;
  insert into website_pages (website_id, key) values (v_website_id, 'property_detail') returning id into v_property_detail_id;
  insert into website_pages (website_id, key) values (v_website_id, 'projects') returning id into v_projects_id;
  insert into website_pages (website_id, key) values (v_website_id, 'about') returning id into v_about_id;
  insert into website_pages (website_id, key) values (v_website_id, 'contact') returning id into v_contact_id;

  insert into website_sections (website_id, page_id, type, order_index, is_visible)
  values
    (v_website_id, v_home_id, 'hero', 0, true),
    (v_website_id, v_home_id, 'property_grid', 1, true),
    (v_website_id, v_home_id, 'about', 2, true),
    (v_website_id, v_home_id, 'why_us', 3, true),
    (v_website_id, v_home_id, 'contact', 4, true),
    (v_website_id, v_home_id, 'broker_marketer_form', 5, false),
    (v_website_id, v_home_id, 'footer', 6, true),
    (v_website_id, v_properties_id, 'hero', 0, true),
    (v_website_id, v_properties_id, 'property_grid', 1, true),
    (v_website_id, v_properties_id, 'footer', 2, true),
    (v_website_id, v_property_detail_id, 'hero', 0, false),
    (v_website_id, v_property_detail_id, 'property_detail', 1, true),
    (v_website_id, v_property_detail_id, 'contact', 2, true),
    (v_website_id, v_property_detail_id, 'broker_marketer_form', 3, false),
    (v_website_id, v_property_detail_id, 'footer', 4, true),
    (v_website_id, v_projects_id, 'hero', 0, true),
    (v_website_id, v_projects_id, 'project_grid', 1, true),
    (v_website_id, v_projects_id, 'footer', 2, true),
    (v_website_id, v_about_id, 'hero', 0, false),
    (v_website_id, v_about_id, 'about', 1, true),
    (v_website_id, v_about_id, 'why_us', 2, true),
    (v_website_id, v_about_id, 'contact', 3, true),
    (v_website_id, v_about_id, 'footer', 4, true),
    (v_website_id, v_contact_id, 'hero', 0, false),
    (v_website_id, v_contact_id, 'contact', 1, true),
    (v_website_id, v_contact_id, 'footer', 2, true);

  return new;
end;
$$;
