
(function(){
  const SOURCE="SKANDI_SIGNATURE_COLLECTION";
  const PARENT="SKANDI_WIX_PARENT";
  const $=id=>document.getElementById(id);

  let DATA={items:[],collectionItems:[],partners:[],tiers:{},counts:{},settings:{}};
  let loaded=false;
  let activeTier="all";
  let activeType="all";
  let MASTER={brand:{},assets:{},routes:{}};
  
  // Live airport autocomplete is supplied by B-011 publicContent from travel_info_airports.
  let DESTINATIONS = [];

  /* DEFAULT CONTENT FOR DYNAMIC GRIDS */
  const DEFAULT_VALUES = [
    { index: "01 / Curated", symbol: "◇", title: "Chosen, not crowded.", text: "A focused selection helps you spend less time sorting through sameness and more time discovering places with genuine character." },
    { index: "02 / Place", symbol: "⌖", title: "A stronger sense of place.", text: "The best stays do more than give you a room. They can shape how a city, coast or destination feels from the moment you arrive." },
    { index: "03 / Character", symbol: "✦", title: "Worth remembering.", text: "Design, atmosphere, setting and personality matter. Collection is where those qualities are given room to lead the journey." },
    { index: "04 / Journey", symbol: "→", title: "Part of the whole trip.", text: "Hotels, destinations and experiences can sit together in one curated view, making it easier to imagine the journey as a complete story." }
  ];

  const DEFAULT_EXPERIENCES = [
    { index: "01", title: "When atmosphere matters.", text: "For journeys where design, setting and mood are part of what you are traveling for." },
    { index: "02", title: "When the hotel is part of the plan.", text: "For stays you want to enjoy, return to and remember, rather than simply use as a base." },
    { index: "03", title: "When you want a clearer edit.", text: "For moments when a strong shortlist feels better than scrolling through an endless catalogue." },
    { index: "04", title: "When the trip should feel special.", text: "For the journeys you want to look forward to, talk about and remember long after you return." }
  ];

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
  function safeAssetUrl(value){
    try{const u=new URL(String(value||"").trim());return u.protocol==="https:"?u.href:""}catch(_){return""}
  }

  /* --- SEARCH BAR UI LOGIC --- */
  
  function setupAutocomplete(inputId, codeId, dropdownId, listId) {
    const input = $(inputId);
    const code = $(codeId);
    const dropdown = $(dropdownId);
    const list = $(listId);
    
    input.addEventListener('input', (e) => {
      code.value = "";
      const val = String(e.target.value || "").toLowerCase();
      if (!val) { dropdown.classList.remove('active'); return; }
      
      const filtered = DESTINATIONS.filter(d => {
        const name=String(d?.name||"").toLowerCase();
        const airportName=String(d?.airportName||"").toLowerCase();
        const airportCode=String(d?.code||"").toLowerCase();
        const country=String(d?.country||"").toLowerCase();
        return name.includes(val) || airportName.includes(val) || airportCode.includes(val) || country.includes(val);
      });
      
      if (filtered.length) {
        list.innerHTML = filtered.map(d => {
          const airportCode=String(d?.code||"").toUpperCase();
          const name=String(d?.name||d?.airportName||airportCode);
          const country=String(d?.country||"");
          return `
          <div class="sk-dropdown-item" data-code="${esc(airportCode)}" data-name="${esc(name)}">
            <div class="sk-dropdown-icon">${esc(airportCode.substring(0,1))}</div>
            <div class="sk-dropdown-text">
              <strong>${esc(name)} (${esc(airportCode)})</strong>
              <span>${esc(country)}</span>
            </div>
          </div>`;
        }).join("");
        dropdown.classList.add('active');
      } else {
        dropdown.classList.remove('active');
      }
    });

    list.addEventListener('click', (e) => {
      const item = e.target.closest('.sk-dropdown-item');
      if (item) {
        input.value = item.dataset.name + " (" + item.dataset.code + ")";
        code.value = item.dataset.code;
        dropdown.classList.remove('active');
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }
  setupAutocomplete('originInput', 'originCode', 'originDropdown', 'originList');
  setupAutocomplete('destInput', 'destCode', 'destDropdown', 'destList');

  // Custom Date Range Picker Logic
  let selStart = todayPlus(30);
  let selEnd = todayPlus(37);
  let viewingDate = new Date(selStart);
  let pickingStart = true;
  
  function dateKey(date) {
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,"0");
    const d=String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    const parts=String(dateStr).split("-").map(Number);
    if(parts.length!==3||parts.some(v=>!Number.isFinite(v))) return "";
    return new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function renderCalendar() {
    const popup = $('calendarPopup');
    const startM = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), 1);
    const endM = new Date(viewingDate.getFullYear(), viewingDate.getMonth() + 1, 1);
    
    let html = '';
    [startM, endM].forEach((d, i) => {
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const firstDay = d.getDay();
      
      let grid = `<div class="sk-month"><div class="sk-month-header">
        ${i===0 ? `<button class="sk-month-btn" id="calPrev">&larr;</button>` : `<div></div>`}
        <span>${monthName}</span>
        ${i===1 ? `<button class="sk-month-btn" id="calNext">&rarr;</button>` : `<div></div>`}
      </div>
      <div class="sk-days-header"><span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span></div>
      <div class="sk-days-grid">`;
      
      for(let j=0; j<firstDay; j++) grid += `<div class="sk-day empty"></div>`;
      
      for(let j=1; j<=daysInMonth; j++) {
        const currentStr = dateKey(new Date(d.getFullYear(), d.getMonth(), j));
        let classes = "sk-day";
        if (currentStr === selStart) classes += " selected start";
        if (currentStr === selEnd) classes += " selected end";
        if (selStart && selEnd && currentStr > selStart && currentStr < selEnd) classes += " in-range";
        
        grid += `<div class="${classes}" data-date="${currentStr}">${j}</div>`;
      }
      grid += `</div></div>`;
      html += grid;
    });
    
    popup.innerHTML = html;
    
    $('displayStart').innerText = formatDisplayDate(selStart);
    $('displayEnd').innerText = formatDisplayDate(selEnd);$('departureDate').value = selStart;
    $('returnDate').value = selEnd;
    
    $('calPrev')?.addEventListener('click', (e) => { e.stopPropagation(); viewingDate.setMonth(viewingDate.getMonth()-1); renderCalendar(); });$('calNext')?.addEventListener('click', (e) => { e.stopPropagation(); viewingDate.setMonth(viewingDate.getMonth()+1); renderCalendar(); });
    
    popup.querySelectorAll('.sk-day:not(.empty)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const clicked = btn.dataset.date;
        if (pickingStart || clicked < selStart) {
          selStart = clicked;
          selEnd = "";
          pickingStart = false;
        } else {
          selEnd = clicked;
          pickingStart = true;
          $('calendarPopup').classList.remove('active');
        }
        renderCalendar();
      });
    });
  }

  $('datesField').addEventListener('click', (e) => {
    if (!$('calendarPopup').contains(e.target)) {$('calendarPopup').classList.toggle('active');
       renderCalendar();
    }
  });

  document.addEventListener('click', (e) => {
    if (!$('datesField').contains(e.target)) {$('calendarPopup').classList.remove('active');
    }
  });

  /* --- DYNAMIC GRID RENDERING LOGIC --- */
  
  function renderValueCards() {
    const host = $("valueGrid");
    if (!host) return;
    
    // Fallback to default design if no payload provides valueCards
    const cards = DATA.valueCards && DATA.valueCards.length ? DATA.valueCards : DEFAULT_VALUES;
    
    host.innerHTML = cards.map((c, i) => {
      const bgImg = safeAssetUrl(c.imageUrl) ? `url('${esc(c.imageUrl)}')` : '';
      const bgColor = c.bgColor ? esc(c.bgColor) : '';
      const textColor = c.textColor ? esc(c.textColor) : '';
      
      let styleStr = '';
      if(bgImg) styleStr += `background-image: ${bgImg}; `;
      if(bgColor) {
        styleStr += `background-color: ${bgColor}; `;
        styleStr += `background-image: none; `; // Overrides default CSS gradient for specific cards
      }
      if(textColor) styleStr += `color: ${textColor}; `;
      
      const hasImageClass = bgImg ? 'has-image' : '';
      
      return `<article class="value-card fx-card reveal ${hasImageClass}" style="${styleStr}">
        <div><div class="value-index" style="${textColor ? `color:${textColor}; opacity:0.8;` : ''}">${esc(c.index || `0${i+1} / Value`)}</div>
        <div class="value-symbol" style="${textColor ? `color:${textColor}; opacity:0.9;` : ''}">${esc(c.symbol || '✦')}</div></div>
        <div><h3 style="${textColor ? `color:${textColor};` : ''}">${esc(c.title)}</h3>
        <p style="${textColor ? `color:${textColor}; opacity:0.9;` : ''}">${esc(c.text)}</p></div>
      </article>`;
    }).join('');
    
    enhanceDynamic(host);
  }

  function renderExperienceCards() {
    const host = $("experienceList");
    if (!host) return;
    
    // Fallback to default design if no payload provides experienceCards
    const cards = DATA.experienceCards && DATA.experienceCards.length ? DATA.experienceCards : DEFAULT_EXPERIENCES;
    
    host.innerHTML = cards.map((c, i) => {
      const bgImg = safeAssetUrl(c.imageUrl) ? `url('${esc(c.imageUrl)}')` : '';
      const bgColor = c.bgColor ? esc(c.bgColor) : '';
      const textColor = c.textColor ? esc(c.textColor) : '';
      
      let styleStr = '';
      if(bgImg) styleStr += `background-image: ${bgImg}; `;
      if(bgColor) {
        styleStr += `background-color: ${bgColor}; `;
        styleStr += `background-image: none; `; 
      }
      if(textColor) styleStr += `color: ${textColor}; `;
      
      const hasImageClass = bgImg ? 'has-image' : '';
      
      return `<article class="experience-item fx-card reveal ${hasImageClass}" style="${styleStr}">
        <div class="experience-icon" style="${textColor ? `color:${textColor}; border-color:currentColor;` : ''}">${esc(c.index || `0${i+1}`)}</div>
        <div><h4 style="${textColor ? `color:${textColor};` : ''}">${esc(c.title)}</h4>
        <p style="${textColor ? `color:${textColor}; opacity:0.9;` : ''}">${esc(c.text)}</p></div>
      </article>`;
    }).join('');
    
    enhanceDynamic(host);
  }


  /* --- EXISTING RENDERING LOGIC --- */
  
  function applyCollectionLogo(value){
    const logo=$("collectionLogo"),fallback=$("collectionLogoFallback"),url=safeAssetUrl(value);
    if(!logo||!fallback)return;
    if(!url){logo.hidden=true;fallback.hidden=false;return}
    logo.onload=()=>{logo.hidden=false;fallback.hidden=true};
    logo.onerror=()=>{logo.hidden=true;fallback.hidden=false};
    logo.src=url;
  }
  function applyMasterPayload(payload={}){
    MASTER={...MASTER,...payload,brand:payload.brand||MASTER.brand||{},routes:{...(MASTER.routes||{}),...(payload.routes||{})}};
    const logos=payload?.brand?.assets?.logos||payload?.assets?.logos||{};
    applyCollectionLogo(logos.signatureCollection);
    
    // Accept injected Destinations from Master Payload if available
    if(payload.destinations && Array.isArray(payload.destinations)) {
      DESTINATIONS = payload.destinations;
    }
  }
  function bindPathActions(root=document){
    root.querySelectorAll?.("[data-path]").forEach(btn=>{
      if(btn.dataset.boundPath==="1")return;
      btn.dataset.boundPath="1";
      btn.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:btn.dataset.path}));
    });
  }
  function itemLocation(item){return [item?.city,item?.country].filter(Boolean).join(", ")}
  function itemImage(item){return safeAssetUrl(item?.imageUrl||item?.heroImageUrl||item?.image||"")}
  function countType(type){return (DATA.items||[]).filter(item=>item.type===type).length}
  function renderHeroMetrics(){
    const host=$("heroMetrics");if(!host)return;
    const experienceCount=["tours","activities","tickets","transfers"].reduce((n,type)=>n+countType(type),0);
    const metrics=[[(DATA.items||[]).length,"Selections"],[countType("destinations"),"Destinations"],[countType("hotels"),"Hotels"],[experienceCount,"Experiences"]];
    host.innerHTML=metrics.map(([value,label])=>`<div class="hero-metric"><strong>${esc(value||"—")}</strong><span>${esc(label)}</span></div>`).join("");
  }
  function spotlightItems(){
    const priority={hotels:1,destinations:2,tours:3,activities:4,transfers:5,airlines:6,airports:7,partners:8};
    return (DATA.items||[]).slice().sort((a,b)=>(priority[a.type]||99)-(priority[b.type]||99)).filter(item=>item.title).slice(0,4);
  }
  function renderSpotlight(){
    const host=$("spotlightGrid");if(!host)return;
    const items=spotlightItems();
    if(!loaded){host.innerHTML=`<div class="spotlight-empty">Loading the Collection edit…</div>`;return}
    if(!items.length){host.innerHTML=`<div class="spotlight-empty">The Collection edit is being refreshed. Browse the portfolio below for currently published selections.</div>`;return}
    host.innerHTML=items.map(item=>{
      const image=itemImage(item),location=itemLocation(item),path=item.path?`data-path="${esc(item.path)}"`:"",tier=tierLabel(itemTier(item));
      return `<article class="spotlight-card fx-card reveal" ${path} tabindex="${item.path?"0":"-1"}">
        <div class="spotlight-image"${image?` style="background-image:url('${esc(image)}')"`:""}></div>
        <div class="spotlight-copy"><div class="spotlight-kicker">${esc([tier,item.typeLabel||typeLabel(item.type)].filter(Boolean).join(" · "))}</div><h3>${esc(item.title)}</h3><p>${esc(item.summary||location||"Selected by SKANDI.")}</p></div>
      </article>`;
    }).join("");
    host.querySelectorAll("[data-path]").forEach(card=>{
      card.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:card.dataset.path}));
      card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();post("COLLECTION_NAVIGATE",{path:card.dataset.path})}});
    });
    enhanceDynamic(host);
  }
  function storyItems(){
    const all=(DATA.items||[]).filter(item=>item&&item.title);
    const featured=new Set(spotlightItems().map(item=>String(item.id||item.code||item.path||item.title)));
    const rest=all.filter(item=>!featured.has(String(item.id||item.code||item.path||item.title)));
    return (rest.length?rest:all).slice(0,8);
  }
  function renderStories(){
    const host=$("storyRail");
    if(!host)return;
    if(!loaded){host.innerHTML=`<div class="story-empty">Loading more from the Collection…</div>`;return}
    const items=storyItems();
    if(!items.length){host.innerHTML=`<div class="story-empty">More Collection stories will appear here as new selections are published.</div>`;return}
    host.innerHTML=items.map(item=>{
      const image=itemImage(item),location=itemLocation(item),tier=tierLabel(itemTier(item));
      const path=item.path?`data-path="${esc(item.path)}"`:"";
      return `<article class="story-card fx-card reveal" ${path} tabindex="${item.path?"0":"-1"}">
        <div class="story-image"${image?` style="background-image:url('${esc(image)}')"`:""}></div>
        <div class="story-content">
          <div class="story-label">${esc([tier,item.typeLabel||typeLabel(item.type),location].filter(Boolean).join(" · "))}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary||"Part of the current SKANDI Collection edit.")}</p>
          ${item.path?`<span class="story-arrow">Explore the selection</span>`:""}
        </div>
      </article>`;
    }).join("");
    host.querySelectorAll("[data-path]").forEach(card=>{
      card.addEventListener("click",()=>post("COLLECTION_NAVIGATE",{path:card.dataset.path}));
      card.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){event.preventDefault();post("COLLECTION_NAVIGATE",{path:card.dataset.path})}
      });
    });
    enhanceDynamic(host);
  }
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
    const tier=itemTier(item),tierClass=tier.toLowerCase(),image=itemImage(item),title=String(item.title||"SKANDI Collection").trim();
    const initials=title.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
    const visual=image?`<div class="thumb" style="background-image:url('${esc(image)}')"></div>`:`<div class="thumb"><div class="thumb-fallback"><span>${esc(initials||"SK")}</span></div></div>`;
    const location=itemLocation(item),meta=[location,item.code,item.collectionLabel].filter(Boolean).join(" · ");
    const action=item.path?`<div class="card-actions"><button class="btn secondary" type="button" data-path="${esc(item.path)}">Explore ${esc(item.typeLabel||"selection")} <span class="icon-arrow">→</span></button></div>`:"";
    return `<article class="card fx-card reveal">${visual}<div class="card-body"><div class="tier-line"><span class="tier-tag ${esc(tierClass)}">${esc(tierLabel(tier))}</span><span class="tag">${esc(item.typeLabel||item.type||"Selected")}</span></div><h3>${esc(title)}</h3><p>${esc(item.summary||"Selected by SKANDI.")}</p><div class="meta"><span class="live-dot"></span>${esc(meta||"Part of the SKANDI Collection")}</div>${action}</div></article>`;
  }
  function renderCards(){
    const status=$("collectionStatus");
    if(!loaded){
      status.classList.remove("hidden");
      status.textContent="Loading the SKANDI Collection…";
      $("cards").innerHTML="";
      return;
    }

    const items=visibleItems();
    if(!items.length){
      status.classList.remove("hidden");
      status.textContent=(DATA.items||[]).length
        ?"No Collection selections match these filters."
        :"The Collection is being refreshed. Please check again shortly.";
      $("cards").innerHTML="";
      return;
    }

    status.classList.add("hidden");
    $("cards").innerHTML=items.map(card).join("");
    bindPathActions($("cards"));
    enhanceDynamic($("cards"));
  }
  function render(){
    const heroImage=safeAssetUrl(DATA.settings?.heroImageUrl);
    if(heroImage){
      $("hero").style.setProperty("--hero-image",`url("${heroImage}")`);
    }else{
      $("hero").style.removeProperty("--hero-image");
    }
    renderTierTabs();
    renderTypeTabs();
    renderValueCards();
    renderExperienceCards();
    renderCards();
    renderHeroMetrics();
    renderSpotlight();
    renderStories();
    syncFilterControls();
  }
  function values(){
    return{
      origin:$("originCode").value,
      destination:$("destCode").value,
      departureDate:$("departureDate").value,
      returnDate:$("returnDate").value,
      adults:Number($("adults").value||2)
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
    $("searchStatus").textContent="Searching Collection journey options…";
    $("offers").innerHTML="";
    post("SIGNATURE_PACKAGE_SEARCH",v);
  }
  function renderOffers(items,meta){
    $("searchStatus").textContent=meta?.message||`${items.length} offers loaded`;
    if(!items.length){
      $("offers").innerHTML=`<div class="notice">No Collection journey options matched this search. Try different dates or airports.</div>`;
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

  function syncFilterControls(){
    const mirror=$("collectionFilterMirror"),main=$("collectionFilter");
    if(mirror&&main){
      const value=[...mirror.options].some(o=>o.value===activeType)?activeType:"all";
      mirror.value=value;main.value=value;
    }
  }
  const MOTION_REDUCED=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  const FINE_POINTER=window.matchMedia?.("(pointer:fine)")?.matches===true;
  let revealObserver=null;
  if(!MOTION_REDUCED&&"IntersectionObserver" in window){
    revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add("visible");revealObserver.unobserve(entry.target)})
    },{threshold:.10,rootMargin:"0px 0px -6% 0px"});
  }
  function enhanceDynamic(root=document){
    const nodes=[];
    if(root?.nodeType===1&&root.matches?.(".reveal"))nodes.push(root);
    root.querySelectorAll?.(".reveal").forEach(node=>nodes.push(node));
    nodes.forEach(node=>{
      if(node.dataset.revealBound==="1")return;
      node.dataset.revealBound="1";
      if(revealObserver)revealObserver.observe(node);else node.classList.add("visible");
    });
  }
  enhanceDynamic(document);
  const dynamicObserver=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)enhanceDynamic(node)})));
  dynamicObserver.observe(document.body,{childList:true,subtree:true});
  const progressBar=$("luxuryProgressBar");
  function updateLuxuryProgress(){
    if(!progressBar)return;
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    const value=Math.min(1,Math.max(0,window.scrollY/max));
    progressBar.style.width=`${(value*100).toFixed(2)}%`;
  }
  updateLuxuryProgress();
  window.addEventListener("scroll",updateLuxuryProgress,{passive:true});
  window.addEventListener("resize",updateLuxuryProgress,{passive:true});
  if(!MOTION_REDUCED&&FINE_POINTER){
let activeCard=null;
    document.addEventListener("pointermove",event=>{
      const card=event.target.closest?.(".fx-card");
      if(activeCard&&activeCard!==card){activeCard.style.transform="";activeCard.style.removeProperty("--fx-x");activeCard.style.removeProperty("--fx-y")}
      activeCard=card||null;if(!card)return;
      const rect=card.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const x=((event.clientX-rect.left)/rect.width)*100,y=((event.clientY-rect.top)/rect.height)*100,ry=(x-50)*.024,rx=(50-y)*.020;
      card.style.setProperty("--fx-x",`${x.toFixed(1)}%`);card.style.setProperty("--fx-y",`${y.toFixed(1)}%`);
      card.style.transform=`perspective(1050px) translateY(-5px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    },{passive:true});
    document.addEventListener("pointerout",event=>{
      const card=event.target.closest?.(".fx-card");if(!card||card.contains(event.relatedTarget))return;
      card.style.transform="";card.style.removeProperty("--fx-x");card.style.removeProperty("--fx-y");if(activeCard===card)activeCard=null;
    },{passive:true});
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
      syncFilterControls();
    }
  });

  $("collectionFilter").onchange=e=>{
    activeType=e.target.value||"all";
    renderTypeTabs();renderCards();syncFilterControls();
  };
  $("collectionFilterMirror").onchange=e=>{
    activeType=e.target.value||"all";
    renderTypeTabs();renderCards();syncFilterControls();
    $("collectionDirectory").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  };
  $("heroExploreBtn").onclick=()=>$("collectionSpotlight").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("heroSearchBtn").onclick=()=>$("collectionSearch").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("journeySearchBtn").onclick=()=>$("collectionSearch").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("finalSearchBtn").onclick=()=>$("collectionSearch").scrollIntoView({behavior:MOTION_REDUCED?"auto":"smooth",block:"start"});
  $("storyPrev").onclick=()=>$("storyRail").scrollBy({left:-Math.max(320,$("storyRail").clientWidth*.72),behavior:MOTION_REDUCED?"auto":"smooth"});
  $("storyNext").onclick=()=>$("storyRail").scrollBy({left:Math.max(320,$("storyRail").clientWidth*.72),behavior:MOTION_REDUCED?"auto":"smooth"});
  $("searchBtn").onclick=search;

  window.addEventListener("message",e=>{
    let m=e.data;
    if(typeof m==="string"){try{m=JSON.parse(m)}catch(_){return}}
    if(!m||typeof m!=="object")return;
    if(m.source&&m.source!==PARENT)return;
    const p=m.payload||{};

    if(m.type==="SKANDI_MASTER_CONFIG"){
      applyMasterPayload(p);
      return;
    }
    if(m.type==="SKANDI_MASTER_ASSETS"){
      applyMasterPayload({assets:p});
      return;
    }

    if(m.type==="SIGNATURE_COLLECTION_LOADING"){
      loaded=false;renderCards();renderSpotlight();renderStories();return;
    }
    if(m.type==="SIGNATURE_COLLECTION_DATA"){
      DATA={...DATA,...p,items:Array.isArray(p.items)?p.items:[]};
      DESTINATIONS=Array.isArray(p.destinations)?p.destinations.filter(item=>item&&item.code&&item.name):[];
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
      status.textContent=p.message||"The SKANDI Collection is temporarily unavailable.";
      $("cards").innerHTML="";
      renderHeroMetrics();renderSpotlight();renderStories();
      toast(p.message||"The SKANDI Collection is temporarily unavailable.");
    }
  });

  activeTier=initialTier();
  renderCalendar(); 
  render();
  syncFilterControls();
  post("MASTER_CONFIG_REQUEST",{context:"skandi-collection"});
  post("MASTER_ASSETS_REQUEST",{context:"skandi-collection"});
  post("SIGNATURE_COLLECTION_READY",{language:"EN"});
  window.addEventListener("pagehide",()=>{dynamicObserver.disconnect();revealObserver?.disconnect?.();window.removeEventListener("scroll",updateLuxuryProgress);window.removeEventListener("resize",updateLuxuryProgress)},{once:true});
})();
