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
| A1-008 | P1 | Authorization | Self profile role | Self-profile schema/API/dashboard allowed a caller to submit their own role. A DB trigger is defense-in-depth but the self-service contract itself must not expose privilege mutation. | Remove role from self-profile schema/API/client and render it read-only; role changes stay in team administration. | FIXED in 1e8b303a/a8a832b0/6bba4420/17c3aa42 |
| A1-009 | P1 | Auth consistency | Verified phone change | Profile-change updated public.users.phone but not the Supabase Auth identity phone used by password login, allowing identity/profile divergence. | After OTP verification update Auth identity and profile row; compensate Auth update if profile persistence fails. | FIXED in a2f4a326 |
| A1-010 | P2 | Performance / Scale | CRM leads | Normal lead listing fetched and classified the tenant's complete lead history before slicing one page. | Database-page the common unfiltered customer-kind path; retain existing full classification only when customer_kind is explicitly requested. | PARTIALLY FIXED in 1284156a — customer_kind path still needs scalable query/RPC |
| A1-011 | P2 | Data consistency | Website section reorder | Bulk reorder could mutate valid section IDs before discovering one missing/foreign ID, returning an error after partial writes. | Preflight ownership/existence of the complete batch before updates. | FIXED in b9bc0fa8; DB-level transaction still not verified |
| A1-012 | P1 | Authorization architecture | Agent permission matrix | Central legacy permission matrix granted agents property create/update while asset/listing/project APIs explicitly deny those mutations. Divergent authorization sources risk a future endpoint trusting the broader grant. | Remove property mutation grants from agent matrix while preserving assigned CRM workflow creation. | FIXED in 91a93635/cb020fc1 |
| A1-013 | P1 | Authentication | Password-reset token replay | reset_token is a signed stateless token valid for 10 minutes and reset-password does not consume/revoke it. The same verified token can be replayed to set another password until expiry. | Add server-side single-use nonce/token consumption tied to OTP verification; requires forward-only persistence change after migration-history reconciliation. | BLOCKED — DB migration/state required |
| A1-014 | P2 | Architecture / Business logic | Reservation API duplication | /v1/crm/reservations and /v1/reservations both create reservations with different request contracts/validation paths; dashboard currently uses CRM path while list/detail/update live under the other path. | Converge on one canonical reservation service/contract, then deprecate duplicate route after consumer inventory. | OPEN |
| A1-015 | P2 | Auth / Reliability | OTP persistence vs delivery | Replacement OTP was delivered before its verification row was persisted; a DB failure after provider success could deliver an unusable code. | Persist replacement first, deliver, delete replacement on delivery failure, then invalidate previous rows only after successful delivery. | FIXED in f37ec390 |

## Evidence rules

- A Railway build success is recorded only as build evidence.
- Code inspection is not marked as executed E2E.
- Production/live DB integrity is not marked PASS from migration files alone.
- External provider behavior is NOT VERIFIED without an executed request or provider contract evidence.
