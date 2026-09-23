# Sbaah E2E Acceptance — Release Gate

## Canonical journey
Asset → Listing (sale/rent) → Lead → Interest → Viewing → Reservation → Deal

Sale completion → Customer / purchased asset.
Rent completion → Lease Contract → Parties → Installments → Payments → Maintenance.

## Acceptance rules
- Use real dashboard/public-site flows; never insert database fixtures merely to pass acceptance.
- Every entity must stay inside the test tenant.
- Public visitors see only published, non-closed commercial data.
- Record role, viewport, entity IDs, expected/actual result, evidence and severity for failures.
- Tenant isolation, permissions, money and availability failures are release blockers.

## A. Sale journey
1. Create project and optional phase/unit type.
2. Create asset and verify Project Inventory.
3. Create and publish sale Listing.
4. Verify public list/detail.
5. Submit public inquiry and verify exactly one Lead/Listing Interest.
6. Create viewing, reservation and sale deal.
7. Move deal through negotiation and close with the real sale-closing flow.
8. Verify Asset 360, Customer 360, Sales Center and availability agree.
9. Verify closed sale is no longer publicly available.

## B. Rent journey
1. Create/publish rent Listing with pricing period.
2. Capture Lead/Interest, reservation and rent deal.
3. Mark commercial deal won.
4. Create authoritative lease through Rent Plus.
5. Generate installments and record/allocate payment.
6. Create maintenance against the same leased asset/contract.
7. Verify Customer/Tenant 360 and Asset 360.
8. Attempt overlapping lease/reservation for the asset family and verify rejection.

## C. Permissions
Run core reads/writes as Owner, Admin and Agent. No role may cross tenant boundaries by changing URL IDs or payload IDs. Agent must remain inside assigned CRM scope and restricted inventory actions must be rejected.

## D. Public website
Test Arabic/English and desktop/mobile: home sections, projects, property filters/detail, media, sale/rent labels, inquiry, hidden unpublished/closed data, and safe not-found behavior.

## E. Website Builder
Change branding/content; add/hide/reorder/duplicate supported sections; configure dynamic sections; verify public propagation; verify unsupported sections/themes cannot silently render incompatible content.

## F. Mobile
At minimum test 390×844 plus a small Android-equivalent viewport: navigation, tables, create/edit modals, long forms with keyboard, safe-area, scroll locking, horizontal overflow and reachable primary actions.

## G. External tester protocol
Use at least three independent perspectives: small broker/marketer, developer/project-sales user, and public property seeker. Record task pass/fail, completion time, confusion, missing fields, business/technical errors, UI issues, severity and exact reproduction steps. Do not coach testers unless blocked.

## Release gate
Release candidate requires zero blocker/high failures in canonical sale/rent journeys; zero tenant-isolation/permission failures; zero reservation/lease concurrency failures; correct public Lead/Interest capture; public visibility rules passing; usable mobile critical actions; and successful production builds.
