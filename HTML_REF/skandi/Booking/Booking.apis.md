# BOOKING.apis

STATUS: NEEDS REVIEW
SLUG: /booking.apis
WIX PAGE: Booking.e8twe
AREA: SKANDI
LIVE HTML: YES
ELEMENT: #apisHtml
LAST SYNCED: 2026-09-16

## HOW TO USE
STATUS (OWNER): "TODO", "IN PROGRESS", "NEEDS REVIEW", "REVISIONS NEEDED", "READY", "LIVE", "ARCHIVED"
STATUS (AGENT): "TODO", "IN PROGRESS", "REVISIONS NEEDED", "READY".
END

### COMMENT SECTION (START ON A NEW ROW, LOG IF A CHANGE IS MADE THAT REQUIRES ATTENTION) 
1. 9/17 12:50PM "Review, functions, flow, payload needs reviewed"
2.
3.
...
END 

``` LIVE HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SKANDI Traveler Information</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --sk-blue:#022e64;--sk-blue-soft:#285ca8;--sk-light:#d7e6ff;--sk-pale:#f6faff;
  --sk-bg:#f7faff;--sk-border:#dbe3ef;--sk-border-soft:#eef2f7;--sk-text:#111;
  --sk-muted:#667085;--sk-cyan:#5FC7CF;--sk-ok:#087443;--sk-warn:#a15c00;--sk-danger:#b42318;
  --sk-shadow:0 8px 26px rgba(0,0,0,.08);--sk-shadow-strong:0 14px 34px rgba(0,0,0,.12);
}
*{box-sizing:border-box}
html,body{margin:0;width:100%;min-height:100%;font-family:"Montserrat",system-ui,sans-serif;color:var(--sk-text);background:#fff;overflow-x:hidden;}
button,input,select,textarea{font-family:inherit}

@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.sk-wrap{max-width:1000px;margin:0 auto;padding:40px 24px 80px;animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}

/* --- PREMIUM BOOKING FLOW METER --- */
.sk-stepper-container { position: relative; display: flex; justify-content: space-between; margin-bottom: 48px; padding: 0 10px; }
.sk-stepper-track { position: absolute; top: 14px; left: 30px; right: 30px; height: 2px; background: var(--sk-border); z-index: 1; }
.sk-stepper-progress { position: absolute; top: 14px; left: 30px; height: 2px; background: var(--sk-cyan); z-index: 2; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); width: 50%; }
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
h1{color:var(--sk-blue);font-size:clamp(32px,5vw,46px);font-weight:800;line-height:.96;letter-spacing:-.04em;margin:0 0 12px}
h2{color:var(--sk-blue);font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 16px}
p{color:#475467;line-height:1.6;font-size:14px;font-weight:500;margin:0}

.sk-card{background:#fff;border:1px solid var(--sk-border);border-radius:20px;box-shadow:var(--sk-shadow);padding:34px;margin-bottom:24px;transition:box-shadow 0.3s ease; animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0;}
.sk-card:nth-child(1) { animation-delay: 0.1s; } .sk-card:nth-child(2) { animation-delay: 0.2s; } .sk-card:nth-child(3) { animation-delay: 0.3s; }
.sk-card:hover{box-shadow:var(--sk-shadow-strong)}
.rule-box{border-left:4px solid var(--sk-cyan);background:linear-gradient(90deg,var(--sk-bg),#fff)}

.sk-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.sk-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}

/* --- AIRBNB STYLE INPUTS --- */
.sk-field{display:flex;flex-direction:column;justify-content:center;background:#fff;border:1px solid var(--sk-border);border-radius:12px;padding:8px 14px;transition:all 0.2s ease;}
.sk-field:focus-within{border-color:var(--sk-cyan);box-shadow:0 0 0 3px rgba(95,199,207,.15);}
.sk-field label{font-size:9px;font-weight:800;color:var(--sk-muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.sk-field input,.sk-field select,.sk-field textarea{background:transparent;border:none;padding:4px 0;font-size:14px;font-weight:700;color:var(--sk-blue);outline:none;width:100%;}
.sk-field select{appearance:none;background-image:url("data:image/svg+xml;utf8,<svg fill='%23022e64' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");background-repeat:no-repeat;background-position:right 0 center;padding-right:20px}
.required-star{color:var(--sk-cyan);font-weight:900}

.sk-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;justify-content:flex-end}
.sk-btn{border:0;border-radius:12px;background:linear-gradient(135deg,var(--sk-blue),var(--sk-blue-soft));color:#fff;padding:16px 28px;font-weight:800;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(2,46,100,.15);transition:all .25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;}
.sk-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 26px rgba(2,46,100,.25)}
.sk-btn::after {content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.25) 50%,rgba(255,255,255,0) 100%);transform:skewX(-25deg);transition:all 0.6s ease;}
.sk-btn:hover::after {left:150%;}
.sk-btn.secondary{background:#fff;color:var(--sk-blue);border:1px solid var(--sk-border);box-shadow:0 4px 12px rgba(0,0,0,.04)}
.sk-btn.secondary:hover{border-color:var(--sk-cyan);color:var(--sk-cyan)}

.sk-status{display:none;border-radius:16px;padding:18px;background:var(--sk-bg);border:1px solid var(--sk-border);margin:14px 0 24px;color:var(--sk-muted);white-space:pre-line;font-size:13px;font-weight:700}
.sk-status.show{display:block; animation:fadeUp 0.4s ease forwards;}
.sk-status.error{background:#fff1f0;color:var(--sk-danger);border-color:#ffd5d2}
.sk-status.ok{background:#ecfdf3;color:var(--sk-ok);border-color:#abefc6}
.sk-status.warn{background:#fff7ed;color:var(--sk-warn);border-color:#fed7aa}

@media(max-width:860px){
  .sk-grid,.sk-grid-2{grid-template-columns:1fr}
  .sk-wrap{padding:24px 16px 60px}
  .sk-card{padding:24px}
  .sk-btn{width:100%}
  .sk-step-label{display:none;}
  .sk-stepper-container{margin-bottom:32px;}
}
</style>
</head>
<body>
<div class="sk-wrap">
  
  <div class="sk-stepper-container">
    <div class="sk-stepper-track"></div>
    <div class="sk-stepper-progress" style="width: 50%;"></div>
    
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Offer</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Extras</div>
    </div>
    <div class="sk-step completed">
      <div class="sk-step-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
      <div class="sk-step-label">Transfer</div>
    </div>
    <div class="sk-step active">
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
    <div class="sk-kicker">Passenger details</div>
    <h1>Traveler information</h1>
    <p>Please enter details exactly as they appear on your official travel documents.</p>
  </section>

  <div id="status" class="sk-status show">Loading booking session...</div>

  <section class="sk-card rule-box" id="ruleSummary" style="animation-delay:0.1s">
    <h2>Travel requirements</h2>
    <p>Checking route, nationality and document rules...</p>
  </section>

  <section class="sk-card" style="animation-delay:0.2s">
    <h2>Contact Information</h2>
    <div class="sk-grid-2">
      <div class="sk-field"><label>Email <span class="required-star">*</span></label><input id="email" type="email" placeholder="name@example.com"></div>
      <div class="sk-field"><label>Mobile phone <span class="required-star">*</span></label><input id="phone" type="tel" placeholder="+1 555 000 0000"></div>
    </div>
    <div class="sk-grid-2" style="margin-top:16px">
      <div class="sk-field"><label>Emergency contact name</label><input id="emergencyName" placeholder="Full Name"></div>
      <div class="sk-field"><label>Emergency contact phone</label><input id="emergencyPhone" type="tel" placeholder="+1 555 000 0000"></div>
    </div>
  </section>

  <section id="passengers"></section>

  <div class="sk-actions">
    <button class="sk-btn secondary" id="refreshRulesBtn">Refresh requirements</button>
    <button class="sk-btn" id="continueBtn">Continue to seats →</button>
  </div>
</div>

<script>
const SOURCE="SKANDI_BOOKING_APIS_V2";
const PARENT="SKANDI_WIX_PARENT";
let CART=null;
let RULES=null;

const $=id=>document.getElementById(id);
function post(type,payload={}){window.parent.postMessage({source:SOURCE,type,...payload},"*")}
function esc(v=""){return String(v).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))}
function status(msg,mode=""){const e=$("status");e.textContent=msg;e.className="sk-status show "+mode}

function travelerCount(cart){
  const s=cart.searchContext||{};
  return Number(s.adults||1)+Number(s.children||0)+Number(s.infants||0);
}

function commonFields(){
  return [
    {id:"passengerType",label:"Type",type:"select",required:true,options:["ADULT","CHILD","INFANT"]},
    {id:"firstName",label:"First name",type:"text",required:true},
    {id:"lastName",label:"Last name",type:"text",required:true},
    {id:"dateOfBirth",label:"Date of birth",type:"date",required:true},
    {id:"gender",label:"Gender",type:"select",required:true,options:["MALE","FEMALE","UNSPECIFIED"]},
    {id:"nationality",label:"Nationality",type:"country",required:true},
    {id:"residenceCountry",label:"Residence country",type:"country",required:false},
    {id:"documentType",label:"Document type",type:"select",required:true,options:["PASSPORT","NATIONAL_ID","RESIDENCE_PERMIT"]},
    {id:"documentNumber",label:"Document number",type:"text",required:true},
    {id:"issuanceCountry",label:"Issuing country",type:"country",required:true},
    {id:"issuanceDate",label:"Issue date",type:"date",required:false},
    {id:"expiryDate",label:"Expiry date",type:"date",required:true}
  ];
}

function ruleFields(){
  return (RULES?.fields||[]).filter(f=>!commonFields().some(c=>c.id===f.id));
}

function fieldHtml(field, idx){
  const req=field.required?` <span class="required-star">*</span>`:"";
  const name=`pax_${idx}_${field.id}`;
  if(field.type==="select"){
    return `<div class="sk-field"><label>${esc(field.label)}${req}</label><select data-field="${esc(field.id)}">${(field.options||[]).map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select></div>`;
  }
  if(field.type==="textarea"){
    return `<div class="sk-field"><label>${esc(field.label)}${req}</label><textarea data-field="${esc(field.id)}" rows="2"></textarea></div>`;
  }
  const inputType=field.type==="date"?"date":"text";
  const placeholder=field.type==="country"?"SE": field.type==="date"?"YYYY-MM-DD":"";
  return `<div class="sk-field"><label>${esc(field.label)}${req}</label><input data-field="${esc(field.id)}" type="${inputType}" placeholder="${placeholder}" maxlength="${field.type==="country"?2:80}"></div>`;
}

function renderRules(){
  const r=RULES||{};
  const msg=[
    r.status?`Status: ${r.status}`:"",
    r.summary||"",
    r.providerStatus?`Validation: ${r.providerStatus}`:"",
    (r.notices||[]).join("\n")
  ].filter(Boolean).join("\n");
  $("ruleSummary").innerHTML=`<h2>Travel requirements</h2><p style="white-space:pre-line">${esc(msg||"Standard passenger and document fields required.")}</p>`;
}

function render(cart,rules){
  CART=cart; RULES=rules||{fields:[]};
  $("email").value=cart.contact?.email||cart.contact?.emailAddress||"";
  $("phone").value=cart.contact?.phone||"";
  renderRules();

  const n=travelerCount(cart);
  const fields=[...commonFields(),...ruleFields()];
  let html="";
  for(let i=0;i<n;i++){
    const delay = 0.2 + (i * 0.1);
    html+=`<section class="sk-card pax" data-i="${i}" style="animation-delay:${delay}s"><h2>Traveler ${i+1}</h2><div class="sk-grid">${fields.map(f=>fieldHtml(f,i)).join("")}</div></section>`;
  }
  $("passengers").innerHTML=html;
  status("Traveler forms ready.","ok");
}

function collect(){
  return [...document.querySelectorAll(".pax")].map((el,idx)=>{
    const data={id:String(idx+1), extraApis:{}};
    el.querySelectorAll("[data-field]").forEach(input=>{ data[input.dataset.field]=input.value.trim(); });
    const givenName=(data.firstName||"").toUpperCase();
    const familyName=(data.lastName||"").toUpperCase();
    const issuingCountry=(data.issuanceCountry||"").toUpperCase();
    const nationality=(data.nationality||"").toUpperCase();
    return {
      id:data.id,
      travelerType:data.passengerType||"ADULT",
      givenName,
      familyName,
      firstName:givenName,
      lastName:familyName,
      dateOfBirth:data.dateOfBirth,
      gender:data.gender||"UNSPECIFIED",
      name:{firstName:givenName,lastName:familyName},
      nationality,
      residenceCountry:(data.residenceCountry||"").toUpperCase(),
      documentType:data.documentType||"PASSPORT",
      documentNumber:data.documentNumber,
      documentExpiry:data.expiryDate,
      issuingCountryCode:issuingCountry,
      contact:{emailAddress:$("email").value.trim(), phones:[{deviceType:"MOBILE",number:$("phone").value.trim()}]},
      documents:[{
        documentType:data.documentType||"PASSPORT",
        number:data.documentNumber,
        issuanceDate:data.issuanceDate,
        issuanceCountry:issuingCountry,
        expiryDate:data.expiryDate,
        validityCountry:issuingCountry,
        nationality,
        holder:true
      }],
      extraApis:Object.fromEntries(Object.entries(data).filter(([k])=>!["id","passengerType","firstName","lastName","dateOfBirth","gender","nationality","residenceCountry","documentType","documentNumber","issuanceDate","issuanceCountry","expiryDate"].includes(k)))
    };
  });
}

function validate(travelers){
  const missing=[];
  travelers.forEach((t,i)=>{
    if(!t.name.firstName) missing.push(`Traveler ${i+1} first name`);
    if(!t.name.lastName) missing.push(`Traveler ${i+1} last name`);
    if(!t.dateOfBirth) missing.push(`Traveler ${i+1} date of birth`);
    if(!t.nationality) missing.push(`Traveler ${i+1} nationality`);
    if(!t.documents[0].number) missing.push(`Traveler ${i+1} document number`);
    if(!t.documents[0].expiryDate) missing.push(`Traveler ${i+1} document expiry`);
  });
  const email=$("email").value.trim();
  const phone=$("phone").value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push("Valid contact email");
  if(!/^\+[1-9]\d{7,14}$/.test(phone)) missing.push("Mobile phone in international format, for example +12125551234");
  travelers.forEach((t,i)=>{
    if(!/^[A-Z]{2}$/.test(t.nationality||"")) missing.push(`Traveler ${i+1} nationality must be a two-letter country code`);
    if(!/^[A-Z]{2}$/.test(t.issuingCountryCode||"")) missing.push(`Traveler ${i+1} issuing country must be a two-letter country code`);
  });
  return missing;
}

$("refreshRulesBtn").onclick=()=>post("APIS_RULES_REFRESH",{travelers:collect()});
$("continueBtn").onclick=()=>{
  const travelers=collect();
  const missing=validate(travelers);
  if(missing.length) return status("Missing required fields:\n"+missing.join("\n"),"warn");
  post("APIS_SAVE_AND_CONTINUE",{contact:{email:$("email").value,phone:$("phone").value,emergencyName:$("emergencyName").value,emergencyPhone:$("emergencyPhone").value},travelers});
};

window.addEventListener("message",e=>{
  const m=e.data||{};
  if(m.source!==PARENT)return;
  if(m.type==="APIS_CART_RULES_LOADED")render(m.payload.cart,m.payload.rules);
  if(m.type==="APIS_REQUIREMENTS_RESULT"){RULES=m.payload.rules||m.payload;renderRules();status("Travel requirements refreshed.","ok");}
  if(m.type==="BOOKING_ERROR")status(m.message||"Traveler step failed.","error");
});
post("APIS_HTML_READY");
</script>
</body>
</html>
