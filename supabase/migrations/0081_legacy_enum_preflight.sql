-- 0081: inspect legacy enum dependencies before dropping obsolete enum types.
create or replace function legacy_real_estate_enum_dependencies()
returns table(enum_name text, object_schema text, object_name text, column_name text)
language sql security invoker set search_path=public
as $$
  select t.typname::text, n.nspname::text, c.relname::text, a.attname::text
  from pg_type t
  join pg_attribute a on a.atttypid=t.oid and a.attnum>0 and not a.attisdropped
  join pg_class c on c.oid=a.attrelid
  join pg_namespace n on n.oid=c.relnamespace
  where t.typname in ('property_type','property_availability','unit_availability','property_status')
    and n.nspname not in ('pg_catalog','information_schema')
  order by t.typname,n.nspname,c.relname,a.attname;
$$;
revoke all on function legacy_real_estate_enum_dependencies() from public;
grant execute on function legacy_real_estate_enum_dependencies() to authenticated;
