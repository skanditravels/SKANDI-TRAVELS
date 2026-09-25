# Search

## INFO / LOG

- **Source identity:** `/HTML_REF/skandi/Search.md`
- **Display name:** Search
- **System area:** SKANDI
- **Wix page:** `Search.b7zch`
- **Route:** `/search`
- **Wix HTML element:** `#searchResultsEmbed`
- **Current status:** READY CANDIDATE — B-011.1
- **Source-of-truth status:** Complete intended Search HTML + architecture record.
- **Linked page controller:** `/src/pages/Search.b7zch.js`
- **Canonical backend facade(s):** None required. This is a public route-index search and does not query privileged data.
- **Canonical backend core(s):** None required.
- **Public route authority:** `/src/public/siteMap.js` (`SITE_MAP`, `APP_ROUTES`, `isSafeInternalRoute`)
- **Supabase dependencies:** None.
- **External API/provider dependencies:** None.
- **Authentication boundary:** Public. Internal `/riaintra` and private `/my-profile` routes are excluded.
- **HTML source:** `SKANDI_SEARCH_RESULTS`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Last verified:** 2026-09-25

### Cross-layer message contract

Child → parent:
- `SEARCH_READY`
- `SEARCH_QUERY_UPDATE`
- `SEARCH_RESULT_NAVIGATE`
- `SEARCH_RESIZE`

Parent → child:
- `SEARCH_INDEX_UPDATE`
- `SEARCH_PAGE_QUERY`

### Architecture notes

1. **B-011.1 activates the previously dormant `SEARCH_INDEX_UPDATE` contract.**
   The old HTML listened for `SEARCH_INDEX_UPDATE`, but the Wix page controller never sent it.

2. **The HTML no longer owns a duplicate hard-coded route registry.**
   Searchable paths are now built in the page controller from canonical `SITE_MAP` / `APP_ROUTES` values.

3. **Stale/non-canonical paths were removed from the search source.**
   The older HTML contained page paths such as `/home`, `/my-trip`, `/about/contact`,
   `/travel-info/airports`, `/travel-info/airlines`, and `/travel-info/documents`
   without corresponding canonical route ownership in the current `siteMap.js`.

4. **Search scope remains intentionally public-page search.**
   B-011.1 does not invent a new Supabase site-search service, scrape pages, or expose private/internal content.

5. **Global header/footer remain owned by `masterPage.js`.**
   This embed contains no duplicate global chrome.

6. **Presentation Registry hooks are included for future static presentation ownership.**
   The registry itself is not activated by this package.

### Change log

- **2026-09-17:** Owner note: page nearly styled; data functions required review.
- **2026-09-25 — B-011.1:** Rebuilt Search into the current B-011 customer visual system; moved route authority out of HTML; activated controller-delivered search index; removed stale search paths; added category filtering, improved ranking, shareable `?q=` behavior, public/private route filtering, responsive result navigation and stable presentation hooks.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="color-scheme" content="light"/>
<meta name="theme-color" content="#f6faff"/>
<title>Search | SKANDI Travels · B-011.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --sk-navy:#022e64;
  --sk-navy2:#0b3a7a;
  --sk-blue:#285ca8;
  --sk-aqua:#5FC7CF;
  --sk-aqua-soft:#d9f1f1;
  --sk-light:#d7e6ff;
  --sk-pale:#f6faff;
  --sk-section:#f3f6f8;
  --sk-white:#fff;
  --sk-ink:#03111f;
  --sk-graphite:#111827;
  --sk-body:#526274;
  --sk-muted:#667085;
  --sk-line:#dbe3ef;
  --sk-line-soft:#eef2f7;
  --sk-ivory:#fbfaf6;
  --sk-champagne:#d1bc98;
  --sk-danger:#9e3b31;
  --sk-shadow:0 16px 44px rgba(2,46,100,.08);
  --sk-shadow-hover:0 22px 54px rgba(2,46,100,.13);
  --content:1180px;
  --ease:cubic-bezier(.16,1,.3,1);
}

*{box-sizing:border-box}
html{scroll-behavior:smooth;background:#fff}
html,body{
  width:100%;
  min-height:100%;
  margin:0;
  background:#fff;
  color:var(--sk-graphite);
  font-family:"Montserrat",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
body{overflow-x:hidden}
button,input{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.5}
a{color:inherit}
[hidden],.hidden{display:none!important}
.wrap{width:min(var(--content),calc(100% - 48px));margin-inline:auto}
.sr-only{
  position:absolute!important;width:1px!important;height:1px!important;
  padding:0!important;margin:-1px!important;overflow:hidden!important;
  clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;
}
:focus-visible{outline:3px solid rgba(95,199,207,.48);outline-offset:3px}

.eyebrow{
  display:inline-flex;
  align-items:center;
  gap:10px;
  color:var(--sk-blue);
  font-size:9px;
  font-weight:800;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.eyebrow::before{
  content:"";
  width:30px;
  height:1px;
  background:currentColor;
  opacity:.72;
}

/* =========================================================
   SEARCH HERO
   ========================================================= */
.search-hero{
  position:relative;
  overflow:hidden;
  border-bottom:1px solid var(--sk-line);
  background:
    radial-gradient(circle at 78% 9%,rgba(95,199,207,.14),transparent 23%),
    linear-gradient(180deg,#edf5ff 0%,var(--sk-pale) 54%,#fff 100%);
}
.search-hero::after{
  content:"";
  position:absolute;
  right:-180px;
  top:-205px;
  width:520px;
  height:520px;
  border:1px solid rgba(2,46,100,.07);
  border-radius:50%;
  box-shadow:
    0 0 0 55px rgba(2,46,100,.018),
    0 0 0 110px rgba(2,46,100,.012);
  pointer-events:none;
}
.hero-inner{
  position:relative;
  z-index:1;
  padding:72px 0 54px;
}
.hero-copy{
  max-width:760px;
}
.hero-copy h1{
  margin:13px 0 14px;
  color:var(--sk-navy);
  font-size:clamp(42px,6.5vw,76px);
  line-height:.96;
  letter-spacing:-.055em;
  font-weight:700;
}
.hero-copy p{
  max-width:680px;
  margin:0;
  color:var(--sk-body);
  font-size:13px;
  line-height:1.75;
}
.search-shell{
  max-width:920px;
  margin-top:30px;
}
.search-form{
  position:relative;
  display:grid;
  grid-template-columns:54px minmax(0,1fr) auto;
  align-items:center;
  min-height:76px;
  overflow:hidden;
  border:1px solid rgba(2,46,100,.15);
  border-radius:18px;
  background:#fff;
  box-shadow:0 18px 52px rgba(2,46,100,.11);
  transition:border-color .2s ease,box-shadow .2s ease,transform .2s var(--ease);
}
.search-form:focus-within{
  border-color:rgba(95,199,207,.85);
  box-shadow:0 22px 58px rgba(2,46,100,.13),0 0 0 4px rgba(95,199,207,.12);
  transform:translateY(-1px);
}
.search-icon{
  width:54px;
  height:100%;
  display:grid;
  place-items:center;
  color:var(--sk-navy);
}
.search-icon svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8}
.search-form input{
  min-width:0;
  height:74px;
  border:0;
  outline:0;
  background:transparent;
  padding:0 12px 0 0;
  color:var(--sk-ink);
  font-size:16px;
  font-weight:600;
}
.search-form input::placeholder{color:#8796a8;font-weight:500}
.search-submit{
  min-height:48px;
  margin-right:12px;
  padding:0 22px;
  border:0;
  border-radius:999px;
  background:var(--sk-navy);
  color:#fff;
  font-size:9px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  transition:background .18s ease,transform .18s var(--ease),box-shadow .18s ease;
}
.search-submit:hover{
  background:var(--sk-navy2);
  transform:translateY(-1px);
  box-shadow:0 10px 22px rgba(2,46,100,.18);
}
.search-hint{
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:11px;
  color:var(--sk-muted);
  font-size:8.5px;
  line-height:1.5;
}
.key{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:24px;
  height:22px;
  padding:0 6px;
  border:1px solid var(--sk-line);
  border-bottom-width:2px;
  border-radius:6px;
  background:#fff;
  color:var(--sk-navy);
  font-size:7px;
  font-weight:800;
}

/* =========================================================
   PAGE CONTENT
   ========================================================= */
.search-main{
  min-height:520px;
  padding:42px 0 86px;
}
.loading-state{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:14px;
  align-items:center;
  padding:22px;
  border:1px solid var(--sk-line);
  border-radius:16px;
  background:var(--sk-pale);
  color:var(--sk-body);
  font-size:10px;
}
.spinner{
  width:24px;height:24px;
  border:2px solid #dfe7f1;
  border-top-color:var(--sk-navy);
  border-radius:50%;
  animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

/* Initial/browse state */
.start-panel{
  display:grid;
  grid-template-columns:minmax(0,1fr) 340px;
  gap:24px;
  align-items:stretch;
}
.start-intro{
  padding:29px;
  border:1px solid var(--sk-line);
  border-radius:20px;
  background:#fff;
  box-shadow:var(--sk-shadow);
}
.start-intro h2{
  margin:8px 0 9px;
  color:var(--sk-navy);
  font-size:30px;
  line-height:1.05;
  letter-spacing:-.04em;
}
.start-intro p{
  max-width:640px;
  margin:0;
  color:var(--sk-body);
  font-size:11px;
  line-height:1.7;
}
.popular-title{
  margin-top:24px;
  color:var(--sk-muted);
  font-size:8px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
}
.chips{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:10px;
}
.chip{
  min-height:38px;
  padding:0 13px;
  border:1px solid var(--sk-line);
  border-radius:999px;
  background:#fff;
  color:var(--sk-navy);
  font-size:8.5px;
  font-weight:800;
  transition:border-color .18s ease,background .18s ease,transform .18s var(--ease);
}
.chip:hover{
  border-color:var(--sk-aqua);
  background:#f7fcfc;
  transform:translateY(-1px);
}
.start-aside{
  display:grid;
  gap:10px;
}
.browse-card{
  padding:19px 20px;
  border:1px solid var(--sk-line);
  border-radius:16px;
  background:linear-gradient(145deg,#fff,var(--sk-pale));
}
.browse-card strong{
  display:block;
  color:var(--sk-navy);
  font-size:11px;
  margin-bottom:4px;
}
.browse-card span{
  display:block;
  color:var(--sk-muted);
  font-size:8.5px;
  line-height:1.55;
}
.browse-links{
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  margin-top:10px;
}
.browse-link{
  min-height:29px;
  padding:0 9px;
  border:0;
  border-radius:999px;
  background:#edf4fb;
  color:var(--sk-blue);
  font-size:7.5px;
  font-weight:800;
}
.browse-link:hover{background:var(--sk-aqua-soft);color:var(--sk-navy)}
.public-note{
  margin-top:15px;
  color:#8492a4;
  font-size:8px;
  line-height:1.55;
}

/* Results layout */
.results-layout{
  display:grid;
  grid-template-columns:210px minmax(0,1fr);
  gap:30px;
  align-items:start;
}
.filters{
  position:sticky;
  top:18px;
  border:1px solid var(--sk-line);
  border-radius:17px;
  background:#fff;
  overflow:hidden;
}
.filters-head{
  padding:16px 17px 12px;
  border-bottom:1px solid var(--sk-line-soft);
}
.filters-head strong{
  color:var(--sk-navy);
  font-size:10px;
}
.filters-head span{
  display:block;
  margin-top:3px;
  color:var(--sk-muted);
  font-size:7.5px;
  line-height:1.5;
}
.category-list{display:grid;padding:7px}
.category-filter{
  width:100%;
  min-height:38px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:0 10px;
  border:0;
  border-radius:10px;
  background:transparent;
  color:var(--sk-body);
  font-size:8.5px;
  font-weight:700;
  text-align:left;
}
.category-filter:hover{background:var(--sk-pale);color:var(--sk-navy)}
.category-filter.active{background:var(--sk-navy);color:#fff}
.category-count{
  min-width:24px;
  text-align:right;
  opacity:.68;
  font-size:7.5px;
}

.results-column{min-width:0}
.results-meta{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:18px;
  margin-bottom:14px;
}
.results-meta h2{
  margin:0;
  color:var(--sk-navy);
  font-size:24px;
  line-height:1.08;
  letter-spacing:-.035em;
}
.results-meta p{
  margin:5px 0 0;
  color:var(--sk-muted);
  font-size:8.5px;
  line-height:1.5;
}
.results-count{
  flex:0 0 auto;
  color:var(--sk-muted);
  font-size:8.5px;
  font-weight:700;
}
.results{display:grid;gap:10px}
.result{
  width:100%;
  display:grid;
  grid-template-columns:46px minmax(0,1fr) 34px;
  gap:15px;
  align-items:center;
  padding:17px 17px 17px 15px;
  border:1px solid var(--sk-line);
  border-radius:15px;
  background:#fff;
  color:inherit;
  text-align:left;
  box-shadow:0 7px 22px rgba(2,46,100,.035);
  transition:transform .18s var(--ease),box-shadow .18s ease,border-color .18s ease;
}
.result:hover{
  transform:translateY(-2px);
  border-color:rgba(95,199,207,.62);
  box-shadow:var(--sk-shadow-hover);
}
.result.best{
  border-color:rgba(2,46,100,.20);
  background:linear-gradient(90deg,#fff,var(--sk-pale));
}
.result-icon{
  width:42px;height:42px;
  display:grid;
  place-items:center;
  border-radius:12px;
  background:var(--sk-pale);
  color:var(--sk-navy);
  font-size:12px;
  font-weight:800;
}
.result.best .result-icon{background:var(--sk-navy);color:#fff}
.result-copy{min-width:0}
.result-topline{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
  margin-bottom:4px;
}
.result-category{
  color:var(--sk-blue);
  font-size:7px;
  font-weight:800;
  letter-spacing:.10em;
  text-transform:uppercase;
}
.best-label{
  display:inline-flex;
  align-items:center;
  min-height:19px;
  padding:0 7px;
  border-radius:999px;
  background:var(--sk-aqua-soft);
  color:var(--sk-navy);
  font-size:6.5px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.result-title{
  display:block;
  color:var(--sk-navy);
  font-size:16px;
  line-height:1.22;
  letter-spacing:-.025em;
  font-weight:700;
}
.result-description{
  display:block;
  margin-top:5px;
  color:var(--sk-body);
  font-size:9.5px;
  line-height:1.55;
}
.result-path{
  display:block;
  margin-top:6px;
  color:#8b98a8;
  font-size:7.5px;
  font-weight:600;
}
.result-arrow{
  width:32px;height:32px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:var(--sk-pale);
  color:var(--sk-navy);
  font-size:15px;
  transition:background .18s ease,color .18s ease,transform .18s var(--ease);
}
.result:hover .result-arrow{
  background:var(--sk-navy);
  color:#fff;
  transform:translateX(2px);
}
mark{
  padding:0 .08em;
  border-radius:3px;
  background:#dff5f6;
  color:inherit;
}

/* Empty state */
.empty{
  padding:30px;
  border:1px solid var(--sk-line);
  border-radius:18px;
  background:
    radial-gradient(circle at 85% 12%,rgba(95,199,207,.12),transparent 26%),
    linear-gradient(145deg,#fff,var(--sk-pale));
}
.empty h2{
  margin:8px 0 8px;
  color:var(--sk-navy);
  font-size:27px;
  letter-spacing:-.04em;
}
.empty p{
  max-width:650px;
  margin:0;
  color:var(--sk-body);
  font-size:10px;
  line-height:1.7;
}
.empty .chips{margin-top:16px}

@media(max-width:840px){
  .wrap{width:min(var(--content),calc(100% - 32px))}
  .hero-inner{padding-top:54px}
  .start-panel{grid-template-columns:1fr}
  .start-aside{grid-template-columns:repeat(3,1fr)}
  .results-layout{grid-template-columns:1fr;gap:18px}
  .filters{position:static;overflow:visible}
  .filters-head{display:none}
  .category-list{
    display:flex;
    gap:6px;
    overflow:auto;
    padding:8px;
    scrollbar-width:none;
  }
  .category-list::-webkit-scrollbar{display:none}
  .category-filter{
    width:auto;
    flex:0 0 auto;
    padding:0 12px;
  }
  .category-count{margin-left:4px}
}
@media(max-width:620px){
  .wrap{width:min(var(--content),calc(100% - 24px))}
  .hero-inner{padding:42px 0 38px}
  .hero-copy h1{font-size:44px}
  .hero-copy p{font-size:11px}
  .search-form{
    grid-template-columns:44px minmax(0,1fr);
    min-height:66px;
    border-radius:15px;
  }
  .search-icon{width:44px}
  .search-form input{height:64px;font-size:13px;padding-right:12px}
  .search-submit{
    grid-column:1/-1;
    width:calc(100% - 16px);
    margin:0 8px 8px;
    min-height:44px;
  }
  .search-hint{display:none}
  .search-main{padding-top:28px}
  .start-intro{padding:22px}
  .start-intro h2{font-size:25px}
  .start-aside{grid-template-columns:1fr}
  .results-meta{align-items:flex-start;flex-direction:column;gap:5px}
  .result{
    grid-template-columns:38px minmax(0,1fr) 30px;
    gap:11px;
    padding:14px 12px;
  }
  .result-icon{width:36px;height:36px;border-radius:10px}
  .result-title{font-size:14px}
  .result-description{font-size:8.5px}
  .result-arrow{width:29px;height:29px}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition-duration:.01ms!important}
}
</style>
</head>
<body>

<header class="search-hero" data-section-id="search-hero">
  <div class="wrap hero-inner">
    <div class="hero-copy">
      <div class="eyebrow" data-content-id="search-hero-eyebrow">SKANDI TRAVELS</div>
      <h1 data-content-id="search-hero-h1">Find your way through SKANDI.</h1>
      <p data-content-id="search-hero-copy">
        Search the public SKANDI website for booking pages, travel information,
        destinations, help, company information and customer services.
      </p>
    </div>

    <div class="search-shell">
      <form class="search-form" id="searchForm" role="search">
        <div class="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6.5"></circle>
            <path d="m16 16 4 4"></path>
          </svg>
        </div>
        <label class="sr-only" for="searchInput">Search SKANDI website</label>
        <input
          id="searchInput"
          type="search"
          autocomplete="off"
          maxlength="100"
          placeholder="Flights, baggage, car rental, support…"
          aria-describedby="searchHint"
        />
        <button class="search-submit" type="submit">Search</button>
      </form>
      <div class="search-hint" id="searchHint">
        <span class="key">↵</span>
        <span>Press Enter to search the public SKANDI website.</span>
      </div>
    </div>
  </div>
</header>

<main class="search-main" data-section-id="search-content">
  <div class="wrap">
    <div id="output">
      <div class="loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <span>Preparing the SKANDI public search index…</span>
      </div>
    </div>
  </div>
</main>

<script>
"use strict";
(() => {
  const VERSION = "B-011.1";
  const SOURCE = "SKANDI_SEARCH_RESULTS";
  const PARENT = "SKANDI_WIX_PARENT";
  const PARENT_ORIGIN = (() => {
    try { return document.referrer ? new URL(document.referrer).origin : "*"; }
    catch (_) { return "*"; }
  })();

  const POPULAR = [
    "Flights",
    "Hotels",
    "Car Rental",
    "Flight Status",
    "Baggage",
    "Passport",
    "Support",
    "SKANDI Club"
  ];

  const START_GROUPS = [
    {
      title: "Book & travel",
      copy: "Find the main places to search, book and manage travel.",
      queries: ["Flights", "Hotels", "Packages", "Car Rental"]
    },
    {
      title: "Plan & prepare",
      copy: "Browse destinations and practical information before departure.",
      queries: ["Destinations", "Travel Information", "Flight Status", "Passport"]
    },
    {
      title: "Help & SKANDI",
      copy: "Find support, policies, membership and company information.",
      queries: ["Support", "Legal", "SKANDI Club", "About SKANDI"]
    }
  ];

  const GLYPHS = Object.freeze({
    "Book": "↗",
    "Discover": "◎",
    "Travel Info": "i",
    "Support": "?",
    "SKANDI": "S",
    "Club": "◆",
    "Store": "□",
    "Legal": "§",
    "Page": "•"
  });

  let currentQuery = "";
  let activeCategory = "All";
  let searchIndex = [];
  let indexReady = false;

  const $ = id => document.getElementById(id);

  const esc = value => String(value ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );

  const normalize = value => String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function post(type, payload = {}) {
    window.parent.postMessage({
      source: SOURCE,
      type,
      payload,
      timestamp: new Date().toISOString()
    }, PARENT_ORIGIN);
  }

  function pathname(path) {
    const raw = String(path || "").trim();
    if (!raw) return "";
    try {
      if (/^https?:\/\//i.test(raw)) return new URL(raw).pathname.toLowerCase();
    } catch (_) {}
    return (raw.split("?")[0].split("#")[0] || "/").toLowerCase();
  }

  function allowed(item) {
    const path = pathname(item?.path);
    if (!path || !path.startsWith("/")) return false;
    if (path === "/riaintra" || path.startsWith("/riaintra/")) return false;
    if (path === "/my-profile" || path.startsWith("/my-profile/")) return false;
    return true;
  }

  function sanitizeIndex(items) {
    const byPath = new Map();

    (Array.isArray(items) ? items : []).forEach(raw => {
      if (!raw || typeof raw !== "object" || !allowed(raw)) return;

      const path = String(raw.path || "").trim().slice(0, 500);
      const key = path.toLowerCase();
      if (!key || byPath.has(key)) return;

      const title = String(raw.title || "").trim().slice(0, 160);
      if (!title) return;

      byPath.set(key, {
        title,
        path,
        category: String(raw.category || "Page").trim().slice(0, 80) || "Page",
        description: String(raw.description || "").trim().slice(0, 600),
        keywords: String(raw.keywords || "").trim().slice(0, 1600),
        priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0
      });
    });

    return [...byPath.values()];
  }

  function scoreItem(item, query) {
    const q = normalize(query);
    if (!q) return 0;

    const tokens = q.split(/\s+/).filter(Boolean);
    const title = normalize(item.title);
    const path = normalize(item.path);
    const description = normalize(item.description);
    const keywords = normalize(item.keywords);
    const category = normalize(item.category);
    const all = `${title} ${path} ${description} ${keywords} ${category}`;

    let score = 0;

    if (title === q) score += 180;
    if (title.startsWith(q)) score += 105;
    if (title.includes(q)) score += 78;
    if (keywords.includes(q)) score += 62;
    if (path.includes(q)) score += 48;
    if (description.includes(q)) score += 28;
    if (category.includes(q)) score += 18;

    let matched = 0;

    for (const token of tokens) {
      if (title.includes(token)) {
        score += 34;
        matched++;
      } else if (keywords.includes(token)) {
        score += 24;
        matched++;
      } else if (path.includes(token)) {
        score += 17;
        matched++;
      } else if (description.includes(token)) {
        score += 12;
        matched++;
      } else if (category.includes(token)) {
        score += 8;
        matched++;
      }
    }

    if (tokens.length > 1 && matched === tokens.length) score += 42;
    if (!all.includes(q) && matched === 0) return 0;

    score += Math.max(-20, Math.min(20, Number(item.priority || 0)));
    return score;
  }

  function allResults(query) {
    return searchIndex
      .map(item => ({ ...item, _score: scoreItem(item, query) }))
      .filter(item => item._score > 0)
      .sort((a, b) =>
        b._score - a._score ||
        String(a.title).localeCompare(String(b.title))
      )
      .slice(0, 40);
  }

  function highlight(text, query) {
    const safe = esc(text);
    const terms = normalize(query)
      .split(/\s+/)
      .filter(term => term.length > 1)
      .sort((a, b) => b.length - a.length);

    if (!terms.length) return safe;

    let out = safe;

    terms.forEach(term => {
      const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`(${pattern})`, "ig"), "<mark>$1</mark>");
    });

    return out;
  }

  function categoryCounts(results) {
    const counts = { All: results.length };
    results.forEach(item => {
      const category = item.category || "Page";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }

  function visibleResults(results) {
    return activeCategory === "All"
      ? results
      : results.filter(item => item.category === activeCategory);
  }

  function displayPath(path) {
    const value = String(path || "");
    if (value === "/") return "skanditravels.com";
    return `skanditravels.com${value}`;
  }

  function resultCard(item, query, index) {
    const category = item.category || "Page";
    const glyph = GLYPHS[category] || GLYPHS.Page;

    return `
      <button
        class="result ${index === 0 && activeCategory === "All" ? "best" : ""}"
        type="button"
        data-path="${esc(item.path)}"
        aria-label="Open ${esc(item.title)}"
      >
        <span class="result-icon" aria-hidden="true">${esc(glyph)}</span>

        <span class="result-copy">
          <span class="result-topline">
            <span class="result-category">${esc(category)}</span>
            ${index === 0 && activeCategory === "All"
              ? `<span class="best-label">Best match</span>`
              : ""}
          </span>
          <span class="result-title">${highlight(item.title, query)}</span>
          ${item.description
            ? `<span class="result-description">${highlight(item.description, query)}</span>`
            : ""}
          <span class="result-path">${esc(displayPath(item.path))}</span>
        </span>

        <span class="result-arrow" aria-hidden="true">→</span>
      </button>`;
  }

  function renderStart() {
    const output = $("output");

    output.innerHTML = `
      <section class="start-panel" data-section-id="search-start">
        <div class="start-intro">
          <div class="eyebrow">START SEARCHING</div>
          <h2>What can we help you find?</h2>
          <p>
            Search the current public SKANDI page index. Private profile areas and
            internal staff systems are intentionally excluded.
          </p>

          <div class="popular-title">Popular searches</div>
          <div class="chips">
            ${POPULAR.map(query => `
              <button class="chip" type="button" data-query="${esc(query)}">
                ${esc(query)}
              </button>
            `).join("")}
          </div>

          <div class="public-note">
            The index is supplied by the Wix page controller from the canonical SKANDI route registry.
          </div>
        </div>

        <aside class="start-aside" aria-label="Browse search topics">
          ${START_GROUPS.map(group => `
            <section class="browse-card">
              <strong>${esc(group.title)}</strong>
              <span>${esc(group.copy)}</span>
              <div class="browse-links">
                ${group.queries.map(query => `
                  <button class="browse-link" type="button" data-query="${esc(query)}">
                    ${esc(query)}
                  </button>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </aside>
      </section>`;

    resize();
  }

  function renderEmpty(query) {
    $("output").innerHTML = `
      <section class="empty">
        <div class="eyebrow">NO MATCH FOUND</div>
        <h2>No results for “${esc(query)}”</h2>
        <p>
          Try a shorter phrase or search for a travel product, destination,
          travel-information topic, support area or SKANDI service.
        </p>
        <div class="chips">
          ${POPULAR.map(item => `
            <button class="chip" type="button" data-query="${esc(item)}">
              ${esc(item)}
            </button>
          `).join("")}
        </div>
      </section>`;

    resize();
  }

  function renderResults(query) {
    const results = allResults(query);

    if (!results.length) {
      renderEmpty(query);
      return;
    }

    const counts = categoryCounts(results);

    if (activeCategory !== "All" && !counts[activeCategory]) {
      activeCategory = "All";
    }

    const categories = Object.keys(counts)
      .sort((a, b) => {
        if (a === "All") return -1;
        if (b === "All") return 1;
        return a.localeCompare(b);
      });

    const visible = visibleResults(results);

    $("output").innerHTML = `
      <section class="results-layout" data-section-id="search-results">
        <aside class="filters" aria-label="Filter search results">
          <div class="filters-head">
            <strong>Filter results</strong>
            <span>Show matching pages by section.</span>
          </div>
          <div class="category-list">
            ${categories.map(category => `
              <button
                class="category-filter ${category === activeCategory ? "active" : ""}"
                type="button"
                data-category="${esc(category)}"
                aria-pressed="${category === activeCategory ? "true" : "false"}"
              >
                <span>${esc(category)}</span>
                <span class="category-count">${counts[category]}</span>
              </button>
            `).join("")}
          </div>
        </aside>

        <div class="results-column">
          <div class="results-meta">
            <div>
              <h2>Results for “${esc(query)}”</h2>
              <p>${activeCategory === "All"
                ? "Showing all matching public SKANDI pages."
                : `Filtered to ${esc(activeCategory)}.`}
              </p>
            </div>
            <span class="results-count">
              ${visible.length} result${visible.length === 1 ? "" : "s"}
            </span>
          </div>

          <div class="results">
            ${visible.map((item, index) => resultCard(item, query, index)).join("")}
          </div>
        </div>
      </section>`;

    resize();
  }

  function render(query) {
    currentQuery = String(query || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 100);

    $("searchInput").value = currentQuery;

    if (!indexReady) {
      $("output").innerHTML = `
        <div class="loading-state">
          <span class="spinner" aria-hidden="true"></span>
          <span>Preparing the SKANDI public search index…</span>
        </div>`;
      resize();
      return;
    }

    if (!currentQuery) {
      activeCategory = "All";
      renderStart();
      return;
    }

    renderResults(currentQuery);
  }

  function resize() {
    requestAnimationFrame(() => {
      const height = Math.max(
        620,
        Math.ceil(document.documentElement.scrollHeight + 12)
      );
      post("SEARCH_RESIZE", { height });
    });
  }

  $("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    const query = String($("searchInput").value || "").trim();
    activeCategory = "All";
    render(query);
    post("SEARCH_QUERY_UPDATE", { query });
  });

  document.addEventListener("click", event => {
    const result = event.target.closest("[data-path]");

    if (result) {
      const path = result.getAttribute("data-path") || "";
      if (allowed({ path })) {
        post("SEARCH_RESULT_NAVIGATE", { path });
      }
      return;
    }

    const queryButton = event.target.closest("[data-query]");

    if (queryButton) {
      const query = queryButton.getAttribute("data-query") || "";
      activeCategory = "All";
      render(query);
      post("SEARCH_QUERY_UPDATE", { query });
      return;
    }

    const categoryButton = event.target.closest("[data-category]");

    if (categoryButton) {
      activeCategory = categoryButton.getAttribute("data-category") || "All";
      renderResults(currentQuery);
    }
  });

  window.addEventListener("message", event => {
    if (event.source !== window.parent) return;

    let message = event.data;

    if (typeof message === "string") {
      try { message = JSON.parse(message); }
      catch (_) { return; }
    }

    if (!message || typeof message !== "object" || message.source !== PARENT) {
      return;
    }

    if (message.type === "SEARCH_PAGE_QUERY") {
      render(message.payload?.query || "");
      return;
    }

    if (message.type === "SEARCH_INDEX_UPDATE") {
      searchIndex = sanitizeIndex(message.payload?.items);
      indexReady = true;
      render(currentQuery || message.payload?.query || "");
      return;
    }
  });

  post("SEARCH_READY", { version: VERSION });
  resize();
})();
</script>
</body>
</html>
```
