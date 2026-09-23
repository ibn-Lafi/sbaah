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
| A1-005 | P2 | Webhook security | WhatsApp inbound | Static shared secret, no body signature/timestamp. Secret comparison is now constant-time (A1-026). | Provider-native signature once the provider contract is known. | MOOT — feature removed, see A4-001 |
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
| A1-026 | P2 | Integration | WhatsApp webhook | Read `NEXT_PUBLIC_SUPABASE_URL` (not set for the API) so every delivery failed; non-constant-time secret comparison. | Shared service-role client; constant-time comparison. | FIXED 721ee70, then route removed — see A4-001 |
| A1-027 | P2 | Database drift | Support center | Schema only in `docs/sql`; raw `users` subqueries ignored disabled members; creator/sender forgeable. | 0112 idempotent migration with hardened policies. | FIXED 8338d5e |
| A1-028 | P2 | Security | Notification email | Public lead names interpolated into HTML emails unescaped. | HTML-escape every user value. | FIXED 6b6be23 |
| A1-029 | P2 | Operations | public-site health | Middleware rewrote `/health` to `/ar/health` → 404, while `railway.public-site.json` uses it as the healthcheck. | Excluded from the locale rewrite. | FIXED c788c9d (Railway config NOT VERIFIED) |
| A1-030 | P2 | Business logic | Plan limits | `plans.max_properties` is not enforced anywhere since the real-estate core cutover. | Needs a product decision on what counts (assets incl. project units vs listings) and on tenants already above their limit. | OPEN — product decision |
| A1-031 | P3 | Reliability | Outbound calls | Google OAuth/Analytics and Cloudflare calls had no timeout (dashboard home awaits Google). | 10–15 s timeouts. | FIXED d3e6116 |
| A1-032 | P3 | Data | Support tracking | Ticket lookup used ILIKE, so `_` in an email matched any character. | Exact match on the lowercased email. | FIXED 02c51ac |
| A1-033 | P3 | UX | Setup checklist | Linked to `/settings?tab=site`, which does not exist; settings ignored `?tab=`. | Real tab targets; deep links honored. | FIXED 36807f3 |
| A1-034 | P3 | Accessibility | Public footer | Icon-only social links had no accessible name. | `aria-label` per network. | FIXED a36dc7b |
| A1-035 | P3 | Feature gap | WhatsApp leads | `POST /v1/public/whatsapp-click` is never called by public-site, so WhatsApp interactions do not become leads as PRODUCT_SPEC section 4 describes. | Product decision: remove rather than wire it up — see A4-001. | RESOLVED — removed |

## Audit #2 — re-audit after the Audit #1 fixes

Scope covered: every Ejar Plus (rent-plus) route, tenant settings/domain routes, public project feeds and pages, console account/auth guard, marketing pixels, reports/dashboard summaries, project sales center, lead notes/interests, custom pages, support tickets, and a database-wide sweep of every write policy granted to `authenticated` compared against the API's role rules. Not covered in depth this round: dashboard/console UI states and accessibility beyond the pages touched, performance profiling.

| ID | Severity | Category | Area | Evidence / root cause | Remediation | Status |
|---|---|---|---|---|---|---|
| A2-001 | P1 | Business logic / Authorization | `tenants` owner writes | 0043 guarded only status/plan/payment status. A trial Owner could clear `trial_ends_at` through PostgREST (is_tenant_active reads it) and keep the trial plan forever, or mark an unverified or plan-excluded custom domain `verified`. Reproduced (SQL as the owner, and E2E through PostgREST). | 0113 extends the guard to the trial end and every custom-domain column for any tenant member; domain routes write with the service role after their owner/plan/Cloudflare checks. | FIXED 3c5fd8b |
| A2-002 | P2 | Functional | Public projects | Projects created in the dashboard never get a slug; public-site links, sitemap and canonical redirect used it, so every published project linked to `/projects/null` (404). Reproduced (E2E). | Public API falls back to the project id, which `public_project_detail` accepts. Verified in the real public site at 1280×800 and 390×844. | FIXED 75a8830 (live slugs NOT VERIFIED) |
| A2-003 | P3 | Data consistency | Domain removal | A suspended tenant's DELETE removed the Cloudflare hostname, then the RLS-filtered update silently changed nothing. | Active-tenant check before any Cloudflare call. | FIXED 3c5fd8b |
| A2-004 | P3 | Authorization | Shared districts | `districts_tenant_insert` was `with check (true)`: Auth users with no tenant, disabled members and suspended tenants could add districts every tenant sees. Reproduced (RLS suite fails without the fix). | 0114 limits it to active members of active tenants; 403 instead of 500. | FIXED 533f709 |
| A2-005 | P3 | Operations | Console guard | `requirePlatformAdmin` read `platform_admins` with `maybeSingle()`, but an admin sees every admin row: adding a second admin made every console endpoint 403. Reproduced (E2E). | Uses `is_platform_admin()`. | FIXED be7d557 |
| A2-006 | P3 | Security hardening | Tracking pixels | `pixel_id` accepted any 200-character string although it is meant for tracking snippets. | Provider id alphabet only. | FIXED e6b702a |
| A2-007 | P3 | Error handling | Rent Plus reads | Failures of `refresh_contract_installment_statuses` were ignored, silently showing stale overdue states. | Errors are raised. | FIXED 75a8830 |
| A2-008 | P3 | Feature gap | Tracking pixels | Pixels can be saved through the API but no dashboard screen manages them and public-site never renders them. | Product decision: build or remove the feature. | OPEN — product decision |
| A2-009 | P3 | API | Malformed ids | A non-UUID path or query id (e.g. `contract_id=abc`) reaches Postgres and returns 500 instead of 400/404. No data exposure. | Validate ids at the route boundary. | OPEN |
| A2-010 | P3 | Reliability | Custom domain replace | PATCH with a new domain does not delete the previous Cloudflare custom hostname. Whether the dashboard allows replacing without removing first was not checked. | Delete the previous hostname after a successful update. | OPEN — NOT VERIFIED in UI |
| A2-011 | P4 | Authorization | `documents`, `document_links` | Any tenant member may write them, but no application reads or writes these tables. | Scope them when a feature uses them. | ACCEPTED — dormant |
| A2-012 | P3 | Test reliability | OTP concurrency E2E | Failed once in 19 local runs; not reproduced in 18 later runs (12 of them isolated). The failing assertion was not captured. | Assertions now print every status/body. | OPEN — monitoring |

Checked and not a finding: Ejar Plus tables already restrict writes to owner/admin (0093); website tables, tenant integrations and tracking pixels match the API's role rules; console account updates are schema-validated and platform-admin only.

## Findings recorded on the production branch in parallel

Added on `claude/real-estate-saas-platform-sp7ua9` while audits #1/#2 ran. Their original ids were A1-012…A1-015; they are prefixed `PB-` here so they do not clash with the ids above.

| ID | Severity | Category | Area | Evidence / root cause | Remediation | Status |
|---|---|---|---|---|---|---|
| PB-012 | P1 | Authorization architecture | Agent permission matrix | Legacy matrix granted agents property create/update while the asset/listing/project APIs deny them. | Agent property mutation grants removed. | FIXED 91a93635/cb020fc1 |
| PB-013 | P1 | Authentication | Password-reset token replay | `reset_token` is a signed stateless token valid for 10 minutes and reset-password does not consume it, so it can be replayed until expiry. | Server-side single-use token consumption. | OPEN — needs a migration |
| PB-014 | P2 | Architecture | Reservation API duplication | `/v1/crm/reservations` and `/v1/reservations` both create reservations with different contracts. | Converge on one contract. | OPEN |
| PB-015 | P2 | Auth / Reliability | OTP persistence vs delivery | A code delivered before its row was saved could be unusable if the insert failed. | Save first, deliver, delete the new row on delivery failure, expire older rows only after success. | FIXED f37ec390, kept in the merged route |

## Audit #3 — user-reported: properties page shows "تعذر العثور على العقار"

| ID | Severity | Category | Area | Evidence / root cause | Remediation | Status |
|---|---|---|---|---|---|---|
| A3-001 | **P0** | Database / API | Property detail | Migration 0062 added a composite `(x_id, tenant_id)` same-tenant FK to `leads`/`users` alongside the original simple FK on `lead_interests`, `viewings`, `deals` (and 10 other table pairs — see A3-003). `GET /v1/assets/[id]/relationships` embeds `leads(...)` from three of these without a hint, so PostgREST refuses with "Could not embed because more than one relationship was found" — a deterministic 500 on every call, for every property, with or without linked leads. Reproduced directly against the API and confirmed the fix resolves the *correct* lead, not just any. | Explicit FK hints (`leads!lead_interests_lead_id_fkey`, `leads!viewings_lead_id_fkey`, `leads!deals_lead_id_fkey`), matching the hint the same query already used for the identically-duplicated `users` relation two columns over. | FIXED ba3eb82 |
| A3-002 | P2 | Error handling | Property/lead/project/rent-plus-tenant detail pages | Each page's initial load caught *any* rejection (a 500, an expired session, a permission error, the network) and permanently showed "not found", which is how A3-001 surfaced as a misleading message instead of a real error — and would do the same for any future failure in any of these four pages. The state also never reset on a later successful load. | `isNotFoundError()` distinguishes a real 404 from everything else; a non-404 shows a retryable `DetailLoadError` with the real message; a successful load clears both states. Verified with Playwright (1280×800, 390×844): a forced 500 no longer shows "not found", and retry recovers the real record. | FIXED 1a0cf61 |
| A3-003 | P2 | Database schema | Every table 0062 hardened | The same ambiguous-FK pattern as A3-001 exists on 10 more table pairs (`crm_activities`, `crm_tasks`, `deals`, `lead_requirements`, `listings`, `maintenance_requests`, `project_phases`, `unit_types` × their target tables — see the `pg_constraint` query in this audit's evidence). None of these are currently embedded without a hint anywhere in the API (checked by grep across every route), so none are live bugs today, but any future `.select('...,leads(...)')` or `.select('...,users(...)')` added to one of these tables will 500 the same way A3-001 did, silently, until someone notices. | Not fixed — no current consumer to reproduce against. Recommend either hinting every embed by convention going forward, or dropping the redundant composite FK where a trigger-based tenant check would do instead. | OPEN — dormant, no live consumer |
| A3-004 | P1 | Authentication | OTP verify attempt budget | `assertOtpNotLocked` (sums attempts, checks the lock) and `findActiveOtp` (reads the row to reserve) are two independent, non-atomic reads; `reserveOtpAttempt`'s compare-and-set then blindly honors whatever count `findActiveOtp` handed it, with no re-check against the limit. Under sustained heavy concurrency this lets one guess past the 5-attempt budget (observed 6 evaluated guesses in two consecutive local runs, `tests/e2e/auth.test.mjs`'s existing concurrency test). Previously logged as "OPEN — monitoring" (A2-012) on the theory it was flaky; it is not — it is a real, reproducible race, just a narrow one (one extra guess, not an unlimited bypass). | Not fixed — needs a single atomic check-and-reserve (an advisory-lock RPC, the same pattern `consume_rate_limit` already uses), which is a new migration. Deliberately not done in this round to keep the properties-page fix isolated and immediately deployable. | OPEN — needs a new migration |

## Audit #4 — WhatsApp AI/conversation feature removed by product decision

The founder decided to remove the WhatsApp click-to-lead tracking, the inbound-message webhook/AI-conversation storage, and the dead AI inventory-search/handoff code — three pieces that were built but never reached a real user (no button ever called the click-tracking endpoint; no dashboard screen ever read a stored conversation; no route ever called the AI helpers). The working WhatsApp feature (a tenant's contact number in Settings, shown on the public site and used for the per-lead "واتساب" button) is untouched — none of it reads the removed tables.

| ID | Severity | Category | Area | Change | Status |
|---|---|---|---|---|---|
| A4-001 | — | Removal | WhatsApp click tracking, inbound webhook, AI bot code | Deleted `POST /v1/public/whatsapp-click` and `POST /v1/webhooks/whatsapp` (route files, their Zod schema, their rate-limit bucket, `WHATSAPP_WEBHOOK_SECRET`), and `apps/api/src/lib/ai/` (`inventory-tools.ts`, `handoff.ts` — never imported by any route). 0115 drops `whatsapp_conversations`, `whatsapp_messages` and the `conversation_status` enum. | REMOVED |

## Evidence rules

- A Railway build success is recorded only as build evidence.
- Code inspection is not marked as executed E2E.
- Production/live DB integrity is not marked PASS from migration files alone.
- External provider behavior is NOT VERIFIED without an executed request or provider contract evidence.
