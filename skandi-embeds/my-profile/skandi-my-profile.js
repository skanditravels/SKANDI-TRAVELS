
(() => {
"use strict";
// B-011.31 hierarchical account shell + Club overview + trip action center. Data ownership and provider contracts remain canonical.
const SOURCE="SKANDI_MY_PROFILE",DOC_SOURCE="SKANDI_CUSTOMER_DOCUMENT_CENTER",PARENT="SKANDI_WIX_PARENT",$=id=>document.getElementById(id);
const STARTUP_TIMEOUT_MS=28000;
const READ_TIMEOUT_MS=26000;
const state={data:null,section:"club",view:"overview",ledgerFilter:"all",bookingDetail:null,pending:new Map(),stripe:null,elements:null,payment:null,legacyDocuments:null,emailPreferences:{loaded:false,loading:false,subscribed:false,email:""},support:{loaded:false,loading:false,cases:[],selectedCaseId:"",detail:null,workflows:[],activeRequest:0}};
const views=new Map([...$("accountWorkspace").querySelectorAll("[data-page]")].map(view=>[view.dataset.page,view]));
let startupTimer;
let bootstrapping=false;
let activeBookingRequest=0;
const icon=(name)=>{const paths={calendar:'<path d="M7 2v3M17 2v3M3.5 9h17M5 4.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',doc:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',bag:'<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',plane:'<path d="M22 2 9.5 14.5 3 12l-2 2 7 3 3 7 2-2-2.5-6.5L23 3z"/>',check:'<path d="m5 12 4 4L19 6"/>',wallet:'<path d="M3 6h17v14H3zM3 9h17M15 13h3v3h-3z"/>'};return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.check}</svg>`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:[]; const money=(a,c)=>a===null||a===undefined||a===""?"":new Intl.NumberFormat(undefined,{style:"currency",currency:c||"USD"}).format(Number(a)||0); const date=v=>{if(!v)return"";try{return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(String(v).length===10?`${v}T12:00:00`:v))}catch{return String(v)}}; const num=v=>new Intl.NumberFormat().format(Number(v)||0);
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
  const map={overview:["club","overview"],club:["club","overview"],trips:["trips","upcoming"],orders:["trips","drafts"],documents:["trips","upcoming"],travelers:["profile","travelers"],wallet:["profile","wallet"],saved:["profile","saved"],notifications:["account","notifications"],settings:["account","settings"],support:["support","cases"]};
  const pair=map[String(tab||"")]||["club","overview"];
  setPage(pair[0],pair[1],push);
}

function pageKey(section,view){return `${section}-${view}`}
function setPage(section,view,push=false){
  if(!views.has(pageKey(section,view))){section="club";view="overview"}
  const key=pageKey(section,view);
  const changed=section!==state.section||view!==state.view;
  state.section=section;state.view=view;
  for(const [viewKey,panel] of views)panel.classList.toggle("active",viewKey===key);
  document.querySelectorAll(".side-link").forEach(link=>{
    const active=pageKey(link.dataset.section,link.dataset.view)===key;
    link.classList.toggle("active",active);
    if(active)link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  });
  document.querySelectorAll(".side-category").forEach(cat=>{const active=cat.dataset.category===section;cat.classList.toggle("active",active);if(active)cat.classList.add("open");const h=cat.querySelector("[data-category-toggle]");if(h)h.setAttribute("aria-expanded",cat.classList.contains("open")?"true":"false")});
  $("profileSectionSelect").value=key;
  if(push)post("MY_PROFILE_QUERY_UPDATE",{section,view});
  if(!state.data)return;
  if(changed)$("profileStage").scrollIntoView({block:"start",behavior:"auto"});
  if(section==="support")loadSupport().catch(()=>{});
  if(section==="account"&&view==="settings")loadEmailPreferences();
}

function bindMobileNavigation(){
  const select=$("profileSectionSelect");
  const destinations=new Map();
  for(const category of $("sideMenu").querySelectorAll(".side-category")){
    const group=document.createElement("optgroup");
    group.label=category.querySelector(".side-category-head").textContent.trim();
    for(const link of category.querySelectorAll(".side-link")){
      const {section,view}=link.dataset;
      const option=document.createElement("option");
      option.value=pageKey(section,view);
      option.textContent=link.textContent.trim();
      destinations.set(option.value,{section,view});
      group.append(option);
    }
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
function issuedDocsForBooking(id){return docsForBooking(id).filter(d=>["ISSUED","SENT","ACKNOWLEDGED","READY"].includes(String(d.status||"").toUpperCase()))}
function pageLink(section,view,label,ic="check"){return `<button class="quick-link" type="button" data-section="${esc(section)}" data-view="${esc(view)}"><span class="quick-icon">${icon(ic)}</span><strong>${esc(label)}</strong></button>`}

function statusClass(s){s=String(s||"").toUpperCase();if(["ISSUED","SENT","ACKNOWLEDGED","READY","CONFIRMED","POSTED"].includes(s))return"ok";if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDING","HELD"].includes(s))return"warn";if(["CANCELLED","REJECTED","FAILED"].includes(s))return"bad";return""}
function friendly(s){return String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function groupFor(doc){const s=String(doc.status||"").toUpperCase();if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"].includes(s))return"Action required";if(["ISSUED","SENT","ACKNOWLEDGED"].includes(s))return"Issued documents";if(String(doc.document_code||"").startsWith("F")||String(doc.document_code||"").startsWith("P10"))return"Travel changes";return"Upcoming / preparing"}
function nextTrip(){return arr(state.data?.trips?.upcoming)[0]||null}
function renderHero(){
  const d=state.data;if(!d)return;const p=d.profile||{},c=d.club||{},first=(p.firstName||p.displayName||"Member").split(" ")[0];
  $("heroName").textContent=first;
  $("greetingLine").firstChild.nodeValue=`${greetingForNow()}, `;
  $("heroTier").textContent=c.status==="UNAVAILABLE"?"Unavailable":c.enrolled?(c.tier?.name||"Member"):"Not enrolled";
  $("heroMembership").hidden=!(c.enrolled&&p.clubNumber);
  $("heroNumber").textContent=p.clubNumber||"";
  $("heroPointsLabel").textContent=c.pointsName||"Points";
  $("heroPoints").textContent=c.enrolled&&Number.isFinite(c.pointsBalance)?num(c.pointsBalance):"—";
  $("heroTrips").textContent=num(arr(d.trips?.upcoming).length);
  $("heroMemberSince").textContent=c.enrolled?monthYear(c.memberSince||p.accountCreatedAt):"—";
  const progress=Math.max(0,Math.min(100,Number(c.progress?.percent||0)));document.documentElement.style.setProperty("--club-progress",`${progress}%`);
}
function renderOverview(){
  const {profile:p={},club:c={}}=state.data;
  const overview=$("clubView");
  const title='<div class="page-intro"><h2>Club Overview</h2></div>';
  if(c.status==="UNAVAILABLE"){
    overview.innerHTML=title+`
      <div class="club-status-panel">
        <h3>Club information is temporarily unavailable</h3>
        <p>Refresh to check your current membership and balance.</p>
        <button class="btn cyan" type="button" data-refresh-profile>Refresh account</button>
      </div>`;
    return;
  }
  if(!c.enrolled){
    overview.innerHTML=title+`
      <div class="club-status-panel">
        <h3>Join SKANDI Club</h3>
        <p>Enroll to start earning points and track your Club status here.</p>
        <div class="button-row">
          <button class="btn cyan" type="button" data-route="/skandi-club">Explore SKANDI Club</button>
          <button class="btn" type="button" data-section="support" data-view="cases">Get enrollment help</button>
        </div>
      </div>`;
    return;
  }

  const progress=Math.max(0,Math.min(100,Number(c.progress?.percent||0)));
  const currentTier=c.tier?.name||"Member";
  const nextTier=c.nextTier?.name;
  const showTier=c.tiersEnabled??(Boolean(nextTier)||arr(c.tiers).length>0);
  const recent=arr(c.ledger).slice(0,5);
  const recentRows=recent.map(entry=>`
    <div class="club-activity-mini">
      <div class="date">${esc(date(entry.date))}</div>
      <strong>${esc(entry.description||friendly(entry.type)||"SKANDI Club activity")}</strong>
      <div class="pts ${Number(entry.amount)<0?"neg":""}">${Number(entry.amount)>0?"+":""}${num(entry.amount)}</div>
    </div>`).join("");

  overview.innerHTML=title+`
    <section class="club-status-panel">
      <div class="club-status-head">
        <div><div class="club-status-name">${esc(currentTier)}</div><div class="club-status-caption">Current Club status</div></div>
        ${p.clubNumber?`<span class="club-number-badge">Club ${esc(p.clubNumber)}</span>`:""}
      </div>
      ${showTier&&nextTier?`<div class="club-status-body">
        <div class="status-ring" style="--p:${progress}"><div class="status-ring-content"><strong>${progress.toFixed(0)}%</strong><span>to ${esc(nextTier)}</span></div></div>
        <div class="status-copy"><h3>Next level: ${esc(nextTier)}</h3><p>${num(c.progress?.pointsToNext)} more points to reach ${esc(nextTier)}.</p></div>
      </div>`:`<div class="status-copy"><h3>${esc(c.programName||"SKANDI Club")}</h3><p>${showTier?"Your current level is shown above.":"Your available points appear in the account summary."}</p></div>`}
    </section>
    <h3 class="quick-links-title">Manage your account</h3>
    <div class="quick-links">${pageLink("club","activity","Points Activity","wallet")}${pageLink("trips","upcoming","My Upcoming Trips","calendar")}${pageLink("profile","details","Personal Information","user")}</div>
    <div class="club-snapshot">
      <div class="club-snapshot-head"><strong>Recent Club activity</strong><button type="button" data-section="club" data-view="activity">View all activity</button></div>
      ${recentRows||'<p class="club-activity-mini">No Club activity yet.</p>'}
    </div>`;
}
function tripCard(b,past=false){
  const comps=arr(b.components),tasks=actionDocsForBooking(b.id),allDocs=docsForBooking(b.id);return `<article class="trip-card"><div class="trip-datebox"><strong>${esc(b.departureDate?new Date(`${b.departureDate}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"Trip")}</strong><span>${esc(b.departureDate?new Date(`${b.departureDate}T12:00:00`).getFullYear():b.status||"")}</span></div><div><h3>${esc(b.origin||"SKANDI")} → ${esc(b.destination||b.productType||"Booking")}</h3><p>${esc(b.bookingReference?`Booking ${b.bookingReference}`:"SKANDI booking")}${b.totalAmount!==null?` · ${esc(money(b.totalAmount,b.currency))}`:""}</p><div class="chips"><span class="chip ${statusClass(b.status)}">${esc(friendly(b.status||"Booked"))}</span>${comps.slice(0,5).map(c=>`<span class="chip">${esc(friendly(c.type))}</span>`).join("")}</div>${!past&&tasks.length?`<div class="trip-action-notice">${tasks.length} travel item${tasks.length===1?"":"s"} require your action</div>`:!past&&allDocs.length?`<div class="trip-clear-note">No outstanding SKANDI information request is currently attached to this booking.</div>`:""}</div><div class="button-row"><button class="btn small primary" data-booking="${esc(b.id)}">${past?"View":"Manage trip"}</button></div></article>`
}
function renderTrips(){
  const d=state.data;if(!d)return;
  const upcoming=arr(d.trips?.upcoming),history=arr(d.trips?.history),carts=arr(d.trips?.carts);
  const up=$("tripList"),past=$("tripHistoryList"),draft=$("tripDraftList");
  if(up)up.innerHTML=upcoming.map(b=>tripCard(b,false)).join("")||empty("No upcoming trips","Bookings linked to this account will appear here.","plane");
  if(past)past.innerHTML=history.map(b=>tripCard(b,true)).join("")||empty("No past trips yet","Completed and cancelled SKANDI bookings will appear here.","plane");
  if(draft)draft.innerHTML=carts.map(c=>`<article class="trip-card"><div class="trip-datebox"><strong>${esc(friendly(c.status||"Draft"))}</strong><span>${esc(date(c.updatedAt||c.createdAt))}</span></div><div><h3>${esc(c.payload?.selectedOffer?.summary||c.payload?.productType||"Booking in progress")}</h3><p>${esc(c.cartId||"")}${c.total?` · ${esc(money(c.total,c.currency))}`:""}</p></div><div><button class="btn small primary" data-route="/booking?cartId=${encodeURIComponent(c.cartId||"")}">Continue</button></div></article>`).join("")||empty("No booking drafts","Unfinished SKANDI booking carts will appear here.","plane")
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
  renderOverview();
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
    if(initial)setPage(data.requestedSection||"club",data.requestedView||"overview");
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
  const upcoming=arr(trips.upcoming).find(matches);
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

let drawerOpener;
function openDrawer(){
  const drawer=$("bookingDrawer");
  if(drawer.inert)drawerOpener=document.activeElement;
  $("drawerShade").classList.add("open");
  drawer.classList.add("open");
  drawer.inert=false;
  drawer.removeAttribute("aria-hidden");
  $("closeDrawer").focus();
}
function closeDrawer(){
  activeBookingRequest++;
  const drawer=$("bookingDrawer");
  $("drawerShade").classList.remove("open");
  drawer.classList.remove("open");
  drawer.inert=true;
  drawer.setAttribute("aria-hidden","true");
  drawerOpener?.focus();
}

async function loadBooking(id){
  if(!id)return;
  const revision=++activeBookingRequest;
  state.bookingDetail=null;
  $("bookingDocumentStatus").hidden=true;
  $("bookingDetail").innerHTML=empty("Loading trip","Checking your booking details.","plane");
  openDrawer();
  try{
    const {result}=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id},READ_TIMEOUT_MS);
    if(revision!==activeBookingRequest)return;
    if(!result?.booking)throw new Error("The trip could not be loaded.");
    state.bookingDetail=result;
    renderBookingDetail();
  }catch(error){
    if(revision===activeBookingRequest)$("bookingDetail").innerHTML=empty("Trip unavailable",error.message,"plane");
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
      closeDrawer();
      setPage("profile","travelers",true);
      toast("Review the requested information in Saved Travelers.");
      return;
    }
    const link=documentLink(doc.fileUrl);
    const message=link
      ? doc.definition_name||"Your document is ready."
      : requiresAction
        ? "Contact SKANDI Support for help completing this item."
        : "This document is not available to open yet.";
    showTripDocument(message,link);
  }catch(error){
    if(bookingRequest===activeBookingRequest)showTripDocument(error.message);
  }finally{
    button.disabled=false;
  }
}

function renderBookingDetail(){
  const d=state.bookingDetail;if(!d)return;const b=d.booking||{},p=d.provider||{},cap=d.capabilities||{},air=p.air,stay=p.stay,car=p.car,localDocs=docsForBooking(b.id),tasks=localDocs.filter(isActionDoc),issued=issuedDocsForBooking(b.id),providerDocs=arr(air?.documents);
  const taskHtml=tasks.length?`<div class="trip-attention"><strong>${tasks.length} item${tasks.length===1?"":"s"} require your action before travel</strong><p>These requests belong to this booking and are kept with the trip rather than in a separate document center.</p></div><div class="card pad" style="margin-bottom:18px"><h3 style="margin-bottom:8px">Requested travel information</h3>${tasks.map(doc=>`<div class="trip-doc-task"><div class="docicon">${esc(String(doc.document_code||"DOC").slice(0,3))}</div><div><strong>${esc(doc.definition_name||doc.document_code||"Travel information")}</strong><span>${esc(friendly(doc.status||"Required"))}${doc.document_number?` · ${esc(doc.document_number)}`:""}</span></div><div class="button-row"><button class="btn small" data-open-doc="${esc(doc.id)}">Open</button><button class="btn small primary" data-complete-doc="${esc(doc.id)}">View instructions</button></div></div>`).join("")}</div>`:"";
  const docsHtml=(issued.length||providerDocs.length)?`<h3 class="subhead">Trip documents</h3><div class="provider-doc-list">${issued.map(doc=>`<div class="provider-doc"><div><strong>${esc(doc.definition_name||doc.document_code||"SKANDI document")}</strong><span>${esc(doc.document_number||friendly(doc.status))}</span></div><button class="btn small" data-open-doc="${esc(doc.id)}">Open</button></div>`).join("")}${providerDocs.map(doc=>`<div class="provider-doc"><div><strong>${esc(friendly(doc.type||"Airline document"))}</strong><span>${esc(doc.uniqueIdentifier||doc.id||"Issued by airline")}</span></div><span>Airline issued</span></div>`).join("")}</div>`:"";
  $("bookingDetail").innerHTML=`<div class="booking-hero"><div class="kicker" style="color:var(--sk-aqua)">Booking ${esc(b.bookingReference||b.id)}</div><div class="route">${esc(b.origin||air?.slices?.[0]?.origin?.iataCode||"SKANDI")} → ${esc(b.destination||air?.slices?.[Math.max(0,arr(air?.slices).length-1)]?.destination?.iataCode||"Trip")}</div><p>${esc(date(b.departureDate))}${b.returnDate?` · ${esc(date(b.returnDate))}`:""} · ${esc(friendly(b.status||air?.status||"Booked"))}</p></div>${taskHtml}${arr(d.airlineChanges).length?`<div class="provider-note"><strong>Airline schedule update</strong><br>${arr(d.airlineChanges).length} airline-initiated change${arr(d.airlineChanges).length===1?"":"s"} need review. Available actions are determined by the airline payload.</div>`:""}<h3 class="subhead">Manage this trip</h3><div class="cap-grid">${air?`<div class="cap"><strong>Flight changes</strong><span>${cap.flightChange?"This order can be re-shopped through the airline API.":"The airline does not currently expose self-service changes for this order."}</span>${cap.flightChange?`<div style="margin-top:10px"><button class="btn small primary" data-manage="flight-change">Change flight</button></div>`:""}</div><div class="cap"><strong>Cancellation</strong><span>${cap.flightCancel?"A live cancellation quote can be requested before anything is cancelled.":"API cancellation is not available for this order."}</span>${cap.flightCancel?`<div style="margin-top:10px"><button class="btn small" data-manage="flight-cancel">Get cancellation quote</button></div>`:""}</div><div class="cap"><strong>Additional baggage</strong><span>${cap.postBookingBaggage?`${arr(d.baggage).length} baggage option${arr(d.baggage).length===1?"":"s"} currently available for the passenger/segment combinations returned by the airline.`:"No post-booking baggage offer is currently available from the airline."}</span>${cap.postBookingBaggage?`<div style="margin-top:10px"><button class="btn small" data-manage="baggage">Add baggage</button></div>`:""}</div><div class="cap"><strong>Seats</strong><span>SKANDI does not advertise post-booking seat reassignment here because the current Duffel post-booking service flow supports baggage, not seat reassignment.</span></div>`:""}${stay?`<div class="cap"><strong>Hotel booking</strong><span>${esc(stay.accommodation?.name||"Accommodation")} · ${esc(friendly(stay.status))}${stay.checkInDate?` · ${esc(date(stay.checkInDate))}`:""}</span>${cap.stayCancel?`<div style="margin-top:10px"><button class="btn small danger" data-manage="stay-cancel">Cancel stay</button></div>`:""}</div>`:""}${car?`<div class="cap"><strong>Car rental</strong><span>${esc(car.car?.name||"Rental car")} · ${esc(friendly(car.status))}</span>${cap.carCancel?`<div style="margin-top:10px"><button class="btn small danger" data-manage="car-cancel">Cancel rental</button></div>`:""}</div>`:""}</div>${docsHtml}<h3 class="subhead">Trip components</h3>${arr(b.components).length?arr(b.components).map(c=>`<div class="component"><strong>${esc(c.title||friendly(c.type))}</strong><span>${esc(friendly(c.type))} · ${esc(friendly(c.status||"Booked"))}${c.totalAmount!==null?` · ${esc(money(c.totalAmount,c.currency))}`:""}</span></div>`).join(""):"<div class='provider-note'>Detailed trip components are not published for this booking yet.</div>"}${arr(d.airlineChanges).length?`<h3 class="subhead">Airline-initiated changes</h3>${arr(d.airlineChanges).map(c=>`<div class="component"><strong>Schedule change · ${esc(date(c.updatedAt||c.createdAt))}</strong><span>Available actions: ${esc(arr(c.availableActions).join(", ")||"review")}</span>${arr(c.availableActions).includes("accept")?`<div style="margin-top:8px"><button class="btn small primary" data-accept-airline-change="${esc(c.id)}">Accept change</button></div>`:""}</div>`).join("")}`:""}<div class="provider-note">Self-service controls are shown only when the live supplier payload exposes that action. SKANDI keeps booking-specific information requests with the trip that needs them.</div>`
}
function openModal(title,body,foot=""){$("modalTitle").textContent=title;$("modalBody").innerHTML=body;$("modalFoot").innerHTML=foot;$("modalShade").classList.add("open")}function closeModal(){$("modalShade").classList.remove("open");state.payment=null;state.elements=null}
function linkBookingModal(){openModal("Link a booking",`<div class="provider-note">Use the booking reference and traveler surname exactly as shown on the confirmation. This verifies ownership before the booking is added to My Trips.</div><form id="linkBookingForm" class="profile-form" style="margin-top:16px"><div class="field"><label>Booking reference</label><input class="control" name="bookingReference" required maxlength="120" autocomplete="off" placeholder="Booking reference"></div><div class="field"><label>Traveler surname</label><input class="control" name="lastName" required maxlength="160" autocomplete="family-name" placeholder="Surname"></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmLinkBooking" type="submit" form="linkBookingForm">Link booking</button>`)}
function travelerModal(t={}){const refs=state.data?.references||{};openModal(t.id?"Edit traveler":"Add traveler",`<form id="travelerForm" class="profile-form"><input type="hidden" name="id" value="${esc(t.id||"")}"><div class="field"><label>First name</label><input class="control" name="firstName" required value="${esc(t.firstName||"")}"></div><div class="field"><label>Last name</label><input class="control" name="lastName" required value="${esc(t.lastName||"")}"></div><div class="field"><label>Date of birth</label><input class="control" type="date" name="dateOfBirth" value="${esc(t.dateOfBirth||"")}"></div><div class="field"><label>Gender</label><select class="control" name="gender"><option value="">Select</option><option value="female" ${lowerEq(t.gender,"female")}>Female</option><option value="male" ${lowerEq(t.gender,"male")}>Male</option><option value="unspecified" ${lowerEq(t.gender,"unspecified")}>Unspecified</option></select></div><div class="field"><label>Nationality</label><select class="control" name="nationalityId"><option value="">Select</option>${arr(refs.countries).map(x=>`<option value="${esc(x.id)}" ${x.id===t.nationalityId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div><div class="field"><label>Contact email</label><input class="control" type="email" name="email" value="${esc(t.email||"")}"></div><div class="field"><label>Phone</label><input class="control" name="phone" value="${esc(t.phone||"")}"></div><div class="field"><label>Passport expiry</label><input class="control" type="date" name="passportExpiry" value="${esc(t.passportExpiry||"")}"></div><div class="field full"><label>Dietary preferences</label><input class="control" name="dietaryPrefs" value="${esc(t.dietaryPrefs||"")}"></div><div class="field full"><label>Accessibility needs</label><textarea class="control" name="accessibilityNeeds">${esc(t.accessibilityNeeds||"")}</textarea></div><div class="field full"><label class="checkbox"><input type="checkbox" name="isPrimary" ${t.isPrimary?"checked":""}><span>Use as primary traveler profile.</span></label></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="saveTravelerModal" type="submit" form="travelerForm">Save traveler</button>`)}function lowerEq(a,b){return String(a||"").toLowerCase()===b?"selected":""}
async function manage(kind){const d=state.bookingDetail,b=d?.booking;if(!b)return;if(kind==="flight-cancel"){busy(true);try{const r=await request("MY_PROFILE_FLIGHT_CANCEL_QUOTE",{bookingId:b.id});const q=r.result||r,canDirect=Number(q.cancellation?.refundAmount||0)<=0;openModal("Cancellation quote",`<div class="card pad"><h3>Airline cancellation quote</h3><p>Refund quoted by airline</p><div style="font-family:Montserrat;font-size:32px;font-weight:700;color:var(--sk-navy);margin-top:10px">${esc(money(q.cancellation?.refundAmount,q.cancellation?.refundCurrency))}</div><p style="margin-top:12px">Quote expires ${esc(date(q.cancellation?.expiresAt))}. Nothing has been cancelled yet.</p></div>${!canDirect?`<div class="provider-note">This cancellation includes a customer refund. SKANDI will not cancel the supplier order here until the customer-refund workflow is completed. Continue through Support so the refund and cancellation remain one controlled transaction.</div>`:""}`,canDirect?`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn danger" data-confirm-cancel="${esc(q.cancellation?.id||"")}">Confirm cancellation</button>`:`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn primary" data-section="support" data-view="cases">Continue with Support</button>`)}catch(e){toast(e.message,true)}finally{busy(false)}}else if(kind==="flight-change")flightChangeModal();else if(kind==="baggage")baggageModal();else if(kind==="stay-cancel")confirmSimple("Cancel hotel booking","This sends a live cancellation request to the accommodation supplier. Cancellation terms from your booking still apply.","MY_PROFILE_STAY_CANCEL");else if(kind==="car-cancel")confirmSimple("Cancel car rental","This sends a live cancellation request to the rental supplier. Supplier conditions still apply.","MY_PROFILE_CAR_CANCEL")}
function flightChangeModal(){const air=state.bookingDetail?.provider?.air,slices=arr(air?.slices);openModal("Change flight",`<form id="changeSearchForm" class="profile-form"><div class="field full"><label>Flight to change</label><select class="control" name="removeSliceId">${slices.map(s=>`<option value="${esc(s.id)}">${esc(s.origin?.iataCode||"")} → ${esc(s.destination?.iataCode||"")}</option>`).join("")}</select></div><div class="field"><label>Origin</label><input class="control" name="origin" maxlength="3" value="${esc(slices[0]?.origin?.iataCode||"")}"></div><div class="field"><label>Destination</label><input class="control" name="destination" maxlength="3" value="${esc(slices[0]?.destination?.iataCode||"")}"></div><div class="field"><label>New departure date</label><input class="control" type="date" name="departureDate" min="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Cabin</label><select class="control" name="cabinClass"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div></form><div id="changeOffers"></div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="searchChangesBtn">Search changes</button>`)}
async function searchChanges(){const f=$("changeSearchForm"),b=state.bookingDetail.booking;busy(true);try{const r=await request("MY_PROFILE_FLIGHT_CHANGE_SEARCH",{bookingId:b.id,removeSliceId:f.removeSliceId.value,addSlice:{origin:f.origin.value.toUpperCase(),destination:f.destination.value.toUpperCase(),departureDate:f.departureDate.value,cabinClass:f.cabinClass.value}}),data=r.result||r,offers=arr(data.offers);$("changeOffers").innerHTML=offers.length?`<h3 class="subhead">Available alternatives</h3>${offers.map(o=>`<div class="choice"><div><strong>${esc(arr(o.slices?.add)[0]?.origin?.iataCode||"")} → ${esc(arr(o.slices?.add)[0]?.destination?.iataCode||"")}</strong><span>Change total ${esc(money(o.changeTotalAmount,o.changeTotalCurrency))}${o.penaltyTotalAmount?` · penalty ${esc(money(o.penaltyTotalAmount,o.penaltyTotalCurrency))}`:""}</span></div><div class="price">${esc(money(o.changeTotalAmount,o.changeTotalCurrency))}</div><button class="btn small primary" data-select-change="${esc(o.id)}" data-change-amount="${esc(o.changeTotalAmount||"0")}">Select</button></div>`).join("")}`:empty("No alternatives returned","The airline did not return a change offer for these details.","plane")}catch(e){toast(e.message,true)}finally{busy(false)}}
async function selectChange(offerId,amount){if(Number(amount)<0){openModal("Refund change requires support",`<div class="provider-note">This flight change would create a customer refund. The current SKANDI supplier flow can confirm the airline change, but customer refund settlement must remain part of the same controlled transaction. Continue through Support instead of confirming it here.</div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" data-section="support" data-view="cases">Continue with Support</button>`);return}busy(true);try{const b=state.bookingDetail.booking,r=await request("MY_PROFILE_FLIGHT_CHANGE_SELECT",{bookingId:b.id,orderChangeOfferId:offerId}),data=r.result||r,change=data.change;if(!change?.id)throw new Error("The airline did not return a pending change.");const prep=await request("MY_PROFILE_FLIGHT_CHANGE_PREPARE_PAYMENT",{bookingId:b.id,orderChangeId:change.id}),pd=prep.result||prep;if(pd.paymentRequired)await openPayment({kind:"change",bookingId:b.id,orderChangeId:change.id,prepared:pd});else{const done=await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId:b.id,orderChangeId:change.id});toast("Flight change confirmed.");closeModal();await refreshBooking()}}catch(e){toast(e.message,true)}finally{busy(false)}}
async function baggageModal(){const b=state.bookingDetail.booking;busy(true);try{const r=await request("MY_PROFILE_BAGGAGE_LIST",{bookingId:b.id}),data=r.result||r,services=arr(data.services);openModal("Add baggage",services.length?`<div id="bagChoices">${services.map(s=>`<label class="choice"><input type="checkbox" value="${esc(s.id)}" data-max="${Number(s.maximumQuantity||1)}"><div><strong>${esc(s.label||"Additional baggage")}</strong><span>${arr(s.passengerIds).length?`Passenger-specific · `:""}${arr(s.segmentIds).length?"Flight-specific":""}</span></div><div class="price">${esc(money(s.totalAmount,s.totalCurrency))}</div></label>`).join("")}</div>`:empty("No baggage offers","The airline is not currently offering post-booking baggage for this order.","bag"),services.length?`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="prepareBagsBtn">Continue to payment</button>`:`<button class="btn soft" data-close-modal>Close</button>`)}catch(e){toast(e.message,true)}finally{busy(false)}}
async function prepareBags(){const services=[...document.querySelectorAll("#bagChoices input:checked")].map(x=>({id:x.value,quantity:1}));if(!services.length){toast("Choose at least one baggage option.",true);return}busy(true);try{const b=state.bookingDetail.booking,r=await request("MY_PROFILE_BAGGAGE_PREPARE_PAYMENT",{bookingId:b.id,services}),data=r.result||r;await openPayment({kind:"baggage",bookingId:b.id,services,prepared:data})}catch(e){toast(e.message,true)}finally{busy(false)}}
async function openPayment(flow){const p=flow.prepared?.payment;if(!p?.clientSecret||!p?.publishableKey)throw new Error("Secure payment could not be prepared.");state.payment=flow;openModal(flow.kind==="baggage"?"Secure baggage payment":"Secure change payment",`<div class="card pad"><h3>${esc(money(p.amount,p.currency))}</h3><p>The payment is authorized first and captured only after the supplier confirms the servicing action.</p></div><div class="stripe-box" id="paymentElement"></div><div id="paymentError" style="color:var(--danger);font-size:11px;margin-top:10px"></div>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmPaymentBtn">Authorize & continue</button>`);if(!window.Stripe)throw new Error("Secure payment is temporarily unavailable.");state.stripe=Stripe(p.publishableKey);state.elements=state.stripe.elements({clientSecret:p.clientSecret,appearance:{theme:"stripe",variables:{colorPrimary:"#022e64",fontFamily:"Inter, sans-serif",borderRadius:"10px"}}});state.elements.create("payment").mount("#paymentElement")}
async function confirmPayment(){const flow=state.payment,p=flow?.prepared?.payment;if(!flow||!state.stripe||!state.elements)return;busy(true);try{const result=await state.stripe.confirmPayment({elements:state.elements,redirect:"if_required"});if(result.error)throw new Error(result.error.message||"Payment authorization failed.");const paymentIntentId=result.paymentIntent?.id||p.paymentIntentId;if(flow.kind==="baggage")await request("MY_PROFILE_BAGGAGE_CONFIRM",{bookingId:flow.bookingId,services:flow.services,paymentIntentId});else await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId:flow.bookingId,orderChangeId:flow.orderChangeId,paymentIntentId});toast(flow.kind==="baggage"?"Baggage added to your booking.":"Flight change confirmed.");closeModal();await refreshBooking()}catch(e){$("paymentError").textContent=e.message||"Payment could not be completed.";toast(e.message,true)}finally{busy(false)}}
function confirmSimple(title,body,type){openModal(title,`<div class="provider-note">${esc(body)}</div>`,`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn danger" data-confirm-simple="${esc(type)}">Confirm cancellation</button>`)}
async function refreshBooking(){const id=state.bookingDetail?.booking?.id;if(!id)return;const r=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id});state.bookingDetail=r.result||r;renderBookingDetail()}
async function refresh(){
  const banner=$("profileRefreshState");
  banner.hidden=false;
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
  const cat=e.target.closest("[data-category-toggle]");if(cat){const wrap=cat.closest(".side-category");const willOpen=!wrap.classList.contains("open");wrap.classList.toggle("open",willOpen);cat.setAttribute("aria-expanded",willOpen?"true":"false");return}
  const page=e.target.closest("[data-section][data-view]");if(page){setPage(page.dataset.section,page.dataset.view,true);return}
  const supportCase=e.target.closest("[data-support-case]");if(supportCase){openSupportCase(supportCase.dataset.supportCase);return}
  if(e.target.id==="supportRefresh"){loadSupport(true).catch(()=>{});return}
  if(e.target.id==="supportDuffel"){
    const trip=tripForSupportCase(state.support.detail?.case);
    if(trip){setPage("trips",trip.view,true);loadBooking(trip.id)}
    return;
  }
  if(e.target.id==="linkBookingBtn"){linkBookingModal();return}

  if(e.target.id==="refreshBtn"||e.target.id==="profileRefreshRetry"||e.target.closest("[data-refresh-profile]")){refresh();return}
  if(e.target.id==="closeBtn"){post("CUSTOMER_DOCUMENT_CLOSE",{},DOC_SOURCE);setPage("trips","upcoming",true);return}
  const legacy=e.target.closest("[data-tab]");if(legacy){setTab(legacy.dataset.tab,true);return}
  const route=e.target.closest("[data-route]");if(route){post("MY_PROFILE_NAVIGATE",{path:route.dataset.route});return}
  const booking=e.target.closest("[data-booking]");if(booking){loadBooking(booking.dataset.booking);return}
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
  const acc=e.target.closest("[data-accept-airline-change]");if(acc){busy(true);try{await request("MY_PROFILE_AIRLINE_CHANGE_ACCEPT",{bookingId:state.bookingDetail.booking.id,changeId:acc.dataset.acceptAirlineChange});toast("Airline change accepted.");await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const cancel=e.target.closest("[data-confirm-cancel]");if(cancel){busy(true);try{await request("MY_PROFILE_FLIGHT_CANCEL_CONFIRM",{bookingId:state.bookingDetail.booking.id,cancellationId:cancel.dataset.confirmCancel});toast("Booking cancelled.");closeModal();await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const simple=e.target.closest("[data-confirm-simple]");if(simple){busy(true);try{await request(simple.dataset.confirmSimple,{bookingId:state.bookingDetail.booking.id});toast("Cancellation request completed.");closeModal();await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const sel=e.target.closest("[data-select-change]");if(sel){selectChange(sel.dataset.selectChange,sel.dataset.changeAmount);return}
  if(e.target.id==="searchChangesBtn"){searchChanges();return}if(e.target.id==="prepareBagsBtn"){prepareBags();return}if(e.target.id==="confirmPaymentBtn"){confirmPayment();return}

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
$("closeDrawer").addEventListener("click",closeDrawer);
$("drawerShade").addEventListener("click",closeDrawer);
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
  if(event.key!=="Escape")return;
  if($("modalShade").classList.contains("open"))closeModal();
  else if(!$("bookingDrawer").inert)closeDrawer();
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
      setPage(payload.section||"club",payload.view||"overview");
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
