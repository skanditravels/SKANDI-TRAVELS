# Our Network

STATUS: NEEDS REVIEW
SLUG: /about/our-network
WIX PAGE: Our Network.wfe5g
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #htmlSkandiMap
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 3:02PM "Page might be restyled, but keeping same payloads, page not syncing correctly yet /Samuel"
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
<title>SKANDI Travels Network</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<link href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" rel="stylesheet">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
:root{
  --skandi-navy:#022e64;
  --skandi-navy-soft:#0a417f;
  --skandi-aqua:#5FC7CF;
  --skandi-cream:#fffbea;
  --text:#102033;
  --muted:#5b6b7e;
  --line:rgba(2,46,100,.14);
  --shadow:0 18px 48px rgba(2,46,100,.16);
  --bg:#f7f9fc;
  --white:#ffffff;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:100%;
  min-height:100%;
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  background:var(--bg);
  color:var(--text);
}
button,input{font:inherit}
.sk-page{padding:0 0 80px;background:var(--bg)}
.sk-container{max-width:1240px;margin:0 auto;padding:0 30px}
.network-hero{
  position:relative;
  overflow:hidden;
  background:linear-gradient(135deg,#e8f1ff,#f7fbff);
  padding:64px 0 34px;
}
.network-hero:after{
  content:"";
  position:absolute;
  right:-120px;
  top:-160px;
  width:430px;
  height:430px;
  border-radius:50%;
  background:rgba(95,199,207,.22);
}
.hero-inner{
  position:relative;
  z-index:2;
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(260px,380px);
  gap:32px;
  align-items:end;
}
.eyebrow{
  display:inline-flex;
  align-items:center;
  gap:10px;
  color:var(--skandi-navy);
  text-transform:uppercase;
  letter-spacing:.18em;
  font-size:12px;
  font-weight:800;
  margin-bottom:14px;
  color:var(--skandi-aqua)
}
.eyebrow:before{content:"";width:38px;height:1px;background:var(--skandi-aqua);}
.network-hero h1{
  color:var(--skandi-navy);
  font-size:42px;
  line-height:1.08;
  margin:0 0 14px;
}
.network-hero p{
  color:#34465a;
  font-size:16px;
  line-height:1.7;
  max-width:760px;
}
.hero-card{
  background:rgba(255,255,255,.86);
  backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.8);
  border-radius:20px;
  box-shadow:var(--shadow);
  padding:22px;
}
.hero-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px;
}
.stat{
  background:#fff;
  border:1px solid var(--line);
  border-radius:16px;
  padding:14px 10px;
  text-align:center;
}
.stat b{display:block;color:var(--skandi-navy);font-size:24px}
.stat span{font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.map-section{margin-top:28px}
#skandi-map-wrap{
  position:relative;
  width:100%;
  height:72vh;
  min-height:560px;
  overflow:hidden;
  border-radius:22px;
  background:#edf4f8;
  box-shadow:var(--shadow);
}
#map{
  position:absolute;
  inset:0;
  z-index:1;
}
#brand-logo{
  position:absolute;
  top:16px;
  right:16px;
  z-index:500;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:2px;
  border-radius:18px;
  background:transparent;
  backdrop-filter:blur(10px);
  box-shadow:0 10px 26px rgba(2,46,100,.10);
  pointer-events:none;
}
#brand-logo img{
  display:block;
  width:150px;
  max-width:28vw;
  height:auto;
}
#map-status{
  position:absolute;
  left:16px;
  bottom:16px;
  z-index:500;
  padding:9px 12px;
  border-radius:999px;
  background:rgba(255,255,255,.88);
  backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.7);
  box-shadow:0 10px 26px rgba(2,46,100,.10);
  color:var(--muted);
  font-size:11px;
  font-weight:700;
}
.map-filter{
  position:absolute;
  left:16px;
  top:16px;
  z-index:500;
  max-width:min(380px,calc(100% - 190px));
  background:rgba(255,255,255,.9);
  backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.8);
  box-shadow:0 10px 26px rgba(2,46,100,.10);
  border-radius:18px;
  padding:12px;
  margin-left:200px;
}
.map-filter strong{
  display:block;
  color:var(--skandi-navy);
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.12em;
  margin-bottom:7px;
}
.map-filter-row{
  display:flex;
  gap:8px;
  align-items:center;
}
.map-filter input{
  width:100%;
  min-width:0;
  border:1px solid var(--line);
  border-radius:999px;
  padding:10px 13px;
  outline:none;
  font-size:13px;
  color:var(--text);
}
.map-filter button{
  flex:0 0 auto;
  border:1px solid rgba(2,46,100,.14);
  border-radius:999px;
  padding:10px 12px;
  background:linear-gradient(180deg,var(--skandi-navy-soft),var(--skandi-navy));
  color:#fff;
  font-size:11px;
  font-weight:800;
  cursor:pointer;
}
.skandi-marker{position:relative;width:26px;height:26px}
.skandi-marker::before{
  content:"";
  position:absolute;
  inset:-7px;
  border-radius:50%;
  background:rgba(95,199,207,.22);
  transform:scale(.88);
  animation:skandiPulse 2.4s ease-in-out infinite;
}
.skandi-marker__dot{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:linear-gradient(180deg,var(--skandi-navy-soft),var(--skandi-navy));
  border:2px solid #fff;
  box-shadow:0 10px 22px rgba(2,46,100,.28);
}
.skandi-marker__dot::after{
  content:"";
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--skandi-aqua);
}
@keyframes skandiPulse{
  0%,100%{opacity:.28;transform:scale(.82)}
  50%{opacity:.12;transform:scale(1.18)}
}
.leaflet-container{
  background:#edf4f8;
  font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
}
.leaflet-control-zoom{
  border:none!important;
  border-radius:14px!important;
  overflow:hidden;
  box-shadow:0 12px 28px rgba(2,46,100,.12)!important;
}
.leaflet-control-zoom a{
  width:38px!important;
  height:38px!important;
  line-height:38px!important;
  border:none!important;
  color:var(--skandi-navy)!important;
  font-weight:800;
}
.leaflet-control-attribution{
  background:rgba(255,255,255,.72)!important;
  backdrop-filter:blur(10px);
  font-size:10px;
}
.leaflet-popup-content-wrapper{
  border-radius:18px;
  box-shadow:var(--shadow);
  border:1px solid rgba(255,255,255,.7);
}
.leaflet-popup-tip{box-shadow:var(--shadow)}
.leaflet-popup-content{
  margin:15px 16px 14px;
  min-width:230px;
  max-width:280px;
}
.popup-kicker{
  display:inline-flex;
  align-items:center;
  gap:6px;
  margin-bottom:8px;
  color:var(--skandi-navy);
  font-size:10px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
}
.popup-kicker::before{
  content:"";
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--skandi-aqua);
}
.popup-title{
  font-size:16px;
  line-height:1.25;
  font-weight:800;
  color:var(--text);
}
.popup-meta{
  margin-top:6px;
  font-size:12px;
  line-height:1.55;
  color:var(--muted);
}
.skandi-plane-icon-wrap{background:transparent;border:none}
.skandi-plane-icon{
  width:22px;
  height:22px;
  border-radius:50%;
  background:#ffffff;
  border:1px solid rgba(2,46,100,.18);
  box-shadow:0 8px 18px rgba(2,46,100,.16);
  display:grid;
  place-items:center;
  color:var(--skandi-navy);
  font-size:12px;
  line-height:1;
}
.skandi-plane-icon span{
  display:inline-block;
  transform-origin:50% 50%;
}
.popup-summary{
  margin-top:9px;
  font-size:12px;
  line-height:1.65;
  color:#34465a;
}
.popup-tags{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:11px;
}
.popup-tag{
  display:inline-flex;
  align-items:center;
  padding:5px 8px;
  border-radius:999px;
  background:var(--skandi-cream);
  border:1px solid rgba(2,46,100,.10);
  color:var(--skandi-navy);
  font-size:10px;
  font-weight:800;
}
.popup-link,.popup-action{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin-top:12px;
  padding:9px 11px;
  border-radius:12px;
  color:#fff;
  background:linear-gradient(180deg,var(--skandi-navy-soft),var(--skandi-navy));
  text-decoration:none;
  font-size:11px;
  font-weight:800;
  border:0;
  cursor:pointer;
}
.info-wrap{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(300px,420px);
  gap:26px;
  margin-top:30px;
  align-items:start;
}
.info-panel,.side-panel{
  background:#fff;
  border:1px solid var(--line);
  border-radius:22px;
  box-shadow:var(--shadow);
  padding:24px;
}
.info-panel h2,.side-panel h3{
  color:var(--skandi-navy);
  margin:0 0 10px;
}
.info-panel p,.side-panel p{
  color:#34465a;
  line-height:1.65;
  font-size:14px;
}
.selection-card{
  margin-top:18px;
  background:#f7fbff;
  border:1px solid var(--line);
  border-radius:18px;
  padding:18px;
}
.selection-card h3{
  color:var(--skandi-navy);
  font-size:20px;
  margin:0 0 8px;
}
.selection-meta{
  color:var(--muted);
  font-size:13px;
  margin-bottom:10px;
}
.chip-row{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin:12px 0 0;
}
.chip{
  display:inline-flex;
  align-items:center;
  border-radius:999px;
  background:var(--skandi-cream);
  border:1px solid rgba(2,46,100,.10);
  color:var(--skandi-navy);
  padding:6px 9px;
  font-size:11px;
  font-weight:800;
}
.card-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
  gap:16px;
  margin-top:18px;
}
.network-card{
  border:1px solid var(--line);
  border-radius:18px;
  background:#fff;
  overflow:hidden;
  box-shadow:0 8px 20px rgba(2,46,100,.08);
}
.network-card img{
  width:100%;
  height:130px;
  object-fit:cover;
  background:#edf4f8;
}
.network-card .body{padding:14px}
.network-card h4{color:var(--skandi-navy);font-size:15px;margin:0 0 6px}
.network-card p{font-size:12px;color:#34465a;margin:0;line-height:1.55}
.network-card a{
  display:inline-flex;
  color:var(--skandi-navy);
  font-size:12px;
  font-weight:800;
  margin-top:10px;
  text-decoration:none;
}
.route-list{
  display:grid;
  gap:10px;
  margin-top:12px;
}
.route-pill{
  display:flex;
  justify-content:space-between;
  gap:10px;
  align-items:center;
  border:1px solid var(--line);
  border-radius:14px;
  padding:11px 12px;
  background:#fff;
}
.route-pill strong{font-size:13px;color:var(--skandi-navy)}
.route-pill span{font-size:11px;color:var(--muted)}
.public-note{
  margin-top:20px;
  font-size:12px;
  line-height:1.6;
  color:var(--muted);
}
@media(max-width:900px){
  .hero-inner,.info-wrap{grid-template-columns:1fr}
  .network-hero h1{font-size:34px}
  #skandi-map-wrap{height:70vh;min-height:520px}
  .map-filter{max-width:calc(100% - 32px);right:16px}
  #brand-logo{top:auto;bottom:16px}
  #brand-logo img{width:120px}
}
@media(max-width:700px){
  .sk-container{padding:0 20px}
  .network-hero{padding:46px 0 28px}
  #skandi-map-wrap{min-height:460px;border-radius:18px}
  .leaflet-popup-content{min-width:210px}
}
/* MOBILE OFF-CANVAS SIDE MENU */
html.mobile-menu-open,
body.mobile-menu-open{
  overflow:hidden;
  overscroll-behavior:none;
}
#mobileMenuLayer,
#mobileMenuLayer *{
  box-sizing:border-box;
}
#mobileMenuLayer{
  --drawer-blue:#022e64;
  --drawer-blue2:#0b3a7a;
  --drawer-cyan:#5fc7cf;
  --drawer-line:#e6e9ee;
  --drawer-muted:#667085;
  position:fixed;
  inset:0;
  z-index:2000;
  visibility:hidden;
  pointer-events:none;
  transition:visibility 0s linear .3s;
}
#mobileMenuLayer.open{
  visibility:visible;
  pointer-events:auto;
  transition-delay:0s;
}
#mobileMenuBackdrop{
  position:absolute;
  inset:0;
  border:0;
  padding:0;
  margin:0;
  background:rgba(2,18,39,.52);
  opacity:0;
  cursor:default;
  transition:opacity .28s ease;
  -webkit-tap-highlight-color:transparent;
}
#mobileMenuLayer.open #mobileMenuBackdrop{
  opacity:1;
}
#mobileDrawer{
  position:absolute;
  top:0;
  right:0;
  width:min(86vw,360px);
  height:100%;
  min-height:100dvh;
  background:#fff;
  color:#111827;
  box-shadow:-18px 0 48px rgba(15,23,42,.25);
  transform:translateX(105%);
  transition:transform .3s cubic-bezier(.22,.8,.2,1);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  outline:none;
}
#mobileMenuLayer.open #mobileDrawer{
  transform:translateX(0);
}
#mobileDrawer .mobile-drawer-head{
  flex:0 0 auto;
  min-height:76px;
  padding:14px 16px;
  background:linear-gradient(135deg,var(--drawer-blue),var(--drawer-blue2));
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
#mobileDrawer .mobile-drawer-brand{
  min-width:0;
}
#mobileDrawer .mobile-drawer-brand strong{
  display:block;
  font-size:18px;
  line-height:1.2;
  letter-spacing:-.02em;
}
#mobileDrawer .mobile-drawer-brand span{
  display:block;
  margin-top:4px;
  color:rgba(255,255,255,.76);
  font-size:11px;
  line-height:1.35;
  font-weight:600;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
#mobileMenuClose{
  flex:0 0 auto;
  width:38px;
  height:38px;
  border:1px solid rgba(255,255,255,.32);
  border-radius:999px;
  background:rgba(255,255,255,.12);
  color:#fff;
  font-size:24px;
  line-height:1;
  cursor:pointer;
}
#mobileMenuClose:hover,
#mobileMenuClose:focus-visible{
  background:rgba(255,255,255,.22);
}
#mobileDrawer .mobile-drawer-body{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  overscroll-behavior:contain;
  padding:14px 12px calc(18px + env(safe-area-inset-bottom));
  -webkit-overflow-scrolling:touch;
}
#mobileDrawer .mobile-menu-list{
  display:flex;
  flex-direction:column;
  gap:4px;
}
#mobileDrawer .mobile-menu-link{
  width:100%;
  min-height:50px;
  border:0;
  border-bottom:1px solid #edf0f4;
  border-radius:12px;
  background:#fff;
  color:var(--drawer-blue);
  padding:12px 14px;
  text-align:left;
  font-family:Montserrat,system-ui,sans-serif;
  font-size:14px;
  line-height:1.35;
  font-weight:750;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
#mobileDrawer .mobile-menu-link::after{
  content:"›";
  flex:0 0 auto;
  color:var(--drawer-cyan);
  font-size:24px;
  font-weight:500;
  line-height:1;
}
#mobileDrawer .mobile-menu-link:hover,
#mobileDrawer .mobile-menu-link:focus-visible{
  background:#f4f8ff;
  outline:none;
}
#mobileDrawer .mobile-drawer-actions{
  flex:0 0 auto;
  padding:12px 14px calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--drawer-line);
  background:#fff;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}
#mobileDrawer .mobile-drawer-action{
  min-height:42px;
  border:1px solid #dbe3ee;
  border-radius:999px;
  background:#fff;
  color:var(--drawer-blue);
  font-family:Montserrat,system-ui,sans-serif;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}
#mobileDrawer .mobile-drawer-action.primary{
  border-color:var(--drawer-blue);
  background:var(--drawer-blue);
  color:#fff;
}
#mobileDrawer .mobile-drawer-action:hover,
#mobileDrawer .mobile-drawer-action:focus-visible{
  box-shadow:0 0 0 3px rgba(95,199,207,.22);
  outline:none;
}

@media (prefers-reduced-motion:reduce){
  #mobileMenuLayer,
  #mobileMenuBackdrop,
  #mobileDrawer{
    transition:none !important;
  }
}
</style>
</link></link><style>
/* Dynamic page is embedded below the site-level Wix header and above the site-level footer. */
:root{--header-total:0px!important;--header-h:0px!important;--bar-height:0px!important}
.country-page,.destination-page,.area-page,.hotel-page{padding-top:0!important}
.country-subnav,.destination-subnav,.area-subnav,.hotel-nav-wrap{top:0!important}
.signature,.destination-signature,.area-signature{top:80px!important}
</style></head>
<body>
<div class="sk-page">
<section class="network-hero">
<div class="sk-container hero-inner">
<div>
<div class="eyebrow">SKANDI Travels Network</div>
<h1>Explore our destinations, routes and selected stays.</h1>
<p>Discover the places SKANDI connects, including selected public destination, flight and hotel information. Select a point or route on the map to view more details below.</p>
</div>
<aside class="hero-card">
<div class="hero-stats">
<div class="stat"><b id="statDest">0</b><span>Destinations</span></div>
<div class="stat"><b id="statRoutes">0</b><span>Routes</span></div>
<div class="stat"><b id="statHotels">0</b><span>Hotels</span></div>
</div>
<p class="public-note">Our Signature group is growing for everu month. </p>
</aside>
</div>
</section>
<section class="sk-container map-section">
<div id="skandi-map-wrap">
<div aria-label="SKANDI Travels interactive map" id="map" role="region"></div>
<div class="map-filter">
<strong>Find on the map</strong>
<div class="map-filter-row">
<input id="networkSearch" placeholder="Search destination, route, hotel or region…"/>
<button aria-label="Refresh network map" id="networkRefresh" type="button">Refresh</button>
</div>
</div>
<div id="brand-logo">
<img alt="SKANDI Travels" src="https://static.wixstatic.com/media/394052_99036987dae64256b2aea0ac8d83c5a0~mv2.png"/>
</div>
<div hidden="" id="map-status">Loading map…</div>
</div>
<div class="info-wrap">
<section class="info-panel">
<div class="eyebrow">Selected network point</div>
<h2 id="selectionTitle">Select a destination or route</h2>
<p id="selectionText">Click a destination marker or flight route on the map to open destination, route and hotel information here.</p>
<div class="selection-card" id="selectionDetails" style="display:none"></div>
<div id="relatedHotels"></div>
</section>
</div>
</section>
</div>
<script>
let MAP_DATA = {
  destinations: [],
  routes: [],
  hotels: [],
  stats: { destinations: 0, routes: 0, hotels: 0 },
  publicNote: ""
};

const HTML_SOURCE = "SKANDI_PUBLIC_NETWORK_MAP";
const PARENT_SOURCE = "SKANDI_WIX_PARENT";
let map, destinationLayer, routeLayer, statusEl, pendingPayload = null;
let markerIndex = {};
let routeIndex = {};

function setStatus(text, visible){
  if (!statusEl) return;
  statusEl.textContent = text || "";
  statusEl.hidden = !visible;
}
function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, function(s){
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[s];
  });
}
function firstDefined(){
  for (let i = 0; i < arguments.length; i++){
    if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== "") return arguments[i];
  }
  return "";
}
function toNumber(value){
  if (typeof value === "number" && isFinite(value)) return value;
  if (typeof value === "string"){
    const n = Number(value.trim().replace(",", "."));
    return isFinite(n) ? n : null;
  }
  return null;
}
function toArray(value){
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}
function getLocation(item){
  const nested = item.location || item.geoLocation || item.coordinates || item.addressLocation || item.mapLocation || {};
  return {
    lat: toNumber(firstDefined(item.lat, item.latitude, item.Latitude, nested.lat, nested.latitude)),
    lng: toNumber(firstDefined(item.lng, item.lon, item.long, item.longitude, item.Longitude, nested.lng, nested.lon, nested.long, nested.longitude))
  };
}
function normalizeDestination(item){
  item = item || {};
  const loc = getLocation(item);
  return {
    id: String(firstDefined(item.id, item.code, item.Code, item.iata, item.IATA, item._id)).trim(),
    name: String(firstDefined(item.name, item.title, item.destinationName, item.city, item.label, item.code, item.id)).trim(),
    iata: String(firstDefined(item.iata, item.IATA, item.airportCode, item.code)).trim(),
    country: String(firstDefined(item.country, item.Country)).trim(),
    region: String(firstDefined(item.region, item.Region, item.continent)).trim(),
    lat: loc.lat,
    lng: loc.lng,
    summary: String(firstDefined(item.summary, item.description, item.shortDescription, item.excerpt)).trim(),
    tags: toArray(firstDefined(item.tags, item.Tags, item.categories)),
    pageUrl: String(firstDefined(item.pageUrl, item.url, item.link, item.pageLink, item.slug ? "/" + item.slug : "")).trim(),
    heroImage: String(firstDefined(item.heroImage, item.image, item.mainImage, item.coverImage)).trim(),
    hotels: Array.isArray(item.hotels) ? item.hotels : [],
    hiddenOnMap: Boolean(firstDefined(item.hiddenOnMap, item.hideOnMap, item.hideOnDestinationsLayer, false)),
    linked: Array.isArray(item.linked) ? item.linked : []
  };
}
function normalizeRoute(item){
  item = item || {};
  const viaRaw = firstDefined(item.via, item.viaCodes, item.viaIds, item.stops, item.stopCodes);
  return {
    id: String(firstDefined(item.id, item.code, item.routeCode, item._id)).trim(),
    fromId: String(firstDefined(item.fromId, item.fromCode, item.originId, item.originCode, item.from, item.origin)).trim(),
    toId: String(firstDefined(item.toId, item.toCode, item.destinationId, item.destinationCode, item.to, item.destination)).trim(),
    via: toArray(viaRaw),
    label: String(firstDefined(item.label, item.name, item.title)).trim(),
    airlines: toArray(firstDefined(item.airlines, item.carriers, item.airline)),
    tags: toArray(firstDefined(item.tags, item.Tags)),
    pageUrl: String(firstDefined(item.pageUrl, item.url, item.link, item.pageLink)).trim(),
    linked: Array.isArray(item.linked) ? item.linked : []
  };
}
function normalizeHotel(item){
  item = item || {};
  const loc = getLocation(item);
  return {
    id: String(firstDefined(item.id, item.hotelId, item.code, item._id)).trim(),
    name: String(firstDefined(item.name, item.title, item.hotelName)).trim(),
    destinationId: String(firstDefined(item.destinationId, item.destinationCode, item.destCode, item.iata, item.city, item.region)).trim(),
    city: String(firstDefined(item.city, item.destination)).trim(),
    country: String(firstDefined(item.country)).trim(),
    region: String(firstDefined(item.region, item.destination)).trim(),
    lat: loc.lat,
    lng: loc.lng,
    summary: String(firstDefined(item.summary, item.description, item.shortDescription, item.publicDescription)).trim(),
    tags: toArray(firstDefined(item.tags, item.publicTags, item.amenities)),
    pageUrl: String(firstDefined(item.pageUrl, item.url, item.link, item.pageLink)).trim(),
    image: String(firstDefined(item.image, item.heroImage, item.mainImage, item.coverImage)).trim(),
    starRating: item.starRating || item.stars || ""
  };
}
function normalizePayload(payload){
  const rawDestinations = Array.isArray(payload.destinations) ? payload.destinations : [];
  const rawRoutes = Array.isArray(payload.routes) ? payload.routes : [];
  const rawHotels = Array.isArray(payload.hotels) ? payload.hotels : [];

  const hotels = rawHotels.map(normalizeHotel).filter(h => h.id && h.name);
  const destinations = rawDestinations
    .map(normalizeDestination)
    .filter(d => d.id && d.name && typeof d.lat === "number" && typeof d.lng === "number")
    .map(d => {
      const attached = hotels.filter(h => {
        const keys = [h.destinationId, h.city, h.region].map(x => String(x || "").toLowerCase());
        const dkeys = [d.id, d.iata, d.name, d.region].map(x => String(x || "").toLowerCase());
        return keys.some(k => k && dkeys.includes(k));
      });
      return { ...d, hotels: d.hotels && d.hotels.length ? d.hotels.map(normalizeHotel) : attached };
    });

  const routes = rawRoutes.map(normalizeRoute).filter(r => r.fromId && r.toId);
  return {
    destinations,
    routes,
    hotels,
    stats: payload.stats || {
      destinations: destinations.length,
      routes: routes.length,
      hotels: hotels.length
    },
    publicNote: payload.publicNote || ""
  };
}
function parseParentMessage(data){
  if (typeof data === "string"){
    try { data = JSON.parse(data); } catch(e) { return null; }
  }
  if (!data || typeof data !== "object") return null;
  if (data.source && data.source !== PARENT_SOURCE) return null;
  return data;
}
function payloadLooksLikeMapData(payload){
  return !!(
    payload &&
    typeof payload === "object" &&
    (
      Array.isArray(payload.destinations) ||
      Array.isArray(payload.routes) ||
      Array.isArray(payload.hotels)
    )
  );
}
function getMapPayloadFromMessage(data){
  const msg = parseParentMessage(data);
  if (!msg) return null;
  const type = String(msg.type || "").toUpperCase();

  if (type && type !== "SKANDI_MAP_DATA" && type !== "SKANDI-MAP-DATA") return null;

  const payload = msg.payload || msg.data || msg;
  return payloadLooksLikeMapData(payload) ? payload : null;
}
window.loadMapData = function(payload){
  if (!map || !destinationLayer || !routeLayer){
    pendingPayload = payload;
    setStatus("Loading data…", true);
    return;
  }
  try{
    MAP_DATA = normalizePayload(payload);
    rebuildMap();
    renderInfoDefaults();
  }catch(error){
    console.error("[SKANDI MAP] Could not load data:", error, payload);
    setStatus("Could not render network data. Check destination field names.", true);
  }
};
window.addEventListener("message", function(event){
  const msg = parseParentMessage(event.data);
  if (!msg) return;

  const type = String(msg.type || "").toUpperCase();
  if (type === "SKANDI_MAP_ERROR"){
    setStatus(msg.message || msg.payload?.message || "Network information is temporarily unavailable.", true);
    return;
  }

  const payload = getMapPayloadFromMessage(msg);
  if (payload) window.loadMapData(payload);
});
function notifyParentRefresh(){
  try{
    if (window.parent && window.parent !== window){
      window.parent.postMessage({ source:HTML_SOURCE, type:"SKANDI_MAP_REFRESH" }, "*");
      setStatus("Refreshing network…", true);
    }
  }catch(e){}
}
function notifyParentReady(){
  try{
    if (window.parent && window.parent !== window){
      window.parent.postMessage({ source:HTML_SOURCE, type:"SKANDI_MAP_READY" }, "*");
    }
  }catch(e){}
}
function destinationById(id){
  const wanted = String(id || "").trim().toLowerCase();
  return (MAP_DATA.destinations || []).find(d =>
    String(d.id || "").toLowerCase() === wanted ||
    String(d.iata || "").toLowerCase() === wanted
  );
}
function uniqueStrings(arr){
  return [...new Set((arr || []).map(String).map(s => s.trim()).filter(Boolean))];
}
function getPageUrl(obj){
  if (!obj) return "";
  if (obj.pageUrl) return obj.pageUrl;
  if (Array.isArray(obj.linked) && obj.linked[0] && obj.linked[0].url) return obj.linked[0].url;
  return "";
}
function selectDestination(dest){
  const meta = [dest.country, dest.region, dest.iata].filter(Boolean).join(" • ");
  document.getElementById("selectionTitle").textContent = dest.name || "Destination";
  document.getElementById("selectionText").textContent = dest.summary || "Selected public destination information.";
  const chips = uniqueStrings(dest.tags || []).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("");
  const url = getPageUrl(dest);
  document.getElementById("selectionDetails").style.display = "block";
  document.getElementById("selectionDetails").innerHTML = `
    <h3>${escapeHtml(dest.name || "")}</h3>
    ${meta ? `<div class="selection-meta">${escapeHtml(meta)}</div>` : ""}
    ${chips ? `<div class="chip-row">${chips}</div>` : ""}
    ${url ? `<a class="popup-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">View destination</a>` : ""}
  `;
  renderRelatedHotels(dest);
}
function selectRoute(route){
  const stops = getRouteStops(route);
  const from = stops[0];
  const to = stops[stops.length - 1];
  const title = route.label || `${from && from.name ? from.name : route.fromId} - ${to && to.name ? to.name : route.toId}`;
  const via = stops.slice(1,-1).map(s => s.name || s.iata || s.id).filter(Boolean);
  const chips = uniqueStrings([...(route.tags || []), ...(route.airlines || [])]).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("");
  const url = getPageUrl(route);
  document.getElementById("selectionTitle").textContent = title;
  document.getElementById("selectionText").textContent = `${from && from.name ? from.name : route.fromId} → ${to && to.name ? to.name : route.toId}${via.length ? " via " + via.join(" → ") : ""}`;
  document.getElementById("selectionDetails").style.display = "block";
  document.getElementById("selectionDetails").innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    ${chips ? `<div class="chip-row">${chips}</div>` : ""}
    ${url ? `<a class="popup-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">View route</a>` : ""}
  `;
  renderRelatedHotels(to || from);
}
function renderRelatedHotels(dest){
  const box = document.getElementById("relatedHotels");
  const hotels = dest && Array.isArray(dest.hotels) ? dest.hotels : [];
  if (!hotels.length){
    box.innerHTML = "";
    return;
  }
  box.innerHTML = `
    <div class="card-grid">
      ${hotels.slice(0,6).map(h => `
        <article class="network-card">
          ${h.image ? `<img src="${escapeHtml(h.image)}" alt="">` : ""}
          <div class="body">
            <h4>${escapeHtml(h.name || h.title || "Selected hotel")}</h4>
            <p>${escapeHtml(h.summary || [h.city,h.country].filter(Boolean).join(", "))}</p>
            <div class="chip-row">${uniqueStrings(h.tags || []).slice(0,4).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>
            ${h.pageUrl ? `<a href="${escapeHtml(h.pageUrl)}" target="_blank" rel="noopener">View hotel</a>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}
function popupForDestination(dest){
  const meta = [dest.country, dest.region, dest.iata].filter(Boolean).join(" • ");
  const tagsHtml = uniqueStrings(dest.tags || []).map(t => `<span class="popup-tag">${escapeHtml(t)}</span>`).join("");
  const url = getPageUrl(dest);
  return `
    <div>
      <div class="popup-kicker">Destination</div>
      <div class="popup-title">${escapeHtml(dest.name || dest.id || "Destination")}</div>
      ${meta ? `<div class="popup-meta">${escapeHtml(meta)}</div>` : ""}
      ${dest.summary ? `<div class="popup-summary">${escapeHtml(dest.summary)}</div>` : ""}
      ${dest.hotels && dest.hotels.length ? `<div class="popup-summary">${dest.hotels.length} selected hotels</div>` : ""}
      ${tagsHtml ? `<div class="popup-tags">${tagsHtml}</div>` : ""}
      ${url ? `<a class="popup-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">View destination</a>` : ""}
    </div>
  `;
}
function popupForRoute(route, stops){
  const from = stops[0];
  const to = stops[stops.length - 1];
  const via = stops.slice(1, -1).map(s => s.iata || s.id || s.name).filter(Boolean);
  const tagsHtml = uniqueStrings([...(route.tags || []), ...(route.airlines || [])]).map(t => `<span class="popup-tag">${escapeHtml(t)}</span>`).join("");
  const title = route.label || `${from && from.name ? from.name : route.fromId} - ${to && to.name ? to.name : route.toId}`;
  const url = getPageUrl(route);
  return `
    <div>
      <div class="popup-kicker">Route</div>
      <div class="popup-title">${escapeHtml(title)}</div>
      <div class="popup-meta">${escapeHtml(from && from.name ? from.name : route.fromId)} → ${escapeHtml(to && to.name ? to.name : route.toId)}</div>
      ${via.length ? `<div class="popup-summary">Via ${escapeHtml(via.join(" → "))}</div>` : ""}
      ${tagsHtml ? `<div class="popup-tags">${tagsHtml}</div>` : ""}
      ${url ? `<a class="popup-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">View route</a>` : ""}
    </div>
  `;
}
function makeDestinationIcon(){
  return L.divIcon({
    className:"skandi-destination-icon",
    html:`<div class="skandi-marker"><div class="skandi-marker__dot"></div></div>`,
    iconSize:[26,26],
    iconAnchor:[13,13],
    popupAnchor:[0,-12]
  });
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function normalizeLon(lon){return ((lon + 180) % 360 + 360) % 360 - 180}
function crossesDateLine(aLng,bLng){
  const lng1 = normalizeLon(aLng);
  const lng2 = normalizeLon(bLng);
  return Math.abs(lng2 - lng1) > 180;
}
function splitDateLineLeg(a,b){
  const lng1 = normalizeLon(a.lng);
  const lng2 = normalizeLon(b.lng);
  if (!crossesDateLine(lng1,lng2)){
    return [[{ lat:a.lat,lng:lng1 },{ lat:b.lat,lng:lng2 }]];
  }
  let edgeFrom, edgeTo, bLngUnwrapped;
  if (lng1 < 0 && lng2 > 0){
    edgeFrom = -180; edgeTo = 180; bLngUnwrapped = lng2 - 360;
  } else {
    edgeFrom = 180; edgeTo = -180; bLngUnwrapped = lng2 + 360;
  }
  const t = (edgeFrom - lng1) / (bLngUnwrapped - lng1);
  const crossLat = a.lat + ((b.lat - a.lat) * t);
  return [
    [{ lat:a.lat,lng:lng1 },{ lat:crossLat,lng:edgeFrom }],
    [{ lat:crossLat,lng:edgeTo },{ lat:b.lat,lng:lng2 }]
  ];
}
function curvedArcPointsVisible(a,b,steps=54){
  const lat1=a.lat,lng1=a.lng,lat2=b.lat,lng2=b.lng;
  const midLat=(lat1+lat2)/2, midLng=(lng1+lng2)/2;
  const lonDistance=Math.abs(lng2-lng1), latDistance=Math.abs(lat2-lat1);
  const distanceFactor=Math.max(lonDistance,latDistance);
  const poleDirection=midLat>=0?1:-1;
  const curveAmount=clamp(distanceFactor*.12,3,16);
  const ctrlLat=clamp(midLat+curveAmount*poleDirection,-78,78);
  const ctrlLng=midLng;
  const points=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps, omt=1-t;
    const lat=omt*omt*lat1+2*omt*t*ctrlLat+t*t*lat2;
    const lng=omt*omt*lng1+2*omt*t*ctrlLng+t*t*lng2;
    points.push([lat,lng]);
  }
  return points;
}
function getFlightLegSegments(a,b){
  const pieces = splitDateLineLeg(a,b);
  return pieces.map(pair => curvedArcPointsVisible(pair[0], pair[1], 54));
}
function lineScore(latlngs){
  if (!latlngs || latlngs.length < 2) return 0;
  const first = latlngs[0], last = latlngs[latlngs.length - 1];
  return Math.abs(last[0] - first[0]) + Math.abs(last[1] - first[1]);
}
function addPlaneToLine(latlngs){
  if (!latlngs || latlngs.length < 4) return;
  const midIndex = Math.floor(latlngs.length * .55);
  const prev = latlngs[Math.max(0, midIndex - 1)];
  const next = latlngs[Math.min(latlngs.length - 1, midIndex + 1)];
  const angle = getPlaneAngle(prev, next);
  L.marker(latlngs[midIndex], {
    icon: makePlaneIcon(angle),
    interactive: false
  }).addTo(routeLayer);
}
function getPlaneAngle(a,b){
  const dx=b[1]-a[1];
  const dy=-(b[0]-a[0]);
  return Math.atan2(dy,dx)*180/Math.PI;
}
function makePlaneIcon(angle){
  return L.divIcon({
    className:"skandi-plane-icon-wrap",
    html:`<div class="skandi-plane-icon"><span style="transform: rotate(${angle}deg);">✈</span></div>`,
    iconSize:[22,22],
    iconAnchor:[11,11]
  });
}
function getRouteStops(route){
  const viaIds = route.via ? (Array.isArray(route.via) ? route.via : [route.via]) : [];
  return [route.fromId, ...viaIds, route.toId].map(destinationById).filter(Boolean);
}
function calculateMinimumZoom(){
  const mapEl = document.getElementById("map");
  if (!mapEl) return 2.35;
  const width = mapEl.clientWidth || 1280;
  const height = mapEl.clientHeight || 560;
  const worldTileSize = 256;
  const zoomForWidth = Math.log2(width / worldTileSize);
  const zoomForHeight = Math.log2(height / worldTileSize);
  return Math.max(2.25, zoomForWidth, zoomForHeight);
}
function lockMapZoomToContainer(){
  if (!map) return;
  const minZoom = calculateMinimumZoom();
  map.setMinZoom(minZoom);
  if (map.getZoom() < minZoom) map.setZoom(minZoom);
}
function rebuildMap(){
  if (!map || !destinationLayer || !routeLayer) return;
  try{
    setStatus("Loading data…", true);
    destinationLayer.clearLayers();
    routeLayer.clearLayers();
    markerIndex = {};
    routeIndex = {};

    let renderedDestinations = 0;
    let renderedRoutes = 0;

    (MAP_DATA.routes || []).forEach(route => {
      const stops = getRouteStops(route);
      if (stops.length < 2) return;
      const popupHtml = popupForRoute(route, stops);
      let routeWasRendered = false;

      for (let i = 0; i < stops.length - 1; i++){
        const a = stops[i], b = stops[i + 1];
        if (typeof a.lat !== "number" || typeof a.lng !== "number") continue;
        if (typeof b.lat !== "number" || typeof b.lng !== "number") continue;

        const segments = getFlightLegSegments(a,b);
        let bestSegment = null;

        segments.forEach(latlngs => {
          if (!latlngs || latlngs.length < 2) return;
          const line = L.polyline(latlngs, {
            color:"#022e64",
            weight:1.6,
            opacity:.82,
            lineCap:"round",
            lineJoin:"round"
          })
          .bindPopup(popupHtml)
          .on("click", () => selectRoute(route))
          .addTo(routeLayer);

          routeIndex[route.id || `${route.fromId}-${route.toId}`] = line;

          if (!bestSegment || lineScore(latlngs) > lineScore(bestSegment)) bestSegment = latlngs;
          routeWasRendered = true;
        });

        if (bestSegment) addPlaneToLine(bestSegment);
      }

      if (routeWasRendered) renderedRoutes++;
    });

    (MAP_DATA.destinations || []).forEach(dest => {
      if (dest.hiddenOnMap || dest.hideOnMap) return;
      if (typeof dest.lat !== "number" || typeof dest.lng !== "number") return;
      const marker = L.marker([dest.lat,dest.lng], { icon:makeDestinationIcon() })
        .bindPopup(popupForDestination(dest))
        .on("click", () => selectDestination(dest))
        .addTo(destinationLayer);

      markerIndex[String(dest.id).toLowerCase()] = marker;
      if (dest.iata) markerIndex[String(dest.iata).toLowerCase()] = marker;
      if (dest.name) markerIndex[String(dest.name).toLowerCase()] = marker;

      renderedDestinations++;
    });

    const visibleLayers = [...routeLayer.getLayers(), ...destinationLayer.getLayers()];
    if (visibleLayers.length) {
      const bounds = L.featureGroup(visibleLayers).getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds.pad(.06), { animate:false, maxZoom:3.25 });
        lockMapZoomToContainer();
        if (map.getZoom() < 2.6) map.setZoom(2.6);
      } else {
        map.setView([28,-20],2.8);
      }
    } else {
      map.setView([28,-20],2.8);
    }

    document.getElementById("statDest").textContent = MAP_DATA.stats?.destinations ?? renderedDestinations;
    document.getElementById("statRoutes").textContent = MAP_DATA.stats?.routes ?? renderedRoutes;
    document.getElementById("statHotels").textContent = MAP_DATA.stats?.hotels ?? (MAP_DATA.hotels || []).length;

    if (!renderedDestinations) setStatus("No published network destinations are available from Inventory Control.", true);
    else setStatus("", false);

    renderRouteList();
  }catch(error){
    console.error("[SKANDI MAP] Render failed:", error);
    setStatus("Map render error. Check public data fields.", true);
  }
}
function renderRouteList(){
  const box = document.getElementById("routeList");
  const routes = (MAP_DATA.routes || []).slice(0,8);
  if (!box) return;
  box.innerHTML = routes.map(r => {
    const stops = getRouteStops(r);
    const from = stops[0], to = stops[stops.length - 1];
    const title = r.label || `${from?.name || r.fromId} - ${to?.name || r.toId}`;
    return `<button class="route-pill" data-select-route="${escapeHtml(r.id || "")}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(uniqueStrings(r.airlines || r.tags || []).slice(0,2).join(" · "))}</span></button>`;
  }).join("") || `<p>No public routes selected yet.</p>`;
}
function renderInfoDefaults(){
  document.getElementById("selectionTitle").textContent = "Select a destination or route";
  document.getElementById("selectionText").textContent = MAP_DATA.publicNote || "Click a destination marker or flight route on the map to open destination, route and hotel information here.";
  document.getElementById("selectionDetails").style.display = "none";
  document.getElementById("relatedHotels").innerHTML = "";
}
function doSearch(){
  const q = String(document.getElementById("networkSearch").value || "").trim().toLowerCase();
  if (!q) return;
  const dest = (MAP_DATA.destinations || []).find(d => [d.id,d.iata,d.name,d.country,d.region].join(" ").toLowerCase().includes(q));
  if (dest){
    selectDestination(dest);
    const marker = markerIndex[String(dest.id).toLowerCase()] || markerIndex[String(dest.iata).toLowerCase()];
    if (marker){
      map.setView([dest.lat,dest.lng], Math.max(map.getZoom(), 4), { animate:true });
      marker.openPopup();
    }
    return;
  }
  const route = (MAP_DATA.routes || []).find(r => [r.id,r.label,r.fromId,r.toId,(r.airlines||[]).join(" "),(r.tags||[]).join(" ")].join(" ").toLowerCase().includes(q));
  if (route){
    selectRoute(route);
    return;
  }
  const hotel = (MAP_DATA.hotels || []).find(h => [h.name,h.city,h.country,h.region,h.summary,(h.tags||[]).join(" ")].join(" ").toLowerCase().includes(q));
  if (hotel){
    const dest = (MAP_DATA.destinations || []).find(d => (d.hotels || []).some(h => h.id === hotel.id));
    if (dest) selectDestination(dest);
    document.getElementById("relatedHotels").innerHTML = `
      <div class="card-grid">
        <article class="network-card">
          ${hotel.image ? `<img src="${escapeHtml(hotel.image)}" alt="">` : ""}
          <div class="body">
            <h4>${escapeHtml(hotel.name)}</h4>
            <p>${escapeHtml(hotel.summary || [hotel.city,hotel.country].filter(Boolean).join(", "))}</p>
            ${hotel.pageUrl ? `<a href="${escapeHtml(hotel.pageUrl)}" target="_blank" rel="noopener">View hotel</a>` : ""}
          </div>
        </article>
      </div>`;
    return;
  }
  setStatus("No matching public network record found.", true);
  setTimeout(() => setStatus("", false), 2400);
}
document.addEventListener("click", function(e){
  const routeButton = e.target.closest("[data-select-route]");
  if (routeButton){
    const id = routeButton.dataset.selectRoute;
    const route = (MAP_DATA.routes || []).find(r => r.id === id);
    if (route) selectRoute(route);
  }
});
document.getElementById("networkSearch").addEventListener("keydown", function(e){
  if (e.key === "Enter") doSearch();
});
document.getElementById("networkRefresh").addEventListener("click", function(){
  notifyParentRefresh();
});
window.addEventListener("load", function(){
  statusEl = document.getElementById("map-status");
  try{
    if (!window.L){
      setStatus("Map library did not load. Check Leaflet script URL.", true);
      return;
    }
    
    map = L.map("map", {
      scrollWheelZoom:true,
      worldCopyJump:false,
      zoomControl:true,
      zoomSnap:.25,
      zoomDelta:.25,
      minZoom:2.35,
      maxZoom:7,
      maxBounds:[[-90,-180],[90,180]], // Full world bounds
      maxBoundsViscosity: 1.0 // 1.0 creates a solid wall so it stops completely
    });

    lockMapZoomToContainer();

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:"&copy; OpenStreetMap contributors",
      noWrap:true,
      bounds:[[-90,-180],[90,180]] // Match the map bounds
    }).addTo(map);

    routeLayer = L.layerGroup().addTo(map);
    destinationLayer = L.layerGroup().addTo(map);

    if (pendingPayload){
      const payload = pendingPayload;
      pendingPayload = null;
      window.loadMapData(payload);
    } else {
      // Do not render fallback/sample network records. The map remains empty
      // until Wix supplies published Inventory Control V2 data.
      MAP_DATA = normalizePayload({ destinations:[], routes:[], hotels:[], stats:{ destinations:0, routes:0, hotels:0 }, publicNote:"" });
      rebuildMap();
      renderInfoDefaults();
      setStatus("Loading published network data from Inventory Control…", true);
    }

    setTimeout(() => { map.invalidateSize(); rebuildMap(); }, 300);
    setTimeout(() => { if (map) map.invalidateSize(); }, 500);
    setTimeout(() => { if (map) map.invalidateSize(); }, 1000);

    notifyParentReady();
  }catch(error){
    console.error("[SKANDI MAP] Init failed:", error);
    setStatus("Map could not initialize. Check browser console.", true);
  }
});
</script>
</body>
</html>
