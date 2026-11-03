# Policies

> Current document: `skandi-embeds/policies/README.md`. Original reference: `HTML_REF/skandi/Policies.md`.


## INFO / LOG

- **Current status:** `B-011.3 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **System:** SKANDI customer website
- **Route:** `/about/legal/policies`
- **Wix page:** `Policies.sgcey`
- **HTML component:** `#legalPolicyEmbed`
- **HTML child source:** `SKANDI_LEGAL_DOCUMENT`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Linked page controller:** `/src/pages/Policies.sgcey.js`
- **Canonical public facade:** `/src/backend/SKANDI_CORE/legalPolicy.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/legalPolicy.js`
- **Canonical Supabase transport:** `/src/backend/SKANDI_CORE/supabaseServer.js`
- **Canonical policy source:** Supabase `public.legal_policies`
- **Acknowledgement evidence store:** Supabase `public.document_acknowledgements`
- **Legal hub route:** `/about/legal`
- **Global customer header/footer:** `masterPage.js`; this embed does not own global chrome.
- **Last verified:** `2026-09-24`

### Canonical B-011.3 chain

Policy read:

`#legalPolicyEmbed`
→ `postMessage`
→ `/src/pages/Policies.sgcey.js`
→ `backend/SKANDI_CORE/legalPolicy.web`
→ `backend/SKANDI_CORE/legalPolicy`
→ `backend/SKANDI_CORE/supabaseServer`
→ `public.legal_policies`

Acknowledgement submit, only when required:

`Policy document acknowledgement form`
→ `LEGAL_ACK_SUBMIT`
→ `/src/pages/Policies.sgcey.js`
→ `submitPublicLegalAcknowledgement`
→ `submitPublicLegalAcknowledgementCore`
→ re-check current `legal_policies.acknowledgement_required = true`
→ validate the current published policy version
→ insert evidence into `public.document_acknowledgements`.

### Acknowledgement visibility rule

The acknowledgement UI is rendered **only** when the live public policy payload contains:

`acknowledgement_required = true`

The flag is read from the current Supabase policy record. The HTML does not maintain a second acknowledgement registry or hard-coded list.

At verification time, all seven currently published external `legal_policies` records had `acknowledgement_required = false`; therefore the new acknowledgement panel will remain hidden until Policy Control/Supabase marks an applicable policy as requiring acknowledgement.

### Acknowledgement fields incorporated

The integrated acknowledgement uses the supplied Policy Acknowledgement implementation as the functional basis and keeps its meaningful evidence fields:

- relationship
- legal first name
- legal last name
- email
- phone
- acknowledge / do not acknowledge decision
- required comment when not acknowledging
- electronic consent
- typed legal signature
- timestamp
- drawn signature.

The separate access-code loader and duplicate document viewer from the standalone acknowledgement page are intentionally not duplicated inside the Policy page because the current policy is already securely resolved by the canonical Policy document route.

### Server-side enforcement

Client visibility is not treated as authorization.

Every acknowledgement submission re-reads the current policy and requires:

- `scope = external`
- `status = Published`
- `active = true`
- `deleted_at IS NULL`
- `acknowledgement_required = true`.

The submitted policy version must also still equal the current published version. If the policy changes while it is being reviewed, submission is rejected and the customer must reload before acknowledging.

### Evidence persistence

Each accepted acknowledgement writes one record to `public.document_acknowledgements` containing:

- `entity_id = legal_policies.policy_id`
- acknowledgement status
- comment
- public source metadata
- policy ID/document ID/slug/title/version
- customer relationship and contact identity
- electronic-consent evidence
- typed signature
- server timestamp
- drawn signature PNG data
- client-generated submission ID for retry idempotency.

A repeated submission with the same submission ID returns the existing acknowledgement instead of creating a duplicate row.

### B-011.3 page behavior

Preserved from B-011.2:

- Back to Legal
- sticky desktop Table of contents
- active TOC section tracking
- Suggested documents
- published PDF access
- parent-owned internal navigation
- B-011 Home/customer palette
- responsive stacking
- print-only document output.

Added:

- `Acknowledgement` entry in the side TOC only when required
- side-rail `ACTION REQUIRED` card only when required
- integrated B-011 acknowledgement form after the policy content only when required
- server-side acknowledgement persistence
- success/error handling in the existing Policy page bridge.

### Legacy acknowledgement page

The repository's standalone `Policy Acknowledgement.yfm21.js` remains compatibility-only and imports the legacy/missing `backend/LEGAL/legalPolicyService.web`.

This B-011.3 package does not depend on that page or legacy backend. The public Policy route now owns acknowledgement for policies whose Supabase flag requires it.

### Message contracts

HTML → page:
- `LEGAL_DOCUMENT_READY`
- `LEGAL_DOCUMENT_REFRESH`
- `LEGAL_DOCUMENT_HEIGHT`
- `LEGAL_DOCUMENT_NAVIGATE`
- `LEGAL_ACK_SUBMIT`

Page → HTML:
- `LEGAL_DOCUMENT_CONTEXT`
- `LEGAL_DOCUMENT_DATA`
- `LEGAL_DOCUMENT_ERROR`
- `LEGAL_ACK_RESULT`
- `LEGAL_ACK_ERROR`

---


- 2026-10-28 UTC — Updated `skandi-embeds/policies/skandi-policies.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Travel Policies** (`/about/legal/policies`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE


### V12 public legal presentation update — 2026-10-20 UTC

- Confirmed `/src/pages/Policies.sgcey.js` bridges use the current canonical `backend/SKANDI_CORE/legalPolicy.web.js` facade and `legalPolicy.js` public projection. The established public scope/published/active filter, document selector, navigation, PDF link, and acknowledgement submission contracts remain unchanged.
- Updated the complete Wix HTML payload for `#legalPolicyEmbed` to a restrained SKANDI navy and cyan legal-document design with larger body text, document headings, controls, accessible mobile sizes and mobile table/rail containment. Existing global Wix header/footer remain owned by `masterPage.js`; no second site header is introduced.
- Added a bounded, idempotent initial `READY` message retry to recover when the child iframe starts before the Wix page controller has registered its listener. This retries only the existing message contract; it does not bypass the canonical backend or create local legal records.
- IMPORTANT ROUTE NOTE: The verified canonical V12 route registry currently defines `/about/legal/policies`, NOT the abbreviated `/legal` aliases. Wix page slugs/redirects must be configured separately if `/legal` or `/legal/policies` are explicitly required. No unapproved route mutation is included.
- **STATICALLY VERIFIED** against the current GitHub `main` HTML message contract and backend imports. **REQUIRES LIVE TEST** in the published Wix page for actual data loading, navigation, sizing, PDF links and any required acknowledgement.

> The matching executable source is maintained in this page folder.
