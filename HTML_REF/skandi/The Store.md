# INFO / LOG — THE STORE

- **Source file identity:** `/HTML_REF/skandi/The Store.md`
- **Display/page name:** The Store
- **System area:** `SKANDI`
- **Wix page filename:** `/src/pages/The Store.js`
- **Wix route/slug:** `/the-store`
- **Wix HTML element ID:** `#storefrontEmbed`
- **Current status:** `B-011.15 — STATICALLY VERIFIED / LIVE WIX TEST REQUIRED`
- **Source-of-truth status:** Intended canonical Store HTML source for this release. A prior canonical Store HTML_REF record was not present in the inspected B011 workspace, so this package creates the required record from the exact B-011.13 Store source plus the approved B-011.14 hero correction and this B-011.15 master-brand asset integration.
- **Linked page controller:** `/src/pages/The Store.js`
- **Canonical backend facade(s):** `/src/backend/SKANDI_CORE/storefront.web.js`; `/src/backend/SKANDI_CORE/customerSupport.web.js`
- **Canonical backend core implementation(s):** `/src/backend/SKANDI_CORE/storefront.js`; `/src/backend/SKANDI_CORE/customerSupport.js`
- **Operational data authority:** Wix Stores / Wix eCommerce for Store catalog/cart/checkout/order behavior.
- **Global presentation authority:** `/src/pages/masterPage.js` for shared routes, Store logo asset URLs and localized SKANDI slogan.
- **External/API dependencies:** Wix Stores / Wix eCommerce; Wix Members/global master configuration.
- **Authentication/authorization boundary:** Existing page/backend Store and customer-session boundaries; no frontend database authority added.
- **Important message contracts:** `STOREFRONT_READY`, `STOREFRONT_PARENT_READY`, `STOREFRONT_PRODUCTS`, `STOREFRONT_CART`, `STOREFRONT_CART_REQUEST`, `STOREFRONT_ADD_TO_CART`, `STOREFRONT_CHECKOUT`, `STOREFRONT_ORDERS`, `STOREFRONT_NAVIGATE`, `PUBLIC_SUPPORT_CREATE_CASE`, `PUBLIC_SUPPORT_CASE_CREATED`, `PUBLIC_SUPPORT_ERROR`, `MASTER_CONFIG_REQUEST`, `SKANDI_MASTER_CONFIG`.
- **Current architectural notes:** `storeHeader` and `storeFooter` are now read from `MASTER_CONFIG.brand.assets.logos`. The bottom-left Store slogan is read from `MASTER_CONFIG.brand.slogans` using the active customer language, with English fallback. Current Store logo URLs remain in HTML only as resilience fallbacks until master config arrives; masterPage is the runtime authority.
- **Open issues / required migrations:** Live Wix runtime must be tested after installing both the Store embed and updated masterPage together.
- **Last verified:** 2026-09-21

## CHANGE LOG

- **2026-09-21 — B-011.15:** Added `storeHeader` and `storeFooter` masterPage logo assets; Store desktop/mobile header and footer now consume those assets through `SKANDI_MASTER_CONFIG`; bottom-left Store slogan now consumes the localized masterPage slogan; settings changes broadcast refreshed master config to page embeds. Preserved Store commerce/support contracts.
- **2026-09-21 — B-011.14:** Approved Store hero composition correction preserved: contained editorial hero panel, bounded responsive typography and spacing, and stable presentation hooks.
- **2026-09-16 — B-011.13:** Store source connected to canonical Store bridge in the B011 convergence workspace.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#071b44"/>
<title>SKANDI The Store · B-011.15</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --navy:#071b44;
  --navy-2:#022e64;
  --blue:#1f6ba3;
  --teal:#4eb9c1;
  --gold:#d8aa3d;
  --sk-cyan:#5FC7CF;
  --ink:#111827;
  --muted:#5a6c82;
  --line:#e6e9ee;
  --soft:#f4f5f7;
  --white:#fff;
  --success:#087443;
  --danger:#b42318;
  --max:1320px;
  --shadow:0 8px 24px rgba(0,0,0,.08);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
html,body{margin:0;min-height:100%;font-family:Montserrat,Arial,sans-serif;background:#fff;color:var(--ink)}
body.locked{overflow:hidden}
button,input,select{font:inherit}
button{cursor:pointer}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.hidden{display:none!important}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* Header */
.utility-bar{background:var(--navy);color:#fff}
.utility-inner{max-width:var(--max);height:38px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:600;letter-spacing:.035em}
.utility-links,.utility-account{display:flex;align-items:center;gap:24px}
.utility-inner button{border:0;background:none;color:inherit;padding:0;font-size:10px;font-weight:600}
.utility-dot{width:4px;height:4px;border-radius:50%;background:var(--teal)}
.site-header{position:sticky;top:0;z-index:80;background:#fff;border-bottom:1px solid var(--line)}
.header-main{max-width:var(--max);height:80px;margin:auto;padding:0 24px;display:grid;grid-template-columns:245px 1fr auto;gap:28px;align-items:center}
.brand-lockup{display:flex;align-items:center;gap:15px;min-width:0}
.brand-mark{width:auto;height:60px;display:flex;align-items:center;flex:0 0 auto}
.brand-mark img{display:block;width:auto;height:70px;max-width:100%;max-height:100%;object-fit:contain;object-position:left center}
.brand-divider{width:1px;height:30px;background:#cfd5dc}
.brand-shop{font-size:12px;font-weight:700;line-height:1.25;color:var(--navy);text-transform:uppercase;letter-spacing:.075em}
.primary-nav{height:100%;display:flex;justify-content:center;align-items:center;gap:24px}
.primary-nav button{height:100%;border:0;border-bottom:3px solid transparent;background:transparent;padding:3px 0 0;color:var(--navy);font-size:12px;font-weight:600;white-space:nowrap}
.primary-nav button:hover,.primary-nav button.active{border-bottom-color:var(--teal)}
.header-actions{display:flex;align-items:center;gap:6px}
.action-button{min-width:45px;height:48px;border:0;background:#fff;color:var(--navy);display:grid;place-items:center;gap:1px;padding:3px 7px;font-size:9px;font-weight:600}
.action-button svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.7}
.action-button .badge{position:absolute;top:-4px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:20px;background:var(--teal);color:var(--navy);display:grid;place-items:center;font-size:9px;font-weight:800;border:2px solid #fff}
.action-icon{position:relative;display:block}
.mobile-menu-button{display:none}
.search-dock{border-top:1px solid #eef0f3;background:#fff}
.search-inner{max-width:var(--max);margin:auto;padding:12px 24px;display:grid;grid-template-columns:minmax(260px,540px) 1fr;gap:22px;align-items:center}
.search-box{height:44px;border:1px solid #cfd5dc;display:flex;align-items:center;background:#fff}
.search-box svg{width:18px;height:18px;margin:0 12px;color:var(--navy);stroke:currentColor;fill:none;stroke-width:1.7}
.search-box input{width:100%;height:100%;border:0;outline:0;padding:0 13px 0 0;color:var(--ink);font-size:12px}
.search-box input::placeholder{color:#8a94a3}
.quick-links{display:flex;justify-content:flex-end;gap:25px;overflow:auto;white-space:nowrap;color:#475467;font-size:10px;font-weight:600}
.quick-links button{border:0;background:transparent;color:inherit;padding:0}
.quick-links button:hover{color:var(--navy-2);text-decoration:underline}

/* Category menu */
.category-menu{position:fixed;inset:149px 0 auto;z-index:75;background:#fff;border-bottom:1px solid var(--line);box-shadow:0 22px 42px rgba(7,27,68,.14);display:none}
.category-menu.show{display:block}
.category-menu-inner{max-width:var(--max);margin:auto;padding:30px 24px 34px;display:grid;grid-template-columns:230px 1fr;gap:44px}
.category-menu-intro h3{margin:0 0 10px;color:var(--navy);font-size:25px;letter-spacing:-.04em}
.category-menu-intro p{margin:0;color:var(--muted);font-size:11px;line-height:1.65}
.category-menu-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 26px}
.category-menu-list button{border:0;border-bottom:1px solid #edf0f3;background:#fff;text-align:left;padding:11px 0;color:var(--navy);font-size:11px;font-weight:600}
.category-menu-list button:hover{color:var(--blue)}

/* Main */
main{min-height:70vh}
.hero-wrap{max-width:var(--max);margin:24px auto 0;padding:0 24px}
.hero{
  min-height:480px;
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(circle at 82% 14%,rgba(95,199,207,.22),transparent 28%),
    linear-gradient(115deg,#d7e7f3,#f7fafc 64%,#eef7f7);
  background-size:cover;
  background-position:center;
}
.hero::after{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(90deg,rgba(7,27,68,.12),rgba(7,27,68,0) 55%),
    linear-gradient(180deg,rgba(255,255,255,.04),rgba(7,27,68,.03));
  pointer-events:none;
}
.hero-panel{
  position:absolute;
  z-index:2;
  left:52px;
  bottom:42px;
  width:min(450px,calc(100% - 104px));
  max-height:calc(100% - 84px);
  overflow:hidden;
  background:linear-gradient(145deg,rgba(7,27,68,.98),rgba(2,46,100,.96));
  color:#fff;
  padding:31px 35px 33px;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 22px 48px rgba(7,27,68,.22);
}
.hero-panel::after{
  content:"";
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:3px;
  background:linear-gradient(180deg,var(--teal),var(--gold));
}
.hero-kicker{
  display:flex;
  align-items:center;
  gap:9px;
  margin-bottom:12px;
  color:#c7f4f5;
  font-size:9px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.13em;
}
.hero-kicker::before{content:"";width:24px;height:2px;background:var(--teal)}
.hero h1{
  margin:0;
  max-width:100%;
  font-size:clamp(36px,3.3vw,46px);
  line-height:.98;
  letter-spacing:-.052em;
  font-weight:700;
  text-wrap:balance;
}
.hero p{
  margin:13px 0 20px;
  max-width:370px;
  color:#e8edf6;
  font-size:11px;
  line-height:1.62;
}
.cta{min-height:44px;border:1px solid transparent;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;gap:9px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.045em}
.cta.teal{background:var(--teal);color:var(--navy)}
.cta.navy{background:var(--navy);color:#fff}
.cta.white{background:#fff;color:var(--navy);border-color:#d5dae0}
.cta.ghost{background:transparent;color:var(--navy);border-color:var(--navy)}
.cta:disabled{opacity:.45;cursor:not-allowed}

.customer-assurance{max-width:var(--max);margin:0 auto;padding:0 24px;display:grid;grid-template-columns:repeat(3,1fr);border-left:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}
.customer-assurance article{min-height:86px;padding:20px 24px;display:grid;grid-template-columns:34px 1fr;gap:13px;align-items:center;border-right:1px solid var(--line)}
.customer-assurance article:last-child{border-right:0}
.customer-assurance-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e9f7f7;color:var(--navy);font-size:15px;font-weight:800}
.customer-assurance strong{display:block;color:var(--navy);font-size:10px;text-transform:uppercase;letter-spacing:.055em}
.customer-assurance span{display:block;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.5}

.content-shell{max-width:var(--max);margin:auto;padding:0 24px 84px}
.section{padding-top:55px}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}
.section-head h2{margin:0;color:var(--navy);font-size:27px;line-height:1.1;letter-spacing:-.045em}
.section-head p{margin:8px 0 0;color:var(--muted);font-size:11px;line-height:1.6}
.text-link{border:0;border-bottom:1px solid var(--navy);background:none;color:var(--navy);padding:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.055em;white-space:nowrap}

/* Popular categories */
.category-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:23px}
.category-orb{border:0;background:transparent;padding:0;text-align:center;color:var(--navy);min-width:0}
.category-orb-media{display:block;aspect-ratio:1;border-radius:50%;overflow:hidden;background:linear-gradient(145deg,#e8edf2,#f8fafb);background-position:center;background-size:cover;position:relative;transition:.25s ease}
.category-orb-media::after{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid rgba(7,27,68,.07)}
.category-orb:hover .category-orb-media{transform:translateY(-4px);box-shadow:0 14px 28px rgba(7,27,68,.13)}
.category-orb-label{display:block;margin-top:13px;font-size:10px;font-weight:600;line-height:1.35}
.category-initials{position:absolute;inset:0;display:grid;place-items:center;color:var(--navy-2);font-size:23px;font-weight:700;letter-spacing:-.05em}

/* Campaign tiles */
.campaign-grid{display:grid;grid-template-columns:1.42fr 1fr 1fr;grid-auto-rows:310px;gap:16px}
.campaign-card{position:relative;overflow:hidden;background:#dce6ef;background-size:cover;background-position:center}
.campaign-card::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,27,68,.04) 25%,rgba(7,27,68,.75) 100%)}
.campaign-card:first-child{grid-row:span 1}
.campaign-copy{position:absolute;z-index:2;left:25px;right:25px;bottom:24px;color:#fff}
.campaign-copy small{display:block;margin-bottom:8px;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#d8fbfc}
.campaign-copy h3{margin:0 0 8px;font-size:24px;line-height:1.05;letter-spacing:-.045em}
.campaign-copy p{margin:0 0 15px;max-width:430px;font-size:10px;line-height:1.55;color:#eef3f8}
.campaign-card.no-image::before{background:linear-gradient(135deg,rgba(31,107,163,.25),rgba(7,27,68,.88))}

/* Product controls */
.product-section{scroll-margin-top:160px}
.product-toolbar{border-top:1px solid var(--line);border-bottom:1px solid var(--line);min-height:58px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.toolbar-left,.toolbar-right{display:flex;align-items:center;gap:22px}
.toolbar-count{font-size:10px;color:var(--muted);font-weight:600}
.filter-button{border:0;background:transparent;color:var(--navy);padding:20px 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.045em}
.filter-button.active{color:var(--blue)}
.filter-button::after{content:" +";color:#8b94a1}
.filter-button.active::after{content:" −"}
.sort-select{height:40px;border:0;background:#fff;color:var(--navy);outline:0;font-size:10px;font-weight:700;text-transform:uppercase}
.clear-button{border:0;background:none;color:#7a8492;padding:0;font-size:10px;text-decoration:underline}
.status{display:none;margin:0 0 18px;padding:13px 15px;border:1px solid #d7dce2;background:#f8fafc;color:var(--muted);font-size:11px;line-height:1.5;white-space:pre-line}
.status.show{display:block}
.status.ok{background:#ecfdf3;border-color:#abefc6;color:var(--success)}
.status.warn{background:#fff7ed;border-color:#fed7aa;color:#a15c00}
.status.error{background:#fff1f0;border-color:#ffd5d2;color:var(--danger)}

/* Products */
.product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:38px 18px}
.product-card{min-width:0;position:relative}
.product-media{position:relative;aspect-ratio:1/1.15;overflow:hidden;background:#f2f3f5}
.product-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.product-media::after{content:"";position:absolute;inset:0;border:1px solid rgba(7,27,68,.04);pointer-events:none}
.product-placeholder{position:absolute;inset:0;display:grid;place-items:center;color:#a3abb7;font-size:13px;font-weight:700;letter-spacing:.1em}
.product-ribbon{position:absolute;z-index:2;left:10px;top:10px;background:#fff;color:var(--navy);padding:6px 8px;font-size:8px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;box-shadow:0 3px 12px rgba(7,27,68,.08)}
.save-button{position:absolute;z-index:3;right:10px;top:10px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.94);color:var(--navy);font-size:18px;display:grid;place-items:center;box-shadow:0 3px 12px rgba(7,27,68,.08)}
.product-overlay{position:absolute;z-index:4;left:0;right:0;bottom:0;display:grid;grid-template-columns:1fr 1fr;transform:translateY(105%);transition:.2s ease;background:#fff;border-top:1px solid #e3e6ea}
.product-card:hover .product-overlay{transform:translateY(0)}
.product-overlay button{height:44px;border:0;background:#fff;color:var(--navy);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.product-overlay button+button{background:var(--navy);color:#fff}
.product-overlay button:disabled{opacity:.45}
.product-content{padding:13px 2px 0}
.product-brand{min-height:14px;color:#7a8492;font-size:8px;font-weight:700;letter-spacing:.105em;text-transform:uppercase}
.product-name{display:block;margin-top:3px;color:var(--navy);font-size:11px;font-weight:600;line-height:1.42}
.product-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:30px;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.55}
.customer-access{margin-top:8px;color:var(--blue);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.045em}
.price-row{display:flex;align-items:center;gap:8px;margin-top:5px;color:var(--navy);font-size:11px;font-weight:700}
.old-price{color:#9aa2ad;text-decoration:line-through;font-weight:500}
.stock-note{margin-top:5px;color:var(--danger);font-size:8px;font-weight:600}
.empty-state{grid-column:1/-1;padding:55px 20px;border:1px solid var(--line);text-align:center;color:var(--muted);font-size:11px}
.load-more-wrap{display:flex;justify-content:center;margin-top:42px}

/* Travel/editorial cards */
.editorial-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.editorial-card{min-height:270px;background:#eef2f5 center/cover;position:relative;overflow:hidden}
.editorial-card::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,27,68,.02),rgba(7,27,68,.78))}
.editorial-content{position:absolute;z-index:2;left:24px;right:24px;bottom:22px;color:#fff}
.editorial-content small{font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#d1f8fa}
.editorial-content h3{margin:8px 0 8px;font-size:21px;line-height:1.08;letter-spacing:-.035em}
.editorial-content p{margin:0 0 14px;color:#ecf1f7;font-size:9px;line-height:1.6}

/* Footer */
.footer{margin-top:70px;background:var(--navy);color:#fff}
.footer-main{max-width:var(--max);margin:auto;padding:52px 24px 45px;display:grid;grid-template-columns:1.25fr repeat(3,1fr);gap:54px}
.footer-brand{display:flex;flex-direction:column;align-items:flex-start}
.footer-brand img{display:block;width:auto;height:34px;max-width:190px;object-fit:contain;object-position:left center}
.footer-brand span{display:block;margin-top:9px;font-size:9px;font-weight:600;letter-spacing:.12em;color:#c7d1df;text-transform:uppercase}
.footer p{max-width:320px;color:#c9d2df;font-size:9px;line-height:1.7}
.footer h4{margin:0 0 15px;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
.footer button{display:block;border:0;background:none;color:#cbd4df;padding:5px 0;font-size:9px;text-align:left}
.footer-bottom{border-top:1px solid rgba(255,255,255,.15)}
.footer-bottom-inner{max-width:var(--max);min-height:55px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;color:#aeb9c8;font-size:8px}
.default-bar {color:rgba(255,255,255,.88);font-size:9px;font-weight:700;letter-spacing:.09em;font-style: italic;text-transform:uppercase}
.default-bar span{font-weight:900;font-style:normal;color:var(--sk-cyan)
}

/* Drawer and modal */
.drawer{position:fixed;inset:0;z-index:200;display:none}
.drawer.show{display:block}
.drawer-backdrop,.modal-backdrop{position:absolute;inset:0;background:rgba(7,27,68,.46)}
.drawer-panel{position:absolute;top:0;right:0;width:min(445px,100%);height:100%;background:#fff;box-shadow:-25px 0 65px rgba(7,27,68,.24);display:flex;flex-direction:column}
.drawer-header{height:69px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 22px;color:var(--navy)}
.drawer-header strong{font-size:15px}
.close-button{width:36px;height:36px;border:0;background:#fff;color:var(--navy);font-size:26px;font-weight:300}
.drawer-body{flex:1;overflow:auto;padding:8px 22px 22px}
.drawer-footer{border-top:1px solid var(--line);padding:18px 22px 22px;display:grid;gap:11px}
.cart-item{display:grid;grid-template-columns:76px 1fr auto;gap:12px;padding:15px 0;border-bottom:1px solid #edf0f3}
.cart-thumb{width:76px;height:91px;background:#f1f3f5 center/cover}
.cart-copy strong{display:block;color:var(--navy);font-size:10px;line-height:1.4}
.cart-copy span{display:block;margin-top:3px;color:var(--muted);font-size:8px;line-height:1.45}
.cart-price{color:var(--navy);font-size:9px;font-weight:700;text-align:right}
.cart-total{display:flex;justify-content:space-between;color:var(--navy);font-size:12px;font-weight:700}
.drawer-footer .cta{width:100%}
.saved-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding-top:14px}
.saved-item{font-size:9px;color:var(--navy)}
.saved-thumb{aspect-ratio:1;background:#f1f3f5 center/cover;margin-bottom:7px}

.modal{position:fixed;inset:0;z-index:190;display:none}
.modal.show{display:block}
.modal-panel{position:absolute;inset:40px;max-width:1060px;margin:auto;background:#fff;display:grid;grid-template-columns:1.08fr .92fr;box-shadow:0 28px 85px rgba(7,27,68,.3);overflow:auto}
.modal-image{min-height:620px;background:#f2f3f5 center/cover no-repeat;position:relative;display:grid;place-items:center;color:#a3abb7;font-size:15px;font-weight:700;letter-spacing:.1em}
.modal-info{padding:39px 39px 34px;position:relative}
.modal-info>.close-button{position:absolute;right:15px;top:12px}
.modal-kicker{color:var(--blue);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.12em}
.modal-info h2{margin:12px 35px 8px 0;color:var(--navy);font-size:31px;line-height:1.08;letter-spacing:-.045em}
.modal-price{margin:12px 0 16px;color:var(--navy);font-size:15px;font-weight:700}
.modal-description{color:var(--muted);font-size:10px;line-height:1.7;margin:0 0 22px}
.option-row{display:grid;gap:7px;margin-bottom:13px}
.option-row label{color:var(--navy);font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.option-row select,.option-row input{height:43px;border:1px solid #cfd5dc;background:#fff;padding:0 11px;color:var(--ink);font-size:10px}
.modal-add{width:100%;margin-top:4px}
.accordion{margin-top:25px;border-top:1px solid var(--line)}
.accordion details{border-bottom:1px solid var(--line);padding:14px 0}
.accordion summary{cursor:pointer;color:var(--navy);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.045em}
.accordion p{color:var(--muted);font-size:9px;line-height:1.7}
.toast{position:fixed;z-index:260;right:18px;bottom:18px;display:none;max-width:350px;padding:12px 15px;background:var(--navy);color:#fff;font-size:10px;box-shadow:var(--shadow)}

/* Mobile menu */
.mobile-nav{position:fixed;inset:0;z-index:210;background:#fff;display:none;overflow:auto}
.mobile-nav.show{display:block}
.mobile-nav-head{height:69px;border-bottom:1px solid var(--line);padding:0 18px;display:flex;align-items:center;justify-content:space-between}
.mobile-nav-body{padding:15px 20px 40px}
.mobile-nav-body button{width:100%;border:0;border-bottom:1px solid #edf0f3;background:#fff;padding:16px 0;text-align:left;color:var(--navy);font-size:12px;font-weight:600}

@media(max-width:1120px){
  .header-main{grid-template-columns:220px 1fr auto}.primary-nav{gap:20px}
  .category-strip{grid-template-columns:repeat(6,150px);overflow:auto;padding-bottom:8px}
  .campaign-grid{grid-template-columns:1.35fr 1fr;grid-auto-rows:280px}.campaign-card:nth-child(3){display:none}
  .product-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(max-width:880px){
  .utility-links span:nth-child(n+2),.primary-nav,.quick-links{display:none}
  .utility-inner{padding:0 16px}.header-main{height:68px;padding:0 16px;grid-template-columns:1fr auto}.brand-lockup{gap:11px}.brand-mark{width:102px;height:30px}.brand-mark img{max-height:26px}.brand-divider{height:25px}.brand-shop{font-size:10px}
  .header-actions .desktop-only{display:none}.mobile-menu-button{display:grid}
  .search-inner{padding:10px 16px;grid-template-columns:1fr}
  .category-menu{display:none!important}
  .customer-assurance{padding:0 16px;grid-template-columns:1fr;border-left:0;border-right:0}
  .customer-assurance article{min-height:72px;border-right:0;border-bottom:1px solid var(--line);padding:16px 6px}
  .customer-assurance article:last-child{border-bottom:0}
  .hero-wrap{margin-top:14px;padding:0}.hero{min-height:440px}.hero-panel{left:22px;width:calc(100% - 44px);max-height:calc(100% - 44px);padding:28px 29px 30px;top:auto;bottom:22px;transform:none}.hero h1{font-size:34px}
  .content-shell{padding:0 16px 60px}.section{padding-top:44px}
  .campaign-grid{grid-template-columns:1fr 1fr;grid-auto-rows:260px}.campaign-card:first-child{grid-column:1/-1}.campaign-card:nth-child(3){display:block}
  .product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 12px}
  .product-overlay{transform:none;position:static;grid-template-columns:1fr 1fr;border:1px solid #e3e6ea}
  .product-overlay button{height:38px}
  .editorial-grid{grid-template-columns:1fr 1fr}.editorial-card:last-child{display:none}
  .footer-main{grid-template-columns:1fr 1fr;gap:34px}.footer-main>div:first-child{grid-column:1/-1}
  .modal-panel{inset:0;grid-template-columns:1fr}.modal-image{min-height:430px}.modal-info{padding:30px 22px}
}
@media(max-width:560px){
  .utility-account span{display:none}.utility-inner{height:34px}
  .brand-divider,.brand-shop{display:none}.action-button{min-width:40px}.action-button span:last-child{display:none}
  .hero{min-height:470px}.hero-panel{left:14px;right:14px;width:auto;max-height:calc(100% - 28px);bottom:14px;padding:25px 23px 27px}.hero h1{font-size:30px;line-height:1}.hero p{font-size:10px;margin:11px 0 17px}
  .section-head{align-items:flex-start}.section-head h2{font-size:24px}.section-head p{font-size:10px}.section-head .text-link{display:none}
  .category-strip{grid-template-columns:repeat(6,118px);gap:16px;margin-right:-16px}.category-orb-label{font-size:9px}
  .campaign-grid{display:grid;grid-template-columns:1fr;grid-auto-rows:255px}.campaign-card:first-child{grid-column:auto}.campaign-card:nth-child(3){display:none}
  .product-toolbar{align-items:flex-start;flex-direction:column;padding:10px 0}.toolbar-left,.toolbar-right{width:100%;justify-content:space-between;gap:10px}.filter-button{padding:8px 0}.toolbar-count{display:none}
  .product-grid{gap:27px 10px}.product-content{padding-top:10px}.product-summary{display:none}.product-name{font-size:10px}.price-row{font-size:10px}.product-overlay button{font-size:8px}
  .editorial-grid{grid-template-columns:1fr}.editorial-card:last-child{display:block}
  .footer-main{grid-template-columns:1fr;padding-top:40px}.footer-main>div:first-child{grid-column:auto}.footer-bottom-inner{align-items:flex-start;flex-direction:column;padding-top:17px;padding-bottom:17px}
  .saved-grid{grid-template-columns:1fr 1fr}
  .modal-image{min-height:350px}.modal-info h2{font-size:26px}
}

/* Multi-page storefront */
.page-view{display:none;animation:pageIn .22s ease}
.page-view.active{display:block}
@keyframes pageIn{from{opacity:.25;transform:translateY(6px)}to{opacity:1;transform:none}}
.page-shell{max-width:var(--max);margin:auto;padding:34px 24px 88px}
.page-shell.narrow{max-width:980px}
.page-topline{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:25px}
.breadcrumb{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#7a8492;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.breadcrumb button{border:0;background:none;padding:0;color:var(--navy);font:inherit}
.breadcrumb span[aria-hidden="true"]{color:#aab1ba}
.page-heading{margin:0;color:var(--navy);font-size:38px;line-height:1.04;letter-spacing:-.055em}
.page-intro{max-width:700px;margin:10px 0 0;color:var(--muted);font-size:11px;line-height:1.7}
.route-back{border:0;border-bottom:1px solid var(--navy);background:transparent;padding:0 0 4px;color:var(--navy);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.page-status-wrap{max-width:var(--max);margin:0 auto;padding:16px 24px 0}
.page-status-wrap .status{margin:0}
.home-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:38px 18px}
.home-featured-grid .product-card:nth-child(n+9){display:none}
.shop-page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:28px}
.shop-page-head-copy{min-width:0}
.shop-page-head .cta{flex:0 0 auto}
.shop-empty-actions{display:flex;justify-content:center;gap:10px;margin-top:18px;flex-wrap:wrap}
.product-card-link{border:0;background:none;padding:0;text-align:left;width:100%;display:block}
.product-card-link:focus-visible,.category-orb:focus-visible,.campaign-card button:focus-visible{outline:2px solid var(--teal);outline-offset:3px}
.product-page{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(360px,.88fr);gap:58px;align-items:start}
.product-gallery-main{min-height:620px;aspect-ratio:1/1.08;background:#f2f3f5;position:relative;display:grid;place-items:center;color:#a3abb7;font-size:15px;font-weight:700;letter-spacing:.1em;overflow:hidden}
.product-gallery-main>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.product-gallery-main::after{content:"";position:absolute;inset:0;border:1px solid rgba(7,27,68,.05);pointer-events:none}
.product-page-info{position:sticky;top:176px}
.product-page-kicker{color:var(--blue);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em}
.product-page-title{margin:13px 0 7px;color:var(--navy);font-size:36px;line-height:1.06;letter-spacing:-.05em}
.product-page-price{margin:15px 0 18px;color:var(--navy);font-size:17px;font-weight:700}
.product-page-description{margin:0 0 24px;color:var(--muted);font-size:10px;line-height:1.75}
.product-page-actions{display:grid;grid-template-columns:1fr 50px;gap:10px;margin-top:6px}
.product-page-actions .cta{width:100%}
.icon-square{height:44px;border:1px solid var(--navy);background:#fff;color:var(--navy);font-size:21px;display:grid;place-items:center}
.product-page-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin:24px 0;background:var(--line);border:1px solid var(--line)}
.product-page-meta div{background:#fff;padding:14px}
.product-page-meta small{display:block;color:#7a8492;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
.product-page-meta strong{display:block;margin-top:5px;color:var(--navy);font-size:9px}
.related-section{padding-top:64px}
.saved-page-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:38px 18px}
.bag-page-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:48px;align-items:start}
.bag-page-list{border-top:1px solid var(--line)}
.bag-page-item{display:grid;grid-template-columns:116px 1fr auto;gap:18px;padding:22px 0;border-bottom:1px solid var(--line)}
.bag-page-thumb{width:116px;aspect-ratio:1/1.18;background:#f1f3f5;overflow:hidden}
.bag-page-thumb>img{width:100%;height:100%;object-fit:cover;display:block}
.bag-page-copy strong{display:block;color:var(--navy);font-size:12px;line-height:1.4}
.bag-page-copy span{display:block;margin-top:6px;color:var(--muted);font-size:9px;line-height:1.5}
.bag-page-price{color:var(--navy);font-size:11px;font-weight:700;text-align:right}
.order-summary{position:sticky;top:176px;border:1px solid var(--line);padding:25px;background:#fff}
.order-summary h2{margin:0 0 20px;color:var(--navy);font-size:20px;letter-spacing:-.035em}
.order-summary-line{display:flex;justify-content:space-between;gap:18px;padding:10px 0;color:var(--muted);font-size:9px;border-bottom:1px solid #edf0f3}
.order-summary-total{display:flex;justify-content:space-between;gap:18px;margin:17px 0;color:var(--navy);font-size:13px;font-weight:700}
.order-summary .cta{width:100%;margin-top:8px}
.info-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:34px}
.info-card{border:1px solid var(--line);padding:25px;background:#fff}
.info-card-icon{width:38px;height:38px;border-radius:50%;background:#e9f7f7;color:var(--navy);display:grid;place-items:center;font-weight:800;margin-bottom:17px}
.info-card h2{margin:0 0 8px;color:var(--navy);font-size:17px;letter-spacing:-.03em}
.info-card p{margin:0 0 16px;color:var(--muted);font-size:9px;line-height:1.7}
.info-card button{border:0;border-bottom:1px solid var(--navy);background:none;padding:0 0 4px;color:var(--navy);font-size:9px;font-weight:700;text-transform:uppercase}
.orders-panel{margin-top:32px;border:1px solid var(--line);padding:34px;background:linear-gradient(135deg,#f7fafc,#eef5f8)}
.orders-panel h2{margin:0 0 10px;color:var(--navy);font-size:22px}
.orders-panel p{max-width:650px;margin:0 0 22px;color:var(--muted);font-size:10px;line-height:1.7}
.not-found{text-align:center;padding:80px 20px}
.not-found h1{margin:0;color:var(--navy);font-size:44px}
.not-found p{color:var(--muted);font-size:11px;margin:13px 0 24px}
.mobile-nav-body .mobile-nav-heading{padding:18px 0 7px;border:0;color:#8a94a3;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
body.page-product .search-dock{display:none}
@media(max-width:1120px){
  .home-featured-grid,.saved-page-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .product-page{gap:35px}
}
@media(max-width:880px){
  .page-shell{padding:25px 16px 64px}
  .page-status-wrap{padding:12px 16px 0}
  .page-heading{font-size:31px}
  .home-featured-grid,.saved-page-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 12px}
  .product-page{grid-template-columns:1fr;gap:28px}
  .product-gallery-main{min-height:430px}
  .product-page-info{position:static}
  .bag-page-layout{grid-template-columns:1fr}
  .order-summary{position:static}
  .info-card-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:560px){
  .page-shell{padding-top:20px}
  .page-topline{align-items:flex-start}
  .page-heading{font-size:28px}
  .shop-page-head{align-items:flex-start;flex-direction:column}
  .home-featured-grid,.saved-page-grid{gap:27px 10px}
  .product-gallery-main{min-height:350px}
  .product-page-title{font-size:29px}
  .product-page-meta{grid-template-columns:1fr}
  .bag-page-item{grid-template-columns:86px 1fr;gap:13px}
  .bag-page-thumb{width:86px}
  .bag-page-price{grid-column:2;text-align:left}
  .info-card-grid{grid-template-columns:1fr}
}


/* Integrated customer service */
.support-hero{background:linear-gradient(135deg,#e8f2f8,#f8fbfd);border:1px solid var(--line);padding:52px 42px;text-align:center}
.support-eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:14px;color:var(--blue);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.16em}
.support-eyebrow::before{content:"";width:24px;height:2px;background:var(--teal)}
.support-hero h1{margin:0;color:var(--navy);font-size:42px;line-height:1.04;letter-spacing:-.055em}
.support-hero p{max-width:650px;margin:15px auto 25px;color:var(--muted);font-size:11px;line-height:1.75}
.support-search{max-width:660px;height:48px;margin:auto;display:grid;grid-template-columns:1fr auto;background:#fff;border:1px solid #cfd5dc;box-shadow:0 8px 24px rgba(7,27,68,.06)}
.support-search input{min-width:0;border:0;outline:0;padding:0 16px;color:var(--ink);font-size:11px}
.support-search button{border:0;background:var(--navy);color:#fff;padding:0 22px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.support-channel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:24px}
.support-channel{border:1px solid var(--line);background:#fff;padding:24px;display:flex;flex-direction:column;align-items:flex-start}
.support-channel-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#e9f7f7;color:var(--navy);font-size:15px;font-weight:800;margin-bottom:16px}
.support-channel h2{margin:0 0 7px;color:var(--navy);font-size:17px;letter-spacing:-.03em}
.support-channel p{flex:1;margin:0 0 16px;color:var(--muted);font-size:9px;line-height:1.7}
.support-channel button{border:0;border-bottom:1px solid var(--navy);background:transparent;padding:0 0 4px;color:var(--navy);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.045em}
.support-layout{display:grid;grid-template-columns:320px minmax(0,1fr);gap:32px;margin-top:42px;align-items:start}
.support-sidebar{display:grid;gap:18px;position:sticky;top:176px}
.support-side-card{border:1px solid var(--line);background:#fff;padding:24px}
.support-side-card.navy{background:var(--navy);border-color:var(--navy);color:#fff}
.support-side-card h3{margin:0 0 13px;color:var(--navy);font-size:16px;letter-spacing:-.03em}
.support-side-card.navy h3{color:#fff}
.support-side-card p{margin:0 0 15px;color:var(--muted);font-size:9px;line-height:1.7}
.support-side-card.navy p{color:#d4deea}
.support-topic-list{display:grid;gap:0}
.support-topic{width:100%;border:0;border-bottom:1px solid #edf0f3;background:#fff;padding:12px 0;text-align:left;color:var(--navy);font-size:9px;font-weight:650;line-height:1.45}
.support-topic:hover{color:var(--blue)}
.support-topic.hidden{display:none}
.support-no-results{display:none;padding:15px 0;color:var(--muted);font-size:9px;line-height:1.6}
.support-form-card{border:1px solid var(--line);background:#fff;padding:38px;box-shadow:0 10px 28px rgba(7,27,68,.05)}
.support-priority{display:grid;grid-template-columns:35px 1fr;gap:13px;margin-bottom:28px;padding:18px;background:#fff8e7;border:1px solid #f4dfae;border-left:4px solid var(--gold)}
.support-priority-icon{font-size:22px}
.support-priority strong{display:block;margin-bottom:4px;color:#8a5a00;font-size:9px;text-transform:uppercase;letter-spacing:.07em}
.support-priority p{margin:0;color:#765a1e;font-size:9px;line-height:1.65}
.support-status{display:none;margin-bottom:20px;padding:14px 16px;border:1px solid var(--line);font-size:10px;line-height:1.55}
.support-status.show{display:block}.support-status.ok{background:#ecfdf3;border-color:#abefc6;color:#087443}.support-status.error{background:#fff1f0;border-color:#ffd5d2;color:#b42318}
.support-form-section{margin:30px 0 18px;padding-bottom:10px;border-bottom:2px solid var(--soft);color:var(--navy);font-size:15px;font-weight:800;letter-spacing:-.025em}
.support-form-section:first-of-type{margin-top:0}
.support-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.support-field{margin-bottom:17px}
.support-field label{display:block;margin-bottom:7px;color:var(--muted);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.09em}
.support-field input,.support-field select,.support-field textarea{width:100%;border:1px solid #cfd5dc;background:#fafbfc;padding:12px 13px;color:var(--ink);font-size:10px;outline:0}
.support-field input,.support-field select{height:43px}
.support-field textarea{min-height:135px;resize:vertical;line-height:1.6}
.support-field input:focus,.support-field select:focus,.support-field textarea:focus{border-color:var(--teal);background:#fff;box-shadow:0 0 0 3px rgba(78,185,193,.12)}
.support-required{color:var(--danger)}
.support-dynamic-module{display:none;margin-bottom:20px;padding:21px;border:1px dashed #cfd5dc;background:#f8fafc}
.support-dynamic-module.show{display:block}
.support-dynamic-module h4{margin:0 0 16px;color:var(--navy);font-size:10px;text-transform:uppercase;letter-spacing:.055em}
.support-file-drop{border:2px dashed #cfd5dc;background:#fafbfc;padding:29px 18px;text-align:center;cursor:pointer}
.support-file-drop:hover,.support-file-drop.dragging{border-color:var(--blue);background:#f0f7ff}
.support-file-drop strong{display:block;color:var(--navy);font-size:10px}
.support-file-drop span{display:block;margin-top:6px;color:var(--muted);font-size:8px;line-height:1.6}
.support-file-list{display:grid;gap:6px;margin-top:10px;color:var(--muted);font-size:8px}
.support-checkbox{display:flex;align-items:flex-start;gap:10px;margin-top:17px}
.support-checkbox input{width:16px;height:16px;margin-top:1px;flex:0 0 auto}
.support-checkbox label{color:var(--muted);font-size:8px;line-height:1.65}
.support-submit{width:100%;margin-top:25px}
.support-confirmation{display:none;border:1px solid #abefc6;background:#ecfdf3;padding:28px;text-align:center}
.support-confirmation.show{display:block}
.support-confirmation strong{display:block;color:#087443;font-size:20px;letter-spacing:-.03em}
.support-confirmation p{max-width:520px;margin:9px auto 0;color:#176b49;font-size:9px;line-height:1.7}
@media(max-width:880px){.support-channel-grid{grid-template-columns:1fr}.support-layout{grid-template-columns:1fr}.support-sidebar{position:static;grid-template-columns:1fr 1fr}.support-form-card{padding:28px}.support-hero{padding:40px 24px}.support-hero h1{font-size:34px}}
@media(max-width:560px){.support-sidebar{grid-template-columns:1fr}.support-grid-2{grid-template-columns:1fr;gap:0}.support-form-card{padding:22px 16px}.support-hero{padding:34px 16px}.support-hero h1{font-size:29px}.support-search{grid-template-columns:1fr}.support-search button{height:42px}.support-channel{padding:20px}}

</style>
</head>
<body>
<a class="sr" href="#productGrid">Skip to products</a>

<div class="utility-bar">
  <div class="utility-inner">
    <div class="utility-links">
    </div>
    <div class="utility-account">
      <button id="ordersBtn">My orders</button><span>•</span><button data-open-path="/">Go to SKANDI Travels</button>
    </div>
  </div>
</div>

<header class="site-header">
  <div class="header-main">
    <div class="brand-lockup" aria-label="SKANDI — The Store">
      <div class="brand-mark"><img id="storeHeader" data-master-logo="storeHeader" src="https://static.wixstatic.com/media/394052_eaf2188b7f7e48468fa25d61f8881b10~mv2.png" alt="SKANDI The Store"></div><div class="brand-divider"></div>
    </div>
    <nav class="primary-nav" id="mainNav" aria-label="Shop navigation">
      <button class="active" data-route="home">Home</button>
      <button data-route="shop">Shop</button>
      <button id="categoriesBtn">Categories</button>
      <button data-category="SKANDI">SKANDI collection</button>
      <button data-category="Gift">Gifts</button>
      <button data-category="Sale">Offers</button>
    </nav>
    <div class="header-actions">
      <button class="action-button desktop-only" id="searchBtn" aria-label="Search">
        <span class="action-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m16.2 16.2 4.2 4.2"></path></svg></span><span>Search</span>
      </button>
      <button class="action-button desktop-only" id="savedBtn" aria-label="Saved products">
        <span class="action-icon"><svg viewBox="0 0 24 24"><path d="M20.8 4.7c-2-2-5.2-2-7.2 0L12 6.3l-1.6-1.6c-2-2-5.2-2-7.2 0s-2 5.2 0 7.2L12 20.7l8.8-8.8c2-2 2-5.2 0-7.2Z"></path></svg><b class="badge" id="savedCount">0</b></span><span>Saved</span>
      </button>
      <button class="action-button" id="bagBtn" aria-label="Shopping bag">
        <span class="action-icon"><svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z"></path><path d="M9 9V6a3 3 0 0 1 6 0v3"></path></svg><b class="badge" id="bagCount">0</b></span><span>Bag</span>
      </button>
      <button class="action-button mobile-menu-button" id="mobileMenuBtn" aria-label="Open menu">
        <span class="action-icon"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"></path></svg></span><span>Menu</span>
      </button>
    </div>
  </div>
  <div class="search-dock">
    <div class="search-inner">
      <label class="search-box" for="query">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m16.2 16.2 4.2 4.2"></path></svg>
        <input id="query" autocomplete="off" placeholder="Search products, categories or product code"/>
      </label>
      <input id="quickSearch" class="hidden" aria-hidden="true" tabindex="-1"/>
      <div class="quick-links" id="topTabs">
        <button data-category="Travel Essentials">For the journey</button><button data-category="Luggage">Luggage</button><button data-category="Beach">Beach</button><button data-category="Family">Family</button><button data-category="New">New arrivals</button>
      </div>
    </div>
  </div>
</header>

<div class="category-menu" id="categoryMenu" aria-hidden="true">
  <div class="category-menu-inner">
    <div class="category-menu-intro"><h3>Shop by category</h3><p>Browse SKANDI travel products, destination essentials and selected lifestyle items.</p></div>
    <div class="category-menu-list" id="categoryMenuList"></div>
  </div>
</div>


<main id="pageHost">
  <!-- HOME -->
  <section class="page-view active" id="page-home" data-page="home">
    <section class="hero-wrap" data-section-id="store-hero">
      <div class="hero" id="heroBanner">
        <div class="hero-panel">
          <div class="hero-kicker" data-content-id="store-hero-eyebrow">SKANDI The Store</div>
          <h1 id="heroTitle" data-content-id="store-hero-h1">Everything for the journey</h1>
          <p id="heroText" data-content-id="store-hero-copy">Travel-ready essentials, SKANDI products and destination picks available to every SKANDI customer.</p>
          <button class="cta teal" data-route="shop">Explore products <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </section>

    <section class="customer-assurance" aria-label="Store benefits">
      <article><div class="customer-assurance-icon">✓</div><div><strong>Open to everyone</strong><span>No SKANDI Club membership is required to shop.</span></div></article>
      <article><div class="customer-assurance-icon">✈</div><div><strong>Made for travel</strong><span>Products selected for the airport, journey and destination.</span></div></article>
      <article><div class="customer-assurance-icon">↗</div><div><strong>Secure checkout</strong><span>Shop, review your bag and complete payment in one continuous experience.</span></div></article>
    </section>

    <div class="content-shell">
      <section class="section" aria-labelledby="categoryHeading">
        <div class="section-head">
          <div><h2 id="categoryHeading">Popular categories</h2><p>Start with the items most useful before and during your trip.</p></div>
          <button class="text-link" data-route="shop">View all products</button>
        </div>
        <div class="category-strip" id="popularCategories"></div>
      </section>

      <section class="section" aria-label="Featured campaigns">
        <div class="campaign-grid" id="bannerRow"></div>
      </section>

      <section class="section" aria-labelledby="featuredProductsHeading">
        <div class="section-head">
          <div><h2 id="featuredProductsHeading">Popular products</h2><p>Selected products available from SKANDI The Store.</p></div>
          <button class="text-link" data-route="shop">View all products</button>
        </div>
        <div id="homeProductGrid" class="home-featured-grid"></div>
      </section>

      <section class="section" aria-labelledby="travelHeading">
        <div class="section-head">
          <div><h2 id="travelHeading">Travel inspiration</h2><p>Practical recommendations selected for the way SKANDI customers travel.</p></div>
        </div>
        <div class="editorial-grid" id="travelCards"></div>
      </section>
    </div>
  </section>

  <!-- SHOP / CATEGORY / SEARCH -->
  <section class="page-view" id="page-shop" data-page="shop">
    <div class="page-shell">
      <div class="page-topline">
        <div class="breadcrumb"><button data-route="home">Home</button><span aria-hidden="true">/</span><span id="shopBreadcrumb">Shop</span></div>
      </div>
      <div class="shop-page-head">
        <div class="shop-page-head-copy">
          <h1 class="page-heading" id="categoryTitle">All products</h1>
          <p class="page-intro" id="categoryDescription">Browse products available from THE STORE.</p>
        </div>
        <button class="cta ghost" id="shopCategoriesBtn">Browse categories</button>
      </div>

      <div class="product-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-count" id="productCount">0 products</span>
          <button class="filter-button" data-filter="category">Category</button>
          <button class="filter-button" data-filter="stock">In stock</button>
          <button class="filter-button" data-filter="sale">Offers</button>
          <button class="clear-button" id="clearFiltersBtn">Clear</button>
        </div>
        <div class="toolbar-right">
          <select class="sort-select" id="sort" aria-label="Sort products">
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>

      <div id="productGrid" class="product-grid"></div>
      <div class="load-more-wrap"><button class="cta ghost" id="loadMoreBtn">Show more products</button></div>
    </div>
  </section>

  <!-- PRODUCT DETAIL -->
  <section class="page-view" id="page-product" data-page="product">
    <div class="page-shell">
      <div class="page-topline">
        <div class="breadcrumb"><button data-route="home">Home</button><span aria-hidden="true">/</span><button data-route="shop">Shop</button><span aria-hidden="true">/</span><span id="productBreadcrumb">Product</span></div>
        <button class="route-back" data-back>Back</button>
      </div>
      <div id="productPageContent"></div>
      <section class="related-section" id="relatedSection">
        <div class="section-head">
          <div><h2>You may also like</h2><p>More products selected from the same journey or category.</p></div>
          <button class="text-link" data-route="shop">View all products</button>
        </div>
        <div id="relatedProductGrid" class="product-grid"></div>
      </section>
    </div>
  </section>

  <!-- SAVED -->
  <section class="page-view" id="page-saved" data-page="saved">
    <div class="page-shell">
      <div class="page-topline">
        <div class="breadcrumb"><button data-route="home">Home</button><span aria-hidden="true">/</span><span>Saved products</span></div>
      </div>
      <h1 class="page-heading">Saved products</h1>
      <p class="page-intro">Products you have saved on this device.</p>
      <div id="savedPageGrid" class="saved-page-grid" style="margin-top:32px"></div>
    </div>
  </section>

  <!-- BAG -->
  <section class="page-view" id="page-bag" data-page="bag">
    <div class="page-shell">
      <div class="page-topline">
        <div class="breadcrumb"><button data-route="home">Home</button><span aria-hidden="true">/</span><span>Shopping bag</span></div>
      </div>
      <h1 class="page-heading">Shopping bag</h1>
      <p class="page-intro">Review your selected products before continuing to checkout.</p>
      <div class="bag-page-layout" style="margin-top:32px">
        <div id="bagPageItems" class="bag-page-list"></div>
        <aside class="order-summary">
          <h2>Order summary</h2>
          <div class="order-summary-line"><span>Items</span><span id="bagItemCount">0</span></div>
          <div class="order-summary-line"><span>Delivery</span><span>Calculated at checkout</span></div>
          <div class="order-summary-total"><span>Total</span><span id="bagTotal">—</span></div>
          <button class="cta navy" id="checkoutBtn">Proceed to checkout</button>
          <button class="cta white" data-route="shop">Continue shopping</button>
        </aside>
      </div>
    </div>
  </section>

  <!-- ORDERS -->
  <section class="page-view" id="page-orders" data-page="orders">
    <div class="page-shell narrow">
      <div class="page-topline"><div class="breadcrumb"><button data-route="home">Home</button><span aria-hidden="true">/</span><span>My orders</span></div></div>
      <h1 class="page-heading">My orders</h1>
      <p class="page-intro">Sign in to review your SKANDI store orders, delivery progress and purchase details.</p>
      <div class="orders-panel">
        <h2>Open your order history</h2>
        <p>You may be asked to sign in before your order history and purchase details are displayed.</p>
        <button class="cta navy" id="ordersPageBtn">Open my orders</button>
      </div>
    </div>
  </section>

  <!-- CUSTOMER SERVICE -->
  <section class="page-view" id="page-support" data-page="support">
    <div class="page-shell">
      <div class="page-topline"><div class="breadcrumb"><button data-route="home">Home</button><span aria-hidden="true">/</span><span>Customer service</span></div></div>

      <section class="support-hero">
        <div class="support-eyebrow">SKANDI Customer Service</div>
        <h1>How can we help?</h1>
        <p>Find help with orders, delivery, returns, refunds, payments, products, warranties, promotions, accounts or technical issues without leaving the store.</p>
        <div class="support-search">
          <input id="supportSearchInput" type="search" autocomplete="off" placeholder="Search orders, tracking, returns, refunds, payments, products…">
          <button id="supportSearchBtn" type="button">Search help</button>
        </div>
      </section>

      <div class="support-channel-grid">
        <article class="support-channel"><div class="support-channel-icon">□</div><h2>Order assistance</h2><p>Review your order history or contact us about an existing purchase.</p><button data-route="orders">View my orders</button></article>
        <article class="support-channel"><div class="support-channel-icon">↗</div><h2>Delivery & returns</h2><p>Get help with tracking, delayed parcels, missing items, returns, exchanges or refunds.</p><button data-support-prefill="shipping_delivery">Get delivery help</button></article>
        <article class="support-channel"><div class="support-channel-icon">?</div><h2>Contact support</h2><p>Send a detailed request to SKANDI Customer Service and include any relevant order or product information.</p><button data-support-form>Open contact form</button></article>
      </div>

      <div class="support-layout">
        <aside class="support-sidebar">
          <div class="support-side-card">
            <h3>Popular help topics</h3>
            <div class="support-topic-list" id="supportTopicList">
              <button class="support-topic" data-support-topic data-support-category="order_management" data-support-subcategory="Order status">Where is my order?</button>
              <button class="support-topic" data-support-topic data-support-category="shipping_delivery" data-support-subcategory="Tracking not updating">My tracking is not updating</button>
              <button class="support-topic" data-support-topic data-support-category="shipping_delivery" data-support-subcategory="Marked delivered but not received">Marked delivered but not received</button>
              <button class="support-topic" data-support-topic data-support-category="returns_exchanges" data-support-subcategory="Start a return">Start a return</button>
              <button class="support-topic" data-support-topic data-support-category="returns_exchanges" data-support-subcategory="Exchange size, color or product">Exchange a product</button>
              <button class="support-topic" data-support-topic data-support-category="refunds_credits" data-support-subcategory="Refund status">Check a refund status</button>
              <button class="support-topic" data-support-topic data-support-category="payments_checkout" data-support-subcategory="Payment declined">Payment or checkout problem</button>
              <button class="support-topic" data-support-topic data-support-category="damaged_wrong_missing" data-support-subcategory="Damaged item">Damaged, wrong or missing item</button>
              <button class="support-topic" data-support-topic data-support-category="promotions_gift_cards" data-support-subcategory="Promo code not working">Promo code not working</button>
              <button class="support-topic" data-support-topic data-support-category="account_security" data-support-subcategory="Sign-in issue">I cannot access my account</button>
            </div>
            <div class="support-no-results" id="supportNoResults">No matching help topic was found. Use the contact form and describe what happened.</div>
          </div>
          <div class="support-side-card navy">
            <h3>Already placed an order?</h3>
            <p>Opening your account first may give you the fastest answer and lets you review the latest order and delivery status.</p>
            <button class="cta white" data-route="orders">Open my orders</button>
          </div>
        </aside>

        <section class="support-form-card" id="supportFormCard">
          <div class="support-priority">
            <div class="support-priority-icon">◷</div>
            <div><strong>Customer service request</strong><p>Select the most accurate category and topic so your request reaches the right team. Include order numbers, product details and supporting documents whenever available.</p></div>
          </div>

          <div id="supportStatus" class="support-status" role="status" aria-live="polite"></div>
          <div id="supportConfirmation" class="support-confirmation"><strong id="supportConfirmationTitle">Request submitted</strong><p id="supportConfirmationText">SKANDI Customer Service will follow up by email.</p></div>

          <form id="publicSupportForm" novalidate>
            <div class="support-form-section">1. Contact information</div>
            <div class="support-grid-2">
              <div class="support-field"><label for="firstName">First name <span class="support-required">*</span></label><input id="firstName" type="text" required autocomplete="given-name"></div>
              <div class="support-field"><label for="lastName">Last name <span class="support-required">*</span></label><input id="lastName" type="text" required autocomplete="family-name"></div>
            </div>
            <div class="support-grid-2">
              <div class="support-field"><label for="email">Email address <span class="support-required">*</span></label><input id="email" type="email" required autocomplete="email"></div>
              <div class="support-field"><label for="phone">Phone number</label><div style="display:grid;grid-template-columns:92px 1fr;gap:8px"><select id="phonePrefix" aria-label="Phone country code"><option>+1</option><option>+44</option><option>+46</option><option>+47</option><option>+45</option><option>+358</option></select><input id="phone" type="tel" autocomplete="tel"></div></div>
            </div>
            <div class="support-grid-2">
              <div class="support-field"><label for="countryOfResidence">Country or region <span class="support-required">*</span></label><input id="countryOfResidence" type="text" required autocomplete="country-name"></div>
              <div class="support-field"><label for="preferredContact">Preferred contact method</label><select id="preferredContact"><option value="email">Email</option><option value="phone">Phone</option></select></div>
            </div>

            <div class="support-form-section">2. Purchase details</div>
            <div class="support-grid-2">
              <div class="support-field"><label for="hasOrder">Does this relate to an existing order? <span class="support-required">*</span></label><select id="hasOrder" required><option value="">Select</option><option value="yes">Yes, I have an order</option><option value="no">No, this is a pre-purchase or general question</option></select></div>
              <div class="support-field"><label for="purchaseChannel">Purchase channel</label><select id="purchaseChannel"><option value="">Select when applicable</option><option value="online-store">SKANDI online store</option><option value="customer-service">Customer Service order</option><option value="gift-recipient">I received the item as a gift</option><option value="not-purchased">Not purchased yet</option><option value="other">Other</option></select></div>
            </div>

            <div id="orderFields" class="support-dynamic-module">
              <h4>Order information</h4>
              <div class="support-grid-2">
                <div class="support-field"><label for="orderNumber">Order number <span class="support-required">*</span></label><input id="orderNumber" type="text" placeholder="Order number"></div>
                <div class="support-field"><label for="orderEmail">Email used for the order</label><input id="orderEmail" type="email" autocomplete="email"></div>
              </div>
              <div class="support-grid-2">
                <div class="support-field"><label for="orderDate">Order date</label><input id="orderDate" type="date"></div>
                <div class="support-field"><label for="orderTotal">Order total and currency</label><input id="orderTotal" type="text" placeholder="Example: USD 129.00"></div>
              </div>
            </div>

            <div class="support-form-section">3. Request category</div>
            <div class="support-grid-2">
              <div class="support-field"><label for="caseCategory">Category <span class="support-required">*</span></label><select id="caseCategory" required>
                <option value="">Select category</option>
                <option value="order_management">Orders & order changes</option>
                <option value="shipping_delivery">Shipping, tracking & delivery</option>
                <option value="returns_exchanges">Returns & exchanges</option>
                <option value="refunds_credits">Refunds & store credit</option>
                <option value="payments_checkout">Payments, charges & checkout</option>
                <option value="product_information">Product information & availability</option>
                <option value="damaged_wrong_missing">Damaged, defective, wrong or missing items</option>
                <option value="warranty_repairs">Warranty, repairs & replacement parts</option>
                <option value="promotions_gift_cards">Promotions, gift cards & rewards</option>
                <option value="account_security">Account access & security</option>
                <option value="privacy_data">Privacy & personal data</option>
                <option value="technical_accessibility">Technical & accessibility support</option>
                <option value="business_bulk">Business, bulk & corporate orders</option>
                <option value="feedback_other">Feedback, complaints & other inquiries</option>
              </select></div>
              <div class="support-field"><label for="caseSubCategory">Specific topic <span class="support-required">*</span></label><select id="caseSubCategory" required><option value="">Select category first</option></select></div>
            </div>

            <div id="shippingDetailsModule" class="support-dynamic-module">
              <h4>Shipping and delivery details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="carrierName">Carrier</label><input id="carrierName" type="text" placeholder="UPS, FedEx, USPS, DHL…"></div><div class="support-field"><label for="trackingNumber">Tracking number</label><input id="trackingNumber" type="text"></div></div>
              <div class="support-grid-2"><div class="support-field"><label for="expectedDeliveryDate">Expected delivery date</label><input id="expectedDeliveryDate" type="date"></div><div class="support-field"><label for="deliveryPostcode">Delivery postal code</label><input id="deliveryPostcode" type="text" autocomplete="postal-code"></div></div>
            </div>

            <div id="returnDetailsModule" class="support-dynamic-module">
              <h4>Return, exchange or resolution details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="returnNumber">Return or authorization number</label><input id="returnNumber" type="text"></div><div class="support-field"><label for="returnSentDate">Date returned</label><input id="returnSentDate" type="date"></div></div>
              <div class="support-grid-2"><div class="support-field"><label for="itemCondition">Item condition</label><select id="itemCondition"><option value="">Select</option><option>Unopened and unused</option><option>Opened but unused</option><option>Used</option><option>Damaged on arrival</option><option>Defective</option><option>Incorrect item</option><option>Missing item or part</option></select></div><div class="support-field"><label for="requestedResolution">Preferred resolution</label><select id="requestedResolution"><option value="">Select</option><option>Refund</option><option>Exchange</option><option>Replacement</option><option>Repair</option><option>Store credit</option><option>Missing item sent</option><option>Information only</option></select></div></div>
            </div>

            <div id="paymentDetailsModule" class="support-dynamic-module">
              <h4>Payment details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="paymentMethod">Payment method</label><select id="paymentMethod"><option value="">Select</option><option>Credit card</option><option>Debit card</option><option>Digital wallet</option><option>Gift card</option><option>Store credit</option><option>Other</option></select></div><div class="support-field"><label for="transactionDate">Transaction date</label><input id="transactionDate" type="date"></div></div>
              <div class="support-grid-2"><div class="support-field"><label for="transactionAmount">Amount and currency</label><input id="transactionAmount" type="text" placeholder="Example: USD 129.00"></div><div class="support-field"><label for="paymentLast4">Last 4 digits only</label><input id="paymentLast4" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="1234"></div></div>
              <div class="support-field"><label for="paymentError">Error or bank message</label><input id="paymentError" type="text" placeholder="Do not enter a full card number"></div>
            </div>

            <div id="productDetailsModule" class="support-dynamic-module">
              <h4>Product details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="productName">Product name <span class="support-required">*</span></label><input id="productName" type="text"></div><div class="support-field"><label for="productSku">SKU or product code</label><input id="productSku" type="text"></div></div>
              <div class="support-grid-2"><div class="support-field"><label for="productQuantity">Quantity affected</label><input id="productQuantity" type="number" min="1" step="1"></div><div class="support-field"><label for="dateReceived">Date received</label><input id="dateReceived" type="date"></div></div>
            </div>

            <div id="promotionDetailsModule" class="support-dynamic-module">
              <h4>Promotion, gift card or reward details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="promotionCode">Promotion or gift card code</label><input id="promotionCode" type="text"></div><div class="support-field"><label for="promotionName">Promotion name</label><input id="promotionName" type="text"></div></div>
              <div class="support-grid-2"><div class="support-field"><label for="giftCardLast4">Gift card last 4 characters</label><input id="giftCardLast4" type="text" maxlength="4"></div><div class="support-field"><label for="expectedDiscount">Expected discount or benefit</label><input id="expectedDiscount" type="text"></div></div>
            </div>

            <div id="technicalDetailsModule" class="support-dynamic-module">
              <h4>Technical details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="deviceType">Device</label><input id="deviceType" type="text" placeholder="Example: iPhone 16, Windows laptop"></div><div class="support-field"><label for="browserName">Browser and version</label><input id="browserName" type="text" placeholder="Example: Safari 19"></div></div>
              <div class="support-field"><label for="pageUrl">Page or screen where the issue occurred</label><input id="pageUrl" type="text"></div>
              <div class="support-field"><label for="technicalError">Error message</label><input id="technicalError" type="text"></div>
            </div>

            <div id="businessDetailsModule" class="support-dynamic-module">
              <h4>Business or bulk order details</h4>
              <div class="support-grid-2"><div class="support-field"><label for="companyName">Company name <span class="support-required">*</span></label><input id="companyName" type="text" autocomplete="organization"></div><div class="support-field"><label for="companyTaxId">Tax or registration number</label><input id="companyTaxId" type="text"></div></div>
              <div class="support-grid-2"><div class="support-field"><label for="bulkQuantity">Estimated quantity <span class="support-required">*</span></label><input id="bulkQuantity" type="number" min="1" step="1"></div><div class="support-field"><label for="requiredByDate">Required-by date</label><input id="requiredByDate" type="date"></div></div>
            </div>

            <div class="support-field"><label for="caseSubject">Subject <span class="support-required">*</span></label><input id="caseSubject" type="text" required maxlength="160" placeholder="Briefly summarize your request"></div>
            <div class="support-field"><label for="caseDescription">Detailed description <span class="support-required">*</span></label><textarea id="caseDescription" required placeholder="Explain what happened, which item or order is affected, what you have already tried and the resolution you need."></textarea></div>

            <div class="support-form-section">4. Supporting documents</div>
            <div class="support-file-drop" id="supportFileDrop" tabindex="0" role="button" aria-controls="fileInput">
              <strong>Choose files or drag them here</strong><span>Maximum 3 files: PDF, JPG or PNG. Maximum 10 MB total. Remove full payment-card numbers and other unnecessary sensitive information.</span>
              <input id="fileInput" type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png">
            </div>
            <div class="support-file-list" id="fileSummary"></div>

            <div class="support-checkbox"><input id="consentPrivacy" type="checkbox" required><label for="consentPrivacy">I confirm the information is accurate and consent to processing of my personal data under SKANDI’s Privacy Policy. <span class="support-required">*</span></label></div>
            <div class="support-checkbox"><input id="consentSla" type="checkbox" required><label for="consentSla">I understand that response times depend on request type and current support volume. <span class="support-required">*</span></label></div>

            <button id="submitBtn" class="cta navy support-submit" type="submit">Submit support request</button>
          </form>
        </section>
      </div>
    </div>
  </section>

  <!-- NOT FOUND -->
  <section class="page-view" id="page-notfound" data-page="notfound">
    <div class="page-shell not-found">
      <h1>Page not found</h1>
      <p>The store page you tried to open does not exist.</p>
      <button class="cta navy" data-route="home">Return to the store</button>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="footer-main">
    <div>
      <div class="footer-brand"><img id="storeFooter" data-master-logo="storeFooter" src="https://static.wixstatic.com/media/394052_cd31153a91694b14a27c5f756f8089bd~mv2.png" alt="SKANDI The Store"><span>The Store</span></div>
      <p>Travel essentials, luggage, gifts and SKANDI products.</p>
    </div>
    <div><h4>Shop</h4><button data-route="shop">All products</button><button id="footerCategoriesBtn">Categories</button><button data-category="SKANDI">SKANDI collection</button><button data-category="Gift">Gifts</button></div>
    <div><h4>Travel</h4><button data-category="Luggage">Luggage</button><button data-category="Travel Essentials">Travel essentials</button><button data-category="Beach">Beach</button><button data-category="Family">Family</button></div>
    <div><h4>Support</h4><button data-route="support">Customer service</button><button data-route="orders">My orders</button><button data-open-path="/terms">Terms</button><button data-open-path="/privacy">Privacy</button><button id="refreshStoreBtn">Refresh store</button></div>
  </div>
  <div class="footer-bottom"><div class="footer-bottom-inner"><div class="default-bar" id="storeSlogan" data-content-id="store-footer-slogan">Unforgettable Moments.</div><span>© <span id="footerYear"></span> SKANDI Travels. All rights reserved.</span></div></div>
</footer>

<section class="mobile-nav" id="mobileNav" aria-hidden="true">
  <div class="mobile-nav-head"><div class="brand-mark"><img data-master-logo="storeHeader" src="https://static.wixstatic.com/media/394052_eaf2188b7f7e48468fa25d61f8881b10~mv2.png" alt="SKANDI The Store"></div><div class="brand-divider"></div><button class="close-button" data-close="mobile">×</button></div>
  <div class="mobile-nav-body" id="mobileNavList">
    <div class="mobile-nav-heading">Store</div>
    <button data-route="home">Home</button><button data-route="shop">All products</button><button id="mobileCategoriesBtn">Categories</button><button data-category="SKANDI">SKANDI collection</button><button data-category="Gift">Gifts</button><button data-category="Sale">Offers</button>
    <div class="mobile-nav-heading">My store</div>
    <button data-route="saved">Saved products</button><button data-route="bag">Shopping bag</button><button data-route="orders">My orders</button><button data-route="support">Customer service</button>
  </div>
</section>

<div id="toast" class="toast" role="status" aria-live="polite"></div>


<script>
(function(){
"use strict";
  const STOREFRONT_SOURCE = "SKANDI_STOREFRONT"; 
  const SUPPORT_SOURCE = "SKANDI_SUPPORT_PUBLIC"; 
  const PARENT_SOURCE = "SKANDI_WIX_PARENT";
let PRODUCTS=[],CATEGORIES=[],CART={lineItems:[]},BANNERS=[],TRAVEL_CARDS=[];
let STOREFRONT_CONNECTED=false;
let STOREFRONT_REQUEST_ATTEMPTS=0;
let STOREFRONT_RETRY_TIMER=null;
let ACTIVE="",ACTIVE_PRODUCT=null,FILTERS={stock:false,sale:false},VISIBLE_LIMIT=12;
let SAVED=new Set(loadSaved());
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const post=(type,payload={})=>window.parent.postMessage({source:STOREFRONT_SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
const supportPost=(type,payload={})=>window.parent.postMessage({source:SUPPORT_SOURCE,type,payload,timestamp:new Date().toISOString()},"*");
let MASTER_CONFIG_STATE=null;

function masterAsset(key){
  const logos=MASTER_CONFIG_STATE?.brand?.assets?.logos||{};
  const root=MASTER_CONFIG_STATE?.brand?.assets||{};
  return String(logos[key]||root[key]||"").trim();
}
function currentMasterSlogan(){
  const slogans=MASTER_CONFIG_STATE?.brand?.slogans||{};
  const language=String(MASTER_CONFIG_STATE?.settings?.language||"EN").trim().toLowerCase();
  return String(slogans[language]||slogans.en||"").trim();
}
function renderMasterBranding(){
  const headerLogo=masterAsset("storeHeader");
  const footerLogo=masterAsset("storeFooter");
  const slogan=currentMasterSlogan();

  if(headerLogo){
    document.querySelectorAll('[data-master-logo="storeHeader"]').forEach(img=>{
      img.src=headerLogo;
    });
  }
  if(footerLogo&&$("storeFooter"))$("storeFooter").src=footerLogo;
  if(slogan&&$("storeSlogan"))$("storeSlogan").textContent=slogan;
}

function requestStorefront(reason="html-ready"){
  if(STOREFRONT_CONNECTED)return;

  STOREFRONT_REQUEST_ATTEMPTS+=1;

  status(
    STOREFRONT_REQUEST_ATTEMPTS===1
      ? "Connecting to Wix Stores…"
      : `Connecting to Wix Stores… attempt ${STOREFRONT_REQUEST_ATTEMPTS}`
  );

  post("STOREFRONT_READY",{
    reason,
    attempt:STOREFRONT_REQUEST_ATTEMPTS
  });

  clearTimeout(STOREFRONT_RETRY_TIMER);

  if(STOREFRONT_REQUEST_ATTEMPTS<8){
    STOREFRONT_RETRY_TIMER=setTimeout(
      ()=>requestStorefront("retry"),
      1500
    );
  }else{
    status(
      "The Wix Catalog V3 bridge did not answer. Check the page code and backend/skandiStorefront.web.",
      "error"
    );
  }
}


function loadSaved(){
  try{return JSON.parse(localStorage.getItem("skandiStoreSaved")||"[]")}catch(_){return[]}
}
function persistSaved(){
  try{localStorage.setItem("skandiStoreSaved",JSON.stringify([...SAVED]))}catch(_){}
}
function status(message,type=""){
  const el=$("status");if(!el)return;
  if(!message){el.className="status";el.textContent="";return}
  el.textContent=message;el.className="status show "+type;
}
function toast(message){
  const el=$("toast");if(!el)return;
  el.textContent=message;el.style.display="block";clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.display="none",2600);
}
function money(price){
  if(!price)return"—";if(price.formatted)return price.formatted;
  const amount=Number(price.amount||0);
  return `${price.currency||""} ${amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`.trim();
}
function textOf(p){return [p.name,p.brand,p.description,p.summary,p.sku,(p.categoryNames||[]).join(" "),p.ribbon,p.badge,p.recommendation].join(" ").toLowerCase()}
function browserImageUrl(value){
  const raw=String(value||"").trim();if(!raw)return"";
  if(/^https?:\/\//i.test(raw))return raw;
  if(raw.startsWith("//"))return`https:${raw}`;
  if(raw.startsWith("wix:image://v1/")){
    const path=raw.slice("wix:image://v1/".length).split("#")[0];
    const mediaId=decodeURIComponent(path.split("/")[0]||"");
    return mediaId?`https://static.wixstatic.com/media/${mediaId}`:"";
  }
  if(raw.startsWith("/media/"))return`https://static.wixstatic.com${raw}`;
  if(/^[A-Za-z0-9_-]+_[A-Za-z0-9_-]+~mv2(?:\.[A-Za-z0-9]+)?$/i.test(raw))return`https://static.wixstatic.com/media/${raw}`;
  return raw;
}
function imageUrlOf(value){
  if(!value)return"";
  if(typeof value==="string")return browserImageUrl(value);
  return browserImageUrl(value.url||value.src||value.imageUrl||value.image?.url||value.image?.src||value.imageInfo?.url||value.main?.image?.url||value.mainMedia?.image?.url||value.id||value.image?.id||"");
}
function productImageCandidates(product={}){
  const items=
    product.media?.itemsInfo?.items||
    product.media?.items||
    product.mediaItemsInfo?.items||
    product.mediaItemsInfo?.mediaItems||
    product.mediaItems||
    product.images||
    (Array.isArray(product.media)?product.media:[]);

  const list=[
    product.imageUrl,
    product.thumbnailUrl,
    product.variantImageUrl,
    ...(Array.isArray(product.mediaUrls)?product.mediaUrls:[]),
    product.image,
    product.mainImage,
    product.media?.main?.image?.url,
    product.media?.main?.url,
    product.media?.mainMedia,
    product.mainMedia,
    ...(Array.isArray(items)?items:[])
  ]
    .map(imageUrlOf)
    .filter(Boolean);

  return [...new Set(list)];
}

function normalizeProductImage(product={}){
  const imageCandidates=productImageCandidates(product);
  return {
    ...product,
    imageCandidates,
    imageUrl:imageCandidates[0]||""
  };
}

function imageStyle(url){
  const src=imageUrlOf(url);
  return src?`background-image:url(${JSON.stringify(src)})`:"";
}

function imageTagForProduct(product={},alt="",className=""){
  const candidates=
    Array.isArray(product.imageCandidates)&&product.imageCandidates.length
      ? product.imageCandidates
      : productImageCandidates(product);

  if(!candidates.length)return"";

  const src=candidates[0];
  const fallbacks=candidates.slice(1);

  const fallbackAttr=
    fallbacks.length
      ? ` data-image-fallbacks="${esc(JSON.stringify(fallbacks))}"`
      : "";

  return `<img${className?` class="${esc(className)}"`:""} src="${esc(src)}"${fallbackAttr} alt="${esc(alt)}" decoding="async" loading="eager">`;
}

function imageTag(url,alt="",className=""){
  const src=imageUrlOf(url);
  return src?`<img${className?` class="${esc(className)}"`:""} src="${esc(src)}" alt="${esc(alt)}" decoding="async" loading="eager">`:"";
}

document.addEventListener("error",(event)=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement))return;

  const raw=img.getAttribute("data-image-fallbacks");
  if(!raw)return;

  let fallbacks=[];
  try{fallbacks=JSON.parse(raw)}catch(_){fallbacks=[]}

  const next=fallbacks.shift();
  if(!next){
    img.removeAttribute("data-image-fallbacks");
    return;
  }

  img.setAttribute(
    "data-image-fallbacks",
    JSON.stringify(fallbacks)
  );

  img.src=next;
},true);
function productBrand(p){return p.brand||p.brandName||(p.categoryNames||[])[0]||"SKANDI"}
function categoryValue(category,...keys){for(const key of keys){const value=category?.[key];if(value!==undefined&&value!==null&&value!=="")return value}return""}
function categoryImage(category){
  const raw=categoryValue(category,"imageUrl","image","mainImage","media");
  if(typeof raw==="string")return raw;
  return raw?.url||raw?.src||raw?.image?.url||raw?.mainMedia?.image?.url||category?.coverImage?.url||"";
}
function flattenCategories(input,parent=null,output=[]){
  (Array.isArray(input)?input:[]).forEach((raw,index)=>{
    if(!raw)return;
    const id=String(categoryValue(raw,"id","_id","categoryId","slug")||`category-${output.length}-${index}`);
    const name=String(categoryValue(raw,"name","title","label")||"").trim();
    const parentObject=raw.parentCategory||raw.parent||null;
    const parentIdRaw=categoryValue(raw,"parentCategoryId","parentId")||(typeof parentObject==="object"?categoryValue(parentObject,"id","_id","categoryId","slug"):parentObject)||parent?.id||"";
    const parentNameRaw=categoryValue(raw,"parentCategoryName","parentName")||(typeof parentObject==="object"?categoryValue(parentObject,"name","title","label"):"")||parent?.name||"";
    const record={
      raw,id,name,
      description:String(categoryValue(raw,"description","summary","shortDescription","body")||"").trim(),
      imageUrl:categoryImage(raw),
      parentId:String(parentIdRaw||""),parentName:String(parentNameRaw||""),
      order:Number(categoryValue(raw,"rank","order","sortOrder","displayOrder")||output.length),
      slug:String(categoryValue(raw,"slug","urlSlug")||"")
    };
    if(name)output.push(record);
    const children=raw.children||raw.subCategories||raw.subcategories||raw.childCategories||[];
    if(Array.isArray(children)&&children.length)flattenCategories(children,record,output);
  });
  return output;
}
function categoryRecords(){return flattenCategories(CATEGORIES)}
function categoryNames(){return [...new Set([...categoryRecords().map(c=>c.name),...PRODUCTS.flatMap(p=>p.categoryNames||[])].filter(Boolean))]}
function productForCategory(name){return PRODUCTS.find(p=>(p.categoryNames||[]).some(c=>String(c).toLowerCase()===String(name).toLowerCase())&&p.imageUrl)||PRODUCTS.find(p=>textOf(p).includes(String(name).toLowerCase())&&p.imageUrl)}
function inferCategoryParent(record,records){
  if(record.parentName)return record.parentName;
  if(record.parentId){const parent=records.find(c=>String(c.id)===String(record.parentId));if(parent)return parent.name}
  const separators=[" > "," / "," — "," - "];
  for(const separator of separators){if(record.name.includes(separator))return record.name.split(separator)[0].trim()}
  return"";
}
function subcategoryRecords(){
  const records=categoryRecords();
  return records.map(record=>({...record,resolvedParentName:inferCategoryParent(record,records)})).filter(record=>record.resolvedParentName&&record.name&&record.name!==record.resolvedParentName).sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name));
}
function isSale(p){return !!(p.comparePrice&&Number(p.comparePrice.amount)>Number(p.price?.amount||0))||/sale|offer|deal/i.test(`${p.ribbon||""} ${p.badge||""} ${(p.categoryNames||[]).join(" ")}`)}
function bagCount(){return (CART.lineItems||[]).reduce((sum,item)=>sum+Number(item.quantity||0),0)}

function parseRoute(){
  const raw=(location.hash||"#/home").replace(/^#\/?/,"");
  const [pathPart,queryString=""]=raw.split("?");
  const bits=pathPart.split("/").filter(Boolean);
  const page=bits[0]||"home";
  const params=new URLSearchParams(queryString);
  return {page,id:bits.slice(1).join("/"),params};
}
function routeHash(page,params={}){
  let hash="#/"+page;
  if(page==="product"&&params.id)hash+="/"+encodeURIComponent(params.id);
  const q=new URLSearchParams();
  if(params.category)q.set("category",params.category);
  if(params.q)q.set("q",params.q);
  if(params.stock)q.set("stock","1");
  if(params.sale)q.set("sale","1");
  const qs=q.toString();if(qs)hash+="?"+qs;
  return hash;
}
function navigate(page,params={},replace=false){
  const hash=routeHash(page,params);
  if(location.hash===hash){applyRoute();return}
  if(replace)history.replaceState(null,"",hash);else location.hash=hash;
  if(replace)applyRoute();
}
function showPage(page){
  document.querySelectorAll(".page-view").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  document.body.className=document.body.className.replace(/\bpage-\S+/g,"").trim();
  document.body.classList.add("page-"+page);
  document.querySelectorAll("[data-route]").forEach(btn=>{
    const route=btn.dataset.route;
    btn.classList.toggle("active",(route==="home"&&page==="home")||(route==="shop"&&(page==="shop"||page==="product"))||(route===page));
  });
}
function closeMenus(){
  $("categoryMenu")?.classList.remove("show");
  $("categoryMenu")?.setAttribute("aria-hidden","true");
  $("mobileNav")?.classList.remove("show");
  $("mobileNav")?.setAttribute("aria-hidden","true");
  document.body.classList.remove("locked");
}
function applyRoute(){
  closeMenus();
  const route=parseRoute();
  const allowed=["home","shop","product","saved","bag","orders","support"];
  const page=allowed.includes(route.page)?route.page:"notfound";

  if(page==="shop"){
    ACTIVE=route.params.get("category")||"";
    FILTERS.stock=route.params.get("stock")==="1";
    FILTERS.sale=route.params.get("sale")==="1";
    const q=route.params.get("q")||"";
    $("query").value=q;
    VISIBLE_LIMIT=12;
    renderShop();
  }else if(page==="product"){
    renderProductPage(decodeURIComponent(route.id||""));
  }else if(page==="saved"){
    renderSavedPage();
  }else if(page==="bag"){
    post("STOREFRONT_CART_REQUEST",{});
    renderBagPage();
  }else if(page==="orders"){
    renderOrdersPage();
  }else if(page==="home"){
    renderHomeProducts();
  }else if(page==="support"){
    filterSupportTopics();
  }

  showPage(page);
  window.scrollTo({top:0,behavior:"auto"});
}
function openCategory(name){navigate("shop",{category:name||""})}
function currentShopParams(overrides={}){
  return {
    category:overrides.category!==undefined?overrides.category:ACTIVE,
    q:overrides.q!==undefined?overrides.q:$("query").value.trim(),
    stock:overrides.stock!==undefined?overrides.stock:FILTERS.stock,
    sale:overrides.sale!==undefined?overrides.sale:FILTERS.sale
  };
}

function filtered(){
  const q=String($("query")?.value||"").toLowerCase().trim();
  const sort=$("sort")?.value||"recommended";
  let rows=PRODUCTS.filter(p=>{
    if(q&&!textOf(p).includes(q))return false;
    if(ACTIVE&&!textOf(p).includes(ACTIVE.toLowerCase())&&!((p.categoryNames||[]).some(c=>String(c).toLowerCase()===ACTIVE.toLowerCase())))return false;
    if(FILTERS.stock&&p.inStock===false)return false;
    if(FILTERS.sale&&!isSale(p))return false;
    return true;
  });
  rows.sort((a,b)=>{
    if(sort==="name")return String(a.name||"").localeCompare(String(b.name||""));
    if(sort==="priceAsc")return Number(a.price?.amount||0)-Number(b.price?.amount||0);
    if(sort==="priceDesc")return Number(b.price?.amount||0)-Number(a.price?.amount||0);
    if(sort==="newest")return new Date(b.updatedAt||0)-new Date(a.updatedAt||0);
    return Number(b.recommendationScore||0)-Number(a.recommendationScore||0);
  });
  return rows;
}

function categoryItem(name){
  const p=productForCategory(name),url=p?.imageUrl||"",initials=String(name).split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return `<button class="category-orb" data-category="${esc(name)}"><span class="category-orb-media" style="${imageStyle(url)}">${url?"":`<span class="category-initials">${esc(initials)}</span>`}</span><span class="category-orb-label">${esc(name)}</span></button>`;
}
function renderCategories(){
  const defaults=["Travel Essentials","Luggage","SKANDI","Beach","Family","Gifts"];
  const names=[...new Set([...categoryNames(),...defaults])].slice(0,12);
  $("popularCategories").innerHTML=names.slice(0,6).map(categoryItem).join("");
  $("categoryMenuList").innerHTML=`<button data-category="">All products</button>`+names.map(n=>`<button data-category="${esc(n)}">${esc(n)}</button>`).join("");
}
function productCard(p){
  const disabled=p.inStock===false||p.canAddToCart===false;
  const label=p.accessLabel||p.ribbon||(p.inStock===false?"Sold out":isSale(p)?"Offer":"");
  return `<article class="product-card">
    <div class="product-media">
      ${imageTagForProduct(p,p.name||"Product")}
      ${p.imageUrl?"":`<span class="product-placeholder">SKANDI</span>`}
      ${label?`<span class="product-ribbon">${esc(label)}</span>`:""}
      <button class="save-button" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}">${SAVED.has(String(p.id))?"♥":"♡"}</button>
      <div class="product-overlay"><button data-view="${esc(p.id)}">View product</button><button data-add="${esc(p.id)}" ${disabled?"disabled":""}>${disabled?"Unavailable":"Add to bag"}</button></div>
    </div>
    <div class="product-content">
      <button class="product-card-link" data-view="${esc(p.id)}">
        <div class="product-brand">${esc(productBrand(p))}</div>
        <strong class="product-name">${esc(p.name||"Product")}</strong>
        <div class="product-summary">${esc(p.summary||p.description||"")}</div>
        <div class="customer-access">Available to all customers</div>
        <div class="price-row"><span>${esc(money(p.price))}</span>${p.comparePrice?.amount?`<span class="old-price">${esc(money(p.comparePrice))}</span>`:""}</div>
        ${p.inStock===false?`<div class="stock-note">Currently unavailable</div>`:""}
      </button>
    </div>
  </article>`;
}
function renderHomeProducts(){
  const rows=[...PRODUCTS].sort((a,b)=>Number(b.recommendationScore||0)-Number(a.recommendationScore||0)).slice(0,8);
  $("homeProductGrid").innerHTML=rows.length?rows.map(productCard).join(""):`<div class="empty-state">Products will appear here when they become available.</div>`;
}
function renderShop(){
  const rows=filtered(),shown=rows.slice(0,VISIBLE_LIMIT);
  $("categoryTitle").textContent=ACTIVE||($("query").value.trim()?`Search results`:"All products");
  $("categoryDescription").textContent=ACTIVE?`Browse ${ACTIVE} products.`:$("query").value.trim()?`Results for “${$("query").value.trim()}”.`:"Browse all products available from SKANDI The Store.";
  $("shopBreadcrumb").textContent=ACTIVE||"Shop";
  $("productGrid").innerHTML=shown.length?shown.map(productCard).join(""):`<div class="empty-state">No products match the selected filters.<div class="shop-empty-actions"><button class="cta ghost" data-clear-shop>Clear filters</button></div></div>`;
  $("productCount").textContent=`${rows.length} product${rows.length===1?"":"s"}`;
  $("loadMoreBtn").classList.toggle("hidden",shown.length>=rows.length||rows.length===0);
  document.querySelectorAll('[data-filter="stock"]').forEach(b=>b.classList.toggle("active",FILTERS.stock));
  document.querySelectorAll('[data-filter="sale"]').forEach(b=>b.classList.toggle("active",FILTERS.sale));
  if(PRODUCTS.length)status("");
}
function productOptions(p,scope="productPageOptions"){
  return (p.options||[]).map(o=>`<div class="option-row"><label>${esc(o.name)}</label><select data-option="${esc(o.name)}" data-option-scope="${scope}">${(o.choices||[]).map(c=>`<option value="${esc(c.value||c.description||c)}">${esc(c.description||c.value||c)}</option>`).join("")}</select></div>`).join("");
}
function selectedChoices(scope){
  const out={};
  document.querySelectorAll(`[data-option-scope="${scope}"]`).forEach(s=>out[s.dataset.option]=s.value);
  return out;
}
function renderProductPage(id){
  const p=PRODUCTS.find(x=>String(x.id)===String(id));
  const host=$("productPageContent");
  if(!p){
    ACTIVE_PRODUCT=null;
    host.innerHTML=`<div class="not-found"><h1>Product unavailable</h1><p>This product could not be found in the current store response.</p><button class="cta navy" data-route="shop">Return to products</button></div>`;
    $("relatedSection").classList.add("hidden");
    $("productBreadcrumb").textContent="Product unavailable";
    return;
  }
  ACTIVE_PRODUCT=p;
  $("relatedSection").classList.remove("hidden");
  $("productBreadcrumb").textContent=p.name||"Product";
  const disabled=p.inStock===false||p.canAddToCart===false;
  host.innerHTML=`<div class="product-page">
    <div class="product-gallery-main">${imageTagForProduct(p,p.name||"Product")}${p.imageUrl?"":"SKANDI"}${p.ribbon?`<span class="product-ribbon">${esc(p.ribbon)}</span>`:""}</div>
    <div class="product-page-info">
      <div class="product-page-kicker">${esc(productBrand(p))}</div>
      <h1 class="product-page-title">${esc(p.name||"Product")}</h1>
      <div class="product-page-price">${esc(money(p.price))}${p.comparePrice?.amount?` <span class="old-price">${esc(money(p.comparePrice))}</span>`:""}</div>
      <p class="product-page-description">${esc(p.description||p.summary||"")}</p>
      <div id="productPageOptions">${productOptions(p)}</div>
      <div class="option-row"><label for="productPageQty">Quantity</label><input id="productPageQty" type="number" min="1" value="1"></div>
      <div class="product-page-actions">
        <button class="cta navy" data-product-add="${esc(p.id)}" ${disabled?"disabled":""}>${p.canAddToCart===false?(p.accessLabel||"Unavailable"):p.inStock===false?"Sold out":"Add to bag"}</button>
        <button class="icon-square" data-save="${esc(p.id)}" aria-label="Save product">${SAVED.has(String(p.id))?"♥":"♡"}</button>
      </div>
      <div class="product-page-meta">
        <div><small>Availability</small><strong>${p.inStock===false?"Currently unavailable":"In stock"}</strong></div>
        <div><small>Product code</small><strong>${esc(p.sku||p.id||"—")}</strong></div>
      </div>
      <div class="accordion">
        <details open><summary>Product details</summary><p>${esc(p.description||"Product details are currently unavailable.")}</p></details>
        <details><summary>Delivery and returns</summary><p>Available shipping, pickup and return options are shown during checkout and in your order details.</p></details>
        <details><summary>SKANDI recommendation</summary><p>${esc(p.recommendation||"Recommended for SKANDI travelers.")}</p></details>
      </div>
    </div>
  </div>`;
  const categories=(p.categoryNames||[]).map(String);
  const related=PRODUCTS.filter(x=>String(x.id)!==String(p.id)&&((x.categoryNames||[]).some(c=>categories.includes(String(c))))).slice(0,4);
  $("relatedProductGrid").innerHTML=(related.length?related:PRODUCTS.filter(x=>String(x.id)!==String(p.id)).slice(0,4)).map(productCard).join("");
}
function renderSavedPage(){
  const items=PRODUCTS.filter(p=>SAVED.has(String(p.id)));
  $("savedPageGrid").innerHTML=items.length?items.map(productCard).join(""):`<div class="empty-state">You have not saved any products yet.<div class="shop-empty-actions"><button class="cta navy" data-route="shop">Browse products</button></div></div>`;
}
function renderBagPage(){
  const items=CART.lineItems||[];
  $("bagCount").textContent=String(bagCount());
  $("bagItemCount").textContent=String(bagCount());
  $("bagPageItems").innerHTML=items.length?items.map(item=>`<article class="bag-page-item">
    <div class="bag-page-thumb">${imageTag(item.imageUrl,item.name||"Product")}</div>
    <div class="bag-page-copy"><strong>${esc(item.name||"Product")}</strong><span>Quantity ${esc(item.quantity||1)}</span><span>${esc(item.optionsLabel||"")}</span></div>
    <div class="bag-page-price">${esc(item.priceLabel||"")}</div>
  </article>`).join(""):`<div class="empty-state">Your shopping bag is empty.<div class="shop-empty-actions"><button class="cta navy" data-route="shop">Start shopping</button></div></div>`;
  $("bagTotal").textContent=CART.totalLabel||"—";
  $("checkoutBtn").disabled=items.length===0;
}
function renderOrdersPage(){
  }
function renderHeroAndCampaigns(){
  const defaults=[
    {title:"Travel smarter",body:"Airport, cabin and destination essentials selected for SKANDI journeys.",kicker:"For the journey"},
    {title:"SKANDI collection",body:"Branded pieces created for every SKANDI traveler.",kicker:"SKANDI",category:"SKANDI"},
    {title:"Destination ready",body:"Useful additions for beach, city and long-haul travel.",kicker:"Selected for you"}
  ];
  const source=BANNERS.length?BANNERS:defaults;
  const hero=source.find(x=>x.placement==="hero"||x.isHero)||source[0];
  if(hero){
    $("heroTitle").textContent=hero.title||"Everything for the journey";
    $("heroText").textContent=hero.body||hero.subtitle||"Travel-ready essentials available to every SKANDI customer.";
    if(hero.imageUrl)$("heroBanner").style.backgroundImage=`url('${esc(hero.imageUrl)}')`;
  }
  const campaigns=[...source.filter(x=>x!==hero),...TRAVEL_CARDS,...defaults].slice(0,3);
  $("bannerRow").innerHTML=campaigns.map(x=>`<article class="campaign-card ${x.imageUrl?"":"no-image"}" style="${imageStyle(x.imageUrl)}"><div class="campaign-copy"><small>${esc(x.kicker||x.category||"SKANDI The Store")}</small><h3>${esc(x.title||"Selected for your journey")}</h3><p>${esc(x.body||x.subtitle||x.description||"Discover products chosen for SKANDI travelers.")}</p>${x.linkUrl?`<button class="cta white" data-open-path="${esc(x.linkUrl)}">Explore</button>`:`<button class="cta white" data-category="${esc(x.category||x.kicker||"")}">Explore</button>`}</div></article>`).join("");
}
function renderTravelCards(){
  const cards=subcategoryRecords().slice(0,3).map(category=>{
    const product=productForCategory(category.name);
    return {
      eyebrow:category.resolvedParentName,
      title:category.name,
      description:category.description||`Explore products in ${category.name}.`,
      imageUrl:category.imageUrl||product?.imageUrl||"",
      category:category.name
    };
  });
  $("travelCards").innerHTML=cards.length?cards.map(card=>`<article class="editorial-card" style="${imageStyle(card.imageUrl)}"><div class="editorial-content"><small>${esc(card.eyebrow)}</small><h3>${esc(card.title)}</h3><p>${esc(card.description)}</p><button class="cta white" data-category="${esc(card.category)}">Shop products</button></div></article>`).join(""):`<div class="empty-state" style="grid-column:1/-1">Travel inspiration will appear when store subcategories are available.</div>`;
}
function renderHeaderCounts(){
  $("savedCount").textContent=String(SAVED.size);
  $("bagCount").textContent=String(bagCount());
}
function addToCart(id,qty=1,choices={}){
  const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;
  if(p.canAddToCart===false||p.inStock===false){toast(p.accessMessage||"This product is currently unavailable.");return}
  toast("Adding to bag…");
  post("STOREFRONT_ADD_TO_CART",{productId:id,quantity:Number(qty||1),choices});
}
function toggleCategoryMenu(){
  const el=$("categoryMenu"),show=!el.classList.contains("show");
  el.classList.toggle("show",show);el.setAttribute("aria-hidden",String(!show));
}
function openOrders(){
  toast("Opening your orders…");
  post("STOREFRONT_ORDERS",{});
}
function refresh(){
  toast("Refreshing store…");status("Refreshing store…");post("STOREFRONT_REFRESH",{});
}
function clearShop(){
  ACTIVE="";FILTERS={stock:false,sale:false};$("query").value="";$("sort").value="recommended";VISIBLE_LIMIT=12;
  navigate("shop",{},true);
}

const supportSubCategories={
  order_management:["Order status","Order confirmation not received","Change delivery address before dispatch","Change or cancel order","Duplicate order","Pre-order or backorder","Invoice, receipt or tax document","Order split into multiple shipments"],
  shipping_delivery:["Tracking not updating","Delivery delayed","Marked delivered but not received","Parcel lost","Partial delivery or missing package","Damaged parcel","Wrong delivery address","Shipping method or charge","International delivery, customs or duties","Pickup or collection issue"],
  returns_exchanges:["Start a return","Return eligibility","Return label","Return shipping issue","Exchange size, color or product","Return received but no update","Return rejected","Final sale or non-returnable item","Gift return"],
  refunds_credits:["Refund status","Refund amount incorrect","Refund to original payment method","Refund to gift card or store credit","Partial refund","Bank dispute or chargeback","Store credit balance"],
  payments_checkout:["Payment declined","Payment pending","Charged but order not created","Duplicate charge","Incorrect amount charged","Split payment issue","Gift card payment issue","Tax calculation issue","Currency or conversion question","Checkout error","Fraud or identity verification"],
  product_information:["Product information","Size, fit or dimensions","Compatibility question","Materials or care instructions","Stock or restock question","Personalization or customization","Price discrepancy","Product image or description mismatch"],
  damaged_wrong_missing:["Damaged item","Defective or not working","Wrong item received","Missing item","Missing component or accessory","Quality concern","Packaging damage"],
  warranty_repairs:["Warranty eligibility","Warranty claim","Repair request","Replacement request","Spare part request","Care instructions","Manufacturer support"],
  promotions_gift_cards:["Promo code not working","Promotion eligibility","Discount missing","Gift card purchase","Gift card delivery","Gift card balance","Gift card redemption","SKANDI Club reward issue","Price promotion question"],
  account_security:["Sign-in issue","Password reset","Change email or phone number","Address book issue","Order history missing","Suspicious account activity","Account locked","Close account"],
  privacy_data:["Access my personal data","Correct my personal data","Delete my personal data","Marketing preferences","Cookie or privacy question","Payment or security concern"],
  technical_accessibility:["Website error","Product page issue","Shopping bag issue","Checkout issue","Mobile display issue","Browser compatibility","Accessibility support","Email or SMS notification issue"],
  business_bulk:["Corporate order","Bulk quantity request","Wholesale inquiry","Tax-exempt purchase","Purchase order","Custom branding","Business invoice"],
  feedback_other:["General inquiry","Complaint","Product or service feedback","Compliment","Partnership inquiry","Other request"]
};
function supportValue(id){return String($(id)?.value||"").trim()}
function setSupportStatus(message,mode=""){
  const node=$("supportStatus");if(!node)return;
  node.textContent=message||"";node.className=message?`support-status show ${mode}`:"support-status";
}
function setSupportRequired(ids,required){ids.forEach(id=>{const el=$(id);if(!el)return;required?el.setAttribute("required",""):el.removeAttribute("required")})}
function toggleSupportOrderFields(){
  const show=supportValue("hasOrder")==="yes";
  $("orderFields")?.classList.toggle("show",show);
  setSupportRequired(["orderNumber"],show);
}
function updateSupportCategory(preferred=""){
  const category=supportValue("caseCategory"),select=$("caseSubCategory");if(!select)return;
  select.innerHTML='<option value="">Select specific topic</option>';
  (supportSubCategories[category]||[]).forEach(topic=>{const option=document.createElement("option");option.value=topic;option.textContent=topic;select.appendChild(option)});
  if(preferred&&[...select.options].some(option=>option.value===preferred))select.value=preferred;

  const moduleIds=["shippingDetailsModule","returnDetailsModule","paymentDetailsModule","productDetailsModule","promotionDetailsModule","technicalDetailsModule","businessDetailsModule"];
  moduleIds.forEach(id=>$(id)?.classList.remove("show"));
  setSupportRequired(["productName","companyName","bulkQuantity"],false);

  const showShipping=["shipping_delivery","order_management"].includes(category);
  const showReturn=["returns_exchanges","refunds_credits","damaged_wrong_missing","warranty_repairs"].includes(category);
  const showPayment=["payments_checkout","refunds_credits"].includes(category);
  const showProduct=["product_information","damaged_wrong_missing","warranty_repairs","returns_exchanges"].includes(category);
  const showPromotion=category==="promotions_gift_cards";
  const showTechnical=category==="technical_accessibility";
  const showBusiness=category==="business_bulk";

  $("shippingDetailsModule")?.classList.toggle("show",showShipping);
  $("returnDetailsModule")?.classList.toggle("show",showReturn);
  $("paymentDetailsModule")?.classList.toggle("show",showPayment);
  $("productDetailsModule")?.classList.toggle("show",showProduct);
  $("promotionDetailsModule")?.classList.toggle("show",showPromotion);
  $("technicalDetailsModule")?.classList.toggle("show",showTechnical);
  $("businessDetailsModule")?.classList.toggle("show",showBusiness);

  setSupportRequired(["productName"],showProduct);
  setSupportRequired(["companyName","bulkQuantity"],showBusiness);
}
function supportFiles(){return Array.from($("fileInput")?.files||[]).slice(0,3)}
function validateSupportFiles(files=supportFiles()){
  const allowed=new Set(["application/pdf","image/jpeg","image/png"]),total=files.reduce((sum,file)=>sum+Number(file.size||0),0);
  if(files.length>3)return"Choose no more than 3 files.";
  if(files.some(file=>!allowed.has(file.type)&&!/\.(pdf|jpe?g|png)$/i.test(file.name)))return"Only PDF, JPG and PNG files are accepted.";
  if(total>10*1024*1024)return"The selected files exceed the 10 MB total limit.";
  return"";
}
function renderSupportFiles(){
  const files=supportFiles(),error=validateSupportFiles(files),summary=$("fileSummary");if(!summary)return;
  summary.innerHTML=error?`<span style="color:var(--danger)">${esc(error)}</span>`:files.length?files.map(file=>`<span>${esc(file.name)} · ${(file.size/1024/1024).toFixed(2)} MB</span>`).join(""):"";
}
function focusSupportForm(category="",subcategory=""){
  navigate("support");
  setTimeout(()=>{
    if(category){$("caseCategory").value=category;updateSupportCategory(subcategory)}
    $("supportFormCard")?.scrollIntoView({behavior:"smooth",block:"start"});
    $("caseSubject")?.focus({preventScroll:true});
  },50);
}
function filterSupportTopics(){
  const query=supportValue("supportSearchInput").toLowerCase();let visible=0;
  document.querySelectorAll("[data-support-topic]").forEach(button=>{const show=!query||button.textContent.toLowerCase().includes(query)||String(button.dataset.supportCategory||"").includes(query)||String(button.dataset.supportSubcategory||"").toLowerCase().includes(query);button.classList.toggle("hidden",!show);if(show)visible++});
  $("supportNoResults")?.style.setProperty("display",visible?"none":"block");
}
function submitSupportRequest(event){
  event.preventDefault();const form=$("publicSupportForm");if(!form)return;
  if(!form.checkValidity()){form.reportValidity();return}
  const fileError=validateSupportFiles();if(fileError){setSupportStatus(fileError,"error");return}
  $("submitBtn").disabled=true;setSupportStatus("Submitting your request…");$("supportConfirmation")?.classList.remove("show");
  const firstName=supportValue("firstName"),lastName=supportValue("lastName");
  supportPost("PUBLIC_SUPPORT_CREATE_CASE",{
    firstName,lastName,fullName:`${firstName} ${lastName}`.trim(),email:supportValue("email"),phone:`${supportValue("phonePrefix")} ${supportValue("phone")}`.trim(),countryOfResidence:supportValue("countryOfResidence"),preferredContact:supportValue("preferredContact"),
    hasOrder:supportValue("hasOrder"),purchaseChannel:supportValue("purchaseChannel"),orderNumber:supportValue("orderNumber"),orderEmail:supportValue("orderEmail"),orderDate:supportValue("orderDate"),orderTotal:supportValue("orderTotal"),
    category:supportValue("caseCategory"),subCategory:supportValue("caseSubCategory"),subject:supportValue("caseSubject"),message:supportValue("caseDescription"),
    carrier:supportValue("carrierName"),trackingNumber:supportValue("trackingNumber"),expectedDeliveryDate:supportValue("expectedDeliveryDate"),deliveryPostcode:supportValue("deliveryPostcode"),
    returnNumber:supportValue("returnNumber"),returnSentDate:supportValue("returnSentDate"),itemCondition:supportValue("itemCondition"),requestedResolution:supportValue("requestedResolution"),
    paymentMethod:supportValue("paymentMethod"),transactionDate:supportValue("transactionDate"),transactionAmount:supportValue("transactionAmount"),paymentLast4:supportValue("paymentLast4"),paymentError:supportValue("paymentError"),
    productName:supportValue("productName"),productSku:supportValue("productSku"),productQuantity:supportValue("productQuantity"),dateReceived:supportValue("dateReceived"),
    promotionCode:supportValue("promotionCode"),promotionName:supportValue("promotionName"),giftCardLast4:supportValue("giftCardLast4"),expectedDiscount:supportValue("expectedDiscount"),
    deviceType:supportValue("deviceType"),browser:supportValue("browserName"),pageUrl:supportValue("pageUrl"),technicalError:supportValue("technicalError"),
    companyName:supportValue("companyName"),companyTaxId:supportValue("companyTaxId"),bulkQuantity:supportValue("bulkQuantity"),requiredByDate:supportValue("requiredByDate"),
    attachedFileNames:supportFiles().map(file=>file.name),priority:"Low",source:"store-customer-service"
  });
}
function resetSupportForm(){
  $("publicSupportForm")?.reset();toggleSupportOrderFields();updateSupportCategory();renderSupportFiles();$("submitBtn").disabled=false;
}

function handleClick(event){
  const route=event.target.closest("[data-route]");
  if(route){navigate(route.dataset.route);return}
  const category=event.target.closest("[data-category]");
  if(category){openCategory(category.dataset.category||"");return}
  const view=event.target.closest("[data-view]");
  if(view){navigate("product",{id:view.dataset.view});return}
  const add=event.target.closest("[data-add]");
  if(add){addToCart(add.dataset.add,1,{});return}
  const detailAdd=event.target.closest("[data-product-add]");
  if(detailAdd){addToCart(detailAdd.dataset.productAdd,$("productPageQty")?.value||1,selectedChoices("productPageOptions"));return}
  const save=event.target.closest("[data-save]");
  if(save){
    const id=String(save.dataset.save);
    SAVED.has(id)?SAVED.delete(id):SAVED.add(id);persistSaved();renderHeaderCounts();
    const routeNow=parseRoute();
    if(routeNow.page==="home")renderHomeProducts();
    if(routeNow.page==="shop")renderShop();
    if(routeNow.page==="product")renderProductPage(decodeURIComponent(routeNow.id||""));
    if(routeNow.page==="saved")renderSavedPage();
    toast(SAVED.has(id)?"Product saved":"Product removed from saved list");return;
  }
  const supportTopic=event.target.closest("[data-support-topic]");
  if(supportTopic){focusSupportForm(supportTopic.dataset.supportCategory||"",supportTopic.dataset.supportSubcategory||"");return}
  const supportPrefill=event.target.closest("[data-support-prefill]");
  if(supportPrefill){focusSupportForm(supportPrefill.dataset.supportPrefill||"");return}
  if(event.target.closest("[data-support-form]")){focusSupportForm();return}
  const path=event.target.closest("[data-open-path]");
  if(path){post("STOREFRONT_NAVIGATE",{path:path.dataset.openPath});return}
  const back=event.target.closest("[data-back]");
  if(back){history.length>1?history.back():navigate("shop");return}
  const clear=event.target.closest("[data-clear-shop]");
  if(clear){clearShop();return}
  const close=event.target.closest("[data-close]");
  if(close?.dataset.close==="mobile"){closeMenus();return}
}
document.addEventListener("click",handleClick);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenus()});
window.addEventListener("hashchange",applyRoute);

$("query").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();navigate("shop",currentShopParams({q:$("query").value.trim()}))}
});
$("query").addEventListener("input",()=>{
  if(parseRoute().page==="shop"){VISIBLE_LIMIT=12;renderShop()}
});
$("sort").addEventListener("change",()=>{VISIBLE_LIMIT=12;renderShop()});
$("searchBtn").onclick=()=>{$("query").focus();window.scrollTo({top:0,behavior:"smooth"})};
$("categoriesBtn").onclick=toggleCategoryMenu;
$("shopCategoriesBtn").onclick=toggleCategoryMenu;
$("footerCategoriesBtn").onclick=toggleCategoryMenu;
$("mobileCategoriesBtn").onclick=()=>{closeMenus();navigate("home");setTimeout(()=>$("popularCategories")?.scrollIntoView({behavior:"smooth"}),40)};
$("bagBtn").onclick=()=>navigate("bag");
$("savedBtn").onclick=()=>navigate("saved");
$("ordersBtn").onclick=()=>{navigate("orders");openOrders()};
$("ordersPageBtn").onclick=openOrders;
$("refreshStoreBtn").onclick=refresh;
$("checkoutBtn").onclick=()=>{toast("Opening checkout…");post("STOREFRONT_CHECKOUT",{})};
$("mobileMenuBtn").onclick=()=>{$("mobileNav").classList.add("show");$("mobileNav").setAttribute("aria-hidden","false");document.body.classList.add("locked")};
$("loadMoreBtn").onclick=()=>{VISIBLE_LIMIT+=12;renderShop()};
$("clearFiltersBtn").onclick=clearShop;
document.querySelectorAll('[data-filter="stock"]').forEach(btn=>btn.onclick=()=>{FILTERS.stock=!FILTERS.stock;VISIBLE_LIMIT=12;navigate("shop",currentShopParams(),true)});
document.querySelectorAll('[data-filter="sale"]').forEach(btn=>btn.onclick=()=>{FILTERS.sale=!FILTERS.sale;VISIBLE_LIMIT=12;navigate("shop",currentShopParams(),true)});
document.querySelectorAll('[data-filter="category"]').forEach(btn=>btn.onclick=toggleCategoryMenu);

$("hasOrder")?.addEventListener("change",toggleSupportOrderFields);
$("caseCategory")?.addEventListener("change",()=>updateSupportCategory());
$("publicSupportForm")?.addEventListener("submit",submitSupportRequest);
$("supportSearchInput")?.addEventListener("input",filterSupportTopics);
$("supportSearchInput")?.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();filterSupportTopics()}});
$("supportSearchBtn")?.addEventListener("click",filterSupportTopics);
$("fileInput")?.addEventListener("change",renderSupportFiles);
$("supportFileDrop")?.addEventListener("click",()=>$("fileInput")?.click());
$("supportFileDrop")?.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();$("fileInput")?.click()}});
["dragenter","dragover"].forEach(type=>$("supportFileDrop")?.addEventListener(type,event=>{event.preventDefault();$("supportFileDrop").classList.add("dragging")}));
["dragleave","drop"].forEach(type=>$("supportFileDrop")?.addEventListener(type,event=>{event.preventDefault();$("supportFileDrop").classList.remove("dragging")}));
$("supportFileDrop")?.addEventListener("drop",event=>{const transfer=new DataTransfer();Array.from(event.dataTransfer?.files||[]).slice(0,3).forEach(file=>transfer.items.add(file));if($("fileInput"))$("fileInput").files=transfer.files;renderSupportFiles()});
toggleSupportOrderFields();updateSupportCategory();renderSupportFiles();


document.addEventListener("error",event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement))return;
  const parent=image.parentElement;
  image.remove();
  if(parent?.classList.contains("product-media")&&!parent.querySelector(".product-placeholder")){
    parent.insertAdjacentHTML("afterbegin",'<span class="product-placeholder">SKANDI</span>');
  }
},true);

window.addEventListener("message",event=>{
  const message=event.data||{};if(message.source&&message.source!==PARENT_SOURCE)return;
  const payload=message.payload||{};

  if(message.type==="SKANDI_MASTER_CONFIG"){
    MASTER_CONFIG_STATE=payload&&typeof payload==="object"?payload:{};
    renderMasterBranding();
    return;
  }

  if(message.type==="STOREFRONT_PARENT_READY"){
    console.log("[SKANDI Storefront] Wix parent bridge ready.",payload);
    requestStorefront("parent-ready");
    return;
  }

  if(message.type==="STOREFRONT_PRODUCTS"){
    STOREFRONT_CONNECTED=true;
    clearTimeout(STOREFRONT_RETRY_TIMER);
    PRODUCTS=(payload.products||[]).map(normalizeProductImage);
    CATEGORIES=payload.categories||[];
    BANNERS=payload.banners||[];
    TRAVEL_CARDS=payload.travelCards||[];

    console.log("[SKANDI Storefront] Wix products received:", {
      products: PRODUCTS.length,
      categories: CATEGORIES.length,
      meta: payload.meta || {},
      imageCheck: PRODUCTS.slice(0,3).map(p=>({
        name:p.name,
        imageUrl:p.imageUrl,
        imageCandidates:p.imageCandidates
      }))
    });

    renderHeroAndCampaigns();
    renderTravelCards();
    renderCategories();
    renderHomeProducts();
    renderHeaderCounts();
    applyRoute();

    status(
      PRODUCTS.length
        ? `${PRODUCTS.length} products loaded from Wix Stores.`
        : "Wix Stores returned 0 visible products.",
      PRODUCTS.length ? "ok" : "warn"
    );
    return;
  }
  if(message.type==="STOREFRONT_CART"){
    CART=payload.cart||{};renderHeaderCounts();
    if(parseRoute().page==="bag")renderBagPage();
    return;
  }
  if(message.type==="PUBLIC_SUPPORT_CASE_CREATED"){
    const reference=payload.caseNumber||payload.ticketNumber||payload.reference||payload.id||payload.caseId||"";
    setSupportStatus("","");
    $("supportConfirmationTitle").textContent=reference?`Request ${reference} submitted`:"Request submitted";
    $("supportConfirmationText").textContent="SKANDI Support will follow up using the email address you provided.";
    $("supportConfirmation").classList.add("show");
    resetSupportForm();$("supportConfirmation")?.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  if(message.type==="PUBLIC_SUPPORT_ERROR"){
    setSupportStatus(payload.message||"Support request failed. Please review the form and try again.","error");$("submitBtn").disabled=false;return;
  }
  if(message.type==="STOREFRONT_PROGRESS"){status(payload.message||"Working…");toast(payload.message||"Working…");return}
  if(message.type==="STOREFRONT_ERROR"){
    console.error("[SKANDI Storefront] Parent error:",payload);
    status(payload.message||"Store action failed.","error");
    toast(payload.message||"Store action failed.");
    return
  }
});

$("footerYear").textContent=String(new Date().getFullYear());
post("MASTER_CONFIG_REQUEST",{context:"the-store"});
renderHeroAndCampaigns();renderTravelCards();renderCategories();renderHomeProducts();renderHeaderCounts();
if(!location.hash)history.replaceState(null,"","#/home");
applyRoute();
requestStorefront("initial");
})();
</script>
</body>
</html>
```
