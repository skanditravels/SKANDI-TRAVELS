
(() => {
  document.title = "SKANDI ALTEA Unified Reservations B-007.3";
  state.travelerDrafts = state.travelerDrafts || {};
  state.agentFop = state.agentFop || {
    paymentType:"CC",vendor:"",approvalCode:"",dbi:"",passengerIds:[],segmentIds:[]
  };
  state._apisOfferId = state._apisOfferId || "";


  const REST_DOC_TYPES = ["PASSPORT","IDENTITY_CARD","VISA","KNOWN_TRAVELER","REDRESS"];


  function onlyDigits(value,max=30){ return String(value||"").replace(/\D/g,"").slice(0,max); }
  function iso2(value){ return String(value||"").toUpperCase().replace(/[^A-Z]/g,"").slice(0,2); }
  function normalizedGender(value){
    const v=String(value||"").toUpperCase();
    return ["MALE","FEMALE","UNSPECIFIED"].includes(v)?v:"";
  }
  function duffelGender(value){ return value==="MALE"?"m":value==="FEMALE"?"f":""; }
  function sanitizeGdsName(value){
    return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  }
  function gdsDate(value){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||""));
    if(!m)return "";
    const months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${m[3]}${months[Number(m[2])-1]||""}${m[1].slice(-2)}`;
  }
  function passengerKind(passenger, index){
    const raw=String(passenger?.type||"").toLowerCase();
    if(raw.includes("infant") || Number(passenger?.age)<=1)return "INF";
    if(raw.includes("child") || (Number.isFinite(Number(passenger?.age)) && Number(passenger.age)>=2 && Number(passenger.age)<=11))return "CHD";
    if(Number.isFinite(Number(passenger?.age)) && Number(passenger.age)>=12 && Number(passenger.age)<18)return "YTH";
    return "ADT";
  }
  function defaultTravelerDraft(passenger,index){
    const paxType=passengerKind(passenger,index);
    return {
      id:passenger?.id||String(index+1),paxType,title:"",dateOfBirth:"",gender:"",
      name:{firstName:"",lastName:""},
      contact:{emailAddress:"",phones:[{deviceType:"MOBILE",countryCallingCode:"1",number:""}]},
      documents:[],infantResponsibleAdultId:""
    };
  }
  function travelerDraft(passenger,index){
    const id=String(passenger?.id||index+1);
    if(!state.travelerDrafts[id])state.travelerDrafts[id]=defaultTravelerDraft(passenger,index);
    return state.travelerDrafts[id];
  }
  function docByType(draft,type){ return (draft.documents||[]).find(d=>d.documentType===type)||null; }
  function primaryTravelDoc(draft){ return (draft.documents||[]).find(d=>["PASSPORT","IDENTITY_CARD","VISA"].includes(d.documentType))||null; }
  function upsertDoc(draft,type,doc){
    draft.documents = Array.isArray(draft.documents)?draft.documents:[];
    draft.documents = draft.documents.filter(d=>d.documentType!==type && !(type==="PRIMARY" && ["PASSPORT","IDENTITY_CARD","VISA"].includes(d.documentType)));
    if(doc && doc.documentType)draft.documents.push(doc);
  }
  function primaryDocumentFromCard(card){
    const documentType=value(card,"doc_type");
    if(!documentType)return null;
    return {
      documentType,
      birthPlace:value(card,"doc_birth_place"),
      issuanceLocation:value(card,"doc_issuance_location"),
      issuanceDate:value(card,"doc_issuance_date"),
      number:value(card,"doc_number").toUpperCase().replace(/\s+/g,""),
      expiryDate:value(card,"doc_expiry_date"),
      issuanceCountry:iso2(value(card,"doc_issuance_country")),
      validityCountry:iso2(value(card,"doc_validity_country")),
      nationality:iso2(value(card,"doc_nationality")),
      holder:Boolean(card.querySelector('[data-field="doc_holder"]')?.checked)
    };
  }
  function captureDraft(card){
    if(!card)return null;
    const id=String(card.dataset.passengerId||"");
    const passenger=(state.selectedOffer?.passengers||[]).find(p=>String(p.id)===id)||{id};
    const index=Math.max(0,(state.selectedOffer?.passengers||[]).findIndex(p=>String(p.id)===id));
    const draft=travelerDraft(passenger,index);
    draft.title=value(card,"title");
    draft.dateOfBirth=value(card,"date_of_birth");
    draft.gender=normalizedGender(value(card,"gender"));
    draft.name={firstName:value(card,"first_name"),lastName:value(card,"last_name")};
    draft.contact={
      emailAddress:value(card,"email_address"),
      phones:[{deviceType:value(card,"phone_device_type")||"MOBILE",countryCallingCode:onlyDigits(value(card,"phone_country_code"),4),number:onlyDigits(value(card,"phone_number"),20)}]
    };
    draft.infantResponsibleAdultId=value(card,"infant_responsible_adult");
    upsertDoc(draft,"PRIMARY",primaryDocumentFromCard(card));
    const ktn=value(card,"known_traveler").toUpperCase().replace(/\s+/g,"");
    upsertDoc(draft,"KNOWN_TRAVELER",ktn?{documentType:"KNOWN_TRAVELER",number:ktn,holder:true}:null);
    const redress=value(card,"redress").toUpperCase().replace(/\s+/g,"");
    upsertDoc(draft,"REDRESS",redress?{documentType:"REDRESS",number:redress,holder:true}:null);
    state.travelerDrafts[id]=draft;
    return draft;
  }
  function captureAllTravelerDrafts(){ $$(".passenger-card",main).forEach(captureDraft); }
  function travelerE164(draft){
    const phone=draft?.contact?.phones?.[0]||{};
    const c=onlyDigits(phone.countryCallingCode,4),n=onlyDigits(phone.number,20);
    return c&&n?`+${c}${n}`:"";
  }
  function soapPreview(draft,index){
    const doc=primaryTravelDoc(draft);
    if(!doc || doc.documentType!=="PASSPORT")return "SSR DOCS preview requires a passport and ISO-3 country mapping in the server automation layer.";
    const gender=draft.paxType==="INF"?(draft.gender==="MALE"?"MI":draft.gender==="FEMALE"?"FI":"U"):(draft.gender==="MALE"?"M":draft.gender==="FEMALE"?"F":"U");
    const issue=doc.issuanceCountry||"??",nat=doc.nationality||"??";
    return `SR DOCS YY HK1-P-${issue}[→ISO3]-${sanitizeGdsName(doc.number)}-${nat}[→ISO3]-${gdsDate(draft.dateOfBirth)}-${gender}-${gdsDate(doc.expiryDate)}-${sanitizeGdsName(draft.name.lastName)}-${sanitizeGdsName(draft.name.firstName)}/P${index+1}`;
  }
  function documentOptions(selected){
    return `<option value="">No primary document</option>${["PASSPORT","IDENTITY_CARD","VISA"].map(v=>`<option value="${v}" ${selected===v?"selected":""}>${humanize(v)}</option>`).join("")}`;
  }
  function adultOptions(currentPassengerId,selected){
    const passengers=state.selectedOffer?.passengers||[];
    const adults=passengers.filter((p,i)=>passengerKind(p,i)==="ADT" && String(p.id)!==String(currentPassengerId));
    return `<option value="">Select responsible adult</option>${adults.map((p,i)=>`<option value="${escapeAttr(p.id)}" ${String(selected)===String(p.id)?"selected":""}>Traveler ${passengers.indexOf(p)+1} · ${escapeHTML(p.id)}</option>`).join("")}`;
  }


  function offerBase(offer){
    if(offer?.baseAmount!=null)return Number(offer.baseAmount);
    const total=Number(offer?.totalAmount),tax=Number(offer?.taxAmount);
    return Number.isFinite(total)&&Number.isFinite(tax)?Math.max(0,total-tax):null;
  }
  function offerStatus(offer){return skandiDuffelOfferExpiredNow(offer)?{code:"UN",label:"Expired / unavailable",cls:"un"}:{code:"OO",label:"Active offer",cls:""};}
  function conditionCard(title,condition){
    if(!condition)return `<div class="rule-card"><div class="label">${escapeHTML(title)}</div><strong>Not supplied</strong><div class="muted">Carrier did not return a structured rule.</div></div>`;
    const allowed=condition.allowed===true;
    const penalty=condition.penalty_amount??condition.penaltyAmount;
    const currency=condition.penalty_currency??condition.penaltyCurrency??state.selectedOffer?.totalCurrency;
    return `<div class="rule-card"><div class="label">${escapeHTML(title)}</div><strong>${allowed?"YES":"NO"}</strong><div class="muted">${allowed?(penalty!=null?`Penalty ${money(penalty,currency)}`:"Penalty not supplied"):"Not permitted before departure"}</div></div>`;
  }
  function offerRulesMarkup(offer){
    const c=offer?.conditions||{};
    return `<div class="rule-cards">${conditionCard("Refundable",c.refund_before_departure||c.refundBeforeDeparture)}${conditionCard("Changeable",c.change_before_departure||c.changeBeforeDeparture)}</div>`;
  }
  function segmentFareRows(offer) {
    const rows = [];
    (offer?.slices || []).forEach((slice, si) => {
      (slice.segments || []).forEach((seg, gi) => {
        
        // 1. Try to read raw Duffel passenger data
        let pax = Array.isArray(seg.passengers) ? seg.passengers : [];
        
        // 2. If the backend stripped the array to save space, look for flattened data or create a safe fallback
        if (!pax.length) {
          pax = [{
            cabinClass: seg.cabinClassMarketingName || seg.cabin_class || "Economy",
            fareBasisCode: seg.fareBasisCode || seg.fare_basis_code || slice.fareBasisCode || slice.fare_basis_code || "—",
            baggages: seg.baggages || seg.included_baggage || null // null means the data was stripped
          }];
        }

        pax.forEach((p) => {
          // Format Fare & Cabin Display (e.g. "Economy · Flex")
          const cabRaw = p.cabinClassMarketingName || p.cabin_class_marketing_name || p.cabinClass || p.cabin_class || "Economy";
          const cab = humanize(cabRaw);
          const brand = slice.fareBrandName || slice.fare_brand_name;
          const fareDisplay = brand && brand.toLowerCase() !== cab.toLowerCase() 
            ? `${cab} · ${brand}` 
            : cab;
          
          // Format Fare Basis Code
          const fbc = p.fareBasisCode || p.fare_basis_code || "—";
          
          // Format Baggage cleanly
          let bagStr = "—";
          if (Array.isArray(p.baggages) && p.baggages.length > 0) {
            bagStr = p.baggages.map(b => `${b.quantity || 0}${String(b.type || "").startsWith("checked") ? "PC checked" : " " + humanize(b.type)}`).join(", ");
          } else if (!p.baggages) {
            // Replace the ugly system error with a clean, professional instruction
            bagStr = '<span class="muted" style="color: #8a5200;">See airline rules</span>';
          }

          rows.push(`<tr>
            <td>${si + 1}.${gi + 1}</td>
            <td>${escapeHTML(`${seg.marketingCarrier?.iataCode || ""}${seg.marketingFlightNumber || ""}`)}</td>
            <td>${escapeHTML(fareDisplay)}</td>
            <td class="mono">${fbc !== "—" ? escapeHTML(fbc) : '<span class="muted">—</span>'}</td>
            <td>${bagStr}</td>
          </tr>`);
        });
      });
    });
    return rows.join("");
  }
  function pqrMarkup(offer){
    const st=offerStatus(offer),base=offerBase(offer),tax=offer?.taxAmount;
    return `<div class="pqr-grid">
      <section class="panel"><div class="panel-head"><span>PQR / TST-style price record</span><span class="offer-status"><span class="offer-status-code ${st.cls}">${st.code}</span>${escapeHTML(st.label)}</span></div><div class="panel-body">
        <div class="grid grid-4">
          <div><span class="muted">Base fare</span><div class="strong">${base==null?"—":money(base,offer.baseCurrency||offer.totalCurrency)}</div></div>
          <div><span class="muted">Taxes</span><div class="strong">${tax==null?"—":money(tax,offer.taxCurrency||offer.totalCurrency)}</div></div>
          <div><span class="muted">Services</span><div class="strong">${money(selectedServiceTotal(),offer.totalCurrency)}</div></div>
          <div><span class="muted">Total due</span><div class="price-total">${money(orderTotal(),offer.totalCurrency)}</div></div>
        </div>
        <div class="automation-section"><div class="automation-head"><span>Fare / baggage detail</span><span class="mono">TQQ/O1</span></div><div class="automation-body" style="padding:0"><table class="mini-table"><thead><tr><th>SEG</th><th>Flight</th><th>Fare brand / cabin</th><th>Fare basis</th><th>Included baggage</th></tr></thead><tbody>${segmentFareRows(offer)}</tbody></table></div></div>
        <div class="automation-note">The system exposes offer-level tax total but the current SKANDI provider model does not invent airport/government tax-code lines when the supplier does not return them.</div>
      </div></section>
      <aside class="panel"><div class="panel-head"><span>Mini Rules</span><span class="mono">FWR/O1</span></div><div class="panel-body">${offerRulesMarkup(offer)}<div class="money-line" style="margin-top:8px"><span>Payment deadline</span><strong>${formatDateTime(offer.paymentRequiredBy||offer.priceGuaranteeExpiresAt||offer.expiresAt)}</strong></div><div class="money-line"><span>Offer expiry</span><strong>${formatDateTime(offer.expiresAt)}</strong></div></div></aside>
    </div>`;
  }


  renderOffer = function renderOfferB0073(){
    const offer=state.selectedOffer;
    if(!offer)return `${pageHead("Offer Review","A selected offer is refreshed here before checkout.")}${emptyState("▤","No offer selected","Search for flights and choose an offer to review.")}`;
    return `${pageHead("Offer Review","Refreshed live offer with agent review.",'<button class="secondary" data-action="refresh-selected-offer">Refresh price</button><button class="secondary" data-action="offer-notice">Offer Notice</button><button class="primary" data-view="workspace">Continue to order</button>')}
      ${skandiDuffelOfferExpiredNow(offer)?alertBox("danger","Offer expired","Return to flight search and choose a current offer."):""}
      ${pqrMarkup(offer)}
      <div class="workspace-layout" style="margin-top:10px"><div>${itineraryMarkup(offer)}<section class="panel" style="margin-top:10px"><div class="panel-head">Available baggage and services</div><div class="panel-body" style="padding:0">${serviceListMarkup(offer.availableServices||[])}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head"><span>Seat maps</span><button class="link" data-action="load-seat-maps">Refresh seat maps</button></div><div class="panel-body">${seatMapMarkup()}</div></section></div>
      <aside class="panel sticky"><div class="panel-head">Offer control</div><div class="panel-body"><div class="money-line"><span>Offer ID</span><strong class="mono">${escapeHTML(offer.id||"—")}</strong></div><div class="money-line"><span>Owner / validating carrier</span><strong>${escapeHTML(offer.owner?.iataCode||offer.owner?.name||"—")}</strong></div><div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount,offer.totalCurrency)}</strong></div><div class="money-line"><span>Selected services</span><strong>${money(selectedServiceTotal(),offer.totalCurrency)}</strong></div><div class="money-line"><span>Total due</span><strong class="price-total">${money(orderTotal(),offer.totalCurrency)}</strong></div><div class="money-line"><span>Price guarantee</span><strong>${formatDateTime(offer.priceGuaranteeExpiresAt||offer.expiresAt)}</strong></div></div><div class="panel-foot"><button class="primary" data-view="workspace" ${skandiDuffelOfferExpiredNow(offer)?"disabled":""}>Continue</button></div></aside></div>`;
  }


  window.skandiAlteaPqrRender = pqrMarkup;

  passengerForm = function passengerFormB0073(passenger,index){
    const draft=travelerDraft(passenger,index),primary=primaryTravelDoc(draft)||{},ktn=docByType(draft,"KNOWN_TRAVELER"),redress=docByType(draft,"REDRESS");
    const kind=passengerKind(passenger,index),isInfant=kind==="INF";
    return `<section class="passenger-card" data-passenger-id="${escapeAttr(passenger.id)}">
      <div class="panel-head"><span>Traveler ${index+1}</span><span><span class="badge info">${escapeHTML(kind)}</span> <span class="mono muted">${escapeHTML(passenger.id||"")}</span></span></div>
      <div class="panel-body">
        <div class="automation-section" style="margin-top:0"><div class="automation-head"><span>Core identity</span><span>REST traveler</span></div><div class="automation-body"><div class="automation-grid">
          <div class="field"><label>Title</label><select data-field="title" required><option value="">Select</option>${["mr","ms","mrs","miss","dr"].map(v=>`<option value="${v}" ${draft.title===v?"selected":""}>${v}</option>`).join("")}</select></div>
          <div class="field"><label>First name</label><input class="upper-input" data-field="first_name" autocomplete="given-name" maxlength="70" value="${escapeAttr(draft.name.firstName||"")}" required></div>
          <div class="field"><label>Last name</label><input class="upper-input" data-field="last_name" autocomplete="family-name" maxlength="70" value="${escapeAttr(draft.name.lastName||"")}" required></div>
          <div class="field"><label>Date of birth</label><input data-field="date_of_birth" type="date" max="${isoDate(new Date())}" value="${escapeAttr(draft.dateOfBirth||"")}" required></div>
          <div class="field"><label>Gender</label><select data-field="gender" required>${["","MALE","FEMALE","UNSPECIFIED"].map(v=>`<option value="${v}" ${draft.gender===v?"selected":""}>${v?humanize(v):"Select"}</option>`).join("")}</select></div>
          ${isInfant?`<div class="field span-2"><label>Responsible adult / infant link</label><select data-field="infant_responsible_adult" required>${adultOptions(passenger.id,draft.infantResponsibleAdultId)}</select><div class="automation-note">Required for infant linking.</div></div>`:""}
        </div></div></div>
        <div class="automation-section"><div class="automation-head"><span>Contact</span><span>contact</span></div><div class="automation-body"><div class="automation-grid">
          <div class="field span-2"><label>Email address</label><input data-field="email_address" type="email" autocomplete="email" maxlength="254" value="${escapeAttr(draft.contact.emailAddress||"")}" required></div>
          <div class="field"><label>Phone type</label><select data-field="phone_device_type">${["MOBILE","LANDLINE","FAX"].map(v=>`<option ${draft.contact.phones?.[0]?.deviceType===v?"selected":""}>${v}</option>`).join("")}</select></div>
          <div class="field"><label>Country calling code</label><input data-field="phone_country_code" inputmode="numeric" maxlength="4" value="${escapeAttr(draft.contact.phones?.[0]?.countryCallingCode||"")}" placeholder="1" required></div>
          <div class="field span-2"><label>Phone number</label><input data-field="phone_number" inputmode="numeric" maxlength="20" value="${escapeAttr(draft.contact.phones?.[0]?.number||"")}" placeholder="2125550123" required><div class="automation-note">Digits only. ALTEA builds E.164 for the live supplier booking.</div></div>
        </div></div></div>
        <div class="automation-section"><div class="automation-head"><span>APIS / Secure Flight</span><span>documents[]</span></div><div class="automation-body">
          <div class="apis-sensitive"><strong>Secure document handling</strong>These fields are used for the live booking/SSR automation in this session. Full document numbers are not copied into the general ALTEA booking payload.</div>
          <div class="automation-grid">
            <div class="field"><label>Document type</label><select data-field="doc_type">${documentOptions(primary.documentType||"")}</select></div>
            <div class="field"><label>Document number</label><input data-field="doc_number" autocomplete="off" maxlength="50" value="${escapeAttr(primary.number||"")}"></div>
            <div class="field"><label>Issuance country (ISO 2)</label><input class="upper-input" data-field="doc_issuance_country" maxlength="2" value="${escapeAttr(primary.issuanceCountry||"")}" placeholder="US"></div>
            <div class="field"><label>Nationality (ISO 2)</label><input class="upper-input" data-field="doc_nationality" maxlength="2" value="${escapeAttr(primary.nationality||"")}" placeholder="US"></div>
            <div class="field"><label>Validity country (ISO 2)</label><input class="upper-input" data-field="doc_validity_country" maxlength="2" value="${escapeAttr(primary.validityCountry||"")}" placeholder="US"></div>
            <div class="field"><label>Birth place</label><input data-field="doc_birth_place" maxlength="120" value="${escapeAttr(primary.birthPlace||"")}"></div>
            <div class="field"><label>Issuance location</label><input data-field="doc_issuance_location" maxlength="120" value="${escapeAttr(primary.issuanceLocation||"")}"></div>
            <div class="field"><label>Issuance date</label><input data-field="doc_issuance_date" type="date" value="${escapeAttr(primary.issuanceDate||"")}"></div>
            <div class="field"><label>Expiry date</label><input data-field="doc_expiry_date" type="date" value="${escapeAttr(primary.expiryDate||"")}"></div>
            <label class="check" style="align-self:center"><input data-field="doc_holder" type="checkbox" ${primary.holder!==false&&!isInfant?"checked":""}> Primary document holder</label>
            <div class="field"><label>Known Traveler number</label><input data-field="known_traveler" maxlength="50" value="${escapeAttr(ktn?.number||"")}"></div>
            <div class="field"><label>Redress number</label><input data-field="redress" maxlength="50" value="${escapeAttr(redress?.number||"")}"></div>
          </div>
          <div class="automation-section"><div class="automation-head"><span>SOAP / cryptic preview</span><span class="mono">DOCS / DOCO / DOCA</span></div><div class="automation-body"><div class="gds-preview" data-gds-preview>${escapeHTML(soapPreview(draft,index))}</div><div class="automation-note">Server automation must convert ISO-2 country values to ISO-3 before generating an AIRIMP SSR. The UI deliberately does not fake that conversion.</div></div></div>
        </div></div>
      </div>
    </section>`;
  }


  function fopAssociations(offer){
    const pax=(offer?.passengers||[]).map((p,i)=>`<label><input type="checkbox" class="fop-pax" value="${escapeAttr(p.id)}" ${!state.agentFop.passengerIds.length||state.agentFop.passengerIds.includes(p.id)?"checked":""}> Traveler ${i+1} · ${escapeHTML(p.id)}</label>`).join("");
    const seg=[];(offer?.slices||[]).forEach((s,si)=>(s.segments||[]).forEach((g,gi)=>seg.push(`<label><input type="checkbox" class="fop-seg" value="${escapeAttr(g.id)}" ${!state.agentFop.segmentIds.length||state.agentFop.segmentIds.includes(g.id)?"checked":""}> ${escapeHTML(`${g.marketingCarrier?.iataCode||""}${g.marketingFlightNumber||""}`)} · ${escapeHTML(g.origin?.iataCode||"")}→${escapeHTML(g.destination?.iataCode||"")}</label>`)));
    return `<div class="automation-grid cols-2"><div><div class="strong" style="margin-bottom:5px">Passenger association</div><div class="fop-associations">${pax||'<span class="muted">No travelers</span>'}</div></div><div><div class="strong" style="margin-bottom:5px">Segment association</div><div class="fop-associations">${seg.join("")||'<span class="muted">No segments</span>'}</div></div></div>`;
  }
  function fopPanel(offer){
    const f=state.agentFop;
    return `<section class="panel"><div class="panel-head"><span>Form of Payment</span><span class="mono">FOP</span></div><div class="panel-body">
      <div class="automation-grid">
        <div class="field"><label>Payment type</label><select id="fopType"><option value="CC" ${f.paymentType==="CC"?"selected":""}>Credit Card (CC)</option><option value="CASH" ${f.paymentType==="CASH"?"selected":""}>Cash (CASH)</option><option value="INV" ${f.paymentType==="INV"?"selected":""}>Invoice (INV)</option><option value="CHECK" ${f.paymentType==="CHECK"?"selected":""}>Check (CHECK)</option><option value="NONREF" ${f.paymentType==="NONREF"?"selected":""}>Non-Refundable (NONREF)</option></select></div>
        <div class="field"><label>Vendor / card type</label><select id="fopVendor"><option value="">Secure element / auto</option>${[["VI","Visa"],["CA","Mastercard"],["AX","American Express"],["TP","UATP"]].map(([v,l])=>`<option value="${v}" ${f.vendor===v?"selected":""}>${v} · ${l}</option>`).join("")}</select></div>
        <div class="field"><label>Approval code</label><input id="fopApproval" maxlength="20" value="${escapeAttr(f.approvalCode||"")}" placeholder="External terminal only"></div>
        <div class="field"><label>DBI / cost center</label><input id="fopDbi" maxlength="100" value="${escapeAttr(f.dbi||"")}" placeholder="Cost center / employee ID"></div>
      </div>
      ${fopAssociations(offer)}
      <div id="paymentArea" style="margin-top:10px"><div class="alert info"><span>🔒</span><div><strong>PCI-DSS secure card capture</strong>For CC, card number and expiry are entered only inside Stripe's hosted Payment Element. ALTEA never receives the raw PAN and cannot reveal it again.</div></div><div class="money-line"><span>Validating carrier</span><strong>${escapeHTML(offer.owner?.iataCode||offer.owner?.name||"Provider determined")}</strong></div><div class="automation-note">Card-brand acceptance is validated by the secure payment path.</div><div class="money-line"><span>Stored card display</span><strong class="fop-mask">${state.payment?.paymentIntentId?`TOKEN ${escapeHTML(state.payment.paymentIntentId)}`:"CC••••••••••••••••"}</strong></div><button type="button" class="secondary" data-action="prepare-payment" ${skandiDuffelOfferExpiredNow(offer)?"disabled":""}>Add / authorize Form of Payment</button><div id="paymentStatus" class="muted" style="margin-top:8px">${state.payment?.paymentIntentId?`Secure payment reference: ${escapeHTML(state.payment.paymentIntentId)}`:"No payment prepared."}</div></div>
      <div class="automation-note">The current instant-order settlement path is card; unsupported FOP types cannot be used to create an instant order.</div>
    </div></section>`;
  }


  renderWorkspace = function renderWorkspaceB0073(){
    const offer=state.selectedOffer;
    if(!offer)return `${pageHead("Order Workspace","Traveler details, payment, and order creation.")}${emptyState("◫","No refreshed offer","Select and refresh a live offer before creating an order.")}`;
    const passengers=offer.passengers||[];
    return `${pageHead("Create Flight Booking")}${skandiDuffelOfferExpiredNow(offer)?alertBox("danger","Offer expired","Do not collect payment. Return to search and refresh a current offer."):""}<form id="orderForm"><div class="grid" style="gap:10px">${pqrMarkup(offer)}${passengers.map((p,i)=>passengerForm(p,i)).join("")}${fopPanel(offer)}<section class="panel"><div class="panel-head">Order control</div><div class="panel-body"><div class="automation-grid cols-2"><div class="field"><label for="orderType">Order type</label><select id="orderType"><option value="instant">Instant purchase</option><option value="hold" ${offer.requiresInstantPayment?"disabled":""}>Hold (when permitted)</option></select></div><div class="field"><label for="orderRemarks">Internal reference</label><input id="orderRemarks" maxlength="100" autocomplete="off" placeholder="SKANDI booking reference"></div></div></div><div class="panel-foot"><button class="secondary" type="button" data-action="offer-notice">Offer Notice</button><button class="primary" type="submit" ${skandiDuffelOfferExpiredNow(offer)?"disabled":""}>Create order</button></div></section></div></form>`;
  }


  function captureFop(){
    state.agentFop={
      paymentType:$("#fopType")?.value||state.agentFop.paymentType||"CC",
      vendor:$("#fopVendor")?.value||"",
      approvalCode:$("#fopApproval")?.value.trim()||"",
      dbi:$("#fopDbi")?.value.trim()||"",
      passengerIds:$$(".fop-pax:checked",main).map(x=>x.value),
      segmentIds:$$(".fop-seg:checked",main).map(x=>x.value)
    };
    return state.agentFop;
  }


  validatePassengerForms = function validatePassengerFormsB0073(showNative){
    captureAllTravelerDrafts();
    const cards=$$(".passenger-card",main);
    if(!cards.length)return "No live traveler records were returned for this offer.";
    const adultUse=new Set();
    for(let index=0;index<cards.length;index++){
      const card=cards[index],draft=captureDraft(card);
      const required=$$("[required]",card),invalid=required.find(input=>!input.checkValidity());
      if(invalid){if(showNative)invalid.reportValidity();return `Complete ${invalid.closest(".field")?.querySelector("label")?.textContent||"the required field"} for traveler ${index+1}.`;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.emailAddress||""))return `Enter a valid email address for traveler ${index+1}.`;
      if(!/^\d{1,4}$/.test(draft.contact.phones?.[0]?.countryCallingCode||"") || !/^\d{6,20}$/.test(draft.contact.phones?.[0]?.number||""))return `Enter country calling code and digits-only phone number for traveler ${index+1}.`;
      if(draft.gender==="UNSPECIFIED")return `Traveler ${index+1} uses UNSPECIFIED gender. The internal traveler model allows it, but order creation requires selected gender before supplier booking.`;
      const primary=primaryTravelDoc(draft);
      if(state.selectedOffer?.identityDocumentRequired && primary?.documentType!=="PASSPORT")return `Traveler ${index+1} requires a passport for this offer.`;
      if(primary){
        if(!primary.number || !primary.issuanceCountry || !primary.expiryDate)return `Complete document number, issuing country and expiry for traveler ${index+1}.`;
        if(!/^[A-Z]{2}$/.test(primary.issuanceCountry))return `Use a two-letter issuing country for traveler ${index+1}.`;
        if(primary.nationality && !/^[A-Z]{2}$/.test(primary.nationality))return `Use a two-letter nationality code for traveler ${index+1}.`;
      }
      if(draft.paxType==="INF"){
        if(!draft.infantResponsibleAdultId)return `Select the responsible adult for infant traveler ${index+1}.`;
        if(adultUse.has(draft.infantResponsibleAdultId))return "Each lap infant must be linked to a different responsible adult.";
        adultUse.add(draft.infantResponsibleAdultId);
      }
    }
    return "";
  }


  function buildAutomationTravelers(){captureAllTravelerDrafts();return (state.selectedOffer?.passengers||[]).map((p,i)=>travelerDraft(p,i));}
  function buildDuffelPassengers(automationTravelers){
    const out=automationTravelers.map(d=>{
      const primary=primaryTravelDoc(d);
      const identityDocuments=[];
      if(primary?.documentType==="PASSPORT")identityDocuments.push({type:"passport",uniqueIdentifier:primary.number,issuingCountryCode:primary.issuanceCountry,expiresOn:primary.expiryDate});
      const ktn=docByType(d,"KNOWN_TRAVELER");if(ktn?.number)identityDocuments.push({type:"known_traveler_number",uniqueIdentifier:ktn.number});
      const redress=docByType(d,"REDRESS");if(redress?.number)identityDocuments.push({type:"passenger_redress_number",uniqueIdentifier:redress.number});
      return {id:d.id,title:d.title,givenName:d.name.firstName,familyName:d.name.lastName,bornOn:d.dateOfBirth,gender:duffelGender(d.gender),email:d.contact.emailAddress,phoneNumber:travelerE164(d),identityDocuments};
    });
    automationTravelers.filter(d=>d.paxType==="INF"&&d.infantResponsibleAdultId).forEach(inf=>{const adult=out.find(x=>String(x.id)===String(inf.infantResponsibleAdultId));if(adult)adult.infantPassengerId=inf.id;});
    return out;
  }


  preparePayment = async function preparePaymentB0073(){
    if(!state.selectedOffer || skandiDuffelOfferExpiredNow(state.selectedOffer))
      return toast("Offer expired", "Refresh the offer before collecting payment.", "warning");
    captureFop();
    const orderType=$("#orderType")?.value||"instant";
    if(orderType==="hold")return toast("Payment not required","A hold order is created without payment or paid services.","info");
    if(state.agentFop.paymentType!=="CC")return toast("FOP not supported for supplier issue",`${state.agentFop.paymentType} is available in the agent UI, but this instant-order path currently settles by secure card/Stripe only. Use CC or a permitted hold order.`,"warning");
    const passengerError=validatePassengerForms(false);if(passengerError)return toast("Traveler details incomplete",passengerError,"warning");
    requestOrderPaymentPreparation();
  }


  submitOrder = function submitOrderB0073(event){
    event.preventDefault();
    const offer=state.selectedOffer;if(!offer||skandiDuffelOfferExpiredNow(offer))return toast("Offer unavailable","Refresh or select a current offer.","warning");
    const err=validatePassengerForms(true);if(err)return toast("Traveler details incomplete",err,"warning");
    captureFop();
    const orderType=$("#orderType")?.value||"instant";
    if(orderType==="hold"&&state.selectedServices.size)return toast("Services unavailable on hold","Remove paid seats and baggage before creating a hold order.","warning");
    if(orderType==="instant"&&state.agentFop.paymentType!=="CC")return toast("Unsupported FOP",`${state.agentFop.paymentType} is not a supported settlement method for this instant-order adapter.`,"warning");
    if(orderType==="instant"&&!state.payment?.paymentIntentId)return toast("Payment required","Add and confirm secure card payment before creating the order.","warning");
    const automationTravelers=buildAutomationTravelers();
    const passengers=buildDuffelPassengers(automationTravelers);
    const fopSummary={paymentType:state.agentFop.paymentType,vendor:state.agentFop.vendor,approvalCode:state.agentFop.approvalCode,dbi:state.agentFop.dbi,passengerIds:state.agentFop.passengerIds,segmentIds:state.agentFop.segmentIds};
    openModal("Confirm order creation",`${alertBox("warning","Final booking action",orderType==="instant"?"The secure booking service will verify payment, refresh the live offer again, and create the airline order.":"This creates a hold order without payment. The airline payment deadline will apply.")}<div class="money-line"><span>Order type</span><strong>${escapeHTML(orderType)}</strong></div><div class="money-line"><span>Travelers</span><strong>${passengers.length}</strong></div><div class="money-line"><span>FOP</span><strong>${escapeHTML(fopSummary.paymentType)}${fopSummary.vendor?` · ${escapeHTML(fopSummary.vendor)}`:""}</strong></div><div class="money-line"><span>Total</span><strong>${money(orderTotal(),offer.totalCurrency)}</strong></div>`,[
      {label:"Back",className:"secondary",close:true},
      {label:"Create order",className:"primary",onClick:()=>{if(skandiDuffelOfferExpiredNow(state.selectedOffer))return toast("Offer expired","Refresh the offer before creating the order.","warning");closeModal();state._lastAutomationTravelers=automationTravelers;state._lastFopSummary=fopSummary;post("DUFFEL_CREATE_ORDER",{offerId:offer.id,orderType,passengers,services:orderType==="instant"?selectedServicePayload():[],paymentIntentId:orderType==="instant"?state.payment.paymentIntentId:null,internalReference:$("#orderRemarks")?.value.trim()||""});}}
    ]);
  }


  function offerNoticeText(offer){
    const st=offerStatus(offer),c=offer.conditions||{},base=offerBase(offer);
    const segs=(offer.slices||[]).flatMap(s=>(s.segments||[]).map(g=>`${g.marketingCarrier?.iataCode||""}${g.marketingFlightNumber||""} ${g.origin?.iataCode||""}-${g.destination?.iataCode||""} ${formatDateTime(g.departingAt)} / ${formatDateTime(g.arrivingAt)}`));
    const rule=(x)=>x?`${x.allowed===true?"YES":"NO"}${x.allowed===true&&x.penalty_amount!=null?` · penalty ${money(x.penalty_amount,x.penalty_currency||offer.totalCurrency)}`:""}`:"Not supplied";
    return [`SKANDI TRAVELS · OFFER NOTICE`,`Status: ${st.code} ${st.label}`,`Offer: ${offer.id||""}`,`Validating carrier: ${offer.owner?.iataCode||offer.owner?.name||""}`,`Base fare: ${base==null?"—":money(base,offer.baseCurrency||offer.totalCurrency)}`,`Taxes: ${offer.taxAmount==null?"—":money(offer.taxAmount,offer.taxCurrency||offer.totalCurrency)}`,`Services: ${money(selectedServiceTotal(),offer.totalCurrency)}`,`Total: ${money(orderTotal(),offer.totalCurrency)}`,`Expires: ${formatDateTime(offer.expiresAt)}`,`Refundable: ${rule(c.refund_before_departure)}`,`Changeable: ${rule(c.change_before_departure)}`,"",...segs].join("\n");
  }
  function openOfferNotice(){
    const offer=state.selectedOffer;if(!offer)return toast("No offer selected","Select and refresh an offer first.","warning");
    const text=offerNoticeText(offer),win=window.open("","_blank","noopener,noreferrer");
    if(!win)return toast("Popup blocked","Allow popups to print the Offer Notice.","warning");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SKANDI Offer Notice</title><style>body{font-family:Arial,sans-serif;color:#1d2a34;margin:36px}h1{color:#005eb8}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ccd5dc;padding:8px;text-align:left}.muted{color:#687783}.total{font-size:20px;font-weight:800}.toolbar{margin-bottom:18px}@media print{.toolbar{display:none}}</style></head><body><div class="toolbar"><button onclick="print()">Print / Save PDF</button> <a href="mailto:?subject=${encodeURIComponent("SKANDI Offer Notice")}&body=${encodeURIComponent(text)}">Email summary</a></div><h1>SKANDI TRAVELS</h1><h2>Offer Notice</h2><pre style="white-space:pre-wrap;font:14px/1.55 Arial,sans-serif">${escapeHTML(text)}</pre><p class="muted">Generated from the current live supplier offer. Individual tax codes are shown only when returned by the provider; SKANDI does not invent tax components.</p></body></html>`);win.document.close();
  }


  passengerEditor = function passengerEditorB0073(p){
    const a=p.payload?.apisAutomationMeta||{};
    return `<form id="passengerOpsForm" data-passenger-id="${escapeAttr(p.id)}"><div class="grid grid-2"><div class="field"><label>First name</label><input id="paxFirst" value="${escapeAttr(p.firstName||"")}"></div><div class="field"><label>Last name</label><input id="paxLast" value="${escapeAttr(p.lastName||"")}"></div></div><div class="grid grid-2"><div class="field"><label>Nationality</label><input id="paxNationality" maxlength="3" value="${escapeAttr(p.nationality||"")}"></div><div class="field"><label>Passport</label><input readonly value="${p.passportLast4?`•••• ${escapeAttr(p.passportLast4)}`:"Full number not stored in general ALTEA payload"}"></div></div><div class="automation-section"><div class="automation-head">APIS automation status</div><div class="automation-body"><div class="money-line"><span>Captured document type</span><strong>${escapeHTML(a.documentType||"—")}</strong></div><div class="money-line"><span>Document expiry</span><strong>${escapeHTML(a.expiryDate||"—")}</strong></div><div class="money-line"><span>Issuing country</span><strong>${escapeHTML(a.issuanceCountry||"—")}</strong></div><div class="money-line"><span>Secure Flight / KTN</span><strong>${a.hasKnownTraveler?"Captured securely for booking session":"—"}</strong></div><div class="money-line"><span>Redress</span><strong>${a.hasRedress?"Captured securely for booking session":"—"}</strong></div></div></div><div class="field"><label>APIS status</label><select id="paxApis">${["not_started","captured","complete","needs_review"].map(v=>option(v,humanize(v),p.apisStatus)).join("")}</select></div><div class="field"><label>Document status</label><select id="paxDoc">${["not_checked","pending_check","verified","needs_review","rejected"].map(v=>option(v,humanize(v),p.documentStatus)).join("")}</select></div><div class="grid grid-2"><div class="field"><label>Seat</label><input id="paxSeat" maxlength="10" value="${escapeAttr(p.seatNumber||"")}"></div><div class="field"><label>Sequence</label><input id="paxSeq" maxlength="20" value="${escapeAttr(p.sequenceNumber||"")}"></div></div><div class="field"><label>Airline check-in status</label><select id="paxCheckin">${["not_checked_in","carrier_managed","checked_in","boarded","no_show"].map(v=>option(v,humanize(v),p.checkinStatus)).join("")}</select></div><div class="field"><label>Operational note</label><textarea id="paxNote">${escapeHTML(p.payload?.operationalNote||"")}</textarea></div><button class="primary" type="submit">Save passenger</button></form>`;
  }


  savePassengerOps = function savePassengerOpsB0073(event){
    event.preventDefault();const form=event.currentTarget;
    post("ALTEA_UPDATE_PASSENGER",{passengerId:form.dataset.passengerId,patch:{firstName:$("#paxFirst")?.value||"",lastName:$("#paxLast")?.value||"",nationality:$("#paxNationality")?.value||"",apisStatus:$("#paxApis")?.value||"",documentStatus:$("#paxDoc")?.value||"",checkinStatus:$("#paxCheckin")?.value||"",seatNumber:$("#paxSeat")?.value||"",sequenceNumber:$("#paxSeq")?.value||"",payload:{operationalNote:$("#paxNote")?.value||""}}});
  }


  function updateGdsPreview(card){
    const draft=captureDraft(card);if(!draft)return;const all=state.selectedOffer?.passengers||[],index=Math.max(0,all.findIndex(p=>String(p.id)===String(card.dataset.passengerId)));const box=card.querySelector("[data-gds-preview]");if(box)box.textContent=soapPreview(draft,index);
  }
  main.addEventListener("input",event=>{
    const e=event.target;if(!e?.id)return;
    const map={
      stayDest74:"destination", stayIn74:"checkInDate", stayOut74:"checkOutDate", stayRooms74:"rooms", stayAdults74:"adults", stayRadius74:"radiusKm",
      carPickup:"pickup", carDropoff:"dropoff", carPickupDate:"pickupDate", carPickupTime:"pickupTime", carDropoffDate:"dropoffDate", carDropoffTime:"dropoffTime", carAge:"age", carResidence:"residence"
    };
    const key=map[e.id];
    if(key) {
      if (e.id.startsWith("car")) {
         state.carSearchDraft = state.carSearchDraft || {};
         state.carSearchDraft[key] = key === "age" ? Number(e.value || 0) : e.value;
      } else {
         state.hotelSearchDraft[key] = ["rooms","adults","radiusKm"].includes(key) ? Number(e.value || 0) : e.value;
      }
    }
  });
  main.addEventListener("change",event=>{const card=event.target.closest?.(".passenger-card");if(card)updateGdsPreview(card);if(event.target.matches?.("#fopType,#fopVendor,.fop-pax,.fop-seg")){captureFop();if(event.target.id==="fopType")render();}});
  main.addEventListener("click",event=>{const el=event.target.closest?.("[data-action]");if(!el)return;if(el.dataset.action==="offer-notice"){event.preventDefault();openOfferNotice();}});


  if(["offer","workspace","passengers"].includes(state.activeView))render();


  window.addEventListener("message",event=>{
    const message=typeof event.data==="string"?(()=>{try{return JSON.parse(event.data)}catch(_){return null}})():event.data;
    if(!message||message.source!==PARENT_SOURCE)return;
    const payload=message.payload||{};
    if(message.type==="DUFFEL_OFFER_RESULT"){
      const id=payload.offer?.id||"";
      if(id && state._apisOfferId!==id){state.travelerDrafts={};state._apisOfferId=id;state.agentFop={paymentType:"CC",vendor:"",approvalCode:"",dbi:"",passengerIds:[],segmentIds:[]};}
    }
    if(message.type==="DUFFEL_ORDER_CREATED" && state._verifiedOrderCreationRequestId===message.requestId){
      if(payload.alteaWorkspace?.booking?.id && Array.isArray(state._lastAutomationTravelers)){
      const workspace=payload.alteaWorkspace;
      const bySupplier=new Map((workspace.passengers||[]).map(p=>[String(p.supplierPassengerId||""),p]));
      state._lastAutomationTravelers.forEach(draft=>{
        const p=bySupplier.get(String(draft.id));if(!p)return;
        const primary=primaryTravelDoc(draft);
        post("ALTEA_UPDATE_PASSENGER",{bookingId:workspace.booking.id,passengerId:p.id,patch:{nationality:primary?.nationality||"",apisStatus:primary?"captured":"not_started",documentStatus:primary?"pending_check":"not_checked",payload:{apisAutomationMeta:{documentType:primary?.documentType||"",expiryDate:primary?.expiryDate||"",issuanceCountry:primary?.issuanceCountry||"",validityCountry:primary?.validityCountry||"",holder:primary?.holder===true,hasKnownTraveler:Boolean(docByType(draft,"KNOWN_TRAVELER")),hasRedress:Boolean(docByType(draft,"REDRESS")),capturedAt:new Date().toISOString()}}}},{busy:false});
      });
      if(state._lastFopSummary){
        const f=state._lastFopSummary;
        post("ALTEA_ADD_HISTORY_NOTE",{bookingId:workspace.booking.id,eventType:"FORM_OF_PAYMENT_RECORDED",note:`FOP ${f.paymentType}${f.vendor?`/${f.vendor}`:""}${f.approvalCode?` approval ${f.approvalCode}`:""}${f.dbi?` DBI ${f.dbi}`:""}; passengers=${f.passengerIds.join(",")||"ALL"}; segments=${f.segmentIds.join(",")||"ALL"}. Raw card data was handled by Stripe and not stored in ALTEA.`},{busy:false});
      }
      }
      state._verifiedOrderCreationRequestId="";
      state._lastAutomationTravelers=null;
      state._lastFopSummary=null;
    }
  });
})();
