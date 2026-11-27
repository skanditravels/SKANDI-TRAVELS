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
  initialSectionApplied:false,
  activeLibrary:"faq",
  activeJourneyGroup:"",
  activeDetail:null,
  activeAirlineTab:"before",
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
  detailReturnFocus:null,
  homeScrollY:0,
  overlayMode:"",
  overlayReturnFocus:null,
  requirementsPending:false,
  supportPending:false,
  aircraftBundles:new Map(),
  aircraftPending:new Map(),
  aircraftRequestSerial:0,
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
const human=v=>text(v).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
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
    setStatus(message,true);renderDirectory();announce(message);
  },delay);
}

const LIBRARIES=[
  {key:"airlines",title:"Airline Information",short:"Airlines",icon:"aircraft"},
  {key:"airports",title:"Airport Information",short:"Airports",icon:"pin"},
  {key:"hotels",title:"Hotel Information",short:"Hotels",icon:"hotel"},
  {key:"transfers",title:"Transfer Information",short:"Transfers",icon:"transfer"},
  {key:"tours",title:"Tours",short:"Tours",icon:"tour"},
  {key:"activities",title:"Activities & Excursions",short:"Activities",icon:"activity"},
  {key:"tickets",title:"Tickets & Vouchers",short:"Tickets",icon:"ticket"}
];
function libraryDef(key){return LIBRARIES.find(x=>x.key===key)}
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
function searchKey(value){
  return text(value).normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().replace(/[–—_.-]+/g," ").replace(/\s+/g," ").trim();
}
function contentSearchText(x){
  return searchKey([itemTitle(x),itemCode(x),x?.icaoCode,x?.icao,x?.city,x?.country,x?.summary,x?.subtitle,x?.description,x?.excerpt,x?.body,x?.category,x?.destination,x?.tags,x?.meetingPoint,x?.fromLocation,x?.toLocation].flat().join(" "));
}
function normalizeContentItem(item,library){return {...item,_library:library,_search:contentSearchText(item)}}
function isSpecialAssistanceContent(x){
  const hay=lower([x?.title,x?.name,x?.slug,x?.category,arr(x?.tags).join(" ")].filter(Boolean).join(" "));
  return /(special assistance|accessib|wheelchair|reduced mobility|mobility assistance|medical assistance|medical equipment|service animal|service dog|guide dog|hidden disabil|disabil|oxygen|cpap)/.test(hay);
}
function publicHelpTopics(){return arr(DATA.helpCenter?.topics).filter(x=>!isSpecialAssistanceContent(x))}
function publicArticles(){return arr(DATA.articles).filter(x=>!isSpecialAssistanceContent(x))}

const TRAVEL_TOOLS=[
  {id:"baggage",title:"Baggage allowance",sub:"Compare allowances by airline and fare.",keywords:"bag carry on checked luggage weight suitcase",icon:"bag"},
  {id:"requirements",title:"Passport & entry requirements",sub:"Check passport and entry rules for your journey.",keywords:"visa travel requirements nationality transit immigration documents",icon:"passport"},
  {id:"assistance",title:"Special assistance",sub:"Arrange help with mobility, accessibility or medical needs.",keywords:"accessibility wheelchair oxygen service animal disability",icon:"help"},
  {id:"insurance",title:"Travel insurance",sub:"Read the travel insurance guide.",keywords:"insurance cancellation cover",icon:"ticket"},
  {id:"support",title:"Contact support",sub:"Send an itinerary question to SKANDI Travel Support.",keywords:"contact help booking support",icon:"message"}
];
function buildSearchIndex(){
  const helpers={
    airlines:"airline baggage check in boarding cabin seat food wifi fleet",
    airports:"airport terminal connections check in security lounge transport arrivals departures flight status",
    hotels:"hotel stay check in rooms facilities",
    transfers:"transfer pickup drop off meeting point luggage route",
    tours:"tour guided itinerary meeting pickup",
    activities:"activity excursion attraction entry",
    tickets:"ticket voucher admission entry"
  };
  const index=TRAVEL_TOOLS.map(utility=>({
    kind:"utility",group:"Travel tools",utility,search:searchKey(`${utility.title} ${utility.sub} ${utility.keywords}`)
  }));
  const add=(key,records,group)=>{
    for(const source of records){
      const item=normalizeContentItem(source,key);
      index.push({kind:"content",group,item,search:item._search,categoryWords:helpers[key]||""});
    }
  };
  LIBRARIES.forEach(def=>add(def.key,itemsFor(def.key),def.short));
  add("faq",publicHelpTopics(),"Travel help");
  add("articles",publicArticles(),"Travel help");
  STATE.searchIndex=index;
}

function journeyGroups(){
  const live=arr(DATA.helpCenter?.groups).slice().sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
  return live.filter(group=>text(group.id||group.groupId)&&text(group.title));
}
function renderJourneyFilter(){
  const select=$("tiJourneyFilter");
  const groups=journeyGroups();
  $("tiJourneyFilterWrap").hidden=STATE.activeLibrary!=="faq"||!groups.length;
  select.innerHTML='<option value="">All stages</option>'+groups.map(group=>{
    const id=text(group.id||group.groupId);
    return `<option value="${esc(id)}">${esc(group.title)}</option>`;
  }).join("");
  if(!groups.some(group=>text(group.id||group.groupId)===STATE.activeJourneyGroup))STATE.activeJourneyGroup="";
  select.value=STATE.activeJourneyGroup;
}
function filterDefinitions(){
  return [{key:"faq",title:"Travel help"},...LIBRARIES.map(d=>({key:d.key,title:d.short}))];
}
function setLibrary(key,scroll=false){
  if(!filterDefinitions().some(item=>item.key===key))return;
  const changed=STATE.activeLibrary!==key;
  STATE.activeLibrary=key;
  if(changed){STATE.activeJourneyGroup="";STATE.visibleCount=PAGE_SIZE}
  $("tiDirectoryHeading").textContent=key==="faq"?"Travel help":libraryDef(key).title;
  $("tiFilterTabs").querySelectorAll("[data-filter]").forEach(btn=>btn.setAttribute("aria-pressed",btn.dataset.filter===key?"true":"false"));
  renderJourneyFilter();
  renderDirectory();
  if(scroll){
    $("tiDirectoryHeading").focus({preventScroll:true});
    $("tiDirectory").scrollIntoView({behavior:movement(),block:"start"});
  }
}
function renderFilters(){
  $("tiFilterTabs").innerHTML=filterDefinitions().map(d=>`<button type="button" data-filter="${d.key}" aria-controls="tiDirectoryList" aria-pressed="${STATE.activeLibrary===d.key}">${esc(d.title)}</button>`).join("");
}
function directoryRows(){
  if(STATE.activeLibrary!=="faq"){
    return itemsFor(STATE.activeLibrary).map(item=>normalizeContentItem(item,STATE.activeLibrary))
      .sort((a,b)=>itemTitle(a).localeCompare(itemTitle(b)));
  }
  const stage=STATE.activeJourneyGroup;
  const byStage=item=>!stage||text(item.groupId||item.group_id)===stage;
  const topics=publicHelpTopics().filter(byStage).map(item=>normalizeContentItem(item,"faq"));
  const articles=publicArticles().filter(byStage).map(item=>normalizeContentItem(item,"articles"));
  return [...topics,...articles].sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))||
    (Number(a.sortOrder)||100)-(Number(b.sortOrder)||100)||itemTitle(a).localeCompare(itemTitle(b)));
}
function directoryMeta(item){
  const code=["airlines","airports"].includes(item._library)?itemCode(item):"";
  return uniq([code,item.city,item.country].map(text).filter(Boolean)).join(" · ");
}
function renderDirectory(){
  const rows=directoryRows(),visible=rows.slice(0,STATE.visibleCount),remaining=rows.length-visible.length;
  const host=$("tiDirectoryList");
  $("tiResultCount").textContent=rows.length?`${rows.length} ${rows.length===1?"guide":"guides"}`:"";
  $("tiLoadMoreWrap").hidden=!remaining;
  if(!rows.length){
    const guidance=STATE.dataState==="loading"?"Loading guides…":STATE.dataState==="error"?"Guides could not be loaded. Use Try again above.":STATE.activeJourneyGroup?"No guides are available for this stage. Select All stages to browse every topic.":"No guides are available in this category.";
    host.innerHTML=`<p class="ti-guide-empty">${esc(guidance)}</p>`;
    return;
  }
  host.innerHTML=visible.map((item,i)=>{
    const isLogo=["airlines","airports"].includes(item._library);
    const url=isLogo?itemLogoUrl(item):itemHeroUrl(item);
    const definition=libraryDef(item._library);
    const meta=directoryMeta(item);
    const subtitle=item._library==="faq"||item._library==="articles"?text(item.subtitle||item.excerpt):"";
    return `<button class="ti-guide-result" type="button" data-directory-index="${i}" aria-label="Open ${esc(itemTitle(item))}"><span class="ti-guide-result-media${url&&isLogo?" is-logo":""}" aria-hidden="true">${url?`<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:icon(definition?.icon||"help")}</span><span class="ti-guide-result-title"><strong>${esc(itemTitle(item))}</strong>${meta||subtitle?`<small>${esc((meta||subtitle).slice(0,180))}</small>`:""}</span><span aria-hidden="true">${icon("chevron")}</span></button>`;
  }).join("");
  host.querySelectorAll("[data-directory-index]").forEach(button=>button.addEventListener("click",()=>openDetail(visible[Number(button.dataset.directoryIndex)],button)));
  if(remaining)$("tiLoadMore").textContent=`Show ${Math.min(PAGE_SIZE,remaining)} more`;
}

function buildSearchResults(query){
  const term=searchKey(query);
  if(!term)return STATE.searchIndex.filter(entry=>entry.kind==="utility"||entry.item?.featured).slice(0,12);
  const words=term.split(" ");
  const containsWords=value=>words.every(word=>value.includes(word));
  return STATE.searchIndex.flatMap(entry=>{
    const title=searchKey(entry.kind==="utility"?entry.utility.title:itemTitle(entry.item));
    const code=entry.item?[itemCode(entry.item),entry.item.icao,entry.item.icaoCode].map(searchKey):[];
    if(code.includes(term))return [{...entry,score:160}];
    if(title===term)return [{...entry,score:140}];
    if(title.includes(term))return [{...entry,score:title.startsWith(term)?115:100}];
    if(containsWords(title))return [{...entry,score:90}];
    if(containsWords(entry.search))return [{...entry,score:entry.search.includes(term)?70:55}];
    const identity=searchKey([title,...code,entry.item?.city].filter(Boolean).join(" "));
    const relevant=words.length>1&&words.some(word=>word.length>=3&&identity.includes(word))&&containsWords(`${entry.search} ${entry.categoryWords||""}`);
    return relevant?[{...entry,score:35}]:[];
  }).sort((a,b)=>b.score-a.score).slice(0,28);
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
  $("tiSearchResults").innerHTML=groups.map(g=>`<div class="ti-search-group"><div class="ti-search-group-title">${esc(g.name)}</div>${g.items.map(({entry,index})=>{const title=entry.kind==="utility"?entry.utility.title:itemTitle(entry.item);const sub=entry.kind==="utility"?entry.utility.sub:[itemCode(entry.item),entry.item.city,entry.item.country,itemSummary(entry.item)].filter(Boolean).join(" · ").slice(0,150);return`<button class="ti-search-item" type="button" data-search-index="${index}" data-active="${index===STATE.searchCursor?"true":"false"}">${searchIconMarkup(entry)}<span class="ti-search-copy"><strong>${esc(title)}</strong><span>${esc(sub)}</span></span><span class="ti-search-type">${esc(entry.kind==="utility"?"Tool":libraryLabel(entry.item._library))}</span></button>`}).join("")}</div>`).join("");
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
function openDetail(x,trigger=document.activeElement){
  if(!x)return;
  saveHomeContext();
  STATE.detailReturnFocus=trigger;
  STATE.activeDetail=x;
  STATE.activeAirlineTab=x._library==="airlines"?"before":"";
  STATE.activeAirportTab=x._library==="airports"?"overview":"";
  STATE.activeAirportBoardType="departures";
  STATE.airportShowEarlier=false;
  $("tiHome").style.display="none";
  $("tiDetail").dataset.active="true";
  renderDetail(x);
  $("tiBack").focus({preventScroll:true});
  post("MASTER_SCROLL_TOP",{reason:"travel-info-detail-open"});
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
  STATE.activeAirlineTab="before";
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
  window.SKANDIOnboardReact?.unmount($("onboardReactRoot"));
  mount.replaceChildren();
  announce("Back to Travel Info");
  const target=STATE.detailReturnFocus?.isConnected?STATE.detailReturnFocus:$("tiDirectoryHeading");
  target?.focus({preventScroll:true});
  STATE.detailReturnFocus=null;
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:restoreY,behavior:"auto"})))
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
function toGuideSection(id,title,value,fallback,bullets=[]){
  const parsed=parseStructuredValue(value);
  const named=typeof parsed==="object"&&!Array.isArray(parsed)?obj(parsed):{};
  const raw=named.body??named.description??(Object.keys(named).some(k=>!["title","bullets"].includes(k))?parsed:undefined);
  const scalar=typeof parsed==="string"||typeof parsed==="boolean"||typeof parsed==="number"||Array.isArray(parsed)?parsed:undefined;
  const body=raw??(scalar===""?undefined:scalar)??fallback;
  return sectionData(title,body,named.bullets||bullets,id);
}

function factsHtml(rows){
  const facts=rows.map(([label,value])=>[label,formatTextValue(value)]).filter(([,value])=>value);
  if(!facts.length)return "";
  return `<dl class="ti-guide-facts">${facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
}
function guideCard(title,body){
  return body?`<section class="ti-guide-card"><h2>${esc(title)}</h2>${body}</section>`:"";
}
function guideDisclosure(title,body){
  return body?`<details class="ti-guide-fold"><summary>${esc(title)}</summary><div class="ti-guide-fold-body">${body}</div></details>`:"";
}
function guideSectionHtml(sec,open=false){
  if(!sec)return "";
  const body=guideBodyHtml(sec.raw)+
    (sec.bullets?.length?`<ul class="ti-guide-list">${sec.bullets.map(bullet=>`<li>${esc(bullet)}</li>`).join("")}</ul>`:"");
  return open?guideCard(sec.title,body):guideDisclosure(sec.title,body);
}
function guideBodyHtml(value){
  const parsed=parseStructuredValue(value);
  if(parsed===null||parsed===undefined||parsed==="")return "";
  if(Array.isArray(parsed)){
    if(!parsed.length)return "";
    if(parsed.every(entry=>typeof entry!=="object")){
      return `<ul class="ti-guide-list">${parsed.map(entry=>`<li>${esc(formatTextValue(entry))}</li>`).join("")}</ul>`;
    }
    const entries=parsed.map(entry=>typeof entry==="object"?guideEntryHtml(entry):`<p class="ti-guide-copy">${esc(formatTextValue(entry))}</p>`);
    return `<div class="ti-guide-entries">${entries.join("")}</div>`;
  }
  if(typeof parsed==="object")return guideEntryHtml(parsed);
  return `<p class="ti-guide-copy">${esc(formatTextValue(parsed))}</p>`;
}
function guideEntryHtml(entry){
  const value=obj(entry);
  const title=formatTextValue(value.name||value.title||value.label||(value.terminal?"Terminal "+value.terminal:"")||value.mode||value.type);
  const body=formatTextValue(value.description||value.summary||value.notes||value.body||value.text||value.information);
  const link=safeExternal(value.url||value.website||value.contactUrl);
  const excluded=new Set(["id","uuid","code","source","sourceUrl","sourceReference","source_reference","payload","name","title","label","mode","type","description","summary","notes","body","text","information","url","website","contactUrl"]);
  if(!value.name&&!value.title&&!value.label)excluded.add("terminal");
  const rows=Object.entries(value).filter(([key])=>!excluded.has(key)&&!/(^internal|^private|^supplierCost|^ops|password|secret|token)/i.test(key))
    .map(([key,detail])=>[key==="value"&&title?"Details":key.includes(" ")?key:human(key),detail]);
  if(!title&&!body&&!link&&!rows.length)return "";
  return `<div class="ti-guide-entry">${title?`<strong>${esc(title)}</strong>`:""}${body&&body!==title?`<p class="ti-guide-copy">${esc(body)}</p>`:""}${factsHtml(rows)}${link?`<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(title?`Visit ${title} website`:"Visit website")} ${icon("external")}</a>`:""}</div>`;
}
function guideHeaderHtml(x,{subtitle="",image=itemHeroUrl(x),logo="",showGuide=false}={}){
  const website=safeExternal(x.website),contact=safeExternal(x.contactUrl);
  const path=[x.path,x.actionTarget,x.pageUrl].map(text).find(safeInternal);
  const links=[
    website?`<a href="${esc(website)}" target="_blank" rel="noopener noreferrer">Official website ${icon("external")}</a>`:"",
    contact&&contact!==website?`<a href="${esc(contact)}" target="_blank" rel="noopener noreferrer">Contact information ${icon("external")}</a>`:"",
    path?`<button type="button" data-detail-path="${esc(path)}">${showGuide?"View hotel":"Open full guide"} ${icon("arrow")}</button>`:""
  ].filter(Boolean).join("");
  return `<header class="ti-guide-header${image?" has-image":""}">
    <div class="ti-guide-header-copy">${logo?`<img class="ti-guide-logo" src="${esc(logo)}" alt="" referrerpolicy="no-referrer">`:""}
      <div><h1>${esc(itemTitle(x))}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:""}</div>
      ${links?`<div class="ti-guide-links">${links}</div>`:""}
    </div>
    ${image?`<img class="ti-guide-header-image" src="${esc(image)}" alt="" referrerpolicy="no-referrer">`:""}
  </header>`;
}
function guideSupportHtml(){
  return `<div class="ti-guide-detail-help">
    <button type="button" data-detail-action="assistance">Special assistance</button>
    <button type="button" data-detail-action="alexandra">Ask Alexandra</button>
    <button type="button" data-detail-action="support">Contact support</button>
  </div>`;
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
  if(STATE.airportContextRequest)STATE.airportContextPending.delete(STATE.airportContextRequest.iata);
  STATE.airportContextPending.add(key);const requestId=`airport-context-${++STATE.airportRequestSerial}-${Date.now()}`;STATE.airportContextRequest={requestId,iata};
  post("TRAVEL_INFO_AIRPORT_CONTEXT_REQUEST",{iata,boardType:"departures",requestId});
}
function tiAirportRequestFlights(x,boardType="departures",force=false){
  const iata=tiAirportIata(x);if(!iata)return;const type=boardType==="arrivals"?"arrivals":"departures";const key=tiAirportCacheKey(iata,type);
  if(!force&&STATE.airportFlights.has(key))return tiRenderAirportFlights();
  if(STATE.airportFlightPending.has(key))return;
  if(STATE.airportFlightRequest)STATE.airportFlightPending.delete(STATE.airportFlightRequest.key);
  STATE.airportFlightPending.add(key);const requestId=`airport-flights-${++STATE.airportFlightRequestSerial}-${Date.now()}`;STATE.airportFlightRequest={requestId,iata,boardType:type,key};
  const host=$("tiAirportFlightRows");if(host)host.innerHTML=`<div class="board-message"><span class="board-message-title">LOADING FLIGHTS</span><span class="board-message-note">Retrieving ${esc(type)} for ${esc(iata)}</span></div>`;
  post("TRAVEL_INFO_AIRPORT_FLIGHTS_REQUEST",{iata,boardType:type,requestId});
}
function tiAirportList(value){
  const parsed=parseStructuredValue(value);
  return Array.isArray(parsed)?parsed:(parsed&&typeof parsed==="object"?[parsed]:[]);
}
function tiAirportContext(x){return STATE.airportContexts.get(tiAirportIata(x))||null}
function tiAirportResolved(x){
  const fallback=obj(tiAirportContext(x)?.airport);
  const resolved={...x};
  for(const [key,value] of Object.entries(fallback)){
    if(!formatTextValue(resolved[key])&&formatTextValue(value))resolved[key]=value;
  }
  return resolved;
}
function airportRelatedHtml(x,a){
  const commerce=obj(tiAirportContext(x)?.commerce);
  const groups=[
    ["Airport transfers","TRANSFER",arr(commerce.transferOffers)],
    ["Nearby hotels","HOTEL",arr(commerce.hotels)],
    ["Tours & activities","EXPERIENCE",arr(commerce.tours)],
    ["Explore the destination","DESTINATION",[...arr(commerce.destinations),...tiAirportList(a.destinationAds)]]
  ];
  return groups.map(([name,kind,items])=>{
    const seen=new Set();
    const links=items.flatMap(item=>{
      const title=formatTextValue(item?.title||item?.name),id=text(item?.publicId||item?.id||item?.slug||title);
      const key=searchKey(title);
      if(!title||seen.has(key))return [];
      seen.add(key);
      return [`<li><button type="button" data-ti-airport-kind="${kind}" data-ti-airport-id="${esc(id)}">${esc(title)} ${icon("arrow")}</button></li>`];
    });
    return guideDisclosure(name,links.length?`<ul class="ti-guide-related">${links.join("")}</ul>`:"");
  }).join("");
}
function airportGuideTabs(x,a){
  const s=obj(a.sections);
  const section=(id,title,value,fallback,open=false)=>guideSectionHtml(toGuideSection(id,title,value,fallback),open);
  const overview=[
    section("terminals","Terminals",a.terminals,undefined,true),
    section("checkin","Check-in",s.checkin,a.checkIn),
    section("security","Security",s.security,a.security),
    section("connections","Connecting flights",s.transfer,a.transfer),
    section("departure","Departures",s.departure,a.departure),
    section("arrival","Arrivals",s.arrival,a.arrival)
  ].join("");
  const distance=num(a.distanceToCityCenterKm)>0?factsHtml([["Distance from city center",`${a.distanceToCityCenterKm} km`]]):"";
  const transportation=[
    guideCard("Airport transport",distance+guideBodyHtml(a.transport)),
    section("getting-there","Getting to and from the airport",s.transport,a.transportInfo),
    section("parking","Parking",s.parking,a.parkingInfo),
    airportRelatedHtml(x,a)
  ].join("");
  const services=[
    section("lounges","Lounges",a.lounges),
    section("food","Food & drink",a.foodDrinks),
    section("hotels","Airport hotels",a.airportHotels,a.airportHotel),
    section("wifi","Wi-Fi",s.wifi,a.wifi),
    section("lost","Lost & found",a.lostFound),
    section("destinations","Destinations served",a.destinationsServing)
  ].join("");
  const fallback=guideBodyHtml(a.information||a.body||a.summary);
  return [
    {id:"overview",label:"Terminals & check-in",content:(overview?overview+guideDisclosure("About this airport",fallback):guideCard("Airport overview",fallback))||'<p class="ti-guide-empty">Terminal and check-in details are currently unavailable.</p>'},
    {id:"transport",label:"Getting there",content:transportation},
    {id:"services",label:"Airport services",content:services},
    {id:"flight-info",label:"Flight Info",content:tiAirportFlightPanelHtml(x)}
  ].filter(tab=>tab.content);
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
    const pending=STATE.airportFlightPending.has(key);
    host.innerHTML=`<div class="board-message"><span class="board-message-title">${pending?"LOADING FLIGHTS":"FLIGHT INFORMATION"}</span><span class="board-message-note">${pending?"Retrieving":"Open this tab to load"} ${esc(type)} for ${esc(iata)}.</span></div>`;
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
  if(id==="flight-info"){tiAirportRequestFlights(x,STATE.activeAirportBoardType||"departures");requestAnimationFrame(tiRenderAirportFlights)}if(scroll)root.querySelector(".ti-guide-tabs")?.scrollIntoView({behavior:movement(),block:"start"})
}
function tiBindAirportDetail(x){
  const root=$("tiDetailMount");if(!root)return;
  const tabs=[...root.querySelectorAll("[data-airport-tab]")];
  for(const [index,button] of tabs.entries()){
    button.addEventListener("click",()=>tiActivateAirportTab(button.dataset.airportTab,x,true));
    button.addEventListener("keydown",event=>{
      const keys={Home:0,End:tabs.length-1,ArrowLeft:(index-1+tabs.length)%tabs.length,ArrowRight:(index+1)%tabs.length};
      if(!(event.key in keys))return;
      event.preventDefault();
      const target=tabs[keys[event.key]];
      target.focus();
      tiActivateAirportTab(target.dataset.airportTab,x,false);
    });
  }
  root.querySelectorAll("[data-ti-board-type]").forEach(btn=>{
    const type=btn.dataset.tiBoardType;
    btn.setAttribute("aria-pressed",type===STATE.activeAirportBoardType?"true":"false");
    btn.addEventListener("click",()=>{
      if(type===STATE.activeAirportBoardType)return;
      STATE.activeAirportBoardType=type;
      STATE.airportShowEarlier=false;
      renderAirportDetail(x);
      root.querySelector(`[data-ti-board-type="${type}"]`)?.focus({preventScroll:true});
    });
  });
  root.querySelector("[data-ti-earlier-flights]")?.addEventListener("click",()=>{STATE.airportShowEarlier=!STATE.airportShowEarlier;tiRenderAirportFlights()});
  root.querySelectorAll("[data-ti-airport-kind]").forEach(btn=>btn.addEventListener("click",()=>{const kind=btn.dataset.tiAirportKind,id=btn.dataset.tiAirportId,ctx=tiAirportContext(x),all=[...arr(ctx?.commerce?.transferOffers),...arr(ctx?.commerce?.hotels),...arr(ctx?.commerce?.tours),...arr(ctx?.commerce?.destinations),...tiAirportList(tiAirportResolved(x).destinationAds)];const item=all.find(i=>text(i?.publicId||i?.id||i?.slug||i?.title||i?.name)===id)||{};post("TRAVEL_INFO_AIRPORT_ACTION",{kind,item,airportIata:tiAirportIata(x)})}));
}
function renderAirportDetail(x){
  tiAirportRequestContext(x);
  const mount=$("tiDetailMount"),iata=tiAirportIata(x);
  const sameAirport=mount.firstElementChild?.dataset.airportCode===iata;
  const focusedTab=sameAirport?document.activeElement?.dataset.airportTab:"";
  const openSections=new Set(sameAirport?[...mount.querySelectorAll(".ti-guide-fold[open] summary")].map(summary=>summary.textContent):[]);
  const a=tiAirportResolved(x),tabs=airportGuideTabs(x,a);
  const active=tabs.some(tab=>tab.id===STATE.activeAirportTab)?STATE.activeAirportTab:"overview";
  STATE.activeAirportTab=active;
  mount.innerHTML=`
    <div class="ti-guide ti-airport-experience ti-airport-guide" data-airport-code="${esc(iata)}">
      ${guideHeaderHtml(a,{subtitle:uniq([tiAirportIata(a),a.city,a.country].map(text).filter(Boolean)).join(" · "),logo:itemLogoUrl(a)})}
      <nav class="ti-guide-filter ti-guide-tabs" role="tablist" aria-label="${esc(itemTitle(a))} airport information">
        ${tabs.map(tab=>`<button id="tiAirportTab-${tab.id}" type="button" role="tab" data-airport-tab="${tab.id}" aria-controls="tiAirportPanel-${tab.id}" aria-selected="${tab.id===active}" tabindex="${tab.id===active?0:-1}">${esc(tab.label)}</button>`).join("")}
      </nav>
      ${tabs.map(tab=>`<div id="tiAirportPanel-${tab.id}" data-airport-panel="${tab.id}" class="ti-guide-stack" role="tabpanel" aria-labelledby="tiAirportTab-${tab.id}"${tab.id===active?"":" hidden"}>${tab.content}</div>`).join("")}
      ${guideSupportHtml()}
    </div>`;
  tiBindAirportDetail(x);
  bindDetailInteractions(x);
  mount.querySelectorAll(".ti-guide-fold > summary").forEach(summary=>{
    if(openSections.has(summary.textContent))summary.parentElement.open=true;
  });
  if(focusedTab)$("tiAirportTab-"+focusedTab)?.focus({preventScroll:true});
  if(active==="flight-info"){
    tiAirportRequestFlights(x,STATE.activeAirportBoardType||"departures");
    requestAnimationFrame(tiRenderAirportFlights);
  }
}

function airlineText(value){
  const data=parseStructuredValue(value);
  if(typeof data==="string")return data;
  return formatTextValue(data?.description||data?.body||data?.notes||data?.text||data?.summary||data?.information||data?.details||data?.value||"");
}
function airlineDisclosure(title,value,render=airlineText){
  const data=parseStructuredValue(value);
  const rows=(Array.isArray(data)?data:[data]).map(item=>{
    const title=typeof item==="object"?formatTextValue(item?.name||item?.label||item?.title||item?.cabin||item?.cabinType):"";
    const body=render(item);
    const context=typeof item==="object"?formatTextValue(item?.service||item?.route):"";
    return {title,context,body};
  }).filter(row=>row.body);
  if(!rows.length)return "";
  return `<details class="ti-airline-disclosure"><summary>${esc(title)}</summary>${rows.map(row=>`<div>${row.title?`<h3>${esc(row.title)}</h3>`:""}${row.context?`<small>${esc(row.context)}</small>`:""}<p>${esc(row.body)}</p></div>`).join("")}</details>`;
}
function airlineCheckIn(value){
  const data=parseStructuredValue(value);
  const raw=Array.isArray(data)?data:[data];
  const rows=raw.flatMap(item=>{
    if(typeof item==="string")return item.split(/\n+/).map(line=>{
      const [route,...rest]=line.split(/\s+[—–]\s+/);
      return {title:rest.length?route:"",body:(rest.join(" — ")||route).trim().replace(/^check-in and bag drop close\s+/i,"")};
    });
    const description=airlineText(item);
    if(description)return [{title:formatTextValue(item?.route||item?.name||item?.title||item?.label),body:description}];
    return Object.entries(obj(item)).map(([route,v])=>({title:human(route),body:formatTextValue(v)}));
  }).filter(row=>row.body);
  if(!rows.length)return "";
  return `<section class="ti-airline-card"><h2>Check-in &amp; bag drop</h2><ul class="ti-airline-deadlines">${rows.map(row=>`<li>${row.title?`<strong>${esc(row.title)}</strong>`:""}<span>${esc(row.body)}</span></li>`).join("")}</ul></section>`;
}
function airlineBaggage(x){
  const fares=tiBagEntries(x).filter(f=>f.underSeatBag||f.overheadCarryOn||f.checkedBag||f.description);
  const narrative=text(x.baggage?.text||x.baggageAllowance);
  const pick=fares.length>1?`<label class="ti-airline-fare-label" for="tiAirlineFare">Fare</label><select id="tiAirlineFare">${fares.map((fare,index)=>`<option value="${index}">${esc([fare.cabin,fare.name].filter(Boolean).join(" · ")||"Fare details")}</option>`).join("")}</select>`:"";
  const results=fares.map((fare,index)=>{
    const bags=[["Under-seat bag",fare.underSeatBag],["Cabin bag",fare.overheadCarryOn],["Checked bag",fare.checkedBag]].filter(([,v])=>v);
    return `<div data-airline-fare="${index}"${index?" hidden":""}><dl class="ti-airline-bags">${bags.map(([l,v])=>`<div><dt>${l}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>${fare.description?`<p>${esc(fare.description)}</p>`:""}</div>`;
  }).join("");
  return `<section class="ti-airline-card"><h2>Baggage</h2>${pick}${fares.length?results:narrative?`<p>${esc(narrative)}</p>`:"<p>Check your ticket or the airline’s website for your allowance.</p>"}${fares.length||narrative?'<p class="ti-airline-muted">Check your allowance in your booking. It can vary by route and fare.</p>':""}</section>`;
}
function airlineCabins(value){
  const data=parseStructuredValue(value);
  if(!Array.isArray(data))return airlineText(data)?`<p>${esc(airlineText(data))}</p>`:"";
  const names=[...new Set(data.map(c=>typeof c==="string"?c:formatTextValue(c?.name||c?.cabinName||c?.label||c?.cabinType||c?.travelClass||c?.title)).filter(Boolean))];
  return names.length?`<ul class="ti-airline-cabins">${names.map(name=>`<li>${esc(name)}</li>`).join("")}</ul>`:"";
}
function airlineLounges(value){
  const data=parseStructuredValue(value);
  const airports=arr(data?.hubs_and_premium_lounges);
  const entries=airports.flatMap(airport=>arr(airport.lounges).map(lounge=>({
    name:[lounge.name||lounge.title||lounge.lounge_name,airport.airport_code].filter(Boolean).join(" · "),
    description:lounge.location||lounge.description
  })));
  return airlineDisclosure("Airport lounges",entries.length?entries:data);
}
function renderAirlineDetail(x){
  const name=itemTitle(x),code=itemCode(x),logo=itemLogoUrl(x);
  const sections=obj(x.sections);
  const checkIn=airlineCheckIn(sections.checkin?.body||x.checkInDeadline);
  const before=`<div class="ti-airline-before">${airlineBaggage(x)}${checkIn}</div>${airlineDisclosure("Boarding",sections.boarding?.body||x.boarding)}${airlineLounges(x.lounges)}${airlineDisclosure("Travel with children",x.childrenInfants)}`;
  const cabinList=airlineCabins(sections.cabins?.body||x.cabins);
  const inFlight=`${cabinList?`<section class="ti-airline-card"><h2>Cabin classes</h2>${cabinList}</section>`:""}${airlineDisclosure("Meals & drinks",sections.food?.body||x.mealInfo)}${airlineDisclosure("Wi-Fi",sections.wifi?.body||x.wifiInfo)}${airlineDisclosure("Fare types",x.ticketTypes)}`;
  const fleet=[...new Set(arr(parseStructuredValue(x.fleetSummary)).map(a=>formatTextValue(a?.aircraft||a?.aircraftName||a?.name||a?.title||(typeof a==="string"?a:""))).filter(Boolean))];
  const aircraft=`<section id="tiSec-aircraft" class="ti-airline-aircraft" aria-label="Aircraft walkaround"><div id="onboardReactRoot" class="ti-aircraft-host"></div></section>${fleet.length?`<details class="ti-airline-disclosure"><summary>Fleet list</summary><ul class="ti-airline-cabins">${fleet.map(model=>`<li>${esc(model)}</li>`).join("")}</ul></details>`:""}`;
  const tabs=[{id:"before",label:"Baggage & check-in",content:before},{id:"onboard",label:"On board",content:inFlight},{id:"aircraft",label:"Walkaround",content:aircraft}].filter(tab=>tab.content);
  const active=tabs.some(tab=>tab.id===STATE.activeAirlineTab)?STATE.activeAirlineTab:"before";
  const links=[["Airline website",x.website],["Contact airline",x.contactUrl],[x.loyaltyProgram||"Loyalty program",x.loyaltyProgramUrl]];
  const seen=new Set();
  $("tiDetailMount").innerHTML=`<div class="ti-airline-guide">
    <header class="ti-airline-header">
      ${logo?`<img class="ti-airline-logo" src="${esc(logo)}" alt="" referrerpolicy="no-referrer">`:""}
      <div><h1>${esc(name)}</h1>${code?`<span class="ti-airline-code">${esc(code)}</span>`:""}</div>
      <div class="ti-airline-links">${links.map(([label,url])=>{const href=safeExternal(url);if(!href||seen.has(href))return "";seen.add(href);return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon("external")}</a>`}).join("")}</div>
    </header>
    <div class="ti-section-nav-wrap"><nav class="ti-section-nav" data-mode="airline-tabs" role="tablist" aria-label="${esc(name)} travel information">${tabs.map(tab=>`<button id="tiAirlineTab-${tab.id}" class="ti-section-link" type="button" role="tab" data-airline-tab="${tab.id}" aria-controls="tiAirlinePanel-${tab.id}" aria-selected="${tab.id===active}" tabindex="${tab.id===active?0:-1}">${esc(tab.label)}</button>`).join("")}</nav></div>
    ${tabs.map(tab=>`<div id="tiAirlinePanel-${tab.id}" class="ti-airline-panel" data-airline-panel="${tab.id}" role="tabpanel" aria-labelledby="tiAirlineTab-${tab.id}"${tab.id===active?"":" hidden"}>${tab.content}</div>`).join("")}
  </div>`;
  $("tiAirlineFare")?.addEventListener("change",event=>{
    $("tiDetailMount").querySelectorAll("[data-airline-fare]").forEach(row=>{row.hidden=row.dataset.airlineFare!==event.target.value});
  });
  bindDetailInteractions(x);
  activateAirlineTab(active,x,false);
}
const PRODUCT_TOPICS={
  hotels:{primary:"Stay details",sections:[
    ["rooms","Room types"],["facilities","Facilities"],["board","Meals & board"],["policies","Hotel policies"],["facts","Property facts"],["included","Included"],["notincluded","Not included"],["important","Before you arrive"],["highlights","Highlights"]
  ]},
  transfers:{primary:"Pickup & drop-off",sections:[
    ["transferdetails","Vehicle & journey details"],["important","Before pickup"],["included","Included"],["notincluded","Not included"],["highlights","Highlights"]
  ]},
  tours:{primary:"When & where",sections:[
    ["itinerary","Itinerary"],["practical","Before you go"],["included","Included"],["notincluded","Not included"],["important","Important information"],["highlights","Highlights"]
  ]},
  activities:{primary:"When & where",sections:[
    ["practical","Before you go"],["included","Included"],["notincluded","Not included"],["important","Important information"],["highlights","Highlights"]
  ]},
  tickets:{primary:"Venue & entry",sections:[
    ["practical","Restrictions & access"],["important","Ticket & voucher information"],["included","Included"],["notincluded","Not included"],["highlights","Highlights"]
  ]}
};
function renderOtherGuide(x){
  const kind=x._library;
  const layout=PRODUCT_TOPICS[kind];
  const fields=Object.entries(obj(parseStructuredValue(x.sections)));
  const known=new Map(fields.filter(([id])=>id).map(([id,value])=>[lower(id).replace(/[^a-z0-9]/g,""),value]));
  const body=x.body||x.description||x.information||x.summary||x.excerpt;
  const introduction=guideBodyHtml(body);
  const facts=[];
  const consumeFacts=(section,choose)=>{
    const value=obj(parseStructuredValue(known.get(section)));
    const map=obj(parseStructuredValue(value.body));
    const left={};
    for(const [key,value] of Object.entries(map)){
      if(choose.includes(key))facts.push([key,value]);
      else left[key]=value;
    }
    if(Object.keys(map).length)known.set(section,{...value,body:left});
  };
  if(kind==="hotels"){
    facts.push(["Address",x.address],["Official star rating",num(x.starRating)>0?`${x.starRating} stars`:""]);
    consumeFacts("policies",["Check-in","Check-out"]);
  }else if(kind==="transfers"){
    facts.push(["Pickup",x.fromLocation],["Drop-off",x.toLocation]);
    consumeFacts("transferdetails",["Meeting point","Meeting instructions","Terminal","Arrival hall","Airport exit","Waiting area"]);
    if(!facts.some(([label,value])=>label==="Meeting point"&&value))facts.push(["Meeting point",x.meetingPoint]);
    const transfer=obj(parseStructuredValue(known.get("transferdetails")));
    const stored=obj(parseStructuredValue(transfer.body));
    const {
      "Minimum journey time (minutes)":minimum,
      "Maximum journey time (minutes)":maximum,
      "Published minimum minutes":legacyMin,
      "Published maximum minutes":legacyMax,
      ...extra
    }=stored;
    const min=num(minimum??legacyMin),max=num(maximum??legacyMax);
    const duration=min>0&&max>min?`${min}–${max} min`:min>0?`${min} min`:max>0?`Up to ${max} min`:"";
    facts.push(["Estimated journey time",x.durationText||duration]);
    if(Object.keys(stored).length)known.set("transferdetails",{...transfer,body:extra});
  }else if(layout){
    facts.push(["Meeting point",x.meetingPoint],["Duration",x.durationText]);
    consumeFacts("practical",["Venue","Start location","Languages"]);
    const practical=obj(parseStructuredValue(known.get("practical")));
    const practicalBody=obj(parseStructuredValue(practical.body));
    if(Object.keys(practicalBody).length){
      const {"Meeting point":meeting,Duration:duration,"Duration minutes":minutes,...rest}=practicalBody;
      if(!x.meetingPoint&&meeting)facts.push(["Meeting point",meeting]);
      if(!x.durationText&&(duration||minutes))facts.push(["Duration",duration||`${minutes} min`]);
      known.set("practical",{...practical,body:rest});
    }
  }
  const sections=[];
  for(const [key,title] of layout?.sections||[]){
    const value=known.get(key);
    sections.push(toGuideSection(key,title,value));
    known.delete(key);
  }
  for(const [id,value] of known){
    const title=formatTextValue(obj(value).title)||human(id);
    if(!isSpecialAssistanceContent({title,category:id}))sections.push(toGuideSection(id,title,value));
  }
  const quick=factsHtml(facts);
  const intro=introduction||x.bullets?.length?guideCard(layout?(quick?"About":"Guide"):"Answer",introduction+guideBodyHtml(normalizeBullets(x.bullets))):"";
  const remaining=sections.map(section=>guideSectionHtml(section)).join("");
  const content=(layout?guideCard(layout.primary,quick):"")+intro+remaining;
  $("tiDetailMount").innerHTML=`<div class="ti-guide">
    ${guideHeaderHtml(x,{subtitle:uniq([x.city,x.country].map(text).filter(Boolean)).join(" · "),showGuide:kind==="hotels"})}
    <div class="ti-guide-stack">${content||'<p class="ti-guide-empty">There are no published details for this guide. Contact SKANDI for help with your booking.</p>'}</div>
    ${guideSupportHtml()}
  </div>`;
  bindDetailInteractions(x);
}

function renderDetail(x){
  window.SKANDIOnboardReact?.unmount($("onboardReactRoot"));
  if(x?._library==="airports"){renderAirportDetail(x);return;}
  if(x?._library==="airlines"){renderAirlineDetail(x);return;}
  renderOtherGuide(x);
}

function bindDetailInteractions(x){
  const root=$("tiDetailMount");if(!root)return;
  root.querySelectorAll("[data-airline-tab]").forEach(btn=>{
    btn.addEventListener("click",()=>activateAirlineTab(btn.dataset.airlineTab,x,true));
    btn.addEventListener("keydown",event=>{if(event.key!=="ArrowRight"&&event.key!=="ArrowLeft"&&event.key!=="Home"&&event.key!=="End")return;const tabs=[...root.querySelectorAll("[data-airline-tab]")];if(!tabs.length)return;event.preventDefault();const index=tabs.indexOf(btn);const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;tabs[next].focus();activateAirlineTab(tabs[next].dataset.airlineTab,x,false)})
  });
  root.querySelectorAll("[data-detail-action]").forEach(btn=>btn.addEventListener("click",()=>{const action=btn.dataset.detailAction;if(action==="alexandra")post("TRAVEL_INFO_OPEN_ALEXANDRA",{context:{title:itemTitle(x),library:x._library||""}});else openAction(action)}));
  root.querySelectorAll("[data-detail-path]").forEach(btn=>btn.addEventListener("click",()=>{if(safeInternal(btn.dataset.detailPath))post("TRAVEL_INFO_NAVIGATE",{path:btn.dataset.detailPath})}))
}

function openOverlay(mode,title,subtitle,bodyHtml,focusSelector=""){STATE.overlayMode=mode;STATE.overlayReturnFocus=document.activeElement;$("tiSheetKicker").textContent="Travel Info";$("tiSheetTitle").textContent=title;$("tiSheetSubtitle").textContent=subtitle||"";$("tiSheetBody").innerHTML=bodyHtml;hydrateStaticIcons($("tiSheetBody"));$("tiOverlay").dataset.mode=mode;$("tiOverlay").dataset.open="true";$("tiOverlay").setAttribute("aria-hidden","false");document.documentElement.classList.add("ti-lock");bindOverlay(mode);requestAnimationFrame(()=>{const target=focusSelector?$("tiSheetBody").querySelector(focusSelector):$("tiSheetBody").querySelector("input,select,textarea,button");target?.focus()})}
function closeOverlay(){$("tiOverlay").dataset.open="false";$("tiOverlay").setAttribute("aria-hidden","true");document.documentElement.classList.remove("ti-lock");const target=STATE.overlayReturnFocus;if(target&&target.isConnected)target.focus({preventScroll:true});STATE.overlayMode=""}
function requirementsPanelHtml(){return`<div class="ti-form-grid"><div class="ti-field"><label for="tiPassportCountry">Passport nationality</label><input id="tiPassportCountry" autocomplete="country-name" placeholder="Country"></div><div class="ti-field"><label for="tiFromCountry">From</label><input id="tiFromCountry" autocomplete="off" placeholder="Country"></div><div class="ti-field"><label for="tiTransitCountry">Transit</label><input id="tiTransitCountry" autocomplete="off" placeholder="Optional"></div><div class="ti-field"><label for="tiToCountry">To</label><input id="tiToCountry" autocomplete="off" placeholder="Country"></div></div><div class="ti-sheet-actions"><button id="tiRequirementSubmit" class="ti-btn ti-btn-primary" type="button">Check requirements ${icon("arrow")}</button></div><div id="tiRequirementResult" class="ti-message-box" aria-live="polite">Enter your passport nationality and destination to check the current travel-requirements information. Always verify final entry rules with official authorities.</div><div class="ti-sheet-actions"><button id="tiPassportGuide" class="ti-btn ti-btn-light" type="button">Passport & visa guide ${icon("arrow")}</button></div>`}
function supportPanelHtml(){return`<div class="ti-form-grid"><div class="ti-field"><label for="tiSupportName">Name</label><input id="tiSupportName" autocomplete="name"></div><div class="ti-field"><label for="tiSupportEmail">Email</label><input id="tiSupportEmail" type="email" autocomplete="email"></div><div class="ti-field"><label for="tiSupportRef">Booking reference</label><input id="tiSupportRef" autocomplete="off"></div><div class="ti-field"><label for="tiSupportCategory">Category</label><select id="tiSupportCategory"><option>General</option><option>Before travel</option><option>Baggage</option><option>Airport</option><option>Airline</option><option>Hotel</option><option>Transfer</option><option>Tour / Activity</option><option>Ticket / Voucher</option><option>Booking</option></select></div><div class="ti-field ti-full"><label for="tiSupportMessage">Message</label><textarea id="tiSupportMessage"></textarea></div></div><div class="ti-sheet-actions"><button id="tiSupportSend" class="ti-btn ti-btn-primary" type="button">Send request ${icon("message")}</button></div><div id="tiSupportResult" class="ti-message-box" hidden aria-live="polite"></div>`}
/* Airline baggage finder. Reads only the public airline payload already supplied to Travel Info. */
function tiBagEntries(airline) {
  const bag=obj(airline?.baggage);
  return bag.mode==="structured" ? arr(bag.cabins).flatMap(cabin =>
    arr(cabin.fares).map(fare => ({
      cabin:text(cabin.cabinType||cabin.travelClass), name:text(fare.name),
      description:text(fare.description), underSeatBag:text(fare.underSeatBag),
      overheadCarryOn:text(fare.overheadCarryOn), checkedBag:text(fare.checkedBag)
    }))
  ) : [];
}
function tiBagSearchRows(airlines, query, cabin, type) {
  const term=lower(query), classKey=lower(cabin);
  return arr(airlines).map(airline=>{
    const all=tiBagEntries(airline), bag=obj(airline?.baggage);
    const narrative=bag.mode==="narrative" ? text(bag.text||airline.baggageAllowance) : text(airline.baggageAllowance);
    const identity=lower([itemTitle(airline),itemCode(airline),airline.icaoCode,airline.shortName].filter(Boolean).join(" "));
    const matched=all.filter(fare=>{
      if(classKey && lower(fare.cabin)!==classKey)return false;
      if(type && !fare[type])return false;
      const content=lower([fare.cabin,fare.name,fare.description,fare.underSeatBag,fare.overheadCarryOn,fare.checkedBag].join(" "));
      return !term||identity.includes(term)||content.includes(term)
    });
    const narrativeMatches=Boolean(narrative && (!term||identity.includes(term)||lower(narrative).includes(term)));
    const unknownMatches=!all.length&&!narrative&&!classKey&&!type&&(!term||identity.includes(term));
    return {airline, matched, narrative:narrativeMatches?narrative:"", unknown:unknownMatches};
  }).filter(row=>row.matched.length || ((!classKey&&!type)&&row.narrative) || row.unknown)
    .sort((a,b)=>itemTitle(a.airline).localeCompare(itemTitle(b.airline)));
}
function tiBagFareHtml(fare,type) {
  const fields=[["Under-seat bag",fare.underSeatBag,"underSeatBag"],["Cabin bag",fare.overheadCarryOn,"overheadCarryOn"],["Checked bag",fare.checkedBag,"checkedBag"]];
  const facts=fields.filter(([,value,key])=>!type||key===type).map(([label,value])=>
    `<div class="ti-bag-result-fact"><dt>${esc(label)}</dt><dd>${esc(value||"Not published")}</dd></div>`).join("");
  return `<article class="ti-bag-fare"><div class="ti-bag-fare-head"><strong>${esc(fare.name||"Fare information")}</strong>${fare.cabin?`<span>${esc(fare.cabin)}</span>`:""}</div>${fare.description?`<p>${esc(fare.description)}</p>`:""}<dl>${facts}</dl></article>`;
}
function tiRenderBaggageFinder() {
  const search=$("tiBagSearch"),cabin=$("tiBagCabin"),type=$("tiBagType"),list=$("tiBagResults"),count=$("tiBagCount");
  if(!search||!cabin||!type||!list||!count)return;
  const rows=tiBagSearchRows(DATA.airlines,search.value,cabin.value,type.value);
  const total=arr(DATA.airlines).length;
  count.textContent=STATE.dataState==="loading"&&!total?"Loading airline information…":STATE.dataState==="error"&&!total?"Airline information could not be loaded. Try again from Travel Info.":`${rows.length} of ${total} published airline records`;
  if(!rows.length){list.innerHTML=`<div class="ti-bag-empty">${STATE.dataState==="loading"&&!total?"Airline information is loading.":STATE.dataState==="error"&&!total?"Airline information is unavailable.":"No airlines match these filters."}</div>`;return}
  list.innerHTML=rows.map(({airline,matched,narrative})=>{
    const name=itemTitle(airline),code=itemCode(airline),website=safeExternal(airline.website),logo=itemLogoUrl(airline);
    const guidance=matched.length?matched.map(fare=>tiBagFareHtml(fare,type.value)).join(""):narrative?`<p class="ti-bag-narrative">${esc(narrative)}</p>`:'<p class="ti-bag-unavailable">Baggage information has not been published for this airline.</p>';
    return `<details class="ti-bag-airline"><summary><span class="ti-bag-logo">${logo?`<img src="${esc(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:esc((code||name).slice(0,3).toUpperCase())}</span><span class="ti-bag-name"><strong>${esc(name)}</strong><small>${esc(code)}</small></span><span class="ti-bag-summary-label">${matched.length?"Fare details":narrative?"General guidance":"Not published"}</span></summary><div class="ti-bag-airline-body">${guidance}${website?`<a class="ti-bag-official" href="${esc(website)}" target="_blank" rel="noopener noreferrer">Visit airline website ↗</a>`:""}</div></details>`
  }).join("");
}
function tiUpdateBaggageCabins() {
  const select=$("tiBagCabin");if(!select)return;const previous=select.value;
  const cabins=uniq(arr(DATA.airlines).flatMap(tiBagEntries).map(entry=>entry.cabin)).sort((a,b)=>a.localeCompare(b));
  select.innerHTML='<option value="">All cabin classes</option>'+cabins.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
  if(cabins.includes(previous))select.value=previous;
}
function tiOpenBaggageFinder() {
  openOverlay("baggage","Airline baggage information","Browse published guidance by airline, cabin and bag type.",`
    <div class="ti-bag-intro"><strong>Find the allowance for your trip</strong><p>Allowances can vary by fare, route and operating airline. Check your booking and the airline's current rules before travel.</p></div>
    <div class="ti-bag-controls"><label>Airline, code or fare<input type="search" id="tiBagSearch" autocomplete="off" placeholder="Search airlines or baggage details"></label><label>Cabin class<select id="tiBagCabin"><option value="">All cabin classes</option></select></label><label>Bag type<select id="tiBagType"><option value="">All bag types</option><option value="underSeatBag">Under-seat bag</option><option value="overheadCarryOn">Cabin bag</option><option value="checkedBag">Checked bag</option></select></label></div>
    <div class="ti-bag-toolbar"><span id="tiBagCount" role="status" aria-live="polite"></span><button type="button" id="tiBagClear">Clear filters</button></div><div id="tiBagResults" class="ti-bag-results"></div>
    <p class="ti-bag-footnote">Only published SKANDI airline records are shown. General guidance cannot be filtered by cabin or bag type.</p>`,"#tiBagSearch");
  tiUpdateBaggageCabins();
  ["tiBagSearch","tiBagCabin","tiBagType"].forEach(id=>$(id)?.addEventListener(id==="tiBagSearch"?"input":"change",tiRenderBaggageFinder));
  $("tiBagClear")?.addEventListener("click",()=>{$("tiBagSearch").value="";$("tiBagCabin").value="";$("tiBagType").value="";tiRenderBaggageFinder();$("tiBagSearch").focus()});
  tiRenderBaggageFinder();
}

function openAction(action){
  if(action==="baggage")tiOpenBaggageFinder();
  else if(action==="assistance")post("TRAVEL_INFO_NAVIGATE",{path:"/travel-info/special-assistance"});
  else if(action==="requirements")openOverlay("requirements","Travel requirements","Check passport and entry guidance before departure.",requirementsPanelHtml(),"#tiPassportCountry");
  else if(action==="support")openOverlay("support","Contact Travel Support","Send an itinerary or travel-information question to SKANDI.",supportPanelHtml(),"#tiSupportName");
  else if(action==="insurance")post("TRAVEL_INFO_OPEN_INSURANCE",{});
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

function aircraftKey(x){return text(x?.id||x?.iataCode||x?.code)}
function requestAircraft(x){
  const key=aircraftKey(x),host=$("onboardReactRoot");
  if(!key||!host)return;
  if(STATE.aircraftBundles.has(key)){renderFleet(STATE.aircraftBundles.get(key));return}
  host.innerHTML='<p class="ti-airline-card" role="status">Loading walkaround…</p>';
  if(STATE.aircraftPending.has(key))return;
  const requestId=`walkaround-${++STATE.aircraftRequestSerial}`;
  const timer=setTimeout(()=>finishAircraftRequest({airlineKey:key,requestId},true),20000);
  STATE.aircraftPending.set(key,{requestId,timer});
  post("TRAVEL_INFO_REQUEST_AIRCRAFT",{airlineId:x.id,airlineCode:x.iataCode,airlineKey:key,requestId});
}
function finishAircraftRequest(payload,failed=false){
  const key=text(payload.airlineKey),pending=STATE.aircraftPending.get(key);
  if(!pending||pending.requestId!==payload.requestId)return;
  clearTimeout(pending.timer);
  STATE.aircraftPending.delete(key);
  if(!failed)STATE.aircraftBundles.set(key,payload);
  if(key!==aircraftKey(STATE.activeDetail)||STATE.activeDetail?._library!=="airlines")return;
  if(!failed){renderFleet(payload);return}
  const host=$("onboardReactRoot");
  if(!host)return;
  host.innerHTML='<div class="ti-airline-card"><p role="status">The walkaround could not be loaded.</p><button type="button" class="ti-btn ti-btn-light">Try again</button></div>';
  host.querySelector("button").addEventListener("click",()=>requestAircraft(STATE.activeDetail),{once:true});
}
function renderFleetFallback(bundle,host){
  const aircraft=arr(bundle.aircraft),cabins=arr(bundle.cabins);if(!aircraft.length){host.innerHTML=`<div class="ti-fleet-fallback"><h3>Aircraft information</h3><p>No published aircraft information is currently available for this airline.</p></div>`;return}
  host.innerHTML=`<div class="ti-fleet-fallback"><h3>Aircraft & cabin information</h3><p>The interactive cabin explorer is temporarily unavailable, but the published aircraft information is still available below.</p><div class="ti-fallback-aircraft-list">${aircraft.map(a=>{const id=text(a.id),cs=cabins.filter(c=>text(c.aircraft_id||c.aircraftId)===id);return`<article class="ti-fallback-aircraft"><strong>${esc(a.display_title||a.displayTitle||a.aircraft_name||a.aircraftName||a.aircraft_code||a.aircraftCode||"Aircraft")}</strong><span>${esc([a.aircraft_code||a.aircraftCode,a.manufacturer,a.family,a.total_seats||a.totalSeats?`${a.total_seats||a.totalSeats} seats`:""].filter(Boolean).join(" · "))}</span>${cs.length?`<div class="ti-fallback-cabins">${cs.map(c=>`<i>${esc(c.cabin_name||c.cabinName||c.cabin_code||c.cabinCode||"Cabin")}</i>`).join("")}</div>`:""}</article>`}).join("")}</div></div>`
}
function renderFleet(bundle){
  const host=$("onboardReactRoot");if(!host)return;
  if(window.SKANDIOnboardReact?.mount){window.SKANDIOnboardReact.mount(host,bundle||{},STATE.activeDetail||{});return}
  window.__SKANDI_ONBOARD_PENDING__={host,bundle:bundle||{},airline:STATE.activeDetail||{}};
  host.innerHTML=`<div class="ti-aircraft-skeleton"><div class="ti-skeleton-lines"><i></i><i></i><i></i></div></div>`;
  setTimeout(()=>{if(host.isConnected&&!window.SKANDIOnboardReact?.mount)renderFleetFallback(bundle||{},host)},5000)
}
window.addEventListener("SKANDI_ONBOARD_REACT_READY",()=>{const p=window.__SKANDI_ONBOARD_PENDING__;delete window.__SKANDI_ONBOARD_PENDING__;if(!p)return;const host=p.host;if(host?.isConnected&&window.SKANDIOnboardReact?.mount)window.SKANDIOnboardReact.mount(host,p.bundle,p.airline)});

function weatherKey(x){return text(x.id||x.code||x.iata||itemTitle(x))}
function requestWeather(x){const key=weatherKey(x);if(STATE.weatherCache.has(key)){renderWeatherForDetail(STATE.weatherCache.get(key));return}if(STATE.weatherPending.has(key))return;STATE.weatherPending.add(key);post("TRAVEL_INFO_WEATHER_REQUEST",{locations:[{id:x.id||x.code||x.iata,title:itemTitle(x),latitude:Number(x.latitude),longitude:Number(x.longitude)}]})}
function renderWeatherForDetail(w){
  const host=$("tiWeatherInline");if(!host)return;if(!w||w.ok!==true){host.dataset.visible="false";return}const temp=num(w.tempC);$("tiWeatherValue").textContent=temp!==null?`${Math.round(temp)}°C`:text(w.temperature||"Current weather");$("tiWeatherDescription").textContent=formatTextValue(w.description??w.condition);host.dataset.visible="true"
}

function renderAll(){buildSearchIndex();renderFilters();setLibrary(STATE.activeLibrary);hydrateStaticIcons()}
function findUpdatedDetail(current){
  if(!current)return null;const lib=current._library;if(lib==="faq")return arr(DATA.helpCenter?.topics).map(x=>normalizeContentItem(x,"faq")).find(x=>text(x.id||x.topicId)===text(current.id||current.topicId))||null;if(lib==="articles")return arr(DATA.articles).map(x=>normalizeContentItem(x,"articles")).find(x=>text(x.id||x.slug)===text(current.id||current.slug))||null;return arr(DATA[lib]).map(x=>normalizeContentItem(x,lib)).find(x=>text(x.id||x.code||x.iataCode)===text(current.id||current.code||current.iataCode))||null
}
function loadData(payload){
  clearBootstrapWatchdog();DATA={...DATA,...obj(payload),helpCenter:{...DATA.helpCenter,...obj(payload?.helpCenter)}};STATE.dataState="ready";setStatus("");renderAll();if(STATE.overlayMode==="baggage"){tiUpdateBaggageCabins();tiRenderBaggageFinder()}
  if(!STATE.initialSectionApplied && payload?.initialSection === "transfers") {STATE.initialSectionApplied=true;setLibrary("transfers",true)}
  if(STATE.activeDetail){const updated=findUpdatedDetail(STATE.activeDetail);if(updated){STATE.activeDetail=updated;renderDetail(updated)}else closeDetail()}
}
function retryData(){STATE.dataState="loading";setStatus("Refreshing Travel Info…");renderDirectory();armBootstrapWatchdog();post("TRAVEL_INFO_REFRESH",{settings:{language:"EN"}})}

function parseMessage(value){if(typeof value==="string"){try{return JSON.parse(value)}catch(_){return null}}return value&&typeof value==="object"?value:null}
window.addEventListener("message",event=>{
  const m=parseMessage(event.data);if(!m||m.source!==PARENT)return;const p=obj(m.payload);
  switch(m.type){
    case "TRAVEL_INFO_HOST_READY":STATE.dataState="loading";armBootstrapWatchdog();post("TRAVEL_INFO_READY",{settings:{language:"EN"},protocolVersion:VERSION});break;
    case "TRAVEL_INFO_PROGRESS":STATE.dataState="loading";setStatus(p.message||"Loading SKANDI Travel Info…");break;
    case "TRAVEL_INFO_DATA":loadData(p);break;
    case "TRAVEL_INFO_AIRCRAFT_DATA":finishAircraftRequest(p,p.ok===false);break;
    case "TRAVEL_INFO_AIRPORT_CONTEXT_RESULT":{
      const req=STATE.airportContextRequest;if(req&&p.requestId&&p.requestId!==req.requestId)break;const airport=obj(p.airport);const iata=tiAirportIata(airport)||req?.iata||"";if(iata){STATE.airportContextPending.delete(iata);STATE.airportContexts.set(iata,p);if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===iata)renderAirportDetail(STATE.activeDetail)}break
    }
    case "TRAVEL_INFO_AIRPORT_CONTEXT_ERROR":{
      const req=STATE.airportContextRequest;if(req&&(!p.requestId||p.requestId===req.requestId)){STATE.airportContextPending.delete(req.iata);STATE.airportContexts.set(req.iata,{airport:{iata:req.iata},commerce:{},error:p.message||"Airport information is temporarily unavailable."})}break
    }
    case "TRAVEL_INFO_AIRPORT_FLIGHTS_RESULT":{
      const req=STATE.airportFlightRequest;if(req&&p.requestId&&p.requestId!==req.requestId)break;if(req){STATE.airportFlightPending.delete(req.key);STATE.airportFlights.set(req.key,{items:arr(p.items),meta:obj(p.meta)});if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===req.iata)tiRenderAirportFlights()}break
    }
    case "TRAVEL_INFO_AIRPORT_FLIGHTS_ERROR":{
      const req=STATE.airportFlightRequest;if(req&&(!p.requestId||p.requestId===req.requestId)){STATE.airportFlightPending.delete(req.key);STATE.airportFlights.set(req.key,{items:[],meta:{},error:p.message||"Flight information is temporarily unavailable."});if(STATE.activeDetail&&tiAirportIata(STATE.activeDetail)===req.iata)tiRenderAirportFlights()}break
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
    case "TRAVEL_INFO_ERROR":if(p.scope==="aircraft"){finishAircraftRequest(p,true);break}clearBootstrapWatchdog();STATE.dataState="error";if(STATE.overlayMode==="baggage")tiRenderBaggageFinder();STATE.requirementsPending=false;STATE.supportPending=false;if($("tiRequirementSubmit"))$("tiRequirementSubmit").disabled=false;if($("tiSupportSend"))$("tiSupportSend").disabled=false;setStatus(p.message||"Travel information is temporarily unavailable.",true);renderDirectory();{const target=STATE.overlayMode==="support"?$("tiSupportResult"):STATE.overlayMode==="requirements"?$("tiRequirementResult"):null;if(target){target.hidden=false;target.dataset.tone="error";target.textContent=p.message||"This service is temporarily unavailable. Please try again."}}break;
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
$("tiLoadMore").addEventListener("click",()=>{
  const firstNew=STATE.visibleCount;
  STATE.visibleCount+=PAGE_SIZE;
  renderDirectory();
  $("tiDirectoryList").querySelector(`[data-directory-index="${firstNew}"]`)?.focus();
});
$("tiFilterTabs").addEventListener("click",event=>{
  const button=event.target.closest("[data-filter]");
  if(button)setLibrary(button.dataset.filter);
});
$("tiJourneyFilter").addEventListener("change",event=>{
  STATE.activeJourneyGroup=event.target.value;
  STATE.visibleCount=PAGE_SIZE;
  renderDirectory();
});
document.addEventListener("click",e=>{const action=e.target.closest("[data-action]");if(action)openAction(action.dataset.action)});


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
