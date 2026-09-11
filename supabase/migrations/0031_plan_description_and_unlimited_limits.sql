-- =============================================================================
-- Migration 0031: plan marketing description + "unlimited" limits
--
-- Founder's redesigned pricing cards (dashboard /billing/plans and
-- registration step 6) show a short description line under each plan's
-- name, and PRO's property/team limits as "بلا حدود" (unlimited) rather
-- than a number. Both are console-managed content like every other plan
-- field (PRODUCT_SPEC section 2) — never hardcoded in the frontend.
--
-- max_properties/max_users become nullable: NULL means unlimited. These
-- limits aren't enforced anywhere yet (informational display only, per
-- this session's own billing work), so relaxing the NOT NULL/positive
-- constraint to allow NULL doesn't change any enforcement behavior.
-- =============================================================================

alter table plans
  add column description_ar text,
  alter column max_properties drop not null,
  alter column max_users drop not null;
