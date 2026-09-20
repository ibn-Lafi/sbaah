-- 0082: finish legacy real-estate enum cutover.
-- projects_public_select references projects.status, so preserve its exact
-- definition before changing the column type.

do $$
declare
  policy_using text;
begin
  select qual into policy_using
  from pg_policies
  where schemaname='public'
    and tablename='projects'
    and policyname='projects_public_select';

  if policy_using is not null then
    execute 'drop policy projects_public_select on public.projects';
  end if;
end $$;

create type project_status as enum ('draft','published','archived');

alter table projects alter column status drop default;
alter table projects
  alter column status type project_status
  using status::text::project_status;
alter table projects
  alter column status set default 'draft'::project_status;

-- Recreate the known public project policy with the same publication rule.
create policy projects_public_select
on public.projects
for select
to anon
using (status = 'published'::project_status);

alter table unit_types drop column if exists property_type;

drop type if exists property_availability;
drop type if exists unit_availability;
drop type if exists property_type;
drop type if exists property_status;
