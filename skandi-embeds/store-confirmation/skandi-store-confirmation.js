
(()=>{
"use strict";
const SOURCE="SKANDI_STORE_CONFIRMATION";
const PARENT="SKANDI_WIX_PARENT";
let MASTER_CONFIG_STATE=null;
let CONFIRMATION={orderId:"",paymentStatus:"Checking",verified:false};
let refreshCount=0,refreshTimer=0;
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
    [`Order status: ${CONFIRMATION.status||"Unknown"}`,11,false],
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
  doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(2,46,100);doc.text("ORDER STATUS",46,153);
  doc.setFillColor(2,46,100);doc.roundedRect(w-129,140,83,22,11,11,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("VERIFIED",w-87.5,154.5,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(51,65,85);
  const intro=doc.splitTextToSize(`Order status: ${CONFIRMATION.status||"Unknown"}. Keep this record and review the latest payment and fulfillment status in My Orders.`,w-92);
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
  CONFIRMATION={...payload,verified:payload.verified===true,orderId:String(payload.orderId||""),paymentStatus:String(payload.paymentStatus||"Checking"),generatedAt:String(payload.generatedAt||new Date().toISOString())};
  const verified=CONFIRMATION.verified;
  document.querySelector(".check").style.visibility=verified&&CONFIRMATION.paymentStatus==="PAID"?"visible":"hidden";
  $("download").disabled=!verified;
  $("orderId").textContent=verified?CONFIRMATION.orderId:"—";
  $("paymentStatus").textContent=verified?CONFIRMATION.paymentStatus:"Checking";
  $("generatedAt").textContent=verified?friendlyDate(CONFIRMATION.generatedAt):"—";
  const heading=document.querySelector("h1");
  if(heading)heading.textContent=!verified?"Checking your order":CONFIRMATION.paymentStatus==="PAID"?"Thank you for your order":["CANCELED","REJECTED"].includes(CONFIRMATION.status)?"Order "+CONFIRMATION.status.toLowerCase():"Your order status";
  const lead=document.querySelector('[data-content-id="store-confirmation-copy"]');
  if(lead)lead.textContent=verified?"The payment status below was retrieved from your Wix order.":"We are checking your order reference and payment status.";
  if(verified){setStatus(CONFIRMATION.paymentStatus==="PAID"?"Payment confirmed.":"Payment status: "+CONFIRMATION.paymentStatus,CONFIRMATION.paymentStatus==="PAID"?"ok":"");}
  clearTimeout(refreshTimer);
  if(verified && !["PAID","FULLY_REFUNDED"].includes(CONFIRMATION.paymentStatus) && !["CANCELED","REJECTED"].includes(CONFIRMATION.status) && refreshCount++<6){refreshTimer=setTimeout(()=>post("CONFIRMATION_REFRESH",{}),10000)}
}

document.addEventListener("click",event=>{
  const button=event.target.closest("[data-master-route]");
  if(!button)return;
  const key=String(button.dataset.masterRoute||"").trim();
  const fallback=key==="theStore"?"/the-store":"/";
  post("CONFIRMATION_NAVIGATE",{path:masterRoute(key,fallback)});
});
window.addEventListener("message",event=>{
  if(event.source!==window.parent)return;
  const m=event.data||{};if(m.source!==PARENT)return;const p=m.payload||{};
  if(m.type==="SKANDI_MASTER_CONFIG"){MASTER_CONFIG_STATE=p;renderMasterBranding();return}
  if(m.type==="STORE_CONFIRMATION_PARENT_READY"){post("CONFIRMATION_READY",{});return}
  if(m.type==="STORE_CONFIRMATION_LOADING"){setStatus("Checking your order…");return}
  if(m.type==="STORE_CONFIRMATION_ERROR"){renderConfirmation({});setStatus(p.message||"We could not verify this order. Open My Orders or try again.","error");const h=document.querySelector("h1");if(h)h.textContent="Order could not be verified";return}
  if(m.type==="STORE_CONFIRMATION_DATA"){renderConfirmation(p);return}
});
$("orders").addEventListener("click",()=>post("CONFIRMATION_NAVIGATE",{path:"/my-orders"}));
$("store").addEventListener("click",()=>post("CONFIRMATION_NAVIGATE",{path:masterRoute("theStore","/the-store")}));
$("download").addEventListener("click",async()=>{
  if(!CONFIRMATION.verified)return;
  const btn=$("download");btn.disabled=true;setStatus("Preparing your PDF confirmation…");
  try{await downloadRichPdf();setStatus("Confirmation downloaded.","ok")}
  catch(error){console.error("[SKANDI Store Confirmation] PDF download failed.",error);setStatus("The PDF could not be created. Please try again.","error")}
  finally{btn.disabled=false}
});
window.addEventListener("pagehide",()=>clearTimeout(refreshTimer));
renderMasterBranding();renderConfirmation(CONFIRMATION);
post("SKANDI_MASTER_CONFIG_REQUEST",{});
post("CONFIRMATION_READY",{});
})();
