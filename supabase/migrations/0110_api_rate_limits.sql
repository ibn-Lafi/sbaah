-- =============================================================================
-- Migration 0110: shared, atomic rate limiting for unauthenticated endpoints
-- Run after 0109.
--
-- Only POST /v1/public/leads had a limit (migration 0029), and it counted
-- then inserted in two round trips, so a burst could slip through. Other
-- public, cost-bearing endpoints had none: OTP send (paid SMS to any
-- unregistered number via 'register'), OTP verify spraying across accounts,
-- email/console password guessing, support tickets and WhatsApp-click leads.
--
-- consume_rate_limit() checks and records one event under a transaction
-- advisory lock per (bucket, subject), so concurrent requests are counted
-- exactly. Rows are pure bookkeeping (no request content) and are pruned
-- after a day. Service role only, like otp_verifications.
--
-- After the API from this release is deployed, lead_submission_attempts
-- (migration 0029) is no longer written and may be dropped.
-- =============================================================================

create table if not exists api_rate_limit_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

create index if not exists api_rate_limit_events_lookup_idx
  on api_rate_limit_events (bucket, subject, created_at desc);
create index if not exists api_rate_limit_events_created_idx
  on api_rate_limit_events (created_at);

alter table api_rate_limit_events enable row level security;
revoke all on api_rate_limit_events from anon, authenticated;

create or replace function consume_rate_limit(
  p_bucket text,
  p_subject text,
  p_window_seconds integer,
  p_max_events integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_subject, 0));

  select count(*) into v_recent
  from api_rate_limit_events
  where bucket = p_bucket
    and subject = p_subject
    and created_at > now() - make_interval(secs => p_window_seconds);
  if v_recent >= p_max_events then
    return false;
  end if;

  insert into api_rate_limit_events (bucket, subject) values (p_bucket, p_subject);

  delete from api_rate_limit_events
  where id in (
    select id from api_rate_limit_events
    where created_at < now() - interval '1 day'
    order by created_at
    limit 200
  );
  return true;
end;
$$;

revoke all on function consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function consume_rate_limit(text, text, integer, integer) to service_role;
