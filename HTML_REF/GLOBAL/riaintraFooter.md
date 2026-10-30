# RIAINTRA GLOBAL FOOTER

STATUS: V12 SYNC PREPARED — REQUIRES LIVE TEST
ROUTE SCOPE: `/riaintra/` excluding the RIAINTRA login page by existing Wix/masterPage visibility rules
WIX PARENT: `/src/pages/masterPage.js`
MESSAGE SOURCE: `SKANDI_RIAINTRA_FOOTER`
LAST SYNCED: 2026-10-30

## INFO
- Existing footer config links are preserved.
- `Legal & Policies` is appended once and derives its route from `MASTER_CONFIG.routes.legalInternal`, falling back to `/riaintra/success-factors/legal-internal`.
- Footer navigation continues through the existing `MASTER_NAVIGATE` parent contract.
- STATICALLY VERIFIED; REQUIRES LIVE TEST after replacing the RIAINTRA footer HTML.

## CHANGE LOG
- 2026-10-30 — Removed the hardcoded Group PNG; the footer now uses the mapped riaFooter asset from masterPage.js.
- 2026-10-13 — V12 internal legal link sync prepared from the supplied RIAINTRA footer source.

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>RIAINTRA Footer</title>
<style>
* { box-sizing: border-box; }
html, body {
  margin: 0;
  font-family: "72", Inter, Arial, sans-serif;
  width: 100%;
}

footer {
  width: 100%;
  padding: 10px 24px;
  margin-top: auto;
  background: #354a5f;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.wrap {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 15px;
  justify-self: flex-start;
}

.links {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta {
  font-size: 9px;
  color: #ffffff;
}

.global-footer {
  justify-self: center;
  text-align: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.footer-right {
  justify-self: flex-end;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

#grouplogo img {
  height: 16px;
  border-radius: 0;
  object-fit: contain;
  background: transparent;
  display: block;
}

button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  padding: 5px 7px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;
}

button:hover {
  color: #ffffff;
  text-decoration: underline;
}
</style>
</head>
<body>
<footer>
  <div class="wrap">
    <div class="footer-left">
      <div id="links" class="links"></div>
      <div class="meta">RIAINTRA</div>
    </div>

    <div id="grouplogo" class="global-footer">
      <img id="riaFooterLogo" data-master-logo="riaFooter" alt="RIAINTRA" hidden>
    </div>

    <div class="footer-right">
      © 2026 SKANDI TRAVELS
    </div>
  </div>
</footer>
<script>
(()=>{
  const SOURCE="SKANDI_RIAINTRA_FOOTER",PARENT="SKANDI_WIX_PARENT";
  const LEGAL_PATH="/riaintra/success-factors/legal-internal";
  let config=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
  const post=(type,payload={})=>window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");

  function render(){
    const legalPath=String(config?.routes?.legalInternal||LEGAL_PATH);
    const links=Array.isArray(config?.internal?.footer?.links)?[...config.internal.footer.links]:[];
    if(!links.some(i=>String(i?.path||"")===legalPath)){
      links.push({label:"Legal & Policies",path:legalPath});
    }
    $("links").innerHTML=links.map(i=>"<button data-path=\""+esc(i.path)+"\">"+esc(i.label)+"</button>").join("");
    const logo=String(config?.brand?.assets?.logos?.riaFooter||"");
    const image=$("riaFooterLogo");
    if(image&&logo){image.src=logo;image.hidden=false}
  }

  document.addEventListener("click",e=>{
    const path=e.target.closest("[data-path]")?.dataset.path;
    if(path)post("MASTER_NAVIGATE",{path});
  });

  window.addEventListener("message",e=>{
    const m=e.data||{};if(m.source!==PARENT)return;
    if(m.type==="SKANDI_MASTER_CONFIG"){config=m.payload||{};render()}
  });

  post("MASTER_CONFIG_REQUEST",{context:"riaintra-footer"});
})();
</script>
</body>
</html>
```
