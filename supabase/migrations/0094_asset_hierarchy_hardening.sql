-- Prevent cycles in the unified asset hierarchy. Same-tenant parent integrity
-- is already enforced by assets_parent_same_tenant.
create or replace function prevent_asset_hierarchy_cycle()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_asset_id is null then
    return new;
  end if;

  if new.parent_asset_id = new.id then
    raise exception using errcode = '23514', message = 'An asset cannot be its own parent';
  end if;

  if exists (
    with recursive ancestors(id, parent_asset_id) as (
      select a.id, a.parent_asset_id from assets a where a.id = new.parent_asset_id
      union all
      select a.id, a.parent_asset_id from assets a join ancestors p on a.id = p.parent_asset_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception using errcode = '23514', message = 'Asset hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

drop trigger if exists assets_prevent_hierarchy_cycle on assets;
create trigger assets_prevent_hierarchy_cycle
before insert or update of parent_asset_id on assets
for each row execute function prevent_asset_hierarchy_cycle();
