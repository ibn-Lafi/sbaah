# Sbaah Release Candidate Status

Date: 2026-09-23

## Code candidate

The current branch is a **code-complete release candidate** for the 31-stage stabilization plan.

Latest verified production build status:
- @sbaah/api: PASS
- @sbaah/dashboard: PASS
- @sbaah/public-site: PASS
- @sbaah/console: PASS

## Release blockers still requiring live verification

A production release must NOT be declared solely from green builds.

### 1. Live E2E acceptance
Execute `docs/E2E_ACCEPTANCE.md` using the real dashboard and public site. The repository currently has no Playwright/Cypress E2E suite, so green builds do not prove the sale/rent journeys.

Required evidence:
- sale journey passes end-to-end
- rent journey passes end-to-end
- public inquiry creates exactly the correct Lead/Listing Interest
- Owner/Admin/Agent permission cases pass
- cross-tenant ID substitution is rejected
- mobile critical actions pass

### 2. Production database contract verification
Repository migration history and the previously observed live database state have differed around the public project API/media contract. Before release, verify the live database objects used by the public API rather than replaying or rewriting historical migrations.

Verify, read-only:
- expected public project feed/detail functions exist with the signatures used by current API code
- public listing detail/feed functions exist
- execute privileges remain restricted to intended roles
- project media behavior matches the current public API contract

Do not create dummy production data or alter migration history merely to make this gate pass.

## Release decision

Status: **RC-CODE-READY / LIVE-ACCEPTANCE-PENDING**

Promote to production release only after both live gates above pass with no blocker/high failures.
