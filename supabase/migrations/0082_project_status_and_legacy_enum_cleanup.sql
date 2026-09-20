-- 0082: finish legacy real-estate enum cutover.
-- Important: PostgreSQL blocks ALTER TYPE when ANY RLS policy expression
-- depends on the enum, even when that policy is on another table.

drop policy if exists projects_public_select on public.projects;
drop policy if exists unit_types_public_select on public.unit_types;

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='project_status'
  ) then
    create type public.project_status as enum ('draft','published','archived');
  end if;
end $$;

alter table public.projects alter column status drop default;
alter table public.projects
  alter column status type public.project_status
  using status::text::public.project_status;
alter table public.projects
  alter column status set default 'draft'::public.project_status;

create policy projects_public_select
on public.projects for select to anon
using (status='published'::public.project_status);

-- This policy's expression depends on projects.status while selecting unit_types.
-- Restore it after the project enum conversion.
create policy unit_types_public_select
on public.unit_types for select to anon
using (
  exists (
    select 1
    from public.projects p
    where p.id = unit_types.project_id
      and p.tenant_id = unit_types.tenant_id
      and p.status = 'published'::public.project_status
  )
);

alter table public.unit_types drop column if exists property_type;

drop type if exists public.property_availability;
drop type if exists public.unit_availability;
drop type if exists public.property_type;
drop type if exists public.property_status;
