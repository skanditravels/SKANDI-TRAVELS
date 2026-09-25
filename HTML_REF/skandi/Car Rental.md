# Car Rental

STATUS: NEEDS REVIEW
SLUG: /car-rental
WIX PAGE: Car Rental.i9rnb
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #carRentalEmbed
B-011 VERSION: B-011.1
LAST SYNCED: 2026-09-25

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

### COMMENT SECTION
1. 9/17 1:07PM "Page is not ready style wise. Not planning to change data, see script as definite /Samuel"
2. 9/25 B-011.1: Complete Car Rental presentation rebuild. Existing SKANDI_CAR_RENTAL bridge names, Wix page ID, Duffel Cards search/quote/payment contracts and owned-cart backend are preserved. The page now uses an asymmetric rental-service layout rather than the standard SKANDI hero/card pattern. Fixed the existing checkout payload mismatch by sending `termsAccepted` and `privacyPoliciesAccepted`, which the canonical customerBooking backend already requires. Also prevents `reconciliationRequired` from being presented as a confirmed booking.
3.
***END***

## B-011 OWNERSHIP

- Route: `/car-rental`
- Wix page controller: `/src/pages/Car Rental.i9rnb.js`
- HTML Component: `#carRentalEmbed`
- HTML source: `SKANDI_CAR_RENTAL`
- Parent source: `SKANDI_WIX_PARENT`
- Canonical frontend facade: `/src/backend/SKANDI_CORE/customerBooking.web.js`
- Canonical orchestration core: `/src/backend/SKANDI_CORE/customerBooking.js`
- Canonical Duffel Ground provider module: `/src/backend/SKANDI_CORE/duffelGround.js`
- Customer header/footer: global `masterPage.js`; not duplicated in this embed.

## VERIFIED RUNTIME CHAIN

`#carRentalEmbed`
→ `/src/pages/Car Rental.i9rnb.js`
→ `backend/SKANDI_CORE/customerBooking.web`
→ `backend/SKANDI_CORE/customerBooking`
→ `backend/SKANDI_CORE/duffelGround`
→ Duffel Cars

The canonical backend does not require replacement. The Wix page controller is updated only to add the B-011.1 version marker and dynamic `CAR_RENTAL_HEIGHT` handling required by the longer responsive embed.

## PRESERVED CHILD → PARENT CONTRACTS

- `CAR_RENTAL_READY`
- `CAR_RENTAL_SEARCH`
- `CAR_RENTAL_REPRICE`
- `CAR_RENTAL_PREPARE_SUPPLIER_PAYMENT`
- `CAR_RENTAL_BOOK`
- `CAR_RENTAL_NAVIGATE`
- `CAR_RENTAL_HEIGHT`

## PRESERVED PARENT → CHILD CONTRACTS

- `CAR_RENTAL_BOOTSTRAP`
- `CAR_RENTAL_SEARCH_RESULT`
- `CAR_RENTAL_REPRICE_RESULT`
- `CAR_RENTAL_OFFER_RESULT`
- `CAR_RENTAL_SUPPLIER_PAYMENT_READY`
- `CAR_RENTAL_BOOKING_RESULT`
- `CAR_RENTAL_ERROR`

## VERIFIED PROVIDER FIELDS USED

Search/result cards use only normalized fields already exposed by `duffelGround`:
- rate/offer ID
- total amount/currency
- payment type
- supplier name/logo
- pickup/drop-off location
- vehicle name/code/category/type/transmission/fuel
- maximum passengers
- air conditioning
- baggage
- vehicle image URLs.

Final quote uses:
- pickup/drop-off date/time
- conditions
- privacy policies
- total amount/currency
- payment type
- supplier and vehicle information.

## FUNCTIONAL CORRECTIONS IN B-011.1

The prior HTML validated the supplier privacy checkboxes and booking terms visually but did not send the backend-required acknowledgement flags. The canonical backend requires:

- `termsAccepted === true`
- either `privacyPoliciesAccepted === true` or individual privacy-policy acceptances.

B-011.1 sends both only after the customer has completed the visible acknowledgements.

The prior HTML also treated every `CAR_RENTAL_BOOKING_RESULT` as confirmation. The canonical backend can return `reconciliationRequired: true` when a provider outcome is uncertain. B-011.1 now instructs the customer not to retry and does not display a false confirmation.

## DESIGN RESEARCH TRANSLATED INTO SKANDI

Common current rental-site patterns were used as structural research rather than visual copying:

- search/reservation is a primary page object
- pick-up/return location and date/time are visible immediately
- same/different return is a first-class control
- driver age/residency are part of the initial quote context
- trust/service propositions sit directly after the reservation entry point
- fleet/category storytelling follows the search experience
- results prioritize vehicle, supplier, key attributes, payment type and total price
- booking moves into a clear review/driver/terms/payment sequence
- existing-rental management remains easy to reach.

The resulting SKANDI page deliberately uses an asymmetric editorial + reservation-desk hero, a rental-confidence strip, a live garage-style result list, a review checkout and editorial fleet/road-readiness sections instead of repeating the standard SKANDI page layout.

## PRESENTATION REGISTRY HOOKS

Stable static hooks are included for future Presentation Registry ownership:
- `car-rental-hero`
- `car-rental-search`
- `car-rental-confidence`
- `car-rental-editorial`
- `car-rental-fleet`
- `car-rental-process`
- `car-rental-road-ready`

No parallel content registry or browser-side Supabase access is introduced.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#03111f">
<title>Car Rental | SKANDI Travels · B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://assets.duffel.com/components/3.17.0/duffel-card-form.js"></script>
<script src="https://assets.duffel.com/components/3.17.0/createThreeDSecureSession.js"></script>
<style>
:root{
  --sk-navy:#022e64;
  --sk-navy2:#0b3a7a;
  --sk-blue:#285ca8;
  --sk-aqua:#5FC7CF;
  --sk-aqua-soft:#d9f1f1;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-bg:#f7faff;
  --sk-white:#fff;
  --sk-ink:#03111f;
  --sk-ink-soft:#061a30;
  --sk-graphite:#111827;
  --sk-body:#526274;
  --sk-muted:#667085;
  --sk-border:#dbe3ef;
  --sk-border-soft:#eef2f7;
  --sk-ivory:#fbfaf6;
  --sk-porcelain:#f5f1ea;
  --sk-champagne:#d1bc98;
  --sk-ok:#087443;
  --sk-bad:#a12622;
  --sk-warn:#9a6700;
  --sk-shadow:0 18px 46px rgba(2,46,100,.10);
  --sk-shadow-strong:0 30px 76px rgba(3,17,31,.18);
  --sk-radius:20px;
  --sk-content:1240px;
  --ease:cubic-bezier(.16,1,.3,1);
}

*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--sk-ink)}
html,body{
  width:100%;
  min-height:100%;
  margin:0;
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:var(--sk-graphite);
  background:#fff;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
body{overflow-x:hidden}
button,input,select{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.48}
img{display:block;max-width:100%}
a{color:inherit}
.hidden{display:none!important}
.wrap{width:min(var(--sk-content),calc(100% - 56px));margin-inline:auto}
.visually-hidden{
  position:absolute!important;
  width:1px!important;height:1px!important;
  padding:0!important;margin:-1px!important;
  overflow:hidden!important;clip:rect(0,0,0,0)!important;
  white-space:nowrap!important;border:0!important;
}
:focus-visible{outline:3px solid rgba(95,199,207,.55);outline-offset:3px}

.eyebrow{
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--sk-aqua);
  font-size:9px;
  font-weight:800;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.eyebrow::before{
  content:"";
  width:30px;
  height:1px;
  background:currentColor;
  opacity:.9;
}
.eyebrow.dark{color:var(--sk-blue)}
.eyebrow.gold{color:var(--sk-champagne)}

.btn{
  appearance:none;
  min-height:46px;
  border:1px solid transparent;
  border-radius:999px;
  padding:0 18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  background:linear-gradient(135deg,var(--sk-navy),#0b5c85);
  color:#fff;
  font-size:9px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  transition:transform .2s var(--ease),box-shadow .2s ease,border-color .2s ease,background .2s ease;
}
.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 28px rgba(2,46,100,.18)}
.btn.secondary{background:#fff;color:var(--sk-navy);border-color:var(--sk-border)}
.btn.secondary:hover:not(:disabled){border-color:var(--sk-aqua)}
.btn.light{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.22);backdrop-filter:blur(10px)}
.btn.light:hover:not(:disabled){background:#fff;color:var(--sk-navy)}
.btn.danger{background:var(--sk-bad)}
.btn.wide{width:100%}

/* =========================================================
   RENTAL HERO — deliberately unlike the other SKANDI pages:
   editorial left side, reservation desk on the right.
   ========================================================= */
.rental-hero{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  min-height:720px;
  background:
    radial-gradient(circle at 79% 15%,rgba(95,199,207,.16),transparent 23%),
    linear-gradient(145deg,#03111f 0%,#061a30 44%,#022e64 74%,#0b5c85 100%);
  color:#fff;
}
.rental-hero::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-2;
  opacity:.18;
  background-image:
    linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);
  background-size:72px 72px;
  mask-image:linear-gradient(90deg,#000,rgba(0,0,0,.42),transparent 83%);
}
.rental-hero::after{
  content:"";
  position:absolute;
  left:-10%;
  right:-10%;
  bottom:-145px;
  height:330px;
  z-index:-1;
  border-radius:50% 50% 0 0/32% 32% 0 0;
  background:#fff;
  transform:rotate(-2.2deg);
}
.hero-inner{
  min-height:720px;
  display:grid;
  grid-template-columns:minmax(0,1.03fr) minmax(390px,.66fr);
  gap:70px;
  align-items:center;
  padding:70px 0 150px;
}
.hero-copy{position:relative;z-index:2;max-width:720px}
.hero-copy h1{
  margin:16px 0 20px;
  max-width:720px;
  font-size:clamp(52px,6.7vw,90px);
  line-height:.92;
  letter-spacing:-.055em;
  font-weight:500;
}
.hero-copy h1 strong{font-weight:800}
.hero-copy p{
  max-width:650px;
  margin:0;
  color:rgba(255,255,255,.73);
  font-size:14px;
  line-height:1.78;
}
.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:28px}
.hero-road{
  position:absolute;
  left:0;
  bottom:76px;
  width:min(56vw,760px);
  height:240px;
  opacity:.55;
  pointer-events:none;
}
.hero-road svg{width:100%;height:100%}
.hero-road .road{fill:none;stroke:rgba(255,255,255,.16);stroke-width:2}
.hero-road .road-accent{fill:none;stroke:rgba(95,199,207,.42);stroke-width:2}
.hero-road .car-line{fill:none;stroke:rgba(255,255,255,.40);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}

/* Reservation desk */
.reservation-desk{
  position:relative;
  z-index:4;
  overflow:hidden;
  border:1px solid rgba(255,255,255,.22);
  border-radius:24px;
  background:rgba(255,255,255,.985);
  color:var(--sk-graphite);
  box-shadow:0 34px 92px rgba(0,0,0,.31);
}
.desk-head{
  padding:23px 24px 18px;
  border-bottom:1px solid var(--sk-border);
  background:linear-gradient(180deg,#fff,var(--sk-pale));
}
.desk-label{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.desk-label span:first-child{
  color:var(--sk-navy);
  font-size:10px;
  font-weight:800;
  letter-spacing:.13em;
  text-transform:uppercase;
}
.live-pill{
  display:inline-flex;
  align-items:center;
  gap:6px;
  color:var(--sk-ok);
  font-size:8px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.live-pill::before{
  content:"";
  width:7px;height:7px;
  border-radius:50%;
  background:var(--sk-ok);
  box-shadow:0 0 0 4px rgba(8,116,67,.10);
}
.desk-head h2{
  margin:8px 0 5px;
  color:var(--sk-navy);
  font-size:23px;
  line-height:1.08;
  letter-spacing:-.035em;
}
.desk-head p{
  margin:0;
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.55;
}
.desk-body{padding:21px 24px 24px}
.search-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.field{min-width:0;display:flex;flex-direction:column;gap:6px}
.field.full{grid-column:1/-1}
.field label{
  color:var(--sk-muted);
  font-size:7px;
  font-weight:800;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.field input,.field select{
  width:100%;
  height:44px;
  border:1px solid #d7dee8;
  border-radius:10px;
  padding:0 11px;
  background:#fff;
  color:var(--sk-graphite);
  font-size:10px;
  outline:0;
}
.field input:focus,.field select:focus{
  border-color:var(--sk-aqua);
  box-shadow:0 0 0 3px rgba(95,199,207,.13);
}
.location-field{position:relative}
.location-field::before{
  content:"";
  position:absolute;
  left:11px;
  top:31px;
  width:7px;height:7px;
  border:2px solid var(--sk-blue);
  border-radius:50%;
  z-index:2;
}
.location-field::after{
  content:"";
  position:absolute;
  left:14px;
  top:39px;
  width:1px;height:6px;
  background:var(--sk-blue);
  transform:rotate(-28deg);
}
.location-field input{padding-left:31px}
.check{
  grid-column:1/-1;
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--sk-body);
  font-size:9px;
  line-height:1.45;
}
.check input{accent-color:var(--sk-navy)}
.desk-actions{
  display:grid;
  grid-template-columns:1fr auto;
  gap:9px;
  margin-top:17px;
}
.desk-actions .btn:first-child{min-width:0}
.manage-link{
  min-height:46px;
  padding:0 4px;
  border:0;
  background:transparent;
  color:var(--sk-navy);
  font-size:8px;
  font-weight:800;
  text-decoration:underline;
  text-underline-offset:3px;
}
.status{
  margin:14px 0 0;
  padding:11px 12px;
  border:1px solid var(--sk-border);
  border-radius:10px;
  background:var(--sk-pale);
  color:var(--sk-body);
  font-size:9px;
  line-height:1.55;
}
.status.error{background:#fff4f2;border-color:#f3c5bd;color:var(--sk-bad)}
.status.ok{background:#eef9f3;border-color:#bee5cf;color:var(--sk-ok)}

/* Confidence strip */
.confidence-shell{
  position:relative;
  z-index:5;
  margin-top:-56px;
}
.confidence{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:18px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.confidence-item{
  min-height:110px;
  padding:22px 24px;
  display:grid;
  grid-template-columns:36px 1fr;
  gap:13px;
  align-items:start;
}
.confidence-item+.confidence-item{border-left:1px solid var(--sk-border)}
.confidence-icon{
  width:36px;height:36px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:var(--sk-pale);
  color:var(--sk-navy);
  font-size:15px;
  font-weight:800;
}
.confidence-item strong{
  display:block;
  margin-bottom:4px;
  color:var(--sk-navy);
  font-size:10px;
}
.confidence-item span{
  display:block;
  color:var(--sk-muted);
  font-size:8.5px;
  line-height:1.55;
}

/* =========================================================
   TRANSACTION AREA
   ========================================================= */
.transaction-zone{
  width:min(var(--sk-content),calc(100% - 56px));
  margin:0 auto;
  padding-top:52px;
}
.view{display:none}
.view.active{display:block}
.section-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:20px;
  margin:0 0 21px;
}
.section-head h2{
  margin:6px 0 0;
  color:var(--sk-navy);
  font-size:clamp(30px,4vw,46px);
  line-height:1;
  letter-spacing:-.045em;
}
.section-head p{
  margin:7px 0 0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.6;
}
.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.toolbar select{
  height:42px;
  border:1px solid var(--sk-border);
  border-radius:999px;
  padding:0 12px;
  color:var(--sk-navy);
  background:#fff;
  font-size:9px;
  font-weight:700;
}

/* Rental offers */
.offers{display:grid;gap:14px}
.offer{
  position:relative;
  display:grid;
  grid-template-columns:245px minmax(0,1fr) 205px;
  overflow:hidden;
  border:1px solid var(--sk-border);
  border-radius:18px;
  background:#fff;
  box-shadow:0 10px 30px rgba(2,46,100,.065);
  transition:transform .2s var(--ease),box-shadow .2s ease,border-color .2s ease;
}
.offer:hover{
  transform:translateY(-2px);
  border-color:rgba(95,199,207,.50);
  box-shadow:0 18px 42px rgba(2,46,100,.10);
}
.car-image{
  position:relative;
  min-height:222px;
  display:grid;
  place-items:center;
  padding:22px;
  background:
    radial-gradient(circle at 50% 45%,#fff 0 22%,transparent 50%),
    linear-gradient(145deg,#f5f8fb,#edf3fa);
}
.car-image::after{
  content:"";
  position:absolute;
  left:14%;right:14%;bottom:25px;
  height:12px;
  border-radius:50%;
  background:rgba(3,17,31,.08);
  filter:blur(8px);
}
.car-image img{
  position:relative;
  z-index:2;
  width:100%;
  height:165px;
  object-fit:contain;
}
.placeholder{
  position:relative;
  z-index:2;
  color:var(--sk-navy);
  font-size:16px;
  font-weight:800;
  text-align:center;
}
.offer-copy{padding:23px 24px}
.supplier-row{
  display:flex;
  align-items:center;
  gap:9px;
  min-height:24px;
}
.supplier-logo{
  width:52px;height:23px;
  object-fit:contain;
  object-position:left center;
}
.supplier{
  color:var(--sk-muted);
  font-size:8px;
  font-weight:800;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.offer h3{
  margin:6px 0 5px;
  color:var(--sk-navy);
  font-size:22px;
  line-height:1.12;
  letter-spacing:-.03em;
}
.vehicle-class{
  color:var(--sk-body);
  font-size:9px;
  line-height:1.5;
}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:13px 0 15px}
.chip{
  padding:6px 8px;
  border:1px solid var(--sk-border-soft);
  border-radius:999px;
  background:var(--sk-pale);
  color:var(--sk-navy);
  font-size:8px;
  font-weight:700;
}
.route-line{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:9px;
  align-items:start;
  padding-top:13px;
  border-top:1px solid var(--sk-border-soft);
  color:var(--sk-body);
  font-size:8.5px;
  line-height:1.55;
}
.route-mark{
  width:18px;height:18px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:var(--sk-aqua-soft);
  color:var(--sk-navy);
  font-size:9px;
  font-weight:800;
}
.price{
  padding:22px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  border-left:1px solid var(--sk-border);
  background:linear-gradient(180deg,#fbfdff,#f6faff);
}
.price-label{
  color:var(--sk-muted);
  font-size:7px;
  font-weight:800;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.price strong{
  display:block;
  margin:5px 0 4px;
  color:var(--sk-navy);
  font-size:26px;
  line-height:1;
  letter-spacing:-.04em;
}
.price-sub{
  min-height:28px;
  color:var(--sk-muted);
  font-size:8px;
  line-height:1.45;
}
.price .btn{margin-top:13px}

/* Checkout */
.checkout-progress{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  overflow:hidden;
  margin-bottom:18px;
  border:1px solid var(--sk-border);
  border-radius:14px;
  background:#fff;
}
.checkout-progress span{
  position:relative;
  padding:12px;
  color:var(--sk-muted);
  font-size:8px;
  font-weight:800;
  text-align:center;
  text-transform:uppercase;
  letter-spacing:.08em;
}
.checkout-progress span+span{border-left:1px solid var(--sk-border)}
.checkout-progress span.on{color:var(--sk-navy);background:var(--sk-pale)}
.checkout-progress span.on::after{
  content:"";
  position:absolute;
  left:0;right:0;bottom:0;
  height:2px;
  background:var(--sk-aqua);
}
.detail{
  display:grid;
  grid-template-columns:minmax(0,1fr) 350px;
  gap:20px;
  align-items:start;
}
.checkout-stack{display:grid;gap:14px}
.card{
  border:1px solid var(--sk-border);
  border-radius:18px;
  background:#fff;
  box-shadow:0 10px 30px rgba(2,46,100,.055);
}
.card-head{
  padding:18px 20px 14px;
  border-bottom:1px solid var(--sk-border-soft);
}
.card-head .step-no{
  display:block;
  margin-bottom:5px;
  color:var(--sk-aqua);
  font-size:8px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
}
.card-head h3{
  margin:0;
  color:var(--sk-navy);
  font-size:17px;
  letter-spacing:-.02em;
}
.card-head p{
  margin:5px 0 0;
  color:var(--sk-muted);
  font-size:8.5px;
  line-height:1.55;
}
.card-body{padding:19px 20px}
.driver-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.policy{
  display:flex;
  align-items:flex-start;
  gap:10px;
  margin:9px 0;
  padding:11px;
  border:1px solid var(--sk-border);
  border-radius:10px;
  background:#fff;
  color:var(--sk-body);
  font-size:8.5px;
  line-height:1.6;
}
.policy input{margin-top:2px;accent-color:var(--sk-navy)}
.policy strong{color:var(--sk-navy)}
.policy a{color:var(--sk-blue);font-weight:700}
.payment-box{
  margin-top:12px;
  padding:15px;
  border:1px solid var(--sk-border);
  border-radius:13px;
  background:#fbfdff;
}
.payment-box h4{margin:0 0 7px;color:var(--sk-navy);font-size:12px}
.payment-box p{margin:0;color:var(--sk-body);font-size:8.5px;line-height:1.55}
.secure-note{
  display:flex;
  align-items:center;
  gap:7px;
  margin:9px 0;
  color:var(--sk-ok);
  font-size:8px;
  font-weight:800;
}
.secure-note::before{
  content:"";
  width:7px;height:7px;
  border-radius:50%;
  background:var(--sk-ok);
}
.duffel-wrap{
  min-height:185px;
  padding:12px;
  border:1px solid var(--sk-border);
  border-radius:11px;
  background:#fff;
}
.actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin-top:15px}
.summary-card{
  position:sticky;
  top:16px;
  overflow:hidden;
}
.summary-visual{
  min-height:128px;
  display:grid;
  place-items:center;
  padding:15px;
  background:
    radial-gradient(circle at 50% 36%,#fff 0 14%,transparent 55%),
    linear-gradient(145deg,#f4f7fb,#eaf1f9);
}
.summary-visual img{width:100%;height:105px;object-fit:contain}
.summary-title{padding:17px 18px 12px}
.summary-title small{
  display:block;
  color:var(--sk-muted);
  font-size:7px;
  font-weight:800;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.summary-title h3{
  margin:5px 0 0;
  color:var(--sk-navy);
  font-size:16px;
  line-height:1.2;
}
.rows{display:grid;padding:0 18px 17px}
.row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:9px 0;
  border-top:1px solid var(--sk-border-soft);
  font-size:8.5px;
  line-height:1.45;
}
.row span{color:var(--sk-muted)}
.row strong{color:var(--sk-graphite);text-align:right}
.row.total strong{color:var(--sk-navy);font-size:13px}

/* Confirmation */
.confirmation{
  overflow:hidden;
  text-align:center;
  padding:0;
}
.confirmation-top{
  padding:42px 24px 28px;
  background:
    radial-gradient(circle at 50% 0,rgba(95,199,207,.15),transparent 38%),
    linear-gradient(180deg,var(--sk-pale),#fff);
}
.tick{
  width:58px;height:58px;
  margin:0 auto 15px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:var(--sk-navy);
  color:#fff;
  font-size:24px;
}
.confirmation h2{
  margin:0;
  color:var(--sk-navy);
  font-size:32px;
  letter-spacing:-.04em;
}
.confirmation p{
  max-width:600px;
  margin:9px auto 0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.65;
}
.ref{
  display:inline-block;
  margin-top:13px;
  padding:8px 13px;
  border:1px solid var(--sk-border);
  border-radius:999px;
  background:#fff;
  color:var(--sk-navy);
  font-size:9px;
  font-weight:800;
}
.confirmation-actions{
  padding:18px 24px 28px;
  display:flex;
  justify-content:center;
  gap:9px;
  flex-wrap:wrap;
}

/* =========================================================
   EDITORIAL RENTAL CONTENT
   ========================================================= */
.editorial{
  padding:78px 0 92px;
  background:#fff;
}
.editorial-section+.editorial-section{margin-top:76px}
.editorial-head{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(300px,480px);
  gap:44px;
  align-items:end;
  margin-bottom:26px;
}
.editorial-head h2{
  margin:7px 0 0;
  max-width:720px;
  color:var(--sk-navy);
  font-size:clamp(34px,4.6vw,56px);
  line-height:.98;
  letter-spacing:-.05em;
}
.editorial-head p{
  margin:0;
  color:var(--sk-body);
  font-size:11px;
  line-height:1.75;
}

/* vehicle category storyboard: informational, not a provider filter */
.fleet-story{
  display:grid;
  grid-template-columns:1.2fr .8fr .8fr;
  grid-template-rows:220px 220px;
  gap:12px;
}
.fleet-panel{
  position:relative;
  overflow:hidden;
  padding:23px;
  border-radius:18px;
  color:#fff;
  background:var(--sk-navy);
}
.fleet-panel:first-child{
  grid-row:1/3;
  background:linear-gradient(145deg,#03111f,#022e64 72%,#0b5c85);
}
.fleet-panel:nth-child(2){background:linear-gradient(145deg,#173747,#266273)}
.fleet-panel:nth-child(3){background:linear-gradient(145deg,#3c2f20,#8b6a45)}
.fleet-panel:nth-child(4){grid-column:2/4;background:linear-gradient(145deg,#eef3f8,#d7e6ff);color:var(--sk-navy)}
.fleet-panel::after{
  content:"";
  position:absolute;
  right:-70px;
  bottom:-90px;
  width:250px;height:250px;
  border:1px solid rgba(255,255,255,.15);
  border-radius:50%;
  box-shadow:0 0 0 30px rgba(255,255,255,.025),0 0 0 60px rgba(255,255,255,.015);
}
.fleet-panel:nth-child(4)::after{border-color:rgba(2,46,100,.12);box-shadow:0 0 0 30px rgba(2,46,100,.025),0 0 0 60px rgba(2,46,100,.015)}
.fleet-copy{position:relative;z-index:2;max-width:360px}
.fleet-kicker{
  font-size:7px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  opacity:.65;
}
.fleet-panel h3{
  margin:8px 0 7px;
  font-size:22px;
  line-height:1.08;
  letter-spacing:-.03em;
}
.fleet-panel:first-child h3{font-size:34px}
.fleet-panel p{
  margin:0;
  max-width:330px;
  color:inherit;
  opacity:.72;
  font-size:9px;
  line-height:1.65;
}
.car-sketch{
  position:absolute;
  right:20px;
  bottom:20px;
  width:46%;
  max-width:240px;
  opacity:.40;
  z-index:1;
}
.car-sketch path,.car-sketch circle{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}

/* How it works */
.process{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  border-top:1px solid var(--sk-border);
  border-bottom:1px solid var(--sk-border);
}
.process-step{
  min-height:180px;
  padding:27px 27px 29px;
}
.process-step+.process-step{border-left:1px solid var(--sk-border)}
.process-no{
  color:var(--sk-aqua);
  font-size:9px;
  font-weight:800;
  letter-spacing:.12em;
}
.process-step h3{
  margin:28px 0 8px;
  color:var(--sk-navy);
  font-size:18px;
  letter-spacing:-.025em;
}
.process-step p{
  margin:0;
  color:var(--sk-muted);
  font-size:9px;
  line-height:1.65;
}

/* dark road-ready panel */
.road-ready{
  display:grid;
  grid-template-columns:.78fr 1.22fr;
  overflow:hidden;
  border-radius:22px;
  background:var(--sk-ink);
  color:#fff;
  box-shadow:var(--sk-shadow-strong);
}
.road-ready-copy{
  padding:34px;
  background:
    radial-gradient(circle at 90% 10%,rgba(95,199,207,.14),transparent 28%),
    linear-gradient(145deg,#03111f,#061a30);
}
.road-ready-copy h3{
  margin:9px 0 11px;
  font-size:30px;
  line-height:1;
  letter-spacing:-.04em;
}
.road-ready-copy p{
  margin:0;
  color:rgba(255,255,255,.61);
  font-size:9.5px;
  line-height:1.7;
}
.checklist{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  background:#fff;
  color:var(--sk-graphite);
}
.check-item{padding:28px 22px}
.check-item+.check-item{border-left:1px solid var(--sk-border)}
.check-item strong{
  display:block;
  margin-bottom:7px;
  color:var(--sk-navy);
  font-size:11px;
}
.check-item span{
  display:block;
  color:var(--sk-muted);
  font-size:8.5px;
  line-height:1.6;
}

/* Loader / toast */
.loader{
  position:fixed;
  inset:0;
  z-index:1000;
  display:none;
  place-items:center;
  background:rgba(3,17,31,.70);
  backdrop-filter:blur(6px);
}
.loader.show{display:grid}
.loader-box{
  width:min(360px,calc(100% - 30px));
  padding:27px;
  border:1px solid rgba(255,255,255,.15);
  border-radius:18px;
  background:#fff;
  text-align:center;
  box-shadow:0 30px 80px rgba(0,0,0,.28);
}
.spin{
  width:40px;height:40px;
  margin:0 auto 13px;
  border:3px solid #e3e8ef;
  border-top-color:var(--sk-navy);
  border-radius:50%;
  animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.loader-box strong{color:var(--sk-navy);font-size:12px}
.loader-box p{margin:7px 0 0;color:var(--sk-body);font-size:9px;line-height:1.55}
.toast{
  position:fixed;
  right:18px;
  bottom:18px;
  z-index:1200;
  display:none;
  max-width:380px;
  padding:12px 14px;
  border:1px solid rgba(255,255,255,.10);
  border-radius:11px;
  background:var(--sk-ink-soft);
  color:#fff;
  box-shadow:0 16px 40px rgba(0,0,0,.24);
  font-size:9px;
  line-height:1.5;
}
.toast.show{display:block}

@media(max-width:1040px){
  .hero-inner{grid-template-columns:minmax(0,.9fr) minmax(380px,.8fr);gap:36px}
  .offer{grid-template-columns:200px minmax(0,1fr)}
  .price{grid-column:1/-1;border-left:0;border-top:1px solid var(--sk-border);display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center}
  .price .btn{margin:0}
  .detail{grid-template-columns:minmax(0,1fr) 310px}
  .fleet-story{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .fleet-panel,.fleet-panel:first-child,.fleet-panel:nth-child(4){grid-column:auto;grid-row:auto;min-height:250px}
  .fleet-panel:first-child{grid-column:1/-1}
  .fleet-panel:nth-child(4){grid-column:1/-1}
  .road-ready{grid-template-columns:1fr}
}
@media(max-width:840px){
  .wrap,.transaction-zone{width:min(var(--sk-content),calc(100% - 34px))}
  .rental-hero{min-height:auto}
  .hero-inner{min-height:auto;grid-template-columns:1fr;padding:58px 0 145px}
  .hero-copy{max-width:760px}
  .hero-copy h1{font-size:58px}
  .hero-road{width:100%;bottom:55px}
  .reservation-desk{max-width:640px}
  .confidence{grid-template-columns:1fr}
  .confidence-item+.confidence-item{border-left:0;border-top:1px solid var(--sk-border)}
  .editorial-head{grid-template-columns:1fr;gap:15px}
  .detail{grid-template-columns:1fr}
  .summary-card{position:static}
  .process{grid-template-columns:1fr}
  .process-step+.process-step{border-left:0;border-top:1px solid var(--sk-border)}
}
@media(max-width:620px){
  .wrap,.transaction-zone{width:min(var(--sk-content),calc(100% - 24px))}
  .hero-inner{padding-top:44px}
  .hero-copy h1{font-size:44px}
  .hero-copy p{font-size:12px}
  .search-grid,.driver-grid{grid-template-columns:1fr}
  .field.full,.check{grid-column:auto}
  .desk-actions{grid-template-columns:1fr}
  .manage-link{min-height:34px}
  .reservation-desk{border-radius:18px}
  .desk-head,.desk-body{padding-left:17px;padding-right:17px}
  .confidence-shell{margin-top:-46px}
  .offer{grid-template-columns:1fr}
  .car-image{min-height:190px}
  .price{grid-column:auto;grid-template-columns:1fr;gap:8px}
  .price .btn{margin-top:4px}
  .section-head{align-items:flex-start;flex-direction:column}
  .toolbar{width:100%}
  .toolbar select,.toolbar .btn{flex:1}
  .checkout-progress span{padding:10px 5px;font-size:7px}
  .fleet-story{grid-template-columns:1fr}
  .fleet-panel,.fleet-panel:first-child,.fleet-panel:nth-child(4){grid-column:auto;min-height:220px}
  .checklist{grid-template-columns:1fr}
  .check-item+.check-item{border-left:0;border-top:1px solid var(--sk-border)}
  .editorial{padding-top:60px}
  .editorial-section+.editorial-section{margin-top:58px}
  .road-ready-copy{padding:27px 22px}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition-duration:.01ms!important}
}
</style>
</head>
<body>

<section class="rental-hero" data-section-id="car-rental-hero">
  <div class="wrap hero-inner">
    <div class="hero-copy">
      <div class="eyebrow" data-content-id="car-rental-hero-eyebrow">SKANDI CAR RENTAL</div>
      <h1 data-content-id="car-rental-hero-h1">Your trip.<br><strong>Your road.</strong></h1>
      <p data-content-id="car-rental-hero-copy">
        Compare live rental-car availability, review the supplier's final conditions before you commit,
        and keep the confirmed vehicle connected to the same SKANDI trip as the rest of your journey.
      </p>
      <div class="hero-actions">
        <button class="btn light" type="button" data-focus-search>Find a car</button>
        <button class="btn light" type="button" data-nav="/my-profile?tab=trips">Manage my rental</button>
      </div>
    </div>

    <section class="reservation-desk" id="searchPanel" aria-labelledby="searchTitle" data-section-id="car-rental-search">
      <div class="desk-head">
        <div class="desk-label">
          <span>Reservation desk</span>
          <span class="live-pill">Live rates</span>
        </div>
        <h2 id="searchTitle" data-content-id="car-rental-search-h2">Where do you want to drive?</h2>
        <p data-content-id="car-rental-search-copy">Search airport, city or destination locations from the live rental supply.</p>
      </div>

      <div class="desk-body">
        <div class="search-grid">
          <div class="field full location-field">
            <label for="pickup">Pick-up location</label>
            <input id="pickup" autocomplete="off" placeholder="Airport, city or destination">
          </div>

          <label class="check">
            <input id="same" type="checkbox" checked>
            Return the car to the same location
          </label>

          <div class="field full location-field hidden" id="dropField">
            <label for="dropoff">Return location</label>
            <input id="dropoff" autocomplete="off" placeholder="Airport, city or destination">
          </div>

          <div class="field">
            <label for="pickupDate">Pick-up date</label>
            <input id="pickupDate" type="date">
          </div>
          <div class="field">
            <label for="pickupTime">Pick-up time</label>
            <input id="pickupTime" type="time" value="10:00">
          </div>
          <div class="field">
            <label for="dropoffDate">Return date</label>
            <input id="dropoffDate" type="date">
          </div>
          <div class="field">
            <label for="dropoffTime">Return time</label>
            <input id="dropoffTime" type="time" value="10:00">
          </div>
          <div class="field">
            <label for="driverAge">Driver age</label>
            <input id="driverAge" type="number" min="18" max="99" value="30">
          </div>
          <div class="field">
            <label for="residence">Country of residence</label>
            <select id="residence">
              <option value="US">United States</option>
              <option value="SE">Sweden</option>
              <option value="NO">Norway</option>
              <option value="DK">Denmark</option>
              <option value="FI">Finland</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>

        <div class="desk-actions">
          <button class="btn wide" id="searchBtn" type="button">Show live cars</button>
          <button class="manage-link" type="button" data-nav="/my-profile?tab=trips">View booking</button>
        </div>
        <div id="searchStatus" class="status hidden" role="status" aria-live="polite"></div>
      </div>
    </section>
  </div>

  <div class="hero-road" aria-hidden="true">
    <svg viewBox="0 0 760 240" preserveAspectRatio="none">
      <path class="road" d="M-20 228C145 128 292 118 420 137c129 19 218 2 367-85"/>
      <path class="road-accent" d="M-15 239C151 143 297 135 426 152c125 17 216 0 360-83"/>
      <path class="car-line" d="M140 160h96l28-34h77l42 34h38c12 0 21 9 21 21v11h-28"/>
      <path class="car-line" d="M140 160c-14 0-25 11-25 25v7h27"/>
      <circle class="car-line" cx="170" cy="190" r="18"/>
      <circle class="car-line" cx="385" cy="190" r="18"/>
      <path class="car-line" d="M188 190h179M266 126l-8 34M342 126l17 34"/>
    </svg>
  </div>
</section>

<div class="wrap confidence-shell" data-section-id="car-rental-confidence">
  <div class="confidence">
    <div class="confidence-item">
      <div class="confidence-icon">01</div>
      <div><strong>Live supplier availability</strong><span>Search current vehicle rates for the location and dates you choose.</span></div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">02</div>
      <div><strong>Conditions before booking</strong><span>The final quote is rechecked and supplier conditions are shown before confirmation.</span></div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">03</div>
      <div><strong>One connected SKANDI trip</strong><span>Your confirmed rental remains tied to your owned SKANDI booking cart and My Trips.</span></div>
    </div>
  </div>
</div>

<main>
  <div class="transaction-zone">
    <section class="view" id="resultsView" aria-live="polite">
      <div class="section-head">
        <div>
          <div class="eyebrow dark">LIVE AVAILABILITY</div>
          <h2>Choose your car.</h2>
          <p id="resultSummary">Current supplier rates for your search.</p>
        </div>
        <div class="toolbar">
          <button class="btn secondary" type="button" data-focus-search>Edit search</button>
          <label class="visually-hidden" for="sort">Sort car rental results</label>
          <select id="sort">
            <option value="recommended">Recommended</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>
      <div id="offers" class="offers"></div>
    </section>

    <section class="view" id="checkoutView">
      <div class="section-head">
        <div>
          <div class="eyebrow dark">FINAL QUOTE</div>
          <h2>Review & book.</h2>
          <p>The selected rate is revalidated before the booking is sent to the rental supplier.</p>
        </div>
      </div>

      <div class="checkout-progress" aria-label="Car rental booking progress">
        <span class="on">1 · Vehicle</span>
        <span class="on">2 · Driver</span>
        <span class="on">3 · Payment</span>
      </div>

      <div class="detail">
        <div class="checkout-stack">
          <section class="card">
            <div class="card-head">
              <span class="step-no">Step 01</span>
              <h3>Main driver</h3>
              <p>The driver details must match the documents presented to the rental supplier.</p>
            </div>
            <div class="card-body">
              <div class="driver-grid">
                <div class="field">
                  <label for="firstName">First name</label>
                  <input id="firstName" autocomplete="given-name">
                </div>
                <div class="field">
                  <label for="lastName">Last name</label>
                  <input id="lastName" autocomplete="family-name">
                </div>
                <div class="field">
                  <label for="email">Email</label>
                  <input id="email" type="email" autocomplete="email">
                </div>
                <div class="field">
                  <label for="phone">Phone in international format</label>
                  <input id="phone" type="tel" autocomplete="tel" placeholder="+12125550123">
                </div>
                <div class="field">
                  <label for="dob">Date of birth</label>
                  <input id="dob" type="date" autocomplete="bday">
                </div>
                <div class="field">
                  <label for="flightNo">Inbound flight (optional)</label>
                  <input id="flightNo" autocomplete="off" placeholder="SK123">
                </div>
                <div class="field full">
                  <label for="loyaltyNo">Rental supplier loyalty number (optional)</label>
                  <input id="loyaltyNo" autocomplete="off" placeholder="Enter if applicable">
                </div>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-head">
              <span class="step-no">Step 02</span>
              <h3>Supplier conditions & privacy</h3>
              <p>Review the live quote conditions. Supplier requirements can vary by location, vehicle and driver.</p>
            </div>
            <div class="card-body">
              <div id="conditions"></div>
              <div id="policies"></div>
              <label class="policy">
                <input type="checkbox" id="acceptTerms">
                <span>I accept the displayed rental conditions, cancellation rules, supplier terms and SKANDI booking terms.</span>
              </label>
            </div>
          </section>

          <section class="card">
            <div class="card-head">
              <span class="step-no">Step 03</span>
              <h3>Payment & confirmation</h3>
              <p>The payment method follows the rental supplier's returned payment type.</p>
            </div>
            <div class="card-body">
              <div id="paymentCopy"></div>
              <div id="securePayment" class="payment-box hidden">
                <h4>Secure card verification</h4>
                <div class="secure-note">Duffel secure card form + 3-D Secure</div>
                <div class="duffel-wrap"><duffel-card-form></duffel-card-form></div>
              </div>
              <div class="actions">
                <button class="btn secondary" id="backBtn" type="button">Back to cars</button>
                <button class="btn" id="bookBtn" type="button">Confirm booking</button>
              </div>
            </div>
          </section>
        </div>

        <aside class="card summary-card" aria-label="Selected rental summary">
          <div class="summary-visual" id="summaryVisual"><div class="placeholder">Selected vehicle</div></div>
          <div class="summary-title">
            <small id="summarySupplier">Rental supplier</small>
            <h3 id="summaryVehicle">Your rental</h3>
          </div>
          <div id="summaryRows" class="rows"></div>
        </aside>
      </div>
    </section>

    <section class="view" id="confirmationView" aria-live="polite">
      <div class="card confirmation">
        <div class="confirmation-top">
          <div class="tick">✓</div>
          <div class="eyebrow dark" style="justify-content:center">BOOKING CONFIRMED</div>
          <h2>Car rental confirmed.</h2>
          <p>Your rental is connected to your SKANDI trip. Open My Trips for the latest booking information and supplier reference.</p>
          <div class="ref" id="confirmationRef">Confirmed</div>
        </div>
        <div class="confirmation-actions">
          <button class="btn" type="button" data-nav="/my-profile?tab=trips">Open My Trips</button>
          <button class="btn secondary" type="button" data-focus-search>Search another car</button>
        </div>
      </div>
    </section>
  </div>

  <section class="editorial" data-section-id="car-rental-editorial">
    <div class="wrap">
      <section class="editorial-section" data-section-id="car-rental-fleet">
        <div class="editorial-head">
          <div>
            <div class="eyebrow dark" data-content-id="car-rental-fleet-eyebrow">THE RIGHT SHAPE FOR THE TRIP</div>
            <h2 data-content-id="car-rental-fleet-h2">City streets, coast roads, long weekends.</h2>
          </div>
          <p data-content-id="car-rental-fleet-copy">
            Vehicle categories and exact models depend on live supplier availability. Use the search above to see what is actually offered for your route and dates.
          </p>
        </div>

        <div class="fleet-story">
          <article class="fleet-panel">
            <div class="fleet-copy">
              <div class="fleet-kicker">Everyday travel</div>
              <h3>Compact & city cars</h3>
              <p>For lighter luggage, shorter distances and places where easy parking matters.</p>
            </div>
            <svg class="car-sketch" viewBox="0 0 240 100" aria-hidden="true">
              <path d="M22 70h18l12-26h86l26 26h44c8 0 14 6 14 14v3h-17"/>
              <path d="M22 70c-7 0-13 6-13 13v4h17M70 44l-4 26M136 44l13 26M85 87h82"/>
              <circle cx="50" cy="86" r="13"/><circle cx="190" cy="86" r="13"/>
            </svg>
          </article>

          <article class="fleet-panel">
            <div class="fleet-copy">
              <div class="fleet-kicker">More room</div>
              <h3>SUV & crossover</h3>
              <p>Extra space can make longer drives and fuller itineraries more comfortable.</p>
            </div>
          </article>

          <article class="fleet-panel">
            <div class="fleet-copy">
              <div class="fleet-kicker">Refined drive</div>
              <h3>Premium</h3>
              <p>When the vehicle is part of the experience, not only the transport.</p>
            </div>
          </article>

          <article class="fleet-panel">
            <div class="fleet-copy">
              <div class="fleet-kicker">Lower-emission options</div>
              <h3>Electric & hybrid, where offered</h3>
              <p>Live results determine whether electric, hybrid or other fuel types are available at your chosen rental location.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="editorial-section" data-section-id="car-rental-process">
        <div class="editorial-head">
          <div>
            <div class="eyebrow dark">FROM SEARCH TO KEYS</div>
            <h2>A shorter route to the road.</h2>
          </div>
          <p>SKANDI keeps the supplier transaction visible: live rate, final quote, driver details, required acknowledgements and the supplier's payment method.</p>
        </div>

        <div class="process">
          <article class="process-step">
            <span class="process-no">01 · SEARCH</span>
            <h3>Tell us where and when.</h3>
            <p>Choose the pick-up and return location, dates, times, driver age and country of residence.</p>
          </article>
          <article class="process-step">
            <span class="process-no">02 · COMPARE</span>
            <h3>See the live vehicles.</h3>
            <p>Compare the current supplier, vehicle characteristics, payment type and total rental price returned for the search.</p>
          </article>
          <article class="process-step">
            <span class="process-no">03 · CONFIRM</span>
            <h3>Review before you book.</h3>
            <p>The selected rate is quoted again. Complete the driver and supplier requirements before SKANDI confirms the rental.</p>
          </article>
        </div>
      </section>

      <section class="editorial-section" data-section-id="car-rental-road-ready">
        <div class="road-ready">
          <div class="road-ready-copy">
            <div class="eyebrow gold">BEFORE PICK-UP</div>
            <h3>Arrive road-ready.</h3>
            <p>Rental requirements vary by supplier and location. The final quote and booking conditions remain the authority for your specific reservation.</p>
          </div>
          <div class="checklist">
            <div class="check-item">
              <strong>Driver documents</strong>
              <span>Bring the licence and identification required by the rental supplier and local rules.</span>
            </div>
            <div class="check-item">
              <strong>Card & deposit</strong>
              <span>Supplier deposit, card and guarantee requirements can differ from the amount paid or guaranteed online.</span>
            </div>
            <div class="check-item">
              <strong>Fuel, mileage & return</strong>
              <span>Check the returned supplier conditions for the applicable fuel, mileage, timing and return rules.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</main>

<div class="loader" id="loader" aria-hidden="true">
  <div class="loader-box">
    <div class="spin"></div>
    <strong id="loaderTitle">Working</strong>
    <p id="loaderCopy">Please wait.</p>
  </div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(()=>{
"use strict";

const SOURCE="SKANDI_CAR_RENTAL";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();
const $=id=>document.getElementById(id);

const state={
  bookingId:"",
  search:null,
  offers:[],
  quote:null,
  clientKey:"",
  cardValid:false,
  paymentReady:false,
  booking:null
};

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  try{
    const url=new URL(raw,location.origin);
    return["https:","http:"].includes(url.protocol)?url.href:"";
  }catch(_){
    return"";
  }
}

function money(value,currency="USD"){
  try{
    return new Intl.NumberFormat(undefined,{
      style:"currency",
      currency:currency||"USD"
    }).format(Number(value||0));
  }catch(_){
    return `${currency||"USD"} ${Number(value||0).toFixed(2)}`;
  }
}

function paymentLabel(value){
  const type=String(value||"").toLowerCase();
  if(type==="postpaid")return"Pay according to supplier terms";
  if(type==="guarantee")return"Card guarantee required";
  if(type==="prepaid")return"Supplier prepayment";
  return type?type:"Payment terms shown at final quote";
}

function show(viewId){
  ["resultsView","checkoutView","confirmationView"].forEach(id=>{
    $(id).classList.toggle("active",id===viewId);
  });
  if(viewId){
    $(viewId).scrollIntoView({behavior:"smooth",block:"start"});
  }
  requestHeight();
}

function focusSearch(){
  $("searchPanel").scrollIntoView({behavior:"smooth",block:"center"});
  setTimeout(()=>$("pickup").focus({preventScroll:true}),350);
}

function loading(on,title="Working",copy="Please wait."){
  $("loader").classList.toggle("show",on);
  $("loader").setAttribute("aria-hidden",on?"false":"true");
  $("loaderTitle").textContent=title;
  $("loaderCopy").textContent=copy;
}

function toast(message){
  const node=$("toast");
  node.textContent=String(message||"");
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>node.classList.remove("show"),3600);
}

function setStatus(message,kind=""){
  const node=$("searchStatus");
  node.className=`status ${kind}`.trim();
  node.textContent=message;
  node.classList.toggle("hidden",!message);
}

function searchPayload(){
  const same=$("same").checked;
  return{
    pickupLocationText:$("pickup").value.trim(),
    dropoffLocationText:same
      ?$("pickup").value.trim()
      :$("dropoff").value.trim(),
    pickupDate:$("pickupDate").value,
    pickupTime:$("pickupTime").value,
    dropoffDate:$("dropoffDate").value,
    dropoffTime:$("dropoffTime").value,
    driverAge:Number($("driverAge").value||30),
    residenceCountry:$("residence").value,
    sameLocation:same
  };
}

function validateSearch(search){
  if(!search.pickupLocationText)return"Enter a pick-up location.";
  if(!search.sameLocation&&!search.dropoffLocationText)return"Enter a return location.";
  if(!search.pickupDate||!search.dropoffDate)return"Choose pick-up and return dates.";
  if(search.dropoffDate<search.pickupDate)return"Return date cannot be before pick-up date.";
  if(!Number.isFinite(search.driverAge)||search.driverAge<18||search.driverAge>99)return"Enter a valid driver age.";
  return"";
}

function runSearch(){
  const search=searchPayload();
  const problem=validateSearch(search);
  if(problem){
    setStatus(problem,"error");
    toast(problem);
    return;
  }

  state.search=search;
  state.quote=null;
  state.clientKey="";
  state.cardValid=false;
  setStatus("","");
  loading(true,"Searching live cars","Checking current supplier availability and rates.");
  post("CAR_RENTAL_SEARCH",{search});
}

function offerFeatureChips(offer){
  const car=offer?.car||{};
  const values=[];

  if(car.category)values.push(car.category);
  else if(car.type)values.push(car.type);

  if(car.transmission)values.push(car.transmission);
  if(car.fuel)values.push(car.fuel);
  if(Number(car.maxPassengers)>0)values.push(`${Number(car.maxPassengers)} passengers`);
  if(car.airConditioning===true)values.push("Air conditioning");

  if(car.baggage){
    const baggage=typeof car.baggage==="string"
      ?car.baggage
      :car.baggage.count||car.baggage.total||car.baggage.quantity
        ?`${car.baggage.count||car.baggage.total||car.baggage.quantity} bags`
        :"";
    if(baggage)values.push(baggage);
  }

  return [...new Set(values.filter(Boolean))]
    .slice(0,5)
    .map(value=>`<span class="chip">${esc(value)}</span>`)
    .join("");
}

function renderOffers(){
  let rows=[...state.offers];

  if($("sort").value==="low"){
    rows.sort((a,b)=>Number(a.totalAmount)-Number(b.totalAmount));
  }else if($("sort").value==="high"){
    rows.sort((a,b)=>Number(b.totalAmount)-Number(a.totalAmount));
  }

  const search=state.search||searchPayload();
  $("resultSummary").textContent=rows.length
    ?`${rows.length} live vehicle${rows.length===1?"":"s"} · ${search.pickupLocationText} · ${search.pickupDate} to ${search.dropoffDate}`
    :"No live vehicles matched this search.";

  $("offers").innerHTML=rows.length
    ?rows.map(offer=>{
      const car=offer.car||{};
      const image=safeUrl(car.images?.[0]);
      const logo=safeUrl(offer.supplier?.logoUrl);
      const pickup=offer.pickupLocation?.name||search.pickupLocationText;
      const dropoff=offer.dropoffLocation?.name||search.dropoffLocationText;
      const supplierName=offer.supplier?.name||"Rental supplier";
      const vehicleName=car.name||car.category||"Rental car";
      const classLine=[car.type,car.code].filter(Boolean).join(" · ");

      return `<article class="offer">
        <div class="car-image">
          ${image
            ?`<img src="${esc(image)}" alt="${esc(vehicleName)}">`
            :`<div class="placeholder">${esc(vehicleName)}</div>`}
        </div>

        <div class="offer-copy">
          <div class="supplier-row">
            ${logo?`<img class="supplier-logo" src="${esc(logo)}" alt="">`:""}
            <span class="supplier">${esc(supplierName)}</span>
          </div>
          <h3>${esc(vehicleName)}</h3>
          ${classLine?`<div class="vehicle-class">${esc(classLine)}</div>`:""}
          <div class="chips">${offerFeatureChips(offer)}</div>
          <div class="route-line">
            <span class="route-mark">↗</span>
            <span>${esc(pickup)} → ${esc(dropoff)}</span>
          </div>
        </div>

        <div class="price">
          <span class="price-label">Total rental price</span>
          <strong>${money(offer.totalAmount,offer.totalCurrency)}</strong>
          <span class="price-sub">${esc(paymentLabel(offer.paymentType))}</span>
          <button class="btn" type="button" data-rate="${esc(offer.id)}">Review rate</button>
        </div>
      </article>`;
    }).join("")
    :`<div class="status">No live cars were returned for this search. Change the location or dates and try again.</div>`;

  show("resultsView");
}

function selectRate(rateId){
  if(!rateId)return;
  loading(true,"Checking final rate","Revalidating the selected vehicle and supplier conditions.");
  post("CAR_RENTAL_REPRICE",{rateId});
}

function conditionText(item){
  if(!item)return"";
  if(typeof item==="string")return item;
  return item.description||item.text||item.title||item.name||"Rental condition";
}

function policyText(item){
  if(!item)return"Supplier privacy policy";
  if(typeof item==="string")return item;
  return item.name||item.title||item.description||item.text||item.url||item.href||"Supplier privacy policy";
}

function policyUrl(item){
  if(!item||typeof item==="string")return"";
  return safeUrl(item.url||item.href||"");
}

function renderSummaryVehicle(quote){
  const car=quote?.car||{};
  const image=safeUrl(car.images?.[0]);

  $("summaryVisual").innerHTML=image
    ?`<img src="${esc(image)}" alt="${esc(car.name||car.category||"Selected rental vehicle")}">`
    :`<div class="placeholder">${esc(car.name||car.category||"Selected vehicle")}</div>`;

  $("summarySupplier").textContent=quote?.supplier?.name||"Rental supplier";
  $("summaryVehicle").textContent=car.name||car.category||"Your rental";
}

function renderCheckout(){
  const quote=state.quote||{};
  const car=quote.car||{};

  $("conditions").innerHTML=(quote.conditions||[]).map(item=>`
    <div class="policy">
      <span aria-hidden="true">•</span>
      <span>
        <strong>${esc(item?.title||item?.name||"Rental condition")}</strong><br>
        ${esc(conditionText(item))}
      </span>
    </div>
  `).join("")||`<div class="status">No additional supplier conditions were returned with this quote.</div>`;

  $("policies").innerHTML=(quote.privacyPolicies||[]).map((item,index)=>{
    const url=policyUrl(item);
    const label=policyText(item);
    return `<label class="policy">
      <input type="checkbox" data-policy="${index}">
      <span>
        I acknowledge:
        ${url
          ?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
          :esc(label)}
      </span>
    </label>`;
  }).join("");

  renderSummaryVehicle(quote);

  $("summaryRows").innerHTML=`
    <div class="row"><span>Vehicle</span><strong>${esc(car.name||car.category||"Car")}</strong></div>
    <div class="row"><span>Supplier</span><strong>${esc(quote.supplier?.name||"Rental supplier")}</strong></div>
    <div class="row"><span>Pick-up</span><strong>${esc(quote.pickupDate||state.search?.pickupDate||"")} ${esc(quote.pickupTime||state.search?.pickupTime||"")}</strong></div>
    <div class="row"><span>Return</span><strong>${esc(quote.dropoffDate||state.search?.dropoffDate||"")} ${esc(quote.dropoffTime||state.search?.dropoffTime||"")}</strong></div>
    <div class="row"><span>Payment</span><strong>${esc(paymentLabel(quote.paymentType))}</strong></div>
    <div class="row total"><span>Total</span><strong>${money(quote.totalAmount,quote.totalCurrency)}</strong></div>`;

  const needsCard=Boolean(quote.paymentType&&String(quote.paymentType).toLowerCase()!=="postpaid");
  $("securePayment").classList.toggle("hidden",!needsCard);

  $("paymentCopy").innerHTML=needsCard
    ?`<div class="status">This supplier requires a card guarantee or supplier prepayment. Card details and 3-D Secure authentication are handled through Duffel's secure components.</div>`
    :`<div class="status ok">This rate is postpaid. Payment is handled according to the rental supplier's conditions.</div>`;

  state.cardValid=!needsCard;
  state.paymentReady=!needsCard;

  if(needsCard){
    loading(true,"Preparing secure payment","Requesting a short-lived secure payment component key.");
    post("CAR_RENTAL_PREPARE_SUPPLIER_PAYMENT",{quoteId:quote.id});
  }

  show("checkoutView");
}

function allPoliciesAccepted(){
  return Array.from(document.querySelectorAll("[data-policy]")).every(input=>input.checked);
}

function driver(){
  return{
    givenName:$("firstName").value.trim(),
    familyName:$("lastName").value.trim(),
    email:$("email").value.trim(),
    phoneNumber:$("phone").value.trim(),
    dateOfBirth:$("dob").value
  };
}

function bookingPayload(extra={}){
  return{
    quoteId:state.quote?.id||"",
    paymentType:state.quote?.paymentType||"",
    driver:driver(),
    inboundFlightNumber:$("flightNo").value.trim(),
    supplierLoyaltyProgrammeAccountNumber:$("loyaltyNo").value.trim(),
    alteaBookingId:state.bookingId,
    termsAccepted:$("acceptTerms").checked===true,
    privacyPoliciesAccepted:allPoliciesAccepted(),
    ...extra
  };
}

function validateBooking(){
  const d=driver();
  if(!d.givenName||!d.familyName||!d.email||!d.phoneNumber||!d.dateOfBirth){
    return"Complete the main driver details.";
  }
  if(!/^\+[1-9]\d{7,14}$/.test(d.phoneNumber)){
    return"Enter the driver's phone in international format, including the + country code.";
  }
  if(!$("acceptTerms").checked){
    return"Accept the rental and booking terms.";
  }
  if(!allPoliciesAccepted()){
    return"Accept every supplier privacy policy.";
  }
  if(!state.quote?.id){
    return"The final quote is missing. Re-select the car.";
  }
  return"";
}

async function payAndBook(){
  const problem=validateBooking();
  if(problem){
    toast(problem);
    return;
  }

  const paymentType=String(state.quote?.paymentType||"").toLowerCase();

  if(!paymentType||paymentType==="postpaid"){
    loading(true,"Confirming rental","Sending the validated booking to the rental supplier.");
    post("CAR_RENTAL_BOOK",bookingPayload());
    return;
  }

  if(!state.clientKey){
    toast("Secure payment is not ready yet.");
    return;
  }
  if(!state.cardValid){
    toast("Complete the secure card form.");
    return;
  }

  loading(true,"Securing card","Creating a temporary card token. Your card details stay with the secure supplier payment component.");
  try{
    window.createCardForTemporaryUse();
  }catch(error){
    loading(false);
    toast(error?.message||"Could not start secure card tokenisation.");
  }
}

function initCardForm(){
  const element=document.querySelector("duffel-card-form");
  if(!element||!state.clientKey)return;

  window.renderDuffelCardFormCustomElement({
    clientKey:state.clientKey,
    intent:"to-create-card-for-temporary-use",
    styles:{
      input:{
        default:{
          "font-family":"Montserrat, sans-serif",
          "border-radius":"8px"
        },
        focus:{
          "border-color":"#5fc7cf"
        }
      },
      label:{
        "font-family":"Montserrat, sans-serif",
        "font-weight":"700"
      }
    }
  });

  element.addEventListener("onValidateSuccess",()=>{
    state.cardValid=true;
  });

  element.addEventListener("onValidateFailure",()=>{
    state.cardValid=false;
  });

  element.addEventListener("onCreateCardForTemporaryUseFailure",event=>{
    loading(false);
    toast(event.detail?.error?.message||"Duffel could not tokenize this card.");
  });

  element.addEventListener("onCreateCardForTemporaryUseSuccess",async event=>{
    try{
      const cardId=event.detail?.data?.id;
      if(!cardId)throw new Error("Duffel did not return a temporary card ID.");

      loading(true,"Authenticating payment","Complete the 3-D Secure challenge if your bank requests it.");

      const session=await window.createThreeDSecureSession(
        state.clientKey,
        cardId,
        state.quote.id,
        [],
        true
      );

      if(!session||session.status!=="ready_for_payment"){
        throw new Error("Card authentication is not ready for payment. Please try again.");
      }

      post("CAR_RENTAL_BOOK",bookingPayload({
        threeDSecureSessionId:session.id
      }));
    }catch(error){
      loading(false);
      toast(error?.message||"3-D Secure authentication failed.");
    }
  });
}

function applyBootstrap(payload){
  state.bookingId=payload.bookingId||"";
  const search=payload.search||{};

  if(search.pickupLocationText)$("pickup").value=search.pickupLocationText;
  if(search.dropoffLocationText)$("dropoff").value=search.dropoffLocationText;
  if(search.pickupDate)$("pickupDate").value=search.pickupDate;
  if(search.dropoffDate)$("dropoffDate").value=search.dropoffDate;
  if(search.pickupTime)$("pickupTime").value=search.pickupTime;
  if(search.dropoffTime)$("dropoffTime").value=search.dropoffTime;
  if(search.driverAge)$("driverAge").value=search.driverAge;
  if(search.residenceCountry)$("residence").value=search.residenceCountry;

  syncDateMinimums();
}

function syncDateMinimums(){
  const today=new Date().toISOString().slice(0,10);
  $("pickupDate").min=today;
  $("dropoffDate").min=$("pickupDate").value||today;

  if($("dropoffDate").value&&$("pickupDate").value&&$("dropoffDate").value<$("pickupDate").value){
    $("dropoffDate").value=$("pickupDate").value;
  }
}

window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;

  const message=event.data||{};
  if(message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="CAR_RENTAL_BOOTSTRAP"){
    applyBootstrap(payload);
    return;
  }

  if(message.type==="CAR_RENTAL_SEARCH_RESULT"){
    loading(false);
    state.offers=payload.items||payload.offers||[];
    setStatus(
      `${state.offers.length} live vehicle${state.offers.length===1?"":"s"} found.`,
      "ok"
    );
    renderOffers();
    return;
  }

  if(message.type==="CAR_RENTAL_REPRICE_RESULT"||message.type==="CAR_RENTAL_OFFER_RESULT"){
    loading(false);
    state.quote=payload.quote||payload;
    renderCheckout();
    return;
  }

  if(message.type==="CAR_RENTAL_SUPPLIER_PAYMENT_READY"){
    loading(false);
    state.clientKey=payload.componentClientKey||"";
    if(!state.clientKey){
      toast("Secure supplier payment could not be prepared.");
      return;
    }
    setTimeout(initCardForm,0);
    return;
  }

  if(message.type==="CAR_RENTAL_BOOKING_RESULT"){
    loading(false);

    if(payload.reconciliationRequired===true){
      setStatus(
        "The rental supplier outcome is being reconciled. Do not retry or make another payment. Check My Trips for the latest status.",
        "error"
      );
      toast("Booking is being reconciled. Do not retry.");
      show("resultsView");
      return;
    }

    state.booking=payload.booking||payload;
    state.bookingId=payload.alteaBookingId||state.bookingId;

    $("confirmationRef").textContent=
      state.booking.bookingReference||
      state.booking.reference||
      state.booking.id||
      state.booking.cartId||
      "CONFIRMED";

    show("confirmationView");
    return;
  }

  if(message.type==="CAR_RENTAL_ERROR"){
    loading(false);
    setStatus(payload.message||"The car-rental request failed.","error");
    toast(payload.message||"The car-rental request failed.");
  }
});

$("same").addEventListener("change",()=>{
  $("dropField").classList.toggle("hidden",$("same").checked);
  if($("same").checked)$("dropoff").value=$("pickup").value;
  requestHeight();
});

$("pickup").addEventListener("input",()=>{
  if($("same").checked)$("dropoff").value=$("pickup").value;
});

$("pickupDate").addEventListener("change",syncDateMinimums);
$("searchBtn").addEventListener("click",runSearch);
$("sort").addEventListener("change",renderOffers);

$("offers").addEventListener("click",event=>{
  const button=event.target.closest("[data-rate]");
  if(button)selectRate(button.dataset.rate);
});

$("backBtn").addEventListener("click",()=>show("resultsView"));
$("bookBtn").addEventListener("click",payAndBook);

document.addEventListener("click",event=>{
  const focus=event.target.closest("[data-focus-search]");
  if(focus){
    focusSearch();
    return;
  }

  const nav=event.target.closest("[data-nav]");
  if(nav){
    post("CAR_RENTAL_NAVIGATE",{path:nav.dataset.nav});
  }
});

let heightTimer=0;
function requestHeight(){
  clearTimeout(heightTimer);
  heightTimer=setTimeout(()=>{
    post("CAR_RENTAL_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },60);
}

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

syncDateMinimums();
post("CAR_RENTAL_READY",{version:"B-011.1"});
requestHeight();

})();
</script>
</body>
</html>
```
