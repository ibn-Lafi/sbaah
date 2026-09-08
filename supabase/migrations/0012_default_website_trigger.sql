-- =============================================================================
-- Migration 0012: auto-create a default website + sections for every tenant
-- PRODUCT_SPEC.md section 3 (task 19/42). Run after 0011.
--
-- Gap found while building the website endpoints: `websites.tenant_id` is
-- `not null unique` — every tenant is SUPPOSED to have exactly one website
-- (ACCOUNT = ONE WEBSITE, a fixed principle) — but nothing ever created
-- that row. Migration 0010's create_tenant_with_owner() only inserted
-- tenants + users.
--
-- Fixed as a trigger on `tenants`, not by editing 0010's already-shipped
-- function: a trigger guarantees the invariant for EVERY way a tenant row
-- can ever be created (registration today, a future console-created
-- tenant, anything else later) without every code path having to
-- remember to also create a website. It also composes correctly with
-- 0010's atomicity guarantee — this fires inside the same transaction,
-- so a rollback there rolls this back too.
-- =============================================================================

create function create_default_website_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme_id uuid;
  v_website_id uuid;
begin
  select id into v_theme_id from themes where is_active = true limit 1;

  insert into websites (tenant_id, theme_id)
  values (new.id, v_theme_id)
  returning id into v_website_id;

  insert into website_sections (website_id, type, order_index, is_visible)
  values
    (v_website_id, 'hero', 0, true),
    (v_website_id, 'property_grid', 1, true),
    (v_website_id, 'about', 2, true),
    (v_website_id, 'why_us', 3, true),
    (v_website_id, 'contact', 4, true),
    (v_website_id, 'footer', 5, true);

  return new;
end;
$$;

create trigger tenants_create_default_website
  after insert on tenants
  for each row
  execute function create_default_website_for_tenant();
