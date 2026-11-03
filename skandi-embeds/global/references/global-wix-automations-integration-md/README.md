# INFO / LOG — Wix Automations Integration

- **System area:** GLOBAL / SKANDI V12
- **Purpose:** Canonical server-side connection between SKANDI V12 and Wix Automations, including the Git-managed Run Velo Code entry point and centralized automated-email content management.
- **Wix site:** SKANDI TRAVELS (`97bf5405-2507-4744-b53a-0f1a5a61796d`).
- **Canonical backend facade:** `/src/backend/SKANDI_CORE/automationControl.web.js`
- **Canonical backend core / Git action entry point:** `/src/backend/SKANDI_CORE/automationControl.js`
- **Automated-email config:** `/src/backend/SKANDI_CORE/automationEmailConfig.js`
- **Automated-email compiler:** `/src/backend/SKANDI_CORE/automationEmailTemplates.js`
- **Automation Email Action provider adapter:** `/src/backend/SKANDI_CORE/automationEmailPlatform.js`
- **Wix providers:** `@wix/automations` → `automationsV2`; `@wix/automations-email-actions` → `automationEmailAction`.
- **Authorization:** Wix Site Member facade plus canonical `requireStaffPortalSessionCore()` and existing system-administrator check for automation administration. Runtime Run Velo Code remains backend-only.
- **Current consumer:** `/src/pages/Customer Service Desk.benbs.js` → existing Customer Service Desk Admin Center.
- **HTML contract:** Existing `SKANDI_SUPPORT_AGENT` HTML already accepts `triggers[]` and `automations[]` in `AGENT_BOOTSTRAP`; no Customer Service Desk HTML replacement is required for this connection.
- **Run Velo Code contract:** On Git-managed Wix sites, select existing backend function `/src/backend/SKANDI_CORE/automationControl.js` → `skandiAutomationHandler`. The conventional `invoke` export aliases the same implementation.
- **Source of truth:** Wix Automations remains authoritative for workflow definitions, trigger/action configuration, email type, activation state, revisions and execution. SKANDI V12 remains authoritative for SKANDI business workflow handlers, reusable brand/legal/contact values and compiled email content.
- **Secrets:** None are exposed to HTML or page code. Secure member links/codes remain runtime Wix trigger properties and are not stored in configuration.
- **Status:** **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Git installation/synchronization and Wix publication.

## Architecture

Administration read path:

`Customer Service Desk HTML` → `postMessage / AGENT_READY` → `/src/pages/Customer Service Desk.benbs.js` → `/src/backend/SKANDI_CORE/automationControl.web.js` → `/src/backend/SKANDI_CORE/automationControl.js` → Wix Automations V2.

Git-managed Run Velo Code path:

`Wix Automation trigger` → `Run Velo Code` → existing backend function `SKANDI_CORE/automationControl.js → skandiAutomationHandler()` → `runAutomationActionCore()` → explicitly mapped canonical SKANDI workflow handler.

Automated-email content-management path:

`Authorized system administrator` → `automationControl.web.js` → `automationControl.js` → `automationEmailPlatform.js` → Wix Automation Email Action API.

Email content source path:

`automationEmailConfig.js` → `automationEmailTemplates.js` → deterministic MJML content → Wix Send an email action.

The automation layer is supplemental to the existing Customer Support chain. Supabase remains authoritative for customer-support cases/messages and employee authorization data. Wix Automations remains authoritative for automation workflow definitions and delivery execution.

## Behavior

1. Customer Service Desk requests its normal bootstrap.
2. The Wix page controller requests the existing customer-support bootstrap and a Wix Automations administration snapshot in parallel.
3. Authorized system administrators receive normalized automation and trigger metadata in the existing `AGENT_BOOTSTRAP` payload.
4. The existing Admin Center renders these records through its already-present `db.triggers` and `db.automations` contract.
5. Staff without automation-administration authority continue to receive the Customer Service Desk normally; the automation arrays remain empty and the support workspace is not blocked.
6. Automation payloads, action mappings, email contents, trigger schemas, secrets and internal execution details are not exposed to the HTML embed.
7. For Git-managed Run Velo Code actions, Wix can select the existing `skandiAutomationHandler` backend export instead of attempting to create an unsupported service-plugin `.js` file from the Automations interface.
8. The runtime entry point accepts Wix's action options object, extracts `payload`, delegates to the canonical action boundary, and returns the empty object required by Wix after successful execution.
9. The runtime action boundary fails closed for unmapped production workflows. It never reports a successful customer communication when no canonical SKANDI workflow handler exists.
10. `SKANDI_AUTOMATION_ENTRYPOINT_TEST` remains the only runtime action accepted by the base automation control itself.
11. Static automated-email values are centralized in `automationEmailConfig.js`; Wix Global Storage is not required for logo URLs, legal values, support routes, social links or shared email branding.
12. Email content synchronization is an administrative operation and is never performed on each live automation execution.
13. Before replacing content, the provider adapter verifies that the requested action belongs to the requested automation and that it is the Wix `triggered-emails` Send an email action.
14. The provider reads existing content before a replacement, matching Wix's documented safest update sequence.
15. New content is generated as MJML because Wix documents WEB composer data as proprietary and recommends MJML when authoring automation email content from scratch.
16. Employee/customer routing is communication routing only: corporate email domain OR Company `SKANDI`. It is never an access-control grant.
17. Member security values (`createSignupLink`, `confirmEmailCode`, `resetPasswordLink`) remain Wix trigger placeholders and are never persisted as central/static values.
18. Business Critical templates automatically exclude optional SKANDI CLUB/promotional modules. Promotions are isolated to workflows declared `PROMOTIONAL`.
19. The Wix Send an email action remains the delivery layer for member security so Business Critical unsubscribe behavior is preserved.
20. Existing action email type cannot be read or changed through the content API. The builder/action must therefore be checked against each workflow's required classification before activation.

## Central values

Verified current site/business values include:

- Site: `https://www.skanditravels.com`
- RIAINTRA: `https://www.skanditravels.com/riaintra`
- Support: `/about/support`
- Legal: `/about/legal`
- Privacy policy: `/about/legal/policies?slug=privacy-policy`
- Booking terms: `/about/legal/policies?slug=booking-terms`
- Contact/safe-sender display: `contact@skanditravels.com`
- Support phone: `+1 646 583 1610`
- Wix Site Properties physical address: `450 Lexington Avenue, New York, NY 10163, United States`
- V12 legal footer line: `SKANDI GROUP Inc. (United States) & SKANDI GROUP Aktiebolag (Sweden)`

Email hero image URLs remain intentionally empty until approved public assets are established. Templates fall back to the SKANDI navy hero without losing layout.

## Workflow catalog

The centralized V12 catalog predeclares current and future workflow families for:

- Wix Members / identity security
- customer account lifecycle
- bookings and itinerary changes
- payment and refund operations
- travel documents/check-in/reminders
- flight and travel operational alerts
- transfers/hotels/cruise/tour/car rental/baggage
- travel requirements/destination alerts
- support and lost-baggage cases
- SKANDI CLUB
- Store and gift cards
- recruitment
- employee onboarding/access/roster/TripTrade/payroll/policy/training/uniform/helpdesk/documents
- generic customer/employee transactional and customer promotional use

Future workflows still require verification of their actual Wix trigger schema before activation. The catalog is a controlled content/configuration baseline, not proof that every future provider trigger already exists.

## Scope of this implementation

The existing Customer Service Desk administration connection is preserved.

The automated-email platform can inspect, preview, synchronize email content and generate the opaque input mapping for a new Send an email action. It does not automatically activate/deactivate automations or change existing email classification.

No Supabase schema, external mail provider, page controller, HTML embed, staff authorization model or Wix member provisioning logic is replaced.

Custom Velo-code triggers remain an approved SKANDI pattern where required by a specific subsystem. No existing custom-trigger contract is changed.

## Verification

- **VERIFIED:** Current SKANDI repository uses `@wix/automations` and `@wix/essentials` server-side in V12.
- **VERIFIED:** Current Wix documentation exposes `@wix/automations-email-actions` with `getEmailContent`, `setEmailContent`, `previewEmailContent`, `sendTestEmail` and `generateActionInputMapping`.
- **VERIFIED:** Wix recommends MJML when writing Automation Email Action content from scratch.
- **VERIFIED:** `BUSINESS_CRITICAL` email actions cannot specify a notification topic and are essential messages that contacts cannot unsubscribe from.
- **VERIFIED:** Wix Site Properties currently returns contact email `contact@skanditravels.com` and physical address `450 Lexington Avenue, New York, NY 10163, United States`.
- **VERIFIED:** Member Approved, Email Confirmation and Reset Password native automations and their Send Email actions were readable through the current public API on 2026-10-16.
- **STATICALLY VERIFIED:** All delivered JavaScript files pass Node syntax checks.
- **STATICALLY VERIFIED:** The deterministic compiler generated every allowed audience variant for all 71 catalog workflows in local tests.
- **STATICALLY VERIFIED:** Security templates preserve Wix secure placeholder names and reject optional promotion modules.
- **REQUIRES LIVE TEST:** Wix Git synchronization/build, module resolution, admin sync call, MJML preview, actual member-security delivery, secure-link/code completion, duplicate prevention and final RIAINTRA authorization denial tests.

## CHANGE LOG

- **2026-10-14** — Added the canonical V12 Wix Automations read connection. Live automation metadata is normalized in `SKANDI_CORE`, system-admin gated, and merged into the existing Customer Service Desk `AGENT_BOOTSTRAP` contract. No automation workflow, status or HTML payload was modified.
- **2026-10-15** — Added the missing Git-managed Run Velo Code entry point to the existing canonical `automationControl.js`. `skandiAutomationHandler` delegates to the canonical action boundary and `invoke` aliases the same implementation for Wix custom-action compatibility. Unmapped customer-facing workflows fail closed rather than returning false success. No automation definition, email workflow, Supabase resource, Wix deployment or external provider was modified. **STATICALLY VERIFIED — REQUIRES LIVE TEST.**
- **2026-10-16** — Added the V12 centralized automated-email platform. Shared brand/legal/contact/social values and a 71-workflow catalog now live in `automationEmailConfig.js`; deterministic MJML compilation lives in `automationEmailTemplates.js`; authorized Wix Automation Email Action inspection/preview/content synchronization and new-action mapping live in `automationEmailPlatform.js`. Existing automation administration and runtime entry behavior are preserved. Secure Wix member values remain trigger-scoped. Business Critical email remains the security delivery layer and promotional modules are prevented from entering Business Critical/non-promotional transactional templates. No live Wix automation was modified by this package. **STATICALLY VERIFIED — REQUIRES LIVE TEST.**

## Booking completion → branded booking-confirmation email (2026-10-18)

The canonical Wix customer-booking facade now dispatches a single owner-verified
**BOOKING_CONFIRMED** Wix Automation custom trigger after the established
`commitBooking`, `commitHotelBooking`, `commitCarBooking`,
`createCustomerCarBooking`, or `reconcileBooking` operation has **returned a
Confirmed result**. The underlying Duffel, Stripe, ALTEA, cart-persistence and
payment interfaces remain unchanged. The Wix member contact ID is resolved by
Wix server-side after the booking is saved, and the confirmed cart is reread
through `customerBooking.js` with established owner checks. No browser or HTML
embed may provide the recipient, booking state, amount, or supplier references.

The exact chain is:

`Booking.confirmation HTML_REF (unchanged)` → `Booking.e8twe.js (unchanged)` →
`customerBooking.web.js` → `customerBooking.js + bookingCart.js (unchanged)` →
`bookingConfirmationEmail.js` → existing `supabaseServer.js` →
`customer_notifications` unique delivery claim →
Wix `@wix/automations` `customTrigger.runTrigger` →
existing `BOOKING_CONFIRMED` MJML workflow content in
`automationEmailConfig.js` + `automationEmailTemplates.js` → Wix Send an email action.

Wix custom trigger must be created in the live Wix Automations builder and its
**trigger ID (not automation ID)** placed into Wix Secrets Manager under
`SKANDI_BOOKING_CONFIRMATION_TRIGGER_ID`. The exact trigger ID is not included
in Git. Wix recipient mapping must use the `contactId` payload field and the
Send an email action must have the approved Business Transactional classification,
notification topic, sender configuration and published email content. The
admin email-platform sync operation can install the `BOOKING_CONFIRMED` MJML
into the selected existing Wix email action after Wix settings are configured.
This package does not create or activate Wix Automations.

Flat, source-grounded fields include: `contactId`, `memberId`, `bookingId`,
`bookingReference`, `supplierReference`, `customerEmail`, `productType`,
`confirmationDate`, `travelerDetails`, `flightDetails`, `hotelDetails`,
`carDetails`, `transferDetails`, `seatDetails`, `extrasDetails`,
`totalAmount`, `currency`, `paymentStatus`, `manageBookingUrl`,
`documentCenterUrl`, `confirmationSource`.

For flight/package, hotel, and car bookings, applicable provider details must
be present before dispatch. Incomplete source data, mismatched member/contact
email, unconfirmed status or invalid currency blocks email dispatch rather
than generating invented information. Relevant omitted products are labeled
as not part of that booking. Neither the email nor custom trigger grants staff
access or changes booking/payment state. The primary CTA goes to authenticated
My Profile to see current complete documents; an email is not a ticket or voucher.

`customer_notifications.notification_id` is the existing unique delivery claim,
keyed by confirmed cart. The server records an accepted trigger separately from
verified customer receipt; ambiguous failures require operator review, not
automatic duplicate sends. Email dispatch errors are logged independently:
a completed and paid booking must never be reversed or retried because email
failed. The customer-facing Booking Confirmation HTML payload and its live embed
are intentionally unchanged; **no live HTML replacement is required**.

**STATICALLY VERIFIED** against repository `main` tree SHA
`bd1edfda1411114197c61f79bfc9401ff252955e`, current Wix custom-trigger
API, and Supabase `booking_carts`/`customer_notifications` columns and unique
constraints. **REQUIRES LIVE TEST:** Wix custom trigger ID, recipient mapping,
Business Transactional classification/topic, email action content sync,
Wix Git module resolution, booking reconciliation and actual email delivery.

## CHANGE LOG — continued

- **2026-10-18** — Added V12 completed-booking customer-email dispatch at the existing customer booking web facade. Owner-verified confirmed-cart data is flattened into the existing branded `BOOKING_CONFIRMED` automation email content, including travelers, itinerary, booked services, amount and payment state. Reuses the unique `customer_notifications` delivery claim, preserves all existing Booking HTML_REF content and backend service boundaries, and does not alter external deployment. **STATICALLY VERIFIED — REQUIRES LIVE TEST.**
