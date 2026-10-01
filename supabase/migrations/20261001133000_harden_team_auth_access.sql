-- Temporary-password members cannot use tenant permissions until onboarding is complete.
create or replace function public.auth_permission_scope(check_permission text)
returns public.data_scope
language sql stable security definer set search_path = ''
as $$
  select case
    when app_user.role = 'owner'::public.user_role then 'organization'::public.data_scope
    else (
      select grant_row.data_scope
      from public.user_permission_grants grant_row
      where grant_row.user_id = app_user.id
        and grant_row.permission = check_permission
      limit 1
    )
  end
  from public.users app_user
  where app_user.auth_user_id = auth.uid()
    and app_user.status <> 'disabled'
    and app_user.must_change_password = false
  limit 1;
$$;

revoke all on function public.auth_permission_scope(text) from public;
revoke execute on function public.auth_permission_scope(text) from anon;
grant execute on function public.auth_permission_scope(text) to authenticated;
revoke all on function public.auth_has_permission(text) from public;
revoke execute on function public.auth_has_permission(text) from anon;
grant execute on function public.auth_has_permission(text) to authenticated;
