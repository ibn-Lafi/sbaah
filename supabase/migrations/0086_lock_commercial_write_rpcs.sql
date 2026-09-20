-- 0086: Explicitly lock commercial write RPCs to authenticated callers.
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default, so revoking
-- from PUBLIC is required in addition to granting authenticated.

revoke execute on function public.create_listing_with_assets(jsonb, uuid[]) from public;
revoke execute on function public.create_reservation_with_assets(jsonb, uuid[]) from public;

grant execute on function public.create_listing_with_assets(jsonb, uuid[]) to authenticated;
grant execute on function public.create_reservation_with_assets(jsonb, uuid[]) to authenticated;
