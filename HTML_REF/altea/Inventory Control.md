# SKANDI Inventory Control

**STATUS:** NEEDS REVIEW  
**SLUG:** `/riaintra/success-factors/altea/inventory-control`  
**WIX PAGE:** Inventory Control.jsdik.js  
**AREA:** ALTEA  
**LIVE HTML:** YES  
**ELEMENT:** `inventoryControlEmbed`  
**LAST SYNCED:** 2026-09-18

### HOW TO USE

***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED" STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

## COMMENT SECTION
(START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION)

... END

---

## TECHNICAL INFO / LOG

> **Canonical reference path:** `/HTML_REF/altea/inventory-control.md`  
> **Generated locally:** 2026-09-18  
> **Verification level:** STATICALLY VERIFIED FROM UPLOADED SOURCE SET / REQUIRES LIVE TEST FOR RUNTIME DEPENDENCIES

### Source Identity

- **Source file identity:** `/HTML_REF/altea/inventory-control.md`
- **Primary uploaded source:** `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html`
- **Display / page name:** SKANDI Inventory Control
- **System area:** `ALTEA`
- **Wix page filename:** `Inventory Control.jsdik.js`
- **Wix route / slug:** `/riaintra/success-factors/altea/inventory-control`
- **Wix HTML element ID:** `inventoryControlEmbed`
- **Current status:** NEEDS REVIEW
- **Live HTML:** YES
- **Source-of-truth status:** GENERATED HTML_REF CANDIDATE. The executable payload is sourced from the selected uploaded file; live deployment parity still requires verification.
- **Last synced:** 2026-09-18

### Ownership and Dependency Chain

`/HTML_REF/altea/inventory-control.md`
→ live Wix HTML / `inventoryControlEmbed`
→ `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js`
→ `backend/SKANDI_CORE/inventory.web.js` + `backend/SKANDI_CORE/inventory.web`
→ `NOT VERIFIED FROM UPLOADED SOURCE SET`
→ Supabase / Duffel / Wix

### Linked Wix Page Controller

- `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js`

### Canonical Backend Facade(s)

- `backend/SKANDI_CORE/inventory.web.js`
- `backend/SKANDI_CORE/inventory.web`

### Canonical Backend Core Implementation(s)

- NOT VERIFIED FROM UPLOADED SOURCE SET

### Canonical Backend Import Presence Check

- `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js` → `backend/SKANDI_CORE/inventory.js`: **NOT PRESENT IN UPLOADED SOURCE SET**
- `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js` → `backend/SKANDI_CORE/assets.js`: **NOT PRESENT IN UPLOADED SOURCE SET**
- `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js` → `backend/SKANDI_CORE/inventory.web`: **PRESENT IN UPLOADED SOURCE SET**

### Relevant Supabase Resources

NOT VERIFIED FROM UPLOADED SOURCE SET

### External API / Provider Dependencies

- **Supabase:** detected in `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/README.md`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js`
- **Duffel:** detected in `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js`
- **Wix:** detected in `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/README.md`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js`

### Authentication / Authorization Boundary

- Role / permission checks detected in `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js`, `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js`

### Important Cross-Layer Message Contracts

| Contract | Emitters | Receivers | Static result |
|---|---|---|---|
| `DETAIL` | `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html` | None detected | Incomplete within uploaded source set |
| `INVENTORY_V9_READY` | `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html` | `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js` | Emitter + receiver detected |
| `INVENTORY_V9_REFRESH` | None detected | `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js` | Incomplete within uploaded source set |
| `SKANDI_MASTER_CONFIG_REQUEST` | `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html` | None detected | Incomplete within uploaded source set |

### Current Architectural Notes

- This document was generated from the uploaded source set only. Missing details are explicitly marked as not verified rather than inferred beyond available evidence.
- The complete executable/source payload below is preserved from the selected primary source after browser text decoding; it is not shortened or summarized.
- HTML_REF is a reference artifact and must not be imported by runtime application code.
- Canonical Wix backend ownership remains under `backend/SKANDI_CORE/...`; any detected legacy namespace is listed under Open Issues.
- Static analysis can identify references and contracts but cannot prove production deployment parity, authentication behavior, Supabase schema/RLS correctness, provider success, or secret configuration.

### Open Issues / Required Verification / Migration Items

- No canonical `backend/SKANDI_CORE/*.js` core implementation was verified from the uploaded source set.
- Message contract `DETAIL` has an emitter but no receiver detected in the uploaded source set.
- Message contract `INVENTORY_V9_REFRESH` has a receiver but no emitter detected in the uploaded source set.
- Message contract `SKANDI_MASTER_CONFIG_REQUEST` has an emitter but no receiver detected in the uploaded source set.
- Canonical backend import `backend/SKANDI_CORE/inventory.js` referenced by `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js` was not present in the uploaded source set.
- Canonical backend import `backend/SKANDI_CORE/assets.js` referenced by `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js` was not present in the uploaded source set.
- Supabase is referenced, but no table/view/RPC resource could be statically identified from the uploaded source set.
- Live Wix deployment parity, runtime authentication, provider behavior, secrets, database schema validity, RLS, and production data were not executed by this static browser tool.

### Uploaded Source Set

| Source file | Classified role | Size |
|---|---|---:|
| `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html` | HTML SOURCE | 154.8 KB |
| `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/README.md` | MARKDOWN | 2.75 KB |
| `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/SHA256SUMS.txt` | TEXT | 575 B |
| `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/backend/SKANDI_CORE/inventory.web.js` | BACKEND FACADE | 6.90 KB |
| `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/src/pages/Inventory Control.jsdik.js` | WIX PAGE CONTROLLER | 10.5 KB |

### Change Log

- 2026-09-18 — HTML_REF candidate generated from the uploaded source set. Architecture metadata and cross-layer contracts were statically derived; live Wix/runtime/database/provider verification was not performed by this browser-only tool.

---

## COMPLETE LIVE HTML / SOURCE IMPLEMENTATION

**Primary payload source:** `SKANDI_B01135_Inventory_Control_Convergence_2026-09-20/embed/Inventory Control.html`

The following payload is complete and is not intentionally shortened, summarized, reconstructed, or replaced with placeholders.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>SKANDI Inventory Control</title>
<style>
:root{
  --navy:#022e64;--navy2:#081d39;--cyan:#5fc7cf;--blue:#1777d2;--ink:#142234;
  --muted:#657489;--bg:#eef3f7;--card:#fff;--line:#d7e0e8;--line2:#e8eef3;
  --green:#147a4b;--amber:#9b6700;--red:#b42332;--purple:#6247aa;
  --shadow:0 14px 42px rgba(13,34,59,.10);--r:18px;--rs:12px;
  --font:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
*{box-sizing:border-box}html,body,#root{min-height:100%;margin:0}
body{font:13px var(--font);background:var(--bg);color:var(--ink)}
button,input,select,textarea{font:inherit}button{cursor:pointer}
.shell{min-height:100vh;display:grid;grid-template-columns:244px minmax(0,1fr)}
.sidebar{background:linear-gradient(180deg,var(--navy2),var(--navy));color:#fff;padding:18px 12px;position:sticky;top:0;height:100vh;overflow:auto}
.brand{padding:4px 8px 18px}.brand b{font-size:18px;letter-spacing:.08em}.brand small{display:block;color:#a9c8e5;margin-top:5px}
.group{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#84a7c8;padding:17px 9px 7px}
.navbtn{width:100%;border:0;background:transparent;color:#dceaf6;text-align:left;padding:10px 11px;border-radius:10px;margin:2px 0}
.navbtn:hover{background:rgba(255,255,255,.08)}.navbtn.active{background:#fff;color:var(--navy);font-weight:800}
.main{min-width:0;padding:18px 20px 34px}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.eyebrow{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);font-weight:800}
h1{margin:3px 0 5px;font-size:28px;line-height:1.12;color:var(--navy2)}
.sub{color:var(--muted);max-width:820px;line-height:1.5}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.btn{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:10px;padding:8px 12px;font-weight:750;min-height:36px}
.btn:hover{border-color:#a8bacb}.btn.primary{background:var(--navy);border-color:var(--navy);color:#fff}.btn.cyan{background:var(--cyan);border-color:var(--cyan);color:#062a39}.btn.danger{color:var(--red);border-color:#efc4c9;background:#fff8f9}.btn.small{padding:5px 9px;min-height:30px;font-size:12px}
.grid{display:grid;gap:12px}.stats{grid-template-columns:repeat(5,minmax(0,1fr));margin-bottom:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow)}
.stat{padding:15px}.stat span{display:block;color:var(--muted);font-size:11px}.stat strong{font-size:24px;color:var(--navy);display:block;margin-top:4px}.stat em{font-style:normal;font-size:10px;color:var(--muted)}
.panel{padding:14px}.paneltitle{font-size:14px;font-weight:800;color:var(--navy2);display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:11px}
.input,.select,.textarea{width:100%;border:1px solid #bac8d4;background:#fff;border-radius:9px;padding:8px 10px;color:var(--ink);outline:none}
.input:focus,.select:focus,.textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(23,119,210,.11)}
.textarea{min-height:92px;resize:vertical}.field{display:grid;gap:5px;min-width:0}.field label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#526277}
.field small{color:var(--muted);line-height:1.35}.w180{width:180px}.w240{width:240px}.grow{flex:1;min-width:220px}
.tablewrap{overflow:auto;border:1px solid var(--line2);border-radius:12px}.table{width:100%;border-collapse:collapse;font-size:12px}
.table th{position:sticky;top:0;background:#f2f6f9;color:#42556a;text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);font-size:10px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
.table td{padding:9px 10px;border-bottom:1px solid var(--line2);white-space:nowrap;max-width:290px;overflow:hidden;text-overflow:ellipsis}
.table tr:last-child td{border-bottom:0}.table tbody tr:hover{background:#f7fbfe}.clickrow{cursor:pointer}
.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800;background:#eef2f5;color:#526274}
.pill.PUBLISHED,.pill.OPEN{background:#e7f5ed;color:var(--green)}.pill.REVIEW,.pill.DRAFT{background:#fff3dd;color:var(--amber)}.pill.ARCHIVED,.pill.SUSPENDED,.pill.BLACKOUT,.pill.STOP_SALE,.pill.SOLD_OUT{background:#fdebed;color:var(--red)}
.split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:13px}
.notice{padding:12px 14px;border-radius:12px;border:1px solid #bcdcea;background:#f0f9fc;color:#31566d;line-height:1.45}
.notice.warn{background:#fff8e8;border-color:#ead39b;color:#71541c}.notice.bad{background:#fff2f3;border-color:#ebbdc2;color:#842433}
.empty{padding:38px 18px;text-align:center;color:var(--muted)}
.modalback{position:fixed;inset:0;background:rgba(3,18,37,.63);z-index:100;display:grid;place-items:start center;padding:10px 18px 18px;overflow:auto}
.modal{background:#fff;border-radius:18px;width:min(1160px,100%);max-height:calc(100vh - 20px);overflow:hidden;display:grid;grid-template-rows:auto minmax(0,1fr);box-shadow:0 35px 100px rgba(0,0,0,.35)}
.modal.wide{width:min(1450px,100%)}.modalhead{padding:13px 16px;background:var(--navy2);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:12px}.modalhead h2{font-size:16px;margin:0}.modalbody{overflow:auto;padding:16px}
.tabs{display:flex;gap:5px;overflow:auto;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:14px}.tab{white-space:nowrap;border:0;border-radius:9px;padding:8px 10px;background:#edf3f7;color:#4d5f72;font-weight:750}.tab.active{background:var(--navy);color:#fff}
.formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.formgrid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.full{grid-column:1/-1}
.sectiontitle{font-size:14px;font-weight:850;color:var(--navy);margin:4px 0 12px}.hr{height:1px;background:var(--line2);margin:14px 0}
.langtabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px}.lang{border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 9px;font-weight:800}.lang.active{background:var(--cyan);border-color:var(--cyan)}
.mediaitem,.relitem,.childitem{border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px;background:#fbfdff}
.preview{width:100%;aspect-ratio:16/8;background:#edf2f6;border-radius:12px;overflow:hidden;display:grid;place-items:center;color:var(--muted)}
.preview img{width:100%;height:100%;object-fit:cover;display:block}
.aircraftlayout{display:grid;grid-template-columns:330px minmax(0,1fr);gap:12px}.airlist{max-height:720px;overflow:auto}.airrow{padding:10px;border:1px solid var(--line);border-radius:11px;margin:6px 0;background:#fff;cursor:pointer}.airrow.active{border-color:var(--blue);box-shadow:0 0 0 2px rgba(23,119,210,.1)}.airrow b{display:block}.airrow small{color:var(--muted)}
.cabinmap{display:flex;align-items:stretch;border:1px solid #91a8bd;border-radius:70px 18px 18px 70px;overflow:hidden;min-height:92px;background:#e9f2f8;padding:6px}
.cabinzone{min-width:54px;display:grid;place-items:center;text-align:center;border-right:1px solid rgba(2,46,100,.14);padding:7px;background:rgba(255,255,255,.82)}.cabinzone:first-child{border-radius:60px 0 0 60px}.cabinzone:last-child{border-right:0;border-radius:0 11px 11px 0}.cabinzone b{color:var(--navy);font-size:12px}.cabinzone small{color:var(--muted);font-size:10px}
.studioimg{position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#dce6ee}.studioimg img{width:100%;height:100%;object-fit:cover}
.hotspot{position:absolute;width:26px;height:26px;border-radius:50%;border:3px solid #fff;background:var(--cyan);box-shadow:0 4px 16px rgba(0,0,0,.35);transform:translate(-50%,-50%);display:grid;place-items:center;font-size:9px;font-weight:900;color:var(--navy);cursor:grab}
.hotspot.dragging{cursor:grabbing;transform:translate(-50%,-50%) scale(1.12)}.hotlabel{position:absolute;transform:translate(-50%,11px);background:rgba(3,24,49,.92);color:#fff;padding:3px 6px;border-radius:6px;font-size:9px;white-space:nowrap;pointer-events:none}
.kpirow{display:flex;gap:7px;flex-wrap:wrap}.kpi{border:1px solid var(--line);background:#fff;border-radius:10px;padding:7px 9px}.kpi b{color:var(--navy)}
.toast{position:fixed;right:18px;bottom:18px;background:#122b46;color:#fff;border-left:4px solid var(--cyan);padding:11px 14px;border-radius:10px;box-shadow:var(--shadow);z-index:300;max-width:min(480px,calc(100vw - 36px))}.toast.error{border-left-color:#f05b69}


.smartgroup{grid-column:1/-1;border:1px solid var(--line2);border-radius:12px;background:#f8fbfd;padding:11px}
.smartgroup>.smarttitle{font-size:11px;font-weight:850;color:var(--navy);margin-bottom:9px;text-transform:uppercase;letter-spacing:.04em}
.smartlist{display:grid;gap:8px}.smartrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end}
.smartobject{border:1px solid var(--line);border-radius:11px;background:#fff;padding:10px;margin-top:7px}
.smartempty{grid-column:1/-1;color:var(--muted);font-size:12px;padding:8px 0}
.positionbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px}
.positionreadout{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 10px;background:#fff;color:var(--navy);font-weight:800}
.placementon{background:#e8fbfc;border-color:var(--cyan);color:#0b5961}
.studioimg.place{cursor:crosshair;box-shadow:0 0 0 3px rgba(95,199,207,.3)}


.assetgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.assetcard{border:1px solid var(--line);border-radius:13px;background:#fff;overflow:hidden;display:grid;grid-template-rows:128px 1fr}
.assetthumb{background:#edf3f7;display:grid;place-items:center;overflow:hidden}.assetthumb img{width:100%;height:100%;object-fit:cover}
.assettype{font-size:25px;color:var(--navy);font-weight:900}.assetbody{padding:9px;display:grid;gap:5px;min-width:0}
.assetname{font-weight:850;color:var(--navy2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.assetpath{font-size:10px;color:var(--muted);line-height:1.35;min-height:28px}
.assetbadges,.assetactions{display:flex;gap:4px;flex-wrap:wrap}.badge{display:inline-flex;padding:3px 6px;border-radius:999px;background:#edf3f7;color:#53677a;font-size:9px;font-weight:850}
.badge.dup{background:#fff0dd;color:#875800}.badge.private{background:#f1eafd;color:#5c4193}.badge.public{background:#e6f6ee;color:#12724a}
.assetcurrent{border:1px solid var(--line);border-radius:12px;background:#f8fbfd;padding:9px;display:grid;gap:8px}.assetcurrent .preview{aspect-ratio:16/7}
.uploadzone{border:2px dashed #b8c9d8;border-radius:14px;background:#f8fbfd;padding:14px;display:grid;gap:10px}.uploadzone strong{color:var(--navy)}
.assetfilters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}.assetsection{border-top:1px solid var(--line2);padding-top:13px;margin-top:13px}
.dupbox{border:1px solid #e4bd7d;background:#fff8e9;border-radius:12px;padding:11px;margin:10px 0}.assetlibraryhero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
.assetfolder{font-weight:850;color:var(--navy);font-size:12px}.fileinput{display:block;width:100%;border:1px solid var(--line);border-radius:10px;background:#fff;padding:9px}


/* R-003.9 Duffel / SKANDI Collection workspace */
.providerhero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;border:1px solid #c9dce8;background:linear-gradient(135deg,#f7fbfd,#eef7fa);border-radius:14px;margin-bottom:14px}
.providerhero h2{margin:0 0 5px;color:var(--navy2);font-size:19px}.providerhero p{margin:0;color:var(--muted);font-size:12px;line-height:1.55}
.sourcebadge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 10px;background:#fff;border:1px solid #bfd4df;color:var(--navy);font-size:11px;font-weight:900}.sourcebadge:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 3px rgba(95,199,207,.18)}
.providergrid{display:grid;grid-template-columns:minmax(250px,.8fr) minmax(0,1.2fr);gap:14px}.providerresult{display:flex;gap:11px;align-items:center}.providerlogo{width:42px;height:42px;border:1px solid var(--line);border-radius:10px;background:#fff;display:grid;place-items:center;overflow:hidden;flex:0 0 auto}.providerlogo img{width:100%;height:100%;object-fit:contain;padding:5px}.providerlogo b{font-size:11px;color:var(--navy)}
.matchtag{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.matchtag.duffel{background:#edf7f8;color:#0c6771}.matchtag.collection{background:#e7f3ff;color:#075ca9}.matchtag.match{background:#fff5d9;color:#8a6300}.matchtag.block{background:#ffe8eb;color:#9b2838}
.detailgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px}.detailcell{border:1px solid var(--line2);border-radius:10px;padding:10px;background:#fbfdfe;min-width:0}.detailcell small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.05em;font-weight:800;margin-bottom:4px}.detailcell div{font-size:12px;word-break:break-word}.detailcell a{color:var(--blue);text-decoration:none}.detailcell a:hover{text-decoration:underline}
.scopebox{border:1px solid var(--line);border-radius:12px;padding:12px;background:#f9fbfc}.provideractions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.inlinehelp{font-size:10px;color:var(--muted);line-height:1.45}.selectedlist{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.selectedchip{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:10px}.selectedchip button{border:0;background:transparent;color:var(--red);cursor:pointer;font-weight:900}
@media(max-width:900px){.providergrid{grid-template-columns:1fr}.providerhero{grid-template-columns:1fr}.provideractions{justify-content:flex-start}}


@media(max-width:760px){.assetfilters{grid-template-columns:1fr}.assetgrid{grid-template-columns:repeat(2,minmax(0,1fr))}.assetcard{grid-template-rows:110px 1fr}}
.loading{position:fixed;inset:0;background:rgba(238,243,247,.72);backdrop-filter:blur(3px);z-index:250;display:grid;place-items:center}.loaderbox{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 22px;box-shadow:var(--shadow);font-weight:800;color:var(--navy)}
@media(max-width:1100px){.stats{grid-template-columns:repeat(3,1fr)}.split{grid-template-columns:1fr}.aircraftlayout{grid-template-columns:1fr}.airlist{max-height:260px}}


/* R-003.9 Duffel / SKANDI Collection workspace */
.providerhero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;border:1px solid #c9dce8;background:linear-gradient(135deg,#f7fbfd,#eef7fa);border-radius:14px;margin-bottom:14px}
.providerhero h2{margin:0 0 5px;color:var(--navy2);font-size:19px}.providerhero p{margin:0;color:var(--muted);font-size:12px;line-height:1.55}
.sourcebadge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 10px;background:#fff;border:1px solid #bfd4df;color:var(--navy);font-size:11px;font-weight:900}.sourcebadge:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 3px rgba(95,199,207,.18)}
.providergrid{display:grid;grid-template-columns:minmax(250px,.8fr) minmax(0,1.2fr);gap:14px}.providerresult{display:flex;gap:11px;align-items:center}.providerlogo{width:42px;height:42px;border:1px solid var(--line);border-radius:10px;background:#fff;display:grid;place-items:center;overflow:hidden;flex:0 0 auto}.providerlogo img{width:100%;height:100%;object-fit:contain;padding:5px}.providerlogo b{font-size:11px;color:var(--navy)}
.matchtag{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.matchtag.duffel{background:#edf7f8;color:#0c6771}.matchtag.collection{background:#e7f3ff;color:#075ca9}.matchtag.match{background:#fff5d9;color:#8a6300}.matchtag.block{background:#ffe8eb;color:#9b2838}
.detailgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px}.detailcell{border:1px solid var(--line2);border-radius:10px;padding:10px;background:#fbfdfe;min-width:0}.detailcell small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.05em;font-weight:800;margin-bottom:4px}.detailcell div{font-size:12px;word-break:break-word}.detailcell a{color:var(--blue);text-decoration:none}.detailcell a:hover{text-decoration:underline}
.scopebox{border:1px solid var(--line);border-radius:12px;padding:12px;background:#f9fbfc}.provideractions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.inlinehelp{font-size:10px;color:var(--muted);line-height:1.45}.selectedlist{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.selectedchip{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:10px}.selectedchip button{border:0;background:transparent;color:var(--red);cursor:pointer;font-weight:900}
@media(max-width:900px){.providergrid{grid-template-columns:1fr}.providerhero{grid-template-columns:1fr}.provideractions{justify-content:flex-start}}


@media(max-width:760px){.shell{grid-template-columns:1fr;grid-template-rows:auto 1fr}.sidebar{position:relative;height:60px;display:flex;gap:5px;overflow:auto;padding:8px}.brand,.group{display:none}.navbtn{width:auto;white-space:nowrap}.main{padding:12px}.top{display:block}.toolbar{justify-content:flex-start;margin-top:10px}.stats{grid-template-columns:repeat(2,1fr)}.formgrid,.formgrid.three{grid-template-columns:1fr}.full{grid-column:auto}.modalback{padding:0;place-items:start center}.modal{max-height:100vh;height:100vh;border-radius:0}.cabinmap{border-radius:16px;overflow:auto}.cabinzone:first-child,.cabinzone:last-child{border-radius:8px}}
</style>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19.3.0",
    "react-dom/client": "https://esm.sh/react-dom@19.3.0/client?external=react",
    "htm": "https://esm.sh/htm@3.1.1"
  }
}
</script>
</head>
<body>
<div id="root"></div>
<script type="module">
import React,{useEffect,useMemo,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import htm from "htm";
const html=htm.bind(React.createElement);


const SOURCE="SKANDI_INVENTORY_EMBED";
const PARENT="SKANDI_INVENTORY_PARENT";
const MASTER_PARENT="SKANDI_WIX_PARENT";
const VERSION="B-011.35-INVENTORY-SINGLE-DISPATCH";
const TYPES=["COUNTRY","DESTINATION","AREA","AIRPORT","AIRLINE","SUPPLIER","HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"];
const SELLABLE=new Set(["HOTEL","GUIDED_TOUR","ACTIVITY","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"]);
const LABEL={COUNTRY:"Countries",DESTINATION:"Destinations",AREA:"Areas / Resorts",AIRPORT:"Airports",AIRLINE:"Airlines",SUPPLIER:"Suppliers",HOTEL:"Hotels",GUIDED_TOUR:"Guided Tours",ACTIVITY:"Activities",PARTNER_TICKET:"Partner Tickets",TRANSFER:"Transfers",CAR_RENTAL:"Car Rental",PACKAGE:"Packages",ANCILLARY:"Ancillaries"};
const MASTER_FILTERS=["COUNTRY","DESTINATION","AREA","AIRPORT","AIRLINE","SUPPLIER","HOTEL","TOURS_ACTIVITIES","PARTNER_TICKET","TRANSFER","CAR_RENTAL","PACKAGE","ANCILLARY"];
const MASTER_FILTER_LABEL={...LABEL,TOURS_ACTIVITIES:"Tours & Activities"};
const STATUS=["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED"];
const requests=new Map();
const REQUEST_TIMEOUT_MS=30000;


function request(type,payload={}){
  const requestId=`INV-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{requests.delete(requestId);reject(new Error("The system did not respond. Check the published system bridge."))},REQUEST_TIMEOUT_MS);
    requests.set(requestId,{resolve,reject,timer,type});
    window.parent.postMessage({source:SOURCE,type,payload,requestId,timestamp:new Date().toISOString()},"*");
  });
}
function sendReady(){
  window.parent.postMessage({source:SOURCE,type:"INVENTORY_V9_READY",payload:{version:VERSION},requestId:`READY-${Date.now()}`},"*");
}
const clone=v=>JSON.parse(JSON.stringify(v??null));
const text=v=>String(v??"");
const numOrNull=v=>v===""||v===null||v===undefined?null:(Number.isFinite(Number(v))?Number(v):null);
const bool=v=>v===true||v==="true"||v==="YES";
function setPath(obj,path,value){
  const keys=path.split(".");let cur=obj;
  keys.forEach((k,i)=>{if(i===keys.length-1)cur[k]=value;else{if(!cur[k]||typeof cur[k]!=="object"||Array.isArray(cur[k]))cur[k]={};cur=cur[k]}});
}
function getPath(obj,path){return path.split(".").reduce((a,k)=>a?.[k],obj)}
function blankRecord(type){
  return{id:"",publicId:"",entityType:type,code:"",name:"",slug:"",status:"DRAFT",active:true,customerVisible:false,staffVisible:true,alteaVisible:true,featured:false,homepageFeatured:false,sortPriority:100,parentEntityId:"",supplierEntityId:"",source:"SKANDI",sourceReference:"",details:{},commercial:{currency:"USD"},operations:{},seo:{},publication:{},payload:{}};
}
function recordBundle(type){return{record:blankRecord(type),localizedContent:[],media:[],relations:[],catalog:null}}
function statusPill(s){return html`<span className=${`pill ${text(s).toUpperCase()}`}>${s||"—"}</span>`}
function normalizeLocalized(row={}){
  return{...row,language:text(row.language||"EN").toUpperCase(),title:row.title||"",eyebrow:row.eyebrow||"",shortDescription:row.shortDescription??row.short_description??"",fullDescription:row.fullDescription??row.full_description??"",highlights:Array.isArray(row.highlights)?row.highlights:[],included:Array.isArray(row.included)?row.included:[],notIncluded:Array.isArray(row.notIncluded??row.not_included)?(row.notIncluded??row.not_included):[],importantInformation:row.importantInformation??row.important_information??"",seoTitle:row.seoTitle??row.seo_title??"",seoDescription:row.seoDescription??row.seo_description??"",content:row.content||{}}
}
function normalizeMedia(row={}){
  const payload=row.payload&&typeof row.payload==="object"&&!Array.isArray(row.payload)?row.payload:{};
  return{...row,id:row.id||"",mediaType:row.mediaType??row.media_type??"IMAGE",role:row.role||"GALLERY",url:row.url||"",altText:row.altText??row.alt_text??"",caption:row.caption||"",credit:row.credit||"",language:row.language||"",sortOrder:row.sortOrder??row.sort_order??100,active:row.active!==false,focalX:row.focalX??row.focal_x??null,focalY:row.focalY??row.focal_y??null,sourceKind:row.sourceKind??row.source_kind??"URL",storageBucket:row.storageBucket??row.storage_bucket??"",storagePath:row.storagePath??row.storage_path??"",payload,assetId:payload.assetId||row.assetId||""}
}
function normalizeRelation(row={}){
  return{...row,id:row.id||"",relationType:row.relationType??row.relation_type??"RELATED",targetEntityId:row.targetEntityId??row.target_entity_id??"",targetRecordType:row.targetRecordType??row.target_record_type??"",targetRecordId:row.targetRecordId??row.target_record_id??"",sequenceNo:row.sequenceNo??row.sequence_no??100,active:row.active!==false}
}


function Field({label,value,onChange,type="text",options=[],help,disabled=false,full=false}){
  return html`<div className=${`field ${full?"full":""}`}><label>${label}</label>
    ${type==="textarea"
      ?html`<textarea className="textarea" value=${value??""} disabled=${disabled} onInput=${e=>onChange(e.target.value)} />`
      :type==="select"
        ?html`<select className="select" value=${value??""} disabled=${disabled} onChange=${e=>onChange(e.target.value)}>
            ${options.map(o=>html`<option value=${typeof o==="string"?o:o.value}>${typeof o==="string"?o:o.label}</option>`)}
          </select>`
        :html`<input className="input" type=${type} value=${value??""} disabled=${disabled} onInput=${e=>onChange(type==="number"?numOrNull(e.target.value):e.target.value)} />`}
    ${help?html`<small>${help}</small>`:null}
  </div>`
}
function Toggle({label,value,onChange}){
  return html`<div className="field"><label>${label}</label><select className="select" value=${value?"YES":"NO"} onChange=${e=>onChange(e.target.value==="YES")}><option>YES</option><option>NO</option></select></div>`
}


const SMART_ENUMS={
  currency:["USD","SEK","NOK","DKK","EUR","GBP","THB"],
  pricebasis:["PER_PERSON","PER_BOOKING","PER_NIGHT","PER_ROOM","PER_VEHICLE","PER_TICKET","PER_ITEM"],
  transfertype:["SHARED","PRIVATE","COACH","SHUTTLE","TAXI","RAIL","FERRY"],
  vehicletype:["SEDAN","SUV","VAN","MINIBUS","COACH","LIMOUSINE"],
  vehicleclass:["ECONOMY","COMPACT","MIDSIZE","FULLSIZE","PREMIUM","SUV","VAN"],
  tickettype:["STANDARD","TIMED_ENTRY","OPEN_DATED","EVENT","ATTRACTION","TRANSPORT"],
  deliverymethod:["DIGITAL","EMAIL","MOBILE","VOUCHER","BOX_OFFICE","HOTEL_DELIVERY"],
  suppliertype:["HOTEL","DMC","TRANSPORT","AIRLINE","TOUR_OPERATOR","ATTRACTION","TICKETING","CAR_RENTAL","OTHER"],
  packagetype:["CHARTER","DYNAMIC_PACKAGE","CITY_BREAK","SUN_PACKAGE","ESCORTED","CRUISE","OTHER"],
  ancillarytype:["BAGGAGE","SEAT","MEAL","LOUNGE","FAST_TRACK","TRANSFER","INSURANCE","OTHER"],
  unit:["PER_PERSON","PER_BOOKING","PER_ROOM","PER_NIGHT","PER_VEHICLE","PER_ITEM"],
  cabin:["FIRST","BUSINESS","PREMIUM_ECONOMY","ECONOMY"],
  cabinclass:["FIRST","BUSINESS","PREMIUM_ECONOMY","ECONOMY"],
  status:["DRAFT","REVIEW","PUBLISHED","HIDDEN","SUSPENDED","ARCHIVED","OPEN","CLOSED","ACTIVE","INACTIVE"],
  reviewstatus:["NOT_REVIEWED","IN_REVIEW","APPROVED","CHANGES_REQUIRED"],
  source:["SKANDI","SUPPLIER","DUFFEL","MANUAL","INVENTORY_CONTROL"]
};
// R-003.6 explicit editor contract. Known fields never infer their control type
// from the current value. The fallback editor below is only for unknown stored
// compatibility keys, so schema additions cannot make existing data disappear.
const ENUM={
  currency:["USD","SEK","NOK","DKK","EUR","GBP","THB"],
  priceBasis:["PER_PERSON","PER_BOOKING","PER_NIGHT","PER_ROOM","PER_VEHICLE","PER_TICKET","PER_ITEM"],
  propertyType:["RESORT","CITY","BOUTIQUE","APARTMENT","VILLA","OTHER"],
  smokingPolicy:["NON_SMOKING","DESIGNATED_AREAS","SMOKING_ALLOWED","UNKNOWN"],
  tourType:["SKANDI_GUIDED","PARTNER_GUIDED","PRIVATE","GROUP","WALKING","COACH","BOAT","COMBINATION"],
  difficulty:["EASY","MODERATE","CHALLENGING","DIFFICULT"],
  activityType:["EXPERIENCE","EXCURSION","WATER_SPORT","ADVENTURE","CULTURE","FOOD","WELLNESS","FAMILY","NIGHTLIFE","OTHER"],
  ticketType:["STANDARD","TIMED_ENTRY","OPEN_DATED","EVENT","ATTRACTION","TRANSPORT","MULTI_DAY","SEASON_PASS"],
  validityType:["DATE_TIME","DATE","OPEN_DATED","MULTI_DAY","SEASON_PASS"],
  deliveryMethod:["DIGITAL","EMAIL","MOBILE","VOUCHER","BOX_OFFICE","HOTEL_DELIVERY"],
  supplierType:["HOTEL","TOUR","TRANSFER","CAR_RENTAL","AIRLINE","TICKET","DMC","INSURANCE","OTHER"],
  contractStatus:["DRAFT","NEGOTIATION","ACTIVE","EXPIRING","EXPIRED","SUSPENDED","TERMINATED"],
  transferType:["SHARED_COACH","SHARED_MINIBUS","PRIVATE_CAR","PRIVATE_SUV","PRIVATE_VAN","LUXURY","WHEELCHAIR_ACCESSIBLE"],
  direction:["ARRIVAL","DEPARTURE","ROUNDTRIP"],
  transportMode:["COACH","MINIBUS","CAR","SUV","VAN","FERRY","BOAT","OTHER"],
  pickupType:["NONE","HOTEL","CENTRAL_POINT","CUSTOM"],
  pickupTimeBasis:["FIXED","FLIGHT_BASED","HOTEL_BASED","MANUAL"],
  returnPickupMethod:["FIXED","NOTIFIED","APP","SMS","HOTEL_RECEPTION","GUIDE"],
  vehicleCategory:["MINI","ECONOMY","COMPACT","MIDSIZE","FULLSIZE","SUV","PREMIUM","LUXURY","VAN","ELECTRIC","OTHER"],
  vehicleClass:["ECONOMY","COMPACT","MIDSIZE","FULLSIZE","PREMIUM","SUV","VAN","LUXURY","OTHER"],
  transmission:["AUTOMATIC","MANUAL"],
  fuel:["PETROL","DIESEL","HYBRID","ELECTRIC","OTHER"],
  mileagePolicy:["UNLIMITED","LIMITED","SUPPLIER_TERMS","OTHER"],
  fuelPolicy:["FULL_TO_FULL","SAME_TO_SAME","PREPURCHASE","SUPPLIER_TERMS","OTHER"],
  packageType:["CHARTER","DYNAMIC_PACKAGE","CITY_BREAK","SUN_PACKAGE","ESCORTED","CRUISE","OTHER"],
  ancillaryType:["BAGGAGE","SEAT","MEAL","INSURANCE","PRIORITY","LOUNGE","HOTEL_UPGRADE","TRANSFER_UPGRADE","CELEBRATION","AIRPORT_SERVICE","OTHER"]
};
const SF=(label,path,type="text",options=[],help="",refTypes=[])=>({label,path,type,options,help,refTypes});
const SL=(label,path,help="")=>({label,path,type:"list",help});
const SR=(label,path,fields,help="")=>({label,path,type:"repeat",fields,help});
const ENTITY_SCHEMAS={
  COUNTRY:{details:[
    SF("ISO Country Code","details.countryCode"),SF("Region / Sub-region","details.region"),SF("Timezone","details.timezone"),SF("Currency","details.currency","select",ENUM.currency),
    SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Best Time to Visit","details.bestTimeToVisit","textarea"),SF("High Season","details.highSeason"),SF("Low Season","details.lowSeason"),
    SL("Tags","details.tags"),SL("Good For","details.goodFor"),SL("Signature Reasons","details.signatureReasons"),SF("Climate","details.climate","textarea")
  ]},
  DESTINATION:{details:[
    SF("Region / Sub-region","details.region"),SF("Nearest Airport","details.nearestAirportId","reference",[],"",["AIRPORT"]),SF("Secondary Airport","details.secondaryAirportId","reference",[],"",["AIRPORT"]),
    SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Timezone","details.timezone"),SF("Currency","details.currency","select",ENUM.currency),
    SF("Best Time to Visit","details.bestTimeToVisit","textarea"),SF("High Season","details.highSeason"),SF("Low Season","details.lowSeason"),SL("Tags","details.tags"),SL("Good For","details.goodFor"),SL("Signature Reasons","details.signatureReasons"),SF("Climate","details.climate","textarea")
  ]},
  AREA:{details:[
    SF("Region / Sub-region","details.region"),SF("Nearest Airport","details.nearestAirportId","reference",[],"",["AIRPORT"]),SF("Secondary Airport","details.secondaryAirportId","reference",[],"",["AIRPORT"]),
    SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Timezone","details.timezone"),SF("Currency","details.currency","select",ENUM.currency),SF("Best Time to Visit","details.bestTimeToVisit","textarea"),SL("Tags","details.tags"),SL("Good For","details.goodFor")
  ]},
  SUPPLIER:{details:[
    SF("Supplier Type","details.supplierType","select",ENUM.supplierType),SF("Legal Name","details.legalName"),SF("Country","details.country"),SF("Contact Name","details.contactName"),SF("Contact Email","details.contactEmail","email"),SF("Phone","details.phone"),SF("Website","details.website","url"),
    SF("API Provider","details.apiProvider","boolean"),SF("Account Reference","details.accountReference"),SF("Contract Status","details.contractStatus","select",ENUM.contractStatus),SF("Payment Terms","details.paymentTerms","textarea"),SF("Commission Model","details.commissionModel")
  ]},
  HOTEL:{details:[
    SF("Brand","details.brand"),SF("Property Type","details.propertyType","select",ENUM.propertyType),SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Nearest Airport","details.nearestAirportId","reference",[],"",["AIRPORT"]),
    SF("Provider Accommodation ID","details.providerAccommodationId"),SF("Address","details.address"),SF("City","details.city"),SF("Postal Code","details.postalCode"),SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),
    SF("Official Star Rating","details.officialStarRating","number"),SF("SKANDI Rating","details.skandiRating","number"),SF("Guest Rating","details.guestRating","number"),SF("Review Count","details.reviewCount","number"),
    SF("Check-in Time","details.checkinTime","time"),SF("Check-out Time","details.checkoutTime","time"),SF("Minimum Check-in Age","details.minimumCheckinAge","number"),SF("Pets Allowed","details.petsAllowed","boolean"),SF("Smoking Policy","details.smokingPolicy","select",ENUM.smokingPolicy),
    SF("Distance to Beach km","details.distanceToBeach","number"),SF("Distance to Center km","details.distanceToCenter","number"),SF("Distance to Airport km","details.distanceToAirport","number"),SF("Transfer Time Minutes","details.transferTimeMinutes","number"),
    SL("Board Options","details.boardOptions"),SL("Facilities","details.facilities"),
    SR("Room Types","details.rooms",[SF("Code","code"),SF("Name","name"),SF("Room Type","roomType"),SF("Max Guests","maxGuests","number"),SF("Bed Type","bedType"),SF("Size m²","sizeSqm","number"),SF("Description","description","textarea")]),
    SR("Hotel Facts","details.facts",[SF("Label","label"),SF("Value","value")])
  ],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Operational Notes","operations.notes","textarea")]},
  GUIDED_TOUR:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Category","details.category"),SF("Tour Type","details.tourType","select",ENUM.tourType),SF("Duration Minutes","details.durationMinutes","number"),SF("Difficulty","details.difficulty","select",ENUM.difficulty),
    SF("Minimum Age","details.minimumAge","number"),SF("Child Policy","details.childPolicy","textarea"),SF("Accessibility","details.accessibility","textarea"),SL("Languages","details.languages")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Adult Price","commercial.adultPrice","number"),SF("Child Price","commercial.childPrice","number"),SF("Infant Price","commercial.infantPrice","number"),SF("Private Price","commercial.privatePrice","number")],operations:[
    SF("Guide Required","operations.guideRequired","boolean"),SF("Languages Required","operations.languagesRequired"),SF("Guide Briefing","operations.guideBriefing","textarea"),
    SR("Itinerary","operations.itinerary",[SF("Sequence","sequence","number"),SF("Stop Name","stopName"),SF("Duration Minutes","durationMinutes","number"),SF("Latitude","latitude","number"),SF("Longitude","longitude","number"),SF("Description","description","textarea")]),
    SR("Pickup Points","operations.pickups",[SF("Name","name"),SF("Hotel","hotelId","reference",[],"",["HOTEL"]),SF("Time Offset Minutes","timeOffsetMinutes","number"),SF("Instructions","instructions","textarea")]),
    SF("Booking Available","operations.bookingAvailable","boolean"),SF("Request Only","operations.requestOnly","boolean"),SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Minimum Units / Guests","operations.minimum","number"),SF("Maximum Units / Guests","operations.maximum","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Amendment Policy","operations.amendmentPolicy","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")
  ]},
  ACTIVITY:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Category","details.category"),SF("Subcategory","details.subcategory"),SF("Activity Type","details.activityType","select",ENUM.activityType),SF("Duration Minutes","details.durationMinutes","number"),
    SF("Start Location","details.startLocation"),SF("Meeting Point","details.meetingPoint","textarea"),SF("Pickup Available","details.pickupAvailable","boolean"),SF("Hotel Pickup Available","details.hotelPickupAvailable","boolean"),SF("Guide Type","details.guideType"),SF("Minimum Age","details.minimumAge","number"),SF("Maximum Age","details.maximumAge","number"),SF("Child Policy","details.childPolicy","textarea"),SF("Accessibility","details.accessibility","textarea"),SL("Languages","details.languages")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Adult Price","commercial.adultPrice","number"),SF("Child Price","commercial.childPrice","number")],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Policy","operations.cancellationPolicy","textarea"),SF("Operational Notes","operations.notes","textarea")]},
  PARTNER_TICKET:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Vendor Ticket ID","details.vendorTicketId"),SF("Category","details.category"),SF("Ticket Type","details.ticketType","select",ENUM.ticketType),SF("Validity Type","details.validityType","select",ENUM.validityType),SF("Duration","details.duration"),SF("Venue / Meeting Location","details.meetingLocation"),SF("Restrictions","details.restrictions","textarea")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Adult Price","commercial.adultPrice","number"),SF("Child Price","commercial.childPrice","number")],operations:[SF("Delivery Method","operations.deliveryMethod","select",ENUM.deliveryMethod),SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Policy","operations.cancellationPolicy","textarea"),SF("Operational Notes","operations.notes","textarea")]},
  TRANSFER:{details:[
    SF("Transfer Type","details.transferType","select",ENUM.transferType),SF("Direction","details.direction","select",ENUM.direction),SF("Airport","details.airportId","reference",[],"",["AIRPORT"]),SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Terminal","details.terminal"),SF("Arrival Hall","details.arrivalHall"),SF("Airport Exit Number","details.airportExitNumber"),SF("Waiting Area","details.waitingArea"),SF("Meeting Point","details.meetingPoint"),SF("Meeting Point Description","details.meetingPointDescription","textarea"),SF("Emergency Phone","details.emergencyPhone"),SF("Distance km","details.distanceKm","number"),SF("Zone Code","details.zoneCode"),SF("Zone Name","details.zoneName"),
    SF("Transport Mode","details.transportMode","select",ENUM.transportMode),SF("Vehicle Type","details.vehicleType"),SF("Vehicle Class","details.vehicleClass","select",ENUM.vehicleClass),SF("Vehicle Capacity","details.vehicleCapacity","number"),SF("Luggage Capacity","details.luggageCapacity","number"),SF("Published Time Min","details.publishedTimeMin","number"),SF("Published Time Max","details.publishedTimeMax","number"),SF("Shared Time Min","details.sharedTimeMin","number"),SF("Shared Time Max","details.sharedTimeMax","number"),SF("Direct Time Min","details.directTimeMin","number"),SF("Direct Time Max","details.directTimeMax","number"),SF("Air Conditioning","details.airConditioning","boolean"),SF("Wi-Fi","details.wifi","boolean"),SF("Toilet","details.toilet","boolean"),SF("Accessible Vehicle Available","details.accessibleVehicleAvailable","boolean"),SF("Accessible Vehicle Guaranteed","details.accessibleVehicleGuaranteed","boolean"),SF("Accessibility Request Required","details.accessibilityRequestRequired","boolean"),SF("Accessibility Notes","details.accessibilityNotes","textarea"),
    SR("Transfer Zones","details.zones",[SF("Code","code"),SF("Name","name"),SF("Description","description","textarea")])
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("One-way Supplier Cost","commercial.internalCostOneWay","number"),SF("One-way Public Price","commercial.oneWayPublicPrice","number"),SF("Roundtrip Supplier Cost","commercial.internalCostRoundtrip","number"),SF("Roundtrip Public Price","commercial.roundtripPublicPrice","number"),SF("Child Price","commercial.childPrice","number"),SF("Infant Price","commercial.infantPrice","number"),SF("Child Seat Fee","commercial.childSeatFee","number"),SF("Extra Bag Fee","commercial.extraBagFee","number"),SF("Sports Equipment Fee","commercial.sportsEquipmentFee","number")],operations:[
    SF("Flight Number Required","operations.flightNumberRequired","boolean"),SF("Flight Tracking Enabled","operations.flightTrackingEnabled","boolean"),SF("Delay Protection","operations.delayProtection","boolean"),SF("Maximum Delay Wait Minutes","operations.maximumDelayWaitMinutes","number"),SF("Meet & Greet","operations.meetAndGreet","boolean"),SF("One-way Available","operations.oneWayAvailable","boolean"),SF("Roundtrip Available","operations.roundtripAvailable","boolean"),SF("Hotel Pickup Type","operations.hotelPickupType","select",ENUM.pickupType),SF("Pickup Time Basis","operations.pickupTimeBasis","select",ENUM.pickupTimeBasis),SF("Return Pickup Method","operations.returnPickupMethod","select",ENUM.returnPickupMethod),SF("Reconfirmation Required","operations.reconfirmationRequired","boolean"),SF("Previous Day Notification","operations.previousDayNotification","boolean"),SF("SMS Enabled","operations.smsEnabled","boolean"),SF("App Notification Enabled","operations.appNotificationEnabled","boolean"),SF("Minimum Hotel Stops","operations.minimumHotelStops","number"),SF("Maximum Hotel Stops","operations.maximumHotelStops","number"),SF("Airport Arrival Buffer Minutes","operations.airportArrivalBufferMinutes","number"),SF("Pickup Location Instructions","operations.pickupLocationInstructions","textarea"),SF("After Baggage Instructions","operations.afterBaggageInstructions","textarea"),SF("No-show Rule","operations.noShowRule","textarea"),SF("Lost Baggage Delay Guidance","operations.lostBaggageDelayGuidance","textarea"),SF("Cancellation Policy","operations.cancellationPolicy","textarea"),SF("Amendment Policy","operations.amendmentPolicy","textarea"),SF("Internal Notes","operations.internalNotes","textarea")
  ]},
  CAR_RENTAL:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Airport","details.airportId","reference",[],"",["AIRPORT"]),SF("Vehicle Category","details.vehicleCategory","select",ENUM.vehicleCategory),SF("Vehicle Name","details.vehicleName"),SF("Vehicle Class","details.vehicleClass","select",ENUM.vehicleClass),SF("Transmission","details.transmission","select",ENUM.transmission),SF("Fuel Type","details.fuelType","select",ENUM.fuel),SF("Seats","details.seats","number"),SF("Doors","details.doors","number"),SF("Large Bags","details.largeBags","number"),SF("Small Bags","details.smallBags","number"),SF("Air Conditioning","details.airConditioning","boolean"),SF("Minimum Driver Age","details.minimumDriverAge","number"),SF("Mileage Policy","details.mileagePolicy","select",ENUM.mileagePolicy),SF("Fuel Policy","details.fuelPolicy","select",ENUM.fuelPolicy),SF("Deposit Policy","details.depositPolicy","textarea"),SF("Insurance Summary","details.insuranceSummary","textarea"),SF("Pickup Location","details.pickupLocation"),SF("Drop-off Location","details.dropoffLocation")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number")],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")]},
  PACKAGE:{details:[
    SF("Destination","details.destinationId","reference",[],"",["DESTINATION"]),SF("Area / Resort","details.areaId","reference",[],"",["AREA"]),SF("Package Type","details.packageType","select",ENUM.packageType),SF("Start Date","details.startDate","date"),SF("End Date","details.endDate","date"),SF("Number of Days","details.numberOfDays","number"),SF("Number of Nights","details.numberOfNights","number")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number"),SF("Deposit Amount","commercial.depositAmount","number")],operations:[SF("Booking Flow","operations.bookingFlow","textarea"),SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")]},
  ANCILLARY:{details:[
    SF("Extra Type","details.extraType","select",ENUM.ancillaryType),SF("Minimum Age","details.minimumAge","number"),SF("Maximum Age","details.maximumAge","number"),SF("Max Quantity","details.maxQuantity","number"),SF("Refundable","details.refundable","boolean"),SF("Changeable","details.changeable","boolean"),SF("Description","details.description","textarea")
  ],commercial:[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number")],operations:[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Cancellation Rule","operations.cancellationRule","textarea"),SF("Internal Operational Notes","operations.internalNotes","textarea")]},
  AIRPORT:{details:[
    SF("ICAO Code","details.icaoCode"),SF("Country","details.country"),SF("City","details.city"),SF("Timezone","details.timezone"),SF("Latitude","details.latitude","number"),SF("Longitude","details.longitude","number"),SF("Distance to City Center km","details.distanceToCityCenterKm","number"),SF("Website","details.website","url"),SF("Contact URL","details.contactUrl","url"),SF("Summary","details.summary","textarea"),SF("Information","details.information","textarea"),SF("Arrivals Information","details.arrivalInfo","textarea"),SF("Departures Information","details.departureInfo","textarea"),SF("Transfer Information","details.transferInfo","textarea"),SF("Check-in Information","details.checkinInfo","textarea"),SF("Security Information","details.securityInfo","textarea"),SF("Transport Information","details.transportInfo","textarea"),SF("Parking Information","details.parkingInfo","textarea"),SF("Lounges","details.lounges","textarea"),SF("Airport Hotels","details.airportHotels","textarea"),SF("Destinations Served","details.destinationsServing","textarea"),SL("Quick Facts","details.quickFactsJson"),SL("Terminals","details.terminalsJson"),SL("Runways","details.runwaysJson"),SL("Transport","details.transportJson"),SL("Food & Drinks","details.foodDrinksJson"),SL("Lost & Found","details.lostFoundJson"),SL("Source URLs","details.sourceUrlsJson")
  ]},
  AIRLINE:{details:[
    SF("ICAO Code","details.icaoCode"),SF("Short Name","details.shortName"),SF("Alliance","details.alliance"),SF("Brand Group","details.brandGroup"),SF("Country","details.country"),SF("City / Base","details.city"),SF("Website","details.website","url"),SF("Contact URL","details.contactUrl","url"),SF("Summary","details.summary","textarea"),SF("Baggage Allowance","details.baggageAllowance","textarea"),SF("Check-in","details.checkIn","textarea"),SF("Boarding","details.boarding","textarea"),SF("Food & Drinks","details.foodDrinksJson","textarea"),SF("Wi-Fi / Connectivity","details.wifiOnboardJson","textarea"),SF("Lounges","details.lounges","textarea"),SF("Ticket Types","details.ticketTypesJson","textarea"),SF("Children / Infants","details.childrenInfantsJson","textarea"),SF("Delays / Cancellations","details.delaysCancellationsJson","textarea"),SF("Damaged Baggage","details.damagedBaggageJson","textarea"),SF("Lost & Found","details.lostFoundJson","textarea"),SF("Loyalty Program","details.loyaltyProgram","textarea"),SL("Quick Facts","details.quickFactsJson"),SL("Cabins","details.cabinsJson"),SL("Hubs","details.hubsJson"),SL("Fleet Summary","details.fleetSummaryJson"),SL("Source URLs","details.sourceUrlsJson")
  ]}
};
const DEFAULT_COMMERCIAL=[SF("Currency","commercial.currency","select",ENUM.currency),SF("Price Basis","commercial.priceBasis","select",ENUM.priceBasis),SF("Supplier Cost","commercial.supplierCost","number"),SF("Public Price","commercial.publicPrice","number")];
const DEFAULT_OPERATIONS=[SF("Booking Cutoff Hours","operations.bookingCutoffHours","number"),SF("Operational Notes","operations.notes","textarea")];
function schemaFields(type,section){
  const own=ENTITY_SCHEMAS[type]?.[section];
  if(own)return own;
  if(section==="commercial"&&SELLABLE.has(type))return DEFAULT_COMMERCIAL;
  if(section==="operations"&&SELLABLE.has(type))return DEFAULT_OPERATIONS;
  return[];
}
function optionList(options,value){
  const base=(options||[]).map(o=>typeof o==="string"?{value:o,label:o}:o);
  const current=text(value).trim();
  if(current&&!base.some(o=>String(o.value)===current))return[{value:current,label:`Legacy / current · ${current}`},...base];
  return base;
}
function referenceList(records,types,value){
  const allowed=new Set(types||[]);
  const base=[{value:"",label:"Choose…"},...(records||[]).filter(r=>allowed.has(r.entityType)).map(r=>({value:r.id,label:`${r.code?`${r.code} · `:""}${r.name}`}))];
  const current=text(value).trim();
  if(current&&!base.some(o=>o.value===current))base.splice(1,0,{value:current,label:`Legacy / unresolved · ${current}`});
  return base;
}
function parseSchemaListLine(value){
  const line=String(value??"").trim();
  if(!line)return null;
  if((line.startsWith("{")&&line.endsWith("}"))||(line.startsWith("[")&&line.endsWith("]"))){
    try{return JSON.parse(line)}catch(_){return line}
  }
  return line
}
function SchemaScalar({field,value,onChange,records}){
  if(field.type==="boolean")return html`<${Toggle} label=${field.label} value=${value===true} onChange=${onChange}/>`;
  if(field.type==="list")return html`<${Field} label=${field.label+" — one per line"} type="textarea" value=${(Array.isArray(value)?value:[]).map(x=>typeof x==="string"?x:JSON.stringify(x)).join("\\n")} onChange=${v=>onChange(v.split("\\n").map(parseSchemaListLine).filter(x=>x!==null))} help=${field.help}/>`;
  if(field.type==="reference")return html`<${Field} label=${field.label} type="select" options=${referenceList(records,field.refTypes,value)} value=${value||""} onChange=${onChange} help=${field.help}/>`;
  if(field.type==="select")return html`<${Field} label=${field.label} type="select" options=${optionList(field.options,value)} value=${value??""} onChange=${onChange} help=${field.help}/>`;
  return html`<${Field} label=${field.label} type=${field.type||"text"} value=${value??""} onChange=${onChange} help=${field.help} full=${field.type==="textarea"}/>`;
}
function RepeatSchemaEditor({field,record,update,records}){
  const rows=Array.isArray(getPath(record,field.path))?getPath(record,field.path):[];
  const add=()=>{const item={};for(const f of field.fields)item[f.path]=f.type==="boolean"?false:f.type==="number"?0:"";update(field.path,[...rows,item])};
  return html`<div className="smartgroup full"><div className="paneltitle"><span>${field.label}</span><button className="btn small" onClick=${add}>+ Add</button></div>${field.help?html`<div className="sub">${field.help}</div>`:null}
    ${rows.length?rows.map((row,i)=>html`<div className="smartobject"><div className="paneltitle"><span>${field.label} ${i+1}</span><button className="btn small danger" onClick=${()=>update(field.path,rows.filter((_,x)=>x!==i))}>Remove</button></div><div className="formgrid three">${field.fields.map(f=>html`<${SchemaScalar} field=${f} records=${records} value=${row?.[f.path]} onChange=${v=>update(field.path,rows.map((x,idx)=>idx===i?{...x,[f.path]:v}:x))}/>` )}</div></div>`):html`<div className="smartempty">No ${field.label.toLowerCase()} yet. Add the first one here.</div>`}
  </div>`;
}
function ExplicitSchemaEditor({type,section,record,update,records}){
  const fields=schemaFields(type,section);
  if(!fields.length)return html`<div className="smartempty">No fixed ${section} schema is required for this record family.</div>`;
  return html`<div className="formgrid three">${fields.map(field=>field.type==="repeat"?html`<${RepeatSchemaEditor} field=${field} record=${record} update=${update} records=${records}/>`:html`<${SchemaScalar} field=${field} records=${records} value=${getPath(record,field.path)} onChange=${v=>update(field.path,v)}/>` )}</div>`;
}
function knownSectionKeys(type,section){return schemaFields(type,section).map(f=>f.path.split(".")[1]).filter(Boolean)}


function prettyKey(key){
  return text(key).replace(/[_-]+/g," ").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/\b\w/g,m=>m.toUpperCase());
}
function keyToken(path){
  return text(path).split(".").pop().replace(/[^a-z0-9]/gi,"").toLowerCase();
}
function smartOptions(path,value){
  const token=keyToken(path);
  const options=SMART_ENUMS[token];
  if(!options)return null;
  const current=text(value).trim();
  return current&&!options.includes(current)?[current,...options]:options;
}
function smartTextType(path,value){
  const token=keyToken(path);
  if(/date$|reviewed$|validfrom$|validto$|publishat$|unpublishat$/.test(token))return"date";
  if(/time$|checkin$|checkout$|std$|sta$/.test(token))return"time";
  if(/email/.test(token))return"email";
  if(/url|website|link/.test(token))return"url";
  if(/description|summary|information|notes|content|policy|instructions|reason|message/.test(token)||text(value).length>140)return"textarea";
  return"text";
}
function SmartValueEditor({label,path,value,onChange,full=false}){
  if(Array.isArray(value)){
    const objects=value.some(v=>v&&typeof v==="object"&&!Array.isArray(v));
    if(!objects){
      return html`<${Field} label=${label+" — one per line"} type="textarea" value=${value.map(v=>text(v)).join("\\n")} onChange=${v=>onChange(v.split("\\n").map(x=>x.trim()).filter(Boolean))} full=${full}/>`
    }
    return html`<div className="smartgroup"><div className="smarttitle">${label}</div>
      ${value.length?value.map((item,i)=>html`<div className="smartobject"><div className="paneltitle"><span>Item ${i+1}</span><button className="btn small danger" onClick=${()=>onChange(value.filter((_,x)=>x!==i))}>Remove</button></div><${SmartObjectEditor} value=${item||{}} onChange=${next=>onChange(value.map((x,idx)=>idx===i?next:x))}/></div>`):html`<div className="smartempty">No list items.</div>`}
    </div>`
  }
  if(value&&typeof value==="object"){
    return html`<div className="smartgroup"><div className="smarttitle">${label}</div><${SmartObjectEditor} value=${value} onChange=${onChange}/></div>`
  }
  if(typeof value==="boolean"){
    return html`<${Toggle} label=${label} value=${value} onChange=${onChange}/>`
  }
  const options=smartOptions(path,value);
  if(options){
    return html`<${Field} label=${label} type="select" options=${options} value=${value??""} onChange=${onChange} full=${full}/>`
  }
  const type=typeof value==="number"?"number":smartTextType(path,value);
  return html`<${Field} label=${label} type=${type} value=${value??""} onChange=${onChange} full=${full||type==="textarea"}/>`
}
function SmartObjectEditor({value,onChange,exclude=[]}){
  const obj=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  const hidden=new Set(exclude.map(x=>text(x)));
  const entries=Object.entries(obj).filter(([k])=>!hidden.has(k));
  if(!entries.length)return html`<div className="smartempty">No additional system fields are stored for this section.</div>`;
  return html`<div className="formgrid three">${entries.map(([k,v])=>html`<${SmartValueEditor} label=${prettyKey(k)} path=${k} value=${v} onChange=${next=>onChange({...obj,[k]:next})}/>` )}</div>`
}
function ConfigurationEditor({value,onChange}){
  const rows=Object.entries(value&&typeof value==="object"&&!Array.isArray(value)?value:{});
  const setRow=(index,key,seats)=>{
    const next={};
    rows.forEach(([k,v],i)=>{if(i===index){if(text(key).trim())next[text(key).trim()]=Math.max(0,Number(seats)||0)}else next[k]=v});
    onChange(next);
  };
  const add=()=>{
    let name="Economy";let i=2;while(Object.prototype.hasOwnProperty.call(value||{},name)){name=`Cabin ${i++}`}
    onChange({...value,[name]:0});
  };
  return html`<div className="smartgroup"><div className="paneltitle"><span>Cabin Seat Configuration</span><button className="btn small" onClick=${add}>+ Cabin</button></div>
    ${rows.length?html`<div className="smartlist">${rows.map(([k,v],i)=>html`<div className="smartrow"><div className="formgrid"><${Field} label="Cabin / Product Name" value=${k} onChange=${name=>setRow(i,name,v)}/><${Field} label="Seats" type="number" value=${v} onChange=${seats=>setRow(i,k,seats)}/></div><button className="btn small danger" onClick=${()=>{const next={...value};delete next[k];onChange(next)}}>Remove</button></div>`)}</div>`:html`<div className="smartempty">No cabin seat configuration stored. Add a cabin to build the configuration.</div>`}
  </div>`
}
const COMMON_AMENITIES=["Wi-Fi","Seatback entertainment","Streaming entertainment","USB-A power","USB-C power","AC power","Meal service","Snack service","Extra legroom","Lie-flat seat","Priority boarding","Lounge access"];
function AmenitiesEditor({value,onChange}){
  const list=Array.isArray(value)?value:[];
  const objectMode=list.some(v=>v&&typeof v==="object");
  const [choice,setChoice]=useState(COMMON_AMENITIES[0]);
  if(objectMode){
    return html`<div className="smartgroup"><div className="paneltitle"><span>Cabin Amenities</span><button className="btn small" onClick=${()=>onChange([...list,{label:"",available:true}])}>+ Amenity</button></div>
      ${list.map((item,i)=>html`<div className="smartobject"><div className="paneltitle"><span>Amenity ${i+1}</span><button className="btn small danger" onClick=${()=>onChange(list.filter((_,x)=>x!==i))}>Remove</button></div><${SmartObjectEditor} value=${item||{}} onChange=${next=>onChange(list.map((x,idx)=>idx===i?next:x))}/></div>`)}
    </div>`
  }
  return html`<div className="smartgroup"><div className="paneltitle"><span>Cabin Amenities</span><div className="toolbar"><select className="select w240" value=${choice} onChange=${e=>setChoice(e.target.value)}>${COMMON_AMENITIES.map(x=>html`<option value=${x}>${x}</option>`)}</select><button className="btn small" onClick=${()=>{if(!list.includes(choice))onChange([...list,choice])}}>Add</button></div></div>
    ${list.length?html`<div className="smartlist">${list.map((item,i)=>html`<div className="smartrow"><${Field} label=${`Amenity ${i+1}`} value=${text(item)} onChange=${v=>onChange(list.map((x,idx)=>idx===i?v:x))}/><button className="btn small danger" onClick=${()=>onChange(list.filter((_,x)=>x!==i))}>Remove</button></div>`)}</div>`:html`<div className="smartempty">No amenities have been added.</div>`}
  </div>`
}
function Modal({title,onClose,children,wide=false,actions=null}){
  return html`<div className="modalback" onMouseDown=${e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className=${`modal ${wide?"wide":""}`}>
      <div className="modalhead"><h2>${title}</h2><div className="toolbar">${actions}<button className="btn small" onClick=${onClose}>Close</button></div></div>
      <div className="modalbody">${children}</div>
    </div>
  </div>`
}


const ASSET_ROOTS=["SKANDI","AIRLINES","AIRCRAFT","AIRPORTS","COUNTRIES","DESTINATIONS","AREAS","HOTELS","TRANSFERS","TOURS","ACTIVITIES","TICKETS","CAR RENTAL","SUPPLIERS","PARTNERS","EMPLOYEES","UNIFORMS","VOY"];
const ROOT_BY_ENTITY={AIRLINE:"AIRLINES",AIRPORT:"AIRPORTS",COUNTRY:"COUNTRIES",DESTINATION:"DESTINATIONS",AREA:"AREAS",HOTEL:"HOTELS",TRANSFER:"TRANSFERS",GUIDED_TOUR:"TOURS",ACTIVITY:"ACTIVITIES",PARTNER_TICKET:"TICKETS",CAR_RENTAL:"CAR RENTAL",SUPPLIER:"SUPPLIERS"};
function humanBytes(bytes){const n=Number(bytes)||0;if(!n)return"—";const u=["B","KB","MB","GB"];let i=0,v=n;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v>=10||i===0?v.toFixed(0):v.toFixed(1)} ${u[i]}`}
async function sha256File(file){const d=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function assetContextForRecord(rec,role="GALLERY"){
  const root=ROOT_BY_ENTITY[rec.entityType]||"SKANDI";
  const folder=root==="SKANDI"?(LABEL[rec.entityType]||rec.entityType||"Inventory"):(rec.name||rec.code||`Draft ${rec.entityType}`);
  const subfolder=root==="SKANDI"?(rec.name||rec.code||"General"):"";
  return{visibility:"PUBLIC",assetType:"IMAGE",libraryRoot:root,libraryFolder:folder,librarySubfolder:subfolder,category:role,brand:"SKANDI",system:"Inventory Control",contextSystem:"Inventory Control",contextRecordType:rec.entityType,contextRecordId:rec.id||"",fieldName:"media",role};
}
function assetContextForAircraft(boot,aircraft,category,fieldName,subfolder=""){
  const airline=(boot.airlines||[]).find(x=>x.id===aircraft.airlineId||x.code===aircraft.airlineCode);
  const airlineName=airline?.name||aircraft.airlineCode||"Unknown Airline";
  return{visibility:"PUBLIC",assetType:"IMAGE",libraryRoot:"AIRLINES",libraryFolder:airlineName,librarySubfolder:["Aircraft",aircraft.aircraftName||aircraft.aircraftCode||"Aircraft",subfolder].filter(Boolean).join(" / "),category,brand:"SKANDI",system:"Inventory Control",contextSystem:"Inventory Control",contextRecordType:"AIRCRAFT",contextRecordId:aircraft.id||"",fieldName,role:category};
}
function AssetCard({asset,onUse,onOpen,manageOnly=false}){
  const preview=asset.previewUrl||asset.publicUrl||"";
  return html`<div className="assetcard"><div className="assetthumb">${asset.assetType==="IMAGE"&&preview?html`<img src=${preview} alt=${asset.altText||asset.displayName||""}/>`:html`<span className="assettype">${asset.assetType==="DOCUMENT"?"DOC":asset.assetType||"FILE"}</span>`}</div>
    <div className="assetbody"><div className="assetname" title=${asset.displayName}>${asset.displayName||asset.originalName}</div><div className="assetpath">${asset.folderPath||`${asset.libraryRoot} / ${asset.libraryFolder}`}</div>
      <div className="assetbadges"><span className=${`badge ${asset.visibility==="PRIVATE"?"private":"public"}`}>${asset.visibility}</span><span className="badge">${humanBytes(asset.sizeBytes)}</span>${asset.isKnownDuplicate?html`<span className="badge dup">Duplicate ×${asset.duplicateCount}</span>`:null}${asset.source==="LEGACY_STORAGE_INDEX"?html`<span className="badge">Legacy indexed</span>`:null}</div>
      <div className="assetactions">${!manageOnly&&onUse?html`<button className="btn small primary" onClick=${()=>onUse(asset)}>Use Asset</button>`:null}${onOpen?html`<button className="btn small" onClick=${()=>onOpen(asset)}>Open</button>`:null}</div>
    </div></div>`
}
function AssetLibraryModal({context,onClose,onSelect,manageOnly=false,setBusy,setToast}){
  const [assets,setAssets]=useState([]),[search,setSearch]=useState("");
  const [root,setRoot]=useState(context?.libraryRoot||"SKANDI"),[folder,setFolder]=useState(context?.libraryFolder||"Marketing"),[subfolder,setSubfolder]=useState(context?.librarySubfolder||""),[category,setCategory]=useState(context?.category||"General");
  const [visibility,setVisibility]=useState(context?.visibility||"PUBLIC"),[assetType,setAssetType]=useState(context?.assetType||"");
  const [file,setFile]=useState(null),[hash,setHash]=useState(""),[dup,setDup]=useState(null),[uploading,setUploading]=useState(false);
  const locked=!!context?.lockedContext;
  async function load(){
    try{const r=await request("INVENTORY_ASSET_LIST",{visibility:visibility||undefined,assetType:assetType||undefined,libraryRoot:root||undefined,libraryFolder:folder||undefined,search});setAssets(r.assets||[])}
    catch(e){setToast(e.message,true)}
  }
  useEffect(()=>{load()},[root,folder,visibility,assetType]);
  async function chooseFile(f){
    setFile(f||null);setDup(null);setHash("");if(!f)return;
    try{setUploading(true);const digest=await sha256File(f);setHash(digest);const r=await request("INVENTORY_ASSET_CHECK_DUPLICATE",{sha256:digest,sizeBytes:f.size,mimeType:f.type,originalName:f.name});
      if((r.exactDuplicates||[]).length)setDup({exact:r.exactDuplicates,possible:[]});else if((r.possibleLegacyDuplicates||[]).length)setDup({exact:[],possible:r.possibleLegacyDuplicates})}
    catch(e){setToast(e.message,true)}finally{setUploading(false)}
  }
  async function openAsset(asset){
    try{
      if(asset.publicUrl){window.open(asset.publicUrl,"_blank","noopener,noreferrer");return}
      const result=await request("INVENTORY_ASSET_ACCESS_URL",{assetId:asset.id,expiresIn:600});
      if(result.url)window.open(result.url,"_blank","noopener,noreferrer");
    }catch(e){setToast(e.message,true)}
  }
  async function upload(allowPossibleDuplicate=false){
    if(!file)return setToast("Choose a file first.",true);if(!root||!folder)return setToast("Choose an Asset Library root and folder.",true);
    try{setUploading(true);setBusy("Uploading to SKANDI Asset Library…");const digest=hash||await sha256File(file);
      const prep=await request("INVENTORY_ASSET_PREPARE_UPLOAD",{file:{name:file.name,type:file.type,size:file.size},sha256:digest,visibility,assetType:assetType||undefined,libraryRoot:root,libraryFolder:folder,librarySubfolder:subfolder,category,brand:context?.brand||"SKANDI",system:context?.system||"Inventory Control",contextSystem:context?.contextSystem||"Inventory Control",contextRecordType:context?.contextRecordType||"",contextRecordId:context?.contextRecordId||"",fieldName:context?.fieldName||"",role:context?.role||category,allowPossibleDuplicate});
      if(prep.duplicate){setDup({exact:prep.exactDuplicates||[],possible:[]});return}if(prep.needsReview){setDup({exact:[],possible:prep.possibleLegacyDuplicates||[]});return}
      const response=await fetch(prep.upload.signedUrl,{method:"PUT",headers:{"content-type":file.type,"cache-control":`max-age=${prep.upload.cacheControl||3600}`,"x-upsert":"false"},body:file});
      if(!response.ok)throw new Error(`Asset upload failed (${response.status}).`);
      const done=await request("INVENTORY_ASSET_FINALIZE_UPLOAD",{requestId:prep.requestId});if(!done.asset)throw new Error("Asset uploaded but could not be registered.");
      setToast(done.duplicate?"That file already existed. Reusing the existing asset.":"Asset uploaded and registered.");await load();
      if(!manageOnly&&onSelect){onSelect(done.asset);onClose()}else{setFile(null);setHash("");setDup(null)}
    }catch(e){setToast(e.message,true)}finally{setBusy("");setUploading(false)}
  }
  const filtered=assets.filter(a=>!search||[a.displayName,a.originalName,a.folderPath,...(a.tags||[])].join(" ").toLowerCase().includes(search.toLowerCase()));
  return html`<${Modal} title=${manageOnly?"SKANDI Asset Library":"Choose from SKANDI Asset Library"} onClose=${onClose} wide=${true}>
    <div className="notice">Existing assets are always shown before upload. Reuse an existing file whenever possible; exact SHA-256 duplicates are blocked.</div>
    <div className="assetfilters" style=${{marginTop:"12px"}}>
      <${Field} label="Library Root" type="select" options=${ASSET_ROOTS} value=${root} disabled=${locked} onChange=${setRoot}/>
      <${Field} label="Folder" value=${folder} disabled=${locked} onChange=${setFolder}/><${Field} label="Subfolder" value=${subfolder} disabled=${locked} onChange=${setSubfolder}/><${Field} label="Category" value=${category} disabled=${locked} onChange=${setCategory}/>
      ${manageOnly?html`<${Field} label="Visibility" type="select" options=${["PUBLIC","PRIVATE"]} value=${visibility} onChange=${setVisibility}/>`:null}
      ${manageOnly?html`<${Field} label="File Type" type="select" options=${[{value:"",label:"All"},...["IMAGE","DOCUMENT","FORM","VIDEO","AUDIO","OTHER"]]} value=${assetType} onChange=${setAssetType}/>`:null}
      <div className="field full"><label>Search Existing Assets</label><div className="toolbar"><input className="input" value=${search} onInput=${e=>setSearch(e.target.value)} placeholder="Name, folder, tag…"/><button className="btn" onClick=${load}>Search</button></div></div>
    </div>
    <div className="paneltitle"><span>Available Assets · ${filtered.length}</span><span className="assetfolder">${root} → ${folder}${subfolder?` → ${subfolder}`:""}</span></div>
    ${filtered.length?html`<div className="assetgrid">${filtered.map(a=>html`<${AssetCard} asset=${a} onUse=${onSelect} onOpen=${openAsset} manageOnly=${manageOnly}/>` )}</div>`:html`<div className="empty">No existing assets match this folder/search.</div>`}
    <div className="assetsection"><div className="uploadzone"><strong>Upload only if the file is not already available</strong>
      ${manageOnly&&!locked?html`<div className="notice">Choose the business folder above, e.g. AIRLINES → British Airways or SKANDI → Marketing.</div>`:null}
      <input className="fileinput" type="file" accept=${assetType==="IMAGE"?"image/*":undefined} onChange=${e=>chooseFile(e.target.files?.[0]||null)}/>
      ${file?html`<div><b>${file.name}</b> · ${humanBytes(file.size)} · ${file.type||"unknown type"}</div>`:null}${uploading?html`<div className="sub">Checking file and Asset Library…</div>`:null}
      ${dup?.exact?.length?html`<div className="dupbox"><b>Exact file already exists.</b><div className="sub">Upload is disabled. Use the existing asset.</div><div className="assetgrid" style=${{marginTop:"8px"}}>${dup.exact.map(a=>html`<${AssetCard} asset=${a} onUse=${onSelect} onOpen=${openAsset} manageOnly=${manageOnly}/>` )}</div></div>`:null}
      ${dup?.possible?.length?html`<div className="dupbox"><b>Possible legacy duplicate found.</b><div className="sub">Check these older files before creating another copy.</div><div className="assetgrid" style=${{marginTop:"8px"}}>${dup.possible.map(a=>html`<${AssetCard} asset=${a} onUse=${onSelect} onOpen=${openAsset} manageOnly=${manageOnly}/>` )}</div><div className="assetactions"><button className="btn" onClick=${()=>upload(true)}>I checked — upload as new anyway</button></div></div>`:null}
      ${file&&!dup?.exact?.length&&!dup?.possible?.length?html`<button className="btn cyan" disabled=${uploading} onClick=${()=>upload(false)}>Upload to ${visibility==="PRIVATE"?"Private":"Public"} Asset Library</button>`:null}
    </div></div>
  <//>`
}
function AssetField({label,value,assetId,context,onSelect,setBusy,setToast,help=""}){
  const [open,setOpen]=useState(false);
  return html`<div className="field full"><label>${label}</label><div className="assetcurrent">${value?html`<div className="preview"><img src=${value} alt=${label}/></div>`:html`<div className="preview">No asset selected</div>`}
    <div className="toolbar"><button className="btn" onClick=${()=>setOpen(true)}>${value?"Replace / Browse Asset Library":"Browse Asset Library / Upload"}</button>${value?html`<span className="sub">${assetId?"Managed Asset Library file":"Legacy linked image — replace through Asset Library when edited"}</span>`:null}</div>${help?html`<small>${help}</small>`:null}</div>
    ${open?html`<${AssetLibraryModal} context=${{...context,lockedContext:true}} onClose=${()=>setOpen(false)} onSelect=${a=>{onSelect(a);setOpen(false)}} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`
}
function AssetLibraryPanel({setBusy,setToast}){
  const [open,setOpen]=useState(false),[snapshot,setSnapshot]=useState(null);
  async function load(){try{setBusy("Loading Asset Library…");setSnapshot(await request("INVENTORY_ASSET_LIST",{}))}catch(e){setToast(e.message,true)}finally{setBusy("")}}
  useEffect(()=>{load()},[]);
  const assets=snapshot?.assets||[],publicCount=assets.filter(a=>a.visibility==="PUBLIC").length,privateCount=assets.filter(a=>a.visibility==="PRIVATE").length,duplicates=assets.filter(a=>a.isKnownDuplicate).length;
  return html`<div className="card panel"><div className="assetlibraryhero"><div><div className="eyebrow">PLATFORM STANDARD</div><div className="sectiontitle">SKANDI Asset Library</div><div className="sub">One indexed library for website images, PDFs, documents, forms, video, audio and internal files. New uploads use canonical public/private buckets; existing files remain searchable and reusable.</div></div><div className="toolbar"><button className="btn" onClick=${load}>Refresh</button><button className="btn primary" onClick=${()=>setOpen(true)}>Open Library / Upload</button></div></div>
    <div className="stats" style=${{marginTop:"14px"}}><div className="stat"><span>Indexed Assets</span><strong>${assets.length}</strong></div><div className="stat"><span>Public</span><strong>${publicCount}</strong></div><div className="stat"><span>Private</span><strong>${privateCount}</strong></div><div className="stat"><span>Known Duplicate Rows</span><strong>${duplicates}</strong></div><div className="stat"><span>Folder Roots</span><strong>${snapshot?.roots?.length||0}</strong></div></div>
    <div className="notice">New files must be organized by business meaning, e.g. AIRLINES → British Airways, HOTELS → Scandic Continental, DESTINATIONS → Stockholm, or SKANDI → Marketing.</div>
    ${open?html`<${AssetLibraryModal} context=${{libraryRoot:"SKANDI",libraryFolder:"Marketing",visibility:"PUBLIC",assetType:""}} manageOnly=${true} onClose=${()=>{setOpen(false);load()}} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`
}


function RecordEditor({bundle,languages,records,onClose,onSaved,setBusy,setToast}){
  const [draft,setDraft]=useState(()=>clone(bundle));
  const [tab,setTab]=useState("identity");
  const [lang,setLang]=useState(languages?.[0]||"EN");
  const [assetPicker,setAssetPicker]=useState(null);
  const rec=draft.record;
  const refs=records||[];
  const update=(path,value)=>setDraft(d=>{const n=clone(d);setPath(n.record,path,value);return n});
  const localized=useMemo(()=>{const a=(draft.localizedContent||[]).map(normalizeLocalized);for(const l of languages||[])if(!a.some(x=>x.language===l))a.push(normalizeLocalized({language:l}));return a},[draft.localizedContent,languages]);
  const currentLang=localized.find(x=>x.language===lang)||localized[0]||normalizeLocalized({language:lang});
  const updateLang=(key,value)=>setDraft(d=>{const rows=(d.localizedContent||[]).map(normalizeLocalized);let i=rows.findIndex(x=>x.language===lang);if(i<0){rows.push(normalizeLocalized({language:lang}));i=rows.length-1}rows[i]={...rows[i],[key]:value};return{...d,localizedContent:rows}});
  const media=(draft.media||[]).map(normalizeMedia);
  const relations=(draft.relations||[]).map(normalizeRelation);
  const catalog=draft.catalog||{catalogType:"NONE",partnerTier:"",searchable:false,featured:false,homepageFeatured:false,searchPriority:rec.sortPriority||100,searchKeywords:[],marketCodes:["ALL"],salesChannels:["WEB"],publicLabel:"",badge:"",validFrom:"",validTo:"",notes:"",active:true};
  const setCatalog=(k,v)=>setDraft(d=>({...d,catalog:{...(d.catalog||catalog),[k]:v}}));
  const parentOptions=[{value:"",label:"None"},...refs.filter(x=>x.id!==rec.id&&["COUNTRY","DESTINATION","AREA"].includes(x.entityType)).map(x=>({value:x.id,label:`${x.entityType} · ${x.name}`}))];
  const supplierOptions=[{value:"",label:"None"},...refs.filter(x=>x.entityType==="SUPPLIER").map(x=>({value:x.id,label:x.name}))];


  const detailKnown=knownSectionKeys(rec.entityType,"details");
  const commercialKnown=knownSectionKeys(rec.entityType,"commercial");
  const operationsKnown=knownSectionKeys(rec.entityType,"operations");
  const setSection=(key,next)=>setDraft(d=>({...d,record:{...d.record,[key]:next}}));
  function useRecordAsset(index,asset,isNew=false){
    setDraft(d=>{
      const rows=(d.media||[]).map(normalizeMedia);
      const prior=isNew?normalizeMedia({role:"GALLERY",sortOrder:(rows.length+1)*10}):rows[index];
      const next={...prior,url:asset.publicUrl||asset.previewUrl||"",storageBucket:asset.bucket,storagePath:asset.storagePath,sourceKind:"ASSET_LIBRARY",altText:prior.altText||asset.altText||asset.displayName||"",payload:{...(prior.payload||{}),assetId:asset.id,assetCode:asset.assetCode}};
      if(isNew)rows.push(next);else rows[index]=next;
      return{...d,media:rows};
    });
    setAssetPicker(null);
  }
  async function save(status){
    try{
      setBusy("Saving complete record bundle…");
      const payload=clone(draft);
      payload.record.status=status;
      payload.localizedContent=localized;
      payload.media=media;
      payload.relations=relations;
      payload.catalog=catalog.catalogType==="NONE"?{...catalog,catalogType:"NONE"}:catalog;
      const result=await request("INVENTORY_V9_SAVE_BUNDLE",{bundle:payload});
      const saved=result?.bundle?.record||result?.record||payload.record;
      const savedMedia=result?.bundle?.media||payload.media||[];
      for(const m of savedMedia){const assetId=m?.payload?.assetId||m?.assetId;if(assetId&&saved?.id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId,system:"Inventory Control",recordType:saved.entityType||rec.entityType,recordId:saved.id,usageRole:m.role||m.media_type||"MEDIA",fieldName:"inventory_media_assets"})}catch(_){}}
      onSaved(result);setToast("Record, content, media, relations, catalog and Asset Library links saved together.");onClose();
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }


  const tabs=["identity","details","commercial","operations","content","media","relations","catalog","publishing"];
  return html`<${Modal} title=${`${rec.entityType} · ${rec.name||"New record"}`} onClose=${onClose} wide=${true}
    actions=${html`<button className="btn small" onClick=${()=>save(rec.status||"DRAFT")}>Save</button><button className="btn small" onClick=${()=>save("REVIEW")}>Review</button><button className="btn small cyan" onClick=${()=>save("PUBLISHED")}>Publish</button>`}>
    <div className="tabs">${tabs.map(t=>html`<button className=${`tab ${tab===t?"active":""}`} onClick=${()=>setTab(t)}>${t[0].toUpperCase()+t.slice(1)}</button>`)}</div>
    ${tab==="identity"?html`<div className="formgrid three">
      <${Field} label="Record Type" value=${rec.entityType} disabled=${true}/>
      <${Field} label=${rec.entityType==="AIRPORT"?"IATA Code":rec.entityType==="AIRLINE"?"IATA Code":"System Code"} value=${rec.code} onChange=${v=>update("code",v)}/>
      <${Field} label="Master Name / Title" value=${rec.name} onChange=${v=>update("name",v)}/>
      <${Field} label="URL Slug" value=${rec.slug} onChange=${v=>update("slug",v)} help="Leave blank to generate from the title."/>
      <${Field} label="Public ID" value=${rec.publicId} onChange=${()=>{}} disabled=${true} help=${rec.id?"Canonical ID generated by Supabase.":"Generated by Supabase when the record is first saved."}/>
      <${Field} label="Status" type="select" options=${STATUS} value=${rec.status||"DRAFT"} onChange=${v=>update("status",v)}/>
      <${Field} label="Sort Priority" type="number" value=${rec.sortPriority} onChange=${v=>update("sortPriority",v)}/>
      ${["DESTINATION","AREA"].includes(rec.entityType)?html`<${Field} label="Parent Geography" type="select" options=${parentOptions} value=${rec.parentEntityId||""} onChange=${v=>update("parentEntityId",v)} />`:null}
      ${SELLABLE.has(rec.entityType)?html`<${Field} label="Supplier" type="select" options=${supplierOptions} value=${rec.supplierEntityId||""} onChange=${v=>update("supplierEntityId",v)} />`:null}
      <${Toggle} label="Active" value=${rec.active!==false} onChange=${v=>update("active",v)}/>
      <${Toggle} label="Customer Visible" value=${rec.customerVisible===true} onChange=${v=>update("customerVisible",v)}/>
      <${Toggle} label="Staff Visible" value=${rec.staffVisible!==false} onChange=${v=>update("staffVisible",v)}/>
      <${Toggle} label="ALTEA Visible" value=${rec.alteaVisible!==false} onChange=${v=>update("alteaVisible",v)}/>
    </div>`:null}
    ${tab==="details"?html`<div>
      <div className="notice">Inventory Control uses an explicit schema contract. Empty categorical and relationship fields remain real dropdowns/selectors, repeatable structures can create their first row, and unknown legacy keys remain preserved below.</div>
      <div style=${{marginTop:"12px"}}><${ExplicitSchemaEditor} type=${rec.entityType} section="details" record=${rec} update=${update} records=${refs}/></div>
      <div className="hr"></div><div className="sectiontitle">Additional Stored Fields</div>
      <${SmartObjectEditor} value=${rec.details||{}} exclude=${detailKnown} onChange=${v=>setSection("details",v)}/>
    </div>`:null}
    ${tab==="commercial"?html`<div>
      <${ExplicitSchemaEditor} type=${rec.entityType} section="commercial" record=${rec} update=${update} records=${refs}/>
      <div className="hr"></div><div className="sectiontitle">Additional Commercial Fields</div>
      <${SmartObjectEditor} value=${rec.commercial||{}} exclude=${commercialKnown} onChange=${v=>setSection("commercial",v)}/>
    </div>`:null}
    ${tab==="operations"?html`<div>
      <${ExplicitSchemaEditor} type=${rec.entityType} section="operations" record=${rec} update=${update} records=${refs}/>
      <div className="hr"></div><div className="sectiontitle">Additional Operational Fields</div>
      <${SmartObjectEditor} value=${rec.operations||{}} exclude=${operationsKnown} onChange=${v=>setSection("operations",v)}/>
    </div>`:null}
    ${tab==="content"?html`<div>
      <div className="langtabs">${languages.map(l=>html`<button className=${`lang ${lang===l?"active":""}`} onClick=${()=>setLang(l)}>${l}</button>`)}</div>
      <div className="formgrid">
        <${Field} label="Page Title" value=${currentLang.title} onChange=${v=>updateLang("title",v)}/>
        <${Field} label="Eyebrow" value=${currentLang.eyebrow} onChange=${v=>updateLang("eyebrow",v)}/>
        <${Field} label="Short Description" type="textarea" value=${currentLang.shortDescription} onChange=${v=>updateLang("shortDescription",v)} full=${true}/>
        <${Field} label="Full Description" type="textarea" value=${currentLang.fullDescription} onChange=${v=>updateLang("fullDescription",v)} full=${true}/>
        <${Field} label="Highlights — one per line" type="textarea" value=${currentLang.highlights.join("\n")} onChange=${v=>updateLang("highlights",v.split("\n").map(x=>x.trim()).filter(Boolean))}/>
        <${Field} label="Important Information" type="textarea" value=${currentLang.importantInformation} onChange=${v=>updateLang("importantInformation",v)}/>
        <${Field} label="SEO Title" value=${currentLang.seoTitle} onChange=${v=>updateLang("seoTitle",v)}/>
        <${Field} label="SEO Description" type="textarea" value=${currentLang.seoDescription} onChange=${v=>updateLang("seoDescription",v)}/>
      </div>
    </div>`:null}
    ${tab==="media"?html`<div>
      <div className="paneltitle"><span>Media Assets</span><button className="btn small" onClick=${()=>setAssetPicker({index:-1,isNew:true,context:assetContextForRecord(rec,"GALLERY")})}>+ Browse / Upload Image</button></div>
      <div className="notice">Images come from the central SKANDI Asset Library. Existing assets are always shown first and exact duplicates are blocked.</div>
      ${media.length?media.map((m,i)=>html`<div className="mediaitem"><div className="formgrid three">
        <${Field} label="Role" type="select" options=${["PRIMARY","HERO","CARD","MOBILE","GALLERY","OG","LOGO","MAP","ROOM","THUMBNAIL"]} value=${m.role} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],role:v};return{...d,media:x}})}/>
        <${Field} label="Alt Text" value=${m.altText} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],altText:v};return{...d,media:x}})}/>
        <${Field} label="Caption" value=${m.caption||""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],caption:v};return{...d,media:x}})}/>
        <${Field} label="Credit" value=${m.credit||""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],credit:v};return{...d,media:x}})}/>
        <${Field} label="Focal X %" type="number" value=${m.focalX??""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],focalX:v};return{...d,media:x}})}/>
        <${Field} label="Focal Y %" type="number" value=${m.focalY??""} onChange=${v=>setDraft(d=>{const x=[...(d.media||[])];x[i]={...x[i],focalY:v};return{...d,media:x}})}/>
      </div><div className="assetcurrent" style=${{marginTop:"8px"}}>${m.url?html`<div className="preview"><img src=${m.url} alt=${m.altText||""}/></div>`:html`<div className="preview">No asset selected</div>`}<div className="toolbar"><button className="btn small" onClick=${()=>setAssetPicker({index:i,isNew:false,context:assetContextForRecord(rec,m.role||"GALLERY")})}>Replace / Browse Asset Library</button><span className="sub">${m.assetId||m.sourceKind==="ASSET_LIBRARY"?"Managed Asset Library file":"Legacy linked image"}</span><button className="btn small danger" onClick=${()=>setDraft(d=>({...d,media:(d.media||[]).filter((_,x)=>x!==i)}))}>Remove from record</button></div></div></div>`):html`<div className="empty">No media attached. Browse the Asset Library before uploading a new image.</div>`}
      ${assetPicker?html`<${AssetLibraryModal} context=${{...assetPicker.context,lockedContext:true}} onClose=${()=>setAssetPicker(null)} onSelect=${asset=>useRecordAsset(assetPicker.index,asset,assetPicker.isNew)} setBusy=${setBusy} setToast=${setToast}/>`:null}
    </div>`:null}
    ${tab==="relations"?html`<div>
      <div className="paneltitle"><span>Relations</span><button className="btn small" onClick=${()=>setDraft(d=>({...d,relations:[...(d.relations||[]),normalizeRelation({})]}))}>+ Add Relation</button></div>
      ${relations.length?relations.map((r,i)=>html`<div className="relitem"><div className="formgrid three">
        <${Field} label="Relation Type" value=${r.relationType} onChange=${v=>setDraft(d=>{const a=[...(d.relations||[])];a[i]={...a[i],relationType:v};return{...d,relations:a}})}/>
        <${Field} label="Target Record" type="select" options=${[{value:"",label:"Choose…" },...refs.filter(x=>x.id!==rec.id).map(x=>({value:x.id,label:`${x.entityType} · ${x.name}`}))]} value=${r.targetEntityId||r.targetRecordId||""} onChange=${v=>setDraft(d=>{const a=[...(d.relations||[])];const target=refs.find(x=>x.id===v);a[i]={...a[i],targetEntityId:target&&!["AIRPORT","AIRLINE"].includes(target.entityType)?v:"",targetRecordType:target&&["AIRPORT","AIRLINE"].includes(target.entityType)?target.entityType:"",targetRecordId:target&&["AIRPORT","AIRLINE"].includes(target.entityType)?v:""};return{...d,relations:a}})}/>
        <button className="btn danger" onClick=${()=>setDraft(d=>({...d,relations:(d.relations||[]).filter((_,x)=>x!==i)}))}>Remove</button>
      </div></div>`):html`<div className="empty">No relations.</div>`}
    </div>`:null}
    ${tab==="catalog"?html`<div className="formgrid three">
      <${Field} label="Website Placement" type="select" options=${["NONE","SKANDI_COLLECTION","SKANDI_PARTNER"]} value=${catalog.catalogType||"NONE"} onChange=${v=>setCatalog("catalogType",v)}/>
      <${Field} label="Partner Tier" value=${catalog.partnerTier||""} onChange=${v=>setCatalog("partnerTier",v)}/>
      <${Field} label="Search Priority" type="number" value=${catalog.searchPriority??100} onChange=${v=>setCatalog("searchPriority",v)}/>
      <${Toggle} label="Searchable" value=${catalog.searchable===true} onChange=${v=>setCatalog("searchable",v)}/>
      <${Toggle} label="Featured" value=${catalog.featured===true} onChange=${v=>setCatalog("featured",v)}/>
      <${Toggle} label="Homepage Featured" value=${catalog.homepageFeatured===true} onChange=${v=>setCatalog("homepageFeatured",v)}/>
      <${Field} label="Public Label" value=${catalog.publicLabel||""} onChange=${v=>setCatalog("publicLabel",v)}/>
      <${Field} label="Badge" value=${catalog.badge||""} onChange=${v=>setCatalog("badge",v)}/>
      <${Field} label="Search Keywords — comma separated" value=${(catalog.searchKeywords||[]).join(", ")} onChange=${v=>setCatalog("searchKeywords",v.split(",").map(x=>x.trim()).filter(Boolean))} full=${true}/>
      <${Field} label="Market Codes — comma separated" value=${(catalog.marketCodes||[]).join(", ")} onChange=${v=>setCatalog("marketCodes",v.split(",").map(x=>x.trim()).filter(Boolean))}/>
      <${Field} label="Sales Channels — comma separated" value=${(catalog.salesChannels||[]).join(", ")} onChange=${v=>setCatalog("salesChannels",v.split(",").map(x=>x.trim()).filter(Boolean))}/>
      <${Toggle} label="Active Placement" value=${catalog.active!==false} onChange=${v=>setCatalog("active",v)}/>
    </div>`:null}
    ${tab==="publishing"?html`<div>
      <div className="formgrid three">
        <${Field} label="SEO Title" value=${rec.seo?.title||rec.seo?.seoTitle||""} onChange=${v=>update("seo.title",v)}/>
        <${Field} label="Canonical URL" type="url" value=${rec.seo?.canonicalUrl||""} onChange=${v=>update("seo.canonicalUrl",v)}/>
        <${Toggle} label="Exclude from Search Engines" value=${rec.seo?.noIndex===true} onChange=${v=>update("seo.noIndex",v)}/>
        <${Field} label="SEO Description" type="textarea" value=${rec.seo?.description||rec.seo?.seoDescription||""} onChange=${v=>update("seo.description",v)} full=${true}/>
        <${Field} label="SEO Keywords — one per line" type="textarea" value=${Array.isArray(rec.seo?.keywords)?rec.seo.keywords.join("\\n"):""} onChange=${v=>update("seo.keywords",v.split("\\n").map(x=>x.trim()).filter(Boolean))}/>
        <${Field} label="Review Status" type="select" options=${SMART_ENUMS.reviewstatus} value=${rec.publication?.reviewStatus||"NOT_REVIEWED"} onChange=${v=>update("publication.reviewStatus",v)}/>
        <${Field} label="Publish Date" type="date" value=${rec.publication?.publishAt||""} onChange=${v=>update("publication.publishAt",v)}/>
        <${Field} label="Unpublish Date" type="date" value=${rec.publication?.unpublishAt||""} onChange=${v=>update("publication.unpublishAt",v)}/>
        <${Field} label="Content Owner" value=${rec.publication?.owner||""} onChange=${v=>update("publication.owner",v)}/>
        <${Field} label="Approved By" value=${rec.publication?.approvedBy||""} onChange=${v=>update("publication.approvedBy",v)}/>
        <${Field} label="Source" type="select" options=${smartOptions("source",rec.source||"SKANDI")||[]} value=${rec.source||"SKANDI"} onChange=${v=>update("source",v)}/>
        <${Field} label="Source Reference" value=${rec.sourceReference||""} onChange=${v=>update("sourceReference",v)}/>
      </div>
      <div className="hr"></div><div className="sectiontitle">Additional SEO Fields</div>
      <${SmartObjectEditor} value=${rec.seo||{}} exclude=${["title","seoTitle","canonicalUrl","noIndex","description","seoDescription","keywords"]} onChange=${v=>setSection("seo",v)}/>
      <div className="hr"></div><div className="sectiontitle">Additional Publication Fields</div>
      <${SmartObjectEditor} value=${rec.publication||{}} exclude=${["reviewStatus","publishAt","unpublishAt","owner","approvedBy"]} onChange=${v=>setSection("publication",v)}/>
    </div>`:null}
  <//>`;
}




function safeUrl(url){const v=text(url);return /^https?:\/\//i.test(v)?v:""}
function ProviderDetailGrid({resource,type}){
  const rows=[];
  const add=(label,value,kind="text")=>{if(value===undefined||value===null||value===""||(Array.isArray(value)&&!value.length))return;rows.push({label,value,kind})};
  add("Duffel ID",resource?.id);
  add("Name",resource?.name);
  add("IATA code",resource?.iataCode);
  add("ICAO code",resource?.icaoCode);
  add("Country",resource?.iataCountryCode||resource?.location?.address?.countryCode);
  add("City",resource?.cityName||resource?.location?.address?.cityName);
  add("Time zone",resource?.timeZone);
  add("Latitude",resource?.latitude??resource?.location?.latitude);
  add("Longitude",resource?.longitude??resource?.location?.longitude);
  add("Rating",resource?.rating);
  add("Review score",resource?.reviewScore);
  add("Review count",resource?.reviewCount);
  add("Brand",resource?.brand?.name);
  add("Brand ID",resource?.brand?.id);
  add("Chain",resource?.chain?.name);
  add("Chain ID",resource?.chain?.id);
  add("Loyalty programme",resource?.supportedLoyaltyProgramme);
  add("Phone",resource?.phoneNumber);
  add("Email",resource?.email);
  add("Conditions of carriage",resource?.conditionsOfCarriageUrl,"url");
  add("Logo symbol",resource?.logoSymbolUrl,"url");
  add("Logo lockup",resource?.logoLockupUrl,"url");
  add("Airports",Array.isArray(resource?.airports)?resource.airports.map(x=>`${x.iataCode||""} ${x.name||""}`.trim()).join(", "):"");
  add("Address",resource?.location?.address?[resource.location.address.lineOne,resource.location.address.cityName,resource.location.address.region,resource.location.address.postalCode,resource.location.address.countryCode].filter(Boolean).join(", "):"");
  return html`<div className="detailgrid">${rows.map(r=>html`<div className="detailcell"><small>${r.label}</small><div>${r.kind==="url"&&safeUrl(r.value)?html`<a href=${r.value} target="_blank" rel="noreferrer">${r.value}</a>`:text(r.value)}</div></div>`)}</div>`
}


function ProviderWorkspace({boot,setBusy,setToast}){
  const [mode,setMode]=useState("collection");
  const [resourceType,setResourceType]=useState("HOTEL");
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [detail,setDetail]=useState(null);
  const [editor,setEditor]=useState(null);
  const [destinationId,setDestinationId]=useState("");
  const [areaId,setAreaId]=useState("");
  const [countryId,setCountryId]=useState("");
  const [rates,setRates]=useState([]);
  const [rateEdit,setRateEdit]=useState(null);
  const [rateLookup,setRateLookup]=useState("");
  const [rateLookupResults,setRateLookupResults]=useState([]);
  const destinations=(boot.records||[]).filter(r=>r.entityType==="DESTINATION"&&r.status!=="ARCHIVED");
  const areas=(boot.records||[]).filter(r=>r.entityType==="AREA"&&r.status!=="ARCHIVED");
  const countries=(boot.records||[]).filter(r=>r.entityType==="COUNTRY"&&r.status!=="ARCHIVED");
  const typeOptions=[["HOTEL","Hotels"],["AIRLINE","Airlines"],["AIRPORT","Airports"],["DESTINATION","Destinations / Cities"],["AIRCRAFT","Aircraft reference"]];


  async function search(){
    if(resourceType==="HOTEL"&&query.trim().length<3)return setToast("Enter at least 3 characters for a hotel search.",true);
    if(["AIRPORT","DESTINATION"].includes(resourceType)&&!query.trim())return setToast("Enter an airport, city or IATA code.",true);
    try{setBusy(`Searching Duffel ${resourceType.toLowerCase()} data…`);const r=await request("INVENTORY_PROVIDER_SEARCH",{resourceType,query:query.trim(),limit:60});setResults(r.items||[]);setDetail(null);if(!(r.items||[]).length)setToast("Duffel returned no matching resources.")}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function inspect(item){
    try{setBusy("Loading Duffel source record…");const r=await request("INVENTORY_PROVIDER_GET_RESOURCE",{resourceType:item.entityType,providerId:item.providerId});setDetail(r)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function openExisting(item){
    const existing=item?.existingRecord;if(!existing?.id)return;
    try{setBusy("Opening SKANDI Collection record…");const r=await request("INVENTORY_V9_GET_RECORD",{id:existing.id,entityType:item.entityType});setEditor(r)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function importItem(item,{linkExisting=false}={}){
    if(item.entityType==="AIRCRAFT")return setToast("Aircraft is reference-only here. Use Aircraft & Cabin Studio for SKANDI aircraft configuration.",true);
    if(item.importSupported===false)return setToast("This Duffel resource cannot be imported safely into the current SKANDI schema.",true);
    if(linkExisting&&!confirm(`Link Duffel ${item.name} to the existing SKANDI ${item.entityType.toLowerCase()} record?`))return;
    if(!linkExisting&&!confirm(`Add ${item.name} to the SKANDI Collection as DRAFT?`))return;
    const payload={resourceType:item.entityType,providerId:item.providerId,linkExisting};
    if(item.entityType==="HOTEL"){if(destinationId)payload.destinationId=destinationId;if(areaId)payload.areaId=areaId}
    if(item.entityType==="DESTINATION"&&countryId)payload.parentEntityId=countryId;
    try{
      setBusy(linkExisting?"Linking Duffel source…":"Adding to SKANDI Collection…");
      const r=await request("INVENTORY_PROVIDER_IMPORT",payload);
      if(r.conflict){setToast("A matching SKANDI record already exists. Use Link Duffel instead.",true);return}
      setToast(r.alreadyExists?"This resource is already in the SKANDI Collection.":(r.linked?"Duffel source linked to the existing SKANDI record.":"Added to SKANDI Collection as DRAFT."));
      const record=r.bundle?.record||r.bundle?.bundle?.record;
      if(record?.id){const full=await request("INVENTORY_V9_GET_RECORD",{id:record.id,entityType:item.entityType});setEditor(full)}
      const refreshed=await request("INVENTORY_PROVIDER_SEARCH",{resourceType,query:query.trim(),limit:60});setResults(refreshed.items||[]);
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function refreshSource(item){
    const existing=item?.existingRecord;if(!existing?.id)return;
    if(!confirm(`Refresh Duffel source data for ${existing.name||item.name}? SKANDI editorial/media fields will be preserved.`))return;
    try{setBusy("Refreshing Duffel source snapshot…");await request("INVENTORY_PROVIDER_REFRESH",{entityType:item.entityType,id:existing.id});setToast("Duffel source refreshed. SKANDI enrichment was preserved.");const r=await request("INVENTORY_PROVIDER_SEARCH",{resourceType,query:query.trim(),limit:60});setResults(r.items||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function loadRates(){
    try{setBusy("Loading Duffel negotiated rates…");const r=await request("INVENTORY_NEGOTIATED_RATES_LIST",{limit:200});setRates(r.items||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  useEffect(()=>{if(mode==="rates"&&!rates.length)loadRates()},[mode]);
  function newRate(){setRateEdit({id:"",displayName:"",rateAccessCode:"",liveMode:false,scope:"accommodations",chainId:"",accommodationIds:[]})}
  async function editRate(row){
    try{setBusy("Loading negotiated rate…");const r=await request("INVENTORY_NEGOTIATED_RATE_GET",{id:row.id});const x=r.item||row;setRateEdit({...x,scope:x.chainId?"chain":"accommodations",accommodationIds:x.accommodationIds||[]})}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function saveRate(){
    const x=rateEdit||{};const payload={id:x.id,displayName:x.displayName,rateAccessCode:x.rateAccessCode};
    if(x.scope==="chain")payload.chainId=x.chainId;else payload.accommodationIds=x.accommodationIds||[];
    try{setBusy(x.id?"Updating negotiated rate…":"Creating negotiated rate…");await request(x.id?"INVENTORY_NEGOTIATED_RATE_UPDATE":"INVENTORY_NEGOTIATED_RATE_CREATE",payload);setRateEdit(null);setRateLookupResults([]);setToast(x.id?"Negotiated rate updated.":"Negotiated rate created.");await loadRates()}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function deleteRate(row){
    if(!confirm(`Delete negotiated rate ${row.displayName}? This changes your Duffel organisation configuration.`))return;
    try{setBusy("Deleting negotiated rate…");await request("INVENTORY_NEGOTIATED_RATE_DELETE",{id:row.id});setToast("Negotiated rate deleted.");await loadRates()}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function searchRateHotels(){
    if(rateLookup.trim().length<3)return setToast("Enter at least 3 characters to find a hotel.",true);
    try{setBusy("Searching Duffel hotels…");const r=await request("INVENTORY_PROVIDER_SEARCH",{resourceType:"HOTEL",query:rateLookup.trim(),limit:25});setRateLookupResults(r.items||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function chooseRateHotel(item,scope){
    try{
      setBusy("Loading hotel source details…");const r=await request("INVENTORY_PROVIDER_GET_RESOURCE",{resourceType:"HOTEL",providerId:item.providerId});const hotel=r.resource||{};
      if(scope==="chain"){
        if(!hotel.chain?.id)return setToast("Duffel did not return a hotel-chain ID for this accommodation.",true);
        setRateEdit(x=>({...x,scope:"chain",chainId:hotel.chain.id,accommodationIds:[]}));setToast(`Using chain ${hotel.chain.name||hotel.chain.id}.`)
      }else{
        setRateEdit(x=>({...x,scope:"accommodations",chainId:"",accommodationIds:Array.from(new Set([...(x.accommodationIds||[]),item.providerId]))}));setToast(`${item.name} added to the negotiated-rate scope.`)
      }
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  function removeAccommodation(id){setRateEdit(x=>({...x,accommodationIds:(x.accommodationIds||[]).filter(v=>v!==id)}))}


  const detailItem=detail?.item||null, detailResource=detail?.resource||null;
  return html`<div>
    <div className="providerhero"><div><h2>Duffel + SKANDI Collection</h2><p>Search the live Duffel resource catalogue, review the provider record, then deliberately add only selected resources to the SKANDI Collection. Supabase remains the curated SKANDI layer, not a copy of Duffel.</p></div><span className="sourcebadge">LIVE PROVIDER SOURCE</span></div>
    <div className="tabs">${[["collection","Collection Import"],["rates","Negotiated Hotel Rates"]].map(([k,l])=>html`<button className=${`tab ${mode===k?"active":""}`} onClick=${()=>setMode(k)}>${l}</button>`)}</div>


    ${mode==="collection"?html`<div className="grid">
      <div className="card panel"><div className="paneltitle"><span>Find a Duffel resource</span><span className="matchtag duffel">Duffel source</span></div>
        <div className="formgrid three"><${Field} label="Resource type" type="select" value=${resourceType} options=${typeOptions.map(([value,label])=>({value,label}))} onChange=${v=>{setResourceType(v);setResults([]);setDetail(null)}}/><${Field} label="Search" full=${true} value=${query} onChange=${setQuery} help=${resourceType==="HOTEL"?"Hotel name, city or property search term":"Name, city, IATA/ICAO or aircraft code"}/><div className="field"><label>Search Duffel</label><button className="btn primary" onClick=${search}>Search provider</button></div></div>
        ${resourceType==="DESTINATION"?html`<div className="scopebox" style=${{marginTop:"10px"}}><div className="sectiontitle">Import geography</div><div className="field"><label>Parent country for new SKANDI destination</label><select className="select" value=${countryId} onChange=${e=>setCountryId(e.target.value)}><option value="">No parent yet · keep Draft</option>${countries.map(r=>html`<option value=${r.id}>${r.code} · ${r.name}</option>`)}</select></div></div>`:null}
        ${resourceType==="HOTEL"?html`<div className="scopebox" style=${{marginTop:"10px"}}><div className="sectiontitle">Optional SKANDI geography</div><div className="formgrid"><div className="field"><label>Destination</label><select className="select" value=${destinationId} onChange=${e=>setDestinationId(e.target.value)}><option value="">Assign later</option>${destinations.map(r=>html`<option value=${r.id}>${r.code} · ${r.name}</option>`)}</select></div><div className="field"><label>Area / Resort</label><select className="select" value=${areaId} onChange=${e=>setAreaId(e.target.value)}><option value="">Assign later</option>${areas.map(r=>html`<option value=${r.id}>${r.code} · ${r.name}</option>`)}</select></div></div></div>`:null}
      </div>
      <div className="card panel"><div className="paneltitle"><span>Search results</span><span className="pill">${results.length}</span></div>
        ${results.length?html`<div className="tablewrap"><table className="table"><thead><tr><th>Resource</th><th>Code</th><th>Duffel ID</th><th>SKANDI status</th><th></th></tr></thead><tbody>${results.map(item=>html`<tr><td><div className="providerresult"><div className="providerlogo">${item.preview?.logoSymbolUrl?html`<img src=${item.preview.logoSymbolUrl}/>`:html`<b>${item.code||item.entityType.slice(0,3)}</b>`}</div><div><b>${item.name||"Unnamed resource"}</b><div className="sub">${item.secondary||item.providerResourceType}</div></div></div></td><td><b>${item.code||"—"}</b></td><td>${item.providerId}</td><td>${item.alreadyInSkandiCollection?html`<span className="matchtag collection">In SKANDI Collection</span>`:item.canonicalMatch?html`<span className="matchtag match">Existing SKANDI match</span>`:item.importSupported===false?html`<span className="matchtag block">Reference only</span>`:html`<span className="matchtag duffel">Duffel only</span>`}</td><td><div className="provideractions"><button className="btn small" onClick=${()=>inspect(item)}>Details</button>${item.alreadyInSkandiCollection?html`<button className="btn small" onClick=${()=>openExisting(item)}>Open</button><button className="btn small" onClick=${()=>refreshSource(item)}>Refresh Duffel</button>`:item.canonicalMatch?html`<button className="btn small cyan" onClick=${()=>importItem(item,{linkExisting:true})}>Link Duffel</button>`:item.importSupported!==false?html`<button className="btn small primary" onClick=${()=>importItem(item)}>Add to Collection</button>`:null}</div></td></tr>`)}</tbody></table></div>`:html`<div className="empty">Search Duffel to find hotels, airlines, airports, destinations/cities or aircraft references.</div>`}
      </div>
    </div>`:null}


    ${mode==="rates"?html`<div className="grid"><div className="card panel"><div className="paneltitle"><span>Negotiated hotel rates</span><div className="toolbar"><button className="btn" onClick=${loadRates}>Refresh</button><button className="btn primary" onClick=${newRate}>+ Negotiated Rate</button></div></div><div className="notice">These are Duffel organisation commercial settings, not Supabase inventory records. Creating, updating or deleting a rate changes your Duffel Stays configuration.</div><div className="tablewrap" style=${{marginTop:"12px"}}><table className="table"><thead><tr><th>Display name</th><th>RAC</th><th>Environment</th><th>Scope</th><th>Duffel ID</th><th></th></tr></thead><tbody>${rates.length?rates.map(r=>html`<tr><td><b>${r.displayName}</b></td><td>${r.rateAccessCode}</td><td>${r.liveMode?"LIVE":"TEST"}</td><td>${r.chainId?`Chain · ${r.chainId}`:`${(r.accommodationIds||[]).length} accommodation(s)`}</td><td>${r.id}</td><td><div className="provideractions"><button className="btn small" onClick=${()=>editRate(r)}>Edit</button><button className="btn small danger" onClick=${()=>deleteRate(r)}>Delete</button></div></td></tr>`):html`<tr><td colSpan="6"><div className="empty">No negotiated rates returned by Duffel.</div></td></tr>`}</tbody></table></div></div></div>`:null}


    ${detail?html`<${Modal} title=${`Duffel Source · ${detailItem?.name||detailResource?.name||resourceType}`} onClose=${()=>setDetail(null)} actions=${html`<button className="btn" onClick=${()=>setDetail(null)}>Close</button>`}><div className="notice">Provider data is displayed for review. Importing creates or links a DRAFT SKANDI Collection record; provider URLs/images are not copied into the SKANDI Asset Library.</div><div className="hr"></div><${ProviderDetailGrid} resource=${detailResource||detailItem?.preview||{}} type=${detail?.entityType||resourceType}/>${detailResource?.description?html`<div><div className="hr"></div><div className="sectiontitle">Provider description</div><div className="notice">${detailResource.description}</div></div>`:null}</${Modal}>`:null}


    ${editor?html`<${RecordEditor} bundle=${editor.bundle||editor} languages=${boot.languages||["EN"]} records=${boot.records||[]} onClose=${()=>setEditor(null)} onSaved=${()=>{}} setBusy=${setBusy} setToast=${setToast}/>`:null}


    ${rateEdit?html`<${Modal} title=${rateEdit.id?"Edit Negotiated Hotel Rate":"Create Negotiated Hotel Rate"} onClose=${()=>{setRateEdit(null);setRateLookupResults([])}} actions=${html`<button className="btn" onClick=${()=>{setRateEdit(null);setRateLookupResults([])}}>Cancel</button><button className="btn primary" onClick=${saveRate}>${rateEdit.id?"Save Changes":"Create Rate"}</button>`}><div className="formgrid three"><${Field} label="Display name" value=${rateEdit.displayName} onChange=${v=>setRateEdit(x=>({...x,displayName:v}))}/><${Field} label="Rate access code (RAC)" value=${rateEdit.rateAccessCode} disabled=${Boolean(rateEdit.id)} onChange=${v=>setRateEdit(x=>({...x,rateAccessCode:v.toUpperCase()}))} help=${rateEdit.id?"Duffel does not allow changing the RAC after creation.":"Provided by the hotel/chain."}/><${Field} label="Scope" type="select" value=${rateEdit.scope} options=${[{value:"accommodations",label:"Specific accommodations"},{value:"chain",label:"Hotel chain"}]} onChange=${v=>setRateEdit(x=>({...x,scope:v,chainId:v==="chain"?x.chainId:"",accommodationIds:v==="accommodations"?x.accommodationIds:[]}))}/></div>
      <div className="scopebox" style=${{marginTop:"12px"}}><div className="sectiontitle">Find the Duffel hotel / chain</div><div className="filters"><div className="field grow"><label>Hotel search</label><input className="input" value=${rateLookup} onInput=${e=>setRateLookup(e.target.value)} placeholder="Search a hotel to retrieve its Duffel accommodation and chain IDs"/></div><button className="btn" onClick=${searchRateHotels}>Search hotels</button></div>${rateLookupResults.length?html`<div className="tablewrap" style=${{marginTop:"10px"}}><table className="table"><thead><tr><th>Hotel</th><th>Duffel ID</th><th></th></tr></thead><tbody>${rateLookupResults.map(item=>html`<tr><td><b>${item.name}</b><div className="sub">${item.secondary}</div></td><td>${item.providerId}</td><td><div className="provideractions"><button className="btn small" onClick=${()=>chooseRateHotel(item,"accommodations")}>Add Hotel</button><button className="btn small" onClick=${()=>chooseRateHotel(item,"chain")}>Use Its Chain</button></div></td></tr>`)}</tbody></table></div>`:null}</div>
      ${rateEdit.scope==="chain"?html`<div className="field" style=${{marginTop:"12px"}}><label>Duffel chain ID</label><input className="input" value=${rateEdit.chainId||""} onInput=${e=>setRateEdit(x=>({...x,chainId:e.target.value}))} placeholder="chn_…"/><small>Use “Use Its Chain” above to populate this from a Duffel accommodation.</small></div>`:html`<div style=${{marginTop:"12px"}}><div className="field"><label>Duffel accommodation IDs</label><textarea className="textarea" value=${(rateEdit.accommodationIds||[]).join("\n")} onInput=${e=>setRateEdit(x=>({...x,accommodationIds:e.target.value.split(/[\n,]+/).map(v=>v.trim()).filter(Boolean)}))} placeholder="acc_… one per line"/></div><div className="selectedlist">${(rateEdit.accommodationIds||[]).map(id=>html`<span className="selectedchip">${id}<button onClick=${()=>removeAccommodation(id)}>×</button></span>`)}</div></div>`}
      <div className="notice" style=${{marginTop:"12px"}}>Create requires a display name, RAC, and exactly one scope: either one chain or one or more accommodations. Duffel determines whether the rate is test or live mode.</div></${Modal}>`:null}
  </div>`
}


function MasterRecords({boot,setBoot,setBusy,setToast}){
  const [type,setType]=useState("");
  const [tourSubtype,setTourSubtype]=useState("");
  const [search,setSearch]=useState("");
  const [editor,setEditor]=useState(null);
  const matchesType=r=>!type||(type==="TOURS_ACTIVITIES"?["GUIDED_TOUR","ACTIVITY"].includes(r.entityType)&&(!tourSubtype||r.entityType===tourSubtype):r.entityType===type);
  const records=(boot.records||[]).filter(r=>matchesType(r)&&(!search||[r.code,r.name,r.slug,r.entityType].join(" ").toLowerCase().includes(search.toLowerCase())));
  async function open(r){
    try{setBusy("Loading complete record…");const x=await request("INVENTORY_V9_GET_RECORD",{id:r.id,entityType:r.entityType});setEditor(x)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function archived(r,e){
    e.stopPropagation();if(!confirm(`Archive ${r.name}?`))return;
    try{setBusy("Archiving record…");await request("INVENTORY_V9_ARCHIVE_RECORD",{id:r.id,entityType:r.entityType});setToast("Record archived.")}catch(err){setToast(err.message,true)}finally{setBusy("")}
  }
  const createButtons=type==="TOURS_ACTIVITIES"
    ?html`<div className="toolbar"><button className="btn primary" onClick=${()=>setEditor(recordBundle("GUIDED_TOUR"))}>+ New Guided Tour</button><button className="btn primary" onClick=${()=>setEditor(recordBundle("ACTIVITY"))}>+ New Activity</button></div>`
    :html`<button className="btn primary" onClick=${()=>{if(!type)return setToast("Choose a record family first.",true);setEditor(recordBundle(type))}}>+ New ${type?(LABEL[type]||type).replace(/s$/," ").trim():"Record"}</button>`;
  return html`<div className="card panel">
    <div className="paneltitle"><span>Master & Reference Records</span>${createButtons}</div>
    <div className="filters"><div className="field w240"><label>Record Family</label><select className="select" value=${type} onChange=${e=>{setType(e.target.value);setTourSubtype("")}}><option value="">All</option>${MASTER_FILTERS.map(t=>html`<option value=${t}>${MASTER_FILTER_LABEL[t]}</option>`)}</select></div>${type==="TOURS_ACTIVITIES"?html`<div className="field w240"><label>Product Type</label><select className="select" value=${tourSubtype} onChange=${e=>setTourSubtype(e.target.value)}><option value="">All Tours & Activities</option><option value="GUIDED_TOUR">Guided Tour</option><option value="ACTIVITY">Activity</option></select></div>`:null}<div className="field grow"><label>Search</label><input className="input" value=${search} onInput=${e=>setSearch(e.target.value)} placeholder="Code, title, slug or type"/></div></div>
    <div className="tablewrap"><table className="table"><thead><tr><th>Type</th><th>Code</th><th>Title</th><th>Status</th><th>Customer</th><th>ALTEA</th><th>Updated</th><th></th></tr></thead><tbody>
      ${records.length?records.map(r=>html`<tr className="clickrow" onClick=${()=>open(r)}><td>${r.entityType==="GUIDED_TOUR"?"Guided Tour":r.entityType==="ACTIVITY"?"Activity":r.entityType}</td><td><b>${r.code}</b></td><td>${r.name}</td><td>${statusPill(r.status)}</td><td>${r.customerVisible?"Yes":"No"}</td><td>${r.alteaVisible?"Yes":"No"}</td><td>${text(r.updatedAt).slice(0,10)}</td><td><button className="btn small danger" onClick=${e=>archived(r,e)}>Archive</button></td></tr>`):html`<tr><td colSpan="8"><div className="empty">No matching records.</div></td></tr>`}
    </tbody></table></div>
    ${editor?html`<${RecordEditor} bundle=${editor.bundle||editor} languages=${boot.languages||["EN"]} records=${boot.records||[]} onClose=${()=>setEditor(null)} onSaved=${()=>{}} setBusy=${setBusy} setToast=${setToast}/>`:null}
  </div>`
}


function DatedInventory({boot,setBusy,setToast}){
  const [family,setFamily]=useState("");
  const [entity,setEntity]=useState("");
  const [edit,setEdit]=useState(null);
  const [liveDated,setLiveDated]=useState(()=>Array.isArray(boot.dated)?boot.dated:[]);
  const [lastSync,setLastSync]=useState(null);
  const syncInFlight=useRef(false);
  const mountedRef=useRef(true);
  const allSellable=(boot.records||[]).filter(r=>SELLABLE.has(r.entityType));
  const matchesFamily=r=>!family||(family==="TOURS_ACTIVITIES"?["GUIDED_TOUR","ACTIVITY"].includes(r.entityType):r.entityType===family);
  const sellable=allSellable.filter(matchesFamily);
  const rows=liveDated.filter(r=>{
    if(entity)return r.entityId===entity;
    if(!family)return true;
    const product=allSellable.find(x=>x.id===r.entityId);return product&&matchesFamily(product);
  });
  const master=allSellable.find(r=>r.id===entity);


  async function loadDated({silent=false,entityId=entity}={}){
    if(syncInFlight.current)return;
    syncInFlight.current=true;
    try{
      if(!silent)setBusy("Refreshing dated capacity…");
      const result=await request("INVENTORY_V9_GET_DATED",entityId?{entityId}:{});
      const next=Array.isArray(result?.inventory)?result.inventory:Array.isArray(result?.dated)?result.dated:[];
      if(mountedRef.current){setLiveDated(next);setLastSync(new Date())}
    }catch(e){
      if(!silent&&mountedRef.current)setToast(e.message,true);
    }finally{
      syncInFlight.current=false;
      if(!silent&&mountedRef.current)setBusy("");
    }
  }


  useEffect(()=>{
    setLiveDated(Array.isArray(boot.dated)?boot.dated:[]);
  },[boot.dated]);


  useEffect(()=>{
    mountedRef.current=true;
    loadDated({silent:true,entityId:entity});
    const timer=setInterval(()=>loadDated({silent:true,entityId:entity}),15000);
    const onFocus=()=>loadDated({silent:true,entityId:entity});
    const onVisibility=()=>{if(document.visibilityState==="visible")loadDated({silent:true,entityId:entity})};
    window.addEventListener("focus",onFocus);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      mountedRef.current=false;
      clearInterval(timer);
      window.removeEventListener("focus",onFocus);
      document.removeEventListener("visibilitychange",onVisibility);
    };
  },[entity]);


  async function save(){
    try{
      setBusy("Saving dated inventory…");
      await request("INVENTORY_V9_SAVE_DATED",{row:edit});
      setEdit(null);
      await loadDated({silent:true,entityId:entity});
      setToast("Dated inventory saved.");
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function del(row){
    if(!confirm("Delete this dated inventory row?"))return;
    try{
      setBusy("Deleting dated inventory…");
      await request("INVENTORY_V9_DELETE_DATED",{id:row.id});
      await loadDated({silent:true,entityId:entity});
      setToast("Dated inventory deleted.");
    }catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  const newRow=()=>{if(!entity)return setToast("Choose a product first.",true);setEdit({id:"",entityId:entity,inventoryType:master?.entityType||"GENERAL",serviceDate:"",startTime:"",endTime:"",variantCode:"",variantName:"",capacityTotal:0,held:0,sold:0,waitlistLimit:0,overbookingLimit:0,stopSale:false,blackout:false,status:"OPEN",supplierCost:0,publicPrice:0,adultPrice:0,childPrice:0,infantPrice:0,privatePrice:0,currency:"USD",priceBasis:"PER_PERSON",bookingCutoffHours:0,minStay:0,maxStay:0,releaseDays:0,supplierReference:"",payload:{}})};
  return html`<div className="card panel"><div className="paneltitle"><span>${family==="TOURS_ACTIVITIES"?"Tours & Activities Inventory":"Dated Capacity & Pricing"}</span><div className="toolbar"><span className="sub">${lastSync?`Live · ${lastSync.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}`:"Live sync starting…"}</span><button className="btn" onClick=${()=>loadDated({silent:false,entityId:entity})}>Refresh Capacity</button><button className="btn primary" onClick=${newRow}>+ Add Date / Variant</button></div></div>
    <div className="filters"><div className="field w240"><label>Product Family</label><select className="select" value=${family} onChange=${e=>{setFamily(e.target.value);setEntity("")}}><option value="">All sellable products</option><option value="HOTEL">Hotels</option><option value="TOURS_ACTIVITIES">Tours & Activities</option><option value="PARTNER_TICKET">Partner Tickets</option><option value="TRANSFER">Transfers</option><option value="CAR_RENTAL">Car Rental</option><option value="PACKAGE">Packages</option><option value="ANCILLARY">Ancillaries</option></select></div><div className="field grow"><label>Product</label><select className="select" value=${entity} onChange=${e=>setEntity(e.target.value)}><option value="">All in selected family</option>${sellable.map(r=>html`<option value=${r.id}>${r.entityType==="GUIDED_TOUR"?"Guided Tour":r.entityType==="ACTIVITY"?"Activity":r.entityType} · ${r.name}</option>`)}</select></div></div>
    <div className="tablewrap"><table className="table"><thead><tr><th>Date</th><th>Product</th><th>Variant</th><th>Capacity</th><th>Held</th><th>Sold</th><th>Available</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.length?rows.map(r=>html`<tr className="clickrow" onClick=${()=>setEdit(clone(r))}><td>${r.serviceDate}</td><td>${(boot.records||[]).find(x=>x.id===r.entityId)?.name||r.entityId}</td><td>${r.variantName||r.variantCode||"Default"}</td><td>${r.capacityTotal??0}</td><td>${r.held??0}</td><td>${r.sold??0}</td><td><b>${r.available??0}</b></td><td>${r.publicPrice??r.adultPrice??0} ${r.currency||""}</td><td>${statusPill(r.status)}</td><td><button className="btn small danger" onClick=${e=>{e.stopPropagation();del(r)}}>Delete</button></td></tr>`):html`<tr><td colSpan="10"><div className="empty">No dated inventory exists yet. Zero rows is a valid state until capacity is loaded.</div></td></tr>`}
    </tbody></table></div>
    ${edit?html`<${Modal} title="Dated Inventory" onClose=${()=>setEdit(null)} actions=${html`<button className="btn small cyan" onClick=${save}>Save</button>`}><div className="formgrid three">
      ${[["Service Date","serviceDate","date"],["Start Time","startTime","time"],["End Time","endTime","time"],["Variant Code","variantCode"],["Variant Name","variantName"],["Capacity Total","capacityTotal","number"],["Held","held","number"],["Sold","sold","number"],["Waitlist Limit","waitlistLimit","number"],["Overbooking Limit","overbookingLimit","number"],["Public Price","publicPrice","number"],["Adult Price","adultPrice","number"],["Child Price","childPrice","number"],["Infant Price","infantPrice","number"],["Private Price","privatePrice","number"],["Supplier Cost","supplierCost","number"],["Currency","currency","select",ENUM.currency],["Price Basis","priceBasis","select",ENUM.priceBasis],["Booking Cutoff Hours","bookingCutoffHours","number"],["Minimum Stay","minStay","number"],["Maximum Stay","maxStay","number"],["Release Days","releaseDays","number"],["Supplier Reference","supplierReference"]].map(([label,k,t="text",opts=[]])=>html`<${Field} label=${label} type=${t} options=${opts} value=${edit[k]??""} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`)}
      <${Toggle} label="Stop Sale" value=${edit.stopSale===true} onChange=${v=>setEdit(x=>({...x,stopSale:v}))}/><${Toggle} label="Blackout" value=${edit.blackout===true} onChange=${v=>setEdit(x=>({...x,blackout:v}))}/>
    </div><div className="notice" style=${{marginTop:"12px"}}>Sold / available are read live from canonical dated inventory. Required numeric controls are stored as 0 when blank/not applicable; available and operational status are recalculated by Inventory Control on save.</div><div className="hr"></div><div className="sectiontitle">Additional Dated Inventory Controls</div><${SmartObjectEditor} value=${edit.payload||{}} onChange=${v=>setEdit(x=>({...x,payload:v}))}/></${Modal}>`:null}
  </div>`
}
function AirInventory({boot,setBusy,setToast}){
  const [kind,setKind]=useState("flight");
  const [edit,setEdit]=useState(null);
  const data=kind==="flight"?boot.air?.flight:kind==="class"?boot.air?.classes:kind==="schedule"?boot.air?.schedule:boot.air?.nesting;
  const configs={
    flight:[["flight_number","Flight"],["departure_date","Date"],["board_point","Origin"],["off_point","Destination"],["equipment_type","Equipment"],["physical_capacity","Capacity"],["yield_index","Yield Index"],["control_mode","Control Mode"],["revenue_band","Revenue Band"],["status","Status"]],
    class:[["flight_number","Flight"],["departure_date","Date"],["board_point","Origin"],["off_point","Destination"],["class_code","Class"],["cabin","Cabin"],["nest","Nest"],["authorized","Authorized"],["sold","Sold"],["available","Available"],["overbooking_limit","Overbooking"],["status","Status"]],
    schedule:[["season_code","Season"],["flight_number","Flight"],["days_of_operation","Days"],["board_point","Origin"],["off_point","Destination"],["via_point","Via"],["std","STD"],["sta","STA"],["equipment_type","Equipment"],["capacity","Capacity"],["effective_date","Effective"],["discontinue_date","Discontinue"],["status","Status"]],
    nesting:[["flight_number","Flight"],["departure_date","Date"],["board_point","Origin"],["off_point","Destination"],["class_code","Class"],["cabin","Cabin"],["nest","Nest"],["parent_class","Parent Class"],["bid_price","Bid Price"],["hurdle","Hurdle"],["authorized","Authorized"],["protection","Protection"],["status","Status"]]
  };
  const cols=configs[kind],rows=data||[];
  const airports=(boot.records||[]).filter(r=>r.entityType==="AIRPORT");
  const airportOptions=(current)=>optionList(airports.map(a=>({value:a.code,label:`${a.code} · ${a.name}`})),current);
  const equipmentOptions=(current)=>optionList([...new Map((boot.aircraft||[]).filter(a=>a.aircraftCode).map(a=>[a.aircraftCode,{value:a.aircraftCode,label:`${a.aircraftCode} · ${a.aircraftName||a.variant||"Aircraft"}`}])).values()],current);
  function editorFor(k,l){
    const value=edit[k]??"";
    if(["board_point","off_point","via_point"].includes(k))return html`<${Field} label=${l} type="select" options=${airportOptions(value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    if(k==="equipment_type")return html`<${Field} label=${l} type="select" options=${equipmentOptions(value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    if(k==="cabin")return html`<${Field} label=${l} type="select" options=${optionList(["FIRST","BUSINESS","PREMIUM_ECONOMY","ECONOMY"],value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    if(k==="status")return html`<${Field} label=${l} type="select" options=${optionList(["OPEN","CLOSED","ACTIVE","INACTIVE","CANCELLED"],value)} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
    const t=["physical_capacity","yield_index","nest","authorized","sold","available","overbooking_limit","capacity","bid_price","hurdle","protection"].includes(k)?"number":["departure_date","effective_date","discontinue_date"].includes(k)?"date":["std","sta"].includes(k)?"time":"text";
    return html`<${Field} label=${l} type=${t} value=${value} onChange=${v=>setEdit(x=>({...x,[k]:v}))}/>`;
  }
  async function save(){
    try{setBusy("Saving air inventory…");await request("INVENTORY_V9_SAVE_AIR_ROW",{kind,item:edit});setEdit(null);setToast("Air inventory saved.")}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  return html`<div className="card panel"><div className="paneltitle"><span>Air Inventory & Revenue Control</span><button className="btn primary" onClick=${()=>setEdit({status:"OPEN",payload:{}})}>+ New ${kind}</button></div>
    <div className="notice">Airport and equipment controls use canonical Inventory records. Existing legacy IATA/equipment values remain selectable until intentionally normalized.</div>
    <div className="tabs">${[["flight","Flight Legs"],["class","Booking Classes"],["schedule","Schedules"],["nesting","Nesting / Revenue"]].map(([k,l])=>html`<button className=${`tab ${kind===k?"active":""}`} onClick=${()=>setKind(k)}>${l}</button>`)}</div>
    <div className="tablewrap"><table className="table"><thead><tr>${cols.map(([k,l])=>html`<th>${l}</th>`)}</tr></thead><tbody>
      ${rows.length?rows.map(r=>html`<tr className="clickrow" onClick=${()=>setEdit(clone(r))}>${cols.map(([k])=>html`<td>${k==="status"?statusPill(r[k]):text(r[k])||"—"}</td>`)}</tr>`):html`<tr><td colSpan=${cols.length}><div className="empty">No ${kind} inventory rows have been loaded yet.</div></td></tr>`}
    </tbody></table></div>
    ${edit?html`<${Modal} title=${`Air Inventory · ${kind}`} onClose=${()=>setEdit(null)} actions=${html`<button className="btn small cyan" onClick=${save}>Save</button>`}><div className="formgrid three">${cols.map(([k,l])=>editorFor(k,l))}<div className="full"><div className="sectiontitle">Additional Air Inventory Controls</div><${SmartObjectEditor} value=${edit.payload||{}} onChange=${v=>setEdit(x=>({...x,payload:v}))}/></div></div></${Modal}>`:null}
  </div>`
}


function DraggableHotspot({item,index,onMove,onSelect}){
  const [drag,setDrag]=useState(false);
  function move(e){
    if(!drag)return;
    const rect=e.currentTarget.parentElement.getBoundingClientRect();
    const x=Math.max(0,Math.min(100,((e.clientX-rect.left)/rect.width)*100));
    const y=Math.max(0,Math.min(100,((e.clientY-rect.top)/rect.height)*100));
    onMove(x,y);
  }
  return html`<div className=${`hotspot ${drag?"dragging":""}`} style=${{left:`${item.x??50}%`,top:`${item.y??50}%`}} onPointerDown=${e=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag(true)}} onPointerMove=${move} onPointerUp=${()=>setDrag(false)} onClick=${e=>{e.stopPropagation();onSelect?.()}}>${index+1}<div className="hotlabel">${item.label||item.title||`Hotspot ${index+1}`}</div></div>`
}


function AircraftStudio({boot,setBusy,setToast}){
  const [filter,setFilter]=useState("");
  const [selected,setSelected]=useState(null);
  const [bundle,setBundle]=useState(null);
  const [mode,setMode]=useState("aircraft");
  const [childEdit,setChildEdit]=useState(null);
  const [activeView,setActiveView]=useState(null);
  const [placeHotspot,setPlaceHotspot]=useState(false);
  const list=(boot.aircraft||[]).filter(a=>!filter||[a.airlineCode,a.aircraftCode,a.aircraftName,a.manufacturer].join(" ").toLowerCase().includes(filter.toLowerCase()));
  async function open(a){
    try{setBusy("Opening aircraft digital twin…");const x=await request("INVENTORY_V9_GET_AIRCRAFT",{aircraftId:a.id});setSelected(a.id);setBundle(x);setActiveView(x.views?.[0]||null)}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function sync(){
    if(!confirm("Reconcile airline fleet templates with Aircraft & Cabin Studio? Existing curated imagery and content will be preserved."))return;
    try{setBusy("Reconciling aircraft and cabins…");const r=await request("INVENTORY_V9_SMART_SYNC_AIRCRAFT",{buildMissingCabins:true});setToast(r.message||"Fleet synchronization complete.")}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function saveAircraft(){
    try{setBusy("Saving aircraft…");const refs=bundle.aircraft?._assetRefs||{};const r=await request("INVENTORY_V9_SAVE_AIRCRAFT",{aircraft:bundle.aircraft});
      for(const [field,asset] of Object.entries(refs))if(asset?.id&&r.aircraft?.id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId:asset.id,system:"Inventory Control",recordType:"AIRCRAFT",recordId:r.aircraft.id,usageRole:field,fieldName:field})}catch(_){}
      setBundle(b=>({...b,aircraft:{...r.aircraft,_assetRefs:refs}}));setToast("Aircraft and Asset Library links saved.")}
    catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  async function saveChild(){
    try{setBusy("Saving cabin experience…");const refs=childEdit.item?._assetRefs||{};const saved=await request("INVENTORY_V9_SAVE_AIRCRAFT_CHILD",{kind:childEdit.kind,item:childEdit.item});
      for(const [field,asset] of Object.entries(refs))if(asset?.id&&saved.item?.id)try{await request("INVENTORY_ASSET_REGISTER_USAGE",{assetId:asset.id,system:"Inventory Control",recordType:`AIRCRAFT_${childEdit.kind.toUpperCase()}`,recordId:saved.item.id,usageRole:field,fieldName:field})}catch(_){}
      setChildEdit(null);const r=await request("INVENTORY_V9_GET_AIRCRAFT",{aircraftId:selected});setBundle(r);setActiveView(v=>r.views?.find(x=>x.id===v?.id)||r.views?.[0]||null);setToast("Cabin experience and Asset Library links saved.")}
    catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  if(!bundle){
    return html`<div className="card panel"><div className="paneltitle"><span>Aircraft & Cabin Studio</span><button className="btn cyan" onClick=${sync}>Smart Sync Fleet</button></div>
      <div className="notice">Aircraft Display Control is now part of Inventory Control. Airline fleet configuration, aircraft records, cabins, views, hotspots and walkthroughs are reconciled here as one product experience.</div>
      <div className="filters" style=${{marginTop:"12px"}}><div className="field grow"><label>Find Aircraft</label><input className="input" value=${filter} onInput=${e=>setFilter(e.target.value)} placeholder="Airline, code, family or aircraft"/></div></div>
      <div className="tablewrap"><table className="table"><thead><tr><th>Airline</th><th>Aircraft</th><th>Name</th><th>Seats</th><th>Status</th><th>Cabin Readiness</th></tr></thead><tbody>${list.map(a=>html`<tr className="clickrow" onClick=${()=>open(a)}><td><b>${a.airlineCode}</b></td><td>${a.aircraftCode}</td><td>${a.aircraftName}</td><td>${a.totalSeats??"—"}</td><td>${statusPill(a.status)}</td><td>${a.heroImageUrl||a.seatmapImageUrl?"Media linked":"Needs media"}</td></tr>`)}</tbody></table></div>
    </div>`
  }
  const a=bundle.aircraft,cabins=bundle.cabins||[],views=bundle.views||[],hotspots=bundle.hotspots||[],scenes=bundle.scenes||[];
  const seatTotal=cabins.reduce((s,c)=>s+(Number(c.seatCount)||0),0);
  const currentHotspots=activeView?hotspots.filter(h=>h.view_id===activeView.id):[];
  const setA=(k,v)=>setBundle(b=>({...b,aircraft:{...b.aircraft,[k]:v}}));
  const mapTotal=Math.max(1,seatTotal);
  const childFields={
    cabin:[["Cabin Code","cabin_code"],["Cabin Name","cabin_name"],["Seat Count","seat_count","number"],["Rank","rank","number"],["Summary","summary","textarea"],["Description","description","textarea"],["Meal Title","meal_title"],["Meal Description","meal_description","textarea"],["Sort Order","sort_order","number"]],
    view:[["Cabin ID","cabin_id"],["View Code","view_code"],["Label","label"],["View Type","view_type"],["Alt Text","alt_text"],["Caption","caption","textarea"],["Credit","credit"],["Sort Order","sort_order","number"]],
    hotspot:[["Hotspot Code","hotspot_code"],["Label","label"],["Title","title"],["Description","description","textarea"],["Action","action"],["Focus X %","focus_x","number"],["Focus Y %","focus_y","number"],["Focus Zoom","focus_zoom","number"],["Target Cabin Code","target_cabin_code"],["Sort Order","sort_order","number"]],
    scene:[["Scene Code","scene_code"],["Title","title"],["Short Title","short_title"],["Summary","summary","textarea"],["Forward Scene Code","forward_scene_code"],["Back Scene Code","back_scene_code"],["Forward Label","forward_label"],["Back Label","back_label"],["Sort Order","sort_order","number"]]
  };
  function setAircraftAsset(field,asset){setBundle(b=>({...b,aircraft:{...b.aircraft,[field]:asset.publicUrl||asset.previewUrl||"",_assetRefs:{...(b.aircraft?._assetRefs||{}),[field]:asset}}}))}
  function setChildAsset(field,asset){setChildEdit(d=>({...d,item:{...d.item,[field]:asset.publicUrl||asset.previewUrl||"",_assetRefs:{...(d.item?._assetRefs||{}),[field]:asset}}}))}
  function pointFromEvent(e){
    const rect=e.currentTarget.getBoundingClientRect();
    return{
      x:Math.max(0,Math.min(100,Math.round((((e.clientX-rect.left)/rect.width)*100)*10)/10)),
      y:Math.max(0,Math.min(100,Math.round((((e.clientY-rect.top)/rect.height)*100)*10)/10))
    };
  }
  function clickPlaceHotspot(e){
    if(!placeHotspot||!activeView)return;
    if(e.target.closest?.(".hotspot"))return;
    const point=pointFromEvent(e);
    setPlaceHotspot(false);
    startChild("hotspot",{view_id:activeView.id,hotspot_code:`HOT_${currentHotspots.length+1}`,label:"New hotspot",title:"",description:"",x:point.x,y:point.y,action:"DETAIL",active:true,sort_order:(currentHotspots.length+1)*10});
  }
  function startChild(kind,item={}){
    const base={...item,active:item.active!==false,sort_order:item.sort_order??100};
    if(kind==="cabin"&&!base.aircraft_id)base.aircraft_id=a.id;
    if(kind==="view"&&!base.aircraft_id)base.aircraft_id=a.id;
    if(kind==="scene"&&!base.aircraft_id)base.aircraft_id=a.id;
    if(kind==="hotspot"&&!base.view_id)base.view_id=activeView?.id||"";
    setChildEdit({kind,item:base});
  }
  return html`<div className="card panel"><div className="paneltitle"><span>${a.airlineCode} · ${a.aircraftName}</span><div className="toolbar"><button className="btn small" onClick=${()=>{setBundle(null);setSelected(null)}}>Back to Fleet</button><button className="btn small cyan" onClick=${sync}>Smart Sync</button><button className="btn small primary" onClick=${saveAircraft}>Save Aircraft</button></div></div>
    <div className="kpirow"><div className="kpi"><b>${a.totalSeats??"—"}</b> aircraft seats</div><div className="kpi"><b>${seatTotal}</b> cabin seats</div><div className="kpi"><b>${cabins.length}</b> cabins</div><div className="kpi"><b>${views.length}</b> views</div><div className="kpi"><b>${hotspots.length}</b> hotspots</div><div className="kpi"><b>${scenes.length}</b> walkthrough scenes</div></div>
    <div className="cabinmap" style=${{margin:"13px 0"}}>${cabins.length?cabins.map(c=>html`<div className="cabinzone" style=${{flex:`${Math.max(1,(Number(c.seatCount)||1)/mapTotal)}`}}><div><b>${c.cabinCode} · ${c.cabinName}</b><small>${c.seatCount??0} seats</small></div></div>`):html`<div className="empty">No cabin records.</div>`}</div>
    ${a.totalSeats!==null&&a.totalSeats!==seatTotal?html`<div className="notice warn">Seat reconciliation needs review: aircraft total is ${a.totalSeats}, while active cabins total ${seatTotal}.</div>`:null}
    <div className="tabs" style=${{marginTop:"12px"}}>${["aircraft","cabins","views","hotspots","walkthrough"].map(k=>html`<button className=${`tab ${mode===k?"active":""}`} onClick=${()=>setMode(k)}>${k[0].toUpperCase()+k.slice(1)}</button>`)}</div>
    ${mode==="aircraft"?html`<div className="split"><div className="formgrid">
      ${[["Aircraft Code","aircraftCode"],["Aircraft Name","aircraftName"],["Manufacturer","manufacturer"],["Family","family"],["Variant","variant"],["Total Seats","totalSeats","number"],["Display Title","displayTitle"],["Default Cabin Code","defaultCabinCode"],["Default View Type","defaultViewType"],["Walkthrough Title","walkthroughTitle"],["Walkthrough Subtitle","walkthroughSubtitle"],["Walkthrough Start Scene","walkthroughStartSceneCode"],["Accuracy Label","walkthroughAccuracyLabel"],["Source URL","sourceUrl"],["Review Notes","reviewNotes","textarea"]].map(([l,k,t="text"])=>html`<${Field} label=${l} type=${t} value=${a[k]??""} onChange=${v=>setA(k,v)}/>`)}
      <div className="full"><div className="sectiontitle">Aircraft Assets</div></div>
      <${AssetField} label="Hero Image" value=${a.heroImageUrl} assetId=${a._assetRefs?.heroImageUrl?.id} context=${assetContextForAircraft(boot,a,"Hero","hero_image_url")} onSelect=${asset=>setAircraftAsset("heroImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${AssetField} label="Exterior Image" value=${a.exteriorImageUrl} assetId=${a._assetRefs?.exteriorImageUrl?.id} context=${assetContextForAircraft(boot,a,"Exterior","exterior_image_url")} onSelect=${asset=>setAircraftAsset("exteriorImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${AssetField} label="Seat Map Image" value=${a.seatmapImageUrl} assetId=${a._assetRefs?.seatmapImageUrl?.id} context=${assetContextForAircraft(boot,a,"Seat Map","seatmap_image_url")} onSelect=${asset=>setAircraftAsset("seatmapImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${AssetField} label="Thumbnail Image" value=${a.thumbnailImageUrl} assetId=${a._assetRefs?.thumbnailImageUrl?.id} context=${assetContextForAircraft(boot,a,"Thumbnail","thumbnail_image_url")} onSelect=${asset=>setAircraftAsset("thumbnailImageUrl",asset)} setBusy=${setBusy} setToast=${setToast}/>
      <${Toggle} label="Customer Visible" value=${a.customerVisible===true} onChange=${v=>setA("customerVisible",v)}/><${Toggle} label="Active" value=${a.active!==false} onChange=${v=>setA("active",v)}/>
    </div><div><div className="preview">${a.heroImageUrl?html`<img src=${a.heroImageUrl}/>`:"Choose a hero image from the SKANDI Asset Library."}</div><div className="hr"></div><${ConfigurationEditor} value=${a.configuration||{}} onChange=${v=>setA("configuration",v)}/></div></div>`:null}
    ${mode==="cabins"?html`<div><div className="paneltitle"><span>Cabin Configuration</span><button className="btn small" onClick=${()=>startChild("cabin",{cabin_code:"Y",cabin_name:"Economy",seat_count:null})}>+ Cabin</button></div>${cabins.map(c=>html`<div className="childitem" onClick=${()=>startChild("cabin",c)}><b>${c.cabinCode} · ${c.cabinName}</b> · ${c.seatCount??0} seats <span className="sub">${c.summary||""}</span></div>`)}</div>`:null}
    ${mode==="views"?html`<div><div className="paneltitle"><span>Cabin Views & Images</span><button className="btn small" onClick=${()=>startChild("view",{view_code:`VIEW_${views.length+1}`,label:"Cabin view",view_type:"CABIN",image_url:""})}>+ View</button></div><div className="grid" style=${{gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>${views.map(v=>html`<div className="childitem"><div className="preview" onClick=${()=>{setActiveView(v);setMode("hotspots")}}>${v.image_url?html`<img src=${v.image_url} alt=${v.alt_text||""}/>`:"No image"}</div><div style=${{marginTop:"8px"}}><b>${v.label}</b> · ${v.view_type}</div><button className="btn small" onClick=${()=>startChild("view",v)}>Edit</button></div>`)}</div></div>`:null}
    ${mode==="hotspots"?html`<div><div className="paneltitle"><span>Interactive Hotspot Canvas</span><div className="toolbar"><select className="select w240" value=${activeView?.id||""} onChange=${e=>{setActiveView(views.find(v=>v.id===e.target.value)||null);setPlaceHotspot(false)}}>${views.map(v=>html`<option value=${v.id}>${v.label}</option>`)}</select><button className=${`btn small ${placeHotspot?"cyan":""}`} disabled=${!activeView} onClick=${()=>setPlaceHotspot(v=>!v)}>${placeHotspot?"Cancel Placement":"Click Image to Place Hotspot"}</button></div></div>
      ${activeView?html`<div className=${`studioimg ${placeHotspot?"place":""}`} onClick=${clickPlaceHotspot}>${activeView.image_url?html`<img src=${activeView.image_url}/>`:null}${currentHotspots.map((h,i)=>html`<${DraggableHotspot} item=${h} index=${i} onSelect=${()=>startChild("hotspot",h)} onMove=${(x,y)=>setBundle(b=>({...b,hotspots:b.hotspots.map(k=>k.id===h.id?{...k,x,y}:k)}))}/>`)} </div>
      <div className="positionbar"><span className=${`positionreadout ${placeHotspot?"placementon":""}`}>${placeHotspot?"Placement tool active — click the exact feature on the image":"Create: click “Click Image to Place Hotspot”. Reposition: drag an existing marker."}</span><span className="sub">Coordinates are calculated automatically and stored by the system.</span></div>`:html`<div className="empty">Create or select a cabin view first.</div>`}
    </div>`:null}
    ${mode==="walkthrough"?html`<div><div className="paneltitle"><span>Walkthrough Scenes</span><button className="btn small" onClick=${()=>startChild("scene",{scene_code:`SCENE_${scenes.length+1}`,title:"Cabin scene",image_url:""})}>+ Scene</button></div><div className="grid" style=${{gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>${scenes.map(s=>html`<div className="childitem"><div className="preview">${s.image_url?html`<img src=${s.image_url}/>`:"No image"}</div><div style=${{marginTop:"8px"}}><b>${s.title}</b><div className="sub">${s.summary||""}</div></div><button className="btn small" onClick=${()=>startChild("scene",s)}>Edit</button></div>`)}</div><div className="notice" style=${{marginTop:"12px"}}>Scene-to-scene navigation is stored on each walkthrough scene. Scene hotspots remain normalized child records and are preserved by Inventory Control even when you edit the scene itself.</div></div>`:null}
    ${childEdit?html`<${Modal} title=${`Aircraft Studio · ${childEdit.kind}`} onClose=${()=>setChildEdit(null)} actions=${html`<button className="btn small cyan" onClick=${saveChild}>Save</button>`}><div className="formgrid three">${childFields[childEdit.kind].map(([l,k,t="text"])=>html`<${Field} label=${l} type=${t} value=${childEdit.item[k]??""} onChange=${v=>setChildEdit(d=>({...d,item:{...d.item,[k]:v}}))}/>`)}
      ${childEdit.kind==="view"?html`<div className="full"><div className="sectiontitle">View Assets</div><${AssetField} label="Main Cabin View" value=${childEdit.item.image_url} assetId=${childEdit.item._assetRefs?.image_url?.id} context=${assetContextForAircraft(boot,a,"Cabin View","image_url",`Views / ${childEdit.item.label||childEdit.item.view_code||"Cabin"}`)} onSelect=${asset=>setChildAsset("image_url",asset)} setBusy=${setBusy} setToast=${setToast}/><${AssetField} label="Mobile Cabin View" value=${childEdit.item.mobile_image_url} assetId=${childEdit.item._assetRefs?.mobile_image_url?.id} context=${assetContextForAircraft(boot,a,"Cabin View Mobile","mobile_image_url",`Views / ${childEdit.item.label||childEdit.item.view_code||"Cabin"} / Mobile`)} onSelect=${asset=>setChildAsset("mobile_image_url",asset)} setBusy=${setBusy} setToast=${setToast}/><${AssetField} label="View Thumbnail" value=${childEdit.item.thumbnail_url} assetId=${childEdit.item._assetRefs?.thumbnail_url?.id} context=${assetContextForAircraft(boot,a,"Thumbnail","thumbnail_url",`Views / ${childEdit.item.label||childEdit.item.view_code||"Cabin"}`)} onSelect=${asset=>setChildAsset("thumbnail_url",asset)} setBusy=${setBusy} setToast=${setToast}/></div>`:null}
      ${childEdit.kind==="hotspot"?html`<div className="full"><div className="sectiontitle">Hotspot Asset</div><${AssetField} label="Hotspot Thumbnail" value=${childEdit.item.thumbnail_url} assetId=${childEdit.item._assetRefs?.thumbnail_url?.id} context=${assetContextForAircraft(boot,a,"Hotspot Thumbnail","thumbnail_url",`Hotspots / ${childEdit.item.label||childEdit.item.hotspot_code||"Feature"}`)} onSelect=${asset=>setChildAsset("thumbnail_url",asset)} setBusy=${setBusy} setToast=${setToast}/></div>`:null}
      ${childEdit.kind==="scene"?html`<div className="full"><div className="sectiontitle">Walkthrough Assets</div><${AssetField} label="Walkthrough Scene Image" value=${childEdit.item.image_url} assetId=${childEdit.item._assetRefs?.image_url?.id} context=${assetContextForAircraft(boot,a,"Walkthrough","image_url",`Walkthrough / ${childEdit.item.title||childEdit.item.scene_code||"Scene"}`)} onSelect=${asset=>setChildAsset("image_url",asset)} setBusy=${setBusy} setToast=${setToast}/><${AssetField} label="Mobile Walkthrough Image" value=${childEdit.item.mobile_image_url} assetId=${childEdit.item._assetRefs?.mobile_image_url?.id} context=${assetContextForAircraft(boot,a,"Walkthrough Mobile","mobile_image_url",`Walkthrough / ${childEdit.item.title||childEdit.item.scene_code||"Scene"} / Mobile`)} onSelect=${asset=>setChildAsset("mobile_image_url",asset)} setBusy=${setBusy} setToast=${setToast}/></div>`:null}
      <${Toggle} label="Active" value=${childEdit.item.active!==false} onChange=${v=>setChildEdit(d=>({...d,item:{...d.item,active:v}}))}/>${childEdit.kind==="hotspot"?html`<div className="full"><div className="positionbar"><span className="positionreadout">Image position: ${Number(childEdit.item.x??50).toFixed(1)}% × ${Number(childEdit.item.y??50).toFixed(1)}%</span><span className="sub">Position is set by clicking or dragging on the cabin image, not by manually entering X/Y.</span></div></div>`:null}${childEdit.kind==="cabin"?html`<div className="full"><${AmenitiesEditor} value=${childEdit.item.amenities||[]} onChange=${v=>setChildEdit(d=>({...d,item:{...d.item,amenities:v}}))}/></div>`:null}</div></${Modal}>`:null}
  </div>`
}


function Quality({boot,setBusy,setToast}){
  const [q,setQ]=useState(null);
  async function run(){
    try{setBusy("Running Inventory quality control…");setQ(await request("INVENTORY_V9_QUALITY",{}))}catch(e){setToast(e.message,true)}finally{setBusy("")}
  }
  useEffect(()=>{run()},[]);
  if(!q)return html`<div className="card panel"><div className="empty">Preparing quality report…</div></div>`;
  const issues=q.issues||{};
  return html`<div className="grid">
    <div className="card panel"><div className="paneltitle"><span>Publishing & Quality Control</span><button className="btn" onClick=${run}>Run Again</button></div>
      <div className="stats">${[["Canonical Records",q.counts?.canonical],["Searchable Catalog",q.counts?.searchableCatalog],["Aircraft",q.counts?.aircraft],["Cabins",q.counts?.cabins],["Cabin Views",q.counts?.views]].map(([l,v])=>html`<div className="stat"><span>${l}</span><strong>${v??0}</strong></div>`)}</div>
      <div className="notice">${q.aircraftSync?.missing?`${q.aircraftSync.missing} airline fleet templates still need an Aircraft record.`:"Aircraft master records are reconciled with current airline fleet templates."}</div>
    </div>
    ${[["Cabin seat mismatches",issues.cabinSeatMismatches],["Aircraft without cabins",issues.aircraftWithoutCabins],["Aircraft without views",issues.aircraftWithoutViews],["Published hotel/destination records without media",issues.publicRecordsWithoutMedia]].map(([title,rows])=>html`<div className="card panel"><div className="paneltitle"><span>${title}</span><span className="pill">${rows?.length||0}</span></div>${rows?.length?html`<div className="tablewrap"><table className="table"><tbody>${rows.slice(0,100).map(r=>html`<tr>${Object.entries(r).slice(0,6).map(([k,v])=>html`<td><b>${k}</b><br/>${text(v)}</td>`)}</tr>`)}</tbody></table></div>`:html`<div className="empty">No issues found.</div>`}</div>`)}
  </div>`
}


function Audit({setBusy,setToast}){
  const [rows,setRows]=useState([]);
  async function load(){try{setBusy("Loading audit…");const r=await request("INVENTORY_V9_GET_AUDIT",{limit:300});setRows(r.audit||[])}catch(e){setToast(e.message,true)}finally{setBusy("")}}
  useEffect(()=>{load()},[]);
  return html`<div className="card panel"><div className="paneltitle"><span>Inventory Audit</span><button className="btn" onClick=${load}>Refresh</button></div><div className="tablewrap"><table className="table"><thead><tr><th>Time</th><th>Event</th><th>Domain</th><th>Record</th><th>Message</th><th>Agent</th></tr></thead><tbody>${rows.length?rows.map(r=>html`<tr><td>${text(r.timestamp).replace("T"," ").slice(0,19)}</td><td>${r.eventType}</td><td>${r.domain}</td><td>${r.entityId||r.productKey||"—"}</td><td>${r.message||""}</td><td>${r.agentName||""}</td></tr>`):html`<tr><td colSpan="6"><div className="empty">No audit events.</div></td></tr>`}</tbody></table></div></div>`
}


function Overview({boot,setView}){
  const q=boot.quality||{},s=boot.stats||{};
  return html`<div className="grid">
    <div className="stats">${[["Canonical Records",s.total],["Catalog Placements",s.catalog],["Searchable",s.searchableCatalog],["Aircraft",s.aircraft],["Cabins",s.cabins]].map(([l,v])=>html`<div className="card stat"><span>${l}</span><strong>${v??0}</strong></div>`)}</div>
    <div className="split"><div className="card panel"><div className="paneltitle">Inventory Families</div><div className="grid" style=${{gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))"}}>${Object.entries(s.byType||{}).map(([k,v])=>html`<button className="btn" onClick=${()=>setView("master")}><b>${LABEL[k]||k}</b><br/><span className="sub">${v} records</span></button>`)}</div></div>
      <div className="card panel"><div className="paneltitle">Aircraft Sync Health</div><div className="kpirow"><div className="kpi"><b>${q.aircraftSync?.fleetTemplates??0}</b> fleet templates</div><div className="kpi"><b>${q.aircraftSync?.aircraftRecords??0}</b> aircraft records</div><div className="kpi"><b>${q.aircraftSync?.missing??0}</b> missing</div></div><div className=${`notice ${q.aircraftSync?.missing?"warn":""}`} style=${{marginTop:"12px"}}>${q.aircraftSync?.missing?"Open Aircraft & Cabin Studio and run Smart Sync to create missing records in Review.":"Fleet master is currently reconciled."}</div></div>
    </div>
    <div className="card panel"><div className="paneltitle">Operational Inventory</div><div className="stats">${[["Dated Capacity",s.dated],["Flight Legs",s.flightLegs],["Booking Classes",s.flightClasses],["Schedules",s.schedules],["Nesting Controls",s.nesting]].map(([l,v])=>html`<div className="stat"><span>${l}</span><strong>${v??0}</strong><em>${v?"loaded":"no rows yet"}</em></div>`)}</div></div>
  </div>`
}


function App(){
  const [boot,setBoot]=useState(null);
  const [view,setView]=useState("overview");
  const [busy,setBusy]=useState("Connecting Inventory Control…");
  const [toast,setToastState]=useState(null);
  const [masterConfig,setMasterConfig]=useState(null);
  const [connectionError,setConnectionError]=useState("");
  function setToast(message,error=false){setToastState({message,error});setTimeout(()=>setToastState(null),4200)}
  async function refresh(){
    try{setBusy("Refreshing Inventory Control…");setConnectionError("");const r=await request("INVENTORY_V9_REFRESH",{});setBoot(r)}catch(e){if(!boot)setConnectionError(e.message);setToast(e.message,true)}finally{setBusy("")}
  }
  useEffect(()=>{
    let bootstrapSettled=false;
    let readyInterval=null;
    let bridgeWatchdog=null;
    function clearReadyTimers(){
      if(readyInterval!==null){clearInterval(readyInterval);readyInterval=null;}
      if(bridgeWatchdog!==null){clearTimeout(bridgeWatchdog);bridgeWatchdog=null;}
    }
    function message(e){
      if(e.source!==window.parent)return;
      const m=e.data||{};
      if(m.source===MASTER_PARENT && m.type==="SKANDI_MASTER_CONFIG"){setMasterConfig(m.payload||{});return}
      if(m.source!==PARENT)return;
      if(m.type==="INVENTORY_V9_HOST_READY"){if(!bootstrapSettled)sendReady();return}
      if(m.type==="INVENTORY_V9_BOOTSTRAP"){
        bootstrapSettled=true;clearReadyTimers();setBoot(m.payload);setConnectionError("");setBusy("");
      }
      if(m.type==="INVENTORY_ERROR"){
        const code=String(m.payload?.code||"");
        const suffix=/^[A-Z][A-Z0-9_]{0,119}$/.test(code)?` [${code}]`:"";
        const message=(m.payload?.message||"Inventory request failed.")+suffix;
        const p=requests.get(m.requestId);
        if(p){clearTimeout(p.timer);requests.delete(m.requestId);p.reject(new Error(message))}
        else if(String(m.requestId||"").startsWith("READY-")){
          bootstrapSettled=true;clearReadyTimers();setBusy("");setConnectionError(message);
        }
        else setToast(message,true);
        return;
      }
      if(m.type==="INVENTORY_V9_PROGRESS")return;
      const p=requests.get(m.requestId);
      if(p){clearTimeout(p.timer);requests.delete(m.requestId);p.resolve(m.payload||{});}
    }
    window.addEventListener("message",message);
    // The Wix component may mount after the first ready notification. Retry
    // only this read-only handshake; never automatically replay mutations.
    readyInterval=setInterval(()=>{if(!bootstrapSettled)sendReady()},1500);
    bridgeWatchdog=setTimeout(()=>{
      bootstrapSettled=true;clearReadyTimers();setBusy("");
      setConnectionError("Inventory Control did not finish loading. Select Refresh to retry. [INVENTORY_BOOTSTRAP_TIMEOUT]");
    },REQUEST_TIMEOUT_MS);
    sendReady();
    window.parent.postMessage({source:SOURCE,type:"SKANDI_MASTER_CONFIG_REQUEST",payload:{}}, "*");
    return()=>{window.removeEventListener("message",message);clearReadyTimers()}
  },[]);


  const nav=[["overview","Overview"],["provider","Duffel & Collection"],["master","Master Records"],["assets","Asset Library"],["dated","Dated Inventory"],["air","Air Inventory"],["aircraft","Aircraft & Cabin Studio"],["quality","Publishing & QA"],["audit","Audit"]];
  return html`<div className="shell"><aside className="sidebar"><div className="brand"><b>SKANDI</b><small>Inventory Control · ${VERSION}</small></div><div className="group">Inventory Control</div>${nav.map(([k,l])=>html`<button className=${`navbtn ${view===k?"active":""}`} onClick=${()=>setView(k)}>${l}</button>`)}</aside>
    <main className="main"><div className="top"><div><div className="eyebrow">RIAINTRA · ALTEA OPERATIONS</div><h1>${nav.find(x=>x[0]===view)?.[1]||"Inventory Control"}</h1><div className="sub">One synchronized control center for Duffel resource discovery, the curated SKANDI Collection, owned inventory, merchandising, capacity and aircraft operations.</div></div><div className="toolbar"><button className="btn" onClick=${refresh}>Refresh</button></div></div>
      ${!boot?html`<div className="card panel"><div className=${`notice ${connectionError?"error":""}`}><b>${connectionError?"Inventory bridge unavailable":"Waiting for secure system bridge…"}</b>${connectionError?html`<div style=${{marginTop:"8px"}}>${connectionError}</div>`:null}</div></div>`:
        view==="overview"?html`<${Overview} boot=${boot} setView=${setView}/>`:
        view==="provider"?html`<${ProviderWorkspace} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="master"?html`<${MasterRecords} boot=${boot} setBoot=${setBoot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="assets"?html`<${AssetLibraryPanel} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="dated"?html`<${DatedInventory} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="air"?html`<${AirInventory} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="aircraft"?html`<${AircraftStudio} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        view==="quality"?html`<${Quality} boot=${boot} setBusy=${setBusy} setToast=${setToast}/>`:
        html`<${Audit} setBusy=${setBusy} setToast=${setToast}/>`}
    </main>
    ${busy?html`<div className="loading"><div className="loaderbox">${busy}</div></div>`:null}
    ${toast?html`<div className=${`toast ${toast.error?"error":""}`}>${toast.message}</div>`:null}
  </div>`
}
createRoot(document.getElementById("root")).render(html`<${React.StrictMode}><${App}/></${React.StrictMode}>`); 
</script>
</body>
</html>
```
