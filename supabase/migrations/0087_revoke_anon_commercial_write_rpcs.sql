-- 0087: Remove explicit anon EXECUTE grants from commercial write RPCs.
-- 0086 removed PUBLIC inheritance; this migration also removes any direct anon ACL.

revoke execute on function public.create_listing_with_assets(jsonb, uuid[]) from anon;
revoke execute on function public.create_reservation_with_assets(jsonb, uuid[]) from anon;

grant execute on function public.create_listing_with_assets(jsonb, uuid[]) to authenticated;
grant execute on function public.create_reservation_with_assets(jsonb, uuid[]) to authenticated;
