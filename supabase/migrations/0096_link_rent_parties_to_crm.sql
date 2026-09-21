-- Link Rent Plus parties to CRM leads without duplicating people.
alter table parties
  add column if not exists lead_id uuid references leads(id) on delete set null;

create unique index if not exists parties_tenant_lead_unique
  on parties (tenant_id, lead_id)
  where lead_id is not null;

create index if not exists parties_lead_id_idx
  on parties (lead_id)
  where lead_id is not null;

comment on column parties.lead_id is
  'Optional CRM lead/customer represented by this Rent Plus party.';
