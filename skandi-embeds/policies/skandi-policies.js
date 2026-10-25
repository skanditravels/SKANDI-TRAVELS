
(()=>{
"use strict";

const SOURCE="SKANDI_LEGAL_DOCUMENT";
const PARENT="SKANDI_WIX_PARENT";
const PARENT_ORIGIN=(()=>{
  try{return document.referrer?new URL(document.referrer).origin:"*"}
  catch(_){return"*"}
})();

const $=id=>document.getElementById(id);

let current=null;
let suggested=[];
let backPath="/about/legal";
let policyPath="/about/legal/policies";
let requestContext=null;
let tocObserver=null;
let heightTimer=0;
let ackHasSignature=false;
let ackSubmitting=false;
let ackSubmissionId="";
let documentBridgeSettled=false;
let documentBridgeRetries=0;
let documentBridgeRetryTimer=null;
function requestInitialDocument(){
  if(documentBridgeSettled||documentBridgeRetries>=5)return;
  documentBridgeRetries++;
  post("LEGAL_DOCUMENT_READY",{path:"/about/legal/policies"});
  documentBridgeRetryTimer=setTimeout(requestInitialDocument,1800);
}
function settleInitialDocument(){
  documentBridgeSettled=true;
  if(documentBridgeRetryTimer){clearTimeout(documentBridgeRetryTimer);documentBridgeRetryTimer=null;}
}

function post(type,payload={}){
  window.parent.postMessage({
    source:SOURCE,
    type,
    payload,
    timestamp:new Date().toISOString()
  },PARENT_ORIGIN);
}

function parseMessage(value){
  if(typeof value==="string"){
    try{return JSON.parse(value)}catch(_){return null}
  }
  return value&&typeof value==="object"?value:null;
}

function esc(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  }[c]));
}

function safeUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return"";
  if(raw.startsWith("/")&&!raw.startsWith("//"))return raw;
  try{
    const url=new URL(raw,location.origin);
    return["https:","http:","mailto:","tel:"].includes(url.protocol)?url.href:"";
  }catch(_){
    return"";
  }
}

function safeInternalPath(value){
  const path=String(value||"").trim();
  return path.startsWith("/")&&!path.startsWith("//")?path:"";
}

function cleanHtml(value){
  const doc=new DOMParser().parseFromString(`<div>${String(value||"")}</div>`,"text/html");
  const root=doc.body.firstElementChild;
  if(!root)return"";

  root.querySelectorAll(
    "script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base"
  ).forEach(node=>node.remove());

  root.querySelectorAll("*").forEach(node=>{
    [...node.attributes].forEach(attr=>{
      const name=attr.name.toLowerCase();
      const raw=String(attr.value||"");

      if(name.startsWith("on")||name==="style"||name==="srcdoc"||name==="id"){
        node.removeAttribute(attr.name);
        return;
      }

      if(name==="href"||name==="src"){
        const safe=safeUrl(raw);
        if(safe)node.setAttribute(attr.name,safe);
        else node.removeAttribute(attr.name);
        return;
      }

      if(![
        "class","title","colspan","rowspan","scope","rel","target","aria-label"
      ].includes(name)&&!name.startsWith("data-")){
        node.removeAttribute(attr.name);
      }
    });

    if(node.tagName==="A"&&node.getAttribute("href")){
      const href=node.getAttribute("href")||"";
      node.setAttribute("rel","noopener noreferrer");
      if(href.startsWith("/")){
        node.removeAttribute("target");
      }else if(/^https?:/i.test(href)){
        node.setAttribute("target","_blank");
      }
    }
  });

  return root.innerHTML;
}

function formatDate(value){
  if(!value)return"Not set";
  const date=new Date(`${String(value).slice(0,10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ?"Not set"
    :date.toLocaleDateString("en-US",{
      month:"long",
      day:"numeric",
      year:"numeric",
      timeZone:"UTC"
    });
}

function flatten(items,prefix=[]){
  const out=[];
  (Array.isArray(items)?items:[]).forEach((item,index)=>{
    const path=[...prefix,index+1];
    const number=path.join(".");
    const anchor=`section-${number.replace(/\./g,"-")}`;

    out.push({
      ...item,
      number,
      label:path.length===1?`${number}.`:number,
      depth:path.length-1,
      anchor
    });

    out.push(...flatten(item.children||[],path));
  });
  return out;
}

function normalizeDocument(payload={}){
  const value=payload.document||payload.policy||payload||{};
  return{
    policyId:value.policyId||value.policy_id||"",
    documentId:value.documentId||value.document_id||"",
    title:value.title||"Legal Document",
    slug:value.slug||"",
    scope:String(value.scope||"external").toLowerCase(),
    brand:value.brand||"SKANDI TRAVELS",
    publicType:value.publicType||value.public_type||"",
    category:value.category||"Legal",
    summary:value.summary||"",
    introductionHtml:value.introductionHtml||value.introduction_html||"",
    sections:Array.isArray(value.sections)?value.sections:[],
    bodyHtml:value.bodyHtml||value.body_html||"",
    bodyPlainText:value.bodyPlainText||value.body_plain_text||"",
    effectiveDate:value.effectiveDate||value.effective_date||"",
    reviewDate:value.reviewDate||value.review_date||"",
    owner:value.owner||"Legal / Compliance",
    approvedByName:value.approvedByName||value.approved_by_name||"",
    version:value.version||"1.0",
    updatedAt:value.updatedAt||value.updated_at||value.publishedAt||value.published_at||"",
    pdfUrl:safeUrl(value.pdfUrl||value.pdf_file_url||""),
    pdfFileName:value.pdfFileName||value.pdf_file_name||"",
    acknowledgementRequired:
      value.acknowledgementRequired===true ||
      value.acknowledgement_required===true
  };
}

function documentRoute(item={}){
  const route=safeInternalPath(item.route||"");
  if(route)return route;

  if(item.slug){
    return `${policyPath}?slug=${encodeURIComponent(item.slug)}`;
  }
  if(item.policyId){
    return `${policyPath}?policyId=${encodeURIComponent(item.policyId)}`;
  }
  if(item.documentId){
    return `${policyPath}?documentId=${encodeURIComponent(item.documentId)}`;
  }
  return policyPath;
}

function sectionHtml(item){
  const level=Math.min(5,2+item.depth);
  return `<section id="${esc(item.anchor)}" data-policy-section="${esc(item.anchor)}">
    <h${level}><span class="section-number">${esc(item.label)}</span>${esc(item.title||"Untitled Section")}</h${level}>
    ${cleanHtml(item.bodyHtml||"")}
  </section>`;
}

function renderToc(flat){
  const host=$("toc");
  if(!flat.length){
    host.innerHTML='<div class="toc-empty">This document does not contain a structured table of contents.</div>';
    return;
  }

  host.innerHTML=`<ol class="toc-list">${
    flat.map(item=>`
      <li class="toc-item depth-${Math.min(item.depth,3)}">
        <a class="toc-link" data-toc-anchor="${esc(item.anchor)}" href="#${esc(item.anchor)}">
          <span class="toc-number">${esc(item.label)}</span>
          <span>${esc(item.title||"Untitled Section")}</span>
        </a>
      </li>
    `).join("") +
    (current?.acknowledgementRequired
      ?`<li class="toc-item">
          <a class="toc-link" data-toc-anchor="policyAcknowledgement" href="#policyAcknowledgement">
            <span class="toc-number">✓</span>
            <span>Acknowledgement</span>
          </a>
        </li>`
      :"")
  }</ol>`;
}

function renderSuggestions(){
  const host=$("suggestions");
  if(!suggested.length){
    host.innerHTML='<div class="toc-empty">No additional public legal documents are currently available.</div>';
    return;
  }

  host.innerHTML=suggested.map((item,index)=>`
    <button class="suggested" type="button" data-suggested-index="${index}">
      <strong>${esc(item.title||"Legal document")}</strong>
      <span>${esc([
        item.category||"Legal",
        item.version?`Version ${item.version}`:""
      ].filter(Boolean).join(" · "))}</span>
    </button>
  `).join("");
}

function setupTocObserver(flat){
  if(tocObserver){
    tocObserver.disconnect();
    tocObserver=null;
  }

  const links=[...document.querySelectorAll("[data-toc-anchor]")];
  const sections=[
    ...flat.map(item=>document.getElementById(item.anchor)).filter(Boolean),
    ...(current?.acknowledgementRequired&&$("policyAcknowledgement")
      ?[$("policyAcknowledgement")]
      :[])
  ];
  if(!links.length||!sections.length||!("IntersectionObserver"in window))return;

  const setActive=anchor=>{
    links.forEach(link=>{
      link.classList.toggle("active",link.dataset.tocAnchor===anchor);
    });
  };

  tocObserver=new IntersectionObserver(entries=>{
    const visible=entries
      .filter(entry=>entry.isIntersecting)
      .sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);

    if(visible[0])setActive(visible[0].target.id);
  },{
    root:null,
    rootMargin:"-8% 0px -72% 0px",
    threshold:[0,.1,.5]
  });

  sections.forEach(section=>tocObserver.observe(section));
  if(sections[0])setActive(sections[0].id);
}

function newSubmissionId(){
  if(window.crypto?.randomUUID)return `legal-ack:${window.crypto.randomUUID()}`;
  return `legal-ack:${Date.now()}:${Math.random().toString(36).slice(2,12)}`;
}

function ackStatus(message,mode=""){
  const node=$("ackStatus");
  if(!node)return;
  node.textContent=message||"";
  node.className=message?`ack-status show ${mode}`:"ack-status";
  requestHeight();
}

function selectedAckDecision(){
  return document.querySelector("input[name='ackDecision']:checked")?.value||"approved";
}

function acknowledgementMarkup(){
  if(!current?.acknowledgementRequired)return"";

  return `<section class="acknowledgement" id="policyAcknowledgement" data-section-id="policy-acknowledgement">
    <div class="ack-shell">
      <div class="ack-intro">
        <div class="eyebrow" data-content-id="policy-acknowledgement-eyebrow">ACKNOWLEDGEMENT REQUIRED</div>
        <h2 data-content-id="policy-acknowledgement-h2">Policy acknowledgement</h2>
        <p data-content-id="policy-acknowledgement-copy">
          Review the full policy above, then record your decision and electronic signature.
          Your response is stored as evidence of the acknowledgement for this published policy version.
        </p>
      </div>

      <div id="ackStatus" class="ack-status" role="status" aria-live="polite"></div>

      <form id="ackForm">
        <section class="ack-section">
          <h3>Your details</h3>
          <div class="ack-grid">
            <div class="ack-field">
              <label for="ackRelationship">Relationship</label>
              <select id="ackRelationship" class="ack-select">
                <option>Customer</option>
                <option>Applicant</option>
                <option>New Hire</option>
                <option>Employee</option>
                <option>Contractor</option>
                <option>Partner</option>
                <option>Other</option>
              </select>
            </div>
            <div class="ack-field">
              <label for="ackEmail">Email <span aria-hidden="true">*</span></label>
              <input id="ackEmail" class="ack-input" type="email" autocomplete="email" required>
            </div>
            <div class="ack-field">
              <label for="ackFirstName">Legal first name <span aria-hidden="true">*</span></label>
              <input id="ackFirstName" class="ack-input" autocomplete="given-name" required>
            </div>
            <div class="ack-field">
              <label for="ackLastName">Legal last name <span aria-hidden="true">*</span></label>
              <input id="ackLastName" class="ack-input" autocomplete="family-name" required>
            </div>
            <div class="ack-field">
              <label for="ackPhone">Phone</label>
              <input id="ackPhone" class="ack-input" type="tel" autocomplete="tel">
            </div>
            <div class="ack-field">
              <label>Policy version</label>
              <input class="ack-input" value="${esc(current.version)}" readonly aria-readonly="true">
            </div>
          </div>
        </section>

        <section class="ack-section">
          <h3>Acknowledgement decision</h3>
          <div class="ack-choices">
            <label class="ack-choice">
              <input id="ackDecisionApprove" type="radio" name="ackDecision" value="approved" checked>
              <span>I acknowledge</span>
            </label>
            <label class="ack-choice">
              <input id="ackDecisionReject" type="radio" name="ackDecision" value="notApproved">
              <span>I do not acknowledge</span>
            </label>
          </div>
          <div class="ack-field" style="margin-top:12px">
            <label for="ackComment">Comment if not acknowledging</label>
            <textarea id="ackComment" class="ack-textarea"></textarea>
          </div>
        </section>

        <section class="ack-section">
          <h3>Electronic consent and signature</h3>
          <label class="ack-consent">
            <input id="ackConsent" type="checkbox" required>
            <span>
              I confirm that I reviewed this policy and consent to my typed legal name,
              timestamp, electronic consent and drawn signature being recorded as evidence
              of my acknowledgement decision.
            </span>
          </label>

          <div class="ack-grid" style="margin-top:14px">
            <div class="ack-field">
              <label for="ackSignatureName">Typed legal signature <span aria-hidden="true">*</span></label>
              <input id="ackSignatureName" class="ack-input" autocomplete="name" required>
            </div>
            <div class="ack-field">
              <label for="ackTimestamp">Timestamp</label>
              <input id="ackTimestamp" class="ack-input" readonly aria-readonly="true">
            </div>
          </div>

          <div class="ack-field">
            <span class="ack-label">Draw signature <span aria-hidden="true">*</span></span>
            <canvas id="ackSignaturePad" class="sig-pad" width="1000" height="320"></canvas>
          </div>

          <div class="ack-actions">
            <button class="ack-clear" id="ackClearSig" type="button">Clear signature</button>
            <button class="ack-submit" id="ackSubmitBtn" type="submit">Submit acknowledgement</button>
          </div>
        </section>
      </form>
    </div>
  </section>`;
}

function collectAcknowledgement(){
  return{
    submissionId:ackSubmissionId,
    policyId:current?.policyId||"",
    documentId:current?.documentId||"",
    slug:current?.slug||"",
    policyVersion:current?.version||"",
    relationship:$("ackRelationship")?.value||"Customer",
    firstName:($("ackFirstName")?.value||"").trim(),
    lastName:($("ackLastName")?.value||"").trim(),
    emailAddress:($("ackEmail")?.value||"").trim(),
    phoneNumber:($("ackPhone")?.value||"").trim(),
    decision:selectedAckDecision(),
    comment:($("ackComment")?.value||"").trim(),
    electronicConsent:$("ackConsent")?.checked===true,
    signatureName:($("ackSignatureName")?.value||"").trim(),
    signatureImageData:ackHasSignature
      ?$("ackSignaturePad").toDataURL("image/png")
      :""
  };
}

function validateAcknowledgement(){
  if(!current?.acknowledgementRequired)return"Acknowledgement is not required for this policy.";
  const form=$("ackForm");
  if(!form)return"Acknowledgement form is unavailable.";

  if(!form.checkValidity()){
    form.reportValidity();
    return"Complete the required acknowledgement fields.";
  }

  if(selectedAckDecision()==="notApproved"&&!($("ackComment")?.value||"").trim()){
    return"Add a comment explaining why you do not acknowledge the policy.";
  }

  if(!ackHasSignature){
    $("ackSignaturePad")?.classList.add("invalid");
    return"Drawn signature is required.";
  }

  return"";
}

function setupAcknowledgement(){
  const required=current?.acknowledgementRequired===true;
  $("ackRailCard")?.classList.toggle("hidden",!required);
  if(!required)return;

  ackHasSignature=false;
  ackSubmitting=false;
  ackSubmissionId=newSubmissionId();

  const timestamp=$("ackTimestamp");
  if(timestamp)timestamp.value=new Date().toLocaleString();

  const jump=$("ackJumpBtn");
  if(jump){
    jump.onclick=()=>{
      $("policyAcknowledgement")?.scrollIntoView({behavior:"smooth",block:"start"});
    };
  }

  const canvas=$("ackSignaturePad");
  if(canvas){
    const context=canvas.getContext("2d");
    context.lineWidth=3;
    context.lineCap="round";
    context.strokeStyle="#022e64";

    let drawing=false;

    const point=event=>{
      const rect=canvas.getBoundingClientRect();
      const source=event.touches?event.touches[0]:event;
      return{
        x:(source.clientX-rect.left)*(canvas.width/rect.width),
        y:(source.clientY-rect.top)*(canvas.height/rect.height)
      };
    };

    const start=event=>{
      event.preventDefault();
      drawing=true;
      const p=point(event);
      context.beginPath();
      context.moveTo(p.x,p.y);
    };

    const move=event=>{
      if(!drawing)return;
      event.preventDefault();
      const p=point(event);
      context.lineTo(p.x,p.y);
      context.stroke();
      ackHasSignature=true;
      canvas.classList.remove("invalid");
    };

    const end=()=>{
      drawing=false;
    };

    ["mousedown","touchstart"].forEach(type=>
      canvas.addEventListener(type,start,{passive:false})
    );
    ["mousemove","touchmove"].forEach(type=>
      canvas.addEventListener(type,move,{passive:false})
    );
    ["mouseup","mouseleave","touchend","touchcancel"].forEach(type=>
      canvas.addEventListener(type,end)
    );

    $("ackClearSig")?.addEventListener("click",()=>{
      context.clearRect(0,0,canvas.width,canvas.height);
      ackHasSignature=false;
      canvas.classList.remove("invalid");
    });
  }

  $("ackForm")?.addEventListener("submit",event=>{
    event.preventDefault();
    if(ackSubmitting)return;

    const error=validateAcknowledgement();
    if(error){
      ackStatus(error,"bad");
      return;
    }

    ackSubmitting=true;
    const button=$("ackSubmitBtn");
    if(button)button.disabled=true;

    ackStatus("Submitting acknowledgement…","");
    post("LEGAL_ACK_SUBMIT",collectAcknowledgement());
  });
}

function render(){
  if(!current)return;

  const flat=flatten(current.sections);
  const approved=current.approvedByName||"SKANDI Legal / Compliance";
  const body=flat.length
    ?flat.map(sectionHtml).join("")
    :current.bodyHtml
      ?cleanHtml(current.bodyHtml)
      :current.bodyPlainText
        ?`<p>${esc(current.bodyPlainText)}</p>`
        :'<div class="error">The published document does not contain any content.</div>';

  $("documentHost").innerHTML=`
    <article class="document" id="policyContent">
      <header class="document-head" data-section-id="policy-document-head">
        <div class="eyebrow" data-content-id="policy-document-eyebrow">SKANDI LEGAL DOCUMENT</div>
        <h1>${esc(current.title)}</h1>
        ${current.summary?`<p class="summary">${esc(current.summary)}</p>`:""}

        <div class="meta-row">
          <span class="meta-pill"><strong>Effective</strong> ${esc(formatDate(current.effectiveDate))}</span>
          <span class="meta-pill"><strong>Version</strong> ${esc(current.version)}</span>
          <span class="meta-pill"><strong>Document</strong> ${esc(current.documentId||"Public policy")}</span>
        </div>

        ${current.pdfUrl?`
          <div class="head-actions">
            <a class="action-btn secondary" href="${esc(current.pdfUrl)}" target="_blank" rel="noopener noreferrer">
              Open published PDF
            </a>
          </div>
        `:""}
      </header>

      <div class="document-body">
        ${current.introductionHtml
          ?`<div class="introduction">${cleanHtml(current.introductionHtml)}</div>`
          :""}

        <div class="policy-body" id="policyBody">
          ${body}
        </div>

        ${acknowledgementMarkup()}

        <section class="document-control" data-section-id="policy-document-control">
          <h2>Document Control</h2>
          <table class="control-table">
            <tr><th>Document ID</th><td>${esc(current.documentId||"Not set")}</td></tr>
            <tr><th>Version</th><td>${esc(current.version)}</td></tr>
            <tr><th>Effective Date</th><td>${esc(formatDate(current.effectiveDate))}</td></tr>
            <tr><th>Last Updated</th><td>${esc(formatDate(current.updatedAt))}</td></tr>
            <tr><th>Approved By</th><td>${esc(approved)}</td></tr>
            <tr><th>Owner</th><td>${esc(current.owner)}</td></tr>
            <tr><th>Classification</th><td>External Publication</td></tr>
          </table>
        </section>
      </div>
    </article>`;

  renderToc(flat);
  renderSuggestions();
  setupTocObserver(flat);
  setupAcknowledgement();

  document.title=`${current.title} | ${current.brand}`;
  requestHeight();
}

function showError(message){
  $("ackRailCard")?.classList.add("hidden");
  $("documentHost").innerHTML=`
    <div class="error">
      <strong>Document unavailable</strong><br>
      ${esc(message||"The document could not be loaded.")}
    </div>`;
  $("toc").innerHTML='<div class="toc-empty">No table of contents is available.</div>';
  $("suggestions").innerHTML='<div class="toc-empty">Suggested documents are unavailable.</div>';
  requestHeight();
}

function navigate(path){
  const target=safeInternalPath(path);
  if(target)post("LEGAL_DOCUMENT_NAVIGATE",{path:target});
}

$("backToLegal").addEventListener("click",()=>navigate(backPath));

$("suggestions").addEventListener("click",event=>{
  const button=event.target.closest("[data-suggested-index]");
  if(!button)return;
  const item=suggested[Number(button.dataset.suggestedIndex)];
  if(item)navigate(documentRoute(item));
});

document.addEventListener("click",event=>{
  const anchor=event.target.closest(".policy-body a,.introduction a");
  if(!anchor)return;

  const href=String(anchor.getAttribute("href")||"").trim();
  if(href.startsWith("/")&&!href.startsWith("//")){
    event.preventDefault();
    navigate(href);
  }
});

let heightTimerId=0;
function requestHeight(){
  clearTimeout(heightTimerId);
  heightTimerId=setTimeout(()=>{
    post("LEGAL_DOCUMENT_HEIGHT",{
      height:Math.ceil(document.documentElement.scrollHeight)
    });
  },50);
}

window.addEventListener("message",event=>{
  const message=parseMessage(event.data);
  if(!message||message.source!==PARENT)return;

  const payload=message.payload||{};

  if(message.type==="LEGAL_DOCUMENT_CONTEXT"){
    requestContext={
      type:payload.type||"",
      slug:payload.slug||"",
      documentId:payload.documentId||"",
      policyId:payload.policyId||""
    };
    backPath=safeInternalPath(payload.backPath)||backPath;
    policyPath=safeInternalPath(payload.policyPath)||policyPath;
    return;
  }

  if(message.type==="LEGAL_DOCUMENT_DATA"){
    settleInitialDocument();
    current=normalizeDocument(payload);
    suggested=Array.isArray(payload.suggestedDocuments)
      ?payload.suggestedDocuments
      :[];
    backPath=safeInternalPath(payload.backPath)||backPath;
    policyPath=safeInternalPath(payload.policyPath)||policyPath;
    render();
    return;
  }

  if(message.type==="LEGAL_ACK_RESULT"){
    ackSubmitting=false;
    const button=$("ackSubmitBtn");
    if(button)button.disabled=false;

    ackStatus(
      payload.message||"Your policy acknowledgement has been recorded.",
      payload.ok===false?"bad":"ok"
    );

    if(payload.ok!==false){
      const form=$("ackForm");
      if(form){
        [...form.elements].forEach(element=>{
          if(element instanceof HTMLButtonElement){
            if(element.id!=="ackClearSig")element.disabled=true;
          }else{
            element.disabled=true;
          }
        });
      }
      if($("ackClearSig"))$("ackClearSig").disabled=true;
    }

    return;
  }

  if(message.type==="LEGAL_ACK_ERROR"){
    ackSubmitting=false;
    const button=$("ackSubmitBtn");
    if(button)button.disabled=false;
    ackStatus(payload.message||"The acknowledgement could not be submitted.","bad");
    return;
  }

  if(message.type==="LEGAL_DOCUMENT_ERROR"){
    settleInitialDocument();
    current=null;
    suggested=[];
    showError(payload.message);
  }
});

if("ResizeObserver"in window){
  new ResizeObserver(requestHeight).observe(document.body);
}else{
  window.addEventListener("resize",requestHeight);
}

requestInitialDocument();
requestHeight();
})();
