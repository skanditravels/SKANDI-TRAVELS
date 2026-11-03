
/* SKANDI Internal Classic Chrome v1 */(function(){
  const SOURCE="SKANDI_INTERNAL_CHROME",PARENT_SOURCE="SKANDI_WIX_PARENT";
  const state={pageName:"MAGAZINE MANAGER",pagePath:"/riaintra/voy-control",pageSubtitle:"VOY · Newsroom · Website planning · Media control",profile:{},apps:[],utc:false,searchTimer:null,localSearchIndex:[],isAltea:false};
  const $=id=>document.getElementById(id);
  function esc(v){return String(v==null?"":v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*")}
  function setChromeHeight(){const c=$("skInternalChrome");if(!c)return;document.documentElement.classList.add("sk-has-internal-chrome");document.documentElement.style.setProperty("--sk-chrome-height",c.offsetHeight+"px")}
  function setViewportVars(){document.documentElement.style.setProperty("--sk-vh",(window.innerHeight*.01)+"px");setChromeHeight()}
  function displayName(p={}){return p.name||p.fullName||[p.firstName,p.lastName].filter(Boolean).join(" ")||p.email||"Staff"}
  function position(p={}){return p.position||p.jobTitle||p.role||"—"}
  function base(p={}){return p.base||p.station||p.baseAirportIata||"—"}
  function renderProfile(){const p=state.profile||{};$("skChromePageName").textContent=state.pageName||"MAGAZINE MANAGER";$("skChromePageSubtitle").textContent=state.pageSubtitle||"Travel magazine publishing";$("skChromeUserName").textContent=displayName(p);$("skChromeSkid").textContent=p.skId||p.skID||"—";$("skChromePosition").textContent=position(p);$("skChromeBase").textContent=base(p);const c=$("skInternalChrome");c.classList.toggle("is-altea",!!state.isAltea||String(state.pagePath||"").includes("/altea"));setChromeHeight()}
  function tick(){const now=new Date();const opts=state.utc?{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZone:"UTC"}:{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false};$("skChromeClockTime").textContent=new Intl.DateTimeFormat(undefined,opts).format(now);$("skChromeClockDate").textContent=state.utc?now.toISOString().slice(0,10)+" UTC":new Intl.DateTimeFormat(undefined,{weekday:"short",day:"2-digit",month:"short"}).format(now).toUpperCase()}
  function closeMenus(){document.querySelectorAll(".sk-menu.open").forEach(m=>m.classList.remove("open"))}
  function buildLocalSearchIndex(){const menuLinks=Array.from(document.querySelectorAll("[data-path]")).map(btn=>({title:btn.innerText.trim(),type:"Menu",path:btn.getAttribute("data-path"),summary:"Internal module"}));const apps=(state.apps||[]).map(app=>({title:app.title||app.id||"Tool",type:app.group||"Tool",path:app.path||"",summary:app.subtitle||""})).filter(x=>x.path);state.localSearchIndex=[...menuLinks,...apps]}
  function localSearch(query){const q=query.toLowerCase();buildLocalSearchIndex();return state.localSearchIndex.filter(item=>[item.title,item.type,item.path,item.summary].join(" ").toLowerCase().includes(q)).slice(0,8)}
  function renderSearchResults(items=[],pending=false){const box=$("skChromeSearchResults");box.classList.add("visible");if(!items.length){box.innerHTML=`<div class="sk-search-empty">${pending?"Searching…":"No results."}</div>`;return}box.innerHTML=items.map(item=>`<button class="sk-search-result" type="button" data-result-path="${esc(item.path||"")}"><div class="sk-search-result-title">${esc(item.title||"Result")}</div><div class="sk-search-result-meta">${esc(item.type||"RIAINTRA")} · ${esc(item.summary||item.path||"")}</div></button>`).join("");box.querySelectorAll(".sk-search-result").forEach(btn=>btn.addEventListener("click",()=>{const path=btn.getAttribute("data-result-path");if(path)post("INTERNAL_NAVIGATE",{path});closeMenus()}))}
  function setupMenus(){
    document.querySelectorAll(".sk-menu-button").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();const menu=btn.closest(".sk-menu"),was=menu.classList.contains("open");closeMenus();if(!was)menu.classList.add("open");setChromeHeight()}));
    document.addEventListener("click",e=>{if(!e.target.closest(".sk-menu"))closeMenus()});
    document.querySelectorAll(".sk-chrome [data-action='print']").forEach(btn=>btn.addEventListener("click",()=>{closeMenus();window.print()}));
    document.querySelectorAll(".sk-chrome [data-action='logout']").forEach(btn=>btn.addEventListener("click",()=>{closeMenus();post("INTERNAL_LOGOUT",{destination:"home"})}));
    document.querySelectorAll(".sk-chrome [data-path]").forEach(btn=>btn.addEventListener("click",()=>{const path=String(btn.getAttribute("data-path")||"").trim();if(path)post("INTERNAL_NAVIGATE",{path});closeMenus()}));
    $("skChromeClock").addEventListener("click",()=>{state.utc=!state.utc;tick()});
    const search=$("skChromeSearchInput");search.addEventListener("input",()=>{clearTimeout(state.searchTimer);const query=search.value.trim();if(!query){renderSearchResults([]);return}state.searchTimer=setTimeout(()=>{renderSearchResults(localSearch(query),true);post("INTERNAL_GLOBAL_SEARCH",{query,pagePath:state.pagePath})},180)});search.addEventListener("keydown",e=>{if(e.key==="Enter"){const first=document.querySelector(".sk-search-result");if(first)first.click()}});
  }
  window.addEventListener("message",event=>{const data=event.data||{};if(data.source!==PARENT_SOURCE)return;const p=data.payload||{};if(data.type==="INTERNAL_CHROME_BOOTSTRAP"){state.pageName=p.pageName||state.pageName;state.pagePath=p.pagePath||state.pagePath;state.pageSubtitle=p.pageSubtitle||state.pageSubtitle;state.profile=p.profile||state.profile||{};state.apps=p.apps||state.apps||[];state.isAltea=!!p.isAltea;renderProfile();return}if(data.type==="INTERNAL_SEARCH_RESULTS"){renderSearchResults(p.results||[])}});
  window.SKANDI_INTERNAL_CHROME={setPage(config={}){Object.assign(state,config);renderProfile()},setProfile(profile={}){state.profile=profile;renderProfile()},setSearchResults(results=[]){renderSearchResults(results)}};
  window.addEventListener("resize",setViewportVars,{passive:true});window.addEventListener("orientationchange",()=>setTimeout(setViewportVars,250),{passive:true});window.addEventListener("pageshow",setViewportVars,{passive:true});
  setupMenus();renderProfile();tick();setInterval(tick,1000);setViewportVars();post("INTERNAL_CHROME_READY");
})();
