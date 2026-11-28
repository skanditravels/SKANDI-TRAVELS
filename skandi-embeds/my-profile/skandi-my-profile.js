
(() => {
"use strict";
// B-011.31 hierarchical account shell + Club overview + trip action center. Data ownership and provider contracts remain canonical.
const SOURCE="SKANDI_MY_PROFILE",DOC_SOURCE="SKANDI_CUSTOMER_DOCUMENT_CENTER",PARENT="SKANDI_WIX_PARENT",$=id=>document.getElementById(id);
const STARTUP_TIMEOUT_MS=28000;
const READ_TIMEOUT_MS=26000;
const state={data:null,section:"home",view:"overview",tripId:"",tripBackView:"upcoming",previewTrip:null,rewards:null,ledgerFilter:"all",bookingDetail:null,pending:new Map(),stripe:null,elements:null,payment:null,legacyDocuments:null,emailPreferences:{loaded:false,loading:false,subscribed:false,email:""},support:{loaded:false,loading:false,cases:[],selectedCaseId:"",detail:null,workflows:[],activeRequest:0}};
const views=new Map([...$("accountWorkspace").querySelectorAll("[data-page]")].map(view=>[view.dataset.page,view]));
let startupTimer;
let bootstrapping=false;
let activeBookingRequest=0;
const icon=(name)=>{const paths={calendar:'<path d="M7 2v3M17 2v3M3.5 9h17M5 4.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',doc:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',bag:'<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',plane:'<path d="M22 2 9.5 14.5 3 12l-2 2 7 3 3 7 2-2-2.5-6.5L23 3z"/>',check:'<path d="m5 12 4 4L19 6"/>',wallet:'<path d="M3 6h17v14H3zM3 9h17M15 13h3v3h-3z"/>'};return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.check}</svg>`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:[]; const money=(amount,currency)=>{
  if(amount===null||amount===undefined||amount===""||!Number.isFinite(Number(amount))||!/^([A-Z]{3})$/.test(String(currency||"")))return "";
  return new Intl.NumberFormat(undefined,{style:"currency",currency}).format(Number(amount));
}; const date=v=>{if(!v)return"";try{return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(String(v).length===10?`${v}T12:00:00`:v))}catch{return String(v)}}; const num=v=>new Intl.NumberFormat().format(Number(v)||0);
function post(type,payload={},source=SOURCE){window.parent.postMessage({source,type,payload,timestamp:new Date().toISOString()},"*")}
function reqId(){return `mpr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`}
function request(type,payload={},timeout=140000){
  const id=reqId();
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>{
      state.pending.delete(id);
      reject(new Error(timeout===READ_TIMEOUT_MS?"This is taking longer than expected. Please try again.":"The request timed out. Refresh to check its status."));
    },timeout);
    state.pending.set(id,{resolve,reject,t,type});
    post(type,{...payload,requestId:id},type.startsWith("CUSTOMER_DOCUMENT_")?DOC_SOURCE:SOURCE);
  });
}
function busy(on){$("loading").classList.toggle("show",!!on)}
let toastTimer;function toast(message,bad=false){clearTimeout(toastTimer);const el=$("toast");el.textContent=message;el.className=`toast show${bad?" bad":""}`;toastTimer=setTimeout(()=>el.className="toast",4200)}
function empty(title,body,ic="doc"){return `<div class="empty">${icon(ic)}<strong>${esc(title)}</strong><span>${esc(body)}</span></div>`}
function setTab(tab,push=false){
  const map={overview:["home","overview"],club:["club","overview"],trips:["trips","upcoming"],orders:["trips","drafts"],documents:["trips","upcoming"],travelers:["profile","travelers"],wallet:["profile","wallet"],saved:["profile","saved"],notifications:["account","notifications"],settings:["account","settings"],support:["support","cases"]};
  setPage(...(map[String(tab||"")]||map.overview),push);
}

function pageKey(section,view){return `${section}-${view}`}

function setPage(section,view,push=false,tripId=""){
  if(view==="detail"&&!tripId)view="upcoming";
  if(!views.has(pageKey(section,view))){section="home";view="overview"}
  const key=pageKey(section,view);
  const tripChanged=key==="trips-detail"&&tripId!==state.tripId;
  const changed=section!==state.section||view!==state.view||tripChanged;
  if(changed&&state.view==="detail"){
    activeBookingRequest++;
    state.bookingDetail=null;
  }
  state.section=section;
  state.view=view;
  state.tripId=key==="trips-detail"?tripId:"";
  for(const [viewKey,panel] of views)panel.classList.toggle("active",viewKey===key);
  for(const link of $("sideMenu").querySelectorAll(".side-link")){
    const active=pageKey(link.dataset.section,link.dataset.view)===key;
    link.classList.toggle("active",active);
    if(active)link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  }
  const group=section==="profile"?"account":section;
  for(const nav of $("sideMenu").querySelectorAll(".side-category")){
    const selected=nav.dataset.category===group;
    nav.classList.toggle("active",selected);
    if(!selected)nav.querySelector(".profile-nav-main").removeAttribute("aria-current");
    else if(view==="detail")nav.querySelector(".profile-nav-main").setAttribute("aria-current","true");
    else nav.querySelector(".profile-nav-main").removeAttribute("aria-current");
  }
  $("profileSectionSelect").value=view==="detail"?"trips-"+state.tripBackView:key;
  if(push)post("MY_PROFILE_QUERY_UPDATE",{section,view,tripId:state.tripId});
  if(!state.data)return;
  if(section==="home")void loadNextTrip();
  if(changed&&push){
    const heading=views.get(key).querySelector("h2");
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
    $("profileStage").scrollIntoView({block:"start",behavior:"auto"});
  }
  if(view==="detail"&&(changed||!state.bookingDetail&&!$("bookingDetail").hasChildNodes()))void loadBooking(state.tripId);
  if(section==="support")void loadSupport().catch(()=>{});
  if(section==="club"&&view==="rewards")void loadRewards();
  if(section==="account"&&view==="settings")void loadEmailPreferences();
}

function bindMobileNavigation(){
  const select=$("profileSectionSelect");
  const destinations=new Map();
  function addOption(link, parent){
    const {section,view}=link.dataset;
    const option=document.createElement("option");
    option.value=pageKey(section,view);
    option.textContent=link.textContent.trim();
    destinations.set(option.value,{section,view});
    parent.append(option);
  }
  addOption($("sideMenu").querySelector('[data-section="home"]'),select);
  for(const category of $("sideMenu").querySelectorAll(".side-category")){
    const group=document.createElement("optgroup");
    group.label=category.querySelector(".profile-nav-main").textContent.trim();
    for(const link of category.querySelectorAll(".side-link"))addOption(link,group);
    select.append(group);
  }
  select.addEventListener("change",()=>{
    const page=destinations.get(select.value);
    if(page)setPage(page.section,page.view,true);
  });
}
function greetingForNow(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"}
function monthYear(v){if(!v)return"—";try{return new Intl.DateTimeFormat(undefined,{month:"short",year:"numeric"}).format(new Date(v))}catch{return date(v)||"—"}}
const ACTION_DOC_STATUSES=new Set(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"]);
function isActionDoc(doc){return ACTION_DOC_STATUSES.has(String(doc?.status||"").toUpperCase())}
function docsForBooking(id){const docs=state.legacyDocuments||arr(state.data?.documents);return docs.filter(d=>String(d.bookingId||"")===String(id||""))}
function actionDocsForBooking(id){return docsForBooking(id).filter(isActionDoc)}

function friendly(s){return String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function groupFor(doc){const s=String(doc.status||"").toUpperCase();if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"].includes(s))return"Action required";if(["ISSUED","SENT","ACKNOWLEDGED"].includes(s))return"Issued documents";if(String(doc.document_code||"").startsWith("F")||String(doc.document_code||"").startsWith("P10"))return"Travel changes";return"Upcoming / preparing"}
function tripTitle(booking){
  const destination=String(booking?.destination||"").trim();
  const airport=arr(state.data?.references?.airports).find(item=>item.iata===destination.toUpperCase());
  return booking?.title||airport?.city||destination||booking?.summary||"Your SKANDI trip";
}

function dateRange(booking){
  const start=booking?.departureDate;
  const end=booking?.returnDate;
  return [date(start),end&&end!==start?date(end):""].filter(Boolean).join(" – ");
}

function tripButton(id,label,style="primary",target=""){
  return `<button class="btn ${esc(style)}" type="button" data-booking="${esc(id)}"${target?` data-trip-target="${esc(target)}"`:""}>${esc(label)}</button>`;
}

function preparationTasks(booking){
  const tasks=actionDocsForBooking(booking.id).filter(doc=>["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","REQUIRED"].includes(String(doc.status).toUpperCase())).map(doc=>({
    title:doc.definition_name||"Travel information required",
    deadline:doc.dueAt,
    target:"trip-documents"
  }));
  const changeCount=Number(booking.actionableScheduleChanges||0);
  if(changeCount>0)tasks.push({title:"Review the airline schedule change",target:"trip-manage"});
  if(booking.paymentDueAt)tasks.push({title:"Review your payment deadline",deadline:booking.paymentDueAt,target:"trip-manage"});
  return tasks.sort((first,second)=>String(first.deadline||"9999").localeCompare(String(second.deadline||"9999")));
}

function nextTrip(){
  const trips=state.data?.trips||{};
  const statuses=["confirmed","ticketed","active","booked","fulfilled"];
  return [...arr(trips.active),...arr(trips.upcoming)]
    .find(trip=>statuses.includes(String(trip.status).toLowerCase()))||null;
}

function renderHero(){
  const name=state.data?.profile||{};
  const greeting=document.createElement("span");
  greeting.id="heroName";
  greeting.textContent=name.firstName||name.displayName||"traveler";
  $("greetingLine").replaceChildren(document.createTextNode(`${greetingForNow()}, `),greeting);
  const count=arr(state.data?.notifications).filter(item=>!item.read).length;
  $("unreadCount").textContent=num(count);
  $("unreadCount").hidden=count===0;
}

function renderHome(){
  const booking=nextTrip();
  const club=state.data?.club||{};
  const hasDrafts=arr(state.data?.trips?.carts).some(cart=>String(cart.status).toLowerCase()!=="confirmed");
  const preview=state.previewTrip?.id===booking?.id?state.previewTrip?.result:null;
  const air=preview?.provider?.air;
  const task=booking?preparationTasks({
    ...booking,
    paymentDueAt:air?.paymentStatus?.awaiting_payment===true?air.paymentRequiredBy:booking.paymentDueAt,
    actionableScheduleChanges:arr(preview?.airlineChanges).filter(item=>!item.actionTaken&&arr(item.availableActions).includes("accept")).length
  })[0]:null;
  const photo=documentLink(booking?.image||preview?.provider?.stay?.accommodation?.photos?.[0]);
  const title=booking?tripTitle(booking):"Where to next?";
  const tripCard=booking?`<div class="home-trip-identity">
      <span class="profile-eyebrow">${booking.inProgress?"On your trip":"Your next trip"}</span>
      <h2>${esc(title)}</h2>
      <p>${esc(dateRange(booking))}</p>
      ${booking.bookingReference?`<span class="home-trip-reference">Booking ${esc(booking.bookingReference)}</span>`:""}
    </div>`:`<div class="home-trip-identity">
      <h2>${title}</h2><p>Find your next getaway or bring an existing booking into My SKANDI.</p>
    </div>`;
  const actions=booking?`<div class="home-trip-action">
      <div>${task?`<span class="profile-eyebrow">Before you travel</span><h3>${esc(task.title)}</h3>${task.deadline?`<p>Due ${esc(date(task.deadline))}</p>`:""}`:`<h3>${booking.inProgress?"Travel Day":"Your itinerary"}</h3><p>${booking.inProgress?"See what’s next and find your arrival details.":"Flights, stays, and travel documents in one place."}</p>`}</div>
      ${tripButton(booking.id,task?"Review next step":booking.inProgress?"View trip":"View itinerary","primary",task?.target||"")}
    </div>
    <nav class="profile-shortcuts" aria-label="Trip shortcuts">
      ${tripButton(booking.id,"Itinerary","soft","trip-itinerary")}
      ${tripButton(booking.id,"Documents","soft","trip-documents")}
      ${tripButton(booking.id,"Trip help","soft","trip-support")}
    </nav>`:`<div class="home-trip-action"><div class="button-row">
      <button class="btn primary" type="button" data-route="/destinations">Find a trip</button>
      <button class="btn soft" type="button" data-link-booking>Link a booking</button>
    </div></div>`;
  const clubSummary=club.enrolled
    ?Number.isFinite(club.pointsBalance)?`${num(club.pointsBalance)} ${esc(String(club.pointsName||"points").toLowerCase())} available`:"Points balance temporarily unavailable"
    :club.status==="UNAVAILABLE"?"Member information temporarily unavailable":"Explore member benefits and ways to earn.";
  $("accountHome").innerHTML=`<article class="home-trip">
      <div class="home-trip-hero">${photo?`<img src="${esc(photo)}" alt="" fetchpriority="high">`:""}${tripCard}</div>
      ${actions}
    </article>
    <div class="overview-secondary">
      <article class="profile-panel overview-club">
        <div><h3>SKANDI Club</h3><p>${clubSummary}</p></div>
        <button class="text-action" type="button" data-section="club" data-view="overview">${club.enrolled?"Club card":"Explore Club"} →</button>
      </article>
      <article class="profile-panel overview-links">
        ${hasDrafts?'<button class="text-action" type="button" data-section="trips" data-view="drafts">Continue a booking →</button>':""}
        <button class="text-action" type="button" data-section="profile" data-view="travelers">Saved travelers →</button>
        <button class="text-action" type="button" data-section="support" data-view="cases">My support requests →</button>
      </article>
    </div>`;
}

async function loadNextTrip(){
  const booking=nextTrip();
  if(!booking||state.previewTrip?.id===booking.id)return;
  const pending={id:booking.id};
  state.previewTrip=pending;
  try{
    const {result}=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:booking.id},READ_TIMEOUT_MS);
    if(state.previewTrip!==pending||result?.booking?.id!==booking.id)return;
    pending.result=result;
    if(state.section==="home")renderHome();
  }catch(_){
    // Current booking and document details are already available in the overview.
  }
}

function renderOverview(){
  const {profile:p={},club:c={}}=state.data;
  const overview=$("clubView");
  const title='<h2 class="profile-title">Club overview</h2>';
  if(!c.enrolled){
    overview.innerHTML=title+`<section class="profile-panel profile-empty">
      <h3>${c.status==="UNAVAILABLE"?"Club information is temporarily unavailable":"Join SKANDI Club"}</h3>
      <p>${c.status==="UNAVAILABLE"?"Refresh to check your membership and points.":"Earn points when you travel and use them on eligible rewards."}</p>
      <div class="button-row">
        ${c.status==="UNAVAILABLE"?'<button class="btn primary" type="button" data-refresh-profile>Refresh account</button>':'<button class="btn primary" type="button" data-route="/skandi-club">Explore SKANDI Club</button>'}
        <button class="btn soft" type="button" data-section="support" data-view="cases">Get help</button>
      </div></section>`;
    return;
  }
  const progress=c.tiersEnabled&&c.nextTier&&Number.isFinite(c.progress?.percent)
    ?`<div class="club-tier-progress"><p>${esc(c.tier?.name)} · ${num(c.progress.pointsToNext)} to ${esc(c.nextTier.name)}</p><progress max="100" value="${Math.min(100,Math.max(0,c.progress.percent))}" aria-label="Progress to ${esc(c.nextTier.name)}"></progress></div>`:"";
  overview.innerHTML=title+`<div class="club-overview-grid">
    <figure class="club-member-card" aria-label="SKANDI Club member card">
      <div class="club-card-lockup">${state.clubLogo?`<img src="${esc(state.clubLogo)}" alt="SKANDI Travels">`:"<strong>SKANDI <span>TRAVELS</span></strong>"}<span>SKANDI CLUB</span></div>
      <div class="club-card-number">${p.clubNumber?esc(p.clubNumber):"SKANDI CLUB MEMBER"}</div>
      <figcaption><span>${esc(p.displayName||[p.firstName,p.lastName].filter(Boolean).join(" "))}</span>${c.memberSince?`<div>Member since<strong>${esc(monthYear(c.memberSince))}</strong></div>`:""}</figcaption>
    </figure>
    <div class="profile-panel club-balance">
      <p class="profile-eyebrow">Available ${esc(String(c.pointsName||"points").toLowerCase())}</p>
      <strong class="club-balance-value">${Number.isFinite(c.pointsBalance)?num(c.pointsBalance):"Unavailable"}</strong>
      ${progress}
      <div class="button-row">
        <button class="btn primary" type="button" data-section="club" data-view="rewards">View rewards</button>
        <button class="btn soft" type="button" data-section="club" data-view="activity">Points activity</button>
      </div>
    </div>
    </div>
    <section class="profile-panel club-missing">
      <div><h3>Missing points from a trip?</h3><p>Ask us to review a completed booking.</p></div>
      <button class="btn soft" type="button" data-missing-points>Request a review</button>
    </section>`;
}

async function loadRewards(force=false){
  if(state.rewards?.loading||state.rewards?.items&&!force)return;
  const root=$("clubRewards");
  if(!state.data?.club?.enrolled){
    root.innerHTML=`<div class="profile-panel profile-empty"><h3>SKANDI Club membership</h3>
      <p>${state.data?.club?.status==="UNAVAILABLE"?"We couldn’t verify your membership. Try refreshing your account.":"Join SKANDI Club to earn points and use eligible rewards."}</p>
      <button class="btn soft" type="button" data-section="club" data-view="overview">Club overview</button></div>`;
    return;
  }
  state.rewards={loading:true};
  root.innerHTML='<p class="profile-panel" role="status">Loading Club rewards…</p>';
  try{
    const {result}=await request("MY_PROFILE_CLUB_REWARDS",{},READ_TIMEOUT_MS);
    if(!result?.ok)throw new Error("We couldn’t load Club rewards.");
    state.rewards={items:arr(result.rewards)};
    renderRewards();
  }catch(_){
    state.rewards=null;
    root.innerHTML='<div class="profile-panel profile-empty"><h3>Club rewards are temporarily unavailable</h3><button class="btn soft" type="button" data-retry-rewards>Try again</button></div>';
  }
}

function renderRewards(){
  const root=$("clubRewards");
  const items=state.rewards?.items;
  if(!items)return;
  root.innerHTML=items.length?`<ul class="profile-list club-rewards-list">${items.map(item=>`<li class="profile-panel reward-row">
    <div><h3>${esc(item.name)}</h3><p>${num(item.points)} points${item.pointsToGo>0?` · ${num(item.pointsToGo)} more needed`:""}</p></div>
    ${item.canRedeem?'<button class="btn soft" type="button" data-route="/skandi-club">How to use points</button>':""}
  </li>`).join("")}</ul>`:'<div class="profile-panel profile-empty"><h3>No rewards available right now</h3><p>Check back as new Club rewards are added.</p></div>';
}
function tripCard(booking){
  const task=preparationTasks(booking)[0];
  const when=dateRange(booking);
  const status=friendly(booking.status);
  const parts=arr(booking.components).filter(item=>!["CANCELLED","CANCELED","REMOVED"].includes(String(item.status).toUpperCase()));
  return `<article class="profile-panel trip-list-item">
    <div>
      <p class="profile-eyebrow">${esc(booking.inProgress?"On your trip":when)}</p>
      <h3>${esc(tripTitle(booking))}</h3>
      <p>${[booking.inProgress?when:"",booking.bookingReference,status].filter(Boolean).map(esc).join(" · ")}</p>
      ${parts.length?`<p>${esc([...new Set(parts.map(part=>friendly(part.type)))].join(" · "))}</p>`:""}
      ${task?`<p class="trip-task-text">${esc(task.title)}${task.deadline?` · Due ${esc(date(task.deadline))}`:""}</p>`:""}
    </div>
    ${tripButton(booking.id,"View trip","soft")}
  </article>`;
}

function renderTrips(){
  const trips=state.data?.trips||{};
  const upcoming=[...arr(trips.active),...arr(trips.upcoming)];
  $("tripList").innerHTML=upcoming.length
    ?upcoming.map(tripCard).join("")
    :`<div class="profile-panel profile-empty"><h3>No upcoming trips</h3><p>Link an existing booking or plan your next trip.</p>
      <button class="btn primary" type="button" data-route="/destinations">Find a trip</button></div>`;
  $("tripHistoryList").innerHTML=arr(trips.history).map(tripCard).join("")||empty("No past trips","Your completed and canceled bookings will appear here.","calendar");
  const drafts=arr(trips.carts).filter(cart=>String(cart.status).toLowerCase()!=="confirmed");
  $("tripDraftList").innerHTML=drafts.map(cart=>{
    const draftId=cart.cartId||cart.id;
    const expiry=cart.expiresAt?new Date(cart.expiresAt).getTime():0;
    const expired=expiry&&Date.now()>expiry;
    return `<article class="profile-panel trip-list-item"><div><h3>${esc(cart.selectedOffer?.summary||cart.payload?.selectedOffer?.summary||"Booking draft")}</h3>
      <p>${esc(expired?"Offer expired":friendly(cart.status))}${cart.updatedAt?` · Updated ${esc(date(cart.updatedAt))}`:""}</p></div>
      ${expired?'<button class="btn soft" type="button" data-route="/destinations">Search again</button>':draftId?`<button class="btn soft" type="button" data-route="/booking?cartId=${encodeURIComponent(draftId)}">Continue booking</button>`:""}</article>`;
  }).join("")||empty("No drafts","Unfinished bookings appear here.","doc");
}
function renderClub(){
  const d=state.data,c=d?.club||{},tiers=arr(c.tiers),ledger=arr(c.ledger);
  const activityRoot=$("clubActivityView"),programRoot=$("clubProgramView");
  if(activityRoot){let rows=ledger;if(state.ledgerFilter==="earned")rows=rows.filter(x=>Number(x.amount)>0);else if(state.ledgerFilter==="used")rows=rows.filter(x=>Number(x.amount)<0);else if(state.ledgerFilter==="pending")rows=rows.filter(x=>String(x.status||"").toUpperCase()==="PENDING");activityRoot.innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Account Activity</div><h2>Points Activity</h2></div><p>Points activity recorded for your SKANDI trips.</p></div><div class="activity-toolbar"><div class="activity-filters">${[["all","All"],["earned","Earned"],["used","Used"],["pending","Pending"]].map(([v,l])=>`<button class="activity-filter ${state.ledgerFilter===v?"active":""}" data-ledger-filter="${v}">${l}</button>`).join("")}</div><div style="color:rgba(255,255,255,.42);font-size:10px">${num(rows.length)} entries</div></div><div class="activity-list">${rows.length?rows.map(x=>`<div class="activity-row"><div class="date">${esc(date(x.date))}</div><div><strong>${esc(x.description||friendly(x.type)||"SKANDI Club activity")}</strong><small>${esc(x.bookingReference||friendly(x.status||"Posted"))}</small></div><div class="amount ${Number(x.amount)<0?"neg":""}">${Number(x.amount)>0?"+":""}${num(x.amount)} pts</div></div>`).join(""):empty("No matching activity","There are no Club ledger entries in this filter.","wallet")}</div>`}
  if(programRoot){
    const programName=esc(c.programName||"SKANDI Club");
    const title=`<div class="page-intro"><h2>${programName}</h2></div>`;
    const tierRows=tiers.map(t=>`<div class="tier-row ${t.id&&t.id===c.tier?.id?"current":""}"><strong>${esc(t.name)}</strong><span>${num(t.minPoints)}</span></div>`).join("");
    const summary=c.programStatus==="UNAVAILABLE"
      ? "Club program information is temporarily unavailable."
      : c.programStatus==="PAUSED"
        ? "The Club program is currently paused."
        : "See how to earn and use your Club points.";
    programRoot.innerHTML=title+`<div class="club-status-panel">
      <h3>Program information</h3><p>${summary}</p>
      <button class="btn cyan" type="button" data-route="/skandi-club">Explore SKANDI Club</button>
    </div>`+(tiers.length?`<div class="tier-table wix-tier-table">
      <div class="tier-row header"><span>Club level</span><span>Points required</span></div>${tierRows}
    </div>`:"");
  }
}
function initials(t){return [t.firstName,t.lastName].filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase()||"TR"}
function renderTravelers(){const list=arr(state.data?.travelers);$("travelerGrid").innerHTML=list.length?list.map(t=>`<article class="card traveler-card"><div class="traveler-head"><div class="avatar">${esc(initials(t))}</div><div><div class="traveler-name">${esc(t.displayName||[t.firstName,t.lastName].join(" "))}</div><div class="traveler-meta">${t.isPrimary?"Primary traveler":esc(t.travelerType||"Companion")}</div></div></div><div class="traveler-info"><div class="info-pair"><span>Date of birth</span><strong>${esc(t.dateOfBirth?date(t.dateOfBirth):"Not saved")}</strong></div><div class="info-pair"><span>Passport</span><strong>${esc(t.passportLast4?`•••• ${t.passportLast4}`:"Not saved")}</strong></div><div class="info-pair"><span>Email</span><strong>${esc(t.email||"—")}</strong></div><div class="info-pair"><span>Accessibility</span><strong>${esc(t.accessibilityNeeds||"None saved")}</strong></div></div><div class="traveler-actions"><button class="btn small" data-edit-traveler="${esc(t.id)}">Edit</button>${!t.isPrimary?`<button class="btn small danger" data-remove-traveler="${esc(t.id)}">Remove</button>`:""}</div></article>`).join(""):empty("No saved travelers","Add frequent travel companions so their details are ready for future bookings.","user")}
function renderDocuments(){
  const docs=state.legacyDocuments||arr(state.data?.documents),groups={"Action required":[],"Upcoming / preparing":[],"Issued documents":[],"Travel changes":[]};docs.forEach(d=>(groups[groupFor(d)]||groups["Upcoming / preparing"]).push(d));
  if($("mAction"))$("mAction").textContent=groups["Action required"].length;if($("mReady"))$("mReady").textContent=groups["Upcoming / preparing"].length;if($("mIssued"))$("mIssued").textContent=groups["Issued documents"].length;if($("mChanges"))$("mChanges").textContent=groups["Travel changes"].length;if($("documents"))$("documents").innerHTML="";
}
function renderWallet(){const pays=arr(state.data?.paymentMethods),wallet=arr(state.data?.wallet);$("paymentGrid").innerHTML=pays.length?pays.map(p=>`<div class="card wallet-card"><div class="card-chip"></div><div class="wallet-number">•••• •••• •••• ${esc(p.last4||"••••")}</div><div class="wallet-meta"><span>${esc(p.brand||"Card")}</span><span>${p.expiryMonth&&p.expiryYear?`${String(p.expiryMonth).padStart(2,"0")}/${String(p.expiryYear).slice(-2)}`:""}</span></div></div>`).join(""):empty("No saved payment methods","Payment methods saved by secure checkout will appear here only as masked metadata.","wallet");$("walletGrid").innerHTML=wallet.length?wallet.map(w=>`<div class="card pad"><h3>${esc(w.title)}</h3><p>${esc(friendly(w.type))}${w.expiresAt?` · expires ${esc(date(w.expiresAt))}`:""}</p>${w.code?`<div class="chips"><span class="chip blue">${esc(w.code)}</span></div>`:""}</div>`).join(""):empty("Your wallet is empty","Eligible vouchers, passes and travel wallet items will appear here.","wallet")}
function renderSaved(){const items=arr(state.data?.favorites);$("favorites").innerHTML=items.length?items.map(x=>`<article class="card saved-card">${x.image?`<img class="saved-img" src="${esc(x.image)}" alt="">`:`<div class="saved-img"></div>`}<div><h3 style="margin:0 0 5px">${esc(x.title)}</h3><p>${esc(friendly(x.type))}</p></div><div class="button-row">${x.url?`<button class="btn small primary" data-route="${esc(x.url)}">View</button>`:""}<button class="btn small" data-remove-favorite="${esc(x.id)}">Remove</button></div></article>`).join(""):empty("Nothing saved yet","Save hotels, destinations and travel ideas while browsing SKANDI and they will appear here.","heart")}
function renderNotifications(){const items=arr(state.data?.notifications);$("notifications").innerHTML=items.length?items.map(n=>`<div class="notif ${n.read?"":"unread"}"><div class="notif-dot"></div><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><div style="font-size:10px;color:#98a3ad;margin-top:7px">${esc(date(n.createdAt))}</div></div><div class="button-row">${n.actionPath?`<button class="btn small" data-route="${esc(n.actionPath)}">Open</button>`:""}${!n.read?`<button class="btn small soft" data-read-notification="${esc(n.id)}">Mark read</button>`:""}</div></div>`).join(""):empty("You're all caught up","Booking, Club and account updates will appear here.","bell")}
function fillSelect(control,rows,value,labelFor){
  control.replaceChildren(new Option("Select",""));
  for(const row of rows)control.add(new Option(labelFor(row),row.id));
  if(value&&!rows.some(row=>String(row.id)===String(value))){
    // Keep previously saved values when a reference is unavailable.
    const original=new Option("Current selection",value);
    original.disabled=true;
    control.add(original);
  }
  control.value=value||"";
  control.disabled=rows.length===0;
}

function renderContact(){
  const profile=state.data.profile;
  const form=$("contactForm");
  if(!form.dataset.editVersion){
    for(const name of ["firstName","lastName","displayName","email","phone"]){
      form.elements.namedItem(name).value=profile[name]||"";
    }
  }
  $("profileSummary").innerHTML=`
    ${profile.loginEmail?`<div class="info-pair"><span>Wix sign-in email</span><strong>${esc(profile.loginEmail)}</strong></div>`:""}
    ${profile.passportLast4?`<div class="info-pair"><span>Passport on file</span><strong>•••• ${esc(profile.passportLast4)}</strong></div>`:""}`;
}

function renderSettings(){
  const {profile,references={}}=state.data;
  const form=$("profileForm");
  if(form.dataset.editVersion)return;
  const controls=form.elements;
  controls.preferredCurrency.value=profile.preferredCurrency||"";
  controls.seatPreference.value=profile.payload?.seatPreference||"";
  controls.dietaryPrefs.value=profile.dietaryPrefs||"";
  controls.accessibilityNeeds.value=profile.accessibilityNeeds||"";
  fillSelect(controls.countryOfResidenceId,arr(references.countries),profile.countryOfResidenceId,row=>row.name);
  fillSelect(controls.preferredLanguageId,arr(references.languages),profile.preferredLanguageId,row=>row.name);
  fillSelect(controls.preferredDepartureAirportId,arr(references.airports),profile.preferredDepartureAirportId,row=>`${row.iata} · ${row.city||row.name}`);
}

function setFormStatus(form,message,bad=false){
  const status=form.querySelector(".form-status");
  status.hidden=!message;
  if(!status)return;
  status.textContent=message;
  status.classList.toggle("bad",bad);
}

async function saveAccountForm(event){
  event.preventDefault();
  const form=event.currentTarget;
  const button=form.querySelector('[type="submit"]');
  if(button.disabled)return;
  const editVersion=form.dataset.editVersion;
  const entries=[...new FormData(form)].filter(([key])=>!form.elements.namedItem(key)?.selectedOptions?.[0]?.disabled);
  const profile=Object.fromEntries(entries.map(([key,value])=>[key,String(value).trim()]));
  button.disabled=true;
  form.setAttribute("aria-busy","true");
  setFormStatus(form,"Saving…");
  try{
    const {result}=await request("MY_PROFILE_SAVE_PROFILE",{profile});
    if(!result?.ok||!result.profile)throw new Error("Your changes could not be confirmed.");
    state.data={...state.data,profile:result.profile};
    if(form.dataset.editVersion===editVersion)delete form.dataset.editVersion;
    renderHero();
    renderContact();
    renderSettings();
    post("SKANDI_MASTER_CONFIG_REQUEST");
    const success=form.id==="contactForm"?"Contact details saved.":"Travel preferences saved.";
    const supplierFailed=result.providerSync?.ok===false&&!result.providerSync.skipped;
    setFormStatus(form,supplierFailed?success+" Your travel supplier could not receive the update.":success);
  }catch(error){
    setFormStatus(form,error.message,true);
  }finally{
    button.disabled=false;
    form.removeAttribute("aria-busy");
  }
}

function renderEmailPreferences(result){
  if(!result?.ok)throw new Error("Your email preference could not be confirmed.");
  const current=state.emailPreferences;
  current.email=result.email||current.email;
  current.subscribed=result.subscribed===true;
  current.subscriptionStatus=result.subscriptionStatus;
  current.loaded=true;
  $("emailPreferencesAddress").textContent=current.email?`Applies to ${current.email}`:"Applies to your sign-in email";
  $("emailMarketingConsent").checked=current.subscribed;
  $("emailPreferencesStatus").textContent=current.subscriptionStatus==="PENDING"
    ? "Your subscription confirmation is pending."
    : current.subscribed?"Marketing emails are on.":"Marketing emails are off.";
}

async function loadEmailPreferences(force=false){
  const current=state.emailPreferences;
  if(current.loading||(!force&&current.loaded))return;
  current.loading=true;
  const toggle=$("emailMarketingConsent"),submit=$("saveEmailPreferences"),retry=$("retryEmailPreferences");
  toggle.disabled=true;
  submit.disabled=true;
  retry.hidden=true;
  $("emailPreferencesStatus").textContent="Checking your email preference…";
  try{
    const {result}=await request("MY_PROFILE_EMAIL_PREFERENCES_LOAD",{},READ_TIMEOUT_MS);
    renderEmailPreferences(result);
  }catch(error){
    current.loaded=false;
    $("emailPreferencesStatus").textContent=error.message;
    retry.hidden=false;
  }finally{
    current.loading=false;
    toggle.disabled=!current.loaded;
    submit.disabled=!current.loaded;
  }
}

async function saveEmailPreferences(event){
  event.preventDefault();
  const current=state.emailPreferences,toggle=$("emailMarketingConsent"),submit=$("saveEmailPreferences");
  const status=$("emailPreferencesStatus");
  if(!current.loaded||submit.disabled)return;
  const subscribed=toggle.checked;
  toggle.disabled=true;
  submit.disabled=true;
  status.textContent="Saving your email choice…";
  try{
    const {result}=await request("MY_PROFILE_EMAIL_PREFERENCES_SAVE",{subscribed,consentConfirmed:subscribed});
    renderEmailPreferences(result);
    status.textContent=result.accountSynced===false
      ? "Email choice saved. The account copy could not be updated."
      : "Email choice saved. "+status.textContent;
  }catch(error){
    status.textContent=error.message;
  }finally{
    toggle.disabled=false;
    submit.disabled=false;
  }
}

function renderAll(){
  renderHero();
  renderHome();
  renderOverview();
  renderRewards();
  renderTrips();
  renderClub();
  renderTravelers();
  renderDocuments();
  renderWallet();
  renderSaved();
  renderNotifications();
  renderContact();
  renderSettings();
  populateSupportForm();
  if(state.support.detail)$("supportDuffel").hidden=!tripForSupportCase(state.support.detail.case);
}

function setLoadState(message,{retry=false,signIn=false}={}){
  $("profileLoadState").hidden=false;
  $("profileLoadMessage").textContent=message;
  $("profileRetry").hidden=!retry;
  $("profileSignIn").hidden=!signIn;
  $("profileMasthead").hidden=true;
  $("profileStage").hidden=true;
}

function startProfile(){
  clearTimeout(startupTimer);
  bootstrapping=true;
  setLoadState("Loading your account…");
  startupTimer=setTimeout(()=>{
    bootstrapping=false;
    setLoadState("Your account is taking longer than expected to load.",{retry:true});
  },STARTUP_TIMEOUT_MS);
  post("MY_PROFILE_READY");
  post("SKANDI_MASTER_CONFIG_REQUEST");
}

function showLoadError(error){
  clearTimeout(startupTimer);
  bootstrapping=false;
  const signIn=error.code==="LOGIN_REQUIRED";
  setLoadState(signIn?"Sign in to view your SKANDI account.":error.message||"Your account could not be loaded.",
    {retry:!signIn,signIn});
}

function applyProfileData(data){
  const initial=!state.data;
  try{
    if(!data?.profile)throw new Error("Your account could not be loaded.");
    state.data=data;
    state.legacyDocuments=null;
    renderAll();
    clearTimeout(startupTimer);
    bootstrapping=false;
    $("profileLoadState").hidden=true;
    $("profileRefreshState").hidden=true;
    $("profileMasthead").hidden=false;
    $("profileStage").hidden=false;
    if(initial)setPage(data.requestedSection||"home",data.requestedView||"overview",false,data.requestedTripId||"");
  }catch(error){
    state.data=null;
    showLoadError({message:"Your account could not be displayed. Try again."});
    console.error("[My Profile] Could not render account data.",error);
  }
}

// Canonical member Support transport: the page controller calls customerSupport.web.js;
// this HTML only renders customer-safe results and sends explicit actions.
const supportCaseId=c=>String(c?.caseId||c?.case_id||c?.id||"");
const supportRef=c=>String(c?.caseRef||c?.case_ref||supportCaseId(c));
function supportStatus(msg,bad=false,id="supportStatus"){const el=$(id);if(el){el.textContent=String(msg||"");el.classList.toggle("support-case-error",bad)}}
function drawSupportCases(){const q=String($("supportSearch")?.value||"").toLowerCase().trim();const list=state.support.cases.filter(c=>!q||[supportRef(c),c.subject,c.category,c.status,c.bookingRef].join(" ").toLowerCase().includes(q));$("supportCases").innerHTML=list.length?list.map(c=>`<button class="support-case-item ${supportCaseId(c)===state.support.selectedCaseId?"active":""}" type="button" data-support-case="${esc(supportCaseId(c))}"><strong>${esc(c.subject||"Support request")}</strong><small>${esc(supportRef(c))} · ${esc(c.category||"General")} · ${esc(c.status||"Open")}</small></button>`).join(""):`<div class="support-case-status">${state.support.cases.length?"No matching cases.":"No support cases have been returned for this account."}</div>`}
function tripForSupportCase(supportCase){
  const reference=String(supportCase?.bookingRef||supportCase?.pnr||"").trim().toUpperCase();
  if(!reference)return null;
  const matches=trip=>[trip.bookingReference,trip.pnrLocator,trip.supplierBookingReference]
    .some(value=>String(value||"").trim().toUpperCase()===reference);
  const trips=state.data?.trips||{};
  const upcoming=[...arr(trips.active),...arr(trips.upcoming)].find(matches);
  if(upcoming)return {id:upcoming.id,view:"upcoming"};
  const past=arr(trips.history).find(matches);
  return past?{id:past.id,view:"past"}:null;
}

function drawSupportDetail(){
  const detail=state.support.detail||{};
  const supportCase=detail.case||{};
  const messages=arr(detail.messages).filter(message=>
    message.private!==true&&message.privateNote!==true&&message.kind!=="internal"&&
    String(message.channel||"").toLowerCase()!=="internal");
  $("supportThreadTitle").textContent=supportCase.subject||"Select a case";
  $("supportReplyForm").hidden=!supportCaseId(supportCase);
  $("supportDuffel").hidden=!tripForSupportCase(supportCase);
  $("supportMessages").innerHTML=messages.length?messages.map(message=>{
    const sender=String(message.senderType||message.sender_type||"").toLowerCase();
    const mine=["customer","member","user"].includes(sender);
    const name=message.senderName||message.sender_name||(mine?"You":"SKANDI Support");
    return `<div class="support-message ${mine?"mine":""}"><small>${esc(name)}</small>${esc(message.content||message.message||"")}</div>`;
  }).join(""):`<div class="support-case-status">${supportCaseId(supportCase)?"No messages yet.":"Select a case to view its messages."}</div>`;
  $("supportMessages").scrollTop=$("supportMessages").scrollHeight;
}

function populateSupportForm({updateWorkflows=false}={}){const p=state.data?.profile||{};const name=$("supportName"),mail=$("supportEmail");if(name&&!name.value)name.value=p.displayName||[p.firstName,p.lastName].filter(Boolean).join(" ");if(mail&&!mail.value)mail.value=p.email||"";const select=$("supportCategory");if(updateWorkflows&&select&&state.support.workflows.length){const chosen=select.value;select.innerHTML=state.support.workflows.filter(x=>x.key).map(x=>`<option value="${esc(x.key)}">${esc(x.title||x.key)}</option>`).join("");if([...select.options].some(o=>o.value===chosen))select.value=chosen;renderSupportRequirements()}}
function renderSupportRequirements(){const current=state.support.workflows.find(w=>w.key===$("supportCategory")?.value)||{};const root=$("supportDynamicFields");if(!root)return;const labels={flightAirline:"Operating airline",flightNumber:"Flight number",depAirport:"Departure airport",arrAirport:"Arrival airport",bagType:"Baggage type",bagColor:"Baggage color",bagBrand:"Baggage brand",pirNumber:"Baggage report reference (PIR)"};const fields=arr(current.requiredFields).filter(f=>!['subject','message','fullName','email','bookingRef'].includes(f));const markup=fields.map(f=>`<label>${esc(labels[f]||friendly(f))}<input name="${esc(f)}" maxlength="140" required></label>`).join('');root.innerHTML=(arr(current.topics).length?`<label>Request topic<select name="subCategory"><option value="">Select topic</option>${arr(current.topics).map(x=>`<option value="${esc(x.key)}">${esc(x.title)}</option>`).join('')}</select></label>`:'')+markup+(current.key==='baggage'?'<label>Was a baggage irregularity report filed?<select name="hasPir" id="supportHasPir"><option value="no">No</option><option value="yes">Yes</option></select></label><div id="supportPirField"></div>':'');$("supportHasPir")?.addEventListener("change",()=>{$("supportPirField").innerHTML=$("supportHasPir").value==='yes'?'<label>PIR reference<input name="pirNumber" maxlength="80" required></label>':''})}

async function loadSupport(force=false){
  const support=state.support;
  if(support.loading)return support.loading;
  if(support.loaded&&!force)return;
  supportStatus("Loading your support cases…");
  $("supportRefresh").disabled=true;
  support.loading=(async()=>{
    try{
      const {result}=await request("MY_PROFILE_SUPPORT_LOAD",{},READ_TIMEOUT_MS);
      if(!Array.isArray(result?.cases))throw new Error("Your support cases could not be loaded.");
      support.cases=result.cases;
      const workflows=arr(result.workflows);
      const changed=JSON.stringify(workflows)!==JSON.stringify(support.workflows);
      support.workflows=workflows;
      support.loaded=true;
      drawSupportCases();
      populateSupportForm({updateWorkflows:changed});
      supportStatus("");
      if(support.selectedCaseId)await openSupportCase(support.selectedCaseId);
    }catch(error){
      supportStatus(error.message,true);
      throw error;
    }finally{
      support.loading=null;
      $("supportRefresh").disabled=false;
      if($("tripCases"))$("tripCases").innerHTML=tripCasesMarkup();
    }
  })();
  return support.loading;
}

async function openSupportCase(caseId){
  const support=state.support;
  const revision=++support.activeRequest;
  if(support.selectedCaseId!==caseId)$("supportReplyText").value="";
  support.selectedCaseId=caseId;
  support.detail=null;
  drawSupportCases();
  drawSupportDetail();
  supportStatus("Opening case…");
  try{
    const {result}=await request("MY_PROFILE_SUPPORT_OPEN",{caseId},READ_TIMEOUT_MS);
    if(revision!==support.activeRequest)return;
    if(!supportCaseId(result?.case))throw new Error("The case could not be opened.");
    support.detail=result;
    drawSupportDetail();
    supportStatus("");
  }catch(error){
    if(revision===support.activeRequest)supportStatus(error.message,true);
  }
}

async function submitSupportCase(event){event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const button=form.querySelector('[type="submit"]');button.disabled=true;supportStatus("Submitting your request...",false,"supportFormStatus");try{const raw=Object.fromEntries(new FormData(form).entries());const fullName=String(raw.fullName||"").trim();const parts=fullName.split(/\s+/);const input={...raw,fullName,firstName:parts[0]||"",lastName:parts.slice(1).join(" "),source:"member-helpdesk",sourceChannel:"MEMBER_HELPDESK",sourcePage:"/my-profile",memberPriority:true,hasBooking:raw.bookingRef?"yes":"no"};const r=await request("MY_PROFILE_SUPPORT_CREATE",{input});const outcome=r.result||{};if(!outcome.ok||!outcome.caseId)throw Error("The server did not confirm case creation.");form.reset();populateSupportForm();renderSupportRequirements();state.support.loaded=false;state.support.selectedCaseId=String(outcome.caseId||"");state.support.detail=null;setPage("support","cases",true);toast(`Case submitted: ${outcome.caseRef||outcome.caseId}.`);await loadSupport(true).catch(()=>{})}catch(e){supportStatus(e.message,true,"supportFormStatus")}finally{button.disabled=false}}

let tripTarget="";
function findTrip(id){
  const trips=state.data?.trips||{};
  return [...arr(trips.active),...arr(trips.upcoming),...arr(trips.history)].find(item=>String(item.id)===String(id));
}

function openTrip(id,target=""){
  const trip=findTrip(id);
  if(!trip)return;
  state.tripBackView=arr(state.data?.trips?.history).some(item=>item.id===trip.id)?"past":"upcoming";
  tripTarget=target;
  const same=state.view==="detail"&&state.tripId===id;
  setPage("trips","detail",true,id);
  if(same&&state.bookingDetail){
    jumpToTripSection(tripTarget);
    tripTarget="";
  }
}

function jumpToTripSection(id){
  const section=$(id);
  if(!section||!$("bookingDetail").contains(section))return;
  const heading=section.querySelector("h3");
  heading?.focus({preventScroll:true});
  section.scrollIntoView({block:"start",behavior:"auto"});
}

async function loadBooking(id){
  if(!id)return;
  const revision=++activeBookingRequest;
  const trip=findTrip(id);
  state.tripBackView=arr(state.data?.trips?.history).some(item=>item.id===id)?"past":"upcoming";
  state.bookingDetail=null;
  $("tripPageTitle").textContent=trip?tripTitle(trip):"Trip details";
  $("tripPageMeta").textContent=trip?[dateRange(trip),trip.bookingReference].filter(Boolean).join(" · "):"";
  $("bookingDetail").innerHTML='<p class="profile-panel" role="status">Loading your itinerary…</p>';
  try{
    const {result}=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id},READ_TIMEOUT_MS);
    if(revision!==activeBookingRequest)return;
    if(!result?.booking)throw new Error("The trip could not be loaded.");
    state.bookingDetail=result;
    $("tripPageTitle").textContent=tripTitle(result.booking);
    $("tripPageMeta").textContent=[dateRange(result.booking),result.booking.bookingReference?`Booking ${result.booking.bookingReference}`:""].filter(Boolean).join(" · ");
    renderBookingDetail();
    if(tripTarget)jumpToTripSection(tripTarget);
    tripTarget="";
    void loadSupport().catch(()=>{});
  }catch(error){
    if(revision!==activeBookingRequest)return;
    $("bookingDetail").innerHTML=`<div class="profile-panel profile-empty"><h3>Trip unavailable</h3><p>${esc(error.message)}</p>
      <button class="btn soft" type="button" data-retry-trip>Try again</button></div>`;
  }
}

function documentLink(value){
  try{
    const url=new URL(value);
    return url.protocol==="https:"&&!url.username&&!url.password?url.href:"";
  }catch(_){
    return "";
  }
}

function showTripDocument(message,value){
  const status=$("bookingDocumentStatus");
  status.textContent=message;
  status.hidden=false;
  const url=documentLink(value);
  if(!url)return;
  const link=document.createElement("a");
  link.className="btn small primary";
  link.href=url;
  link.target="_blank";
  link.rel="noopener noreferrer";
  link.textContent="Open document";
  status.append(link);
}

async function showBookingDocument(button,action){
  const bookingRequest=activeBookingRequest;
  const documentId=button.dataset.openDoc||button.dataset.completeDoc;
  const requiresAction=action==="CUSTOMER_DOCUMENT_COMPLETE";
  button.disabled=true;
  showTripDocument("Opening document…");
  try{
    const result=await request(action,{documentId},READ_TIMEOUT_MS);
    if(bookingRequest!==activeBookingRequest)return;
    const doc=result.document;
    if(!doc?.id)throw new Error("The document could not be opened.");
    if(requiresAction&&!doc.bookingId){
      setPage("profile","travelers",true);
      toast("Review the requested information in Saved Travelers.");
      return;
    }
    const link=documentLink(doc.fileUrl);
    const message=link
      ? doc.definition_name||"Your document is ready."
      : requiresAction
        ? "Start a request below to complete this item with SKANDI Support."
        : "This document is not available to open yet.";
    showTripDocument(message,link);
    if(requiresAction&&!link&&state.bookingDetail?.booking){
      const action=document.createElement("button");
      action.className="btn small soft";
      action.type="button";
      action.dataset.tripHelp="documents";
      action.textContent="Get help with this document";
      $("bookingDocumentStatus").append(action);
    }
  }catch(error){
    if(bookingRequest===activeBookingRequest)showTripDocument(error.message);
  }finally{
    button.disabled=false;
  }
}

const TRIP_DAY_MS=86400000;

function localDay(timeZone,value=new Date()){
  try{
    const fields=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(value);
    const parts=Object.fromEntries(fields.map(field=>[field.type,field.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }catch(_){return ""}
}

function localDateTime(value,timeZone){
  if(!value)return "";
  const stamp=String(value);
  const local=/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(stamp);
  if(local)return `${date(local[1])} · ${local[2]}`;
  try{
    if(!timeZone)return date(stamp);
    return new Intl.DateTimeFormat(undefined,{timeZone,month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(stamp));
  }catch(_){return ""}
}

function tripDayDelta(value,timeZone){
  const currentDay=localDay(timeZone);
  const targetDay=calendarDate(value)||tripEventDay(value,timeZone);
  if(!currentDay||!targetDay)return Infinity;
  return (Date.parse(targetDay)-Date.parse(currentDay))/TRIP_DAY_MS;
}

function tripEventDay(value,timeZone){
  const stamp=String(value||"");
  if(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(stamp))return localDay(timeZone,new Date(stamp));
  return /^\d{4}-\d{2}-\d{2}/.test(stamp)?stamp.slice(0,10):"";
}

function airportName(place){
  if(!place)return "";
  const name=place.cityName||place.name||"";
  return [name,place.iataCode&&place.iataCode!==name?place.iataCode:""].filter(Boolean).join(" · ");
}

function stayAddress(stay){
  const address=stay?.accommodation?.address;
  return address?[address.lineOne,address.city,address.postalCode,address.countryCode].filter(Boolean).join(", "):"";
}

function itemState(status){
  const label=friendly(status);
  return label?label:"";
}

function itineraryItems(detail){
  const {air,stay,car}=detail.provider||{};
  const items=arr(air?.slices).flatMap(slice=>arr(slice.segments)).map(segment=>{
    const carrier=segment.marketingCarrier||segment.operatingCarrier;
    const flight=[carrier?.iataCode,segment.marketingFlightNumber||segment.operatingFlightNumber].filter(Boolean).join("");
    return {
      kind:"Flight", title:[airportName(segment.origin),airportName(segment.destination)].filter(Boolean).join(" → "),
      subtitle:[flight,carrier?.name].filter(Boolean).join(" · "),
      date:tripEventDay(segment.departingAt,segment.origin?.timeZone),
      scheduled:localDateTime(segment.departingAt,segment.origin?.timeZone),
      arrival:localDateTime(segment.arrivingAt,segment.destination?.timeZone),
      originTerminal:segment.originTerminal, destinationTerminal:segment.destinationTerminal,
      status:itemState(air.status), segment
    };
  });
  if(stay?.id)items.push({
    kind:"Hotel",title:stay.accommodation?.name||"Accommodation",subtitle:stayAddress(stay),
    date:stay.checkInDate,scheduled:stay.checkInDate?`Check in ${date(stay.checkInDate)}`:"",
    arrival:stay.checkOutDate?`Check out ${date(stay.checkOutDate)}`:"",status:itemState(stay.status)
  });
  if(car?.id)items.push({
    kind:"Car rental",title:car.supplier?.name||"Car rental",subtitle:car.pickupLocation?.name||"",
    date:car.pickupDate,scheduled:[car.pickupDate?`Pick up ${date(car.pickupDate)}`:"",car.pickupTime].filter(Boolean).join(" · "),
    arrival:[car.dropoffDate?`Return ${date(car.dropoffDate)}`:"",car.dropoffTime].filter(Boolean).join(" · "),status:itemState(car.status)
  });
  for(const item of arr(detail.booking.components)){
    const type=String(item.type||"").toUpperCase();
    if((air?.id&&type==="FLIGHT")||(stay?.id&&["HOTEL","STAY","ACCOMMODATION"].includes(type))||(car?.id&&["CAR","CAR_RENTAL"].includes(type)))continue;
    if(String(item.status||"").toUpperCase()==="REMOVED")continue;
    items.push({
      kind:friendly(item.type),title:item.title,subtitle:item.pickupLocation||item.address,
      date:item.serviceDate,
      scheduled:[item.serviceDate?date(item.serviceDate):"",item.serviceTime].filter(Boolean).join(" · "),
      arrival:item.dropoffLocation,status:itemState(item.status),component:item
    });
  }
  return items.sort((a,b)=>String(a.date||"9999").localeCompare(String(b.date||"9999")));
}

function stillAhead(segment){
  const stamp=String(segment?.departingAt||"");
  if(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(stamp))return Date.parse(stamp)>Date.now();
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:segment.origin?.timeZone, year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", hourCycle:"h23"
  }).formatToParts(new Date());
  const fields=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return stamp.replace(" ","T").slice(0,16)>`${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

function tripDayContent(detail,items){
  const {air,stay}=detail.provider||{};
  const flights=items.filter(item=>item.segment&&String(air?.status).toLowerCase()==="confirmed");
  const flight=flights.find(item=>{
    const zone=item.segment.origin?.timeZone;
    const offset=tripDayDelta(item.segment.departingAt,zone);
    if(offset>0&&offset<=1)return true;
    if(offset!==0)return false;
    try{return stillAhead(item.segment)}catch(_){return false}
  });
  const transfer=items.find(item=>item.component?.meetingPoint&&String(item.kind).toLowerCase().includes("transfer")&&
    ["confirmed","booked","active","ticketed","fulfilled"].includes(String(item.status).toLowerCase())&&
    tripDayDelta(item.date,item.component.timeZone)===0);
  const hotelToday=stay?.id&&String(stay.status).toLowerCase()==="confirmed"&&stay.checkInDate===localDay();
  if(!flight&&!transfer&&!hotelToday)return "";
  const airline=flight?.segment?.operatingCarrier||flight?.segment?.marketingCarrier;
  const airlineLink=documentLink(detail.airlineLinks?.[airline?.iataCode]?.website);
  const nextStop=flight?.segment?.destination;
  const transferData=transfer?.component;
  return `<section class="profile-panel trip-day" id="trip-day"><h3 tabindex="-1">Travel Day</h3>
    ${flight?`<div class="travel-day-block"><div><p class="profile-eyebrow">Your flight</p><h4>${esc(flight.title)}</h4>
      <p>${esc([flight.subtitle,flight.scheduled,flight.originTerminal?`Terminal ${flight.originTerminal}`:""].filter(Boolean).join(" · "))}</p>
      ${airline?.name?`<p>Check in with ${esc(airline.name)}.</p>`:""}
      ${flight.arrival?`<p>Arrives ${esc(flight.arrival)}${nextStop?.iataCode?` · ${esc(nextStop.iataCode)}`:""}</p>`:""}</div>
      ${airlineLink?`<a class="btn primary" href="${esc(airlineLink)}" target="_blank" rel="noopener noreferrer">Go to airline website</a>`:
        '<button class="btn soft" type="button" data-route="/travel-info">Airline travel information</button>'}</div>`:""}
    ${transferData?`<div class="travel-day-block"><div><p class="profile-eyebrow">Booked pickup</p><h4>${esc(transferData.title)}</h4>
      <p>${esc([transferData.serviceTime,transferData.meetingPoint].filter(Boolean).join(" · "))}</p>
      ${transferData.pickupInstructions?`<p>${esc(transferData.pickupInstructions)}</p>`:""}
      ${transferData.customerContact?`<p>Travel support · ${esc(transferData.customerContact)}</p>`:""}</div></div>`:""}
    ${hotelToday?`<div class="travel-day-block"><div><p class="profile-eyebrow">Hotel check-in</p>
      <h4>${esc(stay.accommodation?.name||"Accommodation")}</h4><p>${esc(stayAddress(stay))}</p></div></div>`:""}
    <p class="trip-note">Times are local to each airport or pickup location.</p></section>`;
}

function tripTimeline(items){
  if(!items.length)return '<p>Itinerary details will appear when they’re available.</p>';
  return `<ol class="profile-list trip-timeline">${items.map(item=>`<li>
    <p class="profile-eyebrow">${esc(item.kind)}${item.status&&item.status.toLowerCase()!=="confirmed"?` · ${esc(item.status)}`:""}</p>
    <h4>${esc(item.title)}</h4>
    ${item.subtitle?`<p>${esc(item.subtitle)}</p>`:""}
    ${item.scheduled?`<p><strong>${item.segment?"Departs ":""}${esc(item.scheduled)}</strong>${item.originTerminal?` · Terminal ${esc(item.originTerminal)}`:""}</p>`:""}
    ${item.arrival?`<p>${item.segment?"Arrives ":""}${esc(item.arrival)}${item.destinationTerminal?` · Terminal ${esc(item.destinationTerminal)}`:""}</p>`:""}
    ${item.component?.meetingPoint?`<p>Meet at ${esc(item.component.meetingPoint)}</p>`:""}
    ${item.component?.pickupInstructions?`<p>${esc(item.component.pickupInstructions)}</p>`:""}
    ${item.component?.customerContact?`<p>Travel support · ${esc(item.component.customerContact)}</p>`:""}
  </li>`).join("")}</ol>`;
}

function tripDocuments(detail){
  const bookingId=detail.booking.id;
  const docs=docsForBooking(bookingId);
  const required=docs.filter(isActionDoc);
  const available=docs.filter(doc=>["ISSUED","SENT","ACKNOWLEDGED","READY","ACTIVE"].includes(String(doc.status).toUpperCase()));
  const tickets=arr(detail.provider?.air?.documents).filter(doc=>doc.uniqueIdentifier);
  const rows=(items,action)=>items.map(doc=>`<li class="trip-file">
    <div><strong>${esc(doc.definition_name||"Travel document")}</strong>${doc.dueAt?`<p>Due ${esc(date(doc.dueAt))}</p>`:""}</div>
    <button class="btn small soft" type="button" data-${action?"complete":"open"}-doc="${esc(doc.id)}">${action?"Review":"Open"} <span class="visually-hidden">${esc(doc.definition_name||"document")}</span></button>
  </li>`).join("");
  return `<section class="profile-panel" id="trip-documents"><h3 tabindex="-1">Documents &amp; receipts</h3>
    <div id="bookingDocumentStatus" class="trip-file-status" role="status" hidden></div>
    ${required.length?`<h4>Before you travel</h4><ul class="profile-list trip-files">${rows(required,true)}</ul>`:""}
    ${available.length?`<ul class="profile-list trip-files">${rows(available,false)}</ul>`:""}
    ${tickets.length?`<h4>Airline ticket numbers</h4><ul class="profile-list trip-files">${tickets.map(ticket=>`<li class="trip-file"><strong>${esc(friendly(ticket.type)||"Airline ticket")}</strong><span>${esc(ticket.uniqueIdentifier)}</span></li>`).join("")}</ul>`:""}
    ${required.length||available.length||tickets.length?"":"<p>Travel documents and receipts will appear here when they’re issued.</p>"}</section>`;
}

function tripManageContent(detail){
  const {booking,capabilities:cap={},airlineChanges}=detail;
  const {air,stay}=detail.provider||{};
  const actions=[
    [cap.flightChange,"flight-change","Change flight"],
    [cap.flightCancel,"flight-cancel","Get cancellation quote"],
    [cap.postBookingBaggage,"baggage","Review baggage options"],
    [cap.stayCancel,"stay-cancel","Review hotel cancellation"],
    [cap.carCancel,"car-cancel","Review car cancellation"]
  ].filter(item=>item[0]);
  const changes=arr(airlineChanges).filter(change=>!change.actionTaken);
  const cancellation=String(air?.status||"").toLowerCase()==="cancelled";
  const paymentDeadline=air?.paymentStatus?.awaiting_payment===true?air.paymentRequiredBy:booking.paymentDueAt;
  const dueAtHotel=Number(stay?.dueAtAccommodationAmount)>0?money(stay.dueAtAccommodationAmount,stay.dueAtAccommodationCurrency):"";
  const [total,payment]=[money(booking.totalAmount,booking.currency),friendly(booking.paymentStatus)];
  return `<section class="profile-panel" id="trip-manage"><h3 tabindex="-1">Manage booking</h3>
    ${total||payment?`<dl class="trip-facts">${total?`<div><dt>Booking total</dt><dd>${esc(total)}</dd></div>`:""}
      ${payment?`<div><dt>Payment status</dt><dd>${esc(payment)}</dd></div>`:""}</dl>`:""}
    ${paymentDeadline?`<p>Payment deadline · ${esc(date(paymentDeadline))}</p>`:""}
    ${dueAtHotel?`<p>Due at accommodation · ${esc(dueAtHotel)}</p>`:""}
    ${cancellation?'<p>The airline has confirmed the cancellation. For customer refund status, check your trip support requests.</p>':""}
    ${changes.length?`<ul class="profile-list trip-files">${changes.map(change=>`<li class="trip-file">
      <div><strong>Airline schedule change</strong><p>${esc(date(change.updatedAt||change.createdAt))}</p></div>
      ${arr(change.availableActions).includes("accept")?`<button class="btn small soft" type="button" data-review-airline-change="${esc(change.id)}">Review</button>`:""}
    </li>`).join("")}</ul>`:""}
    ${actions.length?`<div class="button-row">${actions.map(([,key,label])=>`<button class="btn soft" type="button" data-manage="${key}">${label}</button>`).join("")}</div>`:""}
    <button class="text-action" type="button" data-trip-help="changes">Ask about payments, changes or refunds →</button>
  </section>`;
}

function tripCasesMarkup(){
  const booking=state.bookingDetail?.booking;
  if(!booking)return "";
  const related=state.support.cases.filter(item=>tripForSupportCase(item)?.id===booking.id);
  if(!state.support.loaded){
    return state.support.loading?'<p role="status">Looking up trip requests…</p>':'<button class="text-action" type="button" data-retry-trip-cases>Check for trip requests</button>';
  }
  return related.length?`<ul class="profile-list trip-files">${related.map(item=>`<li class="trip-file"><div>
    <strong>${esc(item.subject||"Support request")}</strong><p>${esc([supportRef(item),friendly(item.status),date(item.updatedAt)].filter(Boolean).join(" · "))}</p></div>
    <button class="btn small soft" type="button" data-trip-case="${esc(supportCaseId(item))}">Read request</button>
  </li>`).join("")}</ul>`:"";
}

function renderBookingDetail(){
  if(!state.bookingDetail?.booking)return;
  const detail=state.bookingDetail;
  const items=itineraryItems(detail);
  const travelDay=tripDayContent(detail,items);
  const calendar=calendarDate(detail.booking.departureDate);
  const tasks=preparationTasks({
    ...detail.booking,
    paymentDueAt:detail.provider?.air?.paymentStatus?.awaiting_payment===true?detail.provider.air.paymentRequiredBy:detail.booking.paymentDueAt,
    actionableScheduleChanges:arr(detail.airlineChanges).filter(change=>!change.actionTaken&&arr(change.availableActions).includes("accept")).length
  });
  const checklist=tasks.length?`<section class="profile-panel" id="trip-preparation"><h3 tabindex="-1">Before you travel</h3>
    <ul class="profile-list trip-files">${tasks.map(item=>`<li class="trip-file"><div><strong>${esc(item.title)}</strong>
      ${item.deadline?`<p>Due ${esc(date(item.deadline))}</p>`:""}</div>
      <button class="btn small soft" type="button" data-trip-jump="${esc(item.target)}">Review</button></li>`).join("")}</ul></section>`:"";
  $("bookingDetail").innerHTML=`<nav class="profile-shortcuts trip-detail-nav" aria-label="In this trip">
      ${travelDay?'<button class="btn soft" type="button" data-trip-jump="trip-day">Travel Day</button>':""}
      <button class="btn soft" type="button" data-trip-jump="trip-itinerary">Itinerary</button>
      <button class="btn soft" type="button" data-trip-jump="trip-documents">Documents</button>
      <button class="btn soft" type="button" data-trip-jump="trip-manage">Manage</button>
      <button class="btn soft" type="button" data-trip-jump="trip-support">Help</button>
    </nav>
    ${travelDay}
    ${checklist}
    <section class="profile-panel" id="trip-itinerary"><h3 tabindex="-1">Itinerary</h3>
      ${arr(detail.provider?.errors).length?'<p class="trip-note">Some supplier details couldn’t be refreshed. Try again for the latest itinerary.</p><button class="text-action" type="button" data-retry-trip>Refresh itinerary</button>':""}
      ${tripTimeline(items)}
      ${items.length||calendar?`<div class="button-row">${items.length?'<button class="btn soft" type="button" data-trip-download="itinerary">Download itinerary</button>':""}
        ${calendar?'<button class="btn soft" type="button" data-trip-download="calendar">Add dates to calendar</button>':""}</div>`:""}
    </section>
    ${tripDocuments(detail)}
    ${tripManageContent(detail)}
    <section class="profile-panel" id="trip-support"><h3 tabindex="-1">Trip help</h3>
      <div id="tripCases">${tripCasesMarkup()}</div>
      <div class="button-row">
        <button class="btn primary" type="button" data-trip-help="general">Start a request</button>
        <button class="btn soft" type="button" data-trip-assistant>Ask Alexandra</button>
      </div>
    </section>`;
}

function calendarDate(value){
  const date=String(value||"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return "";
  const stamp=Date.parse(date);
  return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===date?date:"";
}

function tripCalendar(booking){
  const start=calendarDate(booking.departureDate);
  const end=calendarDate(booking.returnDate)||start;
  if(!start||end<start)return "";
  const nextDay=new Date(Date.parse(end)+TRIP_DAY_MS).toISOString().slice(0,10);
  const key=String(booking.id||"").replace(/[^a-z0-9-]/gi,"");
  const text=value=>String(value).replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/[,;]/g,"\\$&");
  function fold(line){
    const encoder=new TextEncoder();
    let bytes=0;
    let result="";
    for(const character of line){
      const length=encoder.encode(character).length;
      if(bytes+length>75){result+="\r\n ";bytes=1}
      result+=character;
      bytes+=length;
    }
    return result;
  }
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SKANDI TRAVELS//My SKANDI//EN","BEGIN:VEVENT",
    `UID:${key}@skanditravels.com`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z$/,"Z")}`,
    `DTSTART;VALUE=DATE:${start.replaceAll("-","")}`,`DTEND;VALUE=DATE:${nextDay.replaceAll("-","")}`,
    `SUMMARY:${text(tripTitle(booking))}`,"CLASS:PRIVATE","DESCRIPTION:Open My SKANDI for the current itinerary.","TRANSP:TRANSPARENT",
    "END:VEVENT","END:VCALENDAR",""].map(fold).join("\r\n");
}

function downloadTrip(kind){
  const detail=state.bookingDetail;
  if(!detail?.booking)return;
  const booking=detail.booking;
  const items=itineraryItems(detail);
  const calendar=kind==="calendar";
  const content=calendar?tripCalendar(booking):
    [tripTitle(booking),dateRange(booking),"Times are local to each airport or pickup location.",
      ...items.map(item=>["",item.kind,item.title,item.subtitle,item.scheduled,item.arrival,item.component?.meetingPoint].filter(Boolean).join(" · "))
    ].filter(Boolean).join("\n\n");
  if(!content)return;
  const file=new Blob([content],{type:calendar?"text/calendar;charset=utf-8":"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(file);
  const link=document.createElement("a");
  link.href=url;
  link.download=calendar?"SKANDI-trip.ics":"SKANDI-itinerary.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

function beginTripRequest(booking,topic,message=""){
  const form=$("supportNewForm");
  if(!booking)return;
  closeModal();
  form.reset();
  populateSupportForm();
  form.elements.bookingRef.value=booking.bookingReference||"";
  const titles={documents:"Help with my travel documents",changes:"A payment, change or refund question",points:"Missing points from a trip",baggage:"Add baggage to my flight"};
  form.elements.subject.value=titles[topic]||"Help with my trip";
  form.elements.message.value=message;
  setPage("support","new",true);
  form.elements.message.focus();
}

function missingPoints(){
  const trips=arr(state.data?.trips?.history).filter(booking=>
    booking.bookingReference&&booking.departureDate&&booking.departureDate<localDay()&&
    ["confirmed","completed","ticketed","fulfilled"].includes(String(booking.status).toLowerCase()));
  openModal("Review missing points",trips.length?`<label class="field">Completed trip<select class="control" id="missingPointsTrip">
    ${trips.map(booking=>`<option value="${esc(booking.id)}">${esc([tripTitle(booking),dateRange(booking),booking.bookingReference].filter(Boolean).join(" · "))}</option>`).join("")}
    </select></label>`:'<p>A completed booking is needed. Link the booking in Trips to request a review.</p>',
    trips.length?'<button class="btn primary" type="button" data-start-points-request>Continue to request</button>':
      '<button class="btn soft" type="button" data-link-booking>Link a booking</button>');
}

let modalOpener=null;
function openModal(title,body,foot=""){
  const shade=$("modalShade");
  if(!shade.classList.contains("open"))modalOpener=document.activeElement;
  $("modalTitle").textContent=title;
  $("modalBody").innerHTML=body;
  $("modalFoot").innerHTML=foot;
  shade.classList.add("open");
  $("profileMasthead").inert=true;
  $("profileStage").inert=true;
  $("closeModal").focus();
}

function closeModal(){
  const shade=$("modalShade");
  if(!shade.classList.contains("open"))return;
  shade.classList.remove("open");
  $("profileMasthead").inert=false;
  $("profileStage").inert=false;
  state.elements=null;
  state.payment=null;
  modalOpener?.focus?.();
  modalOpener=null;
}

function linkBookingModal(){openModal("Link a booking",`<div class="provider-note">Use the booking reference and traveler surname exactly as shown on the confirmation. This verifies ownership before the booking is added to My Trips.</div><form id="linkBookingForm" class="profile-form" style="margin-top:16px"><div class="field"><label>Booking reference</label><input class="control" name="bookingReference" required maxlength="120" autocomplete="off" placeholder="Booking reference"></div><div class="field"><label>Traveler surname</label><input class="control" name="lastName" required maxlength="160" autocomplete="family-name" placeholder="Surname"></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmLinkBooking" type="submit" form="linkBookingForm">Link booking</button>`)}
function travelerModal(t={}){const refs=state.data?.references||{};openModal(t.id?"Edit traveler":"Add traveler",`<form id="travelerForm" class="profile-form"><input type="hidden" name="id" value="${esc(t.id||"")}"><div class="field"><label>First name</label><input class="control" name="firstName" required value="${esc(t.firstName||"")}"></div><div class="field"><label>Last name</label><input class="control" name="lastName" required value="${esc(t.lastName||"")}"></div><div class="field"><label>Date of birth</label><input class="control" type="date" name="dateOfBirth" value="${esc(t.dateOfBirth||"")}"></div><div class="field"><label>Gender</label><select class="control" name="gender"><option value="">Select</option><option value="female" ${lowerEq(t.gender,"female")}>Female</option><option value="male" ${lowerEq(t.gender,"male")}>Male</option><option value="unspecified" ${lowerEq(t.gender,"unspecified")}>Unspecified</option></select></div><div class="field"><label>Nationality</label><select class="control" name="nationalityId"><option value="">Select</option>${arr(refs.countries).map(x=>`<option value="${esc(x.id)}" ${x.id===t.nationalityId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div><div class="field"><label>Contact email</label><input class="control" type="email" name="email" value="${esc(t.email||"")}"></div><div class="field"><label>Phone</label><input class="control" name="phone" value="${esc(t.phone||"")}"></div><div class="field"><label>Passport expiry</label><input class="control" type="date" name="passportExpiry" value="${esc(t.passportExpiry||"")}"></div><div class="field full"><label>Dietary preferences</label><input class="control" name="dietaryPrefs" value="${esc(t.dietaryPrefs||"")}"></div><div class="field full"><label>Accessibility needs</label><textarea class="control" name="accessibilityNeeds">${esc(t.accessibilityNeeds||"")}</textarea></div><div class="field full"><label class="checkbox"><input type="checkbox" name="isPrimary" ${t.isPrimary?"checked":""}><span>Use as primary traveler profile.</span></label></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="saveTravelerModal" type="submit" form="travelerForm">Save traveler</button>`)}function lowerEq(a,b){return String(a||"").toLowerCase()===b?"selected":""}
async function manage(kind){
  const detail=state.bookingDetail;
  const booking=detail?.booking;
  if(!booking)return;
  if(kind==="flight-change"){flightChangeModal();return}
  if(kind==="baggage"){await baggageModal();return}
  if(kind==="stay-cancel"||kind==="car-cancel"){
    const stay=kind==="stay-cancel";
    const policies=stay?arr(detail.provider?.stay?.cancellationTimeline):[];
    const refundRows=policies.map(policy=>({
      starts:policy.start,
      refund:money(policy.refund_amount,policy.currency||detail.provider?.stay?.totalCurrency)
    })).filter(policy=>policy.starts&&policy.refund);
    const policy=refundRows.length?`<ul class="profile-list trip-files">${refundRows.map(term=>`<li class="trip-file"><span>From ${esc(date(term.starts))}</span><strong>${esc(term.refund)} refund</strong></li>`).join("")}</ul>`:"";
    openModal(stay?"Hotel cancellation":"Car rental cancellation",
      `${policy}<p>Ask SKANDI to confirm the cancellation terms and any refund for your booking.</p>`,
      '<button class="btn soft" type="button" data-close-modal>Keep booking</button><button class="btn primary" type="button" data-trip-help="changes">Start cancellation request</button>');
    return;
  }
  if(kind!=="flight-cancel")return;
  busy(true);
  try{
    const {result}=await request("MY_PROFILE_FLIGHT_CANCEL_QUOTE",{bookingId:booking.id});
    if(state.bookingDetail?.booking?.id!==booking.id)return;
    const quote=result?.cancellation;
    if(!quote?.id)throw new Error("The airline could not provide a cancellation quote.");
    const value=money(quote.refundAmount,quote.refundCurrency);
    const canDirect=value&&Number(quote.refundAmount)===0&&quote.expiresAt&&Date.parse(quote.expiresAt)>Date.now();
    openModal("Airline cancellation quote",
      `<p>${value?`Airline refund · <strong>${esc(value)}</strong>`:"The airline didn’t provide a refund amount."}</p>
        ${quote.expiresAt?`<p>Quote expires ${esc(localDateTime(quote.expiresAt,Intl.DateTimeFormat().resolvedOptions().timeZone))}.</p>`:""}`,
      `<button class="btn soft" type="button" data-close-modal>Keep booking</button>
        ${canDirect?`<button class="btn danger" type="button" data-confirm-cancel="${esc(quote.id)}">Confirm cancellation</button>`:'<button class="btn primary" type="button" data-trip-help="changes">Request cancellation with support</button>'}`);
  }catch(error){toast(error.message,true)}finally{busy(false)}
}

function reviewAirlineChange(id){
  const change=arr(state.bookingDetail?.airlineChanges).find(item=>item.id===id);
  if(!change||!arr(change.availableActions).includes("accept"))return;
  const newSegments=arr(change.slices?.add).flatMap(slice=>arr(slice.segments));
  const details=newSegments.map(segment=>`<li>${esc([airportName(segment.origin),airportName(segment.destination)].filter(Boolean).join(" → "))} · ${esc(localDateTime(segment.departingAt,segment.origin?.timeZone))}</li>`);
  openModal("Airline schedule change",
    details.length?`<p>Review the airline’s proposed itinerary.</p><ul>${details.join("")}</ul>`:'<p>Ask SKANDI for the revised itinerary before accepting.</p>',
    `<button class="btn soft" type="button" data-close-modal>Back</button>${details.length?`<button class="btn primary" type="button" data-accept-airline-change="${esc(id)}">Accept new itinerary</button>`:'<button class="btn primary" type="button" data-trip-help="changes">Get help with this change</button>'}`);
}

function flightChangeModal(){const air=state.bookingDetail?.provider?.air,slices=arr(air?.slices);openModal("Change flight",`<form id="changeSearchForm" class="profile-form"><div class="field full"><label>Flight to change</label><select class="control" name="removeSliceId">${slices.map(s=>`<option value="${esc(s.id)}">${esc(s.origin?.iataCode||"")} → ${esc(s.destination?.iataCode||"")}</option>`).join("")}</select></div><div class="field"><label>Origin</label><input class="control" name="origin" maxlength="3" value="${esc(slices[0]?.origin?.iataCode||"")}"></div><div class="field"><label>Destination</label><input class="control" name="destination" maxlength="3" value="${esc(slices[0]?.destination?.iataCode||"")}"></div><div class="field"><label>New departure date</label><input class="control" type="date" name="departureDate" min="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Cabin</label><select class="control" name="cabinClass"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div></form><div id="changeOffers"></div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="searchChangesBtn">Search changes</button>`)}
async function searchChanges(){
  const form=$("changeSearchForm"),booking=state.bookingDetail?.booking;
  if(!booking||!form?.reportValidity())return;
  busy(true);
  try{
    const {result}=await request("MY_PROFILE_FLIGHT_CHANGE_SEARCH",{
      bookingId:booking.id,removeSliceId:form.removeSliceId.value,
      addSlice:{origin:form.origin.value.toUpperCase(),destination:form.destination.value.toUpperCase(),departureDate:form.departureDate.value,cabinClass:form.cabinClass.value}
    });
    const root=$("changeOffers");
    if(!root||state.bookingDetail?.booking?.id!==booking.id)return;
    const offers=arr(result?.offers).filter(offer=>offer.id&&money(offer.changeTotalAmount,offer.changeTotalCurrency));
    root.innerHTML=offers.length?`<h4>Available alternatives</h4><ul class="profile-list trip-files">${offers.map(offer=>{
      const slice=arr(offer.slices?.add)[0];
      const price=money(offer.changeTotalAmount,offer.changeTotalCurrency);
      const penalty=money(offer.penaltyTotalAmount,offer.penaltyTotalCurrency);
      return `<li class="trip-file"><div>
        <strong>${esc([airportName(slice?.origin),airportName(slice?.destination)].filter(Boolean).join(" → "))}</strong>
        <p>Change total ${esc(price)}${penalty?` · Penalty ${esc(penalty)}`:""}</p></div>
        <button class="btn small soft" type="button" data-select-change="${esc(offer.id)}" data-change-request="${esc(result.changeRequestId)}">Review</button>
      </li>`;
    }).join("")}</ul>`:empty("No alternatives found","Try different dates or contact SKANDI for help.","plane");
  }catch(error){toast(error.message,true)}finally{busy(false)}
}

async function selectChange(button){
  const booking=state.bookingDetail?.booking;
  if(!booking)return;
  busy(true);
  try{
    const {result}=await request("MY_PROFILE_FLIGHT_CHANGE_SELECT",{
      bookingId:booking.id,orderChangeOfferId:button.dataset.selectChange,orderChangeRequestId:button.dataset.changeRequest
    });
    if(state.bookingDetail?.booking?.id!==booking.id)return;
    const change=result?.change,amount=money(change?.changeTotalAmount,change?.changeTotalCurrency);
    if(!change?.id||result.reconciliationRequired||!amount)throw new Error("SKANDI couldn’t confirm the change quote. Ask support to review it.");
    if(Number(change.changeTotalAmount)<0){
      openModal("Review a flight change",`<p>Airline refund · <strong>${esc(amount.replace(/^-/,""))}</strong></p>`,
        '<button class="btn soft" type="button" data-close-modal>Keep booking</button><button class="btn primary" type="button" data-trip-help="changes">Request change with support</button>');
      return;
    }
    const {result:prepared}=await request("MY_PROFILE_FLIGHT_CHANGE_PREPARE_PAYMENT",{bookingId:booking.id,orderChangeId:change.id});
    if(!prepared?.ok)throw new Error("SKANDI couldn’t confirm the change quote.");
    if(prepared.paymentRequired){openPayment({bookingId:booking.id,orderChangeId:change.id,prepared});return}
    openModal("Review a flight change",`<p>Additional charge · <strong>${esc(amount)}</strong></p>`,
      `<button class="btn soft" type="button" data-close-modal>Keep booking</button>
        <button class="btn primary" type="button" data-confirm-free-change="${esc(change.id)}">Confirm flight change</button>`);
  }catch(error){toast(error.message,true)}finally{busy(false)}
}

function baggageOptions(){
  const detail=state.bookingDetail;
  const options=arr(detail?.baggage).filter(item=>money(item.totalAmount,item.totalCurrency));
  const passengers=arr(detail?.provider?.air?.passengers);
  const flights=itineraryItems(detail).filter(item=>item.segment);
  return options.map(option=>{
    const travelers=arr(option.passengerIds).map(id=>passengers.findIndex(person=>person.id===id)+1).filter(Boolean);
    const segments=flights.filter(flight=>arr(option.segmentIds).includes(flight.segment.id)).map(flight=>flight.title);
    return {...option,details:[travelers.length?`Traveler ${travelers.join(", ")}`:"",...segments].filter(Boolean).join(" · ")};
  });
}

function baggageModal(){
  const options=baggageOptions();
  if(!options.length){
    openModal("Baggage options",'<p>Your airline hasn’t supplied priced baggage options for this trip.</p>',
      '<button class="btn soft" type="button" data-close-modal>Close</button><button class="btn primary" type="button" data-trip-help="baggage">Start a request</button>');
    return;
  }
  openModal("Review baggage options",
    `<p>Choose the items you’d like SKANDI to add to your booking.</p><ul class="profile-list trip-files">${options.map(item=>`<li class="trip-file">
      <label><input type="checkbox" value="${esc(item.id)}" data-baggage-option> ${esc(item.label)}${item.details?`<p>${esc(item.details)}</p>`:""}</label>
      <strong>${esc(money(item.totalAmount,item.totalCurrency))}</strong>
    </li>`).join("")}</ul>`,
    '<button class="btn soft" type="button" data-close-modal>Close</button><button class="btn primary" type="button" data-request-baggage>Start baggage request</button>');
}

function requestBaggage(){
  const selected=new Set([...$("modalBody").querySelectorAll("[data-baggage-option]:checked")].map(input=>input.value));
  const options=baggageOptions().filter(item=>selected.has(item.id));
  if(!options.length){toast("Choose at least one baggage option.",true);return}
  const details=options.map(item=>[item.label,item.details,money(item.totalAmount,item.totalCurrency)].filter(Boolean).join(" · "));
  beginTripRequest(state.bookingDetail?.booking,"baggage",["Please review adding these baggage options to my booking.",...details].join("\n"));
}

function openPayment(flow){
  const payment=flow.prepared?.payment;
  const value=money(payment?.amount,payment?.currency);
  if(!payment?.clientSecret||!payment?.publishableKey||!value||!window.Stripe)throw new Error("Secure payment is temporarily unavailable.");
  state.payment=flow;
  openModal("Flight change payment",`<p>Amount to authorize · <strong>${esc(value)}</strong></p>
    <p>Payment is captured after the airline confirms the change.</p><div class="stripe-box" id="paymentElement"></div>
    <p id="paymentError" role="alert"></p>`,
    '<button class="btn soft" type="button" data-close-modal>Cancel</button><button class="btn primary" type="button" id="confirmPaymentBtn">Authorize and confirm change</button>');
  state.stripe=Stripe(payment.publishableKey);
  state.elements=state.stripe.elements({clientSecret:payment.clientSecret,appearance:{theme:"stripe",variables:{colorPrimary:"#022e64",fontFamily:"Inter, sans-serif",borderRadius:"10px"}}});
  state.elements.create("payment").mount("#paymentElement");
}

async function completeFlightChange(bookingId,orderChangeId,paymentIntentId){
  const {result}=await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId,orderChangeId,paymentIntentId});
  if(!result?.change?.confirmedAt||result.reconciliationRequired){
    closeModal();
    toast("Confirmation is pending. Check your trip or contact SKANDI before trying again.",true);
  }else{
    closeModal();
    toast("Flight change confirmed.");
  }
  await refreshBooking();
}

async function confirmPayment(button){
  const flow=state.payment;
  if(!flow||!state.stripe||!state.elements||button.disabled)return;
  button.disabled=true;
  busy(true);
  try{
    const result=await state.stripe.confirmPayment({elements:state.elements,redirect:"if_required"});
    if(result.error)throw new Error(result.error.message||"Payment authorization failed.");
    await completeFlightChange(flow.bookingId,flow.orderChangeId,result.paymentIntent?.id||flow.prepared.payment.paymentIntentId);
  }catch(error){
    if($("paymentError"))$("paymentError").textContent=error.message;
    toast(error.message,true);
  }finally{button.disabled=false;busy(false)}
}

async function confirmTripOption(button,type,payload,confirmed,message){
  const booking=state.bookingDetail?.booking;
  if(!booking||button.disabled)return;
  button.disabled=true;
  busy(true);
  try{
    const {result}=await request(type,{bookingId:booking.id,...payload});
    closeModal();
    toast(confirmed(result)?message:"Confirmation is pending. Check your trip or contact SKANDI before trying again.",!confirmed(result));
    await refreshBooking();
  }catch(error){toast(error.message,true)}finally{button.disabled=false;busy(false)}
}
async function refreshBooking(){
  if(state.view==="detail"&&state.tripId)await loadBooking(state.tripId);
}
async function refresh(){
  const banner=$("profileRefreshState");
  banner.hidden=false;
  state.previewTrip=null;
  banner.textContent="Refreshing your account…";
  try{
    await request("MY_PROFILE_REFRESH",{},READ_TIMEOUT_MS);
  }catch(error){
    showRefreshError(error.message);
  }
}

function showRefreshError(message){
  const banner=$("profileRefreshState");
  banner.textContent=message||"The account could not refresh.";
  banner.hidden=false;
  const retry=document.createElement("button");
  retry.type="button";
  retry.className="btn small";
  retry.id="profileRefreshRetry";
  retry.textContent="Refresh account";
  banner.append(retry);
}

async function changeProfileItem(button,type,payload,success){
  button.disabled=true;
  try{
    const {result}=await request(type,payload);
    if(!result?.ok)throw new Error("This change could not be confirmed.");
    if(success)toast(success);
    return true;
  }catch(error){
    button.disabled=false;
    toast(error.message,true);
    return false;
  }
}

function removeTraveler(travelerId){
  openModal("Remove traveler","<p>This traveler will be removed from Saved Travelers.</p>",
    `<button class="btn soft" data-close-modal>Cancel</button><button class="btn danger" data-confirm-remove-traveler="${esc(travelerId)}">Remove traveler</button>`);
}

async function submitBookingOrTraveler(event){
  const form=event.target;
  const linking=form.id==="linkBookingForm";
  if(!linking&&form.id!=="travelerForm")return;
  event.preventDefault();
  const button=$(linking?"confirmLinkBooking":"saveTravelerModal");
  if(button.disabled||!form.reportValidity())return;
  const data=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,String(value).trim()]));
  if(!data.lastName||(!linking&&!data.firstName)||(linking&&!data.bookingReference)){
    toast(linking?"Enter the booking reference and traveler surname.":"Enter the traveler’s first and last names.",true);
    return;
  }
  if(!linking)data.isPrimary=data.isPrimary==="on";
  button.disabled=true;
  try{
    const response=linking
      ? await request("MY_PROFILE_LINK_BOOKING",data)
      : await request("MY_PROFILE_SAVE_TRAVELER",{traveler:data});
    const confirmed=linking?response.result?.linked:response.result?.traveler?.id;
    if(!response.result?.ok||!confirmed)throw new Error("This change could not be confirmed.");
    closeModal();
    if(linking){
      const departure=String(response.result.booking?.departureDate||"");
      const isUpcoming=departure>=new Date().toISOString().slice(0,10)&&
        String(response.result.booking?.status||"").toUpperCase()!=="CANCELLED";
      setPage("trips",isUpcoming?"upcoming":"past",true);
    }
    toast(linking?"Booking linked.":"Traveler saved.");
  }catch(error){
    toast(error.message,true);
  }finally{
    button.disabled=false;
  }
}

document.addEventListener("click",async e=>{
  const page=e.target.closest("[data-section][data-view]");
  if(page){closeModal();setPage(page.dataset.section,page.dataset.view,true);return}
  const supportCase=e.target.closest("[data-support-case]");
  if(supportCase){void openSupportCase(supportCase.dataset.supportCase);return}
  if(e.target.id==="supportRefresh"){void loadSupport(true).catch(()=>{});return}
  if(e.target.id==="supportDuffel"){
    const trip=tripForSupportCase(state.support.detail?.case);
    if(trip)openTrip(trip.id,"trip-support");
    return;
  }
  if(e.target.closest("[data-link-booking]")){linkBookingModal();return}
  if(e.target.id==="backToTrips"){setPage("trips",state.tripBackView,true);return}
  if(e.target.closest("[data-retry-trip]")){void loadBooking(state.tripId);return}
  if(e.target.closest("[data-retry-rewards]")){void loadRewards(true);return}
  if(e.target.closest("[data-missing-points]")){missingPoints();return}
  if(e.target.closest("[data-start-points-request]")){beginTripRequest(findTrip($("missingPointsTrip")?.value),"points");return}
  if(e.target.closest("[data-trip-assistant]")){post("MY_PROFILE_OPEN_ALEXANDRA");return}
  const tripJump=e.target.closest("[data-trip-jump]");
  if(tripJump){jumpToTripSection(tripJump.dataset.tripJump);return}
  const tripFile=e.target.closest("[data-trip-download]");
  if(tripFile){downloadTrip(tripFile.dataset.tripDownload);return}
  const tripHelp=e.target.closest("[data-trip-help]");
  if(tripHelp){beginTripRequest(state.bookingDetail?.booking,tripHelp.dataset.tripHelp);return}
  const caseLink=e.target.closest("[data-trip-case]");
  if(caseLink){setPage("support","cases",true);void openSupportCase(caseLink.dataset.tripCase);return}
  if(e.target.closest("[data-retry-trip-cases]")){void loadSupport(true).catch(()=>{});return}
  const change=e.target.closest("[data-review-airline-change]");
  if(change){reviewAirlineChange(change.dataset.reviewAirlineChange);return}

  if(e.target.id==="refreshBtn"||e.target.id==="profileRefreshRetry"||e.target.closest("[data-refresh-profile]")){refresh();return}
  if(e.target.id==="closeBtn"){post("CUSTOMER_DOCUMENT_CLOSE",{},DOC_SOURCE);setPage("trips","upcoming",true);return}
  const legacy=e.target.closest("[data-tab]");if(legacy){setTab(legacy.dataset.tab,true);return}
  const route=e.target.closest("[data-route]");if(route){post("MY_PROFILE_NAVIGATE",{path:route.dataset.route});return}
  const booking=e.target.closest("[data-booking]");if(booking){openTrip(booking.dataset.booking,booking.dataset.tripTarget);return}
  const lf=e.target.closest("[data-ledger-filter]");if(lf){state.ledgerFilter=lf.dataset.ledgerFilter;renderClub();return}
  if(e.target.closest("[data-close-modal]")){closeModal();return}
  const manageBtn=e.target.closest("[data-manage]");if(manageBtn){manage(manageBtn.dataset.manage);return}
  const removeFav=e.target.closest("[data-remove-favorite]");
  if(removeFav){changeProfileItem(removeFav,"MY_PROFILE_REMOVE_FAVORITE",{favoriteId:removeFav.dataset.removeFavorite},"Saved item removed.");return}
  const read=e.target.closest("[data-read-notification]");
  if(read){changeProfileItem(read,"MY_PROFILE_MARK_NOTIFICATION_READ",{notificationId:read.dataset.readNotification});return}
  const edit=e.target.closest("[data-edit-traveler]");if(edit){travelerModal(arr(state.data?.travelers).find(x=>x.id===edit.dataset.editTraveler)||{});return}
  const rem=e.target.closest("[data-remove-traveler]");
  if(rem){removeTraveler(rem.dataset.removeTraveler);return}
  const confirmedRemoval=e.target.closest("[data-confirm-remove-traveler]");
  if(confirmedRemoval){
    const removed=await changeProfileItem(confirmedRemoval,"MY_PROFILE_REMOVE_TRAVELER",{travelerId:confirmedRemoval.dataset.confirmRemoveTraveler},"Traveler removed.");
    if(removed)closeModal();
    return;
  }
  const openDoc=e.target.closest("[data-open-doc]");
  if(openDoc){showBookingDocument(openDoc,"CUSTOMER_DOCUMENT_OPEN");return}
  const compDoc=e.target.closest("[data-complete-doc]");
  if(compDoc){showBookingDocument(compDoc,"CUSTOMER_DOCUMENT_COMPLETE");return}
  const accepted=e.target.closest("[data-accept-airline-change]");
  if(accepted){
    await confirmTripOption(accepted,"MY_PROFILE_AIRLINE_CHANGE_ACCEPT",{changeId:accepted.dataset.acceptAirlineChange},result=>result?.accepted===true,"Airline change accepted.");
    return;
  }
  const cancellation=e.target.closest("[data-confirm-cancel]");
  if(cancellation){
    await confirmTripOption(cancellation,"MY_PROFILE_FLIGHT_CANCEL_CONFIRM",{cancellationId:cancellation.dataset.confirmCancel},result=>Boolean(result?.cancellation?.confirmedAt&&!result.reconciliationRequired),"Airline cancellation confirmed.");
    return;
  }
  const offer=e.target.closest("[data-select-change]");
  if(offer){await selectChange(offer);return}
  const freeChange=e.target.closest("[data-confirm-free-change]");
  if(freeChange){
    await confirmTripOption(freeChange,"MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{orderChangeId:freeChange.dataset.confirmFreeChange},result=>Boolean(result?.change?.confirmedAt&&!result.reconciliationRequired),"Flight change confirmed.");
    return;
  }
  if(e.target.id==="searchChangesBtn"){void searchChanges();return}
  if(e.target.closest("[data-request-baggage]")){requestBaggage();return}
  if(e.target.id==="confirmPaymentBtn"){void confirmPayment(e.target);return}

});
$("supportSearch")?.addEventListener("input",drawSupportCases);
$("supportCategory")?.addEventListener("change",renderSupportRequirements);
$("supportNewForm")?.addEventListener("submit",submitSupportCase);
$("supportReplyForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const caseId=state.support.selectedCaseId;
  const content=$("supportReplyText").value.trim();
  const button=event.currentTarget.querySelector('[type="submit"]');
  if(!content||!caseId||button.disabled)return;
  button.disabled=true;
  supportStatus("Sending your reply…");
  try{
    const {result}=await request("MY_PROFILE_SUPPORT_REPLY",{caseId,content});
    if(!result?.ok)throw new Error("Your reply could not be confirmed.");
    if(state.support.selectedCaseId===caseId){
      $("supportReplyText").value="";
      await openSupportCase(caseId);
    }
  }catch(error){
    if(state.support.selectedCaseId===caseId)supportStatus(error.message,true);
  }finally{
    button.disabled=false;
  }
});

$("addTraveler").addEventListener("click",()=>travelerModal({}));
$("closeModal").addEventListener("click",closeModal);
$("modalShade").addEventListener("click",event=>{if(event.target===$("modalShade"))closeModal()});
$("modalBody").addEventListener("submit",submitBookingOrTraveler);
$("profileRetry").addEventListener("click",startProfile);
$("retryEmailPreferences").addEventListener("click",()=>loadEmailPreferences(true));
$("emailPreferencesForm").addEventListener("submit",saveEmailPreferences);
$("logoutBtn").addEventListener("click",async event=>{
  const button=event.currentTarget;
  button.disabled=true;
  try{await request("MY_PROFILE_LOGOUT",{},READ_TIMEOUT_MS)}
  catch(error){button.disabled=false;toast(error.message,true)}
});
for(const form of [$("contactForm"),$("profileForm")]){
  form.addEventListener("submit",saveAccountForm);
  form.addEventListener("input",()=>{
    form.dataset.editVersion=String(Number(form.dataset.editVersion||0)+1);
    setFormStatus(form,"");
  });
}
document.addEventListener("keydown",event=>{
  const shade=$("modalShade");
  if(!shade.classList.contains("open"))return;
  if(event.key==="Escape"){event.preventDefault();closeModal();return}
  if(event.key!=="Tab")return;
  const active=[...shade.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)")].filter(element=>element.type!=="hidden"&&!element.hidden);
  const first=active[0],last=active[active.length-1];
  if(!first)return;
  if((event.shiftKey&&document.activeElement===first)||(!event.shiftKey&&document.activeElement===last)){
    event.preventDefault();
    (event.shiftKey?last:first).focus();
  }
});

function settleRequest(type,payload){
  const pending=state.pending.get(payload.requestId);
  if(!pending)return false;
  if(payload.action&&payload.action!==pending.type)return false;
  clearTimeout(pending.t);
  state.pending.delete(payload.requestId);
  if(type==="MY_PROFILE_ERROR"||type==="CUSTOMER_DOCUMENT_ERROR"){
    pending.reject(new Error(payload.message||"The request failed."));
  }else{
    pending.resolve(payload);
  }
  return true;
}

window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  let message=event.data;
  if(typeof message==="string"){try{message=JSON.parse(message)}catch(_){return}}
  if(!message||message.source!==PARENT)return;
  const payload=message.payload||{};
  switch(message.type){
    case "SKANDI_MASTER_CONFIG": {
      const logo=documentLink(payload.brand?.assets?.logos?.skandiWhiteSide);
      if(logo&&logo!==state.clubLogo){
        state.clubLogo=logo;
        if(state.data?.club?.enrolled)renderOverview();
      }
      break;
    }
    case "MY_PROFILE_HOST_READY":
      if(bootstrapping&&!state.data)post("MY_PROFILE_READY");
      break;
    case "MY_PROFILE_DATA":
      applyProfileData(payload);
      break;
    case "MY_PROFILE_RESULT":
    case "CUSTOMER_DOCUMENT_RESULT":
    case "CUSTOMER_DOCUMENT_ACTION_REQUIRED":
      settleRequest(message.type,payload);
      break;
    case "MY_PROFILE_ERROR":
      if(settleRequest(message.type,payload))break;
      if(!state.data||payload.code==="LOGIN_REQUIRED"){
        state.data=null;
        showLoadError(payload);
      }else if(payload.action==="MY_PROFILE_REFRESH"){
        showRefreshError(payload.message);
      }else{
        toast(payload.message||"The request failed.",true);
      }
      break;
    case "MY_PROFILE_SET_PAGE":
      setPage(payload.section||"home",payload.view||"overview",false,payload.tripId||"");
      break;
    case "MY_PROFILE_SET_TAB":
      setTab(payload.tab||"overview");
      break;
    case "MY_PROFILE_URL_SYNC_ERROR":
      toast("This section opened. The page link could not be updated.",true);
      break;
    case "CUSTOMER_DOCUMENTS_LOAD":
      if(payload.bookingId){
        const retained=(state.legacyDocuments||arr(state.data?.documents)).filter(doc=>String(doc.bookingId||"")!==payload.bookingId);
        state.legacyDocuments=[...retained,...arr(payload.documents)];
      }else{
        state.legacyDocuments=arr(payload.documents);
      }
      renderDocuments();
      renderTrips();
      break;
    case "CUSTOMER_DOCUMENT_ERROR":
      if(!settleRequest(message.type,payload))toast(payload.message||"Document unavailable.",true);
      break;
  }
});

bindMobileNavigation();
startProfile();
})();
