-- Annual request-only Lavender plan and central plan feature metadata.
alter table public.plans
  add column if not exists purchase_mode text not null default 'checkout'
    check (purchase_mode in ('checkout','request')),
  add column if not exists features jsonb not null default '{}'::jsonb;

create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text not null,
  details text,
  status text not null default 'new'
    check (status in ('new','contacted','negotiating','accepted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plan_requests enable row level security;

insert into public.plans (
  name_ar,name_en,billing_cycle,price,max_properties,max_users,
  custom_domain_allowed,is_active,description_ar,is_trial,
  purchase_mode,features,streampay_product_id
)
select
  'الخزامى','Lavender','annual',0,null,null,
  true,true,'باقة سنوية حسب الطلب',false,
  'request',
  '{"custom_domain":true,"custom_footer_rights":true,"custom_solutions":true}'::jsonb,
  null
where not exists (select 1 from public.plans where lower(name_en)='lavender');

update public.plans
set billing_cycle='annual', purchase_mode='request', streampay_product_id=null
where lower(name_en)='lavender';

update public.plans
set features = jsonb_build_object(
  'custom_domain', custom_domain_allowed,
  'custom_footer_rights', lower(name_en) in ('gold','lavender')
)
where lower(name_en) <> 'lavender' and features = '{}'::jsonb;

create index if not exists plan_requests_status_created_idx
  on public.plan_requests(status, created_at desc);
