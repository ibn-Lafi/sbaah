-- =============================================================================
-- Migration 0052: centralized permission/scoping foundation
-- Keeps the existing owner/admin/agent enum intact while giving RLS a single
-- permission vocabulary that can replace scattered role comparisons gradually.
-- =============================================================================

create type data_scope as enum ('own', 'assigned', 'team', 'organization');

create table role_permission_grants (
  role user_role not null,
  permission text not null,
  data_scope data_scope not null,
  primary key (role, permission)
);

revoke all on table role_permission_grants from anon, authenticated;

insert into role_permission_grants (role, permission, data_scope)
select 'owner'::user_role, permission, 'organization'::data_scope
from unnest(array[
  'tenant.settings.read','tenant.settings.manage','team.read','team.manage',
  'properties.read','properties.create','properties.update','properties.publish','properties.archive',
  'projects.read','projects.create','projects.update','projects.publish','projects.archive',
  'crm.read','crm.create','crm.update','crm.assign','crm.manage',
  'website.read','website.manage','billing.read','billing.manage','reports.read'
]) as permission;

insert into role_permission_grants (role, permission, data_scope)
select 'admin'::user_role, permission, 'organization'::data_scope
from unnest(array[
  'tenant.settings.read','team.read','team.manage',
  'properties.read','properties.create','properties.update','properties.publish','properties.archive',
  'projects.read','projects.create','projects.update','projects.publish','projects.archive',
  'crm.read','crm.create','crm.update','crm.assign','crm.manage',
  'website.read','website.manage','billing.read','reports.read'
]) as permission;

insert into role_permission_grants (role, permission, data_scope)
values
  ('agent', 'properties.read', 'organization'),
  ('agent', 'properties.create', 'assigned'),
  ('agent', 'properties.update', 'assigned'),
  ('agent', 'projects.read', 'organization'),
  ('agent', 'crm.read', 'assigned'),
  ('agent', 'crm.create', 'assigned'),
  ('agent', 'crm.update', 'assigned'),
  ('agent', 'reports.read', 'assigned');

create function auth_permission_scope(check_permission text)
returns data_scope
language sql
stable
security definer
set search_path = ''
as $$
  select grants.data_scope
  from public.role_permission_grants grants
  join public.users app_user
    on app_user.auth_user_id = auth.uid()
  where grants.role = app_user.role
    and grants.permission = check_permission
  limit 1;
$$;

create function auth_has_permission(check_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.auth_permission_scope(check_permission) is not null;
$$;

revoke all on function auth_permission_scope(text) from public;
revoke all on function auth_has_permission(text) from public;
grant execute on function auth_permission_scope(text) to authenticated;
grant execute on function auth_has_permission(text) to authenticated;
