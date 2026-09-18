# Flight Status

## INFO

- STATUS: ** **IN PROGRESS** **
- LIVE HTML: YES
- WIX PAGE: `Flight Status.cn7ah`
- SLUG: `/travel-info/flight-status`
- ELEMENT: `#flightStatusEmbed`
- AREA: **SKANDI**
- VERSION: `B-011.37`
- LAST SYNCED: 2026-09-16
- RUNIME CHAIN: `/HTML_REF/skandi/Flight Status.md` → `/src/pages/Flight Status.cn7ah.js` → `backend/SKANDI_CORE/flightStatus.web.js` → `backend/SKANDI_CORE/flightStatus.js` → Aviationstack + canonical Supabase public data.
- The HTML embed owns presentation and postMessage interaction only. It must not access Supabase or provider credentials directly.
- Flight data is normalized by the canonical Flight Status backend.
- Airport context is read from published/customer-visible airport and inventory sources only.
- Global SKANDI header/footer remain site-level and are not duplicated inside the embed.

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***
## CONTRACT

Child source: `SKANDI_FLIGHT_STATUS`  
Parent source: `SKANDI_WIX_PARENT`

Messages:
- `FLIGHT_STATUS_READY`
- `FLIGHT_STATUS_HOST_READY`
- `FLIGHT_STATUS_AIRPORTS_REQUEST`
- `FLIGHT_STATUS_AIRPORTS_RESULTS`
- `FLIGHT_STATUS_AIRPORTS_ERROR`
- `FLIGHT_STATUS_SEARCH`
- `FLIGHT_STATUS_RESULTS`
- `FLIGHT_STATUS_ERROR`
- `FLIGHT_STATUS_AIRPORT_CONTEXT_REQUEST`
- `FLIGHT_STATUS_AIRPORT_CONTEXT_RESULTS`
- `FLIGHT_STATUS_AIRPORT_CONTEXT_ERROR`
- `FLIGHT_STATUS_AIRPORT_ACTION`

## DATA OWNERSHIP

Flight-status provider:
- Aviationstack, server-side through `backend/SKANDI_CORE/flightStatus.js`.

Airport passenger information:
- `public.travel_info_airports`, filtered to active, published and customer-visible records.

Related customer products:
- `public.inventory_public_entities_v`, whose verified view definition limits results to `status = 'PUBLISHED'`, `active = true`, and `customer_visible = true`.
- Supported related entity types: TRANSFER, HOTEL, DESTINATION, GUIDED_TOUR, ACTIVITY.

No production sample/fallback records are permitted.

## CHANGE LOG

### B-011.37 · 2026-09-18

- Final full-chain review after B-011.36.
- Preserves Airport Board, Flight Number and Route lookup modes.
- Keeps the FIDS time-led, high-contrast and airport-display focused.
- Selecting an airport transitions the page into that airport's guide and customer-visible SKANDI continuation products.
- Airport autocomplete is supplied by published airport records.
- Airport guide content supports terminal, transport, lounge, dining, airport hotel, quick facts, official airport links and destination context when present in the database.
- Related transfer, hotel, destination and experience cards come only from the canonical public inventory view.
- Added strict mode-specific search payloads so hidden/stale values cannot leak between Airport, Flight Number and Route searches.
- Fixed blank route fields so they cannot resolve to the first airport in the directory.
- Date-change auto-refresh now respects the active lookup mode.
- Frontend date limits now use the same UTC day window as the canonical backend, preventing client/backend disagreement around midnight.
- Added bounded UI request timeouts: flight-status searches cannot remain in an infinite loading state, and airport-context loading can fail independently without blocking the FIDS.
- Added stale context protection and request invalidation on clear/mode changes.
- Parent-message handling now validates both the SKANDI parent source contract and the actual parent window.
- Unknown airlines use a neutral carrier fallback instead of an unrelated airline/brand logo.
- Empty airport modules remain hidden rather than fabricating restaurant, lounge, hotel or product content.
- All public commerce actions route through the Wix page controller and canonical site-map routes.
- No direct Supabase, Aviationstack, Duffel or credential access exists in the HTML.
- Static verification: HTML parse PASS, JavaScript syntax PASS, zero duplicate IDs.
- Browser smoke verification: mode-specific payloads PASS, ARN airport context PASS, SKANDI Transfer rendering PASS, FIDS local schedule rendering PASS, desktop horizontal overflow PASS, no page JavaScript errors in the tested state.
- Live deployment/runtime still depends on the Wix page being updated with the B-011.37 controller/backend files and a configured Aviationstack commercial plan/secret appropriate for the requested data features.

## COMPLETE INTENDED LIVE HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f6faff">
<title>Flight Status | SKANDI Travels · B-011.37</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Roboto+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --sk-navy:#022e64;
  --sk-navy-deep:#0b3a7a;
  --sk-navy-black:#04254a;
  --sk-blue:#285ca8;
  --sk-blue-2:#0b5c85;
  --sk-aqua:#5fc7cf;
  --sk-aqua-soft:#d9f1f1;
  --sk-aqua-pale:#eef9fa;
  --sk-ice:#e9eef8;
  --sk-sand:#f2e9dc;
  --sk-porcelain:#f6faff;
  --sk-section:#f3f6f8;
  --sk-white:#fff;
  --sk-graphite:#111827;
  --sk-muted:#667085;
  --sk-body:#526274;
  --sk-border:#dbe3ef;
  --sk-champagne:#d1bc98;
  --sk-danger:#d85f66;
  --sk-warning:#d59a36;
  --sk-success:#2f9170;
  --ease:cubic-bezier(.16,1,.3,1);
  --content:1380px;
  --mx:72%;
  --my:18%;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--sk-navy)}
body{
  margin:0;min-width:320px;overflow-x:hidden;
  color:var(--sk-graphite);background:var(--sk-navy);
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
button,input,select{font:inherit}button{cursor:pointer}a{color:inherit}
:focus-visible{outline:3px solid rgba(95,199,207,.62);outline-offset:3px}
[hidden]{display:none!important}
.page{position:relative;overflow:hidden;background:#fff}
.wrap{width:min(var(--content),calc(100% - 56px));margin-inline:auto}

/* =========================================================
   LIGHT SKANDI HERO — same family as Our Network
   ========================================================= */
.hero{
  position:relative;isolation:isolate;overflow:hidden;
  min-height:620px;
  background:
    radial-gradient(circle at var(--mx) var(--my),rgba(95,199,207,.18),transparent 21%),
    radial-gradient(circle at 12% 28%,rgba(40,92,168,.10),transparent 22%),
    linear-gradient(180deg,#f8fbff 0%,#edf5ff 55%,#f3f6f8 100%);
}
.hero::before{
  content:"";position:absolute;inset:0;z-index:-2;pointer-events:none;opacity:.23;
  background-image:
    linear-gradient(rgba(11,58,122,.055) 1px,transparent 1px),
    linear-gradient(90deg,rgba(11,58,122,.055) 1px,transparent 1px);
  background-size:38px 38px;
  mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.38) 68%,transparent);
  animation:gridDrift 28s linear infinite;
}
.hero::after{
  content:"";position:absolute;left:-12%;right:-12%;bottom:-170px;height:340px;z-index:1;pointer-events:none;
  background:
    radial-gradient(ellipse at 18% 42%,rgba(255,255,255,.90),transparent 43%),
    radial-gradient(ellipse at 68% 42%,rgba(217,241,241,.62),transparent 46%),
    linear-gradient(180deg,transparent,#f3f6f8 86%);
  filter:blur(18px);
}
@keyframes gridDrift{to{background-position:76px 38px,38px 76px}}
.hero-route-art{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.55;filter:drop-shadow(0 0 10px rgba(95,199,207,.12))}
.hero-route-art path{fill:none;stroke:url(#heroRoute);stroke-width:1.15;stroke-dasharray:4 10;animation:routeFlow 18s linear infinite}
.hero-route-art circle{fill:var(--sk-aqua);filter:drop-shadow(0 0 8px rgba(95,199,207,.75));animation:nodePulse 2.8s ease-in-out infinite}
@keyframes routeFlow{to{stroke-dashoffset:-180}}@keyframes nodePulse{50%{opacity:.42;transform:scale(.85)}}
.hero-inner{position:relative;z-index:3;padding:72px 0 168px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:42px;align-items:start}
.hero-copy{max-width:790px}
.eyebrow{display:flex;align-items:center;gap:11px;color:var(--sk-blue);font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.eyebrow::before{content:"";width:38px;height:1px;background:linear-gradient(90deg,var(--sk-aqua),transparent)}
.hero h1{margin:16px 0 18px;color:var(--sk-navy);font-size:clamp(52px,6.8vw,94px);font-weight:550;line-height:.91;letter-spacing:-.072em;text-wrap:balance}
.hero h1 span{display:block;color:#0b5c85;font-weight:400}
.hero-lede{max-width:720px;color:#5d6d7e;font-size:clamp(14px,1.25vw,18px);line-height:1.75}
.hero-status{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(420px,34vw)}
.hero-stat{position:relative;overflow:hidden;min-height:116px;padding:18px;border:1px solid rgba(2,46,100,.08);border-radius:22px;background:rgba(255,255,255,.82);backdrop-filter:blur(16px);box-shadow:0 14px 36px rgba(2,46,100,.09)}
.hero-stat:nth-child(2){background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff}
.hero-stat::after{content:"";position:absolute;width:100px;height:100px;border-radius:50%;right:-52px;top:-56px;border:1px solid rgba(95,199,207,.22)}
.hero-stat label{display:block;color:#6d7d8d;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.hero-stat:nth-child(2) label{color:#9fc3d4}
.hero-stat strong{display:block;margin-top:14px;color:var(--sk-navy);font-size:22px;line-height:1.06;letter-spacing:-.04em}
.hero-stat:nth-child(2) strong{color:#fff}
.live-pill{display:inline-flex;align-items:center;gap:7px;margin-top:11px;color:#497082;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.hero-stat:nth-child(2) .live-pill{color:#c9e4e6}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--sk-aqua);box-shadow:0 0 0 5px rgba(95,199,207,.14),0 0 12px rgba(95,199,207,.48);animation:pulse 1.9s ease-in-out infinite}
@keyframes pulse{50%{opacity:.45;transform:scale(.78)}}

/* =========================================================
   SEARCH / GLASS PANEL
   ========================================================= */

.search-shell{position:relative;z-index:16;margin-top:-178px}
.search-card{
  position:relative;overflow:hidden;padding:18px 18px 16px;border:1px solid rgba(255,255,255,.72);border-radius:28px;
  background:
    linear-gradient(180deg,rgba(255,255,255,.88),rgba(255,255,255,.82)),
    linear-gradient(135deg,rgba(217,241,241,.50),rgba(233,238,248,.42));
  backdrop-filter:blur(24px) saturate(1.08);
  box-shadow:0 28px 70px rgba(2,46,100,.15), inset 0 1px rgba(255,255,255,.55);
}
.search-card::before{
  content:"";position:absolute;inset:0;pointer-events:none;opacity:.75;
  background:
    radial-gradient(circle at 8% 20%,rgba(95,199,207,.18),transparent 18%),
    radial-gradient(circle at 88% 16%,rgba(40,92,168,.12),transparent 18%),
    linear-gradient(120deg,transparent 0 34%,rgba(255,255,255,.44) 48%,transparent 62%);
  background-size:auto,auto,220% 100%;animation:searchSheen 9s ease-in-out infinite;
}
@keyframes searchSheen{0%,28%{background-position:center,center,-130% 0}74%,100%{background-position:center,center,170% 0}}
.search-head{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;margin-bottom:12px}
.search-title strong{display:block;color:var(--sk-navy);font-size:17px;letter-spacing:-.04em}.search-title span{display:block;margin-top:2px;color:#738396;font-size:10px;line-height:1.45}
.mode-tabs{display:flex;gap:7px;flex-wrap:wrap}
.tab{min-height:34px;padding:0 13px;border:1px solid rgba(2,46,100,.08);border-radius:999px;background:rgba(255,255,255,.76);color:#5f7285;font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;transition:transform .18s ease,background .18s ease,color .18s ease,border-color .18s ease,box-shadow .18s ease}
.tab:hover{transform:translateY(-1px);border-color:rgba(95,199,207,.7)}
.tab.active{background:linear-gradient(135deg,#022e64,#0b5c85);border-color:#022e64;color:#fff;box-shadow:0 10px 22px rgba(2,46,100,.16)}
.notice{position:relative;display:none;margin-bottom:12px;padding:11px 13px;border-radius:14px;background:rgba(255,210,122,.14);border:1px solid rgba(255,210,122,.34);color:#7a6128;font-size:10px;line-height:1.5}.notice.is-visible{display:block}
.form-grid{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:10px;align-items:end}
.field{display:flex;flex-direction:column;gap:6px}.field label{color:#7a8692;font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
.field input,.field select{width:100%;min-height:44px;padding:9px 12px;border:1px solid rgba(2,46,100,.10);border-radius:14px;background:rgba(255,255,255,.85);color:var(--sk-graphite);outline:none;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.field input:focus,.field select:focus{border-color:var(--sk-aqua);box-shadow:0 0 0 4px rgba(95,199,207,.12),0 10px 24px rgba(2,46,100,.06);transform:translateY(-1px)}
.col-2{grid-column:span 2}.col-3{grid-column:span 3}.col-4{grid-column:span 4}.col-5{grid-column:span 5}.col-6{grid-column:span 6}.col-12{grid-column:span 12}
.btn{min-height:44px;padding:0 16px;border:1px solid transparent;border-radius:14px;background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff;font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;transition:transform .2s var(--ease),box-shadow .2s ease,filter .2s ease}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(2,46,100,.16)}.btn.secondary{background:rgba(255,255,255,.72);border-color:rgba(2,46,100,.08);color:var(--sk-navy)}
.search-foot{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid rgba(2,46,100,.07)}
.hint{color:#6c7d90;font-size:9px;line-height:1.5}.search-meta{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.search-chip{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:rgba(255,255,255,.74);border:1px solid rgba(2,46,100,.06);color:#66798d;font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}

.board-section{position:relative;padding:34px 0 92px;background:#f3f6f8;isolation:isolate}
.board-section::before{content:"";position:absolute;inset:0;z-index:-2;pointer-events:none;background:
  radial-gradient(circle at 14% 12%,rgba(95,199,207,.10),transparent 18%),
  radial-gradient(circle at 85% 32%,rgba(40,92,168,.08),transparent 22%),
  linear-gradient(rgba(2,46,100,.022) 1px,transparent 1px),
  linear-gradient(90deg,rgba(2,46,100,.022) 1px,transparent 1px);
  background-size:auto,auto,56px 56px,56px 56px;mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.48),transparent 95%)}
.board-section::after{content:"";position:absolute;left:0;right:0;top:-52px;height:120px;pointer-events:none;background:linear-gradient(180deg,rgba(243,246,248,0),#f3f6f8 74%)}
.board-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.5fr);gap:26px;align-items:end;margin-bottom:18px}.board-heading h2{margin-top:8px;color:var(--sk-navy);font-size:clamp(30px,4vw,54px);font-weight:560;line-height:.98;letter-spacing:-.056em}.board-heading p{color:#677687;font-size:12px;line-height:1.72}
.flight-board-shell{
  position:relative;overflow:hidden;border:1px solid rgba(2,46,100,.10);border-radius:36px;padding:18px;
  background:
    radial-gradient(circle at var(--mx) var(--my),rgba(95,199,207,.10),transparent 24%),
    linear-gradient(145deg,rgba(255,255,255,.97),rgba(233,238,248,.92));
  box-shadow:0 34px 88px rgba(2,46,100,.16);
}
.flight-board-shell::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse at 50% -4%,rgba(95,199,207,.15),transparent 32%),
    radial-gradient(ellipse at 20% 0,rgba(255,255,255,.60),transparent 32%),
    linear-gradient(120deg,transparent 0 36%,rgba(255,255,255,.46) 48%,transparent 60%);
  background-size:auto,auto,220% 100%;animation:boardSheen 11s ease-in-out infinite
}
.flight-board-shell::after{content:"";position:absolute;inset:10px;border:1px solid rgba(255,255,255,.78);border-radius:28px;pointer-events:none}
@keyframes boardSheen{0%,30%{background-position:center,center,-120% 0}74%,100%{background-position:center,center,170% 0}}
.flight-board-shell .airport-ambient{display:none}
.board-top{
  position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(330px,.85fr) auto;gap:12px;align-items:center;margin-bottom:12px;padding:18px 18px 17px;border-radius:24px;
  background:
    radial-gradient(circle at 12% 0,rgba(95,199,207,.18),transparent 24%),
    linear-gradient(135deg,#04254a,#0b477e 68%,#126d78);
  color:#fff;box-shadow:0 18px 38px rgba(2,46,100,.22)
}
.board-brand{display:flex;align-items:center;gap:14px}.board-monogram{width:52px;height:52px;border-radius:17px;display:grid;place-items:center;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);color:#d9f1f1;font-size:11px;font-weight:800;letter-spacing:.16em;box-shadow:inset 0 1px rgba(255,255,255,.12),0 10px 20px rgba(0,0,0,.12)}
.board-brand strong{display:block;font-size:28px;font-weight:600;letter-spacing:-.045em;line-height:.96}.board-brand span{display:block;margin-top:4px;color:#afd0df;font-size:8px;font-weight:780;letter-spacing:.13em;text-transform:uppercase}
.board-query{min-width:0;padding:12px 14px;border-radius:15px;background:rgba(3,17,31,.22);border:1px solid rgba(255,255,255,.11);backdrop-filter:blur(12px)}
.board-query label{display:block;color:#8eb2c4;font-size:7px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.board-query strong{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eefaf9;font-size:10px;letter-spacing:.05em}
.board-live{display:flex;align-items:center;gap:8px;padding:11px 13px;border-radius:15px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);white-space:nowrap}.board-live span{color:#c8dce6;font-size:8px;font-weight:750;letter-spacing:.10em;text-transform:uppercase}.board-live strong{color:#fff;font-size:9px}.board-live .live-dot{width:7px;height:7px}
.board-screen{
  position:relative;z-index:2;overflow:hidden;border-radius:26px;
  background:
    radial-gradient(circle at 20% 0,rgba(95,199,207,.10),transparent 26%),
    linear-gradient(145deg,#061728,#03111f 46%,#08243a 100%);
  border:1px solid rgba(255,255,255,.06);
  box-shadow:inset 0 18px 40px rgba(0,0,0,.36),0 16px 32px rgba(2,46,100,.12)
}
.board-screen::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.24;background:
  radial-gradient(circle at 50% 0,rgba(95,199,207,.12),transparent 28%),
  linear-gradient(rgba(95,199,207,.045) 1px,transparent 1px),
  linear-gradient(90deg,rgba(95,199,207,.045) 1px,transparent 1px);
  background-size:auto,32px 32px,32px 32px;mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.26))}
.board-screen::after{content:"";position:absolute;z-index:6;top:-18%;left:-30%;width:34%;height:150%;pointer-events:none;background:linear-gradient(105deg,transparent,rgba(255,255,255,.05),rgba(95,199,207,.08),transparent);transform:skewX(-16deg);animation:glassSweep 10s ease-in-out infinite}
@keyframes glassSweep{0%,35%{left:-34%}76%,100%{left:122%}}
.fids-layout{min-width:1460px;display:grid;grid-template-columns:98px 120px 104px minmax(245px,1.25fr) 104px minmax(245px,1.25fr) 174px 210px 90px}
.board-columns{position:relative;z-index:2;min-height:42px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03)}.board-columns>div{display:flex;align-items:center;padding:0 10px;border-right:1px solid rgba(255,255,255,.035);color:#7aa0b5;font-size:7px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.board-columns>div:last-child{border-right:0}
.board-scroll{position:relative;z-index:2;overflow-x:auto;padding:8px 8px 10px;min-height:398px;scrollbar-width:thin;scrollbar-color:#23415a transparent}
.flip-body{min-width:1460px;display:grid;gap:8px}
.fids-row{position:relative;min-height:68px;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.024));border:1px solid rgba(255,255,255,.058);box-shadow:0 10px 24px rgba(0,0,0,.13);animation:rowEnter .52s var(--ease) both;animation-delay:calc(var(--row,0)*55ms);transition:transform .2s ease,background .2s ease,border-color .2s ease}.fids-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:16px 0 0 16px;background:linear-gradient(180deg,rgba(95,199,207,.75),rgba(2,46,100,.0));opacity:.65}.fids-row:hover{transform:translateY(-2px);background:rgba(255,255,255,.06);border-color:rgba(95,199,207,.18)}
@keyframes rowEnter{from{opacity:0;transform:translateY(9px) scale(.994)}to{opacity:1;transform:none}}
.fids-cell{min-width:0;padding:10px 8px 10px 10px;display:flex;align-items:center;border-right:1px solid rgba(255,255,255,.035);overflow:hidden}.fids-cell:last-child{border-right:0}.place-bank{display:flex;align-items:center;min-width:0}.route-slash{display:inline-block;margin:0 4px;color:#5fc7cf;font-weight:800;opacity:.55}
.flap-container{position:relative;display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:rgba(2,10,18,.76);border:1px solid rgba(255,255,255,.06);box-shadow:inset 0 1px rgba(255,255,255,.05),inset 0 -2px 8px rgba(0,0,0,.54)}.flap-container::before{content:"";position:absolute;inset:1px;border-radius:8px;border:1px solid rgba(95,199,207,.03);pointer-events:none}.flap-letters{display:inline-flex;gap:2px}.tv-text{display:none}
.split-flap{--tile-h:36px;position:relative;width:20px;height:36px;border-radius:4px;overflow:hidden;background:linear-gradient(180deg,#18314c,#0e2137);border:1px solid rgba(255,255,255,.05);color:#f5fbff;font-family:"Roboto Mono",monospace;font-size:14px;font-weight:700;line-height:36px;text-align:center;text-shadow:0 1px 1px rgba(0,0,0,.55),0 0 7px rgba(143,211,255,.08);box-shadow:inset 0 1px rgba(255,255,255,.10),inset 0 -3px 6px rgba(0,0,0,.45),0 1px 1px rgba(0,0,0,.36)}
.split-flap::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;transform:translateY(-50%);background:#081521;box-shadow:0 1px rgba(255,255,255,.08);z-index:14}
.split-flap::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.10),transparent 28%,transparent 58%,rgba(0,0,0,.18));pointer-events:none;z-index:1}.flap-half{position:absolute;left:0;width:100%;height:50%;overflow:hidden;background:linear-gradient(180deg,#28496b,#10253d);backface-visibility:hidden}.flap-top{top:0}.flap-bottom{bottom:0;background:linear-gradient(180deg,#17314f,#0b1e33)}.flap-half span{position:absolute;left:0;width:100%;height:36px;display:grid;place-items:center}.flap-top span{top:0}.flap-bottom span{bottom:0}.flap-drop{position:absolute;z-index:10;left:0;top:0;width:100%;height:50%;overflow:hidden;transform-origin:50% 100%;background:linear-gradient(180deg,#356692,#14324f);box-shadow:inset 0 1px rgba(255,255,255,.12);animation:splitFlip .60s cubic-bezier(.2,.72,.3,1) both;animation-delay:var(--delay,0ms)}.flap-drop span{position:absolute;inset:0 0 auto;height:36px;display:grid;place-items:center}
@keyframes splitFlip{0%{transform:rotateX(0);filter:brightness(1)}44%{transform:rotateX(-94deg);filter:brightness(.52)}100%{transform:rotateX(-94deg);filter:brightness(.52)}}
.flap-ok .split-flap{color:#ddfff0;text-shadow:0 0 8px rgba(103,252,169,.14)}.flap-warn .split-flap{color:#ffd27a;text-shadow:0 0 8px rgba(255,210,122,.16)}.flap-bad .split-flap{color:#ff8e8e;text-shadow:0 0 8px rgba(255,122,122,.18)}
.logo-bay{position:relative;display:inline-flex;align-items:center;justify-content:center;width:150px;min-height:40px;overflow:hidden;border-radius:10px;background:rgba(2,10,18,.72);border:1px solid rgba(255,255,255,.06);box-shadow:inset 0 1px rgba(255,255,255,.05),inset 0 -2px 8px rgba(0,0,0,.52)}.logo-bay::before{content:"";position:absolute;inset:1px;border-radius:8px;border:1px solid rgba(95,199,207,.03);pointer-events:none}.logo-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:6px 12px}.logo-overlay img{max-width:114px;max-height:18px;object-fit:contain;opacity:.74;filter:brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,.05))}
.board-message{min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.04);color:#6f90a4;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.board-message-note{color:#5f7a8f;font-size:8px;letter-spacing:.10em}
.board-footer{position:relative;z-index:2;display:grid;grid-template-columns:1fr auto auto;gap:18px;align-items:center;margin-top:12px;padding:14px 15px;border-radius:18px;background:#e9eef8;color:#587085;font-size:8px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.board-footer strong{color:#022e64}.status-lamp{width:7px;height:7px;border-radius:50%;background:var(--sk-aqua);box-shadow:0 0 0 5px rgba(95,199,207,.12);display:inline-block;margin-right:7px;vertical-align:middle}

@media(max-width:1100px){
  .search-shell{margin-top:-132px}
  .search-head,.board-heading{grid-template-columns:1fr}
  .search-foot{grid-template-columns:1fr}
  .search-meta{justify-content:flex-start}
  .board-top{grid-template-columns:1fr}
}
@media(max-width:760px){
  .search-shell{margin-top:-92px}
  .search-card{padding:16px}
  .search-title strong{font-size:18px}
  .form-grid{grid-template-columns:1fr 1fr}.col-2,.col-3,.col-4,.col-5,.col-6{grid-column:span 1}.field[data-field="flight"],.field[data-field="airport"],.field[data-field="from"],.field[data-field="to"]{grid-column:1/-1}
  .search-foot{gap:10px}.search-meta{gap:6px}.search-chip{min-height:26px}
  .board-section{padding-top:26px}
  .board-heading h2{font-size:40px}
  .flight-board-shell{padding:12px;border-radius:26px}
  .board-top{padding:16px;border-radius:18px}
  .board-brand strong{font-size:24px}
  .board-query,.board-live{padding:10px 12px}
  .board-columns{display:none}
  .board-scroll{min-height:0;padding:6px}
  .flip-body{min-width:0}
  .fids-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;min-height:0;border-radius:16px}
  .fids-cell{min-height:48px;padding:10px 11px;border-right:0;border-bottom:1px solid rgba(255,255,255,.045);justify-content:space-between;gap:10px}
  .fids-cell::before{content:attr(data-label);flex:0 0 auto;color:#7aa0b5;font-family:"Roboto Mono",monospace;font-size:7px;font-weight:700;letter-spacing:.10em;text-transform:uppercase}.fids-cell:nth-child(4),.fids-cell:nth-child(6),.fids-cell:nth-child(7){grid-column:1/-1}.fids-cell:nth-last-child(-n+2){border-bottom:0}
  .board-message{min-height:160px}.board-message .flap-container{display:none}.board-message::before{content:"Passenger flight information";color:#7ba2b8;font-size:8px;letter-spacing:.12em}
  .flap-letters{display:none!important}.flap-container{display:block!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.flap-container::before{display:none}.tv-text{display:inline!important;color:#f1f5f9!important;font-family:"Montserrat",sans-serif!important;font-size:11px!important;font-weight:650!important;letter-spacing:-.01em}.flap-warn .tv-text{color:#ffca68!important}.flap-bad .tv-text{color:#ff7474!important}.flap-ok .tv-text{color:#d9f1f1!important}.place-bank{justify-content:flex-end}
  .logo-bay{width:88px;min-height:28px;background:#fff;border-radius:6px}.logo-bay>.flap-container{display:none!important}.desktop-logo-img{display:none!important}.mobile-logo-img{display:block!important;width:76px!important;height:17px!important;object-fit:contain;filter:none!important;opacity:1!important;animation:none!important}.logo-overlay{position:relative;padding:4px 7px}
}
@media(max-width:430px){.fids-row{grid-template-columns:1fr}.fids-cell:nth-child(n){grid-column:1/-1}}


/* =========================================================
   EDITORIAL CONTENT — same Home / Our Network family
   ========================================================= */
.editorial{position:relative;padding:86px 0 0;background:linear-gradient(180deg,#fff 0%,#f6faff 12%,#d7e6ff 36%,#7eaad7 57%,#285ca8 73%,#0b477e 86%,#022e64 100%);overflow:hidden}.editorial::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 12%,rgba(255,255,255,.72),transparent 20%),radial-gradient(circle at 88% 36%,rgba(95,199,207,.18),transparent 22%),linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:auto,auto,54px 54px,54px 54px;mask-image:linear-gradient(180deg,rgba(0,0,0,.12),#000 42%,rgba(0,0,0,.5))}
.section{position:relative;padding:64px 0}.section-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.52fr);gap:38px;align-items:end;margin-bottom:26px}.section-head h2{margin-top:8px;color:#022e64;font-size:clamp(34px,4.6vw,58px);font-weight:550;line-height:.96;letter-spacing:-.058em}.section-head p{color:#5d6f82;font-size:12px;line-height:1.75}.section.dark .section-head h2{color:#fff}.section.dark .section-head p{color:#c7d8e8}.section.dark .eyebrow{color:#d9f1f1}
.guide-grid,.travel-grid,.time-grid{display:grid;gap:14px}.guide-grid{grid-template-columns:repeat(3,1fr)}.travel-grid{grid-template-columns:repeat(3,1fr)}.time-grid{grid-template-columns:repeat(4,1fr)}
.info-card{position:relative;overflow:hidden;min-height:250px;padding:25px;border-radius:25px;border:1px solid rgba(2,46,100,.08);box-shadow:0 14px 34px rgba(2,46,100,.08);display:flex;flex-direction:column;justify-content:space-between;transition:transform .3s var(--ease),box-shadow .3s ease}.info-card:hover{transform:translateY(-6px);box-shadow:0 24px 48px rgba(2,46,100,.15)}.info-card:nth-child(1){background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff}.info-card:nth-child(2){background:#fff;color:#022e64}.info-card:nth-child(3){background:#d9f1f1;color:#022e64}.card-no{font-size:9px;font-weight:800;letter-spacing:.14em;opacity:.55}.info-card h3{font-size:25px;letter-spacing:-.045em;margin:70px 0 8px}.info-card p{font-size:10.5px;line-height:1.7;opacity:.72}
.status-panel{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;padding:38px;border-radius:28px;background:linear-gradient(135deg,#04254a,#0b477e);color:#fff;box-shadow:0 24px 58px rgba(2,46,100,.20)}.status-copy h3{margin:10px 0 12px;font-size:36px;line-height:1;letter-spacing:-.05em}.status-copy p{color:#bfd0df;font-size:11px;line-height:1.72}.status-list{display:grid;gap:8px}.status-row{display:grid;grid-template-columns:26px 1fr;gap:12px;align-items:center;padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:rgba(255,255,255,.055)}.status-dot{width:11px;height:11px;border-radius:50%}.status-dot.normal{background:#5fc7cf;box-shadow:0 0 14px rgba(95,199,207,.62)}.status-dot.attention{background:#d59a36;box-shadow:0 0 14px rgba(213,154,54,.48)}.status-dot.disrupted{background:#d85f66;box-shadow:0 0 14px rgba(216,95,102,.46)}.status-row strong{display:block;font-size:11px}.status-row span{display:block;margin-top:3px;color:#9fb5c6;font-size:9px;line-height:1.5}
.travel-card{min-height:238px;padding:24px;border-radius:24px;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 15px 36px rgba(2,46,100,.10)}.travel-card:nth-child(1){background:#e9eef8;color:#022e64}.travel-card:nth-child(2){background:#f2e9dc;color:#3c2f20}.travel-card:nth-child(3){background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff}.travel-card span{margin-bottom:auto;font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;opacity:.56}.travel-card h3{font-size:24px;line-height:1.05;letter-spacing:-.045em;margin-bottom:8px}.travel-card p{font-size:10.5px;line-height:1.68;opacity:.70}
.time-card{min-height:190px;padding:22px;border-radius:22px;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 12px 28px rgba(2,46,100,.09)}.time-card:nth-child(1){background:#fff;color:#022e64}.time-card:nth-child(2){background:#d9f1f1;color:#022e64}.time-card:nth-child(3){background:#f2e9dc;color:#3c2f20}.time-card:nth-child(4){background:#e9eef8;color:#022e64}.time-card span{margin-bottom:auto;font-size:8px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;opacity:.56}.time-card strong{font-size:18px;line-height:1.08;letter-spacing:-.035em}.time-card p{margin-top:7px;font-size:9.5px;line-height:1.58;opacity:.69}
.closing{margin-top:40px;padding:78px 0 90px;color:#fff}.closing-grid{display:grid;grid-template-columns:.55fr 1fr;gap:44px;align-items:center}.closing-mark{font-size:clamp(46px,8vw,108px);font-weight:750;letter-spacing:-.08em;color:rgba(255,255,255,.12);writing-mode:vertical-rl;transform:rotate(180deg)}.closing h2{max-width:830px;margin:9px 0 14px;font-size:clamp(38px,5.2vw,70px);line-height:.94;letter-spacing:-.06em}.closing p{max-width:720px;color:#c1d4e3;font-size:12px;line-height:1.75}
.reveal{opacity:0;transform:translateY(22px) scale(.99)}.reveal.is-visible{opacity:1;transform:none;transition:opacity .72s var(--ease),transform .72s var(--ease)}

@media(max-width:1100px){.wrap{width:min(var(--content),calc(100% - 36px))}.hero-inner{grid-template-columns:1fr}.hero-status{width:min(560px,100%)}.form-grid{grid-template-columns:repeat(6,1fr)}.col-2,.col-3{grid-column:span 3}.board-top{grid-template-columns:1fr 1fr}.board-live{grid-column:1/-1;width:max-content}.board-heading,.section-head{grid-template-columns:1fr;gap:13px}.guide-grid,.travel-grid{grid-template-columns:1fr 1fr}.guide-grid .info-card:last-child,.travel-grid .travel-card:last-child{grid-column:1/-1}.time-grid{grid-template-columns:1fr 1fr}.status-panel{grid-template-columns:1fr}.closing-grid{grid-template-columns:1fr}.closing-mark{display:none}}
@media(max-width:760px){.wrap{width:calc(100% - 24px)}.hero{min-height:690px}.hero-inner{padding:48px 0 150px}.hero h1{font-size:clamp(48px,15vw,72px)}.hero-status{grid-template-columns:1fr 1fr}.search-shell{margin-top:-72px}.search-card{padding:18px;border-radius:22px}.search-head{display:block}.mode-tabs{margin-top:13px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.mode-tabs::-webkit-scrollbar{display:none}.tab{white-space:nowrap}.form-grid{grid-template-columns:1fr 1fr}.col-2,.col-3,.col-4,.col-5,.col-6,.col-12{grid-column:auto}.field.col-3,.field.col-6{grid-column:1/-1}.search-foot{display:block}.search-meta{margin-top:10px}.board-section{padding:54px 0 64px}.flight-board-shell{padding:10px;border-radius:22px}.board-top{grid-template-columns:1fr;padding:16px;border-radius:16px}.board-query{grid-row:auto}.board-live{grid-column:auto;width:100%}.board-columns{display:none}.board-scroll{overflow:visible;padding:7px}.flip-body{min-width:0}.fids-row{min-width:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-radius:12px}.fids-cell{min-height:48px;justify-content:space-between;border-right:0;border-bottom:1px solid rgba(255,255,255,.045);overflow:visible}.fids-cell::before{content:attr(data-label);flex:0 0 auto;color:#64869e;font-size:7px;font-weight:800;letter-spacing:.10em;text-transform:uppercase}.fids-cell:nth-child(4),.fids-cell:nth-child(6),.fids-cell:nth-child(7){grid-column:1/-1}.fids-cell:nth-last-child(-n+2){border-bottom:0}.flap-letters{display:none!important}.flap-container{display:block!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.tv-text{display:inline!important;color:#f5f8fb!important;font-size:11px!important;font-weight:650!important}.flap-warn .tv-text{color:#ffe0a1!important}.flap-bad .tv-text{color:#ffd4d7!important}.logo-bay{width:86px;min-height:28px;background:#fff}.desktop-logo-img{display:none!important}.mobile-logo-img{display:block!important;width:76px!important;height:18px!important;object-fit:contain}.logo-overlay{padding:4px 7px}.board-message{min-height:150px}.board-message .flap-container{display:none!important}.board-message::before{content:"FLIGHT INFORMATION";color:#6e8da3;font-size:8px;font-weight:800;letter-spacing:.13em}.board-footer{grid-template-columns:1fr 1fr}.board-footer>span:nth-child(2){display:none}.editorial{padding-top:60px}.guide-grid,.travel-grid,.time-grid{grid-template-columns:1fr}.guide-grid .info-card:last-child,.travel-grid .travel-card:last-child{grid-column:auto}.section{padding:48px 0}.status-panel{padding:24px 18px}.closing{padding:60px 0 72px}}
@media(max-width:480px){.hero-status{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.field.col-3,.field.col-6{grid-column:auto}.fids-row{grid-template-columns:1fr}.fids-cell:nth-child(n){grid-column:1/-1}.board-brand strong{font-size:22px}.board-footer{grid-template-columns:1fr}.board-footer>span:nth-child(3){display:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}.reveal{opacity:1!important;transform:none!important}.hero-route-art{display:none}}

/* =========================================================
   B-011.32 — AIRPORT-FIRST FIDS
   Compact TV board + readable digital flippers + terminal UI.
   ========================================================= */
.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.hero{min-height:540px;background:radial-gradient(circle at var(--mx) var(--my),rgba(95,199,207,.17),transparent 20%),radial-gradient(circle at 84% 12%,rgba(40,92,168,.08),transparent 19%),linear-gradient(180deg,#f8fbff 0%,#edf5ff 58%,#f3f6f8 100%)}
.hero::before{opacity:.30;background-image:linear-gradient(rgba(11,58,122,.052) 1px,transparent 1px),linear-gradient(90deg,rgba(11,58,122,.052) 1px,transparent 1px),linear-gradient(115deg,transparent 0 48%,rgba(2,46,100,.045) 49%,transparent 50%);background-size:42px 42px,42px 42px,260px 260px}
.hero-inner{padding:58px 0 118px;align-items:center}.hero h1{max-width:930px;font-size:clamp(48px,6.2vw,84px)}.hero-status{width:min(400px,33vw)}
.hero-wayfinding{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}.hero-wayfinding span{min-height:36px;display:inline-flex;align-items:center;gap:9px;padding:0 13px;border-radius:9px;background:#022e64;color:#fff;font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 9px 22px rgba(2,46,100,.11)}.hero-wayfinding span:nth-child(2){background:#d9f1f1;color:#022e64}.hero-wayfinding span:nth-child(3){background:#e9eef8;color:#022e64}.hero-wayfinding b{font-size:14px;font-weight:600}
.board-section{position:relative;padding:14px 0 86px;background:#f3f6f8}.board-section::after{content:"";position:absolute;left:0;right:0;top:-70px;height:110px;background:linear-gradient(180deg,rgba(243,246,248,0),#f3f6f8 80%);pointer-events:none}
.board-heading{width:min(1180px,100%);margin:0 auto 16px;grid-template-columns:minmax(0,1fr) minmax(290px,.48fr);gap:28px}.board-heading h2{font-size:clamp(30px,3.8vw,50px)}
.airport-controls{position:relative;z-index:3;width:min(1180px,100%);margin:0 auto 14px;display:grid;grid-template-columns:180px 180px minmax(260px,1fr) auto auto;gap:8px;align-items:stretch;padding:9px;border-radius:18px;background:rgba(255,255,255,.84);border:1px solid rgba(2,46,100,.08);backdrop-filter:blur(18px);box-shadow:0 14px 34px rgba(2,46,100,.08)}
.airport-control{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;align-items:center;min-height:54px;padding:7px 10px;border-radius:12px;background:#f3f6f8;border:1px solid rgba(2,46,100,.06)}.control-sign{min-width:34px;height:34px;padding:0 7px;display:grid;place-items:center;border-radius:8px;background:#022e64;color:#fff;font-family:"Roboto Mono",monospace;font-size:7px;font-weight:800;letter-spacing:.08em}.airport-control label{display:block;color:#788697;font-size:7px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:2px}.airport-control input{width:100%;min-width:0;border:0;background:transparent;outline:none;padding:0;color:#022e64;font-family:"Roboto Mono",monospace;font-size:13px;font-weight:700;text-transform:uppercase}.airport-control input[type="date"]{font-size:11px}
.airport-board-toggle{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:5px;border-radius:12px;background:#e9eef8}.airport-toggle{min-height:44px;padding:0 14px;border:0;border-radius:9px;background:transparent;color:#687a8d;font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;transition:.18s ease}.airport-toggle span{font-size:13px;margin-right:5px}.airport-toggle:hover{background:rgba(255,255,255,.65);color:#022e64}.airport-toggle.active{background:#022e64;color:#fff;box-shadow:0 8px 18px rgba(2,46,100,.16)}
.airport-update,.airport-reset{border:0;border-radius:12px;min-height:54px;padding:0 15px;font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase}.airport-update{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#022e64,#0b5c85);color:#fff;box-shadow:0 10px 22px rgba(2,46,100,.15);transition:transform .18s ease,box-shadow .18s ease}.airport-update:hover{transform:translateY(-1px);box-shadow:0 14px 27px rgba(2,46,100,.20)}.airport-update-led{width:6px;height:6px;border-radius:50%;background:#67fca9;box-shadow:0 0 9px rgba(103,252,169,.62)}.airport-reset{background:#fff;color:#647588;border:1px solid rgba(2,46,100,.08)}.airport-reset:hover{color:#022e64;border-color:rgba(95,199,207,.58)}.airport-notice{grid-column:1/-1;margin:0!important;display:none}.airport-control-note{grid-column:1/-1;padding:0 5px;color:#738396;font-size:8px;line-height:1.4}
.flight-board-shell{width:min(1180px,100%);margin-inline:auto;padding:14px;border-radius:28px;box-shadow:0 28px 72px rgba(2,46,100,.15)}.flight-board-shell::after{inset:7px;border-radius:22px}.board-top{grid-template-columns:minmax(0,1.1fr) minmax(280px,.72fr) auto;margin-bottom:9px;padding:15px 17px;border-radius:19px}.board-monogram{width:44px;height:44px;border-radius:13px}.board-brand strong{font-size:24px}.board-query{padding:10px 12px;border-radius:12px}.board-live{padding:9px 11px;border-radius:12px}
.board-screen{border-radius:20px}.board-airport-bar{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr auto;gap:1px;min-height:58px;background:rgba(255,255,255,.035);border-bottom:1px solid rgba(255,255,255,.06)}.board-airport-bar>div{display:flex;align-items:center;gap:12px;padding:11px 15px;border-right:1px solid rgba(255,255,255,.045)}.board-airport-bar>div:last-child{border-right:0}.board-airport-bar small{color:#66889e;font-size:7px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.board-airport-bar strong{color:#fff;font-family:"Roboto Mono",monospace;font-size:18px;font-weight:700;letter-spacing:.06em}
.fids-layout{min-width:0;grid-template-columns:118px 126px minmax(260px,1fr) 170px 214px 90px}.board-columns{min-height:38px}.board-scroll{min-height:338px;overflow:visible;padding:8px}.flip-body{min-width:0;display:grid;gap:7px}.fids-row{min-height:62px}.fids-cell{padding:8px 8px 8px 10px}
.flap-container.digital-flip{--flip-width:max(78px,calc(var(--flip-chars,5) * .72em + 28px));position:relative;display:inline-flex;align-items:center;justify-content:flex-start;width:auto;min-width:var(--flip-width);max-width:100%;height:38px;padding:0 12px!important;overflow:hidden;border-radius:9px!important;background:linear-gradient(180deg,rgba(255,255,255,.07),transparent 26%),linear-gradient(180deg,#1c3a59,#102841)!important;border:1px solid rgba(255,255,255,.07);box-shadow:inset 0 1px rgba(255,255,255,.08),inset 0 -2px 8px rgba(0,0,0,.36),0 5px 12px rgba(0,0,0,.16)!important;color:#f7fbff;font-family:"Roboto Mono",monospace;font-size:13px;font-weight:700;letter-spacing:.035em;white-space:nowrap;perspective:900px}.digital-flip::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(3,17,31,.88);box-shadow:0 1px rgba(255,255,255,.07);z-index:8}.digital-flip .flip-value{position:relative;z-index:5}.digital-flip .flip-fold{position:absolute;z-index:7;left:0;right:0;top:0;height:50%;display:flex;align-items:flex-start;padding:10px 12px 0;overflow:hidden;background:linear-gradient(180deg,#315b82,#183854);color:inherit;transform-origin:50% 100%;animation:digitalFold .56s cubic-bezier(.2,.72,.3,1) both;animation-delay:var(--flip-delay,0ms)}@keyframes digitalFold{0%{transform:rotateX(0deg);filter:brightness(1.12)}48%{transform:rotateX(-92deg);filter:brightness(.52)}100%{transform:rotateX(-92deg);filter:brightness(.52)}}.flap-ok.digital-flip{color:#e2fff1;background:linear-gradient(180deg,#17465a,#103247)!important}.flap-warn.digital-flip{color:#ffd987;background:linear-gradient(180deg,#5b4826,#3a2f1c)!important}.flap-bad.digital-flip{color:#ff9a9a;background:linear-gradient(180deg,#5b2930,#381c24)!important}.tv-text,.flap-letters,.split-flap,.flap-half,.flap-drop{display:none!important}.place-bank{gap:7px}.route-slash{display:none}
.logo-bay{width:148px;min-height:40px;border-radius:9px;background:rgba(255,255,255,.96);border:1px solid rgba(255,255,255,.10);box-shadow:0 5px 12px rgba(0,0,0,.12)}.logo-bay>.flap-container{display:none!important}.logo-overlay{position:relative;padding:5px 10px}.logo-overlay img.desktop-logo-img{display:block;max-width:118px;max-height:20px;opacity:1;filter:none}.mobile-logo-img{display:none}
.board-message{min-height:292px;border-radius:15px;background:rgba(255,255,255,.015)}.board-message .digital-flip{min-width:220px;justify-content:center}.board-footer{margin-top:9px;padding:11px 13px;border-radius:13px}
.airport-guide-grid .airport-card{min-height:240px;border-radius:20px;border-top:5px solid #022e64}.airport-guide-grid .airport-card:nth-child(2){border-top-color:#5fc7cf}.airport-guide-grid .airport-card:nth-child(3){border-top-color:#d1bc98}.airport-card-sign{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;min-height:30px;padding:0 10px;border-radius:6px;background:#022e64;color:#fff;font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.airport-guide-grid .airport-card:nth-child(2) .airport-card-sign{background:#d9f1f1;color:#022e64}.airport-guide-grid .airport-card:nth-child(3) .airport-card-sign{background:#f2e9dc;color:#3c2f20}.airport-card-sign b{font-size:13px}.status-panel{border-radius:24px;background:radial-gradient(circle at 90% 10%,rgba(95,199,207,.16),transparent 28%),linear-gradient(135deg,#04254a,#0b477e 68%,#126d78)}.status-row{border-radius:12px!important;border-left:4px solid rgba(95,199,207,.32)!important}.travel-card,.time-card{position:relative;overflow:hidden;border-radius:20px!important}.travel-card::after,.time-card::after{content:"";position:absolute;right:16px;top:15px;width:20px;height:20px;border-top:2px solid currentColor;border-right:2px solid currentColor;opacity:.16}.travel-card span,.time-card span{display:inline-flex;align-items:center;gap:8px;font-size:8px!important;letter-spacing:.13em!important;text-transform:uppercase}.travel-card span::before,.time-card span::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--sk-aqua)}
@media(max-width:1100px){.airport-controls{grid-template-columns:1fr 1fr}.airport-board-toggle{grid-column:1/-1}.airport-update,.airport-reset{min-height:48px}.board-top{grid-template-columns:1fr}.flight-board-shell{width:min(100%,900px)}.board-heading{width:min(100%,900px);grid-template-columns:1fr}}
@media(max-width:760px){.hero{min-height:500px}.hero-inner{padding:46px 0 92px}.hero-status{display:none}.hero-wayfinding{gap:6px}.hero-wayfinding span{min-height:32px;padding:0 10px}.board-section{padding-top:8px}.airport-controls{grid-template-columns:1fr;padding:8px}.airport-board-toggle{grid-column:auto}.airport-control-note{grid-column:auto}.flight-board-shell{padding:9px;border-radius:22px}.board-top{padding:14px;border-radius:16px}.board-airport-bar{grid-template-columns:1fr 1fr}.airport-clock-display{display:none!important}.board-airport-bar>div{padding:10px 12px}.board-airport-bar strong{font-size:15px}.board-columns{display:none}.board-scroll{min-height:0;overflow:visible;padding:6px}.flip-body{min-width:0}.fids-row{display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:0;border-radius:14px}.fids-cell{min-height:49px;padding:10px 11px;border-right:0;border-bottom:1px solid rgba(255,255,255,.045);justify-content:space-between;gap:10px}.fids-cell::before{content:attr(data-label);flex:0 0 auto;color:#7aa0b5;font-family:"Roboto Mono",monospace;font-size:7px;font-weight:700;letter-spacing:.10em;text-transform:uppercase}.fids-cell:nth-child(3),.fids-cell:nth-child(4),.fids-cell:nth-child(5){grid-column:1/-1}.fids-cell:nth-last-child(-n+2){border-bottom:0}.digital-flip{min-width:auto!important;height:34px!important;font-size:11px!important}.digital-flip .flip-fold{padding-top:8px}.logo-bay{width:86px;min-height:28px}.desktop-logo-img{display:none!important}.mobile-logo-img{display:block!important;width:74px!important;height:17px!important;object-fit:contain!important;opacity:1!important;filter:none!important}.board-message{min-height:150px}.board-message .digital-flip{min-width:180px!important}}
@media(max-width:430px){.fids-row{grid-template-columns:1fr}.fids-cell:nth-child(n){grid-column:1/-1}}


/* =========================================================
   B-011.33 — AIRPORT CONCOURSE + MODERN FIDS DEVELOPMENT
   ========================================================= */
.hero{
  min-height:585px;
  isolation:isolate;
  overflow:hidden;
}
.terminal-architecture{
  position:absolute;
  inset:0;
  pointer-events:none;
  overflow:hidden;
  z-index:0;
}
.terminal-glass-lines{
  position:absolute;
  right:-3%;
  top:0;
  width:58%;
  height:100%;
  opacity:.48;
  background:
    linear-gradient(90deg,transparent 0 8%,rgba(2,46,100,.08) 8% 8.3%,transparent 8.3% 23%,rgba(2,46,100,.06) 23% 23.3%,transparent 23.3% 40%,rgba(2,46,100,.07) 40% 40.3%,transparent 40.3% 58%,rgba(2,46,100,.055) 58% 58.3%,transparent 58.3%),
    linear-gradient(180deg,rgba(255,255,255,.16),rgba(95,199,207,.05));
  transform:skewX(-8deg);
  mask-image:linear-gradient(90deg,transparent,#000 24%,#000);
}
.terminal-ceiling-lines{
  position:absolute;
  left:45%;
  right:-15%;
  top:-20%;
  height:60%;
  opacity:.30;
  transform:perspective(700px) rotateX(62deg) rotateZ(-4deg);
  transform-origin:center top;
  background:
    repeating-linear-gradient(90deg,rgba(2,46,100,.09) 0 1px,transparent 1px 44px),
    repeating-linear-gradient(180deg,rgba(2,46,100,.075) 0 1px,transparent 1px 38px);
  mask-image:linear-gradient(180deg,#000,transparent);
}
.terminal-apron-light{
  position:absolute;width:9px;height:9px;border-radius:50%;
  background:#fff;
  box-shadow:0 0 0 5px rgba(255,255,255,.52),0 0 28px 11px rgba(95,199,207,.26);
  opacity:.75;
  animation:apronGlow 3.6s ease-in-out infinite alternate;
}
.terminal-apron-light.l1{right:11%;top:23%}
.terminal-apron-light.l2{right:25%;top:36%;animation-delay:-1.2s}
.terminal-apron-light.l3{right:7%;top:58%;animation-delay:-2.1s}
.terminal-apron-light.l4{right:39%;top:18%;animation-delay:-.7s}
@keyframes apronGlow{to{opacity:.30;transform:scale(.72)}}
.hero-inner{position:relative;z-index:2}
.hero-copy{position:relative;padding:26px 0}
.hero-copy::before{
  content:"";position:absolute;left:-42px;top:10%;bottom:10%;width:4px;border-radius:4px;
  background:linear-gradient(180deg,#5fc7cf,#022e64 60%,transparent);opacity:.50
}
.terminal-location-line{
  display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:13px;
  color:#738497;font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase
}
.terminal-location-line i{width:4px;height:4px;border-radius:50%;background:#5fc7cf}
.terminal-location-icon{
  display:inline-grid;place-items:center;height:24px;padding:0 8px;border-radius:5px;
  background:#022e64;color:#fff;font-family:"Roboto Mono",monospace;font-size:7px;letter-spacing:.10em
}
.hero-status{position:relative;overflow:hidden}
.hero-status::after{
  content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  background:linear-gradient(115deg,transparent 0 40%,rgba(255,255,255,.36) 50%,transparent 60%);
  background-size:240% 100%;animation:heroPanelSweep 9s ease-in-out infinite
}
@keyframes heroPanelSweep{0%,32%{background-position:-140% 0}72%,100%{background-position:170% 0}}

.terminal-bay{
  width:min(1240px,100%);margin-inline:auto;position:relative;padding:58px 34px 44px;border-radius:34px;
  background:linear-gradient(180deg,rgba(255,255,255,.88),rgba(238,244,249,.94)),#f3f6f8;
  border:1px solid rgba(2,46,100,.07);
  box-shadow:inset 0 1px rgba(255,255,255,.92),0 30px 80px rgba(2,46,100,.12)
}
.terminal-bay::before{
  content:"";position:absolute;left:24px;right:24px;top:25px;height:2px;
  background:linear-gradient(90deg,transparent,rgba(2,46,100,.08),rgba(95,199,207,.26),rgba(2,46,100,.08),transparent)
}
.terminal-bay::after{
  content:"";position:absolute;inset:0;border-radius:34px;pointer-events:none;opacity:.42;
  background:linear-gradient(90deg,rgba(2,46,100,.035) 1px,transparent 1px),linear-gradient(rgba(2,46,100,.026) 1px,transparent 1px);
  background-size:70px 70px;mask-image:linear-gradient(180deg,#000 0 22%,transparent 60%)
}
.terminal-overhead-signs{
  position:absolute;z-index:4;top:0;left:34px;right:34px;display:flex;align-items:flex-start;gap:7px;transform:translateY(-18px)
}
.overhead-sign{
  min-height:40px;display:inline-flex;align-items:center;gap:10px;padding:0 14px;border-radius:8px;
  font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 12px 24px rgba(2,46,100,.14)
}
.overhead-sign b{font-size:14px;font-weight:600}
.sign-dark{background:#022e64;color:#fff}
.sign-aqua{background:#d9f1f1;color:#022e64}
.sign-light{background:#fff;color:#022e64;border:1px solid rgba(2,46,100,.08)}
.overhead-zone{margin-left:auto;padding-top:13px;color:#8291a0;font-size:7px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.terminal-floor-reflection{
  position:absolute;left:8%;right:8%;bottom:-24px;height:38px;
  background:radial-gradient(ellipse at center,rgba(2,46,100,.14),transparent 68%);filter:blur(12px);pointer-events:none
}

.airport-controls{
  width:min(1160px,calc(100% - 24px));margin:0 auto 24px;border-radius:16px;
  box-shadow:0 12px 28px rgba(2,46,100,.07)
}
.airport-control{background:#fff;border-radius:10px}
.control-sign{border-radius:6px;background:linear-gradient(145deg,#04254a,#0b477e)}
.airport-board-toggle{border-radius:10px;background:#f0f4f8}
.airport-toggle{border-radius:7px}
.airport-update,.airport-reset{border-radius:9px}
.airport-update{background:linear-gradient(145deg,#04254a,#0b477e)}
.airport-clear-btn::before{content:"×";margin-right:6px;font-size:12px;font-weight:500}

.flight-board-shell{
  width:min(1100px,100%);margin-inline:auto;padding:10px;border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(233,238,248,.96));
  box-shadow:0 25px 58px rgba(2,46,100,.15),0 2px 0 rgba(255,255,255,.9) inset
}
.flight-board-shell::after{inset:5px;border-radius:19px}
.board-top{min-height:78px;margin-bottom:7px;padding:12px 14px;border-radius:16px}
.board-brand{gap:11px}.board-monogram{width:40px;height:40px;border-radius:11px}
.board-brand strong{font-size:22px}.board-brand span{font-size:7px}
.board-query{padding:9px 11px;border-radius:10px}.board-live{padding:8px 10px;border-radius:10px}
.board-screen{
  border-radius:16px;
  box-shadow:inset 0 14px 34px rgba(0,0,0,.30),0 12px 28px rgba(2,46,100,.10)
}
.board-airport-bar{min-height:54px}.board-airport-bar>div{padding:10px 13px}.board-airport-bar strong{font-size:16px}
.board-columns{min-height:34px}.board-scroll{min-height:300px;padding:6px}.flip-body{gap:6px}
.fids-row{min-height:57px;border-radius:11px}.fids-cell{padding:7px 7px 7px 9px}
.flap-container.digital-flip{height:34px;border-radius:7px!important;font-size:12px}
.digital-flip .flip-fold{padding:8px 12px 0}.logo-bay{min-height:35px;border-radius:7px}
.board-message{min-height:265px}.board-footer{margin-top:7px;padding:9px 11px;border-radius:11px}

#hardwareCasing.is-searching .board-screen::before{opacity:.55;animation:fidsPulse 1.6s ease-in-out infinite alternate}
#hardwareCasing.is-searching .airport-update-led{animation:livePulse .72s ease-in-out infinite}
@keyframes fidsPulse{to{filter:brightness(1.25)}}

.airport-priority-strip{
  width:min(1100px,100%);margin:20px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;
  border:1px solid rgba(2,46,100,.07);border-radius:16px;overflow:hidden;background:rgba(2,46,100,.07);
  box-shadow:0 14px 32px rgba(2,46,100,.06)
}
.airport-priority-strip>div{min-height:90px;padding:15px 17px;background:rgba(255,255,255,.94)}
.priority-symbol{
  display:inline-grid;place-items:center;min-width:26px;height:22px;padding:0 6px;border-radius:5px;background:#e9eef8;color:#022e64;
  font-family:"Roboto Mono",monospace;font-size:7px;font-weight:800
}
.airport-priority-strip strong{display:block;margin-top:10px;color:#022e64;font-size:12px;letter-spacing:-.02em}
.airport-priority-strip small{display:block;margin-top:4px;color:#748496;font-size:9px;line-height:1.5}

.airport-atmosphere-section{position:relative}
.airport-moments-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.airport-moment{
  min-height:285px;padding:24px;border-radius:22px;display:flex;flex-direction:column;justify-content:space-between;
  border:1px solid rgba(2,46,100,.07);box-shadow:0 14px 32px rgba(2,46,100,.07);
  transition:transform .28s var(--ease),box-shadow .28s ease
}
.airport-moment:hover{transform:translateY(-6px);box-shadow:0 24px 48px rgba(2,46,100,.12)}
.moment-blue{background:linear-gradient(145deg,#04254a,#0b477e);color:#fff}
.moment-aqua{background:#d9f1f1;color:#022e64}
.moment-sand{background:#f2e9dc;color:#3c2f20}
.moment-ice{background:#e9eef8;color:#022e64}
.moment-sign{
  display:inline-flex;align-items:center;gap:8px;align-self:flex-start;min-height:30px;padding:0 9px;border-radius:6px;
  border:1px solid currentColor;opacity:.72;font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase
}
.moment-sign span{font-size:13px}
.airport-moment h3{font-size:24px;line-height:1;letter-spacing:-.045em;margin-bottom:9px}
.airport-moment p{font-size:10.5px;line-height:1.68;opacity:.73}

.info-card,.travel-card,.time-card{position:relative}
.info-card::before,.travel-card::before,.time-card::before{
  content:"";position:absolute;left:16px;top:14px;width:14px;height:14px;border-left:1px solid currentColor;border-top:1px solid currentColor;opacity:.12
}

@media(max-width:1100px){
  .terminal-bay{padding:56px 20px 36px}
  .airport-moments-grid{grid-template-columns:1fr 1fr}
  .overhead-zone{display:none}
}
@media(max-width:760px){
  .hero{min-height:520px}
  .terminal-glass-lines{width:74%;opacity:.30}
  .hero-copy::before{display:none}
  .terminal-location-line{font-size:7px}
  .terminal-bay{padding:46px 7px 24px;border-radius:22px}
  .terminal-overhead-signs{left:14px;right:14px;gap:5px;transform:translateY(-13px)}
  .overhead-sign{min-height:32px;padding:0 9px;border-radius:6px;font-size:7px}
  .overhead-sign b{font-size:11px}
  .flight-board-shell{padding:7px;border-radius:18px}
  .board-top{padding:11px;border-radius:13px}
  .board-brand strong{font-size:20px}
  .board-query{display:none}
  .board-live{justify-self:start}
  .board-airport-bar{min-height:48px}
  .board-scroll{min-height:0}
  .airport-priority-strip{grid-template-columns:1fr;margin-top:14px}
  .airport-priority-strip>div{min-height:78px}
  .airport-moments-grid{grid-template-columns:1fr}
  .airport-moment{min-height:230px}
}
@media(prefers-reduced-motion:reduce){
  .terminal-apron-light,.hero-status::after{animation:none!important}
}


/* =========================================================
   B-011.37 — RESEARCH-DRIVEN FIDS + AIRPORT CONTEXT
   ========================================================= */
.hidden{display:none!important}

/* FIDS screen: flatter, continuous, high-distance readability */
.flight-board-shell{
  width:min(1120px,100%);
  border-radius:22px;
  padding:9px;
}
.board-top{
  min-height:72px;
  border-radius:14px;
  background:
    radial-gradient(circle at 8% 0,rgba(95,199,207,.18),transparent 25%),
    linear-gradient(135deg,#04254a,#0b477e 68%,#126d78);
}
.board-brand strong{font-size:24px;letter-spacing:-.035em}
.board-brand span{letter-spacing:.13em}
.board-screen{
  border-radius:13px;
  background:
    radial-gradient(circle at 16% 0,rgba(95,199,207,.075),transparent 22%),
    linear-gradient(180deg,#061525,#04111e 48%,#03101c);
}
.board-airport-bar{
  min-height:54px;
  background:rgba(255,255,255,.026);
}
.board-airport-bar strong{
  font-size:17px;
  letter-spacing:.05em;
}
.board-columns{
  min-height:37px;
  background:rgba(255,255,255,.035);
  border-top:1px solid rgba(255,255,255,.035);
  border-bottom:1px solid rgba(255,255,255,.075);
}
.board-columns>div{
  color:#82a6bb;
  font-size:7.5px;
  letter-spacing:.16em;
}
.fids-layout{
  min-width:0;
  grid-template-columns:126px 130px minmax(290px,1fr) 180px 205px 92px;
}
.board-scroll{
  min-height:360px;
  max-height:480px;
  overflow-y:auto;
  overflow-x:hidden;
  padding:0 8px 8px;
}
.board-scroll::-webkit-scrollbar{width:5px}
.board-scroll::-webkit-scrollbar-thumb{background:#214560;border-radius:999px}
.flip-body{min-width:0;gap:0}
.fids-row{
  min-height:64px;
  margin:0!important;
  border:0!important;
  border-bottom:1px solid rgba(255,255,255,.075)!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
}
.fids-row::before{
  left:0;top:8px;bottom:8px;width:2px;border-radius:2px;
  background:#5fc7cf;opacity:.0;transition:opacity .2s ease;
}
.fids-row:hover{
  transform:none!important;
  background:rgba(255,255,255,.035)!important;
}
.fids-row:hover::before{opacity:.78}
.fids-cell{
  min-height:64px;
  padding:8px 10px!important;
  border-right:1px solid rgba(255,255,255,.045)!important;
}
.fids-cell:last-child{border-right:0!important}
.fids-time{
  display:flex;flex-direction:column;align-items:flex-start;gap:3px;
}
.fids-time-main{
  color:#fff;
  font-family:"Roboto Mono",monospace;
  font-size:21px;
  font-weight:700;
  letter-spacing:.02em;
}
.fids-time small{
  color:#6f91a5;
  font-family:"Roboto Mono",monospace;
  font-size:7px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.fids-destination{
  min-width:0;
}
.fids-destination strong{
  display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:#f3f8fc;font-size:16px;font-weight:650;letter-spacing:-.025em;
}
.fids-destination small{
  display:block;margin-top:4px;color:#6e93a8;
  font-family:"Roboto Mono",monospace;font-size:8px;font-weight:700;letter-spacing:.08em;
}
.fids-flight{
  display:flex;align-items:center;gap:8px;
}
.fids-flight strong{
  color:#f4f8fb;font-family:"Roboto Mono",monospace;font-size:13px;font-weight:700;letter-spacing:.04em;
}
.fids-tail{
  width:42px;height:36px;flex:0 0 auto;border-radius:6px;
  display:grid;place-items:center;overflow:hidden;
  background:#fff;
  box-shadow:0 5px 14px rgba(0,0,0,.14);
}
.fids-tail img{max-width:34px;max-height:24px;object-fit:contain}
.fids-carrier-name{
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:#90adbd;font-size:8px;font-weight:700;letter-spacing:.03em;
}
.fids-status{
  display:inline-flex;align-items:center;min-height:28px;
  color:#d9f1f1;font-family:"Roboto Mono",monospace;font-size:10px;font-weight:700;
  letter-spacing:.03em;
}
.fids-status::before{
  content:"";width:6px;height:6px;border-radius:50%;margin-right:8px;
  background:#67fca9;box-shadow:0 0 9px rgba(103,252,169,.40);
}
.fids-status.flap-warn{color:#ffd27a}
.fids-status.flap-warn::before{background:#ffd27a;box-shadow:0 0 9px rgba(255,210,122,.35)}
.fids-status.flap-bad{color:#ff9292}
.fids-status.flap-bad::before{background:#ff7a7a;box-shadow:0 0 9px rgba(255,122,122,.40)}
.fids-gate{
  min-width:54px;height:40px;display:grid;place-items:center;
  border-radius:7px;background:#d9f1f1;color:#022e64;
  font-family:"Roboto Mono",monospace;font-size:15px;font-weight:800;letter-spacing:.04em;
}
.fids-gate.is-changing,.fids-time-main.is-changing,.fids-flight strong.is-changing{
  animation:fidsFieldFlip .58s cubic-bezier(.2,.72,.3,1);
}
@keyframes fidsFieldFlip{
  0%{transform:perspective(600px) rotateX(0);filter:brightness(1)}
  42%{transform:perspective(600px) rotateX(-86deg);filter:brightness(.55)}
  62%{transform:perspective(600px) rotateX(16deg);filter:brightness(1.28)}
  100%{transform:perspective(600px) rotateX(0);filter:brightness(1)}
}
.logo-bay{display:none!important}
.flap-container.digital-flip{display:none!important}

/* Airport context transition */
.airport-context{
  position:relative;
  background:#fff;
}
.context-transition{
  height:130px;
  margin-top:-1px;
  background:linear-gradient(180deg,#f3f6f8 0%,#fff 100%);
}
.context-welcome{padding:72px 0 100px}
.context-preview-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
}
.context-preview{
  min-height:260px;padding:25px;border-radius:24px;
  display:flex;flex-direction:column;justify-content:flex-end;
  box-shadow:0 16px 38px rgba(2,46,100,.08);
  transition:transform .3s var(--ease),box-shadow .3s ease;
}
.context-preview:hover{transform:translateY(-6px);box-shadow:0 26px 52px rgba(2,46,100,.13)}
.context-preview span{
  margin-bottom:auto;font-family:"Roboto Mono",monospace;font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.65
}
.context-preview h3{font-size:27px;letter-spacing:-.045em;line-height:1;margin-bottom:9px}
.context-preview p{font-size:10.5px;line-height:1.65;opacity:.72}
.preview-navy{background:linear-gradient(145deg,#04254a,#0b477e);color:#fff}
.preview-aqua{background:#d9f1f1;color:#022e64}
.preview-sand{background:#f2e9dc;color:#3c2f20}

.context-loading{padding:76px 0 110px}
.context-loading-screen{
  min-height:280px;border-radius:28px;padding:34px;
  display:grid;grid-template-columns:auto 1fr;gap:30px;align-items:center;
  background:linear-gradient(145deg,#04254a,#0b477e 62%,#126d78);
  color:#fff;box-shadow:0 28px 68px rgba(2,46,100,.18)
}
.loading-airport-code{
  font-size:clamp(60px,10vw,130px);font-weight:700;line-height:.8;letter-spacing:-.08em;color:#d9f1f1
}
.loading-copy span{
  display:block;color:#8fd3ff;font-size:8px;font-weight:800;letter-spacing:.16em;text-transform:uppercase
}
.loading-copy strong{display:block;margin-top:10px;font-size:28px;line-height:1.05;letter-spacing:-.045em;font-weight:550}
.loading-track{
  grid-column:1/-1;height:3px;border-radius:99px;background:rgba(255,255,255,.10);overflow:hidden
}
.loading-track i{
  display:block;width:34%;height:100%;background:linear-gradient(90deg,transparent,#5fc7cf,#d1bc98,transparent);
  animation:contextLoad 1.45s ease-in-out infinite
}
@keyframes contextLoad{from{transform:translateX(-120%)}to{transform:translateX(390%)}}

/* Selected airport identity */
.context-content{
  animation:contextReveal .72s var(--ease) both;
}
@keyframes contextReveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.airport-profile{
  --airport-primary:#022e64;
  --airport-accent:#5fc7cf;
  position:relative;isolation:isolate;overflow:hidden;min-height:560px;color:#fff;
  background:linear-gradient(145deg,var(--airport-primary),#0b477e 62%,#126d78)
}
.airport-profile-media{
  position:absolute;inset:0;z-index:-3;background-position:center;background-size:cover;
  transform:scale(1.025);transition:transform 1.4s var(--ease)
}
.airport-profile:hover .airport-profile-media{transform:scale(1.055)}
.airport-profile-overlay{
  position:absolute;inset:0;z-index:-2;
  background:
    linear-gradient(90deg,rgba(2,17,37,.94),rgba(2,46,100,.72) 52%,rgba(2,46,100,.28)),
    linear-gradient(180deg,rgba(3,17,31,.06),rgba(3,17,31,.74))
}
.airport-profile::after{
  content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.28;
  background:
    linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);
  background-size:54px 54px;mask-image:linear-gradient(90deg,#000,transparent 80%)
}
.airport-profile-inner{
  min-height:560px;padding:76px 0 64px;
  display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.58fr);gap:58px;align-items:end
}
.airport-profile-code{
  color:rgba(255,255,255,.18);font-size:clamp(82px,13vw,170px);font-weight:700;line-height:.70;letter-spacing:-.10em
}
.airport-profile-copy h2{
  max-width:820px;margin:12px 0 17px;font-size:clamp(42px,6vw,76px);font-weight:500;line-height:.94;letter-spacing:-.062em
}
.airport-profile-copy p{
  max-width:690px;color:#d2e1ec;font-size:13px;line-height:1.76
}
.airport-profile-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}
.context-action{
  min-height:42px;padding:0 14px;border:1px solid rgba(255,255,255,.18);border-radius:999px;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  background:rgba(255,255,255,.08);color:#fff;text-decoration:none;
  font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;
  backdrop-filter:blur(12px);transition:transform .2s ease,background .2s ease
}
.context-action:hover{transform:translateY(-2px);background:rgba(255,255,255,.14)}
.context-action.primary{background:#d9f1f1;color:#022e64;border-color:#d9f1f1}
.airport-profile-facts{
  align-self:end;display:grid;grid-template-columns:1fr 1fr;gap:1px;
  overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:20px;background:rgba(255,255,255,.10);backdrop-filter:blur(16px)
}
.profile-fact{min-height:88px;padding:15px;background:rgba(3,17,31,.28)}
.profile-fact small{display:block;color:#85a7bb;font-size:7px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
.profile-fact strong{display:block;margin-top:7px;color:#fff;font-size:14px;line-height:1.2;font-weight:600}

/* Airport-specific module grid */
.airport-context-grid{
  padding:80px 0 30px;
  display:grid;grid-template-columns:repeat(12,1fr);gap:12px
}
.context-module{
  grid-column:span 4;min-height:320px;padding:24px;border-radius:24px;
  background:#fff;border:1px solid rgba(2,46,100,.08);box-shadow:0 14px 36px rgba(2,46,100,.07);
  display:flex;flex-direction:column;transition:transform .28s var(--ease),box-shadow .28s ease
}
.context-module:hover{transform:translateY(-5px);box-shadow:0 24px 50px rgba(2,46,100,.12)}
.module-terminal{background:#e9eef8}
.module-transport{background:#d9f1f1}
.module-dining{background:#fff}
.module-lounges{background:linear-gradient(145deg,#142d4f,#496b8f);color:#fff}
.module-hotel{background:#f2e9dc;color:#3c2f20}
.module-transfer{
  position:relative;overflow:hidden;grid-column:span 8;
  background:linear-gradient(145deg,#04254a,#0b477e 60%,#126d78);color:#fff
}
.module-transfer::after{
  content:"";position:absolute;width:360px;height:360px;border-radius:50%;right:-180px;top:-190px;border:1px solid rgba(95,199,207,.22)
}
.transfer-ribbon{
  position:absolute;right:20px;top:18px;color:#d9f1f1;font-size:8px;font-weight:800;letter-spacing:.16em
}
.module-head{display:flex;align-items:center;gap:12px;margin-bottom:22px}
.module-sign{
  width:38px;height:38px;display:grid;place-items:center;border-radius:10px;
  background:#022e64;color:#fff;font-family:"Roboto Mono",monospace;font-size:10px;font-weight:800
}
.module-lounges .module-sign,.module-transfer .module-sign{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.13)}
.module-hotel .module-sign{background:#3c2f20}
.module-head small{display:block;color:#758599;font-size:7px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.module-lounges .module-head small,.module-transfer .module-head small{color:#91b1c4}
.module-hotel .module-head small{color:#8d7557}
.module-head h3{margin-top:2px;font-size:23px;font-weight:600;letter-spacing:-.045em}
.module-body{display:grid;gap:9px;margin-top:auto}
.context-list-item{
  padding:12px 13px;border-radius:13px;background:rgba(255,255,255,.62);border:1px solid rgba(2,46,100,.06)
}
.module-lounges .context-list-item,.module-transfer .context-list-item{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.08)}
.module-hotel .context-list-item{background:rgba(255,255,255,.32)}
.context-list-item strong{display:block;font-size:11px;line-height:1.3}
.context-list-item span{display:block;margin-top:4px;color:#728194;font-size:9px;line-height:1.55}
.module-lounges .context-list-item span,.module-transfer .context-list-item span{color:#adc2d2}
.module-hotel .context-list-item span{color:#756958}
.context-empty{
  color:#7a8998;font-size:10px;line-height:1.65
}
.module-lounges .context-empty,.module-transfer .context-empty{color:#9eb6c7}
.transfer-price{
  font-size:35px;font-weight:700;letter-spacing:-.06em;color:#fff
}
.transfer-price small{font-size:10px;font-weight:600;letter-spacing:0;color:#9eb7c8}
.transfer-cta{
  margin-top:8px;min-height:43px;border:0;border-radius:999px;padding:0 16px;background:#d9f1f1;color:#022e64;
  font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase
}

/* Selling / destination contextual rail */
.airport-commerce{
  padding:72px 0 82px;background:#f3f6f8
}
.commerce-grid{
  display:grid;grid-template-columns:repeat(12,1fr);gap:12px
}
.commerce-card{
  grid-column:span 4;position:relative;overflow:hidden;min-height:330px;border-radius:24px;padding:24px;
  display:flex;flex-direction:column;justify-content:flex-end;border:1px solid rgba(2,46,100,.07);
  background:#fff;box-shadow:0 14px 34px rgba(2,46,100,.08);transition:transform .3s var(--ease),box-shadow .3s ease
}
.commerce-card:hover{transform:translateY(-6px);box-shadow:0 25px 52px rgba(2,46,100,.14)}
.commerce-card-media{position:absolute;inset:0;background-position:center;background-size:cover;transition:transform .7s var(--ease)}
.commerce-card:hover .commerce-card-media{transform:scale(1.045)}
.commerce-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,46,100,.02),rgba(2,27,54,.88))}
.commerce-card-copy{position:relative;z-index:2;color:#fff}
.commerce-card-copy small{font-size:7px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#b8dce0}
.commerce-card-copy h3{font-size:25px;line-height:1.02;letter-spacing:-.045em;margin:8px 0}
.commerce-card-copy p{font-size:9.5px;line-height:1.58;color:#cad9e5}
.commerce-card-copy button{
  margin-top:14px;min-height:38px;padding:0 13px;border:1px solid rgba(255,255,255,.20);border-radius:999px;
  background:rgba(255,255,255,.10);color:#fff;font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase
}

.airport-destination-edit{padding:80px 0;background:#fff}
.destination-edit-head>div{display:flex;align-items:flex-end;gap:24px}
.destination-edit-code{
  color:#e9eef8;font-size:clamp(74px,12vw,145px);font-weight:700;line-height:.72;letter-spacing:-.10em
}
.destination-edit-head h2{
  margin-top:8px;color:#022e64;font-size:clamp(34px,4.8vw,58px);font-weight:550;letter-spacing:-.055em;line-height:.96
}
.destination-edit-grid{
  margin-top:30px;display:grid;grid-template-columns:repeat(12,1fr);gap:12px
}
.destination-card{
  grid-column:span 4;min-height:270px;border-radius:22px;padding:23px;border:1px solid rgba(2,46,100,.07);
  background:#e9eef8;color:#022e64;display:flex;flex-direction:column;justify-content:flex-end
}
.destination-card:nth-child(3n+2){background:#d9f1f1}
.destination-card:nth-child(3n+3){background:#f2e9dc;color:#3c2f20}
.destination-card small{margin-bottom:auto;font-size:7px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.62}
.destination-card h3{font-size:23px;letter-spacing:-.04em;line-height:1.03}
.destination-card p{margin-top:8px;font-size:9.5px;line-height:1.6;opacity:.70}
.destination-card button{
  align-self:flex-start;margin-top:14px;border:0;background:transparent;color:inherit;padding:0;
  font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase
}

/* Practical airport data */
.airport-practical{padding:72px 0 90px;background:linear-gradient(180deg,#fff,#f3f6f8)}
.practical-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.practical-card{
  min-height:205px;padding:22px;border-radius:20px;background:#fff;border:1px solid rgba(2,46,100,.07);
  box-shadow:0 12px 28px rgba(2,46,100,.06)
}
.practical-card span{font-size:7px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#74869a}
.practical-card h3{margin-top:10px;color:#022e64;font-size:20px;letter-spacing:-.04em}
.practical-card p{margin-top:8px;color:#66788b;font-size:9.5px;line-height:1.62}

@media(max-width:1080px){
  .airport-profile-inner{grid-template-columns:1fr}
  .airport-profile-facts{max-width:650px}
  .context-module{grid-column:span 6}
  .module-transfer{grid-column:span 12}
  .commerce-card,.destination-card{grid-column:span 6}
  .context-preview-grid,.practical-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:760px){
  .fids-layout{grid-template-columns:1fr!important}
  .board-columns{display:none}
  .board-scroll{max-height:none;overflow:visible}
  .fids-row{display:grid;grid-template-columns:1fr 1fr!important;border:1px solid rgba(255,255,255,.06)!important;border-radius:12px!important;margin-bottom:7px!important}
  .fids-cell{border-right:0!important;border-bottom:1px solid rgba(255,255,255,.045)!important;justify-content:space-between}
  .fids-cell::before{content:attr(data-label);color:#7194a9;font-size:7px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
  .fids-cell:nth-child(3),.fids-cell:nth-child(4),.fids-cell:nth-child(5){grid-column:1/-1}
  .fids-destination{text-align:right}
  .fids-time{align-items:flex-end}
  .context-welcome{padding:52px 0 70px}
  .context-preview-grid,.practical-grid{grid-template-columns:1fr}
  .context-loading-screen{grid-template-columns:1fr}
  .airport-profile{min-height:650px}
  .airport-profile-inner{min-height:650px;padding:62px 0 42px}
  .airport-profile-code{font-size:96px}
  .airport-profile-copy h2{font-size:42px}
  .airport-profile-facts{grid-template-columns:1fr 1fr}
  .airport-context-grid{grid-template-columns:1fr;padding-top:50px}
  .context-module,.module-transfer{grid-column:auto;min-height:260px}
  .commerce-grid,.destination-edit-grid{grid-template-columns:1fr}
  .commerce-card,.destination-card{grid-column:auto}
  .destination-edit-head>div{display:block}
  .destination-edit-code{font-size:92px}
}
@media(max-width:430px){
  .fids-row{grid-template-columns:1fr!important}
  .fids-cell:nth-child(n){grid-column:1/-1}
  .airport-profile-facts{grid-template-columns:1fr}
}


/* B-011.37 final review: airport selector, true local-time FIDS and clean public empty states */
.airport-code-control{position:relative;z-index:12}
.airport-code-control>div{min-width:0;position:relative}
.airport-code-control input{min-width:250px;width:min(34vw,390px)}
.airport-suggestions{
  position:absolute;z-index:40;left:0;right:0;top:calc(100% + 9px);display:none;overflow:hidden;
  max-height:310px;overflow-y:auto;border:1px solid rgba(2,46,100,.12);border-radius:16px;background:#fff;
  box-shadow:0 20px 48px rgba(2,46,100,.18);padding:6px
}
.airport-suggestions.open{display:block}
.airport-suggestion{
  width:100%;min-height:52px;border:0;border-radius:11px;background:transparent;padding:9px 10px;
  display:grid;grid-template-columns:50px minmax(0,1fr);gap:10px;align-items:center;text-align:left;color:#173747
}
.airport-suggestion:hover,.airport-suggestion.active{background:#e9eef8}
.airport-suggestion-code{font-family:"Roboto Mono",monospace;font-size:15px;font-weight:800;color:#022e64}
.airport-suggestion-copy{min-width:0}
.airport-suggestion-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
.airport-suggestion-copy small{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#718094;font-size:8px}
.fids-tail.fallback{background:linear-gradient(145deg,#d9f1f1,#e9eef8);color:#022e64;font-family:"Roboto Mono",monospace;font-weight:900;font-size:10px}
.commerce-card.no-media{background:linear-gradient(145deg,#04254a,#0b477e 62%,#126d78)}
.context-module.hidden,.airport-practical.hidden{display:none!important}
@media(max-width:760px){
  .airport-code-control input{min-width:0;width:100%}
  .airport-suggestions{position:fixed;left:12px;right:12px;top:auto;bottom:max(12px,env(safe-area-inset-bottom));max-height:min(62vh,520px);border-radius:22px;padding:8px}
  .airport-suggestion{min-height:58px}
}


/* =========================================================
   B-011.37 — FINAL FUNCTIONAL REVIEW
   Restores all original lookup modes without compromising the airport-first FIDS.
   ========================================================= */
.lookup-mode-tabs{
  width:min(1160px,calc(100% - 24px));margin:0 auto 9px;padding:5px;display:flex;gap:5px;
  border-radius:13px;background:#e9eef8;border:1px solid rgba(2,46,100,.06);box-shadow:0 8px 22px rgba(2,46,100,.05)
}
.lookup-mode{
  min-height:38px;padding:0 13px;border:0;border-radius:9px;background:transparent;color:#64788d;
  display:inline-flex;align-items:center;gap:8px;font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;
  transition:background .18s ease,color .18s ease,transform .18s ease
}
.lookup-mode span{font-family:"Roboto Mono",monospace;font-size:7px;letter-spacing:.06em;opacity:.72}
.lookup-mode:hover{background:rgba(255,255,255,.72);color:#022e64}
.lookup-mode.active{background:#fff;color:#022e64;box-shadow:0 6px 16px rgba(2,46,100,.10)}
.lookup-field.hidden{display:none!important}
.airport-controls.mode-airport{grid-template-columns:minmax(240px,1.15fr) 180px minmax(260px,1fr) auto auto}
.airport-controls.mode-flight{grid-template-columns:minmax(260px,1fr) 180px auto auto}
.airport-controls.mode-route{grid-template-columns:minmax(210px,1fr) minmax(210px,1fr) 180px auto auto}
.airport-controls.mode-flight #airportBoardToggle,.airport-controls.mode-route #airportBoardToggle{display:none}
.airport-controls.mode-flight .lookup-date-control,.airport-controls.mode-route .lookup-date-control{min-width:180px}
.airport-control input{text-transform:none}
#flightNumber{text-transform:uppercase;font-family:"Roboto Mono",monospace;font-weight:800;letter-spacing:.04em}
#airport,#from,#to{font-family:"Roboto Mono",monospace;font-weight:700}
.board-screen[aria-busy="true"]{cursor:progress}
.board-message-title{font-family:"Roboto Mono",monospace;letter-spacing:.04em}
@media(max-width:1080px){
  .airport-controls.mode-airport,.airport-controls.mode-flight,.airport-controls.mode-route{grid-template-columns:1fr 1fr}
  .airport-controls.mode-airport #airportBoardToggle{grid-column:1/-1}
  .airport-controls .airport-update,.airport-controls .airport-reset{min-height:48px}
}
@media(max-width:760px){
  .lookup-mode-tabs{width:100%;overflow-x:auto;scrollbar-width:none;border-radius:11px}
  .lookup-mode-tabs::-webkit-scrollbar{display:none}.lookup-mode{white-space:nowrap;flex:0 0 auto}
  .airport-controls.mode-airport,.airport-controls.mode-flight,.airport-controls.mode-route{grid-template-columns:1fr;width:100%}
  .airport-controls.mode-airport #airportBoardToggle{grid-column:auto}
  .airport-control-note{grid-column:auto!important}
}

</style>
</head>
<body>

<div class="page">
  <section class="hero" id="hero">
    <div class="terminal-architecture" aria-hidden="true">
      <div class="terminal-glass-lines"></div>
      <div class="terminal-ceiling-lines"></div>
      <div class="terminal-apron-light l1"></div>
      <div class="terminal-apron-light l2"></div>
      <div class="terminal-apron-light l3"></div>
      <div class="terminal-apron-light l4"></div>
    </div>
<div class="wrap hero-inner">
      <div class="hero-copy">
        <div class="eyebrow">Airport flight information</div>
        <h1>Your airport board, <span>clear before you reach the gate.</span></h1>
        <p class="hero-lede" id="boardMeta">A modern SKANDI flight information display inspired by the screens, signs and rhythm of the terminal.</p>
        <div class="hero-wayfinding" aria-label="Airport wayfinding motif">
          <span><b>↑</b> Departures</span>
          <span><b>→</b> Gates</span>
          <span><b>←</b> Arrivals</span>
        </div>
        <div class="terminal-location-line">
          <span class="terminal-location-icon">FIDS</span>
          <span>Passenger flight information</span>
          <i></i>
          <span>Departures &amp; arrivals</span>
        </div>
      </div>
      <div class="hero-status">
        <div class="hero-stat">
          <label>Airport time</label>
          <strong id="utcClock">--:--:-- UTC</strong>
          <div class="live-pill"><span class="live-dot"></span><span id="updatedAtHero">Live Sync</span></div>
        </div>
        <div class="hero-stat">
          <label>Current board</label>
          <strong id="boardSubMode">Departures</strong>
          <div class="live-pill"><span class="live-dot"></span><span id="resultCountHero">Ready</span></div>
        </div>
      </div>
    </div>
  </section>
<section class="board-section">
    <div class="wrap">
      <div class="board-heading reveal">
        <div>
          <div class="eyebrow">Flight Information Display</div>
          <h2>Built to read like a real airport FIDS.</h2>
        </div>
        <p>Time-led, high-contrast and deliberately simple. Use an airport board, track one flight, or check a route. Selecting an airport also turns the rest of the page into that airport’s passenger information experience.</p>
      </div>

      <div class="lookup-mode-tabs reveal" role="tablist" aria-label="Flight status search type">
        <button class="lookup-mode active" type="button" role="tab" aria-selected="true" data-lookup-mode="airport"><span>APT</span> Airport board</button>
        <button class="lookup-mode" type="button" role="tab" aria-selected="false" data-lookup-mode="flight"><span>FLT</span> Flight number</button>
        <button class="lookup-mode" type="button" role="tab" aria-selected="false" data-lookup-mode="route"><span>RTE</span> Route</button>
      </div>

      <div class="airport-controls reveal" aria-label="Flight status controls">
        <div class="airport-control airport-code-control lookup-field" id="fieldAirport" data-mode-field="airport">
          <span class="control-sign">APT</span>
          <div>
            <label for="airport">Airport</label>
            <input id="airport" placeholder="Search airport, city or IATA" autocomplete="off" inputmode="search" role="combobox" aria-autocomplete="list" aria-controls="airportSuggestions" aria-expanded="false">
            <div class="airport-suggestions" id="airportSuggestions" role="listbox" aria-label="Airport suggestions"></div>
          </div>
        </div>

        <div class="airport-control lookup-field hidden" id="fieldFlight" data-mode-field="flight">
          <span class="control-sign">FLT</span>
          <div>
            <label for="flightNumber">Flight number</label>
            <input id="flightNumber" placeholder="SK904" autocomplete="off" inputmode="text" maxlength="16">
          </div>
        </div>

        <div class="airport-control airport-code-control lookup-field hidden" id="fieldFrom" data-mode-field="route">
          <span class="control-sign">FROM</span>
          <div>
            <label for="from">From</label>
            <input id="from" placeholder="Airport, city or IATA" autocomplete="off" inputmode="search" role="combobox" aria-autocomplete="list" aria-controls="fromSuggestions" aria-expanded="false">
            <div class="airport-suggestions" id="fromSuggestions" role="listbox" aria-label="Origin airport suggestions"></div>
          </div>
        </div>

        <div class="airport-control airport-code-control lookup-field hidden" id="fieldTo" data-mode-field="route">
          <span class="control-sign">TO</span>
          <div>
            <label for="to">To</label>
            <input id="to" placeholder="Airport, city or IATA" autocomplete="off" inputmode="search" role="combobox" aria-autocomplete="list" aria-controls="toSuggestions" aria-expanded="false">
            <div class="airport-suggestions" id="toSuggestions" role="listbox" aria-label="Destination airport suggestions"></div>
          </div>
        </div>

        <div class="airport-control lookup-date-control">
          <span class="control-sign">DATE</span>
          <div>
            <label for="date">Travel date</label>
            <input id="date" type="date">
          </div>
        </div>

        <div class="airport-board-toggle" id="airportBoardToggle" role="group" aria-label="Board type">
          <button class="airport-toggle active" type="button" data-board-view="departures"><span>↑</span> Departures</button>
          <button class="airport-toggle" type="button" data-board-view="arrivals"><span>↓</span> Arrivals</button>
        </div>

        <select id="boardType" class="sr-only" aria-label="Board type">
          <option value="departures" selected>Departures</option>
          <option value="arrivals">Arrivals</option>
        </select>

        <button class="airport-update" id="searchBtn" type="button"><span class="airport-update-led"></span> Show board</button>
        <button class="airport-reset airport-clear-btn" id="clearBtn" type="button" aria-label="Reset search">Clear</button>

        <div id="notice" class="notice airport-notice" role="status" aria-live="polite"></div>
        <span id="dateHint" class="airport-control-note">Available dates are loading…</span>
        <span id="boardMode" class="sr-only">Airport Board</span>
        <span id="dateWindow" class="sr-only">Loading dates…</span>
      </div>

      <div class="terminal-bay reveal">
        <div class="terminal-overhead-signs" aria-hidden="true">
          <span class="overhead-sign sign-dark"><b>↑</b> DEPARTURES</span>
          <span class="overhead-sign sign-aqua"><b>→</b> GATES</span>
          <span class="overhead-sign sign-light"><b>←</b> ARRIVALS</span>
          <span class="overhead-zone">PASSENGER INFORMATION DISPLAY</span>
        </div>
      <div class="flight-board-shell" id="hardwareCasing">
        <div class="board-top">
          <div class="board-brand">
            <div class="board-monogram">SK</div>
            <div>
              <strong id="railTitle">DEPARTURES</strong>
              <span>Passenger Flight Information Display</span>
            </div>
          </div>
          <div class="board-query">
            <label id="queryLabel">Airport board</label>
            <strong id="querySummary">Select an airport to load the board</strong>
          </div>
          <div class="board-live">
            <span class="live-dot"></span>
            <span>Feed</span>
            <strong id="boardStatusEcho">READY</strong>
          </div>
        </div>

        <div class="board-screen" role="table" aria-label="Airport flight information display">
          <div class="board-airport-bar">
            <div class="airport-code-display"><small id="screenPrimaryLabel">AIRPORT</small><strong id="screenAirport">---</strong></div>
            <div class="airport-date-display"><small>DATE</small><strong id="screenDate">---</strong></div>
            <div class="airport-clock-display"><small id="boardClockLabel">UTC</small><strong id="boardClockEcho">--:--:--</strong></div>
          </div>

          <div class="board-columns fids-layout" role="row">
            <div role="columnheader" id="timeHeader">Time</div>
            <div role="columnheader">Flight</div>
            <div role="columnheader" id="placeHeader">Destination</div>
            <div role="columnheader">Carrier</div>
            <div role="columnheader">Status</div>
            <div role="columnheader">Gate</div>
          </div>

          <div class="board-scroll">
            <div class="flip-body" id="rows" role="rowgroup">
              <div class="board-message">Preparing airport board…</div>
            </div>
          </div>
        </div>

        <div class="board-footer">
          <span><i class="status-lamp"></i><strong>Connected</strong> passenger display</span>
          <span><strong id="updatedAt">Live Sync</strong></span>
          <span><span id="resultScopeLabel">Airport view</span> <strong id="resultCount">Ready</strong></span>
        </div>
      </div>
        <div class="terminal-floor-reflection" aria-hidden="true"></div>
      </div>

      <div class="airport-priority-strip reveal" aria-label="Airport information reminders">
        <div><span class="priority-symbol">01</span><strong>Check the board</strong><small>Use the latest returned time, status and gate.</small></div>
        <div><span class="priority-symbol">02</span><strong>Watch the gate</strong><small>Gate information can change before boarding.</small></div>
        <div><span class="priority-symbol">03</span><strong>Follow airport signs</strong><small>Terminal displays and airline announcements remain final.</small></div>
      </div>
    </div>
  </section>

  
<section class="airport-context" id="airportContext">
  <div class="context-transition" aria-hidden="true"></div>

  <div class="wrap context-welcome" id="contextWelcome">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Beyond the flight board</div>
        <h2>Select an airport and the rest of the page becomes that airport.</h2>
      </div>
      <p>The FIDS stays at the center. Airport information, terminals, transport, lounges, dining, nearby stays and eligible SKANDI products can then reorganize around the airport you selected.</p>
    </div>

    <div class="context-preview-grid">
      <article class="context-preview preview-navy reveal"><span>01 / FIDS</span><h3>Live board</h3><p>Departure or arrival information remains the first thing passengers see.</p></article>
      <article class="context-preview preview-aqua reveal"><span>02 / TERMINAL</span><h3>Know the airport</h3><p>Terminal information, transport, lounges and food can come from the airport content record.</p></article>
      <article class="context-preview preview-sand reveal"><span>03 / SKANDI</span><h3>Continue the journey</h3><p>Eligible transfers, hotels and destination products can be surfaced only when they belong to that airport context.</p></article>
    </div>
  </div>

  <div class="wrap context-loading hidden" id="contextLoading" aria-live="polite">
    <div class="context-loading-screen">
      <div class="loading-airport-code" id="loadingAirportCode">---</div>
      <div class="loading-copy"><span>Loading airport guide</span><strong>Preparing the terminal around your board.</strong></div>
      <div class="loading-track"><i></i></div>
    </div>
  </div>

  <div class="context-content hidden" id="contextContent">
    <section class="airport-profile" id="airportProfile">
      <div class="airport-profile-media" id="airportProfileMedia"></div>
      <div class="airport-profile-overlay"></div>
      <div class="wrap airport-profile-inner">
        <div class="airport-profile-copy">
          <div class="airport-profile-code" id="contextAirportCode">---</div>
          <div class="eyebrow light" id="contextAirportEyebrow">Selected airport</div>
          <h2 id="contextAirportTitle">Airport</h2>
          <p id="contextAirportSummary"></p>
          <div class="airport-profile-actions" id="contextAirportActions"></div>
        </div>
        <div class="airport-profile-facts" id="contextQuickFacts"></div>
      </div>
    </section>

    <div class="wrap airport-context-grid" id="airportContextGrid">
      <section class="context-module module-terminal" id="moduleTerminals">
        <div class="module-head">
          <span class="module-sign">T</span>
          <div><small>Airport guide</small><h3>Terminals</h3></div>
        </div>
        <div class="module-body" id="terminalContent"></div>
      </section>

      <section class="context-module module-transport" id="moduleTransport">
        <div class="module-head">
          <span class="module-sign">↗</span>
          <div><small>Ground transport</small><h3>From the airport</h3></div>
        </div>
        <div class="module-body" id="transportContent"></div>
      </section>

      <section class="context-module module-transfer hidden" id="moduleTransfer">
        <div class="transfer-ribbon">SKANDI TRANSFER</div>
        <div class="module-head">
          <span class="module-sign">S</span>
          <div><small>Available with SKANDI</small><h3 id="transferTitle">Your transfer</h3></div>
        </div>
        <div class="module-body" id="transferContent"></div>
      </section>

      <section class="context-module module-dining" id="moduleDining">
        <div class="module-head">
          <span class="module-sign">⌁</span>
          <div><small>Before the gate</small><h3>Eat &amp; drink</h3></div>
        </div>
        <div class="module-body" id="diningContent"></div>
      </section>

      <section class="context-module module-lounges" id="moduleLounges">
        <div class="module-head">
          <span class="module-sign">L</span>
          <div><small>Wait differently</small><h3>Lounges</h3></div>
        </div>
        <div class="module-body" id="loungeContent"></div>
      </section>

      <section class="context-module module-hotel" id="moduleAirportHotel">
        <div class="module-head">
          <span class="module-sign">H</span>
          <div><small>Close to the terminal</small><h3>Airport stay</h3></div>
        </div>
        <div class="module-body" id="airportHotelContent"></div>
      </section>
    </div>

    <section class="airport-commerce hidden" id="airportCommerce">
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <div class="eyebrow">Continue with SKANDI</div>
            <h2 id="commerceHeading">Turn arrival into the next part of the trip.</h2>
          </div>
          <p id="commerceIntro">Only customer-visible products connected to this airport should appear here.</p>
        </div>
        <div class="commerce-grid" id="commerceGrid"></div>
      </div>
    </section>

    <section class="airport-destination-edit hidden" id="airportDestinationEdit">
      <div class="wrap">
        <div class="destination-edit-head reveal">
          <div>
            <span class="destination-edit-code" id="destinationAirportCode">---</span>
            <div><div class="eyebrow">From the runway to the destination</div><h2 id="destinationEditTitle">Explore what comes next.</h2></div>
          </div>
        </div>
        <div class="destination-edit-grid" id="destinationEditGrid"></div>
      </div>
    </section>

    <section class="airport-practical" id="airportPractical">
      <div class="wrap">
        <div class="section-head reveal">
          <div><div class="eyebrow">Airport essentials</div><h2 id="practicalHeading">Useful before you move on.</h2></div>
          <p>Operational instructions still come from the airport and operating airline. SKANDI adds planning context around them.</p>
        </div>
        <div class="practical-grid" id="practicalGrid"></div>
      </div>
    </section>
  </div>
</section>

</div>

<script>

(function(){
  const SOURCE = "SKANDI_FLIGHT_STATUS";
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";
  let currentMode = "airport";
  let clockTimer = 0;
  let searchTimer = 0;
  let contextTimer = 0;
  const SEARCH_TIMEOUT_MS = 25000;
  const CONTEXT_TIMEOUT_MS = 15000;
  let airportTimezone = "UTC";
  let activeAirportContext = null;
  let contextRequestSerial = 0;
  let pendingContext = null;
  let airportDirectory = [];
  let selectedAirportIata = "";
  let selectedFromIata = "";
  let selectedToIata = "";
  const suggestionIndex = { airport:-1, from:-1, to:-1 };
  let activeSuggestionIndex = -1;
  let lastFlightItems = [];
  let lastFlightMeta = {};
  const airportContextCache = new Map();
  const fidsValueCache = new Map();

  const el = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
  const fields = { airport:document.querySelector("#airport"), from:document.querySelector("#from"), to:document.querySelector("#to"), flightNumber:document.querySelector("#flightNumber") };

  function safeUrl(value){
    try{
      const url=new URL(String(value||"").trim());
      return url.protocol==="https:"?url.href:"";
    }catch(_){return""}
  }

  function parseMaybeJson(value){
    if(value==null||value==="")return null;
    if(typeof value==="object")return value;
    try{return JSON.parse(String(value))}catch(_){return value}
  }

  function normalizeList(value){
    if(value==null||value==="")return[];
    const parsed=parseMaybeJson(value);
    const list=Array.isArray(parsed)?parsed:[parsed];
    return list.flatMap(entry=>{
      const next=parseMaybeJson(entry);
      return Array.isArray(next)?next:[next];
    }).filter(Boolean);
  }

  function objectFrom(value){
    const parsed=parseMaybeJson(value);
    return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};
  }

  function textValue(value,fallback=""){
    if(value==null)return fallback;
    if(typeof value==="string"||typeof value==="number")return String(value);
    return fallback;
  }

  function validHex(value){
    const v=String(value||"").trim();
    return /^#[0-9a-fA-F]{6}$/.test(v)?v:"";
  }

  function contextPathAction(kind,item){
    const source=item&&typeof item==="object"?item:{};
    post("FLIGHT_STATUS_AIRPORT_ACTION",{
      kind,
      airportIata:activeAirportContext?.airport?.iata||resolveAirportIata(),
      item:{
        publicId:textValue(source.publicId),
        entityType:textValue(source.entityType),
        slug:textValue(source.slug),
        destinationSlug:textValue(source.destinationSlug)
      }
    });
  }

  function post(type, payload){
    window.parent.postMessage({
      source: SOURCE,
      type,
      payload: payload || {},
      timestamp: new Date().toISOString()
    }, "*");
  }

  function isoDate(d){
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0,10);
  }

  function setDateLimits(){
    const today = new Date();
    const todayUtc = today.toISOString().slice(0,10);
    const base = new Date(`${todayUtc}T12:00:00Z`);
    const min = new Date(base);
    min.setUTCDate(base.getUTCDate() - 1);
    const max = new Date(base);
    max.setUTCDate(base.getUTCDate() + 3);

    el("date").min = min.toISOString().slice(0,10);
    el("date").max = max.toISOString().slice(0,10);
    if(!el("date").value) el("date").value = todayUtc;

    el("dateHint").textContent = `Available dates: ${el("date").min} – ${el("date").max}`;
    if(el("dateWindow")) el("dateWindow").textContent = `${el("date").min} → ${el("date").max}`;
  }

  function setMode(mode="airport"){
    currentMode=["airport","flight","route"].includes(mode)?mode:"airport";
    document.querySelectorAll("[data-lookup-mode]").forEach(button=>{
      const active=button.dataset.lookupMode===currentMode;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",String(active));
    });
    document.querySelectorAll("[data-mode-field]").forEach(node=>node.classList.toggle("hidden",node.dataset.modeField!==currentMode));
    const controls=el("searchBtn")?.closest(".airport-controls");
    if(controls){
      controls.classList.remove("mode-airport","mode-flight","mode-route");
      controls.classList.add(`mode-${currentMode}`);
    }
    if(currentMode!=="airport"){
      el("boardType").value="departures";
      closeAllAirportSuggestions();
    }
    const labels={airport:"Airport Board",flight:"Flight Number",route:"Route"};
    if(el("boardMode"))el("boardMode").textContent=labels[currentMode];
    if(el("queryLabel"))el("queryLabel").textContent=currentMode==="airport"?"Airport board":currentMode==="flight"?"Flight lookup":"Route lookup";
    if(el("screenPrimaryLabel"))el("screenPrimaryLabel").textContent=currentMode==="airport"?"AIRPORT":currentMode==="flight"?"FLIGHT":"ROUTE";
    if(el("resultScopeLabel"))el("resultScopeLabel").textContent=currentMode==="airport"?"Airport view":currentMode==="flight"?"Flight view":"Route view";
    const meta=currentMode==="airport"
      ?"Select an airport to load departures or arrivals and unlock its airport guide."
      :currentMode==="flight"
        ?"Enter an airline flight number to check the latest returned status for the selected date."
        :"Enter at least an origin or destination airport to review flights on that route.";
    el("boardMeta").textContent=meta;
    if(el("querySummary"))el("querySummary").textContent=currentMode==="airport"?"Select an airport to load the board":currentMode==="flight"?"Enter a flight number":"Enter a route";
    updateBoardType();
    setNotice("");
  }

  function cleanIata(value){
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,4);
  }

  function airportSearchText(value){
    return String(value||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }

  function selectedIataFor(fieldId){
    if(fieldId==="airport")return selectedAirportIata;
    if(fieldId==="from")return selectedFromIata;
    if(fieldId==="to")return selectedToIata;
    return "";
  }

  function setSelectedIata(fieldId,value){
    const code=cleanIata(value);
    if(fieldId==="airport")selectedAirportIata=code;
    if(fieldId==="from")selectedFromIata=code;
    if(fieldId==="to")selectedToIata=code;
    const input=el(fieldId);
    if(input)input.dataset.selectedIata=code;
  }

  function resolveAirportField(fieldId){
    const selected=selectedIataFor(fieldId);
    if(selected)return selected;
    const input=el(fieldId);
    const raw=String(input?.value||"").trim();
    if(!raw)return "";
    const exact=cleanIata(raw);
    if(/^[A-Z0-9]{3,4}$/.test(exact)&&raw.replace(/[^A-Za-z0-9]/g,"").length<=4)return exact;
    const needle=airportSearchText(raw);
    const match=airportDirectory.find(item=>{
      const values=[item.iata,item.icao,item.title,item.city,item.country].map(airportSearchText);
      return values.some(value=>value===needle);
    });
    return cleanIata(match?.iata);
  }

  function airportLabel(item){
    return [item?.city,item?.country].filter(Boolean).join(" · ");
  }

  function suggestionHost(fieldId){return el(`${fieldId}Suggestions`)}

  function closeAirportSuggestions(fieldId="airport"){
    const host=suggestionHost(fieldId);
    if(host){host.classList.remove("open");host.innerHTML="";}
    const input=el(fieldId);
    if(input)input.setAttribute("aria-expanded","false");
    suggestionIndex[fieldId]=-1;
    if(fieldId==="airport")activeSuggestionIndex=-1;
  }

  function closeAllAirportSuggestions(){["airport","from","to"].forEach(closeAirportSuggestions)}

  function selectAirport(item,{searchNow=false,fieldId="airport"}={}){
    if(!item?.iata)return;
    const code=cleanIata(item.iata);
    setSelectedIata(fieldId,code);
    const input=el(fieldId);
    if(input)input.value=code;
    closeAirportSuggestions(fieldId);
    if(searchNow)search();
  }

  function airportMatches(query){
    const needle=airportSearchText(query);
    if(!needle)return airportDirectory.slice(0,8);
    return airportDirectory.filter(item=>{
      const hay=[item.iata,item.icao,item.title,item.city,item.country].map(airportSearchText).join(" ");
      return hay.includes(needle);
    }).slice(0,8);
  }

  function renderAirportSuggestions(query,fieldId="airport"){
    const host=suggestionHost(fieldId);
    const input=el(fieldId);
    if(!host||!input||!airportDirectory.length){closeAirportSuggestions(fieldId);return;}
    const matches=airportMatches(query);
    if(!matches.length){closeAirportSuggestions(fieldId);return;}
    let index=suggestionIndex[fieldId];
    index=Math.min(Math.max(index,0),matches.length-1);
    suggestionIndex[fieldId]=index;
    if(fieldId==="airport")activeSuggestionIndex=index;
    host.innerHTML=matches.map((item,i)=>`<button type="button" class="airport-suggestion ${i===index?"active":""}" role="option" aria-selected="${i===index}" data-airport-index="${i}"><span class="airport-suggestion-code">${escapeHtml(item.iata)}</span><span class="airport-suggestion-copy"><strong>${escapeHtml(item.title||item.iata)}</strong><small>${escapeHtml(airportLabel(item))}</small></span></button>`).join("");
    host.classList.add("open");
    input.setAttribute("aria-expanded","true");
    host.querySelectorAll("[data-airport-index]").forEach(button=>button.addEventListener("click",()=>{
      const item=matches[Number(button.dataset.airportIndex)];
      selectAirport(item,{searchNow:false,fieldId});
    }));
  }

  function values(){
    const base={
      mode:currentMode,
      date:el("date").value,
      clientToday:isoDate(new Date()),
      boardType:el("boardType").value
    };
    if(currentMode==="airport")return {...base,airport:resolveAirportField("airport")};
    if(currentMode==="flight")return {...base,flightNumber:String(el("flightNumber")?.value||"").trim().toUpperCase().replace(/\s+/g,"")};
    return {...base,from:resolveAirportField("from"),to:resolveAirportField("to")};
  }

  function validate(v){
    if(!v.date)return "Please select a travel date.";
    const selected=new Date(v.date+"T12:00:00");
    const min=new Date(el("date").min+"T00:00:00");
    const max=new Date(el("date").max+"T23:59:59");
    if(selected<min||selected>max)return "That date is outside the available search window.";
    if(v.mode==="airport"&&!v.airport)return "Select an airport from the list or enter a valid IATA code.";
    if(v.mode==="flight"&&!v.flightNumber)return "Enter a flight number, for example SK904.";
    if(v.mode==="route"&&!v.from&&!v.to)return "Enter at least a From or To airport.";
    return "";
  }

  function setNotice(message, isError){
    const notice = el("notice");
    if(!message){
      notice.style.display = "none";
      notice.textContent = "";
      return;
    }
    notice.className = isError ? "notice error" : "notice ok";
    notice.textContent = message;
    notice.style.display = "block";
  }

  function setStatusLabels(syncText, resultText){
    if(syncText != null){
      if(el("updatedAt")) el("updatedAt").textContent=syncText;
      if(el("updatedAtHero")) el("updatedAtHero").textContent=syncText;
    }
    if(resultText != null){
      if(el("resultCount")) el("resultCount").textContent=resultText;
      if(el("resultCountHero")) el("resultCountHero").textContent=resultText;
    }
  }

  function setBoardBusy(isBusy){
    const button=el("searchBtn");
    if(!button)return;
    button.disabled=Boolean(isBusy);
    button.classList.toggle("is-busy",Boolean(isBusy));
    button.innerHTML=isBusy
      ? '<span class="airport-update-led"></span> Updating…'
      : '<span class="airport-update-led"></span> Show board';
  }

  function clearSearchTimeout(){
    if(searchTimer){window.clearTimeout(searchTimer);searchTimer=0;}
  }

  function clearContextTimeout(){
    if(contextTimer){window.clearTimeout(contextTimer);contextTimer=0;}
  }

  function clearRequestTimeouts(){
    clearSearchTimeout();
    clearContextTimeout();
  }

  function hasReadySearch(){
    const v=values();
    if(currentMode==="airport")return Boolean(v.airport);
    if(currentMode==="flight")return Boolean(v.flightNumber);
    return Boolean(v.from||v.to);
  }

  function armSearchTimeout(){
    clearSearchTimeout();
    searchTimer=window.setTimeout(()=>{
      searchTimer=0;
      setBoardBusy(false);
      el("hardwareCasing")?.classList.remove("is-searching");
      el("rows")?.closest(".board-screen")?.setAttribute("aria-busy","false");
      setBoardMessage("UPDATE TIMED OUT","The flight feed did not answer in time. Please try again.","flap-warn");
      setStatusLabels("Update Timed Out","Retry");
      if(el("boardStatusEcho"))el("boardStatusEcho").textContent="RETRY";
      setNotice("The flight feed took too long to respond. Please try again.",true);
    },SEARCH_TIMEOUT_MS);
  }

  function armContextTimeout(code,serial,key){
    clearContextTimeout();
    contextTimer=window.setTimeout(()=>{
      contextTimer=0;
      if(!pendingContext||pendingContext.serial!==serial||pendingContext.key!==key)return;
      pendingContext=null;
      if(!activeAirportContext)setContextState("welcome");
      document.body.classList.remove("has-airport-selection");
      setNotice(`Airport guide for ${code} is taking longer than expected. The flight board can still be used.`,false);
    },CONTEXT_TIMEOUT_MS);
  }

  function search(){
    clearSearchTimeout();
    const v=values();
    const error=validate(v);
    if(error){setNotice(error,true);return;}
    setNotice("");
    closeAllAirportSuggestions();
    if(v.mode==="airport"){
      setSelectedIata("airport",v.airport);
      requestAirportContext(v.airport,v);
    }else{
      activeAirportContext=null;
      pendingContext=null;
      airportTimezone="UTC";
      document.body.classList.remove("has-airport-selection","has-airport-context");
      setContextState("welcome");
    }
    if(v.mode==="route"){
      if(v.from)setSelectedIata("from",v.from);
      if(v.to)setSelectedIata("to",v.to);
    }
    setBoardBusy(true);
    el("hardwareCasing")?.classList.add("is-searching");
    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy","true");
    setStatusLabels("Syncing","Searching");
    el("querySummary").textContent=describeQuery(v);
    if(el("screenAirport")){
      el("screenAirport").textContent=v.mode==="airport"?(v.airport||"---"):v.mode==="flight"?(v.flightNumber||"---"):`${v.from||"ANY"}→${v.to||"ANY"}`;
    }
    if(el("screenDate"))el("screenDate").textContent=v.date||"---";
    if(el("boardStatusEcho"))el("boardStatusEcho").textContent="SEARCHING";
    setBoardMessage("UPDATING FIDS","Loading the latest available flight information","flap-warn",true);
    armSearchTimeout();
    post("FLIGHT_STATUS_SEARCH",v);
  }

  function fmtDate(value){
    if(!value) return "";
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return String(value).slice(0,9);
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`;
  }

  function fmtTime(value){
    if(!value)return "";
    const raw=String(value).trim();
    if(/^\d{2}:\d{2}(?::\d{2})?$/.test(raw))return raw.slice(0,5);
    const localIso=raw.match(/T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?[+-]\d{2}:?\d{2}$/);
    if(localIso)return localIso[1];
    const d=new Date(raw);
    if(Number.isNaN(d.getTime()))return raw.slice(0,5);
    try{return new Intl.DateTimeFormat("en-GB",{timeZone:airportTimezone||"UTC",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)}
    catch(_){return new Intl.DateTimeFormat("en-GB",{timeZone:"UTC",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)}
  }

  function statusColorClass(status){
    const s = String(status || "").toLowerCase();
    if(s.includes("delay") || s.includes("incident") || s.includes("divert") || s.includes("estimated") || s.includes("board")) return "flap-warn";
    if(s.includes("cancel")) return "flap-bad";
    return "flap-ok";
  }

  const KNOWN_AIRLINE_LOGOS=Object.freeze({
    AS:"https://static.wixstatic.com/shapes/394052_6535b791dd404055903a12f5350d61c3.svg",
    AA:"https://static.wixstatic.com/shapes/394052_47809f4547c04f6eb7e098c5602ff57c.svg",
    PG:"https://static.wixstatic.com/shapes/394052_3627db92f99544d8bc42c98e684ce5d4.svg",
    BA:"https://static.wixstatic.com/shapes/394052_85c56f21c63c42d2b5fba0273ee3b0a6.svg",
    DL:"https://static.wixstatic.com/shapes/394052_4f692ba92b43482292d87d1c6b7df036.svg",
    AY:"https://static.wixstatic.com/shapes/394052_97cf9b3a9a884781b3186ededecd7b45.svg",
    F9:"https://static.wixstatic.com/shapes/394052_cca48f82a42043d79743561a784e92c8.svg",
    IB:"https://static.wixstatic.com/shapes/394052_3726a2f12dcd44ab8dea7085713902b9.svg",
    FI:"https://static.wixstatic.com/shapes/394052_e09b3c2f6dfd4ca3a87497e34f538c53.svg",
    B6:"https://static.wixstatic.com/shapes/394052_d0e052d862be40cba0231eae50b4b5dd.svg",
    KL:"https://static.wixstatic.com/shapes/394052_0c2eaf7331a147648b444fdb12329073.svg",
    LH:"https://static.wixstatic.com/shapes/394052_76a1dce4673a429d86b4d816faf88b6d.svg",
    N0:"https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg",
    Z0:"https://static.wixstatic.com/shapes/394052_2c0b19b3399a4938a36e4dd7d8820c91.svg",
    DY:"https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",
    D8:"https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",
    SK:"https://static.wixstatic.com/shapes/394052_bfbc7fc4f8b74360bf5398ac8d12a280.svg",
    LX:"https://static.wixstatic.com/shapes/394052_69b2702a5c434d03a9aa0182c430979e.svg",
    TG:"https://static.wixstatic.com/shapes/394052_c370132e76c64a29befdfd67496234fe.svg",
    UA:"https://static.wixstatic.com/shapes/394052_6002f849a3574cd4827d4ba1c3d339ef.svg"
  });

  function airlineCode(item){
    const explicit=String(item?.airlineIata||"").trim().toUpperCase();
    if(explicit)return explicit;
    const flight=String(item?.flightIata||"").trim().toUpperCase();
    const match=flight.match(/^([A-Z0-9]{2})/);
    return match?match[1]:"";
  }

  function airlineLogo(item){
    const direct=safeUrl(item?.airlineLogoUrl);
    if(direct)return direct;
    return KNOWN_AIRLINE_LOGOS[airlineCode(item)]||"";
  }

  function createFlaps(str, exactLength = 0, statusClass = "") {
    const raw=String(str||"").trim().toUpperCase();
    const visible=exactLength?raw.substring(0,exactLength):raw;
    const safe=escapeHtml(visible||"—");
    return `<span class="message-flip ${statusClass}">${safe}</span>`;
  }

  function cacheChanged(key,value){
    if(!key)return false;
    const next=String(value||"");
    const previous=fidsValueCache.get(key);
    fidsValueCache.set(key,next);
    return previous!==undefined&&previous!==next;
  }

  function flightKey(item){
    return String(item?.id||item?.flightIata||"FLIGHT")+"|"+String(item?.departure?.scheduled||item?.arrival?.scheduled||"");
  }

  function createTimeDisplay(item,arrivals,key){
    const scheduledRaw=arrivals?item?.arrival?.scheduled:item?.departure?.scheduled;
    const latestRaw=arrivals?(item?.arrival?.estimated||scheduledRaw):(item?.departure?.estimated||scheduledRaw);
    const scheduled=fmtTime(scheduledRaw)||"—";
    const latest=fmtTime(latestRaw)||scheduled;
    const changed=cacheChanged(`${key}:time`,latest);
    const moved=scheduled&&latest&&scheduled!==latest;
    return `<div class="fids-time"><strong class="fids-time-main ${changed?"is-changing":""}">${escapeHtml(latest)}</strong>${moved?`<small>Sched ${escapeHtml(scheduled)}</small>`:""}</div>`;
  }

  function createFlightDisplay(item,key){
    const value=String(item?.flightIata||"—").toUpperCase();
    const changed=cacheChanged(`${key}:flight`,value);
    return `<div class="fids-flight"><strong class="${changed?"is-changing":""}">${escapeHtml(value)}</strong></div>`;
  }

  function createDestinationDisplay(city,iata){
    return `<div class="fids-destination"><strong>${escapeHtml(city||"—")}</strong>${iata?`<small>${escapeHtml(iata)}</small>`:""}</div>`;
  }

  function createStatusDisplay(status,key){
    const value=String(status||"Scheduled").trim();
    const cls=statusColorClass(value);
    const changed=cacheChanged(`${key}:status`,value);
    return `<span class="fids-status ${cls} ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
  }

  function createGateDisplay(gate,key){
    const value=String(gate||"—").trim().toUpperCase();
    const changed=cacheChanged(`${key}:gate`,value);
    return `<span class="fids-gate ${changed?"is-changing":""}">${escapeHtml(value)}</span>`;
  }

  function createLogoFlaps(item){
    const airlineName=String(item?.airlineName||airlineCode(item)||"Airline");
    const src=airlineLogo(item);
    const fallback=(airlineCode(item)||airlineName.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"--");
    return `<div class="fids-carrier"><span class="fids-tail ${src?"":"fallback"}">${src?`<img src="${escapeHtml(src)}" alt="">`:escapeHtml(fallback)}</span><span class="fids-carrier-name">${escapeHtml(airlineName)}</span></div>`;
  }

  function describeQuery(v){
    if(v.mode==="flight")return `${v.flightNumber||"FLIGHT"} · ${v.date||""}`;
    if(v.mode==="route")return `${v.from||"ANY"} → ${v.to||"ANY"} · ${v.date||""}`;
    return `${v.airport||"AIRPORT"} · ${(v.boardType||"departures").toUpperCase()} · ${v.date||""}`;
  }

  function setBoardMessage(title, note="", statusClass="", radar=false){
    const rows=el("rows");
    if(!rows)return;
    rows.innerHTML=`<div class="board-message ${statusClass==="flap-bad"?"error":""}">
      ${radar?`<div class="search-radar" aria-hidden="true"></div>`:""}
      <strong class="board-message-title ${statusClass}">${escapeHtml(title)}</strong>
      ${note?`<div class="board-message-note">${escapeHtml(note)}</div>`:""}
    </div>`;
  }

  function renderIdleBoard(){
    setBoardMessage("BOARD READY", "Choose an airport and update the FIDS.", "flap-ok");
    if(el("boardStatusEcho")) el("boardStatusEcho").textContent="READY";
  }

  function render(items, meta) {
    lastFlightItems=Array.isArray(items)?items:[];
    lastFlightMeta=meta&&typeof meta==="object"?meta:{};
    const rows=el("rows");
    setBoardBusy(false);
    el("hardwareCasing")?.classList.remove("is-searching");
    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy","false");

    if(meta?.airportContext) renderAirportContext(meta.airportContext);

    if(!items||!items.length){
      setBoardMessage("NO FLIGHTS FOUND",currentMode==="airport"?"No flights were returned for this airport board.":currentMode==="flight"?"No matching flight was returned for this date.":"No flights were returned for this route and date.","flap-warn");
      el("boardMeta").textContent=meta?.message||"No flights matched the selected airport board.";
      setStatusLabels("Updated","0 Flights");
      if(el("boardStatusEcho"))el("boardStatusEcho").textContent="NO MATCH";
      return;
    }

    const arrivals=currentMode==="airport"&&el("boardType").value==="arrivals";
    const sorted=[...items].sort((a,b)=>{
      const av=arrivals?(a?.arrival?.estimated||a?.arrival?.scheduled):(a?.departure?.estimated||a?.departure?.scheduled);
      const bv=arrivals?(b?.arrival?.estimated||b?.arrival?.scheduled):(b?.departure?.estimated||b?.departure?.scheduled);
      const at=new Date(av||0).getTime(),bt=new Date(bv||0).getTime();
      return (Number.isFinite(at)?at:0)-(Number.isFinite(bt)?bt:0);
    });

    rows.innerHTML=sorted.map((item,rowIndex)=>{
      const key=flightKey(item);
      const placeCity=arrivals?(item?.departure?.city||item?.departure?.airport||"---"):(item?.arrival?.city||item?.arrival?.airport||"---");
      const placeIata=arrivals?item?.departure?.iata:item?.arrival?.iata;
      const gate=arrivals?(item?.arrival?.gate||item?.departure?.gate):item?.departure?.gate;
      const status=item?.status||"Scheduled";
      const aria=[item?.flightIata,arrivals?"from":"to",placeCity,status].filter(Boolean).join(" ");

      return `<div class="fids-row fids-layout" role="row" style="--row:${rowIndex}" aria-label="${escapeHtml(aria)}">
        <div class="fids-cell" data-label="Time" role="cell">${createTimeDisplay(item,arrivals,key)}</div>
        <div class="fids-cell" data-label="Flight" role="cell">${createFlightDisplay(item,key)}</div>
        <div class="fids-cell" data-label="${arrivals?"Origin":"Destination"}" role="cell">${createDestinationDisplay(placeCity,placeIata)}</div>
        <div class="fids-cell" data-label="Carrier" role="cell">${createLogoFlaps(item)}</div>
        <div class="fids-cell" data-label="Status" role="cell">${createStatusDisplay(status,key)}</div>
        <div class="fids-cell" data-label="Gate" role="cell">${createGateDisplay(gate,key)}</div>
      </div>`;
    }).join("");

    el("boardMeta").textContent=meta?.message||`Displaying ${sorted.length} flights`;
    const now=new Intl.DateTimeFormat("en-GB",{timeZone:airportTimezone||"UTC",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());
    setStatusLabels(`Updated ${now}`,`${sorted.length} ${sorted.length===1?"Flight":"Flights"}`);
    if(el("boardStatusEcho"))el("boardStatusEcho").textContent="LIVE";
    setNotice(meta?.note||"",false);
  }

  function setContextState(state,iata=""){
    el("contextWelcome")?.classList.toggle("hidden",state!=="welcome");
    el("contextLoading")?.classList.toggle("hidden",state!=="loading");
    el("contextContent")?.classList.toggle("hidden",state!=="content");
    if(el("loadingAirportCode"))el("loadingAirportCode").textContent=iata||"---";
  }

  function contextKey(iata, searchValues={}){
    const code=cleanIata(iata);
    const date=searchValues.date||el("date")?.value||"";
    const boardType=searchValues.boardType||el("boardType")?.value||"departures";
    return `${code}|${date}|${boardType}`;
  }

  function requestAirportContext(iata, searchValues={}){
    const code=cleanIata(iata);
    if(!code)return;
    const key=contextKey(code,searchValues);
    const cached=airportContextCache.get(key);
    if(cached){
      clearContextTimeout();
      contextRequestSerial++;
      pendingContext=null;
      renderAirportContext(cached);
      return;
    }
    const serial=++contextRequestSerial;
    pendingContext={serial,key,iata:code};
    setContextState("loading",code);
    armContextTimeout(code,serial,key);
    document.body.classList.add("has-airport-selection");
    post("FLIGHT_STATUS_AIRPORT_CONTEXT_REQUEST",{
      iata:code,
      date:searchValues.date||el("date")?.value||"",
      boardType:searchValues.boardType||el("boardType")?.value||"departures",
      language:"EN",
      requestSerial:serial,
      contextKey:key
    });
  }

  function mediaUrlFromAirport(airport){
    const direct=safeUrl(airport?.heroImageUrl||airport?.image_url||airport?.imageUrl);
    if(direct)return direct;
    const media=normalizeList(airport?.media_assets||airport?.mediaAssets);
    const primary=media.find(x=>x&&typeof x==="object"&&(x.isHero||x.isPrimary||x.role==="PRIMARY"))||media[0];
    return safeUrl(primary?.url);
  }

  function normalizeAirportContext(payload){
    const source=payload&&typeof payload==="object"?payload:{};
    const airport=source.airport&&typeof source.airport==="object"?source.airport:source;
    const commerce=source.commerce&&typeof source.commerce==="object"?source.commerce:{};
    const quickFacts=normalizeList(airport.quickFacts||airport.quickFactsJson);
    const terminals=normalizeList(airport.terminals||airport.terminalsJson);
    const transport=normalizeList(airport.transport||airport.transportJson);
    const foodDrinks=normalizeList(airport.foodDrinks||airport.foodDrinksJson);
    const destinationAds=normalizeList(airport.destinationAds||airport.destinationAdsJson);
    const lostFound=normalizeList(airport.lostFound||airport.lostFoundJson);
    const loungesObj=objectFrom(airport.lounges);
    const lounges=Array.isArray(loungesObj.lounges)?loungesObj.lounges:normalizeList(airport.lounges);
    const airportHotel=objectFrom(airport.airportHotel||airport.airportHotels);
    return {
      airport:{
        ...airport,
        iata:cleanIata(airport.iata||airport.iata_code||airport.code),
        title:textValue(airport.title||airport.airport_name||airport.name),
        city:textValue(airport.city||airport.locationCity),
        country:textValue(airport.country||airport.countryName),
        summary:textValue(airport.summary||airport.information||airport.body),
        timezone:textValue(airport.timezone,"UTC"),
        website:safeUrl(airport.website),
        contactUrl:safeUrl(airport.contactUrl),
        heroImageUrl:mediaUrlFromAirport(airport),
        logoUrl:safeUrl(airport.logoUrl||airport.logoIconUrl||airport.airport_logo),
        primaryColor:validHex(airport.primaryColor),
        accentColor:validHex(airport.accentColor),
        distanceToCityCenterKm:airport.distanceToCityCenterKm,
        lastReviewed:airport.lastReviewed,
        quickFacts,terminals,transport,lounges,foodDrinks,airportHotel,destinationAds,lostFound
      },
      commerce:{
        transferOffers:normalizeList(commerce.transferOffers||commerce.transfers),
        hotels:normalizeList(commerce.hotels),
        destinations:normalizeList(commerce.destinations),
        tours:normalizeList(commerce.tours||commerce.activities)
      }
    };
  }

  function listItem(title,detail=""){
    return `<div class="context-list-item"><strong>${escapeHtml(title||"")}</strong>${detail?`<span>${escapeHtml(detail)}</span>`:""}</div>`;
  }

  function renderSimpleList(hostId,items,titleKeys,detailKeys,emptyText){
    const host=el(hostId);if(!host)return 0;
    const rows=(items||[]).slice(0,5).map(item=>{
      if(typeof item==="string")return listItem(item);
      const title=titleKeys.map(k=>item?.[k]).find(Boolean)||"";
      const detail=detailKeys.map(k=>item?.[k]).find(Boolean)||"";
      return title?listItem(title,detail):"";
    }).filter(Boolean);
    host.innerHTML=rows.length?rows.join(""):`<p class="context-empty">${escapeHtml(emptyText)}</p>`;
    return rows.length;
  }

  function renderTransfer(offers,airport){
    const module=el("moduleTransfer"),host=el("transferContent");
    if(!module||!host)return;
    const offer=(offers||[])[0];
    if(!offer){
      module.classList.add("hidden");
      host.innerHTML="";
      return;
    }
    module.classList.remove("hidden");
    const title=textValue(offer.title||offer.name,"SKANDI Transfer");
    const detail=textValue(offer.summary||offer.description||offer.destination||offer.meetingPoint||"Continue from arrivals with a SKANDI transfer option linked to this airport.");
    const amount=Number(offer.price??offer.publicPrice);
    const currency=textValue(offer.currency);
    const price=Number.isFinite(amount)&&amount>0?`<div class="transfer-price">${escapeHtml(currency)} ${escapeHtml(amount.toFixed(0))}<small> from</small></div>`:"";
    el("transferTitle").textContent=title;
    host.innerHTML=`${price}<p>${escapeHtml(detail)}</p><button class="transfer-cta" type="button" id="transferCta">View SKANDI Transfer →</button>`;
    el("transferCta")?.addEventListener("click",()=>contextPathAction("TRANSFER",offer));
  }

  function contextCard(item,kind){
    const image=safeUrl(item?.imageUrl||item?.heroImageUrl||item?.image||item?.media?.[0]?.url);
    const title=textValue(item?.title||item?.name,kind);
    const summary=textValue(item?.summary||item?.description||item?.subtitle||"");
    return `<article class="commerce-card ${image?"has-media":"no-media"}">
      ${image?`<div class="commerce-card-media" style="background-image:url('${escapeHtml(image)}')"></div>`:""}
      <div class="commerce-card-copy"><small>${escapeHtml(kind)}</small><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:""}<button type="button" data-commerce-kind="${escapeHtml(kind)}" data-commerce-id="${escapeHtml(item?.id||item?.publicId||item?.slug||title)}">Explore →</button></div>
    </article>`;
  }

  function destinationCard(item,kind){
    const title=textValue(item?.title||item?.name,kind);
    const summary=textValue(item?.summary||item?.description||item?.subtitle||"");
    return `<article class="destination-card"><small>${escapeHtml(kind)}</small><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:""}<button type="button" data-destination-kind="${escapeHtml(kind)}" data-destination-id="${escapeHtml(item?.id||item?.publicId||item?.slug||title)}">Discover →</button></article>`;
  }

  function renderAirportContext(payload){
    const context=normalizeAirportContext(payload);
    const airport=context.airport;
    if(!airport.iata)return;
    activeAirportContext=context;
    const key=payload?.contextKey||contextKey(airport.iata,payload?.meta||{});
    airportContextCache.set(key,payload);
    airportTimezone=airport.timezone||"UTC";
    selectedAirportIata=airport.iata;
    el("airport").dataset.selectedIata=airport.iata;
    setContextState("content",airport.iata);
    document.body.classList.add("has-airport-context");

    if(el("airport")&&el("airport").value!==airport.iata)el("airport").value=airport.iata;
    if(el("screenAirport"))el("screenAirport").textContent=airport.iata;
    if(el("contextAirportCode"))el("contextAirportCode").textContent=airport.iata;
    if(el("destinationAirportCode"))el("destinationAirportCode").textContent=airport.iata;
    if(el("contextAirportEyebrow"))el("contextAirportEyebrow").textContent=[airport.city,airport.country].filter(Boolean).join(" · ")||"Airport guide";
    if(el("contextAirportTitle"))el("contextAirportTitle").textContent=airport.title||airport.iata;
    if(el("contextAirportSummary"))el("contextAirportSummary").textContent=airport.summary||`Passenger guide for ${airport.iata}.`;
    if(el("destinationEditTitle"))el("destinationEditTitle").textContent=airport.city?`Continue into ${airport.city}.`:`Continue beyond ${airport.iata}.`;
    if(el("practicalHeading"))el("practicalHeading").textContent=`Useful at ${airport.iata}.`;

    const profile=el("airportProfile");
    if(profile){
      if(airport.primaryColor)profile.style.setProperty("--airport-primary",airport.primaryColor);
      if(airport.accentColor)profile.style.setProperty("--airport-accent",airport.accentColor);
    }
    const media=el("airportProfileMedia");
    if(media)media.style.backgroundImage=airport.heroImageUrl?`url('${airport.heroImageUrl}')`:"";

    const actions=[];
    if(airport.website)actions.push(`<a class="context-action primary" href="${escapeHtml(airport.website)}" target="_blank" rel="noopener noreferrer">Official airport site ↗</a>`);
    if(airport.contactUrl)actions.push(`<a class="context-action" href="${escapeHtml(airport.contactUrl)}" target="_blank" rel="noopener noreferrer">Airport contact ↗</a>`);
    el("contextAirportActions").innerHTML=actions.join("");

    const facts=[];
    facts.push(["IATA",airport.iata]);
    if(airport.city)facts.push(["City",airport.city]);
    if(airport.country)facts.push(["Country",airport.country]);
    if(airport.distanceToCityCenterKm!=null&&airport.distanceToCityCenterKm!=="")facts.push(["City center",`${airport.distanceToCityCenterKm} km`]);
    airport.quickFacts.forEach(item=>{
      const obj=typeof item==="object"?item:{label:"",value:item};
      if(obj.label&&obj.value)facts.push([obj.label,obj.value]);
    });
    el("contextQuickFacts").innerHTML=facts.slice(0,6).map(([label,value])=>`<div class="profile-fact"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("");

    const terminalCount=renderSimpleList("terminalContent",airport.terminals,["terminal","name","title"],["notes","description"],"");
    const transportCount=renderSimpleList("transportContent",airport.transport,["mode","name","title"],["notes","description"],"");
    const diningCount=renderSimpleList("diningContent",airport.foodDrinks,["name","title","venue"],["location","notes","description"],"");
    const loungeCount=renderSimpleList("loungeContent",airport.lounges,["name","title"],["location","access","description"],"");
    el("moduleTerminals")?.classList.toggle("hidden",!terminalCount);
    el("moduleTransport")?.classList.toggle("hidden",!transportCount);
    el("moduleDining")?.classList.toggle("hidden",!diningCount);
    el("moduleLounges")?.classList.toggle("hidden",!loungeCount);

    const hotel=airport.airportHotel;
    const hotelHost=el("airportHotelContent");
    if(hotelHost){
      if(Object.keys(hotel).length){
        const amenities=normalizeList(hotel.amenities).slice(0,3).map(String).join(" · ");
        hotelHost.innerHTML=listItem(hotel.hotel||hotel.name||"Airport hotel",[hotel.location,amenities].filter(Boolean).join(" · "));
      }else hotelHost.innerHTML="";
      el("moduleAirportHotel")?.classList.toggle("hidden",!Object.keys(hotel).length);
    }

    renderTransfer(context.commerce.transferOffers,airport);

    const commerceItems=[
      ...context.commerce.hotels.map(x=>({item:x,kind:"Hotel"})),
      ...context.commerce.tours.map(x=>({item:x,kind:"Experience"}))
    ].slice(0,6);
    const commerce=el("airportCommerce"),grid=el("commerceGrid");
    if(commerce&&grid){
      commerce.classList.toggle("hidden",!commerceItems.length);
      grid.innerHTML=commerceItems.map(x=>contextCard(x.item,x.kind)).join("");
      grid.querySelectorAll("[data-commerce-kind]").forEach(button=>button.addEventListener("click",()=>{
        const all=commerceItems.map(x=>x.item);
        const item=all.find(x=>String(x?.id||x?.publicId||x?.slug||x?.title||x?.name)===button.dataset.commerceId)||null;
        contextPathAction(button.dataset.commerceKind.toUpperCase(),item);
      }));
    }

    const destinationItems=[
      ...airport.destinationAds.map(x=>({item:x,kind:"Destination"})),
      ...context.commerce.destinations.map(x=>({item:x,kind:"Destination"}))
    ].slice(0,6);
    const destSection=el("airportDestinationEdit"),destGrid=el("destinationEditGrid");
    if(destSection&&destGrid){
      destSection.classList.toggle("hidden",!destinationItems.length);
      destGrid.innerHTML=destinationItems.map(x=>destinationCard(x.item,x.kind)).join("");
      destGrid.querySelectorAll("[data-destination-kind]").forEach(button=>button.addEventListener("click",()=>{
        const all=destinationItems.map(x=>x.item);
        const item=all.find(x=>String(x?.id||x?.publicId||x?.slug||x?.title||x?.name)===button.dataset.destinationId)||null;
        contextPathAction("DESTINATION",item);
      }));
    }

    const practical=[];
    if(airport.distanceToCityCenterKm!=null&&airport.distanceToCityCenterKm!=="")practical.push(["City center",`${airport.distanceToCityCenterKm} km from the airport.`]);
    if(terminalCount)practical.push(["Terminal planning",`${terminalCount} terminal ${terminalCount===1?"section":"sections"} in this airport guide.`]);
    if(transportCount)practical.push(["Ground transport",`${transportCount} documented way${transportCount===1?"":"s"} to continue from the airport.`]);
    if(loungeCount)practical.push(["Lounges",`${loungeCount} lounge ${loungeCount===1?"option":"options"} in this airport guide.`]);
    if(diningCount)practical.push(["Food & drink",`${diningCount} dining ${diningCount===1?"recommendation":"recommendations"} in this airport guide.`]);
    if(airport.website)practical.push(["Official airport site","Use the airport’s official site for final operational instructions and local notices."]);
    el("practicalGrid").innerHTML=practical.map(([title,copy])=>`<article class="practical-card"><span>${escapeHtml(airport.iata)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`).join("");
    el("airportPractical")?.classList.toggle("hidden",!practical.length);

    updateClock();
  }

  window.addEventListener("message", function(event){
    if(event.source!==window.parent)return;
    const data = event.data || {};
    if(data.source !== PARENT_SOURCE) return;

    if(data.type === "FLIGHT_STATUS_RESULTS"){
      clearSearchTimeout();
      const payload = data.payload || {};
      if(payload.airportContext) renderAirportContext(payload.airportContext);
      render(payload.items || [], payload.meta || {});
      return;
    }

    if(data.type === "FLIGHT_STATUS_AIRPORTS_RESULTS"){
      const payload=data.payload||{};
      airportDirectory=normalizeList(payload.items).map(item=>({
        iata:cleanIata(item?.iata),icao:textValue(item?.icao),title:textValue(item?.title),city:textValue(item?.city),country:textValue(item?.country),timezone:textValue(item?.timezone),logoUrl:safeUrl(item?.logoUrl)
      })).filter(item=>item.iata);
      const focused=document.activeElement?.id;
      if(["airport","from","to"].includes(focused)){suggestionIndex[focused]=0;renderAirportSuggestions(el(focused).value,focused);}
      return;
    }

    if(data.type === "FLIGHT_STATUS_AIRPORTS_ERROR"){
      return;
    }

    if(data.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_RESULTS"){
      const payload=data.payload||{};
      const serial=Number(payload.requestSerial||0);
      const key=textValue(payload.contextKey);
      if(pendingContext&&serial&&serial!==pendingContext.serial)return;
      if(pendingContext&&key&&key!==pendingContext.key)return;
      clearContextTimeout();
      pendingContext=null;
      renderAirportContext(payload);
      return;
    }

    if(data.type === "FLIGHT_STATUS_AIRPORT_CONTEXT_ERROR"){
      const payload=data.payload||{};
      const serial=Number(payload.requestSerial||0);
      if(pendingContext&&serial&&serial!==pendingContext.serial)return;
      clearContextTimeout();
      pendingContext=null;
      if(!activeAirportContext)setContextState("welcome");
      if(payload.message)setNotice(payload.message,false);
      return;
    }

    if(data.type === "FLIGHT_STATUS_HOST_READY"){
      return;
    }

    if(data.type === "FLIGHT_STATUS_ERROR"){
      clearSearchTimeout();
      const payload = data.payload || {};
      setBoardBusy(false);
      el("hardwareCasing")?.classList.remove("is-searching");
      el("rows")?.closest(".board-screen")?.setAttribute("aria-busy","false");
      setNotice(payload.message || "Flight information is temporarily unavailable.", true);
      setBoardMessage("BOARD UNAVAILABLE", "Please try updating the FIDS again shortly.", "flap-bad");
      setStatusLabels("Sync Failed","Feed Error");
      if(el("boardStatusEcho")) el("boardStatusEcho").textContent="ERROR";
    }
  });

  function updateBoardType(){
    const type=el("boardType")?.value||"departures";
    let label="Departures";
    if(currentMode==="airport")label=type==="arrivals"?"Arrivals":"Departures";
    else if(currentMode==="flight")label="Flight status";
    else if(currentMode==="route")label="Route status";
    if(el("boardSubMode"))el("boardSubMode").textContent=label;
    if(el("railTitle"))el("railTitle").textContent=label.toUpperCase();
    if(el("timeHeader"))el("timeHeader").textContent="Time";
    if(el("placeHeader"))el("placeHeader").textContent=currentMode==="airport"&&type==="arrivals"?"Origin":"Destination";
    document.querySelectorAll("[data-board-view]").forEach(btn=>btn.classList.toggle("active",currentMode==="airport"&&btn.dataset.boardView===type));
    if(el("commerceHeading"))el("commerceHeading").textContent=type==="arrivals"?"From arrivals into the next part of the trip.":"Make the time before departure work harder.";
    document.body.classList.toggle("context-arrivals",currentMode==="airport"&&type==="arrivals");
    document.body.classList.toggle("context-departures",currentMode!=="airport"||type!=="arrivals");
  }

  function updateClock(){
    const now=new Date();
    let value="";
    try{
      value=new Intl.DateTimeFormat("en-GB",{timeZone:airportTimezone||"UTC",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(now);
    }catch(_){
      airportTimezone="UTC";
      value=new Intl.DateTimeFormat("en-GB",{timeZone:"UTC",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(now);
    }
    if(el("utcClock"))el("utcClock").textContent=`${value} ${airportTimezone==="UTC"?"UTC":"LOCAL"}`;
    if(el("boardClockEcho"))el("boardClockEcho").textContent=value;
    if(el("boardClockLabel"))el("boardClockLabel").textContent=airportTimezone==="UTC"?"UTC":"LOCAL";
  }

  function installPointerLight(){
    if(!window.matchMedia?.("(pointer:fine)")?.matches)return;
    document.addEventListener("pointermove",event=>{
      document.documentElement.style.setProperty("--mx",`${(event.clientX/window.innerWidth*100).toFixed(1)}%`);
      document.documentElement.style.setProperty("--my",`${(event.clientY/window.innerHeight*100).toFixed(1)}%`);
    },{passive:true});
  }

  function installReveal(){
    const nodes=[...document.querySelectorAll(".reveal")];
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || !("IntersectionObserver" in window)){
      nodes.forEach(node=>node.classList.add("is-visible"));
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },{threshold:.10,rootMargin:"0px 0px -6% 0px"});
    nodes.forEach(node=>observer.observe(node));
    window.addEventListener("pagehide",()=>observer.disconnect(),{once:true});
  }

  document.querySelectorAll("[data-lookup-mode]").forEach(button=>{
    button.addEventListener("click",()=>{
      if(button.dataset.lookupMode===currentMode)return;
      clearRequestTimeouts();
      contextRequestSerial++;
      setMode(button.dataset.lookupMode);
      setBoardBusy(false);
      el("hardwareCasing")?.classList.remove("is-searching");
      el("rows")?.closest(".board-screen")?.setAttribute("aria-busy","false");
      setBoardMessage("BOARD READY",currentMode==="airport"?"Choose an airport and update the FIDS.":currentMode==="flight"?"Enter a flight number and date.":"Enter a route and date.","flap-ok");
      setStatusLabels("Live Sync","Ready");
      el("screenAirport").textContent="---";
      activeAirportContext=null;pendingContext=null;airportTimezone="UTC";
      document.body.classList.remove("has-airport-selection","has-airport-context");
      setContextState("welcome");
      if(el("boardStatusEcho"))el("boardStatusEcho").textContent="READY";
    });
  });

  document.querySelectorAll("[data-board-view]").forEach((button)=>{
    button.addEventListener("click",()=>{
      el("boardType").value=button.dataset.boardView;
      updateBoardType();
      const v=values();
    if((currentMode==="airport"&&v.airport)||(currentMode==="flight"&&v.flightNumber)||(currentMode==="route"&&(v.from||v.to)))search();
    });
  });

  el("boardType").addEventListener("change", updateBoardType);
  el("searchBtn").addEventListener("click", search);
  el("clearBtn").addEventListener("click",function(){
    clearRequestTimeouts();
    contextRequestSerial++;
    ["airport","from","to","flightNumber"].forEach(id=>{if(el(id)){el(id).value="";el(id).dataset.selectedIata="";}});
    selectedAirportIata="";selectedFromIata="";selectedToIata="";
    closeAllAirportSuggestions();
    setBoardBusy(false);
    el("hardwareCasing")?.classList.remove("is-searching");
    el("rows")?.closest(".board-screen")?.setAttribute("aria-busy","false");
    setBoardMessage("BOARD READY",currentMode==="airport"?"Choose an airport and update the FIDS.":currentMode==="flight"?"Enter a flight number and date.":"Enter a route and date.","flap-ok");
    setNotice("");
    setStatusLabels("Live Sync","Ready");
    el("querySummary").textContent=currentMode==="airport"?"Select an airport to load the board":currentMode==="flight"?"Enter a flight number":"Enter a route";
    el("screenAirport").textContent="---";
    el("screenDate").textContent=el("date").value||"---";
    activeAirportContext=null;pendingContext=null;airportTimezone="UTC";
    document.body.classList.remove("has-airport-selection","has-airport-context");
    setContextState("welcome");
    if(el("boardStatusEcho"))el("boardStatusEcho").textContent="READY";
    updateBoardType();
  });

  function bindAirportPicker(fieldId){
    const input=el(fieldId);if(!input)return;
    input.addEventListener("input",()=>{
      setSelectedIata(fieldId,"");
      suggestionIndex[fieldId]=0;
      renderAirportSuggestions(input.value,fieldId);
    });
    input.addEventListener("focus",()=>{
      closeAllAirportSuggestions();
      if(airportDirectory.length){suggestionIndex[fieldId]=0;renderAirportSuggestions(input.value,fieldId)}
      else post("FLIGHT_STATUS_AIRPORTS_REQUEST",{});
    });
    input.addEventListener("keydown",event=>{
      const host=suggestionHost(fieldId);const open=host?.classList.contains("open");
      if(event.key==="ArrowDown"&&open){event.preventDefault();suggestionIndex[fieldId]++;renderAirportSuggestions(input.value,fieldId);return}
      if(event.key==="ArrowUp"&&open){event.preventDefault();suggestionIndex[fieldId]=Math.max(0,suggestionIndex[fieldId]-1);renderAirportSuggestions(input.value,fieldId);return}
      if(event.key==="Escape"){closeAirportSuggestions(fieldId);return}
      if(event.key==="Enter"){
        if(open){
          const matches=airportMatches(input.value);const index=Math.min(Math.max(suggestionIndex[fieldId],0),matches.length-1);const item=matches[index];
          if(item){event.preventDefault();selectAirport(item,{searchNow:false,fieldId});return}
        }
        search();
      }
    });
  }
  ["airport","from","to"].forEach(bindAirportPicker);
  el("flightNumber")?.addEventListener("keydown",event=>{if(event.key==="Enter")search()});
  document.addEventListener("pointerdown",event=>{if(!event.target.closest(".airport-code-control"))closeAllAirportSuggestions()},{passive:true});

  el("date").addEventListener("change",()=>{
    if(el("screenDate")) el("screenDate").textContent=el("date").value||"---";
    if(hasReadySearch())search();
  });

  setDateLimits();
  setMode("airport");
  setContextState("welcome");
  updateBoardType();
  updateClock();
  if(el("screenDate")) el("screenDate").textContent=el("date").value||"---";
  clockTimer=window.setInterval(updateClock,1000);
  installPointerLight();
  installReveal();
  setBoardMessage("BOARD READY", "Choose an airport and update the FIDS.", "flap-ok");
  window.addEventListener("pagehide",()=>{
    window.clearInterval(clockTimer);
    clearRequestTimeouts();
  },{once:true});
  post("FLIGHT_STATUS_READY", { version:"B-011.37" });
})();

</script>
</body>
</html>
```
