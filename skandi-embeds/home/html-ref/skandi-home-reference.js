
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
