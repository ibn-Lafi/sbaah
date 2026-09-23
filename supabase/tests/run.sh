#!/usr/bin/env bash
# Replays every migration onto a scratch Postgres database with Supabase-like
# roles, seeds a two-tenant role matrix and runs the RLS regression checks.
#
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres supabase/tests/run.sh [--seed-only]
#
# The target database (TEST_DB, default sbaah_test) is dropped and recreated.
# Never point this at a real project.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$HERE/../migrations"
DB="${TEST_DB:-sbaah_test}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"

"${PSQL[@]}" -d postgres <<'SQL'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
SQL
"${PSQL[@]}" -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$DB' and pid <> pg_backend_pid()" > /dev/null
"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"
"${PSQL[@]}" -d "$DB" -f "$HERE/bootstrap.sql"

for file in $(ls "$MIGRATIONS"/*.sql | sort); do
  name="$(basename "$file")"
  [[ -f "$HERE/replay-patches/$name.pre.sql" ]] && "${PSQL[@]}" -d "$DB" -f "$HERE/replay-patches/$name.pre.sql"
  # pg_cron/pg_net are hosted-only; bootstrap.sql stubs the cron schema.
  if ! sed -E '/create extension if not exists (pg_cron|pg_net);/d' "$file" | "${PSQL[@]}" -d "$DB" > /dev/null; then
    echo "Migration failed: $name" >&2
    exit 1
  fi
  [[ -f "$HERE/replay-patches/$name.post.sql" ]] && "${PSQL[@]}" -d "$DB" -f "$HERE/replay-patches/$name.post.sql"
done
echo "Replayed $(ls "$MIGRATIONS"/*.sql | wc -l) migrations into $DB"

"${PSQL[@]}" -d "$DB" -f "$HERE/seed.sql" > /dev/null
[[ "${1:-}" == "--seed-only" ]] && exit 0

# Query results are discarded; section headers (\echo) and failures still print.
"${PSQL[@]}" -d "$DB" -o /dev/null -f "$HERE/rls_regression.sql"
