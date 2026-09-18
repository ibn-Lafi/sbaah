# Sabaah Master Implementation Plan

> Source of truth for the Audit-to-Implementation program.
> Branch: `claude/real-estate-saas-platform-sp7ua9`
> Strategy: additive migrations, backward compatibility, defense-in-depth authorization, modular monolith.

## Progress

- Total tasks: **50**
- Completed: **3**
- In progress: **0**
- Blocked: **0**
- Remaining: **47**

Legend: [ ] Pending · [~] In Progress · [x] Completed · [!] Blocked

## Validated architecture decisions

- **CONFIRMED:** account/entity type is separate from business activity.
- **CONFIRMED:** one tenant may enable multiple activities: marketing, brokerage, development.
- **MODIFY:** extend the existing tenant model; do not create separate account systems.
- **CONFIRMED:** replace coarse role checks gradually with centralized permissions and data scopes.
- **REJECT:** a large microservices rewrite; keep the current Next.js modular-monolith/API structure.
- **CONFIRMED:** keep standalone Property; introduce developer Unit inventory instead of overloading Property forever.
- **MODIFY:** project phases/buildings are optional; Unit Type + Unit are first-class developer inventory.
- **CONFIRMED:** CRM needs requirements, activities, tasks, in-person viewings, deals.
- **DEFER:** separate Customer entity until evidence requires it; Lead remains the contact/opportunity entry point.
- **CONFIRMED:** viewing is an in-person CRM entity scheduled by staff, not remote viewing or customer self-booking.
- **MODIFY:** marketing scope is attribution/mandates/pixels, not a full Ads Manager.
- **DEFER:** WhatsApp AI until inventory + CRM are stable; tools must be least-privilege and data-backed.
- **CONFIRMED:** extend the existing website/theme system; do not rebuild it.
- **NEEDS VERIFICATION:** exact Saudi electronic-real-estate-platform classification before hard-coding platform-level regulatory obligations.

## Target architecture

Tenant
- Entity type (individual / institution / company)
- Business activities (marketing / brokerage / development), multi-select
- Users + centralized permissions + data scopes
- Licenses / organization profile
- Website / theme / domain / sections

Real Estate Inventory
- Standalone Properties
- Projects
- Optional Phases
- Optional Buildings
- Unit Types
- Units
- Media / Documents / publication compliance metadata

CRM
- Leads
- Requirements
- Interests / matching
- Activities
- Tasks
- In-person Viewings
- Deals + optional commission fields

Growth
- Marketing mandates + attribution + pixels
- Role/activity-aware analytics
- WhatsApp conversations + permissioned AI tools + human handoff

## Phase 01 — Foundation & Safety
- [x] PLAN-001 Create validated master implementation plan and decision log
- [x] FOUND-001 Add shared Business Activity domain types and capability resolver
- [x] FOUND-002 Add additive tenant business-activity persistence migration + RLS
- [ ] FOUND-003 Add tenant activities API with backward-compatible unconfigured state
- [ ] FOUND-004 Add activity-aware dashboard capability context
- [ ] RBAC-001 Define centralized permission catalog and data scopes
- [ ] RBAC-002 Map legacy owner/admin/agent roles to permission sets
- [ ] RBAC-003 Add backend permission guard helpers
- [ ] RBAC-004 Add database permission/scoping foundation without breaking legacy roles
- [ ] SEC-001 Add same-tenant foreign-key ownership validation helpers
- [ ] SEC-002 Add tenant-isolation/RLS regression tests

## Phase 02 — Property Core
- [ ] PROP-001 Extend property taxonomy and conditional physical fields
- [ ] PROP-002 Add additive property schema migration and indexes
- [ ] PROP-003 Add conditional property validation by property/listing type
- [ ] PROP-004 Add reusable tenant-scoped documents domain
- [ ] PROP-005 Add advertisement/license/marketing-mandate metadata
- [ ] PROP-006 Add publication validation and compliance gate
- [ ] PROP-007 Update property create/edit UX responsively for RTL/LTR

## Phase 03 — Developer Inventory
- [ ] PROJ-001 Extend project lifecycle/location/development fields
- [ ] PROJ-002 Add project media/documents support
- [ ] PROJ-003 Add optional project phases
- [ ] PROJ-004 Harden/extend optional buildings with tenant ownership
- [ ] PROJ-005 Add unit types
- [ ] PROJ-006 Add units and availability lifecycle
- [ ] PROJ-007 Add project inventory APIs and validation
- [ ] PROJ-008 Add project/unit management UX

## Phase 04 — CRM Foundation
- [ ] CRM-001 Refine lead pipeline and qualification fields
- [ ] CRM-002 Add property requirements
- [ ] CRM-003 Add multiple property/unit interests and deterministic matching
- [ ] CRM-004 Add CRM activity timeline
- [ ] CRM-005 Add tasks/reminders
- [ ] CRM-006 Add structured lost reasons
- [ ] CRM-007 Update CRM UX and permission-aware assignment

## Phase 05 — Viewings & Deals
- [ ] VIEW-001 Add in-person viewing entity + RLS
- [ ] VIEW-002 Add schedule/reschedule/cancel APIs
- [ ] VIEW-003 Add calendar/today agenda UX
- [ ] VIEW-004 Add completed/no-show/outcome workflow
- [ ] VIEW-005 Integrate viewings into lead/property/unit timelines
- [ ] DEAL-001 Add deal lifecycle
- [ ] DEAL-002 Add brokerage commission fields/rules

## Phase 06 — Marketing & Website
- [ ] MKT-001 Add marketing mandates
- [ ] MKT-002 Add source/UTM attribution model and capture
- [ ] MKT-003 Add pixel configuration and safe event emission
- [ ] WEB-001 Add public listing view model for Property + Unit
- [ ] WEB-002 Add project detail and unit inventory public views
- [ ] WEB-003 Add activity-aware website sections without rebuilding themes

## Phase 07 — Analytics
- [ ] REP-001 Define source-of-truth analytics events/KPIs
- [ ] REP-002 Add marketer/broker/developer activity-aware reports

## Phase 08 — WhatsApp AI
- [ ] AI-001 Add conversation/message domain and audit trail
- [ ] AI-002 Add WhatsApp webhook/router + idempotency
- [ ] AI-003 Add least-privilege read-only inventory tools
- [ ] AI-004 Add human handoff with preserved context

## Phase 09 — Final Hardening & Release
- [ ] QA-001 Run full lint/typecheck/build + security/RLS/regression suite
- [ ] QA-002 Run 9 entity-type × business-activity E2E journeys and production-readiness review

## Dependency order

Foundation/RBAC/Security → Property Core → Developer Inventory + CRM → Viewings/Deals → Marketing/Website → Analytics → WhatsApp AI → Final Hardening.

## Architecture decision log

### ADR-001 — Separate Entity Type, Business Activity, and User Permission
Decision: Keep account type on tenant, add multi-select business activities, and keep staff authorization independent.
Reason: A company may be both developer and marketer; staff permissions are not business identity.
Alternative rejected: encoding developer/broker/marketer in `users.role`.
Impact: capability resolver controls product modules; permission guards control actions/data scopes.

### ADR-002 — Additive evolution
Decision: nullable/additive migrations first, backfill where safe, constraints later.
Reason: production data and backward compatibility.
Impact: legacy tenants remain valid and are not guessed into an activity.

### ADR-003 — Inventory model
Decision: standalone `properties` remain; developer inventory uses Project → optional Phase/Building → Unit Type → Unit.
Reason: avoids a single overloaded listing table while preserving current property records.
Impact: public site later consumes a unified listing view model.

### ADR-004 — CRM boundary
Decision: Lead remains the contact/opportunity entry; add Requirement/Activity/Task/Viewing/Deal.
Reason: enough for real-estate sales workflows without turning Sabaah into an ERP.
Alternative deferred: separate Customer master entity.

### ADR-005 — Viewings
Decision: physical, staff-scheduled viewings only in initial scope.
Impact: viewing is an independent CRM entity; “needs viewing” is an action requirement, not a terminal lead status.

### ADR-006 — AI sequencing
Decision: WhatsApp AI is built after inventory and CRM sources of truth.
Reason: prevents hallucinated property, price, availability, and status data.

## Safety gates

- Any tenant-owned new table must define ownership, indexes, grants/RLS, and negative cross-tenant tests.
- Any database change must be represented by a versioned migration; production application is a separate user action.
- No destructive migration without explicit risk/backup/rollback review.
- No task is marked complete if its required database/configuration action has not been applied and verified.
