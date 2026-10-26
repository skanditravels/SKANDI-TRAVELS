
(() => {
"use strict";
const SOURCE="SKANDI_MY_PROFILE",DOC_SOURCE="SKANDI_CUSTOMER_DOCUMENT_CENTER",PARENT="SKANDI_WIX_PARENT",$=id=>document.getElementById(id);

const DEFAULT_DATA = {
  profile: {
    firstName: "",
    lastName: "",
    displayName: "Member",
    dateOfBirth: "",
    email: "",
    phone: "",
    addressLine: "",
    preferredCurrency: "USD",
    passportLast4: "",
    passportExpiry: "",
    status: "Active",
    clubNumber: "",
    memberId: "—",
    accountCreatedAt: "",
    countryOfResidenceId: "US",
    preferredLanguageId: "en",
    preferredDepartureAirportId: "JFK",
    dietaryPrefs: "",
    accessibilityNeeds: "",
    marketingConsent: true,
    smsConsent: false,
    personalizationConsent: true,
    payload: { seatPreference: "" }
  },
  club: {
    enrolled: true,
    pointsBalance: 0,
    memberSince: "",
    tier: { id: "member", name: "Member", minPoints: 0, maxPoints: 9999, multiplier: 1 },
    nextTier: { id: "silver", name: "Silver", minPoints: 10000, maxPoints: 24999, multiplier: 1.25 },
    progress: { percent: 0, pointsToNext: 10000 },
    tiers: [
      { id: "member", name: "Member", minPoints: 0, maxPoints: 9999, multiplier: 1 },
      { id: "silver", name: "Silver", minPoints: 10000, maxPoints: 24999, multiplier: 1.25 },
      { id: "gold", name: "Gold", minPoints: 25000, maxPoints: 49999, multiplier: 1.5 },
      { id: "platinum", name: "Platinum", minPoints: 50000, maxPoints: null, multiplier: 2 }
    ],
    ledger: []
  },
  trips: { upcoming: [], history: [], carts: [] },
  travelers: [],
  documents: [],
  paymentMethods: [],
  wallet: [],
  favorites: [],
  notifications: [],
  references: {
    countries: [
      { id: "US", name: "United States of America", code: "US" },
      { id: "SE", name: "Sweden", code: "SE" },
      { id: "NO", name: "Norway", code: "NO" },
      { id: "DK", name: "Denmark", code: "DK" },
      { id: "FI", name: "Finland", code: "FI" },
      { id: "TH", name: "Thailand", code: "TH" }
    ],
    languages: [
      { id: "en", name: "English", code: "EN" },
      { id: "sv", name: "Svenska", code: "SV" },
      { id: "no", name: "Norsk", code: "NO" },
      { id: "da", name: "Dansk", code: "DA" }
    ],
    airports: [
      { id: "JFK", iata: "JFK", city: "New York", name: "John F. Kennedy Intl", country: "United States" },
      { id: "EWR", iata: "EWR", city: "Newark", name: "Newark Liberty Intl", country: "United States" },
      { id: "ARN", iata: "ARN", city: "Stockholm", name: "Arlanda", country: "Sweden" },
      { id: "LLA", iata: "LLA", city: "Luleå", name: "Kallax", country: "Sweden" },
      { id: "CPH", iata: "CPH", city: "Copenhagen", name: "Kastrup", country: "Denmark" },
      { id: "OSL", iata: "OSL", city: "Oslo", name: "Gardermoen", country: "Norway" },
      { id: "HEL", iata: "HEL", city: "Helsinki", name: "Vantaa", country: "Finland" },
      { id: "BKK", iata: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand" }
    ]
  }
};

// editCard tracks which SAS-style card is currently unlocked: null | "personal" | "passport" | "airport"
const state={data:structuredClone(DEFAULT_DATA),section:"club",view:"overview",editCard:null,ledgerFilter:"all",bookingDetail:null,pending:new Map(),stripe:null,elements:null,payment:null,legacyDocuments:null};
const icon=(name)=>{const paths={calendar:'<path d="M7 2v3M17 2v3M3.5 9h17M5 4.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',doc:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',bag:'<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',plane:'<path d="M22 2 9.5 14.5 3 12l-2 2 7 3 3 7 2-2-2.5-6.5L23 3z"/>',tower:'<path d="M8 22h8M12 14v8M7 10l5 4 5-4M5 6h14M8 6V3h8v3"/>',check:'<path d="m5 12 4 4L19 6"/>',wallet:'<path d="M3 6h17v14H3zM3 9h17M15 13h3v3h-3z"/>'};return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.check}</svg>`};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:[]; const money=(a,c)=>a===null||a===undefined||a===""?"":new Intl.NumberFormat(undefined,{style:"currency",currency:c||"USD"}).format(Number(a)||0); const date=v=>{if(!v)return"";try{return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(String(v).length===10?`${v}T12:00:00`:v))}catch{return String(v)}}; const num=v=>new Intl.NumberFormat().format(Number(v)||0);
function post(type,payload={},source=SOURCE){window.parent.postMessage({source,type,payload,timestamp:new Date().toISOString()},"*")}
function reqId(){return `mpr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`}
function request(type,payload={}){const id=reqId();return new Promise((resolve,reject)=>{const t=setTimeout(()=>{state.pending.delete(id);reject(new Error("The request timed out. Please try again."))},140000);state.pending.set(id,{resolve,reject,t,type});post(type,{...payload,requestId:id})})}
function busy(on){$("loading").classList.toggle("show",!!on)}
let toastTimer;function toast(message,bad=false){clearTimeout(toastTimer);const el=$("toast");el.textContent=message;el.className=`toast show${bad?" bad":""}`;toastTimer=setTimeout(()=>el.className="toast",4200)}
function empty(title,body,ic="doc"){return `<div class="empty">${icon(ic)}<strong>${esc(title)}</strong><span>${esc(body)}</span></div>`}
function setTab(tab,push=false){
  const map={overview:["club","overview"],club:["club","overview"],trips:["trips","upcoming"],orders:["trips","drafts"],documents:["trips","upcoming"],travelers:["profile","travelers"],wallet:["profile","wallet"],saved:["profile","saved"],notifications:["account","notifications"],settings:["profile","details"],details:["profile","details"]};
  const pair=map[String(tab||"")]||["club","overview"];
  setPage(pair[0],pair[1],push);
}

function toggleMobileMenu(force){
  const menu=$("sideMenu"),shade=$("mobileNavShade"),btn=$("mobileMenuBtn");
  if(!menu)return;
  const open=typeof force==="boolean"?force:!menu.classList.contains("mobile-open");
  menu.classList.toggle("mobile-open",open);
  if(shade)shade.classList.toggle("open",open);
  if(btn)btn.setAttribute("aria-expanded",open?"true":"false");
  if(window.innerWidth<=820){
    document.body.style.overflow=open?"hidden":"";
  }
}

function pageKey(section,view){return `${section}-${view}`}
function setPage(section,view,push=false){
  // Redirect any legacy account-settings call to profile-details
  if(section==="account"&&view==="settings"){section="profile";view="details"}
  const key=pageKey(section,view), target=document.querySelector(`[data-page="${key}"]`);
  if(!target){section="club";view="overview"}
  state.section=section;state.view=view;
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.dataset.page===pageKey(section,view)));
  let activeLinkText = "Overview";
  let activeCatText = "My Club";
  document.querySelectorAll(".side-link").forEach(link=>{
    const isMatch = link.dataset.section===section&&link.dataset.view===view;
    link.classList.toggle("active",isMatch);
    if(isMatch) activeLinkText = link.textContent.trim();
  });
  document.querySelectorAll(".side-category").forEach(cat=>{
    const active=cat.dataset.category===section;
    cat.classList.toggle("active",active);
    if(active){
      cat.classList.add("open");
      const h=cat.querySelector("[data-category-toggle]");
      if(h) activeCatText = h.textContent.trim();
    }
    const h=cat.querySelector("[data-category-toggle]");
    if(h)h.setAttribute("aria-expanded",cat.classList.contains("open")?"true":"false");
  });
  if($("mobileCurrentLabel")) $("mobileCurrentLabel").textContent = `${activeCatText} · ${activeLinkText}`;
  toggleMobileMenu(false);
  if(push){
    window.scrollTo({top:Math.max(0,(document.querySelector(".account-stage")?.offsetTop||0)-6),behavior:"auto"});
    post("MY_PROFILE_QUERY_UPDATE",{section,view});
  }
}
function greetingForNow(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"}
function monthYear(v){if(!v)return"—";try{return new Intl.DateTimeFormat(undefined,{month:"short",year:"numeric"}).format(new Date(v))}catch{return date(v)||"—"}}
const ACTION_DOC_STATUSES=new Set(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"]);
function isActionDoc(doc){return ACTION_DOC_STATUSES.has(String(doc?.status||"").toUpperCase())}
function docsForBooking(id){const docs=state.legacyDocuments||arr(state.data?.documents);return docs.filter(d=>String(d.bookingId||"")===String(id||""))}
function actionDocsForBooking(id){return docsForBooking(id).filter(isActionDoc)}
function issuedDocsForBooking(id){return docsForBooking(id).filter(d=>["ISSUED","SENT","ACKNOWLEDGED","READY"].includes(String(d.status||"").toUpperCase()))}
function pageLink(section,view,label,ic="check"){return `<button class="quick-link" type="button" data-section="${esc(section)}" data-view="${esc(view)}"><span class="quick-icon">${icon(ic)}</span><strong>${esc(label)}</strong><span>Open this section of My Profile</span></button>`}
function currentPageFromData(){const d=state.data||{};return [d.requestedSection||state.section||"club",d.requestedView||state.view||"overview"]}

function statusClass(s){s=String(s||"").toUpperCase();if(["ISSUED","SENT","ACKNOWLEDGED","READY","CONFIRMED","POSTED"].includes(s))return"ok";if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDING","HELD"].includes(s))return"warn";if(["CANCELLED","REJECTED","FAILED"].includes(s))return"bad";return""}
function friendly(s){return String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function groupFor(doc){const s=String(doc.status||"").toUpperCase();if(["WAITING_FOR_DATA","WAITING_FOR_SIGNATURE","WAITING_FOR_APPROVAL","REQUIRED","PENDINGREVIEW"].includes(s))return"Action required";if(["ISSUED","SENT","ACKNOWLEDGED"].includes(s))return"Issued documents";if(String(doc.document_code||"").startsWith("F")||String(doc.document_code||"").startsWith("P10"))return"Travel changes";return"Upcoming / preparing"}
function renderHero(){
  const d=state.data;if(!d)return;const p=d.profile||{},c=d.club||{},first=(p.firstName||p.displayName||"Member").split(" ")[0];
  $("heroName").textContent=first;
  $("greetingLine").firstChild.nodeValue=`${greetingForNow()}, `;
  $("heroTier").textContent=c.enrolled?(c.tier?.name||"Member"):"Not enrolled";
  $("heroStatusNote").textContent=c.enrolled?(c.nextTier?`${num(c.progress?.pointsToNext)} points to ${c.nextTier.name}`:"Highest configured level"):"SKANDI Club";
  $("heroNumber").textContent=c.enrolled&&p.clubNumber?`#${p.clubNumber}`:"Account";
  $("heroPoints").textContent=num(c.pointsBalance);
  $("heroTrips").textContent=num(arr(d.trips?.upcoming).length);
  $("heroMemberSince").textContent=c.enrolled?monthYear(c.memberSince||p.accountCreatedAt):"—";
  const progress=Math.max(0,Math.min(100,Number(c.progress?.percent||0)));document.documentElement.style.setProperty("--club-progress",`${progress}%`);
}
function renderOverview(){
  const d=state.data;if(!d)return;const p=d.profile||{},c=d.club||{},progress=Math.max(0,Math.min(100,Number(c.progress?.percent||0))),first=(p.firstName||p.displayName||"Member").split(" ")[0];
  if(!c.enrolled){$("clubView").innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Overview</div><h2>${esc(greetingForNow())}, ${esc(first)}</h2></div><p>Your SKANDI account is active, but SKANDI Club enrollment is not currently linked to this customer profile.</p></div><div class="club-overview-grid"><div class="club-status-panel"><div class="club-status-head"><div><div class="club-status-name">SKANDI Club</div><div class="club-status-caption">Loyalty membership</div></div></div><div class="status-copy" style="margin-top:42px"><h3>Make every journey count.</h3><p>Club status, points and qualification information will appear here once enrollment is active on the canonical customer record.</p><div class="button-row" style="margin-top:22px"><button class="btn cyan" data-route="/skandi-club">Explore SKANDI Club</button><button class="btn" data-route="/my-profile/support">Enrollment help</button></div></div></div><div class="club-points-card"><span class="label">SKANDI Points available</span><div class="points">0</div><p>Points activity starts when Club enrollment and eligible transactions are posted.</p><div class="member-since"><strong>Not enrolled</strong><span>No Club enrollment date is stored for this profile.</span></div></div></div>`;return}
  const recent=arr(c.ledger).slice(0,5);
  $("clubView").innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Overview</div><h2>${esc(greetingForNow())}, ${esc(first)}</h2></div><p>A concise view of your SKANDI Club account, current status and the activity that moves you toward your next level.</p></div><div class="club-overview-grid"><section class="club-status-panel"><div class="club-status-head"><div><div class="club-status-name">${esc(c.tier?.name||"Member")}</div><div class="club-status-caption">Current Club Status</div></div><div class="club-number-badge">Club ${esc(p.clubNumber||p.memberId||"—")}</div></div><div class="club-status-body"><div class="status-ring" style="--p:${progress}"><div class="status-ring-content"><strong>${progress.toFixed(0)}%</strong><span>${c.nextTier?`to ${esc(c.nextTier.name)}`:"top level"}</span></div></div><div class="status-copy"><h3>${c.nextTier?`${esc(c.tier?.name||"Member")} → ${esc(c.nextTier.name)}`:`${esc(c.tier?.name||"Member")} status`}</h3><p>${c.nextTier?`${num(c.progress?.pointsToNext)} more SKANDI Points are needed to reach ${esc(c.nextTier.name)} based on the current configured tier thresholds.`:"You are currently at the highest configured SKANDI Club level."}</p><div class="status-facts"><div class="status-fact"><strong>${Number(c.tier?.multiplier||1).toFixed(2).replace(/\.00$/,'')}×</strong><span>Earning multiplier</span></div><div class="status-fact"><strong>${num(c.tier?.minPoints||0)}</strong><span>Level threshold</span></div><div class="status-fact"><strong>${c.nextTier?num(c.nextTier.minPoints):"—"}</strong><span>Next threshold</span></div></div></div></div></section><aside class="club-points-card"><span class="label">SKANDI Points available</span><div class="points">${num(c.pointsBalance)}</div><p>Your available balance is calculated from the canonical SKANDI Points ledger, excluding reversed, void and cancelled entries.</p><div class="member-since"><strong>Club Member since ${esc(monthYear(c.memberSince||p.accountCreatedAt))}</strong><span>${p.clubNumber?`Membership #${esc(p.clubNumber)}`:"Membership linked to this account"}</span></div></aside></div><h3 class="quick-links-title">My Club</h3><div class="quick-links">${pageLink("club","activity","Points Activity","wallet")}${pageLink("club","program","Program Information","check")}${pageLink("profile","details","Personal Information","user")}</div><div class="club-snapshot"><div class="club-snapshot-head"><strong>Recent Club activity</strong><button type="button" data-section="club" data-view="activity">View all activity</button></div>${recent.length?recent.map(x=>`<div class="club-activity-mini"><div class="date">${esc(date(x.date))}</div><strong>${esc(x.description||friendly(x.type)||"SKANDI Club activity")}</strong><div class="pts ${Number(x.amount)<0?"neg":""}">${Number(x.amount)>0?"+":""}${num(x.amount)}</div></div>`).join(""):`<div class="club-activity-mini"><div class="date">—</div><strong>No posted Club activity yet</strong><div class="pts">0</div></div>`}</div>`
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
  const d=state.data,c=d?.club||{},tiers=arr(c.tiers).length?arr(c.tiers):DEFAULT_DATA.club.tiers,ledger=arr(c.ledger);
  const activityRoot=$("clubActivityView"),programRoot=$("clubProgramView");
  if(activityRoot){let rows=ledger;if(state.ledgerFilter==="earned")rows=rows.filter(x=>Number(x.amount)>0);else if(state.ledgerFilter==="used")rows=rows.filter(x=>Number(x.amount)<0);else if(state.ledgerFilter==="pending")rows=rows.filter(x=>String(x.status||"").toUpperCase()==="PENDING");activityRoot.innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Account Activity</div><h2>Points Activity</h2></div><p>Posted and pending entries from your canonical SKANDI Points ledger.</p></div><div class="activity-toolbar"><div class="activity-filters">${[["all","All"],["earned","Earned"],["used","Used"],["pending","Pending"]].map(([v,l])=>`<button class="activity-filter ${state.ledgerFilter===v?"active":""}" data-ledger-filter="${v}">${l}</button>`).join("")}</div><div style="color:rgba(255,255,255,.42);font-size:10px">${num(rows.length)} entries</div></div><div class="activity-list">${rows.length?rows.map(x=>`<div class="activity-row"><div class="date">${esc(date(x.date))}</div><div><strong>${esc(x.description||friendly(x.type)||"SKANDI Club activity")}</strong><small>${esc(x.bookingReference||friendly(x.status||"Posted"))}</small></div><div class="amount ${Number(x.amount)<0?"neg":""}">${Number(x.amount)>0?"+":""}${num(x.amount)} pts</div></div>`).join(""):empty("No matching activity","There are no Club ledger entries in this filter.","wallet")}</div>`}
  if(programRoot){programRoot.innerHTML=`<div class="page-intro"><div><div class="kicker">My Club · Program Information</div><h2>Club Levels</h2></div><p>The level names, point thresholds and earning multipliers below come directly from the active SKANDI Club configuration. Benefits are not invented here when they have not been configured.</p></div><div class="tier-table"><div class="tier-row header"><span>Club level</span><span>From</span><span>Through</span><span>Multiplier</span></div>${tiers.map(t=>`<div class="tier-row ${t.id===c.tier?.id?"current":""}"><strong>${esc(t.name)}</strong><span>${num(t.minPoints)} pts</span><span>${t.maxPoints===null||t.maxPoints===undefined?"No upper limit":`${num(t.maxPoints)} pts`}</span><span>${Number(t.multiplier||1).toFixed(2).replace(/\.00$/,'')}×</span></div>`).join("")}</div><div class="provider-note" style="margin-top:18px">SKANDI Club status is determined by the active Club configuration and your posted SKANDI Points balance. Program-specific benefits should only appear here once they are defined in the Club configuration.</div>`}
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
function lookupLabel(list,id,fn){const found=arr(list).find(x=>String(x.id)===String(id));return found?fn(found):id}

// SAS-Inspired Modular Personal Information Renderer (Unlockable Edit Cards)
function renderProfileSummary(){
  const d=state.data||DEFAULT_DATA,p=d.profile||{},refs=d.references||DEFAULT_DATA.references,root=$("profileSummary");if(!root)return;
  const countries=arr(refs.countries).length?arr(refs.countries):DEFAULT_DATA.references.countries;
  const languages=arr(refs.languages).length?arr(refs.languages):DEFAULT_DATA.references.languages;
  const airports=arr(refs.airports).length?arr(refs.airports):DEFAULT_DATA.references.airports;

  const fullName=[p.firstName,p.lastName].filter(Boolean).join(" ")||(p.displayName&&p.displayName!=="Member"?p.displayName:"Not saved");
  const countryLabel=p.countryOfResidenceId?lookupLabel(countries,p.countryOfResidenceId,x=>x.name):"Not saved";
  const langLabel=p.preferredLanguageId?lookupLabel(languages,p.preferredLanguageId,x=>x.name):"English";
  const airportObj=airports.find(x=>String(x.id)===String(p.preferredDepartureAirportId))||airports[0];
  const favs=arr(d.favorites);

  const editPersonal = state.editCard==="personal";
  const editPassport = state.editCard==="passport";
  const editAirport  = state.editCard==="airport";

  root.innerHTML = `
    <!-- Section 1: Personal Details & Sign-in Identity (SAS top row) -->
    <div class="sas-group">
      <div class="sas-grid">
        <div class="sas-card ${editPersonal?"editing":""}">
          <div class="sas-card-top">
            <h4>Personal details</h4>
            ${!editPersonal?`<button class="sas-edit-pill" type="button" data-unlock-card="personal">Edit</button>`:""}
          </div>
          ${!editPersonal ? `
            <div class="sas-fields">
              <div class="sas-field"><span>Name</span><strong>${esc(fullName)}</strong></div>
              <div class="sas-field"><span>Phone number</span><strong>${esc(p.phone||"Not saved")}</strong></div>
              <div class="sas-field"><span>Date of birth</span><strong>${esc(p.dateOfBirth?date(p.dateOfBirth):"Not saved")}</strong></div>
              <div class="sas-field"><span>Country / Address</span><strong>${esc([p.addressLine,countryLabel].filter(Boolean).join(", ")||"Not saved")}</strong></div>
              <div class="sas-field"><span>Email</span><strong>${esc(p.email||"Not saved")}</strong></div>
              <div class="sas-field"><span>Language</span><strong>${esc(langLabel)}</strong></div>
            </div>
          ` : `
            <form id="sasPersonalForm" class="profile-form">
              <div class="field"><label>First name</label><input class="control" name="firstName" value="${esc(p.firstName||"")}" placeholder="First name" required></div>
              <div class="field"><label>Last name</label><input class="control" name="lastName" value="${esc(p.lastName||"")}" placeholder="Last name" required></div>
              <div class="field"><label>Date of birth</label><input class="control" type="date" name="dateOfBirth" value="${esc(p.dateOfBirth||"")}"></div>
              <div class="field"><label>Phone number</label><input class="control" name="phone" value="${esc(p.phone||"")}" placeholder="+1 (555) 000-0000"></div>
              <div class="field"><label>Email</label><input class="control" type="email" name="email" value="${esc(p.email||"")}" placeholder="name@example.com"></div>
              <div class="field"><label>Preferred language</label><select class="control" name="preferredLanguageId">${languages.map(x=>`<option value="${esc(x.id)}" ${x.id===p.preferredLanguageId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Street address / City</label><input class="control" name="addressLine" value="${esc(p.addressLine||"")}" placeholder="75 Baxter St, 10013 New York"></div>
              <div class="field"><label>Country of residence</label><select class="control" name="countryOfResidenceId"><option value="">Select</option>${countries.map(x=>`<option value="${esc(x.id)}" ${x.id===p.countryOfResidenceId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>
              <div class="field full"><div class="button-row" style="margin-top:6px"><button class="btn primary" type="submit">Save changes</button><button class="btn soft" type="button" data-cancel-card>Cancel</button></div></div>
            </form>
          `}
        </div>

        <div class="sas-card">
          <div class="sas-card-top">
            <h4>Password & Security</h4>
            <button class="sas-edit-pill" type="button" id="logoutBtn">Log out</button>
          </div>
          <div class="sas-fields">
            <div class="sas-field"><span>Password</span><strong style="letter-spacing:.22em;font-size:15px">••••••••</strong></div>
            <div class="sas-field"><span>Account status</span><strong>${esc(p.status||"Active")}</strong></div>
          </div>
          <p style="margin:16px 0 0;color:var(--sk-muted);font-size:11px;line-height:1.55">Sign-in credentials are managed securely through your authenticated SKANDI member session.</p>
        </div>
      </div>

      <!-- Passport & Travel Preferences Card (SAS second row) -->
      <div class="sas-grid" style="margin-top:18px">
        <div class="sas-card ${editPassport?"editing":""}">
          <div class="sas-card-top">
            <h4>Passport & Travel details</h4>
            ${!editPassport?`<button class="sas-edit-pill" type="button" data-unlock-card="passport">Edit</button>`:""}
          </div>
          <p class="sas-desc">Add your travel document and onboard preferences so we can pre-fill your details during check-in and booking.</p>
          ${!editPassport ? `
            <div class="sas-fields">
              <div class="sas-field"><span>Passport number</span><strong>${esc(p.passportLast4?`•••• •••• ${p.passportLast4}`:"Not saved")}</strong></div>
              <div class="sas-field"><span>Nationality</span><strong>${esc(countryLabel)}</strong></div>
              <div class="sas-field"><span>Seat preference</span><strong>${esc(friendly(p.payload?.seatPreference||p.seatPreference||"No preference"))}</strong></div>
              <div class="sas-field"><span>Preferred currency</span><strong>${esc(p.preferredCurrency||"USD")}</strong></div>
              <div class="sas-field"><span>Dietary preferences</span><strong>${esc(p.dietaryPrefs||"None saved")}</strong></div>
              <div class="sas-field"><span>Accessibility needs</span><strong>${esc(p.accessibilityNeeds||"None saved")}</strong></div>
            </div>
          ` : `
            <form id="sasPassportForm" class="profile-form">
              <div class="field"><label>Preferred currency</label><select class="control" name="preferredCurrency"><option value="USD" ${p.preferredCurrency==="USD"?"selected":""}>USD</option><option value="SEK" ${p.preferredCurrency==="SEK"?"selected":""}>SEK</option><option value="NOK" ${p.preferredCurrency==="NOK"?"selected":""}>NOK</option><option value="DKK" ${p.preferredCurrency==="DKK"?"selected":""}>DKK</option><option value="EUR" ${p.preferredCurrency==="EUR"?"selected":""}>EUR</option></select></div>
              <div class="field"><label>Seat preference</label><select class="control" name="seatPreference"><option value="">No preference</option><option value="window" ${(p.payload?.seatPreference||p.seatPreference)==="window"?"selected":""}>Window</option><option value="aisle" ${(p.payload?.seatPreference||p.seatPreference)==="aisle"?"selected":""}>Aisle</option></select></div>
              <div class="field"><label>Dietary preferences</label><input class="control" name="dietaryPrefs" value="${esc(p.dietaryPrefs||"")}" placeholder="e.g. Vegetarian, Gluten-free"></div>
              <div class="field"><label>Nationality / Country</label><select class="control" name="countryOfResidenceId"><option value="">Select</option>${countries.map(x=>`<option value="${esc(x.id)}" ${x.id===p.countryOfResidenceId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>
              <div class="field full"><label>General accessibility needs</label><textarea class="control" name="accessibilityNeeds" placeholder="Share any mobility, vision, hearing or service assistance requirements">${esc(p.accessibilityNeeds||"")}</textarea></div>
              <div class="field full"><div class="button-row" style="margin-top:6px"><button class="btn primary" type="submit">Save travel details</button><button class="btn soft" type="button" data-cancel-card>Cancel</button></div></div>
            </form>
          `}
        </div>
      </div>
    </div>

    <!-- Section 2: Customize your flight search (SAS middle section) -->
    <div class="sas-group">
      <div class="sas-group-head">
        <h3>Customize your travel search</h3>
        <p>Choose your default departure airport and manage your saved destinations to speed up the booking process.</p>
      </div>
      <div class="sas-grid equal">
        <div class="sas-card ${editAirport?"editing":""}">
          <div class="sas-card-top"><h4>Default airport</h4></div>
          <p class="sas-desc">Add your default airport to easily select where you usually depart from.</p>
          ${!editAirport ? `
            <div class="sas-airport-row">
              <div class="sas-airport-badge">${icon("tower")}</div>
              <div class="sas-airport-meta">
                <strong>${esc(airportObj?`${airportObj.city}, ${airportObj.name}, ${airportObj.iata}`:"Not selected")}</strong>
                <span>${esc(airportObj?.country||"Select departure airport")}</span>
              </div>
              <button class="sas-text-btn" type="button" data-unlock-card="airport">Edit</button>
            </div>
          ` : `
            <form id="sasAirportForm" class="profile-form">
              <div class="field full">
                <label>Home / Departure Airport</label>
                <select class="control" name="preferredDepartureAirportId">
                  ${airports.map(x=>`<option value="${esc(x.id)}" ${x.id===p.preferredDepartureAirportId?"selected":""}>${esc(x.city)} · ${esc(x.name)} (${esc(x.iata)})</option>`).join("")}
                </select>
              </div>
              <div class="field full"><div class="button-row"><button class="btn primary" type="submit">Save airport</button><button class="btn soft" type="button" data-cancel-card>Cancel</button></div></div>
            </form>
          `}
        </div>

        <div class="sas-card">
          <div class="sas-card-top"><h4>Favorite destinations</h4></div>
          <p class="sas-desc">Save your favorite places to quickly pick where you want to travel and receive tailored offers.</p>
          ${favs.length ? favs.slice(0,3).map(f=>`
            <div class="sas-airport-row" style="border-bottom:1px solid rgba(255,255,255,.07);padding:9px 0">
              <div class="sas-airport-badge">${icon("plane")}</div>
              <div class="sas-airport-meta">
                <strong>${esc(f.title)}</strong>
                <span>${esc(friendly(f.type||"Destination"))}</span>
              </div>
              <button class="sas-text-btn" type="button" data-remove-favorite="${esc(f.id)}">Remove</button>
            </div>
          `).join("") : `
            <div class="sas-airport-row">
              <div class="sas-airport-badge">${icon("plane")}</div>
              <div class="sas-airport-meta">
                <strong>Stockholm, Arlanda, ARN</strong>
                <span>Sweden</span>
              </div>
              <button class="sas-text-btn" type="button" data-section="profile" data-view="saved">Manage</button>
            </div>
          `}
          <div style="margin-top:16px">
            <button class="sas-edit-pill" type="button" data-section="profile" data-view="saved">View saved destinations</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Communication (SAS bottom section) -->
    <div class="sas-group" style="margin-bottom:10px">
      <div class="sas-group-head">
        <h3>Communication</h3>
        <p>Decide which updates and travel inspiration you want to receive from SKANDI Travels.</p>
      </div>
      <div class="sas-grid equal">
        <div class="sas-card">
          <div class="sas-card-top"><h4>Offers & News</h4></div>
          <p class="sas-desc">Receive travel tips, seasonal charter releases and Club offers.</p>
          <div class="sas-toggle-row">
            <span>E-mail</span>
            <label class="sas-switch"><input type="checkbox" data-comm-toggle="marketingConsent" ${p.marketingConsent?"checked":""}><span class="sas-slider"></span></label>
          </div>
          <div class="sas-toggle-row">
            <span>SMS</span>
            <label class="sas-switch"><input type="checkbox" data-comm-toggle="smsConsent" ${p.smsConsent?"checked":""}><span class="sas-slider"></span></label>
          </div>
        </div>

        <div class="sas-card">
          <div class="sas-card-top"><h4>Personalization</h4></div>
          <p class="sas-desc">Tailored communication and offers based on your preferences and activity within SKANDI Club.</p>
          <div class="sas-toggle-row" style="align-items:flex-start">
            <span style="font-size:12px;color:rgba(255,255,255,.76);line-height:1.55">I consent to SKANDI Travels personalizing my SKANDI Club membership and sending tailored travel recommendations and offers.</span>
            <label class="sas-switch" style="margin-top:2px"><input type="checkbox" data-comm-toggle="personalizationConsent" ${p.personalizationConsent!==false?"checked":""}><span class="sas-slider"></span></label>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:18px">
        <button class="btn primary" type="button" id="unsubscribeAllBtn">Unsubscribe from all</button>
      </div>
    </div>
  `;
}

async function saveProfileChanges(partial){
  const p = state.data.profile || {};
  const merged = {
    ...p,
    ...partial,
    displayName: [partial.firstName ?? p.firstName, partial.lastName ?? p.lastName].filter(Boolean).join(" ") || p.displayName || "Member",
    payload: { ...(p.payload||{}), seatPreference: partial.seatPreference ?? p.payload?.seatPreference ?? p.seatPreference ?? "" }
  };
  state.data.profile = merged;
  state.editCard = null;
  renderHero();
  renderOverview();
  renderProfileSummary();
  if(window.parent===window){
    toast("Personal information updated.");
    return;
  }
  busy(true);
  try{
    const r=await request("MY_PROFILE_SAVE_PROFILE",{profile:merged}),data=r.result||r;
    toast("Personal information updated.");
    if(data.providerSync){const note=$("providerSyncNote");note.classList.remove("hidden");note.textContent=data.providerSync.ok?"Travel supplier profile synchronized.":data.providerSync.skipped?data.providerSync.reason:`Profile saved. Supplier sync will retry later: ${data.providerSync.error?.message||"unavailable"}`}
    await refresh();
  }catch(x){toast(x.message,true)}finally{busy(false)}
}

function renderAll(){
  if(!state.data) state.data = structuredClone(DEFAULT_DATA);
  renderHero();
  renderOverview();
  renderTrips();
  renderClub();
  renderTravelers();
  renderDocuments();
  renderWallet();
  renderSaved();
  renderNotifications();
  renderProfileSummary();
  const [section,view]=currentPageFromData();
  setPage(section,view,false);
}
function openDrawer(){$("drawerShade").classList.add("open");$("bookingDrawer").classList.add("open");document.body.style.overflow="hidden"}function closeDrawer(){$("drawerShade").classList.remove("open");$("bookingDrawer").classList.remove("open");document.body.style.overflow=""}
async function loadBooking(id){busy(true);openDrawer();$("bookingDetail").innerHTML=empty("Loading trip","Checking the latest booking and supplier capabilities.","plane");try{const res=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id});state.bookingDetail=res.result||res;renderBookingDetail()}catch(e){$("bookingDetail").innerHTML=empty("Trip unavailable",e.message,"plane")}finally{busy(false)}}
function renderBookingDetail(){
  const d=state.bookingDetail;if(!d)return;const b=d.booking||{},p=d.provider||{},cap=d.capabilities||{},air=p.air,stay=p.stay,car=p.car,localDocs=docsForBooking(b.id),tasks=localDocs.filter(isActionDoc),issued=issuedDocsForBooking(b.id),providerDocs=arr(air?.documents);
  const taskHtml=tasks.length?`<div class="trip-attention"><strong>${tasks.length} item${tasks.length===1?"":"s"} require your action before travel</strong><p>These requests belong to this booking and are kept with the trip rather than in a separate document center.</p></div><div class="card pad" style="margin-bottom:18px"><h3 style="margin-bottom:8px">Requested travel information</h3>${tasks.map(doc=>`<div class="trip-doc-task"><div class="docicon">${esc(String(doc.document_code||"DOC").slice(0,3))}</div><div><strong>${esc(doc.definition_name||doc.document_code||"Travel information")}</strong><span>${esc(friendly(doc.status||"Required"))}${doc.document_number?` · ${esc(doc.document_number)}`:""}</span></div><div class="button-row"><button class="btn small" data-open-doc="${esc(doc.id)}">Open</button><button class="btn small primary" data-complete-doc="${esc(doc.id)}">Complete</button></div></div>`).join("")}</div>`:"";
  const docsHtml=(issued.length||providerDocs.length)?`<h3 class="subhead">Trip documents</h3><div class="provider-doc-list">${issued.map(doc=>`<div class="provider-doc"><div><strong>${esc(doc.definition_name||doc.document_code||"SKANDI document")}</strong><span>${esc(doc.document_number||friendly(doc.status))}</span></div><button class="btn small" data-open-doc="${esc(doc.id)}">Open</button></div>`).join("")}${providerDocs.map(doc=>`<div class="provider-doc"><div><strong>${esc(friendly(doc.type||"Airline document"))}</strong><span>${esc(doc.uniqueIdentifier||doc.id||"Issued by airline")}</span></div><span>Airline issued</span></div>`).join("")}</div>`:"";
  $("bookingDetail").innerHTML=`<div class="booking-hero"><div class="kicker" style="color:var(--sk-aqua)">Booking ${esc(b.bookingReference||b.id)}</div><div class="route">${esc(b.origin||air?.slices?.[0]?.origin?.iataCode||"SKANDI")} → ${esc(b.destination||air?.slices?.[Math.max(0,arr(air?.slices).length-1)]?.destination?.iataCode||"Trip")}</div><p>${esc(date(b.departureDate))}${b.returnDate?` · ${esc(date(b.returnDate))}`:""} · ${esc(friendly(b.status||air?.status||"Booked"))}</p></div>${taskHtml}${arr(d.airlineChanges).length?`<div class="provider-note"><strong>Airline schedule update</strong><br>${arr(d.airlineChanges).length} airline-initiated change${arr(d.airlineChanges).length===1?"":"s"} need review. Available actions are determined by the airline payload.</div>`:""}<h3 class="subhead">Manage this trip</h3><div class="cap-grid">${air?`<div class="cap"><strong>Flight changes</strong><span>${cap.flightChange?"This order can be re-shopped through the airline API.":"The airline does not currently expose self-service changes for this order."}</span>${cap.flightChange?`<div style="margin-top:10px"><button class="btn small primary" data-manage="flight-change">Change flight</button></div>`:""}</div><div class="cap"><strong>Cancellation</strong><span>${cap.flightCancel?"A live cancellation quote can be requested before anything is cancelled.":"API cancellation is not available for this order."}</span>${cap.flightCancel?`<div style="margin-top:10px"><button class="btn small" data-manage="flight-cancel">Get cancellation quote</button></div>`:""}</div><div class="cap"><strong>Additional baggage</strong><span>${cap.postBookingBaggage?`${arr(d.baggage).length} baggage option${arr(d.baggage).length===1?"":"s"} currently available for the passenger/segment combinations returned by the airline.`:"No post-booking baggage offer is currently available from the airline."}</span>${cap.postBookingBaggage?`<div style="margin-top:10px"><button class="btn small" data-manage="baggage">Add baggage</button></div>`:""}</div><div class="cap"><strong>Seats</strong><span>SKANDI does not advertise post-booking seat reassignment here because the current Duffel post-booking service flow supports baggage, not seat reassignment.</span></div>`:""}${stay?`<div class="cap"><strong>Hotel booking</strong><span>${esc(stay.accommodation?.name||"Accommodation")} · ${esc(friendly(stay.status))}${stay.checkInDate?` · ${esc(date(stay.checkInDate))}`:""}</span>${cap.stayCancel?`<div style="margin-top:10px"><button class="btn small danger" data-manage="stay-cancel">Cancel stay</button></div>`:""}</div>`:""}${car?`<div class="cap"><strong>Car rental</strong><span>${esc(car.car?.name||"Rental car")} · ${esc(friendly(car.status))}</span>${cap.carCancel?`<div style="margin-top:10px"><button class="btn small danger" data-manage="car-cancel">Cancel rental</button></div>`:""}</div>`:""}</div>${docsHtml}<h3 class="subhead">Trip components</h3>${arr(b.components).length?arr(b.components).map(c=>`<div class="component"><strong>${esc(c.title||friendly(c.type))}</strong><span>${esc(friendly(c.type))} · ${esc(friendly(c.status||"Booked"))}${c.totalAmount!==null?` · ${esc(money(c.totalAmount,c.currency))}`:""}</span></div>`).join(""):"<div class='provider-note'>Detailed trip components are not published for this booking yet.</div>"}${arr(d.airlineChanges).length?`<h3 class="subhead">Airline-initiated changes</h3>${arr(d.airlineChanges).map(c=>`<div class="component"><strong>Schedule change · ${esc(date(c.updatedAt||c.createdAt))}</strong><span>Available actions: ${esc(arr(c.availableActions).join(", ")||"review")}</span>${arr(c.availableActions).includes("accept")?`<div style="margin-top:8px"><button class="btn small primary" data-accept-airline-change="${esc(c.id)}">Accept change</button></div>`:""}</div>`).join("")}`:""}<div class="provider-note">Self-service controls are shown only when the live supplier payload exposes that action. SKANDI keeps booking-specific information requests with the trip that needs them.</div>`
}
function openModal(title,body,foot=""){$("modalTitle").textContent=title;$("modalBody").innerHTML=body;$("modalFoot").innerHTML=foot;$("modalShade").classList.add("open")}function closeModal(){$("modalShade").classList.remove("open");state.payment=null;state.elements=null}
function linkBookingModal(){openModal("Link a booking",`<div class="provider-note">Use the booking reference and traveler surname exactly as shown on the confirmation. This verifies ownership before the booking is added to My Trips.</div><form id="linkBookingForm" class="profile-form" style="margin-top:16px"><div class="field"><label>Booking reference</label><input class="control" name="bookingReference" required maxlength="120" autocomplete="off" placeholder="Booking reference"></div><div class="field"><label>Traveler surname</label><input class="control" name="lastName" required maxlength="160" autocomplete="family-name" placeholder="Surname"></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmLinkBooking">Link booking</button>`)}
function travelerModal(t={}){const refs=state.data?.references||DEFAULT_DATA.references;const countries=arr(refs.countries).length?arr(refs.countries):DEFAULT_DATA.references.countries;openModal(t.id?"Edit traveler":"Add traveler",`<form id="travelerForm" class="profile-form"><input type="hidden" name="id" value="${esc(t.id||"")}"><div class="field"><label>First name</label><input class="control" name="firstName" required value="${esc(t.firstName||"")}"></div><div class="field"><label>Last name</label><input class="control" name="lastName" required value="${esc(t.lastName||"")}"></div><div class="field"><label>Date of birth</label><input class="control" type="date" name="dateOfBirth" value="${esc(t.dateOfBirth||"")}"></div><div class="field"><label>Gender</label><select class="control" name="gender"><option value="">Select</option><option value="female" ${lowerEq(t.gender,"female")}>Female</option><option value="male" ${lowerEq(t.gender,"male")}>Male</option><option value="unspecified" ${lowerEq(t.gender,"unspecified")}>Unspecified</option></select></div><div class="field"><label>Nationality</label><select class="control" name="nationalityId"><option value="">Select</option>${countries.map(x=>`<option value="${esc(x.id)}" ${x.id===t.nationalityId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div><div class="field"><label>Contact email</label><input class="control" type="email" name="email" value="${esc(t.email||"")}"></div><div class="field"><label>Phone</label><input class="control" name="phone" value="${esc(t.phone||"")}"></div><div class="field"><label>Passport expiry</label><input class="control" type="date" name="passportExpiry" value="${esc(t.passportExpiry||"")}"></div><div class="field full"><label>Dietary preferences</label><input class="control" name="dietaryPrefs" value="${esc(t.dietaryPrefs||"")}"></div><div class="field full"><label>Accessibility needs</label><textarea class="control" name="accessibilityNeeds">${esc(t.accessibilityNeeds||"")}</textarea></div><div class="field full"><label class="checkbox"><input type="checkbox" name="isPrimary" ${t.isPrimary?"checked":""}><span>Use as primary traveler profile.</span></label></div></form>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="saveTravelerModal">Save traveler</button>`)}function lowerEq(a,b){return String(a||"").toLowerCase()===b?"selected":""}
async function manage(kind){const d=state.bookingDetail,b=d?.booking;if(!b)return;if(kind==="flight-cancel"){busy(true);try{const r=await request("MY_PROFILE_FLIGHT_CANCEL_QUOTE",{bookingId:b.id});const q=r.result||r,canDirect=Number(q.cancellation?.refundAmount||0)<=0;openModal("Cancellation quote",`<div class="card pad"><h3>Airline cancellation quote</h3><p>Refund quoted by airline</p><div style="font-family:Montserrat;font-size:32px;font-weight:700;color:var(--sk-aqua-soft);margin-top:10px">${esc(money(q.cancellation?.refundAmount,q.cancellation?.refundCurrency))}</div><p style="margin-top:12px">Quote expires ${esc(date(q.cancellation?.expiresAt))}. Nothing has been cancelled yet.</p></div>${!canDirect?`<div class="provider-note">This cancellation includes a customer refund. SKANDI will not cancel the supplier order here until the customer-refund workflow is completed. Continue through Support so the refund and cancellation remain one controlled transaction.</div>`:""}`,canDirect?`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn danger" data-confirm-cancel="${esc(q.cancellation?.id||"")}">Confirm cancellation</button>`:`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn primary" data-route="/my-profile/support">Continue with Support</button>`)}catch(e){toast(e.message,true)}finally{busy(false)}}else if(kind==="flight-change")flightChangeModal();else if(kind==="baggage")baggageModal();else if(kind==="stay-cancel")confirmSimple("Cancel hotel booking","This sends a live cancellation request to the accommodation supplier. Cancellation terms from your booking still apply.","MY_PROFILE_STAY_CANCEL");else if(kind==="car-cancel")confirmSimple("Cancel car rental","This sends a live cancellation request to the rental supplier. Supplier conditions still apply.","MY_PROFILE_CAR_CANCEL")}
function flightChangeModal(){const air=state.bookingDetail?.provider?.air,slices=arr(air?.slices);openModal("Change flight",`<form id="changeSearchForm" class="profile-form"><div class="field full"><label>Flight to change</label><select class="control" name="removeSliceId">${slices.map(s=>`<option value="${esc(s.id)}">${esc(s.origin?.iataCode||"")} → ${esc(s.destination?.iataCode||"")}</option>`).join("")}</select></div><div class="field"><label>Origin</label><input class="control" name="origin" maxlength="3" value="${esc(slices[0]?.origin?.iataCode||"")}"></div><div class="field"><label>Destination</label><input class="control" name="destination" maxlength="3" value="${esc(slices[0]?.destination?.iataCode||"")}"></div><div class="field"><label>New departure date</label><input class="control" type="date" name="departureDate" min="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Cabin</label><select class="control" name="cabinClass"><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div></form><div id="changeOffers"></div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="searchChangesBtn">Search changes</button>`)}
async function searchChanges(){const f=$("changeSearchForm"),b=state.bookingDetail.booking;busy(true);try{const r=await request("MY_PROFILE_FLIGHT_CHANGE_SEARCH",{bookingId:b.id,removeSliceId:f.removeSliceId.value,addSlice:{origin:f.origin.value.toUpperCase(),destination:f.destination.value.toUpperCase(),departureDate:f.departureDate.value,cabinClass:f.cabinClass.value}}),data=r.result||r,offers=arr(data.offers);$("changeOffers").innerHTML=offers.length?`<h3 class="subhead">Available alternatives</h3>${offers.map(o=>`<div class="choice"><div><strong>${esc(arr(o.slices?.add)[0]?.origin?.iataCode||"")} → ${esc(arr(o.slices?.add)[0]?.destination?.iataCode||"")}</strong><span>Change total ${esc(money(o.changeTotalAmount,o.changeTotalCurrency))}${o.penaltyTotalAmount?` · penalty ${esc(money(o.penaltyTotalAmount,o.penaltyTotalCurrency))}`:""}</span></div><div class="price">${esc(money(o.changeTotalAmount,o.changeTotalCurrency))}</div><button class="btn small primary" data-select-change="${esc(o.id)}" data-change-amount="${esc(o.changeTotalAmount||"0")}">Select</button></div>`).join("")}`:empty("No alternatives returned","The airline did not return a change offer for these details.","plane")}catch(e){toast(e.message,true)}finally{busy(false)}}
async function selectChange(offerId,amount){if(Number(amount)<0){openModal("Refund change requires support",`<div class="provider-note">This flight change would create a customer refund. The current SKANDI supplier flow can confirm the airline change, but customer refund settlement must remain part of the same controlled transaction. Continue through Support instead of confirming it here.</div>`,`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" data-route="/my-profile/support">Continue with Support</button>`);return}busy(true);try{const b=state.bookingDetail.booking,r=await request("MY_PROFILE_FLIGHT_CHANGE_SELECT",{bookingId:b.id,orderChangeOfferId:offerId}),data=r.result||r,change=data.change;if(!change?.id)throw new Error("The airline did not return a pending change.");const prep=await request("MY_PROFILE_FLIGHT_CHANGE_PREPARE_PAYMENT",{bookingId:b.id,orderChangeId:change.id}),pd=prep.result||prep;if(pd.paymentRequired)await openPayment({kind:"change",bookingId:b.id,orderChangeId:change.id,prepared:pd});else{await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId:b.id,orderChangeId:change.id});toast("Flight change confirmed.");closeModal();await refreshBooking()}}catch(e){toast(e.message,true)}finally{busy(false)}}
async function baggageModal(){const b=state.bookingDetail.booking;busy(true);try{const r=await request("MY_PROFILE_BAGGAGE_LIST",{bookingId:b.id}),data=r.result||r,services=arr(data.services);openModal("Add baggage",services.length?`<div id="bagChoices">${services.map(s=>`<label class="choice"><input type="checkbox" value="${esc(s.id)}" data-max="${Number(s.maximumQuantity||1)}"><div><strong>${esc(s.label||"Additional baggage")}</strong><span>${arr(s.passengerIds).length?`Passenger-specific · `:""}${arr(s.segmentIds).length?"Flight-specific":""}</span></div><div class="price">${esc(money(s.totalAmount,s.totalCurrency))}</div></label>`).join("")}</div>`:empty("No baggage offers","The airline is not currently offering post-booking baggage for this order.","bag"),services.length?`<button class="btn soft" data-close-modal>Close</button><button class="btn primary" id="prepareBagsBtn">Continue to payment</button>`:`<button class="btn soft" data-close-modal>Close</button>`)}catch(e){toast(e.message,true)}finally{busy(false)}}
async function prepareBags(){const services=[...document.querySelectorAll("#bagChoices input:checked")].map(x=>({id:x.value,quantity:1}));if(!services.length){toast("Choose at least one baggage option.",true);return}busy(true);try{const b=state.bookingDetail.booking,r=await request("MY_PROFILE_BAGGAGE_PREPARE_PAYMENT",{bookingId:b.id,services}),data=r.result||r;await openPayment({kind:"baggage",bookingId:b.id,services,prepared:data})}catch(e){toast(e.message,true)}finally{busy(false)}}
async function openPayment(flow){const p=flow.prepared?.payment;if(!p?.clientSecret||!p?.publishableKey)throw new Error("Secure payment could not be prepared.");state.payment=flow;openModal(flow.kind==="baggage"?"Secure baggage payment":"Secure change payment",`<div class="card pad"><h3>${esc(money(p.amount,p.currency))}</h3><p>The payment is authorized first and captured only after the supplier confirms the servicing action.</p></div><div class="stripe-box" id="paymentElement"></div><div id="paymentError" style="color:var(--sk-danger);font-size:11px;margin-top:10px"></div>`,`<button class="btn soft" data-close-modal>Cancel</button><button class="btn primary" id="confirmPaymentBtn">Authorize & continue</button>`);if(!window.Stripe)throw new Error("Secure payment is temporarily unavailable.");state.stripe=Stripe(p.publishableKey);state.elements=state.stripe.elements({clientSecret:p.clientSecret,appearance:{theme:"night",variables:{colorPrimary:"#5fc7cf",colorBackground:"#051221",colorText:"#ffffff",fontFamily:"Inter, sans-serif",borderRadius:"10px"}}});state.elements.create("payment").mount("#paymentElement")}
async function confirmPayment(){const flow=state.payment,p=flow?.prepared?.payment;if(!flow||!state.stripe||!state.elements)return;busy(true);try{const result=await state.stripe.confirmPayment({elements:state.elements,redirect:"if_required"});if(result.error)throw new Error(result.error.message||"Payment authorization failed.");const paymentIntentId=result.paymentIntent?.id||p.paymentIntentId;if(flow.kind==="baggage")await request("MY_PROFILE_BAGGAGE_CONFIRM",{bookingId:flow.bookingId,services:flow.services,paymentIntentId});else await request("MY_PROFILE_FLIGHT_CHANGE_CONFIRM",{bookingId:flow.bookingId,orderChangeId:flow.orderChangeId,paymentIntentId});toast(flow.kind==="baggage"?"Baggage added to your booking.":"Flight change confirmed.");closeModal();await refreshBooking()}catch(e){$("paymentError").textContent=e.message||"Payment could not be completed.";toast(e.message,true)}finally{busy(false)}}
function confirmSimple(title,body,type){openModal(title,`<div class="provider-note">${esc(body)}</div>`,`<button class="btn soft" data-close-modal>Keep booking</button><button class="btn danger" data-confirm-simple="${esc(type)}">Confirm cancellation</button>`)}
async function refreshBooking(){const id=state.bookingDetail?.booking?.id;if(!id)return;const r=await request("MY_PROFILE_BOOKING_DETAIL",{bookingId:id});state.bookingDetail=r.result||r;renderBookingDetail()}
async function refresh(){busy(true);try{const r=await request("MY_PROFILE_REFRESH",{section:state.section,view:state.view});if(r.result?.profile||r.profile){state.data=r.result||r;renderAll()}}catch(e){toast(e.message,true)}finally{busy(false)}}

document.addEventListener("click",async e=>{
  if(e.target.closest("#mobileMenuBtn")){toggleMobileMenu(true);return}
  if(e.target.closest("#closeMobileMenu")||e.target.id==="mobileNavShade"){toggleMobileMenu(false);return}
  const unlock=e.target.closest("[data-unlock-card]");if(unlock){state.editCard=unlock.dataset.unlockCard;renderProfileSummary();return}
  if(e.target.closest("[data-cancel-card]")){state.editCard=null;renderProfileSummary();return}
  if(e.target.id==="unsubscribeAllBtn"){await saveProfileChanges({marketingConsent:false,smsConsent:false,personalizationConsent:false});toast("Unsubscribed from marketing communications.");return}
  if(e.target.id==="logoutBtn"){post("MY_PROFILE_LOGOUT");return}
  const cat=e.target.closest("[data-category-toggle]");if(cat){const wrap=cat.closest(".side-category");const willOpen=!wrap.classList.contains("open");wrap.classList.toggle("open",willOpen);cat.setAttribute("aria-expanded",willOpen?"true":"false");return}
  const page=e.target.closest("[data-section][data-view]");if(page){setPage(page.dataset.section,page.dataset.view,true);return}
  if(e.target.id==="linkBookingBtn"){linkBookingModal();return}
  if(e.target.id==="confirmLinkBooking"){const f=$("linkBookingForm");if(!f?.reportValidity())return;busy(true);try{const data=Object.fromEntries(new FormData(f).entries());await request("MY_PROFILE_LINK_BOOKING",data);toast("Booking linked to your profile.");closeModal();state.section="trips";state.view="upcoming";await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  if(e.target.id==="refreshBtn"){post("CUSTOMER_DOCUMENT_REFRESH",{bookingId:state.bookingDetail?.booking?.id||""},DOC_SOURCE);await refresh();return}
  if(e.target.id==="closeBtn"){post("CUSTOMER_DOCUMENT_CLOSE",{},DOC_SOURCE);setPage("trips","upcoming",true);return}
  const legacy=e.target.closest("[data-tab]");if(legacy){setTab(legacy.dataset.tab,true);return}
  const route=e.target.closest("[data-route]");if(route){post("MY_PROFILE_NAVIGATE",{path:route.dataset.route});return}
  const booking=e.target.closest("[data-booking]");if(booking){loadBooking(booking.dataset.booking);return}
  const lf=e.target.closest("[data-ledger-filter]");if(lf){state.ledgerFilter=lf.dataset.ledgerFilter;renderClub();return}
  if(e.target.closest("[data-close-modal]")){closeModal();return}
  const manageBtn=e.target.closest("[data-manage]");if(manageBtn){manage(manageBtn.dataset.manage);return}
  const removeFav=e.target.closest("[data-remove-favorite]");if(removeFav){busy(true);try{await request("MY_PROFILE_REMOVE_FAVORITE",{favoriteId:removeFav.dataset.removeFavorite});await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const read=e.target.closest("[data-read-notification]");if(read){try{await request("MY_PROFILE_MARK_NOTIFICATION_READ",{notificationId:read.dataset.readNotification});await refresh()}catch(x){toast(x.message,true)}return}
  const edit=e.target.closest("[data-edit-traveler]");if(edit){travelerModal(arr(state.data?.travelers).find(x=>x.id===edit.dataset.editTraveler)||{});return}
  const rem=e.target.closest("[data-remove-traveler]");if(rem){if(confirm("Remove this saved traveler?")){try{await request("MY_PROFILE_REMOVE_TRAVELER",{travelerId:rem.dataset.removeTraveler});await refresh()}catch(x){toast(x.message,true)}}return}
  const openDoc=e.target.closest("[data-open-doc]");if(openDoc){post("CUSTOMER_DOCUMENT_OPEN",{documentId:openDoc.dataset.openDoc},DOC_SOURCE);return}
  const compDoc=e.target.closest("[data-complete-doc]");if(compDoc){post("CUSTOMER_DOCUMENT_COMPLETE",{documentId:compDoc.dataset.completeDoc},DOC_SOURCE);return}
  const acc=e.target.closest("[data-accept-airline-change]");if(acc){busy(true);try{await request("MY_PROFILE_AIRLINE_CHANGE_ACCEPT",{bookingId:state.bookingDetail.booking.id,changeId:acc.dataset.acceptAirlineChange});toast("Airline change accepted.");await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const cancel=e.target.closest("[data-confirm-cancel]");if(cancel){busy(true);try{await request("MY_PROFILE_FLIGHT_CANCEL_CONFIRM",{bookingId:state.bookingDetail.booking.id,cancellationId:cancel.dataset.confirmCancel});toast("Booking cancelled.");closeModal();await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const simple=e.target.closest("[data-confirm-simple]");if(simple){busy(true);try{await request(simple.dataset.confirmSimple,{bookingId:state.bookingDetail.booking.id});toast("Cancellation request completed.");closeModal();await refreshBooking()}catch(x){toast(x.message,true)}finally{busy(false)}return}
  const sel=e.target.closest("[data-select-change]");if(sel){selectChange(sel.dataset.selectChange,sel.dataset.changeAmount);return}
  if(e.target.id==="searchChangesBtn"){searchChanges();return}if(e.target.id==="prepareBagsBtn"){prepareBags();return}if(e.target.id==="confirmPaymentBtn"){confirmPayment();return}
  if(e.target.id==="saveTravelerModal"){const f=$("travelerForm");if(!f?.reportValidity())return;const data=Object.fromEntries(new FormData(f).entries());data.isPrimary=f.isPrimary.checked;if(window.parent===window){const list=arr(state.data.travelers);if(data.id){const idx=list.findIndex(x=>x.id===data.id);if(idx>-1)list[idx]={...list[idx],...data}}else{list.push({...data,id:`trv_${Date.now()}`})}state.data.travelers=list;renderTravelers();closeModal();toast("Traveler saved locally.");return}busy(true);try{await request("MY_PROFILE_SAVE_TRAVELER",{traveler:data});toast("Traveler saved.");closeModal();await refresh()}catch(x){toast(x.message,true)}finally{busy(false)}return}
});

// Handle inline SAS card form submissions & instant communication switch toggles
document.addEventListener("submit", async e=>{
  if(e.target.id==="sasPersonalForm"||e.target.id==="sasPassportForm"||e.target.id==="sasAirportForm"){
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target).entries());
    await saveProfileChanges(formData);
  }
});
document.addEventListener("change", async e=>{
  const toggle = e.target.closest("[data-comm-toggle]");
  if(toggle){
    const key = toggle.dataset.commToggle;
    await saveProfileChanges({ [key]: toggle.checked });
  }
});

$("addTraveler")?.addEventListener("click",()=>travelerModal({}));$("closeDrawer")?.addEventListener("click",closeDrawer);$("drawerShade")?.addEventListener("click",closeDrawer);$("closeModal")?.addEventListener("click",closeModal);$("modalShade")?.addEventListener("click",e=>{if(e.target===$("modalShade"))closeModal()});
window.addEventListener("message",e=>{let m=e.data;if(typeof m==="string"){try{m=JSON.parse(m)}catch{return}}if(!m||typeof m!=="object")return;if(m.source&&m.source!==PARENT)return;const p=m.payload||{};if(m.type==="MY_PROFILE_DATA"){state.data={...structuredClone(DEFAULT_DATA), ...p, profile:{...DEFAULT_DATA.profile, ...(p.profile||{})}, club:{...DEFAULT_DATA.club, ...(p.club||{})}, references:{...DEFAULT_DATA.references, ...(p.references||{})}};state.legacyDocuments=null;renderAll();return}if(m.type==="MY_PROFILE_RESULT"){const h=state.pending.get(p.requestId);if(h){clearTimeout(h.t);state.pending.delete(p.requestId);h.resolve(p)}return}if(m.type==="MY_PROFILE_ERROR"){const h=state.pending.get(p.requestId);if(h){clearTimeout(h.t);state.pending.delete(p.requestId);h.reject(new Error(p.message||"The request failed."))}else toast(p.message||"The request failed.",true);return}if(m.type==="MY_PROFILE_SET_PAGE"){setPage(p.section||"club",p.view||"overview");return}if(m.type==="MY_PROFILE_SET_TAB"){setTab(p.tab||"overview");return}if(m.type==="MY_PROFILE_URL_SYNC_ERROR"){toast("Section opened, but the browser URL could not be updated.",true);return}if(m.type==="CUSTOMER_DOCUMENTS_LOAD"){state.legacyDocuments=arr(p.documents);renderDocuments();renderTrips();return}if(m.type==="CUSTOMER_DOCUMENT_RESULT"){const doc=p.document||{};if(doc.fileUrl){window.open(doc.fileUrl,"_blank","noopener")}else toast("This document has no downloadable file yet.")}if(m.type==="CUSTOMER_DOCUMENT_ACTION_REQUIRED"){const doc=p.document||{};if(doc.bookingId){setPage("trips","upcoming",false);toast("This booking needs your attention. Open the trip to continue.")}else{setPage("profile","travelers",false);toast("Complete the requested traveler information here.")}return}if(m.type==="CUSTOMER_DOCUMENT_ERROR")toast(p.message||"Document request failed.",true)});

const qs=new URLSearchParams(location.search);
if(qs.get("section")) state.section = qs.get("section");
if(qs.get("view")) state.view = qs.get("view");
if(qs.get("tab")) setTab(qs.get("tab"), false);

renderAll();

post("MY_PROFILE_READY",{section:state.section,view:state.view,tab:qs.get("tab")||""});
post("CUSTOMER_DOCUMENT_CENTER_READY",{},DOC_SOURCE);
})();
