# Travel Insurance

> Current document: `skandi-embeds/travel-insurance/README.md`. Original reference: `HTML_REF/skandi/Travel Insurance.md`.


## INFO / LOG

- **Status:** READY — B-011.3 design/style convergence
- **System:** SKANDI customer website
- **Route:** `/travel-info/insurance`
- **Wix page:** `Insurance.ojo62`
- **HTML component:** `#travelInsuranceEmbed`
- **HTML child source:** `SKANDI_INSURANCE_PAGE`
- **Page controller:** `/src/pages/Insurance.ojo62.js`
- **Backend/data owner:** `backend/SKANDI_CORE/publicContent.web → publicContent`
- **Global header/footer:** `masterPage.js`
- **Version:** `B-011.3`
- **Last verified:** `2026-09-25`

### B-011.3 changes

- Kept this as a **separate Travel Info page**. No merged topic-switching page is used.
- Applied the shared B-011 customer palette used by Home and global chrome.
- Added a restrained Travel Info return rail rather than an internal four-topic switcher.
- Restyled the photographic hero into the common Travel Info B-011 treatment.
- Standardized section widths to 1180px, typography scale, card radii, borders, shadows, search panels, CTAs, FAQs and responsive behavior.
- Preserved the supplied page content and functional IDs.
- Preserved existing data/message contracts where this page already has a Wix page bridge.
- Added stable section/content hooks to the hero for the later Presentation Registry pass.
- Did not add page-owned global header/footer.
- Did not add a new database table, RPC, backend service or provider.

### Live data chain

`#travelInsuranceEmbed`
→ `Insurance.ojo62.js`
→ `getPublicInsurancePayload`
→ `backend/SKANDI_CORE/publicContent`
→ published Travel Info insurance guidance + public ANCILLARY inventory projection.

No backend change is included in B-011.3.

---


- 2026-10-28 UTC — Updated `skandi-embeds/travel-insurance/skandi-travel-insurance.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Travel Insurance** (`/travel-info/insurance`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

> The matching executable source is maintained in this page folder.
