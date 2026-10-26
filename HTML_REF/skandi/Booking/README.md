# SKANDI INFO / LOG — V12 merged customer booking journey

- Source identity: `/HTML_REF/skandi/Booking/README.md` (authoritative consolidated-embed source). System: SKANDI.
- Wix route: `/booking`. Wix controller: `/src/pages/Booking.e8twe.js`.
- Active HTML element: `#bookingFlowEmbed`.
- Build source: `skandi-embeds/booking-flow/skandi-booking-flow.{html,css,js}`; the root triplet is the single compiled Booking page.
- Parent-to-HTML source: `SKANDI_WIX_PARENT`. HTML-to-parent source: `SKANDI_BOOKING_OFFER`.
- Important preserved canonical message actions: `BOOKING_OFFER_READY`, `BOOKING_SEARCH_SELECT`, `BOOKING_OFFER_ACCEPTED`, `BOOKING_EXTRAS_SAVE`, `SIGNATURE_TRANSFER_SKIP/SELECT`, `APIS_SAVE_AND_CONTINUE`, `SEATMAP_SAVE/SKIP`, `PAYMENT_COMMIT`, `BOOKING_NAVIGATE`.
- Additional internal presentation-only transitions: `BOOKING_HOTEL_CONTINUE`, `BOOKING_UPSELL_CONTINUE` do not create supplier orders or bypass booking-cart validation.
- Parent receives messages in `src/pages/Booking.e8twe.js`, backed exclusively by `backend/SKANDI_CORE/customerBooking.web.js` and its existing V12 canonical core, booking-cart and provider clients.
- Canonical providers remain Supabase-owned cart data, Duffel Air/Stays, Stripe Elements and the existing confirmed-booking ALTEA handoff. No direct frontend provider API or database access.
- Cart ownership: Wix current-member authorization and owned-cart server checks. Never trust client-supplied prices or booking states. Payment capture/order authority remains exclusively server-side.
- Product limitations: the current V12 backend permits flight+hotel package selection at live offer search, not room changes after saving flight extras. It returns no live transfer options and exposes no purchasable tours/insurance catalog on the customer cart. Consequently these sections show the authoritative selected quote or an unavailable state, never mock products or invented prices.
- The merged Wix embed retains its supplied visual design, layout classes and responsive CSS. Demo toolbar, sample flight/hotel/transfer/tour arrays, fabricated ticket IDs, hardcoded itinerary, traveler identity data and false confirmation are not used.
- Last inspected: 2026-10-26. Repository baseline: `skanditravels/SKANDI-TRAVELS` `main` at `7280b532fca39e69ee84cd5be0226819a1a62d3b`; the V12 booking controller, facade, mapper and core remain canonical. Git changes are prepared in a review branch; no Wix or database changes were made.
- STATICALLY VERIFIED: Node JavaScript parsing of the replacement UI/controller; DOM-stub source-data rendering and mock-parent full booking-flow adapter tests. REQUIRES LIVE TEST: Wix page publication, login, Duffel pricing, Stripe authorization/3DS and final provider order and ALTEA handoff.

## CHANGE LOG (append-only)

- **2026-10-25** — Introduced a single combined HTML UI at `#bookingEmbed`. The canonical booking cart now controls product prices, traveler counts, supplier selections, seats, payments, supplier references and document numbers. Removed all fake customer names, passport data, mock hotel room prices, invented airline taxes and fabricated booking confirmations. One Wix page controller hosts the full on-page journey and preserves its existing backend facade and supplier ownership boundaries. Flights, package selection and hotel-only offers use the current `searchUnifiedOffers` contract. Added explicit unavailable states for product services not supported by the V12 cart. Wix installation/live verification outstanding.

- **2026-10-26** — Corrected the active route integration to a single `/booking` page and Wix HTML element `#bookingFlowEmbed`. The split `skandi-booking-flow` triplet is the Git build input; previous per-step source files are superseded historical references, not separate live pages or embeds. `/offers` is retired as a separate route.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#022e64">
<title>SKANDI Booking Flow</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<style>
:root{
  --sk-blue:#022e64;
  --sk-blue2:#0b3a7a;
  --sk-blue-soft:#285ca8;
  --sk-cyan:#5FC7CF;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-bg:#f7faff;
  --sk-border:#dbe3ef;
  --sk-border-soft:#eef2f7;
  --sk-text:#111827;
  --sk-body:#475467;
  --sk-muted:#667085;
  --sk-ok:#087443;
  --sk-warn:#a15c00;
  --sk-danger:#b42318;
  --sk-ink:#03111f;
  --sk-shadow:0 8px 26px rgba(2,46,100,.08);
  --sk-shadow-strong:0 18px 48px rgba(2,46,100,.14);
  --sk-radius:18px;
  --sk-max:1280px;
}
*{box-sizing:border-box}
html{
  background:#fff;
  scroll-behavior:smooth;
  -webkit-text-size-adjust:100%;
  text-size-adjust:100%;
}
body{
  margin:0;
  background:#fff;
  color:var(--sk-text);
  font-family:Montserrat,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:14px;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer;touch-action:manipulation}

/* Lock all form controls to >=16px globally so iOS/Android NEVER auto-zooms on focus */
input,select,textarea,.field input,.field select,.qty{
  font-size:16px !important;
}

.flow-view{display:none}
.flow-view.active-view{display:block}
.flow-shell{max-width:var(--sk-max);margin:0 auto;padding:24px 22px 68px}
.flow-stepper{
  position:relative;display:grid;
  grid-template-columns:repeat(var(--stepper-cols,8),1fr);
  gap:4px;margin:0 0 26px;padding:0 8px;
}
.flow-stepper::before{content:"";position:absolute;top:15px;left:5%;right:5%;height:2px;background:var(--sk-border)}
.flow-step{position:relative;z-index:1;text-align:center}
.flow-dot{
  width:32px;height:32px;margin:0 auto 6px;display:grid;place-items:center;
  border:2px solid var(--sk-border);border-radius:50%;background:#fff;color:var(--sk-muted);
  font-size:12px;font-weight:900;
}
.flow-step.done .flow-dot{border-color:var(--sk-blue);background:var(--sk-blue);color:#fff}
.flow-step.active .flow-dot{border-color:var(--sk-cyan);background:var(--sk-blue);color:#fff;box-shadow:0 0 0 5px rgba(95,199,207,.16)}
.flow-label{color:var(--sk-muted);font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
.flow-step.done .flow-label,.flow-step.active .flow-label{color:var(--sk-blue)}

.page-hero{
  position:relative;overflow:hidden;margin-bottom:20px;padding:26px 32px;
  border:1px solid var(--sk-border);border-radius:22px;
  background:radial-gradient(circle at 92% 0%,rgba(95,199,207,.16),transparent 28%),linear-gradient(135deg,var(--sk-blue-soft) 0%,var(--sk-blue2) 64%,var(--sk-blue) 100%);
  box-shadow:var(--sk-shadow);
}
.page-hero::after{content:"";position:absolute;left:32px;right:32px;bottom:0;height:2px;background:linear-gradient(90deg,var(--sk-cyan),rgba(209,188,152,.75),transparent)}
.eyebrow{display:flex;align-items:center;gap:10px;color:var(--sk-cyan);font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.eyebrow::before{content:"";width:28px;height:2px;border-radius:99px;background:var(--sk-cyan)}
.page-hero h1{margin:8px 0 8px;color:#fff;font-size:clamp(24px,3.6vw,38px);line-height:1.08;letter-spacing:-.03em}
.page-hero p{max-width:780px;margin:0;color:var(--sk-pale);font-size:13.5px;line-height:1.6}

.status{display:none;margin:0 0 16px;padding:12px 14px;border:1px solid var(--sk-border);border-radius:12px;background:var(--sk-bg);color:var(--sk-muted);font-size:12.5px;line-height:1.5;white-space:pre-line}
.status.show{display:block}
.status.ok{background:#ecfdf3;border-color:#abefc6;color:var(--sk-ok)}
.status.warn{background:#fffaeb;border-color:#fedf89;color:var(--sk-warn)}
.status.error{background:#fff1f0;border-color:#ffd5d2;color:var(--sk-danger)}

.panel{border:1px solid var(--sk-border);border-radius:18px;background:#fff;box-shadow:var(--sk-shadow)}
.panel-head{padding:18px 20px 15px;border-bottom:1px solid var(--sk-border-soft)}
.panel-head h2,.panel h2,.panel h3{margin:0;color:var(--sk-blue);letter-spacing:-.025em}
.panel-head h2{font-size:19px}
.panel-head p{margin:5px 0 0;color:var(--sk-body);font-size:12.5px;line-height:1.55}
.panel-body{padding:20px}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.summary-card{padding:15px;border:1px solid var(--sk-border-soft);border-radius:14px;background:linear-gradient(180deg,#fff,var(--sk-bg))}
.summary-card h3{font-size:15px}
.summary-card p{margin:6px 0 0;color:var(--sk-body);font-size:12.5px;line-height:1.5}
.kicker{margin-bottom:5px;color:var(--sk-cyan);font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
.price{color:var(--sk-blue);font-size:26px;font-weight:800;letter-spacing:-.04em}
.meta-list{display:grid;gap:7px;margin-top:10px}
.meta-row{display:flex;justify-content:space-between;gap:12px;color:var(--sk-body);font-size:12.5px}
.meta-row strong{color:var(--sk-blue);text-align:right}
.actions{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid var(--sk-border-soft)}
.actions-right{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.btn{min-height:44px;padding:0 16px;border:1px solid var(--sk-blue);border-radius:10px;background:var(--sk-blue);color:#fff;font-size:13px;font-weight:800}
.btn:hover{background:var(--sk-blue2)}
.btn.secondary{border-color:var(--sk-border);background:#fff;color:var(--sk-blue)}
.btn.secondary:hover{border-color:rgba(95,199,207,.65);background:var(--sk-pale)}
.btn:disabled{opacity:.55;cursor:not-allowed}

.field label{display:block;margin:0 0 6px;color:var(--sk-muted);font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.field input,.field select{width:100%;min-height:44px;padding:8px 12px;border:1px solid var(--sk-border);border-radius:9px;background:#fff;color:var(--sk-text);font-size:16px}
.checkline{display:flex;align-items:flex-start;gap:10px;margin-top:15px;padding:12px;border:1px solid var(--sk-border-soft);border-radius:11px;background:var(--sk-pale);color:var(--sk-body);font-size:12.5px;line-height:1.5}
.checkline input{width:18px;height:18px;flex:0 0 18px;margin-top:2px;accent-color:var(--sk-blue)}

.option-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;border:1px solid var(--sk-border);border-radius:14px;background:#fff}
.option-card.selected{border-color:var(--sk-cyan);background:var(--sk-pale)}
.option-card h3{font-size:15px}
.option-card p{margin:4px 0 0;color:var(--sk-body);font-size:12.5px;line-height:1.5}
.option-price{color:var(--sk-blue);font-size:16px;font-weight:800;white-space:nowrap}
.badge{display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border:1px solid rgba(95,199,207,.45);border-radius:999px;background:var(--sk-pale);color:var(--sk-blue);font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
.route-list{display:grid;gap:10px}
.route-item{display:grid;grid-template-columns:108px minmax(0,1fr) auto;gap:14px;align-items:center;padding:13px;border:1px solid var(--sk-border-soft);border-radius:12px;background:var(--sk-bg)}
.route-code{color:var(--sk-blue);font-size:15px;font-weight:850}
.route-main{color:var(--sk-text);font-size:12.5px;line-height:1.45}
.route-side{color:var(--sk-muted);font-size:11.5px;text-align:right}
.empty{padding:28px;border:1px dashed var(--sk-border);border-radius:14px;background:var(--sk-bg);color:var(--sk-muted);text-align:center;font-size:13px}

/* Step 1: Flight List & Cabin Matrix */
.offer-workspace{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}
.search-filter-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding:11px 15px;border:1px solid var(--sk-border);border-radius:12px;background:var(--sk-bg);font-size:12.5px;color:var(--sk-body)}
.flight-offer-block{border:1px solid var(--sk-border);border-radius:16px;background:#fff;box-shadow:var(--sk-shadow);overflow:hidden;margin-bottom:14px}
.flight-offer-block.selected-itinerary{border:2px solid var(--sk-blue)}
.flight-matrix-row{display:grid;grid-template-columns:60px minmax(120px,.9fr) minmax(200px,1.5fr) repeat(var(--cabin-cols,3),minmax(108px,1fr));align-items:stretch}
.flight-cell{padding:14px 10px;display:flex;flex-direction:column;justify-content:center}
.flight-logo-cell{align-items:center;border-right:1px solid var(--sk-border-soft);background:var(--sk-bg)}
.flight-logo-box{width:50px;height:50px;border-radius:9px;background:#fff;display:grid;place-items:center;color:var(--sk-blue);font-weight:700;font-size:12px}
.flight-logo-box img{max-width:100%;max-height:100%;object-fit:contain}
.flight-time-cell{padding-left:14px}
.flight-time-range{color:var(--sk-blue);font-size:15px;font-weight:800;white-space:nowrap}
.flight-ft-stops{margin-top:4px;color:var(--sk-muted);font-size:11px;font-weight:700;text-transform:uppercase}
.flight-route-cell{padding:14px 16px;border-right:1px solid var(--sk-border-soft)}
.flight-route-graphic{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px}
.flight-iata{color:var(--sk-blue);font-size:15px;font-weight:800}
.flight-line-wrap{position:relative;display:flex;align-items:center;justify-content:center;height:22px}
.flight-line{position:absolute;left:0;right:0;top:50%;height:2px;background:var(--sk-blue-soft);transform:translateY(-50%)}
.flight-line::after{content:"✈";position:absolute;right:12px;top:50%;transform:translateY(-52%);color:var(--sk-blue);font-size:10px}
.flight-transit-pill{position:relative;z-index:1;padding:2px 8px;border:1px solid var(--sk-cyan);border-radius:999px;background:var(--sk-blue-soft);color:var(--sk-pale);font-size:10px;font-weight:800;text-transform:uppercase}
.flight-operator{margin-top:4px;color:var(--sk-body);font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.flight-cabin-btn{border:0;border-left:1px solid var(--sk-border-soft);background:#fff;padding:12px 8px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;position:relative;border-top:1px solid var(--sk-border-soft)}
.flight-cabin-btn:hover:not(:disabled){background:var(--sk-pale)}
.flight-cabin-btn.active-cabin{background:linear-gradient(180deg,var(--sk-pale),#e7f4f7)}
.flight-cabin-btn.selected-cabin::before{content:"✓ Selected";position:absolute;top:6px;right:10px;font-size:10.5px;font-weight:800;color:var(--sk-ok)}
.flight-cabin-head{color:var(--sk-blue);font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.flight-cabin-price{margin-top:4px;color:var(--sk-blue-soft);font-size:15px;font-weight:800}
.flight-cabin-sub{margin-top:4px;color:var(--sk-muted);font-size:11px;font-weight:600}

.flight-drawer{display:none;padding:18px;background:linear-gradient(180deg,var(--sk-bg),#fff);border-top:1px solid var(--sk-blue-soft)}
.flight-drawer.open{display:block}
.flight-drawer-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.flight-drawer-title{color:var(--sk-blue);font-size:14px;font-weight:800}
.flight-cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.flight-brand-card{display:flex;flex-direction:column;justify-content:space-between;padding:14px;border:1px solid var(--sk-border);border-radius:13px;background:#fff}
.flight-brand-card.chosen{border:2px solid var(--sk-cyan);background:#f6f6f6}
.flight-brand-top{border-bottom:1px solid var(--sk-border-soft);padding-bottom:9px;margin-bottom:9px}
.flight-brand-name{color:var(--sk-blue);font-size:14px;font-weight:800;margin:4px 0}
.flight-brand-price{color:var(--sk-blue2);font-size:19px;font-weight:800}
.flight-perk-list{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:6px;font-size:12px;color:var(--sk-body);line-height:1.45}
.flight-perk-list li{display:flex;align-items:flex-start;gap:6px}
.perk-icon{flex:0 0 16px;font-weight:900;text-align:center}
.perk-ok{color:var(--sk-ok)}
.perk-warn{color:var(--sk-warn)}
.perk-no{color:var(--sk-muted)}
.flight-policy-footer{margin-top:12px;padding-top:10px;border-top:1px solid var(--sk-border-soft);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:11.5px;color:var(--sk-muted)}
.flight-policy-link{color:var(--sk-blue);font-weight:700;text-decoration:underline}

.cart-sidebar{position:sticky;top:76px;border:1px solid var(--sk-blue);background:#f6f6f6}
.cart-line-group{padding:10px 0;border-bottom:1px solid var(--sk-border-soft);display:grid;gap:6px}
.cart-line-group:first-child{padding-top:0}
.cart-subrow{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--sk-muted);padding-left:8px}
.cart-total-box{margin-top:12px;padding:13px;border-radius:12px;background:#fff;border:1px solid rgba(95,199,207,.45)}

/* Step 3: Hotel List & Room Selector */
.hotel-list-stack{display:grid;gap:14px}
.hotel-card{display:grid;grid-template-columns:235px minmax(0,1fr) 210px;border:1px solid var(--sk-border);border-radius:16px;background:#f6f6f6;box-shadow:var(--sk-shadow);overflow:hidden}
.hotel-card.selected-hotel{border:2px solid var(--sk-cyan);background:linear-gradient(90deg,#fff 0%,#f6f6f6 100%)}
.hotel-visual{min-height:195px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;color:#fff}
.hotel-stars{color:#fbbf24;font-size:12px;letter-spacing:1.5px}
.hotel-rating-pill{display:inline-flex;align-items:center;padding:4px 9px;border-radius:7px;background:rgba(2,46,100,.88);color:#fff;font-size:11px;font-weight:800}
.hotel-main{padding:18px;display:flex;flex-direction:column;justify-content:space-between}
.hotel-main h3{margin:4px 0 6px;color:var(--sk-blue);font-size:18px}
.hotel-location{color:var(--sk-blue-soft);font-size:11.5px;font-weight:700;display:flex;align-items:center;gap:4px}
.hotel-desc{margin:6px 0 10px;color:var(--sk-body);font-size:12.5px;line-height:1.55}
.hotel-amenities{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.hotel-amenity{padding:3px 8px;color:var(--sk-blue);font-size:11px;font-weight:600;background:var(--sk-pale);border-radius:6px}
.hotel-room-selector{padding:12px;border:1px solid var(--sk-border);border-radius:10px;background:#fff;margin-top:6px}
.hotel-room-selector label{display:block;margin-bottom:6px;color:var(--sk-blue);font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.hotel-room-select{width:100%;min-height:42px;padding:6px 10px;border:1px solid var(--sk-border);border-radius:8px;background:#fff;color:var(--sk-text);font-size:16px !important;font-weight:600}
.hotel-room-meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:11.5px;color:var(--sk-body)}
.hotel-side{padding:18px;border-left:1px solid var(--sk-border-soft);background:var(--sk-bg);display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;text-align:right}

/* Extras, Travelers, Seats, Payment, Done */
.extras-list,.traveler-stack,.doc-stack{display:grid;gap:12px}
.qty{width:82px;min-height:42px;border:1px solid var(--sk-border);border-radius:8px;background:#fff;color:var(--sk-blue);font-size:16px;font-weight:700;padding:0 10px}
.traveler-card{border:1px solid var(--sk-border);border-radius:16px;background:#f6f6f6;box-shadow:var(--sk-shadow)}
.rules-box{margin-bottom:14px;padding:12px;border:1px solid rgba(95,199,207,.38);border-radius:12px;background:var(--sk-pale);color:var(--sk-body);font-size:12.5px;line-height:1.55}
.required{color:var(--sk-danger)}
.seat-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:14px}
.selector{display:grid;gap:6px}
.selector button{width:100%;min-height:42px;padding:8px 12px;border:1px solid var(--sk-border);border-radius:9px;background:#fff;color:var(--sk-blue);font-size:12px;font-weight:750;text-align:left}
.selector button.active{border-color:var(--sk-cyan);background:var(--sk-pale)}
.seat-map{overflow:auto;padding:16px;border:1px solid var(--sk-border);border-radius:14px;background:var(--sk-bg)}
.seat-row{display:flex;gap:6px;align-items:center;justify-content:center;margin:6px 0;min-width:420px}
.row-num{width:26px;color:var(--sk-muted);font-size:11px;font-weight:800;text-align:right;margin-right:4px}
.seat{width:46px;min-height:44px;padding:4px;border:1px solid var(--sk-border);border-radius:8px;background:#fff;color:var(--sk-blue);font-size:11px;font-weight:850}
.seat.selected{border-color:var(--sk-blue);background:var(--sk-blue);color:#fff}
.seat:disabled{background:#eef1f4;color:#a3aab4;cursor:not-allowed}
.seat-fee{display:block;margin-top:2px;font-size:9px;opacity:.8}
.aisle{width:18px}
.legend{display:flex;gap:12px;margin-bottom:12px;color:var(--sk-muted);font-size:11px}
.payment-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:16px;align-items:start}
.secure-note{display:flex;gap:8px;align-items:flex-start;margin-top:12px;padding:10px;border:1px solid var(--sk-border-soft);border-radius:10px;background:var(--sk-bg);color:var(--sk-muted);font-size:11.5px;line-height:1.45}
.secure-dot{width:8px;height:8px;flex:0 0 8px;margin-top:2px;border-radius:50%;background:var(--sk-cyan)}
.confirmed-banner{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px;padding:16px 18px;border:1px solid #abefc6;border-radius:14px;background:#ecfdf3}
.confirmed-banner strong{color:var(--sk-ok);font-size:15px}
.confirmed-banner p{margin:3px 0 0;color:#426553;font-size:12px}
.ref{color:var(--sk-blue);font-size:22px;font-weight:900;letter-spacing:.06em}
.doc-card{border:1px solid var(--sk-border);border-radius:16px;background:#fff;box-shadow:var(--sk-shadow);overflow:hidden}
.doc-card header{display:flex;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--sk-border-soft);background:linear-gradient(180deg,#fff,var(--sk-pale))}
.doc-card header strong{color:var(--sk-blue);font-size:15px}
.doc-body{padding:18px}
.ticket{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px;border:1px solid var(--sk-border-soft);border-radius:10px;background:var(--sk-bg);margin-top:7px;font-size:12.5px}

@media(max-width:1024px){
  .offer-workspace,.hotel-card,.seat-layout,.payment-grid,.grid-2,.grid-3{grid-template-columns:1fr !important}
  .cart-sidebar{position:static}
  .hotel-side{border-left:0;border-top:1px solid var(--sk-border-soft);align-items:flex-start;text-align:left}
  .flight-matrix-row{grid-template-columns:1fr}
  .flight-cabin-btn{grid-column:span 1;border-top:1px solid var(--sk-border-soft)}
}
@media (max-width: 680px) {
  /* 2. Shell & Hero Spacing */
  .flow-shell {padding: 14px 12px 84px;}
  .page-hero {padding: 18px 16px;border-radius: 16px;margin-bottom: 14px;}
  .page-hero h1 {font-size: 22px;}
  .page-hero p {font-size: 13px;}
  .panel-head, .panel-body, .hotel-main, .hotel-side, .doc-body {padding: 14px;}
  .flow-stepper {display: flex;overflow-x: auto;justify-content: space-between;gap: 8px;padding: 4px 4px 8px;margin-bottom: 16px;scrollbar-width: none;}
  .flow-stepper::-webkit-scrollbar {display: none;}
  .flow-stepper::before {display: none;}
  .flow-step {flex: 0 0 auto;min-width: 54px;}
  .flow-dot {width: 28px;height: 28px;font-size: 11px;margin-bottom: 4px;}
  .flow-label {font-size: 9.5px;}
  .flight-matrix-row {display: flex;flex-wrap: wrap;}
  .flight-logo-cell {width: 58px;border-right: 0;background: transparent;padding: 12px 0 6px 12px;}
  .flight-logo-box {width: 40px;height: 40px;}
  .flight-time-cell {width: calc(100% - 58px);padding: 12px 12px 6px 10px;}
  .flight-route-cell {width: 100%;padding: 6px 12px 12px;border-right: 0;border-bottom: 1px solid var(--sk-border-soft);}
  .flight-line::after {right: 12px;}
  .flight-cabin-btn {flex: 1 1 calc(50% - 2px);min-height: 72px;padding: 10px 6px;border-top: 1px solid var(--sk-border-soft);}
  .flight-cabin-btn.selected-cabin::before {position: static;display: block;margin-bottom: 2px;font-size: 10px;}
  .option-card {grid-template-columns: 1fr;gap: 10px;}
  .option-card > div:last-child {justify-items: start !important;display: flex !important;justify-content: space-between;align-items: center;width: 100%;padding-top: 8px;border-top: 1px solid var(--sk-border-soft);}
  .route-item, .ticket {grid-template-columns: 1fr;gap: 6px;}
  .route-side {text-align: left;}
  .field {grid-column: span 1 !important;}
  .field input, .field select, .qty {font-size: 16px !important;min-height: 44px;}
  .field label {font-size: 11px;}
  .actions {flex-direction: column-reverse;align-items: stretch;}
  .actions-right {flex-direction: column;width: 100%;margin-left: 0;}
  .actions .btn {width: 100%;min-height: 46px;font-size: 14px;}
  .seat-map {padding: 12px 8px; -webkit-overflow-scrolling: touch;}
  .seat-row {min-width: 320px;}
}
</style>
</head>
<body>

<!-- STEP 1: OFFER (FLIGHT LIST) -->
<div class="flow-view active-view" id="view-offer">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · STEP 1 · FLIGHT SEARCH RESULTS</div>
      <h1>Select your flight</h1>
    </section>
    <div id="status-offer" class="status show"></div>
    <main id="root-offer"></main>
  </div>
</div>

<!-- STEP 2: EXTRAS -->
<div class="flow-view" id="view-extras">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · STEP 2 · FLIGHT EXTRAS</div>
      <h1>Make the trip yours</h1>
    </section>
    <div id="status-extras" class="status show"></div>
    <main id="root-extras"></main>
  </div>
</div>

<!-- STEP 3: HOTEL LIST (ADDED AFTER EXTRAS) -->
<div class="flow-view" id="view-hotels">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow" id="hotelEyebrow">BOOKING · STEP 3 · HOTELS</div>
      <h1 id="hotelTitle">Your hotel selection</h1>
      <p id="hotelDesc">Hotel details and availability are supplied by the selected live booking offer.</p>
    </section>
    <div id="status-hotels" class="status show"></div>
    <main id="root-hotels"></main>
  </div>
</div>

<!-- STEP 4: ARRIVAL TRANSFER -->
<div class="flow-view" id="view-transfer">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · SKANDI TRANSFER</div>
      <h1>Arrival transfers</h1>
      <p>Available transfer services for your selected trip appear below.</p>
    </section>
    <div id="status-transfer" class="status show"></div>
    <main id="root-transfer"></main>
  </div>
</div>

<!-- STEP 5 (PACKAGE CONDITIONAL): TOURS, ACTIVITIES & INSURANCE UPSELL -->
<div class="flow-view" id="view-upsell">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">PACKAGE ENHANCEMENTS · TOURS, ACTIVITIES & PROTECTION</div>
      <h1>Destination experiences & travel insurance</h1>
    </section>
    <div id="status-upsell" class="status show"></div>
    <main id="root-upsell"></main>
  </div>
</div>

<!-- STEP 6: TRAVELERS / APIS -->
<div class="flow-view" id="view-apis">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · TRAVELERS & APIS</div>
      <h1>Who is travelling?</h1>
    </section>
    <div id="status-apis" class="status show"></div>
    <main id="root-apis"></main>
  </div>
</div>

<!-- STEP 7: SEATS -->
<div class="flow-view" id="view-seats">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · SEAT SELECTION</div>
      <h1>Choose your seats</h1>
    </section>
    <div id="status-seats" class="status show"></div>
    <main id="root-seats"></main>
  </div>
</div>

<!-- STEP 8: PAYMENT -->
<div class="flow-view" id="view-payment">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · SECURE PAYMENT</div>
      <h1>Checkout</h1>
    </section>
    <div id="status-payment" class="status show"></div>
    <main id="root-payment"></main>
  </div>
</div>

<!-- STEP 9A: CONFIRMATION -->
<div class="flow-view" id="view-confirmation">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · DONE</div>
      <h1>You're booked</h1>
      <p>Your confirmed reservation and supplier references appear below once the provider has confirmed your booking.</p>
    </section>
    <div id="status-confirmation" class="status show"></div>
    <main id="root-confirmation"></main>
  </div>
</div>

<!-- STEP 9B: TRAVEL DOCUMENTS -->
<div class="flow-view" id="view-documents">
  <div class="flow-shell">
    <div class="flow-stepper"></div>
    <section class="page-hero">
      <div class="eyebrow">BOOKING · DONE</div>
      <h1>Travel documents</h1>
      <p>Available confirmed itinerary and supplier-issued documents.</p>
    </section>
    <div id="status-documents" class="status show"></div>
    <main id="root-documents"></main>
  </div>
</div>

<script src="https://js.stripe.com/v3/"></script>
<script>
(()=>{
'use strict';
const SOURCE='SKANDI_BOOKING_OFFER', PARENT='SKANDI_WIX_PARENT';
const STEP_NAMES={offer:'Offer',extras:'Extras',hotels:'Hotel',transfer:'Transfer',upsell:'Experiences',apis:'Travelers',seats:'Seats',payment:'Payment',confirmation:'Confirmed',documents:'Documents'};
const steps=['offer','extras','hotels','transfer','upsell','apis','seats','payment','confirmation','documents'];
const S={step:'offer',search:null,offers:[],cart:null,extras:[],selectedExtras:new Map(),transfers:[],selectedTransfer:null,seatMaps:[],seatTravelers:[],seatSelections:{},activeSeatMap:0,activeSeatTraveler:0,rules:null,travelers:[],contact:{},payment:null,confirmation:null,documents:null,awaiting:false,initializing:true,canBackToResults:false,paymentBusy:false,paymentSubmitted:false,stripe:null,elements:null,paymentElement:null,handshakeSeen:false};
const el=id=>document.getElementById(id);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=x=>Array.isArray(x)?x:[];
const num=v=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
const cash=(v,c=S.cart?.currency||S.search?.currency||'USD')=>{const n=num(v);if(n===null)return '—';try{return new Intl.NumberFormat(undefined,{style:'currency',currency:c}).format(n)}catch{return `${esc(c)} ${n.toFixed(2)}`}};
const str=(v,f='')=>String(v??f);
const price=x=>{if(x&&typeof x==='object')return cash(x.amount??x.totalAmount??x.total,x.currency??x.totalCurrency??S.cart?.currency);return cash(x)};
const dt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):esc(d.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}))};
const day=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):esc(d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}))};
const url=x=>{try{const u=new URL(str(x));return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
const card=(title,body,cls='')=>`<article class="panel ${cls}"><div class="panel-head"><h2>${esc(title)}</h2></div><div class="panel-body">${body}</div></article>`;
const message=(t,body={})=>{window.parent.postMessage({source:SOURCE,type:t,...body},'*')};
const status=(text,kind='',step=S.step)=>{const e=el('status-'+step);if(!e)return;e.textContent=text||'';e.className='status'+(text?' show':'')+(kind?' '+kind:'')};
function busy(t){S.awaiting=!!t;document.querySelectorAll('.flow-view.active-view button').forEach(b=>{if(!b.dataset.localNav)b.disabled=S.awaiting});}
function fail(msg){busy(false);status(msg||'The booking request could not be completed.','error')}
function tripMode(){return String(S.cart?.productType||S.search?.tripType||'FLIGHT').toUpperCase()}
function hasHotel(){return !!(S.cart?.hotel?.quote||S.cart?.stayQuote)}
function isHotelOnly(){return tripMode()==='HOTEL_ONLY'}
function isPackage(){return ['PACKAGE','MIXED_PACKAGE','SIGNATUREPACKAGE'].includes(tripMode())||Boolean(S.cart?.hotel)}
function isNoFlight(){return isHotelOnly()||tripMode()==='CAR_RENTAL_ONLY'}
function currency(){return S.cart?.currency||S.search?.currency||'USD'}
function firstLast(x){const slices=arr(x?.slices),segments=slices.flatMap(s=>arr(s.segments));return [segments[0]||null,segments[segments.length-1]||null]}
function endpoint(x){if(!x)return '';return str(x.iataCode||x.iata||x.code||x.name||x)}
function travelDate(){const s=S.cart?.search||S.search||{};return [s.departureDate||s.checkInDate,s.returnDate||s.checkOutDate].filter(Boolean).map(day).join(' – ')}
function summary(){const c=S.cart;if(!c)return '';const o=c.selectedOffer||{};const f=firstLast(o);const from=endpoint(f[0]?.origin)||endpoint(c.search?.origin);const to=endpoint(f[1]?.destination)||endpoint(c.search?.destination);return [from&&to?`${from} → ${to}`:o.routeSummary||o.title||c.productType,travelDate()].filter(Boolean).join(' · ')}
function cartPanel(){const c=S.cart;if(!c)return card('Trip summary','<div class="empty">Select a live offer to begin.</div>','cart-sidebar');return `<aside class="panel cart-sidebar"><div class="panel-head"><div class="kicker">YOUR SKANDI CART</div><h2>Price & tax breakdown</h2><p>${esc(summary())}</p></div><div class="panel-body"><div class="meta-list"><div class="meta-row"><span>Product</span><strong>${esc(c.productType||'Trip')}</strong></div><div class="meta-row"><span>Subtotal</span><strong>${cash(c.subtotal,c.currency)}</strong></div><div class="meta-row"><span>Taxes and charges</span><strong>${cash(c.taxes,c.currency)}</strong></div>${arr(c.extras).map(x=>`<div class="meta-row"><span>${esc(x.title||'Selected extra')} × ${esc(x.quantity||1)}</span><strong>${cash(x.amount,x.currency||c.currency)}</strong></div>`).join('')}</div><div class="cart-total-box"><div class="kicker">PROVIDER-QUOTED TOTAL</div><div class="price">${cash(c.total,c.currency)}</div></div><p class="secure-note">Rates and availability can change until the provider confirms the order.</p></div></aside>`}
function action(back,next,backText='Back',nextText='Continue',extra=''){return `<div class="actions">${back?`<button type="button" class="btn secondary" data-action="${esc(back)}">← ${esc(backText)}</button>`:'<span></span>'}<div class="actions-right">${extra}<button class="btn" type="button" data-action="${esc(next)}" ${S.awaiting?'disabled':''}>${esc(nextText)} →</button></div></div>`}
function visibleSteps(){return steps.filter(s=>s!=='upsell'||isPackage()).filter(s=>s!=='hotels'||isPackage()||tripMode()==='FLIGHT_ONLY').filter(s=>s!=='documents')}
function renderStepper(){const ss=visibleSteps();document.querySelectorAll('.flow-stepper').forEach(root=>{root.style.setProperty('--stepper-cols',ss.length);let ix=ss.indexOf(S.step);if(S.step==='documents')ix=ss.length-1;root.innerHTML=ss.map((x,i)=>`<div class="flow-step ${i<ix?'done':''} ${i===ix?'active':''}"><div class="flow-dot">${i<ix?'✓':i+1}</div><div class="flow-label">${esc(STEP_NAMES[x])}</div></div>`).join('')})}
function setStep(step){if(!steps.includes(step))return;if(S.step==='payment'&&step!=='payment'){destroyStripe();S.paymentIntentMounted=null}S.step=step;document.querySelectorAll('.flow-view').forEach(e=>e.classList.toggle('active-view',e.id==='view-'+step));renderStepper();render();try{window.scrollTo(0,0)}catch{}}
function hostNext(t,body){if(S.awaiting)return;busy(true);status('Saving your selection…');message(t,body)}
function offerTile(x){const id=str(x.id||x.offerId||x.staySearchResultId);
  if(str(x.itemType||x.productType).toUpperCase()==='HOTEL'){
    const a=x.accommodation||{},img=url(x.imageUrl||a.photos?.[0]),name=x.title||x.name||a.name||'Accommodation';
    const cost=x.price?.amount??x.cheapestRateTotalAmount??x.total;
    const currencyCode=x.price?.currency||x.cheapestRateTotalCurrency||x.currency||currency();
    return `<article class="hotel-card"><div class="hotel-visual" style="${img?`background:linear-gradient(0deg,rgba(2,46,100,.65),rgba(2,46,100,.08)),url('${esc(img)}') center / cover`:'background:var(--sk-blue)'}"><div class="kicker" style="color:white">LIVE HOTEL</div></div><div class="hotel-main"><h3>${esc(name)}</h3><div class="hotel-location">${esc([a.address?.line1,a.address?.city].filter(Boolean).join(', '))}</div><p class="hotel-desc">${esc(x.summary||a.description||'')}</p><div class="hotel-room-meta"><span>Check-in: ${day(x.checkInDate||S.search?.checkInDate||S.search?.departureDate)}</span><span>Check-out: ${day(x.checkOutDate||S.search?.checkOutDate||S.search?.returnDate)}</span></div></div><div class="hotel-side"><div class="option-price">${cash(cost,currencyCode)}</div><button type="button" class="btn" data-action="select-offer" data-id="${esc(id)}">Select live rate →</button></div></article>`;
  }
  const flight=x.flight||x,stay=x.stay||null,[a,z]=firstLast(flight),operator=flight.owner?.name||flight.owner?.iataCode||flight.provider||x.sourceLabel||'',source=str(x.itemType||'').toLowerCase();const isFlight=!!a;const carry=arr(flight.slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages||flight.baggages);const extras=stay?`<p class="hotel-desc"><strong>Included hotel:</strong> ${esc(stay.title||stay.name||stay.accommodation?.name||'Accommodation')} · ${esc(stay.summary||'')}</p>`:'';const label=x.title||x.routeSummary||x.name||x.accommodation?.name||'Live travel option';const amt=x.price?.amount??x.totalAmount??x.total??x.cheapestRateTotalAmount;const curr=x.price?.currency||x.totalCurrency||x.currency||currency();const logo=url(flight.owner?.logoSymbolUrl||flight.owner?.logo_symbol_url);return `<article class="flight-offer-block"><div style="padding:9px 14px;border-bottom:1px solid var(--sk-border-soft);font-weight:800;color:var(--sk-blue)">${esc(label)}</div><div class="flight-matrix-row" style="--cabin-cols:1"><div class="flight-cell flight-logo-cell"><div class="flight-logo-box">${logo?`<img src="${esc(logo)}" alt="${esc(operator)}">`:esc(flight.owner?.iataCode||'SKANDI')}</div></div><div class="flight-cell flight-time-cell"><div class="flight-time-range">${isFlight?`${dt(a.departingAt)} – ${dt(z.arrivingAt)}`:esc(source==='hotel'?'Hotel stay':'Trip option')}</div><div class="flight-ft-stops">${esc(operator)}</div></div><div class="flight-cell flight-route-cell"><div class="flight-route-graphic"><span class="flight-iata">${esc(endpoint(a?.origin)||'')}</span><div class="flight-line-wrap"><div class="flight-line"></div></div><span class="flight-iata">${esc(endpoint(z?.destination)||'')}</span></div><div class="flight-operator">${esc(flight.routeSummary||flight.fareBrandName||x.summary||'')}</div>${extras}</div><button type="button" class="flight-cabin-btn" data-action="select-offer" data-id="${esc(id)}"><span class="flight-cabin-head">${esc(flight.cabinClassMarketingName||flight.cabinClass||source||'Option')}</span><span class="flight-cabin-price">${cash(amt,curr)}</span><span class="flight-cabin-sub">Select live offer →</span></button></div></article>`}
function renderOffer(){const c=S.cart;if(!c){const items=S.offers;el('root-offer').innerHTML=`<div class="offer-workspace"><section><div class="search-filter-bar"><strong>${esc([S.search?.origin||S.search?.from,S.search?.destination||S.search?.to].filter(Boolean).join(' → ')||'Travel search')}</strong><span>${esc(items.length)} live results</span></div>${items.length?items.map(offerTile).join(''):'<div class="empty">No live offers are available for these search criteria. Change the search on Home and try again.</div>'}${action(null,'refresh-results','','Refresh availability')}</section>${cartPanel()}</div>`;status(items.length?`${items.length} provider result(s). Select a current offer.`:'No provider offers returned.',items.length?'ok':'warn');return}const selected=c.selectedOffer||{};const p=c.hotel?.quote||c.stayQuote||{};el('root-offer').innerHTML=`<div class="offer-workspace"><section>${card('Your selected live offer',`<div class="summary-card"><h3>${esc(selected.routeSummary||selected.title||summary()||c.productType||'Selected travel')}</h3><div class="meta-list"><div class="meta-row"><span>Fare / rate</span><strong>${esc(selected.fareBrandName||selected.cabinClassMarketingName||'Provider offer')}</strong></div><div class="meta-row"><span>Travel dates</span><strong>${esc(travelDate())}</strong></div>${p?.id?`<div class="meta-row"><span>Hotel quote</span><strong>${esc(p.accommodation?.name||p.room?.name||p.id)}</strong></div>`:''}<div class="meta-row"><span>Status</span><strong>${esc(c.status)}</strong></div></div></div><label class="checkline"><input id="offerTerms" type="checkbox"><span>I accept the supplier's fare/rate conditions and applicable SKANDI booking terms.</span></label>${action(S.canBackToResults?'back-to-results':'back-home','offer-accepted',S.canBackToResults?'Other offers':'Home','Continue to extras')}`)}</section>${cartPanel()}</div>`;status('Current offer loaded from the SKANDI booking cart.','ok')}
function renderExtras(){const items=S.extras;const saved=S.selectedExtras;el('root-extras').innerHTML=`<div class="offer-workspace"><section>${card('Optional flight extras',`<div class="extras-list">${items.length?items.map(x=>{const id=str(x.serviceId||x.id),q=saved.get(id)||0;const limit=Math.max(1,Math.min(20,Number(x.maximumQuantity||1)));return `<div class="option-card ${q?'selected':''}"><input type="checkbox" data-extra="${esc(id)}" ${q?'checked':''}><div><h3>${esc(x.title||'Baggage')}</h3><p>${esc(x.description||'')}</p></div><div><div class="option-price">${price(x.price)}</div><select class="qty" data-qty="${esc(id)}" ${q?'':'disabled'}>${Array.from({length:limit},(_,i)=>`<option value="${i+1}" ${q===i+1?'selected':''}>× ${i+1}</option>`).join('')}</select></div></div>`}).join(''):'<div class="empty">There are no additional services available from this airline offer.</div>'}</div>${action('nav-offer','extras-save','Offer','Continue')}`)}</section>${cartPanel()}</div>`;status('Only live services returned by the supplier can be selected.','ok')}
function renderHotels(){const c=S.cart,quote=c?.hotel?.quote||c?.stayQuote,accom=quote?.accommodation||{};const details=quote?`<article class="hotel-card selected-hotel" style="display:block"><div class="hotel-main"><h3>${esc(accom.name||quote.hotelName||quote.room?.name||'Included accommodation')}</h3><p class="hotel-desc">${esc([accom.address?.line1,accom.address?.city].filter(Boolean).join(', '))}</p><div class="meta-list"><div class="meta-row"><span>Room or quote</span><strong>${esc(quote.room?.name||quote.id)}</strong></div><div class="meta-row"><span>Stay dates</span><strong>${esc(travelDate())}</strong></div><div class="meta-row"><span>Quoted total</span><strong>${cash(quote.totalAmount,quote.totalCurrency||currency())}</strong></div></div></div></article>`:'<div class="empty">No hotel was included in this booked offer. Standalone hotel upsells are not currently connected to the V12 booking-cart contract. No room has been added or charged.</div>';el('root-hotels').innerHTML=`<div class="offer-workspace"><section>${card(quote?'Hotel selected in your live package':'Hotel options',details+action('nav-extras','hotel-continue','Extras','Continue to transfer'))}</section>${cartPanel()}</div>`;status(quote?'Hotel quote supplied by the live provider.': 'No hotel inventory has been assigned to this cart.',quote?'ok':'warn');el('hotelTitle').textContent=quote?'Your included hotel':'Hotel options';el('hotelDesc').textContent=quote?'The room and price shown are from your selected provider quote. Room changes require a new package offer.':'Optional hotel booking is unavailable in this checkout; no invented choices are shown.'}
function renderTransfer(){const xs=S.transfers;el('root-transfer').innerHTML=`<div class="offer-workspace"><section>${card('Arrival transfer options',`${xs.length?xs.map(x=>{const id=str(x.id);return `<label class="option-card"><input type="radio" name="transfer" value="${esc(id)}" ${S.selectedTransfer===id?'checked':''}><div><h3>${esc(x.title||x.name||'Transfer')}</h3><p>${esc(x.description||'')}</p></div><div class="option-price">${price(x.price||x.amount)}</div></label>`}).join(''):'<div class="empty">There are no live transfer services for this booking.</div>'}${action('nav-hotels','transfer-continue','Back','Continue',xs.length?'<button type="button" class="btn secondary" data-action="transfer-skip">Skip transfer</button>':'')}`)}</section>${cartPanel()}</div>`;status(xs.length?'Choose from the available SKANDI transfer products.':'No live transfer availability. You can continue without a transfer.',xs.length?'ok':'warn')}
function renderUpsell(){el('root-upsell').innerHTML=`<div class="offer-workspace"><section>${card('Destination experiences & protection',`<div class="empty">No inventory-backed tours, activities, or insurance are attached to this booking cart. Nothing has been selected or charged.</div>${action('nav-transfer','upsell-continue','Transfer','Continue to travelers')}`)}</section>${cartPanel()}</div>`;status('No eligible ancillary catalog is currently exposed by this booking service.','warn')}
function travelerCount(){const o=S.cart?.selectedOffer||{};const n=arr(o.passengers).length||Number(S.cart?.travelerCount)||Number(S.cart?.search?.passengers?.length)||Number(S.search?.adults)||1;return Math.min(12,Math.max(1,n))}
function renderApis(){const c=S.cart||{};const hotelOnly=isHotelOnly();const numTrav=hotelOnly?Math.max(1,Number(c.travelerCount)||Number(c.search?.adults)||1):travelerCount();while(S.travelers.length<numTrav)S.travelers.push({});if(S.travelers.length>numTrav)S.travelers.length=numTrav;const p=arr(c.selectedOffer?.passengers);const fields=S.travelers.map((t,i)=>`<article class="traveler-card"><div class="panel-head"><h2>${hotelOnly?'Guest':'Traveler'} ${i+1}</h2></div><div class="panel-body"><div class="grid-3"><div class="field"><label>Title</label><select data-pax="${i}" data-field="title"><option value="">Choose</option>${['mr','ms','mrs','miss','dr'].map(v=>`<option ${t.title===v?'selected':''} value="${v}">${v.toUpperCase()}</option>`).join('')}</select></div><div class="field"><label>Given name</label><input autocomplete="given-name" data-pax="${i}" data-field="givenName" value="${esc(t.givenName||'')}"></div><div class="field"><label>Family name</label><input autocomplete="family-name" data-pax="${i}" data-field="familyName" value="${esc(t.familyName||'')}"></div>${hotelOnly?'':`<div class="field"><label>Date of birth</label><input type="date" data-pax="${i}" data-field="bornOn" max="${new Date().toISOString().slice(0,10)}" value="${esc(t.bornOn||'')}"></div><div class="field"><label>Gender (required by supplier)</label><select data-pax="${i}" data-field="gender"><option value="">Select</option><option value="m" ${t.gender==='m'?'selected':''}>Male</option><option value="f" ${t.gender==='f'?'selected':''}>Female</option></select></div><div class="field"><label>Nationality (ISO 2-letter)</label><input data-pax="${i}" data-field="nationality" maxlength="2" value="${esc(t.nationality||'')}"></div><div class="field"><label>Document number</label><input data-pax="${i}" data-field="documentNumber" value="${esc(t.documentNumber||'')}"></div><div class="field"><label>Document issuing country (ISO 2-letter)</label><input data-pax="${i}" data-field="documentCountry" maxlength="2" value="${esc(t.documentCountry||'')}"></div><div class="field"><label>Document expiry</label><input type="date" data-pax="${i}" data-field="documentExpiry" value="${esc(t.documentExpiry||'')}"></div>`}</div></div></article>`).join('');el('root-apis').innerHTML=`<div class="offer-workspace"><section>${S.rules?.summary?`<div class="rules-box">${esc(S.rules.summary)}</div>`:''}<div class="traveler-stack">${fields}</div>${card('Booking contact',`<div class="grid-2"><div class="field"><label>Email address</label><input type="email" id="contactEmail" autocomplete="email" value="${esc(S.contact.email||'')}"></div><div class="field"><label>Phone number (+international format)</label><input type="tel" id="contactPhone" autocomplete="tel" value="${esc(S.contact.phoneNumber||'')}"></div></div>${action(isPackage()?'nav-upsell':'nav-transfer','apis-save','Back','Save travelers')}`)}</section>${cartPanel()}</div>`;status('Travel document details are sent only to the authorized SKANDI backend.','ok')}
function seatServices(map){return arr(map?.seats).flatMap(seat=>arr(seat.availableServices).map(s=>({...s,designator:seat.designator,segmentId:s.segmentId||map.segmentId||map.id,cabinName:seat.cabinName}))).filter(x=>x.id||x.serviceId)}
function renderSeats(){if(isNoFlight()||S.seatMaps.length===0){el('root-seats').innerHTML=`<div class="offer-workspace"><section>${card('Seat selection',`<div class="empty">${esc(isNoFlight()?'Seats are not applicable to your hotel booking.':'Online seat selection is not selectable for this flight. Seats will be provided when Check-In opens. ')}</div>${action('nav-apis','seats-skip','Travelers','Continue without seats')}`)}</section>${cartPanel()}</div>`;status('No selectable seat services are available.','warn');return}const m=S.seatMaps[S.activeSeatMap]||S.seatMaps[0];const travelers=S.seatTravelers;const t=travelers[S.activeSeatTraveler];const services=seatServices(m).filter(s=>!s.passengerId||str(s.passengerId)===str(t?.id||t?.travelerId));const rows=new Map();for(const s of services){let row=(str(s.designator).match(/^\d+/)||['Other'])[0];if(!rows.has(row))rows.set(row,[]);rows.get(row).push(s)}const selected=new Set(Object.values(S.seatSelections).map(x=>str(x.segmentId)+':'+str(x.designator)));el('root-seats').innerHTML=`<div class="offer-workspace"><section>${card('Choose your seats',`<div class="seat-layout"><div class="selector"><div class="kicker">Flight segment</div>${S.seatMaps.map((x,i)=>`<button data-action="seat-map" data-index="${i}" class="${i===S.activeSeatMap?'active':''}">${esc(x.segmentId||x.id||'Segment '+(i+1))}</button>`).join('')}<div class="kicker" style="margin-top:12px">Traveler</div>${travelers.map((x,i)=>`<button data-action="seat-traveler" data-index="${i}" class="${i===S.activeSeatTraveler?'active':''}">${esc(x.label||[x.firstName,x.lastName].filter(Boolean).join(' ')||'Traveler '+(i+1))}</button>`).join('')}</div><div><div class="legend"><span>White: Available</span><span>Navy: Selected</span><span>Gray: Unavailable</span></div><div class="seat-map">${[...rows.entries()].map(([r,ss])=>`<div class="seat-row"><span class="row-num">${esc(r)}</span>${ss.map(s=>{const id=str(s.serviceId||s.id),key=`${str(t?.id||t?.travelerId)}:${str(s.segmentId)}`;const chosen=S.seatSelections[key]?.serviceId===id;const occupied=selected.has(str(s.segmentId)+':'+str(s.designator))&&!chosen;const price=s.totalAmount??s.price?.amount;return `<button class="seat ${chosen?'selected':''}" type="button" data-action="seat-choose" data-id="${esc(id)}" data-segment="${esc(s.segmentId||'')}" ${occupied?'disabled':''} title="${esc(s.designator)}">${esc(s.designator)}<span class="seat-fee">${price!==undefined?cash(price,s.totalCurrency||s.price?.currency||currency()):''}</span></button>`}).join('')}</div>`).join('')||'<div class="empty">No available seats for this segment.</div>'}</div></div></div>${action('nav-apis','seats-save','Travelers','Save seat selections','<button type="button" class="btn secondary" data-action="seats-skip">Skip seats</button>')}`)}</section>${cartPanel()}</div>`;status('Only airline-provided seat service IDs can be selected.','ok')}
function destroyStripe(){try{S.paymentElement?.unmount()}catch{}S.paymentElement=null;S.stripe=null;S.elements=null}
function renderPayment(){const p=S.payment?.payment||S.payment||{},c=S.payment?.cart||S.cart||{};if(!p.clientSecret||!p.publishableKey||!p.paymentIntentId||!window.Stripe){el('root-payment').innerHTML=card('Secure checkout','<div class="empty">Secure payment is unavailable or still initializing. Do not submit another payment until the current booking status has been checked.</div>'+action('nav-seats','payment-status','Seats','Check booking status'));status('The payment session must be returned by the backend.','warn');return}if(S.paymentIntentMounted===p.paymentIntentId&&S.paymentElement)return;destroyStripe();S.paymentIntentMounted=p.paymentIntentId;el('root-payment').innerHTML=`<div class="payment-grid">${card('Secure payment',`<p>Amount to authorize: <strong>${cash(p.amount,p.currency||c.currency||currency())}</strong></p><div id="payment-element" style="min-height:110px;margin-top:18px"></div><label class="checkline"><input type="checkbox" id="payTerms"><span>I accept the booking terms, provider conditions, applicable cancellation and refund rules, privacy policy, and payment terms.</span></label><div class="secure-note"><span class="secure-dot"></span>Payment details are handled by the secure payment processor.</div>${action('nav-seats','payment-submit','Seats','Authorize payment','<button type="button" class="btn secondary" data-action="payment-status">Check booking status</button>')}`)}${cartPanel()}</div>`;try{S.stripe=window.Stripe(p.publishableKey);S.elements=S.stripe.elements({clientSecret:p.clientSecret,appearance:{theme:'stripe',variables:{colorPrimary:'#022e64',borderRadius:'10px'}}});S.paymentElement=S.elements.create('payment',{layout:'tabs'});S.paymentElement.mount('#payment-element');S.paymentElement.on('loaderror',()=>fail('The secure payment form could not be loaded.'))}catch{fail('Secure payment could not be initialized.')}status('Authorize payment to proceed. Do not reload the page','ok')}
function renderConfirmation(){const v=S.confirmation||{},conf=v.confirmation||v;const segments=arr(conf.segments);el('root-confirmation').innerHTML=card(conf.status==='Confirmed'?'Booking confirmed':'Booking status',`<div class="confirmed-banner"><div><strong>${esc(conf.title||'Confirmed booking')}</strong><p>${esc(conf.summary||'')}</p></div><div class="ref">${esc(conf.bookingReference||'')}</div></div><div class="meta-list"><div class="meta-row"><span>SKANDI reference</span><strong>${esc(conf.bookingReference||'Not provided')}</strong></div><div class="meta-row"><span>PNR </span><strong>${esc(conf.pnrLocator||'Not provided')}</strong></div><div class="meta-row"><span>Supplier order</span><strong>${esc(conf.orderId||'Not provided')}</strong></div><div class="meta-row"><span>Status</span><strong>${esc(conf.status||'Not confirmed')}</strong></div></div>${segments.length?`<div class="route-list" style="margin-top:16px">${segments.map(s=>`<div class="route-item"><div class="route-code">${esc(s.flightNumber||'Flight')}</div><div class="route-main">${esc(endpoint(s.origin))} → ${esc(endpoint(s.destination))}</div><div class="route-side">${dt(s.departingAt)}<br>${dt(s.arrivingAt)}</div></div>`).join('')}</div>`:''}${action('back-home','open-documents','Home','Travel documents')}`);status('')}
function renderDocuments(){const payload=S.documents||{},d=payload.documents||{},conf=d.confirmation||S.confirmation?.confirmation||S.confirmation||{},ticket=d.eTickets||{};const docs=arr(ticket.documents);const slices=arr(d.itinerary?.slices);el('root-documents').innerHTML=`<div class="doc-stack">${card('Booking confirmation',`<div class="meta-row"><span>Booking reference</span><strong>${esc(conf.bookingReference||'Not available')}</strong></div><div class="meta-row"><span>Status</span><strong>${esc(conf.status||'Not issued')}</strong></div>`)}${card('Airline documents',docs.length?docs.map(x=>`<div class="ticket"><span>${esc(x.type||'Airline document')}</span><strong>${esc(x.ticketNumber||'Identifier not provided')}</strong></div>`).join(''):`<div class="empty">${esc(ticket.note||'No airline ticket documents were returned by the supplier.')}</div>`)}${slices.length?card('Itinerary',slices.map(x=>`<div class="ticket">${esc(x.origin?.iataCode||'')} → ${esc(x.destination?.iataCode||'')}</div>`).join('')):''}${action('nav-confirmation','print-documents','Confirmation','Print / Download PDF')}</div>`;status('Only provider-supplied document identifiers are displayed.','ok')}
function render(){if(S.step==='offer')renderOffer();else if(S.step==='extras')renderExtras();else if(S.step==='hotels')renderHotels();else if(S.step==='transfer')renderTransfer();else if(S.step==='upsell')renderUpsell();else if(S.step==='apis')renderApis();else if(S.step==='seats')renderSeats();else if(S.step==='payment')renderPayment();else if(S.step==='confirmation')renderConfirmation();else if(S.step==='documents')renderDocuments()}
function handleHost(m){if(!m||m.source!==PARENT)return;const p=m.payload||{};if(m.type==='BOOKING_HOST_READY'){S.initializing=false;if(!S.handshakeSeen){S.handshakeSeen=true;message('BOOKING_OFFER_READY')}return}if(m.type==='BOOKING_STEP_ACTIVE'){busy(false);if(m.payload?.cart)S.cart=m.payload.cart;setStep(p.step||'offer');return}if(m.type==='BOOKING_SEARCH_LOADING'){S.search=p.search||S.search;setStep('offer');status('Searching live availability…');return}if(m.type==='BOOKING_SEARCH_RESULTS'){busy(false);S.offers=arr(p.items);S.search=p.search||S.search;S.canBackToResults=true;S.cart=null;setStep('offer');return}if(m.type==='BOOKING_CART_LOADED'){busy(false);S.cart=p.cart||null;S.search=S.cart?.search||S.search;setStep('offer');return}if(m.type==='BOOKING_EXTRAS_LOADED'){busy(false);S.cart=p.cart||S.cart;S.extras=arr(p.items);S.selectedExtras=new Map(arr(p.selectedExtras).map(x=>[str(x.id||x.serviceId),Number(x.quantity)||1]));setStep('extras');return}if(m.type==='SIGNATURE_TRANSFER_OPTIONS'){busy(false);S.transfers=arr(p.options);setStep('transfer');return}if(m.type==='APIS_CART_RULES_LOADED'){busy(false);S.cart=p.cart||S.cart;S.rules=p.rules||null;const all=arr(S.cart?.travelers);if(all.length)S.travelers=all.map(x=>({...x}));setStep('apis');return}if(m.type==='APIS_REQUIREMENTS_RESULT'){S.rules=p.rules||S.rules;renderApis();return}if(m.type==='SEATMAP_LOADED'){busy(false);S.seatMaps=arr(p.seatMaps);S.seatTravelers=arr(p.travelers);S.seatSelections=p.existingSelections||{};S.activeSeatMap=0;S.activeSeatTraveler=0;setStep('seats');return}if(m.type==='PAYMENT_SESSION_LOADED'){busy(false);S.payment=p;S.cart=p.cart||S.cart;S.paymentIntentMounted=null;setStep('payment');return}if(m.type==='PAYMENT_PROGRESS'){busy(true);status(m.message||'Verifying the payment and supplier booking…','warn','payment');return}if(m.type==='CONFIRMATION_LOADED'){busy(false);S.confirmation=p.confirmation||p;setStep('confirmation');return}if(m.type==='BOOKING_DOCUMENTS_LOADED'){busy(false);S.documents=p;setStep('documents');return}if(m.type==='BOOKING_ERROR'){fail(m.message||p.message||'Booking request unsuccessful.');return}}
window.addEventListener('message',ev=>{if(ev.source!==window.parent)return;handleHost(ev.data)});
function postStep(step){message('BOOKING_NAVIGATE',{path:'/booking/'+step})}
async function submitPayment(){if(S.paymentBusy||S.paymentSubmitted)return;const p=S.payment?.payment||{};if(!el('payTerms')?.checked){status('Accept the applicable payment and booking terms first.','warn');return}if(!p.paymentIntentId||!S.stripe||!S.elements){status('No secure payment session is available.','error');return}S.paymentBusy=true;busy(true);try{let intent=null;if(['requires_capture','succeeded'].includes(p.status)){intent={id:p.paymentIntentId,status:p.status}}else{const r=await S.stripe.confirmPayment({elements:S.elements,redirect:'if_required',confirmParams:{return_url:'https://www.skanditravels.com/booking?step=payment&cartId='+encodeURIComponent(S.cart?.cartId||'')}});if(r.error){status(r.error.message||'Payment could not be authorized.','error');return}intent=r.paymentIntent}if(!intent||!['requires_capture','succeeded'].includes(intent.status)){status('Payment processing or status is unclear. Check the existing booking status before retrying.','warn');return}S.paymentSubmitted=true;message('PAYMENT_COMMIT',{termsAccepted:true,paymentIntentId:intent.id});status('Finalizing your supplier booking…','warn')}catch{status('Payment status could not be verified. Check the booking status before retrying.','error')}finally{S.paymentBusy=false;busy(false)}}
function formTravelers(){const email=el('contactEmail')?.value?.trim(),phone=el('contactPhone')?.value?.trim();if(!/^\S+@\S+\.\S+$/.test(email||'')){status('Enter a valid booking email.','warn');return null}if(!/^\+[1-9]\d{7,14}$/.test(phone||'')){status('Use an international phone number beginning with +.','warn');return null}S.contact={email,phoneNumber:phone};const count=isHotelOnly()?Math.max(1,Number(S.cart?.travelerCount)||Number(S.cart?.search?.adults)||1):travelerCount();const ids=arr(S.cart?.selectedOffer?.passengers);if(!isHotelOnly()&&ids.length!==count){status('Passenger IDs from the current offer are not available. Refresh the booking.','error');return null}const travelers=S.travelers.slice(0,count).map((x,i)=>{let tr={...x};tr.id=ids[i]?.id||x.id||'';tr.givenName=str(tr.givenName).trim();tr.familyName=str(tr.familyName).trim();if(!isHotelOnly()){tr.nationality=str(tr.nationality).trim().toUpperCase();if(tr.documentNumber){tr.identityDocuments=[{type:'passport',uniqueIdentifier:str(tr.documentNumber).trim().toUpperCase(),issuingCountryCode:str(tr.documentCountry).trim().toUpperCase(),expiresOn:tr.documentExpiry}]}}return tr});for(let i=0;i<travelers.length;i++){const t=travelers[i];if(!t.givenName||!t.familyName||(!isHotelOnly()&&(!t.id||!t.title||!t.bornOn||!t.gender))){status('Complete the required traveler name and identity fields for traveler '+(i+1)+'.','warn');return null}}return travelers}
function bindDelegated(){document.addEventListener('change',e=>{const x=e.target;if(x.matches('[data-pax][data-field]')){const i=Number(x.dataset.pax);if(S.travelers[i])S.travelers[i][x.dataset.field]=x.value}if(x.matches('[data-extra]')){const id=x.dataset.extra;if(x.checked)S.selectedExtras.set(id,1);else S.selectedExtras.delete(id);renderExtras()}if(x.matches('[data-qty]')){const id=x.dataset.qty;if(S.selectedExtras.has(id))S.selectedExtras.set(id,Number(x.value));renderExtras()}if(x.name==='transfer')S.selectedTransfer=x.value});document.addEventListener('input',e=>{const x=e.target;if(x.matches('[data-pax][data-field]')){const i=Number(x.dataset.pax);if(S.travelers[i])S.travelers[i][x.dataset.field]=x.value}if(x.id==='contactEmail')S.contact.email=x.value;if(x.id==='contactPhone')S.contact.phoneNumber=x.value});document.addEventListener('click',async e=>{const b=e.target.closest('button[data-action]');if(!b||S.awaiting)return;const a=b.dataset.action;if(a==='select-offer')return hostNext('BOOKING_SEARCH_SELECT',{offerId:b.dataset.id});if(a==='refresh-results')return hostNext('BOOKING_SEARCH_REFRESH');if(a==='offer-accepted'){if(!el('offerTerms')?.checked){status('Accept the supplier terms before continuing.','warn');return}return hostNext('BOOKING_OFFER_ACCEPTED',{termsAccepted:true})}if(a==='back-to-results')return hostNext('BOOKING_BACK_TO_RESULTS');if(a==='back-home')return message('BOOKING_NAVIGATE',{path:'/home'});if(a==='nav-offer')return postStep('offer');if(a==='nav-extras')return postStep('extras');if(a==='nav-hotels')return setStep('hotels');if(a==='nav-transfer')return postStep('transfer');if(a==='nav-upsell')return setStep('upsell');if(a==='nav-apis')return postStep('apis');if(a==='nav-seats')return postStep('seats');if(a==='nav-confirmation')return postStep('confirmation');if(a==='hotel-continue')return hostNext('BOOKING_HOTEL_CONTINUE');if(a==='upsell-continue')return hostNext('BOOKING_UPSELL_CONTINUE');if(a==='extras-save')return hostNext('BOOKING_EXTRAS_SAVE',{selectedExtras:[...S.selectedExtras.entries()].map(([id,quantity])=>({id,quantity}))});if(a==='transfer-skip')return hostNext('SIGNATURE_TRANSFER_SKIP');if(a==='transfer-continue'){const option=S.transfers.find(x=>str(x.id)===S.selectedTransfer);return option?hostNext('SIGNATURE_TRANSFER_SELECT',{transfer:option}):hostNext('SIGNATURE_TRANSFER_SKIP')}if(a==='apis-save'){const t=formTravelers();if(t)return hostNext('APIS_SAVE_AND_CONTINUE',{travelers:t,contact:S.contact});return}if(a==='seats-skip')return hostNext('SEATMAP_SKIP');if(a==='seats-save')return hostNext('SEATMAP_SAVE',{selections:S.seatSelections});if(a==='seat-map'){S.activeSeatMap=Number(b.dataset.index);renderSeats();return}if(a==='seat-traveler'){S.activeSeatTraveler=Number(b.dataset.index);renderSeats();return}if(a==='seat-choose'){const map=S.seatMaps[S.activeSeatMap];const service=seatServices(map).find(x=>str(x.serviceId||x.id)===b.dataset.id),t=S.seatTravelers[S.activeSeatTraveler];if(!service||!t||(service.passengerId&&str(service.passengerId)!==str(t.id||t.travelerId)))return;const travelerId=str(t.id||t.travelerId),key=travelerId+':'+str(service.segmentId||map.segmentId||map.id);for(const [k,v] of Object.entries(S.seatSelections)){if(v.serviceId===b.dataset.id)delete S.seatSelections[k]}S.seatSelections[key]={serviceId:b.dataset.id,travelerId,segmentId:str(service.segmentId),designator:str(service.designator)};renderSeats();return}if(a==='payment-submit')return submitPayment();if(a==='payment-status')return hostNext('BOOKING_RETRY');if(a==='open-documents')return postStep('documents');if(a==='print-documents')return window.print()})}
bindDelegated();renderStepper();el('root-offer').innerHTML='<div class="empty">Connecting to your SKANDI next booking…</div>';status('');message('BOOKING_OFFER_READY');
})();

</script>
</body>
</html>
```
