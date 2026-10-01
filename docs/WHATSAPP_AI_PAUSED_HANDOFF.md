# WhatsApp AI — Pause & Resume Handoff

> **Status:** PAUSED pending Meta business verification  
> **Last updated:** 2026-10-01  
> **Purpose:** This is the canonical handoff file for resuming Sbaah WhatsApp AI work. Read this file before making any WhatsApp AI changes.

## 1. Product goal

Sbaah is a multi-tenant PropTech SaaS. WhatsApp AI is an external customer-facing AI agent. Each Sbaah tenant must eventually connect **its own** WhatsApp Business Account/phone through Meta Embedded Signup. Do **not** architect all tenants behind Sbaah's own phone number.

Internal "Sbaah AI" and "WhatsApp AI" have separate UI experiences but share the same backend intelligence layer (Sbaah AI Core).

Target flow:

Meta/Sbaah App -> Embedded Signup -> Tenant's Meta business -> Tenant WABA -> Tenant phone -> Sbaah webhook -> queue/worker -> Sbaah AI Core/tools -> Cloud API reply.

## 2. Why work is paused

Meta setup has reached the point where the new Meta app contains the WhatsApp business messaging use case, but production onboarding/partner work should wait until the Sbaah Meta business is verified.

Do not create another Meta app or another Business Portfolio merely to bypass verification.

## 3. Meta state at pause

A fresh Meta app was created and the WhatsApp use case is visible.

The Meta UI shows:
- Use case: WhatsApp business messaging / التواصل على واتساب.
- Basic setup:
  1. Try — completed by the owner.
  2. Production setup — webhook configuration reached.
  3. Business verification — still required/pending.
- Partner section includes "Join as a Technology Provider" / الانضمام كموفر خدمات تقنية.
- Permissions/features page was reached, but no unnecessary permissions were intentionally added.
- The previous Business Portfolio shown earlier was unverified. Work is paused specifically to allow Meta business verification to be completed.

### Webhook values currently used in Meta

Callback URL:

`https://sbaahapi-production.up.railway.app/v1/webhooks/whatsapp/meta`

Railway API variable name:

`META_WHATSAPP_VERIFY_TOKEN`

The verify token itself is intentionally **not stored in this repository**. Read it from Railway when resuming. Never commit tokens, App Secret, access tokens, verification codes, or encryption keys.

Before continuing in Meta, verify that the callback URL and Railway variable still match and perform a live verification test.

## 4. Existing backend implementation

Repository: `ibn-Lafi/sbaah`

Working branch at pause:
`claude/real-estate-saas-platform-sp7ua9`

### Shared AI core

Existing implementation includes:
- `apps/api/src/lib/ai/core.ts`
- channel-aware provider/Grok integration
- customer context loading for WhatsApp by normalized phone
- tool registry and per-channel policies
- AI events/tasks
- queue worker
- credit wallets/ledger

WhatsApp must use service-principal business logic; the LLM must never directly access the database.

### WhatsApp implementation

Important files:
- `apps/api/src/app/v1/webhooks/whatsapp/meta/route.ts`
- `apps/api/src/lib/whatsapp/meta-webhook.ts`
- `apps/api/src/lib/whatsapp/meta-client.ts`
- `apps/api/src/lib/whatsapp/inbound-handler.ts`
- `apps/api/src/lib/whatsapp/outbound-handler.ts`
- `apps/api/src/lib/whatsapp/service-principal.ts`
- `apps/api/src/lib/whatsapp/credentials.ts`
- `apps/api/src/lib/whatsapp/connection-store.ts`
- `apps/api/src/worker.ts`

Dashboard UI:
- `apps/dashboard/src/components/ai/whatsapp-ai-preview.tsx`
- `apps/dashboard/src/app/(app)/apps/page.tsx`

### Webhook behavior

GET verifies:
- `hub.mode=subscribe`
- `hub.verify_token` against `META_WHATSAPP_VERIFY_TOKEN`
- returns `hub.challenge` on success.

POST:
- reads raw body
- validates `x-hub-signature-256` using `META_APP_SECRET`
- ingests Meta webhook using service-role business logic.

Do not weaken signature validation for production.

### Credential handling

Meta access tokens are designed to be encrypted using AES-256-GCM before database storage.

Railway API and Worker already have:
`WHATSAPP_CREDENTIALS_ENCRYPTION_KEY`

Never expose or commit its value.

`connection-store.ts` is the intended write point for encrypted Meta connection credentials.

### Queue/worker

WhatsApp webhook should persist quickly and queue work; AI/provider work must not block the webhook response.

Worker service exists separately in Railway and processes AI/WhatsApp tasks.

### Credits

Two credit types exist:
- `whatsapp_message`
- `ai_agent`

WhatsApp outbound sends reserve/debit WhatsApp message credit. External WhatsApp AI usage is intended to consume AI Agent credit.

## 5. Database/domain already created

WhatsApp domain includes:
- `whatsapp_connections`
- `whatsapp_contacts`
- `whatsapp_conversations`
- `whatsapp_messages`

AI/task domain includes:
- `ai_events`
- `ai_tasks`

Credits include:
- `credit_wallets`
- `credit_ledger`

Tenant isolation/RLS is required. Service-only writes are intentional for the WhatsApp transport domain.

## 6. Important implementation decisions

1. WhatsApp AI is automatic; there is no customer-facing agent on/off toggle.
2. New/existing WhatsApp customer should be identified by phone when safe and unambiguous.
3. Agent may search only live/published inventory.
4. Agent can send public property/project URLs.
5. Customer-bound writes must be restricted to the customer represented by the WhatsApp conversation.
6. If requested inventory is unavailable, collect useful details and hand off to a human.
7. Store conversation summaries/customer facts in business data; do not rely on opaque model memory.
8. Keep internal Sbaah AI and WhatsApp AI as separate channels with independent tool permissions.
9. Meta credentials are encrypted per tenant.
10. Webhook is fast-ingest; worker handles AI and outbound work.
11. Do not claim exactly-once delivery to Meta. Ambiguous provider outcomes require reconciliation rather than blind resend.

## 7. Reliability work already completed

Outbound sending was hardened:
- resolve/decrypt Meta credentials before reserving message credit
- distinguish rejected vs ambiguous Meta send failures
- rejected sends fail/refund deterministically
- ambiguous sends remain reserved and are not blindly resent
- persist Meta message ID conservatively
- delivery statuses are monotonic
- idempotency keys exist for WhatsApp messages

Known reconciliation events include:
- `whatsapp.send_reconciliation_required`
- `whatsapp.send_persistence_reconciliation`

## 8. Known unfinished engineering items

These were intentionally not considered complete at pause:

### A. AI Agent credit reservation
Current design previously debited AI Agent credit after model generation. Resume by reviewing current code and, if still applicable:
- reserve 1 AI Agent credit before provider/model generation
- deterministic idempotency key such as `whatsapp-ai:<message-id>:reserve`
- insufficient credit => no provider call
- refund on blank/non-billable result as appropriate
- retries must not double-charge

### B. Duplicate webhook correctness
Review duplicate inbound handling. Ensure events/tasks use the persisted existing message's `conversation_id`, not a newly resolved conversation accidentally.

### C. Tool-call success idempotency
Current/previous success idempotency based only on source message + tool name may collide when the same tool is called multiple times with different arguments. Prefer provider tool-call ID/index or a stable args hash.

### D. Contact -> lead binding
Implement/review safe automatic linking by normalized Saudi phone. Ambiguous matches must not auto-bind.

### E. Public inventory URLs
Ensure project/property/unit results can return correct tenant public-site URLs.

### F. Human handoff
Complete conversation handoff/assignment semantics and UI. AI must stop automated replies when a conversation is handed off, according to final product rules.

### G. Reconciliation
Implement operational reconciliation for ambiguous Meta send outcomes and message-ID persistence failures. Never blindly retry an externally ambiguous send.

### H. Cross-tenant integrity
Re-review linked WhatsApp rows so foreign relationships cannot cross tenants even under service-role writes.

### I. PII minimization
Review raw webhook payload retention and logs. Store only what is needed and avoid secrets/PII in logs.

### J. Observability
Add/finish metrics and operational visibility for webhook failures, queue lag, AI failures, Meta rejects, ambiguous sends, handoff, credits, and tenant connection health.

## 9. Meta work remaining after verification

When the Meta business is verified, resume in this order:

1. Confirm Business Portfolio verification is complete and healthy.
2. Open the existing Sbaah Meta app; do not create a new app unless there is a documented reason.
3. Confirm WhatsApp business messaging use case remains enabled.
4. Recheck Production Setup step.
5. Verify webhook callback live against Railway.
6. Configure `META_APP_SECRET` securely in Railway API (never commit it).
7. Confirm required webhook subscriptions/events for WhatsApp messages/statuses.
8. Continue "Join as a Technology Provider".
9. Configure Embedded Signup for a multi-tenant SaaS.
10. Request only the Meta permissions/features actually required by the current official flow; do not add `business_management`, `email`, `manage_app_solution`, etc. just because they are listed.
11. Complete App Review / Advanced Access requirements where Meta requires them.
12. Build/finish dashboard "Connect WhatsApp" flow around Embedded Signup.
13. Exchange/receive the allowed onboarding credentials/IDs server-side.
14. Save tenant connection through `saveMetaConnection` so tokens are encrypted.
15. Resolve and store tenant-specific WABA ID and Phone Number ID.
16. Subscribe the tenant WABA/phone to the app/webhook as required by Meta.
17. Run end-to-end tests with a test tenant.
18. Only then expose production onboarding to customers.

Meta UI and requirements change frequently. On resume, verify current official Meta documentation/UI before implementing permission names, review requirements, or Embedded Signup parameters.

## 10. Railway state / environment expectations

Relevant services:
- API: `@sbaah/api`
- Worker: `worker`
- Dashboard: separate dashboard service

Public API domain:
`https://sbaahapi-production.up.railway.app`

Expected WhatsApp-related environment variables eventually include:
- `META_WHATSAPP_VERIFY_TOKEN` — API
- `META_APP_SECRET` — API, required for POST signature verification
- `META_GRAPH_API_VERSION` — where used/configured
- `WHATSAPP_CREDENTIALS_ENCRYPTION_KEY` — API and Worker

Do not copy secret values into this file.

At pause, the API was successfully redeployed after adding/updating `META_WHATSAPP_VERIFY_TOKEN`.

## 11. Required E2E acceptance test before declaring feature complete

Test with a dedicated tenant:

1. Tenant clicks "Connect WhatsApp".
2. Embedded Signup opens.
3. Tenant authenticates with Meta.
4. Correct tenant WABA and phone are selected/created.
5. Connection metadata is saved only under that tenant.
6. Access credential is encrypted at rest.
7. Customer sends WhatsApp message.
8. Meta webhook signature validates.
9. Contact/conversation/inbound message are persisted once.
10. Task is queued once.
11. Customer context is resolved safely.
12. AI Agent credit is reserved once.
13. AI generates response using allowed WhatsApp tools only.
14. Outbound WhatsApp credit is reserved once.
15. Meta Cloud API sends response.
16. wamid is persisted.
17. sent/delivered/read statuses progress monotonically.
18. Duplicate webhook does not duplicate actions/charges.
19. Provider timeout does not blindly resend.
20. Published inventory links work.
21. Human handoff stops AI as designed.
22. Disconnect/revoke removes usable credentials safely.
23. Tenant A can never read/use Tenant B WhatsApp data or credentials.
24. Logs contain no secrets.
25. API, Worker, Dashboard deployments are all healthy.

## 12. Resume checklist for the next engineer/AI

Before changing code:
- Read this file completely.
- Fetch current versions of the WhatsApp/AI files listed above; do not assume this snapshot is still current.
- Inspect current Supabase schema/migrations and RLS.
- Inspect Railway variables by **name only**; never print secret values.
- Check current deployments/logs.
- Verify current Meta official requirements.
- Continue from the smallest incomplete item rather than rebuilding existing infrastructure.

## 13. Definition of done

WhatsApp AI is not "done" merely because Meta accepts a webhook or one Sbaah-owned number sends a message.

It is complete only when a Sbaah tenant can securely onboard its own WhatsApp Business account/number through the intended Meta partner/Embedded Signup flow, tenant isolation is proven, inbound/outbound messaging and AI tools work end-to-end, credits are correct/idempotent, human handoff works, ambiguous sends are safe, observability exists, and production permissions/review requirements are satisfied.

---

**PAUSE MARKER — 2026-10-01:** Stop active WhatsApp AI/Meta implementation here until Sbaah's Meta business verification is ready. Other Sbaah development may continue independently.
