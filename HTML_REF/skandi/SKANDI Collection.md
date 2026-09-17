# Search

STATUS: IN PROGRESS
SLUG: /
WIX PAGE: Search.lo9p5
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #skandiCollectionEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 1:13PM "Page is almost styled from my end, page not syncing correctly yet /Samuel"
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1,viewport-fit=cover" name="viewport"/>
<meta content="#022e64" name="theme-color"/>
<title>SKANDI Collection</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<style>
:root{--blue:#022e64;--blue2:#1F6BA3;--accent:#5FC7CF;--bg:#fff;--soft:#f6f8fb;--panel:#fff;--text:#111827;--muted:#5b687b;--line:#dfe5ef;--shadow:0 16px 45px rgba(2,46,100,.10);--radius:20px}
*{box-sizing:border-box;margin:0;padding:0}html,body{font-family:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif;background:#fff;color:var(--text);overflow-x:hidden}button,input,select{font:inherit}.hidden{display:none!important}
.btn{appearance:none;border:1px solid transparent;background:var(--blue);color:#fff;border-radius:999px;padding:13px 20px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px}.btn.secondary{background:#fff;color:var(--blue);border-color:var(--blue)}
.hero{background:linear-gradient(135deg,rgba(2,46,100,.92),rgba(31,107,163,.76)),var(--hero-image,linear-gradient(135deg,#022e64,#1F6BA3));background-size:cover;background-position:center;color:#fff;padding:72px 24px 52px}.wrap{max-width:1180px;margin:0 auto}.eyebrow{display:inline-flex;align-items:center;gap:10px;text-transform:uppercase;letter-spacing:.22em;font-size:12px;font-weight:800;margin-bottom:16px}.eyebrow:before{content:"";width:42px;height:1px;background:var(--accent)}h1{font-size:clamp(38px,6vw,70px);font-weight:300;line-height:1.03;max-width:850px;margin-bottom:18px}h1 strong{font-weight:800}.hero p{font-size:16px;line-height:1.85;max-width:760px;color:#eef6ff}.search{max-width:1180px;margin:-24px auto 0;padding:0 24px;position:relative;z-index:2}.search-card{background:#fff;border:1px solid var(--line);border-radius:26px;box-shadow:var(--shadow);padding:22px}.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:var(--muted)}.field input,.field select{border:1px solid var(--line);border-radius:13px;background:#fff;min-height:46px;padding:10px 12px;outline:none}.field input:focus,.field select:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(95,199,207,.14)}.col2{grid-column:span 2}.col3{grid-column:span 3}.col4{grid-column:span 4}.col6{grid-column:span 6}.col12{grid-column:span 12}.hint{font-size:12px;color:var(--muted);line-height:1.6;margin-top:12px}.section{max-width:1180px;margin:0 auto;padding:58px 24px 0}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}.section h2{font-size:clamp(28px,4vw,44px);line-height:1.12;color:var(--blue)}.copy{font-size:14px;color:#4d5f74;line-height:1.8}.tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}.tab{border:1px solid var(--line);background:#fff;color:var(--blue);border-radius:999px;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;cursor:pointer}.tab.active{background:var(--blue);color:#fff}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}.card{background:#fff;border:1px solid #eef2f7;border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}.thumb{height:150px;background:#e9f3fb center/cover no-repeat}.card-body{padding:18px}.tag{display:inline-flex;border-radius:999px;background:#eef8fb;color:var(--blue);padding:5px 9px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}.card h3{font-size:17px;color:var(--blue);margin-bottom:8px}.card p{font-size:13px;color:#506175;line-height:1.7}.meta{font-size:12px;color:#66758a;margin-top:10px;line-height:1.6}.results{display:grid;gap:14px}.offer{border:1px solid var(--line);border-radius:20px;background:#fff;box-shadow:0 10px 28px rgba(2,46,100,.06);padding:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center}.offer h3{font-size:17px;color:var(--blue);margin-bottom:6px}.price{font-size:26px;font-weight:800;color:var(--blue);text-align:right}.notice{background:#f6fbff;border-left:4px solid var(--accent);border-radius:16px;padding:16px;color:#3b4f67;font-size:13px;line-height:1.7}.toast{position:fixed;right:18px;bottom:18px;background:#022e64;color:#fff;border-radius:12px;padding:12px 16px;display:none;z-index:50;font-size:13px}
@media(max-width:900px){.grid{grid-template-columns:1fr}.col2,.col3,.col4,.col6,.col12{grid-column:auto}.section-head,.offer{display:block}.price{text-align:left;margin-top:10px}.search{padding:0 16px}.hero{padding:56px 20px 46px}.section{padding-top:46px}}


/* LIVE INVENTORY COLLECTION STATES */
#collectionStatus.hidden{display:none}
.card{position:relative}
.card .tier-line{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
.card .tier-tag{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;background:#022e64;color:#fff}
.card .tier-tag.select{background:#eef8fb;color:#022e64;border:1px solid #bfe7eb}
.card .tier-tag.signature{background:#022e64;color:#fff}
.card .tier-tag.excelsior{background:#111827;color:#fff}
.card .tier-tag.partner{background:#5FC7CF;color:#022e64}
.card .card-actions{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}
.card .card-actions .btn{min-height:40px;padding:10px 14px;font-size:10px}
.card .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#5FC7CF;margin-right:6px;box-shadow:0 0 0 4px rgba(95,199,207,.13)}
.inventory-summary{font-size:12px;color:#66758a;font-weight:700;margin-bottom:18px}

</style>
</head>
<body>


<header class="hero" id="hero">
<div class="wrap">
<div class="eyebrow">SKANDI Collection</div>
<h1>Selected travel, <strong>built from Inventory Control.</strong></h1>
<p>Explore the destinations, hotels, experiences and partners currently assigned to Select, Signature and Excelsior in SKANDI Inventory Control.</p>
</div>
</header>
<section class="search">
<div class="search-card">
<div class="grid">
<div class="field col2"><label for="origin">From</label><input id="origin" maxlength="3" placeholder="CPH"/></div>
<div class="field col2"><label for="destination">To</label><input id="destination" maxlength="3" placeholder="PMI"/></div>
<div class="field col2"><label for="departureDate">Depart</label><input id="departureDate" type="date"/></div>
<div class="field col2"><label for="returnDate">Return</label><input id="returnDate" type="date"/></div>
<div class="field col2"><label for="adults">Adults</label><select id="adults"><option>1</option><option selected="">2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></div>
<div class="field col2"><label for="currency">Currency</label><select id="currency"><option>USD</option><option>EUR</option><option>SEK</option><option>NOK</option><option>DKK</option><option>GBP</option></select></div>
<div class="field col3"><label> </label><button class="btn" id="searchBtn">Search packages</button></div>
<div class="field col3"><label> </label><button class="btn secondary" id="clearBtn">Clear results</button></div>
<div class="field col6"><label for="collectionFilter">Content type</label><select id="collectionFilter"><option value="all">All Collection items</option><option value="destinations">Destinations</option><option value="hotels">Hotels</option><option value="tours">Tours &amp; Activities</option><option value="airlines">Airlines</option><option value="airports">Airports</option><option value="partners">SKANDI Partners</option></select></div>
</div>
<div class="hint">Collection content below is read live from Inventory Control. Collection content is read from Inventory Control. Package search uses the canonical live SKANDI booking search service.</div>
</div>
</section>
<main>
<section class="section">
<div class="section-head"><div><div class="eyebrow">Live package search</div><h2>Flight offers for selected routes.</h2></div><p class="copy">Use this as a package-search starting point. Search results come from the canonical SKANDI booking service; checkout remains on the existing /booking flow.</p></div>
<div class="notice" id="searchStatus">Enter route and dates to search selected flight package prices.</div>
<div class="results" id="offers" style="margin-top:18px"></div>
</section>
<section class="section">
<div class="section-head"><div><div class="eyebrow">Live Inventory Control</div><h2>SKANDI Collection.</h2></div><p class="copy">Only published, customer-visible records assigned to Select, Signature, Excelsior or SKANDI Partners are shown here.</p></div>
<div class="tabs" id="tierTabs"></div>
<div class="tabs" id="tabs"></div>
<div class="notice" id="collectionStatus">Loading live SKANDI Collection inventory…</div>
<div class="cards" id="cards" style="margin-top:18px"></div>
</section>
<section class="section" style="padding-bottom:74px">
<div class="notice">Signature Collection public pages should only show customer-safe content. Supplier net rates, allotments, internal remarks, operational notes and raw supplier responses remain backend-only.</div>
</section>
</main>

<div class="toast" id="toast"></div>
<script>
(function(){
  const SOURCE="SKANDI_SIGNATURE_COLLECTION";
  const PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);

  let DATA={items:[],collectionItems:[],partners:[],tiers:{},counts:{},settings:{}};
  let loaded=false;
  let activeTier="all";
  let activeType="all";

  function post(type,payload={}){
    window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
  }
  function esc(v){
    return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  }
  function toast(m){
    const t=$("toast");
    t.textContent=m;
    t.style.display="block";
    setTimeout(()=>t.style.display="none",2600);
  }
  function todayPlus(days){
    const d=new Date();
    d.setDate(d.getDate()+days);
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function cleanIata(v){
    return String(v||"").trim().toUpperCase().replace(/[^A-Z]/g,"").slice(0,3);
  }
  function currentLanguage(){ return "EN"; }
  function initialTier(){
    try{
      const tier=new URLSearchParams(location.search).get("tier");
      const normalized=String(tier||"").toUpperCase();
      return ["SELECT","SIGNATURE","EXCELSIOR","PARTNER"].includes(normalized)?normalized.toLowerCase():"all";
    }catch(_){return"all"}
  }
  function typeLabel(type){
    return ({
      all:"All",
      destinations:"Destinations",
      hotels:"Hotels",
      tours:"Tours & Activities",
      airlines:"Airlines",
      airports:"Airports",
      packages:"Packages",
      transfers:"Transfers",
      "car-rental":"Car Rental",
      partners:"SKANDI Partners"
    })[type]||type||"Selected";
  }
  function tierLabel(tier){
    return ({
      SELECT:"Select",
      SIGNATURE:"Signature",
      EXCELSIOR:"Excelsior",
      PARTNER:"SKANDI Partners"
    })[tier]||tier||"Collection";
  }
  function itemTier(item){
    if(item.catalogType==="SKANDI_PARTNER" && !item.tier) return "PARTNER";
    return String(item.tier||"").toUpperCase();
  }
  function visibleItems(){
    return (DATA.items||[]).filter(item=>{
      const tier=itemTier(item);
      const tierOk=activeTier==="all" || tier===activeTier.toUpperCase();
      const typeOk=activeType==="all" ||
        (activeType==="partners" ? item.catalogType==="SKANDI_PARTNER" : item.type===activeType);
      return tierOk && typeOk;
    });
  }
  function renderTierTabs(){
    const items=DATA.items||[];
    const present=new Set(items.map(item=>itemTier(item)).filter(Boolean));
    const defs=[{key:"all",label:"All"}];
    ["SELECT","SIGNATURE","EXCELSIOR","PARTNER"].forEach(tier=>{
      if(present.has(tier)) defs.push({key:tier.toLowerCase(),label:tierLabel(tier)});
    });

    $("tierTabs").innerHTML=defs.map(x=>`<button class="tab ${activeTier===x.key?"active":""}" type="button" data-tier="${x.key}">${esc(x.label)}</button>`).join("");
  }
  function renderTypeTabs(){
    const items=DATA.items||[];
    const present=[...new Set(items.map(x=>x.type).filter(Boolean))];
    if(items.some(x=>x.catalogType==="SKANDI_PARTNER")) present.push("partners");
    const defs=[{key:"all",label:"All types"},...present.filter((x,i,a)=>a.indexOf(x)===i).map(key=>({key,label:typeLabel(key)}))];
    $("tabs").innerHTML=defs.map(x=>`<button class="tab ${activeType===x.key?"active":""}" type="button" data-type="${esc(x.key)}">${esc(x.label)}</button>`).join("");
  }
  function card(item){
    const tier=itemTier(item);
    const tierClass=tier.toLowerCase();
    const image=item.imageUrl
      ? `<div class="thumb" style="background-image:url('${esc(item.imageUrl)}')"></div>`
      : `<div class="thumb"></div>`;
    const location=[item.city,item.country].filter(Boolean).join(", ");
    const meta=[location,item.code,item.collectionLabel].filter(Boolean).join(" · ");
    const action=item.path
      ? `<div class="card-actions"><button class="btn secondary" type="button" data-path="${esc(item.path)}">View ${esc(item.typeLabel||"selection")}</button></div>`
      : "";

    return `<article class="card">
      ${image}
      <div class="card-body">
        <div class="tier-line">
          <span class="tier-tag ${esc(tierClass)}">${esc(tierLabel(tier))}</span>
          <span class="tag">${esc(item.typeLabel||item.type||"Selected")}</span>
        </div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary||"Selected by SKANDI.")}</p>
        <div class="meta"><span class="live-dot"></span>${esc(meta||"Live Inventory Control")}</div>
        ${action}
      </div>
    </article>`;
  }
  function renderCards(){
    const status=$("collectionStatus");
    if(!loaded){
      status.classList.remove("hidden");
      status.textContent="Loading live SKANDI Collection inventory…";
      $("cards").innerHTML="";
      return;
    }

    const items=visibleItems();
    if(!items.length){
      status.classList.remove("hidden");
      status.textContent=(DATA.items||[]).length
        ?"No live Inventory Control records match this tier/category."
        :"No published customer-visible Select, Signature, Excelsior or SKANDI Partner records are currently assigned in Inventory Control.";
      $("cards").innerHTML="";
      return;
    }

    status.classList.add("hidden");
    $("cards").innerHTML=items.map(card).join("");
    $("cards").querySelectorAll("[data-path]").forEach(btn=>{
      btn.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:btn.dataset.path}));
    });
  }
  function render(){
    if(DATA.settings?.heroImageUrl){
      $("hero").style.setProperty("--hero-image",`url("${DATA.settings.heroImageUrl}")`);
    }
    renderTierTabs();
    renderTypeTabs();
    renderCards();
  }
  function values(){
    return{
      origin:cleanIata($("origin").value),
      destination:cleanIata($("destination").value),
      departureDate:$("departureDate").value,
      returnDate:$("returnDate").value,
      adults:Number($("adults").value||2),
      currency:$("currency").value
    };
  }
  function validate(v){
    if(!v.origin||!v.destination)return"Enter origin and destination airport codes.";
    if(!v.departureDate)return"Select departure date.";
    if(v.returnDate&&v.returnDate<v.departureDate)return"Return date must be after departure date.";
    return"";
  }
  function search(){
    const v=values();
    const err=validate(v);
    if(err){toast(err);return}
    $("searchStatus").textContent="Searching live SKANDI Collection package offers…";
    $("offers").innerHTML="";
    post("SIGNATURE_PACKAGE_SEARCH",v);
  }
  function renderOffers(items,meta){
    $("searchStatus").textContent=meta?.message||`${items.length} offers loaded`;
    if(!items.length){
      $("offers").innerHTML=`<div class="notice">No currently searchable SKANDI Collection package offers found. Try different dates or airports.</div>`;
      return;
    }
    $("offers").innerHTML=items.map(o=>`<article class="offer">
      <div>
        <h3>${esc(o.title||"SKANDI Collection option")}</h3>
        <p class="copy">${esc(o.route||"")} ${o.carriers?`· ${esc(o.carriers)}`:""} ${o.duration?`· ${esc(o.duration)}`:""}</p>
        <div class="meta">${esc(o.segmentsLabel||"")}</div>
      </div>
      <div class="price">${esc(o.currency||"")} ${esc(o.total||"")}</div>
    </article>`).join("");
  }

  document.addEventListener("click",e=>{
    const tier=e.target.closest("[data-tier]");
    if(tier){
      activeTier=tier.dataset.tier||"all";
      renderTierTabs();
      renderCards();
      return;
    }
    const type=e.target.closest("[data-type]");
    if(type){
      activeType=type.dataset.type||"all";
      $("collectionFilter").value=[...$("collectionFilter").options].some(o=>o.value===activeType)?activeType:"all";
      renderTypeTabs();
      renderCards();
    }
  });

  $("collectionFilter").onchange=e=>{
    activeType=e.target.value||"all";
    renderTypeTabs();
    renderCards();
  };
  $("searchBtn").onclick=search;
  $("clearBtn").onclick=()=>{
    $("offers").innerHTML="";
    $("searchStatus").textContent="Enter route and dates to search selected flight package prices.";
  };

  window.addEventListener("message",e=>{
    let m=e.data;
    if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}
    if(!m||typeof m!=="object")return;
    if(m.source&&m.source!==PARENT)return;
    const p=m.payload||{};

    if(m.type==="SIGNATURE_COLLECTION_LOADING"){
      loaded=false;
      renderCards();
      return;
    }
    if(m.type==="SIGNATURE_COLLECTION_DATA"){
      DATA={...DATA,...p,items:Array.isArray(p.items)?p.items:[]};
      loaded=true;
      render();
      return;
    }
    if(m.type==="SIGNATURE_PACKAGE_RESULTS"){
      renderOffers(p.items||[],p.meta||{});
      return;
    }
    if(m.type==="SIGNATURE_COLLECTION_ERROR"){
      loaded=true;
      DATA={...DATA,items:[]};
      const status=$("collectionStatus");
      status.classList.remove("hidden");
      status.textContent=p.message||"SKANDI Collection inventory is unavailable.";
      $("cards").innerHTML="";
      toast(p.message||"SKANDI Collection data is unavailable.");
    }
  });

  activeTier=initialTier();
  $("departureDate").value=todayPlus(30);
  $("returnDate").value=todayPlus(37);
  render();
  post("SIGNATURE_COLLECTION_READY",{language:currentLanguage()});
})();
</script>

</body>
</html>
