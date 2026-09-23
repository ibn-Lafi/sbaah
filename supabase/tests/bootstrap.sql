-- Test-only stand-in for the Supabase platform objects the migrations
-- depend on (auth.uid(), storage, pg_cron). Default privileges mirror a
-- hosted project, where new public functions are executable by anon and
-- authenticated unless a migration revokes that explicitly. Roles are
-- created by run.sh because they are cluster-wide.

create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  encrypted_password text,
  banned_until timestamptz,
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;

-- pg_cron is a hosted extension; migration 0020 schedules a job that 0039
-- removes again. A stub keeps the historical migration chain replayable.
create schema cron;
create table cron.job (jobid bigserial primary key, jobname text, schedule text, command text);
create function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (job_name, schedule, command) returning jobid
$$;
create function cron.unschedule(job_name text) returns boolean language sql as $$
  with deleted as (delete from cron.job where jobname = job_name returning 1) select exists (select 1 from deleted)
$$;
create function cron.unschedule(job_id bigint) returns boolean language sql as $$
  with deleted as (delete from cron.job where jobid = job_id returning 1) select exists (select 1 from deleted)
$$;
