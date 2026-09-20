-- 0082: finish legacy real-estate enum cutover.
create type project_status as enum ('draft','published','archived');

alter table projects
  alter column status drop default,
  alter column status type project_status using status::text::project_status,
  alter column status set default 'draft'::project_status;

alter table unit_types drop column if exists property_type;

drop type if exists property_availability;
drop type if exists unit_availability;
drop type if exists property_type;
drop type if exists property_status;
