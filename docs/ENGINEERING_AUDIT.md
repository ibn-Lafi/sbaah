# Engineering Audit Log

Started: 2026-09-23
Scope: current default branch, four Next.js applications, shared package, Supabase migrations, auth/API/business workflows.

This file records only findings supported by inspected code or observed build status. Live database/data, browser E2E, provider behavior and production configuration remain NOT VERIFIED unless explicitly evidenced.

## Audit #1 — active

| ID | Severity | Category | Area | Evidence / root cause | Remediation | Status |
|---|---|---|---|---|---|---|
| A1-001 | P1 | Database / Release | Migration history | Duplicate numeric migration prefixes exist: 0095 x2, 0096 x2, 0102 x3. Previously observed live DB also differed from repository around project_media/public project functions. Historical renaming without reading live migration history could worsen drift. | Read live migration history/schema first; reconcile with a forward-only migration plan. | BLOCKED — live DB read required |
| A1-002 | P1 | Auth / Reliability | OTP replacement | send route invalidated an existing OTP concurrently with external delivery. Provider failure could destroy a valid OTP; successful delivery followed by DB insert failure could produce an unverifiable code. | Deliver first, persist replacement, then invalidate prior rows excluding replacement. | FIXED in 6ccacf0a |
| A1-003 | P2 | Reliability | Turnstile | Captcha verification fetch had no timeout, allowing an external provider stall to hold public write requests indefinitely. | Add bounded AbortSignal timeout. | FIXED in 057205b0 |
| A1-004 | P2 | Authorization defense-in-depth | Website section reorder | Bulk reorder relied on RLS alone for object ownership and updated by section id only. | Resolve tenant website/page IDs and explicitly scope every mutation; retain RLS. | FIXED in 0599580b |
| A1-005 | P2 | Webhook security | WhatsApp inbound | Static shared header secret authenticates webhook; no body signature/timestamp/replay window. provider_message_id dedupes message inserts but does not provide request authenticity/replay protection. | Confirm provider signing capability, then implement HMAC/timestamp verification or rotate to provider-native signature. | OPEN / provider contract required |
| A1-006 | P2 | Testing / CI | Repository | Root/apps expose build/lint/typecheck only; no unit/integration/E2E runner and no GitHub Actions directory. Railway green builds do not prove business journeys or authorization matrix. | Add focused automated regression coverage and CI after selecting runner compatible with repo/deployment. | OPEN |
| A1-007 | P2 | Verification | Session minting | mint-session.ts explicitly documents live Supabase behavior as UNTESTED. This path is critical to OTP login/register flows. | Execute real non-production OTP/session E2E and capture evidence. | NOT VERIFIED — live environment required |

## Evidence rules

- A Railway build success is recorded only as build evidence.
- Code inspection is not marked as executed E2E.
- Production/live DB integrity is not marked PASS from migration files alone.
- External provider behavior is NOT VERIFIED without an executed request or provider contract evidence.
