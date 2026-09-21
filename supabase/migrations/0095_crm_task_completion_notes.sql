-- Calendar task completion metadata.
-- Keeps task completion notes on the task itself; follow-up scheduling remains on leads.follow_up_at.
alter table crm_tasks
  add column if not exists completion_notes text;

comment on column crm_tasks.completion_notes is
  'Optional notes recorded when a CRM task is completed.';
