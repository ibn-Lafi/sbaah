-- Explicit CRM customer relationship for manually created existing customers.
-- Real completed deals and rental contracts remain authoritative when present.
alter table public.leads
  add column if not exists customer_relationship text;

alter table public.leads
  add constraint leads_customer_relationship_check
  check (customer_relationship is null or customer_relationship in ('purchase', 'tenant'));

comment on column public.leads.customer_relationship is
  'Optional explicit relationship for an existing customer entered manually: purchase or tenant. Null means prospect unless completed activity proves otherwise.';
