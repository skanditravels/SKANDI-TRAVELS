(()=>{
"use strict";
const SOURCE="SKANDI_PUBLIC_TRAVEL_INFO";
const PARENT="SKANDI_WIX_PARENT";
const VERSION="SKANDI-TRAVEL-INFO-V12";
const PAGE_SIZE=24;
const BOOTSTRAP_WATCHDOG_MS=20000;
const INITIAL_BRIDGE_WATCHDOG_MS=30000;
const REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;

/* SERVER STATE */
let DATA={
  airlines:[],airports:[],hotels:[],transfers:[],tours:[],activities:[],tickets:[],
  helpCenter:{groups:[],topics:[]},articles:[],travelRequirements:[]
};

/* UI STATE */
const STATE={
  dataState:"idle",
  activeLibrary:"all",
  activeJourneyGroup:"",
  activeDetail:null,
  activeAirlineTab:"overview",
  activeAirportTab:"overview",
  activeAirportBoardType:"departures",
  airportShowEarlier:false,
  airportContexts:new Map(),
  airportContextPending:new Set(),
  airportContextRequest:null,
  airportFlights:new Map(),
  airportFlightPending:new Set(),
  airportFlightRequest:null,
  airportRequestSerial:0,
  airportFlightRequestSerial:0,
  searchIndex:[],
  searchOpen:false,
  searchQuery:"",
  searchCursor:0,
  visibleCount:PAGE_SIZE,
  directoryOverride:null,
  homeScrollY:0,
  overlayMode:"",
  overlayReturnFocus:null,
  requirementsPending:false,
  supportPending:false,
  aircraftBundles:new Map(),
  aircraftPending:new Set(),
  weatherCache:new Map(),
  weatherPending:new Set()
};

const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const text=v=>String(v??"").trim();
const lower=v=>text(v).toLowerCase();
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const human=v=>text(v).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const uniq=a=>[...new Set(arr(a).map(text).filter(Boolean))];
const safeInternal=p=>/^\/(?!\/)[^\s]*$/.test(text(p));
const safeExternal=u=>{try{const x=new URL(text(u));return x.protocol==="https:"?x.href:""}catch(_){return""}};
const movement=()=>REDUCED?"auto":"smooth";

const ICONS={
  search:'<svg class="ti-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.7-3.7"></path></svg>',
  arrow:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>',
  back:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M19 12H5"></path><path d="m11 18-6-6 6-6"></path></svg>',
  close:'<svg class="ti-icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"></path></svg>',
  bag:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="13" rx="2"></rect><path d="M9 7V5a3 3 0 0 1 6 0v2M9 11v5M15 11v5"></path></svg>',
  passport:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"></rect><circle cx="12" cy="11" r="3"></circle><path d="M9 17h6M12 8v6M9 11h6"></path></svg>',
  pin:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
  aircraft:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M3 11.5 10 9V4.5c0-1.2.9-2.5 2-2.5s2 1.3 2 2.5V9l7 2.5v2L14 13v5l2.5 1.5V21L12 20l-4.5 1v-1.5L10 18v-5l-7 .5Z"></path></svg>',
  help:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1.1-1.5 2.2"></path><path d="M12 17h.01"></path></svg>',
  message:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M5 18 3 21l5-1h9a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v7a4 4 0 0 0 2 4Z"></path></svg>',
  spark:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"></path><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"></path></svg>',
  hotel:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M3 20V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M17 10h2a2 2 0 0 1 2 2v8M7 8h2M12 8h2M7 12h2M12 12h2M7 16h2M12 16h2M2 20h20"></path></svg>',
  transfer:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M4 7h13l3 4v6H4Z"></path><path d="M7 7V4h7v3M6 17v2M18 17v2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>',
  tour:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M4 20V6l5-2 6 2 5-2v14l-5 2-6-2-5 2Z"></path><path d="M9 4v14M15 6v14"></path></svg>',
  ticket:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4Z"></path><path d="M12 7v12"></path></svg>',
  activity:'<svg class="ti-icon ti-icon-lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6L12 7Z"></path></svg>',
  chevron:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>',
  external:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M14 5h5v5M12 12l7-7"></path><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"></path></svg>',
  refresh:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M20 7v5h-5"></path><path d="M18.5 16a8 8 0 1 1 .8-8.4L20 12"></path></svg>',
  weather:'<svg class="ti-icon ti-icon-sm" viewBox="0 0 24 24"><path d="M7 17h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.8A3.2 3.2 0 0 0 7 17Z"></path></svg>'
};
function icon(name,cls=""){const raw=ICONS[name]||ICONS.help;return cls?raw.replace('class="ti-icon','class="ti-icon '+cls):raw}
function hydrateStaticIcons(root=document){root.querySelectorAll?.("[data-icon]").forEach(el=>{el.innerHTML=icon(el.dataset.icon)})}

function post(type,payload={}){
  try{window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}catch(_){ }
}
function announce(message){$("tiLive").textContent=text(message)}
function setStatus(message,retry=false){
  const el=$("tiStatus");el.replaceChildren();const msg=text(message);el.hidden=!msg;if(!msg)return;
  const span=document.createElement("span");span.textContent=msg;el.append(span);
  if(retry){const button=document.createElement("button");button.type="button";button.className="ti-action-chip";button.style.marginLeft="10px";button.innerHTML=`${icon("refresh")} Try again`;button.addEventListener("click",retryData,{once:true});el.append(button)}
}
let bootstrapWatchdog=0;
function clearBootstrapWatchdog(){if(bootstrapWatchdog){clearTimeout(bootstrapWatchdog);bootstrapWatchdog=0}}
function armBootstrapWatchdog(delay=BOOTSTRAP_WATCHDOG_MS){
  clearBootstrapWatchdog();
  bootstrapWatchdog=setTimeout(()=>{
    bootstrapWatchdog=0;
    if(STATE.dataState!=="loading")return;
    STATE.dataState="error";
    const message="Travel information is taking longer than expected. Please try again.";
    setStatus(message,true);announce(message);
  },delay);
}
function transition(fn){if(!REDUCED&&document.startViewTransition){try{return document.startViewTransition(fn)}catch(_){}}return fn()}

function libraryDefs(){return[
  {key:"airlines",title:"Airline Information",short:"Airlines",icon:"aircraft",className:"ti-gateway-a",sub:"Baggage, check-in, onboard service and aircraft cabins."},
  {key:"airports",title:"Airport Information",short:"Airports",icon:"pin",className:"ti-gateway-b",sub:"Airport facts, transport, terminals and traveler guidance."},
  {key:"hotels",title:"Hotel Information",short:"Hotels",icon:"hotel",className:"ti-gateway-c",sub:"Stay information and practical hotel guidance."},
  {key:"transfers",title:"Transfer Information",short:"Transfers",icon:"transfer",className:"ti-gateway-d",sub:"Meeting points, routes, luggage and transfer instructions."},
  {key:"tours",title:"Tours",short:"Tours",icon:"tour",className:"ti-gateway-e",sub:"Tour details, meeting information and published itineraries."},
  {key:"activities",title:"Activities & Excursions",short:"Activities",icon:"activity",className:"ti-gateway-f",sub:"Experience information, entry guidance and local details."},
  {key:"tickets",title:"Tickets & Vouchers",short:"Tickets",icon:"ticket",className:"ti-gateway-g",sub:"How to use published tickets, vouchers and timed-entry documents."}
]}
function libraryDef(key){return libraryDefs().find(x=>x.key===key)}
function itemsFor(key){return key==="faq"?arr(DATA.helpCenter?.topics):key==="articles"?arr(DATA.articles):arr(DATA[key])}
function itemTitle(x){return formatTextValue(x?.name??x?.title??x?.shortName??x?.code??x?.iataCode??x?.iata)||"Untitled"}
function itemSummary(x){return formatTextValue(x?.summary??x?.subtitle??x?.description??x?.excerpt??x?.body??x?.information??x?.city??x?.country??"")}
function itemLogoUrl(x){return safeExternal(text(x?.logo||x?.logoIcon||x?.logoUrl||x?.logoIconUrl||""))}
function itemHeroUrl(x){return safeExternal(text(x?.heroImage||x?.heroImageUrl||x?.image||x?.image_url||x?.imageUrl||""))}
function itemImage(x){return itemHeroUrl(x)||itemLogoUrl(x)}
function itemCode(x){return text(x?.iataCode||x?.iata||x?.code||x?.icaoCode||x?.icao||"")}
function displayImageUrl(x){return itemImage(x)}
function isLogoMedia(x,url){const logo=itemLogoUrl(x);return Boolean(url&&logo&&url===logo)}
function libraryLabel(key){return key==="faq"||key==="articles"?"Travel Help":libraryDef(key)?.title||"Travel Info"}
function contentSearchText(x){
  return lower([itemTitle(x),itemCode(x),x?.icaoCode,x?.icao,x?.city,x?.country,x?.summary,x?.subtitle,x?.description,x?.excerpt,x?.body,x?.category,x?.destination,x?.aircraftFamilies,x?.loyaltyProgram,x?.baggageAllowance].flat().join(" "))
}
function normalizeContentItem(item,library){return {...item,_library:library,_label:libraryLabel(library),_search:contentSearchText(item)}}
function isSpecialAssistanceContent(x){
  const hay=lower([x?.title,x?.name,x?.slug,x?.category,arr(x?.tags).join(" ")].filter(Boolean).join(" "));
  return /(special assistance|accessib|wheelchair|reduced mobility|mobility assistance|medical assistance|medical equipment|service animal|service dog|guide dog|hidden disabil|disabil|oxygen|cpap)/.test(hay)
}
function publicHelpTopics(){return arr(DATA.helpCenter?.topics).filter(x=>!isSpecialAssistanceContent(x))}
function publicArticles(){return arr(DATA.articles).filter(x=>!isSpecialAssistanceContent(x))}

function buildSearchIndex(){
  const index=[];
  libraryDefs().forEach(def=>itemsFor(def.key).forEach(x=>{const typeTerms=def.key==="airlines"?"airline baggage check-in boarding cabin seat food wifi fleet":def.key==="airports"?"airport terminal transfer check-in security lounge transport":def.key==="hotels"?"hotel stay arrival facilities":def.key==="transfers"?"transfer meeting point luggage route":def.key==="tours"?"tour itinerary meeting pickup":def.key==="activities"?"activity excursion attraction entry":def.key==="tickets"?"ticket voucher qr entry":"";index.push({kind:"content",group:def.short,item:normalizeContentItem(x,def.key),search:`${contentSearchText(x)} ${typeTerms}`})}));
  publicHelpTopics().forEach(x=>index.push({kind:"content",group:"Travel Help",item:normalizeContentItem(x,"faq"),search:contentSearchText(x)}));
  publicArticles().forEach(x=>index.push({kind:"content",group:"Travel Help",item:normalizeContentItem(x,"articles"),search:contentSearchText(x)}));
  const utilities=[
    {id:"baggage",title:"Baggage allowance",sub:"Find baggage guidance by airline.",keywords:"baggage bag carry on checked luggage allowance weight suitcase",icon:"bag"},
    {id:"assistance",title:"Special assistance",sub:"Accessibility, mobility and medical guidance across your journey.",keywords:"special assistance accessibility wheelchair mobility medical oxygen service animal disability",icon:"help"},
    {id:"requirements",title:"Travel requirements",sub:"Check passport and entry guidance for your journey.",keywords:"passport visa entry requirements nationality transit document immigration",icon:"passport"},
    {id:"support",title:"Travel Support",sub:"Send a question to SKANDI Travel Support.",keywords:"support help contact booking question assistance",icon:"message"}
  ];
  utilities.forEach(u=>index.push({kind:"utility",group:"Quick actions",utility:u,search:lower(`${u.title} ${u.sub} ${u.keywords}`)}));
  STATE.searchIndex=index;
}

function networkCounts(){return{
  airlines:arr(DATA.airlines).length,
  airports:arr(DATA.airports).length,
  help:publicHelpTopics().length+publicArticles().length
}}
function renderNetworkMeta(){
  const c=networkCounts();const parts=[];
  if(c.airlines)parts.push(`${c.airlines} airline guide${c.airlines===1?"":"s"}`);
  if(c.airports)parts.push(`${c.airports} airport${c.airports===1?"":"s"}`);
  if(c.help)parts.push(`${c.help} help item${c.help===1?"":"s"}`);
  $("tiNetworkMeta").innerHTML=parts.length?parts.map((v,i)=>`<span>${i?"<i></i>":""}${esc(v)}</span>`).join(""):`<span>Travel guidance updates automatically.</span>`;
}
function renderAtlasCodes(){
  const airports=arr(DATA.airports).filter(a=>itemCode(a)).slice(0,4);
  $("tiAtlasCodes").innerHTML=airports.map(a=>`<div class="ti-code-chip"><strong>${esc(itemCode(a).slice(0,4))}</strong><span>${esc(formatTextValue(a.city??a.country))}</span></div>`).join("")
}

function fallbackJourneyGroups(){return[
  {id:"before",title:"Before you travel",subtitle:"Requirements, documents, baggage and planning."},
  {id:"day",title:"Day of travel",subtitle:"Airport, check-in, baggage and disruption guidance."},
  {id:"flight",title:"The flight",subtitle:"Airline, cabin, seating and onboard information."},
  {id:"hotel",title:"The hotel",subtitle:"Arrival, stay information and local guidance."},
  {id:"destination",title:"At your destination",subtitle:"Transfers, tours, activities and local support."},
  {id:"return",title:"Coming home",subtitle:"Return travel, airport and baggage guidance."}
]}
function journeyGroups(){const live=arr(DATA.helpCenter?.groups).slice().sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));return live.length?live:fallbackJourneyGroups()}
function renderJourney(){
  const groups=journeyGroups();
  $("tiJourneyTrack").innerHTML=groups.map((g,i)=>`<button class="ti-stage-btn" type="button" data-group="${esc(text(g.id||g.groupId||g.group_id||`stage-${i}`))}" aria-pressed="${STATE.activeJourneyGroup===text(g.id||g.groupId||g.group_id)?"true":"false"}"><span class="ti-stage-no">${String(i+1).padStart(2,"0")}</span><span class="ti-stage-arrow">${icon("arrow")}</span><h3>${esc(formatTextValue(g.title)||"Travel help")}</h3><p>${esc(formatTextValue(g.subtitle??g.body)||"Browse guidance for this part of your journey.")}</p></button>`).join("");
  $("tiJourneyTrack").querySelectorAll("[data-group]").forEach(btn=>btn.addEventListener("click",()=>selectJourney(btn.dataset.group,btn.querySelector("h3")?.textContent||"Travel help")))
}
function selectJourney(id,title){
  STATE.activeJourneyGroup=id;STATE.activeLibrary="faq";STATE.visibleCount=PAGE_SIZE;
  const topics=publicHelpTopics().filter(t=>text(t.groupId||t.group_id)===text(id)).map(x=>normalizeContentItem(x,"faq"));
  STATE.directoryOverride=topics;
  renderJourney();renderFilters();renderDirectory();
  $("tiDirectoryHeading").textContent=title;$("tiDirectoryLead").textContent=topics.length?"Guidance for this stage of your journey.":"No guidance is currently assigned to this stage.";
  $("tiDirectory").scrollIntoView({behavior:movement(),block:"start"});
}

function featuredTopics(){let list=publicHelpTopics().filter(t=>t.featured===true);if(!list.length)list=publicHelpTopics().slice(0,6);return list.slice(0,6)}
function renderFeaturedHelp(){
  const topics=featuredTopics();const host=$("tiFeaturedHelp");
  if(!topics.length){host.innerHTML=`<div class="ti-empty-state" style="grid-column:1/-1"><strong>Travel answers are being updated.</strong><span>Published help topics will appear here automatically.</span></div>`;return}
  const lead=topics[0];const rest=topics.slice(1);
  host.innerHTML=`<article class="ti-featured-main"><div class="ti-kicker">Featured guidance</div><h3>${esc(formatTextValue(lead.title)||"Travel information")}</h3><p>${esc(formatTextValue(lead.subtitle??lead.excerpt??lead.body).slice(0,260))}</p><button class="ti-btn ti-btn-aqua" type="button" data-featured-open="0">Read guidance ${icon("arrow")}</button></article><div class="ti-featured-list">${rest.map((q,i)=>`<button class="ti-question-btn" type="button" data-featured-open="${i+1}"><span class="ti-question-index">${String(i+2).padStart(2,"0")}</span><span class="ti-question-copy"><strong>${esc(formatTextValue(q.title)||"Travel question")}</strong><span>${esc(formatTextValue(q.subtitle??q.excerpt??q.body).slice(0,120))}</span></span>${icon("chevron")}</button>`).join("")}</div>`;
  host.querySelectorAll("[data-featured-open]").forEach(btn=>btn.addEventListener("click",()=>openDetail(normalizeContentItem(topics[Number(btn.dataset.featuredOpen)],"faq"))))
}

function renderGateways(){
  $("tiGatewayGrid").innerHTML=libraryDefs().map(def=>`<button class="ti-gateway ${def.className}" type="button" data-library-gateway="${def.key}"><span class="ti-gateway-icon">${icon(def.icon)}</span><h3>${esc(def.title)}</h3><p>${esc(def.sub)}</p><span class="ti-gateway-count">${itemsFor(def.key).length} published</span></button>`).join("");
  $("tiGatewayGrid").querySelectorAll("[data-library-gateway]").forEach(btn=>btn.addEventListener("click",()=>setLibrary(btn.dataset.libraryGateway,true)))
}
function filterDefinitions(){return[{key:"all",title:"All"},...libraryDefs().map(d=>({key:d.key,title:d.short})),{key:"faq",title:"Travel Help"}]}
function setLibrary(key,scroll=false){
  STATE.activeLibrary=key;STATE.activeJourneyGroup="";STATE.directoryOverride=null;STATE.visibleCount=PAGE_SIZE;
  const def=libraryDef(key);$("tiDirectoryHeading").textContent=key==="all"?"Browse Travel Info.":key==="faq"?"Travel help.":def?.title||"Travel Info";
  $("tiDirectoryLead").textContent=key==="all"?"Airlines, airports, stays, transfers and experiences, plus help articles for the questions that come up along the way.":key==="faq"?"Help topics and articles for every stage of the journey.":def?.sub||"Travel Info.";
  renderJourney();renderFilters();renderDirectory();
  if(scroll)$("tiDirectory").scrollIntoView({behavior:movement(),block:"start"})
}
function renderFilters(){
  $("tiFilterTabs").innerHTML=filterDefinitions().map(d=>`<button class="ti-filter-btn" type="button" data-filter="${d.key}" aria-pressed="${STATE.activeLibrary===d.key?"true":"false"}">${esc(d.title)}</button>`).join("");
  $("tiFilterTabs").querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>setLibrary(btn.dataset.filter,false)))
}
function directoryRows(){
  if(STATE.directoryOverride)return STATE.directoryOverride;
  const rows=[];
  const add=(key,list)=>arr(list).forEach(x=>rows.push(normalizeContentItem(x,key)));
  if(STATE.activeLibrary==="all"){
    libraryDefs().forEach(d=>add(d.key,DATA[d.key]));add("faq",publicHelpTopics());add("articles",publicArticles())
  }else if(STATE.activeLibrary==="faq"){
    add("faq",publicHelpTopics());add("articles",publicArticles())
  }else add(STATE.activeLibrary,DATA[STATE.activeLibrary]);
  return rows.sort((a,b)=>(Number(a.sortOrder)||9999)-(Number(b.sortOrder)||9999)||itemTitle(a).localeCompare(itemTitle(b)))
}
function renderEntityMedia(x){
  const url=displayImageUrl(x),code=itemCode(x)||itemTitle(x).slice(0,2).toUpperCase(),logo=isLogoMedia(x,url);
  return `<div class="ti-entity-media${logo?" ti-logo-media":""}">${url?`<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="ti-fallback-mark">${esc(code.slice(0,4))}</span>`}</div>`
}
function entityTags(x){const tags=[];const c=itemCode(x);if(c)tags.push(c);if(x.city)tags.push(x.city);if(x.country)tags.push(x.country);if(x.category)tags.push(x.category);return uniq(tags).slice(0,4)}
function renderDirectory(){
  const rows=directoryRows();const visible=rows.slice(0,STATE.visibleCount);$("tiResultCount").textContent=`${rows.length} ${rows.length===1?"result":"results"}`;
  if(!rows.length){$("tiDirectoryList").innerHTML=`<div class="ti-empty-state"><strong>No information here yet.</strong><span>Try another library or search the full Travel Info collection.</span></div>`;$("tiLoadMoreWrap").hidden=true;return}
  $("tiDirectoryList").innerHTML=visible.map((x,i)=>`<button class="ti-entity" type="button" data-directory-index="${i}" aria-label="Open ${esc(itemTitle(x))}">${renderEntityMedia(x)}<span class="ti-entity-copy"><span class="ti-entity-type">${esc(x._label||libraryLabel(x._library))}</span><h3>${esc(itemTitle(x))}</h3><p>${esc(itemSummary(x).slice(0,250))}</p><span class="ti-entity-tags">${entityTags(x).map(t=>`<span class="ti-mini-tag">${esc(t)}</span>`).join("")}</span></span><span class="ti-entity-chevron">${icon("chevron")}</span></button>`).join("");
  $("tiDirectoryList").querySelectorAll("[data-directory-index]").forEach(btn=>btn.addEventListener("click",()=>openDetail(visible[Number(btn.dataset.directoryIndex)])));
  $("tiLoadMoreWrap").hidden=visible.length>=rows.length;$("tiLoadMore").textContent=`Show ${Math.min(PAGE_SIZE,rows.length-visible.length)} more`;
}

function buildSearchResults(q){
  const term=lower(q);if(!term)return STATE.searchIndex.slice(0,14);
  return STATE.searchIndex.map(entry=>{
    let score=entry.search.includes(term)?40:0;const title=lower(entry.kind==="utility"?entry.utility.title:itemTitle(entry.item));
    if(title===term)score+=100;else if(title.startsWith(term))score+=65;
    if(entry.kind==="utility"&&entry.utility.id==="requirements"&&/(passport|visa|entry|requirement)/.test(term))score+=75;
    if(entry.kind==="utility"&&entry.utility.id==="baggage"&&/(baggage|bag|luggage|carry)/.test(term))score+=75;
    if(entry.kind==="utility"&&entry.utility.id==="assistance"&&/(assist|access|wheel|mobility|medical|oxygen|disabil|service dog|service animal)/.test(term))score+=75;
    if(entry.kind==="content"&&entry.item._library==="airlines"&&lower(itemCode(entry.item))===term)score+=85;
    if(entry.kind==="content"&&entry.item._library==="airports"&&lower(itemCode(entry.item))===term)score+=90;
    return{...entry,score}
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,28)
}
function searchIconMarkup(entry){
  if(entry.kind==="utility")return icon(entry.utility.icon);
  const x=entry.item,url=displayImageUrl(x),isLogo=isLogoMedia(x,url);
  return url?`<span class="ti-search-icon${isLogo?" ti-search-logo":""}"><img src="${esc(url)}" alt="" loading="lazy"></span>`:`<span class="ti-search-icon">${icon(x._library==="airports"?"pin":x._library==="airlines"?"aircraft":x._library==="hotels"?"hotel":"help")}</span>`
}
function renderSearchResults(){
  const list=buildSearchResults(STATE.searchQuery);STATE.searchCursor=Math.max(0,Math.min(STATE.searchCursor,list.length-1));
  if(!list.length){$("tiSearchResults").innerHTML=`<div class="ti-search-empty">No Travel Info matches this search.</div>`;return}
  const groups=[];list.forEach((entry,index)=>{const name=entry.group||"Travel Info";let g=groups.find(x=>x.name===name);if(!g){g={name,items:[]};groups.push(g)}g.items.push({entry,index})});
  $("tiSearchResults").innerHTML=groups.map(g=>`<div class="ti-search-group"><div class="ti-search-group-title">${esc(g.name)}</div>${g.items.map(({entry,index})=>{const title=entry.kind==="utility"?entry.utility.title:itemTitle(entry.item);const sub=entry.kind==="utility"?entry.utility.sub:[itemCode(entry.item),entry.item.city,entry.item.country,itemSummary(entry.item)].filter(Boolean).join(" · ").slice(0,150);return`<button class="ti-search-item" type="button" data-search-index="${index}" data-active="${index===STATE.searchCursor?"true":"false"}">${searchIconMarkup(entry)}<span class="ti-search-copy"><strong>${esc(title)}</strong><span>${esc(sub)}</span></span><span class="ti-search-type">${esc(entry.kind==="utility"?"Tool":entry.item._label||"Info")}</span></button>`}).join("")}</div>`).join("");
  $("tiSearchResults").querySelectorAll("[data-search-index]").forEach(btn=>btn.addEventListener("click",()=>activateSearchResult(list[Number(btn.dataset.searchIndex)])));
  $("tiSearchResults").querySelector('[data-active="true"]')?.scrollIntoView({block:"nearest"})
}
function openSearch(query=""){
  STATE.searchOpen=true;STATE.searchQuery=text(query);STATE.searchCursor=0;$("tiSearchLayer").dataset.open="true";$("tiSearchLayer").setAttribute("aria-hidden","false");document.documentElement.classList.add("ti-lock");
  $("tiSearchInput").value=STATE.searchQuery;renderSearchResults();requestAnimationFrame(()=>$("tiSearchInput").focus())
}
function closeSearch(){STATE.searchOpen=false;$("tiSearchLayer").dataset.open="false";$("tiSearchLayer").setAttribute("aria-hidden","true");document.documentElement.classList.remove("ti-lock");$("tiHeroSearch").focus({preventScroll:true})}
function activateSearchResult(entry){
  if(!entry)return;closeSearch();if(entry.kind==="utility"){openAction(entry.utility.id);return}openDetail(entry.item)
}

function saveHomeContext(){STATE.homeScrollY=window.scrollY}
function openDetail(x){
  if(!x)return;
  saveHomeContext();
  STATE.activeDetail=x;
  STATE.activeAirlineTab=x._library==="airlines"?"overview":"";
  STATE.activeAirportTab=x._library==="airports"?"overview":"";
  STATE.activeAirportBoardType="departures";
  STATE.airportShowEarlier=false;
  transition(()=>{$("tiHome").style.display="none";$("tiDetail").dataset.active="true";renderDetail(x)});
  emit("MASTER_SCROLL_TOP",{reason:"travel-info-detail-open"});
  window.scrollTo({top:0,behavior:movement()});
  announce(`${itemTitle(x)} opened`)
}
function closeDetail(){
  const detail=$("tiDetail"),home=$("tiHome"),mount=$("tiDetailMount");
  if(!detail||!home||!mount)return;
  const restoreY=Number.isFinite(Number(STATE.homeScrollY))?Number(STATE.homeScrollY):0;
  STATE.searchOpen=false;
  STATE.overlayMode="";
  STATE.activeDetail=null;
  STATE.activeAirlineTab="overview";
  STATE.activeAirportTab="overview";
  STATE.activeAirportBoardType="departures";
  STATE.airportShowEarlier=false;
  $("tiSearchLayer")?.setAttribute("data-open","false");
  $("tiSearchLayer")?.setAttribute("aria-hidden","true");
  $("tiOverlay")?.setAttribute("data-open","false");
  $("tiOverlay")?.setAttribute("aria-hidden","true");
  document.documentElement.classList.remove("ti-lock");
  detail.dataset.active="false";
  home.style.display="block";
  mount.replaceChildren();
  announce("Back to Travel Info");
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:restoreY,behavior:"auto"})))
}
function detailFacts(x){
  const rows=[];const add=(k,v)=>{const value=formatTextValue(v);if(value)rows.push([k,value])};
  add("IATA",x.iataCode||x.iata);add("ICAO",x.icaoCode||x.icao);add("City",x.city);add("Country",x.country);add("Timezone",x.timezone);
  if(x.distanceToCityCenterKm!==null&&x.distanceToCityCenterKm!==undefined&&x.distanceToCityCenterKm!=="")add("City centre",`${x.distanceToCityCenterKm} km`);
  add("Loyalty",x.loyaltyProgram);add("Check-in",x.checkInDeadline);add("Duration",x.durationText);add("Meeting point",x.meetingPoint);add("From",x.fromLocation);add("To",x.toLocation);if(x.starRating)add("Rating",`${x.starRating} stars`);return rows
}
function parseStructuredValue(value,depth=0){
  if(depth>6||value===null||value===undefined)return value;
  if(typeof value==="string"){
    const raw=text(value);if(!raw)return"";
    const looksJson=(raw.startsWith("{")&&raw.endsWith("}"))||(raw.startsWith("[")&&raw.endsWith("]"));
    if(looksJson){try{return parseStructuredValue(JSON.parse(raw),depth+1)}catch(_){return raw}}
    return raw
  }
  if(Array.isArray(value))return value.map(item=>parseStructuredValue(item,depth+1)).filter(item=>item!==""&&item!==null&&item!==undefined);
  if(typeof value==="object"){
    const out={};Object.entries(value).forEach(([key,item])=>{const parsed=parseStructuredValue(item,depth+1);if(parsed!==""&&parsed!==null&&parsed!==undefined)out[key]=parsed});return out
  }
  return value
}
function formatTextValue(value){
  const v=parseStructuredValue(value);
  if(v===null||v===undefined||v==="")return"";
  if(typeof v==="string"||typeof v==="number")return text(v);
  if(typeof v==="boolean")return v?"Yes":"No";
  if(Array.isArray(v))return v.map(item=>formatTextValue(item)).filter(Boolean).join("\n");
  if(typeof v==="object"){
    const preferred=v.description??v.summary??v.body??v.text??v.notes??v.information??v.value;
    if(preferred!==undefined){const main=formatTextValue(preferred);if(main)return main}
    return Object.entries(v).flatMap(([key,item])=>{
      const formatted=formatTextValue(item);if(!formatted)return[];return[`${human(key)}: ${formatted.replace(/\n+/g," · ")}`]
    }).join("\n")
  }
  return""
}
function normalizeBullets(values){
  return arr(values).flatMap(value=>{
    const parsed=parseStructuredValue(value);
    if(typeof parsed==="string"||typeof parsed==="number"||typeof parsed==="boolean")return[formatTextValue(parsed)];
    const preferred=parsed&&typeof parsed==="object"?(parsed.label||parsed.title||parsed.body||parsed.description||parsed.notes||parsed.text):"";
    return preferred?[formatTextValue(preferred)]:[]
  }).filter(Boolean)
}
function sectionData(title,body,bullets=[],id=""){
  const raw=parseStructuredValue(body),bodyText=formatTextValue(raw),cleanBullets=normalizeBullets(bullets),displayTitle=formatTextValue(title)||"Travel information";
  return bodyText||cleanBullets.length?{title:displayTitle,body:bodyText,raw,bullets:cleanBullets,id:id||lower(displayTitle).replace(/[^a-z0-9]+/g,"-")}:null
}
function airlineSections(x){
  const s=obj(x.sections),result=[];
  result.push(sectionData("Overview",x.description||x.information||x.body||x.summary,[],"overview"));
  result.push(sectionData(s.checkin?.title||"Check-in",s.checkin?.body||x.checkInDeadline,s.checkin?.bullets,"check-in"));
  result.push(sectionData(s.boarding?.title||"Boarding",s.boarding?.body||x.boarding,s.boarding?.bullets,"boarding"));
  result.push(sectionData(s.cabins?.title||"Cabins & onboard",s.cabins?.body||x.cabins,s.cabins?.bullets,"cabins"));
  result.push(sectionData("Lounges",x.lounges,[],"lounges"));
  result.push(sectionData(s.food?.title||"Food & drink",s.food?.body||x.mealInfo,s.food?.bullets,"food"));
  result.push(sectionData(s.wifi?.title||"Wi-Fi & connectivity",s.wifi?.body||x.wifiInfo,s.wifi?.bullets,"wifi"));
  result.push(sectionData("Children & infants",x.childrenInfants,[],"children"));
  result.push(sectionData("Ticket information",x.ticketTypes,[],"tickets"));
  result.push(sectionData("Hubs",x.hubs,[],"hubs"));
  result.push(sectionData("Fleet summary",x.fleetSummary,[],"fleet"));
  return result.filter(Boolean)
}
function airportSections(x){
  const s=obj(x.sections),result=[];result.push(sectionData("Overview",x.description||x.information||x.body||x.summary,[],"overview"));
  const candidates=[
    ["Arrival",s.arrival?.body||x.arrival,s.arrival?.bullets,"arrival"],["Departure",s.departure?.body||x.departure,s.departure?.bullets,"departure"],
    ["Check-in",s.checkin?.body||x.checkIn,s.checkin?.bullets,"check-in"],["Security",s.security?.body||x.security,s.security?.bullets,"security"],
    ["Transfer",s.transfer?.body||x.transfer,s.transfer?.bullets,"transfer"],["Terminals",x.terminals,[],"terminals"],["Transport",x.transport,[],"transport"],
    ["Lounges",x.lounges,[],"lounges"],["Food & drink",x.foodDrinks,[],"food"],["Airport hotels",x.airportHotels,[],"hotels"],["Destinations served",x.destinationsServing,[],"destinations"],["Lost & found",x.lostFound,[],"lost-found"],
    ["Wi-Fi",s.wifi?.body||x.wifi,s.wifi?.bullets,"wifi"]
  ];candidates.forEach(([title,body,bullets,id])=>result.push(sectionData(title,body,bullets,id)));return result.filter(Boolean)
}
function genericSections(x){const s=obj(x.sections),out=[sectionData("Overview",x.description||x.information||x.body||x.summary,x.bullets,"overview")];Object.entries(s).forEach(([key,value])=>{const o=obj(value),title=o.title||human(key);if(isSpecialAssistanceContent({title,category:key}))return;const sec=sectionData(title,o.body||o.description||value,o.bullets,lower(key));if(sec)out.push(sec)});return out.filter(Boolean)}
function structuredTitle(item){
  const o=obj(item);
  if(formatTextValue(o.terminal))return `Terminal ${formatTextValue(o.terminal)}`;
  return formatTextValue(o.mode??o.name??o.title??o.label??o.category??o.type??o.cabinType??o.cabin??o.travelClass??o.code)
}
function structuredItemHtml(item){
  const value=parseStructuredValue(item);
  if(value===null||value===undefined||value==="")return"";
  if(typeof value!=="object")return `<li>${esc(formatTextValue(value))}</li>`;
  const o=obj(value),title=structuredTitle(o),body=formatTextValue(o.notes??o.description??o.summary??o.body??o.text??o.information??"");
  const consumed=new Set(["terminal","mode","name","title","label","category","type","cabinType","cabin","travelClass","code","notes","description","summary","body","text","information"]);
  const facts=Object.entries(o).flatMap(([key,nested])=>{
    if(consumed.has(key)||nested===null||nested===undefined||nested===""||nested===false)return[];
    const rendered=formatTextValue(nested);if(!rendered)return[];return[[human(key),rendered.replace(/\n+/g," · ")]]
  });
  return `<article class="ti-structured-item">${title?`<h3>${esc(title)}</h3>`:""}${body?`<p>${esc(body)}</p>`:""}${facts.length?`<div class="ti-structured-facts">${facts.map(([key,val])=>`<div class="ti-structured-fact"><b>${esc(key)}</b><span>${esc(val)}</span></div>`).join("")}</div>`:""}</article>`
}
function structuredBodyHtml(raw,bodyText=""){
  const value=parseStructuredValue(raw);
  if(value===null||value===undefined||value==="")return bodyText?`<p class="ti-rich-text">${esc(bodyText)}</p>`:"";
  if(Array.isArray(value)){
    if(!value.length)return"";
    const complex=value.some(item=>item&&typeof item==="object");
    return complex?`<div class="ti-structured-grid">${value.map(item=>item&&typeof item==="object"?structuredItemHtml(item):`<article class="ti-structured-item"><p>${esc(formatTextValue(item))}</p></article>`).join("")}</div>`:`<ul class="ti-structured-list">${value.map(item=>`<li>${esc(formatTextValue(item))}</li>`).join("")}</ul>`
  }
  if(typeof value==="object")return `<div class="ti-structured-grid">${structuredItemHtml(value)}</div>`;
  return `<p class="ti-rich-text">${esc(formatTextValue(value)||bodyText)}</p>`
}
function airlineTabDefinitions(sections){
  const available=new Set(sections.map(section=>section.id));
  return[
    {id:"overview",label:"Overview",sectionIds:["overview","tickets","hubs"]},
    {id:"airport",label:"Airport & boarding",sectionIds:["check-in","boarding","lounges"]},
    {id:"onboard",label:"On board",sectionIds:["cabins","food","wifi","children"]},
    {id:"aircraft",label:"Aircraft",sectionIds:["fleet","aircraft"],always:true},
  ].filter(tab=>tab.always||tab.sectionIds.some(id=>available.has(id)))
}
function storySectionHtml(sec){
  const body=structuredBodyHtml(sec.raw,sec.body);
  return `<section id="tiSec-${esc(sec.id)}" class="ti-story-section" data-detail-section="${esc(sec.id)}"><div class="ti-story-eyebrow">Travel information</div><h2>${esc(sec.title)}</h2>${body}${sec.bullets?.length?`<ul class="ti-bullet-list">${sec.bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`:""}</section>`
}
function airlinePanelsHtml(tabs,sections,aircraftSlot,activeTab){
  const byId=new Map(sections.map(section=>[section.id,section]));
  return tabs.map(tab=>{
    const content=tab.sectionIds.map(id=>id==="aircraft"?aircraftSlot:(byId.has(id)?storySectionHtml(byId.get(id)):"")).join("");
    return `<div id="tiAirlinePanel-${esc(tab.id)}" class="ti-tab-panel" data-airline-panel="${esc(tab.id)}" role="tabpanel" aria-labelledby="tiAirlineTab-${esc(tab.id)}"${tab.id===activeTab?"":" hidden"}>${content}</div>`
  }).join("")
}
function activateAirlineTab(id,x,scroll=true){
  const root=$("tiDetailMount");if(!root)return;
  const button=root.querySelector(`[data-airline-tab="${CSS.escape(id)}"]`);if(!button)return;
  STATE.activeAirlineTab=id;
  root.querySelectorAll("[data-airline-tab]").forEach(tab=>{const active=tab===button;tab.setAttribute("aria-selected",active?"true":"false");tab.setAttribute("tabindex",active?"0":"-1")});
  root.querySelectorAll("[data-airline-panel]").forEach(panel=>{panel.hidden=panel.dataset.airlinePanel!==id});
  if(id==="aircraft"&&x)requestAircraft(x);
  if(scroll)root.querySelector(".ti-section-nav-wrap")?.scrollIntoView({behavior:movement(),block:"start"})
}
function tiAirportIata(x){return text(x?.iataCode||x?.iata||x?.code).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4)}
function tiAirportCacheKey(iata,boardType="departures"){return `${iata}|${boardType}`}
function tiAirportRequestContext(x){
  const iata=tiAirportIata(x);if(!iata)return;
  const key=iata;if(STATE.airportContextPending.has(key)||STATE.airportContexts.has(key))return;
  STATE.airportContextPending.add(key);const requestId=`airport-context-${++STATE.airportRequestSerial}-${Date.now()}`;STATE.airportContextRequest={requestId,iata};
  post("TRAVEL_INFO_AIRPORT_CONTEXT_REQUEST",{iata,boardType:"departures",requestId});
}
function tiAirportRequestFlights(x,boardType="departures",force=false){
  const iata=tiAirportIata(x);if(!iata)return;const type=boardType==="arrivals"?"arrivals":"departures";const key=tiAirportCacheKey(iata,type);
  if(!force&&STATE.airportFlights.has(key))return tiRenderAirportFlights();
  if(STATE.airportFlightPending.has(key))return;
  STATE.airportFlightPending.add(key);const requestId=`airport-flights-${++STATE.airportFlightRequestSerial}-${Date.now()}`;STATE.airportFlightRequest={requestId,iata,boardType:type,key};
  const host=$("tiAirportFlightRows");if(host)host.innerHTML=`<div class="board-message"><span class="board-message-title">LOADING FLIGHTS</span><span class="board-message-note">Retrieving ${esc(type)} for ${esc(iata)}</span></div>`;
  post("TRAVEL_INFO_AIRPORT_FLIGHTS_REQUEST",{iata,boardType:type,requestId});
}
function tiAirportList(value){const v=parseStructuredValue(value);return Array.isArray(v)?v:(v&&typeof v==="object"?[v]:[])}
function tiAirportContext(x){return STATE.airportContexts.get(tiAirportIata(x))||null}
function tiAirportResolved(x){const ctx=tiAirportContext(x);return {...x,...obj(ctx?.airport)}}
function tiAirportListRows(items,titleKeys=["name","title","terminal","mode"],detailKeys=["description","notes","location","access"]){
  const rows=tiAirportList(items).slice(0,6);if(!rows.length)return `<p class="context-empty">No published information for this section.</p>`;
  return rows.map(item=>{if(typeof item!=="object")return `<div class="context-list-item"><strong>${esc(item)}</strong></div>`;const title=titleKeys.map(k=>formatTextValue(item?.[k])).find(Boolean)||"Information";const detail=detailKeys.map(k=>formatTextValue(item?.[k])).find(Boolean)||"";return `<div class="context-list-item"><strong>${esc(title)}</strong>${detail?`<span>${esc(detail)}</span>`:""}</div>`}).join("")
}
function tiAirportHeaderHtml(x){
  const a=tiAirportResolved(x),iata=tiAirportIata(a),image=itemHeroUrl(a),logo=itemLogoUrl(a),summary=itemSummary(a)||`Passenger guide for ${iata}.`;
  const facts=[["IATA",iata],["City",a.city],["Country",a.country],["City center",a.distanceToCityCenterKm!==null&&a.distanceToCityCenterKm!==undefined&&a.distanceToCityCenterKm!==""?`${a.distanceToCityCenterKm} km`:""]].filter(([,v])=>formatTextValue(v));
  tiAirportList(a.quickFacts).forEach(q=>{if(facts.length>=6)return;const o=obj(q);const label=formatTextValue(o.label??o.name),value=formatTextValue(o.value??o.description??o.text);if(label&&value)facts.push([label,value])});
  const actions=[];const website=safeExternal(a.website),contact=safeExternal(a.contactUrl);if(website)actions.push(`<a class="context-action primary" href="${esc(website)}" target="_blank" rel="noopener noreferrer">Official airport site ↗</a>`);if(contact&&contact!==website)actions.push(`<a class="context-action" href="${esc(contact)}" target="_blank" rel="noopener noreferrer">Airport contact ↗</a>`);
  return `<section class="airport-profile" id="tiAirportProfile" style="${a.primaryColor?`--airport-primary:${esc(a.primaryColor)};`:""}${a.accentColor?`--airport-accent:${esc(a.accentColor)};`:""}"><div class="airport-profile-media" ${image?`style="background-image:url('${esc(image)}')"`:""}></div><div class="airport-profile-overlay"></div><div class="wrap airport-profile-inner"><div class="airport-profile-copy">${logo?`<div class="airport-profile-logo"><img src="${esc(logo)}" alt="${esc(itemTitle(a)||iata)} logo" loading="lazy" referrerpolicy="no-referrer"></div>`:""}<div class="airport-profile-code">${esc(iata||"---")}</div><div class="eyebrow light">${esc([formatTextValue(a.city),formatTextValue(a.country)].filter(Boolean).join(" · ")||"Airport guide")}</div><h2>${esc(itemTitle(a)||iata)}</h2><p>${esc(summary)}</p><div class="airport-profile-actions">${actions.join("")}</div></div><div class="airport-profile-facts">${facts.map(([label,value])=>`<div class="profile-fact"><small>${esc(label)}</small><strong>${esc(formatTextValue(value))}</strong></div>`).join("")}</div></div></section>`
}
function tiAirportCommerceCard(item,kind){const image=safeExternal(text(item?.imageUrl||item?.heroImageUrl||item?.image)),title=formatTextValue(item?.title??item?.name??kind),summary=formatTextValue(item?.summary??item?.description),id=text(item?.publicId||item?.id||item?.slug||title);return `<article class="commerce-card ${image?"has-media":"no-media"}">${image?`<div class="commerce-card-media" style="background-image:url('${esc(image)}')"></div>`:""}<div class="commerce-card-copy"><small>${esc(kind)}</small><h3>${esc(title)}</h3>${summary?`<p>${esc(summary)}</p>`:""}<button type="button" data-ti-airport-kind="${esc(kind.toUpperCase())}" data-ti-airport-id="${esc(id)}">Explore →</button></div></article>`}
function tiAirportOverviewHtml(x,overviewSection){
  const ctx=tiAirportContext(x),a=tiAirportResolved(x),commerce=obj(ctx?.commerce),iata=tiAirportIata(a);
  const terminals=tiAirportList(a.terminals),transport=tiAirportList(a.transport),food=tiAirportList(a.foodDrinks),lounges=tiAirportList(a.lounges),hotel=obj(a.airportHotel||a.airportHotels);
  const transfer=arr(commerce.transferOffers)[0];
  const cards=[...arr(commerce.hotels).map(item=>({item,kind:"HOTEL"})),...arr(commerce.tours).map(item=>({item,kind:"EXPERIENCE"}))].slice(0,6);
  const destinations=[...tiAirportList(a.destinationAds).map(item=>({item,kind:"DESTINATION"})),...arr(commerce.destinations).map(item=>({item,kind:"DESTINATION"}))].slice(0,6);
  const practical=[];if(a.distanceToCityCenterKm!==null&&a.distanceToCityCenterKm!==undefined&&a.distanceToCityCenterKm!=="")practical.push(["City center",`${a.distanceToCityCenterKm} km from the airport.`]);if(terminals.length)practical.push(["Terminal planning",`${terminals.length} published terminal ${terminals.length===1?"section":"sections"}.`]);if(transport.length)practical.push(["Ground transport",`${transport.length} documented way${transport.length===1?"":"s"} to continue from the airport.`]);if(lounges.length)practical.push(["Lounges",`${lounges.length} published lounge ${lounges.length===1?"option":"options"}.`]);if(food.length)practical.push(["Food & drink",`${food.length} published dining ${food.length===1?"entry":"entries"}.`]);
  return `<div class="airport-context-grid"><section class="context-module module-terminal"><div class="module-head"><span class="module-sign">T</span><div><small>Airport guide</small><h3>Terminals</h3></div></div><div class="module-body">${tiAirportListRows(terminals,["terminal","name","title"],["notes","description"])}</div></section><section class="context-module module-transport"><div class="module-head"><span class="module-sign">↗</span><div><small>Ground transport</small><h3>From the airport</h3></div></div><div class="module-body">${tiAirportListRows(transport,["mode","name","title"],["notes","description"])}</div></section>${transfer?`<section class="context-module module-transfer"><div class="transfer-ribbon">SKANDI TRANSFER</div><div class="module-head"><span class="module-sign">S</span><div><small>Available with SKANDI</small><h3>${esc(formatTextValue(transfer.title??transfer.name)||"Your transfer")}</h3></div></div><div class="module-body"><p>${esc(formatTextValue(transfer.summary??transfer.description??transfer.destination??transfer.meetingPoint)||"Continue from arrivals with a SKANDI transfer linked to this airport.")}</p><button class="transfer-cta" type="button" data-ti-airport-kind="TRANSFER" data-ti-airport-id="${esc(text(transfer.publicId||transfer.id||transfer.slug||transfer.title))}">View SKANDI Transfer →</button></div></section>`:""}<section class="context-module module-dining"><div class="module-head"><span class="module-sign">⌁</span><div><small>Before the gate</small><h3>Eat &amp; drink</h3></div></div><div class="module-body">${tiAirportListRows(food,["name","title","venue"],["location","notes","description"])}</div></section><section class="context-module module-lounges"><div class="module-head"><span class="module-sign">L</span><div><small>Wait differently</small><h3>Lounges</h3></div></div><div class="module-body">${tiAirportListRows(lounges,["name","title"],["location","access","description"])}</div></section>${Object.keys(hotel).length?`<section class="context-module module-hotel"><div class="module-head"><span class="module-sign">H</span><div><small>Close to the terminal</small><h3>Airport stay</h3></div></div><div class="module-body">${tiAirportListRows([hotel],["hotel","name","title"],["location","description"])}</div></section>`:""}</div>${overviewSection?storySectionHtml(overviewSection):""}${cards.length?`<section class="airport-commerce"><div class="section-head"><div><div class="eyebrow">Continue with SKANDI</div><h2>Turn arrival into the next part of the trip.</h2></div><p>Customer-visible products connected to ${esc(iata)}.</p></div><div class="commerce-grid">${cards.map(({item,kind})=>tiAirportCommerceCard(item,kind)).join("")}</div></section>`:""}${destinations.length?`<section class="airport-destination-edit"><div class="destination-edit-head"><div><span class="destination-edit-code">${esc(iata)}</span><div><div class="eyebrow">From the runway to the destination</div><h2>${esc(formatTextValue(a.city)?`Continue into ${formatTextValue(a.city)}.`:`Continue beyond ${iata}.`)}</h2></div></div></div><div class="destination-edit-grid">${destinations.map(({item})=>tiAirportCommerceCard(item,"DESTINATION")).join("")}</div></section>`:""}${practical.length?`<section class="airport-practical"><div class="section-head"><div><div class="eyebrow">Passenger essentials</div><h2>Useful at ${esc(iata)}.</h2></div></div><div class="practical-grid">${practical.map(([title,copy])=>`<article class="practical-card"><span>${esc(iata)}</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></article>`).join("")}</div></section>`:""}`
}
const TI_AIRLINE_LOGOS=Object.freeze({AS:"https://static.wixstatic.com/shapes/394052_6535b791dd404055903a12f5350d61c3.svg",AA:"https://static.wixstatic.com/shapes/394052_47809f4547c04f6eb7e098c5602ff57c.svg",PG:"https://static.wixstatic.com/shapes/394052_3627db92f99544d8bc42c98e684ce5d4.svg",BA:"https://static.wixstatic.com/shapes/394052_85c56f21c63c42d2b5fba0273ee3b0a6.svg",DL:"https://static.wixstatic.com/shapes/394052_4f692ba92b43482292d87d1c6b7df036.svg",AY:"https://static.wixstatic.com/shapes/394052_97cf9b3a9a884781b3186ededecd7b45.svg",F9:"https://static.wixstatic.com/shapes/394052_cca48f82a42043d79743561a784e92c8.svg",IB:"https://static.wixstatic.com/shapes/394052_3726a2f12dcd44ab8dea7085713902b9.svg",FI:"https://static.wixstatic.com/shapes/394052_e09b3c2f6dfd4ca3a87497e34f538c53.svg",B6:"https://static.wixstatic.com/shapes/394052_d0e052d862be40cba0231eae50b4b5dd.svg",KL:"https://static.wixstatic.com/shapes/394052_0c2eaf7331a147648b444fdb12329073.svg",LH:"https://static.wixstatic.com/shapes/394052_76a1dce4673a429d86b4d816faf88b6d.svg",DY:"https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",D8:"https://static.wixstatic.com/shapes/394052_05f76b5094374d11951f14a93fa1ea88.svg",SK:"https://static.wixstatic.com/shapes/394052_bfbc7fc4f8b74360bf5398ac8d12a280.svg",LX:"https://static.wixstatic.com/shapes/394052_69b2702a5c434d03a9aa0182c430979e.svg",TG:"https://static.wixstatic.com/shapes/394052_c370132e76c64a29befdfd67496234fe.svg",UA:"https://static.wixstatic.com/shapes/394052_6002f849a3574cd4827d4ba1c3d339ef.svg"});
function tiSideEpoch(side,key="scheduled"){
  const raw=text(side?.[key]);
  if(!raw)return NaN;
  const value=new Date(raw).getTime();
  return Number.isFinite(value)?value:NaN
}
function tiProviderClock(value,fallbackRaw=""){
  const raw=text(value);
  if(raw)return raw;
  const source=text(fallbackRaw);
  if(!source)return"—:—";
  const d=new Date(source);
  return Number.isNaN(d.getTime())?source.slice(0,5):new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"UTC"}).format(d)
}
function tiScheduledFlightTime(side){
  return tiProviderClock(side?.scheduledLocal,side?.scheduled)
}
function tiActualFlightTime(side){
  return tiProviderClock(side?.actualLocal,side?.actual)
}
function tiAirportLocalClock(x){
  const zone=text(tiAirportResolved(x)?.timezone)||"UTC";
  try{
    return {
      time:new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:zone}).format(new Date()),
      date:new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"2-digit",month:"short",timeZone:zone}).format(new Date()).toUpperCase()
    }
  }catch(_){
    return {
      time:new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"UTC"}).format(new Date()),
      date:new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date()).toUpperCase()
    }
  }
}
function tiUpdateAirportClock(x){
  const clock=tiAirportLocalClock(x),time=$("tiAirportLocalTime"),date=$("tiAirportLocalDate");
  if(time)time.textContent=clock.time;
  if(date)date.textContent=clock.date
}
function tiAirportDirectoryLabel(side){
  const code=text(side?.iata||side?.icao).toUpperCase();
  const directory=arr(DATA.airports);
  const d=directory.find(a=>text(a.iataCode||a.iata).toUpperCase()===code||text(a.icaoCode||a.icao).toUpperCase()===code);
  const city=text(side?.city||d?.city).replace(/\s+/g," ").trim();
  const name=text(side?.airport||d?.title||d?.name)
    .replace(/\s*\([A-Z0-9]{3,4}\)\s*$/i,"")
    .replace(/\bInternational\b|\bAirport\b/gi,"")
    .replace(/\s+/g," ")
    .trim();
  const cityKey=city.toLowerCase();
  const metroCount=cityKey?directory.filter(a=>text(a?.city).toLowerCase()===cityKey).length:0;
  let place="";
  if(city){
    place=metroCount>1&&code?`${city}/${code}`:city;
  }else if(name){
    place=code?`${name}/${code}`:name;
  }else{
    place=code||"—";
  }
  return {place:place.toUpperCase(),code:""}
}
function tiFlightDisplay(value){
  const raw=text(value).toUpperCase().replace(/\s+/g,"");
  const m=
    raw.match(/^([A-Z0-9]{2})(\d{1,4}[A-Z]?)$/)||
    raw.match(/^([A-Z]{3})(\d{1,4}[A-Z]?)$/);
  return m?`${m[1]} ${m[2]}`:(raw||"—")
}
function tiFlightToken(value){
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g,"")
}
function tiFidsServiceDate(item){
  const side=obj(item?.departure);
  const raw=text(side.scheduled||side.estimated||side.actual);
  if(/^\d{4}-\d{2}-\d{2}/.test(raw))return raw.slice(0,10);
  return ""
}
function tiFidsGroupKey(item){
  const physical=tiFlightToken(item?.operatingFlightIata||item?.flightIata||item?.flightIcao);
  const dep=text(item?.departure?.iata||item?.departure?.airport).toUpperCase();
  const arrv=text(item?.arrival?.iata||item?.arrival?.airport).toUpperCase();
  return [physical,dep,arrv,tiFidsServiceDate(item)].join("|")
}
function tiFidsRichness(item){
  const dep=obj(item?.departure),arrv=obj(item?.arrival);
  return [
    dep.actual,dep.actualLocal,dep.estimated,dep.estimatedLocal,dep.gate,dep.terminal,
    arrv.actual,arrv.actualLocal,arrv.estimated,arrv.estimatedLocal,arrv.gate,arrv.baggage,arrv.terminal,
    item?.operatingAirlineLogoUrl,item?.airlineLogoUrl,item?.live
  ].reduce((score,value)=>score+(value!==undefined&&value!==null&&value!==""?1:0),0)
}
function tiFidsGroupFlights(items){
  const groups=new Map();
  arr(items).forEach(item=>{
    const key=tiFidsGroupKey(item);
    if(!key.replace(/\|/g,""))return;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(item)
  });
  return [...groups.values()].map(rows=>{
    const physical=tiFlightToken(rows[0]?.operatingFlightIata||rows[0]?.flightIata||rows[0]?.flightIcao);
    const native=rows.find(row=>tiFlightToken(row?.flightIata)===physical&&!tiFlightToken(row?.operatingFlightIata));
    const representative=native||rows.slice().sort((a,b)=>tiFidsRichness(b)-tiFidsRichness(a))[0]||{};
    const operatingAirlineIata=text(
      rows.map(row=>row?.operatingAirlineIata).find(Boolean)||
      native?.airlineIata||
      representative?.operatingAirlineIata||
      representative?.airlineIata
    ).toUpperCase();
    const operatingLogo=
      rows.map(row=>safeExternal(row?.operatingAirlineLogoUrl)).find(Boolean)||
      safeExternal(rows.find(row=>text(row?.airlineIata).toUpperCase()===operatingAirlineIata)?.airlineLogoUrl)||
      safeExternal(representative?.airlineLogoUrl)||
      "";
    const operatingName=text(
      rows.find(row=>text(row?.airlineIata).toUpperCase()===operatingAirlineIata)?.airlineName||
      (text(representative?.airlineIata).toUpperCase()===operatingAirlineIata?representative?.airlineName:"")||
      operatingAirlineIata
    );
    const codeshareFlightIatas=[...new Set(rows.map(row=>{
      const marketing=tiFlightToken(row?.flightIata);
      return marketing&&marketing!==physical?marketing:""
    }).filter(Boolean))];
    return {
      ...representative,
      displayFlightIata:physical||tiFlightToken(representative?.flightIata||representative?.flightIcao),
      displayAirlineIata:operatingAirlineIata||text(representative?.airlineIata).toUpperCase(),
      displayAirlineLogoUrl:operatingLogo,
      displayAirlineName:operatingName,
      codeshareFlightIatas
    }
  })
}
function tiBelt(value){
  const raw=text(value).toUpperCase().replace(/^BELT\s*/i,"").trim();
  return raw?`BELT ${raw}`:"—"
}
function tiAirportCompleted(item,arrivals){
  const raw=lower(item?.status),side=arrivals?obj(item?.arrival):obj(item?.departure);
  if(raw.includes("cancel")||raw.includes("divert"))return false;
  if(arrivals){
    return Boolean(side.actual||side.actualLocal||raw.includes("land")||raw.includes("arriv"))
  }
  return Boolean(side.actual||side.actualLocal||raw.includes("depart")||raw==="en-route"||raw==="active")
}
function tiAirportFlightIsEarlier(item,arrivals){
  const side=arrivals?obj(item?.arrival):obj(item?.departure),now=Date.now(),raw=lower(item?.status);
  const actual=tiSideEpoch(side,"actual"),scheduled=tiSideEpoch(side,"scheduled");
  if(raw.includes("cancel")||raw.includes("divert")){
    return Number.isFinite(scheduled)?scheduled<now:false
  }
  if(!tiAirportCompleted(item,arrivals))return false;
  if(Number.isFinite(actual))return actual<=now;
  if(Number.isFinite(scheduled))return scheduled<now;
  return true
}
function tiAirportStatus(item,arrivals,meta){
  const raw=lower(item?.status),side=arrivals?obj(item?.arrival):obj(item?.departure),now=Date.now();
  if(raw.includes("cancel"))return["CANCELLED","flap-bad"];
  if(raw.includes("divert"))return["DIVERTED","flap-bad"];
  if(arrivals&&tiAirportCompleted(item,true)){
    const at=tiActualFlightTime(side);
    return[at==="—:—"?"LANDED":`LANDED ${at}`,"flap-ok"]
  }
  if(!arrivals&&tiAirportCompleted(item,false)){
    const at=tiActualFlightTime(side);
    return[at==="—:—"?"DEPARTED":`DEPARTED ${at}`,"flap-ok"]
  }
  const delay=Number(side?.delay||0);
  const estimated=tiProviderClock(side?.estimatedLocal,side?.estimated);
  const scheduled=tiScheduledFlightTime(side);
  if(delay>0||(
    estimated!=="—:—"&&
    scheduled!=="—:—"&&
    estimated!==scheduled&&
    !raw.includes("cancel")
  )){
    return[
      estimated!=="—:—"?`DELAYED ${estimated}`:`DELAYED ${Math.max(1,Math.round(delay))} MIN`,
      "flap-warn"
    ]
  }
  const operationalTs=tiSideEpoch(side,"estimated");
  const scheduledTs=tiSideEpoch(side,"scheduled");
  const ts=Number.isFinite(operationalTs)?operationalTs:scheduledTs;
  if(!arrivals&&Number.isFinite(ts)){
    const airline=text(item?.displayAirlineIata||item?.operatingAirlineIata||item?.airlineIata).toUpperCase();
    const rule=obj(obj(meta?.boardingRules)[airline]||obj(meta?.boardingRules).DEFAULT);
    const minutes=(ts-now)/60000;
    if(minutes<=Number(rule.final_call_window||15)&&minutes>-5)return["FINAL CALL","flap-warn"];
    if(minutes<=Number(rule.boarding_window||40)&&minutes>Number(rule.final_call_window||15))return["BOARDING","flap-warn"]
  }
  return[raw&&raw!=="unknown"?human(raw).toUpperCase():"ON TIME","flap-ok"]
}
function tiTerminal(v){
  const raw=text(v).toUpperCase().replace(/^TERMINAL\s*/i,"").replace(/^T(?=\d)/,"").trim();
  return raw||"—"
}
function tiFidsRowHtml(item,index,arrivals,entry,extraClass=""){
  const side=arrivals?obj(item.arrival):obj(item.departure);
  const place=arrivals?obj(item.departure):obj(item.arrival);
  const airline=text(item.displayAirlineIata||item.operatingAirlineIata||item.airlineIata).toUpperCase();
  const logo=
    safeExternal(item.displayAirlineLogoUrl)||
    safeExternal(item.operatingAirlineLogoUrl)||
    safeExternal(item.airlineLogoUrl)||
    TI_AIRLINE_LOGOS[airline]||
    "";
  const carrier=text(obj(entry.meta?.boardingRules)[airline]?.name||item.displayAirlineName||item.airlineName||airline||"Airline");
  const flight=tiFlightDisplay(item.displayFlightIata||item.operatingFlightIata||item.flightIata||item.flightIcao);
  const codeshares=arr(item.codeshareFlightIatas).map(tiFlightToken).filter(Boolean);
  const codeshareFirst=codeshares[0]?tiFlightDisplay(codeshares[0]):"—";
  const codeshareData=codeshares.join("|");
  const dest=tiAirportDirectoryLabel(place);
  const status=tiAirportStatus(item,arrivals,entry.meta);
  const facility=arrivals?tiBelt(item.arrival?.baggage):(text(side?.gate).toUpperCase()||"—");
  return `<div class="fids-row fids-layout ${esc(extraClass)}" role="row" style="--row:${index}">
    <div class="fids-cell cell-airline" data-label="Logo" role="cell"><div class="fids-carrier" title="${esc(carrier)}"><span class="fids-tail ${logo?"":"fallback"}" data-code="${esc(airline||"--")}">${logo?`<img src="${esc(logo)}" alt="${esc(carrier)}" decoding="async">`:`<span class="fids-logo-fallback">${esc(airline||"--")}</span>`}</span><span class="fids-carrier-name">${esc(carrier)}</span></div></div>
    <div class="fids-cell cell-flight" data-label="Flight No" role="cell"><div class="fids-flight"><strong>${esc(flight)}</strong></div></div>
    <div class="fids-cell cell-codeshare" data-label="Codeshare" role="cell"><span class="fids-codeshare" data-ti-codeshare data-codeshares="${esc(codeshareData)}" data-codeshare-index="0" aria-label="${esc(codeshares.length?`Codeshares ${codeshares.map(tiFlightDisplay).join(", ")}`:"No codeshare")}"><span data-ti-codeshare-value>${esc(codeshareFirst)}</span>${codeshares.length>1?`<span class="fids-codeshare-rotate" aria-hidden="true">↻</span>`:""}</span></div>
    <div class="fids-cell cell-time" data-label="Time" role="cell"><div class="fids-time"><strong class="fids-time-main">${esc(tiScheduledFlightTime(side))}</strong></div></div>
    <div class="fids-cell cell-place" data-label="${arrivals?"From":"To"}" role="cell"><div class="fids-destination"><strong>${esc(dest.place)}</strong></div></div>
    <div class="fids-cell cell-terminal" data-label="Terminal" role="cell"><span class="fids-terminal">${esc(tiTerminal(side.terminal))}</span></div>
    <div class="fids-cell cell-gate" data-label="${arrivals?"Belt":"Gate"}" role="cell"><span class="fids-gate ${arrivals?"is-belt":""}">${esc(facility)}</span></div>
    <div class="fids-cell cell-remarks" data-label="Remarks" role="cell"><span class="fids-status ${status[1]}">${esc(status[0])}</span></div>
  </div>`
}
function tiAdvanceCodeshareTicker(){
  document.querySelectorAll("#tiAirportFlightRows [data-ti-codeshare]").forEach(node=>{
    const list=text(node.dataset.codeshares).split("|").map(tiFlightToken).filter(Boolean);
    const value=node.querySelector("[data-ti-codeshare-value]");
    if(!value||list.length<2)return;
    const current=Number(node.dataset.codeshareIndex||0);
    const next=(current+1)%list.length;
    node.dataset.codeshareIndex=String(next);
    node.classList.add("is-changing");
    window.setTimeout(()=>{
      value.textContent=tiFlightDisplay(list[next]);
      node.classList.remove("is-changing")
    },160)
  })
}
function tiRenderAirportFlights(){
  const x=STATE.activeDetail;if(!x||x._library!=="airports")return;
  const iata=tiAirportIata(x),type=STATE.activeAirportBoardType||"departures",key=tiAirportCacheKey(iata,type),entry=STATE.airportFlights.get(key),host=$("tiAirportFlightRows");
  if(!host)return;
  const arrivals=type==="arrivals";
  $("tiAirportScreenCode")&&( $("tiAirportScreenCode").textContent=iata );
  $("tiAirportPlaceHeader")&&( $("tiAirportPlaceHeader").textContent=arrivals?"From":"To" );
  $("tiAirportFacilityHeader")&&( $("tiAirportFacilityHeader").textContent=arrivals?"Belt":"Gate" );
  tiUpdateAirportClock(x);
  if(!entry){
    host.innerHTML=`<div class="board-message"><span class="board-message-title">FLIGHT INFORMATION</span><span class="board-message-note">Open this tab to load ${esc(type)} for ${esc(iata)}.</span></div>`;
    return
  }
  if(entry.error){
    host.innerHTML=`<div class="board-message"><span class="board-message-title">BOARD UNAVAILABLE</span><span class="board-message-note">${esc(entry.error)}</span><button class="ti-airport-board-retry" type="button">Try again</button></div>`;
    host.querySelector("button")?.addEventListener("click",()=>tiAirportRequestFlights(x,type,true));
    return
  }
  const allItems=tiFidsGroupFlights(arr(entry.items)).slice().sort((a,b)=>{
    const sa=tiSideEpoch(arrivals?a?.arrival:a?.departure,"scheduled"),sb=tiSideEpoch(arrivals?b?.arrival:b?.departure,"scheduled");
    if(Number.isFinite(sa)&&Number.isFinite(sb))return sa-sb;
    if(Number.isFinite(sa))return-1;
    if(Number.isFinite(sb))return 1;
    return text(a?.displayFlightIata||a?.flightIata||a?.flightIcao).localeCompare(text(b?.displayFlightIata||b?.flightIata||b?.flightIcao))
  });
  const earlier=allItems.filter(item=>tiAirportFlightIsEarlier(item,arrivals));
  const current=allItems.filter(item=>!tiAirportFlightIsEarlier(item,arrivals));
  const earlierButton=$("tiAirportEarlierFlights");
  if(earlierButton){
    earlierButton.hidden=earlier.length===0;
    earlierButton.textContent=STATE.airportShowEarlier?`Hide earlier flights`:`See earlier flights${earlier.length?` (${earlier.length})`:""}`
  }
  const earlierRows=STATE.airportShowEarlier?earlier.slice().sort((a,b)=>{
    const sa=tiSideEpoch(arrivals?a?.arrival:a?.departure,"scheduled"),sb=tiSideEpoch(arrivals?b?.arrival:b?.departure,"scheduled");
    return (Number.isFinite(sb)?sb:0)-(Number.isFinite(sa)?sa:0)
  }).slice(0,24):[];
  if(!current.length&&!earlierRows.length){
    host.innerHTML=`<div class="board-message"><span class="board-message-title">NO CURRENT FLIGHTS</span><span class="board-message-note">${earlier.length?`Completed ${esc(type)} are available under See earlier flights.`:`No ${esc(type)} were returned for ${esc(iata)}.`}</span></div>`
  }else{
    let markup="";
    if(earlierRows.length){
      markup+=`<div class="fids-group-divider" role="row"><span>Earlier flights</span><small>Completed ${esc(type)}</small></div>`;
      markup+=earlierRows.map((item,index)=>tiFidsRowHtml(item,index,arrivals,entry,"is-earlier")).join("")
    }
    if(current.length){
      if(earlierRows.length)markup+=`<div class="fids-group-divider is-current" role="row"><span>Current flights</span><small>Now and upcoming</small></div>`;
      markup+=current.map((item,index)=>tiFidsRowHtml(item,index+earlierRows.length,arrivals,entry)).join("")
    }
    host.innerHTML=markup
  }
  host.querySelectorAll(".fids-tail img").forEach(img=>img.addEventListener("error",()=>{
    const tile=img.parentElement;if(!tile)return;
    tile.classList.add("fallback");
    tile.innerHTML=`<span class="fids-logo-fallback">${esc(tile.dataset.code||"--")}</span>`
  },{once:true}));
  const meta=$("tiAirportBoardMeta");
  if(meta){
    const count=current.length;
    meta.textContent=entry.meta?.note||`${count} current ${type}${earlier.length?` · ${earlier.length} earlier`:""}. Time shows the scheduled ${arrivals?"arrival":"departure"}; completion time appears in Remarks.`
  }
}
function tiAirportFlightPanelHtml(x){
  const iata=tiAirportIata(x),type=STATE.activeAirportBoardType||"departures",arrivals=type==="arrivals",clock=tiAirportLocalClock(x);
  return `<section class="ti-airport-flight-panel ${arrivals?"is-arrivals":"is-departures"}"><div class="ti-airport-flight-heading"><div><div class="eyebrow">Flight information</div><h2>${esc(iata)} ${arrivals?"arrivals":"departures"}</h2><p>Current and upcoming flights from the airport clock. Completed flights are available under See earlier flights.</p></div><div class="airport-board-toggle" role="group" aria-label="Arrivals or departures"><button type="button" class="airport-toggle ${!arrivals?"active":""}" data-ti-board-type="departures">Departures</button><button type="button" class="airport-toggle ${arrivals?"active":""}" data-ti-board-type="arrivals">Arrivals</button></div></div><div class="terminal-bay"><div class="flight-board-shell"><div class="board-screen" role="table" aria-label="${esc(iata)} passenger flight information display"><div class="board-airport-bar"><div><small>AIRPORT</small><strong id="tiAirportScreenCode">${esc(iata)}</strong></div><div><small>PASSENGER FLIGHT INFORMATION</small><strong>${arrivals?"ARRIVALS":"DEPARTURES"}</strong></div><div class="board-clock"><small id="tiAirportLocalDate">${esc(clock.date)}</small><strong id="tiAirportLocalTime">${esc(clock.time)}</strong></div></div><div class="board-columns fids-layout" role="row"><div role="columnheader">Logo</div><div role="columnheader">Flight No</div><div role="columnheader">Codeshare</div><div role="columnheader">Time</div><div role="columnheader" id="tiAirportPlaceHeader">${arrivals?"From":"To"}</div><div role="columnheader">Terminal</div><div role="columnheader" id="tiAirportFacilityHeader">${arrivals?"Belt":"Gate"}</div><div role="columnheader">Remarks</div></div><div class="board-scroll"><div class="flip-body" id="tiAirportFlightRows" role="rowgroup"><div class="board-message"><span class="board-message-title">FLIGHT INFORMATION</span><span class="board-message-note">Loading ${esc(type)} for ${esc(iata)}.</span></div></div></div></div><div class="board-footer"><span>Passenger flight information</span><button type="button" class="fids-earlier-control" id="tiAirportEarlierFlights" data-ti-earlier-flights hidden>See earlier flights</button><span id="tiAirportBoardMeta">Scheduled times remain fixed; operational times appear in Remarks.</span></div></div></div></section>`
}
function tiActivateAirportTab(id,x,scroll=true){
  const root=$("tiDetailMount"),button=root?.querySelector(`[data-airport-tab="${CSS.escape(id)}"]`);if(!root||!button)return;STATE.activeAirportTab=id;
  root.querySelectorAll("[data-airport-tab]").forEach(tab=>{const active=tab===button;tab.setAttribute("aria-selected",active?"true":"false");tab.setAttribute("tabindex",active?"0":"-1")});root.querySelectorAll("[data-airport-panel]").forEach(panel=>panel.hidden=panel.dataset.airportPanel!==id);
  if(id==="flight-info"){tiAirportRequestFlights(x,STATE.activeAirportBoardType||"departures");requestAnimationFrame(tiRenderAirportFlights)}if(scroll)root.querySelector(".ti-section-nav-wrap")?.scrollIntoView({behavior:movement(),block:"start"})
}
function tiBindAirportDetail(x){
  const root=$("tiDetailMount");if(!root)return;root.querySelectorAll("[data-airport-tab]").forEach(btn=>btn.addEventListener("click",()=>tiActivateAirportTab(btn.dataset.airportTab,x,true)));
  root.querySelectorAll("[data-ti-board-type]").forEach(btn=>btn.addEventListener("click",()=>{STATE.activeAirportBoardType=btn.dataset.tiBoardType==="arrivals"?"arrivals":"departures";STATE.airportShowEarlier=false;renderAirportDetail(x);tiActivateAirportTab("flight-info",x,false)}));
  root.querySelector("[data-ti-earlier-flights]")?.addEventListener("click",()=>{STATE.airportShowEarlier=!STATE.airportShowEarlier;tiRenderAirportFlights()});
  root.querySelectorAll("[data-ti-airport-kind]").forEach(btn=>btn.addEventListener("click",()=>{const kind=btn.dataset.tiAirportKind,id=btn.dataset.tiAirportId,ctx=tiAirportContext(x),all=[...arr(ctx?.commerce?.transferOffers),...arr(ctx?.commerce?.hotels),...arr(ctx?.commerce?.tours),...arr(ctx?.commerce?.destinations),...tiAirportList(ctx?.airport?.destinationAds)];const item=all.find(i=>text(i?.publicId||i?.id||i?.slug||i?.title||i?.name)===id)||{};post("TRAVEL_INFO_AIRPORT_ACTION",{kind,item,airportIata:tiAirportIata(x)})}));
}
function renderAirportDetail(x){
  tiAirportRequestContext(x);const sections=airportSections(x),overview=sections.find(s=>s.id==="overview"),other=sections.filter(s=>s.id!=="overview");const tabs=[{id:"overview",label:"Overview"},...other.map(s=>({id:s.id,label:s.title})),{id:"flight-info",label:"Flight Info"}];if(!tabs.some(t=>t.id===STATE.activeAirportTab))STATE.activeAirportTab="overview";
  $("tiDetailMount").innerHTML=`<div class="ti-airport-experience">${tiAirportHeaderHtml(x)}<div class="ti-section-nav-wrap"><nav class="ti-section-nav" data-mode="airport-tabs" role="tablist" aria-label="${esc(itemTitle(x))} airport information">${tabs.map(tab=>`<button id="tiAirportTab-${esc(tab.id)}" class="ti-section-link" type="button" role="tab" data-airport-tab="${esc(tab.id)}" aria-selected="${tab.id===STATE.activeAirportTab?"true":"false"}" tabindex="${tab.id===STATE.activeAirportTab?"0":"-1"}">${esc(tab.label)}</button>`).join("")}</nav></div><div class="ti-airport-tab-panels"><div class="ti-tab-panel" data-airport-panel="overview" role="tabpanel" ${STATE.activeAirportTab==="overview"?"":"hidden"}>${tiAirportOverviewHtml(x,overview)}</div>${other.map(sec=>`<div class="ti-tab-panel" data-airport-panel="${esc(sec.id)}" role="tabpanel" ${STATE.activeAirportTab===sec.id?"":"hidden"}>${storySectionHtml(sec)}</div>`).join("")}<div class="ti-tab-panel" data-airport-panel="flight-info" role="tabpanel" ${STATE.activeAirportTab==="flight-info"?"":"hidden"}>${tiAirportFlightPanelHtml(x)}</div></div></div>`;
  tiBindAirportDetail(x);if(STATE.activeAirportTab==="flight-info"){tiAirportRequestFlights(x,STATE.activeAirportBoardType||"departures");requestAnimationFrame(tiRenderAirportFlights)}
}


function renderDetail(x){
  if((x?._library||"")==="airports"){renderAirportDetail(x);return;}
  const kind=x._library||"",isAirline=kind==="airlines",isAirport=kind==="airports",sections=isAirline?airlineSections(x):isAirport?airportSections(x):genericSections(x);
  const image=displayImageUrl(x),logo=isAirline?safeExternal(text(x.logo||x.logoIcon||"")):"",code=itemCode(x),facts=detailFacts(x),website=safeExternal(x.website),contactUrl=safeExternal(x.contactUrl),loyaltyUrl=safeExternal(x.loyaltyProgramUrl),internalPath=[x.path,x.actionTarget,x.pageUrl].map(text).find(safeInternal)||"",meta=[x.city,x.country,x.alliance,x.loyaltyProgram].map(formatTextValue).filter(Boolean);
  const aircraftSlot=isAirline?`<section id="tiSec-aircraft" class="ti-story-section" data-detail-section="aircraft"><div class="ti-story-eyebrow">Onboard experience</div><h2>Aircraft & cabin explorer</h2><p>Explore the published aircraft, cabin views and walkthroughs available for this airline. Live seat availability is shown when you book.</p><div id="onboardReactRoot" class="ti-aircraft-host"><div class="ti-aircraft-skeleton"><div class="ti-skeleton-lines"><i></i><i></i><i></i></div></div></div></section>`:"";
  const airlineTabs=isAirline?airlineTabDefinitions(sections):[];
  const activeAirlineTab=isAirline&&(airlineTabs.some(tab=>tab.id===STATE.activeAirlineTab)?STATE.activeAirlineTab:airlineTabs[0]?.id||"overview");
  if(isAirline)STATE.activeAirlineTab=activeAirlineTab;
  const nav=isAirline?airlineTabs:sections.map(section=>({id:section.id,label:section.title}));
  $("tiDetailMount").innerHTML=`
    <article class="ti-profile-hero">
      <div class="ti-profile-copy">
        ${logo?`<div class="ti-profile-logo"><img src="${esc(logo)}" alt="${esc(itemTitle(x))} logo"></div>`:""}
        <div class="ti-kicker">${esc(x._label||libraryLabel(kind))}</div>
        ${isAirport&&code?`<div class="ti-profile-code">${esc(code)}</div>`:""}
        <h1>${esc(itemTitle(x))}</h1>
        <p>${esc(itemSummary(x)||"Published travel information for your journey.")}</p>
        <div class="ti-profile-meta">${[code?`${isAirport?"Airport":"Code"} ${code}`:"",...meta].filter(Boolean).map(m=>`<span>${esc(m)}</span>`).join("")}</div>
      </div>
      <div class="ti-profile-image">${image?`<img src="${esc(image)}" alt="${esc(itemTitle(x))}" referrerpolicy="no-referrer">`:`<div class="ti-profile-fallback"><strong>${esc((code||itemTitle(x).slice(0,3)).toUpperCase())}</strong></div>`}</div>
    </article>
    ${nav.length?isAirline?`<div class="ti-section-nav-wrap"><nav class="ti-section-nav" data-mode="airline-tabs" role="tablist" aria-label="${esc(itemTitle(x))} information categories">${nav.map(tab=>`<button id="tiAirlineTab-${esc(tab.id)}" class="ti-section-link" type="button" role="tab" data-airline-tab="${esc(tab.id)}" aria-controls="tiAirlinePanel-${esc(tab.id)}" aria-selected="${tab.id===activeAirlineTab?"true":"false"}" tabindex="${tab.id===activeAirlineTab?"0":"-1"}">${esc(tab.label)}</button>`).join("")}</nav></div>`:`<div class="ti-section-nav-wrap"><nav class="ti-section-nav" aria-label="${esc(itemTitle(x))} sections">${nav.map((item,index)=>`<button class="ti-section-link" type="button" data-section-link="${esc(item.id)}" aria-current="${index===0?"true":"false"}">${esc(item.label)}</button>`).join("")}</nav></div>`:""}
    <div class="ti-detail-body">
      <div class="ti-story-stack">${isAirline?airlinePanelsHtml(airlineTabs,sections,aircraftSlot,activeAirlineTab):sections.map(storySectionHtml).join("")}</div>
      <aside class="ti-detail-aside">
        ${facts.length?`<section class="ti-aside-card"><h3>At a glance</h3><div class="ti-key-list">${facts.map(([key,value])=>`<div class="ti-key-row"><b>${esc(key)}</b><span>${esc(value)}</span></div>`).join("")}</div>${isAirport?`<div id="tiWeatherInline" class="ti-weather-inline"><strong id="tiWeatherValue"></strong><span id="tiWeatherDescription"></span></div>`:""}</section>`:""}
        <section class="ti-aside-card"><h3>Continue your journey</h3><p>Use the published guide here, then move into the relevant SKANDI service when you are ready.</p><div class="ti-aside-actions">${internalPath?`<button class="ti-btn ti-btn-light" type="button" data-detail-path="${esc(internalPath)}">Open full guide ${icon("arrow")}</button>`:""}${website?`<a class="ti-btn ti-btn-light" href="${esc(website)}" target="_blank" rel="noopener noreferrer">Official website ${icon("external")}</a>`:""}${contactUrl&&contactUrl!==website?`<a class="ti-btn ti-btn-light" href="${esc(contactUrl)}" target="_blank" rel="noopener noreferrer">Contact information ${icon("external")}</a>`:""}${loyaltyUrl?`<a class="ti-btn ti-btn-light" href="${esc(loyaltyUrl)}" target="_blank" rel="noopener noreferrer">Loyalty program ${icon("external")}</a>`:""}${isAirport||isAirline?`<button class="ti-btn ti-btn-light" type="button" data-detail-action="baggage">Baggage allowance ${icon("bag")}</button>`:""}<button class="ti-btn ti-btn-light" type="button" data-detail-action="assistance">Special assistance ${icon("help")}</button><button class="ti-btn ti-btn-light" type="button" data-detail-action="alexandra">Ask Alexandra ${icon("spark")}</button><button class="ti-btn ti-btn-primary" type="button" data-detail-action="support">Contact support ${icon("message")}</button></div></section>
      </aside>
    </div>`;
  bindDetailInteractions(x,nav);
  if(isAirline)activateAirlineTab(activeAirlineTab,x,false);
}
function bindDetailInteractions(x,nav){
  const root=$("tiDetailMount");if(!root)return;
  root.querySelectorAll("[data-airline-tab]").forEach(btn=>{
    btn.addEventListener("click",()=>activateAirlineTab(btn.dataset.airlineTab,x,true));
    btn.addEventListener("keydown",event=>{if(event.key!=="ArrowRight"&&event.key!=="ArrowLeft"&&event.key!=="Home"&&event.key!=="End")return;const tabs=[...root.querySelectorAll("[data-airline-tab]")];if(!tabs.length)return;event.preventDefault();const index=tabs.indexOf(btn);const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;tabs[next].focus();activateAirlineTab(tabs[next].dataset.airlineTab,x,false)})
  });
  root.querySelectorAll("[data-section-link]").forEach(btn=>btn.addEventListener("click",()=>{root.querySelector(`#tiSec-${CSS.escape(btn.dataset.sectionLink)}`)?.scrollIntoView({behavior:movement(),block:"start"});root.querySelectorAll("[data-section-link]").forEach(item=>item.setAttribute("aria-current",item===btn?"true":"false"))}));
  root.querySelectorAll("[data-detail-action]").forEach(btn=>btn.addEventListener("click",()=>{const action=btn.dataset.detailAction;if(action==="alexandra")post("TRAVEL_INFO_OPEN_ALEXANDRA",{context:{title:itemTitle(x),library:x._library||""}});else openAction(action)}));
  root.querySelectorAll("[data-detail-path]").forEach(btn=>btn.addEventListener("click",()=>{if(safeInternal(btn.dataset.detailPath))post("TRAVEL_INFO_NAVIGATE",{path:btn.dataset.detailPath})}))
}

function openOverlay(mode,title,subtitle,bodyHtml,focusSelector=""){STATE.overlayMode=mode;STATE.overlayReturnFocus=document.activeElement;$("tiSheetKicker").textContent="Travel Info";$("tiSheetTitle").textContent=title;$("tiSheetSubtitle").textContent=subtitle||"";$("tiSheetBody").innerHTML=bodyHtml;hydrateStaticIcons($("tiSheetBody"));$("tiOverlay").dataset.open="true";$("tiOverlay").setAttribute("aria-hidden","false");document.documentElement.classList.add("ti-lock");bindOverlay(mode);requestAnimationFrame(()=>{const target=focusSelector?$("tiSheetBody").querySelector(focusSelector):$("tiSheetBody").querySelector("input,select,textarea,button");target?.focus()})}
function closeOverlay(){$("tiOverlay").dataset.open="false";$("tiOverlay").setAttribute("aria-hidden","true");document.documentElement.classList.remove("ti-lock");const target=STATE.overlayReturnFocus;if(target&&target.isConnected)target.focus({preventScroll:true});STATE.overlayMode=""}
function requirementsPanelHtml(){return`<div class="ti-form-grid"><div class="ti-field"><label for="tiPassportCountry">Passport nationality</label><input id="tiPassportCountry" autocomplete="country-name" placeholder="Country"></div><div class="ti-field"><label for="tiFromCountry">From</label><input id="tiFromCountry" autocomplete="off" placeholder="Country"></div><div class="ti-field"><label for="tiTransitCountry">Transit</label><input id="tiTransitCountry" autocomplete="off" placeholder="Optional"></div><div class="ti-field"><label for="tiToCountry">To</label><input id="tiToCountry" autocomplete="off" placeholder="Country"></div></div><div class="ti-sheet-actions"><button id="tiRequirementSubmit" class="ti-btn ti-btn-primary" type="button">Check requirements ${icon("arrow")}</button></div><div id="tiRequirementResult" class="ti-message-box" aria-live="polite">Enter your passport nationality and destination to check the current travel-requirements information. Always verify final entry rules with official authorities.</div><div class="ti-sheet-actions"><button id="tiPassportGuide" class="ti-btn ti-btn-light" type="button">Passport & visa guide ${icon("arrow")}</button></div>`}
function supportPanelHtml(){return`<div class="ti-form-grid"><div class="ti-field"><label for="tiSupportName">Name</label><input id="tiSupportName" autocomplete="name"></div><div class="ti-field"><label for="tiSupportEmail">Email</label><input id="tiSupportEmail" type="email" autocomplete="email"></div><div class="ti-field"><label for="tiSupportRef">Booking reference</label><input id="tiSupportRef" autocomplete="off"></div><div class="ti-field"><label for="tiSupportCategory">Category</label><select id="tiSupportCategory"><option>General</option><option>Before travel</option><option>Baggage</option><option>Airport</option><option>Airline</option><option>Hotel</option><option>Transfer</option><option>Tour / Activity</option><option>Ticket / Voucher</option><option>Booking</option></select></div><div class="ti-field ti-full"><label for="tiSupportMessage">Message</label><textarea id="tiSupportMessage"></textarea></div></div><div class="ti-sheet-actions"><button id="tiSupportSend" class="ti-btn ti-btn-primary" type="button">Send request ${icon("message")}</button></div><div id="tiSupportResult" class="ti-message-box" hidden aria-live="polite"></div>`}
function openAction(action){
  if(action==="baggage")post("TRAVEL_INFO_OPEN_BAGGAGE",{});
  else if(action==="assistance")post("TRAVEL_INFO_NAVIGATE",{path:"/travel-info/special-assistance"});
  else if(action==="requirements")openOverlay("requirements","Travel requirements","Check passport and entry guidance before departure.",requirementsPanelHtml(),"#tiPassportCountry");
  else if(action==="support")openOverlay("support","Contact Travel Support","Send an itinerary or travel-information question to SKANDI.",supportPanelHtml(),"#tiSupportName");
  else if(action==="airlines"||action==="airports")setLibrary(action,true);
  else if(action==="alexandra")post("TRAVEL_INFO_OPEN_ALEXANDRA",STATE.activeDetail?{context:{title:itemTitle(STATE.activeDetail),library:STATE.activeDetail._library||""}}:{});
}
function bindOverlay(mode){
  if(mode==="requirements"){$("tiRequirementSubmit")?.addEventListener("click",submitRequirements);$("tiPassportGuide")?.addEventListener("click",()=>post("TRAVEL_INFO_OPEN_PASSPORT_VISA",{}))}
  if(mode==="support")$("tiSupportSend")?.addEventListener("click",submitSupport)
}
function submitRequirements(){
  if(STATE.requirementsPending)return;const nationality=text($("tiPassportCountry")?.value),origin=text($("tiFromCountry")?.value),transit=text($("tiTransitCountry")?.value),destination=text($("tiToCountry")?.value),out=$("tiRequirementResult"),btn=$("tiRequirementSubmit");
  if(!nationality||!destination){out.dataset.tone="error";out.textContent="Enter at least passport nationality and destination.";return}
  STATE.requirementsPending=true;btn.disabled=true;out.dataset.tone="";out.textContent="Checking current travel requirements…";
  post("TRAVEL_INFO_REQUIREMENTS_SEARCH",{nationality,origin,transit,destination,documentType:"PASSPORT",language:"EN"})
}
function renderRequirementResult(payload){
  const host=$("tiRequirementResult");if(!host)return;const p=obj(payload),fields=Array.isArray(p.fields)?p.fields:Object.entries(obj(p.fields)).map(([key,value])=>({key,label:human(key),value})),guidance=arr(p.guidance),notices=arr(p.notices);const chunks=[];
  if(formatTextValue(p.summary))chunks.push(`<div class="ti-requirement-group"><h4>Travel requirements</h4><p>${esc(formatTextValue(p.summary))}</p></div>`);
  if(fields.length)chunks.push(`<div class="ti-requirement-group"><h4>Entry information</h4>${fields.map(f=>`<div class="ti-requirement-field"><b>${esc(f.label||human(f.key||"Requirement"))}</b><span>${esc(formatTextValue(f.value)||text(f.value))}</span></div>`).join("")}</div>`);
  guidance.forEach(g=>chunks.push(`<div class="ti-requirement-group"><h4>${esc(formatTextValue(g.title??g.country??g.category)||"Guidance")}</h4><p>${esc(formatTextValue(g.body??g.description??g.summary))}</p></div>`));
  if(notices.length)chunks.push(`<div class="ti-requirement-group"><h4>Important information</h4>${notices.map(n=>`<p style="margin-bottom:7px">${esc(formatTextValue(typeof n==="string"?n:(n.message??n.title??n.body)))}</p>`).join("")}</div>`);
  chunks.push(`<div class="ti-requirement-group"><h4>Before you travel</h4><p>Entry and transit rules can change. Confirm the final requirements with the relevant official authorities before departure.</p></div>`);
  host.dataset.tone="";host.innerHTML=chunks.join("")
}
function submitSupport(){
  if(STATE.supportPending)return;const name=text($("tiSupportName")?.value),email=text($("tiSupportEmail")?.value),message=text($("tiSupportMessage")?.value),out=$("tiSupportResult"),btn=$("tiSupportSend");out.hidden=false;
  if(!name||!email||!message){out.dataset.tone="error";out.textContent="Enter your name, email and message before sending.";return}
  STATE.supportPending=true;btn.disabled=true;out.dataset.tone="";out.textContent="Sending your request…";post("TRAVEL_SUPPORT_REQUEST",{name,email,bookingReference:text($("tiSupportRef")?.value),category:text($("tiSupportCategory")?.value),message})
}

function requestAircraft(x){
  const key=text(x.id||x.iataCode||x.code);if(STATE.aircraftBundles.has(key)){renderFleet(STATE.aircraftBundles.get(key));return}if(STATE.aircraftPending.has(key))return;STATE.aircraftPending.add(key);STATE.lastAircraftRequestKey=key;post("TRAVEL_INFO_REQUEST_AIRCRAFT",{airlineId:x.id,airlineCode:x.iataCode})
}
function renderFleetFallback(bundle,host){
  const aircraft=arr(bundle.aircraft),cabins=arr(bundle.cabins);if(!aircraft.length){host.innerHTML=`<div class="ti-fleet-fallback"><h3>Aircraft information</h3><p>No published aircraft information is currently available for this airline.</p></div>`;return}
  host.innerHTML=`<div class="ti-fleet-fallback"><h3>Aircraft & cabin information</h3><p>The interactive cabin explorer is temporarily unavailable, but the published aircraft information is still available below.</p><div class="ti-fallback-aircraft-list">${aircraft.map(a=>{const id=text(a.id),cs=cabins.filter(c=>text(c.aircraft_id||c.aircraftId)===id);return`<article class="ti-fallback-aircraft"><strong>${esc(a.display_title||a.displayTitle||a.aircraft_name||a.aircraftName||a.aircraft_code||a.aircraftCode||"Aircraft")}</strong><span>${esc([a.aircraft_code||a.aircraftCode,a.manufacturer,a.family,a.total_seats||a.totalSeats?`${a.total_seats||a.totalSeats} seats`:""].filter(Boolean).join(" · "))}</span>${cs.length?`<div class="ti-fallback-cabins">${cs.map(c=>`<i>${esc(c.cabin_name||c.cabinName||c.cabin_code||c.cabinCode||"Cabin")}</i>`).join("")}</div>`:""}</article>`}).join("")}</div></div>`
}
function renderFleet(bundle){
  const host=$("onboardReactRoot");if(!host)return;window.__SKANDI_ONBOARD_PENDING__={elementId:host.id,bundle:bundle||{},airline:STATE.activeDetail||{}};
  if(window.SKANDIOnboardReact?.mount){window.SKANDIOnboardReact.mount(host,bundle||{},STATE.activeDetail||{});return}
  host.innerHTML=`<div class="ti-aircraft-skeleton"><div class="ti-skeleton-lines"><i></i><i></i><i></i></div></div>`;
  setTimeout(()=>{if(host.isConnected&&!window.SKANDIOnboardReact?.mount)renderFleetFallback(bundle||{},host)},5000)
}
window.addEventListener("SKANDI_ONBOARD_REACT_READY",()=>{const p=window.__SKANDI_ONBOARD_PENDING__;if(!p)return;const host=$(p.elementId||"onboardReactRoot");if(host&&window.SKANDIOnboardReact?.mount)window.SKANDIOnboardReact.mount(host,p.bundle,p.airline)});

function weatherKey(x){return text(x.id||x.code||x.iata||itemTitle(x))}
function requestWeather(x){const key=weatherKey(x);if(STATE.weatherCache.has(key)){renderWeatherForDetail(STATE.weatherCache.get(key));return}if(STATE.weatherPending.has(key))return;STATE.weatherPending.add(key);post("TRAVEL_INFO_WEATHER_REQUEST",{locations:[{id:x.id||x.code||x.iata,title:itemTitle(x),latitude:Number(x.latitude),longitude:Number(x.longitude)}]})}
function renderWeatherForDetail(w){
  const host=$("tiWeatherInline");if(!host)return;if(!w||w.ok!==true){host.dataset.visible="false";return}const temp=num(w.tempC);$("tiWeatherValue").textContent=temp!==null?`${Math.round(temp)}°C`:text(w.temperature||"Current weather");$("tiWeatherDescription").textContent=formatTextValue(w.description??w.condition);host.dataset.visible="true"
}

function renderAll(){buildSearchIndex();renderNetworkMeta();renderAtlasCodes();renderJourney();renderFeaturedHelp();renderGateways();renderFilters();renderDirectory();hydrateStaticIcons()}
function findUpdatedDetail(current){
  if(!current)return null;const lib=current._library;if(lib==="faq")return arr(DATA.helpCenter?.topics).map(x=>normalizeContentItem(x,"faq")).find(x=>text(x.id||x.topicId)===text(current.id||current.topicId))||null;if(lib==="articles")return arr(DATA.articles).map(x=>normalizeContentItem(x,"articles")).find(x=>text(x.id||x.slug)===text(current.id||current.slug))||null;return arr(DATA[lib]).map(x=>normalizeContentItem(x,lib)).find(x=>text(x.id||x.code||x.iataCode)===text(current.id||current.code||current.iataCode))||null
}
function loadData(payload){
  clearBootstrapWatchdog();DATA={...DATA,...obj(payload),helpCenter:{...DATA.helpCenter,...obj(payload?.helpCenter)}};STATE.dataState="ready";setStatus("");renderAll();
  if(STATE.activeDetail){const updated=findUpdatedDetail(STATE.activeDetail);if(updated){STATE.activeDetail=updated;renderDetail(updated)}else closeDetail()}
}
function retryData(){STATE.dataState="loading";setStatus("Refreshing Travel Info…");armBootstrapWatchdog();post("TRAVEL_INFO_REFRESH",{settings:{language:"EN"}})}

function parseMessage(value){if(typeof value==="string"){try{return JSON.parse(value)}catch(_){return null}}return value&&typeof value==="object"?value:null}
window.addEventListener("message",event=>{
  const m=parseMessage(event.data);if(!m||m.source!==PARENT)return;const p=obj(m.payload);
  switch(m.type){
    case "TRAVEL_INFO_HOST_READY":STATE.dataState="loading";armBootstrapWatchdog();post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});break;
    case "TRAVEL_INFO_PROGRESS":STATE.dataState="loading";setStatus(p.message||"Loading SKANDI Travel Info…");break;
    case "TRAVEL_INFO_DATA":loadData(p);break;
    case "TRAVEL_INFO_AIRCRAFT_DATA":{
      const first=arr(p.aircraft)[0];const responseKeys=[text(first?.airlineId),text(first?.airlineCode),text(STATE.lastAircraftRequestKey)].filter(Boolean);responseKeys.forEach(key=>{STATE.aircraftPending.delete(key);STATE.aircraftBundles.set(key,p)});const currentKey=STATE.activeDetail?text(STATE.activeDetail.id||STATE.activeDetail.iataCode||STATE.activeDetail.code):"";if(!responseKeys.length||responseKeys.includes(currentKey)||currentKey===text(STATE.lastAircraftRequestKey))renderFleet(p);break
    }
    case "TRAVEL_INFO_AIRPORT_CONTEXT_RESULT":{
      const req=STATE.airportContextRequest;if(req&&p.requestId&&p.requestId!==req.requestId)break;const airport=obj(p.airport);const iata=tiAirportIata(airport)||req?.iata||"";if(iata){STATE.airportContextPending.delete(iata);STATE.airportContexts.set(iata,p);if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===iata)renderAirportDetail(STATE.activeDetail)}break
    }
    case "TRAVEL_INFO_AIRPORT_CONTEXT_ERROR":{
      const req=STATE.airportContextRequest;if(req){STATE.airportContextPending.delete(req.iata);STATE.airportContexts.set(req.iata,{airport:{...STATE.activeDetail,iata:req.iata},commerce:{},error:p.message||"Airport information is temporarily unavailable."});if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===req.iata)renderAirportDetail(STATE.activeDetail)}break
    }
    case "TRAVEL_INFO_AIRPORT_FLIGHTS_RESULT":{
      const req=STATE.airportFlightRequest;if(req&&p.requestId&&p.requestId!==req.requestId)break;if(req){STATE.airportFlightPending.delete(req.key);STATE.airportFlights.set(req.key,{items:arr(p.items),meta:obj(p.meta)});if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===req.iata)tiRenderAirportFlights()}break
    }
    case "TRAVEL_INFO_AIRPORT_FLIGHTS_ERROR":{
      const req=STATE.airportFlightRequest;if(req){STATE.airportFlightPending.delete(req.key);STATE.airportFlights.set(req.key,{items:[],meta:{},error:p.message||"Flight information is temporarily unavailable."});if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===req.iata)tiRenderAirportFlights()}break
    }
    case "TRAVEL_INFO_REQUIREMENTS_SEARCHING":{const h=$("tiRequirementResult");if(h)h.textContent=p.message||"Checking current travel requirements…";break}
    case "TRAVEL_INFO_REQUIREMENTS_RESULT":STATE.requirementsPending=false;if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;renderRequirementResult(p);break;
    case "TRAVEL_INFO_REQUIREMENTS_ERROR":STATE.requirementsPending=false;if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;{const h=$("tiRequirementResult");if(h){h.dataset.tone="error";h.textContent=p.message||"Travel requirements are temporarily unavailable. Please verify with official authorities before departure."}}break;
    case "TRAVEL_SUPPORT_RESULT":
    case "TRAVEL_INFO_SUPPORT_RESULT":STATE.supportPending=false;if($("tiSupportSend"))$("tiSupportSend").disabled=false;{const h=$("tiSupportResult");if(h){h.hidden=false;h.dataset.tone=p.ok===false||p.error?"error":"success";h.textContent=p.message||p.error||"Your request has been received."}}break;
    case "TRAVEL_INFO_WEATHER":{
      const locations=arr(p.locations);locations.forEach(w=>{const key=text(w.id||w.locationId||w.title);if(key){STATE.weatherPending.delete(key);STATE.weatherCache.set(key,w)}});
      if(STATE.activeDetail){const key=weatherKey(STATE.activeDetail);if(!locations.length)STATE.weatherPending.delete(key);renderWeatherForDetail(STATE.weatherCache.get(key)||locations[0]||null)}break
    }
    case "TRAVEL_INFO_ERROR":clearBootstrapWatchdog();STATE.dataState="error";STATE.requirementsPending=false;STATE.supportPending=false;STATE.aircraftPending.clear();if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;if($("tiSupportSend"))$("tiSupportSend").disabled=false;setStatus(p.message||"Travel information is temporarily unavailable.",true);{const target=STATE.overlayMode==="support"?$("tiSupportResult"):STATE.overlayMode==="requirements"?$("tiRequirementResult"):null;if(target){target.hidden=false;target.dataset.tone="error";target.textContent=p.message||"This service is temporarily unavailable. Please try again."}}break;
  }
});

function focusables(container){return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null)}
function trap(container,e){if(e.key!=="Tab")return;const f=focusables(container);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}

document.addEventListener("keydown",e=>{
  if(STATE.searchOpen){if(e.key==="Escape"){e.preventDefault();closeSearch();return}if(e.key==="ArrowDown"||e.key==="ArrowUp"){const list=buildSearchResults(STATE.searchQuery);if(list.length){e.preventDefault();STATE.searchCursor=(STATE.searchCursor+(e.key==="ArrowDown"?1:-1)+list.length)%list.length;renderSearchResults()}return}if(e.key==="Enter"&&document.activeElement===$("tiSearchInput")){const list=buildSearchResults(STATE.searchQuery);if(list[STATE.searchCursor]){e.preventDefault();activateSearchResult(list[STATE.searchCursor])}return}trap($("tiSearchLayer"),e);return}
  if($("tiOverlay").dataset.open==="true"){if(e.key==="Escape"){e.preventDefault();closeOverlay();return}trap($("tiSheet"),e);return}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
});

$("tiHeroSearchForm").addEventListener("submit",e=>{e.preventDefault();openSearch($("tiHeroSearch").value)});
$("tiHeroSearch").addEventListener("click",()=>openSearch($("tiHeroSearch").value));
$("tiSearchInput").addEventListener("input",e=>{STATE.searchQuery=e.target.value;STATE.searchCursor=0;renderSearchResults()});
document.querySelectorAll("[data-close-search]").forEach(b=>b.addEventListener("click",closeSearch));
document.querySelectorAll("[data-close-overlay]").forEach(b=>b.addEventListener("click",closeOverlay));
$("tiBack").addEventListener("click",event=>{event.preventDefault();event.stopPropagation();closeDetail()});
$("tiLoadMore").addEventListener("click",()=>{STATE.visibleCount+=PAGE_SIZE;renderDirectory()});
document.addEventListener("click",e=>{const action=e.target.closest("[data-action]");if(action)openAction(action.dataset.action)});
$("tiAlexandraLauncher").addEventListener("click",()=>openAction("alexandra"));

hydrateStaticIcons();STATE.dataState="loading";renderAll();setStatus("Loading SKANDI Travel Info…");
armBootstrapWatchdog(INITIAL_BRIDGE_WATCHDOG_MS);
post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});

setInterval(()=>{
  const x=STATE.activeDetail;
  if(!x||x._library!=="airports"||STATE.activeAirportTab!=="flight-info")return;
  tiAdvanceCodeshareTicker()
},3500);

setInterval(()=>{
  const x=STATE.activeDetail;
  if(!x||x._library!=="airports"||STATE.activeAirportTab!=="flight-info")return;
  tiRenderAirportFlights();
  tiAirportRequestFlights(x,STATE.activeAirportBoardType||"departures",true)
},60000);

window.SKANDITravelInfo={
  refresh:retryData,
  navigate:path=>{if(safeInternal(path))post("TRAVEL_INFO_NAVIGATE",{path})},
  openInsurance:()=>post("TRAVEL_INFO_OPEN_INSURANCE",{}),
  openSpecialAssistance:()=>post("TRAVEL_INFO_NAVIGATE",{path:"/travel-info/special-assistance"}),
  version:"V12"
};
})();
