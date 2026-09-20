-- 0090: Explicitly lock Ejar Plus RPC surface.
-- SECURITY INVOKER functions still need explicit role ACLs; remove PUBLIC/anon execution.

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'create_lease_contract_bundle',
        'record_lease_payment',
        'refresh_contract_installment_statuses',
        'assert_lease_contract_no_asset_conflicts'
      )
  loop
    execute format('revoke execute on function %s from public',fn);
    execute format('revoke execute on function %s from anon',fn);
    execute format('grant execute on function %s to authenticated',fn);
  end loop;
end $$;
