# INFO / LOG — SKANDI Home Duffel Flight Explorer

- **Source file:** `/HTML_REF/skandi/Home.md`
- **Display / page name:** Home · Duffel Flight Explorer
- **System area:** SKANDI customer-facing
- **Wix route:** `/`
- **Wix page controller:** `/src/pages/Home.n73w8.js`
- **Wix HTML element ID:** `#htmlHome` (new, must be created in Wix Studio)
- **Runtime embed source:** `SKANDI_HOME_DUFFEL_EXPLORER`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Canonical web facade:** `/src/backend/SKANDI_CORE/customerBooking.web.js`, `searchLiveFlightOffers`
- **Canonical backend core:** `/src/backend/SKANDI_CORE/customerBooking.js`, `searchLiveFlightOffersCore`
- **Canonical provider/client:** `/src/backend/SKANDI_CORE/duffelAir.js` → `/src/backend/SKANDI_CORE/duffelClient.js`
- **Search handoff:** `/src/public/bookingSearch.js` to existing `/booking` V12 `stateOffer`
- **Authorization:** public read-only flight search; cart/checkout session and all mutations remain under `/booking` and existing member/cart ownership checks
- **Provider tokens/secrets:** server-only, none in HTML
- **Verification:** STATICALLY VERIFIED Node syntax, browser layout and mocked UI response; REQUIRES LIVE TEST on Wix for provider, checkout handoff, responsive height and permissions
- **Last inspected:** 2026-10-19; GitHub `skanditravels/SKANDI-TRAVELS`, default branch `main`

## INFO / architecture

This is an additive read-only supplier flight explorer that does not replace the canonical V12 booking state machine. Search calls the existing `customerBooking.web.searchLiveFlightOffers` method (normalization already limits results to 50). Selection does not trust or mutate the browser's offered supplier ID; it routes the selected search parameters into canonical `/booking` to requery authoritative inventory and create an owned cart there.

## Bridge contracts

- Child → parent: `HOME_DUFFEL_READY` (no payload); `HOME_DUFFEL_SEARCH` (`payload.search`); `HOME_DUFFEL_CONTINUE` (`payload.search`, `payload.offerId` for UI reference only).
- Parent → child: `HOME_DUFFEL_HOST_READY`; `HOME_DUFFEL_RESULTS` (`payload.items`, `payload.meta`); `HOME_DUFFEL_BOOKING_ROUTE` (`payload.path`); `HOME_DUFFEL_ERROR` (`payload.message`). Results/errors echo `requestId`.
- Payment: untouched Stripe PaymentIntent/3DS/reconciliation flow on the V12 Booking state; no direct provider payments from Home.

## CHANGE LOG

- 2026-10-19 — New additive premium responsive Duffel supplier flight explorer. Supports one-way/return search, traveler ages, infant validation, cabin and stops, provider carrier/segment/aircraft/terminal/baggage projections, fare-card filtering/sorting, bounded loaders and canonical `/booking` handoff. No checkout mutation, database change or new provider integration.


- 2026-10-28 UTC — Updated `skandi-embeds/home/skandi-home.receiver.html` to follow the current shared receiver pattern with page-specific startup, progress and failure messages for **Home** (`/`). The expected route matches `src/public/siteMap.js`; master-page handshake, staff authorization, manifest/SHA-256 checks and nested-iframe rejection remain intact.

## Known limitations

- No live deployment was performed. This is **not** the `/booking`-in-Home conversion; the Home Wix editor does not presently have the verified eight booking state elements.
- Duffel data availability is endpoint-specific. This embed displays the subset exposed by the current `mapOfferForHome` rather than fabricating missing values. Advanced full-offer tax/conditions, fare-family grouping, upsells, separate seat-map search, loyalty restrictions, multi-city and gated split-ticket order workflows require separately verified canonical backend changes and complete checkout testing.
- This file is a new HTML_REF reference artifact and is not imported at runtime.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<title>SKANDI · Home</title>
<style>
:root{--navy:#022e64;--aqua:#5fc7cf;--soft:#eaf4f8;--line:#dce7ee;--ink:#122a42;--muted:#52677d;--white:#fff;--danger:#ad2333;--shadow:0 14px 36px rgba(1,38,79,.08)}
*{box-sizing:border-box}html,body{margin:0;padding:0;width:100%;min-height:100%;font-family:Montserrat,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:var(--ink);background:#f5f8fb;-webkit-text-size-adjust:100%}button,input,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.6;cursor:not-allowed}a{color:var(--navy)}#shell{max-width:1180px;margin:0 auto;padding:28px 24px 80px}#heading{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:22px}#eyebrow{font-size:11px;letter-spacing:.23em;text-transform:uppercase;font-weight:800;color:#176c94}h1{margin:9px 0 7px;font-size:clamp(27px,4vw,40px);line-height:1.12;letter-spacing:-.036em;font-weight:800;color:var(--navy)}#heading p{margin:0;font-size:13px;color:var(--muted);line-height:1.55}#mark{font-size:11px;font-weight:800;color:var(--navy);letter-spacing:.08em;white-space:nowrap}#search-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:var(--shadow)}#fields{display:grid;grid-template-columns:1.12fr 1.12fr 1fr 1fr;gap:12px}.field{display:flex;flex-direction:column;gap:6px;min-width:0}.field label{font-size:11px;font-weight:800;color:#334b62;letter-spacing:.025em}.field input,.field select{appearance:none;width:100%;min-width:0;height:46px;border:1px solid #cddbe6;border-radius:9px;background:#fff;padding:0 12px;color:#102d49;font-size:16px;font-weight:600;outline:none}.field input:focus,.field select:focus{border-color:#077cbb;box-shadow:0 0 0 3px rgba(64,170,201,.13)}.field input::placeholder{color:#9aabba;font-weight:400}#ages{display:none;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:13px}#ages.visible{display:grid}#ages select{height:43px;border:1px solid #cddbe6;border-radius:9px;background:#fff;padding:0 8px;font-size:16px;color:#102d49}.more{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1.35fr;gap:12px;margin-top:13px;align-items:end}.action{height:46px;background:var(--navy);border:1px solid var(--navy);border-radius:9px;color:#fff;font-size:12px;font-weight:800;letter-spacing:.04em}.action:hover{background:#06427f}.action:focus-visible,.secondary:focus-visible,.details:focus-visible{outline:3px solid var(--aqua);outline-offset:2px}#message{font-size:12px;line-height:1.55;min-height:18px;color:var(--muted);margin:13px 2px 0}#message.error{color:var(--danger)}#result-head{display:flex;justify-content:space-between;gap:20px;align-items:center;margin:24px 0 14px}#result-count{font-size:14px;font-weight:800;color:var(--navy)}#filters{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#filters select{font-size:13px;background:#fff;border:1px solid var(--line);border-radius:8px;height:38px;padding:0 12px;color:var(--navy)}#cards{display:grid;gap:14px}.offer{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 6px 18px rgba(2,46,100,.045)}.offer-top{padding:19px;display:flex;align-items:center;gap:15px}.logo{width:52px;height:52px;object-fit:contain;border:1px solid var(--line);border-radius:10px;padding:5px;background:#fff}.logo-fallback{width:52px;height:52px;border-radius:10px;background:var(--soft);display:grid;place-items:center;font-size:17px;font-weight:800;color:var(--navy)}.route{flex:1;min-width:0}.carrier{font-size:11px;color:#345c78;font-weight:800}.route-title{font-size:20px;font-weight:800;letter-spacing:-.03em;color:var(--navy);margin:3px 0}.route-sub{font-size:12px;color:var(--muted);line-height:1.55}.price{text-align:right;white-space:nowrap}.price .amount{font-size:23px;font-weight:800;letter-spacing:-.045em;color:var(--navy)}.price small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.offer-bottom{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:11px 19px;background:#f9fbfd;border-top:1px solid var(--line)}.tags{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.tag{display:inline-flex;align-items:center;border-radius:5px;padding:5px 8px;background:#e7f3f6;color:#134d70;font-size:10px;font-weight:800}.tag.gray{background:#e9eef4;color:#53667c}.offer-actions{display:flex;gap:8px;align-items:center}.secondary,.details{border:1px solid #b8cfdb;border-radius:8px;background:#fff;color:var(--navy);padding:10px 13px;font-weight:800;font-size:11px}.secondary:hover,.details:hover{background:#eef6fa}.details-section{display:none;padding:14px 19px 19px;border-top:1px solid var(--line)}.details-section.open{display:block}.detail-slice{border-bottom:1px solid #e2eaf0;padding:9px 0}.detail-slice:last-child{border-bottom:0}.detail-slice h3{margin:5px 0 12px;font-size:12px;color:var(--navy);font-weight:800}.segment{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:start;padding:10px 0}.segment strong{font-size:14px;color:var(--navy)}.segment small{display:block;color:#5a6d82;font-size:11px;line-height:1.65}.seg-middle{font-size:11px;font-weight:700;color:#7b8e9e;text-align:center}.operator{font-size:11px;color:#4f657a;margin:5px 0 2px}.data-lines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 20px;margin-top:9px;color:#38546d;font-size:11px;line-height:1.5}.empty{padding:38px 24px;text-align:center;color:#587187;border:1px dashed #cad9e4;border-radius:15px;background:#fff;font-size:13px}#loading{position:fixed;inset:0;background:rgba(1,24,52,.43);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:100;padding:22px}#loading.active{display:flex}#loading-card{max-width:340px;width:100%;border-radius:19px;background:#fff;padding:32px;text-align:center;box-shadow:0 22px 80px #0626464d}#spinner{height:36px;width:36px;border:3px solid #d8e9ef;border-top-color:var(--navy);border-radius:50%;animation:turn .8s linear infinite;margin:0 auto 15px}#loading-card strong{display:block;color:var(--navy);font-size:16px}#loading-card p{color:var(--muted);font-size:12px;line-height:1.6}#loading-card button{margin-top:8px;border:1px solid var(--line);padding:10px 20px;background:#fff;border-radius:9px;color:var(--navy);font-size:12px;font-weight:700}@keyframes turn{to{transform:rotate(360deg)}}
@media(max-width:850px){#shell{padding:20px 16px 108px}#fields{grid-template-columns:repeat(2,minmax(0,1fr))}.more{grid-template-columns:repeat(2,minmax(0,1fr))}.more .action{grid-column:span 2}#heading{align-items:flex-start}#mark{display:none}}
@media(max-width:520px){#shell{padding:20px 12px 105px}#search-card{padding:15px;border-radius:14px}#heading{margin:6px 4px 16px}#heading h1{font-size:29px}#fields{gap:9px}.more{gap:9px}.offer-top{padding:14px;gap:10px;align-items:flex-start}.logo,.logo-fallback{width:40px;height:40px}.route-title{font-size:18px}.price .amount{font-size:19px}.offer-bottom{padding:10px 14px;flex-wrap:wrap}.offer-actions{width:100%;justify-content:flex-end}.secondary,.details{flex:1;min-height:42px}#result-head{align-items:flex-start;flex-direction:column;gap:12px}.segment{gap:6px}.data-lines{grid-template-columns:1fr}.field input,.field select{font-size:16px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
<main id="shell">
  <header id="heading"><div><div id="eyebrow">SKANDI TRAVELS · LIVE AIR SEARCH</div><h1>Find your next flight.</h1><p>Explore airline-operated journeys with real supplier pricing.</p></div><div id="mark">SKANDI TRAVELS</div></header>
  <section id="search-card" aria-label="Search available flights">
    <form id="search-form" novalidate>
      <div id="fields">
        <div class="field"><label for="origin">From · airport code</label><input id="origin" name="origin" minlength="3" maxlength="3" required placeholder="JFK" autocomplete="off" spellcheck="false" autocapitalize="characters"></div>
        <div class="field"><label for="destination">To · airport code</label><input id="destination" name="destination" minlength="3" maxlength="3" required placeholder="ARN" autocomplete="off" spellcheck="false" autocapitalize="characters"></div>
        <div class="field"><label for="depart">Departure</label><input id="depart" name="depart" type="date" required></div>
        <div class="field"><label for="return">Return · optional</label><input id="return" name="return" type="date"></div>
      </div>
      <div class="more">
        <div class="field"><label for="adults">Adults</label><select id="adults" name="adults"><option value="1">1 adult</option><option value="2">2 adults</option><option value="3">3 adults</option><option value="4">4 adults</option><option value="5">5 adults</option><option value="6">6 adults</option><option value="7">7 adults</option><option value="8">8 adults</option><option value="9">9 adults</option></select></div>
        <div class="field"><label for="cabin">Cabin</label><select id="cabin" name="cabin"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div>
        <div class="field"><label for="connections">Connections</label><select id="connections" name="connections"><option value="1">Up to 1</option><option value="0">Direct only</option><option value="2">Up to 2</option></select></div>
        <div class="field"><label for="children">Children</label><select id="children" name="children"><option value="0">None</option><option value="1">1 child</option><option value="2">2 children</option><option value="3">3 children</option><option value="4">4 children</option></select></div>
        <div class="field"><label for="infants">Infants · under 2</label><select id="infants" name="infants"><option value="0">None</option><option value="1">1 infant</option><option value="2">2 infants</option><option value="3">3 infants</option><option value="4">4 infants</option></select></div>
        <button class="action" id="search" type="submit">SEARCH LIVE FLIGHTS</button>
      </div>
      <div id="ages" aria-live="polite"></div>
    </form>
    <div id="message" role="status" aria-live="polite">Search live airline availability. Prices are rechecked before booking.</div>
  </section>
  <section id="results" aria-label="Flight offers"><div id="result-head"><div id="result-count" aria-live="polite">Flight results</div><div id="filters"><label for="sort">Sort</label><select id="sort"><option value="price">Lowest total</option><option value="duration">Shortest itinerary</option><option value="departure">Earliest departure</option></select><label for="airline">Airline</label><select id="airline"><option value="">All airlines</option></select></div></div><div id="cards"><div class="empty">Enter your flight details to see current available offers.</div></div></section>
</main>
<div id="loading" role="dialog" aria-modal="true" aria-labelledby="loading-title" aria-describedby="loading-copy"><div id="loading-card"><div id="spinner" aria-hidden="true"></div><strong id="loading-title">Searching available flights</strong><p id="loading-copy">Contacting airline suppliers and reviewing current fares.</p><button id="cancel" type="button">Cancel search</button></div></div>
<script>
(function(){
'use strict';
const SOURCE='SKANDI_HOME_DUFFEL_EXPLORER',PARENT='SKANDI_WIX_PARENT';
const $=id=>document.getElementById(id);
let requestSequence=0,activeId='',busy=false,offers=[],searchContext=null,hostReady=false,watchdog=null;
const arr=v=>Array.isArray(v)?v:[]; const text=v=>String(v??'');
function esc(v){return text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function post(type,payload={},requestId=''){const msg={source:SOURCE,type,payload,timestamp:new Date().toISOString()};if(requestId)msg.requestId=requestId;window.parent.postMessage(msg,'*');}
function rid(type){requestSequence++;return type+'-'+Date.now()+'-'+requestSequence;}
function notify(message,error=false){$('message').textContent=message;$('message').classList.toggle('error',error);}
function lock(flag,title){if(watchdog){clearTimeout(watchdog);watchdog=null;}busy=flag;$('search').disabled=flag;$('cancel').disabled=!flag;$('loading').classList.toggle('active',flag);$('loading-title').textContent=title||'Searching available flights';document.body.style.overflow=flag?'hidden':'';}
function cleanAirport(id){$(id).value=$(id).value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);return $(id).value;}
function dateValid(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'));}
function collect(){let origin=cleanAirport('origin'),destination=cleanAirport('destination'),departureDate=$('depart').value,returnDate=$('return').value;
 if(!/^[A-Z0-9]{3}$/.test(origin)||!/^[A-Z0-9]{3}$/.test(destination)||origin===destination)throw Error('Enter different three-character origin and destination airport codes.');
 const today=new Date();let localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 if(!dateValid(departureDate)||departureDate<localToday)throw Error('Choose a departure date today or later.');
 if(returnDate&&(!dateValid(returnDate)||returnDate<departureDate))throw Error('Return date must be on or after departure.');
 const adults=Number($('adults').value),children=Number($('children').value),infants=Number($('infants').value);
 if(adults+children+infants>9)throw Error('A flight search can include up to nine travelers.');
 if(infants>adults)throw Error('Each infant needs a separate adult traveler.');
 const childAges=[...$('ages').querySelectorAll('select')].map(s=>Number(s.value));
 if(children!==childAges.length||childAges.some(a=>!Number.isInteger(a)||a<2||a>17))throw Error('Choose the age of every child at the time of travel.');
 return{tripType:'flightOnly',origin,destination,departureDate,returnDate:returnDate||null,adults,children,childAges,infants,cabinClass:$('cabin').value,maxConnections:Number($('connections').value)};
}
function money(v,c){const n=Number(v);if(!Number.isFinite(n))return 'Price on request';return new Intl.NumberFormat('en-US',{style:'currency',currency:c||'USD'}).format(n);}
function airport(v){return v?.iataCode||v?.iataCityCode||'—';}
function airlineName(x){return x?.owner?.name||x?.operatingCarriers?.[0]?.name||'Airline';}
function segs(x){return arr(x.slices).flatMap(s=>arr(s.segments));}
function epoch(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:Infinity;}
function duration(x){return arr(x.slices).reduce((a,s)=>a+(isoMinutes(s.duration)||arr(s.segments).reduce((n,g)=>n+(isoMinutes(g.duration)||0),0)),0);}
function isoMinutes(s){const m=/^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(text(s));return m?Number(m[1]||0)*60+Number(m[2]||0):0;}
function logo(c){const src=c?.logoSymbolUrl;return /^https:\/\//.test(src||'')?'<img class="logo" src="'+esc(src)+'" alt="'+esc(c?.name||'Airline')+' logo" loading="lazy" referrerpolicy="no-referrer">':'<div class="logo-fallback" aria-hidden="true">'+esc((c?.iataCode||'SK').slice(0,2))+'</div>';}
function dataLine(label,value){return value?'<div><strong>'+esc(label)+':</strong> '+esc(value)+'</div>':'';}
function segmentHtml(seg){const from=seg.origin||{},to=seg.destination||{};const operator=seg.operatingCarrier||{},marketing=seg.marketingCarrier||{};
 const flightCode=(marketing.iataCode||'')+text(seg.marketingFlightNumber||'');
 const op=operator.name?'Operated by '+esc(operator.name)+(seg.operatingFlightNumber?' · '+esc((operator.iataCode||'')+seg.operatingFlightNumber):''):'';
 return'<div class="segment"><div><strong>'+esc(airport(from))+'</strong><small>'+esc(seg.departingAt||'Time not provided')+'</small><small>'+esc(from.name||'')+(seg.originTerminal?' · Terminal '+esc(seg.originTerminal):'')+'</small></div><div class="seg-middle">'+esc(seg.duration||'')+'<br>→</div><div><strong>'+esc(airport(to))+'</strong><small>'+esc(seg.arrivingAt||'Time not provided')+'</small><small>'+esc(to.name||'')+(seg.destinationTerminal?' · Terminal '+esc(seg.destinationTerminal):'')+'</small></div></div>'+
 '<p class="operator">'+(flightCode?'Flight '+esc(flightCode)+' · ':'')+op+'</p><div class="data-lines">'+dataLine('Aircraft',seg.aircraft?.name||seg.aircraft?.iataCode)+dataLine('Distance',seg.distance)+dataLine('Marketing airline',marketing.name)+dataLine('Operating airline',operator.name)+dataLine('Technical stops',arr(seg.stops).length?arr(seg.stops).map(x=>x.airport?.name||x.airport?.iataCode||'Stop').join(', '):null)+arr(seg.passengers).map(p=>dataLine('Cabin / fare',p.cabinClassMarketingName||p.cabinClass)+dataLine('Included bags',arr(p.baggages).map(b=>[b.quantity,b.type,b.weight?b.weight+' '+(b.weightUnit||''):''].filter(Boolean).join(' ')).join('; '))).join('')+'</div>';
}
function detailsHtml(x){return arr(x.slices).map((s,i)=>'<section class="detail-slice"><h3>'+(arr(x.slices).length===1?'Your journey':'Journey '+(i+1))+' · '+esc(airport(s.origin))+' → '+esc(airport(s.destination))+(s.fareBrandName?' · '+esc(s.fareBrandName):'')+'</h3>'+arr(s.segments).map(segmentHtml).join('')+'</section>').join('');}
function render(){const sort=$('sort').value,airline=$('airline').value;const shown=offers.filter(x=>!airline||airlineName(x)===airline).sort((a,b)=>sort==='duration'?duration(a)-duration(b):sort==='departure'?epoch(segs(a)[0]?.departingAt)-epoch(segs(b)[0]?.departingAt):Number(a.totalAmount)-Number(b.totalAmount));$('result-count').textContent=shown.length+' flight option'+(shown.length===1?'':'s');
 $('cards').innerHTML=shown.length?shown.map((x,i)=>{const s=arr(x.slices)[0]||{},f=segs(x),name=airlineName(x),direct=arr(s.segments).length<=1;const expired=epoch(x.expiresAt)<Date.now();return'<article class="offer"><div class="offer-top">'+logo(x.owner)+'<div class="route"><div class="carrier">'+esc(name)+'</div><div class="route-title">'+esc(airport(s.origin))+' → '+esc(airport(s.destination))+'</div><div class="route-sub">'+esc(s.segments?.[0]?.departingAt?.slice(0,16)?.replace('T',' ')||'Departure subject to confirmation')+' · '+(direct?'Nonstop':(arr(s.segments).length-1)+' connection(s)')+'</div></div><div class="price"><div class="amount">'+esc(money(x.totalAmount,x.totalCurrency))+'</div><small>Trip total · '+esc(x.totalCurrency||'')+'</small></div></div><div class="offer-bottom"><div class="tags"><span class="tag">'+esc($('cabin').selectedOptions[0].textContent)+'</span><span class="tag gray">'+(direct?'Direct':(arr(s.segments).length-1)+' stop(s)')+'</span>'+(x.expiresAt?'<span class="tag gray">'+(expired?'Offer expired':'Recheck before purchase')+'</span>':'')+'</div><div class="offer-actions"><button class="details" type="button" data-action="detail" data-id="'+esc(x.id)+'" aria-expanded="false">Flight details</button><button class="secondary" type="button" data-action="choose" data-id="'+esc(x.id)+'" '+(expired||busy?'disabled':'')+'>Continue</button></div></div><div class="details-section" id="detail-'+i+'">'+detailsHtml(x)+'</div></article>';}).join(''):'<div class="empty">No current offers match this search or filter. Change the criteria and try again.</div>';
 $('cards').querySelectorAll('button[data-action]').forEach(b=>b.addEventListener('click',()=>{const id=b.getAttribute('data-id');const card=b.closest('.offer');if(b.dataset.action==='detail'){const sec=card.querySelector('.details-section');const open=sec.classList.toggle('open');b.setAttribute('aria-expanded',String(open));b.textContent=open?'Hide details':'Flight details';}else{if(!searchContext)return;lock(true,'Opening secure booking');activeId=rid('continue');const stamp=activeId;watchdog=setTimeout(()=>{if(activeId===stamp)fail('Could not open checkout. Your booking has not been placed. Please retry from live results.');},15000);post('HOME_DUFFEL_CONTINUE',{search:searchContext,offerId:id},activeId);}}));
}
function populateAirlines(){const old=$('airline').value;const names=[...new Set(offers.map(airlineName))].sort();$('airline').innerHTML='<option value="">All airlines</option>'+names.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');$('airline').value=names.includes(old)?old:'';}
function fail(message){lock(false);activeId='';notify(message,true);}
$('search-form').addEventListener('submit',e=>{e.preventDefault();if(busy)return;let search;try{search=collect();}catch(err){notify(err.message,true);return;}searchContext=search;offers=[];populateAirlines();$('cards').innerHTML='<div class="empty">Finding available flights…</div>';activeId=rid('search');lock(true,'Searching available flights');notify('Contacting airline suppliers…');const stamp=activeId;watchdog=setTimeout(()=>{if(activeId===stamp)fail('The airline search timed out. Try again with your current criteria.');},95000);post('HOME_DUFFEL_SEARCH',{search},activeId);});
$('cancel').addEventListener('click',()=>{if(!busy)return;activeId='';lock(false);notify('Search view closed. Supplier queries may still finish.');});
$('sort').addEventListener('change',render);$('airline').addEventListener('change',render);
$('children').addEventListener('change',()=>{const count=Number($('children').value),ages=$('ages');const current=[...ages.querySelectorAll('select')].map(x=>x.value);ages.innerHTML=Array.from({length:count},(_,i)=>'<div class="field"><label for="child-age-'+i+'">Child '+(i+1)+' age</label><select id="child-age-'+i+'" required><option value="">Select age</option>'+Array.from({length:16},(_,j)=>'<option value="'+(j+2)+'" '+(current[i]===String(j+2)?'selected':'')+'>'+(j+2)+' years</option>').join('')+'</select></div>').join('');ages.classList.toggle('visible',count>0);});
window.addEventListener('message',e=>{if(e.source!==window.parent)return;let m=e.data;if(typeof m==='string'){try{m=JSON.parse(m);}catch(_){return;}}if(!m||m.source!==PARENT)return;
 if(m.type==='HOME_DUFFEL_HOST_READY'){hostReady=true;return;}
 if(!['HOME_DUFFEL_RESULTS','HOME_DUFFEL_ERROR','HOME_DUFFEL_BOOKING_ROUTE'].includes(m.type))return;
 if(!activeId||m.requestId!==activeId)return;
 if(m.type==='HOME_DUFFEL_ERROR'){fail(m.payload?.message||'The flight service could not complete the request.');return;}
 if(m.type==='HOME_DUFFEL_RESULTS'){lock(false);activeId='';offers=arr(m.payload?.items).filter(x=>x&&typeof x==='object'&&x.id&&!x.partial&&!x.isExpired);populateAirlines();render();notify(offers.length?'Live offers loaded. The final fare will be checked during booking.':'No available flights were returned. Change your search dates or airports.');return;}
 if(m.type==='HOME_DUFFEL_BOOKING_ROUTE'){notify('Opening secure checkout…');return;}
});
const today=new Date();$('depart').min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');$('return').min=$('depart').min;$('depart').addEventListener('change',()=>$('return').min=$('depart').value||$('depart').min);
post('HOME_DUFFEL_READY');
})();
</script>
</body>
</html>

```
