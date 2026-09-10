-- =============================================================================
-- Migration 0028: monthly + annual billing cycle per plan tier
--
-- Founder's request: each tier (الأساسية/المتقدمة) now offers both a
-- monthly and an annual price — الأساسية 59/month or 590/year, المتقدمة
-- 99/month or 990/year. Modeled as one `plans` row per (tier, cycle)
-- combination rather than adding a second price column, so registration's
-- existing `plans.map(...)` card list (apps/dashboard .../register/page.tsx)
-- needs no structural change — it already renders however many active
-- plans exist. The existing two rows become the "monthly" cycle of each
-- tier; two new "annual" rows are inserted alongside them.
--
-- Intro pricing (3.99 SAR/month for الأساسية's first 2 months) stays
-- monthly-only per the founder's explicit confirmation — the new annual
-- الأساسية row has no intro period, same as المتقدمة never had one.
-- =============================================================================

create type billing_cycle as enum ('monthly', 'annual');

alter table plans add column billing_cycle billing_cycle not null default 'monthly';

-- Existing two rows (from migration 0001's seed + 0027's intro pricing)
-- are both monthly already — the column default above covers them, no
-- update needed.

insert into plans (name_ar, name_en, billing_cycle, price, intro_price, intro_months, max_properties, max_users, custom_domain_allowed, is_active)
select name_ar, name_en, 'annual', case when name_en = 'Basic' then 590 else 990 end, null, null, max_properties, max_users, custom_domain_allowed, is_active
from plans
where billing_cycle = 'monthly' and name_en in ('Basic', 'Advanced');
