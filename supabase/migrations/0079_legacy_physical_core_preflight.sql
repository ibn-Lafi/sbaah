-- 0079 is intentionally non-destructive: expose every database dependency
-- that must be removed/refactored before dropping the legacy physical tables.
create or replace function legacy_physical_core_dependencies()
returns table(object_type text, object_schema text, object_name text, dependency text)
language sql
security invoker
set search_path = public
as $$
  with legacy as (
    select c.oid, n.nspname schema_name, c.relname table_name
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('properties','property_media','buildings','units','rentals')
  )
  select 'foreign_key', ns.nspname, cl.relname, con.conname
  from pg_constraint con
  join pg_class cl on cl.oid=con.conrelid
  join pg_namespace ns on ns.oid=cl.relnamespace
  join legacy l on con.confrelid=l.oid
  where con.contype='f'
  union all
  select 'view', nv.nspname, v.relname, l.table_name
  from pg_depend d
  join pg_rewrite r on r.oid=d.objid
  join pg_class v on v.oid=r.ev_class
  join pg_namespace nv on nv.oid=v.relnamespace
  join legacy l on l.oid=d.refobjid
  where v.relkind in ('v','m')
  union all
  select 'policy', schemaname, tablename, policyname
  from pg_policies
  where schemaname='public' and (
    coalesce(qual,'') ~ '\\m(properties|property_media|buildings|units|rentals)\\M'
    or coalesce(with_check,'') ~ '\\m(properties|property_media|buildings|units|rentals)\\M'
  );
$$;
revoke all on function legacy_physical_core_dependencies() from public;
grant execute on function legacy_physical_core_dependencies() to authenticated;
