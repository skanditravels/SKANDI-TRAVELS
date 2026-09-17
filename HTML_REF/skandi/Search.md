# Search

STATUS: IN PROGRESS
SLUG: /search
WIX PAGE: Search.b7zch
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #searchResultsEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:10PM "Page is almost styled from my end, review data functions /Samuel"
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Search SKANDI TRAVELS</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
:root{
  --blue:#022e64;
  --blue2:#0b3a7a;
  --cyan:#5fc7cf;
  --text:#111827;
  --body:#4d5f74;
  --muted:#718096;
  --line:#e4eaf1;
  --pale:#f6f9fc;
  --white:#fff;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:var(--text);font-family:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif}
button,input{font:inherit}
main{width:min(1120px,calc(100% - 36px));margin:0 auto;padding:58px 0 82px}
.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:34px;align-items:end;padding-bottom:30px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--cyan);margin-bottom:8px}
h1{margin:0;color:var(--blue);font-size:clamp(32px,5vw,58px);line-height:.98;letter-spacing:-.055em;font-weight:800}
.hero-copy{margin:14px 0 0;max-width:620px;color:var(--body);font-size:14px;line-height:1.7}
.search-form{width:min(450px,100%);display:flex;align-items:center;gap:8px;padding:6px;background:var(--pale);border:1px solid var(--line);border-radius:999px;transition:.2s ease}
.search-form:focus-within{background:#fff;border-color:var(--cyan);box-shadow:0 0 0 4px rgba(95,199,207,.10)}
.search-form input{min-width:0;flex:1;height:46px;border:0;outline:0;background:transparent;padding:0 14px;color:var(--blue);font-size:14px;font-weight:650}
.search-form input::placeholder{color:#8795a8}
.search-form button{height:46px;min-width:96px;padding:0 20px;border:0;border-radius:999px;background:var(--blue);color:#fff;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:.2s ease}
.search-form button:hover{background:var(--blue2);transform:translateY(-1px)}
.content{padding-top:28px}
.meta{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:16px}
.meta strong{font-size:14px;color:var(--blue)}
.meta span{font-size:12px;color:var(--muted)}
.results{display:grid;gap:10px}
.result{width:100%;display:grid;grid-template-columns:120px minmax(0,1fr) 34px;align-items:center;gap:20px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:18px;padding:19px 20px;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.result:hover{border-color:#cbd9e8;box-shadow:0 12px 32px rgba(2,46,100,.08);transform:translateY(-1px)}
.category{align-self:start;display:inline-flex;width:max-content;max-width:100%;padding:6px 9px;border-radius:999px;background:#eef8f9;color:#16636a;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.result-title{font-size:18px;font-weight:850;color:var(--blue);letter-spacing:-.025em;margin:0 0 5px}
.result-description{margin:0;color:var(--body);font-size:12.5px;line-height:1.55}
.result-path{display:block;margin-top:7px;color:#8493a5;font-size:10px;font-weight:650}
.arrow{width:32px;height:32px;border-radius:999px;background:var(--pale);display:grid;place-items:center;color:var(--blue);font-size:18px;transition:.2s ease}
.result:hover .arrow{background:var(--blue);color:#fff;transform:translateX(2px)}
mark{background:#dff5f6;color:inherit;border-radius:3px;padding:0 .08em}
.empty,.start{border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,#fff,#f8fbfe);padding:34px}
.empty h2,.start h2{margin:0 0 8px;color:var(--blue);font-size:22px;letter-spacing:-.03em}
.empty p,.start p{margin:0;color:var(--body);font-size:13px;line-height:1.65}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}
.chip{border:1px solid var(--line);background:#fff;color:var(--blue);height:36px;padding:0 14px;border-radius:999px;font-size:10px;font-weight:850;cursor:pointer;transition:.2s ease}
.chip:hover{border-color:var(--cyan);background:#f7fcfc}
.note{margin-top:18px;color:#8b98a9;font-size:10px;line-height:1.6}
@media(max-width:760px){
  main{width:min(100% - 24px,1120px);padding:34px 0 54px}
  .hero{grid-template-columns:1fr;gap:24px}
  .search-form{width:100%}
  .result{grid-template-columns:1fr 32px;gap:12px;padding:17px}
  .category{grid-column:1 / -1;margin-bottom:1px}
  .result-copy{grid-column:1}
  .arrow{grid-column:2;grid-row:2;align-self:center}
  .meta{align-items:flex-start;flex-direction:column;gap:3px}
}
</style>
</head>
<body>
<main>
  <section class="hero">
    <div>
      <div class="eyebrow">SKANDI Travels</div>
      <h1>Search Results</h1>
    </div>

    <form class="search-form" id="searchForm">
      <input id="searchInput" type="search" autocomplete="off" placeholder="What are you looking for?" aria-label="Search SKANDI website"/>
      <button type="submit">Search</button>
    </form>
  </section>

  <section class="content">
    <div id="output"></div>
  </section>
</main>

<script>
"use strict";
(() => {
  const SOURCE = "SKANDI_SEARCH_RESULTS";
  const PARENT = "SKANDI_WIX_PARENT";
  const EXCLUDED_PREFIXES = ["/riaintra", "/my-profile"];
  const POPULAR = ["Flights","Hotels","Tours","Flight status","Travel documents","Contact"];

  let currentQuery = "";
  let externalIndex = [];

  const DEFAULT_INDEX = [
    {title:"Home",path:"/home",category:"SKANDI",description:"Start planning with SKANDI Travels.",keywords:"home homepage travel booking search"},
    {title:"Flights",path:"/flights",category:"Book",description:"Search and book flights with SKANDI Travels.",keywords:"flight airline airfare tickets plane aviation booking"},
    {title:"Hotels",path:"/hotels",category:"Book",description:"Discover and book hotels and stays.",keywords:"hotel accommodation resort room stay lodging"},
    {title:"Packages",path:"/packages",category:"Book",description:"Flight and hotel holiday packages.",keywords:"package holiday vacation flight hotel bundle"},
    {title:"Tours & Activities",path:"/tours",category:"Book",description:"Experiences, excursions, tours and activities at your destination.",keywords:"tour activity excursion experience attraction tickets things to do"},
    {title:"Transfers",path:"/transfers",category:"Book",description:"Arrange airport and destination transfers.",keywords:"transfer taxi shuttle airport transport transportation pickup"},
    {title:"Car Rental",path:"/car-rental",category:"Book",description:"Find rental cars for your trip.",keywords:"car rental hire vehicle drive"},
    {title:"Destinations",path:"/destinations",category:"Discover",description:"Explore SKANDI destinations, countries, resorts and areas.",keywords:"destination country resort area city travel guide inspiration"},
    {title:"SKANDI Collection",path:"/skandi-collection",category:"Discover",description:"Curated SKANDI Signature Collection travel partners and stays.",keywords:"signature collection select excelsior curated recommended hotel partner"},
    {title:"VOY Magazine",path:"/voy-magazine",category:"Discover",description:"Read VOY, the SKANDI travel magazine.",keywords:"voy magazine editorial travel inspiration airline airport guide"},
    {title:"Newsroom",path:"/about/news-room",category:"SKANDI",description:"News and announcements from SKANDI.",keywords:"news newsroom press media announcement"},
    {title:"About SKANDI",path:"/about",category:"SKANDI",description:"Learn about SKANDI Travels and the SKANDI Group.",keywords:"about company skandi group travels story values"},
    {title:"Our Network",path:"/about/our-network",category:"SKANDI",description:"Explore the SKANDI network and operating footprint.",keywords:"network offices hubs stockholm new york partners"},
    {title:"Contact",path:"/about/contact",category:"Support",description:"Contact SKANDI Travels.",keywords:"contact email phone get in touch customer service"},
    {title:"Support",path:"/about/support",category:"Support",description:"Get help before, during and after your trip.",keywords:"support help customer service assistance issue complaint before travel day of travel flight hotel destination return"},
    {title:"Travel Information",path:"/travel-info",category:"Travel Info",description:"Practical information for planning and managing your journey.",keywords:"travel information passport visa baggage check in documents requirements"},
    {title:"Flight Status",path:"/travel-info/flight-status",category:"Travel Info",description:"Check flight status and operational information.",keywords:"flight status departure arrival delay cancelled gate time airport"},
    {title:"Airports",path:"/travel-info/airports",category:"Travel Info",description:"Airport information and travel guidance.",keywords:"airport terminal gate lounge security check in arn jfk ewr cph osl bkk hel ath mia mco"},
    {title:"Airlines",path:"/travel-info/airlines",category:"Travel Info",description:"Airline information, travel classes and partner guidance.",keywords:"airline sas norwegian norse american delta united jetblue thai aegean icelandair iberia finnair"},
    {title:"Travel Documents",path:"/travel-info/documents",category:"Travel Info",description:"Travel documents, forms and document guidance.",keywords:"document documents passport visa form download sign signature travel document"},
    {title:"My Trip",path:"/my-trip",category:"Your Trip",description:"Retrieve and manage an existing SKANDI trip.",keywords:"my trip booking reservation itinerary manage booking reference pnr"},
    {title:"SKANDI Club",path:"/skandi-club",category:"Club",description:"SKANDI Club membership, benefits, points and tiers.",keywords:"club loyalty member membership points silver gold platinum rewards benefits"},
    {title:"Careers",path:"/about/careers",category:"SKANDI",description:"Explore careers and opportunities with SKANDI.",keywords:"career careers jobs work vacancy employment hiring"},
    {title:"Career Portal",path:"/about/careers/portal",category:"SKANDI",description:"Access the public SKANDI career portal.",keywords:"job portal application candidate careers vacancy"},
    {title:"Legal",path:"/about/legal",category:"Legal",description:"SKANDI legal information and policy center.",keywords:"legal policy policies terms privacy cookies accessibility booking terms"},
    {title:"Privacy Policy",path:"/about/legal/policies?policy=privacy",category:"Legal",description:"How SKANDI handles privacy and personal information.",keywords:"privacy personal data information gdpr"},
    {title:"Cookie Policy",path:"/about/legal/policies?policy=cookies",category:"Legal",description:"Information about cookies and site technologies.",keywords:"cookies cookie tracking privacy"},
    {title:"Accessibility",path:"/about/legal/policies?policy=accessibility",category:"Legal",description:"SKANDI accessibility information.",keywords:"accessibility accessible disability wcag"},
    {title:"Terms & Conditions",path:"/about/legal/policies?policy=terms",category:"Legal",description:"Terms for using SKANDI websites and services.",keywords:"terms conditions website legal"},
    {title:"Booking Terms",path:"/about/legal/policies?policy=booking-terms",category:"Legal",description:"Terms that apply to SKANDI travel bookings.",keywords:"booking terms cancellation refund payment conditions travel"},
    {title:"The Store",path:"/the-store",category:"Store",description:"Browse the SKANDI store.",keywords:"store shop merchandise travel accessories"}
  ];

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const normalize = value => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

  function post(type,payload={}){
    window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
  }

  function pathname(path){
    const raw=String(path||"").trim();
    if(!raw) return "";
    try{
      if(/^https?:\/\//i.test(raw)) return new URL(raw).pathname.toLowerCase();
    }catch(_){}
    return (raw.split("?")[0].split("#")[0] || "/").toLowerCase();
  }

  function allowed(item){
    const p=pathname(item?.path);
    if(!p || !p.startsWith("/")) return false;
    return !EXCLUDED_PREFIXES.some(prefix => p===prefix || p.startsWith(prefix+"/"));
  }

  function index(){
    const combined=[...DEFAULT_INDEX,...externalIndex].filter(allowed);
    const byPath=new Map();
    combined.forEach(item=>{
      const key=String(item.path||"").trim().toLowerCase();
      if(key && !byPath.has(key)) byPath.set(key,item);
    });
    return [...byPath.values()];
  }

  function scoreItem(item,query){
    const q=normalize(query);
    if(!q) return 0;
    const tokens=q.split(/\s+/).filter(Boolean);
    const title=normalize(item.title);
    const path=normalize(item.path);
    const desc=normalize(item.description);
    const keywords=normalize(item.keywords);
    const category=normalize(item.category);
    const all=`${title} ${path} ${desc} ${keywords} ${category}`;
    let score=0;
    if(title===q) score+=160;
    if(title.startsWith(q)) score+=90;
    if(title.includes(q)) score+=70;
    if(path.includes(q)) score+=50;
    if(keywords.includes(q)) score+=55;
    if(desc.includes(q)) score+=25;
    if(category.includes(q)) score+=18;
    let matched=0;
    for(const token of tokens){
      if(title.includes(token)){score+=30;matched++}
      else if(keywords.includes(token)){score+=22;matched++}
      else if(path.includes(token)){score+=17;matched++}
      else if(desc.includes(token)){score+=12;matched++}
      else if(category.includes(token)){score+=8;matched++}
    }
    if(tokens.length>1 && matched===tokens.length) score+=35;
    if(!all.includes(q) && matched===0) return 0;
    return score;
  }

  function highlight(text,query){
    const safe=esc(text);
    const terms=normalize(query).split(/\s+/).filter(t=>t.length>1).sort((a,b)=>b.length-a.length);
    if(!terms.length) return safe;
    let out=safe;
    terms.forEach(term=>{
      const pattern=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      out=out.replace(new RegExp(`(${pattern})`,"ig"),"<mark>$1</mark>");
    });
    return out;
  }

  function resultsFor(query){
    return index()
      .map(item=>({...item,_score:scoreItem(item,query)}))
      .filter(item=>item._score>0)
      .sort((a,b)=>b._score-a._score || String(a.title).localeCompare(String(b.title)))
      .slice(0,30);
  }

  function resultCard(item,query){
    return `
      <button class="result" type="button" data-path="${esc(item.path)}">
        <span class="category">${esc(item.category||"Page")}</span>
        <span class="result-copy">
          <span class="result-title">${highlight(item.title,query)}</span>
          <span class="result-description">${highlight(item.description||"",query)}</span>
          <span class="result-path">${esc(item.path)}</span>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>`;
  }

  function render(query){
    currentQuery=String(query||"").trim().replace(/\s+/g," ").slice(0,100);
    $("searchInput").value=currentQuery;
    const output=$("output");

    if(!currentQuery){
      output.innerHTML=`
        <div class="start">
          <h2>What can we help you find?</h2>
          <p>Search across SKANDI's public travel, booking, information and company pages.</p>
          <div class="chips">${POPULAR.map(x=>`<button class="chip" type="button" data-query="${esc(x)}">${esc(x)}</button>`).join("")}</div>
          <div class="note">Internal RIAINTRA pages and private profile pages are excluded from search.</div>
        </div>`;
      resize();
      return;
    }

    const results=resultsFor(currentQuery);
    if(!results.length){
      output.innerHTML=`
        <div class="empty">
          <h2>No results for “${esc(currentQuery)}”</h2>
          <p>Try a shorter phrase or search for a travel product, destination, support topic or policy.</p>
          <div class="chips">${POPULAR.map(x=>`<button class="chip" type="button" data-query="${esc(x)}">${esc(x)}</button>`).join("")}</div>
        </div>`;
      resize();
      return;
    }

    output.innerHTML=`
      <div class="meta">
        <strong>Results for “${esc(currentQuery)}”</strong>
        <span>${results.length} result${results.length===1?"":"s"}</span>
      </div>
      <div class="results">${results.map(item=>resultCard(item,currentQuery)).join("")}</div>`;
    resize();
  }

  function resize(){
    requestAnimationFrame(()=>{
      const height=Math.max(520,Math.ceil(document.documentElement.scrollHeight+8));
      post("SEARCH_RESIZE",{height});
    });
  }

  $("searchForm").addEventListener("submit",event=>{
    event.preventDefault();
    const q=String($("searchInput").value||"").trim();
    render(q);
    post("SEARCH_QUERY_UPDATE",{query:q});
  });

  document.addEventListener("click",event=>{
    const result=event.target.closest("[data-path]");
    if(result){
      const path=result.getAttribute("data-path")||"";
      if(allowed({path})) post("SEARCH_RESULT_NAVIGATE",{path});
      return;
    }
    const chip=event.target.closest("[data-query]");
    if(chip){
      const q=chip.getAttribute("data-query")||"";
      render(q);
      post("SEARCH_QUERY_UPDATE",{query:q});
    }
  });

  window.addEventListener("message",event=>{
    let msg=event.data;
    if(typeof msg==="string"){
      try{msg=JSON.parse(msg)}catch(_){return}
    }
    if(!msg || typeof msg!=="object" || msg.source!==PARENT) return;

    if(msg.type==="SEARCH_PAGE_QUERY"){
      render(msg.payload?.query||"");
      return;
    }

    if(msg.type==="SEARCH_INDEX_UPDATE"){
      externalIndex=Array.isArray(msg.payload?.items)?msg.payload.items.filter(allowed):[];
      render(currentQuery);
    }
  });

  render("");
  post("SEARCH_READY");
  resize();
})();
</script>
</body>
</html>
