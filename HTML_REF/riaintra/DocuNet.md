# SKANDI INFO / LOG — V12 DOCUMENT SYSTEM CONVERGENCE

## CHANGE LOG (append-only)

- 2026-10-28 UTC — Updated `skandi-embeds/docunet/skandi-docunet.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **DocuNet** (`/riaintra/success-factors/docunet`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.


- Source identity: `/HTML_REF/riaintra/DocuNet.md`.
- Display/page name: DocuNet.
- System area: `RIAINTRA`.
- Wix controller: `/src/pages/DocuNet.twh13.js`.
- Route/context: `/riaintra/success-factors/docunet`.
- Wix HTML element: `#docuNetViewerEmbed`.
- Child source: `SKANDI_DOCUNET_VIEWER`; parent source: `SKANDI_WIX_PARENT`.
- Current status: **STATICALLY VERIFIED — REQUIRES LIVE TEST** after Wix installation/publication.
- Source-of-truth status: complete intended V12 HTML payload below.
- Canonical ownership: `backend/SKANDI_CORE/docuNet.web.js` → `docuNet.js` → DocuNet tables + private `docunet-controlled` storage.
- Authentication/authorization: public customer surfaces retain the existing customer/member boundary; internal surfaces require canonical `staffAuth` server authorization. Client-provided roles are not authority.
- Database verification: relevant tables/columns were inspected read-only against the active SKANDI Supabase project on 2026-10-13. No database rows, schema, policies or storage objects were changed.
- Document source archive: the supplied Dropbox folder could not be opened from the available runtime. No Dropbox document content was guessed or imported. The existing Supabase catalog remains authoritative for document definitions/rules until those source files are explicitly ingested.
- Last verified: 2026-10-13 UTC.
- Change log:
  - 2026-10-13 — Converged this surface onto `backend/SKANDI_CORE`, removed legacy/missing backend namespace dependency, preserved supplied HTML design/behavior, and documented the complete runtime chain.

## COMPLETE INTENDED HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>DocuNet | SKANDI Business Manual Viewer</title>
<style>
:root{
  --global-shell-h:52px;
  --global-footer-h:34px;
  --navy-950:#06233f;
  --navy-900:#0a3156;
  --navy-800:#124b7a;
  --navy-700:#176695;
  --cyan-500:#2fa9cf;
  --cyan-100:#e7f6fb;
  --slate-950:#17212b;
  --slate-900:#24313d;
  --slate-800:#344250;
  --slate-700:#4b5a68;
  --slate-600:#657584;
  --slate-500:#83909c;
  --slate-400:#a8b2bc;
  --slate-300:#cbd2d9;
  --slate-250:#d8dde2;
  --slate-200:#e3e7eb;
  --slate-150:#edf0f3;
  --slate-100:#f4f6f8;
  --paper:#fff;
  --workspace:#d8dde2;
  --green:#2e7d54;
  --green-bg:#e9f6ee;
  --amber:#a86400;
  --amber-bg:#fff4df;
  --red:#b93838;
  --red-bg:#fff0f0;
  --purple:#7757a8;
  --shadow:0 1px 2px rgba(13,31,48,.15),0 10px 28px rgba(13,31,48,.08);
  --font:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:"SFMono-Regular",Consolas,"Liberation Mono",monospace;
  --header-h:48px;
  --toolbar-h:45px;
  --tabs-h:35px;
  --status-h:29px;
  --sidebar-w:326px;
  --inspector-w:294px;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden;background:var(--workspace);color:var(--slate-950);font-family:var(--font);font-size:13px}
button,input,select{font:inherit;color:inherit}
button{cursor:pointer}
svg{display:block}
.hidden{display:none!important}
.app-shell{height:100dvh;display:grid;grid-template-rows:var(--header-h) auto auto minmax(0,1fr) auto;background:var(--workspace)}

/* Header */
.app-header{display:flex;align-items:center;background:linear-gradient(90deg,var(--navy-950),var(--navy-900) 68%,#0d416d);color:#fff;border-bottom:1px solid #00192e;box-shadow:0 1px 0 rgba(255,255,255,.08) inset;z-index:30}
.brand-block{height:100%;display:flex;align-items:center;gap:9px;padding:0 16px 0 14px;border-right:1px solid rgba(255,255,255,.16);min-width:244px}
.brand-mark{width:29px;height:29px;border:1px solid rgba(255,255,255,.48);border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08)}
.brand-copy{line-height:1.05}
.brand-name{font-size:20px;font-weight:650;letter-spacing:-.02em}
.brand-name span{font-weight:300;color:#d7edf7}
.brand-subtitle{margin-top:3px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#b8d4e5}
.header-nav{height:100%;display:flex;align-items:stretch}
.header-nav button{min-width:82px;border:0;border-right:1px solid rgba(255,255,255,.1);background:transparent;color:#dce8f0;padding:0 15px;font-size:12px}
.header-nav button:hover,.header-nav button.active{background:rgba(255,255,255,.1);color:#fff}
.header-nav button.active{box-shadow:inset 0 -3px var(--cyan-500)}
.header-spacer{flex:1}
.header-state{display:flex;align-items:center;gap:13px;padding:0 13px;font-size:11px;color:#d4e3ed}
.connection-pill{display:flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);padding:5px 9px;border-radius:2px}
.connection-dot{width:7px;height:7px;border-radius:50%;background:#5fd18d;box-shadow:0 0 0 2px rgba(95,209,141,.18)}
.user-menu{height:100%;display:flex;align-items:center;gap:8px;padding:0 14px;border-left:1px solid rgba(255,255,255,.13)}
.avatar{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#dbeaf2;color:var(--navy-950);font-size:10px;font-weight:700}
.user-meta{line-height:1.2}
.user-meta b{display:block;font-size:11px}.user-meta span{font-size:9px;color:#b8cedd}

/* Toolbar */
.global-toolbar{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f7f8fa;border-bottom:1px solid var(--slate-300);box-shadow:0 1px 0 #fff inset;z-index:25}
.tool-group{display:flex;align-items:center;border:1px solid var(--slate-300);background:#fff;border-radius:2px;overflow:hidden;height:31px}
.tool-btn{height:30px;min-width:31px;border:0;border-right:1px solid var(--slate-250);background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;font-size:11px;white-space:nowrap}
.tool-btn:last-child{border-right:0}.tool-btn:hover{background:var(--slate-100)}.tool-btn.active{background:var(--cyan-100);color:var(--navy-800)}
.toolbar-separator{width:1px;height:25px;background:var(--slate-300);margin:0 1px}
.global-search{position:relative;flex:1;max-width:590px;min-width:260px}
.global-search input{width:100%;height:32px;border:1px solid var(--slate-400);border-radius:2px;background:#fff;padding:0 88px 0 34px;outline:none;font-size:12px;box-shadow:0 1px 1px rgba(0,0,0,.03) inset}
.global-search input:focus{border-color:var(--navy-700);box-shadow:0 0 0 2px rgba(23,102,149,.14)}
.global-search .search-icon{position:absolute;left:10px;top:8px;color:var(--slate-600)}
.global-search .shortcut{position:absolute;right:7px;top:6px;border:1px solid var(--slate-300);background:var(--slate-100);color:var(--slate-600);font-family:var(--mono);font-size:9px;padding:3px 5px;border-radius:2px}
.effectivity-group{margin-left:auto;display:flex;align-items:center;gap:5px}
.effectivity-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate-600);font-weight:700;margin-right:2px}
.compact-select{height:31px;border:1px solid var(--slate-400);background:#fff;border-radius:2px;padding:0 27px 0 8px;font-size:11px;outline:none;min-width:126px}
.effectivity-summary{height:31px;display:flex;align-items:center;gap:6px;padding:0 9px;border:1px solid #91b8ce;background:#edf8fc;color:var(--navy-800);border-radius:2px;font-size:10px;font-weight:600;white-space:nowrap}

/* Tabs */
.document-tabs{display:flex;align-items:end;background:#cdd3d9;border-bottom:1px solid #aeb7c0;padding:3px 7px 0;gap:3px;overflow-x:auto;overflow-y:hidden;z-index:20}
.doc-tab{height:31px;min-width:150px;max-width:240px;display:flex;align-items:center;gap:7px;padding:0 7px 0 9px;border:1px solid #aeb7c0;border-bottom:0;background:#e5e9ed;color:var(--slate-700);font-size:11px;border-radius:3px 3px 0 0}
.doc-tab:hover{background:#f1f3f5}.doc-tab.active{height:32px;background:#fff;color:var(--slate-950);font-weight:600;border-color:#9ba6b0;box-shadow:0 -2px 0 var(--navy-700) inset}
.doc-tab .tab-code{font-family:var(--mono);font-size:9px;color:var(--navy-700);font-weight:700}
.doc-tab .tab-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}.doc-tab .tab-close{width:17px;height:17px;border:0;background:transparent;color:var(--slate-500);padding:0;display:grid;place-items:center}.doc-tab .tab-close:hover{background:#d5dbe0;color:var(--slate-900)}
.new-tab-btn{width:29px;height:29px;border:1px solid #aeb7c0;border-bottom:0;background:#dce1e5;display:grid;place-items:center;border-radius:3px 3px 0 0}.new-tab-btn:hover{background:#fff}

/* Workspace */
.workspace{min-height:0;display:grid;grid-template-columns:var(--sidebar-w) minmax(0,1fr) auto;overflow:hidden}
.sidebar{min-width:0;background:#f3f5f7;border-right:1px solid #aeb7c0;display:grid;grid-template-rows:39px minmax(0,1fr);box-shadow:1px 0 0 #fff inset;z-index:12}
.sidebar-tabs{display:grid;grid-template-columns:repeat(4,1fr);background:#e1e5e9;border-bottom:1px solid var(--slate-300)}
.sidebar-tab{border:0;border-right:1px solid var(--slate-300);background:transparent;display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;color:var(--slate-700);padding:0 4px}
.sidebar-tab:last-child{border-right:0}.sidebar-tab:hover{background:#edf0f3}.sidebar-tab.active{background:#fff;color:var(--navy-800);font-weight:700;box-shadow:inset 0 -2px var(--navy-700)}
.sidebar-body{min-height:0;overflow:hidden;position:relative}
.side-panel{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr)}
.side-panel-head{padding:8px;border-bottom:1px solid var(--slate-250);background:#fff}
.side-panel-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.side-panel-title b{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate-700)}
.mini-btn{height:24px;min-width:24px;border:1px solid var(--slate-300);background:#fff;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:0 6px;font-size:9px}.mini-btn:hover{background:var(--slate-100)}
.tree-filter{position:relative}.tree-filter input{width:100%;height:28px;border:1px solid var(--slate-300);background:#fff;padding:0 28px 0 8px;font-size:11px;outline:none}.tree-filter input:focus{border-color:var(--navy-700)}.tree-filter svg{position:absolute;right:7px;top:7px;color:var(--slate-500)}
.tree-scroll{overflow:auto;padding:5px 0 12px;scrollbar-width:thin}
.tree-node{user-select:none}
.tree-row{height:27px;display:flex;align-items:center;gap:4px;padding-right:6px;color:var(--slate-800);position:relative;white-space:nowrap}
.tree-row:hover{background:#e7edf2}.tree-row.selected{background:#d6e8f3;color:var(--navy-900);box-shadow:inset 3px 0 var(--navy-700)}
.tree-row.filtered-out{display:none}.tree-row.disabled{opacity:.45}
.tree-indent{flex:0 0 auto}.tree-toggle{width:18px;height:22px;border:0;background:transparent;color:var(--slate-600);display:grid;place-items:center;padding:0}.tree-toggle.placeholder{visibility:hidden}.tree-toggle svg{transition:transform .12s}.tree-node.expanded>.tree-row .tree-toggle svg{transform:rotate(90deg)}
.tree-icon{width:17px;display:grid;place-items:center;color:var(--slate-600)}.tree-row.selected .tree-icon{color:var(--navy-700)}
.tree-label{overflow:hidden;text-overflow:ellipsis;font-size:11px;flex:1}.tree-label.manual{font-weight:700}.tree-label.section{font-family:var(--mono);font-size:10px}.tree-meta{font-size:8px;color:var(--slate-500);margin-left:auto}.tree-update-dot{width:6px;height:6px;border-radius:50%;background:#ed9b2f;margin-left:2px}
.tree-children{display:none}.tree-node.expanded>.tree-children{display:block}
.library-summary{display:flex;gap:6px;margin-top:7px;font-size:9px;color:var(--slate-600)}
.library-summary span{border:1px solid var(--slate-250);background:var(--slate-100);padding:3px 5px}

/* Search / bookmark panels */
.search-options{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}.search-options select{height:26px;border:1px solid var(--slate-300);background:#fff;font-size:10px}
.result-list,.bookmark-list,.update-list{overflow:auto;background:#f7f8fa}
.result-empty{padding:24px 18px;text-align:center;color:var(--slate-500);font-size:11px;line-height:1.5}
.result-item{padding:8px 9px;border-bottom:1px solid var(--slate-250);background:#fff;cursor:pointer}.result-item:hover{background:#eef6fb}.result-item.selected{background:#dcecf5}
.result-manual{font-size:9px;color:var(--navy-700);font-weight:700;text-transform:uppercase;letter-spacing:.05em}.result-title{font-size:11px;font-weight:650;margin:2px 0}.result-snippet{font-size:10px;line-height:1.35;color:var(--slate-600)}.result-snippet mark{background:#ffdf76;padding:0 1px}.result-path{font-family:var(--mono);font-size:8px;color:var(--slate-500);margin-top:4px}
.bookmark-item,.update-item{padding:8px 9px;border-bottom:1px solid var(--slate-250);background:#fff;cursor:pointer}.bookmark-item:hover,.update-item:hover{background:#eef6fb}.bookmark-title{font-size:11px;font-weight:650}.bookmark-path{font-size:9px;color:var(--slate-500);margin-top:2px}.bookmark-actions{display:flex;justify-content:flex-end;margin-top:5px}
.update-status{display:inline-flex;align-items:center;gap:4px;font-size:8px;text-transform:uppercase;font-weight:700;padding:2px 5px;border-radius:9px;background:var(--amber-bg);color:var(--amber)}

/* Viewer */
.viewer{min-width:0;min-height:0;display:grid;grid-template-rows:38px minmax(0,1fr) 38px;background:var(--workspace);position:relative}
.viewer-header{display:flex;align-items:center;gap:8px;background:#fff;border-bottom:1px solid var(--slate-300);padding:0 10px;min-width:0}
.breadcrumbs{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;white-space:nowrap;font-size:10px;color:var(--slate-600)}
.breadcrumbs button{border:0;background:transparent;color:var(--navy-700);padding:2px 1px;font-size:10px}.breadcrumbs button:hover{text-decoration:underline}.breadcrumbs .current{overflow:hidden;text-overflow:ellipsis;color:var(--slate-800);font-weight:600}
.viewer-header-spacer{flex:1}
.revision-badge{display:flex;align-items:center;gap:5px;height:24px;padding:0 8px;border:1px solid #86b59a;background:var(--green-bg);color:var(--green);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.viewer-scroll{overflow:auto;padding:18px 28px 42px;scrollbar-width:thin;position:relative}
.demo-warning{max-width:920px;margin:0 auto 10px;background:#fff4df;border:1px solid #dfb667;color:#7f570f;padding:7px 10px;font-size:10px;display:flex;align-items:center;gap:7px;box-shadow:var(--shadow)}
.live-pdf{width:100%;height:calc(100dvh - 265px);min-height:560px;border:1px solid var(--slate-300);background:#e8edf1}
.document-page{width:min(920px,100%);min-height:calc(100% - 4px);margin:0 auto;background:var(--paper);border:1px solid #b7c0c8;box-shadow:var(--shadow);padding:36px 46px 54px;position:relative}
.page-running-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--navy-900);padding-bottom:8px;margin-bottom:25px;font-size:9px;color:var(--slate-600);text-transform:uppercase;letter-spacing:.08em}
.page-running-head strong{color:var(--navy-900);font-size:11px}.page-running-head .right{text-align:right;line-height:1.4}
.doc-section-kicker{font-family:var(--mono);font-size:10px;color:var(--navy-700);font-weight:700;letter-spacing:.05em;margin-bottom:5px}
.document-page h1{margin:0 0 8px;font-size:25px;line-height:1.2;font-weight:550;color:var(--navy-950)}
.section-meta{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:22px}.meta-chip{border:1px solid var(--slate-250);background:var(--slate-100);padding:4px 6px;font-size:9px;color:var(--slate-600)}.meta-chip strong{color:var(--slate-800)}
.document-page h2{font-size:16px;color:var(--navy-900);font-weight:650;border-bottom:1px solid var(--slate-300);padding-bottom:5px;margin:25px 0 10px}
.document-page h3{font-size:13px;color:var(--slate-900);font-weight:700;margin:20px 0 7px}
.document-page p{font-size:12px;line-height:1.58;margin:8px 0;color:#202a33}
.document-page ol,.document-page ul{font-size:12px;line-height:1.55;padding-left:22px}.document-page li{margin:4px 0}
.doc-table{width:100%;border-collapse:collapse;margin:12px 0 18px;font-size:11px}.doc-table th{background:var(--navy-900);color:#fff;text-align:left;padding:6px 7px;border:1px solid #082846;font-weight:650}.doc-table td{padding:6px 7px;border:1px solid var(--slate-300);vertical-align:top}.doc-table tr:nth-child(even) td{background:#f6f8fa}.doc-table .code{font-family:var(--mono);white-space:nowrap}
.callout{display:grid;grid-template-columns:86px 1fr;margin:14px 0;border:1px solid var(--slate-300);font-size:11px}.callout-label{display:flex;align-items:flex-start;gap:5px;padding:8px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.callout-body{padding:8px 10px;line-height:1.45;background:#fff}.callout.note{border-color:#8eb8d0}.callout.note .callout-label{background:#e6f4fa;color:var(--navy-800)}.callout.caution{border-color:#e0b963}.callout.caution .callout-label{background:#fff1cf;color:#8b5d00}.callout.warning{border-color:#d98a8a}.callout.warning .callout-label{background:#fde5e5;color:#9f2727}
.procedure{border:1px solid var(--slate-300);margin:13px 0}.procedure-head{display:flex;justify-content:space-between;align-items:center;background:#edf1f4;border-bottom:1px solid var(--slate-300);padding:6px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.procedure-body{padding:9px 12px}.procedure-row{display:grid;grid-template-columns:34px 1fr 190px;gap:8px;padding:6px 0;border-bottom:1px dotted var(--slate-300);font-size:11px;line-height:1.35}.procedure-row:last-child{border-bottom:0}.procedure-step{font-family:var(--mono);font-weight:700;color:var(--navy-700)}.procedure-action{font-weight:650}.procedure-response{text-align:right;font-family:var(--mono);font-size:10px;color:var(--slate-700)}
.revision-marker{position:absolute;left:-18px;width:5px;background:#ed9b2f;border-radius:2px;height:42px}.change-bar{border-left:3px solid #ed9b2f;padding-left:9px}
.search-hit{background:#ffe478;border-radius:1px;box-shadow:0 0 0 1px rgba(176,128,0,.2)}
.page-footer{position:absolute;left:46px;right:46px;bottom:20px;display:flex;justify-content:space-between;border-top:1px solid var(--slate-300);padding-top:7px;color:var(--slate-500);font-size:9px}
.viewer-footer{display:flex;align-items:center;justify-content:space-between;padding:0 8px;background:#f7f8fa;border-top:1px solid var(--slate-300)}
.page-nav,.view-controls{display:flex;align-items:center;border:1px solid var(--slate-300);background:#fff;height:27px}.footer-btn{height:25px;min-width:29px;border:0;border-right:1px solid var(--slate-250);background:#fff;display:grid;place-items:center;padding:0 7px;font-size:10px}.footer-btn:last-child{border-right:0}.footer-btn:hover{background:var(--slate-100)}.footer-btn:disabled{opacity:.4;cursor:default}.page-field{display:flex;align-items:center;gap:4px;padding:0 8px;font-size:10px;border-right:1px solid var(--slate-250)}.page-field input{width:40px;height:20px;border:1px solid var(--slate-300);text-align:center;font-family:var(--mono);font-size:9px}.zoom-value{min-width:48px;text-align:center;font-family:var(--mono);font-size:9px;border-right:1px solid var(--slate-250)}

/* Inspector */
.inspector{width:var(--inspector-w);min-width:0;background:#f4f6f8;border-left:1px solid #aeb7c0;display:grid;grid-template-rows:39px minmax(0,1fr);z-index:11}.inspector-head{display:flex;align-items:center;justify-content:space-between;padding:0 9px;background:#e5e9ed;border-bottom:1px solid var(--slate-300);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate-700);font-weight:700}
.inspector-close{border:0;background:transparent;color:var(--slate-600);padding:4px}
.inspector-scroll{overflow:auto;padding:9px}
.info-card{border:1px solid var(--slate-300);background:#fff;margin-bottom:8px}.info-card-head{padding:6px 8px;background:#edf0f3;border-bottom:1px solid var(--slate-300);font-size:9px;text-transform:uppercase;letter-spacing:.07em;font-weight:700;color:var(--slate-700)}.info-card-body{padding:8px}
.info-row{display:grid;grid-template-columns:92px 1fr;gap:7px;padding:4px 0;border-bottom:1px dotted var(--slate-250);font-size:10px}.info-row:last-child{border-bottom:0}.info-row .label{color:var(--slate-500)}.info-row .value{color:var(--slate-900);font-weight:600;overflow-wrap:anywhere}
.effectivity-list{display:flex;flex-wrap:wrap;gap:4px}.effectivity-tag{border:1px solid #a8c5d5;background:#eef8fc;color:var(--navy-700);font-family:var(--mono);font-size:9px;padding:3px 5px}.effectivity-tag.excluded{border-color:#d2d5d8;background:#f3f4f5;color:#8a9299;text-decoration:line-through}
.revision-item{position:relative;padding:6px 4px 6px 13px;border-bottom:1px solid var(--slate-250);font-size:10px}.revision-item:last-child{border-bottom:0}.revision-item:before{content:"";position:absolute;left:3px;top:11px;width:5px;height:5px;border-radius:50%;background:var(--navy-700)}.revision-item.current:before{background:var(--green)}.revision-item b{display:block}.revision-item span{display:block;color:var(--slate-500);font-size:9px;margin-top:2px}

/* Status bar */
.status-bar{display:flex;align-items:center;background:#e4e8ec;border-top:1px solid #abb4bc;color:var(--slate-700);font-size:9px;padding:0 8px;gap:10px;z-index:30}
.status-cell{height:100%;display:flex;align-items:center;gap:5px;padding:0 8px;border-right:1px solid #c1c8ce}.status-cell:first-child{padding-left:2px}.status-spacer{flex:1}.sync-progress{width:72px;height:5px;background:#cbd2d8;overflow:hidden}.sync-progress span{display:block;width:100%;height:100%;background:var(--green)}

/* Modal / toast */
.modal-backdrop{position:fixed;inset:0;background:rgba(4,18,31,.52);display:none;align-items:flex-start;justify-content:center;padding-top:100px;z-index:100}.modal-backdrop.open{display:flex}.command-modal{width:min(670px,calc(100vw - 28px));background:#fff;border:1px solid #71808d;box-shadow:0 20px 70px rgba(0,0,0,.35)}.command-head{display:flex;align-items:center;gap:8px;padding:10px;border-bottom:1px solid var(--slate-300)}.command-head input{flex:1;height:37px;border:0;outline:none;font-size:15px}.command-results{max-height:390px;overflow:auto}.command-result{display:grid;grid-template-columns:38px 1fr auto;gap:8px;align-items:center;padding:9px 11px;border-bottom:1px solid var(--slate-200);cursor:pointer}.command-result:hover,.command-result.active{background:#eaf4f9}.command-icon{width:30px;height:30px;display:grid;place-items:center;background:#edf1f4;color:var(--navy-700)}.command-title{font-size:12px;font-weight:650}.command-path{font-size:9px;color:var(--slate-500);margin-top:2px}.command-code{font-family:var(--mono);font-size:9px;color:var(--slate-500)}
.toast{position:fixed;right:14px;bottom:43px;min-width:240px;max-width:380px;background:#13283a;color:#fff;border-left:4px solid var(--cyan-500);padding:10px 12px;box-shadow:0 8px 28px rgba(0,0,0,.25);font-size:11px;display:none;z-index:120}.toast.show{display:block;animation:toastIn .16s ease-out}@keyframes toastIn{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}

/* Night mode */
body.night{--workspace:#202932;--paper:#18222b;color:#e7edf1}body.night .global-toolbar,body.night .viewer-header,body.night .viewer-footer,body.night .side-panel-head{background:#222d36;color:#e3ebf0;border-color:#46525d}body.night .sidebar,body.night .inspector{background:#1c252d;color:#e6edf2;border-color:#46525d}body.night .sidebar-tabs,body.night .inspector-head,body.night .document-tabs{background:#27323c;border-color:#46525d}body.night .sidebar-tab,body.night .tree-row,body.night .breadcrumbs .current{color:#d8e2e9}body.night .sidebar-tab.active,body.night .doc-tab.active{background:#1c252d;color:#fff}body.night .doc-tab{background:#2f3a44;color:#cdd7de;border-color:#4c5862}body.night .document-page{background:#18222b;color:#e2e8ed;border-color:#4f5d68}body.night .document-page p,body.night .document-page h3{color:#dce4e9}body.night .document-page h1,body.night .document-page h2{color:#b7e4f5}body.night .page-running-head{border-color:#4a91bb;color:#aebcc7}body.night .doc-table td,body.night .procedure-body,body.night .callout-body{background:#1d2932;color:#dce4e9;border-color:#485762}body.night .doc-table tr:nth-child(even) td{background:#22303a}body.night .procedure-head,body.night .info-card-head{background:#2a3640}body.night .info-card{background:#202b34;border-color:#46525d}body.night .info-row .value{color:#e2e8ed}body.night .result-item,body.night .bookmark-item,body.night .update-item{background:#202b34;color:#e5edf2;border-color:#3e4a54}body.night .result-list,body.night .bookmark-list,body.night .update-list{background:#1c252d}body.night input,body.night select,body.night .tool-group,body.night .tool-btn,body.night .footer-btn,body.night .page-nav,body.night .view-controls{background:#1d2831;color:#e5edf2;border-color:#4c5963}body.night .tree-row:hover{background:#283641}body.night .tree-row.selected{background:#1f465f}

/* Responsive */
.sidebar-overlay-toggle{display:none}
@media(max-width:1180px){:root{--inspector-w:260px;--sidebar-w:300px}.effectivity-label{display:none}.compact-select{min-width:110px}.header-nav button{min-width:auto;padding:0 11px}.document-page{padding-left:35px;padding-right:35px}.page-footer{left:35px;right:35px}}
 
@media(max-width:920px){:root{--sidebar-w:min(88vw,340px);--header-h:45px;--toolbar-h:42px}.header-state .connection-pill,.user-meta{display:none}.brand-block{min-width:0;border-right:0}.brand-subtitle{display:none}.global-toolbar{padding:5px}#backBtn, #forwardBtn, .toolbar-separator, .effectivity-group{display:none}.global-search{min-width:0;max-width:none}.workspace{grid-template-columns:1fr}.sidebar{position:fixed;top:calc(var(--header-h) + var(--toolbar-h) + var(--tabs-h));bottom:var(--status-h);left:0;width:var(--sidebar-w);transform:translateX(-102%);transition:transform .18s ease;box-shadow:6px 0 22px rgba(0,0,0,.25);z-index:60}.sidebar.mobile-open{transform:translateX(0)}.sidebar-overlay-toggle{display:flex}.document-tabs{padding-left:4px}.doc-tab{min-width:125px}.viewer-scroll{padding:0}.demo-warning{margin:8px}.document-page{border-left:0;border-right:0;min-height:100%;padding:25px 18px 45px}.page-footer{left:18px;right:18px}.viewer-header{padding:0 6px}.revision-badge{display:none}.procedure-row{grid-template-columns:28px 1fr}.procedure-response{grid-column:2;text-align:left}.status-cell:nth-child(2),.status-cell:nth-child(3){display:none}}
@media print{.app-header,.global-toolbar,.document-tabs,.sidebar,.inspector,.viewer-header,.viewer-footer,.status-bar,.demo-warning{display:none!important}.app-shell,.workspace,.viewer{display:block;height:auto}.viewer-scroll{overflow:visible;padding:0}.document-page{box-shadow:none;border:0;width:100%;min-height:auto;padding:0}.page-footer{position:fixed;bottom:0}.document-page{background:#fff!important;color:#000!important}.document-page p,.document-page h1,.document-page h2,.document-page h3{color:#000!important}}
</style>
</head>
<body>

<div class="app-shell" id="appShell">
  <header class="app-header">
    <div class="brand-block">

      <div class="brand-copy">
        <div class="brand-name">Docu<span>Net</span></div>
        <div class="brand-subtitle">Digital Manuals</div>
      </div>
    </div>
    <nav class="header-nav" aria-label="Primary">
  <button class="active" id="viewerHeaderBtn">Viewer</button>
  <button id="libraryHeaderBtn">Library</button>
  <button id="updatesHeaderBtn">Updates</button>
  <button id="formsHeaderBtn">Forms</button><button id="helpBtn">Help</button>
</nav>
  </header>

  <section class="global-toolbar" aria-label="Document tools">
    <div class="tool-group history">
      <button class="tool-btn" id="backBtn" title="Back" aria-label="Back"></button>
      <button class="tool-btn" id="forwardBtn" title="Forward" aria-label="Forward"></button>
      <button class="tool-btn sidebar-overlay-toggle" id="mobileLibraryBtn" title="Open library" aria-label="Open library"></button>
    </div>
    <div class="global-search">
      <span class="search-icon" id="searchIcon"></span>
      <input id="globalSearch" type="search" autocomplete="off" placeholder="Search manuals, chapters and document content…">
      <span class="shortcut">Ctrl K</span>
    </div>
    <div class="tool-group">
      <button class="tool-btn" id="searchSubmitBtn">Search</button>
      <button class="tool-btn" id="bookmarkBtn" title="Bookmark current section"></button>
      <button class="tool-btn" id="printBtn" title="Print current section"></button>
      <button class="tool-btn" id="ackBtn" title="Acknowledge current revision">Acknowledge</button>
      <button class="tool-btn" id="nightModeBtn" title="Night mode"></button>
      <button class="tool-btn active" id="inspectorBtn" title="Document information"></button>
    </div>
    <div class="toolbar-separator"></div>
    <div class="effectivity-group">
      <span class="effectivity-label">Applicability</span>
      <select class="compact-select" id="serviceFilter" aria-label="Service line filter">
        <option value="ALL">All Services</option>
        <option value="DESTINATION" selected>Destination Services</option>
        <option value="TRANSFERS">Transfers</option>
        <option value="TOURS">Tours &amp; Activities</option>
        <option value="PACKAGES">Travel Packages</option>
      </select>
      <select class="compact-select" id="marketFilter" aria-label="Operating market filter">
        <option value="ALL">All Markets</option>
        <option value="USNYC" selected>USNYC · New York</option>
        <option value="SESTO">SESTO · Stockholm</option>
        <option value="GRHER">GRHER · Crete</option>
      </select>
      <select class="compact-select" id="audienceFilter" aria-label="Staff audience filter">
        <option value="OPERATIONS" selected>Operations</option>
        <option value="DESTINATION_STAFF">Destination Staff</option>
        <option value="CUSTOMER_CARE">Customer Care</option>
        <option value="PARTNER_MANAGEMENT">Partner Management</option>
        <option value="ALL">All Teams</option>
      </select>
      <div class="effectivity-summary" id="effectivitySummary"></div>
    </div>
  </section>

  <div class="document-tabs" id="documentTabs" role="tablist"></div>

  <main class="workspace">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-tabs" role="tablist">
        <button class="sidebar-tab active" data-side-tab="library"></button>
        <button class="sidebar-tab" data-side-tab="search"></button>
        <button class="sidebar-tab" data-side-tab="bookmarks"></button>
        <button class="sidebar-tab" data-side-tab="updates"></button>
      </div>
      <div class="sidebar-body">
        <section class="side-panel" id="libraryPanel">
          <div class="side-panel-head">
            <div class="side-panel-title"><b>Manual Library</b><div><button class="mini-btn" id="collapseAllBtn" title="Collapse all"></button><button class="mini-btn" id="expandAllBtn" title="Expand all"></button></div></div>
            <div class="tree-filter"><input id="treeFilter" placeholder="Filter library tree"><span id="treeFilterIcon"></span></div>
            <div class="library-summary"><span id="manualCount">0 manuals</span><span id="applicableCount">0 applicable</span><span>Current</span></div>
          </div>
          <div class="tree-scroll" id="libraryTree"></div>
        </section>

        <section class="side-panel hidden" id="searchPanel">
          <div class="side-panel-head">
            <div class="side-panel-title"><b>Search Results</b><button class="mini-btn" id="clearSearchBtn">Clear</button></div>
            <div class="tree-filter"><input id="panelSearch" placeholder="Search document library"><span id="panelSearchIcon"></span></div>
            <div class="search-options"><select id="searchScope"><option value="ALL">Entire library</option><option value="CURRENT">Current manual</option><option value="GROUP">Current group</option></select><select id="searchMatch"><option value="ANY">Any word</option><option value="PHRASE">Exact phrase</option></select></div>
          </div>
          <div class="result-list" id="searchResults"></div>
        </section>

        <section class="side-panel hidden" id="bookmarksPanel">
          <div class="side-panel-head"><div class="side-panel-title"><b>Bookmarks</b><button class="mini-btn" id="clearBookmarksBtn">Clear all</button></div><div class="tree-filter"><input id="bookmarkFilter" placeholder="Filter bookmarks"><span id="bookmarkFilterIcon"></span></div></div>
          <div class="bookmark-list" id="bookmarkList"></div>
        </section>

        <section class="side-panel hidden" id="updatesPanel">
          <div class="side-panel-head"><div class="side-panel-title"><b>Document Updates</b><button class="mini-btn" id="syncNowBtn">Sync now</button></div><div class="library-summary"><span>1 pending</span><span>4 current</span></div></div>
          <div class="update-list" id="updateList"></div>
        </section>
      </div>
    </aside>

    <section class="viewer">
      <div class="viewer-header">
        <div class="breadcrumbs" id="breadcrumbs"></div>
        <div class="viewer-header-spacer"></div>
        <div class="revision-badge" id="revisionBadge"></div>
      </div>
      <div class="viewer-scroll" id="viewerScroll">
        <div class="demo-warning" id="demoWarning"></div>
        <article class="document-page" id="documentPage"></article>
      </div>
      <div class="viewer-footer">
        <div class="page-nav">
          <button class="footer-btn" id="firstSectionBtn" title="First section"></button>
          <button class="footer-btn" id="previousSectionBtn" title="Previous section"></button>
          <div class="page-field"><span>Page</span><input id="pageNumber" value="1"><span id="pageTotal">of 1</span></div>
          <button class="footer-btn" id="nextSectionBtn" title="Next section"></button>
          <button class="footer-btn" id="lastSectionBtn" title="Last section"></button>
        </div>
        <div class="view-controls">
          <button class="footer-btn" id="zoomOutBtn" title="Zoom out"></button>
          <div class="zoom-value" id="zoomValue">100%</div>
          <button class="footer-btn" id="zoomInBtn" title="Zoom in"></button>
          <button class="footer-btn" id="fitWidthBtn">Fit width</button>
          <button class="footer-btn" id="fitPageBtn">Fit page</button>
        </div>
      </div>
    </section>

    <aside class="inspector" id="inspector">
      <div class="inspector-head"><span>Document Information</span><button class="inspector-close" id="inspectorCloseBtn"></button></div>
      <div class="inspector-scroll" id="inspectorContent"></div>
    </aside>
  </main>

  <footer class="status-bar">
    <div class="status-cell"><span id="statusShield"></span><strong>Operational Library</strong></div>
    <div class="status-cell" id="statusDocument">No document selected</div>
    <div class="status-cell" id="statusEffectivity">Applicability: Destination Services / USNYC / Operations</div>
    <div class="status-spacer"></div>
    <div class="status-cell" id="lastSyncCell">Last sync —</div>
    <div class="status-cell"><div class="sync-progress"><span></span></div><strong id="syncStateText">Connecting…</strong></div>
  </footer>
</div>

<div class="modal-backdrop" id="commandBackdrop" role="dialog" aria-modal="true" aria-label="Quick search">
  <div class="command-modal">
    <div class="command-head"><span id="commandSearchIcon"></span><input id="commandInput" placeholder="Quick search manuals and sections…"><span class="shortcut">ESC</span></div>
    <div class="command-results" id="commandResults"></div>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
(() => {
  "use strict";
  const SOURCE="SKANDI_DOCUNET_VIEWER";
  const post=(type,payload={})=>parent.postMessage({source:SOURCE,type,payload},"*");
    const icons = {
    chevronRight:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronLeft:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    skipBack:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 18 13 12l6-6M11 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    skipForward:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m5 18 6-6-6-6M13 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowLeft:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowRight:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    book:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21V5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    folder:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6.5h7l2 2h9v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity=".08"/></svg>',
    manual:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 3h11a3 3 0 0 1 3 3v15H7a2 2 0 0 1-2-2V3Z" stroke="currentColor" stroke-width="1.8"/><path d="M8 7h7M8 11h7M8 15h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    section:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 3h10l3 3v15H7V3Z" stroke="currentColor" stroke-width="1.7"/><path d="M17 3v4h4M10 11h7M10 15h7" stroke="currentColor" stroke-width="1.4"/></svg>',
    bookmark:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    bookmarkFill:'<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>',
    print:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="1.8"/><path d="M7 14h10v7H7z" stroke="currentColor" stroke-width="1.8"/></svg>',
    moon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" stroke="currentColor" stroke-width="1.8"/></svg>',
    info:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6M12 7.5v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    x:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    plus:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    minus:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    expand:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m8 9 4-4 4 4M8 15l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    collapse:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m8 5 4 4 4-4M8 19l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shield:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    warning:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3 2.8 20h18.4L12 3Z" stroke="currentColor" stroke-width="1.8"/><path d="M12 9v5M12 17.5v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    refresh:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.2 9A7 7 0 0 0 6.3 6.3L4 8.5M5.8 15A7 7 0 0 0 17.7 17.7L20 15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };

  let manuals = [
    {
      id:"dsm", code:"DSM", title:"SKANDI Destination Services Manual", short:"Destination Services", group:"Destination Operations", owner:"SKANDI Travels", revision:"14", revisionDate:"18 JUL 2026", status:"Active", updated:true,
      services:["DESTINATION"], markets:["USNYC","SESTO","GRHER"], audiences:["OPERATIONS","DESTINATION_STAFF","CUSTOMER_CARE"], pages:286,
      chapters:[
        {id:"dsm-00", code:"00", title:"General", sections:[
          section("dsm-00-10","00.10","Purpose and Scope","Purpose, scope and business boundaries of SKANDI destination services.",introContent()),
          section("dsm-00-20","00.20","Document Conventions","Standard terminology, status labels and procedural presentation.",conventionsContent())
        ]},
        {id:"dsm-10", code:"10", title:"Destination Service Model", sections:[
          section("dsm-10-10","10.10","SKANDI Select Destinations","Minimum service standard for digitally supported destinations.",selectContent()),
          section("dsm-10-20","10.20","SKANDI Signature Destinations","Full destination support and charter-style guest service.",signatureContent()),
          section("dsm-10-30","10.30","SKANDI Excelsior Destinations","Premium end-to-end service for curated five-star trips.",excelsiorContent())
        ]},
        {id:"dsm-20", code:"20", title:"In-Destination Delivery", sections:[
          section("dsm-20-10","20.10","Arrival and Welcome","Guest reception, manifest control and handover standards.",arrivalContent()),
          section("dsm-20-20","20.20","Hotel Visits","Scheduled hotel presence, guest contact and action tracking.",hotelVisitContent())
        ]},
        {id:"dsm-30", code:"30", title:"Guest Care", sections:[
          section("dsm-30-10","30.10","Destination Assistance","Verification, case ownership and guest-support workflow.",assistanceContent()),
          section("dsm-30-20","30.20","Service Recovery","Response standards for supplier or service disruption.",recoveryContent())
        ]}
      ]
    },
    {
      id:"com", code:"COM", title:"SKANDI Company Operations Manual", short:"Company Operations", group:"Company Manuals", owner:"SKANDI Travels", revision:"12", revisionDate:"05 JUL 2026", status:"Active", updated:false,
      services:["ALL"], markets:["ALL"], audiences:["ALL"], pages:342,
      chapters:[
        {id:"com-0",code:"0",title:"Administration and Control",sections:[
          section("com-0-1","0.1","Manual Structure and Control","Purpose, ownership and revision control.",manualControlContent()),
          section("com-0-2","0.2","Distribution and Accessibility","Controlled distribution and electronic availability.",distributionContent())
        ]},
        {id:"com-2",code:"2",title:"Operational Control and Supervision",sections:[
          section("com-2-1","2.1","Operational Authority","Responsibilities and authority for service decisions.",authorityContent()),
          section("com-2-4","2.4","Active Service Watch","Monitoring and communication for live guest operations.",serviceWatchContent())
        ]},
        {id:"com-8",code:"8",title:"Operating Procedures",sections:[
          section("com-8-1","8.1","Daily Operation Preparation","Required planning, documentation and briefing standards.",operationPrepContent()),
          section("com-8-3","8.3","Weather and Local Disruption","General operating policy for external disruption.",weatherContent())
        ]}
      ]
    },
    {
      id:"tom", code:"TOM", title:"SKANDI Transfer Operations Manual", short:"Transfer Operations", group:"Transfer Operations", owner:"SKANDI Travels", revision:"18", revisionDate:"11 JUL 2026", status:"Active", updated:true,
      services:["TRANSFERS"], markets:["USNYC","SESTO","GRHER"], audiences:["OPERATIONS","DESTINATION_STAFF","PARTNER_MANAGEMENT"], pages:224,
      chapters:[
        {id:"tom-21",code:"21",title:"Resource Readiness",sections:[
          section("tom-21-1","21.10","Vehicle and Driver Readiness","Readiness requirements before a transfer is released.",transferReadinessContent())
        ]},
        {id:"tom-23",code:"23",title:"Communications",sections:[
          section("tom-23-1","23.10","Driver Communication Channels","Required contact and status-update standards.",driverCommunicationsContent()),
          section("tom-23-2","23.20","Guest Contact and No-Show","Controlled contact, wait-time and escalation procedure.",noShowContent())
        ]},
        {id:"tom-34",code:"34",title:"Route Delivery",sections:[
          section("tom-34-1","34.10","Airport-to-Hotel Transfer Control","Status control from assignment through completion.",routeControlContent())
        ]}
      ]
    },
    {
      id:"bcm", code:"BCM", title:"Booking and Customer Management Manual", short:"Booking & Customer Care", group:"Customer Operations", owner:"SKANDI Travels", revision:"29", revisionDate:"27 JUN 2026", status:"Active", updated:false,
      services:["DESTINATION","TRANSFERS","TOURS","PACKAGES"], markets:["ALL"], audiences:["CUSTOMER_CARE","OPERATIONS"], pages:318,
      chapters:[
        {id:"bcm-gen",code:"GEN",title:"General Information",sections:[
          section("bcm-gen-1","GEN.10","Guest Service Principles","Core standards for consistent, accurate and personal guest care.",guestPrinciplesContent())
        ]},
        {id:"bcm-nor",code:"NOR",title:"Booking Operations",sections:[
          section("bcm-nor-1","NOR.20","Booking Creation and Confirmation","Booking validation, supplier confirmation and customer communication.",bookingContent()),
          section("bcm-nor-2","NOR.70","Changes and Cancellations","Controlled handling of amendments, fees, refunds and rebooking.",changesContent())
        ]}
      ]
    },
    {
      id:"psm", code:"PSM", title:"Partner and Supplier Standards Manual", short:"Partner Standards", group:"Commercial & Partners", owner:"SKANDI Travels", revision:"09", revisionDate:"01 JUL 2026", status:"Active", updated:false,
      services:["ALL"], markets:["ALL"], audiences:["PARTNER_MANAGEMENT","OPERATIONS"], pages:192,
      chapters:[
        {id:"psm-3",code:"3",title:"Service Quality",sections:[
          section("psm-3-1","3.4","Supplier Readiness Check","Required validation before a supplier delivers a SKANDI service.",supplierReadinessContent())
        ]}
      ]
    }
  ];

  function section(id, code, title, summary, body){ return {id,code,title,summary,body}; }

  function introContent(){ return contentBlock("Purpose and Scope",`
    <p>This manual defines how SKANDI Travels plans, coordinates and delivers destination services, transfers, tours, travel packages and guest support. SKANDI acts as a travel organizer and destination-services company. Transport, accommodation and activities may be delivered by contracted third-party suppliers.</p>
    <div class="callout note"><div class="callout-label">${icons.info} Note</div><div class="callout-body">Always confirm the selected service line, operating market and active revision before applying a procedure to a live guest booking.</div></div>
    <h2>Manual hierarchy</h2><p>Content is arranged by manual, chapter and section. Cross-references open in the current tab unless a new tab is requested.</p>
    <table class="doc-table"><thead><tr><th>Level</th><th>Function</th><th>Example</th></tr></thead><tbody><tr><td>Manual</td><td>Complete controlled publication</td><td>Destination Services Manual</td></tr><tr><td>Chapter</td><td>Business or operational subject group</td><td>10 - Destination Service Model</td></tr><tr><td>Section</td><td>Individual content unit</td><td>10.20 - SKANDI Signature Destinations</td></tr></tbody></table>
  `); }
  function conventionsContent(){ return contentBlock("Document Conventions",`
    <p>Standardized presentation distinguishes information, required staff actions, expected service status and safety- or compliance-critical instructions.</p>
    <div class="callout warning"><div class="callout-label">${icons.warning} Warning</div><div class="callout-body">A warning identifies a condition that may create an immediate safety, security, legal or material guest-care risk if not correctly handled.</div></div>
    <div class="callout caution"><div class="callout-label">${icons.warning} Caution</div><div class="callout-body">A caution identifies an action that may cause a service failure, financial loss, data exposure or supplier breach.</div></div>
    <h2>Procedural syntax</h2><div class="procedure"><div class="procedure-head"><span>Example procedure</span><span>Assigned staff</span></div><div class="procedure-body"><div class="procedure-row"><div class="procedure-step">1</div><div class="procedure-action">Guest manifest and service order</div><div class="procedure-response">VERIFY</div></div><div class="procedure-row"><div class="procedure-step">2</div><div class="procedure-action">Supplier and staff readiness</div><div class="procedure-response">CONFIRM</div></div></div></div>
  `); }
  function selectContent(){ return contentBlock("SKANDI Select Destinations",`
    <p>SKANDI Select Destinations provide expanded online services before and during travel. Guests receive organized trip information, booking access, digital support and clearly identified supplier contacts.</p>
    <h2>Included operating standard</h2><table class="doc-table"><thead><tr><th>Service</th><th>Delivery standard</th><th>Primary owner</th></tr></thead><tbody><tr><td>Travel information</td><td>Accurate destination and booking information in the guest channel</td><td>Customer Care</td></tr><tr><td>Supplier coordination</td><td>Confirmation recorded against each booked service</td><td>Operations</td></tr><tr><td>Guest support</td><td>Digital case intake and documented handover</td><td>Customer Care</td></tr></tbody></table>
    <div class="callout note"><div class="callout-label">${icons.info} Note</div><div class="callout-body">Airport meet, hotel visits and dedicated in-destination staff are included only when stated in the booked product.</div></div>
  `); }
  function signatureContent(){ return contentBlock("SKANDI Signature Destinations",`
    <div class="revision-marker" style="top:176px"></div><p class="change-bar">SKANDI Signature Destinations provide a coordinated charter-style guest journey with local operational oversight from arrival through departure.</p>
    <h2>Core service components</h2><table class="doc-table"><thead><tr><th>Journey point</th><th>Required service</th><th>Completion evidence</th></tr></thead><tbody><tr><td>Arrival</td><td>Airport welcome and guided transfer handover</td><td>Guest count and arrival status</td></tr><tr><td>Transfer</td><td>SKANDI-coordinated coach or approved transport partner</td><td>Departure and completion status</td></tr><tr><td>Stay</td><td>Onboard or local guide, scheduled hotel visits and destination support</td><td>Visit log and open-action record</td></tr><tr><td>Experience</td><td>SKANDI tours and activities as booked</td><td>Supplier confirmation and attendance</td></tr></tbody></table>
    <div class="callout caution"><div class="callout-label">${icons.warning} Caution</div><div class="callout-body">Never promise an unconfirmed upgrade, excursion, room change or transfer. Confirm availability, price authority and supplier acceptance first.</div></div>
  `); }
  function excelsiorContent(){ return contentBlock("SKANDI Excelsior Destinations",`
    <p>SKANDI Excelsior Destinations provide the highest curated service level for selected five-star trips. Each eligible booking is assigned an Excelsior Coordinator who owns the guest journey across suppliers.</p>
    <h2>Premium journey controls</h2><ul><li>Private home pickup when included and operationally available.</li><li>Fast track and lounge access where offered by the relevant airport and confirmed in the booking.</li><li>Curated five-star accommodation, transfers and experiences with named supplier contacts.</li><li>Proactive coordinator contact before departure, during the stay and after service recovery.</li></ul>
    <div class="callout warning"><div class="callout-label">${icons.warning} Warning</div><div class="callout-body">Premium benefits must never be represented as guaranteed until the relevant supplier confirmation is recorded.</div></div>
  `); }
  function arrivalContent(){ return contentBlock("Arrival and Welcome",`
    <p>The arrival team receives the current manifest, verifies the meeting point and supplier assignment, and maintains one controlled count from expected guests through transfer handover.</p>
    <h2>Arrival sequence</h2><div class="procedure"><div class="procedure-head"><span>Guest reception</span><span>Required status</span></div><div class="procedure-body"><div class="procedure-row"><div class="procedure-step">1</div><div class="procedure-action">Manifest, arrival time and meeting point</div><div class="procedure-response">VERIFIED</div></div><div class="procedure-row"><div class="procedure-step">2</div><div class="procedure-action">Welcome position and transfer supplier</div><div class="procedure-response">ON SITE</div></div><div class="procedure-row"><div class="procedure-step">3</div><div class="procedure-action">Guest count, exceptions and handover</div><div class="procedure-response">RECORDED</div></div></div></div>
  `); }
  function hotelVisitContent(){ return contentBlock("Hotel Visits",`
    <p>Hotel visits provide a predictable point of contact for guests and a structured way to identify open actions before they become service failures.</p>
    <h2>Minimum visit record</h2><table class="doc-table"><thead><tr><th>Field</th><th>Requirement</th><th>Follow-up</th></tr></thead><tbody><tr><td>Visit window</td><td>Published to eligible guests and hotel contact</td><td>Update if changed</td></tr><tr><td>Guest cases</td><td>One case per issue with booking reference</td><td>Assign owner and due time</td></tr><tr><td>Supplier issues</td><td>Facts, contact name and agreed action</td><td>Escalate unresolved items</td></tr></tbody></table>
  `); }
  function assistanceContent(){ return contentBlock("Destination Assistance",`
    <p>Before disclosing booking information or changing a service, staff must match the guest to the booking using the booking reference and approved identity-verification fields.</p>
    <h2>Case ownership</h2><ol><li>Confirm the guest, affected service and immediate need.</li><li>Record the case against the booking without unnecessary sensitive data.</li><li>Assign one owner, priority and next-update time.</li><li>Close only after the outcome and guest communication are recorded.</li></ol>
    <div class="callout note"><div class="callout-label">${icons.info} Note</div><div class="callout-body">A high-priority label does not replace emergency services. For immediate danger, contact local emergency services first and alert the Operations Duty Manager.</div></div>
  `); }
  function recoveryContent(){ return contentBlock("Service Recovery",`
    <p>Service recovery protects the guest, restores the itinerary where possible and creates a complete record for supplier follow-up and financial control.</p>
    <h2>Recovery sequence</h2><div class="procedure"><div class="procedure-head"><span>Disruption response</span><span>Owner</span></div><div class="procedure-body"><div class="procedure-row"><div class="procedure-step">1</div><div class="procedure-action">Secure immediate guest care and verify facts</div><div class="procedure-response">CASE OWNER</div></div><div class="procedure-row"><div class="procedure-step">2</div><div class="procedure-action">Confirm replacement options and approval limit</div><div class="procedure-response">OPERATIONS</div></div><div class="procedure-row"><div class="procedure-step">3</div><div class="procedure-action">Communicate outcome and document supplier responsibility</div><div class="procedure-response">RECORDED</div></div></div></div>
    <div class="callout caution"><div class="callout-label">${icons.warning} Caution</div><div class="callout-body">Do not admit legal liability or authorize compensation outside the assigned approval level.</div></div>
  `); }
  function manualControlContent(){ return contentBlock("Manual Structure and Control",`
    <p>The SKANDI Company Operations Manual is a controlled publication. The General Manager retains overall accountability, while designated content owners maintain accuracy and operational suitability within their business areas.</p>
    <h2>Revision control</h2><table class="doc-table"><thead><tr><th>Status</th><th>Meaning</th><th>User action</th></tr></thead><tbody><tr><td>Active</td><td>Approved current revision</td><td>Use for operations</td></tr><tr><td>Pending</td><td>Released but not yet effective</td><td>Review effective date</td></tr><tr><td>Superseded</td><td>Replaced by a later revision</td><td>Do not use operationally</td></tr></tbody></table>
  `); }
  function distributionContent(){ return contentBlock("Distribution and Accessibility",`<p>Controlled manuals are distributed electronically to authorized employees and approved devices. Offline access is available after successful synchronization where the platform supports it.</p><div class="callout note"><div class="callout-label">${icons.info} Note</div><div class="callout-body">Users must confirm that assigned publications show an up-to-date synchronization status before starting an operational duty.</div></div>`); }
  function authorityContent(){ return contentBlock("Operational Authority",`<p>The Operations Duty Manager coordinates live service decisions and supplier escalation. Every employee may pause an activity when an immediate safety, security or legal risk is identified.</p><h2>Escalation</h2><p>Unresolved conflicts involving guest safety, legal compliance, data protection, material cost or supplier failure must be escalated without delay to the responsible manager. Only authorized roles may approve compensation, replacement purchases or itinerary changes above their assigned limit.</p>`); }
  function serviceWatchContent(){ return contentBlock("Active Service Watch",`<p>Active Service Watch maintains awareness of live arrivals, transfers, hotel visits, tours, supplier changes and high-priority guest cases.</p><table class="doc-table"><thead><tr><th>Event</th><th>Primary action</th><th>Escalation</th></tr></thead><tbody><tr><td>Significant delay</td><td>Reassess transfers, staffing and guest communication</td><td>Operations Duty Manager</td></tr><tr><td>Weather deterioration</td><td>Confirm supplier viability and safe alternatives</td><td>Destination Lead</td></tr><tr><td>Supplier failure</td><td>Protect guests and secure an approved replacement</td><td>Partner Management</td></tr></tbody></table>`); }
  function operationPrepContent(){ return contentBlock("Daily Operation Preparation",`<p>Daily preparation includes review of active manifests, supplier confirmations, staff assignments, pickup points, local conditions, guest cases and applicable service restrictions.</p><div class="procedure"><div class="procedure-head"><span>Minimum briefing items</span><span>Responsible</span></div><div class="procedure-body"><div class="procedure-row"><div class="procedure-step">1</div><div class="procedure-action">Booking manifest and service changes</div><div class="procedure-response">OPERATIONS</div></div><div class="procedure-row"><div class="procedure-step">2</div><div class="procedure-action">Supplier, transport and meeting-point readiness</div><div class="procedure-response">ASSIGNED LEAD</div></div><div class="procedure-row"><div class="procedure-step">3</div><div class="procedure-action">Open guest cases, threats and mitigations</div><div class="procedure-response">TEAM BRIEF</div></div></div></div>`); }
  function weatherContent(){ return contentBlock("Weather and Local Disruption",`<p>Severe weather, road closures, public events and local emergencies require early identification, conservative decisions and direct confirmation from affected suppliers.</p><div class="callout caution"><div class="callout-label">${icons.warning} Caution</div><div class="callout-body">Schedule pressure must never override guest or staff safety. Pause, reroute or cancel a service when safe delivery cannot be confirmed.</div></div>`); }
  function transferReadinessContent(){ return contentBlock("Vehicle and Driver Readiness",`<p>A transfer may be released only after the assigned supplier, vehicle, driver, capacity, pickup point and primary contact channel are confirmed.</p><table class="doc-table"><thead><tr><th>Readiness item</th><th>Required status</th><th>Evidence</th></tr></thead><tbody><tr><td class="code">TR-01</td><td>Supplier assignment accepted</td><td>Current service order</td></tr><tr><td class="code">TR-02</td><td>Vehicle capacity and accessibility suitable</td><td>Supplier confirmation</td></tr><tr><td class="code">TR-03</td><td>Driver contact and meeting point verified</td><td>Operations record</td></tr></tbody></table><div class="callout warning"><div class="callout-label">${icons.warning} Warning</div><div class="callout-body">Do not release a transfer if legally required supplier documents, vehicle suitability or driver assignment cannot be confirmed.</div></div>`); }
  function driverCommunicationsContent(){ return contentBlock("Driver Communication Channels",`<p>The driver or supplier dispatcher must remain reachable through the approved operations channel from assignment acceptance until service completion.</p><table class="doc-table"><thead><tr><th>Status</th><th>Required update</th><th>Expected timing</th></tr></thead><tbody><tr><td class="code">EN ROUTE</td><td>Departure toward pickup point</td><td>At movement</td></tr><tr><td class="code">ON SITE</td><td>Exact position and vehicle identifier</td><td>At arrival</td></tr><tr><td class="code">COMPLETE</td><td>Final guest count and exceptions</td><td>At drop-off</td></tr></tbody></table><h2>Fallback</h2><ul><li>Attempt the secondary supplier contact.</li><li>Alert Active Service Watch when a required update is overdue.</li><li>Do not share guest contact details outside the approved service record.</li></ul>`); }
  function noShowContent(){ return contentBlock("Guest Contact and No-Show",`<p>A guest may be recorded as a no-show only after the current manifest, meeting point, arrival information and approved wait time have been checked.</p><div class="callout warning"><div class="callout-label">${icons.warning} Warning</div><div class="callout-body">The driver must not depart early or independently change the agreed wait time. Operations controls any departure decision.</div></div><h2>Required record</h2><ol><li>Time and place of each contact attempt.</li><li>Information received from the supplier or local team.</li><li>Operations decision and revised service status.</li></ol>`); }
  function routeControlContent(){ return contentBlock("Airport-to-Hotel Transfer Control",`<p>Each transfer uses one shared status sequence so Operations, destination staff and suppliers work from the same service state.</p><h2>Status sequence</h2><div class="procedure"><div class="procedure-head"><span>Transfer lifecycle</span><span>Required status</span></div><div class="procedure-body"><div class="procedure-row"><div class="procedure-step">1</div><div class="procedure-action">Supplier, vehicle and driver assigned</div><div class="procedure-response">ASSIGNED</div></div><div class="procedure-row"><div class="procedure-step">2</div><div class="procedure-action">Vehicle at confirmed pickup point</div><div class="procedure-response">ON SITE</div></div><div class="procedure-row"><div class="procedure-step">3</div><div class="procedure-action">Guests counted and handed over</div><div class="procedure-response">DEPARTED</div></div><div class="procedure-row"><div class="procedure-step">4</div><div class="procedure-action">Drop-off and exceptions recorded</div><div class="procedure-response">COMPLETE</div></div></div></div>`); }
  function guestPrinciplesContent(){ return contentBlock("Guest Service Principles",`<p>Accurate information, clear ownership and personal communication form the basis of SKANDI guest care. Systems support the employee, but the live booking record and confirmed supplier response remain the source of truth.</p><h2>Core rules</h2><ol><li>Verify the guest before disclosing or changing booking information.</li><li>State what is confirmed, what is pending and when the next update will be provided.</li><li>Use one case owner for each unresolved issue.</li><li>Record material decisions, supplier responses and customer approvals.</li></ol>`); }
  function bookingContent(){ return contentBlock("Booking Creation and Confirmation",`<p>A booking is ready for customer confirmation only when required traveler details, price, payment status, supplier acceptance and mandatory disclosures are complete.</p><div class="procedure"><div class="procedure-head"><span>Booking sequence</span><span>Required result</span></div><div class="procedure-body"><div class="procedure-row"><div class="procedure-step">1</div><div class="procedure-action">Traveler, dates and selected services</div><div class="procedure-response">VALIDATED</div></div><div class="procedure-row"><div class="procedure-step">2</div><div class="procedure-action">Supplier availability, price and terms</div><div class="procedure-response">CONFIRMED</div></div><div class="procedure-row"><div class="procedure-step">3</div><div class="procedure-action">Payment status and vendor disclosure</div><div class="procedure-response">RECORDED</div></div></div></div>`); }
  function changesContent(){ return contentBlock("Changes and Cancellations",`<p>Amendments are controlled against the booked supplier terms, current availability and the customer's explicit approval of any price difference or fee.</p><div class="callout caution"><div class="callout-label">${icons.warning} Caution</div><div class="callout-body">Do not cancel an existing confirmed service until the requested change, replacement availability and customer decision are documented.</div></div><h2>Completion record</h2><ul><li>Original and revised service details.</li><li>Supplier terms, fees and refund status.</li><li>Customer approval and communication timestamp.</li><li>Updated voucher, itinerary or confirmation where applicable.</li></ul>`); }
  function supplierReadinessContent(){ return contentBlock("Supplier Readiness Check",`<p>Partner Management and Operations confirm that each supplier can deliver the contracted service safely, legally and to the published SKANDI standard.</p><table class="doc-table"><thead><tr><th>Control</th><th>Minimum requirement</th><th>Owner</th></tr></thead><tbody><tr><td>Commercial</td><td>Current agreement, rates and cancellation terms</td><td>Partner Management</td></tr><tr><td>Compliance</td><td>Required licenses, insurance and local authorization</td><td>Partner Management</td></tr><tr><td>Operations</td><td>Named contacts, capacity, meeting points and escalation route</td><td>Operations</td></tr><tr><td>Quality</td><td>Service standards, incident reporting and review history</td><td>Business Owner</td></tr></tbody></table><div class="callout warning"><div class="callout-label">${icons.warning} Warning</div><div class="callout-body">A supplier with expired or unverified mandatory documentation must not be assigned to a live SKANDI service.</div></div>`); }

  function contentBlock(title, html){ return {title, html}; }

  const state = {
    activeSideTab:"library",
    activeManualId:"dsm",
    activeSectionId:"dsm-10-20",
    openTabs:["dsm","com"],
    history:[],
    historyIndex:-1,
    bookmarks:loadBookmarks(),
    service:"DESTINATION",
    market:"USNYC",
    audience:"OPERATIONS",
    zoom:100,
    inspectorOpen:true,
    searchQuery:"",
    commandSelection:0
  };

  const $ = id => document.getElementById(id);
  let allSections = manuals.flatMap(manual => manual.chapters.flatMap(chapter => chapter.sections.map(section => ({manual,chapter,section}))));

  function manualById(id){ return manuals.find(m => m.id === id); }
  function sectionRecord(sectionId){ return allSections.find(x => x.section.id === sectionId); }
  function currentRecord(){ return sectionRecord(state.activeSectionId) || allSections[0]; }
  function currentManual(){ return manualById(state.activeManualId) || currentRecord().manual; }
  function isApplicable(manual){
    const serviceOk = state.service === "ALL" || manual.services.includes("ALL") || manual.services.includes(state.service);
    const marketOk = state.market === "ALL" || manual.markets.includes("ALL") || manual.markets.includes(state.market);
    const audienceOk = state.audience === "ALL" || manual.audiences.includes("ALL") || manual.audiences.includes(state.audience);
    return serviceOk && marketOk && audienceOk;
  }
  function escapeHtml(value){ return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }

  function assignIcons(){
    $("backBtn").innerHTML=icons.arrowLeft; $("forwardBtn").innerHTML=icons.arrowRight; $("mobileLibraryBtn").innerHTML=icons.menu;
    $("searchIcon").innerHTML=icons.search; $("bookmarkBtn").innerHTML=icons.bookmark; $("printBtn").innerHTML=icons.print; $("nightModeBtn").innerHTML=icons.moon; $("inspectorBtn").innerHTML=icons.info;
    $("collapseAllBtn").innerHTML=icons.collapse; $("expandAllBtn").innerHTML=icons.expand; $("treeFilterIcon").innerHTML=icons.search; $("panelSearchIcon").innerHTML=icons.search; $("bookmarkFilterIcon").innerHTML=icons.search;
    $("firstSectionBtn").innerHTML=icons.skipBack; $("previousSectionBtn").innerHTML=icons.chevronLeft; $("nextSectionBtn").innerHTML=icons.chevronRight; $("lastSectionBtn").innerHTML=icons.skipForward;
    $("zoomOutBtn").innerHTML=icons.minus; $("zoomInBtn").innerHTML=icons.plus; $("inspectorCloseBtn").innerHTML=icons.x; $("statusShield").innerHTML=icons.shield; $("commandSearchIcon").innerHTML=icons.search;
    const sideTabs = document.querySelectorAll(".sidebar-tab");
    sideTabs[0].innerHTML=icons.book+"<span>Library</span>"; sideTabs[1].innerHTML=icons.search+"<span>Search</span>"; sideTabs[2].innerHTML=icons.bookmark+"<span>Marks</span>"; sideTabs[3].innerHTML=icons.refresh+"<span>Updates</span>";
    $("demoWarning").innerHTML=icons.warning+'<strong>Demonstration content only.</strong> Confirm live booking, supplier, emergency and regulatory information before operational use.';
    $("effectivitySummary").innerHTML=icons.shield+'<span>Applicable content</span>';
  }

  function renderTabs(){
    const container=$("documentTabs");
    container.innerHTML=state.openTabs.map(id=>{
      const manual=manualById(id);
      const active=id===state.activeManualId;
      return `<button class="doc-tab ${active?"active":""}" data-tab-manual="${id}" role="tab" aria-selected="${active}"><span class="tab-code">${manual.code}</span><span class="tab-title">${escapeHtml(manual.short)}</span><span class="tab-close" data-close-tab="${id}" aria-label="Close tab">${icons.x}</span></button>`;
    }).join("")+`<button class="new-tab-btn" id="newTabBtn" title="Open another manual">${icons.plus}</button>`;
  }

  function groupManuals(){
    const groups={}; manuals.forEach(m=>(groups[m.group]??=[]).push(m)); return groups;
  }

  function renderLibraryTree(){
    const groups=groupManuals();
    const html=Object.entries(groups).map(([group,docs],groupIndex)=>{
      return `<div class="tree-node expanded" data-tree-type="group" data-tree-id="group-${groupIndex}">
        <div class="tree-row"><span class="tree-indent" style="width:2px"></span><button class="tree-toggle">${icons.chevronRight}</button><span class="tree-icon">${icons.folder}</span><span class="tree-label manual">${escapeHtml(group)}</span><span class="tree-meta">${docs.length}</span></div>
        <div class="tree-children">${docs.map(manual=>renderManualNode(manual,1)).join("")}</div>
      </div>`;
    }).join("");
    $("libraryTree").innerHTML=html;
    $("manualCount").textContent=`${manuals.length} manuals`;
    $("applicableCount").textContent=`${manuals.filter(isApplicable).length} applicable`;
    applyTreeFilter($("treeFilter").value);
  }

  function renderManualNode(manual,depth){
    const applicable=isApplicable(manual);
    const selected=manual.id===state.activeManualId && !state.activeSectionId;
    return `<div class="tree-node expanded ${applicable?"":"not-applicable"}" data-tree-type="manual" data-tree-id="${manual.id}">
      <div class="tree-row ${selected?"selected":""} ${applicable?"":"disabled"}" data-open-manual="${manual.id}" title="${escapeHtml(manual.title)}"><span class="tree-indent" style="width:${depth*14}px"></span><button class="tree-toggle">${icons.chevronRight}</button><span class="tree-icon">${icons.manual}</span><span class="tree-label manual">${escapeHtml(manual.short)}</span>${manual.updated?'<span class="tree-update-dot" title="New or revised"></span>':""}<span class="tree-meta">R${manual.revision}</span></div>
      <div class="tree-children">${manual.chapters.map(ch=>renderChapterNode(manual,ch,depth+1)).join("")}</div>
    </div>`;
  }
  function renderChapterNode(manual,chapter,depth){
    return `<div class="tree-node expanded" data-tree-type="chapter" data-tree-id="${chapter.id}">
      <div class="tree-row"><span class="tree-indent" style="width:${depth*14}px"></span><button class="tree-toggle">${icons.chevronRight}</button><span class="tree-icon">${icons.folder}</span><span class="tree-label"><span class="tree-label section">${escapeHtml(chapter.code)}</span> ${escapeHtml(chapter.title)}</span></div>
      <div class="tree-children">${chapter.sections.map(sec=>renderSectionNode(manual,chapter,sec,depth+1)).join("")}</div>
    </div>`;
  }
  function renderSectionNode(manual,chapter,section,depth){
    const selected=section.id===state.activeSectionId;
    return `<div class="tree-node" data-tree-type="section" data-tree-id="${section.id}"><div class="tree-row ${selected?"selected":""}" data-open-section="${section.id}" title="${escapeHtml(section.title)}"><span class="tree-indent" style="width:${depth*14}px"></span><button class="tree-toggle placeholder">${icons.chevronRight}</button><span class="tree-icon">${icons.section}</span><span class="tree-label"><span class="tree-label section">${escapeHtml(section.code)}</span> ${escapeHtml(section.title)}</span></div></div>`;
  }

  function renderDocument(searchTerm=""){
    const rec=currentRecord(); const {manual,chapter,section}=rec;
    state.activeManualId=manual.id;
    if(!state.openTabs.includes(manual.id)) state.openTabs.push(manual.id);
    let html=manual.liveUrl
      ? `<iframe class="live-pdf" title="${escapeHtml(manual.title)}" src="${escapeHtml(manual.liveUrl)}#toolbar=1&navpanes=1&view=FitH"></iframe>`
      : section.body.html;
    if(searchTerm) html=highlightHtml(html,searchTerm);
    $("documentPage").innerHTML=`
      <div class="page-running-head"><div><strong>${escapeHtml(manual.short)}</strong><br>${escapeHtml(manual.title)}</div><div class="right">Revision ${manual.revision}<br>Effective ${manual.revisionDate}</div></div>
      <div class="doc-section-kicker">${escapeHtml(section.code)} · ${escapeHtml(chapter.code)} ${escapeHtml(chapter.title)}</div>
      <h1>${escapeHtml(section.body.title)}</h1>
      <div class="section-meta"><span class="meta-chip"><strong>Manual:</strong> ${escapeHtml(manual.code)}</span><span class="meta-chip"><strong>Service:</strong> ${escapeHtml(serviceLabel(state.service))}</span><span class="meta-chip"><strong>Market:</strong> ${escapeHtml(marketLabel(state.market))}</span><span class="meta-chip"><strong>Audience:</strong> ${escapeHtml(audienceLabel(state.audience))}</span><span class="meta-chip"><strong>Revision:</strong> ${manual.revision}</span></div>
      ${html}
      <div class="page-footer"><span>${escapeHtml(manual.code)} · ${escapeHtml(section.code)}</span><span>Controlled electronic copy · Printed copies are uncontrolled</span><span>${pageIndex()+1}</span></div>`;
    $("documentPage").style.transform=`scale(${state.zoom/100})`;
    $("documentPage").style.transformOrigin="top center";
    $("documentPage").style.marginBottom=`${Math.max(0,(state.zoom-100)*7)}px`;
    $("revisionBadge").innerHTML=`${icons.shield}<span>Revision ${manual.revision} · ${manual.status}</span>`;
    $("statusDocument").textContent=`${manual.code} · ${section.code} ${section.title}`;
    $("pageNumber").value=pageIndex()+1; $("pageTotal").textContent=`of ${manual.pages}`;
    $("zoomValue").textContent=`${state.zoom}%`;
    renderBreadcrumbs(); renderInspector(); renderTabs(); renderLibraryTree(); updateBookmarkButton(); updateHistoryButtons();
    $("viewerScroll").scrollTop=0;
    $("ackBtn").style.display=manual.requiresAcknowledgement?"flex":"none";
    $("ackBtn").textContent=manual.acknowledgedAt?"Acknowledged":"Acknowledge";
    $("ackBtn").disabled=Boolean(manual.acknowledgedAt);
  }

  function renderBreadcrumbs(){
    const {manual,chapter,section}=currentRecord();
    $("breadcrumbs").innerHTML=`<button data-breadcrumb-manual="${manual.id}">${escapeHtml(manual.short)}</button><span>›</span><button data-breadcrumb-chapter="${chapter.id}">${escapeHtml(chapter.code)} ${escapeHtml(chapter.title)}</button><span>›</span><span class="current">${escapeHtml(section.code)} ${escapeHtml(section.title)}</span>`;
  }

  function renderInspector(){
    const {manual,chapter,section}=currentRecord();
    const markets=manual.markets.includes("ALL")?["ALL"]:manual.markets;
    $("inspectorContent").innerHTML=`
      <div class="info-card"><div class="info-card-head">Publication</div><div class="info-card-body">
        ${infoRow("Document",manual.title)}${infoRow("Code",manual.code)}${infoRow("Section",section.code)}${infoRow("Owner",manual.owner)}${infoRow("Status",manual.status)}${infoRow("Revision",manual.revision)}${infoRow("Effective",manual.revisionDate)}
      </div></div>
      <div class="info-card"><div class="info-card-head">Current Applicability</div><div class="info-card-body"><div class="effectivity-list">${markets.map(market=>`<span class="effectivity-tag ${state.market!=="ALL"&&!manual.markets.includes("ALL")&&!markets.includes(state.market)?"excluded":""}">${escapeHtml(marketLabel(market))}</span>`).join("")}</div>${infoRow("Service Lines",manual.services.map(serviceLabel).join(", "))}${infoRow("Audience",manual.audiences.map(audienceLabel).join(", "))}</div></div>
      <div class="info-card"><div class="info-card-head">Revision History</div><div class="info-card-body"><div class="revision-item current"><b>Revision ${manual.revision} — Current</b><span>${manual.revisionDate} · Electronic distribution</span></div><div class="revision-item"><b>Revision ${Math.max(1,Number(manual.revision)-1)}</b><span>Superseded · Archived</span></div><div class="revision-item"><b>Revision ${Math.max(1,Number(manual.revision)-2)}</b><span>Superseded · Archived</span></div></div></div>
      <div class="info-card"><div class="info-card-head">Location</div><div class="info-card-body">${infoRow("Chapter",chapter.code+" "+chapter.title)}${infoRow("Section",section.code+" "+section.title)}${infoRow("Page",String(pageIndex()+1))}</div></div>`;
  }
  function infoRow(label,value){ return `<div class="info-row"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`; }

  function renderUpdates(){
    $("updateList").innerHTML=manuals.map(m=>`<div class="update-item" data-update-manual="${m.id}"><div class="bookmark-title">${escapeHtml(m.short)}</div><div class="bookmark-path">Revision ${m.revision} · Effective ${m.revisionDate}</div><div style="margin-top:5px"><span class="update-status" style="${m.updated?"":"background:var(--green-bg);color:var(--green)"}">${m.updated?"Review update":"Current"}</span></div></div>`).join("");
  }

  function renderBookmarks(){
    const filter=$("bookmarkFilter").value.trim().toLowerCase();
    const rows=state.bookmarks.map(id=>sectionRecord(id)).filter(Boolean).filter(rec=>!filter||(`${rec.manual.title} ${rec.section.code} ${rec.section.title}`).toLowerCase().includes(filter));
    $("bookmarkList").innerHTML=rows.length?rows.map(rec=>`<div class="bookmark-item" data-bookmark-open="${rec.section.id}"><div class="bookmark-title">${escapeHtml(rec.section.code)} ${escapeHtml(rec.section.title)}</div><div class="bookmark-path">${escapeHtml(rec.manual.short)} › ${escapeHtml(rec.chapter.title)}</div><div class="bookmark-actions"><button class="mini-btn" data-bookmark-remove="${rec.section.id}">Remove</button></div></div>`).join(""):`<div class="result-empty">No bookmarks saved.<br>Use the bookmark button while viewing a section.</div>`;
  }

  function switchSideTab(tab){
    state.activeSideTab=tab;
    document.querySelectorAll(".sidebar-tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.sideTab===tab));
    ["library","search","bookmarks","updates"].forEach(name=>$(name+"Panel").classList.toggle("hidden",name!==tab));
    if(tab==="bookmarks") renderBookmarks(); if(tab==="updates") renderUpdates();
  }

  function openSection(sectionId,{pushHistory=true,searchTerm=""}={}){
    const rec=sectionRecord(sectionId); if(!rec) return;
    state.activeManualId=rec.manual.id; state.activeSectionId=sectionId;
    if(!state.openTabs.includes(rec.manual.id)) state.openTabs.push(rec.manual.id);
    if(pushHistory){
      const item={manualId:rec.manual.id,sectionId};
      const current=state.history[state.historyIndex];
      if(!current||current.sectionId!==sectionId){ state.history=state.history.slice(0,state.historyIndex+1); state.history.push(item); state.historyIndex=state.history.length-1; }
    }
    renderDocument(searchTerm);
    if(!rec.manual.liveUrl) post("DOCUNET_OPEN_DOCUMENT",{documentId:rec.manual.id});
    if(window.innerWidth<=920) $("sidebar").classList.remove("mobile-open");
  }

  function openManual(manualId){
    const manual=manualById(manualId); if(!manual) return;
    const first=manual.chapters[0]?.sections[0]; if(first) openSection(first.id);
  }

  function closeTab(manualId){
    if(state.openTabs.length===1){ toast("At least one manual must remain open."); return; }
    const index=state.openTabs.indexOf(manualId); if(index<0) return;
    state.openTabs.splice(index,1);
    if(state.activeManualId===manualId){ const next=state.openTabs[Math.max(0,index-1)]||state.openTabs[0]; openManual(next); } else renderTabs();
  }

  function pageIndex(){
    const manual=currentManual(); const sections=manual.chapters.flatMap(ch=>ch.sections); const idx=sections.findIndex(s=>s.id===state.activeSectionId); if(idx<0) return 0;
    const proportional=Math.round((idx/Math.max(1,sections.length-1))*(manual.pages-1)); return Math.max(0,proportional);
  }
  function adjacentSection(direction){
    const manual=currentManual(); const sections=manual.chapters.flatMap(ch=>ch.sections); const idx=sections.findIndex(s=>s.id===state.activeSectionId); const next=sections[idx+direction]; if(next) openSection(next.id);
  }
  function jumpSection(position){ const sections=currentManual().chapters.flatMap(ch=>ch.sections); const target=position==="first"?sections[0]:sections[sections.length-1]; if(target) openSection(target.id); }

  function performSearch(query, source="panel"){
    query=query.trim(); state.searchQuery=query;
    if(!query){ $("searchResults").innerHTML='<div class="result-empty">Enter a word or phrase to search the manual library.</div>'; return; }
    const scope=$("searchScope").value; const exact=$("searchMatch").value==="PHRASE";
    const terms=exact?[query.toLowerCase()]:query.toLowerCase().split(/\s+/).filter(Boolean);
    const records=allSections.filter(rec=>{
      if(scope==="CURRENT"&&rec.manual.id!==state.activeManualId) return false;
      if(scope==="GROUP"&&rec.manual.group!==currentManual().group) return false;
      const text=`${rec.manual.title} ${rec.chapter.title} ${rec.section.code} ${rec.section.title} ${stripHtml(rec.section.body.html)}`.toLowerCase();
      return exact?text.includes(terms[0]):terms.every(term=>text.includes(term));
    });
    switchSideTab("search"); $("panelSearch").value=query; $("globalSearch").value=query;
    $("searchResults").innerHTML=records.length?records.map(rec=>{
      const plain=stripHtml(rec.section.body.html); const snippet=snippetAround(plain,terms[0]);
      return `<div class="result-item" data-search-open="${rec.section.id}"><div class="result-manual">${escapeHtml(rec.manual.short)}</div><div class="result-title">${escapeHtml(rec.section.code)} ${highlightText(rec.section.title,terms)}</div><div class="result-snippet">${highlightText(snippet,terms)}</div><div class="result-path">${escapeHtml(rec.chapter.code)} / ${escapeHtml(rec.chapter.title)}</div></div>`;
    }).join(""):`<div class="result-empty">No results found for “${escapeHtml(query)}”.<br>Try a broader search or change the scope.</div>`;
    if(source==="global") toast(`${records.length} search result${records.length===1?"":"s"} found.`);
  }

  function commandSearch(query){
    const q=query.trim().toLowerCase();
    const records=(q?allSections.filter(rec=>`${rec.manual.title} ${rec.section.code} ${rec.section.title}`.toLowerCase().includes(q)):allSections).slice(0,12);
    state.commandSelection=0;
    $("commandResults").innerHTML=records.map((rec,index)=>`<div class="command-result ${index===0?"active":""}" data-command-open="${rec.section.id}"><div class="command-icon">${icons.section}</div><div><div class="command-title">${escapeHtml(rec.section.code)} ${escapeHtml(rec.section.title)}</div><div class="command-path">${escapeHtml(rec.manual.short)} › ${escapeHtml(rec.chapter.title)}</div></div><div class="command-code">R${rec.manual.revision}</div></div>`).join("");
  }

  function highlightHtml(html,term){
    if(!term) return html;
    const div=document.createElement("div"); div.innerHTML=html;
    const walker=document.createTreeWalker(div,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement&&!["SCRIPT","STYLE"].includes(node.parentElement.tagName)&&node.nodeValue.toLowerCase().includes(term.toLowerCase())?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{ const re=new RegExp(`(${escapeRegex(term)})`,`gi`); const span=document.createElement("span"); span.innerHTML=node.nodeValue.replace(re,'<mark class="search-hit">$1</mark>'); node.parentNode.replaceChild(span,node); });
    return div.innerHTML;
  }
  function highlightText(text,terms){ let output=escapeHtml(text); terms.forEach(term=>{ if(term) output=output.replace(new RegExp(`(${escapeRegex(term)})`,`gi`),'<mark>$1</mark>'); }); return output; }
  function escapeRegex(value){ return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
  function stripHtml(html){ const div=document.createElement("div"); div.innerHTML=html; return div.textContent.replace(/\s+/g," ").trim(); }
  function snippetAround(text,term){ const index=text.toLowerCase().indexOf(term.toLowerCase()); const start=Math.max(0,index-55); return (start>0?"…":"")+text.slice(start,start+170)+(start+170<text.length?"…":""); }

  function toggleBookmark(){
    const id=state.activeSectionId; const idx=state.bookmarks.indexOf(id);
    if(idx>=0){ state.bookmarks.splice(idx,1); toast("Bookmark removed."); } else { state.bookmarks.push(id); toast("Section bookmarked."); }
    saveBookmarks(); updateBookmarkButton(); renderBookmarks();
  }
  function updateBookmarkButton(){ const active=state.bookmarks.includes(state.activeSectionId); $("bookmarkBtn").innerHTML=active?icons.bookmarkFill:icons.bookmark; $("bookmarkBtn").classList.toggle("active",active); }
  function loadBookmarks(){ try{return JSON.parse(localStorage.getItem("skandi-docunet-bookmarks")||"[]");}catch{return [];} }
  function saveBookmarks(){ try{ localStorage.setItem("skandi-docunet-bookmarks",JSON.stringify(state.bookmarks)); }catch(error){ /* Storage may be unavailable in restricted embeds. */ } }

  function applyTreeFilter(value){
    const query=value.trim().toLowerCase();
    document.querySelectorAll("#libraryTree .tree-node").forEach(node=>node.classList.remove("filter-match"));
    if(!query){ document.querySelectorAll("#libraryTree .tree-row").forEach(row=>row.classList.remove("filtered-out")); return; }
    document.querySelectorAll("#libraryTree .tree-node[data-tree-type='section']").forEach(node=>{
      const match=node.textContent.toLowerCase().includes(query); node.querySelector(":scope > .tree-row").classList.toggle("filtered-out",!match);
      if(match){ let parent=node.parentElement.closest(".tree-node"); while(parent){ parent.classList.add("expanded"); parent.querySelector(":scope > .tree-row").classList.remove("filtered-out"); parent=parent.parentElement.closest(".tree-node"); } }
    });
    document.querySelectorAll("#libraryTree .tree-node[data-tree-type='manual'],#libraryTree .tree-node[data-tree-type='chapter'],#libraryTree .tree-node[data-tree-type='group']").forEach(node=>{
      const ownMatch=node.querySelector(":scope > .tree-row").textContent.toLowerCase().includes(query); const childMatch=[...node.querySelectorAll(":scope > .tree-children .tree-row")].some(row=>!row.classList.contains("filtered-out")); node.querySelector(":scope > .tree-row").classList.toggle("filtered-out",!(ownMatch||childMatch));
    });
  }

  function setApplicability(){
    state.service=$("serviceFilter").value; state.market=$("marketFilter").value; state.audience=$("audienceFilter").value;
    $("statusEffectivity").textContent=`Applicability: ${serviceLabel(state.service)} / ${marketLabel(state.market)} / ${audienceLabel(state.audience)}`;
    renderLibraryTree(); renderInspector(); $("effectivitySummary").innerHTML=icons.shield+`<span>${manuals.filter(isApplicable).length} applicable manuals</span>`;
    if(!isApplicable(currentManual())) toast("The current manual is outside the selected applicability. It remains visible for reference.");
  }
  function serviceLabel(value){ return ({DESTINATION:"Destination Services",TRANSFERS:"Transfers",TOURS:"Tours & Activities",PACKAGES:"Travel Packages",ALL:"All Services"})[value]||value; }
  function marketLabel(value){ return ({USNYC:"USNYC · New York",SESTO:"SESTO · Stockholm",GRHER:"GRHER · Crete",ALL:"All Markets"})[value]||value; }
  function audienceLabel(value){ return ({OPERATIONS:"Operations",DESTINATION_STAFF:"Destination Staff",CUSTOMER_CARE:"Customer Care",PARTNER_MANAGEMENT:"Partner Management",ALL:"All Teams"})[value]||value; }

  function setZoom(value){ state.zoom=Math.min(150,Math.max(70,value)); renderDocument(state.searchQuery); }
  function fitWidth(){ const available=$("viewerScroll").clientWidth-56; const scale=Math.min(1.2,available/920); setZoom(Math.round(scale*100)); }
  function fitPage(){ const availableH=$("viewerScroll").clientHeight-40; const pageH=$("documentPage").scrollHeight; setZoom(Math.round(Math.min(1,availableH/pageH)*100)); }

  function updateHistoryButtons(){ $("backBtn").disabled=state.historyIndex<=0; $("forwardBtn").disabled=state.historyIndex>=state.history.length-1; }
  function moveHistory(delta){ const next=state.historyIndex+delta; if(next<0||next>=state.history.length)return; state.historyIndex=next; const item=state.history[next]; state.activeManualId=item.manualId; state.activeSectionId=item.sectionId; renderDocument(); }

  function showInspector(show){ 
    state.inspectorOpen=show; 
    $("inspector").classList.toggle("hidden",!show); 
    $("inspectorBtn").classList.toggle("active",show); 
  }
  function toast(message){ const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600); }
  function tickClock(){}

  function bindEvents(){
    document.addEventListener("click",event=>{
      // ADD THIS LINE: Close sidebar if clicking outside of it on smaller screens
      if (window.innerWidth <= 920 && $("sidebar").classList.contains("mobile-open") && !event.target.closest(".sidebar") && !event.target.closest(".sidebar-overlay-toggle") && !event.target.closest("#libraryHeaderBtn")) { $("sidebar").classList.remove("mobile-open"); }
      
      const toggle=event.target.closest(".tree-toggle"); if(toggle&&!toggle.classList.contains("placeholder")){ event.stopPropagation(); toggle.closest(".tree-node").classList.toggle("expanded"); return; }
      const openSectionEl=event.target.closest("[data-open-section]"); if(openSectionEl){ openSection(openSectionEl.dataset.openSection); return; }
      const openManualEl=event.target.closest("[data-open-manual]"); if(openManualEl){ openManual(openManualEl.dataset.openManual); return; }
      const tab=event.target.closest("[data-tab-manual]"); if(tab&&!event.target.closest("[data-close-tab]")){ openManual(tab.dataset.tabManual); return; }
      const close=event.target.closest("[data-close-tab]"); if(close){ event.stopPropagation(); closeTab(close.dataset.closeTab); return; }
      const sideTab=event.target.closest("[data-side-tab]"); if(sideTab){ switchSideTab(sideTab.dataset.sideTab); return; }
      const result=event.target.closest("[data-search-open]"); if(result){ openSection(result.dataset.searchOpen,{searchTerm:state.searchQuery}); return; }
      const markOpen=event.target.closest("[data-bookmark-open]"); if(markOpen&&!event.target.closest("[data-bookmark-remove]")){ openSection(markOpen.dataset.bookmarkOpen); return; }
      const markRemove=event.target.closest("[data-bookmark-remove]"); if(markRemove){ state.bookmarks=state.bookmarks.filter(id=>id!==markRemove.dataset.bookmarkRemove); saveBookmarks(); renderBookmarks(); updateBookmarkButton(); return; }
      const update=event.target.closest("[data-update-manual]"); if(update){ openManual(update.dataset.updateManual); switchSideTab("library"); return; }
      const command=event.target.closest("[data-command-open]"); if(command){ closeCommand(); openSection(command.dataset.commandOpen); return; }
      if(event.target.closest("#newTabBtn")){ switchSideTab("library"); $("sidebar").classList.add("mobile-open"); toast("Select a manual from the library."); return; }
      if(event.target.closest("[data-breadcrumb-manual]")){ openManual(event.target.closest("[data-breadcrumb-manual]").dataset.breadcrumbManual); }
    });
    // Top Header Navigation Logic
    document.querySelector(".header-nav").addEventListener("click", e => {
      if(e.target.tagName === "BUTTON" && e.target.id !== "helpBtn") {
        document.querySelectorAll(".header-nav button:not(#helpBtn)").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
      }
    });
    
    $("viewerHeaderBtn").onclick=()=>$("sidebar").classList.remove("mobile-open");
    $("libraryHeaderBtn").onclick=()=>{switchSideTab("library");$("sidebar").classList.add("mobile-open");}; 
    $("updatesHeaderBtn").onclick=()=>{switchSideTab("updates");$("sidebar").classList.add("mobile-open");};
    $("formsHeaderBtn").onclick=()=>{switchSideTab("library");$("treeFilter").value="";applyTreeFilter("");document.querySelectorAll("#libraryTree .tree-node").forEach(node=>{if(/controlled forms|forms|customer documents/i.test(node.textContent||""))node.classList.add("expanded")});toast("Controlled forms are available in the document library.");$("sidebar").classList.add("mobile-open");};
    $("helpBtn").onclick=()=>toast("Use the library tree, search, applicability filters, bookmarks and document tabs.");
    $("globalSearch").addEventListener("keydown",e=>{ if(e.key==="Enter") performSearch(e.target.value,"global"); });
    $("searchSubmitBtn").onclick=()=>performSearch($("globalSearch").value,"global");
    $("panelSearch").addEventListener("keydown",e=>{if(e.key==="Enter")performSearch(e.target.value);});
    $("treeFilter").addEventListener("input",e=>applyTreeFilter(e.target.value));
    $("bookmarkFilter").addEventListener("input",renderBookmarks);
    $("clearSearchBtn").onclick=()=>{$("panelSearch").value="";$("globalSearch").value="";state.searchQuery="";performSearch("");};
    $("clearBookmarksBtn").onclick=()=>{if(confirm("Remove all bookmarks?")){state.bookmarks=[];saveBookmarks();renderBookmarks();updateBookmarkButton();}};
    $("expandAllBtn").onclick=()=>document.querySelectorAll("#libraryTree .tree-node").forEach(node=>node.classList.add("expanded"));
    $("collapseAllBtn").onclick=()=>document.querySelectorAll("#libraryTree .tree-node").forEach(node=>node.classList.remove("expanded"));
    $("bookmarkBtn").onclick=toggleBookmark; $("printBtn").onclick=()=>window.print();
    $("ackBtn").onclick=()=>{const manual=currentManual();post("DOCUNET_ACKNOWLEDGE",{documentId:manual.id});toast("Recording acknowledgement…");};
    $("nightModeBtn").onclick=()=>{document.body.classList.toggle("night");$("nightModeBtn").classList.toggle("active",document.body.classList.contains("night"));};
    $("serviceFilter").onchange=setApplicability; $("marketFilter").onchange=setApplicability; $("audienceFilter").onchange=setApplicability;
    $("previousSectionBtn").onclick=()=>adjacentSection(-1); $("nextSectionBtn").onclick=()=>adjacentSection(1); $("firstSectionBtn").onclick=()=>jumpSection("first"); $("lastSectionBtn").onclick=()=>jumpSection("last");
    $("zoomOutBtn").onclick=()=>setZoom(state.zoom-10); $("zoomInBtn").onclick=()=>setZoom(state.zoom+10); $("fitWidthBtn").onclick=fitWidth; $("fitPageBtn").onclick=fitPage;
    $("backBtn").onclick=()=>moveHistory(-1); $("forwardBtn").onclick=()=>moveHistory(1);
    $("inspectorBtn").onclick=()=>showInspector(!state.inspectorOpen); $("inspectorCloseBtn").onclick=()=>showInspector(false);
    $("mobileLibraryBtn").onclick=()=>$("sidebar").classList.toggle("mobile-open");
    $("libraryHeaderBtn").onclick=()=>{switchSideTab("library");$("sidebar").classList.add("mobile-open");}; $("updatesHeaderBtn").onclick=()=>switchSideTab("updates");
    $("formsHeaderBtn").onclick=()=>{switchSideTab("library");$("treeFilter").value="";applyTreeFilter("");document.querySelectorAll("#libraryTree .tree-node").forEach(node=>{if(/controlled forms|forms|customer documents/i.test(node.textContent||""))node.classList.add("expanded")});toast("Controlled forms are available in the document library.");};$("helpBtn").onclick=()=>toast("Use the library tree, search, applicability filters, bookmarks and document tabs.");
    $("syncNowBtn").onclick=()=>{$("syncStateText").textContent="Syncing…";post("DOCUNET_READY",{forceRefresh:true,includeControlledForms:true,includeDocumentTemplates:true,templateVisibility:"ALL_STAFF"});toast("Synchronizing DocuNet…");};
    $("pageNumber").addEventListener("change",e=>{ const requested=Math.max(1,Math.min(currentManual().pages,Number(e.target.value)||1)); const sections=currentManual().chapters.flatMap(ch=>ch.sections); const idx=Math.round(((requested-1)/Math.max(1,currentManual().pages-1))*(sections.length-1)); openSection(sections[idx].id); });

    document.addEventListener("keydown",e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand();}
      if(e.key==="Escape"){closeCommand();$("sidebar").classList.remove("mobile-open");}
      if(e.altKey&&e.key==="ArrowLeft"){e.preventDefault();moveHistory(-1);} if(e.altKey&&e.key==="ArrowRight"){e.preventDefault();moveHistory(1);}
    });
    $("commandBackdrop").addEventListener("click",e=>{if(e.target===$("commandBackdrop"))closeCommand();});
    $("commandInput").addEventListener("input",e=>commandSearch(e.target.value));
    $("commandInput").addEventListener("keydown",e=>{
      const rows=[...document.querySelectorAll(".command-result")];
      if(e.key==="ArrowDown"){e.preventDefault();state.commandSelection=Math.min(rows.length-1,state.commandSelection+1);}
      if(e.key==="ArrowUp"){e.preventDefault();state.commandSelection=Math.max(0,state.commandSelection-1);}
      rows.forEach((row,index)=>row.classList.toggle("active",index===state.commandSelection));
      if(e.key==="Enter"&&rows[state.commandSelection])rows[state.commandSelection].click();
    });
  }

  function openCommand(){ $("commandBackdrop").classList.add("open"); $("commandInput").value=""; commandSearch(""); setTimeout(()=>$("commandInput").focus(),0); }
  function closeCommand(){ $("commandBackdrop").classList.remove("open"); }

  function init(){
    assignIcons(); bindEvents();
    manuals=[]; allSections=[]; state.openTabs=[]; state.activeManualId=""; state.activeSectionId="";
    $("documentTabs").innerHTML=""; $("libraryTree").innerHTML='<div class="result-empty">Loading assigned publications…</div>';
    $("documentPage").innerHTML='<h1>Loading DocuNet…</h1><p>Your assigned controlled documents are being synchronized.</p>';
    $("demoWarning").style.display="none";
    post("DOCUNET_READY",{includeControlledForms:true,includeDocumentTemplates:true,templateVisibility:"ALL_STAFF"});
    $("searchResults").innerHTML='<div class="result-empty">Search across structured manual content, chapter titles and section codes.</div>';
  }

  function loadLiveLibrary(payload){
    const documents=Array.isArray(payload?.documents)?payload.documents:[];
    manuals=documents.map(document=>{
      const sectionId=`${document.id}-pdf`;
      return {
        ...document,
        short:document.short||document.title,
        group:document.group||"Company Manuals",
        services:document.services?.length?document.services:["ALL"],
        markets:document.markets?.length?document.markets:["ALL"],
        audiences:document.audiences?.length?document.audiences:["ALL"],
        pages:Math.max(1,Number(document.pages||1)),
        liveUrl:"",
        chapters:[{id:`${document.id}-publication`,code:"PUB",title:"Controlled Publication",sections:[
          section(sectionId,document.code,document.title,document.summary||"Controlled PDF publication.",contentBlock(document.title,`<p>${escapeHtml(document.summary||"Open the controlled PDF to view this publication.")}</p>`))
        ]}]
      };
    });
    allSections=manuals.flatMap(manual=>manual.chapters.flatMap(chapter=>chapter.sections.map(section=>({manual,chapter,section}))));
    const actor=payload?.session||{};
    const syncedAt=payload?.syncedAt||new Date().toISOString();
    const syncedDate=new Date(syncedAt);
    $("lastSyncCell").textContent=`Last sync ${syncedDate.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
    $("syncStateText").textContent="Up to date";
    const name=actor.name||"SKANDI Staff";
    const initials=name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
    document.querySelector(".avatar").textContent=initials;
    document.querySelector(".user-meta b").textContent=name;
    document.querySelector(".user-meta span").textContent=[actor.audience,actor.market].filter(Boolean).join(" · ");
    if(!manuals.length){
      $("documentPage").innerHTML="<h1>No assigned publications</h1><p>No published documents currently match your staff profile.</p>";
      renderLibraryTree(); return;
    }
    state.activeManualId=manuals[0].id;
    state.activeSectionId=manuals[0].chapters[0].sections[0].id;
    state.openTabs=[manuals[0].id];
    state.service=actor.service||"ALL"; state.market=actor.market||"ALL"; state.audience=actor.audience||"ALL";
    if([...$("serviceFilter").options].some(o=>o.value===state.service)) $("serviceFilter").value=state.service;
    if([...$("marketFilter").options].some(o=>o.value===state.market)) $("marketFilter").value=state.market;
    if([...$("audienceFilter").options].some(o=>o.value===state.audience)) $("audienceFilter").value=state.audience;
    renderTabs(); renderLibraryTree(); renderUpdates(); renderBookmarks(); openSection(state.activeSectionId);
  }

  window.addEventListener("message",event=>{
    const message=event.data||{};
    if(message.type==="DOCUNET_BOOTSTRAP_RESULT") loadLiveLibrary(message.payload||{});
    if(message.type==="DOCUNET_DOCUMENT_ACCESS_RESULT"){
      const manual=manualById(message.payload?.documentId);
      if(manual){manual.liveUrl=message.payload.signedUrl||"";renderDocument();}
    }
    if(message.type==="DOCUNET_ACKNOWLEDGE_RESULT"){
      const manual=manualById(message.payload?.documentId);
      if(manual){manual.acknowledgedAt=message.payload.acknowledgedAt||new Date().toISOString();renderDocument();toast("Current revision acknowledged.");}
    }
    if(message.type==="DOCUNET_ERROR"){$("syncStateText").textContent="Sync error";toast(message.message||"DocuNet request failed.");}
  });

  init();
})();
</script>
</body>
</html>
```
