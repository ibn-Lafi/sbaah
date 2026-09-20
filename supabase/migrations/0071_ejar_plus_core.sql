-- =============================================================================
-- Migration 0071: Ejar Plus operational core
-- Reuses unified assets/parties. No duplicate rental-property or lessee tables.
-- =============================================================================

create type property_management_status as enum ('active','paused','ended');
create type management_fee_type as enum ('fixed','percentage');
create type lease_contract_source as enum ('internal','ejar','external');
create type lease_contract_status as enum ('draft','upcoming','active','expired','terminated','cancelled');
create type lease_payment_frequency as enum ('one_time','monthly','quarterly','semi_annual','annual','custom');
create type lease_party_role as enum ('lessor','lessee','guarantor','representative');
create type lease_installment_status as enum ('scheduled','partially_paid','paid','overdue','cancelled');
create type lease_payment_method as enum ('cash','bank_transfer','card','sadad','other');
create type lease_payment_status as enum ('recorded','reversed');
create type maintenance_priority as enum ('low','normal','high','urgent');
create type maintenance_status as enum ('open','in_review','scheduled','in_progress','completed','cancelled');

create table property_management_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  asset_id uuid not null,
  starts_at date not null default current_date,
  ends_at date,
  status property_management_status not null default 'active',
  management_fee_type management_fee_type,
  management_fee_value numeric(14,4) check(management_fee_value is null or management_fee_value>=0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,tenant_id),
  foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict,
  check(ends_at is null or ends_at>=starts_at),
  check((management_fee_type is null and management_fee_value is null) or (management_fee_type is not null and management_fee_value is not null)),
  check(management_fee_type is distinct from 'percentage' or management_fee_value<=100)
);
create unique index property_management_one_active_idx on property_management_assignments(tenant_id,asset_id) where status='active';
create index property_management_tenant_status_idx on property_management_assignments(tenant_id,status);
create trigger property_management_assignments_set_updated_at before update on property_management_assignments for each row execute function set_updated_at();

create table lease_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contract_number text not null,
  source lease_contract_source not null default 'internal',
  external_contract_number text,
  start_date date not null,
  end_date date not null,
  total_value numeric(14,2) not null check(total_value>=0),
  security_deposit numeric(14,2) not null default 0 check(security_deposit>=0),
  payment_frequency lease_payment_frequency not null,
  status lease_contract_status not null default 'draft',
  signed_at timestamptz,
  terminated_at timestamptz,
  termination_reason text,
  renewed_from_contract_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,tenant_id),
  unique(tenant_id,contract_number),
  check(length(btrim(contract_number))>0),
  check(end_date>=start_date),
  check((status<>'terminated') or terminated_at is not null)
);
alter table lease_contracts
  add constraint lease_contracts_created_by_same_tenant foreign key(created_by,tenant_id) references users(id,tenant_id) on delete set null (created_by),
  add constraint lease_contracts_renewed_from_same_tenant foreign key(renewed_from_contract_id,tenant_id) references lease_contracts(id,tenant_id) on delete set null (renewed_from_contract_id);
create unique index lease_contracts_external_number_idx on lease_contracts(tenant_id,source,external_contract_number) where external_contract_number is not null;
create index lease_contracts_tenant_status_idx on lease_contracts(tenant_id,status);
create index lease_contracts_tenant_dates_idx on lease_contracts(tenant_id,start_date,end_date);
create trigger lease_contracts_set_updated_at before update on lease_contracts for each row execute function set_updated_at();

create table lease_contract_assets (
  tenant_id uuid not null references tenants(id) on delete cascade,
  contract_id uuid not null,
  asset_id uuid not null,
  allocated_value numeric(14,2) check(allocated_value is null or allocated_value>=0),
  created_at timestamptz not null default now(),
  primary key(contract_id,asset_id),
  foreign key(contract_id,tenant_id) references lease_contracts(id,tenant_id) on delete cascade,
  foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict
);
create index lease_contract_assets_tenant_asset_idx on lease_contract_assets(tenant_id,asset_id);

create table lease_contract_parties (
  tenant_id uuid not null references tenants(id) on delete cascade,
  contract_id uuid not null,
  party_id uuid not null,
  role lease_party_role not null,
  created_at timestamptz not null default now(),
  primary key(contract_id,party_id,role),
  foreign key(contract_id,tenant_id) references lease_contracts(id,tenant_id) on delete cascade,
  foreign key(party_id,tenant_id) references parties(id,tenant_id) on delete restrict
);
create index lease_contract_parties_tenant_party_idx on lease_contract_parties(tenant_id,party_id,role);

create table lease_installments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contract_id uuid not null,
  installment_number integer not null check(installment_number>0),
  due_date date not null,
  amount numeric(14,2) not null check(amount>=0),
  status lease_installment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,tenant_id),
  unique(tenant_id,contract_id,installment_number),
  foreign key(contract_id,tenant_id) references lease_contracts(id,tenant_id) on delete restrict
);
create index lease_installments_tenant_due_idx on lease_installments(tenant_id,due_date,status);
create trigger lease_installments_set_updated_at before update on lease_installments for each row execute function set_updated_at();

create table lease_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  payment_number text not null,
  contract_id uuid not null,
  payer_party_id uuid,
  amount numeric(14,2) not null check(amount>0),
  paid_at timestamptz not null default now(),
  payment_method lease_payment_method not null,
  status lease_payment_status not null default 'recorded',
  reference_number text,
  notes text,
  reversal_reason text,
  reversed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(id,tenant_id),
  unique(tenant_id,payment_number),
  check(length(btrim(payment_number))>0),
  check((status<>'reversed') or (reversed_at is not null and reversal_reason is not null))
);
alter table lease_payments
  add constraint lease_payments_contract_same_tenant foreign key(contract_id,tenant_id) references lease_contracts(id,tenant_id) on delete restrict,
  add constraint lease_payments_payer_same_tenant foreign key(payer_party_id,tenant_id) references parties(id,tenant_id) on delete restrict,
  add constraint lease_payments_created_by_same_tenant foreign key(created_by,tenant_id) references users(id,tenant_id) on delete set null (created_by);
create index lease_payments_tenant_contract_idx on lease_payments(tenant_id,contract_id,paid_at desc);

create table lease_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  payment_id uuid not null,
  installment_id uuid not null,
  amount numeric(14,2) not null check(amount>0),
  created_at timestamptz not null default now(),
  unique(id,tenant_id),
  unique(payment_id,installment_id),
  foreign key(payment_id,tenant_id) references lease_payments(id,tenant_id) on delete restrict,
  foreign key(installment_id,tenant_id) references lease_installments(id,tenant_id) on delete restrict
);
create index lease_payment_allocations_tenant_installment_idx on lease_payment_allocations(tenant_id,installment_id);

create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  request_number text not null,
  asset_id uuid not null,
  contract_id uuid,
  reported_by_party_id uuid,
  category text,
  title text not null,
  description text,
  priority maintenance_priority not null default 'normal',
  status maintenance_status not null default 'open',
  assigned_user_id uuid,
  vendor_party_id uuid,
  estimated_cost numeric(14,2) check(estimated_cost is null or estimated_cost>=0),
  actual_cost numeric(14,2) check(actual_cost is null or actual_cost>=0),
  opened_at timestamptz not null default now(),
  scheduled_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,tenant_id),
  unique(tenant_id,request_number),
  check(length(btrim(request_number))>0)
);
alter table maintenance_requests
  add constraint maintenance_asset_same_tenant foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict,
  add constraint maintenance_contract_same_tenant foreign key(contract_id,tenant_id) references lease_contracts(id,tenant_id) on delete set null (contract_id),
  add constraint maintenance_reporter_same_tenant foreign key(reported_by_party_id,tenant_id) references parties(id,tenant_id) on delete set null (reported_by_party_id),
  add constraint maintenance_assignee_same_tenant foreign key(assigned_user_id,tenant_id) references users(id,tenant_id) on delete set null (assigned_user_id),
  add constraint maintenance_vendor_same_tenant foreign key(vendor_party_id,tenant_id) references parties(id,tenant_id) on delete set null (vendor_party_id);
create index maintenance_requests_tenant_asset_idx on maintenance_requests(tenant_id,asset_id);
create index maintenance_requests_tenant_status_idx on maintenance_requests(tenant_id,status,priority);
create trigger maintenance_requests_set_updated_at before update on maintenance_requests for each row execute function set_updated_at();

-- Ensure payment allocation belongs to the same lease contract as the payment.
create or replace function validate_lease_payment_allocation()
returns trigger language plpgsql as $$
declare payment_contract uuid; installment_contract uuid; allocated numeric(14,2); payment_amount numeric(14,2); installment_amount numeric(14,2);
begin
  select contract_id,amount into payment_contract,payment_amount from lease_payments where id=new.payment_id and tenant_id=new.tenant_id and status='recorded';
  select contract_id,amount into installment_contract,installment_amount from lease_installments where id=new.installment_id and tenant_id=new.tenant_id;
  if payment_contract is null or installment_contract is null or payment_contract<>installment_contract then raise exception 'payment and installment must belong to the same active payment contract'; end if;
  select coalesce(sum(amount),0) into allocated from lease_payment_allocations where tenant_id=new.tenant_id and payment_id=new.payment_id and id<>new.id;
  if allocated+new.amount>payment_amount then raise exception 'payment allocation exceeds payment amount'; end if;
  select coalesce(sum(amount),0) into allocated from lease_payment_allocations where tenant_id=new.tenant_id and installment_id=new.installment_id and id<>new.id;
  if allocated+new.amount>installment_amount then raise exception 'payment allocation exceeds installment amount'; end if;
  return new;
end $$;
create trigger lease_payment_allocations_validate before insert or update on lease_payment_allocations for each row execute function validate_lease_payment_allocation();

-- RLS: operational Ejar Plus tables are tenant-private.
alter table property_management_assignments enable row level security;
alter table lease_contracts enable row level security;
alter table lease_contract_assets enable row level security;
alter table lease_contract_parties enable row level security;
alter table lease_installments enable row level security;
alter table lease_payments enable row level security;
alter table lease_payment_allocations enable row level security;
alter table maintenance_requests enable row level security;

create policy property_management_assignments_tenant_manage on property_management_assignments for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy lease_contracts_tenant_manage on lease_contracts for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy lease_contract_assets_tenant_manage on lease_contract_assets for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy lease_contract_parties_tenant_manage on lease_contract_parties for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy lease_installments_tenant_manage on lease_installments for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy lease_payments_tenant_manage on lease_payments for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy lease_payment_allocations_tenant_manage on lease_payment_allocations for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));
create policy maintenance_requests_tenant_manage on maintenance_requests for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));

revoke all on property_management_assignments,lease_contracts,lease_contract_assets,lease_contract_parties,lease_installments,lease_payments,lease_payment_allocations,maintenance_requests from anon,authenticated;
grant select,insert,update,delete on property_management_assignments,lease_contracts,lease_contract_assets,lease_contract_parties,lease_installments,lease_payments,lease_payment_allocations,maintenance_requests to authenticated;
