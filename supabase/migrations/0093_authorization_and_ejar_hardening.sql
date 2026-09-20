-- Close direct-Supabase authorization gaps left after the unified real-estate cutover.

create or replace function prevent_users_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.id = auth_app_user_id() and (
    new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.tenant_id is distinct from old.tenant_id
    or new.phone is distinct from old.phone
    or new.auth_user_id is distinct from old.auth_user_id
  ) then
    raise exception 'not allowed to change privileged fields on your own account';
  end if;

  if auth_user_role() = 'admin' and (old.role = 'owner' or new.role = 'owner') then
    raise exception 'administrators cannot create, promote, or modify owners';
  end if;

  return new;
end;
$$;

-- Ejar Plus reads remain available to the tenant team, while every write is
-- restricted to owner/admin. SECURITY INVOKER RPCs inherit these policies.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'property_management_assignments',
    'lease_contracts',
    'lease_contract_assets',
    'lease_contract_parties',
    'lease_installments',
    'lease_payments',
    'lease_payment_allocations',
    'maintenance_requests'
  ] loop
    execute format('drop policy if exists %I_tenant_manage on %I', table_name, table_name);
    execute format(
      'create policy %I_tenant_select on %I for select to authenticated using (tenant_id=auth_tenant_id())',
      table_name,
      table_name
    );
    execute format(
      'create policy %I_owner_admin_write on %I for all to authenticated using (tenant_id=auth_tenant_id() and auth_user_role() in (''owner'',''admin'')) with check (tenant_id=auth_tenant_id() and auth_user_role() in (''owner'',''admin'') and is_tenant_active(tenant_id))',
      table_name,
      table_name
    );
  end loop;
end;
$$;

create or replace function validate_lease_contract_parties()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  contract_id_value uuid := coalesce(new.contract_id, old.contract_id);
  tenant_id_value uuid := coalesce(new.tenant_id, old.tenant_id);
begin
  if not exists (
    select 1 from lease_contract_parties
    where contract_id=contract_id_value and tenant_id=tenant_id_value and role='lessor'
  ) or not exists (
    select 1 from lease_contract_parties
    where contract_id=contract_id_value and tenant_id=tenant_id_value and role='lessee'
  ) then
    raise exception 'lease contract requires at least one lessor and one lessee';
  end if;
  return null;
end;
$$;

drop trigger if exists lease_contract_parties_validate_roles on lease_contract_parties;
create constraint trigger lease_contract_parties_validate_roles
after insert or update or delete on lease_contract_parties
deferrable initially deferred
for each row execute function validate_lease_contract_parties();

create or replace function validate_maintenance_contract_asset()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.contract_id is not null and not exists (
    select 1 from lease_contract_assets
    where tenant_id=new.tenant_id and contract_id=new.contract_id and asset_id=new.asset_id
  ) then
    raise exception 'maintenance asset must belong to the selected lease contract';
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_requests_validate_contract_asset on maintenance_requests;
create trigger maintenance_requests_validate_contract_asset
before insert or update of tenant_id, contract_id, asset_id on maintenance_requests
for each row execute function validate_maintenance_contract_asset();
