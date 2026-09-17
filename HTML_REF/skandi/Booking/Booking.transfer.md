# Home

STATUS: NEEDS REVIEW
SLUG: /booking/transfer
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #bookingExtrasEmbed
LAST SYNCED: 2026-09-16

## HOW TO USE
***STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".***

###  COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:045PM "Page is ready styled from my end, page not syncing correctly yet /Samuel"
2.
3.
...
***END*** 

#### LIVE HTML

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI Extras</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --sk-blue:#022e64;--sk-blue-soft:#285ca8;--sk-light:#d7e6ff;--sk-pale:#f6faff;
  --sk-bg:#f7faff;--sk-border:#dbe3ef;--sk-text:#111;--sk-muted:#667085;
  --sk-cyan:#5FC7CF;--sk-ok:#087443;--sk-warn:#a15c00;--sk-danger:#b42318;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);--sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-height:100%;font-family:"Montserrat",system-ui,sans-serif;color:var(--sk-text);background:#fff;overflow-x:hidden;}
button,input{font-family:inherit}

@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes skSpin {0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}

.sk-page-loader { position: fixed; inset: 0; background: rgba(2, 46, 100, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 999999; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.25s ease; }
.sk-page-loader.active { display: flex; opacity: 1; }
.sk-page-loader-box { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); padding: 22px 30px; border-radius: 20px; box-shadow: 0 24px 60px rgba(2, 46, 100, 0.25); display: flex; align-items: center; gap: 16px; font-weight: 800; color: var(--sk-blue); font-size: 13px; letter-spacing: 0.02em; border: 1px solid rgba(255, 255, 255, 0.8); }
.sk-page-loader-spinner { width: 24px; height: 24px; border: 3px solid #dbe3ef; border-top-color: var(--sk-cyan); border-radius: 50%; animation: skSpin 0.7s linear infinite; }

.sk-wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 16%; }
.sk-step { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sk-step-circle { width: 30px; height: 30px; border-radius: 50%; background: #fff; border: 2px solid var(--sk-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--sk-muted); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.sk-step-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--sk-muted); transition: color 0.3s ease; }
.sk-step.completed .sk-step-circle { background: var(--sk-blue); border-color: var(--sk-blue); color: #fff; }
.sk-step.completed .sk-step-label { color: var(--sk-blue); }
.sk-step.active .sk-step-circle { border-color: var(--sk-cyan); color: var(--sk-blue); box-shadow: 0 0 0 4px rgba(95,199,207,0.2); }
.sk-step.active .sk-step-label { color: var(--sk-blue); }
.sk-step-circle svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }

.sk-hero{background:linear-gradient(135deg,var(--sk-light),var(--sk-pale));border:1px solid var(--sk-border);border-radius:24px;box-shadow:var(--sk-shadow);padding:40px;margin-bottom:32px}
.sk-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:var(--sk-cyan);margin-bottom:8px}
h1{color:var(--sk-blue);font-size:clamp(32px,5vw,46px);line-height:.96;letter-spacing:-.04em;margin:0 0 12px;font-weight:800}
h2{color:var(--sk-blue);margin:0 0 6px;font-weight:800}
p{color:#475467;line-height:1.6;font-size:14px;margin:0;font-weight:500}

.sk-status{display:none;border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin:14px 0 24px;color:var(--sk-muted);font-size:13px;font-weight:700}
.sk-status.show{display:block; animation:fadeUp 0.4s ease forwards;}
.sk-status.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.sk-status.warn{background:#fff7ed;color:var(--sk-warn);border-color:#fed7aa}
.sk-status.error{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}

.sk-extra-card{background:#fff;border:1px solid var(--sk-border);border-radius:20px;box-shadow:var(--sk-shadow);padding:24px;margin-bottom:16px;display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center;transition:all 0.3s cubic-bezier(0.16,1,0.3,1); animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; opacity:0; cursor:pointer;}
.sk-extra-card:hover{box-shadow:var(--sk-shadow-strong); border-color:var(--sk-cyan);}
.sk-extra-card.checked { border-color:var(--sk-blue); background:var(--sk-bg); }
.sk-extra-card input{width:22px;height:22px;accent-color:var(--sk-blue); cursor:pointer;}
.sk-price{font-weight:900;color:var(--sk-blue);font-size:22px}

.sk-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;justify-content:flex-end}
.sk-btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;padding:16px 28px;font-weight:800;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(2,46,100,.15);transition:all .25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;}
.sk-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 26px rgba(2,46,100,.25)}
.sk-btn::after {content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.25) 50%,rgba(255,255,255,0) 100%);transform:skewX(-25deg);transition:all 0.6s ease;}
.sk-btn:hover::after {left:150%;}
.sk-btn.secondary{background:#fff;color:var(--sk-blue);border:1px solid var(--sk-border);box-shadow:0 4px 12px rgba(0,0,0,.04)}
.sk-btn.secondary:hover{border-color:var(--sk-cyan);color:var(--sk-cyan)}

@media(max-width:860px){
  .sk-extra-card{grid-template-columns:auto 1fr; gap:16px; padding:20px;}
  .sk-extra-card .sk-price{grid-column:2; font-size:18px;}
  .sk-wrap{padding:24px 16px 60px}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
  .sk-actions { justify-content: stretch; }
  .sk-btn{width:100%;}
}
</style>
</head>
<body>
<div id="pageLoader" class="sk-page-loader">
  <div class="sk-page-loader-box">
    <div class="sk-page-loader-spinner"></div>
    <span>Saving extras...</span>
  </div>
</div>

<div class="sk-wrap">
  <div class="sk-stepper-container">
    <div class="sk-stepper-track"></div>
    <div class="sk-stepper-progress" style="width: 16%;"></div>
    
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Offer</div>
    </div>
    <div class="sk-step active">
      <div class="sk-step-circle">2</div>
      <div class="sk-step-label">Extras</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">3</div>
      <div class="sk-step-label">Transfer</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">4</div>
      <div class="sk-step-label">Travelers</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">5</div>
      <div class="sk-step-label">Seats</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">6</div>
      <div class="sk-step-label">Payment</div>
    </div>
    <div class="sk-step">
      <div class="sk-step-circle">7</div>
      <div class="sk-step-label">Done</div>
    </div>
  </div>

  <section class="sk-hero">
    <div class="sk-kicker">Make it yours</div>
    <h1>Add extras</h1>
    <p>Choose available SKANDI and supplier services for this booking. Prices shown here are added to the final revalidated total.</p>
  </section>

  <div id="status" class="sk-status show">Loading extras...</div>
  <section id="root"></section>
</div>

<script>
const SOURCE="SKANDI_BOOKING_EXTRAS",PARENT="SKANDI_WIX_PARENT";let EXTRAS=[],SELECTED=new Set();
const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function money(p){const n=Number(p?.amount??p?.total);return Number.isFinite(n)&&n>0?`${esc(p?.currency||"")} ${n.toFixed(2)}`:"Included"}
function status(m,c=""){const e=$("status");e.textContent=m;e.className="sk-status show "+c}

function showPageLoader(show = true) {
  const loader = document.getElementById("pageLoader");
  if (loader) { if (show) loader.classList.add("active"); else loader.classList.remove("active"); }
}

function render(payload){
  EXTRAS=payload.extras||[];SELECTED=new Set((payload.selectedExtras||[]).map(x=>String(x.id||x.publicId||x.code||"")));
  status(EXTRAS.length?"Extras available.":"No optional extras are currently available for this booking.",EXTRAS.length?"ok":"warn");
  
  $("root").innerHTML=`
    ${EXTRAS.map((x,i)=>{
      const isChecked = SELECTED.has(String(x.id||""));
      const delay = 0.1 + (i * 0.1);
      return `
        <article class="sk-extra-card ${isChecked ? "checked" : ""}" data-card="${i}" style="animation-delay:${delay}s">
          <input type="checkbox" data-i="${i}" ${isChecked?"checked":""}>
          <div>
            <h2>${esc(x.title||"Extra")}</h2>
            <p>${esc(x.description||"Optional travel service.")}</p>
          </div>
          <div class="sk-price">${money(x.price)}</div>
        </article>
      `
    }).join("")||`<article class="sk-card" style="text-align:center; padding:40px 20px;"><h2 style="color:var(--sk-blue); margin-bottom:10px;">No extras available</h2><p>You can continue without adding anything.</p></article>`}
    
    <div class="sk-actions">
      <button class="sk-btn secondary" id="back">← Back to offer</button>
      <button class="sk-btn" id="continue">Continue to transfer →</button>
    </div>`;
    
  // Card click delegates to checkbox
  document.querySelectorAll("[data-card]").forEach(card => {
    card.onclick = (e) => {
      if(e.target.tagName !== "INPUT") {
        const cb = card.querySelector("input");
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      }
    };
  });
  
  document.querySelectorAll("[data-i]").forEach(cb=>{
    cb.onchange=()=>{
      const x=EXTRAS[Number(cb.dataset.i)];
      const id=String(x.id||"");
      const card = cb.closest(".sk-extra-card");
      if(cb.checked){ SELECTED.add(id); card.classList.add("checked"); }
      else { SELECTED.delete(id); card.classList.remove("checked"); }
    }
  });
  
  $("continue").onclick=()=>{
    showPageLoader(true);
    post("BOOKING_EXTRAS_SAVE",{selectedExtras:EXTRAS.filter(x=>SELECTED.has(String(x.id||"")))});
    setTimeout(()=>showPageLoader(false), 3000);
  };
  $("back").onclick=()=>{
    showPageLoader(true);
    post("BOOKING_NAVIGATE",{path:"/booking/offer"});
    setTimeout(()=>showPageLoader(false), 3000);
  };
}

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="BOOKING_EXTRAS_LOADED")render(m.payload);
  if(m.type==="BOOKING_ERROR") { showPageLoader(false); status(m.message||"Could not load extras.","error"); }
});
post("BOOKING_EXTRAS_READY");
</script>
</body>
</html>
