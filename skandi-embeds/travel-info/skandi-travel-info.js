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
</script>


<script>
(()=>{
"use strict";
const REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
const FINE=window.matchMedia?.("(pointer:fine)")?.matches===true;
const REVEAL_SELECTOR=[
  ".ti-heading-row",
  ".ti-stage-btn",
  ".ti-featured-main",
  ".ti-question-btn",
  ".ti-gateway",
  ".ti-entity",
  ".ti-support-grid",
  ".ti-profile-hero",
  ".ti-story-section",
  ".ti-aside-card"
].join(",");
const REACTIVE_SELECTOR=[
  ".ti-stage-btn",
  ".ti-featured-main",
  ".ti-gateway",
  ".ti-entity"
].join(",");
const seen=new WeakSet();
let observer=null;

if(!REDUCED&&"IntersectionObserver" in window){
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add("ti-motion-visible");
      observer.unobserve(entry.target);
    }
  },{threshold:.10,rootMargin:"0px 0px -6% 0px"});
}

function enhanceNode(root=document){
  const nodes=[];
  if(root.nodeType===1&&root.matches?.(REVEAL_SELECTOR))nodes.push(root);
  root.querySelectorAll?.(REVEAL_SELECTOR).forEach(node=>nodes.push(node));
  nodes.forEach(node=>{
    if(seen.has(node))return;
    seen.add(node);
    node.classList.add("ti-motion-reveal");
    if(node.matches(REACTIVE_SELECTOR))node.classList.add("ti-reactive-card");
    if(observer)observer.observe(node);
    else node.classList.add("ti-motion-visible");
  });
}

enhanceNode(document);

const mutationObserver=new MutationObserver(records=>{
  records.forEach(record=>{
    record.addedNodes.forEach(node=>{
      if(node.nodeType===1)enhanceNode(node);
    });
  });
});
mutationObserver.observe(document.body,{childList:true,subtree:true});

const hero=document.querySelector(".ti-atlas");
if(hero&&!REDUCED&&FINE){
  hero.addEventListener("pointermove",event=>{
    const rect=hero.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width)*100;
    const y=((event.clientY-rect.top)/rect.height)*100;
    hero.style.setProperty("--hero-x",`${x.toFixed(1)}%`);
    hero.style.setProperty("--hero-y",`${y.toFixed(1)}%`);
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{
    hero.style.setProperty("--hero-x","72%");
    hero.style.setProperty("--hero-y","24%");
  },{passive:true});
}

if(!REDUCED&&FINE){
  let active=null;
  document.addEventListener("pointermove",event=>{
    const card=event.target.closest?.(REACTIVE_SELECTOR);
    if(active&&active!==card){
      active.style.transform="";
      active.style.removeProperty("--fx-x");
      active.style.removeProperty("--fx-y");
    }
    active=card||null;
    if(!card)return;
    const rect=card.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=((event.clientX-rect.left)/rect.width)*100;
    const y=((event.clientY-rect.top)/rect.height)*100;
    const rotateY=(x-50)*0.025;
    const rotateX=(50-y)*0.020;
    card.style.setProperty("--fx-x",`${x.toFixed(1)}%`);
    card.style.setProperty("--fx-y",`${y.toFixed(1)}%`);
    card.style.transform=`perspective(1000px) translateY(-4px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  },{passive:true});
  document.addEventListener("pointerout",event=>{
    const card=event.target.closest?.(REACTIVE_SELECTOR);
    if(!card||card.contains(event.relatedTarget))return;
    card.style.transform="";
    card.style.removeProperty("--fx-x");
    card.style.removeProperty("--fx-y");
    if(active===card)active=null;
  },{passive:true});
}

window.addEventListener("pagehide",()=>{
  mutationObserver.disconnect();
  observer?.disconnect();
},{once:true});
})();
</script>

<script type="importmap">{"imports":{"react":"https://esm.sh/react@19.3.0","react-dom/client":"https://esm.sh/react-dom@19.3.0/client?external=react","htm":"https://esm.sh/htm@3.1.1"}}</script>
<script type="module">
import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import htm from "htm";
const html=htm.bind(React.createElement);
const roots=new WeakMap();
const A=v=>Array.isArray(v)?v:[];
const O=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const T=v=>String(v??"").trim();
const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const raw=(o,...keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=="")return o[k]}return""};
const human=v=>T(v).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const canonical=(code,name="")=>{const v=T(code||name).toUpperCase().replace(/[_-]+/g," ");if(["F","J","W","Y"].includes(v))return v;if(/FIRST|LA PREMI/.test(v))return"F";if(/BUSINESS|SIGNATURE CLASS|DELTA ONE|POLARIS|CLUB WORLD|ROYAL SILK/.test(v))return"J";if(/PREMIUM|PLUS|COMFORT/.test(v)&&!/BUSINESS/.test(v))return"W";return"Y"};
const rank=c=>({F:4,J:3,W:2,Y:1})[c]||0;
const cabinLabel=c=>({F:"First",J:"Business",W:"Premium",Y:"Economy"})[c]||c;
const emit=(type,payload={})=>window.parent.postMessage({source:"SKANDI_PUBLIC_TRAVEL_INFO",type,payload,timestamp:new Date().toISOString()},"*");
const navigate=path=>emit("MASTER_NAVIGATE",{path});
function transition(fn){if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&document.startViewTransition){try{return document.startViewTransition(fn)}catch(_){}}return fn()}
function normalizeAircraft(a){return{...a,_id:T(raw(a,"id")),_code:T(raw(a,"aircraft_code","aircraftCode")),_name:T(raw(a,"display_title","displayTitle","aircraft_name","aircraftName"))||T(raw(a,"aircraft_code","aircraftCode"))||"Aircraft",_aircraftName:T(raw(a,"aircraft_name","aircraftName")),_manufacturer:T(raw(a,"manufacturer")),_family:T(raw(a,"family")),_variant:T(raw(a,"variant")),_seats:N(raw(a,"total_seats","totalSeats")),_hero:T(raw(a,"hero_image_url","heroImageUrl","exterior_image_url","exteriorImageUrl")),_seatmap:T(raw(a,"seatmap_image_url","seatmapImageUrl")),_configuration:O(raw(a,"configuration"))}}
function normalizeCabins(bundle,aircraftId){
  const source=A(bundle?.cabins).filter(c=>T(raw(c,"aircraft_id","aircraftId"))===T(aircraftId)&&raw(c,"active")!==false);const map=new Map();
  source.forEach(c=>{const code=canonical(raw(c,"cabin_code","cabinCode"),raw(c,"cabin_name","cabinName"));const name=T(raw(c,"cabin_name","cabinName"))||cabinLabel(code);const seats=N(raw(c,"seat_count","seatCount"));const key=`${code}|${name.toLowerCase()}|${seats}`;const canonicalCode=["F","J","W","Y"].includes(T(raw(c,"cabin_code","cabinCode")).toUpperCase());const old=map.get(key);if(!old||canonicalCode)map.set(key,{...c,_id:T(raw(c,"id")),_code:code,_name:name,_seats:seats,_rank:rank(code)})});
  return[...map.values()].sort((a,b)=>b._rank-a._rank||N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder")))
}
function legacyData(airline){const s=O(airline?.sections);return O(s.inflightExperience?.data||s.inflightExperience||airline?.inflightExperience||{})}
function legacyClassFor(legacy,cabin){const classes=A(legacy.classes);if(!classes.length)return null;const code=cabin?cabin._code:"Y";return classes.find(c=>canonical(c.id,c.label)===code)||classes.find(c=>T(c.label).toLowerCase().includes(cabinLabel(code).toLowerCase()))||classes[0]}
function amenityItems(cabin,legacyClass){
  const out=[];const add=(label,value="")=>{label=T(label);value=T(value);if(label&&!out.some(x=>x.label.toLowerCase()===label.toLowerCase()))out.push({label,value})};const am=raw(cabin,"amenities");
  if(Array.isArray(am))am.forEach(v=>typeof v==="string"?add(v):add(v?.label||v?.title,v?.value||v?.description));
  else Object.entries(O(am)).forEach(([k,v])=>{if(v===false||v===null||v==="")return;if(typeof v==="object")add(human(k),v.value||v.description||v.label||v.title||"");else add(human(k),v===true?"":String(v))});
  A(legacyClass?.amenities).forEach(v=>typeof v==="string"?add(v):add(v?.label||v?.title,v?.value||v?.description));return out.slice(0,16)
}
function configuredSeatLayout(cabin){const ds=O(raw(cabin,"display_settings","displaySettings"));const layout=raw(ds,"seatLayout","layout","seat_layout");if(Array.isArray(layout))return layout.map(g=>Array.isArray(g)?g.map(T).filter(Boolean):[]).filter(g=>g.length);if(typeof layout==="string"&&/^\d(?:-\d)+$/.test(layout)){let letter=0;return layout.split("-").map(count=>Array.from({length:N(count)},()=>String.fromCharCode(65+letter++)))}return[]}
function viewsFor(bundle,aircraft,cabin,legacyClass){
  const canonicalViews=A(bundle.views).filter(v=>T(raw(v,"aircraft_id","aircraftId"))===aircraft._id&&(T(raw(v,"cabin_id","cabinId"))===cabin?._id||!T(raw(v,"cabin_id","cabinId"))));
  if(canonicalViews.length)return canonicalViews.map(v=>({...v,_id:T(raw(v,"id")),_label:T(raw(v,"label","view_code","viewCode","view_type","viewType"))||"Cabin view",_image:T(raw(v,"image_url","imageUrl","mobile_image_url","mobileImageUrl"))}));
  return A(legacyClass?.views).map((v,i)=>({...v,_id:T(v.id)||`legacy-view-${i}`,_label:T(v.label||v.title)||"Cabin view",_image:T(v.image||v.imageUrl),_legacyHotspots:A(v.hotspots)}))
}
function hotspotsFor(bundle,view){return view?A(bundle.hotspots).filter(h=>T(raw(h,"view_id","viewId"))===T(view._id)).map((h,i)=>({...h,_id:T(raw(h,"id","hotspot_code","hotspotCode"))||`hot-${i}`})):[]}
function scenesFor(bundle,aircraft){return A(bundle.walkScenes||bundle.scenes).filter(s=>T(raw(s,"aircraft_id","aircraftId"))===aircraft._id).sort((a,b)=>N(raw(a,"sort_order","sortOrder"))-N(raw(b,"sort_order","sortOrder"))).map(s=>({...s,_code:T(raw(s,"scene_code","sceneCode"))}))}
function sceneHotspotsFor(bundle,scene){return scene?A(bundle.sceneHotspots).filter(h=>T(raw(h,"scene_id","sceneId"))===T(scene.id)).map((h,i)=>({...h,_id:T(raw(h,"id","hotspot_code","hotspotCode"))||`scene-hot-${i}`})):[]}
function useMobile(){const [m,setM]=useState(matchMedia("(max-width:760px)").matches);useEffect(()=>{const q=matchMedia("(max-width:760px)");const f=()=>setM(q.matches);q.addEventListener?.("change",f);return()=>q.removeEventListener?.("change",f)},[]);return m}

const css=`
.cab-root{--cab-navy:#061a30;--cab-blue:#0b3a7a;--cab-aqua:#5fc7cf;--cab-ivory:#fbfaf6;--cab-champ:#d1bc98;--cab-text:#102033;--cab-muted:#65758a;--cab-line:rgba(2,46,100,.12);font-family:Montserrat,Inter,system-ui,sans-serif;color:var(--cab-text)}
.cab-shell{border:1px solid var(--cab-line);border-radius:30px;overflow:hidden;background:var(--cab-ivory);box-shadow:0 22px 60px rgba(2,46,100,.1)}
.cab-top{position:relative;overflow:hidden;background:linear-gradient(145deg,#05192e,#0a3159);color:#fff;padding:28px 28px 22px}.cab-top:after{content:"";position:absolute;width:320px;height:320px;border-radius:50%;right:-120px;top:-190px;border:1px solid rgba(95,199,207,.18)}.cab-kicker{position:relative;z-index:1;color:#91dce2;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.16em}.cab-top h3{position:relative;z-index:1;margin:8px 0 7px;font-size:clamp(24px,3.5vw,38px);font-weight:550;line-height:1;letter-spacing:-.05em}.cab-top p{position:relative;z-index:1;margin:0;max-width:760px;color:#b9cee1;font-size:10.5px;line-height:1.65}
.cab-selectors{border-bottom:1px solid var(--cab-line);background:#fff}.cab-aircraft-strip,.cab-mode-strip,.cab-cabin-strip,.cab-view-strip{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:10px 15px}.cab-aircraft-strip::-webkit-scrollbar,.cab-mode-strip::-webkit-scrollbar,.cab-cabin-strip::-webkit-scrollbar,.cab-view-strip::-webkit-scrollbar{display:none}.cab-aircraft-strip{border-bottom:1px solid var(--cab-line)}.cab-pill{white-space:nowrap;border:1px solid var(--cab-line);border-radius:999px;background:#fff;color:#52677e;padding:9px 12px;font-size:8.5px;font-weight:800}.cab-pill[data-active="true"]{background:var(--cab-navy);border-color:var(--cab-navy);color:#fff}.cab-pill.cab-cabin[data-active="true"]{background:var(--cab-aqua);border-color:var(--cab-aqua);color:#06263c}
.cab-body{padding:18px}.cab-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.55fr);gap:14px}.cab-card{border:1px solid var(--cab-line);border-radius:22px;background:#fff;overflow:hidden}.cab-pad{padding:20px}.cab-title{margin:0 0 7px;color:#022e64;font-size:15px;font-weight:700}.cab-copy{margin:0;color:var(--cab-muted);font-size:10px;line-height:1.65;white-space:pre-line}.cab-facts{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.cab-fact{padding:8px 10px;border:1px solid var(--cab-line);border-radius:12px;background:#f8fafc}.cab-fact b{display:block;font-size:11px;color:#022e64}.cab-fact span{display:block;margin-top:2px;font-size:7.5px;color:#728196;text-transform:uppercase;letter-spacing:.06em}
.cab-aircraft-visual{position:relative;min-height:330px;background:linear-gradient(145deg,#e8f0f5,#f9faf7);overflow:hidden;display:grid;place-items:center}.cab-aircraft-visual img{width:100%;height:330px;object-fit:cover}.cab-visual-fallback{display:grid;place-items:center;text-align:center;color:#31516e;padding:28px}.cab-plane-svg{width:min(390px,80%);height:auto;opacity:.78}.cab-visual-fallback strong{display:block;margin-top:12px;color:#022e64;font-size:13px}.cab-visual-fallback span{display:block;margin-top:6px;color:#6d7f91;font-size:9px;line-height:1.5}.cab-cabin-list{display:grid;gap:8px;margin-top:15px}.cab-cabin-card{width:100%;border:1px solid var(--cab-line);border-radius:15px;background:#fff;padding:13px;text-align:left;color:#102033}.cab-cabin-card:hover,.cab-cabin-card[data-active="true"]{border-color:rgba(95,199,207,.75);box-shadow:0 7px 20px rgba(2,46,100,.06)}.cab-cabin-card strong{display:block;color:#022e64;font-size:10.5px}.cab-cabin-card span{display:block;margin-top:3px;color:#6b7c8e;font-size:8.5px}
.cab-media{position:relative;min-height:420px;background:linear-gradient(145deg,#0a2848,#0c355c);overflow:hidden}.cab-media img{width:100%;height:420px;object-fit:cover;transition:opacity .28s ease}.cab-media-fallback{height:420px;display:grid;place-items:center;text-align:center;padding:32px;color:#c3d5e5}.cab-media-fallback strong{display:block;font-size:22px;font-weight:550}.cab-media-fallback span{display:block;margin:8px auto 0;max-width:420px;font-size:9.5px;line-height:1.6;color:#9eb6cb}.cab-hotspot{position:absolute;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;border:1px solid rgba(255,255,255,.8);background:rgba(95,199,207,.94);color:#06263c;font-size:8px;font-weight:900;box-shadow:0 0 0 5px rgba(95,199,207,.12);display:grid;place-items:center}.cab-hotspot:hover,.cab-hotspot[data-active="true"]{box-shadow:0 0 0 9px rgba(95,199,207,.15)}.cab-hotspot-label{position:absolute;left:16px;right:16px;bottom:16px;max-width:420px;padding:13px 14px;border-radius:15px;background:rgba(3,17,31,.8);backdrop-filter:blur(12px);color:#fff;border:1px solid rgba(255,255,255,.15)}.cab-hotspot-label strong{display:block;font-size:10px}.cab-hotspot-label span{display:block;margin-top:4px;color:#c0d1df;font-size:8.5px;line-height:1.5}.cab-amenities{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}.cab-amenity{padding:6px 8px;border-radius:999px;background:#f3f7f9;border:1px solid var(--cab-line);font-size:8px;color:#486076}.cab-amenity b{color:#223f58}
.cab-empty{border:1px dashed rgba(2,46,100,.2);border-radius:18px;padding:28px;text-align:center;color:#6c7d8f;background:#fbfcfc}.cab-empty strong{display:block;color:#022e64;font-size:13px;margin-bottom:6px}.cab-empty span{font-size:9.5px;line-height:1.55}
.cab-layout{padding:18px}.cab-layout-note{padding:10px 12px;border-radius:12px;background:#f6f8fa;color:#647689;font-size:8.5px;line-height:1.55;margin-bottom:13px}.cab-seatrows{display:grid;gap:7px;justify-content:center;overflow:auto;padding:8px 0}.cab-row{display:flex;align-items:center;gap:6px}.cab-rowno{width:20px;text-align:right;color:#8290a0;font-size:7.5px}.cab-seatgroup{display:flex;gap:4px}.cab-aisle{width:16px}.cab-seat{width:32px;height:34px;border:1px solid rgba(2,46,100,.18);border-radius:10px 10px 7px 7px;background:#eef3f6;color:#37536c;font-size:8px;font-weight:800}.cab-seat:hover,.cab-seat[data-active="true"]{border-color:#5fc7cf;background:#e2f6f7;color:#022e64}.cab-seatinfo{margin-top:14px;border-top:1px solid var(--cab-line);padding-top:14px}.cab-seatinfo strong{display:block;color:#022e64;font-size:12px}.cab-seatinfo span{display:block;margin-top:4px;color:#6b7c8e;font-size:9px;line-height:1.5}
.cab-scenes{display:grid;grid-template-columns:190px minmax(0,1fr);gap:12px}.cab-scene-list{display:grid;gap:6px;align-content:start;max-height:480px;overflow:auto}.cab-scene-btn{border:1px solid var(--cab-line);border-radius:13px;background:#fff;color:#51647a;padding:11px;text-align:left;font-size:8.5px}.cab-scene-btn[data-active="true"]{border-color:#5fc7cf;background:#edfafa;color:#022e64}.cab-scene-btn strong{display:block;font-size:9.5px}.cab-scene-btn span{display:block;margin-top:3px;color:#7c8a99}.cab-scene-nav{display:flex;gap:8px;justify-content:space-between;margin-top:9px}.cab-action{min-height:39px;border:1px solid var(--cab-line);border-radius:999px;background:#fff;color:#022e64;padding:0 13px;font-size:8.5px;font-weight:800}.cab-action:disabled{opacity:.4}.cab-action-primary{background:#022e64;color:#fff;border-color:#022e64}
.cab-map-card{padding:22px}.cab-map-svg{width:100%;height:auto;display:block;max-height:520px}.cab-zone{cursor:pointer;transition:opacity .15s,filter .15s}.cab-zone:hover,.cab-zone[data-active="true"]{filter:brightness(1.08)}.cab-zone-label{font-size:9px;font-weight:700;fill:#123a5d;text-anchor:middle;pointer-events:none}.cab-map-note{margin-top:12px;color:#6f8092;font-size:8.5px;line-height:1.55}.cab-footer{padding:13px 18px;border-top:1px solid var(--cab-line);background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}.cab-footer span{color:#708195;font-size:8.5px;line-height:1.45}.cab-footer button{border:0;border-radius:999px;background:#022e64;color:#fff;padding:9px 12px;font-size:8.5px;font-weight:800}
@media(max-width:900px){.cab-grid{grid-template-columns:1fr}.cab-scenes{grid-template-columns:1fr}.cab-scene-list{display:flex;overflow-x:auto;max-height:none}.cab-scene-btn{min-width:150px}.cab-media,.cab-media img,.cab-media-fallback{height:360px;min-height:360px}}
@media(max-width:560px){.cab-shell{border-radius:22px}.cab-top{padding:22px 18px 18px}.cab-body{padding:10px}.cab-media,.cab-media img,.cab-media-fallback{height:300px;min-height:300px}.cab-pad{padding:16px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:260px;height:260px}.cab-footer{display:block}.cab-footer button{margin-top:8px;width:100%}.cab-aircraft-strip,.cab-mode-strip,.cab-cabin-strip,.cab-view-strip{padding-left:10px;padding-right:10px}.cab-seat{width:28px;height:31px}.cab-aisle{width:10px}}
@media(prefers-reduced-motion:reduce){.cab-root *{transition:none!important;animation:none!important}}

/* SKANDI Travel Info v12 cabin visual alignment */
.cab-root{
  --cab-home-primary:linear-gradient(135deg,#022e64,#0b5c85);
  --cab-home-white:#fff;
  --cab-home-aqua:#d9f1f1;
  --cab-home-sand:#f2e9dc;
  --cab-home-ice:#e9eef8;
  --cab-home-section:#f3f6f8;
  --cab-home-brown:#3c2f20;
}
.cab-shell{
  background:var(--cab-home-section);
  border-color:rgba(2,46,100,.08);
  box-shadow:0 24px 64px rgba(2,46,100,.13);
}
.cab-top{
  background:var(--cab-home-primary);
  isolation:isolate;
}
.cab-top:before{
  content:"";
  position:absolute;
  inset:0;
  z-index:0;
  pointer-events:none;
  opacity:.48;
  background:
    radial-gradient(circle at 82% 10%,rgba(95,199,207,.28),transparent 28%),
    linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:auto,38px 38px,38px 38px;
  animation:cabGridDrift 18s linear infinite;
}
.cab-top>*{position:relative;z-index:1}
@keyframes cabGridDrift{to{background-position:center,76px 38px,38px 76px}}
.cab-selectors{
  background:rgba(255,255,255,.96);
  backdrop-filter:blur(16px);
}
.cab-pill{
  transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease;
}
.cab-pill:hover{
  transform:translateY(-1px);
  border-color:#5fc7cf;
  box-shadow:0 5px 14px rgba(2,46,100,.07);
}
.cab-pill[data-active="true"]{
  background:linear-gradient(135deg,#022e64,#0b5c85);
  border-color:#022e64;
}
.cab-pill.cab-cabin[data-active="true"]{
  background:#d9f1f1;
  border-color:#5fc7cf;
  color:#022e64;
}
.cab-body{
  background:
    radial-gradient(circle at 90% 4%,rgba(95,199,207,.08),transparent 20%),
    var(--cab-home-section);
}
.cab-card{
  border-color:rgba(2,46,100,.08);
  box-shadow:0 8px 24px rgba(2,46,100,.055);
  transition:transform .26s cubic-bezier(.16,1,.3,1),box-shadow .26s ease,border-color .18s ease;
}
.cab-card:hover{
  border-color:rgba(95,199,207,.34);
  box-shadow:0 16px 34px rgba(2,46,100,.10);
}
.cab-grid>.cab-card:nth-child(2){
  background:#e9eef8;
}
.cab-aircraft-visual{
  background:linear-gradient(145deg,#d9f1f1,#e9eef8);
}
.cab-media{
  background:linear-gradient(135deg,#022e64,#0b5c85);
}
.cab-media:after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 84% 12%,rgba(95,199,207,.16),transparent 28%),
    linear-gradient(120deg,rgba(255,255,255,.08),transparent 38%);
}
.cab-hotspot{
  z-index:3;
  animation:cabHotPulse 2.2s ease-out infinite;
}
@keyframes cabHotPulse{
  0%,100%{box-shadow:0 0 0 5px rgba(95,199,207,.12)}
  50%{box-shadow:0 0 0 11px rgba(95,199,207,.04)}
}
.cab-hotspot-label{z-index:4}
.cab-cabin-card{
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.cab-cabin-card:hover{
  transform:translateY(-2px);
}
.cab-fact:nth-child(4n+1){background:#fff}
.cab-fact:nth-child(4n+2){background:#d9f1f1}
.cab-fact:nth-child(4n+3){background:#f2e9dc}
.cab-fact:nth-child(4n+4){background:#e9eef8}
.cab-amenity:nth-child(4n+1){background:#fff}
.cab-amenity:nth-child(4n+2){background:#d9f1f1}
.cab-amenity:nth-child(4n+3){background:#f2e9dc}
.cab-amenity:nth-child(4n+4){background:#e9eef8}
.cab-seat{
  transition:transform .15s ease,background .15s ease,border-color .15s ease,box-shadow .15s ease;
}
.cab-seat:hover{
  transform:translateY(-2px);
  box-shadow:0 5px 12px rgba(2,46,100,.10);
}
.cab-action-primary,.cab-footer button{
  background:linear-gradient(135deg,#022e64,#0b5c85);
}
@media(prefers-reduced-motion:reduce){
  .cab-top:before,.cab-hotspot{animation:none!important}
}


/* V11/V12 hybrid cabin — photo first, light chrome, V12 interactions */
.cab-shell{background:#fff;border-color:#e2e9f1;border-radius:24px;box-shadow:0 16px 44px rgba(2,46,100,.10)}
.cab-top{background:#fff;color:#022e64;padding:22px 22px 17px;border-bottom:1px solid #e2e9f1}
.cab-top:before,.cab-top:after{display:none!important}
.cab-kicker{color:#0b5c85;font-size:9px}.cab-top h3{color:#022e64;font-size:clamp(22px,3vw,32px);font-weight:650}.cab-top p{display:none}
.cab-selectors{background:#fff;border-bottom:1px solid #e2e9f1}.cab-aircraft-strip{border-bottom:1px solid #eef2f6}
.cab-pill{font-size:9px;border-color:#dfe7ef;color:#476079;background:#f8fafc}.cab-pill[data-active="true"]{background:#022e64;color:#fff;border-color:#022e64}.cab-pill.cab-cabin[data-active="true"]{background:#d9f1f1;color:#022e64;border-color:#5fc7cf}
.cab-body{padding:14px;background:#fff}.cab-grid{grid-template-columns:minmax(0,1.72fr) minmax(235px,.58fr);gap:12px}.cab-card{border-color:#e2e9f1;border-radius:18px;box-shadow:0 5px 18px rgba(2,46,100,.04)}.cab-grid>.cab-card:nth-child(2){background:#f7f9fc}
.cab-media{min-height:540px;border-radius:18px;background:#061932}.cab-media img{height:540px;transition:transform .65s cubic-bezier(.16,1,.3,1),filter .3s ease}.cab-media:hover img{transform:scale(1.018);filter:saturate(1.04)}.cab-media-fallback{height:540px}
.cab-hotspot{width:32px;height:32px;border:2px solid #fff;background:#5fc7cf;box-shadow:0 0 0 7px rgba(95,199,207,.15),0 10px 28px rgba(0,0,0,.25);transition:transform .2s ease,box-shadow .2s ease}.cab-hotspot:before{content:"";position:absolute;inset:-3px;border-radius:50%;border:1px solid rgba(255,255,255,.64);animation:cabHybridPulse 1.9s ease-out infinite}.cab-hotspot:hover,.cab-hotspot[data-active="true"]{transform:translate(-50%,-50%) scale(1.12);box-shadow:0 0 0 11px rgba(95,199,207,.10),0 14px 34px rgba(0,0,0,.28)}@keyframes cabHybridPulse{0%{transform:scale(.72);opacity:.85}100%{transform:scale(1.85);opacity:0}}
.cab-hotspot-label{left:18px;right:18px;bottom:18px;max-width:520px;background:rgba(255,255,255,.94);color:#022e64;border:1px solid rgba(255,255,255,.72);box-shadow:0 12px 34px rgba(0,0,0,.18)}.cab-hotspot-label strong{font-size:11px}.cab-hotspot-label span{color:#50647a;font-size:9.5px}
.cab-pad{padding:18px}.cab-title{font-size:14px}.cab-copy{font-size:10.5px}.cab-amenity{background:#fff;border-color:#dfe7ef;padding:7px 9px;font-size:8.5px}
.cab-cabin-card{border-color:#dfe7ef;border-radius:13px;background:#fff}.cab-cabin-card:hover,.cab-cabin-card[data-active="true"]{background:#edf8f8;border-color:#5fc7cf;box-shadow:none}
.cab-aircraft-visual{min-height:390px;background:#eef4fb}.cab-aircraft-visual img{height:390px;object-fit:cover}
.cab-scenes{grid-template-columns:165px minmax(0,1fr)}.cab-scene-btn{font-size:9px;border-color:#dfe7ef}.cab-scene-btn span{display:none}.cab-scene-btn[data-active="true"]{background:#edf8f8;border-color:#5fc7cf}
.cab-footer{padding:11px 15px;border-top:1px solid #e2e9f1}.cab-footer span{display:none}.cab-footer{justify-content:flex-end}.cab-footer button{font-size:9px;padding:10px 14px}
.cab-layout-note,.cab-map-note{display:none!important}
@media(max-width:900px){.cab-grid{grid-template-columns:1fr}.cab-media,.cab-media img,.cab-media-fallback{height:470px;min-height:470px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:330px;height:330px}}
@media(max-width:560px){.cab-top{padding:19px 16px 14px}.cab-body{padding:8px}.cab-media,.cab-media img,.cab-media-fallback{height:360px;min-height:360px}.cab-aircraft-visual,.cab-aircraft-visual img{min-height:280px;height:280px}.cab-scenes{grid-template-columns:1fr}}
/* V12 immersive cabin navigation: uses published aircraft imagery and scene links only. */
.cab-smart-media{position:relative;overflow:hidden;background:#061a30!important;border-radius:18px}
.cab-immersive-viewer{position:relative;min-height:560px;height:clamp(420px,57vw,680px);overflow:hidden;touch-action:none;cursor:grab;outline-offset:-4px;background:linear-gradient(140deg,#041325,#0a3d63);color:#fff;isolation:isolate}
.cab-immersive-viewer:active{cursor:grabbing}
.cab-immersive-viewer:fullscreen{height:100dvh;width:100vw}
.cab-immersive-frame{position:absolute;inset:0;overflow:hidden}
.cab-immersive-frame:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,12,28,.52),transparent 22%,transparent 66%,rgba(0,12,28,.38));z-index:2}
.cab-photo-plane{position:absolute;inset:0;transform-origin:center;will-change:transform;transition:transform .14s linear}
.cab-immersive-image{width:100%!important;height:100%!important;min-height:0!important;object-fit:cover;user-select:none;-webkit-user-drag:none;pointer-events:none;max-width:none}
.cab-ambient-motion{animation:cabAmbientDrift 13s ease-in-out infinite alternate}
@keyframes cabAmbientDrift{from{filter:saturate(1.0);transform:scale(1)}to{filter:saturate(1.055);transform:scale(1.045)}}
.cab-panorama-canvas{display:block;width:100%;height:100%;background:#071a2e}
.cab-viewer-top{position:absolute;z-index:7;top:0;left:0;right:0;padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;pointer-events:none}
.cab-viewer-heading{display:grid;gap:4px;max-width:50%;min-width:0;text-shadow:0 2px 12px #0009}
.cab-viewer-heading span{font-size:8px;letter-spacing:.12em;font-weight:800;color:#aadce7}
.cab-viewer-heading strong{font-size:clamp(13px,1.5vw,20px);font-weight:700;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cab-viewer-tools{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end;pointer-events:auto}
.cab-glass-tool{min-width:36px;height:36px;padding:0 9px;border-radius:10px;background:rgba(5,23,45,.70);color:#fff;border:1px solid rgba(255,255,255,.35);backdrop-filter:blur(12px);font-size:14px;font-weight:750;display:grid;place-items:center;box-shadow:0 6px 18px #0003;transition:background .18s,border-color .18s}
.cab-glass-tool:hover,.cab-glass-tool[aria-pressed="true"]{background:#d9f1f1;color:#022e64;border-color:#5fc7cf}
.cab-glass-tool:disabled{opacity:.36;cursor:not-allowed}
.cab-viewer-instructions{position:absolute;z-index:5;left:18px;bottom:16px;display:flex;gap:7px;align-items:center;flex-wrap:wrap;max-width:calc(100% - 36px);padding:9px 12px;border-radius:10px;background:rgba(3,17,35,.64);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14);font-size:9px;font-weight:650;color:#e7f8ff;pointer-events:none}
.cab-immersive-viewer .cab-hotspot{z-index:4;width:30px;height:30px}
.cab-immersive-viewer .cab-hotspot-label{z-index:9;max-width:440px;left:17px;right:17px;bottom:67px;background:rgba(255,255,255,.95);color:#022e64;pointer-events:auto;padding-right:40px}
.cab-immersive-viewer .cab-hotspot-label span{color:#566b7a}
.cab-hotspot-close{position:absolute;right:9px;top:8px;width:27px;height:27px;border:0;background:#e9eef8;color:#022e64;border-radius:8px;font-size:18px}
.cab-feature-rail{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding:9px;background:#fff;border-top:1px solid #e2e9f1}
.cab-feature-rail button{white-space:nowrap;border:1px solid #dce9f0;border-radius:9px;background:#f6f9fc;padding:8px 10px;color:#315270;font-size:9px;font-weight:700}
.cab-feature-rail button[data-active="true"]{background:#d9f1f1;border-color:#5fc7cf;color:#022e64}
.cab-immersive-fallback{height:100%;min-height:420px}
.cab-smart-walk{display:grid;gap:13px}
.cab-walk-overview{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:6px 4px 10px}
.cab-walk-eyebrow{display:block;color:#0b5c85;letter-spacing:.16em;font-size:9px;font-weight:800}
.cab-walk-overview h4{margin:6px 0 5px;color:#022e64;font-size:clamp(20px,2.5vw,30px);letter-spacing:-.04em;font-weight:700}
.cab-walk-overview p{margin:0;color:#617487;font-size:10px;line-height:1.55}
.cab-walk-top-actions{display:flex;flex-wrap:wrap;gap:7px;flex:0 0 auto}
.cab-smart-walk-layout{display:grid;grid-template-columns:minmax(165px,.28fr) minmax(0,1fr);gap:12px;align-items:start}
.cab-walk-map{border:1px solid #e2e9f1;border-radius:17px;background:#f9fbfd;padding:17px 12px;position:sticky;top:16px}
.cab-walk-map-title{display:flex;justify-content:space-between;gap:12px;padding:0 5px 13px;font-size:9px;letter-spacing:.11em;font-weight:800;color:#355b74;border-bottom:1px solid #e2e9f1}
.cab-walk-map-title span{letter-spacing:0;color:#8196a5}
.cab-walk-map-list{display:grid;max-height:600px;overflow:auto;padding:12px 0;scrollbar-width:thin}
.cab-walk-stop{position:relative;display:grid;grid-template-columns:31px minmax(0,1fr);gap:9px;align-items:center;min-height:65px;border:0;background:transparent;border-radius:9px;padding:8px 4px;color:#51677d;text-align:left}
.cab-walk-stop:before{content:"";position:absolute;width:1px;top:0;bottom:0;left:19px;background:#c9d9e5}
.cab-walk-stop:first-child:before{top:50%}.cab-walk-stop:last-child:before{bottom:50%}
.cab-walk-node{position:relative;z-index:1;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#fff;border:1px solid #ccdce7;font-size:9px;font-weight:800;color:#58758e}
.cab-walk-stop[data-active="true"]{background:#e9f6f8;color:#022e64}
.cab-walk-stop[data-active="true"] .cab-walk-node{background:#022e64;color:#fff;border-color:#022e64;box-shadow:0 0 0 4px #d9f1f1}
.cab-walk-stop strong{display:block;font-size:10px;line-height:1.38}
.cab-walk-stop small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:3px;color:#8290a0;font-size:8px;line-height:1.4}
.cab-walk-map-footer{padding:11px 5px 0;margin:0;border-top:1px solid #e2e9f1;font-size:9px;color:#8191a1;line-height:1.5}
.cab-walk-stage{min-width:0;display:grid;gap:9px}
.cab-walk-scene-meta{display:flex;align-items:center;justify-content:space-between;gap:15px;background:#f1f6fa;border:1px solid #e2e9f1;border-radius:13px;padding:10px 13px}
.cab-walk-scene-meta>div:first-child{display:flex;gap:9px;align-items:center;min-width:0}
.cab-walk-scene-meta span{font-size:8px;font-weight:800;letter-spacing:.1em;color:#0b5c85;white-space:nowrap}
.cab-walk-scene-meta strong{font-size:10px;font-weight:800;color:#022e64;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cab-walk-autoprogress{height:4px;width:min(115px,24%);flex:none;border-radius:10px;background:#d7e6ee;overflow:hidden}
.cab-walk-autoprogress i{display:block;width:100%;height:100%;background:#0b5c85;transform-origin:left;animation:cabTourProgress 7.2s linear both}
@keyframes cabTourProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cab-walk-scene-swap{animation:cabSceneReveal .65s cubic-bezier(.16,1,.3,1) both;min-width:0}
@keyframes cabSceneReveal{from{opacity:.4;transform:scale(.985);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
.cab-walk-navigation{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cab-walk-navigation button{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:9px;border-radius:12px;border:1px solid #dfe8ef;background:#f5f8fb;padding:11px 14px;color:#022e64;text-align:left}
.cab-walk-navigation button:disabled{opacity:.4;cursor:not-allowed}
.cab-walk-navigation button>span:first-child:last-child{min-width:0}
.cab-walk-navigation button>span[aria-hidden="true"]{font-size:24px;font-weight:400;color:#0b5c85}
.cab-walk-navigation button small{display:block;font-size:8px;font-weight:800;letter-spacing:.12em;color:#6c889a}
.cab-walk-navigation button strong{display:block;margin-top:4px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cab-walk-navigation .cab-walk-next{background:#022e64;color:#fff;border-color:#022e64;text-align:right}
.cab-walk-navigation .cab-walk-next small,.cab-walk-navigation .cab-walk-next>span[aria-hidden="true"]{color:#a4dce3}
@media(max-width:1000px){.cab-smart-walk-layout{grid-template-columns:1fr}.cab-walk-map{position:static}.cab-walk-map-list{display:flex;overflow-x:auto;max-height:none;padding:10px 0;gap:8px}.cab-walk-stop{flex:0 0 165px;border:1px solid #e2e9f1;background:#fff;padding:11px;grid-template-columns:24px 1fr}.cab-walk-stop:before{display:none}.cab-walk-node{width:24px;height:24px}.cab-walk-map-footer{display:none}}
@media(max-width:660px){.cab-walk-overview{display:block}.cab-walk-top-actions{margin-top:12px}.cab-immersive-viewer{height:65svh;min-height:350px;max-height:560px}.cab-viewer-top{padding:11px;display:block}.cab-viewer-heading{max-width:100%}.cab-viewer-heading strong{font-size:14px}.cab-viewer-tools{margin-top:12px;justify-content:flex-start}.cab-glass-tool{width:34px;height:34px}.cab-walk-scene-meta{padding:9px}.cab-walk-navigation button{padding:9px}.cab-walk-navigation button strong{font-size:9px}.cab-viewer-instructions{font-size:8px}.cab-immersive-viewer .cab-hotspot-label{left:10px;right:10px;bottom:60px}}
@media(prefers-reduced-motion:reduce){.cab-ambient-motion,.cab-walk-scene-swap,.cab-walk-autoprogress i{animation:none!important}.cab-photo-plane{transition:none!important}}

.cab-walk-scene-swap{position:relative}
.cab-aisle-move{position:absolute;z-index:8;bottom:20%;left:50%;transform:translateX(-50%);display:grid;place-items:center;gap:3px;padding:9px 17px;border-radius:14px;border:1px solid rgba(255,255,255,.78);background:rgba(217,241,241,.93);color:#022e64;box-shadow:0 8px 28px #0005;backdrop-filter:blur(12px);font-size:9px;letter-spacing:.11em;transition:transform .2s ease,box-shadow .2s ease;white-space:nowrap}
.cab-aisle-move>span{font-size:23px;line-height:1;font-weight:700}
.cab-aisle-move:hover{transform:translateX(-50%) translateY(-4px);box-shadow:0 14px 32px #0005}
@media(max-width:660px){.cab-aisle-move{bottom:23%;padding:7px 12px;font-size:8px}.cab-aisle-move>span{font-size:17px}}
@media(prefers-reduced-motion:reduce){.cab-aisle-move{transition:none!important}}

`;

function PlaneSilhouette(){return html`<svg className="cab-plane-svg" viewBox="0 0 520 180" aria-hidden="true"><path d="M260 12c-9 0-15 15-17 34l-7 43-155 37c-12 3-18 10-16 17 2 7 11 9 21 7l145-21-5 34-45 16c-8 3-11 8-9 13 2 5 8 6 15 4l73-13 73 13c7 2 13 1 15-4 2-5-1-10-9-13l-45-16-5-34 145 21c10 2 19 0 21-7 2-7-4-14-16-17l-155-37-7-43c-2-19-8-34-17-34Z" fill="#8fb1c8" opacity=".82"/></svg>`}
function AircraftVisual({aircraft}){return html`<div className="cab-aircraft-visual">${aircraft._hero?html`<img src=${aircraft._hero} alt=${`${aircraft._name} aircraft`}/>`:html`<div className="cab-visual-fallback"><div><${PlaneSilhouette}/><strong>${aircraft._name}</strong><span>Illustrative aircraft orientation. Published configuration details are shown alongside it.</span></div></div>`}</div>`}
function Facts({aircraft,cabins}){const f=[["Aircraft code",aircraft._code],["Manufacturer",aircraft._manufacturer],["Family",aircraft._family],["Variant",aircraft._variant],["Total seats",aircraft._seats||""]].filter(([,v])=>T(v));return html`<div className="cab-facts">${f.map(([k,v])=>html`<span className="cab-fact"><b>${v}</b><span>${k}</span></span>`)}${cabins.length?html`<span className="cab-fact"><b>${cabins.length}</b><span>Published cabins</span></span>`:null}</div>`}
function Overview({aircraft,cabins,cabinId,setCabin}){return html`<div className="cab-grid"><div className="cab-card"><${AircraftVisual} aircraft=${aircraft}/><div className="cab-pad"><h4 className="cab-title">${aircraft._name}</h4><p className="cab-copy">${T(raw(aircraft,"display_summary","displaySummary"))||"Explore the published aircraft configuration and cabin products."}</p><${Facts} aircraft=${aircraft} cabins=${cabins}/></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Cabins on this aircraft</h4><p className="cab-copy">Select a cabin to keep it active as you move through the explorer.</p><div className="cab-cabin-list">${cabins.length?cabins.map(c=>html`<button className="cab-cabin-card" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)}><strong>${c._name}</strong><span>${[c._code,c._seats?`${c._seats} seats`:""].filter(Boolean).join(" · ")}</span></button>`):html`<div className="cab-empty"><strong>Cabin details are not available for this aircraft.</strong><span>Aircraft information remains available above.</span></div>`}</div></aside></div>`}
const cabClamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const cabReducedMotion=()=>typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const cabIsPanoType=v=>/(^|[^A-Z0-9])(360|PANO|PANORAMA|EQUIRECTANGULAR|SPHERICAL)($|[^A-Z0-9])/i.test(T(v));

function PanoramaCanvas({image,yaw,pitch,zoom,onFailure}){
  const canvasRef=React.useRef(null),rendererRef=React.useRef(null),cameraRef=React.useRef({yaw,pitch,zoom});
  cameraRef.current={yaw,pitch,zoom};
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||!image)return;
    let disposed=false,raf=0,observer=null,texture=null,program=null,buffer=null;
    const gl=canvas.getContext("webgl",{alpha:false,antialias:false,preserveDrawingBuffer:false});
    if(!gl){onFailure?.();return}
    const vert=`attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.0,1.0);}`;
    const frag=`precision highp float;
    uniform sampler2D uImage;uniform vec2 uResolution;uniform float uYaw;uniform float uPitch;uniform float uFov;
    const float PI=3.141592653589793;
    void main(){
      vec2 p=(gl_FragCoord.xy/uResolution)*2.0-1.0;
      p.x*=uResolution.x/uResolution.y;
      vec3 ray=normalize(vec3(p*tan(uFov*0.5),1.0));
      float cp=cos(uPitch),sp=sin(uPitch),cy=cos(uYaw),sy=sin(uYaw);
      vec3 t=vec3(ray.x,ray.y*cp+ray.z*sp,-ray.y*sp+ray.z*cp);
      vec3 d=normalize(vec3(t.x*cy+t.z*sy,t.y,-t.x*sy+t.z*cy));
      vec2 uv=vec2(fract(0.5+atan(d.x,d.z)/(2.0*PI)),0.5+asin(clamp(d.y,-1.0,1.0))/PI);
      gl_FragColor=texture2D(uImage,uv);
    }`;
    const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw Error("WEBGL_SHADER_UNSUPPORTED")}return sh};
    try{
      const v=shader(gl.VERTEX_SHADER,vert),f=shader(gl.FRAGMENT_SHADER,frag);program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("WEBGL_LINK_UNSUPPORTED");
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      gl.useProgram(program);const pos=gl.getAttribLocation(program,"aPosition");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      gl.uniform1i(gl.getUniformLocation(program,"uImage"),0);
    }catch(_){onFailure?.();return}
    let ready=false;
    const imageEl=new Image();imageEl.crossOrigin="anonymous";imageEl.decoding="async";
    const draw=(y,p,z)=>{
      if(!ready||disposed||gl.isContextLost())return;
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),d=Math.min(window.devicePixelRatio||1,2);
      const pw=Math.max(1,Math.floor(w*d)),ph=Math.max(1,Math.floor(h*d));
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
      gl.viewport(0,0,pw,ph);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform2f(gl.getUniformLocation(program,"uResolution"),pw,ph);
      gl.uniform1f(gl.getUniformLocation(program,"uYaw"),y*Math.PI/180);
      gl.uniform1f(gl.getUniformLocation(program,"uPitch"),p*Math.PI/180);
      gl.uniform1f(gl.getUniformLocation(program,"uFov"),(75/z)*Math.PI/180);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    imageEl.onload=()=>{
      if(disposed)return;
      try{
        texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,imageEl);
        ready=true;rendererRef.current=draw;
        draw(cameraRef.current.yaw,cameraRef.current.pitch,cameraRef.current.zoom);
        if(typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(()=>draw(cameraRef.current.yaw,cameraRef.current.pitch,cameraRef.current.zoom));observer.observe(canvas)}
      }catch(_){if(!disposed)onFailure?.()}
    };
    imageEl.onerror=()=>{if(!disposed)onFailure?.()};imageEl.src=image;
    return()=>{disposed=true;rendererRef.current=null;cancelAnimationFrame(raf);observer?.disconnect();imageEl.onload=null;imageEl.onerror=null;if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)};
  },[image]);
  useEffect(()=>{rendererRef.current?.(yaw,pitch,zoom)},[yaw,pitch,zoom]);
  return html`<canvas ref=${canvasRef} className="cab-panorama-canvas" aria-hidden="true"/>`;
}

function MediaStage({image,alt,hotspots=[],active,setActive,fallbackTitle,fallbackCopy,viewType="",sceneKey=""}){
  const viewerRef=React.useRef(null),gestureRef=React.useRef(null);
  const [camera,setCamera]=useState({x:0,y:0,yaw:0,pitch:0,zoom:1});
  const [imageInfo,setImageInfo]=useState(null),[imageError,setImageError]=useState(false);
  const [pano,setPano]=useState(false),[panoError,setPanoError]=useState(false);
  const [fullscreen,setFullscreen]=useState(false),[activity,setActivity]=useState(false);
  const selected=hotspots.find(h=>h._id===active)||null;
  const eligiblePano=Boolean(imageInfo&&imageInfo.w>=1024&&Math.abs(imageInfo.w/imageInfo.h-2)<.11);
  const isPano=eligiblePano&&pano&&!panoError;
  useEffect(()=>{setCamera({x:0,y:0,yaw:0,pitch:0,zoom:1});setImageInfo(null);setImageError(false);setPanoError(false);setPano(false);setActivity(false)},[image,sceneKey]);
  useEffect(()=>{if(eligiblePano&&cabIsPanoType(viewType)&&!panoError)setPano(true)},[eligiblePano,viewType,panoError]);
  useEffect(()=>{const listener=()=>setFullscreen(document.fullscreenElement===viewerRef.current);document.addEventListener("fullscreenchange",listener);return()=>document.removeEventListener("fullscreenchange",listener)},[]);
  const changeZoom=delta=>{setActivity(true);setCamera(c=>({...c,zoom:cabClamp(c.zoom+delta,1,2.5)}))};
  const pointerDown=e=>{if(!image||imageError||e.button!==0||e.target.closest("button"))return;gestureRef.current={id:e.pointerId,x:e.clientX,y:e.clientY,camera};setActivity(true);e.currentTarget.setPointerCapture?.(e.pointerId)};
  const pointerMove=e=>{const g=gestureRef.current;if(!g||e.pointerId!==g.id)return;const w=Math.max(1,e.currentTarget.clientWidth),h=Math.max(1,e.currentTarget.clientHeight);const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(isPano)setCamera(c=>({...c,yaw:g.camera.yaw-dx/w*125,pitch:cabClamp(g.camera.pitch+dy/h*85,-78,78)}));
    else {const max=Math.max(3,(g.camera.zoom-1)*40+3);setCamera(c=>({...c,x:cabClamp(g.camera.x+dx/w*100,-max,max),y:cabClamp(g.camera.y+dy/h*100,-max,max)}))}
  };
  const pointerUp=e=>{if(gestureRef.current?.id===e.pointerId)gestureRef.current=null};
  const handleKey=e=>{if(e.target!==e.currentTarget)return;const factor=e.shiftKey?2:1;let used=true;switch(e.key){
    case"ArrowLeft":case"a":case"A":setCamera(c=>({...c,yaw:c.yaw-12*factor,x:cabClamp(c.x+6*factor,-50,50)}));break;
    case"ArrowRight":case"d":case"D":setCamera(c=>({...c,yaw:c.yaw+12*factor,x:cabClamp(c.x-6*factor,-50,50)}));break;
    case"ArrowUp":case"w":case"W":setCamera(c=>({...c,pitch:cabClamp(c.pitch+9*factor,-78,78),y:cabClamp(c.y+6*factor,-50,50)}));break;
    case"ArrowDown":case"s":case"S":setCamera(c=>({...c,pitch:cabClamp(c.pitch-9*factor,-78,78),y:cabClamp(c.y-6*factor,-50,50)}));break;
    case"+":case"=":changeZoom(.18);break;
    case"-":case"_":changeZoom(-.18);break;
    case"0":setCamera({x:0,y:0,yaw:0,pitch:0,zoom:1});break;
    default:used=false}
    if(used){e.preventDefault();setActivity(true)}
  };
  const focusHotspot=h=>{setActive?.(h._id);setActivity(true);const fx=raw(h,"focus_x","focusX"),fy=raw(h,"focus_y","focusY"),fz=raw(h,"focus_zoom","focusZoom");
    if(fx!==""||fy!==""||fz!=="")setCamera(c=>({...c,x:fx!==""?cabClamp((50-N(fx,50))*.2,-35,35):c.x,y:fy!==""?cabClamp((50-N(fy,50))*.2,-35,35):c.y,zoom:fz!==""?cabClamp(N(fz,1.3),1,2.5):c.zoom}));
    if(isPano)setCamera(c=>({...c,yaw:(N(raw(h,"x","xPercent"),50)/100-.5)*360,pitch:(.5-N(raw(h,"y","yPercent"),50)/100)*150}));
  };
  const toggleFullscreen=()=>{const node=viewerRef.current;if(!node)return;if(document.fullscreenElement===node){document.exitFullscreen?.().catch?.(()=>{})}else{const res=node.requestFullscreen?.();res?.catch?.(()=>{})}};
  const title=T(fallbackTitle||alt||"Cabin view");
  return html`<div className="cab-card cab-smart-media"><div ref=${viewerRef} className="cab-immersive-viewer" tabIndex="0" role="region" aria-label=${`${title}. Drag to look around, scroll or use zoom controls, arrow keys to adjust camera.`} onPointerDown=${pointerDown} onPointerMove=${pointerMove} onPointerUp=${pointerUp} onPointerCancel=${pointerUp} onLostPointerCapture=${()=>{gestureRef.current=null}} onKeyDown=${handleKey} onWheel=${e=>{if(!image||imageError)return;e.preventDefault();changeZoom(e.deltaY>0?-.14:.14)}}>
    ${image&&!imageError?html`<div className="cab-immersive-frame">
      ${isPano?html`<${PanoramaCanvas} image=${image} yaw=${camera.yaw} pitch=${camera.pitch} zoom=${camera.zoom} onFailure=${()=>{setPanoError(true);setPano(false)}}/>`:html`<div className="cab-photo-plane" style=${{transform:`translate3d(${camera.x}%,${camera.y}%,0) scale(${Math.max(1.08,camera.zoom)})`}}><img className=${`cab-immersive-image ${activity||cabReducedMotion()?"":"cab-ambient-motion"}`} src=${image} alt=${alt} draggable="false" onLoad=${e=>{const im=e.currentTarget;setImageInfo({w:im.naturalWidth,h:im.naturalHeight})}} onError=${()=>setImageError(true)}/>${hotspots.map((h,i)=>html`<button type="button" className="cab-hotspot" key=${h._id||i} data-active=${h._id===active?"true":"false"} style=${{left:`${cabClamp(N(raw(h,"x","xPercent"),50),0,100)}%`,top:`${cabClamp(N(raw(h,"y","yPercent"),50),0,100)}%`}} aria-label=${T(h.label||h.title||`Cabin feature ${i+1}`)} onClick=${()=>focusHotspot(h)}>${i+1}</button>`)}</div>`}
    </div>`:html`<div className="cab-media-fallback cab-immersive-fallback"><div><strong>${imageError?"Unable to display this cabin image":title}</strong><span>${imageError?"The published cabin image could not be loaded.":fallbackCopy}</span></div></div>`}
    <div className="cab-viewer-top"><div className="cab-viewer-heading"><span>SKANDI CABIN EXPLORER</span><strong>${title}</strong></div><div className="cab-viewer-tools">
      ${eligiblePano?html`<button type="button" className="cab-glass-tool" aria-pressed=${isPano} onClick=${()=>{setActivity(true);setPano(!isPano)}} title="Use 360-degree projection only with equirectangular panorama photography">${isPano?"PHOTO":"360°"}</button>`:null}
      <button type="button" className="cab-glass-tool" onClick=${()=>changeZoom(-.2)} disabled=${!image||camera.zoom<=1} aria-label="Zoom out">−</button>
      <button type="button" className="cab-glass-tool" onClick=${()=>changeZoom(.2)} disabled=${!image||camera.zoom>=2.5} aria-label="Zoom in">+</button>
      <button type="button" className="cab-glass-tool" onClick=${()=>{setCamera({x:0,y:0,yaw:0,pitch:0,zoom:1});setActivity(false)}} aria-label="Reset view">↺</button>
      <button type="button" className="cab-glass-tool" onClick=${toggleFullscreen} aria-label=${fullscreen?"Exit fullscreen":"Enter fullscreen"}>${fullscreen?"↙":"⤢"}</button>
    </div></div>
    ${image&&!imageError?html`<div className="cab-viewer-instructions">${isPano?"Drag to turn · scroll to zoom":"Drag to explore · scroll to zoom"}<span aria-hidden="true">·</span> Arrow keys supported</div>`:null}
    ${selected?html`<div className="cab-hotspot-label" role="status"><strong>${T(selected.title||selected.label||"Cabin feature")}</strong>${T(selected.description||selected.summary||"")?html`<span>${T(selected.description||selected.summary)}</span>`:null}<button type="button" className="cab-hotspot-close" onClick=${()=>setActive?.("")} aria-label="Close feature detail">×</button></div>`:null}
  </div>${hotspots.length?html`<div className="cab-feature-rail" aria-label="Cabin features">${hotspots.map((h,i)=>html`<button type="button" key=${h._id||i} data-active=${h._id===active?"true":"false"} onClick=${()=>focusHotspot(h)}>${i+1}. ${T(h.label||h.title||"Feature")}</button>`)}</div>`:null}</div>`;
}

function CabinExplorer({bundle,aircraft,cabin,legacyClass}){
  const views=useMemo(()=>viewsFor(bundle,aircraft,cabin,legacyClass),[bundle,aircraft._id,cabin?._id]);const defaultView=views.find(v=>raw(v,"is_default","isDefault")===true)||views[0];const[viewId,setViewId]=useState(defaultView?._id||"");useEffect(()=>setViewId((views.find(v=>raw(v,"is_default","isDefault")===true)||views[0])?._id||""),[aircraft._id,cabin?._id]);const view=views.find(v=>v._id===viewId)||views[0];const canonicalHot=hotspotsFor(bundle,view);const hotspots=canonicalHot.length?canonicalHot:A(view?._legacyHotspots).map((h,i)=>({...h,_id:T(h.id||h.hotspotId)||`legacy-${i}`}));const[hot,setHot]=useState(hotspots[0]?._id||"");useEffect(()=>setHot(hotspots[0]?._id||""),[viewId]);const amenities=amenityItems(cabin,legacyClass);const desc=T(raw(cabin,"description","summary"))||T(raw(legacyClass,"summary"));
  return html`<div>${views.length?html`<div className="cab-view-strip">${views.map(v=>html`<button className="cab-pill" data-active=${v._id===view?._id?"true":"false"} onClick=${()=>transition(()=>setViewId(v._id))}>${v._label}</button>`)}</div>`:null}<div className="cab-grid"><${MediaStage} image=${view?._image||""} alt=${`${cabin?._name||"Cabin"} cabin view`} hotspots=${hotspots} active=${hot} setActive=${setHot} fallbackTitle=${cabin?._name||"Cabin explorer"} fallbackCopy=${views.length?"An image is not available for this view.":"No cabin imagery is currently published for this configuration."} viewType=${T(raw(view,"view_type","viewType"))}/><aside className="cab-card cab-pad"><h4 className="cab-title">${cabin?._name||"Cabin"}</h4><p className="cab-copy">${desc||"Cabin details will appear here when available."}</p>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:html`<div className="cab-empty" style=${{marginTop:"14px"}}><strong>Amenities are not available for this cabin.</strong><span>We do not infer cabin features that are not in the airline information.</span></div>`}<div className="cab-layout-note" style=${{marginTop:"14px"}}>${views.length?`${views.length} view${views.length===1?"":"s"} for this aircraft/cabin context.`:"Cabin views are not currently published."}</div></aside></div></div>`
}
function SeatExperience({aircraft,cabin,legacyClass}){const layout=configuredSeatLayout(cabin);const amenities=amenityItems(cabin,legacyClass);const[selected,setSelected]=useState("");if(!layout.length)return html`<div className="cab-grid"><div className="cab-card cab-pad"><div className="cab-empty"><strong>Cabin layout preview is not available.</strong><span>Seat positions, pitch, width and recline are not inferred. Seat availability is shown during booking.</span></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">${cabin?._name||"Seat experience"}</h4><p className="cab-copy">${T(raw(cabin,"description","summary"))||"Published cabin information appears here when available."}</p>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:null}</aside></div>`;
  const rows=[1,2,3];return html`<div className="cab-grid"><div className="cab-card cab-layout"><div className="cab-layout-note"><strong>Cabin layout preview.</strong> This is an informational representation based on the published cabin layout setting, not a live seat map.</div><div className="cab-seatrows">${rows.map(r=>html`<div className="cab-row"><span className="cab-rowno">${r}</span>${layout.map((group,gi)=>html`<${React.Fragment} key=${gi}><span className="cab-seatgroup">${group.map(letter=>{const id=`${r}${letter}`;return html`<button className="cab-seat" data-active=${selected===id?"true":"false"} onClick=${()=>setSelected(id)}>${id}</button>`})}</span>${gi<layout.length-1?html`<span className="cab-aisle"></span>`:null}</${React.Fragment}>`)}</div>`)}</div><div className="cab-seatinfo"><strong>${selected||"Select a representative seat"}</strong><span>${selected?`${cabin?._name||"Cabin"} · availability, restrictions and pricing are shown during booking.`:"Choose a seat in the preview to see its cabin context."}</span></div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Seat & cabin features</h4>${amenities.length?html`<div className="cab-amenities">${amenities.map(a=>html`<span className="cab-amenity"><b>${a.label}</b>${a.value?` · ${a.value}`:""}</span>`)}</div>`:html`<div className="cab-empty"><strong>Seat features are not available.</strong><span>Only configured cabin information is shown.</span></div>`}</aside></div>`
}
function Walkthrough({bundle,aircraft}){
  const scenes=useMemo(()=>scenesFor(bundle,aircraft),[bundle,aircraft._id]);
  const start=T(raw(aircraft,"walkthrough_start_scene_code","walkthroughStartSceneCode"));
  const initial=()=>scenes.some(s=>s._code===start)?start:scenes[0]?._code||"";
  const [code,setCode]=useState(initial);
  const [auto,setAuto]=useState(!cabReducedMotion());
  const [visible,setVisible]=useState(!document.hidden);
  const [hot,setHot]=useState("");
  useEffect(()=>{setCode(initial());setAuto(!cabReducedMotion());setHot("")},[aircraft._id]);
  useEffect(()=>{const onVisibility=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility)},[]);
  const index=Math.max(0,scenes.findIndex(s=>s._code===code));
  const scene=scenes[index];
  const validCode=ref=>scenes.some(s=>s._code===ref&&s._code!==scene?._code)?ref:"";
  const nextCode=scene?validCode(T(raw(scene,"forward_scene_code","forwardSceneCode")))||scenes[index+1]?._code||"":"";
  const backCode=scene?validCode(T(raw(scene,"back_scene_code","backSceneCode")))||scenes[index-1]?._code||"":"";
  const hotspots=scene?sceneHotspotsFor(bundle,scene):[];
  const image=scene?T(raw(scene,"image_url","imageUrl","mobile_image_url","mobileImageUrl")):"";
  useEffect(()=>{setHot("")},[scene?._code]);
  useEffect(()=>{if(!auto||!visible||!nextCode||!image||cabReducedMotion())return;const id=window.setTimeout(()=>transition(()=>setCode(nextCode)),7200);return()=>window.clearTimeout(id)},[auto,visible,code,nextCode,image]);
  useEffect(()=>{if(!nextCode)return;const next=scenes.find(s=>s._code===nextCode);const url=T(raw(next,"image_url","imageUrl","mobile_image_url","mobileImageUrl"));if(!url)return;const preload=new Image();preload.src=url;return()=>{preload.src=""}},[nextCode,aircraft._id]);
  const visit=(target,manual=true)=>{if(!target||!scenes.some(s=>s._code===target))return;if(manual)setAuto(false);transition(()=>setCode(target))};
  if(!scenes.length)return html`<div className="cab-empty"><strong>No published cabin walkthrough is available for this aircraft.</strong><span>Cabin Explorer shows any available published cabin photography. Interactive walking requires linked walkthrough scenes configured for this aircraft.</span></div>`;
  const sceneTitle=T(scene?.short_title||scene?.shortTitle||scene?.title)||`Cabin stop ${index+1}`;
  return html`<div className="cab-smart-walk">
    <div className="cab-walk-overview"><div><span className="cab-walk-eyebrow">EXPLORE THE AIRCRAFT</span><h4>Walk through the cabin</h4><p>Move through published cabin scenes, look around each view, or follow the guided tour.</p></div>
      <div className="cab-walk-top-actions"><button type="button" className="cab-action" onClick=${()=>visit(initial())}>Start at entrance</button><button type="button" className="cab-action cab-action-primary" aria-pressed=${auto} disabled=${scenes.length<2||!image} onClick=${()=>setAuto(v=>!v)}>${auto&&nextCode?"Pause tour":auto?"Tour finished":"Start auto-tour"}</button></div>
    </div>
    <div className="cab-smart-walk-layout">
      <nav className="cab-walk-map" aria-label="Cabin tour stops"><div className="cab-walk-map-title">CABIN ROUTE <span>${index+1} / ${scenes.length}</span></div><div className="cab-walk-map-list">${scenes.map((s,i)=>html`<button type="button" key=${s._code||i} className="cab-walk-stop" data-active=${s._code===scene._code?"true":"false"} aria-current=${s._code===scene._code?"step":undefined} onClick=${()=>visit(s._code)}><span className="cab-walk-node">${String(i+1).padStart(2,"0")}</span><span><strong>${T(s.short_title||s.shortTitle||s.title)||s._code}</strong>${T(s.summary)?html`<small>${T(s.summary)}</small>`:null}</span></button>`)}</div><p className="cab-walk-map-footer">The route follows the published walkthrough sequence. Views may vary by aircraft configuration.</p></nav>
      <section className="cab-walk-stage" aria-label="Interactive cabin scene"><div className="cab-walk-scene-meta"><div><span>STOP ${String(index+1).padStart(2,"0")}</span><strong>${sceneTitle}</strong></div>${auto&&nextCode&&visible?html`<div className="cab-walk-autoprogress" role="progressbar" aria-label="Time until next cabin view"><i key=${scene._code}/></div>`:null}</div>
        <div className="cab-walk-scene-swap" key=${scene._code} onPointerDown=${()=>setAuto(false)}><${MediaStage} image=${image} alt=${T(scene.title)||"Aircraft cabin walkthrough"} hotspots=${hotspots} active=${hot} setActive=${setHot} fallbackTitle=${sceneTitle} fallbackCopy=${T(scene.summary)||"There is no published image for this stop."} sceneKey=${scene._code}/>${nextCode&&image?html`<button type="button" className="cab-aisle-move" onClick=${()=>visit(nextCode)} aria-label=${`Walk forward to ${T(scenes.find(s=>s._code===nextCode)?.title)||"next cabin stop"}`}><span aria-hidden="true">↑</span><strong>WALK FORWARD</strong></button>`:null}</div>
        <div className="cab-walk-navigation"><button type="button" disabled=${!backCode} onClick=${()=>visit(backCode)} aria-label="Move to previous cabin stop"><span aria-hidden="true">←</span><span><small>WALK BACK</small><strong>${backCode?T((scenes.find(s=>s._code===backCode)?.short_title)||(scenes.find(s=>s._code===backCode)?.title)||"Previous stop"):"Entrance"}</strong></span></button>
        <button type="button" className="cab-walk-next" disabled=${!nextCode} onClick=${()=>visit(nextCode)} aria-label="Move to next cabin stop"><span><small>WALK FORWARD</small><strong>${nextCode?T((scenes.find(s=>s._code===nextCode)?.short_title)||(scenes.find(s=>s._code===nextCode)?.title)||"Next stop"):"End of cabin"}</strong></span><span aria-hidden="true">→</span></button></div>
      </section>
    </div>
  </div>`;
}

function AircraftMap({aircraft,cabins,cabinId,setCabin}){const total=Math.max(1,cabins.reduce((n,c)=>n+Math.max(1,c._seats),0));let y=95;const zones=cabins.map(c=>{const h=Math.max(38,(Math.max(1,c._seats)/total)*245);const z={c,y,h};y+=h;return z});return html`<div className="cab-grid"><div className="cab-card cab-map-card"><h4 className="cab-title">Cabin layout overview</h4><p className="cab-copy">Illustrative nose-to-tail orientation generated from the configured cabin records. It is not an engineering diagram.</p><svg className="cab-map-svg" viewBox="0 0 360 470" role="img" aria-label="Illustrative aircraft cabin orientation"><path d="M180 18c-31 0-53 56-58 126l-7 183c-2 58 26 112 65 125 39-13 67-67 65-125l-7-183C233 74 211 18 180 18Z" fill="#e7eef2" stroke="#9db4c5" stroke-width="2"/><path d="M121 218 30 282l8 22 84-28M239 218l91 64-8 22-84-28" fill="#d9e5eb" stroke="#9db4c5" stroke-width="2"/>${zones.map(({c,y,h})=>html`<g className="cab-zone" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)} onKeyDown=${e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setCabin(c._id)}}} role="button" tabIndex="0" aria-label=${`Select ${c._name}`}><rect x="137" y=${y} width="86" height=${h-3} rx="14" fill=${c._id===cabinId?"#9de0e5":"#f9fbfc"} stroke=${c._id===cabinId?"#5fc7cf":"#bfd0dc"}/><text className="cab-zone-label" x="180" y=${y+h/2}>${c._name}</text></g>`)}</svg><div className="cab-map-note">Cabin-zone length is proportional to configured seat counts. Door, galley, lavatory and wing relationships appear only when configured.</div></div><aside className="cab-card cab-pad"><h4 className="cab-title">Cabins</h4><div className="cab-cabin-list">${cabins.map(c=>html`<button className="cab-cabin-card" data-active=${c._id===cabinId?"true":"false"} onClick=${()=>setCabin(c._id)}><strong>${c._name}</strong><span>${[c._code,c._seats?`${c._seats} seats`:""].filter(Boolean).join(" · ")}</span></button>`)}</div></aside></div>`}
function App({bundle,airline}){
  useMobile();const aircrafts=useMemo(()=>A(bundle?.aircraft).map(normalizeAircraft),[bundle]);const[aircraftId,setAircraftId]=useState(aircrafts[0]?._id||"");const aircraft=aircrafts.find(a=>a._id===aircraftId)||aircrafts[0];const cabins=useMemo(()=>aircraft?normalizeCabins(bundle,aircraft._id):[],[bundle,aircraft?._id]);const[cabinId,setCabinId]=useState(cabins[0]?._id||"");useEffect(()=>setCabinId(cabins[0]?._id||""),[aircraft?._id]);const cabin=cabins.find(c=>c._id===cabinId)||cabins[0];const[mode,setMode]=useState(()=>{const first=aircrafts[0];if(!first)return"overview";if(scenesFor(bundle,first).some(s=>T(raw(s,"image_url","imageUrl"))))return"walk";if(A(bundle?.views).some(v=>T(raw(v,"aircraft_id","aircraftId"))===first._id))return"cabin";return"overview"});const legacy=legacyData(airline),legacyClass=legacyClassFor(legacy,cabin);if(!aircraft)return html`<div className="cab-root"><style>${css}</style><div className="cab-shell"><div className="cab-empty" style=${{margin:"18px"}}><strong>Aircraft information is not currently available.</strong><span>The airline guide remains available above.</span></div></div></div>`;const modes=[["overview","Overview"],["cabin","Cabin Explorer"],["seat","Seat Experience"],["walk","Walkthrough"],["map","Aircraft Map"]];return html`<div className="cab-root"><style>${css}</style><section className="cab-shell"><header className="cab-top"><div className="cab-kicker">SKANDI · Aircraft & Cabin Explorer</div><h3>${T(airline?.name||airline?.title||aircraft.airline_code||"Airline")} · ${aircraft._name}</h3><p>Explore the aircraft and cabin experience. Aircraft substitutions can occur, and seat availability is shown during booking.</p></header><div className="cab-selectors"><div className="cab-aircraft-strip">${aircrafts.map(a=>html`<button className="cab-pill" data-active=${a._id===aircraft._id?"true":"false"} onClick=${()=>transition(()=>setAircraftId(a._id))}>${a._code||"Aircraft"} · ${a._name}</button>`)}</div><div className="cab-mode-strip">${modes.map(([id,label])=>html`<button className="cab-pill" data-active=${mode===id?"true":"false"} onClick=${()=>transition(()=>setMode(id))}>${label}</button>`)}</div>${cabins.length?html`<div className="cab-cabin-strip">${cabins.map(c=>html`<button className="cab-pill cab-cabin" data-active=${c._id===cabin?._id?"true":"false"} onClick=${()=>transition(()=>setCabinId(c._id))}>${c._name}${c._code?` · ${c._code}`:""}</button>`)}</div>`:null}</div><div className="cab-body">${mode==="overview"?html`<${Overview} aircraft=${aircraft} cabins=${cabins} cabinId=${cabinId} setCabin=${setCabinId}/>`:mode==="cabin"?html`<${CabinExplorer} bundle=${bundle} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="seat"?html`<${SeatExperience} aircraft=${aircraft} cabin=${cabin} legacyClass=${legacyClass}/>`:mode==="walk"?html`<${Walkthrough} bundle=${bundle} aircraft=${aircraft}/>`:html`<${AircraftMap} aircraft=${aircraft} cabins=${cabins} cabinId=${cabinId} setCabin=${setCabinId}/>`}</div><footer className="cab-footer"><span>Aircraft and cabin information is provided for travel planning. The operating airline may change aircraft or configuration.</span><button type="button" onClick=${()=>navigate("/flights")}>Explore flights</button></footer></section></div>`
}
function mount(element,bundle,airline){if(!element)return;let root=roots.get(element);if(!root){root=createRoot(element);roots.set(element,root)}root.render(html`<${App} bundle=${bundle||{}} airline=${airline||{}}/>`)}
window.SKANDIOnboardReact={mount,version:"React 19.3 / SKANDI V12"};
window.dispatchEvent(new Event("SKANDI_ONBOARD_REACT_READY"));
const pending=window.__SKANDI_ONBOARD_PENDING__;if(pending){const el=document.getElementById(pending.elementId||"onboardReactRoot");if(el)mount(el,pending.bundle,pending.airline)}
