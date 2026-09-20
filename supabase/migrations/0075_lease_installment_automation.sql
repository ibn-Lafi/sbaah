-- =============================================================================
-- Migration 0075: Ejar Plus installment schedule + automatic financial status
-- =============================================================================

create or replace function refresh_lease_installment_status(p_installment_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_amount numeric(14,2);
  v_due date;
  v_current lease_installment_status;
  v_paid numeric(14,2);
begin
  select amount,due_date,status into v_amount,v_due,v_current
  from lease_installments
  where id=p_installment_id and tenant_id=auth_tenant_id();

  if not found or v_current='cancelled' then return; end if;

  select coalesce(sum(a.amount),0) into v_paid
  from lease_payment_allocations a
  join lease_payments p on p.id=a.payment_id and p.tenant_id=a.tenant_id
  where a.installment_id=p_installment_id
    and a.tenant_id=auth_tenant_id()
    and p.status='recorded';

  update lease_installments
  set status=case
    when v_paid>=v_amount then 'paid'::lease_installment_status
    when v_paid>0 then 'partially_paid'::lease_installment_status
    when v_due<current_date then 'overdue'::lease_installment_status
    else 'scheduled'::lease_installment_status
  end
  where id=p_installment_id and tenant_id=auth_tenant_id();
end $$;

create or replace function refresh_contract_installment_statuses(p_contract_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
declare r record;
begin
  for r in select id from lease_installments where contract_id=p_contract_id and tenant_id=auth_tenant_id()
  loop perform refresh_lease_installment_status(r.id); end loop;
end $$;

create or replace function generate_lease_installments(p_contract_id uuid)
returns setof lease_installments
language plpgsql
security invoker
set search_path=public
as $$
declare
  c lease_contracts;
  v_months int;
  v_count int;
  v_i int;
  v_due date;
  v_base numeric(14,2);
  v_amount numeric(14,2);
begin
  select * into c from lease_contracts where id=p_contract_id and tenant_id=auth_tenant_id();
  if not found then raise exception 'lease contract not found in current tenant'; end if;
  if c.payment_frequency='custom' then raise exception 'custom payment frequency requires manual installments'; end if;
  if exists(select 1 from lease_installments where contract_id=c.id and tenant_id=c.tenant_id) then
    raise exception 'installments already exist for this contract';
  end if;

  v_months:=case c.payment_frequency when 'monthly' then 1 when 'quarterly' then 3 when 'semi_annual' then 6 when 'annual' then 12 else null end;
  if c.payment_frequency='one_time' then
    v_count:=1;
  else
    v_count:=greatest(1,ceil(((extract(year from age(c.end_date,c.start_date))*12)+extract(month from age(c.end_date,c.start_date))+1)/v_months::numeric)::int);
  end if;
  v_base:=round(c.total_value/v_count,2);

  for v_i in 1..v_count loop
    v_due:=case when c.payment_frequency='one_time' then c.start_date else least((c.start_date+make_interval(months=>(v_i-1)*v_months))::date,c.end_date) end;
    v_amount:=case when v_i=v_count then c.total_value-(v_base*(v_count-1)) else v_base end;
    insert into lease_installments(tenant_id,contract_id,installment_number,due_date,amount)
    values(c.tenant_id,c.id,v_i,v_due,v_amount);
  end loop;

  perform refresh_contract_installment_statuses(c.id);
  return query select * from lease_installments where contract_id=c.id and tenant_id=c.tenant_id order by installment_number;
end $$;

create or replace function sync_installment_after_allocation()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  perform refresh_lease_installment_status(coalesce(new.installment_id,old.installment_id));
  return coalesce(new,old);
end $$;

create trigger lease_allocations_sync_installment
after insert or update or delete on lease_payment_allocations
for each row execute function sync_installment_after_allocation();

create or replace function sync_installments_after_payment_status()
returns trigger language plpgsql security invoker set search_path=public as $$
declare r record;
begin
  if old.status is distinct from new.status then
    for r in select installment_id from lease_payment_allocations where payment_id=new.id and tenant_id=new.tenant_id
    loop perform refresh_lease_installment_status(r.installment_id); end loop;
  end if;
  return new;
end $$;

create trigger lease_payments_sync_installments
after update of status on lease_payments
for each row execute function sync_installments_after_payment_status();

create or replace function mark_overdue_lease_installments()
returns integer
language plpgsql
security invoker
set search_path=public
as $$
declare v_count integer;
begin
  update lease_installments i
  set status='overdue'
  where i.tenant_id=auth_tenant_id()
    and i.due_date<current_date
    and i.status='scheduled'
    and not exists(
      select 1 from lease_payment_allocations a
      join lease_payments p on p.id=a.payment_id and p.tenant_id=a.tenant_id and p.status='recorded'
      where a.installment_id=i.id
    );
  get diagnostics v_count=row_count;
  return v_count;
end $$;

revoke all on function generate_lease_installments(uuid),refresh_lease_installment_status(uuid),refresh_contract_installment_statuses(uuid),mark_overdue_lease_installments() from public;
grant execute on function generate_lease_installments(uuid),refresh_lease_installment_status(uuid),refresh_contract_installment_statuses(uuid),mark_overdue_lease_installments() to authenticated;
