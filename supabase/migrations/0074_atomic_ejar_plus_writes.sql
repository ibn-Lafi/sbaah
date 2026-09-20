-- =============================================================================
-- Migration 0074: Atomic Ejar Plus contract/payment writes
-- =============================================================================
create or replace function create_lease_contract_bundle(p_contract jsonb,p_asset_ids uuid[],p_parties jsonb)
returns lease_contracts language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id();v_user uuid;v_contract lease_contracts;v_requested int;v_owned int;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 v_requested:=coalesce(array_length(p_asset_ids,1),0); if v_requested=0 then raise exception 'at least one asset is required'; end if;
 select count(distinct id) into v_owned from assets where tenant_id=v_tenant and id=any(p_asset_ids) and archived_at is null;
 if v_owned<>v_requested then raise exception 'one or more assets do not exist in the current tenant'; end if;
 if jsonb_array_length(coalesce(p_parties,'[]'::jsonb))<2 then raise exception 'contract parties are required'; end if;
 if exists(select 1 from jsonb_array_elements(p_parties) p left join parties x on x.id=(p->>'party_id')::uuid and x.tenant_id=v_tenant where x.id is null) then raise exception 'one or more parties do not exist in the current tenant'; end if;
 select id into v_user from users where tenant_id=v_tenant and auth_user_id=auth.uid() limit 1;
 insert into lease_contracts(tenant_id,contract_number,source,external_contract_number,start_date,end_date,total_value,security_deposit,payment_frequency,status,signed_at,renewed_from_contract_id,notes,created_by)
 values(v_tenant,p_contract->>'contract_number',coalesce((p_contract->>'source')::lease_contract_source,'internal'),nullif(p_contract->>'external_contract_number',''),(p_contract->>'start_date')::date,(p_contract->>'end_date')::date,(p_contract->>'total_value')::numeric,coalesce((p_contract->>'security_deposit')::numeric,0),(p_contract->>'payment_frequency')::lease_payment_frequency,coalesce((p_contract->>'status')::lease_contract_status,'draft'),case when nullif(p_contract->>'signed_at','') is null then null else (p_contract->>'signed_at')::timestamptz end,case when nullif(p_contract->>'renewed_from_contract_id','') is null then null else (p_contract->>'renewed_from_contract_id')::uuid end,nullif(p_contract->>'notes',''),v_user) returning * into v_contract;
 insert into lease_contract_assets(tenant_id,contract_id,asset_id) select v_tenant,v_contract.id,x from unnest(p_asset_ids)x;
 insert into lease_contract_parties(tenant_id,contract_id,party_id,role) select v_tenant,v_contract.id,(p->>'party_id')::uuid,(p->>'role')::lease_party_role from jsonb_array_elements(p_parties)p;
 return v_contract;
end $$;

create or replace function record_lease_payment(p_payment jsonb,p_allocations jsonb default '[]'::jsonb)
returns lease_payments language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id();v_user uuid;v_payment lease_payments;v_sum numeric;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 select id into v_user from users where tenant_id=v_tenant and auth_user_id=auth.uid() limit 1;
 insert into lease_payments(tenant_id,payment_number,contract_id,payer_party_id,amount,paid_at,payment_method,reference_number,notes,created_by)
 values(v_tenant,p_payment->>'payment_number',(p_payment->>'contract_id')::uuid,case when nullif(p_payment->>'payer_party_id','') is null then null else (p_payment->>'payer_party_id')::uuid end,(p_payment->>'amount')::numeric,coalesce((p_payment->>'paid_at')::timestamptz,now()),(p_payment->>'payment_method')::lease_payment_method,nullif(p_payment->>'reference_number',''),nullif(p_payment->>'notes',''),v_user) returning * into v_payment;
 select coalesce(sum((a->>'amount')::numeric),0) into v_sum from jsonb_array_elements(coalesce(p_allocations,'[]'::jsonb))a;
 if v_sum>v_payment.amount then raise exception 'allocations exceed payment amount'; end if;
 insert into lease_payment_allocations(tenant_id,payment_id,installment_id,amount) select v_tenant,v_payment.id,(a->>'installment_id')::uuid,(a->>'amount')::numeric from jsonb_array_elements(coalesce(p_allocations,'[]'::jsonb))a;
 return v_payment;
end $$;
revoke all on function create_lease_contract_bundle(jsonb,uuid[],jsonb) from public;
revoke all on function record_lease_payment(jsonb,jsonb) from public;
grant execute on function create_lease_contract_bundle(jsonb,uuid[],jsonb) to authenticated;
grant execute on function record_lease_payment(jsonb,jsonb) to authenticated;
