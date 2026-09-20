-- 0089: Lock the CRM deal bundle writer to authenticated callers only.
-- 0077 removed PUBLIC execution but older/default ACLs may still leave anon direct EXECUTE.

revoke execute on function public.create_deal_with_assets(jsonb, uuid[]) from public;
revoke execute on function public.create_deal_with_assets(jsonb, uuid[]) from anon;
grant execute on function public.create_deal_with_assets(jsonb, uuid[]) to authenticated;
