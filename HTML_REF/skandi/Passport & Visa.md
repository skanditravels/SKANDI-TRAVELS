# Passport & Visa

## INFO / LOG

- **Status:** V12 UX / presentation upgrade prepared — REQUIRES LIVE TEST
- **System:** SKANDI customer website
- **Route:** `/travel-info/passport-visa`
- **Wix page:** `Passport & Visa.zohjw`
- **HTML component:** `#passportVisaEmbed`
- **HTML child source:** `SKANDI_PASSPORT_VISA_PAGE`
- **Page controller:** `/src/pages/Passport & Visa.zohjw.js`
- **Canonical facade:** `/src/backend/SKANDI_CORE/publicContent.web.js`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/publicContent.js`
- **Backend/data owner:** `backend/SKANDI_CORE/publicContent.web → publicContent`
- **Supabase resources:** `travel_requirements`, `travel_info_articles`, `inventory_public_entities_v` through the existing canonical public-content core
- **External provider boundary:** existing approved travel-requirements adapter used by `searchPublicTravelRequirementsCore`; no provider client is added in this page
- **Authentication/authorization:** public read surface; backend web methods remain `Permissions.Anyone`
- **Global header/footer:** `masterPage.js`
- **Cross-layer messages:** `PASSPORT_VISA_READY`, `PASSPORT_VISA_REFRESH`, `PASSPORT_VISA_LOADING`, `PASSPORT_VISA_DATA`, `PASSPORT_VISA_SEARCH`, `PASSPORT_VISA_SEARCHING`, `PASSPORT_VISA_SEARCH_RESULT`, `PASSPORT_VISA_SEARCH_ERROR`, `PASSPORT_VISA_ERROR`, `PASSPORT_VISA_NAVIGATE`, `PASSPORT_VISA_HOST_READY`
- **Runtime source version:** `V12-PASSPORT-VISA-2026.10.11`
- **Last source verification:** `2026-10-11`, repository `skanditravels/SKANDI-TRAVELS`, branch `main`, HEAD `5b88f891be2b2565e16b94b87545f8e763d98418`

### 2026-10-11 — V12 page upgrade

- Upgraded the customer experience without forcing the page into the exact section layout used by other Travel Info pages. The page keeps its own Passport & Visa information architecture while using the established V12 colors, typography, surfaces, spacing, borders and interaction language.
- Rebuilt the hero as a dedicated travel-document experience with a three-step pre-travel explanation rather than copying another page's hero composition.
- Rebuilt the requirements checker with clearer required/optional fields, keyboard support, accessible live status, date validation, reset behavior and explicit provider/guidance distinction.
- Preserved the exact existing Wix/controller/backend message contract and all canonical V12 backend ownership. No new table, provider, facade, client or duplicate data service is introduced.
- Improved result rendering so connected-provider fields, SKANDI fallback guidance, notices and final-authority guidance are visibly separated.
- Upgraded published destination guidance with a local filter and progressive reveal instead of rendering a large unfiltered wall of destination cards.
- Added the previously documented Travel Info return control to the actual executable markup and kept navigation on the existing `PASSPORT_VISA_NAVIGATE` contract.
- Preserved the page's safety language: a missing or fallback result is not represented as a live Timatic/IATA boarding decision, and final entry/transit decisions remain with official authorities and the operating carrier.
- No `LIVE`, `READY`, `SYNC` or similar decorative status pills were added.

### B-011.3 changes — preserved history

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

`#passportVisaEmbed`
→ `/src/pages/Passport & Visa.zohjw.js`
→ `getPublicPassportVisaPayload` / `searchPublicTravelRequirements`
→ `/src/backend/SKANDI_CORE/publicContent.web.js`
→ `/src/backend/SKANDI_CORE/publicContent.js`
→ Supabase Travel Info / Inventory public projections and the existing approved travel-requirements provider adapter.

### Verification state

- **STATICALLY VERIFIED:** current `main` page controller still uses `#passportVisaEmbed`, `SKANDI_PASSPORT_VISA_PAGE`, `SKANDI_WIX_PARENT`, `getPublicPassportVisaPayload`, `searchPublicTravelRequirements`, `PASSPORT_VISA_*` message types and the canonical `backend/SKANDI_CORE/publicContent.web` import.
- **STATICALLY VERIFIED:** current facade exports both frontend-callable methods used by the page controller with public-read permissions.
- **STATICALLY VERIFIED:** this HTML's executable JavaScript parses successfully and its dynamic content is escaped before rendering.
- **REQUIRES LIVE TEST:** Wix embed replacement, published backend proxy availability, external travel-requirements provider state, actual Supabase content returned, responsive layout inside the live Wix page, and end-to-end navigation.

---


- 2026-10-28 UTC — Updated `skandi-embeds/passport-visa/skandi-passport-visa.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Passport & Visa** (`/travel-info/passport-visa`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI • Passport & Visa</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --sk-blue:#022e64;
  --sk-blue-2:#0b3a7a;
  --sk-blue-3:#285ca8;
  --sk-cyan:#5fc7cf;
  --sk-cyan-soft:#dff5f7;
  --sk-pale:#f6faff;
  --sk-surface:#fbfdff;
  --sk-border:#dbe3ef;
  --sk-border-soft:#edf2f7;
  --sk-text:#111827;
  --sk-body:#526070;
  --sk-muted:#7a8695;
  --sk-ok:#087443;
  --sk-warning:#9a6412;
  --sk-warning-bg:#fff8e8;
  --sk-warning-border:#f1d38f;
  --sk-danger:#8a1f1f;
  --sk-max:1180px;
  --sk-shadow:0 18px 46px rgba(2,46,100,.09);
  --sk-shadow-soft:0 8px 24px rgba(2,46,100,.06);
}
html,body{
  width:100%;
  min-height:100%;
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#fff;
  color:var(--sk-text);
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
button,input{font:inherit}
button{touch-action:manipulation}
button:focus-visible,input:focus-visible,summary:focus-visible{
  outline:3px solid rgba(95,199,207,.38);
  outline-offset:3px;
}

.travel-rail{
  position:sticky;
  top:0;
  z-index:50;
  background:rgba(255,255,255,.95);
  border-bottom:1px solid var(--sk-border-soft);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
}
.travel-rail-inner{
  width:min(var(--sk-max),calc(100% - 48px));
  min-height:58px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
}
.travel-back{
  min-height:36px;
  border:1px solid var(--sk-border);
  border-radius:10px;
  background:#fff;
  color:var(--sk-blue);
  padding:0 13px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  font-size:11px;
  font-weight:800;
  cursor:pointer;
}
.travel-back:hover{background:var(--sk-pale);border-color:rgba(95,199,207,.6)}
.travel-context{
  color:var(--sk-muted);
  font-size:10px;
  font-weight:800;
  letter-spacing:.11em;
  text-transform:uppercase;
}

.hero{
  position:relative;
  isolation:isolate;
  min-height:480px;
  overflow:hidden;
  background:
    linear-gradient(92deg,rgba(1,27,58,.98) 0%,rgba(2,46,100,.93) 49%,rgba(2,46,100,.65) 100%),
    url("https://images.unsplash.com/photo-1544253303-34e8fcfd1976?auto=format&fit=crop&w=1920&q=85") center/cover;
}
.hero::after{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  background:
    radial-gradient(circle at 82% 14%,rgba(95,199,207,.22),transparent 24%),
    linear-gradient(180deg,transparent 65%,rgba(0,15,33,.24));
  pointer-events:none;
}
.hero-inner{
  width:min(var(--sk-max),calc(100% - 48px));
  min-height:480px;
  margin:0 auto;
  display:grid;
  grid-template-columns:minmax(0,1.22fr) minmax(330px,.78fr);
  gap:58px;
  align-items:center;
  padding:58px 0 52px;
}
.hero-copy{max-width:720px}
.eyebrow{
  color:var(--sk-cyan);
  font-size:11px;
  font-weight:850;
  letter-spacing:.16em;
  text-transform:uppercase;
  margin-bottom:14px;
}
.hero h1{
  color:#fff;
  font-size:clamp(42px,5.6vw,70px);
  line-height:.96;
  letter-spacing:-.055em;
  font-weight:700;
  max-width:760px;
}
.hero-lede{
  margin-top:20px;
  max-width:690px;
  color:rgba(255,255,255,.84);
  font-size:15px;
  line-height:1.75;
}
.hero-note{
  margin-top:24px;
  display:flex;
  align-items:flex-start;
  gap:11px;
  max-width:650px;
  color:rgba(255,255,255,.72);
  font-size:11px;
  line-height:1.6;
}
.hero-note-mark{
  width:8px;
  height:8px;
  margin-top:5px;
  flex:0 0 8px;
  border-radius:50%;
  background:var(--sk-cyan);
  box-shadow:0 0 0 5px rgba(95,199,207,.12);
}
.hero-panel{
  border:1px solid rgba(255,255,255,.17);
  border-radius:22px;
  background:rgba(4,26,53,.7);
  box-shadow:0 20px 60px rgba(0,0,0,.2);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  padding:25px;
}
.hero-panel h2{
  color:#fff;
  font-size:18px;
  letter-spacing:-.025em;
  margin-bottom:6px;
}
.hero-panel>p{
  color:rgba(255,255,255,.7);
  font-size:11px;
  line-height:1.6;
  margin-bottom:20px;
}
.hero-step{
  display:grid;
  grid-template-columns:34px 1fr;
  gap:12px;
  padding:14px 0;
  border-top:1px solid rgba(255,255,255,.11);
}
.hero-step:first-of-type{border-top:0;padding-top:0}
.hero-step:last-child{padding-bottom:0}
.hero-step-no{
  width:34px;
  height:34px;
  border-radius:10px;
  display:grid;
  place-items:center;
  background:rgba(95,199,207,.14);
  border:1px solid rgba(95,199,207,.25);
  color:#d9fbff;
  font-size:10px;
  font-weight:900;
}
.hero-step strong{display:block;color:#fff;font-size:11px;margin-bottom:3px}
.hero-step span{display:block;color:rgba(255,255,255,.66);font-size:10px;line-height:1.5}

.section{
  width:min(var(--sk-max),calc(100% - 48px));
  margin:0 auto;
  padding:64px 0;
}
.section.compact{padding-top:0}
.section-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:24px;
  margin-bottom:28px;
}
.section-copy{max-width:760px}
.section-kicker{
  color:var(--sk-blue-3);
  font-size:10px;
  font-weight:850;
  letter-spacing:.13em;
  text-transform:uppercase;
  margin-bottom:9px;
}
.section-title{
  color:var(--sk-blue);
  font-size:clamp(27px,3.6vw,40px);
  line-height:1.06;
  letter-spacing:-.045em;
  font-weight:700;
}
.section-subtitle{
  margin-top:10px;
  color:var(--sk-body);
  font-size:12px;
  line-height:1.75;
  max-width:780px;
}

.checker-wrap{
  margin-top:-52px;
  position:relative;
  z-index:10;
}
.checker{
  border:1px solid var(--sk-border);
  border-radius:24px;
  background:#fff;
  box-shadow:var(--sk-shadow);
  overflow:hidden;
}
.checker-top{
  padding:25px 26px 21px;
  border-bottom:1px solid var(--sk-border-soft);
  background:linear-gradient(180deg,#fff,var(--sk-surface));
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:18px;
}
.checker-top h2{
  color:var(--sk-blue);
  font-size:20px;
  letter-spacing:-.03em;
  margin-bottom:6px;
}
.checker-top p{color:var(--sk-body);font-size:11px;line-height:1.6;max-width:760px}
.checker-body{padding:26px}
.form-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:17px 18px;
}
.field label{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:10px;
  margin-bottom:7px;
  color:var(--sk-blue);
  font-size:10px;
  font-weight:800;
  letter-spacing:.045em;
  text-transform:uppercase;
}
.field label span{
  color:var(--sk-muted);
  font-size:9px;
  font-weight:650;
  letter-spacing:0;
  text-transform:none;
}
.field input{
  width:100%;
  min-height:48px;
  border:1px solid var(--sk-border);
  border-radius:12px;
  background:#fff;
  color:var(--sk-text);
  padding:0 14px;
  font-size:12px;
  font-weight:600;
  outline:none;
  transition:border-color .16s,box-shadow .16s,background .16s;
}
.field input:hover{border-color:#c8d4e3}
.field input:focus{border-color:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.12);background:#fff}
.field input::placeholder{color:#9ca7b5;font-weight:500}
.form-actions{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:14px;
  margin-top:20px;
  padding-top:20px;
  border-top:1px solid var(--sk-border-soft);
}
.form-hint{color:var(--sk-muted);font-size:10px;line-height:1.55;max-width:590px}
.action-buttons{display:flex;gap:10px;flex:0 0 auto}
.btn{
  min-height:44px;
  border-radius:11px;
  padding:0 18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  cursor:pointer;
  font-size:10px;
  font-weight:850;
  letter-spacing:.015em;
  transition:transform .16s,box-shadow .16s,background .16s,border-color .16s;
}
.btn:hover{transform:translateY(-1px)}
.btn-primary{border:0;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-2));color:#fff;box-shadow:0 8px 20px rgba(2,46,100,.16)}
.btn-primary:hover{box-shadow:0 11px 25px rgba(2,46,100,.22)}
.btn-primary:disabled{opacity:.58;cursor:wait;transform:none;box-shadow:none}
.btn-secondary{border:1px solid var(--sk-border);background:#fff;color:var(--sk-blue)}
.btn-secondary:hover{background:var(--sk-pale);border-color:#c9d5e3}
.lookup-status{
  margin-top:20px;
  border:1px solid #dceaf2;
  border-left:4px solid var(--sk-cyan);
  border-radius:12px;
  background:var(--sk-pale);
  padding:14px 15px;
  color:var(--sk-body);
  font-size:11px;
  line-height:1.6;
}
.lookup-status.warning{background:var(--sk-warning-bg);border-color:var(--sk-warning-border);border-left-color:#d39a2d;color:#80551a}
.lookup-status.success{background:#effaf5;border-color:#c9eadb;border-left-color:var(--sk-ok);color:#155f45}
.lookup-result{margin-top:15px;display:grid;gap:12px}
.result-summary{
  border:1px solid var(--sk-border);
  border-radius:15px;
  background:linear-gradient(180deg,#fff,var(--sk-surface));
  padding:18px;
}
.result-summary-row{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
.result-summary h3{font-size:15px;color:var(--sk-blue);letter-spacing:-.02em}
.result-summary p{margin-top:6px;color:var(--sk-body);font-size:10.5px;line-height:1.65;max-width:780px}
.result-source{text-align:right;color:var(--sk-muted);font-size:9px;line-height:1.55;max-width:240px}
.result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.result-card{
  border:1px solid var(--sk-border-soft);
  border-radius:15px;
  background:#fff;
  padding:18px;
  box-shadow:var(--sk-shadow-soft);
}
.result-meta{color:var(--sk-blue-3);font-size:9px;font-weight:850;letter-spacing:.11em;text-transform:uppercase;margin-bottom:7px}
.result-card h4{color:var(--sk-blue);font-size:14px;line-height:1.35;margin-bottom:7px;letter-spacing:-.02em}
.result-card p{color:var(--sk-body);font-size:10.5px;line-height:1.7;white-space:pre-line}
.result-list{list-style:none;margin-top:8px;display:grid;gap:7px}
.result-list li{position:relative;padding-left:15px;color:var(--sk-body);font-size:10.5px;line-height:1.6}
.result-list li::before{content:"";position:absolute;left:0;top:.64em;width:7px;height:2px;background:var(--sk-cyan)}
.authority-card{border-color:#cfe8ec;background:linear-gradient(135deg,#f4fcfd,#fff)}

.guidance-band{background:linear-gradient(180deg,var(--sk-surface),#fff);border-top:1px solid var(--sk-border-soft);border-bottom:1px solid var(--sk-border-soft)}
.guidance-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
.guidance-card{
  min-height:220px;
  border:1px solid var(--sk-border-soft);
  border-radius:18px;
  background:#fff;
  padding:22px;
  box-shadow:var(--sk-shadow-soft);
}
.icon-box{
  width:44px;
  height:44px;
  border:1px solid rgba(95,199,207,.26);
  border-radius:12px;
  background:var(--sk-pale);
  display:grid;
  place-items:center;
  color:var(--sk-blue);
  margin-bottom:20px;
}
.icon-box svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.guidance-card h3{color:var(--sk-blue);font-size:16px;letter-spacing:-.025em;margin-bottom:8px}
.guidance-card p{color:var(--sk-body);font-size:11px;line-height:1.72}
.warning-box{
  margin-top:16px;
  display:grid;
  grid-template-columns:42px 1fr;
  gap:14px;
  border:1px solid var(--sk-warning-border);
  border-radius:16px;
  background:var(--sk-warning-bg);
  padding:18px;
}
.warning-icon{
  width:42px;height:42px;border-radius:11px;background:#fff3d2;color:var(--sk-warning);display:grid;place-items:center;font-size:18px;font-weight:900
}
.warning-box h4{color:#7e5317;font-size:13px;margin-bottom:5px}
.warning-box p{color:#805f2e;font-size:10.5px;line-height:1.65}

.authorization{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(330px,.82fr);
  gap:22px;
  border-radius:22px;
  padding:30px;
  background:
    radial-gradient(circle at 94% 0%,rgba(95,199,207,.18),transparent 30%),
    linear-gradient(135deg,var(--sk-blue),#061a30);
  box-shadow:0 18px 42px rgba(2,46,100,.16);
}
.authorization h2{color:#fff;font-size:26px;line-height:1.12;letter-spacing:-.04em;margin-bottom:11px}
.authorization p{color:rgba(255,255,255,.74);font-size:11px;line-height:1.7;max-width:650px}
.authorization .btn{margin-top:20px;background:#fff;color:var(--sk-blue);border:0;box-shadow:none}
.auth-list{display:grid;gap:10px}
.auth-row{display:grid;grid-template-columns:32px 1fr;gap:11px;align-items:flex-start;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.065);padding:13px}
.auth-check{width:32px;height:32px;border-radius:9px;background:rgba(95,199,207,.15);display:grid;place-items:center;color:#d8fbff;font-weight:900;font-size:12px}
.auth-row strong{display:block;color:#fff;font-size:10.5px;margin-bottom:3px}.auth-row span{display:block;color:rgba(255,255,255,.64);font-size:9.5px;line-height:1.5}

.destination-tools{
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}
.destination-search{
  min-height:42px;
  width:min(320px,100%);
  border:1px solid var(--sk-border);
  border-radius:11px;
  padding:0 13px;
  color:var(--sk-text);
  background:#fff;
  font-size:11px;
  font-weight:600;
  outline:none;
}
.destination-search:focus{border-color:var(--sk-cyan);box-shadow:0 0 0 4px rgba(95,199,207,.12)}
.destination-count{color:var(--sk-muted);font-size:9.5px;white-space:nowrap}
.destination-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.destination-card{
  border:1px solid var(--sk-border-soft);
  border-radius:17px;
  background:#fff;
  padding:20px;
  box-shadow:var(--sk-shadow-soft);
}
.destination-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.destination-card h3{color:var(--sk-blue);font-size:15px;line-height:1.3;letter-spacing:-.02em}
.destination-code{color:var(--sk-blue-3);font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.destination-block{padding-top:11px;margin-top:11px;border-top:1px solid var(--sk-border-soft)}
.destination-block:first-of-type{padding-top:0;margin-top:0;border-top:0}
.destination-label{display:block;color:var(--sk-muted);font-size:8.5px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
.destination-block p{color:var(--sk-body);font-size:10px;line-height:1.65}
.destination-empty{grid-column:1/-1;border:1px dashed var(--sk-border);border-radius:15px;background:var(--sk-surface);padding:22px;color:var(--sk-muted);font-size:10.5px;line-height:1.6}
.load-more-wrap{display:flex;justify-content:center;margin-top:20px}

.faq-grid{display:grid;gap:9px;max-width:920px}
details{border:1px solid var(--sk-border);border-radius:13px;background:#fff;overflow:hidden}
summary{min-height:54px;padding:15px 17px;display:flex;justify-content:space-between;align-items:center;gap:18px;list-style:none;cursor:pointer;color:var(--sk-blue);font-size:11px;font-weight:800}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";color:var(--sk-cyan);font-size:20px;font-weight:500;line-height:1}
details[open] summary::after{content:"−"}
.faq-content{padding:0 17px 17px;color:var(--sk-body);font-size:10.5px;line-height:1.7;max-width:800px}

.final-check{
  border-top:1px solid var(--sk-border-soft);
  background:var(--sk-pale);
}
.final-grid{display:grid;grid-template-columns:1.1fr repeat(3,1fr);gap:14px;align-items:stretch}
.final-intro{padding-right:24px}
.final-intro h2{color:var(--sk-blue);font-size:24px;line-height:1.15;letter-spacing:-.035em;margin-bottom:9px}
.final-intro p{color:var(--sk-body);font-size:10.5px;line-height:1.7}
.final-item{border:1px solid #e1e9f2;border-radius:15px;background:#fff;padding:17px}.final-item strong{display:block;color:var(--sk-blue);font-size:11px;margin-bottom:6px}.final-item span{display:block;color:var(--sk-body);font-size:9.5px;line-height:1.6}

@media(max-width:980px){
  .hero-inner{grid-template-columns:1fr;gap:28px;min-height:auto;padding:64px 0 54px}
  .hero-panel{max-width:620px}
  .guidance-grid,.destination-results{grid-template-columns:repeat(2,minmax(0,1fr))}
  .authorization{grid-template-columns:1fr}
  .final-grid{grid-template-columns:1fr 1fr}.final-intro{grid-column:1/-1;padding-right:0}
}
@media(max-width:720px){
  .travel-rail-inner,.hero-inner,.section{width:calc(100% - 28px)}
  .travel-context{display:none}
  .hero{min-height:auto}
  .hero-inner{padding:52px 0 72px}
  .hero h1{font-size:42px}
  .hero-lede{font-size:13px}
  .hero-panel{padding:19px}
  .checker-wrap{margin-top:-36px}
  .checker-top,.checker-body{padding:20px}
  .checker-top{display:block}
  .form-grid{grid-template-columns:1fr}
  .form-actions{align-items:stretch;flex-direction:column}
  .action-buttons{width:100%}.action-buttons .btn{flex:1}
  .result-summary-row{display:block}.result-source{text-align:left;margin-top:10px;max-width:none}
  .result-grid,.guidance-grid,.destination-results,.final-grid{grid-template-columns:1fr}
  .section{padding:50px 0}
  .section-head{display:block}.destination-tools{margin-top:18px}.destination-search{width:100%}
  .authorization{padding:22px}
  .final-intro{grid-column:auto}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
</head>
<body>
<nav class="travel-rail" aria-label="Travel Info navigation">
  <div class="travel-rail-inner">
    <button id="backToTravelInfo" class="travel-back" type="button" aria-label="Back to Travel Info"><span aria-hidden="true">←</span> Travel Info</button>
    <div class="travel-context">Passport &amp; Visa</div>
  </div>
</nav>

<header class="hero" data-section-id="passport-hero">
  <div class="hero-inner">
    <div class="hero-copy">
      <div class="eyebrow" data-content-id="passport-hero-kicker">SKANDI TRAVEL INFO</div>
      <h1 data-content-id="passport-hero-title">Travel documents, checked before you go.</h1>
      <p class="hero-lede" data-content-id="passport-hero-copy">Search the same approved travel-requirements service used by SKANDI operations, review published destination guidance, and confirm the final rules with the relevant authorities before departure.</p>
      <div class="hero-note"><span class="hero-note-mark" aria-hidden="true"></span><span>Entry and transit rules depend on nationality, route, document type and travel date. A general rule should never replace a trip-specific check.</span></div>
    </div>
    <aside class="hero-panel" aria-label="How to use the travel document checker">
      <h2>Before you travel</h2>
      <p>Use the checker as your starting point, then complete the final verification before check-in.</p>
      <div class="hero-step"><div class="hero-step-no">01</div><div><strong>Enter the route</strong><span>Add nationality and destination. Origin and dates improve the context.</span></div></div>
      <div class="hero-step"><div class="hero-step-no">02</div><div><strong>Review the result</strong><span>Read provider fields, SKANDI guidance and any important notices returned.</span></div></div>
      <div class="hero-step"><div class="hero-step-no">03</div><div><strong>Verify the final authority</strong><span>Recheck official government, border and visa sources close to departure.</span></div></div>
    </aside>
  </div>
</header>

<main>
<section class="section checker-wrap" aria-labelledby="checker-title">
  <div class="checker">
    <div class="checker-top">
      <div>
        <div class="section-kicker">Trip-specific document check</div>
        <h2 id="checker-title">Check passport &amp; visa requirements</h2>
        <p>Nationality and destination are required. Add the remaining trip details when available so the connected requirements source receives the best possible context.</p>
      </div>
    </div>
    <div class="checker-body">
      <div class="form-grid">
        <div class="field"><label for="nationality">Nationality <span>Required</span></label><input id="nationality" maxlength="3" placeholder="SE / SWE" autocomplete="country-code" autocapitalize="characters"></div>
        <div class="field"><label for="residenceCountry">Country of residence <span>Optional</span></label><input id="residenceCountry" maxlength="3" placeholder="US / USA" autocomplete="country-code" autocapitalize="characters"></div>
        <div class="field"><label for="origin">Origin <span>Optional</span></label><input id="origin" maxlength="12" placeholder="ARN / JFK" autocomplete="off" autocapitalize="characters"></div>
        <div class="field"><label for="destination">Destination <span>Required</span></label><input id="destination" list="destinationOptions" maxlength="80" placeholder="United States, JFK, Thailand…" autocomplete="off"><datalist id="destinationOptions"></datalist></div>
        <div class="field"><label for="departureDate">Departure date <span>Optional</span></label><input id="departureDate" type="date"></div>
        <div class="field"><label for="returnDate">Return date <span>Optional</span></label><input id="returnDate" type="date"></div>
      </div>
      <div class="form-actions">
        <div class="form-hint">The checker uses the existing SKANDI V12 travel-requirements backend. If the approved external provider is unavailable, the page clearly identifies the result as guidance rather than a live boarding decision.</div>
        <div class="action-buttons">
          <button id="resetSearch" class="btn btn-secondary" type="button">Reset</button>
          <button id="requirementsSearch" class="btn btn-primary" type="button">Check requirements</button>
        </div>
      </div>
      <div id="lookupStatus" class="lookup-status" role="status" aria-live="polite">Enter your nationality and destination to begin.</div>
      <div id="lookupResult" class="lookup-result" tabindex="-1"></div>
    </div>
  </div>
</section>

<div class="guidance-band">
  <section class="section" aria-labelledby="guidance-title">
    <div class="section-head">
      <div class="section-copy">
        <div class="section-kicker">Passport guidance</div>
        <h2 class="section-title" id="guidance-title">The details that commonly change the answer</h2>
        <p class="section-subtitle">These are planning reminders only. The exact rule comes from the destination, transit authority and operating carrier requirements for your trip.</p>
      </div>
    </div>
    <div class="guidance-grid">
      <article class="guidance-card">
        <div class="icon-box" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"></rect><circle cx="12" cy="10" r="3"></circle><path d="M8 17h8"></path></svg></div>
        <h3>Passport validity</h3>
        <p>There is no universal six-month rule. Required validity can differ by destination, nationality and travel document, including whether the passport must remain valid beyond the planned stay.</p>
      </article>
      <article class="guidance-card">
        <div class="icon-box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 17h16"></path><path d="M7 17V7l5-3 5 3v10"></path><path d="M10 10h4"></path></svg></div>
        <h3>Transit points</h3>
        <p>A connection can introduce separate document or visa requirements even when the final destination would otherwise be permitted. Check every country and airport in the itinerary.</p>
      </article>
      <article class="guidance-card">
        <div class="icon-box" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"></circle><circle cx="16" cy="10" r="2.5"></circle><path d="M3 20c.7-4 2.7-6 6-6s5.3 2 6 6"></path><path d="M14 15c3.5 0 5.7 1.7 6.5 5"></path></svg></div>
        <h3>Children &amp; guardians</h3>
        <p>Children need documents accepted for their nationality and route. Some journeys can also require consent, custody or relationship documentation when a minor travels with one parent or another adult.</p>
      </article>
    </div>
    <div class="warning-box">
      <div class="warning-icon" aria-hidden="true">!</div>
      <div><h4>Damaged, emergency or temporary passports</h4><p>Acceptance varies by country and carrier. A document that is damaged, provisional, emergency-issued or otherwise non-standard should be verified specifically rather than assumed valid.</p></div>
    </div>
  </section>
</div>

<section class="section" aria-labelledby="authorization-title">
  <div class="authorization">
    <div>
      <div class="section-kicker" style="color:var(--sk-cyan)">Visas &amp; electronic authorization</div>
      <h2 id="authorization-title">A passport alone may not be enough.</h2>
      <p>Depending on nationality and itinerary, a traveler may need a visa, visa waiver, electronic travel authorization or other pre-departure approval. SKANDI can show connected guidance, but final eligibility remains with the relevant authority and operating carrier.</p>
      <button id="officialHelp" class="btn" type="button">Return to Travel Info</button>
    </div>
    <div class="auth-list">
      <div class="auth-row"><div class="auth-check">1</div><div><strong>Match the travel document</strong><span>The booking name and identity details should match the document intended for travel.</span></div></div>
      <div class="auth-row"><div class="auth-check">2</div><div><strong>Check authorization timing</strong><span>Some approvals must be obtained before check-in and may not be issued instantly.</span></div></div>
      <div class="auth-row"><div class="auth-check">3</div><div><strong>Recheck before departure</strong><span>Requirements can change after booking, including transit and document-validity rules.</span></div></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="destination-title">
  <div class="section-head">
    <div class="section-copy">
      <div class="section-kicker">Published SKANDI guidance</div>
      <h2 class="section-title" id="destination-title">Destination document information</h2>
      <p class="section-subtitle">These summaries come from the existing SKANDI Inventory / Travel Info content chain. They supplement the trip-specific checker above and are not a substitute for an official decision.</p>
    </div>
    <div class="destination-tools">
      <input id="destinationFilter" class="destination-search" type="search" placeholder="Filter destinations" aria-label="Filter destination guidance">
      <span id="destinationCount" class="destination-count"></span>
    </div>
  </div>
  <div id="destinationResults" class="destination-results"></div>
  <div class="load-more-wrap"><button id="loadMoreDestinations" class="btn btn-secondary" type="button" hidden>Show more destinations</button></div>
</section>

<section class="section compact" aria-labelledby="faq-title">
  <div class="section-head">
    <div class="section-copy">
      <div class="section-kicker">Common questions</div>
      <h2 class="section-title" id="faq-title">Passport &amp; visa FAQ</h2>
    </div>
  </div>
  <div class="faq-grid">
    <details><summary>Do transit countries have separate requirements?</summary><div class="faq-content">They can. Transit requirements depend on nationality, airport, document type, whether border control is crossed and the rules in force on the date of travel. Every transit country should be checked.</div></details>
    <details><summary>I have dual citizenship. Which passport should I use?</summary><div class="faq-content">Use a passport that satisfies the route's requirements and ensure the booking details match the document presented for travel. Some countries require their citizens to enter or leave using that country's passport.</div></details>
    <details><summary>What if the connected checker has no detailed result?</summary><div class="faq-content">Treat that as a signal to verify the trip directly with official government, border-control and visa-authority sources. A missing provider field is not confirmation that no requirement exists.</div></details>
    <details><summary>What happens if my documents do not meet the requirements?</summary><div class="faq-content">The operating carrier or border authority can refuse travel when required documents or authorizations are missing or invalid. Any resulting cost is governed by the applicable booking, supplier and authority rules.</div></details>
  </div>
</section>

<div class="final-check">
  <section class="section">
    <div class="final-grid">
      <div class="final-intro"><div class="section-kicker">Final check</div><h2>Before leaving for the airport</h2><p>Do one final review close to departure, especially if the booking was made well in advance.</p></div>
      <div class="final-item"><strong>Document condition</strong><span>Carry the original accepted travel document in usable condition.</span></div>
      <div class="final-item"><strong>Validity &amp; authorization</strong><span>Confirm passport validity and any required visa or electronic authorization.</span></div>
      <div class="final-item"><strong>Every country in the route</strong><span>Recheck destination and transit requirements, not only the final stop.</span></div>
    </div>
  </section>
</div>
</main>

<script>
(()=>{"use strict";
const SOURCE="SKANDI_PASSPORT_VISA_PAGE";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="V12-PASSPORT-VISA-2026.10.11";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let DATA={requirements:[],guidance:[],destinations:[]};
let destinationLimit=12;
let lastSearch=null;

function post(type,payload={}){
  window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
}
function text(v){return String(v??"").trim()}
function upper(v,max=80){return text(v).toUpperCase().slice(0,max)}
function setBusy(isBusy){
  const button=$("requirementsSearch");
  button.disabled=!!isBusy;
  button.textContent=isBusy?"Checking…":"Check requirements";
}
function setStatus(message,tone=""){
  const el=$("lookupStatus");
  el.className=`lookup-status${tone?` ${tone}`:""}`;
  el.textContent=message;
}
function destinationCode(value){
  const raw=text(value);
  if(!raw)return"";
  const exact=(DATA.destinations||[]).find(x=>text(x.title).toLowerCase()===raw.toLowerCase()||text(x.code).toLowerCase()===raw.toLowerCase());
  return upper(exact?.code||raw,12);
}
function renderDatalist(){
  const seen=new Set();
  const rows=(DATA.destinations||[]).filter(x=>{
    const value=text(x.title||x.code);
    const key=`${value.toLowerCase()}|${upper(x.code,20)}`;
    if(!value||seen.has(key))return false;
    seen.add(key);
    return true;
  }).slice(0,800);
  $("destinationOptions").innerHTML=rows.map(x=>`<option value="${esc(x.title||x.code||"")}">${x.code?esc(x.code):""}</option>`).join("");
}
function destinationHaystack(x){
  return `${x.title||""} ${x.code||""} ${x.type||""} ${x.passportSummary||""} ${x.visaSummary||""} ${x.importantInformation||""}`.toLowerCase();
}
function renderDestinations(){
  const q=text($("destinationFilter").value).toLowerCase();
  const all=(DATA.destinations||[]).filter(x=>!q||destinationHaystack(x).includes(q));
  const rows=all.slice(0,destinationLimit);
  $("destinationCount").textContent=all.length?`${Math.min(rows.length,all.length)} of ${all.length}`:"";
  $("destinationResults").innerHTML=rows.length?rows.map(x=>{
    const blocks=[];
    if(x.passportSummary)blocks.push(`<div class="destination-block"><span class="destination-label">Passport</span><p>${esc(x.passportSummary)}</p></div>`);
    if(x.visaSummary)blocks.push(`<div class="destination-block"><span class="destination-label">Visa / authorization</span><p>${esc(x.visaSummary)}</p></div>`);
    if(x.importantInformation)blocks.push(`<div class="destination-block"><span class="destination-label">Important</span><p>${esc(x.importantInformation)}</p></div>`);
    return `<article class="destination-card"><div class="destination-card-head"><h3>${esc(x.title||x.code||"Destination")}</h3><div class="destination-code">${esc(x.code||x.type||"")}</div></div>${blocks.join("")||`<div class="destination-block"><p>No additional document summary is currently published for this destination.</p></div>`}</article>`;
  }).join(""):`<div class="destination-empty">${q?"No published destination guidance matches this filter.":"No destination-specific passport or visa summaries are currently published in Inventory Control."}</div>`;
  const more=$("loadMoreDestinations");
  more.hidden=rows.length>=all.length||!all.length;
}
function resetSearch(){
  ["nationality","residenceCountry","origin","destination","departureDate","returnDate"].forEach(id=>{$(id).value=""});
  lastSearch=null;
  setBusy(false);
  setStatus("Enter your nationality and destination to begin.");
  $("lookupResult").innerHTML="";
  $("nationality").focus();
}
function validateDates(){
  const departure=$("departureDate").value;
  const returning=$("returnDate").value;
  if(departure&&returning&&returning<departure){
    setStatus("Return date cannot be earlier than departure date.","warning");
    return false;
  }
  return true;
}
function search(){
  const nationality=upper($("nationality").value,3);
  const destination=destinationCode($("destination").value);
  if(!nationality||!destination){
    setStatus("Nationality and destination are required.","warning");
    (!nationality?$("nationality"):$("destination")).focus();
    return;
  }
  if(!validateDates())return;
  lastSearch={
    language:"EN",
    nationality,
    residenceCountry:upper($("residenceCountry").value,3),
    origin:upper($("origin").value,12),
    destination,
    departureDate:$("departureDate").value||"",
    returnDate:$("returnDate").value||"",
    documentType:"PASSPORT"
  };
  setBusy(true);
  setStatus("Checking the connected SKANDI travel-requirements source…");
  $("lookupResult").innerHTML="";
  post("PASSPORT_VISA_SEARCH",lastSearch);
}
function renderLookup(result={}){
  setBusy(false);
  const connected=result.connected===true;
  const summary=text(result.summary)||"Travel requirements checked.";
  setStatus(summary,connected?"success":"warning");
  const fields=(Array.isArray(result.fields)?result.fields:[]).filter(x=>x&&(x.label||x.key||x.value));
  const guidance=Array.isArray(result.guidance)?result.guidance:[];
  const notices=Array.isArray(result.notices)?result.notices:[];
  const provider=text(result.provider)||"SKANDI guidance";
  const routeParts=[lastSearch?.nationality,lastSearch?.origin,lastSearch?.destination].filter(Boolean);
  const routeLabel=routeParts.length?routeParts.join(" · "):"Trip document check";
  let html=`<div class="result-summary"><div class="result-summary-row"><div><div class="result-meta">${connected?"Connected requirement result":"Guidance result"}</div><h3>${esc(routeLabel)}</h3><p>${esc(summary)}</p></div><div class="result-source">Source: ${esc(provider)}${result.status?`<br>${esc(result.status)}`:""}</div></div></div>`;
  const cards=[];
  fields.forEach(x=>cards.push(`<article class="result-card"><div class="result-meta">${esc(x.category||x.status||"Requirement")}</div><h4>${esc(x.label||x.key||"Requirement")}</h4><p>${esc(x.value||"")}</p></article>`));
  guidance.forEach(x=>cards.push(`<article class="result-card"><div class="result-meta">SKANDI guidance</div><h4>${esc(x.title||"Travel requirement")}</h4><p>${esc(x.body||"")}</p></article>`));
  if(notices.length)cards.push(`<article class="result-card"><div class="result-meta">Important</div><h4>Notices</h4><ul class="result-list">${notices.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></article>`);
  if(result.officialSourcesRequired)cards.push(`<article class="result-card authority-card"><div class="result-meta">Final authority</div><h4>Verify before travel</h4><p>Confirm the final requirements with official government, border-control and visa-authority sources. The operating carrier may also perform its own document validation before boarding.</p></article>`);
  html+=cards.length?`<div class="result-grid">${cards.join("")}</div>`:`<article class="result-card authority-card"><div class="result-meta">No detailed fields returned</div><h4>Official verification required</h4><p>No detailed requirement fields were returned for this search. Do not interpret that as confirmation that no visa, authorization or document condition applies.</p></article>`;
  $("lookupResult").innerHTML=html;
  $("lookupResult").focus({preventScroll:true});
}

$("requirementsSearch").addEventListener("click",search);
$("resetSearch").addEventListener("click",resetSearch);
["nationality","destination"].forEach(id=>$(id).addEventListener("keydown",event=>{if(event.key==="Enter")search()}));
$("backToTravelInfo").addEventListener("click",()=>post("PASSPORT_VISA_NAVIGATE",{path:"/travel-info"}));
$("officialHelp").addEventListener("click",()=>post("PASSPORT_VISA_NAVIGATE",{path:"/travel-info"}));
$("destinationFilter").addEventListener("input",()=>{destinationLimit=12;renderDestinations()});
$("loadMoreDestinations").addEventListener("click",()=>{destinationLimit+=12;renderDestinations()});

window.addEventListener("message",event=>{
  let message=event.data;
  if(typeof message==="string"){try{message=JSON.parse(message)}catch(_){return}}
  if(!message||message.source!==PARENT)return;
  if(message.type==="PASSPORT_VISA_HOST_READY"){
    post("PASSPORT_VISA_READY",{language:"EN",version:VERSION});
    return;
  }
  if(message.type==="PASSPORT_VISA_LOADING"){
    setStatus("Loading SKANDI destination guidance…");
    return;
  }
  if(message.type==="PASSPORT_VISA_DATA"){
    DATA=message.payload&&typeof message.payload==="object"?message.payload:DATA;
    renderDatalist();
    renderDestinations();
    setStatus("Enter your nationality and destination to begin.");
    return;
  }
  if(message.type==="PASSPORT_VISA_SEARCHING"){
    setBusy(true);
    setStatus("Checking the connected SKANDI travel-requirements source…");
    return;
  }
  if(message.type==="PASSPORT_VISA_SEARCH_RESULT"){
    renderLookup(message.payload||{});
    return;
  }
  if(message.type==="PASSPORT_VISA_SEARCH_ERROR"){
    setBusy(false);
    setStatus(message.payload?.message||"Travel requirements search is unavailable.","warning");
    return;
  }
  if(message.type==="PASSPORT_VISA_ERROR"){
    setBusy(false);
    setStatus(message.payload?.message||"Passport and visa guidance is unavailable.","warning");
  }
});

post("PASSPORT_VISA_READY",{language:"EN",version:VERSION});
})();
</script>
</body>
</html>

```
