
(function(){
  "use strict";

  VIEW_TITLES.transfers = "Transfers";
  VIEW_TITLES.services = "Seats & Services";

  const originalRenderV12 = render;
  const originalPreferencesV12 = renderPreferences;
  const originalOpenLocalBookingModalV12 = openLocalBookingModal;
  const terminalResponseTypes = new Set(["DUFFEL_ERROR", "ALTEA_ERROR"]);

  function activePnrSession(){ return isPnrSession(); }

  function ensureTransferNav(){
    if(document.querySelector('.nav-item[data-view="transfers"]')) return;
    const cars=document.querySelector('.nav-item[data-view="cars"]');
    if(!cars)return;
    const button=document.createElement("button");
    button.type="button";
    button.className="nav-item";
    button.dataset.view="transfers";
    button.innerHTML='<span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="10" rx="2"></rect><path d="M7 16v2M17 16v2M5 10h14M8 6V4h8v2"></path></svg></span><span class="nav-label">Transfers</span>';
    cars.insertAdjacentElement("afterend",button);
  }

  function configureAmadeusNavigation(){
    ensureTransferNav();
    const services=document.querySelector('.nav-item[data-view="services"]');
    const passengers=document.querySelector('.nav-item[data-view="passengers"]');
    if(services){
      const label=services.querySelector('.nav-label');
      if(label)label.textContent="Seats & Services";
      if(passengers && services.previousElementSibling!==passengers) passengers.insertAdjacentElement("afterend",services);
    }
    ["offer","workspace"].forEach(view=>{
      const button=document.querySelector(`.nav-item[data-view="${view}"]`);
      if(button){button.classList.add("pnr-internal-nav");button.setAttribute("aria-hidden","true");}
    });
  }

  function updatePnrLockUi(){
    configureAmadeusNavigation();
    const home=isHomeSession();
    const hasBooking=Boolean(state.alteaWorkspace?.booking);
    document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
      const view=btn.dataset.view||"";
      let frozen=false;
      let reason="";
      if(home && PNR_INTERNAL_VIEWS.has(view)){
        frozen=true;reason="Open or retrieve a PNR to use this function";
      }else if(!home && GLOBAL_ONLY_VIEWS.has(view)){
        frozen=true;reason="Switch to Home to use this global function";
      }else if(!home && PNR_REQUIRES_BOOKING_VIEWS.has(view) && !hasBooking){
        frozen=true;reason="Create the booking file before using this PNR function";
      }
      btn.classList.toggle("pnr-frozen",frozen);
      btn.setAttribute("aria-disabled",frozen?"true":"false");
      if(frozen)btn.title=reason;
      else if(!btn.classList.contains("pnr-internal-nav") && /^(Open or retrieve a PNR|Switch to Home|Create the booking file)/.test(btn.title||"")) btn.removeAttribute("title");
    });
    document.body.classList.toggle("altea-home-context",home);
    document.body.classList.toggle("altea-pnr-context",!home);
  }

  // Keep seat maps wholly inside the Seats & Services sub-page. Refreshing an
  // air offer must never re-insert or reload the seat module in Offer Review.
  const originalLoadSeatMapsV12=loadSeatMaps;
  loadSeatMaps=function loadSeatMapsV12Scoped(){
    if(state.activeView!=="services")return;
    return originalLoadSeatMapsV12();
  };

  openLocalBookingModal=function openLocalBookingModalV12Scoped(){
    if(isHomeSession()){
      const sessionId=createNewSession("transfers");
      if(!sessionId)return;
    }
    return originalOpenLocalBookingModalV12();
  };

  function airlineLogoUrl(offer){
    const owner=offer?.owner||{};
    const code=owner.iataCode||owner.iata_code||offer?.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode||"";
    return owner.logo_symbol_url||owner.logoSymbolUrl||owner.logo_lockup_url||owner.logoLockupUrl||(code?`https://images.kiwi.com/airlines/64/${encodeURIComponent(code)}.png`:"");
  }
  function carrierIdentity(offer){
    const owner=offer?.owner||{};
    const code=owner.iataCode||owner.iata_code||offer?.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode||"";
    const name=owner.name||offer?.slices?.[0]?.segments?.[0]?.marketingCarrier?.name||code||"Operating airline";
    const url=airlineLogoUrl(offer);
    return `<div class="offer-carrier-identity">${url?`<img class="offer-carrier-logo" src="${escapeAttr(url)}" alt="${escapeAttr(name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:""}<div class="offer-carrier-mark" style="${url?"display:none":""}">${escapeHTML(code||"AIR")}</div><div><div class="offer-carrier-name">${escapeHTML(name)}</div><div class="offer-carrier-meta">${escapeHTML(code||"—")} · live supplier offer</div></div></div>`;
  }

  renderOffer=function renderOfferV12Fixed(){
    const offer=state.selectedOffer;
    if(!offer)return `${pageHead("Offer Review","A selected offer is refreshed here before checkout.")}${emptyState("▤","No offer selected","Search for flights and choose an offer to review.")}`;
    return `${pageHead("Offer Review","Refreshed live offer with agent review.",'<button class="secondary" data-action="refresh-selected-offer">Refresh price</button><button class="secondary" data-action="offer-notice">Offer Notice</button><button class="primary" data-view="workspace">Continue to order</button>')}
      ${skandiDuffelOfferExpiredNow(offer)?alertBox("danger","Offer expired","Return to flight search and choose a current offer."):""}
      ${carrierIdentity(offer)}
      ${window.skandiAlteaPqrRender(offer)}
      <div class="workspace-layout" style="margin-top:10px"><div>${itineraryMarkup(offer)}${supplierTravelDisclosure(offer)}<section class="panel" style="margin-top:10px"><div class="panel-head">Available baggage and airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(offer.availableServices||[])}</div></section><div class="alert info" style="margin-top:10px"><span>ℹ</span><div><strong>Seats & Services is a separate PNR step</strong>Refreshing this offer updates price and availability only. Seat maps load only when the Seats & Services page is opened.</div></div></div>
      <aside class="panel sticky"><div class="panel-head">Offer control</div><div class="panel-body"><div class="money-line"><span>Offer ID</span><strong class="mono">${escapeHTML(offer.id||"—")}</strong></div><div class="money-line"><span>Owner / validating carrier</span><strong>${escapeHTML(offer.owner?.iataCode||offer.owner?.iata_code||offer.owner?.name||"—")}</strong></div><div class="money-line"><span>Offer</span><strong>${money(offer.totalAmount,offer.totalCurrency)}</strong></div><div class="money-line"><span>Selected services</span><strong>${money(selectedServiceTotal(),offer.totalCurrency)}</strong></div><div class="money-line"><span>Total due</span><strong class="price-total">${money(orderTotal(),offer.totalCurrency)}</strong></div><div class="money-line"><span>Price guarantee</span><strong>${formatDateTime(offer.priceGuaranteeExpiresAt||offer.expiresAt)}</strong></div></div><div class="panel-foot"><button class="primary" data-view="workspace" ${skandiDuffelOfferExpiredNow(offer)?"disabled":""}>Continue</button></div></aside></div>`;
  };

  renderServices=function renderServicesV12Fixed(){
    const offer=state.selectedOffer;
    const w=state.alteaWorkspace;
    return `${pageHead("Seats & Services","Airline-controlled seats, baggage and special-service requests for the active PNR.",'<button class="secondary" data-action="load-seat-maps">Refresh seat map</button>')}
      <div class="pnr-lock-note">This sub-page belongs to the active PNR. Transfer inventory is sold separately from Transfers and never appears inside the seat map.</div>
      ${offer?`<section class="panel"><div class="panel-head"><span>Seats & Services Catalogue</span><span class="mono">${escapeHTML(offer.id||"")}</span></div><div class="panel-body" style="padding:0">${seatMapMarkup()}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head">Live airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(offer.availableServices||[])}</div></section>`:emptyState("▦","No active airline offer","Search/select an air offer in this PNR before choosing airline seats and services.")}
      ${w?.passengers?.length?`<section class="panel" style="margin-top:10px"><div class="panel-head">Passenger operational status</div><div class="panel-body" style="padding:0">${passengerTable(w.passengers)}</div></section>`:""}`;
  };

  renderBaggageBoarding=function renderBaggageBoardingV12Fixed(){
    const w=state.alteaWorkspace;
    const baggage=(state.selectedOffer?.availableServices||[]).filter(s=>String(s.type||"").toLowerCase()==="baggage");
    return `${pageHead("Baggage & Boarding","Airline baggage services and boarding status for the active PNR.",'<button class="primary" data-view="services">Seats & Services</button>')}
      <div class="pnr-lock-note">Transfer inventory is not part of this module. Use the separate Transfers product page to add a transfer to this PNR.</div>
      <div class="grid grid-2"><section class="panel"><div class="panel-head">Baggage services</div><div class="panel-body" style="padding:0">${baggage.length?serviceListMarkup(baggage):'<div class="empty">No live baggage services returned for the current air offer.</div>'}</div></section><section class="panel"><div class="panel-head">Boarding / passenger status</div><div class="panel-body" style="padding:0">${w?.passengers?.length?passengerTable(w.passengers):'<div class="empty">Open a booking to display passenger boarding status.</div>'}</div></section></div>`;
  };

  function transferItems(){
    return (state.inventory||[]).filter(i=>String(i.entityType||i.type||"").toUpperCase().replace(/[\\s-]+/g,"_")==="TRANSFER");
  }
  function transferCards(items){
    if(!items.length)return emptyState("▱","No transfer inventory","No published transfer products match this search.");
    return items.map(i=>`<article class="transfer-product-card" data-v12-transfer-card><div class="transfer-product-head"><strong>${escapeHTML(i.name||i.title||"Transfer")}</strong><span class="mono">${escapeHTML(i.publicId||i.code||"")}</span></div><div class="transfer-product-body"><div><div>${escapeHTML(i.city||i.destination||i.category||"Transfer service")}</div><div class="transfer-product-meta">${escapeHTML(i.description||i.summary||"Published SKANDI transfer inventory")}</div></div><div style="text-align:right"><div class="transfer-product-price">${i.publicPrice?money(i.publicPrice,i.currency||state.preferences.currency):"Quote"}</div><button class="primary" data-v12-transfer-entity="${escapeAttr(i.id)}">Add to PNR</button></div></div></article>`).join("");
  }
  function renderTransfersV12(){
    const all=transferItems();
    return `${pageHead("Transfers","Search and add published transfer inventory as a first-class PNR product.",'<button class="secondary" data-action="refresh-all">Refresh inventory</button>')}
      <div class="pnr-lock-note">Flights, hotels, cars and transfers share this same PNR record tab. Global Home functions stay locked until you switch back to Home.</div>
      <div class="transfer-search-layout"><section><section class="panel"><div class="panel-head">Transfer search</div><div class="panel-body"><input id="v12TransferFilter" class="transfer-filter-input" placeholder="Search transfer, destination, airport, resort or code"></div></section><div id="v12TransferResults" style="margin-top:8px">${transferCards(all)}</div></section><aside class="panel sticky"><div class="panel-head">PNR basket</div><div class="panel-body"><div class="money-line"><span>Workspace</span><strong class="mono">${escapeHTML(state.alteaWorkspace?.booking?.bookingReference||state.alteaWorkspace?.booking?.pnrLocator||"NEW PNR")}</strong></div><div class="money-line"><span>Transfer products</span><strong>${all.length}</strong></div><div class="money-line"><span>Booking file</span><strong>${state.alteaWorkspace?.booking?"OPEN":"NOT YET CREATED"}</strong></div><div class="muted" style="margin-top:8px">Choose a transfer. If the PNR has not yet been saved, Reservations creates its booking shell and then adds the selected transfer.</div></div></aside></div>`;
  }

  function sampleBoardingPreview(){return `<div class="mini-atb"><div class="blue"><span>SKANDI TRAVELS</span><span>BOARDING PASS</span><span>SEQ 001</span></div><div class="body"><div class="name">ANDERSSON / ANNA</div><div class="route"><div><small>FROM</small><b>JFK</b></div><div><small>TO</small><b>ARN</b></div><div><small>FLIGHT</small><b>SK904</b></div></div><div class="seatbox">GATE 07 · SEAT 22A</div></div></div>`}
  function sampleTicketPreview(){return `<div class="mini-ticket"><div class="mini-doc-brand">SKANDI TRAVELS</div><div class="mini-doc-title">Electronic Ticket / Receipt</div><div class="mini-line short"></div><div class="mini-line mid"></div><div class="mini-line"></div><div class="mini-line mid"></div><hr><div class="mini-line short"></div><div class="mini-line"></div></div>`}
  function sampleConfirmationPreview(){return `<div class="mini-confirm"><div class="mini-doc-brand">SKANDI TRAVELS</div><div class="mini-doc-title">Booking Confirmation</div><div class="mini-line mid"></div><div class="mini-line short"></div><hr><div class="mini-line"></div><div class="mini-line"></div><div class="mini-line mid"></div><div class="mini-line short"></div></div>`}
  renderPreferences=function renderPreferencesV12Docs(){
    return `${originalPreferencesV12()}<section class="panel" style="margin-top:10px"><div class="panel-head">Document Templates · Samples</div><div class="panel-body"><div class="doc-sample-grid"><article class="doc-sample"><div class="doc-sample-head">Boarding Card · Flights & Transfers</div><div class="doc-sample-body">${sampleBoardingPreview()}</div><div class="doc-sample-foot"><button class="secondary" data-v12-doc-sample="boarding">Open sample</button></div></article><article class="doc-sample"><div class="doc-sample-head">e-Ticket PDF · Passenger Email</div><div class="doc-sample-body">${sampleTicketPreview()}</div><div class="doc-sample-foot"><button class="secondary" data-v12-doc-sample="eticket">Open sample</button></div></article><article class="doc-sample"><div class="doc-sample-head">Booking Confirmation · Completed Booking</div><div class="doc-sample-body">${sampleConfirmationPreview()}</div><div class="doc-sample-foot"><button class="secondary" data-v12-doc-sample="confirmation">Open sample</button></div></article></div></div></section>`;
  };

  function documentSampleHtml(kind){
    const common=`<style>body{margin:0;background:#ddd;font-family:Arial,sans-serif;color:#111}.toolbar{padding:10px;background:#263746;color:white}.paper{margin:18px auto;background:white;box-shadow:0 8px 30px #777}.toolbar button{margin-right:6px}</style>`;
    if(kind==="boarding")return `${common}<div class="toolbar"><button onclick="print()">Print / Save PDF</button>Boarding Card Sample</div><div class="paper" style="width:203.2mm;height:82.55mm;position:relative;overflow:hidden"><div style="height:12mm;background:#022e64;color:white;display:grid;grid-template-columns:1fr 1.6fr .6fr;align-items:center;padding:0 6mm;font-weight:900"><span style="font-size:7mm">SKANDI</span><span style="text-align:center;font-size:4.4mm;letter-spacing:.6mm">BOARDING PASS</span><span style="text-align:right">SEQ 001</span></div><div style="padding:6mm"><div style="font:900 5mm 'Courier New',monospace">ANDERSSON / ANNA</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5mm;margin-top:5mm"><div><small>FROM</small><b style="display:block;font-size:5mm">JFK</b></div><div><small>TO</small><b style="display:block;font-size:5mm">ARN</b></div><div><small>FLIGHT</small><b style="display:block">SK904</b></div><div><small>DATE</small><b style="display:block">11OCT</b></div><div><small>GATE</small><b style="display:block;font-size:5mm">07</b></div><div><small>SEAT</small><b style="display:block;font-size:5mm">22A</b></div></div><div style="position:absolute;right:8mm;bottom:7mm;font:700 3mm monospace">REF SK26AB</div></div></div>`;
    if(kind==="eticket")return `${common}<div class="toolbar"><button onclick="print()">Print / Save PDF</button>e-Ticket PDF Sample</div><main class="paper" style="width:210mm;min-height:297mm;padding:18mm"><h1 style="color:#022e64;margin:0">SKANDI TRAVELS</h1><h2>Electronic Ticket / Receipt</h2><p><b>Passenger:</b> Anna Andersson &nbsp; <b>Booking:</b> SK26AB</p><hr><h3>Itinerary</h3><table style="width:100%;border-collapse:collapse"><tr><th align="left">Flight</th><th align="left">Route</th><th align="left">Date</th><th align="left">Cabin</th></tr><tr><td>SK904</td><td>JFK → ARN</td><td>11 Oct 2026</td><td>Economy</td></tr></table><h3 style="margin-top:28px">Ticket</h3><p>117-1234567890 · OPEN FOR USE</p><h3>Payment / Fare</h3><p>Base fare, taxes, services and total are presented from the confirmed booking record.</p><p style="margin-top:40px;color:#666">Sample template for passenger email/PDF delivery after ticket issuance.</p></main>`;
    return `${common}<div class="toolbar"><button onclick="print()">Print / Save PDF</button>Booking Confirmation Sample</div><main class="paper" style="width:210mm;min-height:297mm;padding:18mm"><h1 style="color:#022e64;margin:0">SKANDI TRAVELS</h1><h2>Booking Confirmation</h2><p><b>Booking reference:</b> SK26AB</p><p><b>Passenger:</b> Anna Andersson</p><hr><h3>Your trip</h3><p>Flight SK904 · New York/JFK to Stockholm/ARN</p><p>Hotel · 7 nights · Stockholm</p><p>Transfer · Airport to hotel</p><h3>Payment</h3><p>Booking paid and confirmed.</p><h3>Important information</h3><p>Supplier references, baggage, transfer meeting points and service instructions are included from the confirmed PNR components.</p></main>`;
  }
  function openDocumentSample(kind){
    const win=window.open("","_blank","noopener,noreferrer");
    if(!win)return toast("Popup blocked","Allow pop-ups to open document samples.","warning");
    win.document.open();win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SKANDI Document Sample</title></head><body>${documentSampleHtml(kind)}</body></html>`);win.document.close();
  }

  render=function renderV12AmadeusSessionFixed(){
    if(sessionUiSuspended)return;
    if(state.activeView==="transfers"){
      main.innerHTML=`<section class="view">${renderTransfersV12()}</section>`;
    }else{
      originalRenderV12();
    }
    syncSessionChrome();
    updatePnrLockUi();
  };

  // Every backend response carrying a requestId is applied to the PNR tab that
  // initiated it. This prevents a response from one PNR from overwriting the
  // tab the agent switched to while the provider request was in flight.
  function finishMessageSessionRoute(event){
    const message=typeof event.data==="string"?(()=>{try{return JSON.parse(event.data)}catch(_){return null}})():event.data;
    if(!message||message.source!==PARENT_SOURCE)return;
    const requestId=String(message.requestId||"");
    const targetSessionId=requestSessionById.get(requestId)||messageRouteTargetSessionId||"";
    if(message.type==="ALTEA_LOCAL_BOOKING_CREATED"&&state._pendingTransferEntityId){
      const bookingId=message.payload?.workspace?.booking?.id||"";
      const entityId=state._pendingTransferEntityId;
      state._pendingTransferEntityId="";
      if(bookingId)post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId,entityId,quantity:1},{busy:false});
    }
    if(targetSessionId&&state.sessions?.[targetSessionId])saveCurrentSession();
    if(messageRouteRestoreSessionId&&state.sessions?.[messageRouteRestoreSessionId]){
      const restoreId=messageRouteRestoreSessionId;
      messageRouteRestoreSessionId="";
      messageRouteTargetSessionId="";
      sessionUiSuspended=Math.max(0,sessionUiSuspended-1);
      loadSession(restoreId,{saveOutgoing:false,renderUi:false});
      syncSessionChrome();renderTabs();render();
    }else{
      messageRouteTargetSessionId="";
    }
    if(requestId && message.type!=="DUFFEL_PROGRESS")requestSessionById.delete(requestId);
    if(terminalResponseTypes.has(message.type)&&requestId)requestSessionById.delete(requestId);
  }
  window.addEventListener("message",finishMessageSessionRoute,false);

  document.addEventListener("click",event=>{
    const frozen=event.target.closest?.('.nav-item.pnr-frozen');
    if(frozen){event.preventDefault();event.stopImmediatePropagation();toast(isHomeSession()?"Open a PNR first":"Switch to Home",frozen.title||"This function is not available in the current context.","warning");return}
    const sample=event.target.closest?.("[data-v12-doc-sample]");
    if(sample){event.preventDefault();openDocumentSample(sample.dataset.v12DocSample);return}
    const transfer=event.target.closest?.("[data-v12-transfer-entity]");
    if(transfer){
      event.preventDefault();
      const entityId=transfer.dataset.v12TransferEntity||"";
      if(!entityId)return;
      if(isHomeSession()){
        const sessionId=createNewSession("transfers");
        if(!sessionId)return;
      }
      const bookingId=state.alteaWorkspace?.booking?.id||"";
      if(bookingId){post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId,entityId,quantity:1});return}
      state._pendingTransferEntityId=entityId;
      saveCurrentSession();
      originalOpenLocalBookingModalV12();
    }
  },true);

  document.addEventListener("input",event=>{
    if(event.target?.id!=="v12TransferFilter")return;
    const q=String(event.target.value||"").trim().toLowerCase();
    const filtered=transferItems().filter(i=>JSON.stringify([i.name,i.title,i.publicId,i.code,i.city,i.destination,i.category,i.description]).toLowerCase().includes(q));
    const out=document.getElementById("v12TransferResults");if(out)out.innerHTML=transferCards(filtered);
  });

  configureAmadeusNavigation();
  // Reinitialize the page-tab model after all extension defaults exist so Home
  // is clean and permanent, then render the Amadeus-style starting context.
  state.sessions[AMADEUS_HOME_SESSION]=snapshotCurrentSession();
  state.sessions[AMADEUS_HOME_SESSION].__kind="home";
  state.sessions[AMADEUS_HOME_SESSION].activeView="dashboard";
  state.activeSessionId=AMADEUS_HOME_SESSION;
  applySessionState(state.sessions[AMADEUS_HOME_SESSION]);
  updatePnrLockUi();
  renderTabs();
  render();
})();
