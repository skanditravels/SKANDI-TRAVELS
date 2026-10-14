# SKANDI INFO / LOG — V12 DOCUMENT SYSTEM CONVERGENCE

- Source identity: `/HTML_REF/riaintra/DocuNet Administration.md`.
- Display/page name: DocuNet Administration.
- System area: `RIAINTRA`.
- Wix controller: `/src/pages/DocuNet Administration.u5a64.js`.
- Route/context: `/riaintra/success-factors/docunet/admin`.
- Wix HTML element: `#docuNetAdminEmbed`.
- Child source: `SKANDI_DOCUNET_ADMIN`; parent source: `SKANDI_WIX_PARENT`.
- Current status: **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Wix installation/publication.
- Source-of-truth status: complete intended V12 HTML payload below.
- Canonical ownership: `backend/SKANDI_CORE/docuNet.web.js` → `docuNet.js` → `adobePdf.js` + DocuNet tables + private `docunet-controlled` storage.
- External provider: Adobe PDF Services API is server-only and is used during upload finalization to validate the controlled PDF and obtain authoritative PDF properties/page count. Provider credentials remain in Wix Secrets Manager.
- Authentication/authorization: internal surfaces require canonical `staffAuth` server authorization. Client-provided roles are not authority.
- Database verification: relevant DocuNet/document tables were inspected read-only against the active SKANDI Supabase project on 2026-10-14. No database rows, schema, policies or storage objects were changed by this repair package.
- Storage requirement: `docunet-controlled` is intended to be private. Live storage configuration must be verified before production controlled-document ingestion.
- Document source archive: the Dropbox folder supplied on 2026-10-14 could not be opened through an installed/connected Dropbox connector or the available public fetch path. No Dropbox document content was guessed or imported.
- Last verified: 2026-10-14.
- Change log:
  - 2026-10-13 — Converged this surface onto `backend/SKANDI_CORE`, removed legacy/missing backend namespace dependency, preserved supplied HTML design/behavior, and documented the complete runtime chain.
  - 2026-10-14 — Route authority confirmed as `/riaintra/success-factors/docunet/admin`; route registry and PAGE_SETTINGS updated. Re-audited controller/facade chain for Wix proxy failures: current DocuNet facade uses direct named `webMethod(...)` exports rather than wrapper-produced exports.
  - 2026-10-14 — Added canonical server-only Adobe PDF Services validation to DocuNet upload finalization through `backend/SKANDI_CORE/adobePdf.js`; authoritative page count now comes from Adobe PDF Properties. Corrected existing admin service/market/audience filtering in `docuNet.js`. HTML message contracts and executable embed payload are unchanged.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI DocuNet Publisher Administration</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
:root{
  --global-shell-h:52px;
  --global-footer-h:34px;
  --navy-950:#06182e;
  --navy-900:#082443;
  --navy-800:#0b315b;
  --navy-700:#124a7e;
  --blue-600:#1f659f;
  --steel-700:#45596e;
  --steel-600:#5e7184;
  --steel-500:#7d8d9d;
  --steel-400:#9eabb7;
  --steel-300:#bcc6cf;
  --steel-250:#ccd4dc;
  --steel-200:#d9e0e6;
  --steel-150:#e4e9ed;
  --steel-100:#eef2f5;
  --steel-075:#f3f5f7;
  --steel-050:#f8f9fa;
  --white:#fff;
  --text:#17212b;
  --muted:#596a79;
  --ok:#16653b;
  --warn:#8b5700;
  --danger:#9c2f2f;
  --info:#0e5f94;
  --header-h:54px;
  --subbar-h:31px;
  --side-w:224px;
  --font:Arial,Tahoma,"Segoe UI",sans-serif;
  --mono:"Consolas","Courier New",monospace;
}
*{box-sizing:border-box}
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#cfd7df;color:var(--text);font-family:var(--font)}
.global-footer{height:var(--global-footer-h);display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 18px;background:#354a5f;color:rgba(255,255,255,.75);font-size:10px;position:relative;z-index:200}.global-footer-section{display:flex;align-items:center;gap:16px}.global-footer strong{color:#fff}.global-footer button{border:0;background:transparent;color:inherit;padding:0;font-size:inherit}.global-footer button:hover{color:#fff;text-decoration:underline}.global-operational{color:#8ee0b2;font-weight:700}.global-operational:before{content:"";display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:50%;background:#8ee0b2}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #56a9df;outline-offset:-1px}
.app{height:100dvh;display:grid;grid-template-rows:var(--header-h) minmax(0,1fr);background:var(--steel-100)}
@media(max-width:900px){.global-nav,.global-clock,.global-profile-copy{display:none}.global-menu-btn{display:block}.global-footer-section:last-child{display:none}.global-footer{padding:0 10px}.global-footer-section{gap:8px}.global-build{display:none}}
/* Header */
.chrome{display:contents}
.chrome-top{
  grid-row:1;
  background:linear-gradient(90deg,var(--navy-950) 0,var(--navy-900) 55%,#0d3a66 100%);
  border-bottom:1px solid #00101f;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  min-width:0;
  padding:0 12px;
}
.brand{display:flex;align-items:center;min-width:0;height:100%}
.logo{
  width:36px;height:36px;display:grid;place-items:center;flex:0 0 auto;
  border:1px solid rgba(255,255,255,.42);background:#fff;color:var(--navy-900);
  font-size:18px;font-weight:800;margin-right:10px
}
.brand-copy{min-width:0}
.brand small{display:block;color:#a9c3db;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;line-height:1.2}
.brand strong{display:block;font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.01em}
.header-context{display:flex;align-items:stretch;height:100%;margin-left:20px;border-left:1px solid rgba(255,255,255,.18)}
.header-context .context-cell{min-width:108px;padding:9px 13px;border-right:1px solid rgba(255,255,255,.18)}
.context-label{display:block;color:#91adc6;font-size:8px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:2px}
.context-value{display:block;color:#fff;font-size:11px;font-weight:700;white-space:nowrap}
.chrome-top>.actions{height:100%;display:flex;align-items:center;gap:0}
.chrome-top>.actions .btn{height:100%;border-top:0;border-bottom:0;border-right:0;border-color:rgba(255,255,255,.18);background:transparent;color:#fff;padding:0 14px}
.chrome-top>.actions .btn:hover{background:rgba(255,255,255,.09)}
/* Secondary command strip */
.command-strip{
  grid-row:2;background:#d8dde2;border-top:1px solid #fff;border-bottom:1px solid #7a8997;
  display:flex;align-items:center;min-width:0;box-shadow:inset 0 -1px #aab5bf
}
.command-name{
  height:100%;display:flex;align-items:center;min-width:var(--side-w);padding:0 11px;
  background:#c6ced5;border-right:1px solid #8795a2;color:#172534;
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.11em
}
.command-items{display:flex;align-items:center;height:100%;min-width:0;overflow:auto}
.command-item{
  height:100%;display:flex;align-items:center;padding:0 12px;border-right:1px solid #9ba8b3;
  font-size:10px;color:#293948;white-space:nowrap
}
.command-item b{color:var(--navy-800);margin-left:5px}
.command-spacer{flex:1}
.command-health{
  height:100%;display:flex;align-items:center;gap:6px;padding:0 12px;border-left:1px solid #9ba8b3;
  font:10px var(--mono);white-space:nowrap;color:#253746
}
.health-dot{width:7px;height:7px;background:#2b7c4c;border:1px solid #185d35}
/* Main shell */
.shell{grid-row:2;min-height:0;display:grid;grid-template-columns:var(--side-w) minmax(0,1fr);overflow:hidden}
.sidebar{
  min-height:0;background:#d5dbe0;border-right:1px solid #7c8995;display:grid;
  grid-template-rows:auto minmax(0,1fr) auto;box-shadow:inset -1px 0 #eef1f3
}
.side-title{
  background:#bcc6cf;border-bottom:1px solid #8794a0;padding:8px 10px 7px;
  color:#213343;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.13em
}
.side-nav{padding:5px 0;overflow:auto}
.side-group{padding:7px 9px 4px;color:#5b6b78;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.15em}
.tabs{display:block;background:transparent;padding:0;border:0}
.tabs button{
  width:100%;height:34px;border:0;border-top:1px solid transparent;border-bottom:1px solid transparent;
  background:transparent;color:#243746;text-align:left;padding:0 10px 0 29px;position:relative;
  font-size:11px;font-weight:700;border-radius:0
}
.tabs button::before{
  content:"";position:absolute;left:11px;top:10px;width:10px;height:10px;
  border:1px solid #607486;background:#edf1f4
}
.tabs button:hover{background:#c7d0d8}
.tabs button.active{
  background:#fff;color:var(--navy-900);border-top-color:#82909d;border-bottom-color:#82909d;
  box-shadow:inset 4px 0 var(--navy-700)
}
.tabs button.active::before{background:var(--navy-700);border-color:var(--navy-900);box-shadow:inset 0 0 0 2px #fff}
.side-register{border-top:1px solid #8794a0;background:#c8d0d7;padding:9px}
.side-register h4{margin:0 0 7px;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#344757}
.side-stat{display:grid;grid-template-columns:1fr auto;gap:7px;padding:4px 0;border-top:1px solid #aeb9c2;font-size:10px;color:#435563}
.side-stat b{font:700 10px var(--mono);color:#162b3e}
/* Workspace */
.workspace{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;background:#eef1f4}
.workspace-head{
  min-height:48px;background:#fff;border-bottom:1px solid #9aa8b4;display:flex;
  align-items:center;justify-content:space-between;padding:7px 11px;gap:16px
}
.workspace-title{min-width:0}
.workspace-title h1{font-size:15px;line-height:1.2;margin:0;color:#163653;letter-spacing:.01em}
.workspace-title p{font-size:10px;line-height:1.25;margin:2px 0 0;color:#697987}
.workspace-meta{display:flex;align-items:center;gap:14px;font:9px var(--mono);color:#435565;white-space:nowrap}
.workspace-meta span{padding-left:9px;border-left:1px solid #c4ccd3}
.content{min-height:0;overflow:auto;padding:8px}
/* Status */
.status{
  display:none;margin:0 0 8px;border:1px solid #8d9baa;border-left-width:4px;background:#eef3f7;
  padding:7px 9px;color:#364a5b;font-size:11px;line-height:1.35;white-space:pre-line
}
.status.show{display:block}
.status.ok{background:#edf6f0;border-color:#5d8e70;color:#1f5c3c}
.status.warn{background:#fff7e7;border-color:#ad7d2f;color:#704900}
.status.error{background:#fff0ef;border-color:#b85c56;color:#842e29}
/* Generic enterprise controls */
.panel{display:none}
.panel.active{display:block}
.card{background:#fff;border:1px solid #9eabb6;margin:0 0 8px;padding:0;box-shadow:none;border-radius:0}
.card-head{
  min-height:31px;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:5px 8px;background:linear-gradient(#edf1f4,#dfe5ea);border-bottom:1px solid #9eabb6
}
.card-head h2,.card-head h3{margin:0;color:#173b5d;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
.card-head p{margin:0;color:#5f7180;font-size:9px}
.card-body{padding:8px}
h1,h2,h3{color:#173b5d}
h2{font-size:15px;margin:0 0 7px}
h3{font-size:12px;margin:0 0 4px}
p{font-size:11px;line-height:1.45;color:#566978;margin:0 0 7px}
.btn{
  min-height:27px;border:1px solid #46627a;border-radius:0;background:linear-gradient(#1f5b8d,#15456d);
  color:#fff;font-size:10px;font-weight:700;padding:5px 9px;display:inline-flex;align-items:center;justify-content:center;gap:5px
}
.btn:hover{filter:brightness(1.08)}
.btn:active{background:#0b3559}
.btn.light,.btn.secondary{background:linear-gradient(#fff,#e4e9ed);color:#183c5c;border-color:#8798a7}
.btn.warn{background:#fff3d6;color:#704600;border-color:#a37c39}
.btn.danger{background:#fbe8e6;color:#8a2c28;border-color:#ae655f}
.btn.green{background:#e5f3e9;color:#1e603c;border-color:#5b8a6b}
.actions{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
/* Forms */
.searchgrid{
  display:grid;grid-template-columns:minmax(260px,2fr) repeat(3,minmax(130px,1fr)) auto;
  gap:6px;align-items:end;padding:8px
}
.grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:7px}
.grid .wide{grid-column:span 2}
.grid .full{grid-column:1/-1}
.field{min-width:0}
.field label{
  display:flex;align-items:center;justify-content:space-between;min-height:16px;margin:0;
  color:#405466;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em
}
.field label::after{content:"";flex:1;border-top:1px solid #d8dfe5;margin-left:7px}
.field input,.field select,.field textarea{
  width:100%;min-height:28px;border:1px solid #8f9da9;border-radius:0;background:#fff;
  padding:4px 6px;font-size:11px;color:#182a39
}
.field input:hover,.field select:hover,.field textarea:hover{border-color:#526e84}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#0f639e;background:#fbfdff}
.field textarea{min-height:70px;resize:vertical}
.field select[multiple]{min-height:96px;padding:2px}
.field select[multiple] option{padding:4px 5px;border-bottom:1px solid #edf0f2}
.field-hint{margin-top:3px;color:#667887;font-size:8px;line-height:1.35}
.required-tag{color:#9a2e2a;font-size:8px;font-weight:800}
.form-section{border:1px solid #a9b4be;margin-bottom:8px;background:#fbfcfd}
.form-section-title{
  min-height:27px;padding:6px 8px;background:#e8edf1;border-bottom:1px solid #a9b4be;
  color:#173b5d;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em
}
.form-section-body{padding:8px}
/* PDF ingestion */
.ingestion-layout{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(280px,.85fr);gap:8px}
.upload-engine{
  min-height:188px;border:1px solid #6f8292;background:#edf2f5;display:grid;
  grid-template-rows:auto minmax(0,1fr) auto
}
.upload-engine-head{
  background:var(--navy-800);color:#fff;padding:7px 9px;border-bottom:1px solid #001e37;
  display:flex;align-items:center;justify-content:space-between;gap:10px
}
.upload-engine-head b{font-size:10px;text-transform:uppercase;letter-spacing:.1em}
.upload-engine-head span{font:9px var(--mono);color:#bcd0e1}
.upload-target{
  margin:9px;border:2px dashed #6a7d8d;background:#fff;display:grid;place-items:center;text-align:center;padding:18px
}
.upload-icon{
  width:42px;height:48px;border:2px solid #557187;background:#eef3f6;position:relative;margin:0 auto 10px
}
.upload-icon::after{content:"PDF";position:absolute;bottom:5px;left:5px;right:5px;background:#a22e2e;color:#fff;font:700 9px var(--mono);padding:2px}
.upload-target strong{display:block;color:#153b5c;font-size:12px;margin-bottom:4px}
.upload-target p{margin:0 auto 10px;max-width:470px;font-size:10px}
.upload-target.dragover{border-color:#0d639e;background:#eef7fc;box-shadow:inset 0 0 0 2px rgba(13,99,158,.14)}
.upload-picker{width:min(560px,100%)}
.pdf-file-input{display:block;width:100%;border:1px solid #64798a;background:#edf2f5;color:#243a4b;font-size:10px;padding:4px}
.pdf-file-input::file-selector-button{min-height:27px;margin:-4px 9px -4px -4px;border:0;border-right:1px solid #47647b;background:linear-gradient(#1f5b8d,#15456d);color:#fff;font-size:10px;font-weight:700;padding:5px 12px;cursor:pointer}
.file-state{margin-top:8px;border:1px solid #a0aeb9;background:#eef2f5;padding:6px 8px;color:#435767;font:10px var(--mono);text-align:left;overflow-wrap:anywhere}
.file-state.ready{border-color:#5e8b70;background:#edf6f0;color:#205c3c}
.file-state.error{border-color:#b15d57;background:#fff0ef;color:#842e29}
.file-state.uploading{border-color:#4d7999;background:#edf5fa;color:#174e79}
.upload-engine-foot{
  border-top:1px solid #a5b0ba;background:#dfe6eb;padding:6px 9px;
  display:flex;justify-content:space-between;gap:12px;font-size:9px;color:#425666
}
.compliance-box{border:1px solid #9dabb6;background:#fff}
.compliance-box h3{
  margin:0;padding:7px 8px;background:#e5eaee;border-bottom:1px solid #9dabb6;
  font-size:9px;text-transform:uppercase;letter-spacing:.1em
}
.compliance-list{list-style:none;margin:0;padding:4px 8px 8px}
.compliance-list li{position:relative;padding:5px 0 5px 17px;border-bottom:1px solid #e2e7eb;font-size:10px;color:#445867}
.compliance-list li::before{content:"✓";position:absolute;left:0;color:#1d6b42;font-weight:800}
.note{
  background:#eef3f7;border:1px solid #91a3b2;border-left:4px solid #174e79;border-radius:0;
  padding:7px 9px;color:#435767;font-size:10px;line-height:1.45;margin:8px 0
}
.editor-actions{
  position:sticky;bottom:-8px;margin:8px -8px -8px;padding:7px 8px;background:#dce3e8;
  border-top:1px solid #8998a5;display:flex;justify-content:flex-end;gap:5px;z-index:2
}
/* Registers rendered by preserved JS */
.table{display:block;border:1px solid #9eabb6;background:#fff}
.register-head{
  display:grid;grid-template-columns:minmax(260px,1.3fr) 140px 120px 110px minmax(310px,.9fr);
  min-height:27px;background:#cad2d9;border:1px solid #8997a3;border-bottom:0;
  color:#314555;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.09em
}
.register-head span{padding:7px 8px;border-right:1px solid #a2adb6}
.row{
  border:0;border-bottom:1px solid #c8d0d7;border-radius:0;background:#fff;padding:6px 7px;
  display:grid;grid-template-columns:minmax(300px,1fr) auto;gap:8px;align-items:center
}
.row:nth-child(even){background:#f5f7f8}
.row:hover{background:#edf4f9}
.row:last-child{border-bottom:0}
.row h3{font-size:11px;color:#153a5b;margin:0 0 3px;line-height:1.25}
.row p{margin:0;font-size:9.5px;color:#596b79;white-space:normal}
.row>.actions{justify-content:flex-end;flex-wrap:nowrap}
.row>.actions .btn{min-height:23px;padding:3px 6px;font-size:9px;white-space:nowrap}
.meta{display:flex;gap:3px;flex-wrap:wrap;margin:0 0 4px}
.pill{
  display:inline-flex;align-items:center;min-height:18px;border:1px solid #89a2b6;background:#e8f0f6;color:#17466b;
  border-radius:0;font-size:8px;font-weight:800;padding:2px 5px;text-transform:uppercase;letter-spacing:.03em
}
.pill.gray{background:#edf0f2;color:#536572;border-color:#aeb9c2}
.pill.red{background:#f9e8e6;color:#8a2e29;border-color:#c58f8a}
.pill.green{background:#e8f2eb;color:#225f3e;border-color:#83a58e}
.pill.orange{background:#fff2d8;color:#795000;border-color:#c2a05d}
/* Category / audit */
.category-grid{display:grid;grid-template-columns:minmax(300px,.72fr) minmax(0,1.28fr);gap:8px}
.audit-guide{
  display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #9eabb6;border-bottom:0;background:#dfe5ea
}
.audit-guide div{padding:7px;border-right:1px solid #aeb8c1}
.audit-guide b{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:#415565}
.audit-guide span{font:10px var(--mono);color:#163a58}
/* Viewer */
.viewer{
  display:none;position:fixed;inset:12px;z-index:100;background:#cbd3da;border:1px solid #263c4e;
  box-shadow:0 14px 45px rgba(0,0,0,.45);grid-template-rows:36px minmax(0,1fr);margin:0;border-radius:0;overflow:hidden
}
.viewer.open{display:grid}
.viewer-top{
  background:linear-gradient(#214f76,#123a5c);color:#fff;border-bottom:1px solid #031b2d;
  padding:4px 7px;display:flex;justify-content:space-between;gap:12px;align-items:center
}
.viewer-top h2{font-size:11px;color:#fff;margin:0}
.viewer-top p{font:8px var(--mono);color:#bad0e1;margin:1px 0 0;max-width:70vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.viewer-top .btn{min-height:25px;background:#eef2f5;color:#153b5d;border-color:#91a2b0}
.pdf{height:100%;width:100%;border:0;background:#666}
/* Helpers */
.section-help{font-size:9px;color:#607281}
.data-warning{color:#86342f;font-weight:700}
.empty-placeholder{padding:18px;text-align:center;color:#61727f;font-size:10px}
/* DocuNet viewer visual system */
:root{
  --navy-950:#06233f;
  --navy-900:#0a3156;
  --navy-800:#124b7a;
  --navy-700:#176695;
  --blue-600:#2fa9cf;
  --steel-700:#4b5a68;
  --steel-600:#657584;
  --steel-500:#83909c;
  --steel-400:#a8b2bc;
  --steel-300:#cbd2d9;
  --steel-250:#d8dde2;
  --steel-200:#e3e7eb;
  --steel-150:#edf0f3;
  --steel-100:#f4f6f8;
  --steel-075:#f7f8fa;
  --steel-050:#fff;
  --text:#17212b;
  --muted:#657584;
  --header-h:48px;
  --subbar-h:45px;
  --side-w:326px;
  --font:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:"SFMono-Regular",Consolas,"Liberation Mono",monospace;
}
html,body{background:#d8dde2;font-size:13px}
.chrome-top{
  background:linear-gradient(90deg,var(--navy-950),var(--navy-900) 68%,#0d416d);
  border-bottom:1px solid #00192e;
  box-shadow:0 1px 0 rgba(255,255,255,.08) inset;
  padding:0;
}
.brand{min-width:244px;padding:0 16px 0 14px;border-right:1px solid rgba(255,255,255,.16)}
.logo{display:none}
.brand-copy{line-height:1.05}
.brand strong{font-size:20px;font-weight:650;letter-spacing:-.02em;line-height:1}
.brand strong span{font-weight:300;color:#d7edf7}
.brand small{margin-top:3px;color:#b8d4e5;font-size:9px;letter-spacing:.18em;line-height:1;text-transform:uppercase}
.header-context{margin-left:0;border-left:0}
.header-context .context-cell{min-width:125px;padding:8px 13px;border-right:1px solid rgba(255,255,255,.1)}
.context-label{color:#9fc1d7;font-size:8px}
.context-value{font-size:10px}
.chrome-top>.actions{padding-right:0}
.chrome-top>.actions .btn{
  height:100%;min-height:0;border:0;border-left:1px solid rgba(255,255,255,.13);
  background:transparent;color:#dce8f0;padding:0 15px;font-size:11px;border-radius:0;
}
.chrome-top>.actions .btn:hover{background:rgba(255,255,255,.1);color:#fff;filter:none}
.command-strip{
  background:#f7f8fa;border-top:0;border-bottom:1px solid var(--steel-300);
  box-shadow:0 1px 0 #fff inset;padding:6px 10px;gap:8px;
}
.command-name{
  min-width:0;height:31px;padding:0 10px;background:#fff;border:1px solid var(--steel-300);
  border-radius:2px;color:var(--navy-800);font-size:10px;
}
.command-items{height:31px;border:1px solid var(--steel-300);border-radius:2px;background:#fff}
.command-item{height:30px;border-right:1px solid var(--steel-250);padding:0 10px;color:var(--steel-700)}
.command-item b{color:var(--navy-800)}
.command-health{
  height:31px;border:1px solid #91b8ce;background:#edf8fc;color:var(--navy-800);
  border-radius:2px;padding:0 9px;
}
.health-dot{width:7px;height:7px;border:0;border-radius:50%;background:#5fd18d;box-shadow:0 0 0 2px rgba(95,209,141,.18)}
.sidebar{
  background:#f3f5f7;border-right:1px solid #aeb7c0;box-shadow:1px 0 0 #fff inset;
}
.side-title{
  min-height:39px;display:flex;align-items:center;background:#e1e5e9;border-bottom:1px solid var(--steel-300);
  padding:0 10px;color:var(--steel-700);font-size:10px;
}
.side-nav{padding:5px 0}
.side-group{color:var(--steel-600);font-size:8px;padding:8px 10px 4px}
.tabs button{
  height:34px;color:var(--steel-700);font-size:11px;font-weight:600;padding-left:32px;
  border-top:0;border-bottom:1px solid transparent;
}
.tabs button::before{
  left:11px;top:11px;width:10px;height:10px;border:1px solid var(--steel-400);
  border-radius:1px;background:#fff;
}
.tabs button:hover{background:#e7edf2}
.tabs button.active{
  background:#d6e8f3;color:var(--navy-900);border-top-color:transparent;border-bottom-color:#c6dce8;
  box-shadow:inset 3px 0 var(--navy-700);
}
.tabs button.active::before{background:var(--navy-700);border-color:var(--navy-700);box-shadow:inset 0 0 0 2px #d6e8f3}
.side-stat{border-top:1px solid var(--steel-250);color:var(--steel-600);padding:5px 10px}
.side-stat b{color:var(--navy-800)}
.side-register{border-top:1px solid var(--steel-300);background:#e5e9ed;padding:9px}
.workspace{background:#d8dde2}
.workspace-head{
  min-height:48px;background:#fff;border-bottom:1px solid var(--steel-300);
  padding:7px 11px;
}
.workspace-title h1{color:var(--navy-950);font-size:15px}
.workspace-title p{color:var(--steel-600);font-size:10px}
.workspace-meta{color:var(--steel-600)}
.content{padding:8px;background:#d8dde2}
.status{
  border:1px solid var(--steel-300);border-left:4px solid var(--navy-700);background:#fff;
  color:var(--steel-700);box-shadow:0 1px 2px rgba(13,31,48,.08);
}
.status.ok{background:#e9f6ee;border-color:#86b59a;color:#2e7d54}
.status.warn{background:#fff4df;border-color:#dfb667;color:#7f570f}
.status.error{background:#fff0f0;border-color:#d98a8a;color:#9f2727}
.card{
  border:1px solid var(--steel-300);background:#fff;
  box-shadow:0 1px 2px rgba(13,31,48,.12),0 7px 20px rgba(13,31,48,.05);
}
.card-head{background:#edf0f3;border-bottom:1px solid var(--steel-300);min-height:35px;padding:6px 8px}
.card-head h2,.card-head h3{color:var(--navy-900);font-size:10px}
.card-head p{color:var(--steel-600)}
.card-body{padding:8px}
.btn{
  min-height:27px;border:1px solid var(--navy-700);border-radius:2px;background:var(--navy-800);
  color:#fff;font-size:10px;padding:5px 9px;box-shadow:0 1px 0 rgba(255,255,255,.12) inset;
}
.btn:hover{background:var(--navy-700);filter:none}
.btn:active{background:var(--navy-900)}
.btn.light,.btn.secondary{
  background:#fff;color:var(--navy-800);border-color:var(--steel-300);box-shadow:none;
}
.btn.light:hover,.btn.secondary:hover{background:var(--steel-100)}
.btn.warn{background:#fff4df;color:#8b5d00;border-color:#dfb667}
.btn.danger{background:#fff0f0;color:#9f2727;border-color:#d98a8a}
.btn.green{background:#e9f6ee;color:#2e7d54;border-color:#86b59a}
.field label{color:var(--steel-700)}
.field label::after{border-color:var(--steel-200)}
.field input,.field select,.field textarea{
  border:1px solid var(--steel-400);border-radius:2px;background:#fff;color:var(--text);
}
.field input:hover,.field select:hover,.field textarea:hover{border-color:var(--navy-700)}
.field input:focus,.field select:focus,.field textarea:focus{
  border-color:var(--navy-700);background:#fff;box-shadow:0 0 0 2px rgba(23,102,149,.14);
}
.form-section{border:1px solid var(--steel-300);background:#fbfcfd}
.form-section-title{background:#edf0f3;border-bottom:1px solid var(--steel-300);color:var(--navy-900)}
.upload-engine{border:1px solid var(--steel-300);background:#edf0f3}
.upload-engine-head{background:var(--navy-900);border-color:#082846}
.upload-target{border-color:var(--steel-400);background:#fff}
.upload-target.dragover{border-color:var(--navy-700);background:#eef8fc}
.upload-icon{border-color:var(--steel-600);background:var(--steel-100)}
.pdf-file-input{border-color:var(--steel-400);background:var(--steel-100)}
.pdf-file-input::file-selector-button{background:var(--navy-800);border-color:var(--navy-700);border-radius:1px}
.upload-engine-foot{background:#e5e9ed;border-color:var(--steel-300)}
.compliance-box{border-color:var(--steel-300)}
.compliance-box h3{background:#edf0f3;border-color:var(--steel-300);color:var(--navy-900)}
.note{background:#eef8fc;border-color:#8eb8d0;border-left-color:var(--navy-700);color:var(--steel-700)}
.editor-actions{background:#e5e9ed;border-color:var(--steel-300)}
.table,.register-head{border-color:var(--steel-300)}
.register-head{background:#e1e5e9;color:var(--steel-700)}
.register-head span{border-color:var(--steel-300)}
.row{border-color:var(--steel-250)}
.row:nth-child(even){background:#f7f8fa}
.row:hover{background:#eef6fb}
.row h3{color:var(--navy-900)}
.row p{color:var(--steel-600)}
.pill{border-color:#a8c5d5;background:#eef8fc;color:var(--navy-700);border-radius:9px}
.pill.gray{background:var(--steel-100);color:var(--steel-600);border-color:var(--steel-300)}
.pill.green{background:#e9f6ee;color:#2e7d54;border-color:#86b59a}
.pill.orange{background:#fff4df;color:#8b5d00;border-color:#dfb667}
.pill.red{background:#fff0f0;color:#9f2727;border-color:#d98a8a}
.audit-guide{background:#e1e5e9;border-color:var(--steel-300)}
.audit-guide div{border-color:var(--steel-300)}
.viewer{background:#d8dde2;border-color:#71808d}
.viewer-top{background:linear-gradient(90deg,var(--navy-950),var(--navy-900));border-color:#00192e}
*{scrollbar-width:thin;scrollbar-color:#a8b2bc #edf0f3}

/* Responsive */
@media(max-width:1180px){
  :root{--side-w:300px}
  .searchgrid{grid-template-columns:2fr repeat(2,1fr);}.searchgrid .field:nth-child(4){grid-column:2}.searchgrid>.btn{grid-column:3}
  .grid{grid-template-columns:repeat(3,minmax(150px,1fr))}
  .ingestion-layout{grid-template-columns:1fr}
  .header-context .context-cell:nth-child(2){display:none}
}
@media(max-width:850px){
  html,body{overflow:auto}
  .app{height:auto;min-height:100dvh;display:block}
  .chrome{display:block}
  .chrome-top{height:48px}.command-strip{height:45px}
  .shell{display:block;overflow:visible}
  .sidebar{display:block;border-right:0;border-bottom:1px solid #7c8995}
  .side-nav{display:flex;overflow:auto;padding:0}.side-group,.side-title,.side-register{display:none}
  .tabs{display:flex}.tabs button{min-width:145px;border-right:1px solid #98a5b0;padding-left:29px}
  .workspace{display:block;overflow:visible}.content{overflow:visible}
  .grid,.searchgrid,.category-grid{grid-template-columns:1fr 1fr}
  .grid .wide,.grid .full{grid-column:1/-1}
  .searchgrid>.btn{grid-column:auto}
  .workspace-meta,.header-context{display:none}
}
@media(max-width:560px){
  .chrome-top>.actions .btn{padding:0 8px;font-size:9px}
  .brand strong{font-size:13px}.brand small{font-size:8px}
  .command-item:nth-child(n+3){display:none}
  .grid,.searchgrid,.category-grid{grid-template-columns:1fr}
  .searchgrid .field:nth-child(4),.searchgrid>.btn{grid-column:auto}
  .row{grid-template-columns:1fr}.row>.actions{justify-content:flex-start;flex-wrap:wrap}
  .viewer{inset:0}
}
@media print{
  .sidebar,.chrome-top,.command-strip,.workspace-head,.status,.actions{display:none!important}
  html,body,.app,.shell,.workspace,.content{height:auto;overflow:visible;background:#fff}
  .shell{display:block}.panel{display:block}
}
</style>
</head>
<body>
<div class="app">
  <section class="chrome">
    <div class="chrome-top">
      <div class="brand">
        <div class="logo">D</div>
        <div class="brand-copy">
          <strong>Docu<span>Net</span></strong>
          <small>Publisher Administration</small>
        </div>
        <div class="header-context" aria-hidden="true">
        </div>
      </div>
      <div class="actions">
        <button class="btn light" id="staffPageBtn">Staff page</button>
        <button class="btn light" id="refreshBtn">Refresh</button>
      </div>
    </div>
    
  </section>

  <div class="shell">
    <aside class="sidebar" aria-label="Publisher navigation">
      <div class="side-title">Document administration</div>
      <div class="side-nav">
        <div class="side-group">Library management</div>
        <div class="tabs">
          <button class="active" data-panel="documents">Document register</button>
          <button data-panel="editor">PDF ingestion / revision</button>
          <button data-panel="categories">Category structure</button>
          <button data-panel="audit">Audit and traceability</button>
        </div>
        <div class="side-group">Control principles</div>
        <div class="side-stat"><span>Master source</span><b>PDF</b></div>
        <div class="side-stat"><span>Storage</span><b>SUPABASE</b></div>
        <div class="side-stat"><span>Publication model</span><b>REV</b></div>
        <div class="side-stat"><span>Record state</span><b>LIVE</b></div>
      </div>
      <div class="side-register">
        <h4>Publisher status</h4>
        <div class="side-stat"><span>Environment</span><b>PROD</b></div>
        <div class="side-stat"><span>Supabase connection</span><b>READY</b></div>
        <div class="side-stat"><span>Upload type</span><b>PDF / FORM</b></div>
      </div>
    </aside>

    <main class="workspace">
      <header class="workspace-head">
        <div class="workspace-title">
          <h1>Controlled Document Library</h1>
          <p>Publish, revise, classify and audit SKANDI business manuals, procedures and controlled PDF documents.</p>
        </div>
        <div class="workspace-meta">
          <span>MODULE DOC-ADMIN</span>
          <span>CONTROL CLASS INTERNAL</span>
          <span>SESSION ACTIVE</span>
        </div>
      </header>

      <div class="content">
        <div id="status" class="status show">Loading document control...</div>

        <section class="viewer" id="viewer">
          <div class="viewer-top">
            <div><h2 id="viewerTitle">Preview</h2><p id="viewerMeta"></p></div>
            <div class="actions">
              <button class="btn secondary" id="openFullBtn">Open full screen</button>
              <button class="btn secondary" id="closeViewerBtn">Close preview</button>
            </div>
          </div>
          <iframe id="pdfFrame" class="pdf" title="Document preview"></iframe>
        </section>

        <section class="panel active" id="panel-documents">
          <div class="card">
            <div class="card-head">
              <div>
                <h2>Document register search</h2>
                <p>Query the controlled library by identity, classification and publication state.</p>
              </div>
              <span class="section-help">Search results include current document records and latest file references.</span>
            </div>
            <div class="searchgrid">
              <div class="field"><label>Search register</label><input id="docQuery" placeholder="Title, document code, category or revision"></div>
              <div class="field"><label>Category</label><select id="docCategory"></select></div>
              <div class="field"><label>Publication status</label><select id="docStatus"><option value="">All</option><option>PUBLISHED</option><option>DRAFT</option><option>ARCHIVED</option></select></div>
              <div class="field"><label>Document type</label><select id="docType"><option value="">All</option><option>Manual</option><option>Procedure</option><option>Notice</option><option>Training</option><option>Form</option><option>Checklist</option><option>Policy</option></select></div>
              <div class="field"><label>Service line</label><select id="docService"><option value="">All</option><option value="DESTINATION">Destination Services</option><option value="TRANSFERS">Transfers</option><option value="TOURS">Tours &amp; Activities</option><option value="PACKAGES">Travel Packages</option></select></div>
              <div class="field"><label>Operating market</label><select id="docMarket"><option value="">All</option>
              <optgroup label="- - H E A D Q U A R T E R S - &amp; - A D M I N - -">
              <option value="NYCXEC">NYCXEC · New York City Global HQ</option>
              <option value="STOXEC">STOXEC · Stockholm Regional HQ</option>
              <option value="BKKXEC">BKKXEC · Bangkok Main Asia Office</option>
              </optgroup>
              <optgroup label="- - U N I T E D  S T A T E S - -">
              <option value="NYCGOP">NYCGOP · New York City</option>
              <option value="ORLGOP">ORLGOP · Orlando</option>
              <option value="MIAGOP">MIAGOP · Miami</option>
              <option value="LAXGOP">LAXGOP · Los Angeles</option>
              <option value="LASGOP">LASGOP · Las Vegas</option>
              <option value="SFOGOP">SFOGOP · San Fransisco</option>
              </optgroup>
              <optgroup label="- - S W E D E N - -">
              <option value="STOGOP">STOGOP · Stockholm</option>
              <option value="GOTGOP">GOTGOP · Gothenburg</option>
              <option value="KRNGOP">KRNGOP · Kiruna</option>
              <option value="KRNICE">KRNICE · Jukkasjärvi   ICEHOTEL Field Team </option>
              <option value="LLAGOP">LLAGOP · Luleå </option>
              <option value="BDNGOP">BDNGOP · Boden / TREEHOTEL </option>
              </optgroup>
              <optgroup label="- - N O R W A Y - -">
              <option value="OSLGOP">OSLGOP · Oslo</option>
              <option value="TOSGOP">TOSGOP · Tromsø</option>
              </optgroup>
              <optgroup label="- - D E N M A R K - -">
              <option value="CPHGOP">CPHGOP · Copenhagen</option>
              </optgroup>
              <optgroup label="- - F I N L A N D - -">
                  <option value="HELGOP">HELGOP · Helsinki</option>
                  <option value="RVNGOP">RVNGOP · Rovaniemi</option>
              </optgroup>
              <optgroup label="- - G R E E C E - -">
              <option value="JMKGOP">JMKGOP · Mykonos</option>
              <option value="CHQGOP">CHQGOP · Crete / Chania</option>
              <option value="HERGOP">HERGOP · Crete / Heraklion</option>
              <option value="SKGGOP">SKGOP · Thessaloniki</option>
              <option value="RHOGOP">RHOGOP · Rhodes</option>
              <option value="JTRGOP">JTRGOP · Santorini</option>
              <option value="JSIGOP">JSIGOP · Skiathos</option>
              </optgroup>
              <optgroup label="- - S P A I N - -">
              </optgroup>
                  <optgroup label="↳ M A I N L A N D  &amp;  B E L E A R I C S">
                      <option value="AGPGOP">AGPGOP · Malaga</option>
                      <option value="ALCGOP">ALCGOP · Alicante</option>
                      <option value="PMIGOP">PMIGOP · Palma de Mallorca</option>
                  </optgroup>
                  <optgroup label="↳ C A N A R Y  I S L A N D S">
                      <option value="TCIGOP">TCIGOP · Tenerife</option>
                      <option value="FUEGOP">FUEGOP · Fuertuventura</option>
                      </optgroup>

                      <optgroup label="↳ G R A N  C A N A R I A">
                          <option value="LPAGOP">LPAGOP · Las Palmas (All Gran Canaria)</option>
                          <option value="LPASWG">LPASWG · Southwest Coast Team (Puerto Rico, Amadores, Mogán, Playa del Cura)</option>
                          <option value="LPASEG">LPASEG · Southeast Coast Team (Maspalomas, Meloneras, San Agustín, Playa del Inglés)</option>
                          </optgroup>
                          <optgroup label="- - T H A I L A N D - -">
                              <option value="BKKGOP">BKKGOP · Bangkok</option>
                              <option value="LNTGOP">LNTGOP · Koh Lanta</option>
                              <option value="HKTGOP">HKTGOP · Phuket</option>
                              <option value="KBVGOP">KBVGOP · Krabi</option>
                              <option value="USMGOP">USMGOP · Koh Samui</option>
                          </optgroup>

              </select></div>
              <div class="field"><label>Staff audience</label><select id="docAudience"><option value="">All</option><option value="OPERATIONS">Operations</option><option value="DESTINATION_STAFF">Destination Staff</option><option value="CUSTOMER_CARE">Customer Care</option><option value="PARTNER_MANAGEMENT">Partner Management</option></select></div>
              <button class="btn" id="searchDocsBtn">Run search</button>
            </div>
          </div>
          <div class="register-head" aria-hidden="true">
            <span>Document identity / description</span>
            <span>Category</span>
            <span>Revision</span>
            <span>Status</span>
            <span>Publisher actions</span>
          </div>
          <div id="docTable" class="table"></div>
        </section>

        <section class="panel" id="panel-editor">
          <div class="card">
            <div class="card-head">
              <div>
                <h2 id="editorTitle">Add document / new revision</h2>
                <p>Controlled PDF ingestion with mandatory publication metadata and revision traceability.</p>
              </div>
              <span class="required-tag">REQUIRED FIELDS MUST BE COMPLETED</span>
            </div>
            <div class="card-body">
              <div class="ingestion-layout">
                <div class="upload-engine">
                  <div class="upload-engine-head">
                    <b>PDF ingestion engine</b>
                    <span>ACCEPTED: APPLICATION/PDF · SINGLE FILE</span>
                  </div>
                  <div class="upload-target" id="pdfDropzone" tabindex="0" role="button" aria-label="Select or drop a PDF file">
                    <div class="upload-picker">
                      <div class="upload-icon" aria-hidden="true"></div>
                      <strong>Select or drop the controlled source PDF</strong>
                      <p>The PDF is selected inside this HTML embed and uploaded to Supabase Storage through a signed upload URL.</p>
                      <input id="docControlUploadButton" class="pdf-file-input" type="file" accept="application/pdf,.pdf" aria-describedby="uploadFileState">
                      <div id="uploadFileState" class="file-state" aria-live="polite">No PDF selected</div>
                    </div>
                  </div>
                  <div class="upload-engine-foot">
                    <span id="uploadEngineStatus">PDF validation occurs before the Supabase upload request.</span>
                    <span>One PDF per publication action.</span>
                  </div>
                </div>
                <aside class="compliance-box">
                  <h3>Pre-publication control check</h3>
                  <ul class="compliance-list">
                    <li>Source file is an approved PDF.</li>
                    <li>Document code matches the controlled register.</li>
                    <li>Revision identifier is unique and verified.</li>
                    <li>Effective date and audience are confirmed.</li>
                    <li>Critical and acknowledgement flags are reviewed.</li>
                  </ul>
                  <div class="note">
                    The HTML file input <strong>#docControlUploadButton</strong> is the upload control. Secure Supabase upload authorization is requested automatically before the selected PDF is transferred.
                  </div>
                </aside>
              </div>

              <div class="form-section">
                <div class="form-section-title">A. Controlled document identity</div>
                <div class="form-section-body">
                  <div class="grid">
                    <div class="field wide"><label>Document title</label><input id="title" placeholder="SKANDI Destination Services Manual"></div>
                    <div class="field"><label>Short title</label><input id="shortTitle" placeholder="Destination Services"></div>
                    <div class="field"><label>Document code</label><input id="documentCode" placeholder="DSM"></div>
                    <div class="field"><label>Document owner</label><input id="owner" value="SKANDI Travels" placeholder="SKANDI Travels"></div>
                    <div class="field"><label>Revision</label><input id="revision" placeholder="14"></div>
                    <div class="field"><label>Effective date</label><input id="effectiveDate" type="date"></div>
                    <div class="field"><label>Publication status</label><select id="publishStatus"><option>PUBLISHED</option><option>DRAFT</option></select></div>
                    <div class="field"><label>Viewer page count</label><input id="pageCount" type="number" min="1" value="1"></div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">B. Classification, audience and compliance controls</div>
                <div class="form-section-body">
                  <div class="grid">
                    <div class="field"><label>Document type</label><select id="documentType"><option>Manual</option><option>Procedure</option><option>Notice</option><option>Training</option><option>Form</option><option>Checklist</option><option>Policy</option></select></div>
                    <div class="field"><label>Category</label><select id="category"></select></div>
                    <div class="field"><label>Service applicability</label><select id="services" multiple><option value="ALL">All Services</option><option value="DESTINATION">Destination Services</option><option value="TRANSFERS">Transfers</option><option value="TOURS">Tours &amp; Activities</option><option value="PACKAGES">Travel Packages</option></select><div class="field-hint">Select one or more. Use All Services only for company-wide documents.</div></div>
                    <div class="field"><label>Operating markets</label><select id="markets" multiple><option value="ALL">All Markets</option>
<optgroup label="Headquarters & Admin">
<option value="NYCXEC">NYCXEC · New York City Global HQ</option>
<option value="STOXEC">STOXEC · Stockholm Regional HQ</option>
<option value="BKKXEC">BKKXEC · Bangkok Main Asia Office</option>
</optgroup>
<optgroup label="United States">
<option value="NYCGOP">NYCGOP · New York City</option>
<option value="ORLGOP">ORLGOP · Orlando</option>
<option value="MIAGOP">MIAGOP · Miami</option>
<option value="LAXGOP">LAXGOP · Los Angeles</option>
<option value="LASGOP">LASGOP · Las Vegas</option>
<option value="SFOGOP">SFOGOP · San Francisco</option>
</optgroup>
<optgroup label="Sweden">
<option value="STOGOP">STOGOP · Stockholm</option>
<option value="GOTGOP">GOTGOP · Gothenburg</option>
<option value="KRNGOP">KRNGOP · Kiruna</option>
<option value="KRNICE">KRNICE · Jukkasjärvi / ICEHOTEL Field Team</option>
<option value="LLAGOP">LLAGOP · Luleå</option>
<option value="BDNGOP">BDNGOP · Boden / TREEHOTEL</option>
</optgroup>
<optgroup label="Norway">
<option value="OSLGOP">OSLGOP · Oslo</option>
<option value="TOSGOP">TOSGOP · Tromsø</option>
</optgroup>
<optgroup label="Denmark"><option value="CPHGOP">CPHGOP · Copenhagen</option></optgroup>
<optgroup label="Finland">
<option value="HELGOP">HELGOP · Helsinki</option>
<option value="RVNGOP">RVNGOP · Rovaniemi</option>
</optgroup>
<optgroup label="Greece">
<option value="JMKGOP">JMKGOP · Mykonos</option>
<option value="CHQGOP">CHQGOP · Crete / Chania</option>
<option value="HERGOP">HERGOP · Crete / Heraklion</option>
<option value="SKGGOP">SKGGOP · Thessaloniki</option>
<option value="RHOGOP">RHOGOP · Rhodes</option>
<option value="JTRGOP">JTRGOP · Santorini</option>
<option value="JSIGOP">JSIGOP · Skiathos</option>
</optgroup>
<optgroup label="Spain">
<option value="AGPGOP">AGPGOP · Malaga</option>
<option value="ALCGOP">ALCGOP · Alicante</option>
<option value="PMIGOP">PMIGOP · Palma de Mallorca</option>
<option value="TCIGOP">TCIGOP · Tenerife</option>
<option value="FUEGOP">FUEGOP · Fuerteventura</option>
<option value="LPAGOP">LPAGOP · Las Palmas / Gran Canaria</option>
<option value="LPASWG">LPASWG · Gran Canaria Southwest Coast Team</option>
<option value="LPASEG">LPASEG · Gran Canaria Southeast Coast Team</option>
</optgroup>
<optgroup label="Thailand">
<option value="BKKGOP">BKKGOP · Bangkok</option>
<option value="LNTGOP">LNTGOP · Koh Lanta</option>
<option value="HKTGOP">HKTGOP · Phuket</option>
<option value="KBVGOP">KBVGOP · Krabi</option>
<option value="USMGOP">USMGOP · Koh Samui</option>
</optgroup></select><div class="field-hint">Matches the market codes used by the staff viewer.</div></div>
                    <div class="field"><label>Staff audiences</label><select id="audiences" multiple><option value="ALL">All Teams</option><option value="OPERATIONS">Operations</option><option value="DESTINATION_STAFF">Destination Staff</option><option value="CUSTOMER_CARE">Customer Care</option><option value="PARTNER_MANAGEMENT">Partner Management</option></select><div class="field-hint">Controls staff assignment and viewer applicability.</div></div>
                    <div class="field"><label>Requires acknowledgement</label><select id="requiresAcknowledgement"><option value="false">No</option><option value="true">Yes</option></select></div>
                    <div class="field"><label>Critical document</label><select id="isCritical"><option value="false">No</option><option value="true">Yes</option></select></div>
                    <div class="field wide"><label>Tags</label><input id="tags" placeholder="destination services, transfers, guest care"></div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">C. Staff-facing abstract and retrieval indexing</div>
                <div class="form-section-body">
                  <div class="grid">
                    <div class="field full"><label>Controlled summary</label><textarea id="summary" placeholder="Visible staff summary"></textarea></div>
                    <div class="field full"><label>Search keywords / PDF table of contents</label><textarea id="searchText" placeholder="Add searchable phrases, sections, chapters and keywords."></textarea></div>
                  </div>
                </div>
              </div>

              
<div class="form-section" id="documentAccessSection">
  <div class="form-section-title">Customer access & operational channel availability</div>
  <div class="form-section-body">
    <div class="grid">
      <div class="field"><label>Public blank template</label><select id="publicTemplateAccess"><option value="HIDDEN">Hidden</option><option value="OPEN">Open access</option></select><div class="field-hint">Open access exposes only a blank template. It never exposes a booking instance.</div></div>
      <div class="field"><label>Customer instance access</label><select id="customerInstanceAccess"><option value="NONE">No customer instance</option><option value="SECURE_MEMBER_OR_ACCESS_CODE">Member login or access code</option></select></div>
      <div class="field"><label>Blank download</label><select id="allowBlankDownload"><option value="false">No</option><option value="true">Yes</option></select></div><div class="field"><label>Blank online fill</label><select id="allowBlankFill"><option value="false">No</option><option value="true">Yes</option></select></div>
      <div class="field"><label>Customer self-start</label><select id="allowSelfStart"><option value="false">No</option><option value="true">Yes</option></select></div>
      <div class="field"><label>Reservations</label><select id="reservationsAvailable"><option value="false">Not available</option><option value="true">Available to booking agents</option></select></div>
      <div class="field"><label>Departure Control</label><select id="departureControlAvailable"><option value="false">Not available</option><option value="true">Available at airport</option></select></div>
      <div class="field"><label>DocuNet</label><select id="docunetAvailable"><option value="true">Available internally</option><option value="false">Hidden</option></select></div>
      <div class="field"><label>Sensitivity</label><select id="sensitivityClass"><option>STANDARD</option><option>IDENTITY_PII</option><option>HEALTH</option><option>MINOR</option><option>FINANCIAL</option><option>OPERATIONAL_SAFETY</option><option>COMMERCIAL_CONTRACT</option></select></div>
      <div class="field full"><label>Official source URL</label><input id="officialSourceUrl" placeholder="Optional official regulator / government source"></div>
    </div>
    <div class="note">Template changes create a controlled revision. Issued passenger documents are immutable and are never rewritten by changing the master template.</div>
  </div>
</div>

<div class="editor-actions">
                <button class="btn secondary" id="clearDocBtn">Clear form</button>
                <button class="btn secondary" id="saveMetaBtn">Save metadata only</button>
                <button class="btn" id="saveDocBtn">Upload PDF and publish record</button>
              </div>
            </div>
          </div>
        </section>

        <section class="panel" id="panel-categories">
          <div class="category-grid">
            <div class="card">
              <div class="card-head">
                <div><h2 id="catEditorTitle">Add category</h2><p>Maintain the controlled library folder structure.</p></div>
              </div>
              <div class="card-body">
                <div class="form-section">
                  <div class="form-section-title">Category definition</div>
                  <div class="form-section-body">
                    <div class="field"><label>Category title</label><input id="catTitle" placeholder="Destination Operations"></div>
                    <div class="field"><label>Description</label><textarea id="catDescription" placeholder="What this controlled folder contains"></textarea></div>
                    <div class="grid">
                      <div class="field"><label>Sort order</label><input id="catSortOrder" type="number" value="10"></div>
                      <div class="field"><label>Active</label><select id="catActive"><option value="true">Yes</option><option value="false">No</option></select></div>
                    </div>
                  </div>
                </div>
                <div class="actions">
                  <button class="btn secondary" id="clearCatBtn">Clear</button>
                  <button class="btn" id="saveCatBtn">Save category</button>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-head"><div><h2>Category register</h2><p>Active and hidden folders available to the publication workflow.</p></div></div>
              <div class="card-body"><div id="catTable" class="table"></div></div>
            </div>
          </div>
        </section>

        <section class="panel" id="panel-audit">
          <div class="card">
            <div class="card-head">
              <div><h2>Audit and traceability register</h2><p>Document publication, reading, acknowledgement, category and administrative events.</p></div>
            </div>
            <div class="audit-guide" aria-hidden="true">
              <div><b>Scope</b><span>ALL EVENTS</span></div>
              <div><b>Order</b><span>NEWEST FIRST</span></div>
              <div><b>Control state</b><span>READ ONLY</span></div>
              <div><b>Source</b><span>SUPABASE</span></div>
            </div>
          </div>
          <div id="auditTable" class="table"></div>
        </section>
      </div>
    </main>
  </div>
</div>
<footer class="global-footer">
  <div class="global-footer-section"><strong>© 2026 SKANDI Travels</strong><span>Privacy</span><span>Terms of Access</span><span class="global-build">Build v2.14.8</span><span class="global-operational">Operational</span></div>
  <div class="global-footer-section"><button data-global-path="/riaintra/success-factors/helpdesk">HelpDesk</button><button id="globalSecurityBtn">Session Security</button></div>
</footer>

<script>
const SOURCE="SKANDI_DOCUNET_ADMIN";
const MODULE="SKANDI_DOCUNET_ADMIN";
const SCHEMA_VERSION="SKANDI_DOCUNET_V1";
const SERVICE_LABELS={ALL:"All Services",DESTINATION:"Destination Services",TRANSFERS:"Transfers",TOURS:"Tours & Activities",PACKAGES:"Travel Packages"};
const MARKET_LABELS={ALL:"All Markets",USNYC:"USNYC · New York",SESTO:"SESTO · Stockholm",GRHER:"GRHER · Crete"};
const AUDIENCE_LABELS={ALL:"All Teams",OPERATIONS:"Operations",DESTINATION_STAFF:"Destination Staff",CUSTOMER_CARE:"Customer Care",PARTNER_MANAGEMENT:"Partner Management"};
let state={session:{},categories:[],documents:[],audit:[],editingDocId:"",editingCatId:"",previewUrl:"",selectedPdfFile:null,pendingUpload:null,uploadRequestId:"",uploadInFlight:false};
const MAX_PDF_BYTES=150*1024*1024;

const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,module:MODULE,schemaVersion:SCHEMA_VERSION,type,...payload},"*")}
function initLocalUtilities(){
  document.querySelectorAll("[data-global-path]").forEach(button=>{
    button.onclick=()=>post("NAVIGATE",{path:button.dataset.globalPath});
  });
  const security=$("globalSecurityBtn");
  if(security)security.onclick=()=>alert("Authenticated staff session · Controlled internal access · Supabase credentials remain backend-only.");
}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function arr(v){return Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function selectedCodes(id){
  const values=[...$(id).selectedOptions].map(o=>o.value).filter(Boolean);
  if(values.includes("ALL"))return ["ALL"];
  return values.length?values:["ALL"];
}
function setSelectedCodes(id,values){
  const selected=arr(values);const normalized=selected.length?selected:["ALL"];
  [...$(id).options].forEach(option=>option.selected=normalized.includes(option.value));
}
function labels(values,map){return arr(values).map(value=>map[value]||value)}
function normalizedAudienceValues(d){
  const values=arr(d.audiences||d.applicability?.audiences||d.audience);
  const aliases={"All staff":"ALL","Ground Operations":"OPERATIONS","Admin":"OPERATIONS","Management":"OPERATIONS"};
  return values.length?values.map(value=>aliases[value]||value):["ALL"];
}
function status(msg,mode=""){const e=$("status");e.textContent=msg||"";e.className=msg?`status show ${mode}`:"status"}
function fmt(v){if(!v)return "";try{return new Date(v).toLocaleDateString()}catch(e){return String(v)}}
function activePanel(name){
  document.querySelectorAll("[data-panel]").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===`panel-${name}`));
}
function categoryTitles(){return state.categories.map(c=>c.title||c.name||c.category).filter(Boolean)}
function setCategoryOptions(){
  const opts=`<option value="">All</option>`+categoryTitles().map(c=>`<option>${esc(c)}</option>`).join("");
  $("docCategory").innerHTML=opts;
  $("category").innerHTML=categoryTitles().map(c=>`<option>${esc(c)}</option>`).join("");
}
function docFilters(){return {query:$("docQuery").value.trim(),category:$("docCategory").value,publishStatus:$("docStatus").value,documentType:$("docType").value,service:$("docService").value,market:$("docMarket").value,audience:$("docAudience").value,admin:true,schemaVersion:SCHEMA_VERSION}}
function load(){status("Loading document control...");post("ADMIN_BOOTSTRAP")}
function searchDocs(){status("Searching documents...");post("ADMIN_SEARCH_DOCS",{filters:docFilters()})}
function renderBootstrap(payload){
  state.session=payload.session||{};state.categories=payload.categories||[];setCategoryOptions();
  renderCategories();
  post("ADMIN_SEARCH_DOCS",{filters:docFilters()});
  post("ADMIN_AUDIT_SEARCH",{});
}
function pills(d){
  const p=[];
  p.push(`<span class="pill ${d.publishStatus==="PUBLISHED"?"green":d.publishStatus==="ARCHIVED"?"red":"orange"}">${esc(d.publishStatus||"DRAFT")}</span>`);
  p.push(`<span class="pill">${esc(d.category||"Uncategorised")}</span>`);
  p.push(`<span class="pill">${esc(d.documentType||"Document")}</span>`);
  if(d.revision)p.push(`<span class="pill gray">Rev ${esc(d.revision)}</span>`);
  const serviceValues=arr(d.services||d.applicability?.services);
  const marketValues=arr(d.markets||d.applicability?.markets);
  const audienceValues=normalizedAudienceValues(d);
  if(serviceValues.length)p.push(`<span class="pill">${esc(labels(serviceValues,SERVICE_LABELS).join(", "))}</span>`);
  if(marketValues.length)p.push(`<span class="pill gray">${esc(labels(marketValues,MARKET_LABELS).join(", "))}</span>`);
  if(audienceValues.length)p.push(`<span class="pill gray">${esc(labels(audienceValues,AUDIENCE_LABELS).join(", "))}</span>`);
  if(d.requiresAcknowledgement)p.push(`<span class="pill orange">Ack required</span>`);
  if(d.isCritical)p.push(`<span class="pill red">Critical</span>`);
  return p.join("");
}
function renderDocs(payload){
  state.documents=payload.documents||[];
  if(!state.documents.length){$("docTable").innerHTML=`<div class="card"><p>No documents found.</p></div>`;status("");return;}
  $("docTable").innerHTML=state.documents.map(d=>`
    <article class="row">
      <div>
        <div class="meta">${pills(d)}</div>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.documentCode||"")} · ${esc(d.summary||"")} ${d.effectiveDate?" · Effective "+esc(fmt(d.effectiveDate)):""}</p>
      </div>
      <div class="actions">
        ${(d.latestStoragePath||d.publishStatus==="PUBLISHED")?`<button class="btn secondary" data-preview-id="${esc(d._id)}" data-title="${esc(d.title)}">Read/preview</button>`:""}
        <button class="btn secondary" data-edit="${esc(d._id)}">Adjust</button>
        <button class="btn" data-revise="${esc(d._id)}">New revision</button>
        ${d.publishStatus==="ARCHIVED"?`<button class="btn green" data-restore="${esc(d._id)}">Restore</button>`:`<button class="btn warn" data-archive="${esc(d._id)}">Archive</button>`}
        <button class="btn danger" data-delete="${esc(d._id)}">Delete</button>
      </div>
    </article>`).join("");
  document.querySelectorAll("[data-preview-id]").forEach(b=>b.onclick=()=>post("ADMIN_DOC_PREVIEW",{documentId:b.dataset.previewId,title:b.dataset.title}));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editDoc(b.dataset.edit,false));
  document.querySelectorAll("[data-revise]").forEach(b=>b.onclick=()=>editDoc(b.dataset.revise,true));
  document.querySelectorAll("[data-archive]").forEach(b=>b.onclick=()=>post("ADMIN_DOC_STATUS",{documentId:b.dataset.archive,publishStatus:"ARCHIVED"}));
  document.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>post("ADMIN_DOC_STATUS",{documentId:b.dataset.restore,publishStatus:"PUBLISHED"}));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(confirm("Delete this document and all revisions?"))post("ADMIN_DOC_DELETE",{documentId:b.dataset.delete})});
  status("");
}
function preview(url,title){
  state.previewUrl=url;$("viewerTitle").textContent=title||"Document preview";$("viewerMeta").textContent=url;$("pdfFrame").src=`${url}#toolbar=1&navpanes=1&view=FitH`;$("viewer").classList.add("open");window.scrollTo({top:0,behavior:"smooth"});
}
function bytesLabel(bytes){
  const units=["B","KB","MB","GB"];let value=Number(bytes||0),i=0;
  while(value>=1024&&i<units.length-1){value/=1024;i++;}
  return `${value.toFixed(i?1:0)} ${units[i]}`;
}
function fileState(message,mode=""){
  const el=$("uploadFileState");if(!el)return;
  el.textContent=message;el.className=`file-state ${mode}`.trim();
}
function validatePdf(file){
  if(!file)return "Select a PDF file.";
  const name=String(file.name||"");
  const pdfType=file.type==="application/pdf"||/\.pdf$/i.test(name);
  if(!pdfType)return "Only PDF files are accepted.";
  if(!file.size)return "The selected PDF is empty.";
  if(file.size>MAX_PDF_BYTES)return `The PDF exceeds the ${bytesLabel(MAX_PDF_BYTES)} limit.`;
  return "";
}
function selectPdf(file){
  const error=validatePdf(file);
  if(error){state.selectedPdfFile=null;fileState(error,"error");status(error,"warn");return false;}
  state.selectedPdfFile=file;
  fileState(`${file.name} · ${bytesLabel(file.size)} · PDF READY`,"ready");
  $("uploadEngineStatus").textContent="PDF selected and ready for secure Supabase upload.";
  status("PDF selected. Complete the metadata and publish when ready.","ok");
  return true;
}
function setUploadBusy(busy,message=""){
  state.uploadInFlight=busy;
  $("saveDocBtn").disabled=busy;
  $("docControlUploadButton").disabled=busy;
  if(message)fileState(message,busy?"uploading":"ready");
}
function requestSupabaseUpload(){
  const meta=collectDoc();
  if(!meta.title||!meta.documentCode||!meta.revision)return status("Title, code and revision are required.","warn");
  const input=$("docControlUploadButton");
  const file=state.selectedPdfFile||input.files?.[0];
  const error=validatePdf(file);
  if(error){fileState(error,"error");return status(error,"warn");}
  state.selectedPdfFile=file;
  state.uploadRequestId=`DOCUP-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  state.pendingUpload={metadata:meta,file};
  setUploadBusy(true,`REQUESTING SIGNED SUPABASE URL · ${file.name}`);
  status("Requesting secure Supabase upload authorization...","warn");
  post("ADMIN_SUPABASE_UPLOAD_INIT",{
    requestId:state.uploadRequestId,
    metadata:meta,
    file:{name:file.name,size:file.size,type:file.type||"application/pdf",lastModified:file.lastModified},
    storageProvider:"SUPABASE"
  });
}
async function uploadToSupabase(payload){
  const pending=state.pendingUpload;
  if(!pending||!pending.file)return status("The selected PDF is no longer available. Select it again.","error");
  if(payload.requestId&&payload.requestId!==state.uploadRequestId)return;
  const uploadUrl=payload.uploadUrl||payload.signedUrl;
  if(!uploadUrl){setUploadBusy(false);return status("Supabase upload authorization did not include an upload URL.","error");}
  try{
    const headers={"Content-Type":pending.file.type||"application/pdf",...(payload.headers||{})};
    setUploadBusy(true,`UPLOADING TO SUPABASE · ${pending.file.name} · ${bytesLabel(pending.file.size)}`);
    status("Uploading PDF directly to Supabase Storage...","warn");
    const response=await fetch(uploadUrl,{method:payload.method||"PUT",headers,body:pending.file});
    if(!response.ok){let detail="";try{detail=await response.text()}catch(_e){}throw new Error(`Upload failed (${response.status})${detail?`: ${detail.slice(0,240)}`:""}`);}
    fileState(`${pending.file.name} · UPLOAD COMPLETE · WAITING FOR RECORD SAVE`,"ready");
    status("PDF uploaded. Saving the controlled document record...","warn");
    post("ADMIN_DOC_SAVE_WITH_UPLOAD",{
      requestId:state.uploadRequestId,
      metadata:pending.metadata,
      storageProvider:"SUPABASE",
      file:{name:pending.file.name,size:pending.file.size,type:pending.file.type||"application/pdf",lastModified:pending.file.lastModified},
      storage:{bucket:payload.bucket||"",path:payload.path||payload.storagePath||"",publicUrl:payload.publicUrl||"",signedReadUrl:payload.signedReadUrl||""}
    });
  }catch(error){
    setUploadBusy(false);
    fileState(`UPLOAD FAILED · ${error.message}`,"error");
    status(error.message||"Supabase PDF upload failed.","error");
    post("ADMIN_SUPABASE_UPLOAD_FAILED",{requestId:state.uploadRequestId,message:error.message||"Upload failed"});
  }
}
function bindPdfUpload(){
  const input=$("docControlUploadButton"),drop=$("pdfDropzone");
  input.addEventListener("change",()=>selectPdf(input.files?.[0]));
  ["dragenter","dragover"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();if(!state.uploadInFlight)drop.classList.add("dragover")}));
  ["dragleave","drop"].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove("dragover")}));
  drop.addEventListener("drop",e=>{if(state.uploadInFlight)return;const file=e.dataTransfer?.files?.[0];if(file&&selectPdf(file)){try{const dt=new DataTransfer();dt.items.add(file);input.files=dt.files}catch(_e){}}});
  drop.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!state.uploadInFlight&&e.target===drop){e.preventDefault();input.click()}});
}
function clearDoc(){
  state.editingDocId="";state.selectedPdfFile=null;state.pendingUpload=null;state.uploadRequestId="";state.uploadInFlight=false;$("editorTitle").textContent="Add document / new revision";
  ["title","shortTitle","documentCode","revision","effectiveDate","tags","summary","searchText"].forEach(id=>$(id).value="");
  $("owner").value="SKANDI Travels";$("pageCount").value="1";$("documentType").value="Manual";$("publishStatus").value="PUBLISHED";$("requiresAcknowledgement").value="false";$("isCritical").value="false";
  setSelectedCodes("services",["ALL"]);setSelectedCodes("markets",["ALL"]);setSelectedCodes("audiences",["ALL"]);
  const input=$("docControlUploadButton");if(input){input.value="";input.disabled=false;}$("saveDocBtn").disabled=false;
  fileState("No PDF selected");$("uploadEngineStatus").textContent="PDF validation occurs before the Supabase upload request.";
  if($("publicTemplateAccess"))$("publicTemplateAccess").value="HIDDEN";
  if($("customerInstanceAccess"))$("customerInstanceAccess").value="NONE";
  if($("allowBlankDownload"))$("allowBlankDownload").value="false";
  if($("allowBlankFill"))$("allowBlankFill").value="false";
  if($("allowSelfStart"))$("allowSelfStart").value="false";
  if($("reservationsAvailable"))$("reservationsAvailable").value="false";
  if($("departureControlAvailable"))$("departureControlAvailable").value="false";
  if($("docunetAvailable"))$("docunetAvailable").value="true";
  if($("sensitivityClass"))$("sensitivityClass").value="STANDARD";
  if($("officialSourceUrl"))$("officialSourceUrl").value="";
}
function editDoc(id,revisionMode){
  const d=state.documents.find(x=>x._id===id)||{};
  activePanel("editor");state.editingDocId=id;
  $("editorTitle").textContent=revisionMode?"Add new revision":"Adjust document";
  $("title").value=d.title||"";$("shortTitle").value=d.shortTitle||d.short||"";$("documentCode").value=d.documentCode||d.code||"";$("owner").value=d.owner||"SKANDI Travels";$("revision").value=revisionMode?"":(d.revision||"");$("pageCount").value=Number(d.pageCount||d.pages||1);
  $("documentType").value=d.documentType||"Manual";$("category").value=d.category||d.group||"";
  setSelectedCodes("services",d.services||d.applicability?.services||["ALL"]);setSelectedCodes("markets",d.markets||d.applicability?.markets||["ALL"]);setSelectedCodes("audiences",normalizedAudienceValues(d));
  $("effectiveDate").value=d.effectiveDate?String(d.effectiveDate).slice(0,10):"";$("publishStatus").value=d.publishStatus==="ARCHIVED"?"DRAFT":(d.publishStatus||"PUBLISHED");
  $("tags").value=arr(d.tags).join(", ");$("requiresAcknowledgement").value=String(!!d.requiresAcknowledgement);$("isCritical").value=String(!!d.isCritical);$("summary").value=d.summary||"";$("searchText").value=d.searchText||"";const ap=d.accessPolicy||{};if($("publicTemplateAccess"))$("publicTemplateAccess").value=ap.publicTemplateAccess||d.publicTemplateAccess||"HIDDEN";if($("customerInstanceAccess"))$("customerInstanceAccess").value=ap.customerInstanceAccess||d.customerInstanceAccess||"NONE";if($("allowBlankDownload"))$("allowBlankDownload").value=String(!!(ap.allowBlankDownload??d.allowBlankDownload));if($("allowBlankFill"))$("allowBlankFill").value=String(!!(ap.allowBlankFill??d.allowBlankFill));if($("allowSelfStart"))$("allowSelfStart").value=String(!!(ap.allowSelfStart??d.allowSelfStart));if($("reservationsAvailable"))$("reservationsAvailable").value=String(!!(ap.reservationsAvailable??d.reservationsAvailable));if($("departureControlAvailable"))$("departureControlAvailable").value=String(!!(ap.departureControlAvailable??d.departureControlAvailable));if($("docunetAvailable"))$("docunetAvailable").value=String(ap.docunetAvailable??d.docunetAvailable??true);if($("sensitivityClass"))$("sensitivityClass").value=ap.sensitivityClass||d.sensitivityClass||"STANDARD";if($("officialSourceUrl"))$("officialSourceUrl").value=ap.officialSourceUrl||d.officialSourceUrl||"";
  status(revisionMode?"Select a PDF and enter the new revision before saving.":"Adjust metadata, or select a PDF to replace/add a revision.","warn");
}
function collectDoc(){
  const services=selectedCodes("services"),markets=selectedCodes("markets"),audiences=selectedCodes("audiences");
  const metadata={documentId:state.editingDocId,title:$("title").value.trim(),shortTitle:$("shortTitle").value.trim(),documentCode:$("documentCode").value.trim(),owner:$("owner").value.trim()||"SKANDI Travels",revision:$("revision").value.trim(),documentType:$("documentType").value,category:$("category").value,group:$("category").value,services,markets,audiences,audience:audiences.join(","),applicability:{services,markets,audiences},effectiveDate:$("effectiveDate").value,publishStatus:$("publishStatus").value,pageCount:Math.max(1,Number($("pageCount").value||1)),pages:Math.max(1,Number($("pageCount").value||1)),tags:arr($("tags").value),requiresAcknowledgement:$("requiresAcknowledgement").value==="true",isCritical:$("isCritical").value==="true",summary:$("summary").value.trim(),searchText:$("searchText").value.trim(),schemaVersion:SCHEMA_VERSION};
  metadata.accessPolicy={publicTemplateAccess:$("publicTemplateAccess")?.value||"HIDDEN",customerInstanceAccess:$("customerInstanceAccess")?.value||"NONE",allowBlankDownload:$("allowBlankDownload")?.value==="true",allowBlankFill:$("allowBlankFill")?.value==="true",allowSelfStart:$("allowSelfStart")?.value==="true",reservationsAvailable:$("reservationsAvailable")?.value==="true",departureControlAvailable:$("departureControlAvailable")?.value==="true",docunetAvailable:$("docunetAvailable")?.value!=="false",docunetAdminAvailable:true,sensitivityClass:$("sensitivityClass")?.value||"STANDARD",officialSourceUrl:$("officialSourceUrl")?.value.trim()||""};metadata.viewerMapping={id:metadata.documentId||metadata.documentCode.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),code:metadata.documentCode,title:metadata.title,short:metadata.shortTitle||metadata.title,group:metadata.group,owner:metadata.owner,revision:metadata.revision,revisionDate:metadata.effectiveDate,status:metadata.publishStatus==="PUBLISHED"?"Active":metadata.publishStatus==="ARCHIVED"?"Archived":"Draft",updated:true,services,markets,audiences,pages:metadata.pages};
  return metadata;
}
function renderCategories(){
  setCategoryOptions();
  if(!state.categories.length){$("catTable").innerHTML=`<p>No categories yet.</p>`;return;}
  $("catTable").innerHTML=state.categories.map(c=>`
    <article class="row">
      <div>
        <div class="meta"><span class="pill ${c.active===false?"red":"green"}">${c.active===false?"Hidden":"Active"}</span><span class="pill gray">Order ${esc(c.sortOrder??"")}</span></div>
        <h3>${esc(c.title||c.name)}</h3><p>${esc(c.description||"")}</p>
      </div>
      <div class="actions"><button class="btn secondary" data-catedit="${esc(c._id)}">Adjust</button><button class="btn danger" data-catdelete="${esc(c._id)}">Delete</button></div>
    </article>`).join("");
  document.querySelectorAll("[data-catedit]").forEach(b=>b.onclick=()=>editCat(b.dataset.catedit));
  document.querySelectorAll("[data-catdelete]").forEach(b=>b.onclick=()=>{if(confirm("Delete category? Documents keep their category text but this folder option is removed."))post("ADMIN_CATEGORY_DELETE",{categoryId:b.dataset.catdelete})});
}
function clearCat(){state.editingCatId="";$("catEditorTitle").textContent="Add category";$("catTitle").value="";$("catDescription").value="";$("catSortOrder").value="10";$("catActive").value="true"}
function editCat(id){const c=state.categories.find(x=>x._id===id)||{};state.editingCatId=id;$("catEditorTitle").textContent="Adjust category";$("catTitle").value=c.title||c.name||"";$("catDescription").value=c.description||"";$("catSortOrder").value=c.sortOrder||10;$("catActive").value=String(c.active!==false)}
function collectCat(){return {categoryId:state.editingCatId,title:$("catTitle").value.trim(),description:$("catDescription").value.trim(),sortOrder:Number($("catSortOrder").value||0),active:$("catActive").value==="true"}}
function renderAudit(payload){
  state.audit=payload.events||[];
  $("auditTable").innerHTML=state.audit.length?state.audit.map(a=>`<article class="row"><div><div class="meta"><span class="pill">${esc(a.eventType)}</span><span class="pill gray">${esc(fmt(a.createdAt))}</span></div><h3>${esc(a.staffName||a.staffEmail||"System")}</h3><p>${esc(JSON.stringify(a.payload||{}))}</p></div></article>`).join(""):`<div class="card"><p>No audit events found.</p></div>`;
}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>activePanel(b.dataset.panel));
$("refreshBtn").onclick=load;$("staffPageBtn").onclick=()=>post("ADMIN_NAVIGATE_STAFF");$("searchDocsBtn").onclick=searchDocs;$("docQuery").addEventListener("keydown",e=>{if(e.key==="Enter")searchDocs()});
["docCategory","docStatus","docType","docService","docMarket","docAudience"].forEach(id=>$(id).onchange=searchDocs);
$("saveDocBtn").onclick=requestSupabaseUpload;
$("saveMetaBtn").onclick=()=>{const meta=collectDoc();if(!meta.title||!meta.documentCode)return status("Title and code are required.","warn");status("Saving metadata...");post("ADMIN_DOC_SAVE_METADATA",{metadata:meta})};
$("clearDocBtn").onclick=clearDoc;$("saveCatBtn").onclick=()=>{const category=collectCat();if(!category.title)return status("Category title is required.","warn");post("ADMIN_CATEGORY_SAVE",{category})};$("clearCatBtn").onclick=clearCat;
$("closeViewerBtn").onclick=()=>{$("viewer").classList.remove("open");$("pdfFrame").src=""};$("openFullBtn").onclick=()=>state.previewUrl?window.open(state.previewUrl,"_blank"):"";
window.addEventListener("message",e=>{
  const m=e.data||{};if(!String(m.type||"").startsWith("ADMIN_"))return;
  if(m.type==="ADMIN_BOOTSTRAP_RESULT")renderBootstrap(m.payload||{});
  if(m.type==="ADMIN_SUPABASE_UPLOAD_READY")uploadToSupabase(m.payload||m);
  if(m.type==="ADMIN_SUPABASE_UPLOAD_ERROR"){setUploadBusy(false);fileState(m.message||"Supabase upload authorization failed.","error");status(m.message||"Supabase upload authorization failed.","error");}
  if(m.type==="ADMIN_DOC_SEARCH_RESULT")renderDocs(m.payload||{documents:[]});
  if(m.type==="ADMIN_DOC_PREVIEW_RESULT"){const p=m.payload||{};if(p.signedUrl)preview(p.signedUrl,p.title||"Document preview");else status("Preview URL was not returned.","error");}
  if(m.type==="ADMIN_CATEGORIES_RESULT"){state.categories=m.payload.categories||[];renderCategories();status(m.message||"Categories updated.","ok");}
  if(m.type==="ADMIN_DOC_RESULT"){status(m.message||"Document saved.","ok");clearDoc();activePanel("documents");searchDocs();post("ADMIN_AUDIT_SEARCH",{});}
  if(m.type==="ADMIN_AUDIT_RESULT")renderAudit(m.payload||{events:[]});
  if(m.type==="ADMIN_ERROR"){setUploadBusy(false);status(m.message||"Admin action failed.","error");}
});
bindPdfUpload();
initLocalUtilities();
post("ADMIN_READY",{storageProvider:"SUPABASE",htmlUploadControl:"docControlUploadButton",viewerSchema:{version:SCHEMA_VERSION,fields:["id","code","title","short","group","owner","revision","revisionDate","status","updated","services","markets","audiences","pages"]}});
</script>
</body>
</html>
```
