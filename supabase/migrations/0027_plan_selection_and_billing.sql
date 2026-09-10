-- =============================================================================
-- Migration 0027: plan selection at registration + StreamPay billing
--
-- Founder's request: registration gains a mandatory "اختر باقة وادفع" last
-- step (StreamPay checkout) instead of every new tenant silently landing
-- on the Basic plan for free. Three pieces:
--
--   1. `plans` gains intro pricing (`intro_price`/`intro_months`) — the
--      founder's exact two plans: الباقة الأساسية 3.99 SAR/month for the
--      first 2 months then 59 SAR/month; الباقة المتقدمة a flat 99 SAR/
--      month (intro fields null — no intro period).
--   2. `tenants.payment_status` tracks whether the tenant's first payment
--      cleared. Deliberately NOT wired to `tenants.status` (active/
--      suspended/cancelled) here — every new tenant still gets a working,
--      active account the moment they finish step 5 (per today's
--      create_tenant_with_owner behavior), `payment_status` only records
--      whether StreamPay confirmed the charge. Auto-suspending an unpaid
--      tenant after some grace period is a deliberate follow-up, not
--      built in this migration.
--   3. `payments` — one row per StreamPay checkout attempt, service-role
--      written only (by POST /v1/billing/checkout and the StreamPay
--      webhook) — same "no anon/authenticated write policy" pattern as
--      otp_verifications (migration 0007).
-- =============================================================================

alter table plans add column intro_price numeric;
alter table plans add column intro_months integer;

-- Filled in via console's plan editor once the founder creates the
-- matching recurring Product in StreamPay's own dashboard (a one-time
-- manual setup step, same "outside the codebase" pattern as the merchant
-- account itself — StreamPay's Payment Links API references products by
-- id, not a free-form amount; see streampay-client.ts).
alter table plans add column streampay_product_id text;

update plans set price = 59, intro_price = 3.99, intro_months = 2 where name_en = 'Basic';
update plans set price = 99, intro_price = null, intro_months = null where name_en = 'Advanced';

create type payment_status as enum ('pending', 'paid', 'failed');

alter table tenants add column payment_status payment_status not null default 'pending';

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  plan_id uuid not null references plans (id),
  amount numeric not null,
  currency text not null default 'SAR',
  provider text not null default 'streampay',
  provider_reference text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_tenant_id_idx on payments (tenant_id);
create index payments_provider_reference_idx on payments (provider_reference);

create trigger payments_set_updated_at
  before update on payments
  for each row
  execute function set_updated_at();

alter table payments enable row level security;

-- Read-only for the tenant's own Owner (billing history) — every write
-- (creating a pending payment, marking it paid/failed) goes through the
-- service role from `api`, never directly from a client.
create policy payments_owner_select on payments
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'owner');

-- create_tenant_with_owner (migration 0010) already takes p_plan_id — no
-- function change needed; the caller (POST /v1/auth/register) now passes
-- the tenant's own chosen plan instead of always looking up 'Basic'.
