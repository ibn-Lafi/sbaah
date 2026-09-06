-- =============================================================================
-- Migration 0001: Core tables (platform_admins, plans, tenants, users)
-- PRODUCT_SPEC.md section 9.
--
-- HOW TO RUN: paste this file's contents into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) and run it, in order, before
-- migration 0002. Or, if you use the Supabase CLI locally:
--   supabase db push
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type account_type as enum ('individual', 'institution', 'company');
create type tenant_status as enum ('active', 'suspended', 'cancelled');
create type user_role as enum ('owner', 'admin', 'agent');
create type user_status as enum ('active', 'invited', 'disabled');

-- ---------------------------------------------------------------------------
-- platform_admins
-- Sole source of truth for who may authenticate into the `console` app.
-- Deliberately separate from tenants/users: console authorization must
-- NEVER be derived from users.role (PRODUCT_SPEC section 8).
-- No self-serve creation flow exists in the product — the first row is
-- inserted manually here, once, right after this migration runs.
-- ---------------------------------------------------------------------------
create table platform_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  phone text not null unique,
  full_name text not null,
  created_at timestamptz not null default now()
);

comment on table platform_admins is
  'Bootstrap: after creating your Supabase Auth user (Dashboard -> Authentication -> Add user), '
  'insert your own row here manually. Example (replace the UUID and details):\n'
  'insert into platform_admins (auth_user_id, phone, full_name) '
  'values (''00000000-0000-0000-0000-000000000000'', ''+966500000000'', ''اسمك'');';

-- ---------------------------------------------------------------------------
-- plans
-- Admin-configurable subscription tiers (PRODUCT_SPEC section 2) — price
-- and limits are data, editable from `console`, never hardcoded in app code.
-- ---------------------------------------------------------------------------
create table plans (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  price numeric(10, 2) not null check (price >= 0),
  max_properties integer not null check (max_properties > 0),
  max_users integer not null check (max_users > 0),
  custom_domain_allowed boolean not null default false,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- tenants
-- One row per customer account. ACCOUNT = ONE WEBSITE (PRODUCT_SPEC
-- section 3) — there is no separate "sites" table; a tenant's site lives
-- in the websites table (migration 0002), 1:1 with this table.
-- ---------------------------------------------------------------------------
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  account_type account_type not null,
  fal_license_number text not null,
  cr_number text,
  tax_number text,
  subdomain text not null unique,
  custom_domain text unique,
  plan_id uuid not null references plans (id),
  status tenant_status not null default 'active',
  created_at timestamptz not null default now(),

  -- Institution/company accounts must provide CR + tax number;
  -- individual accounts must not (kept null), per PRODUCT_SPEC section 2.
  constraint tenants_org_fields_required check (
    (account_type = 'individual' and cr_number is null and tax_number is null)
    or
    (account_type in ('institution', 'company') and cr_number is not null and tax_number is not null)
  )
);

create index tenants_subdomain_idx on tenants (subdomain);
create index tenants_custom_domain_idx on tenants (custom_domain) where custom_domain is not null;

-- ---------------------------------------------------------------------------
-- users
-- Tenant-scoped account users (Owner/Admin/Agent). Phone is the sole
-- login identifier (PRODUCT_SPEC section 2) and is globally unique across
-- the whole platform — a known, accepted limitation: one phone number
-- cannot belong to more than one tenant in this version (section 2).
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  email text,
  role user_role not null default 'owner',
  status user_status not null default 'active',
  created_at timestamptz not null default now()
);

create index users_tenant_id_idx on users (tenant_id);
create unique index users_auth_user_id_idx on users (auth_user_id);
