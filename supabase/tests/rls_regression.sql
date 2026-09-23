-- =============================================================================
-- RLS / privilege regression checks. Run by run.sh after seed.sql.
-- Every block acts as one identity inside a rolled-back transaction; any
-- violated expectation raises and stops the run with a non-zero exit.
-- =============================================================================
\set ON_ERROR_STOP 1

create schema regression;
grant usage on schema regression to anon, authenticated, service_role;

create function regression.check(condition boolean, label text) returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'FAIL: %', label;
  end if;
end $$;

-- Runs `statement` as the current role and requires it to be rejected with
-- `expected_state` (SQLSTATE). A rejection with another state fails too.
create function regression.expect_rejected(statement text, expected_state text, label text) returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'FAIL: % (statement was accepted)', label;
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
  if sqlstate <> expected_state then
    raise exception 'FAIL: % (expected SQLSTATE %, got %: %)', label, expected_state, sqlstate, sqlerrm;
  end if;
end $$;

create function regression.act_as(auth_user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', auth_user_id::text, true);
$$;

grant execute on all functions in schema regression to anon, authenticated, service_role;

-- Fixture ids (seed.sql)
--   a001 owner A · a002 admin A · a003 agent one · a004 agent two · a005 disabled admin A · b001 owner B
--   e001 lead of agent one · e002 lead of agent two · e101 lead of tenant B
--   aa001 free asset · aa002 asset reserved by agent two (RSV-A2) · d002 deal of agent two

\echo 'service-only functions'
do $$ begin
  perform regression.check(not has_function_privilege('anon', 'create_tenant_with_owner(text,text,account_type,text,uuid,timestamptz,uuid,text,text,text)', 'execute'), 'anon cannot create tenants');
  perform regression.check(not has_function_privilege('authenticated', 'create_tenant_with_owner(text,text,account_type,text,uuid,timestamptz,uuid,text,text,text)', 'execute'), 'members cannot create tenants');
  perform regression.check(has_function_privilege('service_role', 'create_tenant_with_owner(text,text,account_type,text,uuid,timestamptz,uuid,text,text,text)', 'execute'), 'service role creates tenants');
  perform regression.check(not has_function_privilege('anon', 'create_public_lead_with_interest(uuid,jsonb,jsonb)', 'execute'), 'anon cannot write public leads directly');
  perform regression.check(not has_function_privilege('authenticated', 'consume_rate_limit(text,text,integer,integer)', 'execute'), 'members cannot touch rate limits');
  perform regression.check(not has_function_privilege('anon', 'security_schema_assertions()', 'execute'), 'anon cannot read schema diagnostics');
end $$;

\echo 'anonymous access'
begin;
set local role anon;
do $$ begin
  perform regression.check((select count(*) from leads) = 0 and (select count(*) from users) = 0 and (select count(*) from tenants) = 0, 'anon reads no tenant data');
  perform regression.expect_rejected($q$insert into leads (tenant_id, full_name, source, status) values ('00000000-0000-0000-0000-000000000000', 'x', 'manual', 'new')$q$, '42501', 'anon cannot insert leads');
end $$;
rollback;

\echo 'disabled member'
begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a005');
do $$ begin
  perform regression.check(auth_tenant_id() is null and auth_user_role() is null and auth_app_user_id() is null and auth_permission_scope('crm.read') is null, 'disabled member resolves no identity');
  perform regression.check((select count(*) from leads) = 0 and (select count(*) from users) = 0 and (select count(*) from tenants) = 0 and (select count(*) from assets) = 0, 'disabled member reads nothing');
  perform regression.check(not auth_can_access_lead('00000000-0000-0000-0000-00000000e001'), 'disabled member reaches no lead');
end $$;
rollback;

\echo 'team member writes'
begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a002');
do $$ begin
  perform regression.check(auth_user_role() = 'admin' and (select count(*) from leads) = 2 and (select count(*) from users) = 5, 'active admin keeps tenant access');
  perform regression.expect_rejected($q$insert into users (tenant_id, auth_user_id, full_name, phone, role, status) values (auth_tenant_id(), '00000000-0000-0000-0000-00000000c001', 'Shadow', '+966588888888', 'owner', 'active')$q$, '42501', 'admin cannot insert a team row');
  perform regression.expect_rejected($q$update users set auth_user_id = '00000000-0000-0000-0000-00000000c001' where full_name = 'Agent Two'$q$, 'P0001', 'admin cannot re-point a member identity');
  perform regression.expect_rejected($q$update users set phone = '+966577777777' where full_name = 'Agent Two'$q$, 'P0001', 'admin cannot change a member phone directly');
  perform regression.expect_rejected($q$update users set status = 'disabled' where full_name = 'Owner A'$q$, 'P0001', 'admin cannot disable the owner');
end $$;
with deleted as (delete from users where full_name = 'Owner A' returning 1)
select regression.check(count(*) = 0, 'admin cannot delete the owner') from deleted;
with updated as (update users set status = 'disabled' where full_name = 'Agent Two' returning 1)
select regression.check(count(*) = 1, 'admin can disable an agent') from updated;
rollback;

begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a001');
do $$ begin
  perform regression.expect_rejected($q$update users set role = 'owner' where full_name = 'Admin A'$q$, 'P0001', 'owner cannot create a second owner');
  perform regression.expect_rejected($q$update users set role = 'admin' where full_name = 'Owner A'$q$, 'P0001', 'owner cannot change their own role');
end $$;
with updated as (update users set role = 'admin' where full_name = 'Agent One' returning 1)
select regression.check(count(*) = 1, 'owner can promote an agent') from updated;
rollback;

begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a003');
with updated as (update users set email = 'agent1@example.com', full_name = 'Agent One Renamed' where auth_user_id = auth.uid() returning 1)
select regression.check(count(*) = 1, 'member edits own email and name') from updated;
do $$ begin
  perform regression.expect_rejected($q$update users set role = 'admin' where auth_user_id = auth.uid()$q$, 'P0001', 'member cannot raise own role');
end $$;
rollback;

\echo 'tenant isolation'
select id as tenant_a from tenants where subdomain = 'agency-a' \gset
begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000b001');
do $$ begin
  perform regression.check(
    (select count(*) from leads where tenant_id <> auth_tenant_id()) = 0
    and (select count(*) from deals where tenant_id <> auth_tenant_id()) = 0
    and (select count(*) from assets where tenant_id <> auth_tenant_id()) = 0
    and (select count(*) from users where tenant_id <> auth_tenant_id()) = 0
    and (select count(*) from reservations where tenant_id <> auth_tenant_id()) = 0
    and (select count(*) from tenants where id <> auth_tenant_id()) = 0,
    'owner B sees nothing of tenant A');
end $$;
select regression.expect_rejected(format($q$insert into leads (tenant_id, full_name, source, status) values (%L, 'x', 'manual', 'new')$q$, :'tenant_a'), '42501', 'owner B cannot write into tenant A');
select regression.expect_rejected(format($q$select * from get_asset_commercial_availability(%L, '00000000-0000-0000-0000-0000000aa002')$q$, :'tenant_a'), '42501', 'availability engine refuses a foreign tenant id');
with updated as (update tenants set name_ar = 'x' where id = :'tenant_a' returning 1)
select regression.check(count(*) = 0, 'owner B cannot update tenant A') from updated;
rollback;

\echo 'agent CRM scope'
begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a003');
do $$ begin
  perform regression.check(
    (select count(*) from deals) = 0 and (select count(*) from deal_assets) = 0
    and (select count(*) from crm_activities) = 0 and (select count(*) from crm_tasks) = 0
    and (select count(*) from viewings) = 0 and (select count(*) from reservations) = 0
    and (select count(*) from reservation_assets) = 0 and (select count(*) from lead_interests) = 0
    and (select count(*) from lead_requirements) = 0 and (select count(*) from leads) = 1,
    'agent one sees none of agent two''s CRM records');
  perform regression.expect_rejected($q$insert into crm_activities (tenant_id, lead_id, user_id, activity_type, summary) values (auth_tenant_id(), '00000000-0000-0000-0000-00000000e002', auth_app_user_id(), 'note', 'x')$q$, '42501', 'agent cannot log activity on another agent''s lead');
  perform regression.expect_rejected($q$insert into lead_interests (tenant_id, lead_id, asset_id) values (auth_tenant_id(), '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000aa001')$q$, '42501', 'agent cannot add interests to another agent''s lead');
  perform regression.expect_rejected($q$insert into tracking_pixels (tenant_id, provider, pixel_id) values (auth_tenant_id(), 'meta', '1')$q$, '42501', 'agent cannot manage tracking pixels');
  perform regression.expect_rejected($q$select close_sale_deal('00000000-0000-0000-0000-00000000d002', 1)$q$, '42501', 'agent cannot close another agent''s deal');
end $$;
with updated as (update deals set value = 1 where id = '00000000-0000-0000-0000-00000000d002' returning 1)
select regression.check(count(*) = 0, 'agent cannot modify another agent''s deal') from updated;
insert into crm_activities (tenant_id, lead_id, user_id, activity_type, summary)
  values (auth_tenant_id(), '00000000-0000-0000-0000-00000000e001', auth_app_user_id(), 'note', 'own lead');
insert into crm_tasks (tenant_id, lead_id, assigned_user_id, title)
  values (auth_tenant_id(), '00000000-0000-0000-0000-00000000e001', auth_app_user_id(), 'own task');
select regression.check(count(*) = 1, 'agent reserves a free asset for own lead') from create_reservation_with_assets(
  jsonb_build_object('reservation_number', 'RSV-A1', 'lead_id', '00000000-0000-0000-0000-00000000e001', 'status', 'active'),
  array['00000000-0000-0000-0000-0000000aa001']::uuid[]);
do $$ begin
  perform regression.expect_rejected($q$select create_reservation_with_assets(jsonb_build_object('reservation_number', 'RSV-X', 'lead_id', '00000000-0000-0000-0000-00000000e001', 'status', 'active'), array['00000000-0000-0000-0000-0000000aa002']::uuid[])$q$, 'P0001', 'conflict detection sees other agents'' reservations');
  perform regression.check((select status from get_asset_commercial_availability(auth_tenant_id(), '00000000-0000-0000-0000-0000000aa002')) = 'reserved', 'agent sees another agent''s hold in availability');
end $$;
rollback;

begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a004');
do $$ begin
  perform regression.check(
    (select count(*) from deals) = 1 and (select count(*) from crm_activities) = 1 and (select count(*) from crm_tasks) = 1
    and (select count(*) from viewings) = 1 and (select count(*) from reservations) = 1 and (select count(*) from lead_interests) = 1,
    'agent two sees own CRM records');
end $$;
rollback;

begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a002');
with updated as (update deals set value = 1600000 where id = '00000000-0000-0000-0000-00000000d002' returning 1)
select regression.check(count(*) = 1, 'admin manages every deal') from updated;
rollback;

\echo 'sale closing'
begin;
insert into listings (id, tenant_id, listing_number, listing_type, title_ar, asking_price, publication_status)
  select '00000000-0000-0000-0000-00000000c0a1', tenant_id, 'L-REG', 'sale', 'عرض', 900000, 'published' from users where full_name = 'Owner A';
insert into listing_assets (tenant_id, listing_id, asset_id)
  select tenant_id, '00000000-0000-0000-0000-00000000c0a1', '00000000-0000-0000-0000-0000000aa001' from users where full_name = 'Owner A';
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a003');
select id as own_deal from create_deal_with_assets(
  jsonb_build_object('lead_id', '00000000-0000-0000-0000-00000000e001', 'deal_type', 'sale', 'status', 'open',
    'responsible_user_id', auth_app_user_id()::text, 'value', 900000, 'listing_id', '00000000-0000-0000-0000-00000000c0a1'),
  array['00000000-0000-0000-0000-0000000aa001']::uuid[]) \gset
select regression.check(status = 'won', 'agent closes own sale with a listing') from close_sale_deal(:'own_deal', 950000);
do $$ begin
  perform regression.expect_rejected(format('select close_sale_deal(%L, 1)', (select id from deals where status = 'won' limit 1)), 'P0001', 'a won deal cannot be closed again');
end $$;
rollback;

\echo 'suspended tenant is read-only'
begin;
update tenants set status = 'suspended' where subdomain = 'agency-b';
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000b001');
do $$ begin
  perform regression.check((select count(*) from leads) = 1, 'suspended owner can still read');
  perform regression.expect_rejected($q$insert into crm_activities (tenant_id, lead_id, user_id, activity_type, summary) values (auth_tenant_id(), '00000000-0000-0000-0000-00000000e101', auth_app_user_id(), 'note', 'x')$q$, '42501', 'suspended tenant cannot write CRM records');
end $$;
rollback;

\echo 'support center'
begin;
set local role authenticated;
select regression.act_as('00000000-0000-0000-0000-00000000a003');
do $$ begin
  perform regression.expect_rejected($q$insert into support_tickets (ticket_number, tenant_id, created_by_user_id, requester_name, requester_email, type, category, subject, description) values ('SBA-REG-1', auth_tenant_id(), (select id from users where full_name = 'Owner A'), 'x', 'x@example.com', 'support', 'other', 'subject', 'description')$q$, '42501', 'member cannot file a ticket as another user');
end $$;
insert into support_tickets (ticket_number, tenant_id, created_by_user_id, requester_name, requester_email, type, category, subject, description)
  values ('SBA-REG-2', auth_tenant_id(), auth_app_user_id(), 'x', 'x@example.com', 'support', 'other', 'subject', 'description');
rollback;

\echo 'rate limit bookkeeping'
begin;
set local role service_role;
do $$ begin
  perform regression.check(consume_rate_limit('regression', '198.51.100.1', 60, 2), 'first event allowed');
  perform regression.check(consume_rate_limit('regression', '198.51.100.1', 60, 2), 'second event allowed');
  perform regression.check(not consume_rate_limit('regression', '198.51.100.1', 60, 2), 'third event refused');
  perform regression.check(consume_rate_limit('regression', '198.51.100.2', 60, 2), 'other subjects are independent');
end $$;
rollback;

\echo 'profile-change OTP purposes'
begin;
insert into otp_verifications (channel, phone, purpose, expires_at) values ('sms', '+966500000099', 'change_phone', now() + interval '5 minutes');
insert into otp_verifications (channel, email, code_hash, purpose, expires_at) values ('email', 'x@example.com', 'hash', 'change_email', now() + interval '5 minutes');
rollback;

\echo 'RLS regression: all checks passed'
