-- Two tenants with a full role matrix (owner, admin, two agents, a disabled
-- admin) plus CRM records owned by agent two, and one platform admin.
\set ON_ERROR_STOP 1
insert into auth.users (id, phone, email) values
  ('00000000-0000-0000-0000-00000000a001', '+966500000001', 'a_owner@internal'),
  ('00000000-0000-0000-0000-00000000a002', '+966500000002', 'a_admin@internal'),
  ('00000000-0000-0000-0000-00000000a003', '+966500000003', 'a_agent1@internal'),
  ('00000000-0000-0000-0000-00000000a004', '+966500000004', 'a_agent2@internal'),
  ('00000000-0000-0000-0000-00000000a005', '+966500000005', 'a_disabled@internal'),
  ('00000000-0000-0000-0000-00000000b001', '+966500000011', 'b_owner@internal'),
  ('00000000-0000-0000-0000-00000000c001', '+966500000021', 'orphan@internal');

select tenant_id as tenant_a from create_tenant_with_owner('وكالة أ', 'Agency A', 'individual', 'agency-a',
  (select id from plans where is_active and not is_trial order by price limit 1), null,
  '00000000-0000-0000-0000-00000000a001', 'Owner A', '+966500000001', 'owner-a@example.com') \gset
select tenant_id as tenant_b from create_tenant_with_owner('وكالة ب', 'Agency B', 'individual', 'agency-b',
  (select id from plans where is_active and not is_trial order by price limit 1), null,
  '00000000-0000-0000-0000-00000000b001', 'Owner B', '+966500000011', 'owner-b@example.com') \gset

insert into users (tenant_id, auth_user_id, full_name, phone, role, status) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000a002', 'Admin A', '+966500000002', 'admin', 'active'),
  (:'tenant_a', '00000000-0000-0000-0000-00000000a003', 'Agent One', '+966500000003', 'agent', 'active'),
  (:'tenant_a', '00000000-0000-0000-0000-00000000a004', 'Agent Two', '+966500000004', 'agent', 'active'),
  (:'tenant_a', '00000000-0000-0000-0000-00000000a005', 'Disabled Admin', '+966500000005', 'admin', 'disabled');

update tenants set fal_license_number = 'FAL-1' where id in (:'tenant_a', :'tenant_b');

insert into assets (id, tenant_id, asset_type, name_ar) values
  ('00000000-0000-0000-0000-0000000aa001', :'tenant_a', 'apartment', 'شقة أ1'),
  ('00000000-0000-0000-0000-0000000aa002', :'tenant_a', 'apartment', 'شقة أ2'),
  ('00000000-0000-0000-0000-0000000bb001', :'tenant_b', 'villa', 'فيلا ب1');

insert into leads (id, tenant_id, full_name, phone, source, status, assigned_agent_id) values
  ('00000000-0000-0000-0000-00000000e001', :'tenant_a', 'Lead of agent one', '+966511111111', 'manual', 'new',
    (select id from users where auth_user_id = '00000000-0000-0000-0000-00000000a003')),
  ('00000000-0000-0000-0000-00000000e002', :'tenant_a', 'Lead of agent two', '+966522222222', 'manual', 'new',
    (select id from users where auth_user_id = '00000000-0000-0000-0000-00000000a004')),
  ('00000000-0000-0000-0000-00000000e101', :'tenant_b', 'Lead of tenant B', '+966533333333', 'manual', 'new', null);

insert into deals (id, tenant_id, lead_id, responsible_user_id, status, value, deal_type) values
  ('00000000-0000-0000-0000-00000000d002', :'tenant_a', '00000000-0000-0000-0000-00000000e002',
    (select id from users where auth_user_id = '00000000-0000-0000-0000-00000000a004'), 'open', 1500000, 'sale');
insert into deal_assets (tenant_id, deal_id, asset_id) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-0000000aa002');
insert into crm_activities (tenant_id, lead_id, activity_type, summary) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000e002', 'note', 'agent two private note');
insert into crm_tasks (tenant_id, lead_id, assigned_user_id, title) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000e002',
    (select id from users where auth_user_id = '00000000-0000-0000-0000-00000000a004'), 'agent two task');
insert into viewings (tenant_id, lead_id, asset_id, assigned_user_id, scheduled_at) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000aa002',
    (select id from users where auth_user_id = '00000000-0000-0000-0000-00000000a004'), now() + interval '1 day');
insert into reservations (id, tenant_id, reservation_number, lead_id, status) values
  ('00000000-0000-0000-0000-00000000f002', :'tenant_a', 'RSV-A2', '00000000-0000-0000-0000-00000000e002', 'active');
insert into reservation_assets (tenant_id, reservation_id, asset_id) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000aa002');
insert into lead_interests (tenant_id, lead_id, asset_id) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000aa002');
insert into lead_requirements (tenant_id, lead_id, notes) values
  (:'tenant_a', '00000000-0000-0000-0000-00000000e002', 'agent two requirement');

insert into auth.users (id, email, phone) values ('00000000-0000-0000-0000-0000000ad001', 'root@sbaah.test', null);
insert into platform_admins (auth_user_id, phone, full_name) values ('00000000-0000-0000-0000-0000000ad001', '+966500000099', 'Platform Root');

update auth.users set encrypted_password = crypt('Passw0rd!', gen_salt('bf')) where email <> 'root@sbaah.test';
update auth.users set encrypted_password = crypt('Adm1nPass!', gen_salt('bf')) where email = 'root@sbaah.test';
update users set email = 'agent2@example.com' where full_name = 'Agent Two';
update users set email = 'owner-a@example.com' where full_name = 'Owner A';
