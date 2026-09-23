-- 0114: Only members of an active tenant may add a district.
--
-- 0046 lets every dashboard user add a missing neighbourhood to the shared
-- districts list, but its policy is `with check (true)`: any authenticated
-- JWT qualified, including an Auth user with no tenant membership, a
-- disabled member and a suspended tenant's team, and every tenant sees the
-- rows they add. Same intent, limited to active members of active tenants.
-- Safe to re-run; no data changes.

drop policy if exists districts_tenant_insert on districts;
create policy districts_tenant_insert on districts for insert to authenticated
  with check (auth_tenant_id() is not null and is_tenant_active(auth_tenant_id()));
