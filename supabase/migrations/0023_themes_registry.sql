-- =============================================================================
-- Migration 0023: Theme registry support (متجر الثيمات)
--
-- `themes` so far only carried display metadata (name_ar/name_en/is_active) —
-- there was no stable way for application code to know WHICH set of React
-- components a theme row maps to. `key` is that stable reference: a
-- code-defined slug (e.g. 'classic', 'modern') that public-site's theme
-- registry looks up directly, independent of the row's uuid `id` (which
-- stays the FK target for `websites.theme_id`, unchanged).
--
-- `order_index` lets the platform owner (console) control display order in
-- the "متجر الثيمات" gallery without depending on insertion order.
-- =============================================================================

alter table themes add column key text;
alter table themes add column order_index integer not null default 0;

-- Backfill the existing single theme row (seeded in migration 0006) as the
-- first theme in the new registry — "الثيم الأول" per the founder's
-- instruction, unchanged visually, just now addressable by a stable key.
update themes set key = 'classic', order_index = 0 where name_en = 'Primary Theme' and key is null;

alter table themes alter column key set not null;
alter table themes add constraint themes_key_unique unique (key);

-- Second theme, shipped alongside this migration (public-site's theme
-- registry has a matching 'modern' component set — see
-- apps/public-site/src/components/themes/modern).
insert into themes (name_ar, name_en, key, order_index, is_active)
select 'العصري', 'Modern', 'modern', 1, true
where not exists (select 1 from themes where key = 'modern');
