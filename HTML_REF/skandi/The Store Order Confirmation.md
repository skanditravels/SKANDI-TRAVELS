# The Store Order Confirmation

STATUS: IN PROGRESS  
SYSTEM AREA: SKANDI  
ROUTE: `/the-store/store-checkout/order-confirmation`  
WIX PAGE: `Order Confirmation.u5zzl`  
HTML COMPONENT: `#storeOrderConfirmationEmbed`  
VERSION: `B-011.17`  
LAST VERIFIED: 2026-09-24

## INFO / LOG

- **Source identity:** `/HTML_REF/skandi/The Store Order Confirmation.md`
- **Display name:** The Store Order Confirmation
- **Customer route (canonical site map):** `/the-store/store-checkout/order-confirmation`
- **Wix page controller:** `/src/pages/Order Confirmation.u5zzl.js`
- **Wix HTML component ID:** `#storeOrderConfirmationEmbed`
- **HTML source:** `SKANDI_STORE_CONFIRMATION`
- **Parent source:** `SKANDI_WIX_PARENT`
- **Brand source:** `masterPage.js` → `brand.assets.logos.storeHeader`, `brand.assets.logos.storeFooter`, localized `brand.slogans`.
- **Confirmation data currently available to this page:** order ID and payment status from the confirmation page query string. No product-level/order-detail backend payload is currently exposed to this page.
- **PDF behavior:** `Download Confirmation` creates a customer-downloadable PDF in the browser. The primary generator uses jsPDF; a native PDF fallback is included so the button still downloads a valid PDF if the external library is unavailable.
- **PDF scope:** the PDF deliberately contains only fields actually supplied to this confirmation page. It does not invent cart items, delivery details, taxes, customer address, card data, or fulfillment information that the current page contract does not receive.
- **Navigation hardening:** page-controller navigation now validates paths through `isSafeInternalRoute`.
- **Presentation Registry hooks:** `store-order-confirmation`, `store-confirmation-eyebrow`, `store-confirmation-h1`, `store-confirmation-copy`.
- **2026-09-24:** Initial canonical HTML_REF created from the user-supplied Store Order Confirmation HTML and upgraded to B-011.17 with masterPage branding plus downloadable PDF confirmation.

### Contract emitted by HTML

- `SKANDI_MASTER_CONFIG_REQUEST`
- `CONFIRMATION_READY`
- `CONFIRMATION_NAVIGATE`

### Contract received by HTML

- `SKANDI_MASTER_CONFIG`
- `STORE_CONFIRMATION_DATA`

### Known route mismatch outside this page

The current GitHub `Checkout.lof54.js` still hardcodes `/the-store/order-confirmation`, while `public/siteMap.js` defines the canonical Store confirmation route as `/the-store/store-checkout/order-confirmation`. This package does not rewrite the Checkout controller because that is a separate checkout-route migration; the mismatch must be resolved before declaring the complete Store checkout chain converged.

---

## COMPLETE INTENDED LIVE HTML SOURCE

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#071b44">
<title>SKANDI The Store — Order Confirmation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<style>
:root{
  --navy:#071b44;
  --navy-2:#022e64;
  --cyan:#5fc7cf;
  --ink:#101828;
  --muted:#667085;
  --line:#e5e7eb;
  --soft:#f6f8fb;
  --soft-blue:#f3f8ff;
  --white:#fff;
  --success:#087443;
  --shadow:0 16px 48px rgba(2,46,100,.09);
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#fff;color:var(--ink);font-family:Montserrat,system-ui,sans-serif}
button{font:inherit;cursor:pointer}
button:disabled{opacity:.55;cursor:not-allowed}
img{display:block;max-width:100%}

.store-confirmation-header{background:#fff;border-bottom:1px solid var(--line)}
.store-confirmation-header-inner{width:min(1240px,calc(100% - 36px));min-height:82px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}
.store-confirmation-brand{display:flex;align-items:center;gap:15px;min-width:0}
.store-confirmation-brand-logo{border:0;background:transparent;padding:0;display:flex;align-items:center}
.store-confirmation-brand-logo img{width:auto;height:58px;max-width:220px;object-fit:contain;object-position:left center}
.store-confirmation-brand-divider{width:1px;height:32px;background:#cfd5dc;flex:0 0 auto}
.store-confirmation-brand-context{color:var(--navy);font-size:11px;font-weight:800;letter-spacing:.075em;text-transform:uppercase;line-height:1.25}
.store-confirmation-brand-context span{display:block;margin-top:3px;color:#7b8798;font-size:8px;font-weight:700;letter-spacing:.10em}
.store-confirmation-return{height:38px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--navy);padding:0 15px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
.store-confirmation-return:hover{background:var(--soft)}

.wrap{width:min(840px,calc(100% - 30px));margin:0 auto;padding:58px 0 72px}
.panel{border:1px solid var(--line);border-radius:26px;padding:46px;box-shadow:var(--shadow);text-align:center;background:#fff}
.check{width:72px;height:72px;border-radius:50%;background:#e8fbf8;color:var(--navy-2);display:grid;place-items:center;margin:0 auto 22px}
.check svg{width:34px;height:34px}
.eyebrow{font-size:10px;letter-spacing:.18em;font-weight:900;color:var(--navy-2)}
h1{font-size:clamp(30px,5vw,48px);line-height:1.05;letter-spacing:-.04em;color:var(--navy-2);margin:8px 0 12px}
p{color:var(--muted);font-size:13px;line-height:1.7;margin:0 auto;max-width:600px}
.meta{margin:26px auto 0;border:1px solid var(--line);border-radius:16px;background:var(--soft);max-width:560px;text-align:left;overflow:hidden}
.row{display:flex;justify-content:space-between;gap:18px;padding:13px 16px;font-size:11px}
.row+.row{border-top:1px solid var(--line)}
.row span{color:var(--muted)}
.row strong{color:var(--navy-2);text-align:right;word-break:break-word}
.actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:26px}
.action{border:0;border-radius:12px;padding:13px 18px;font:900 11px Montserrat;min-height:42px}
.primary{background:var(--navy-2);color:#fff}
.secondary{background:#edf4fb;color:var(--navy-2)}
.download{background:#fff;color:var(--navy-2);border:1px solid #cdd9e8;display:inline-flex;align-items:center;gap:8px}
.download svg{width:15px;height:15px}
.small{font-size:10px;color:var(--muted);margin-top:20px;line-height:1.6}
.status{min-height:20px;margin-top:13px;color:var(--muted);font-size:9px;line-height:1.5}
.status.error{color:#b42318}
.status.ok{color:var(--success)}

.store-confirmation-footer{background:var(--navy);color:#fff}
.store-confirmation-footer-main{width:min(1240px,calc(100% - 36px));min-height:112px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:26px 0}
.store-confirmation-footer-brand{display:flex;align-items:center;gap:20px;min-width:0}
.store-confirmation-footer-brand img{width:auto;height:34px;max-width:190px;object-fit:contain;object-position:left center}
.store-confirmation-footer-copy{color:#c9d2df;font-size:9px;line-height:1.6}
.store-confirmation-footer-copy strong{display:block;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
.store-confirmation-footer-return{border:1px solid rgba(255,255,255,.28);border-radius:999px;background:transparent;color:#fff;height:38px;padding:0 15px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.store-confirmation-footer-bottom{border-top:1px solid rgba(255,255,255,.15)}
.store-confirmation-footer-bottom-inner{width:min(1240px,calc(100% - 36px));min-height:52px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
.store-confirmation-slogan{color:#fff;font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.store-confirmation-copyright{color:#aeb9c8;font-size:8px}

@media(max-width:600px){
  .store-confirmation-header-inner,.store-confirmation-footer-main,.store-confirmation-footer-bottom-inner{width:calc(100% - 20px)}
  .store-confirmation-header-inner{min-height:72px;gap:12px}
  .store-confirmation-brand{gap:11px}
  .store-confirmation-brand-logo img{height:46px;max-width:165px}
  .store-confirmation-brand-divider{height:26px}
  .store-confirmation-brand-context{font-size:8px;letter-spacing:.065em}
  .store-confirmation-brand-context span{font-size:7px}
  .store-confirmation-return{padding:0 10px;font-size:8px}
  .wrap{padding-top:34px}
  .panel{padding:32px 18px}
  .row{flex-direction:column;gap:5px}
  .row strong{text-align:left}
  .actions{display:grid;grid-template-columns:1fr;width:100%}
  .action{width:100%}
  .store-confirmation-footer-main{align-items:flex-start;flex-direction:column;min-height:0;padding:26px 0}
  .store-confirmation-footer-brand{align-items:flex-start;flex-direction:column;gap:12px}
  .store-confirmation-footer-return{width:100%}
  .store-confirmation-footer-bottom-inner{align-items:flex-start;flex-direction:column;gap:7px;padding:14px 0}
}
</style>
</head>
<body>
<header class="store-confirmation-header" aria-label="SKANDI The Store order confirmation header">
  <div class="store-confirmation-header-inner">
    <div class="store-confirmation-brand">
      <button class="store-confirmation-brand-logo" type="button" data-master-route="theStore" aria-label="Return to SKANDI The Store">
        <img id="storeConfirmationHeaderLogo" data-master-logo="storeHeader" src="https://static.wixstatic.com/media/394052_eaf2188b7f7e48468fa25d61f8881b10~mv2.png" alt="SKANDI">
      </button>
      <span class="store-confirmation-brand-divider" aria-hidden="true"></span>
      <div class="store-confirmation-brand-context">The Store<span>Order confirmation</span></div>
    </div>
    <button class="store-confirmation-return" type="button" data-master-route="theStore">Back to The Store</button>
  </div>
</header>

<main class="wrap">
  <section class="panel" data-section-id="store-order-confirmation">
    <div class="check">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 4 4L19 6"/></svg>
    </div>
    <div class="eyebrow" data-content-id="store-confirmation-eyebrow">SKANDI STORE</div>
    <h1 data-content-id="store-confirmation-h1">Thank you.</h1>
    <p data-content-id="store-confirmation-copy">Your SKANDI order has been created. You can review the order and its latest payment and fulfillment status in My Orders.</p>
    <div class="meta">
      <div class="row"><span>Order reference</span><strong id="orderId">Available in My Orders</strong></div>
      <div class="row"><span>Payment status</span><strong id="paymentStatus">Submitted</strong></div>
      <div class="row"><span>Confirmation generated</span><strong id="generatedAt">—</strong></div>
    </div>
    <div class="actions">
      <button id="orders" class="action primary">View My Orders</button>
      <button id="download" class="action download">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>
        Download Confirmation
      </button>
      <button id="store" class="action secondary">Continue shopping</button>
    </div>
    <div class="small">A confirmation may also be sent using the email attached to your order.</div>
    <div id="status" class="status" role="status" aria-live="polite"></div>
  </section>
</main>

<footer class="store-confirmation-footer" aria-label="SKANDI The Store order confirmation footer">
  <div class="store-confirmation-footer-main">
    <div class="store-confirmation-footer-brand">
      <img id="storeConfirmationFooterLogo" data-master-logo="storeFooter" src="https://static.wixstatic.com/media/394052_cd31153a91694b14a27c5f756f8089bd~mv2.png" alt="SKANDI">
      <div class="store-confirmation-footer-copy"><strong>The Store</strong>Order confirmation powered by SKANDI.</div>
    </div>
    <button class="store-confirmation-footer-return" type="button" data-master-route="theStore">Return to The Store</button>
  </div>
  <div class="store-confirmation-footer-bottom">
    <div class="store-confirmation-footer-bottom-inner">
      <div id="storeConfirmationSlogan" class="store-confirmation-slogan">Unforgettable Moments.</div>
      <div class="store-confirmation-copyright">© <span id="storeConfirmationFooterYear"></span> SKANDI Travels. All rights reserved.</div>
    </div>
  </div>
</footer>

<script>
(()=>{
"use strict";
const SOURCE="SKANDI_STORE_CONFIRMATION";
const PARENT="SKANDI_WIX_PARENT";
let MASTER_CONFIG_STATE=null;
let CONFIRMATION={orderId:"",paymentStatus:"Submitted",generatedAt:new Date().toISOString()};
const $=id=>document.getElementById(id);
const post=(type,payload={})=>window.parent.postMessage({source:SOURCE,type,payload,timestamp:new Date().toISOString()},"*");

function masterAsset(key){return String(MASTER_CONFIG_STATE?.brand?.assets?.logos?.[key]||"").trim()}
function currentMasterSlogan(){
  const language=String(MASTER_CONFIG_STATE?.settings?.language||"EN").trim().toLowerCase();
  const slogans=MASTER_CONFIG_STATE?.brand?.slogans||{};
  return String(slogans[language]||slogans.en||"Unforgettable Moments.").trim();
}
function masterRoute(key,fallback){
  const route=String(MASTER_CONFIG_STATE?.routes?.[key]||"").trim();
  return route||fallback;
}
function renderMasterBranding(){
  const headerLogo=masterAsset("storeHeader");
  const footerLogo=masterAsset("storeFooter");
  if(headerLogo)document.querySelectorAll('[data-master-logo="storeHeader"]').forEach(img=>img.src=headerLogo);
  if(footerLogo)document.querySelectorAll('[data-master-logo="storeFooter"]').forEach(img=>img.src=footerLogo);
  const slogan=$("storeConfirmationSlogan");if(slogan)slogan.textContent=currentMasterSlogan();
  const year=$("storeConfirmationFooterYear");if(year)year.textContent=String(new Date().getFullYear());
}
function setStatus(message,kind=""){
  const el=$("status");if(!el)return;
  el.textContent=message||"";
  el.className="status"+(kind?` ${kind}`:"");
}
function friendlyDate(value){
  const d=value?new Date(value):new Date();
  if(Number.isNaN(d.getTime()))return String(value||"");
  try{return new Intl.DateTimeFormat(undefined,{year:"numeric",month:"long",day:"numeric",hour:"numeric",minute:"2-digit"}).format(d)}catch(_){return d.toLocaleString()}
}
function cleanFilePart(value){return String(value||"").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100)||"Confirmation"}
function pdfAscii(value){return String(value??"").normalize("NFKD").replace(/[^\x20-\x7E]/g,"-")}
function pdfEscape(value){return pdfAscii(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function fallbackPdfBlob(){
  const order=CONFIRMATION.orderId||"Available in My Orders";
  const status=CONFIRMATION.paymentStatus||"Submitted";
  const generated=friendlyDate(CONFIRMATION.generatedAt);
  const slogan=currentMasterSlogan();
  const lines=[
    ["SKANDI THE STORE",18,true],
    ["Order Confirmation",24,true],
    ["Thank you. Your SKANDI order has been created.",11,false],
    ["",8,false],
    [`Order reference: ${order}`,11,true],
    [`Payment status: ${status}`,11,false],
    [`Confirmation generated: ${generated}`,10,false],
    ["",8,false],
    ["Review the latest payment and fulfillment status in My Orders.",10,false],
    ["A confirmation may also be sent using the email attached to your order.",10,false],
    ["",8,false],
    [`SKANDI Travels - ${slogan}`,9,false]
  ];
  let stream="0.97 0.98 1 rg\n46 690 520 62 re f\n0.008 0.18 0.39 rg\n";
  let y=726;
  for(const [text,size,bold] of lines){
    const font=bold?"F2":"F1";
    stream+=`BT /${font} ${size} Tf 0.008 0.18 0.39 rg 58 ${y} Td (${pdfEscape(text)}) Tj ET\n`;
    y-=Math.max(15,size+6);
  }
  const objects=[];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>");
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  let pdf="%PDF-1.4\n";const offsets=[0];
  objects.forEach((obj,i)=>{offsets[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`});
  const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf],{type:"application/pdf"});
}
async function imageDataUrl(url){
  if(!url)return"";
  try{
    const response=await fetch(url,{mode:"cors"});if(!response.ok)throw new Error("IMAGE_FETCH_FAILED");
    const blob=await response.blob();
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=reject;reader.readAsDataURL(blob)});
  }catch(_){return""}
}
function addPdfFooter(doc,pageWidth,pageHeight){
  doc.setDrawColor(2,46,100);doc.setLineWidth(1.2);doc.line(46,pageHeight-56,pageWidth-46,pageHeight-56);
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(102,112,133);
  doc.text(`SKANDI Travels - ${currentMasterSlogan()}`,46,pageHeight-38);
  doc.text(`Generated ${friendlyDate(CONFIRMATION.generatedAt)}`,pageWidth-46,pageHeight-38,{align:"right"});
}
async function downloadRichPdf(){
  const jsPDF=window.jspdf?.jsPDF;
  if(!jsPDF){
    downloadBlob(fallbackPdfBlob(),`SKANDI-Store-Order-${cleanFilePart(CONFIRMATION.orderId)}.pdf`);
    return;
  }
  const doc=new jsPDF({orientation:"portrait",unit:"pt",format:"letter"});
  const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  doc.setFillColor(246,250,255);doc.rect(0,0,w,112,"F");
  const logo=await imageDataUrl(masterAsset("storeHeader"));
  if(logo){
    try{doc.addImage(logo,"PNG",46,34,170,50,undefined,"FAST")}catch(_){
      doc.setFont("helvetica","bold");doc.setFontSize(17);doc.setTextColor(2,46,100);doc.text("SKANDI THE STORE",46,63);
    }
  }else{
    doc.setFont("helvetica","bold");doc.setFontSize(17);doc.setTextColor(2,46,100);doc.text("SKANDI THE STORE",46,63);
  }
  doc.setFont("helvetica","bold");doc.setFontSize(22);doc.setTextColor(2,46,100);doc.text("Order Confirmation",w-46,55,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(102,112,133);doc.text("SKANDI The Store",w-46,72,{align:"right"});
  doc.setDrawColor(2,46,100);doc.setLineWidth(2);doc.line(46,130,w-46,130);
  doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(2,46,100);doc.text("ORDER CREATED",46,153);
  doc.setFillColor(2,46,100);doc.roundedRect(w-129,140,83,22,11,11,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("CONFIRMED",w-87.5,154.5,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(51,65,85);
  const intro=doc.splitTextToSize("Your SKANDI order has been created. Keep this confirmation for your records and review the latest payment and fulfillment status in My Orders.",w-92);
  doc.text(intro,46,181,{lineHeightFactor:1.5});
  const boxY=225;
  doc.setFillColor(246,248,251);doc.setDrawColor(229,231,235);doc.roundedRect(46,boxY,w-92,112,10,10,"FD");
  const rows=[
    ["Order reference",CONFIRMATION.orderId||"Available in My Orders"],
    ["Payment status",CONFIRMATION.paymentStatus||"Submitted"],
    ["Confirmation generated",friendlyDate(CONFIRMATION.generatedAt)]
  ];
  let y=boxY+29;
  rows.forEach((row,index)=>{
    if(index){doc.setDrawColor(229,231,235);doc.line(58,y-14,w-58,y-14)}
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(102,112,133);doc.text(row[0],60,y);
    doc.setFont("helvetica","bold");doc.setTextColor(2,46,100);doc.text(doc.splitTextToSize(String(row[1]),270),w-60,y,{align:"right"});
    y+=32;
  });
  doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(2,46,100);doc.text("Important information",46,382);
  doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.setTextColor(71,84,103);
  const note=doc.splitTextToSize("This downloadable confirmation records the order reference and payment status shown on the SKANDI confirmation page. Full order contents, delivery progress, refunds and fulfillment updates remain authoritative in My Orders.",w-92);
  doc.text(note,46,402,{lineHeightFactor:1.55});
  doc.setFillColor(232,251,248);doc.setDrawColor(95,199,207);doc.roundedRect(46,470,w-92,62,10,10,"FD");
  doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(2,46,100);doc.text("Keep your order reference available if you contact SKANDI Customer Service.",60,494);
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(71,84,103);doc.text("A confirmation may also be sent using the email attached to your order.",60,512);
  addPdfFooter(doc,w,h);
  doc.save(`SKANDI-Store-Order-${cleanFilePart(CONFIRMATION.orderId)}.pdf`);
}
function renderConfirmation(payload={}){
  CONFIRMATION={
    orderId:String(payload.orderId||""),
    paymentStatus:String(payload.paymentStatus||"Submitted"),
    generatedAt:String(payload.generatedAt||new Date().toISOString())
  };
  if(CONFIRMATION.orderId)$("orderId").textContent=CONFIRMATION.orderId;
  $("paymentStatus").textContent=CONFIRMATION.paymentStatus||"Submitted";
  $("generatedAt").textContent=friendlyDate(CONFIRMATION.generatedAt);
}

document.addEventListener("click",event=>{
  const button=event.target.closest("[data-master-route]");
  if(!button)return;
  const key=String(button.dataset.masterRoute||"").trim();
  const fallback=key==="theStore"?"/the-store":"/";
  post("CONFIRMATION_NAVIGATE",{path:masterRoute(key,fallback)});
});
window.addEventListener("message",event=>{
  const m=event.data||{};if(m.source&&m.source!==PARENT)return;const p=m.payload||{};
  if(m.type==="SKANDI_MASTER_CONFIG"){MASTER_CONFIG_STATE=p;renderMasterBranding();return}
  if(m.type==="STORE_CONFIRMATION_DATA"){renderConfirmation(p);return}
});
$("orders").addEventListener("click",()=>post("CONFIRMATION_NAVIGATE",{path:"/my-profile?tab=orders"}));
$("store").addEventListener("click",()=>post("CONFIRMATION_NAVIGATE",{path:masterRoute("theStore","/the-store")}));
$("download").addEventListener("click",async()=>{
  const btn=$("download");btn.disabled=true;setStatus("Preparing your PDF confirmation…");
  try{await downloadRichPdf();setStatus("Confirmation downloaded.","ok")}
  catch(error){console.error("[SKANDI Store Confirmation] PDF download failed.",error);setStatus("The PDF could not be created. Please try again.","error")}
  finally{btn.disabled=false}
});
renderMasterBranding();renderConfirmation(CONFIRMATION);
post("SKANDI_MASTER_CONFIG_REQUEST",{});
post("CONFIRMATION_READY",{});
})();
</script>
</body>
</html>
```
