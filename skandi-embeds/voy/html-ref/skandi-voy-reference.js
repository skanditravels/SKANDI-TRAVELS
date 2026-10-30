
const SOURCE="SKANDI_VOY_MAGAZINE";
const PARENT="SKANDI_WIX_PARENT";
let state={issues:[],structuredPages:[],categories:[],banners:[],travelCards:[],globalInteractions:[],activeInteractions:[],activeIssue:null,pdf:null,pages:[],totalPages:0,textIndex:[],flip:null,currentPage:0,pageInteractionCounts:{},showInteractiveHints:true};

const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function status(msg,mode=""){const e=$("status");e.textContent=msg||"";e.className=msg?`status show ${mode}`:"status"}
function arr(v){return Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function fmt(v){if(!v)return "";try{return new Date(v).toLocaleDateString(undefined,{month:"short",year:"numeric"})}catch(e){return String(v)}}
function imageStyle(url){return url?`background-image:url('${String(url).replaceAll("'","\\'")}')`:""}

function parseList(v){
  if(Array.isArray(v))return v;
  if(!v)return [];
  if(typeof v==="string"){
    try{const parsed=JSON.parse(v);return Array.isArray(parsed)?parsed:[]}catch(e){return []}
  }
  return [];
}
function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
function pct(v,fallback=0){
  if(v===undefined||v===null||v==="")return fallback;
  const raw=String(v).trim();
  let n=Number(raw.replace("%",""));
  if(!Number.isFinite(n))return fallback;
  if(!raw.includes("%")&&Math.abs(n)<=1)n*=100;
  return clamp(n,0,100);
}
function issueKey(issue=state.activeIssue){return String(issue?.issueId||issue?._id||"")}
function normalizeInteraction(raw,index=0){
  const type=String(raw.type||raw.actionType||raw.kind||"link").toLowerCase().replace(/[ _]+/g,"-");
  return {
    ...raw,
    id:String(raw.id||raw.interactionId||raw._id||`interaction-${index+1}`),
    page:Number(raw.page||raw.pageNumber||raw.pdfPage||1),
    type,
    x:pct(raw.x??raw.left,0),
    y:pct(raw.y??raw.top,0),
    width:pct(raw.width??raw.w,12),
    height:pct(raw.height??raw.h,6),
    label:String(raw.label||raw.buttonLabel||raw.title||""),
    tooltip:String(raw.tooltip||raw.accessibilityLabel||raw.ariaLabel||raw.label||raw.title||"Open interactive content"),
    display:String(raw.display||raw.style||raw.appearance||(raw.label?"button":"region")).toLowerCase(),
    url:raw.url||raw.href||raw.externalUrl||raw.videoUrl||raw.downloadUrl||"",
    path:raw.path||raw.internalPath||raw.wixPath||"",
    targetPage:Number(raw.targetPage||raw.jumpToPage||raw.destinationPage||0),
    eventType:raw.eventType||raw.messageType||"VOY_INTERACTIVE_ACTION"
  };
}
function getIssueInteractions(issue){
  const own=[
    ...parseList(issue?.interactions),
    ...parseList(issue?.hotspots),
    ...parseList(issue?.interactiveElements),
    ...parseList(issue?.interactiveButtons)
  ];
  const key=issueKey(issue);
  const global=state.globalInteractions.filter(x=>!x.issueId&&!x.issue_id||String(x.issueId||x.issue_id)===key);
  const seen=new Set();
  return [...own,...global].map(normalizeInteraction).filter(i=>{
    const k=`${i.id}:${i.page}`;
    if(seen.has(k))return false;
    seen.add(k);return true;
  });
}
function interactionIcon(type){
  if(type.includes("video"))return "▶";
  if(type.includes("page")||type.includes("jump")||type==="pdf-destination")return "↪";
  if(type.includes("product")||type.includes("shop")||type.includes("booking")||type.includes("offer"))return "+";
  if(type.includes("email"))return "@";
  if(type.includes("phone"))return "☎";
  if(type.includes("download"))return "↓";
  if(type.includes("popup")||type.includes("info"))return "i";
  return "↗";
}
function safeOpenUrl(url,newTab=true){
  const value=String(url||"").trim();
  if(!value)return false;
  if(!/^(https?:|mailto:|tel:)/i.test(value))return false;
  if(newTab&&/^https?:/i.test(value))window.open(value,"_blank","noopener,noreferrer");
  else window.location.href=value;
  return true;
}
function videoEmbedUrl(url){
  const value=String(url||"").trim();
  let m=value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if(m)return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
  m=value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if(m)return `https://player.vimeo.com/video/${m[1]}`;
  if(/^https?:\/\//i.test(value))return value;
  return "";
}
function closeReaderModal(){
  $("readerModal").classList.remove("show");
  $("readerModalBody").replaceChildren();
}
function openReaderModal(interaction){
  const modal=$("readerModal"),body=$("readerModalBody"),title=$("readerModalTitle");
  title.textContent=interaction.title||interaction.label||"VOY interactive content";
  body.replaceChildren();
  const image=interaction.imageUrl||interaction.image;
  if(image&&/^https?:\/\//i.test(image)){
    const img=document.createElement("img");img.src=image;img.alt=interaction.imageAlt||interaction.title||"VOY interactive image";body.appendChild(img);
  }
  if(interaction.type.includes("video")){
    const src=videoEmbedUrl(interaction.videoUrl||interaction.url);
    if(src){const box=document.createElement("div");box.className="reader-video";const frame=document.createElement("iframe");frame.src=src;frame.title=interaction.title||"VOY video";frame.allow="autoplay; encrypted-media; picture-in-picture";frame.allowFullscreen=true;box.appendChild(frame);body.appendChild(box)}
  }
  const copy=interaction.body||interaction.description||interaction.summary;
  if(copy){const p=document.createElement("p");p.textContent=String(copy);body.appendChild(p)}
  const ctaUrl=interaction.ctaUrl||interaction.linkUrl;
  const ctaPath=interaction.ctaPath;
  if(ctaUrl||ctaPath){const b=document.createElement("button");b.type="button";b.className="btn navy";b.textContent=interaction.ctaLabel||"Continue";b.addEventListener("click",()=>{if(ctaPath)post("VOY_NAVIGATE",{path:ctaPath,issueId:issueKey(),page:interaction.page});else safeOpenUrl(ctaUrl,true)});body.appendChild(b)}
  modal.classList.add("show");
}
async function goToPdfDestination(dest){
  try{
    const resolved=typeof dest==="string"?await state.pdf.getDestination(dest):dest;
    if(!resolved||!resolved[0])return;
    const ref=resolved[0];
    const index=typeof ref==="number"?ref:await state.pdf.getPageIndex(ref);
    goToPage(index+1);
  }catch(e){status("That internal PDF destination could not be opened.","warn")}
}
function postInteraction(interaction){
  post("VOY_INTERACTION_CLICKED",{
    issueId:issueKey(),interactionId:interaction.id,page:interaction.page,type:interaction.type,label:interaction.label||interaction.title||""
  });
}
async function activateInteraction(interaction){
  postInteraction(interaction);
  const type=interaction.type;
  if(type==="pdf-destination"){await goToPdfDestination(interaction.dest);return}
  if(type==="pdf-action"){
    const map={NextPage:state.currentPage+2,PrevPage:Math.max(1,state.currentPage),FirstPage:1,LastPage:state.pdf?.numPages||1};
    if(map[interaction.namedAction])goToPage(map[interaction.namedAction]);return;
  }
  if(type.includes("page")||type.includes("jump")){goToPage(interaction.targetPage||interaction.page);return}
  if(type.includes("video")||type.includes("popup")||type.includes("info")){openReaderModal(interaction);return}
  if(type.includes("email")){safeOpenUrl(interaction.url||`mailto:${interaction.email||""}`,false);return}
  if(type.includes("phone")){safeOpenUrl(interaction.url||`tel:${interaction.phone||""}`,false);return}
  if(interaction.path){post("VOY_NAVIGATE",{path:interaction.path,issueId:issueKey(),page:interaction.page,interactionId:interaction.id});return}
  if(interaction.url&&safeOpenUrl(interaction.url,interaction.openInNewTab!==false))return;
  post(interaction.eventType||"VOY_INTERACTIVE_ACTION",{issueId:issueKey(),page:interaction.page,interaction});
}
function interactionForPage(pageNumber){return state.activeInteractions.filter(i=>Number(i.page)===Number(pageNumber)||i.allPages===true)}
function renderInteractionLayer(pageElement,pageNumber,interactions){
  const layer=document.createElement("div");layer.className="interactive-layer";layer.dataset.page=pageNumber;
  interactions.forEach((interaction,index)=>{
    const i=normalizeInteraction(interaction,index);
    const b=document.createElement("button");b.type="button";
    const appearance=i.display.includes("button")?"is-button":i.display.includes("invisible")?"is-invisible":"is-region";
    b.className=`mag-hotspot ${appearance}`;
    b.style.left=`${i.x}%`;b.style.top=`${i.y}%`;b.style.width=`${Math.max(i.width,.8)}%`;b.style.height=`${Math.max(i.height,.8)}%`;
    b.dataset.icon=interactionIcon(i.type);b.setAttribute("aria-label",i.tooltip);b.title=i.tooltip;
    if(appearance==="is-button")b.textContent=i.label||"Open";
    else{const tip=document.createElement("span");tip.className="hotspot-tooltip";tip.textContent=i.tooltip;b.appendChild(tip)}
    ["pointerdown","mousedown","touchstart"].forEach(evt=>b.addEventListener(evt,e=>e.stopPropagation(),{passive:true}));
    b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();activateInteraction(i)});
    layer.appendChild(b);
  });
  pageElement.appendChild(layer);
}
async function pdfAnnotationInteractions(page,viewport,pageNumber){
  try{
    const annotations=await page.getAnnotations({intent:"display"});
    return annotations.filter(a=>a.subtype==="Link"&&a.rect).map((a,index)=>{
      const r=viewport.convertToViewportRectangle(a.rect);
      const left=Math.min(r[0],r[2]),top=Math.min(r[1],r[3]);
      return normalizeInteraction({
        id:`pdf-link-${pageNumber}-${index+1}`,page:pageNumber,
        type:a.url?"link":a.dest?"pdf-destination":a.action?"pdf-action":"link",
        url:a.url||"",dest:a.dest,namedAction:a.action,
        x:left/viewport.width,y:top/viewport.height,
        width:Math.abs(r[2]-r[0])/viewport.width,height:Math.abs(r[3]-r[1])/viewport.height,
        tooltip:a.title||a.contents||"Open link",display:"region",source:"pdf-annotation"
      },index);
    });
  }catch(e){return []}
}
function updateInteractiveInfo(){
  const page=(state.flip&&state.flip.getCurrentPageIndex?state.flip.getCurrentPageIndex():state.currentPage)+1;
  const count=state.pageInteractionCounts[page]||0;
  $("interactiveInfo").textContent=count?`${count} interactive feature${count===1?"":"s"}`:"No interactive features";
}

function renderBootstrap(payload){
  state.issues=payload.issues||[];
  state.structuredPages=payload.pages||payload.voyPages||[];
  state.categories=payload.categories||[];
  state.banners=payload.banners||[];
  state.travelCards=payload.travelCards||[];
  state.globalInteractions=parseList(payload.interactions||payload.hotspots||payload.interactiveElements);
  renderFilters();
  renderIssues();
  renderTravelCards();
  renderBanners();
  if($("issueCount"))$("issueCount").textContent=`${state.issues.length} issue${state.issues.length===1?"":"s"} in VOY`;
  status("");
  const requested=payload.requestedIssue||"";
  const latest=state.issues.find(i=>String(i.issueId||i._id)===String(requested)||String(i.slug||"")===String(requested))||state.issues.find(i=>i.featured)||state.issues[0];
  if(latest) selectIssue(latest.issueId||latest._id);
}
function renderFilters(){
  const cats=state.categories.length?state.categories:["Destinations","Hotels","Food & Culture","Family Travel","Signature Collection","City Breaks","Beach","Cruise","Travel Tips"];
  $("category").innerHTML=`<option value="">All categories</option>`+cats.map(c=>`<option>${esc(c.title||c)}</option>`).join("");
  const dests=[...new Set(state.issues.flatMap(i=>arr(i.destinations||i.destinationTags)))].filter(Boolean).sort();
  $("destination").innerHTML=`<option value="">All destinations</option>`+dests.map(d=>`<option>${esc(d)}</option>`).join("");
  $("issueSelect").innerHTML=`<option value="">Select issue</option>`+state.issues.map(i=>`<option value="${esc(i.issueId||i._id)}">${esc(i.title)}</option>`).join("");
}
function renderIssues(){
  $("issueList").innerHTML=state.issues.map(i=>`
    <button class="issue" data-issue="${esc(i.issueId||i._id)}">
      <div class="issue-cover" style="${esc(imageStyle(i.coverImageUrl||i.coverImage||i.imageUrl||i.image))}"></div>
      <div class="issue-body">
        <strong>${esc(i.title)}</strong>
        <span>${esc(i.subtitle||i.summary||"")}</span>
        <div class="pill-row">${arr(i.categories).slice(0,4).map(c=>`<span class="pill">${esc(c)}</span>`).join("")}</div>
      </div>
    </button>`).join("") || `<div class="issue"><div class="issue-body"><strong>No issues published yet</strong><span>Upload a PDF in VOY Control.</span></div></div>`;
  document.querySelectorAll("[data-issue]").forEach(b=>b.onclick=()=>selectIssue(b.dataset.issue));
}
function renderTravelCards(){
  $("travelCards").innerHTML=(state.travelCards||[]).map(c=>`
    <button class="travel-card" data-path="${esc(c.path||"")}">
      <div class="travel-img" style="${esc(imageStyle(c.imageUrl||c.image))}"></div>
      <div class="travel-body">
        <strong>${esc(c.title)}</strong>
        <span>${esc(c.summary||c.description||"")}</span>
        <div class="pill-row">${arr(c.tags).slice(0,3).map(t=>`<span class="pill">${esc(t)}</span>`).join("")}</div>
      </div>
    </button>`).join("") || fallbackTravelCards();
  document.querySelectorAll(".travel-card[data-path]").forEach(b=>b.onclick=()=>{if(b.dataset.path)post("VOY_NAVIGATE",{path:b.dataset.path})});
}
function fallbackTravelCards(){
  return [
    {title:"Signature Collection",summary:"Curated SKANDI journeys and premium escapes.",path:"/signature-collection"},
    {title:"Our destinations",summary:"Explore places featured in VOY Atelier.",path:"/destinations"},
    {title:"Hotels",summary:"Handpicked stays and destination hotels.",path:"/hotels"},
    {title:"Tours & Activities",summary:"Local experiences and excursions.",path:"/tours"}
  ].map(c=>`<button class="travel-card" data-path="${c.path}"><div class="travel-img"></div><div class="travel-body"><strong>${c.title}</strong><span>${c.summary}</span></div></button>`).join("");
}
function renderBanners(){
  const top=state.banners.find(b=>b.slot==="top")||state.banners[0];
  const side=state.banners.find(b=>b.slot==="side")||state.banners[1];
  if(top)$("adTop").innerHTML=`<div class="side-kicker">Featured by SKANDI</div><h2>${esc(top.title)}</h2><span>${esc(top.summary||top.description||"")}</span>${top.path?`<button class="btn teal" data-banner="${esc(top.path)}" type="button">Explore journey</button>`:""}`;
  if(side)$("adSide").innerHTML=`<div class="side-kicker">SKANDI recommendation</div><h2>${esc(side.title)}</h2><span>${esc(side.summary||side.description||"")}</span>${side.path?`<button class="btn gold" data-banner="${esc(side.path)}" type="button">View details</button>`:""}`;
  document.querySelectorAll("[data-banner]").forEach(b=>b.onclick=()=>post("VOY_NAVIGATE",{path:b.dataset.banner}));
}
async function selectIssue(issueId){
  const issue=state.issues.find(i=>String(i.issueId||i._id)===String(issueId));
  if(!issue)return;
  state.activeIssue=issue;
  state.activeInteractions=getIssueInteractions(issue);
  $("issueSelect").value=issue.issueId||issue._id;
  $("issueTitle").textContent=issue.title||"VOY Atelier";
  $("issueMeta").textContent=[issue.edition,fmt(issue.publishDate),arr(issue.categories).join(", ")].filter(Boolean).join(" · ");
  if($("activeIssueTitle"))$("activeIssueTitle").textContent=issue.title||"VOY Atelier";
  if($("activeIssueEdition"))$("activeIssueEdition").textContent=[issue.edition,fmt(issue.publishDate)].filter(Boolean).join(" · ")||"VOY Atelier";
  if($("activeIssueSummary"))$("activeIssueSummary").textContent=issue.summary||issue.subtitle||"Destination stories, hotels and curated journeys from SKANDI.";
  if($("activeIssueTags"))$("activeIssueTags").innerHTML=arr(issue.categories).slice(0,4).map(c=>`<span class="pill">${esc(c)}</span>`).join("");
  $("placeholder").style.display="none";
  status("Preparing the VOY page-turn reader...");
  post("VOY_ISSUE_OPENED",{issueId:issue.issueId||issue._id});
  const pages=state.structuredPages.filter(page=>String(page.issueId||page.issue_id||"")===String(issue.issueId||issue._id)).sort((a,b)=>Number(a.pageNo||a.page_no||0)-Number(b.pageNo||b.page_no||0));
  if(pages.length)await renderStructuredFlipPages(pages);
  else await loadPdf(issue.pdfUrl||issue.fileUrl||issue.latestFileUrl);
}
const structuredDefaults={
  contents:[{title:"Welcome aboard",meta:"03"},{title:"The blue issue",meta:"06"},{title:"Greece, four ways",meta:"07"},{title:"Worth the detour",meta:"09"},{title:"Travel well",meta:"10"},{title:"Airline & airport guide",meta:"11"}],
  offers:[{title:"Athens city break",subtitle:"3 nights · selected hotel",price:"From $899"},{title:"Santorini escape",subtitle:"5 nights · breakfast",price:"From $1,249"},{title:"Crete family week",subtitle:"7 nights · transfers",price:"From $1,499"},{title:"Rhodes adults escape",subtitle:"7 nights · selected resort",price:"From $1,329"}],
  destinations:[{title:"Athens",subtitle:"Culture and city energy"},{title:"Santorini",subtitle:"Clifftop views and slow evenings"},{title:"Crete",subtitle:"Beaches, villages and food"},{title:"Rhodes",subtitle:"History and clear water"}],
  experiences:[{title:"Cook with a local",subtitle:"A market-to-table afternoon"},{title:"Sail into sunset",subtitle:"Small-group Aegean cruise"},{title:"Walk ancient paths",subtitle:"History beyond the guidebook"}],
  tips:[{title:"Before you fly",body:"Check documents, baggage and transfer details."},{title:"Pack lighter",body:"Choose pieces that work from beach to dinner."},{title:"Arrive ready",body:"Save key numbers and the SKANDI support line."}],
  airlines:[{title:"SKANDI partner airline",subtitle:"New York · Copenhagen · Athens",meta:"Economy · Premium · Business"},{title:"Regional connection",subtitle:"Athens · Crete · Rhodes",meta:"Cabin baggage included"}],
  airports:[{title:"JFK · New York",subtitle:"Departure terminal and check-in details"},{title:"CPH · Copenhagen",subtitle:"Easy Nordic connection"},{title:"ATH · Athens",subtitle:"Gateway to the islands"}],
  signature:[{title:"The Aegean House",subtitle:"Santorini",meta:"SKANDI Signature Collection"},{title:"Cretan Coast Retreat",subtitle:"Crete",meta:"SKANDI Signature Collection"}]
};
function structuredBlocks(page,fallback){const blocks=parseList(page.blocks);return blocks.length?blocks:fallback}
function safeImageFit(value){return ["cover","contain","fill","scale-down","none"].includes(String(value||""))?String(value):"cover"}
function safeImagePosition(value){const raw=String(value||"center center").trim();return /^[a-z0-9.% -]{1,60}$/i.test(raw)?raw:"center center"}
function structuredImage(url,fit="cover",position="center center"){
  const value=String(url||"").trim().replace(/["'()\\]/g,"");
  return value?`style="background-image:url(${value});background-size:${safeImageFit(fit)};background-position:${safeImagePosition(position)}"`:""
}
function structuredVars(page,imageUrl=""){
  const hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(String(value||""))?value:fallback;
  const allowed=["Montserrat","Inter","Playfair Display","Cormorant Garamond","Georgia","Arial"];
  const heading=allowed.includes(page.headingFont)?page.headingFont:"Montserrat";
  const body=allowed.includes(page.bodyFont)?page.bodyFont:"Inter";
  const bg=String(imageUrl||"").trim().replace(/["'()\\]/g,"");
  const fit=safeImageFit(page.imageFit);
  const pos=safeImagePosition(page.imagePosition);
  return `style="--p-bg:${hex(page.backgroundColor,"#ffffff")};--p-text:${hex(page.textColor,"#103154")};--p-accent:${hex(page.accentColor,"#4dcad6")};--p-heading:'${heading}';--p-body:'${body}';${bg?`background-image:url(${bg});background-size:${fit};background-position:${pos};`:""}"`;
}
function voyLogoMarkup(x){
  const logos=[x.logoUrl,x.secondaryLogoUrl].filter(Boolean);
  return logos.length?`<div class="voyp-partner-logos ${logos.length>1?"dual":""}">${logos.map((url,index)=>`<img src="${esc(url)}" alt="${esc(index===0?(x.title||"Partner logo"):"")}" loading="eager">`).join("")}</div>`:`<div class="voyp-partner-logo-fallback">${esc(x.code||x.title||"VOY")}</div>`;
}

function structuredPageHtml(page,issue){
  const tpl=page.template||"feature";const title=esc(page.title||"Untitled VOY Page");const kicker=esc(page.kicker||"VOY by SKANDI");const deck=esc(page.deck||"");const body=esc(page.body||"").replace(/\n/g,"<br>");const cta=esc(page.ctaLabel||"Explore more");const vars=structuredVars(page);const hero=structuredImage(page.imageUrl,page.imageFit,page.imagePosition);const second=structuredImage(page.secondaryImageUrl||page.imageUrl,page.imageFit,page.imagePosition);
  const credit=page.imageCredit?`<div class="voyp-credit">Image: ${esc(page.imageCredit)}</div>`:"";const footer=`<footer class="voyp-footer"><span>${esc(page.footerText||"VOY by SKANDI · skanditravels.com")}</span><b>${esc(page.pageNo||"")}</b></footer>`;
  const items=fallback=>structuredBlocks(page,fallback);
  const cards=(rows,cls="")=>rows.map(x=>`<article class="voyp-card ${cls}">${x.imageUrl?`<div class="voyp-card-img" ${structuredImage(x.imageUrl)}></div>`:""}<small>${esc(x.meta||x.kicker||"")}</small><h3>${esc(x.title||"Untitled")}</h3><p>${esc(x.subtitle||x.body||"")}</p>${x.price?`<b class="voyp-price">${esc(x.price)}</b>`:""}${x.cta?`<button class="voyp-cta" type="button" ${x.href?`data-structured-url="${esc(x.href)}"`:`data-structured-path="${esc(x.path||page.ctaPath||"")}"`}>${esc(x.cta)}</button>`:""}</article>`).join("");
  if(tpl==="cover")return `<section class="voyp voyp-cover" ${structuredVars(page,page.imageUrl)}><div class="voyp-cover-top"><b>VOY</b><span>BY SKANDI</span></div><div class="voyp-cover-copy"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><div class="voyp-cover-lines">${items(structuredDefaults.contents).slice(0,3).map(x=>`<span>${esc(x.title)}</span>`).join("")}</div><em>${esc(issue.edition||"Special Edition")}</em></div>${credit}</section>`;
  if(tpl==="contents")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-contents">${items(structuredDefaults.contents).map((x,i)=>`<div><b>${esc(x.meta||String(i+1).padStart(2,"0"))}</b><span><strong>${esc(x.title)}</strong><em>${esc(x.subtitle||"")}</em></span></div>`).join("")}</div><aside class="voyp-note">${body}</aside>${footer}</section>`;
  if(tpl==="brand-feature")return `<section class="voyp voyp-split" ${vars}><div class="voyp-split-img" ${hero}></div><div class="voyp-split-copy"><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-columns">${body}</div><span class="voyp-rule"></span></div>${credit}${footer}</section>`;
  if(tpl==="offers")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-card-grid voyp-offers">${cards(items(structuredDefaults.offers),"offer")}</div><p class="voyp-smallprint">${body}</p>${footer}</section>`;
  if(tpl==="section-opener")return `<section class="voyp voyp-opener" ${structuredVars(page,page.imageUrl)}><div><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><span>${esc(page.destination||"Explore with SKANDI")}</span></div>${credit}</section>`;
  if(tpl==="feature")return `<section class="voyp voyp-feature" ${vars}><div class="voyp-feature-img" ${hero}></div><article><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-columns">${body}</div></article>${credit}${footer}</section>`;
  if(tpl==="destination-grid")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-destination-grid">${items(structuredDefaults.destinations).map(x=>`<article class="voyp-card voyp-destination-card">${x.imageUrl?`<div class="voyp-card-img" ${structuredImage(x.imageUrl)}></div>`:""}<small>${esc(x.meta||"")}</small><h3>${esc(x.title||"Destination")}</h3><p>${esc(x.subtitle||"")}</p><dl class="voyp-destination-facts">${x.stay?`<div><dt>Stay</dt><dd>${esc(x.stay)}</dd></div>`:""}${x.do?`<div><dt>Do</dt><dd>${esc(x.do)}</dd></div>`:""}${x.eat?`<div><dt>Eat</dt><dd>${esc(x.eat)}</dd></div>`:""}${x.gettingThere?`<div><dt>Getting there</dt><dd>${esc(x.gettingThere)}</dd></div>`:""}</dl></article>`).join("")}</div>${footer}</section>`;
  if(tpl==="nightlife")return `<section class="voyp voyp-night" ${structuredVars(page,page.imageUrl)}><div class="voyp-night-card"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><div>${body}</div></div>${credit}${footer}</section>`;
  if(tpl==="experiences")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-experience-grid">${cards(items(structuredDefaults.experiences))}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="travel-well")return `<section class="voyp voyp-tips" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-tip-list">${items(structuredDefaults.tips).map((x,i)=>`<article><b>${String(i+1).padStart(2,"0")}</b><div><h3>${esc(x.title)}</h3><p>${esc(x.body||x.subtitle||"")}</p></div></article>`).join("")}</div><aside ${second}></aside>${footer}</section>`;
  if(tpl==="airline-guide")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airline-directory-grid">${items(structuredDefaults.airlines).map((x,i)=>`<article class="voyp-airline-directory-card">${voyLogoMarkup(x)}<div><small>${esc(x.meta||`PROFILE ${String(i+1).padStart(2,"0")}`)}</small><h3>${esc(x.title||"Airline")}</h3><p>${esc(x.subtitle||x.body||"")}</p></div></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="airline-profile")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airline-profile-grid">${items(structuredDefaults.airlines).map(x=>`<article class="voyp-airline-profile-card"><header>${voyLogoMarkup(x)}<small>${esc(x.subtitle||"Airline profile")}</small><h3>${esc(x.title||"Airline")}</h3><p>${esc(x.body||"")}</p></header><div class="voyp-airline-facts"><div><b>Cabins</b><span>${esc(x.meta||"Confirm for your route")}</span></div><div><b>Seat & comfort</b><span>${esc(x.seat||"Aircraft dependent")}</span></div><div><b>Baggage</b><span>${esc(x.baggage||"Fare dependent")}</span></div><div><b>Food & drink</b><span>${esc(x.food||"Route and cabin dependent")}</span></div><div><b>Wi-Fi & power</b><span>${esc(x.wifi||"Aircraft dependent")}</span></div><div><b>Airport benefits</b><span>${esc(x.airport||"Fare, cabin or status dependent")}</span></div><div><b>Loyalty</b><span>${esc(x.loyalty||"Check current program benefits")}</span></div></div><aside class="voyp-profile-tip"><b>VOY tip</b><span>${esc(x.tip||"")}</span></aside><aside class="voyp-profile-booking"><b>Know before you book</b><span>${esc(x.booking||"")}</span></aside></article>`).join("")}</div>${footer}</section>`;
  if(tpl==="onboard-guide")return `<section class="voyp voyp-onboard" ${vars}><div class="voyp-feature-img" ${hero}></div><article><small>${kicker}</small><h1>${title}</h1><p class="voyp-lead">${deck}</p><div class="voyp-service-grid">${cards(items(structuredDefaults.tips))}</div></article>${footer}</section>`;
  if(tpl==="airport-guide")return `<section class="voyp voyp-paper" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-airport-grid">${items(structuredDefaults.airports).map(x=>`<article class="voyp-airport-card"><div class="voyp-airport-code"><strong>${esc(x.code||"")}</strong><span>${esc(x.meta||"Airport")}</span></div><div class="voyp-airport-content">${voyLogoMarkup(x)}<h3>${esc(x.title||"Airport")}</h3><small>${esc(x.location||x.subtitle||"")}</small><dl><div><dt>Role</dt><dd>${esc(x.role||x.body||"")}</dd></div><div><dt>Plan for</dt><dd>${esc(x.plan||"")}</dd></div><div><dt>VOY note</dt><dd>${esc(x.note||"")}</dd></div></dl></div></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="route-map")return `<section class="voyp voyp-map" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-map-art"><span class="dot nyc">NYC</span><span class="dot cph">CPH</span><span class="dot ath">ATH</span><span class="dot isl">ISLANDS</span><i class="route r1"></i><i class="route r2"></i><i class="route r3"></i></div><div class="voyp-route-list">${items(structuredDefaults.airlines).map(x=>`<div><b>${esc(x.title)}</b><span>${esc(x.subtitle||x.body||"")}</span></div>`).join("")}</div>${footer}</section>`;
  if(tpl==="transfer-promise")return `<section class="voyp voyp-paper voyp-transfer" ${vars}><header class="voyp-heading"><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></header><div class="voyp-transfer-grid">${items(structuredDefaults.tips).map((x,i)=>`<article><b>${String(i+1).padStart(2,"0")}</b><div><small>${esc(x.subtitle||x.meta||"SKANDI standard")}</small><h3>${esc(x.title||"Transfer standard")}</h3><p>${esc(x.body||"")}</p></div></article>`).join("")}</div><div class="voyp-wide-copy">${body}</div>${footer}</section>`;
  if(tpl==="signature-collection")return `<section class="voyp voyp-signature" ${vars}><div class="voyp-signature-hero" ${hero}><small>${kicker}</small><h1>${title}</h1><p>${deck}</p></div><div class="voyp-signature-cards">${cards(items(structuredDefaults.signature))}</div>${footer}</section>`;
  return `<section class="voyp voyp-back" ${structuredVars(page,page.imageUrl)}><div><small>${kicker}</small><h1>${title}</h1><p>${deck}</p><button class="voyp-back-cta" type="button" data-structured-path="${esc(page.ctaPath||"")}">${cta}</button><em>${esc(page.ctaPath||"skanditravels.com")}</em></div>${credit}</section>`;
}
async function renderStructuredFlipPages(rows){
  const container=$("flipBook"),thumbnails=$("thumbnailRail");
  if(state.flip&&state.flip.destroy){try{state.flip.destroy()}catch(e){}}
  state.flip=null;state.pdf=null;state.pages=[];state.totalPages=rows.length;state.textIndex=[];state.currentPage=0;state.pageInteractionCounts={};
  container.innerHTML="";container.classList.remove("structured-static");if(thumbnails)thumbnails.innerHTML="";container.style.display="block";$("fallbackFrame").style.display="none";$("openPdfBtn").style.display="none";
  rows.forEach((page,index)=>{
    const pageNumber=index+1;const div=document.createElement("div");div.className="page structured-page";if(index===0||index===rows.length-1)div.dataset.density="hard";div.dataset.pageNumber=pageNumber;div.innerHTML=structuredPageHtml(page,state.activeIssue||{});
    const interactions=interactionForPage(pageNumber);state.pageInteractionCounts[pageNumber]=interactions.length;renderInteractionLayer(div,pageNumber,interactions);container.appendChild(div);state.pages.push({pageNumber,interactionCount:interactions.length,pageId:page.pageId});
    state.textIndex.push({page:pageNumber,text:[page.kicker,page.title,page.deck,page.body,page.destination,JSON.stringify(page.blocks||[])].filter(Boolean).join(" ")});
    if(thumbnails){const thumb=document.createElement("button");thumb.type="button";thumb.className="page-thumb structured-page-thumb";thumb.dataset.page=pageNumber;thumb.innerHTML=`<div class="structured-thumb-view"><small>${esc(page.kicker||"VOY")}</small><strong>${esc(page.title||`Page ${pageNumber}`)}</strong></div><span>${pageNumber}</span>`;thumb.addEventListener("click",()=>goToPage(pageNumber));thumbnails.appendChild(thumb)}
    div.querySelectorAll("[data-structured-path]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();const path=button.getAttribute("data-structured-path");if(path)post("VOY_NAVIGATE",{path,issueId:issueKey(),page:pageNumber})}));
    div.querySelectorAll("[data-structured-url]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();safeOpenUrl(button.getAttribute("data-structured-url"),true)}));
  });
  $("indexInfo").textContent=`Search index ready · ${rows.length} structured pages`;if($("pageRange")){ $("pageRange").max=rows.length;$("pageRange").value=1 }if($("pageJumpInput")){ $("pageJumpInput").max=rows.length;$("pageJumpInput").value=1 }
  if(window.St&&window.St.PageFlip){state.flip=new St.PageFlip(container,{width:460,height:650,size:"stretch",minWidth:270,maxWidth:620,minHeight:382,maxHeight:900,drawShadow:true,flippingTime:980,usePortrait:true,startZIndex:1,autoSize:true,maxShadowOpacity:.48,showCover:true,mobileScrollSupport:false,swipeDistance:18,clickEventForward:true,useMouseEvents:true,disableFlipByClick:false});state.flip.loadFromHTML(container.querySelectorAll(":scope > .page"));state.flip.on("flip",e=>{state.currentPage=e.data;updatePageInfo();updateInteractiveInfo()});state.flip.on("changeOrientation",()=>{updatePageInfo();updateInteractiveInfo()});updatePageInfo();updateInteractiveInfo();status("")}else{container.classList.add("structured-static");status("Page flip library did not load. Showing the digital pages without animation.","warn")}
}
async function loadPdf(url){
  if(!url){status("This issue does not have a PDF URL yet.","warn");return;}
  try{
    if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
    state.pdf=await pdfjsLib.getDocument(url).promise;
    state.pages=[];state.totalPages=Math.min(state.pdf.numPages,120);state.textIndex=[];state.currentPage=0;state.pageInteractionCounts={};
    $("openPdfBtn").style.display="inline-flex";
    $("indexInfo").textContent=`Reading ${state.pdf.numPages} PDF pages...`;
    await renderFlipPages();
    extractTextIndex();
    status("");
  }catch(error){
    $("fallbackFrame").src=url;
    $("fallbackFrame").style.display="block";
    $("flipBook").style.display="none";
    status("Animated reader could not load this PDF. Showing the standard PDF reader instead. Check PDF URL/CORS settings for animated mode.","warn");
  }
}
async function renderFlipPages(){
  const container=$("flipBook");
  const thumbnails=$("thumbnailRail");
  container.innerHTML="";container.classList.remove("structured-static");
  if(thumbnails)thumbnails.innerHTML="";
  container.style.display="block";
  $("fallbackFrame").style.display="none";
  const maxPages=Math.min(state.pdf.numPages,120);
  let bookRatio=600/420;
  for(let p=1;p<=maxPages;p++){
    const page=await state.pdf.getPage(p);
    const viewport=page.getViewport({scale:1.55});
    if(p===1)bookRatio=viewport.height/viewport.width;
    const canvas=document.createElement("canvas");
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext("2d",{alpha:false}),viewport,background:"#ffffff"}).promise;
    const div=document.createElement("div");
    div.className="page";if(p===1||p===maxPages)div.dataset.density="hard";div.dataset.pageNumber=p;
    const img=document.createElement("img");
    img.src=canvas.toDataURL("image/jpeg",0.92);
    img.alt=`VOY page ${p}`;
    div.appendChild(img);
    if(thumbnails){
      const thumb=document.createElement("button");thumb.type="button";thumb.className="page-thumb";thumb.dataset.page=p;thumb.setAttribute("aria-label",`Go to page ${p}`);
      const thumbImg=document.createElement("img");thumbImg.src=img.src;thumbImg.alt="";
      const thumbNo=document.createElement("span");thumbNo.textContent=p;
      thumb.append(thumbImg,thumbNo);thumb.addEventListener("click",()=>goToPage(p));thumbnails.appendChild(thumb);
    }
    const nativeLinks=await pdfAnnotationInteractions(page,viewport,p);
    const interactions=[...nativeLinks,...interactionForPage(p)];
    state.pageInteractionCounts[p]=interactions.length;
    renderInteractionLayer(div,p,interactions);
    container.appendChild(div);
    state.pages.push({pageNumber:p,interactionCount:interactions.length});
    if(p%4===0||p===maxPages)$("indexInfo").textContent=`Prepared ${p} / ${maxPages} pages`;
  }
  if($("pageRange")){ $("pageRange").max=maxPages; $("pageRange").value=1; }
  if($("pageJumpInput")){ $("pageJumpInput").max=maxPages; $("pageJumpInput").value=1; }
  if(state.flip&&state.flip.destroy){try{state.flip.destroy()}catch(e){}}
  if(window.St&&window.St.PageFlip){
    const baseWidth=460;
    const baseHeight=Math.round(baseWidth*bookRatio);
    state.flip=new St.PageFlip(container,{
      width:baseWidth,height:baseHeight,size:"stretch",
      minWidth:270,maxWidth:620,minHeight:380,maxHeight:900,
      drawShadow:true,flippingTime:980,usePortrait:true,startZIndex:1,
      autoSize:true,maxShadowOpacity:.58,showCover:true,mobileScrollSupport:false,
      swipeDistance:18,clickEventForward:true,useMouseEvents:true,disableFlipByClick:false
    });
    state.flip.loadFromHTML(container.querySelectorAll(":scope > .page"));
    state.flip.on("flip",e=>{state.currentPage=e.data;updatePageInfo();updateInteractiveInfo()});
    state.flip.on("changeOrientation",()=>{updatePageInfo();updateInteractiveInfo()});
    updatePageInfo();updateInteractiveInfo();
  }else{
    status("Page flip library did not load. Showing rendered pages without flip animation.","warn");
  }
}

async function extractTextIndex(){
  const issue=state.activeIssue||{};
  const cmsText=[issue.searchText,issue.summary,arr(issue.categories).join(" "),arr(issue.destinations||issue.destinationTags).join(" ")].filter(Boolean).join(" ");
  state.textIndex=[];
  for(let p=1;p<=state.pdf.numPages;p++){
    try{
      const page=await state.pdf.getPage(p);
      const tc=await page.getTextContent();
      const text=tc.items.map(x=>x.str).join(" ").replace(/\s+/g," ").trim();
      state.textIndex.push({page:p,text});
      if(p%5===0)$("indexInfo").textContent=`Indexed ${p} / ${state.pdf.numPages} pages`;
    }catch(e){state.textIndex.push({page:p,text:""})}
  }
  if(cmsText)state.textIndex.push({page:1,text:cmsText,cms:true});
  $("indexInfo").textContent=`Search index ready · ${state.textIndex.length} entries`;
}
function updatePageInfo(){
  const n=(state.flip&&state.flip.getCurrentPageIndex)?state.flip.getCurrentPageIndex()+1:state.currentPage+1;
  const total=state.totalPages|| (state.pdf?Math.min(state.pdf.numPages,120):"—");
  $("pageInfo").textContent=`Page ${n} / ${total}`;
  if($("pageRange")){ $("pageRange").max=total==="—"?1:total; $("pageRange").value=Math.min(n,Number($("pageRange").max)); }
  if($("pageJumpInput"))$("pageJumpInput").value=n;
  document.querySelectorAll(".page-thumb").forEach(t=>t.classList.toggle("active",Number(t.dataset.page)===n));
  const active=document.querySelector(`.page-thumb[data-page="${n}"]`);if(active)active.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  updateInteractiveInfo();
}
function doSearch(){
  const q=$("query").value.trim().toLowerCase();
  const cat=$("category").value;
  const dest=$("destination").value;
  const results=[];
  for(const issue of state.issues){
    const meta=[issue.title,issue.subtitle,issue.summary,arr(issue.categories).join(" "),arr(issue.destinations||issue.destinationTags).join(" "),issue.searchText].join(" ").toLowerCase();
    if(cat && !arr(issue.categories).includes(cat))continue;
    if(dest && !arr(issue.destinations||issue.destinationTags).includes(dest))continue;
    if(!q || meta.includes(q))results.push({type:"issue",issueId:issue.issueId||issue._id,title:issue.title,summary:issue.summary||issue.subtitle||"Open issue"});
  }
  if(q && state.textIndex.length){
    state.textIndex.forEach(hit=>{
      const idx=hit.text.toLowerCase().indexOf(q);
      if(idx>=0){
        results.push({type:"page",issueId:state.activeIssue?.issueId||state.activeIssue?._id,title:`Page ${hit.page}`,summary:hit.text.slice(Math.max(0,idx-60),idx+140),page:hit.page});
      }
    });
  }
  renderSearchResults(results.slice(0,30));
}
function renderSearchResults(results){
  $("searchResults").innerHTML=results.length?results.map(r=>`
    <button class="result" data-type="${esc(r.type)}" data-issue="${esc(r.issueId||"")}" data-page="${esc(r.page||"")}">
      <strong>${esc(r.title)}</strong><span>${esc(r.summary||"")}</span>
    </button>`).join(""):`<div class="result"><strong>No matches yet</strong><span>Try a destination, hotel, topic or phrase from the PDF.</span></div>`;
  document.querySelectorAll(".result").forEach(b=>b.onclick=async()=>{
    if(b.dataset.issue && (!state.activeIssue || String(state.activeIssue.issueId||state.activeIssue._id)!==String(b.dataset.issue)))await selectIssue(b.dataset.issue);
    if(b.dataset.page)goToPage(Number(b.dataset.page));
  });
}
function goToPage(page){
  if(!page)return;
  const index=Math.max(0,page-1);
  if(state.flip && state.flip.turnToPage)state.flip.turnToPage(index);
  state.currentPage=index;updatePageInfo();
}
$("searchBtn").onclick=doSearch;
$("query").addEventListener("keydown",e=>{if(e.key==="Enter")doSearch()});
["category","destination","sort"].forEach(id=>$(id).onchange=doSearch);
$("issueSelect").onchange=e=>selectIssue(e.target.value);
$("openLatestBtn").onclick=()=>{const latest=state.issues.find(i=>i.featured)||state.issues[0];if(latest)selectIssue(latest.issueId||latest._id)};
$("scrollIssuesBtn").onclick=()=>$("issuesBlock").scrollIntoView({behavior:"smooth"});
$("prevBtn").onclick=()=>state.flip&&state.flip.flipPrev?state.flip.flipPrev():goToPage(Math.max(1,state.currentPage));
$("nextBtn").onclick=()=>state.flip&&state.flip.flipNext?state.flip.flipNext():goToPage(state.currentPage+2);
$("interactiveToggleBtn").onclick=()=>{
  state.showInteractiveHints=!state.showInteractiveHints;
  document.body.classList.toggle("hide-interactive-hints",!state.showInteractiveHints);
  $("interactiveToggleBtn").textContent=state.showInteractiveHints?"Links visible":"Links hidden";
  $("interactiveToggleBtn").setAttribute("aria-pressed",String(state.showInteractiveHints));
};
$("fullscreenBtn").onclick=async()=>{
  const stage=document.querySelector(".flip-stage");
  try{
    if(!document.fullscreenElement&&stage.requestFullscreen)await stage.requestFullscreen();
    else if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();
    else post("VOY_REQUEST_FULLSCREEN",{issueId:issueKey()});
  }catch(e){post("VOY_REQUEST_FULLSCREEN",{issueId:issueKey()})}
};
$("pageRange").addEventListener("input",e=>goToPage(Number(e.target.value)));
$("pageJumpBtn").onclick=()=>goToPage(Number($("pageJumpInput").value));
$("pageJumpInput").addEventListener("keydown",e=>{if(e.key==="Enter")goToPage(Number(e.target.value))});
$("focusModeBtn").onclick=()=>{
  const active=document.body.classList.toggle("focus-reader");
  $("focusModeBtn").textContent=active?"Exit focus":"Focus mode";
  $("focusModeBtn").setAttribute("aria-pressed",String(active));
  setTimeout(()=>state.flip&&state.flip.update?state.flip.update():null,120);
};
$("shareBtn").onclick=async()=>{
  const issue=state.activeIssue||{};
  const shareData={title:issue.title||"VOY by SKANDI",text:issue.summary||"Read VOY, the travel magazine from SKANDI.",url:issue.shareUrl||issue.publicUrl||window.location.href};
  post("VOY_SHARE_ISSUE",{issueId:issueKey(),shareData});
  try{if(navigator.share)await navigator.share(shareData);else status("Share request sent to SKANDI.","ok")}catch(e){}
};
$("saveIssueBtn").onclick=()=>{post("VOY_SAVE_ISSUE",{issueId:issueKey(),issue:state.activeIssue});status("Saving this issue to your SKANDI profile...")};
$("openPdfBtn").onclick=()=>{const u=state.activeIssue?.pdfUrl||state.activeIssue?.fileUrl||state.activeIssue?.latestFileUrl;if(u)window.open(u,"_blank","noopener,noreferrer")};
const navMap={destinationsBtn:"/destinations",signatureBtn:"/signature-collection",myTripBtn:"/my-trip",planTripBtn:"/plan-your-trip",mastheadPlanBtn:"/destinations"};
Object.entries(navMap).forEach(([id,path])=>$(id)?.addEventListener("click",()=>post("VOY_NAVIGATE",{path})));
$("readerModalClose").onclick=closeReaderModal;
$("readerModal").addEventListener("click",e=>{if(e.target===$("readerModal"))closeReaderModal()});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&$("readerModal").classList.contains("show")){closeReaderModal();return}
  if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==="ArrowLeft"||e.key==="PageUp")$("prevBtn").click();
  if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){e.preventDefault();$("nextBtn").click()}
  if(e.key==="Home")goToPage(1);
  if(e.key==="End"&&state.totalPages)goToPage(state.totalPages);
});
document.addEventListener("fullscreenchange",()=>{$("fullscreenBtn").textContent=document.fullscreenElement?"Exit full screen":"Full screen"});
window.addEventListener("message",e=>{
  const m=e.data||{};if(m.source!==PARENT)return;
  if(m.type==="VOY_BOOTSTRAP_RESULT")renderBootstrap(m.payload||{});
  if(m.type==="VOY_INTERACTIONS_UPDATE"){state.globalInteractions=parseList(m.payload?.interactions||m.interactions);if(state.activeIssue){state.activeInteractions=getIssueInteractions(state.activeIssue);selectIssue(issueKey())}}
  if(m.type==="VOY_GO_TO_PAGE")goToPage(Number(m.page||m.payload?.page));
  if(m.type==="VOY_ISSUE_SAVED")status("Issue saved to your SKANDI profile.","ok");
  if(m.type==="VOY_ERROR")status(m.message||m.payload?.message||"VOY magazine error.","error");
});
post("VOY_READY");
