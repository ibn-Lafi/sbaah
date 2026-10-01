-- Preserve permissions for existing Admin/Agent accounts when per-user grants become authoritative.
insert into public.user_permission_grants (user_id, permission, data_scope)
select u.id, r.permission, r.data_scope
from public.users u
join public.role_permission_grants r on r.role = u.role
where u.role <> 'owner'::public.user_role
on conflict (user_id, permission) do nothing;
