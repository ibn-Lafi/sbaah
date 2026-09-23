# Engineering Audit Log

Started: 2026-09-23
Scope: current default branch, four Next.js applications, shared package, Supabase migrations, auth/API/business workflows.

This file records only findings supported by inspected code or observed test/build evidence. Live database/data, provider behavior and production configuration remain NOT VERIFIED unless explicitly evidenced.

## How findings are verified

- **Unit tests**: `pnpm test` (Vitest, `apps/api/src/**/*.test.ts`).
- **Database regression**: `supabase/tests/run.sh` replays every migration onto plain Postgres with Supabase-like roles and default privileges (anon/authenticated/service_role, `auth.uid()` from JWT claims), seeds a two-tenant role matrix and asserts the authorization rules in SQL.
- **API end-to-end**: `tests/e2e/run.sh` runs the built API against PostgREST over that database and a GoTrue stand-in, with external providers mocked.
- **UI**: Playwright against production builds of dashboard/public-site on the same stack, at 1280×800 and 390×844.
- All three suites run in CI (`.github/workflows/dashboard-qa.yml`). A finding marked "reproduced" failed on the pre-fix code and passes after the fix.

## Audit #1 — completed

| ID | Severity | Category | Area | Evidence / root cause | Remediation | Status |
|---|---|---|---|---|---|---|
| A1-001 | P1 | Database / Release | Migration history | Duplicate numeric prefixes (0048, 0050–0054, 0095, 0096, 0102; the 0045 parts are intentional). The chain is not replayable as written: 0061 recreates an existing policy, 0080 drops a table still referenced by 0032, 0082 changes a column a 0064 policy depends on, 0102 reads `projects.slug` which no migration creates, 0104 changes a function's return type with CREATE OR REPLACE. | Documented per migration in `supabase/tests/replay-patches/`; reconcile against the live schema with a forward-only baseline. | OPEN — live schema read required |
| A1-002 | P1 | Auth / Reliability | OTP replacement | send invalidated an existing OTP concurrently with delivery. | Deliver first, persist, then invalidate prior rows. | FIXED 6ccacf0a |
| A1-003 | P2 | Reliability | Turnstile | No timeout on captcha verification. | Bounded AbortSignal timeout. | FIXED 057205b0 |
| A1-004 | P2 | Authorization | Section reorder | Bulk reorder relied on RLS alone. | Explicit tenant scoping. | FIXED 0599580b |
| A1-005 | P2 | Webhook security | WhatsApp inbound | Static shared secret, no body signature/timestamp. Secret comparison is now constant-time (A1-026). | Provider-native signature once the provider contract is known. | OPEN — provider contract required |
| A1-006 | P2 | Testing / CI | Repository | No unit/integration/E2E suites. | Unit, RLS and E2E suites added and run in CI. | FIXED ba43d93, 88b7a04, ea4d95c |
| A1-007 | P2 | Verification | Session minting | `mint-session.ts` untested against live Supabase. | Exercised end-to-end against the GoTrue stand-in only. | NOT VERIFIED live |
| A1-008 | P1 | Authorization | Self profile role | Self-profile contract exposed role. | Role removed from self-service. | FIXED 1e8b303a…17c3aa42 |
| A1-009 | P1 | Auth consistency | Verified phone change | Auth identity phone not updated. | Update Auth identity + profile with compensation. | FIXED a2f4a326 |
| A1-010 | P2 | Performance | CRM leads | `customer_kind` filter still classifies the tenant's full lead history. | Scalable query/RPC. | PARTIAL (1284156a) |
| A1-011 | P2 | Data consistency | Section reorder | Partial writes before discovering an invalid id. | Preflight the whole batch. | FIXED b9bc0fa8 |
| A1-012 | P0 | Release | API build | `next build` failed type checking (relationships route generic; missing `ApiError` import in viewings), so Railway could not deploy any API change after 8537412. | Fixed both. | FIXED be65bff |
| A1-013 | P1 | Authorization | Disabled members | RLS identity helpers, `getCallerContext`, OTP login and Supabase Auth ignored `users.status = 'disabled'`: a removed member kept full access. Reproduced (harness + E2E). | 0105 helpers ignore disabled members; API 403 `account_disabled`; OTP/email/reset refuse; team PATCH bans/unbans the Auth user; dashboard signs them out with a message. | FIXED cb608eb, 06f1945 |
| A1-014 | P1 | Authentication | OTP verify | Attempt counter read-check-write: 40/40 parallel wrong guesses were evaluated against a 4-digit code; one correct code minted several sessions; a resend reset the budget. Reproduced. | CAS attempt reservation before checking, single-use consumption, identifier-wide budget, no new code while locked. | FIXED c09d049 |
| A1-015 | P1 | Authorization | `users` writes | FOR ALL policy + UPDATE-only trigger: an admin could insert a second owner, delete the owner, or re-point another member's identity through PostgREST. Reproduced. | 0106 restrictive insert/delete policies, identity-field trigger, one-owner unique index. | FIXED cb608eb |
| A1-016 | P1 | Database ACL | `create_tenant_with_owner` | Only revoked from PUBLIC; Supabase default privileges grant EXECUTE to anon directly. Reproduced with Supabase-like default privileges. | 0107 service-role only. | FIXED cb608eb (live ACL NOT VERIFIED) |
| A1-017 | P1 | Functional | Account-change OTP | `otp_purpose` enum lacks change_phone/change_email; docs/sql CHECK could not work on an enum. | 0108 adds the values. | FIXED cb608eb (live state NOT VERIFIED) |
| A1-018 | P1 | Business logic | Billing webhook | A paying trial tenant kept `trial_ends_at` and was locked at the old trial date; parallel payment/tenant writes could leave a paid payment that retries never applied; a failed plan switch flagged a paying tenant. Reproduced. | Tenant first then payment, clear trial on success, never downgrade a paid tenant on a failed attempt. | FIXED 72c9c06 |
| A1-019 | P2 | Authorization | Agent CRM scope | CRM tables had tenant-wide policies: an agent could read/modify other agents' deals, viewings, tasks, reservations, activities, interests, requirements and close their sales; two API list endpoints were unscoped. Reproduced. | 0109 lead-assignment policies; API scoping. | FIXED 6981af1, 9541cf3 |
| A1-020 | P2 | Data integrity | Availability engine | `lock_asset_family` took no row lock when called by an agent (FOR UPDATE needs an UPDATE policy), allowing concurrent double reservation. Reproduced with two sessions. | Engine runs as SECURITY DEFINER behind a caller-tenant guard. | FIXED 6981af1 |
| A1-021 | P2 | Functional | Deal closing | An agent could not close their own sale deal when it had a listing (500). | `close_sale_deal` authorizes the caller itself; won/lost deals are final. | FIXED 6981af1 |
| A1-022 | P2 | API | Error handling | Every Zod validation failure and malformed JSON returned 500; database business-rule rejections returned 500. | 400 validation messages; 403/409 for RLS/duplicate/business rules. | FIXED d3e6116 |
| A1-023 | P2 | Abuse | Rate limiting | No IP limits on OTP send/verify, email login, public support tickets, WhatsApp-click; the lead limit keyed on the client-controlled first X-Forwarded-For entry. | 0110 atomic limiter keyed on the proxy-appended IP (`TRUSTED_PROXY_HOPS`). | FIXED 02c51ac |
| A1-024 | P2 | Authentication | Console lockout | Read-check-upsert lockout bypassable with parallel guesses. | CAS reservation + IP limit. | FIXED a02b3d6 |
| A1-025 | P2 | Functional | Contact links | Admins got a 500 saving links (RLS owner-only); Facebook/X/Telegram had no columns and were never shown. | Service-role update limited to validated columns + active check; 0111 columns and chrome function; footer rendering. | FIXED a36dc7b |
| A1-026 | P2 | Integration | WhatsApp webhook | Read `NEXT_PUBLIC_SUPABASE_URL` (not set for the API) so every delivery failed; non-constant-time secret comparison. | Shared service-role client; constant-time comparison. | FIXED 721ee70 |
| A1-027 | P2 | Database drift | Support center | Schema only in `docs/sql`; raw `users` subqueries ignored disabled members; creator/sender forgeable. | 0112 idempotent migration with hardened policies. | FIXED 8338d5e |
| A1-028 | P2 | Security | Notification email | Public lead names interpolated into HTML emails unescaped. | HTML-escape every user value. | FIXED 6b6be23 |
| A1-029 | P2 | Operations | public-site health | Middleware rewrote `/health` to `/ar/health` → 404, while `railway.public-site.json` uses it as the healthcheck. | Excluded from the locale rewrite. | FIXED c788c9d (Railway config NOT VERIFIED) |
| A1-030 | P2 | Business logic | Plan limits | `plans.max_properties` is not enforced anywhere since the real-estate core cutover. | Needs a product decision on what counts (assets incl. project units vs listings) and on tenants already above their limit. | OPEN — product decision |
| A1-031 | P3 | Reliability | Outbound calls | Google OAuth/Analytics and Cloudflare calls had no timeout (dashboard home awaits Google). | 10–15 s timeouts. | FIXED d3e6116 |
| A1-032 | P3 | Data | Support tracking | Ticket lookup used ILIKE, so `_` in an email matched any character. | Exact match on the lowercased email. | FIXED 02c51ac |
| A1-033 | P3 | UX | Setup checklist | Linked to `/settings?tab=site`, which does not exist; settings ignored `?tab=`. | Real tab targets; deep links honored. | FIXED 36807f3 |
| A1-034 | P3 | Accessibility | Public footer | Icon-only social links had no accessible name. | `aria-label` per network. | FIXED a36dc7b |
| A1-035 | P3 | Feature gap | WhatsApp leads | `POST /v1/public/whatsapp-click` is never called by public-site, so WhatsApp interactions do not become leads as PRODUCT_SPEC section 4 describes. | Wire a tracked WhatsApp CTA (UI/product decision). | OPEN |

## Evidence rules

- A Railway build success is recorded only as build evidence.
- Code inspection is not marked as executed E2E.
- Production/live DB integrity is not marked PASS from migration files alone.
- External provider behavior is NOT VERIFIED without an executed request or provider contract evidence.
