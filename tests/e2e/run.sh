#!/usr/bin/env bash
# End-to-end API authorization tests. Rebuilds a scratch database from every
# migration (supabase/tests/run.sh --seed-only), then runs the real, built
# API against PostgREST and a GoTrue stand-in, with external providers
# answered by mock-providers.cjs.
#
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres tests/e2e/run.sh
#
# Requires: a disposable Postgres (never a real project), `pnpm install`, and
# `pnpm --filter @sbaah/api build` beforehand. PostgREST is downloaded into
# .cache on first run.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
CACHE="$HERE/.cache"
POSTGREST_VERSION=v12.2.3
export TEST_DB="${TEST_DB:-sbaah_e2e}" PGDATABASE="${TEST_DB:-sbaah_e2e}"
export E2E_OUTBOX="$CACHE/outbox.jsonl"
mkdir -p "$CACHE"
rm -f "$E2E_OUTBOX"

PIDS=()
cleanup() { for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

wait_for() {
  for _ in $(seq 1 60); do curl -sf "$1" > /dev/null && return 0; sleep 0.5; done
  echo "Timed out waiting for $1" >&2
  return 1
}

"$ROOT/supabase/tests/run.sh" --seed-only
psql -q -X -c "alter role authenticator with password 'e2e-authenticator'" > /dev/null

if [[ ! -x "$CACHE/postgrest" ]]; then
  curl -sSL "https://github.com/PostgREST/postgrest/releases/download/$POSTGREST_VERSION/postgrest-$POSTGREST_VERSION-linux-static-x64.tar.xz" \
    | tar -xJ -C "$CACHE"
fi

JWT_SECRET="$(node --input-type=module -e "import { JWT_SECRET } from '$HERE/jwt.mjs'; process.stdout.write(JWT_SECRET)")"
cat > "$CACHE/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:e2e-authenticator@${PGHOST:-localhost}:${PGPORT:-5432}/$PGDATABASE"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$JWT_SECRET"
server-host = "127.0.0.1"
server-port = 54330
CONF
"$CACHE/postgrest" "$CACHE/postgrest.conf" > "$CACHE/postgrest.log" 2>&1 & PIDS+=($!)
node "$HERE/mock-supabase.mjs" > "$CACHE/supabase.log" 2>&1 & PIDS+=($!)
wait_for http://127.0.0.1:54330/
wait_for http://127.0.0.1:54321/rest/v1/plans

KEYS="$(node --input-type=module -e "import { ANON_KEY, SERVICE_ROLE_KEY } from '$HERE/jwt.mjs'; console.log(ANON_KEY + ' ' + SERVICE_ROLE_KEY)")"
read -r ANON_KEY SERVICE_ROLE_KEY <<< "$KEYS"
(
  cd "$ROOT/apps/api"
  SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
  AUTHENTICA_API_KEY=e2e AUTH_TEMP_TOKEN_SECRET=e2e-temp-token-secret-e2e-temp-token-secret \
  SNDR_API_KEY=sndr_e2e_key SNDR_FROM_EMAIL=no-reply@example.com OTP_EMAIL_CODE_SECRET=e2e-otp-email-secret \
  API_CORS_ALLOWED_ORIGINS=http://localhost:3002 PLATFORM_ROOT_DOMAIN=sbaah.test TURNSTILE_SECRET_KEY=e2e \
  DASHBOARD_APP_URL=http://localhost:3002 STREAMPAY_WEBHOOK_SECRET=e2e-streampay-secret STREAMPAY_API_KEY=e2e \
  NEXT_TELEMETRY_DISABLED=1 \
  CLOUDFLARE_API_TOKEN=e2e CLOUDFLARE_ZONE_ID=e2e-zone CLOUDFLARE_FALLBACK_CNAME_TARGET=fallback.sbaah.test \
  NODE_OPTIONS="--require $HERE/mock-providers.cjs" \
  exec pnpm exec next start -p 3001
) > "$CACHE/api.log" 2>&1 & PIDS+=($!)
wait_for http://127.0.0.1:3001/v1/health

node --test --test-concurrency=1 "$HERE"/*.test.mjs
