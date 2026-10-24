
/* ================================================================
   SKANDI ALTEA Unified Reservations v3.3 enterprise extension
   Master booking + SKANDI Club + Package/Charter + Documents +
   Travel Requirements provider adapter + DCS + Manifests.
   ================================================================ */
(function(){
  "use strict";


  const ENTERPRISE_VERSION = "R-006.3-unified";


  [
    "ALTEA_UPDATE_BOOKING",
    "ALTEA_CLUB_LINK_MEMBER",
    "ALTEA_CLUB_ADJUST_POINTS",
    "ALTEA_GENERATE_DOCUMENT",
    "ALTEA_SEND_DOCUMENT",
    "ALTEA_DCS_UPDATE_PASSENGER"
  ].forEach(type=>EXCLUSIVE_ACTIONS.add(type));


  Object.assign(VIEW_TITLES,{
    packagebuilder:"Package Builder",
    club:"SKANDI Club",
    manifests:"Operations & Manifests",
    departure:"Departure Control · Transfers"
  });


  state.clubSearchResults = [];
  state.clubProfiles = state.clubProfiles || {};
  state.travelDecision = null;
  state.travelRequirementsProvider = null;
  state.generatedDocuments = state.generatedDocuments || [];
  state.dcsSelectedPassengerId = state.dcsSelectedPassengerId || "";
  state.manifestMode = "passengers";
  state.transferDcsTab = state.transferDcsTab || "departures";
  state.transferDcsDepartures = state.transferDcsDepartures || [];
  state.transferDcsSelectedDepartureId = state.transferDcsSelectedDepartureId || "";
  state.transferDcsSelectedPassengerId = state.transferDcsSelectedPassengerId || "";
  state.transferDcsPassengerState = state.transferDcsPassengerState || {};
  state.transferDcsDepartureState = state.transferDcsDepartureState || {};
  state.transferDcsActivity = state.transferDcsActivity || [];
  state.transferDcsPersistence = Boolean(state.transferDcsPersistence);


  const enterpriseStyle=document.createElement("style");
  enterpriseStyle.textContent=`
    .action-stack{display:grid;gap:6px}
    .subtabs{display:flex;flex-wrap:wrap;gap:0;border:1px solid var(--line);background:#e8edf1;margin-bottom:10px}
    .subtab{min-height:31px;padding:0 11px;border:0;border-right:1px solid var(--line);background:transparent;color:#365066;font-weight:700}
    .subtab.active{background:#fff;color:#005ea8;box-shadow:inset 0 3px var(--brand)}
    .master-ref{font-size:22px;font-weight:800;letter-spacing:.08em;color:#123e5d;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .component-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .component-card{border:1px solid var(--line);background:#fff;padding:9px;display:grid;grid-template-columns:1fr auto;gap:6px}
    .component-card .meta{grid-column:1/-1;color:var(--muted);font-size:10px}
    .document-actions{display:flex;gap:5px;flex-wrap:wrap}
    .decision{padding:14px;border:1px solid var(--line);background:#fff}
    .decision.go{border-left:5px solid var(--success);background:var(--success-bg)}
    .decision.stop{border-left:5px solid var(--danger);background:var(--danger-bg)}
    .decision.review{border-left:5px solid #d08a16;background:var(--warning-bg)}
    .decision h2{margin:0 0 5px;font-size:18px}
    .dcs-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .dcs-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:10px}
    .doc-preview{border:1px dashed #9fb0bc;background:#fff;padding:16px;min-height:150px}
    .manifest-filters{display:flex;gap:5px;flex-wrap:wrap}
    .club-card{border:1px solid #173f5c;background:linear-gradient(135deg,#0b3157,#022e64);color:white;padding:15px;min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
    .club-card .tier{font-size:18px;font-weight:800;letter-spacing:.06em}.club-card .member{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.08em}
    .transfer-dcs-tabs{display:flex;flex-wrap:wrap;border:1px solid var(--line);background:#dfe5ea;margin-bottom:10px}
    .transfer-dcs-tab{min-height:34px;border:0;border-right:1px solid var(--line);background:transparent;padding:0 12px;font-weight:750;color:#405867}
    .transfer-dcs-tab.active{background:#fff;color:#005ea8;box-shadow:inset 0 3px var(--brand)}
    .transfer-flight-ref{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#395669}
    .transfer-route{font-weight:800;color:#173f5c}.transfer-sub{font-size:10px;color:var(--muted);margin-top:2px}
    .transfer-load{min-width:150px}.transfer-load-track{height:8px;border:1px solid #aab6bf;background:#dfe5ea;margin-top:4px}.transfer-load-fill{height:100%;background:#167ec4}
    .transfer-profile{display:grid;gap:7px}.transfer-profile-head{padding:10px;background:#eaf3fb;border:1px solid #b8cedf}
    .transfer-profile-name{font-size:17px;font-weight:800;color:#173f5c}.transfer-profile-ref{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#5f7280}
    .coach-shell{max-width:520px;margin:0 auto;padding:16px 24px 28px;border:2px solid #91a1ac;border-radius:60px 60px 18px 18px;background:linear-gradient(90deg,#e4eaee,#fff 15%,#fff 85%,#e4eaee)}
    .coach-front{text-align:center;font-size:10px;font-weight:800;color:#607482;margin-bottom:10px}.coach-row{display:grid;grid-template-columns:30px 42px 42px 34px 42px 42px;gap:6px;align-items:center;justify-content:center;margin:5px 0}.coach-row-num{text-align:right;font-weight:800;color:#61727e}.coach-aisle{text-align:center;font-size:8px;color:#84939c}.coach-seat{height:34px;border:1px solid #7391a4;border-radius:5px;background:#e8f2f8;font-weight:800;color:#173f5c}.coach-seat.occupied{background:#3d6581;color:white;border-color:#28465b}.coach-seat.selected{background:#005eb8;color:white;box-shadow:0 0 0 2px #79c8ff}.coach-seat.blocked{background:repeating-linear-gradient(45deg,#c9cfd3,#c9cfd3 4px,#aab3ba 4px,#aab3ba 8px);color:#49545c}.coach-seat:hover:not(:disabled){outline:2px solid #2f97d6}
    .transfer-scanner{background:#0f2436;border:1px solid #071722;padding:14px;color:white}.transfer-scanner-line{display:flex;gap:7px;margin-top:6px}.transfer-scanner input{height:48px;flex:1;background:#061520;border:2px solid #4186b5;color:#fff;font-size:20px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;padding:5px 10px}.transfer-scan-result{margin-top:8px;padding:9px;border:1px solid #35536b;background:#172f42}.transfer-scan-result.success{background:#0b5d2a;border-color:#32b05d}.transfer-scan-result.error{background:#741e1e;border-color:#dc5a5a}.transfer-operation-note{padding:9px;border:1px solid #d3ae53;background:#fff6dc;color:#654b12}
    .transfer-activity{display:grid;gap:0}.transfer-activity-row{display:grid;grid-template-columns:70px 1fr;gap:8px;padding:7px;border-bottom:1px solid #dde3e7}.transfer-activity-row time{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#005ea8;font-weight:750}
    @media(max-width:820px){.component-cards,.dcs-summary{grid-template-columns:1fr}.master-ref{font-size:18px}}
  `;
  document.head.appendChild(enterpriseStyle);


  function addNavButton(afterSelector,view,icon,label){
    if(document.querySelector(`.nav-item[data-view="${view}"]`))return;
    const anchor=document.querySelector(afterSelector); if(!anchor)return;
    const b=document.createElement("button");
    b.type="button";b.className="nav-item";b.dataset.view=view;
    b.innerHTML=`<span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>`;
    anchor.insertAdjacentElement("afterend",b);
  }
  addNavButton('.nav-item[data-view="cars"]','packagebuilder','◈','Package Builder');
  addNavButton('.nav-item[data-view="passengers"]','club','★','SKANDI Club');
  addNavButton('.nav-item[data-view="baggage"]','departure','▶','Departure Control');
  addNavButton('.nav-item[data-view="departure"]','manifests','☷','Operations & Manifests');




  const priorRender=render;
  render=function(){
    if(["packagebuilder","club","departure","manifests"].includes(state.activeView)){
      const fn={packagebuilder:renderPackageBuilder,club:renderClub,departure:renderDepartureControl,manifests:renderManifests}[state.activeView];
      main.innerHTML=`<section class="view">${fn()}</section>`;
      bindEnterpriseEvents();
      return;
    }
    priorRender();
  };


  const priorBindViewEvents=bindViewEvents;
  bindViewEvents=function(){priorBindViewEvents();bindEnterpriseEvents();};


  function workspace(){return state.alteaWorkspace||null}
  function booking(){return workspace()?.booking||null}
  function passengers(){return workspace()?.passengers||[]}
  function components(){return (workspace()?.components||[]).filter(c=>c.status!=="REMOVED")}
  function masterReference(){const b=booking();return b?.bookingReference||b?.pnrLocator||b?.id||state.selectedOrder?.bookingReference||"—"}
  function normalizedType(v){return String(v||"").toUpperCase().replace(/[\s-]+/g,"_")}
  function bookingType(){const b=booking();return normalizedType(b?.bookingType||b?.tripType||b?.payload?.bookingType||inferBookingType())}
  function isSkandiDcs(){const b=booking();const t=bookingType();return Boolean(b&&(b.dcsAuthority==="SKANDI"||b.operatingControl==="SKANDI"||b.isCharter===true||t.includes("CHARTER")))}
  function selectedPax(){const list=passengers();return list.find(p=>p.id===(state.dcsSelectedPassengerId||state.selectedPassengerId))||list[0]||null}
  function componentTypes(){return components().map(c=>normalizedType(c.componentType||c.entityType))}
  function inferBookingType(){
    const types=componentTypes();const hasAir=Boolean(state.selectedOrder||booking()?.supplierOrderId||booking()?.origin||types.some(t=>t.includes("FLIGHT")));
    const hasHotel=types.some(t=>t.includes("HOTEL")||t.includes("STAY"));const other=types.some(t=>["TRANSFER","TOUR","ACTIVITY","CAR","EXCURSION"].some(x=>t.includes(x)));
    if(hasAir&&(hasHotel||other))return "DYNAMIC_PACKAGE";
    if(hasHotel||other)return "LAND_ONLY";
    return hasAir?"FLIGHT_ONLY":"BOOKING";
  }
  function isSkandiDcsSafe(){const b=booking();const explicit=normalizedType(b?.bookingType||b?.tripType||b?.payload?.bookingType);return Boolean(b&&(b.dcsAuthority==="SKANDI"||b.operatingControl==="SKANDI"||b.isCharter===true||explicit.includes("CHARTER")))}
  function totalComponents(){return components().reduce((sum,c)=>sum+(Number(c.totalAmount)||0),0)}
  function packageTotal(){return (Number(booking()?.totalAmount)||0)+totalComponents()}
  function serviceLabel(c){return c.title||c.name||c.productName||humanize(c.componentType||c.entityType||"Service")}
  function paxName(p){return p?.displayName||[p?.firstName,p?.lastName].filter(Boolean).join(" ")||p?.passengerRef||"Passenger"}
  function clubFor(p){return state.clubProfiles[p?.id]||p?.clubProfile||p?.payload?.clubProfile||null}


  const originalOpenLocalBookingModal=openLocalBookingModal;
  openLocalBookingModal=function(){
    openModal("New SKANDI master booking",`
      <div class="alert info"><span>▣</span><div><strong>One SKANDI booking reference</strong>The SKANDI reference is the customer-facing master reference. All other supplier locators remain attached underneath it for servicing.</div></div>
      <div class="grid grid-2"><div class="field"><label>Booking type</label><select id="localBookingType">
        <option value="LAND_ONLY">Land only</option><option value="DYNAMIC_PACKAGE">Dynamic package</option><option value="SKANDI_PACKAGE">SKANDI package</option><option value="GROUP_BOOKING">Group booking</option>
      </select></div><div class="field"><label>Currency</label><input id="localCurrency" maxlength="3" value="${escapeAttr(state.preferences.currency||"USD")}"></div></div>
      <div class="field"><label>Customer name</label><input id="localCustomerName" maxlength="200"></div>
      <div class="field"><label>Customer email</label><input id="localCustomerEmail" type="email" maxlength="254"></div>
      <div class="grid grid-2"><div class="field"><label>Package / trip title</label><input id="localTripTitle" maxlength="180" placeholder="Rhodes 7 nights"></div><div class="field"><label>Transfer operations</label><select id="localTransferControl"><option value="SKANDI">SKANDI Transfer Control</option><option value="SUPPLIER">External transfer supplier</option></select></div></div>
      <div class="field"><label>Internal notes</label><textarea id="localBookingNotes"></textarea></div>`,[
        {label:"Cancel",className:"secondary",close:true},
        {label:"Create master booking",className:"primary",onClick:()=>{
          const currency=String($("#localCurrency")?.value||"USD").toUpperCase();if(!/^[A-Z]{3}$/.test(currency))return toast("Invalid currency","Use a three-letter currency code.","warning");
          const type=$("#localBookingType")?.value||"LAND_ONLY";const transferControl=$("#localTransferControl")?.value||"SKANDI";
          closeModal();post("ALTEA_CREATE_LOCAL_BOOKING",{customerName:$("#localCustomerName")?.value||"",customerEmail:$("#localCustomerEmail")?.value||"",currency,notes:$("#localBookingNotes")?.value||"",bookingType:type,tripTitle:$("#localTripTitle")?.value||"",transferControl});
        }}
      ]);
  };


  renderBookingFile = function() {
    const w = workspace();
    if (!w?.booking) {
      return `${pageHead("Booking File", "Unified SKANDI master booking with supplier references.")}
        ${emptyState("▣", "No booking selected", "Open a booking from Bookings & Orders or create a new booking.")}`;
    }

    const b = w.booking;
    const comps = components();
    const flight = b.flightDetails || (state.selectedOrder ? syncFlightDataToBooking(b, state.selectedOrder).flightDetails : null);
    const pqr = flight?.pricingRecord;
    const rules = flight?.miniRules;

    return `
      ${pageHead("Booking File", `${masterReference()} · ${humanize(bookingType())}`, 
        '<button class="secondary" data-action="refresh-booking-file">Refresh</button><button class="primary" data-view="packagebuilder">Package Builder</button>')}
      
      <!-- Top Stat Bar -->
      <div class="grid grid-4">
        ${statCard("Master Reference", masterReference(), "Customer-facing PNR")}
        ${statCard("Route", [b.origin, b.destination].filter(Boolean).join(" → ") || "—", b.departureDate || "Travel date pending")}
        ${statCard("Validating Carrier", pqr?.validatingCarrier || b.supplier || "Not reported", "Ticketing carrier")}
        ${statCard("Grand Total", money(pqr?.totalAmount || b.totalAmount, pqr?.currency || b.currency), "Air + Components")}
      </div>

      <div class="workspace-layout" style="margin-top:10px">
        <div>
          
          <!-- 1. Master PNR Header -->
          <section class="panel">
            <div class="panel-head">
              <span>Master Booking Record</span>
              <span class="master-ref">${escapeHTML(masterReference())}</span>
            </div>
            <div class="panel-body">
              <div class="grid grid-3">
                <div><span class="muted">Customer</span><div class="strong">${escapeHTML(b.customerName || "—")}</div></div>
                <div><span class="muted">Email</span><div>${escapeHTML(b.customerEmail || "—")}</div></div>
                <div><span class="muted">Booking Status</span><div><span class="badge ${statusClass(b.status)}">${escapeHTML(b.status || "Not reported")}</span></div></div>
                <div><span class="muted">Supplier Locator</span><div class="mono strong">${escapeHTML(b.supplierBookingReference || state.selectedOrder?.bookingReference || "—")}</div></div>
                <div><span class="muted">Order ID</span><div class="mono strong">${escapeHTML(b.supplierOrderId || state.selectedOrder?.id || "—")}</div></div>
                <div><span class="muted">Payment Status</span><div>${escapeHTML(b.paymentStatus || "Not reported")}</div></div>
              </div>
            </div>
          </section>

          <!-- 2. ALTÉA AIR ITINERARY (Segments Matrix) -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head">
              <span>Air Itinerary · Confirmed Segments</span>
              <span class="badge info">${flight?.segments?.length || 0} Segment(s)</span>
            </div>
            <div class="panel-body" style="padding:0">
              ${flight?.segments?.length ? `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Seg</th>
                      <th>Flight</th>
                      <th>RBD</th>
                      <th>Depart</th>
                      <th>Arrive</th>
                      <th>Terminal</th>
                      <th>Aircraft</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${flight.segments.map(s => `
                      <tr>
                        <td class="mono strong">${s.segId}</td>
                        <td>
                          <strong>${escapeHTML(s.flightNumber)}</strong>
                          <div class="muted" style="font-size:9px;">Op: ${escapeHTML(s.operatingCarrier)}</div>
                        </td>
                        <td class="mono strong">${s.rbd}</td>
                        <td>
                          <strong>${escapeHTML(s.origin)}</strong> ${timeOnly(s.departingAt)}
                          <div class="muted" style="font-size:9px;">${formatShortDate(s.departingAt)}</div>
                        </td>
                        <td>
                          <strong>${escapeHTML(s.destination)}</strong> ${timeOnly(s.arrivingAt)}
                          <div class="muted" style="font-size:9px;">${formatShortDate(s.arrivingAt)}</div>
                        </td>
                        <td>${escapeHTML(s.originTerminal)} / ${escapeHTML(s.destinationTerminal)}</td>
                        <td>${escapeHTML(s.aircraft)}</td>
                        <td>${escapeHTML(s.duration)}</td>
                        <td><span class="badge success">HK1</span></td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              ` : emptyState("✈", "No Air Segments Found", "Flight segments will appear once an airline order is attached.")}
            </div>
          </section>

          <!-- 3. ALTÉA TST / PRICING RECORD & FARE BASIS -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head">
              <span>Pricing Record (TST / PQR) & Fare Calculation</span>
              <span class="mono">${pqr?.fareBrand || "PUBLISHED FARE"}</span>
            </div>
            <div class="panel-body">
              
              <!-- Fare Breakdown Ladder -->
              <div class="grid grid-4" style="margin-bottom:12px;">
                <div><span class="muted">Base Fare</span><div class="strong">${pqr ? money(pqr.baseAmount, pqr.currency) : "—"}</div></div>
                <div><span class="muted">Taxes & Surcharges</span><div class="strong">${pqr ? money(pqr.taxAmount, pqr.currency) : "—"}</div></div>
                <div><span class="muted">Total Airfare</span><div class="price-total">${pqr ? money(pqr.totalAmount, pqr.currency) : "—"}</div></div>
                <div><span class="muted">Validating Carrier</span><div class="strong">${pqr?.validatingCarrier || "—"}</div></div>
              </div>

              <!-- Segment Fare Basis & Baggage Allowance Table -->
              <div class="automation-section" style="margin-top:0;">
                <div class="automation-head">
                  <span>Fare Basis Codes & Baggage Allowance</span>
                  <span class="mono">FWR/TQQ</span>
                </div>
                <div class="automation-body" style="padding:0;">
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>Seg</th>
                        <th>Flight</th>
                        <th>Fare Family</th>
                        <th>Fare Basis Code</th>
                        <th>Included Baggage</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${flight?.segments?.flatMap(s => s.passengers.map(p => `
                        <tr>
                          <td class="mono">${s.segId}</td>
                          <td><strong>${escapeHTML(s.flightNumber)}</strong></td>
                          <td>${escapeHTML(p.cabinBrand)}</td>
                          <td class="mono strong" style="color:#005eb8;">${escapeHTML(p.fareBasisCode)}</td>
                          <td>${escapeHTML(p.baggage)}</td>
                        </tr>
                      `)).join("") || '<tr><td colspan="5" class="empty">No fare basis codes recorded.</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Mini Rules / Penalties -->
              <div class="rule-cards" style="margin-top:10px;">
                <div class="rule-card">
                  <div class="label">Refundability</div>
                  <strong>${rules?.refundable ? "PERMITTED" : "NON-REFUNDABLE"}</strong>
                  <div class="muted">${rules?.refundPenalty ? `Penalty: ${money(rules.refundPenalty, pqr?.currency)}` : "Standard carrier terms apply"}</div>
                </div>
                <div class="rule-card">
                  <div class="label">Ticket Changes</div>
                  <strong>${rules?.changeable ? "PERMITTED" : "CHANGES NOT ALLOWED"}</strong>
                  <div class="muted">${rules?.changePenalty ? `Penalty: ${money(rules.changePenalty, pqr?.currency)}` : "Fare difference may apply"}</div>
                </div>
              </div>

            </div>
          </section>

          <!-- 4. Passengers Table -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head">Passengers / Travelers</div>
            <div class="panel-body" style="padding:0">
              ${passengerTable(passengers())}
            </div>
          </section>

          <!-- 5. Other Trip Components -->
          <section class="panel" style="margin-top:10px">
            <div class="panel-head"><span>Other Journey Components</span><span>${comps.length}</span></div>
            <div class="panel-body" style="padding:0">
              ${componentTable(comps)}
            </div>
          </section></div>

        <!-- Sidebar Actions -->
        <aside class="panel sticky">
          <div class="panel-head">Operational Actions</div>
          <div class="panel-body action-stack">
            <button class="secondary" data-view="passengers">Passengers / APIS</button>
            <button class="secondary" data-view="services">Seats & Services</button>
            <button class="secondary" data-view="ticketing">Ticketing & Documents</button>
            <button class="secondary" data-view="actions">Changes / Refunds</button>
            <button class="secondary" data-view="history">History & Audit</button>
          </div>
        </aside>
      </div>
    `;
  };

  passengerTable=function(list){
    if(!list.length)return '<div class="empty">No passenger records are linked to this booking yet.</div>';
    return `<table class="data-table"><thead><tr><th>Passenger</th><th>SKANDI Club</th><th>APIS</th><th>Requirements</th><th>Seat</th><th>Check-in</th><th>Boarding</th></tr></thead><tbody>${list.map(p=>{const club=clubFor(p);const req=p.travelRequirementStatus||p.payload?.travelRequirementStatus||"not checked";return `<tr><td><button class="link" data-action="select-passenger" data-passenger-id="${escapeAttr(p.id)}">${escapeHTML(paxName(p))}</button><br><small class="mono muted">${escapeHTML(p.supplierPassengerId||p.passengerRef||"")}</small></td><td>${customerFor(p)?(club?`<span class="badge info">${escapeHTML(club.tier||"MEMBER")}</span><br><small class="mono">${escapeHTML(club.memberNumber||club.memberId||"")}</small>`:`<span class="badge neutral">CUSTOMER LINKED</span>`):'<span class="muted">Not linked</span>'}</td><td><span class="badge ${statusClass(p.apisStatus)}">${escapeHTML(p.apisStatus||"not started")}</span></td><td><span class="badge ${statusClass(req)}">${escapeHTML(req)}</span></td><td class="mono">${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"not checked in")}</td><td>${escapeHTML(p.boardingStatus||p.payload?.boardingStatus||"not boarded")}</td></tr>`}).join("")}</tbody></table>`;
  };


  const originalPassengerEditor=passengerEditor;
  passengerEditor=function(p){const club=clubFor(p);return `${originalPassengerEditor(p)}<hr style="border:0;border-top:1px solid var(--line);margin:12px 0"><div class="strong">SKANDI Club</div><div style="margin-top:7px">${club?`<div class="money-line"><span>Member</span><strong class="mono">${escapeHTML(club.memberNumber||club.id||"—")}</strong></div><div class="money-line"><span>Tier</span><strong>${escapeHTML(club.tier||"MEMBER")}</strong></div><div class="money-line"><span>Points</span><strong>${escapeHTML(String(club.pointsBalance??club.points??"—"))}</strong></div>`:`<span class="muted">No SKANDI Club profile linked.</span>`}</div><button type="button" class="secondary" style="margin-top:8px" data-view="club">Open SKANDI Club</button>`};


  componentTable=function(items){
    if(!items.length)return '<div class="empty">No trip components selected.</div>';
    return `<table class="data-table"><thead><tr><th>Type</th><th>Service</th><th>Supplier / Ref</th><th>Travel</th><th>Qty</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${items.map(c=>`<tr><td>${escapeHTML(humanize(c.componentType||c.entityType))}</td><td><strong>${escapeHTML(serviceLabel(c))}</strong></td><td>${escapeHTML(c.supplier||"SKANDI")}<br><small class="mono muted">${escapeHTML(c.supplierReference||c.reference||"")}</small></td><td>${escapeHTML(c.serviceDate||c.startDate||c.payload?.serviceDate||c.city||"—")}</td><td>${escapeHTML(String(c.quantity||1))}</td><td>${money(c.totalAmount,c.currency||booking()?.currency)}</td><td><select class="component-status-select" data-component-id="${escapeAttr(c.id)}"><option ${c.status==="SELECTED"?"selected":""}>SELECTED</option><option ${c.status==="REQUESTED"?"selected":""}>REQUESTED</option><option ${c.status==="CONFIRMED"?"selected":""}>CONFIRMED</option><option ${c.status==="CANCELLED"?"selected":""}>CANCELLED</option></select></td><td class="nowrap"><button class="link" data-action="edit-component" data-component-id="${escapeAttr(c.id)}">Edit</button> · <button class="link" data-action="print-component-voucher" data-component-id="${escapeAttr(c.id)}">Voucher</button> · <button class="link" data-action="remove-component" data-component-id="${escapeAttr(c.id)}">Remove</button></td></tr>`).join("")}</tbody></table>`;
  };


  renderServices=function(){
    const w=workspace();const comps=components();const transferTourInventory=(state.inventory||[]).filter(i=>["TRANSFER","TOUR","ACTIVITY","EXCURSION","HOTEL","PACKAGE","ANCILLARY"].some(x=>normalizedType(i.entityType).includes(x)));
    return `${pageHead("Trip Components","Sell and service SKANDI-owned products together with partner flight, stay and car supply.",!w?.booking?'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>':'<button class="primary" data-view="packagebuilder">Package Builder</button>')}
      <div class="alert info"><span>ℹ</span><div><strong>One master booking</strong>Every service is linked to ${escapeHTML(masterReference())}. Supplier references remain separate underneath the SKANDI master reference.</div></div>
      ${w?.booking?`<section class="panel"><div class="panel-head"><span>Booked / selected components</span><span>${comps.length}</span></div><div class="panel-body" style="padding:0">${componentTable(comps)}</div></section>`:""}
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>SKANDI Inventory Control catalog</span><span class="muted">Transfers · tours · hotels · packages · ancillaries</span></div><div class="panel-body"><div class="field"><label>Filter catalog</label><input id="inventoryFilter" placeholder="Transfer, Rhodes, tour, hotel..."></div><div id="enterpriseInventoryTable" style="margin:0 -10px -10px">${enterpriseInventoryMarkup(transferTourInventory)}</div></div></section>
      ${state.selectedOffer?`<section class="panel" style="margin-top:10px"><div class="panel-head">Current airline services</div><div class="panel-body" style="padding:0">${serviceListMarkup(state.selectedOffer.availableServices||[])}</div></section><section class="panel" style="margin-top:10px"><div class="panel-head"><span>Live seat maps</span><button class="link" data-action="load-seat-maps">Refresh</button></div><div class="panel-body">${seatMapMarkup()}</div></section>`:""}`;
  };


  function enterpriseInventoryMarkup(items){if(!items.length)return '<div class="empty">No matching published inventory.</div>';return `<table class="data-table"><thead><tr><th>Type</th><th>Product</th><th>Destination</th><th>Price</th><th></th></tr></thead><tbody>${items.map(i=>`<tr><td>${escapeHTML(humanize(i.entityType))}</td><td><strong>${escapeHTML(i.name)}</strong><br><small class="mono muted">${escapeHTML(i.publicId||i.code||"")}</small></td><td>${escapeHTML(i.city||i.destination||i.category||"—")}</td><td>${i.publicPrice?money(i.publicPrice,i.currency||booking()?.currency):'<span class="muted">Quote / rules apply</span>'}</td><td><button class="primary" data-action="add-inventory-component" data-entity-id="${escapeAttr(i.id)}" ${booking()?"":"disabled"}>Add</button></td></tr>`).join("")}</tbody></table>`}

function openSkandiCheckout() {
    const b = booking74();
    if (!b) return;
    
    // Find components that are not yet marked as PAID
    const comps = components74();
    const unpaidComps = comps.filter(c => c.paymentStatus !== "PAID" && c.status !== "CONFIRMED");
    const totalDue = unpaidComps.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
    
    if (totalDue <= 0) return toast("Balance is zero", "No pending SKANDI component balances to settle.", "info");

    openModal("SKANDI Checkout & Settlement", `
      <div class="alert info">
        <span>💳</span>
        <div><strong>Secure Agency Collection</strong>Process payment for self-owned inventory (Transfers, Tours, Hotels). Airfares are settled separately with the airline.</div>
      </div>
      
      <table class="data-table" style="margin: 10px 0;">
        <thead><tr><th>Item</th><th>Amount</th></tr></thead>
        <tbody>
          ${unpaidComps.map(c => `<tr><td>${escapeHTML(serviceLabel(c))}</td><td>${money(c.totalAmount, c.currency || b.currency)}</td></tr>`).join("")}
          <tr style="background:#fbfcfd;">
            <td class="right strong">Total Due:</td>
            <td class="strong price-total" style="color:#14804a;">${money(totalDue, b.currency || state.preferences.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="field" style="margin-top:15px;">
        <label>Form of Payment</label>
        <select id="checkoutFop">
          <option value="CARD_MOTO">Credit/Debit Card (Manual Entry)</option>
          <option value="PAY_LINK">Send Secure Payment Link</option>
          <option value="CASH">Cash / Bank Transfer</option>
        </select>
      </div>

      <!-- Simulated Stripe Card Input Frame -->
      <div id="motoCardFrame" style="padding:12px; border:1px solid #cbd3da; border-radius:3px; background:#f4f6f8; margin-bottom:10px;">
         <label style="font-size:10px; font-weight:700; color:#425663; display:block; margin-bottom:6px;">CARD DETAILS</label>
         <div style="display:flex; gap:8px;">
            <input placeholder="Card number" style="flex:1; height:32px; padding:0 8px; border:1px solid #aeb9c2;" maxlength="19">
            <input placeholder="MM/YY" style="width:70px; height:32px; padding:0 8px; border:1px solid #aeb9c2;" maxlength="5">
            <input placeholder="CVC" style="width:60px; height:32px; padding:0 8px; border:1px solid #aeb9c2;" maxlength="4">
         </div>
      </div>
    `, [
      { label: "Cancel", className: "secondary", close: true },
      { label: "Charge & Confirm", className: "primary", onClick: () => {
         const fop = document.getElementById("checkoutFop").value;
         closeModal();
         
         // 1. Update all unpaid components to PAID and CONFIRMED
         unpaidComps.forEach(c => {
           post("ALTEA_UPDATE_COMPONENT", { 
             componentId: c.id, 
             patch: { paymentStatus: "PAID", status: "CONFIRMED" } 
           }, { busy: false });
         });

         // 2. Mark master booking as PAID
         post("ALTEA_UPDATE_BOOKING", { bookingId: b.id, patch: { paymentStatus: "PAID" }});
         
         // 3. Log the payment to the history audit trail
         post("ALTEA_ADD_HISTORY_NOTE", { 
           bookingId: b.id, 
           eventType: "AGENCY_PAYMENT_COLLECTED", 
           note: `Collected ${money(totalDue, b.currency)} via ${fop}. Associated components marked as CONFIRMED.` 
         });

         toast("Payment Successful", `Balance settled via ${fop}. Components are now confirmed for boarding.`, "success");
      }}
    ]);

    // Simple toggle logic for the fake card frame
    document.getElementById("checkoutFop").addEventListener("change", (e) => {
      document.getElementById("motoCardFrame").style.display = e.target.value === "CARD_MOTO" ? "block" : "none";
    });
  }
  function renderPackageBuilder(){
    const w=workspace();if(!w?.booking)return `${pageHead("Package Builder","Combine flights, hotels, cars, transfers, tours and SKANDI products under one master reference.",'<button class="primary" data-action="new-local-booking">New SKANDI booking</button>')}
      ${alertBox("info","No booking open","The Package Builder workspace is available. Create or open a master booking to begin adding flight, hotel, car, transfer and tour components.")}
      <div class="grid grid-3">${statCard("Master reference","—","Created when a booking is opened")}${statCard("Trip type","—","Dynamic package / land only")}${statCard("Components","0","No booking selected")}</div>
      <section class="panel" style="margin-top:10px"><div class="panel-head">Package workspace</div><div class="panel-body"><div class="component-cards"><div class="component-card"><strong>Flight</strong><button class="secondary" data-view="search">Search</button><div class="meta">Airline supply.</div></div><div class="component-card"><strong>Hotel</strong><button class="secondary" data-view="hotels">Search</button><div class="meta">Hotel inventory.</div></div><div class="component-card"><strong>Car</strong><button class="secondary" data-view="cars">Search</button><div class="meta">Car Rental.</div></div><div class="component-card"><strong>Transfers & Tours</strong><button class="secondary" data-view="services">Open products</button><div class="meta">SKANDI-owned inventory and package components.</div></div></div></div></section>`;
    const b=w.booking;const comps=components();
    return `${pageHead("Package Builder",`${masterReference()} · ${humanize(bookingType())}`,'<button class="secondary" data-view="services">Add components</button><button class="primary" data-action="print-booking-confirmation">Booking confirmation</button>')}
      <div class="grid grid-4">${statCard("Master reference",masterReference(),"Shown to customer")}${statCard("Trip type",humanize(bookingType()),transferComponents().length?"SKANDI transfer control":"Airline operations supplier controlled")}${statCard("Components",comps.length,"Air + land products")}${statCard("Recorded total",money(packageTotal(),b.currency||state.preferences.currency),"Master booking + component totals")}</div>
      <div class="workspace-layout" style="margin-top:10px"><div>
        <section class="panel"><div class="panel-head">Package classification</div><div class="panel-body"><div class="grid grid-3"><div class="field"><label>Booking type</label><select id="packageBookingType">${["FLIGHT_ONLY","LAND_ONLY","DYNAMIC_PACKAGE","SKANDI_PACKAGE","GROUP_BOOKING"].map(v=>option(v,humanize(v),bookingType())).join("")}</select></div><div class="field"><label>Trip / package title</label><input id="packageTitle" value="${escapeAttr(b.tripTitle||b.payload?.tripTitle||"")}"></div><div class="field"><label>Transfer operations</label><select id="packageTransferControl"><option value="SKANDI" ${String(b.transferControl||"SKANDI")==="SKANDI"?"selected":""}>SKANDI Transfer Control</option><option value="SUPPLIER" ${String(b.transferControl||"")==="SUPPLIER"?"selected":""}>External transfer supplier</option></select></div></div><div class="grid grid-3"><div class="field"><label>Start date</label><input id="packageStart" type="date" value="${escapeAttr(b.departureDate||b.startDate||"")}"></div><div class="field"><label>End date</label><input id="packageEnd" type="date" value="${escapeAttr(b.returnDate||b.endDate||"")}"></div><div class="field"><label>Package status</label><select id="packageStatus">${["DRAFT","OPTION","CONFIRMED","CANCELLED"].map(v=>option(v,humanize(v),normalizedType(b.packageStatus||b.status||"DRAFT"))).join("")}</select></div></div><button class="primary" data-action="save-package">Save package setup</button></div></section>
        <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Package contents</span><span>${comps.length} component(s)</span></div><div class="panel-body"><div class="component-cards">${airComponentCard()}${comps.map(componentCard).join("")||'<div class="muted">No land components selected yet.</div>'}</div></div></section>
      </div><aside class="panel sticky"><div class="panel-head">Customer package</div><div class="panel-body"><div class="master-ref">${escapeHTML(masterReference())}</div><div class="money-line"><span>Passengers</span><strong>${passengers().length}</strong></div><div class="money-line"><span>Air / booking</span><strong>${money(Number(b.totalAmount)||0,b.currency)}</strong></div><div class="money-line"><span>Land components</span><strong>${money(totalComponents(),b.currency)}</strong></div><div class="money-line"><span>Recorded total</span><strong class="price-total">${money(packageTotal(),b.currency)}</strong></div><div class="action-stack" style="margin-top:10px"><button class="primary" data-action="checkout-skandi-balance">Checkout / Settle Balance</button><button class="secondary" data-action="generate-booking-document" data-doc-type="BOOKING_CONFIRMATION">Generate confirmation</button><button class="secondary" data-action="send-booking-document" data-doc-type="BOOKING_CONFIRMATION">Email confirmation</button><button class="secondary" data-view="manifests">Operational manifests</button></div></div></aside></div>`;
  }


  function airComponentCard(){const b=booking();if(!(state.selectedOrder||b?.supplierOrderId||b?.origin))return "";return `<div class="component-card"><div><strong>Flight</strong><br>${escapeHTML([b.origin,b.destination].filter(Boolean).join(" → ")||state.selectedOrder?.route||"Supplier itinerary")}</div><span class="badge info">AIR</span><div class="meta">Supplier locator ${escapeHTML(b.supplierBookingReference||state.selectedOrder?.bookingReference||"—")} · ${money(Number(b.totalAmount)||0,b.currency)}</div></div>`}
  function componentCard(c){return `<div class="component-card"><div><strong>${escapeHTML(serviceLabel(c))}</strong><br>${escapeHTML(humanize(c.componentType||c.entityType))}</div><span class="badge ${statusClass(c.status)}">${escapeHTML(c.status||"SELECTED")}</span><div class="meta">${escapeHTML(c.supplier||"SKANDI")} ${escapeHTML(c.supplierReference||"")} · ${money(c.totalAmount,c.currency||booking()?.currency)}</div></div>`}


  function customerFor(p){
    return p?.payload?.customerProfile||p?.payload?.clubProfile||state.clubProfiles[p?.id]||null;
  }
  function clubFor(p){
    const profile=customerFor(p);
    return profile?.isLoyaltyMember?profile:null;
  }
  function clubSearchRows(){
    const type=state.clubSearchType||"all";
    const membership=state.clubMembershipFilter||"all";
    const q=String($("#clubSearch")?.value||"").trim().toUpperCase();
    return (state.clubSearchResults||[]).filter(m=>{
      if(membership==="members"&&!m.isLoyaltyMember)return false;
      if(membership==="not_enrolled"&&m.isLoyaltyMember)return false;
      if(!q)return true;
      const fields={
        name:`${m.firstName||""} ${m.lastName||""} ${m.name||""}`,
        email:m.email||"",
        club:`${m.memberNumber||""} ${m.tier||""}`,
        member:`${m.memberId||""} ${m.customerProfileId||m.id||""}`,
        all:`${m.firstName||""} ${m.lastName||""} ${m.name||""} ${m.email||""} ${m.memberNumber||""} ${m.memberId||""} ${m.customerProfileId||m.id||""} ${m.tier||""}`
      };
      return String(fields[type]||fields.all).toUpperCase().includes(q);
    });
  }
  function selectedClubCustomer(){
    const rows=state.clubSearchResults||[];
    return rows.find(m=>String(m.customerProfileId||m.id)===String(state.clubSelectedCustomerId))||rows[0]||null;
  }
  function customerInitials(m){
    const first=String(m?.firstName||m?.name||"").trim();
    const last=String(m?.lastName||"").trim();
    return `${first.charAt(0)}${last.charAt(0)||first.charAt(1)||""}`.toUpperCase()||"CU";
  }


  function renderClub(){
    const w=workspace();
    if(!w?.booking)return `${pageHead("SKANDI Club","Connect the booking passenger to the canonical SKANDI customer profile and loyalty record.")}${emptyState("★","No booking selected","Open a booking first.")}`;


    const list=passengers();
    const p=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;
    if(p)state.selectedPassengerId=p.id;


    const linked=customerFor(p);
    const rows=clubSearchRows();
    const selected=selectedClubCustomer();


    return `${pageHead("SKANDI Club",`${masterReference()} · Customer Management member connect`)}
      <div class="alert info"><span>ℹ</span><div><strong>Customer Management connection</strong>Select a passenger, search the canonical customer database, select a customer row, then connect it to the passenger and booking. Club tier is shown only when that customer is enrolled.</div></div>
      <div class="field" style="max-width:420px">
        <label>Passenger in this booking</label>
        <select id="clubPassenger">${list.map(x=>option(x.id,paxName(x),p?.id)).join("")}</select>
      </div>
      <div class="club-cm-grid">
        <section class="panel club-manifest-panel">
          <div class="panel-head"><span>Customer / SKANDI Club Search</span><span class="muted">${rows.length} result${rows.length===1?"":"s"}</span></div>
          <div class="club-searchbar">
            <select id="clubSearchType">
              ${option("all","All fields",state.clubSearchType)}
              ${option("name","Customer name",state.clubSearchType)}
              ${option("email","Email",state.clubSearchType)}
              ${option("club","Club number / tier",state.clubSearchType)}
              ${option("member","Member / profile ID",state.clubSearchType)}
            </select>
            <input id="clubSearch" placeholder="Search customer, email, member ID or Club number…" autocomplete="off">
            <select id="clubMembershipFilter">
              ${option("all","All customers",state.clubMembershipFilter)}
              ${option("members","Club members",state.clubMembershipFilter)}
              ${option("not_enrolled","Not enrolled",state.clubMembershipFilter)}
            </select>
            <button class="primary" data-action="search-club">Search</button>
            <button class="secondary" data-action="clear-club-search" title="Clear">×</button>
          </div>
          <div class="club-table-wrap">
            ${clubCustomerTable(rows,selected?.customerProfileId||selected?.id||"")}
          </div>
          <div class="club-footer">
            <span>${rows.length} customer${rows.length===1?"":"s"}</span>
            <span>Click row to select · Double-click to connect</span>
            <span class="spacer"></span>
            <span class="mono">${linked?`CONNECTED ${escapeHTML(linked.memberNumber||linked.memberId||"PROFILE")}`:"NOT CONNECTED"}</span>
          </div>
        </section>
        <aside class="panel" id="clubProfilePanel">
          ${clubCustomerProfileMarkup(p,selected,linked)}
        </aside>
      </div>`;
  }


  function clubCustomerTable(rows,selectedId){
    if(!rows.length)return `<div class="empty"><div class="big">★</div><strong>No customer profiles match</strong><br><span>Change the search or membership filter.</span></div>`;
    return `<table class="data-table club-table"><thead><tr><th>Customer</th><th>Email</th><th>Club</th><th>Tier</th><th>Status</th></tr></thead><tbody>
      ${rows.map(m=>{
        const id=m.customerProfileId||m.id;
        return `<tr data-club-customer="${escapeAttr(id)}" class="${String(id)===String(selectedId)?"selected":""}">
          <td><strong>${escapeHTML(m.name||[m.firstName,m.lastName].filter(Boolean).join(" ")||"Customer")}</strong><br><small class="mono muted">${escapeHTML(m.memberId||id)}</small></td>
          <td>${escapeHTML(m.email||"—")}</td>
          <td>${m.isLoyaltyMember?`<span class="club-chip customer">${escapeHTML(m.memberNumber||"MEMBER")}</span>`:'<span class="muted">Not enrolled</span>'}</td>
          <td>${m.isLoyaltyMember?`<span class="club-chip tier">${escapeHTML(m.tier||"Member")}</span>`:"—"}</td>
          <td><span class="badge ${statusClass(m.status)}">${escapeHTML(m.status||"Active")}</span></td>
        </tr>`;
      }).join("")}
    </tbody></table>`;
  }


  function clubCustomerProfileMarkup(p,profile,linked){
    if(!p)return `<div class="panel-head">Customer Profile</div><div class="panel-body subtle">Select a passenger first.</div>`;
    if(!profile){
      return `<div class="panel-head">Customer Profile</div><div class="panel-body">${emptyState("♙","Select a customer","Search or select a customer row to view the profile and connect it to ${paxName(p)}.")}</div>`;
    }
    const isConnected=String(linked?.customerProfileId||linked?.id||"")===String(profile.customerProfileId||profile.id||"");
    const membership=profile.isLoyaltyMember
      ? `<span class="club-chip tier">${escapeHTML(profile.tier||"Member")}</span>`
      : `<span class="club-chip">NOT ENROLLED</span>`;
    return `<div class="panel-head">Customer Profile <span class="spacer"></span>${isConnected?'<span class="badge success">CONNECTED</span>':'<span class="badge neutral">AVAILABLE</span>'}</div>
      <div class="club-profile">
        <div class="club-profile-banner">
          <div class="club-avatar">${escapeHTML(customerInitials(profile))}</div>
          <div class="club-profile-title">
            <h2>${escapeHTML(profile.name||"Customer")}</h2>
            <div class="sub">${escapeHTML(profile.email||profile.memberId||profile.customerProfileId||"")}</div>
            <div class="club-chips">${membership}${profile.customerType?`<span class="club-chip customer">${escapeHTML(profile.customerType)}</span>`:""}</div>
          </div>
          <div class="club-status-box"><span>Customer</span><strong>${escapeHTML(profile.status||"Active")}</strong></div>
        </div>
        <div class="club-detail-grid">
          <div class="club-detail"><span class="muted">Customer profile ID</span><b class="mono">${escapeHTML(profile.customerProfileId||profile.id||"—")}</b></div>
          <div class="club-detail"><span class="muted">Member ID</span><b class="mono">${escapeHTML(profile.memberId||"—")}</b></div>
          <div class="club-detail"><span class="muted">SKANDI Club number</span><b>${escapeHTML(profile.memberNumber||"Not enrolled")}</b></div>
          <div class="club-detail"><span class="muted">Tier</span><b>${escapeHTML(profile.isLoyaltyMember?profile.tier||"Member":"Not enrolled")}</b></div>
          <div class="club-detail"><span class="muted">Email</span><b>${escapeHTML(profile.email||"—")}</b></div>
          <div class="club-detail"><span class="muted">Passenger</span><b>${escapeHTML(paxName(p))}</b></div>
        </div>
        <div class="club-profile-actions">
          <button class="primary" data-action="link-club" data-customer-profile-id="${escapeAttr(profile.customerProfileId||profile.id||"")}" ${isConnected?"disabled":""}>${isConnected?"Connected":"Connect to passenger"}</button>
          <button class="secondary" data-action="search-club">Refresh customer search</button>
        </div>
        ${profile.isLoyaltyMember?`<div class="panel-body" style="border-top:1px solid var(--line)"><div class="money-line"><span>Club tier</span><strong>${escapeHTML(profile.tier||"Member")}</strong></div><div class="money-line"><span>Recorded points</span><strong>${escapeHTML(String(profile.pointsBalance??0))}</strong></div></div>`:""}
      </div>`;
  }




  renderRequirements=function(){
    const w=workspace();const list=passengers();const p=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;const decision=state.travelDecision;const provider=state.travelRequirementsProvider||"Provider not connected";
    return `${pageHead("Travel Requirements",`${provider} · passenger document and itinerary check`,'<button class="secondary" data-action="open-timatic-desk">Open Timatic Desk</button>')}${!provider||provider==="Provider not connected"?alertBox("warning","Live regulatory provider not confirmed","SKANDI guidance can still be shown, but no result is represented as a live Timatic decision until the parent bridge identifies an authorized provider."):alertBox("info","Live provider adapter",`Current provider: ${provider}. Results are stored against the passenger and booking for audit.`)}
      ${w?.booking?`<section class="panel"><div class="panel-head">Passenger enquiry</div><div class="panel-body"><div class="grid grid-4"><div class="field"><label>Passenger</label><select id="reqPassenger">${list.map(x=>option(x.id,paxName(x),p?.id)).join("")}</select></div><div class="field"><label>Nationality</label><input id="reqNationality" maxlength="3" value="${escapeAttr(p?.nationality||"")}"></div><div class="field"><label>Residence country</label><input id="reqResidence" maxlength="3" value="${escapeAttr(p?.residenceCountry||p?.payload?.residenceCountry||"")}"></div><div class="field"><label>Date of birth</label><input id="reqDob" type="date" value="${escapeAttr(p?.dateOfBirth||"")}"></div></div><div class="grid grid-4"><div class="field"><label>Origin</label><input id="reqOrigin" maxlength="3" value="${escapeAttr(w.booking.origin||"")}"></div><div class="field"><label>Destination</label><input id="reqDestination" maxlength="3" value="${escapeAttr(w.booking.destination||"")}"></div><div class="field"><label>Passport issuing country</label><input id="reqIssue" maxlength="3" value="${escapeAttr(p?.passportCountry||p?.payload?.passportCountry||"")}"></div><div class="field"><label>Passport expiry</label><input id="reqExpiry" type="date" value="${escapeAttr(p?.passportExpiry||p?.payload?.passportExpiry||"")}"></div></div><div class="field"><label>Transit points (IATA, comma-separated)</label><input id="reqTransit" placeholder="LHR, DOH"></div><button class="primary" data-action="check-requirements">Check requirements</button></div></section>`:emptyState("✓","No booking selected","Open a booking before checking a passenger.")}
      ${decision?travelDecisionMarkup(decision):""}<section class="panel" style="margin-top:10px"><div class="panel-head">Published SKANDI guidance</div><div class="panel-body"><div class="grid grid-2">${(state.requirements||[]).map(r=>`<section class="panel"><div class="panel-head"><span>${escapeHTML(r.title||"Requirement")}</span><span class="badge info">${escapeHTML(r.category||"GUIDANCE")}</span></div><div class="panel-body">${escapeHTML(r.body||"").replace(/\n/g,"<br>")}</div></section>`).join("")||'<span class="muted">No internal guidance records published.</span>'}</div></div></section>`;
  };
  function travelDecisionMarkup(d){const status=normalizedType(d.status||d.decision||"REVIEW");const tone=status.includes("CLEAR")||status.includes("OK")?"go":status.includes("STOP")||status.includes("DENIED")?"stop":"review";return `<section class="decision ${tone}" style="margin-top:10px"><div class="muted">${escapeHTML(d.provider||state.travelRequirementsProvider||"Requirements provider")} · ${escapeHTML(d.reference||"")}</div><h2>${escapeHTML(humanize(status))}</h2><div>${escapeHTML(d.summary||d.message||"No summary returned.")}</div>${Array.isArray(d.sections)?`<div style="margin-top:10px">${d.sections.map(s=>`<div class="money-line"><span>${escapeHTML(s.title||s.category||"Requirement")}</span><strong>${escapeHTML(s.status||"")}</strong></div>`).join("")}</div>`:""}</section>`}


  renderTicketing = function() {
    const w = activeWorkspace(), order = state.selectedOrder;
    if (!w?.booking && !order) {
      return `${pageHead("Ticketing & Documents", "Supplier-issued air documents plus SKANDI customer documents and vouchers.")}
              ${emptyState("▥", "No booking selected", "Open a booking first.")}`;
    }
    
    const supplierDocs = order?.documents || [];
    const internalDocs = w?.documents || [];
    const comps = components();

    return `${pageHead("Ticketing & Documents", `${masterReference()} · document center`, '<button class="primary" data-action="print-booking-confirmation">Print confirmation</button>')}
      <div class="alert info"><span>ℹ</span><div><strong>Document authority</strong>Airline ticket/EMD identifiers are displayed from the operating supplier. SKANDI generates booking confirmations, vouchers, and transfer boarding cards.</div></div>
      
      <!-- NEW: Electronic Ticket Record (ETR) / Coupons -->
      <section class="panel" style="margin-top:10px">
        <div class="panel-head">
          <span>Electronic Ticket Record (ETR) · Coupons</span>
          <span class="mono">TWD/HK</span>
        </div>
        <div class="panel-body" style="padding:0">
          ${ticketCouponTable(w, order)}
        </div>
      </section>

      <div class="grid grid-2" style="margin-top:10px">
        <section class="panel">
          <div class="panel-head"><span>Supplier air documents</span><span>${supplierDocs.length}</span></div>
          <div class="panel-body" style="padding:0">${documentTable(supplierDocs)}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><span>SKANDI document register</span><span>${internalDocs.length}</span></div>
          <div class="panel-body" style="padding:0">${internalDocumentTable(internalDocs)}</div>
        </section>
      </div>

      <section class="panel" style="margin-top:10px">
        <div class="panel-head">Generate / send customer documents</div>
        <div class="panel-body">
          <div class="document-actions">
            <button class="secondary" data-action="generate-booking-document" data-doc-type="BOOKING_CONFIRMATION">Booking confirmation</button>
            <button class="secondary" data-action="generate-booking-document" data-doc-type="ITINERARY">Trip itinerary</button>
            <button class="secondary" data-action="generate-booking-document" data-doc-type="INVOICE">Invoice / receipt</button>
            <button class="secondary" data-action="send-booking-document" data-doc-type="BOOKING_CONFIRMATION">Email confirmation</button>
            <button class="secondary" data-action="print-passenger-manifest">Passenger list</button>
          </div>
        </div>
      </section>

      <section class="panel" style="margin-top:10px">
        <div class="panel-head">Component vouchers</div>
        <div class="panel-body" style="padding:0">
          ${comps.length ? `<table class="data-table"><thead><tr><th>Service</th><th>Supplier</th><th>Status</th><th>Voucher</th></tr></thead><tbody>${comps.map(c=>`<tr><td>${escapeHTML(serviceLabel(c))}</td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td>${escapeHTML(c.status||"")}</td><td><button class="link" data-action="print-component-voucher" data-component-id="${escapeAttr(c.id)}">Print</button> · <button class="link" data-action="send-component-voucher" data-component-id="${escapeAttr(c.id)}">Send</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty">No package components require vouchers.</div>'}
        </div>
      </section>
    `;
  };

  function ticketCouponTable(w, order) {
    const flights = w?.booking?.flightDetails?.segments || (order ? syncFlightDataToBooking(w?.booking || {}, order).flightDetails?.segments : []);
    const pax = w?.passengers || order?.passengers || [];
    const docs = order?.documents || [];

    if (!flights?.length || !pax.length) return '<div class="empty">No e-ticket coupons found. Airline order required.</div>';

    const rows = [];
    pax.forEach((p, pIdx) => {
      // Find the document associated with this passenger, fallback to PENDING
      const doc = docs.find(d => d.passengerIds?.includes(p.id)) || docs[pIdx] || { uniqueIdentifier: "PENDING ISSUE" };
      
      flights.forEach((seg, sIdx) => {
        // Simple mock to check if flight has departed to set coupon to FLOWN
        const isFlown = new Date(seg.departingAt) < new Date();
        const status = isFlown ? "FLOWN" : "OPEN FOR USE";
        const badgeColor = isFlown ? "neutral" : "success";

        rows.push(`
          <tr>
            <td><strong>${escapeHTML(paxName(p))}</strong></td>
            <td class="mono" style="color:#005eb8; font-weight:bold;">${escapeHTML(doc.uniqueIdentifier)}</td>
            <td class="mono">CPN ${sIdx + 1}</td>
            <td><strong>${escapeHTML(seg.flightNumber)}</strong></td>
            <td>${escapeHTML(seg.origin)} → ${escapeHTML(seg.destination)}</td>
            <td>${escapeHTML(formatShortDate(seg.departingAt))}</td>
            <td><span class="badge ${badgeColor}">${status}</span></td>
          </tr>
        `);
      });
    });

    return `<table class="data-table">
      <thead><tr><th>Passenger</th><th>Ticket Number</th><th>Coupon</th><th>Flight</th><th>Route</th><th>Date</th><th>Coupon Status</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>`;
  }


  renderBaggageBoarding=function(){return renderDepartureControl()};


  /* --------------------------- Charter Transfer DCS --------------------------- */
  state.transferDcsDirection = state.transferDcsDirection || "INBOUND";

  /* --------------------------- Charter Transfer DCS --------------------------- */
  state.transferDcsDirection = state.transferDcsDirection || "INBOUND";

  function transferComponents(){return components().filter(c=>normalizedType(c.componentType||c.entityType).includes("TRANSFER"))}
  
  function normalizeTransferDeparture(raw, index = 0) {
    const p = raw?.payload || {}; 
    const b = booking();
    
    let status = normalizedType(raw?.transferStatus || raw?.operationalStatus || p.transferStatus || p.operationalStatus || raw?.status || "OPEN");
    if (["CONFIRMED","BOOKED","ACTIVE","PUBLISHED"].includes(status)) status = "OPEN";
    
    const ref = raw?.serviceNumber || raw?.transferNumber || p.serviceNumber || p.transferNumber || raw?.supplierReference || p.reference || `TRF-${String(masterReference()).replace(/[^A-Z0-9]/gi,"").slice(-5).toUpperCase()||"SK"}-${String(index+1).padStart(2,"0")}`;
    const origin = String(raw?.pickupLocation || raw?.origin || p.pickupLocation || p.pickupPoint || p.from || p.origin || b?.origin || "Airport / Point A");
    const destination = String(raw?.dropoffLocation || raw?.destination || p.dropoffLocation || p.dropoffPoint || p.hotelName || p.to || p.destination || b?.destination || "Hotel / Point B");
    const date = raw?.serviceDate || raw?.startDate || p.serviceDate || p.pickupDate || b?.departureDate || b?.startDate || "";
    const scheduled = raw?.serviceTime || raw?.pickupTime || p.pickupTime || p.serviceTime || p.scheduledDeparture || "10:00";
    
    // Charter Logic: Determine Direction INBOUND (Airport -> Resort) vs OUTBOUND (Resort -> Airport)
    let direction = p.direction || raw?.direction || "";
    if (!direction) {
      if (/^[A-Z]{3}$/i.test(origin) || origin.toLowerCase().includes("airport") || origin.toLowerCase().includes("apt")) direction = "INBOUND";
      else direction = "OUTBOUND";
    }

    const localState = state.transferDcsDepartureState[raw?.id || ref] || {};
    
    return {
      id: String(raw?.id || raw?.componentId || ref),
      componentId: raw?.componentId || raw?.id || "",
      bookingId: raw?.bookingId || b?.id || "",
      serviceNumber: String(ref),
      direction: direction.toUpperCase(),
      origin: origin,
      destination: destination,
      date: String(date),
      scheduled: String(scheduled),
      estimated: String(localState.estimated || raw?.estimatedDeparture || p.estimatedDeparture || scheduled),
      bay: String(localState.bay || raw?.bay || p.bay || p.meetingPoint || p.pickupMeetingPoint || (direction === "INBOUND" ? "Arrivals Hall" : "Hotel Lobby")),
      vehicle: String(localState.vehicle || raw?.vehicleName || raw?.vehicleType || p.vehicleName || p.vehicleType || p.coachType || "Standard Coach"),
      vehicleRegistration: String(localState.vehicleRegistration || raw?.vehicleRegistration || p.vehicleRegistration || ""),
      capacity: Number(localState.capacity || raw?.capacity || p.capacity || p.vehicleCapacity || 55) || 55,
      booked: Number(raw?.passengerCount || p.passengerCount || passengers().length || 0),
      driver: String(localState.driver || raw?.driverName || p.driverName || "Pending"),
      guide: String(localState.guide || raw?.guideName || p.guideName || p.hostName || "Pending"),
      associatedFlight: String(raw?.associatedFlight || p.associatedFlight || p.arrivalFlightNumber || p.departureFlightNumber || p.flightNumber || b?.flightNumber || "SK" + Math.floor(100+Math.random()*800)),
      status: String(localState.status || status || "OPEN"),
      raw
    };
  }

  function transferDepartures() {
    const live = Array.isArray(state.transferDcsDepartures) ? state.transferDcsDepartures : [];
    const local = transferComponents();
    const all = [...live, ...local];
    const seen = new Set();
    return all.map(normalizeTransferDeparture).filter(d => {
      const k = d.id || d.serviceNumber;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function selectedTransferDeparture() {
    const list = transferDepartures();
    let dep = list.find(d => d.id === state.transferDcsSelectedDepartureId) || list.find(d => d.direction === state.transferDcsDirection) || list[0] || null;
    if (dep && !state.transferDcsSelectedDepartureId) state.transferDcsSelectedDepartureId = dep.id;
    return dep;
  }

  function transferPassengers(dep) {
    if (!dep) return [];
    const raw = dep.raw || {};
    if (Array.isArray(raw.passengers) && raw.passengers.length) return raw.passengers;
    if (Array.isArray(raw.payload?.passengers) && raw.payload.passengers.length) return raw.payload.passengers;
    if (!workspace()?.booking) return [];
    return passengers();
  }

  function transferPaxState(dep, p) {
    if (!dep || !p) return { acceptance: "BOOKED", boarding: "NOT_BOARDED", seat: "", bags: 0, weight: 0, boardedAt: "" };
    const depId = dep.id, pid = p.id || p.passengerId || p.passengerRef || paxName(p);
    const saved = state.transferDcsPassengerState[depId]?.[pid] || {};
    const source = p.transferDcs?.[depId] || p.payload?.transferDcs?.[depId] || {};
    return {
      acceptance: normalizedType(saved.acceptance || source.acceptance || source.status || "BOOKED"),
      boarding: normalizedType(saved.boarding || source.boarding || "NOT_BOARDED"),
      seat: String(saved.seat || source.seat || ""),
      bags: Number(saved.bags ?? source.bags ?? p.baggageCount ?? p.payload?.baggageCount ?? 0) || 0,
      weight: Number(saved.weight ?? source.weight ?? p.baggageWeight ?? p.payload?.baggageWeight ?? 0) || 0,
      boardedAt: String(saved.boardedAt || source.boardedAt || ""),
      voucherVerified: Boolean(saved.voucherVerified ?? source.voucherVerified ?? false),
      remarks: String(saved.remarks || source.remarks || "")
    };
  }

  function transferPaxId(p) { return String(p?.id || p?.passengerId || p?.passengerRef || paxName(p)); }
  function transferSelectedPax(dep) {
    const list = transferPassengers(dep);
    const id = state.transferDcsSelectedPassengerId;
    return list.find(p => transferPaxId(p) === id) || list[0] || null;
  }

  function transferStats(dep) {
    const list = transferPassengers(dep);
    const states = list.map(p => transferPaxState(dep, p));
    return {
      booked: list.length || dep?.booked || 0,
      accepted: states.filter(x => ["ACCEPTED", "BOARDED"].includes(x.acceptance) || x.boarding === "BOARDED").length,
      boarded: states.filter(x => x.boarding === "BOARDED").length,
      waitlist: states.filter(x => x.acceptance === "WAITLIST").length,
      noshow: states.filter(x => x.acceptance === "NO_SHOW").length,
      bags: states.reduce((a, x) => a + x.bags, 0)
    };
  }

  function transferStatusBadge(status) {
    status = normalizedType(status || "OPEN");
    const cls = ["OPEN", "BOARDING", "READY"].includes(status) ? "success" : ["DELAYED", "WAITLIST", "HOLD"].includes(status) ? "warning" : ["CLOSED", "CANCELLED"].includes(status) ? "danger" : "neutral";
    return `<span class="badge ${cls}">${escapeHTML(humanize(status))}</span>`;
  }

  function transferDcsTabs() {
    const tabs = [
      ["departures", "▦", "Airport Day Dashboard"],
      ["acceptance", "▤", "Customer Check-off"],
      ["boarding", "▶", "Coach Boarding / Scanner"],
      ["seats", "▦", "Coach Seat Map"],
      ["activity", "≡", "Operations Log"]
    ];
    return `<div class="transfer-dcs-tabs">${tabs.map(([id, icon, label]) => `<button class="transfer-dcs-tab ${state.transferDcsTab === id ? "active" : ""}" data-transfer-dcs-tab="${id}">${icon} ${label}</button>`).join("")}</div>`;
  }

  function renderDepartureControl() {
    const dep = selectedTransferDeparture();
    const stats = dep ? transferStats(dep) : { booked: 0, accepted: 0, boarded: 0, bags: 0 };
    return `${pageHead("Departure Control", dep ? `${dep.serviceNumber} · ${dep.direction} · ${dep.origin} → ${dep.destination}` : "Charter Transfer Operations Dashboard", '<button class="secondary" data-action="refresh-transfer-dcs">Refresh schedule</button>')}
      ${alertBox("info", "Tour Operator Transfer Control", "Handle massive airport days with inbound (arrival) and outbound (departure) filters. Link passengers arriving on flights directly to their assigned resort coaches.")}
      ${transferDcsTabs()}
      ${state.transferDcsTab !== "departures" ? `<div class="dcs-summary">${statCard("Direction", dep?.direction || "—", "Operations flow")}${statCard("Booked", stats.booked, "Manifest total")}${statCard("Checked Off", stats.accepted, "At meeting point")}${statCard("Boarded", stats.boarded, `${stats.bags} luggage piece(s)`)}</div>` : ""}
      ${renderTransferDcsTab(dep)}`;
  }

  function renderTransferDcsTab(dep) {
    if (state.transferDcsTab === "departures") return renderTransferDepartures();
    if (!dep) return `<section class="panel"><div class="panel-head">${escapeHTML(humanize(state.transferDcsTab))}</div><div class="panel-body">${emptyState("▰", "No transfer departure selected", "Load today's transfer departures from the Airport Day Dashboard.")}</div></section>`;
    if (state.transferDcsTab === "acceptance") return renderTransferAcceptance(dep);
    if (state.transferDcsTab === "seats") return renderTransferSeatControl(dep);
    if (state.transferDcsTab === "boarding") return renderTransferBoarding(dep);
    return renderTransferActivity(dep);
  }

  function renderTransferDepartures() {
    const list = transferDepartures();
    const dir = state.transferDcsDirection;
    const filtered = list.filter(d => d.direction === dir);
    
    return `<section class="panel">
      <div class="panel-head">Airport Day Operations</div>
      <div class="panel-body" style="padding:10px 10px 0 10px;">
        <div class="transfer-dashboard-filter">
          <button class="${dir === "INBOUND" ? "active inbound" : ""}" data-action="set-transfer-direction" data-dir="INBOUND">
            ▼ INBOUND: Flights Arriving ➔ Coaches to Resort
          </button>
          <button class="${dir === "OUTBOUND" ? "active outbound" : ""}" data-action="set-transfer-direction" data-dir="OUTBOUND">
            ▲ OUTBOUND: Coaches from Resort ➔ Flights Departing
          </button>
        </div>
      </div>
      <div class="panel-body" style="padding:0">
        ${filtered.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Coach / Service</th>
              <th>Flight Link</th>
              <th>Routing / Stops</th>
              <th>Time</th>
              <th>Load</th>
              <th>Driver / Host</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(dep => {
              const st = transferStats(dep);
              const pct = Math.min(100, Math.round((st.booked / Math.max(1, dep.capacity)) * 100));
              const badgeClass = dep.direction === "INBOUND" ? "inbound" : "outbound";
              return `<tr class="${dep.id === state.transferDcsSelectedDepartureId ? "selected" : ""}">
                <td>
                  <strong class="mono" style="font-size:13px;">${escapeHTML(dep.serviceNumber)}</strong><br>
                  <span class="dir-badge ${badgeClass}">${dep.direction}</span>
                </td>
                <td>
                  <div class="transfer-flight-ref">Flight ${escapeHTML(dep.associatedFlight)}</div>
                  <small class="muted">${dep.direction === "INBOUND" ? "Arriving Pax" : "Departing Pax"}</small>
                </td>
                <td>
                  <div class="route-timeline">
                    <div class="route-stop">${escapeHTML(dep.origin)}</div>
                    <div class="route-line"></div>
                    <div class="route-stop">${escapeHTML(dep.destination)}</div>
                  </div>
                  <div class="transfer-sub">Meeting point: ${escapeHTML(dep.bay)}</div>
                </td>
                <td>
                  <div class="mono strong">${escapeHTML(dep.scheduled)}</div>
                  <small class="muted">Date: ${escapeHTML(dep.date || "Today")}</small>
                </td>
                <td>
                  <div class="transfer-load">
                    <strong>${st.booked}/${dep.capacity}</strong> · ${st.accepted} accepted
                    <div class="transfer-load-track"><div class="transfer-load-fill" style="width:${pct}%"></div></div>
                  </div>
                </td>
                <td>${escapeHTML(dep.driver)}<br><small>${escapeHTML(dep.guide)}</small></td>
                <td>${transferStatusBadge(dep.status)}</td>
                <td><button class="primary" data-action="select-transfer-departure" data-departure-id="${escapeAttr(dep.id)}">Open Coach</button></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>` : emptyState("🚌", `No ${dir} coaches found`, "No transfer operations match this direction for the selected date/booking.")}
      </div>
    </section>`;
  }

  function renderTransferAcceptance(dep) {
    const list = transferPassengers(dep);
    const p = transferSelectedPax(dep);
    return `<div class="workspace-layout">
      <section class="panel">
        <div class="panel-head">
          <span>Customer Check-off · Coach ${escapeHTML(dep.serviceNumber)}</span>
          <span>${list.length} pax</span>
        </div>
        <div class="toolbar">
          <div class="field" style="margin:0;min-width:180px">
            <label>Filter Status</label>
            <select id="transferAcceptanceFilter">
              <option value="ALL">All customers</option>
              <option value="BOOKED">Expected / Not arrived</option>
              <option value="ACCEPTED">Checked off</option>
              <option value="WAITLIST">Waitlist / Overflow</option>
              <option value="NO_SHOW">No show</option>
            </select>
          </div>
          <span class="muted">Rep Meeting Point: <strong>${escapeHTML(dep.bay)}</strong> · Flight: <strong>${escapeHTML(dep.associatedFlight)}</strong></span>
        </div>
        <div class="panel-body" style="padding:0">${transferAcceptanceTable(dep, list)}</div>
      </section>
      <aside class="panel sticky">
        <div class="panel-head">Selected Customer</div>
        <div class="panel-body">${p ? transferCustomerPanel(dep, p) : '<span class="muted">Select a customer.</span>'}</div>
      </aside>
    </div>`;
  }

  function transferAcceptanceTable(dep, list) {
    if (!list.length) return '<div class="empty">No customers assigned to this transfer departure.</div>';
    return `<table class="data-table">
      <thead><tr><th>SEQ</th><th>Customer</th><th>Booking</th><th>Hotel / Stop</th><th>Seat</th><th>Check-off</th><th>Luggage</th><th>Boarding</th><th></th></tr></thead>
      <tbody>
        ${list.map((p, i) => {
          const st = transferPaxState(dep, p);
          const ref = p.bookingReference || p.pnrLocator || masterReference();
          const hotel = p.hotelName || p.payload?.hotelName || (dep.direction === "INBOUND" ? dep.destination : dep.origin);
          return `<tr data-transfer-status="${escapeAttr(st.acceptance)}">
            <td class="mono">${String(i+1).padStart(3,"0")}</td>
            <td><strong>${escapeHTML(paxName(p))}</strong></td>
            <td class="mono">${escapeHTML(ref)}</td>
            <td>${escapeHTML(hotel)}</td>
            <td class="mono">${escapeHTML(st.seat || "—")}</td>
            <td>${transferStatusBadge(st.acceptance)}</td>
            <td>${st.bags} pc</td>
            <td>${transferStatusBadge(st.boarding)}</td>
            <td><button class="link" data-action="select-transfer-passenger" data-passenger-id="${escapeAttr(transferPaxId(p))}">Manage</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
  }

  function transferCustomerPanel(dep, p) {
    const st = transferPaxState(dep, p);
    const ref = p.bookingReference || p.pnrLocator || masterReference();
    const hotel = p.hotelName || p.payload?.hotelName || (dep.direction === "INBOUND" ? dep.destination : dep.origin);
    return `<div class="transfer-profile">
      <div class="transfer-profile-head">
        <div class="transfer-profile-name">${escapeHTML(paxName(p))}</div>
        <div class="transfer-profile-ref">${escapeHTML(ref)} · ${escapeHTML(dep.serviceNumber)}</div>
      </div>
      <div class="money-line"><span>Flight</span><strong>${escapeHTML(dep.associatedFlight)}</strong></div>
      <div class="money-line"><span>Hotel / Stop</span><strong>${escapeHTML(hotel)}</strong></div>
      <div class="money-line"><span>Coach Seat</span><strong>${escapeHTML(st.seat || "Unassigned")}</strong></div>
      <div class="money-line"><span>Check-off</span><strong>${escapeHTML(humanize(st.acceptance))}</strong></div>
      <div class="money-line"><span>Luggage</span><strong>${st.bags} pc${st.weight ? ` · ${st.weight} kg` : ""}</strong></div>
      <div class="dcs-toolbar">
        <button class="primary" data-action="transfer-accept">Check-off Pax</button>
        <button class="secondary" data-action="transfer-bag">Luggage</button>
        <button class="secondary" data-action="transfer-seat">Assign Seat</button>
        <button class="secondary" data-action="transfer-card">Boarding Card</button>
        <button class="warning-btn secondary" data-action="transfer-waitlist">Overflow Bus</button>
        <button class="danger-btn" data-action="transfer-noshow">No Show</button>
      </div>
    </div>`;
  }

  function renderTransferSeatControl(dep) {
    const list = transferPassengers(dep);
    const selected = transferSelectedPax(dep);
    const rows = Math.ceil(Math.max(4, dep.capacity) / 4);
    const occupied = new Map();
    list.forEach(p => {
      const st = transferPaxState(dep, p);
      if (st.seat && st.acceptance !== "NO_SHOW") occupied.set(st.seat, p);
    });

    return `<div class="workspace-layout">
      <section class="panel">
        <div class="panel-head">
          <span>Coach Space Control · ${escapeHTML(dep.vehicle)}</span>
          <span>${occupied.size}/${dep.capacity} assigned</span>
        </div>
        <div class="panel-body" style="padding:0">
          <div class="svc-body" style="display: block; min-height: auto;">
            <div class="seat-legend" style="display: flex; flex-wrap: wrap; align-items: center; gap: 15px; border-right: none; border-bottom: 1px solid #d2d8de; background: #fafafa;">
              <div style="font-weight: 800; color: #173f5c; margin-right: 5px;">LEGEND:</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch selected">P1</span>Selected Customer</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch" style="background:#3d6581; color:#fff; border-color:#28465b">P2</span>Occupied</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch"></span>Available</div>
              <div class="legend-row" style="margin:0;"><span class="legend-swatch blocked">X</span>Capacity Blocked</div>
            </div>
            <div class="aircraft-canvas" style="padding: 20px; overflow-x: auto;">
              <div class="cabin-title" style="text-align: left; margin-bottom: 10px; font-weight: bold; color: #173f5c;">
                CABIN SEATING · ${escapeHTML(dep.serviceNumber)} (${escapeHTML(dep.vehicle)})
              </div>
              <div style="display: inline-flex; flex-direction: row; gap: 6px; align-items: flex-start; background: #f4f7f9; padding: 15px 25px 15px 15px; border-radius: 40px 10px 10px 40px; border: 2px solid #cbd3da;">
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-right: 10px; padding-top: 30px;">
                   <span style="writing-mode: vertical-rl; transform: rotate(180deg); color: #798891; font-weight: 800; font-size: 11px; letter-spacing: 4px;">FRONT</span>
                </div>
                ${Array.from({ length: rows }, (_, i) => {
                  const row = i + 1;
                  return `<div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                      <span class="row-number" style="margin-bottom: 3px;">${row}</span>
                      ${transferSeatButton(dep, `${row}A`, occupied, list)}
                      ${transferSeatButton(dep, `${row}B`, occupied, list)}
                      <div style="height: 16px;"></div>
                      ${transferSeatButton(dep, `${row}C`, occupied, list)}
                      ${transferSeatButton(dep, `${row}D`, occupied, list)}
                      <span class="row-number" style="margin-top: 3px;">${row}</span>
                    </div>`;
                }).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>
      <aside class="panel sticky">
        <div class="panel-head">Selected Customer</div>
        <div class="panel-body">
          ${selected ? `${transferCustomerPanel(dep, selected)}<button class="primary" style="margin-top:8px; width:100%" data-action="transfer-auto-seat">Auto-assign Next Seat</button>` : '<span class="muted">Select a customer in Customer Check-off.</span>'}
        </div>
      </aside>
    </div>`;
  }

  function transferSeatButton(dep, seat, occupied, list) {
    const p = occupied.get(seat);
    const currentPaxId = state.transferDcsSelectedPassengerId || state.selectedPassengerId;
    const isCurrentPax = p && transferPaxId(p) === currentPaxId;
    const n = parseInt(seat, 10);
    const blocked = n * 4 > dep.capacity;
    let badge = "";
    if (p) {
      const idx = Array.isArray(list) ? list.indexOf(p) : -1;
      badge = `<span class="seat-pax-badge">${idx >= 0 ? `P${idx + 1}` : "✓"}</span>`;
    }
    return `<button type="button" 
      class="seat-cell ${p ? "occupied" : ""} ${isCurrentPax ? "selected" : ""} ${blocked ? "blocked" : ""}" 
      data-action="transfer-seat-click" data-seat="${escapeAttr(seat)}" ${blocked ? "disabled" : ""} 
      title="${escapeAttr(p ? `${seat}: ${paxName(p)}` : `${seat}: Available`)}">
      <span>${escapeHTML(seat)}</span>${badge}
    </button>`;
  }

  function renderTransferBoarding(dep) {
    const list = transferPassengers(dep);
    const st = transferStats(dep);
    const depState = state.transferDcsDepartureState[dep.id] || {};
    const boardingStarted = Boolean(depState.boardingStarted) || dep.status === "BOARDING";
    const closed = dep.status === "CLOSED" || Boolean(depState.closed);
    return `<div class="board-kpis" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px">${statCard("Expected", st.booked, "Total manifest")}${statCard("Checked Off", st.accepted, "Ready to board")}${statCard("Boarded", st.boarded, "On coach")}${statCard("Remaining", Math.max(0, st.accepted - st.boarded), "Missing pax")}</div>
    <div class="workspace-layout">
      <div>
        <div class="transfer-scanner">
          <div class="strong">Coach Boarding Scanner / Manual Entry</div>
          <div class="transfer-scanner-line">
            <input id="transferScannerInput" placeholder="SCAN VOUCHER OR ENTER SURNAME / SEAT" autocomplete="off" ${boardingStarted && !closed ? "" : "disabled"}>
            <button class="primary" data-action="transfer-scan" ${boardingStarted && !closed ? "" : "disabled"}>BOARD</button>
          </div>
          <div class="transfer-sub" style="color:#9fc1d7">Coach ${escapeHTML(dep.serviceNumber)} · ${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)}</div>
          <div class="transfer-scan-result" id="transferScanResult">
            <strong>${closed ? "Departure closed" : boardingStarted ? "Scanner ready" : "Boarding not started"}</strong>
            <div>${closed ? "No further boarding transactions are permitted." : boardingStarted ? "Waiting for customer scan." : "Start boarding to activate."}</div>
          </div>
        </div>
        <section class="panel" style="margin-top:8px">
          <div class="panel-head">Boarding Manifest</div>
          <div class="panel-body" style="padding:0">${transferBoardingTable(dep, list)}</div>
        </section>
      </div>
      <aside class="panel sticky">
        <div class="panel-head">Dispatch Control</div>
        <div class="panel-body">
          <div class="money-line"><span>Direction</span><strong>${escapeHTML(dep.direction)}</strong></div>
          <div class="money-line"><span>Vehicle</span><strong>${escapeHTML(dep.vehicle)}</strong></div>
          <div class="money-line"><span>Driver</span><strong>${escapeHTML(dep.driver)}</strong></div>
          <div class="action-stack" style="margin-top:10px">
            <button class="primary" data-action="transfer-start-boarding" ${closed ? "disabled" : ""}>${boardingStarted ? "Boarding active" : "Start boarding"}</button>
            <button class="secondary" data-action="print-transfer-manifest">Print driver manifest</button>
            <button class="danger-btn" data-action="transfer-close" ${closed ? "disabled" : ""}>Close & dispatch coach</button>
          </div>
        </div>
      </aside>
    </div>`;
  }

  function transferBoardingTable(dep, list) {
    if (!list.length) return '<div class="empty">No customers assigned.</div>';
    return `<table class="data-table"><thead><tr><th>SEQ</th><th>Customer</th><th>Seat</th><th>Check-off</th><th>Boarding</th><th>Time</th><th>Luggage</th><th></th></tr></thead><tbody>
      ${list.map((p, i) => {
        const st = transferPaxState(dep, p);
        return `<tr><td class="mono">${String(i+1).padStart(3,"0")}</td><td><strong>${escapeHTML(paxName(p))}</strong></td><td>${escapeHTML(st.seat||"—")}</td><td>${transferStatusBadge(st.acceptance)}</td><td>${transferStatusBadge(st.boarding)}</td><td class="mono">${escapeHTML(st.boardedAt||"—")}</td><td>${st.bags} pc</td><td><button class="link" data-action="select-transfer-passenger" data-passenger-id="${escapeAttr(transferPaxId(p))}">Manage</button>${st.boarding==="BOARDED" ? ` · <button class="link" data-action="transfer-offload" data-passenger-id="${escapeAttr(transferPaxId(p))}">Offload</button>` : ""}</td></tr>`;
      }).join("")}
    </tbody></table>`;
  }

  function renderTransferActivity(dep) {
    const rows = state.transferDcsActivity.filter(a => !dep || a.departureId === dep.id);
    return `<div class="grid grid-2"><section class="panel"><div class="panel-head"><span>Operations Log · Coach ${escapeHTML(dep?.serviceNumber||"")}</span><button class="link" data-action="transfer-clear-activity">Clear local log</button></div><div class="panel-body" style="padding:0"><div class="transfer-activity">${rows.length ? rows.map(a => `<div class="transfer-activity-row"><time>${escapeHTML(a.time)}</time><div>${escapeHTML(a.text)}</div></div>`).join("") : '<div class="empty">No transfer operations recorded.</div>'}</div></div></section><section class="panel"><div class="panel-head">Operational Reference</div><div class="panel-body"><div class="money-line"><span>Coach</span><strong class="mono">${escapeHTML(dep?.serviceNumber||"—")}</strong></div><div class="money-line"><span>Route</span><strong>${escapeHTML(dep ? `${dep.origin} → ${dep.destination}` : "—")}</strong></div><div class="money-line"><span>Scheduled</span><strong>${escapeHTML(dep ? `${dep.date} ${dep.scheduled}` : "—")}</strong></div><div class="transfer-operation-note" style="margin-top:10px">This log tracks real-time rep actions (check-offs, bag assignments, dispatch) locally during the airport day.</div></div></section></div>`;
  }
  
  function transferLog(dep, text) {
    state.transferDcsActivity.unshift({ departureId: dep?.id || "", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text });
    state.transferDcsActivity = state.transferDcsActivity.slice(0, 250);
  }
  function transferSavePassenger(dep, p, patch, message) {
    if (!dep || !p) return;
    const depId = dep.id, pid = transferPaxId(p);
    state.transferDcsPassengerState[depId] = state.transferDcsPassengerState[depId] || {};
    state.transferDcsPassengerState[depId][pid] = { ...transferPaxState(dep, p), ...patch };
    transferLog(dep, `${paxName(p)} · ${message}`);
    if (state.transferDcsPersistence) post("ALTEA_TRANSFER_DCS_UPDATE_PASSENGER", { departureId: dep.id, componentId: dep.componentId, bookingId: dep.bookingId || booking()?.id, passengerId: p.id || pid, patch: state.transferDcsPassengerState[depId][pid] }, { busy: false });
    toast("Transfer Control", message, "success");
    render();
  }
  function transferSaveDeparture(dep, patch, message) {
    if (!dep) return;
    state.transferDcsDepartureState[dep.id] = { ...(state.transferDcsDepartureState[dep.id] || {}), ...patch };
    transferLog(dep, message);
    if (state.transferDcsPersistence) post("ALTEA_TRANSFER_DCS_UPDATE_DEPARTURE", { departureId: dep.id, componentId: dep.componentId, bookingId: dep.bookingId || booking()?.id, patch }, { busy: false });
    toast("Transfer Control", message, "success");
    render();
  }
  
  // (Helper modal functions for bags/seats/scanning are kept identical but styled via CSS above)
  function openTransferBagModal(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const st=transferPaxState(dep,p);openModal("Coach Luggage",`<div class="grid grid-2"><div class="field"><label>Pieces</label><input id="transferBagPieces" type="number" min="0" value="${escapeAttr(String(st.bags))}"></div><div class="field"><label>Total weight kg</label><input id="transferBagWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(st.weight))}"></div></div><div class="field"><label>Notes (e.g. Golf bag, Stroller)</label><textarea id="transferBagNotes">${escapeHTML(st.remarks||"")}</textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save luggage",className:"primary",onClick:()=>{const bags=Math.max(0,Number($("#transferBagPieces")?.value||0)),weight=Math.max(0,Number($("#transferBagWeight")?.value||0)),remarks=$("#transferBagNotes")?.value||"";closeModal();transferSavePassenger(dep,p,{bags,weight,remarks},`Luggage updated: ${bags} pc${weight?`, ${weight} kg`:""}`)}}])}
  function assignTransferSeat(seat){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const occupied=transferPassengers(dep).find(x=>x!==p&&transferPaxState(dep,x).seat===seat&&transferPaxState(dep,x).acceptance!=="NO_SHOW");if(occupied)return toast("Seat occupied",`${seat} is assigned to ${paxName(occupied)}.`,"warning");transferSavePassenger(dep,p,{seat},`Seat ${seat} assigned`)}
  function autoTransferSeat(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const used=new Set(transferPassengers(dep).filter(x=>transferPaxId(x)!==transferPaxId(p)).map(x=>transferPaxState(dep,x).seat).filter(Boolean));const rows=Math.ceil(dep.capacity/4);for(let r=1;r<=rows;r++)for(const l of ["A","D","B","C"]){const seat=`${r}${l}`;const position=(r-1)*4+["A","B","C","D"].indexOf(l)+1;if(position<=dep.capacity&&!used.has(seat))return assignTransferSeat(seat)}toast("Coach full","No unassigned seats remain.","warning")}
  function transferScan(){const dep=selectedTransferDeparture();if(!dep)return;const input=$("#transferScannerInput");const val=String(input?.value||"").trim().toUpperCase();if(!val)return;const depState=state.transferDcsDepartureState[dep.id]||{};if(!depState.boardingStarted&&dep.status!=="BOARDING")return transferScanResult(false,"Boarding not started","Start boarding before scanning vouchers.");if(dep.status==="CLOSED"||depState.closed)return transferScanResult(false,"Departure closed","Coach has been dispatched.");const list=transferPassengers(dep);const p=list.find((x,i)=>{const st=transferPaxState(dep,x),ref=String(x.bookingReference||x.pnrLocator||masterReference()).toUpperCase();return String(i+1).padStart(3,"0")===val||String(st.seat).toUpperCase()===val||ref===val||String(x.lastName||x.last||"").toUpperCase()===val||paxName(x).toUpperCase()===val});if(!p)return transferScanResult(false,"Customer not found",`No match for ${val} on this coach.`);const st=transferPaxState(dep,p);if(st.boarding==="BOARDED")return transferScanResult(false,"Already boarded",`${paxName(p)} is already on the coach.`);if(!["ACCEPTED","BOARDED"].includes(st.acceptance))return transferScanResult(false,"Not checked off",`${paxName(p)} must check-in with the rep first.`);state.transferDcsSelectedPassengerId=transferPaxId(p);transferSavePassenger(dep,p,{boarding:"BOARDED",acceptance:"BOARDED",boardedAt:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},`Boarded coach`);setTimeout(()=>transferScanResult(true,"Boarding OK",`${paxName(p)} · Seat ${transferPaxState(dep,p).seat||"unassigned"}`),0)}
  function transferScanResult(ok,title,message){const el=$("#transferScanResult");if(!el){toast(title,message,ok?"success":"danger");return}el.className=`transfer-scan-result ${ok?"success":"error"}`;el.innerHTML=`<strong>${escapeHTML(title)}</strong><div>${escapeHTML(message)}</div>`;if(ok){const i=$("#transferScannerInput");if(i){i.value="";i.focus()}}}
  
  function printTransferCard(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const st=transferPaxState(dep,p);const no=`TC-${dep.serviceNumber}-${String(transferPassengers(dep).indexOf(p)+1).padStart(3,"0")}`;printHtml(`Transfer Card ${paxName(p)}`,transferCardHtml(dep,p,st,no))}
  function printTransferLuggageTag(){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);if(!dep||!p)return;const tag=`TRF-${String(masterReference()).replace(/[^A-Z0-9]/gi,"").slice(-6).toUpperCase()}-${String(transferPassengers(dep).indexOf(p)+1).padStart(3,"0")}`;printHtml(`Transfer Luggage Tag ${tag}`,transferLuggageTagHtml(dep,p,tag));if(state.transferDcsPersistence)post("ALTEA_TRANSFER_DCS_RECORD_DOCUMENT",{departureId:dep.id,bookingId:dep.bookingId||booking()?.id,passengerId:p.id||transferPaxId(p),documentType:"TRANSFER_LUGGAGE_TAG",documentNumber:tag},{busy:false})}
  
  function transferCardBarcodeSvg(value){
    const input=String(value||"");
    let seed=2166136261>>>0;
    for(let i=0;i<input.length;i++)seed=Math.imul(seed^input.charCodeAt(i),16777619)>>>0;
    const width=540,height=150,rows=12,rowHeight=10,rowGap=2;
    let rects=[];
    for(let row=0;row<rows;row++){
      const y=3+row*(rowHeight+rowGap);
      let x=3;
      rects.push(`<rect x="${x}" y="${y}" width="5" height="${rowHeight}"/>`);x+=7;
      rects.push(`<rect x="${x}" y="${y}" width="2" height="${rowHeight}"/>`);x+=5;
      for(let part=0;part<74&&x<522;part++){
        seed=(Math.imul(seed^(row*257+part*31+17),1664525)+1013904223)>>>0;
        const dark=((seed>>>(part%23))&1)===1;
        const w=2+(seed%5);
        if(dark)rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${rowHeight}"/>`);
        x+=w+1;
      }
      rects.push(`<rect x="524" y="${y}" width="3" height="${rowHeight}"/>`);
      rects.push(`<rect x="531" y="${y}" width="6" height="${rowHeight}"/>`);
    }
    return `<svg class="tc-pdf417" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SKANDI transfer data mark"><rect width="100%" height="100%" fill="#fff"/><g fill="#050505">${rects.join("")}</g></svg>`;
  }

  function transferCardHtml(dep,p,st,no){
    const raw=dep?.raw||{},payload=raw?.payload||{};
    const sequence=String(Math.max(1,transferPassengers(dep).indexOf(p)+1)).padStart(3,"0");
    const bookingRef=String(p?.bookingReference||p?.pnrLocator||masterReference()||"—");
    const passenger=String(paxName(p)||"—");
    const transferNo=String(dep?.serviceNumber||"—");
    const from=String(dep?.origin||"—");
    const to=String(dep?.destination||"—");
    const direction=String(dep?.direction||"—");
    const pickupTime=String(raw?.serviceTime||raw?.pickupTime||payload?.pickupTime||payload?.serviceTime||payload?.scheduledDeparture||"—");
    const boardingTime=String(raw?.boardingTime||raw?.reportTime||payload?.boardingTime||payload?.reportTime||pickupTime||"—");
    const point=String(dep?.bay||dep?.vehicleRegistration||dep?.vehicle||"—");
    const seat=String(st?.seat||"OPEN");
    const serviceDate=String(formatPrinterDate(dep?.date)||dep?.date||"—");
    const associatedFlight=String(raw?.associatedFlight||payload?.associatedFlight||payload?.arrivalFlightNumber||payload?.departureFlightNumber||payload?.flightNumber||booking()?.flightNumber||"—");
    const bags=Math.max(0,Number(st?.bags||0));
    const bagWeight=Math.max(0,Number(st?.weight||0));
    const bagSummary=`${bags} PC${bagWeight?` · ${bagWeight} KG`:""}`;
    const barcodeValue=[no,bookingRef,transferNo,passenger,from,to,serviceDate,pickupTime,seat,sequence].join("|");
    const barcode=transferCardBarcodeSvg(barcodeValue);
    return `<style id="skandi-transfer-atb-print">
html,body{margin:0!important;padding:0!important;width:203.20mm!important;height:82.55mm!important;background:#fff!important;color:#050505!important;overflow:hidden!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
*{box-sizing:border-box}
.tc-pass{position:relative;width:203.20mm;height:82.55mm;background:#fff;color:#050505;overflow:hidden;font-family:"Courier New",Courier,monospace}
.tc-pass:before,.tc-pass:after{content:"";position:absolute;z-index:4;top:0;bottom:0;width:.35mm;background:repeating-linear-gradient(to bottom,#000 0 .25mm,transparent .25mm .85mm);opacity:.22}.tc-pass:before{left:0}.tc-pass:after{right:0}
.tc-strip{position:absolute;inset:0 0 auto;height:12mm;background:#022e64}
.tc-head{position:absolute;left:5.2mm;right:23mm;top:0;height:12mm;display:grid;grid-template-columns:43mm 1fr 28mm;gap:4mm;align-items:center;color:#fff}
.tc-brand{font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:-.45mm;font-size:7.4mm;line-height:.85;white-space:nowrap}.tc-brand small{display:block;margin-top:.8mm;font-size:1.55mm;letter-spacing:.42mm;font-weight:700}
.tc-doc{text-align:center;font-family:Arial,Helvetica,sans-serif}.tc-doc-title{font-size:4.25mm;font-weight:900;letter-spacing:.55mm;white-space:nowrap}.tc-doc-sub{margin-top:.6mm;font-size:1.9mm;font-weight:700;letter-spacing:.22mm}
.tc-seq{text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:2.25mm;font-weight:800;letter-spacing:.12mm}.tc-seq strong{display:block;font-size:4.3mm;letter-spacing:.25mm}
.tc-content{position:absolute;left:5.2mm;right:23mm;top:15mm;bottom:4.4mm}
.tc-name-row{display:grid;grid-template-columns:2.8fr 1.45fr;gap:6mm;align-items:end;margin:0 0 2.5mm 5.5mm}.tc-label{display:block;font-family:Arial,Helvetica,sans-serif;font-size:2.5mm;line-height:1;text-transform:uppercase;letter-spacing:.18mm;font-weight:600;color:#111}.tc-label-soft{font-size:1.8mm;color:#555;letter-spacing:.14mm}.tc-passenger{margin-top:1.5mm;font-size:4.7mm;font-weight:900;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tc-pnr{margin-top:.8mm;font-size:5.3mm;font-weight:900;line-height:1;letter-spacing:.25mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-matrix{display:grid;grid-template-columns:1.05fr .76fr .76fr 1.42fr 1.42fr .8fr .72fr .62fr;column-gap:2.6mm;row-gap:.8mm;margin:1mm 0 0 5.5mm;align-items:start}.tc-matrix .tc-label{font-size:2.15mm;color:#222}.tc-value{font-size:3.15mm;line-height:1.05;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tc-subvalue{display:block;margin-top:.8mm;font-family:Arial,Helvetica,sans-serif;font-size:1.75mm;line-height:1;font-weight:700;text-transform:uppercase;letter-spacing:.1mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#444}
.tc-highlight{display:grid;grid-template-columns:1fr 1fr 1fr;width:61%;margin:3.1mm 0 0 5.5mm;border:.45mm solid #000;text-align:center}.tc-highlight>div{padding:1.15mm 1.5mm 1mm}.tc-highlight>div+div{border-left:.3mm solid #000}.tc-highlight .tc-label{font-size:2.05mm}.tc-highlight strong{display:block;margin-top:.8mm;font-size:5mm;line-height:.9;font-weight:900}
.tc-footer{position:absolute;left:5.5mm;right:0;bottom:0}.tc-ticketline{display:flex;gap:8mm;margin-bottom:1.6mm;font-family:Arial,Helvetica,sans-serif;font-size:1.8mm;letter-spacing:.12mm;font-weight:700}.tc-bottom{display:grid;grid-template-columns:34mm 39mm 1fr;gap:4mm;align-items:end;padding-top:1.55mm;border-top:.35mm solid #000}.tc-bottom .tc-value{margin-top:.55mm;font-family:Arial,Helvetica,sans-serif;font-size:2.25mm;letter-spacing:.45mm}.tc-thanks{font-family:Arial,Helvetica,sans-serif;font-size:1.65mm;font-weight:800;letter-spacing:.18mm}.tc-notice{text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:1.55mm;line-height:1.18;font-weight:800}
.tc-barcode-zone{position:absolute;top:15.5mm;right:2.3mm;width:18mm;height:57mm;display:flex;align-items:center;justify-content:center;overflow:visible}.tc-pdf417{display:block;width:54mm;height:15mm;max-width:none;transform:rotate(90deg);transform-origin:center}.tc-barcode-caption{position:absolute;right:1.65mm;top:70.8mm;width:18mm;text-align:center;font-size:1.42mm;line-height:1.05;font-weight:900;letter-spacing:.08mm}
@page{size:203.20mm 82.55mm;margin:0}
@media print{html,body,.tc-pass{width:203.20mm!important;height:82.55mm!important}.tc-pass{margin:0!important;box-shadow:none!important}}
</style>
<article class="tc-pass" aria-label="SKANDI ATB-size transfer boarding pass">
  <div class="tc-strip"></div>
  <header class="tc-head">
    <div class="tc-brand">SKANDI<small>TRAVELS</small></div>
    <div class="tc-doc"><div class="tc-doc-title">TRANSFER BOARDING PASS</div><div class="tc-doc-sub">ELECTRONIC TICKET</div></div>
    <div class="tc-seq">SEQ<strong>${escapeHTML(sequence)}</strong></div>
  </header>
  <section class="tc-content">
    <div class="tc-name-row">
      <div><span class="tc-label tc-label-soft">Passenger</span><div class="tc-passenger">${escapeHTML(passenger)}</div></div>
      <div><span class="tc-label tc-label-soft">Booking Ref</span><div class="tc-pnr">${escapeHTML(bookingRef)}</div></div>
    </div>
    <div class="tc-matrix">
      <div class="tc-label">Transfer</div><div class="tc-label">Date</div><div class="tc-label">Pick-up</div><div class="tc-label">From</div><div class="tc-label">To</div><div class="tc-label">Point</div><div class="tc-label">Flow</div><div class="tc-label">SEQ#</div>
      <div><span class="tc-value">${escapeHTML(transferNo)}</span><span class="tc-subvalue">SKANDI TRANSFERS</span></div>
      <div><span class="tc-value">${escapeHTML(serviceDate)}</span></div>
      <div><span class="tc-value">${escapeHTML(pickupTime)}</span></div>
      <div><span class="tc-value">${escapeHTML(from)}</span></div>
      <div><span class="tc-value">${escapeHTML(to)}</span></div>
      <div><span class="tc-value">${escapeHTML(point)}</span></div>
      <div><span class="tc-value">${escapeHTML(direction)}</span></div>
      <div><span class="tc-value">${escapeHTML(sequence)}</span></div>
    </div>
    <div class="tc-highlight">
      <div><span class="tc-label">Bus / Gate</span><strong>${escapeHTML(point)}</strong></div>
      <div><span class="tc-label">Boarding</span><strong>${escapeHTML(boardingTime)}</strong></div>
      <div><span class="tc-label">Seat</span><strong>${escapeHTML(seat)}</strong></div>
    </div>
    <footer class="tc-footer">
      <div class="tc-ticketline"><div>Ticket No: ${escapeHTML(no)}</div><div>Luggage: ${escapeHTML(bagSummary)}</div></div>
      <div class="tc-bottom">
        <div><span class="tc-label" style="font-size:1.75mm">BOOKING REF</span><span class="tc-value">${escapeHTML(bookingRef)}</span></div>
        <div><span class="tc-label" style="font-size:1.75mm">CONNECTING FLIGHT</span><span class="tc-value">${escapeHTML(associatedFlight)}</span></div>
        <div class="tc-notice"><span class="tc-thanks">* THANK YOU &amp; GOODBYE *</span><br>SKANDI TRANSFER SERVICE DOCUMENT<br>2D MARK CONTAINS SKANDI SERVICE-TICKET DATA · NOT AN AIRLINE BCBP</div>
      </div>
    </footer>
  </section>
  <aside class="tc-barcode-zone" aria-label="SKANDI transfer service data mark">${barcode}</aside>
  <div class="tc-barcode-caption">SKANDI TRANSFER DATA</div>
</article>`;
  }
  function transferLuggageTagHtml(dep,p,tag){return `<div style="border:2px solid #111;padding:15px;width:680px;max-width:100%"><div style="display:flex;justify-content:space-between"><div><div class="brand">SKANDI TRAVELS</div><div class="muted">COACH LUGGAGE TAG</div></div><div class="ref">${escapeHTML(tag)}</div></div><div style="font-size:34px;font-weight:900;margin:15px 0">${escapeHTML(dep.destination)}</div><div class="grid"><div class="box"><div class="label">Passenger</div><div class="value">${escapeHTML(paxName(p))}</div></div><div class="box"><div class="label">Coach</div><div class="value">${escapeHTML(dep.serviceNumber)}</div></div><div class="box"><div class="label">Booking reference</div><div class="value">${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</div></div></div><div class="barcode" style="margin-top:14px"></div><div class="ref" style="text-align:center;margin-top:5px">${escapeHTML(tag)}</div></div>`}
  function transferManifestHtml(dep){const list=transferPassengers(dep);return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>DRIVER MANIFEST · ${escapeHTML(dep.direction)}</div></div><div><div class="label">Coach</div><div class="ref">${escapeHTML(dep.serviceNumber)}</div></div></div><div class="grid"><div class="box"><div class="label">Route</div><div class="value">${escapeHTML(dep.origin)} → ${escapeHTML(dep.destination)}</div></div><div class="box"><div class="label">Time</div><div class="value">${escapeHTML(`${dep.date||""} ${dep.scheduled||""}`.trim())}</div></div><div class="box"><div class="label">Vehicle</div><div class="value">${escapeHTML(dep.vehicle)}</div></div></div><table><thead><tr><th>SEQ</th><th>Customer</th><th>Booking</th><th>Hotel / Stop</th><th>Seat</th><th>Luggage</th><th>Boarded</th></tr></thead><tbody>${list.map((p,i)=>{const st=transferPaxState(dep,p);return `<tr><td>${String(i+1).padStart(3,"0")}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.bookingReference||p.pnrLocator||masterReference())}</td><td>${escapeHTML(p.hotelName||p.payload?.hotelName||(dep.direction==="INBOUND"?dep.destination:dep.origin))}</td><td>${escapeHTML(st.seat||"—")}</td><td>${st.bags} pc</td><td>[ &nbsp;&nbsp; ]</td></tr>`}).join("")}</tbody></table>`}

  function renderManifests(){
    const w=workspace();if(!w?.booking)return `${pageHead("Operations & Manifests","Passenger lists, rooming lists, transfer manifests and tour manifests.")}
      <div class="manifest-filters"><button class="secondary" data-manifest-mode="passengers">Passenger list</button><button class="secondary" data-manifest-mode="hotel">Rooming list</button><button class="secondary" data-manifest-mode="transfer">Transfer</button><button class="secondary" data-manifest-mode="tour">Tours</button></div>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>Manifest workspace</span><span class="mono">NO BOOKING</span></div><div class="panel-body">${emptyState("☷","No operational list loaded","The manifest tabs remain available. Open a booking to populate passenger, rooming, transfer and tour manifests.")}</div></section>`;
    const comps=components();return `${pageHead("Operations & Manifests",`${masterReference()} · operational lists`,'<button class="secondary" data-action="print-passenger-manifest">Print passenger manifest</button><button class="primary" data-action="send-operations-manifest">Send operations manifest</button>')}
      <div class="manifest-filters"><button class="secondary" data-manifest-mode="passengers">Passenger list</button><button class="secondary" data-manifest-mode="hotel">Rooming list</button><button class="secondary" data-manifest-mode="transfer">Transfer</button><button class="secondary" data-manifest-mode="tour">Tours</button></div>
      <section class="panel" style="margin-top:10px"><div class="panel-head"><span>${escapeHTML(humanize(state.manifestMode))} manifest</span><span class="mono">${escapeHTML(masterReference())}</span></div><div class="panel-body" style="padding:0">${manifestMarkup(state.manifestMode,comps)}</div></section>`;
  }
  function manifestMarkup(mode,comps){if(mode==="passengers")return `<table class="data-table"><thead><tr><th>#</th><th>Passenger</th><th>Type</th><th>Club</th><th>APIS</th><th>Seat</th><th>Check-in</th></tr></thead><tbody>${passengers().map((p,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.paxType||"ADT")}</td><td>${escapeHTML(clubFor(p)?.memberNumber||"—")}</td><td>${escapeHTML(p.apisStatus||"—")}</td><td>${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.checkinStatus||"—")}</td></tr>`).join("")}</tbody></table>`;const key=mode==="hotel"?["HOTEL","STAY"]:mode==="transfer"?["TRANSFER"]:["TOUR","ACTIVITY","EXCURSION"];const items=comps.filter(c=>key.some(x=>normalizedType(c.componentType||c.entityType).includes(x)));if(!items.length)return '<div class="empty">No matching components in this booking.</div>';return `<table class="data-table"><thead><tr><th>Service</th><th>Date / Time</th><th>Supplier</th><th>Ref</th><th>Passengers</th><th>Status</th></tr></thead><tbody>${items.map(c=>`<tr><td><strong>${escapeHTML(serviceLabel(c))}</strong></td><td>${escapeHTML(c.serviceDate||c.startDate||c.payload?.pickupTime||c.payload?.serviceDate||"—")}</td><td>${escapeHTML(c.supplier||"SKANDI")}</td><td class="mono">${escapeHTML(c.supplierReference||"—")}</td><td>${escapeHTML(String(c.passengerCount||c.payload?.passengerCount||passengers().length))}</td><td>${escapeHTML(c.status||"")}</td></tr>`).join("")}</tbody></table>`}


  const originalBindAction=bindAction;
  bindAction=function(element){
    if(element.dataset.enterpriseActionBound)return;
    element.dataset.enterpriseActionBound="1";
    originalBindAction(element);
    element.addEventListener("click",async()=>{
      const a=element.dataset.action;
      if(a==="edit-component")openComponentEditor(element.dataset.componentId);
      if(a==="print-component-voucher")printComponentVoucher(element.dataset.componentId);
      if(a==="send-component-voucher")sendComponentVoucher(element.dataset.componentId);
      if(a==="print-booking-confirmation")printBookingConfirmation();
      if(a==="generate-booking-document")generateBookingDocument(element.dataset.docType);
      if(a==="send-booking-document")sendBookingDocument(element.dataset.docType);
      if(a==="save-package")savePackage();
      if(a==="search-club")searchClub();
      if(a==="clear-club-search"){state.clubSelectedCustomerId="";state.clubSearchType="all";state.clubMembershipFilter="all";state.clubSearchResults=[];state.clubSearchLoaded=false;render();}
      if(a==="link-club")linkClub(element.dataset.customerProfileId||element.dataset.memberId);
      if(a==="adjust-club")adjustClub(element.dataset.customerProfileId||element.dataset.memberId);
      if(a==="check-requirements")checkRequirements();
      if(a==="select-dcs-passenger"){state.dcsSelectedPassengerId=element.dataset.passengerId||"";state.selectedPassengerId=state.dcsSelectedPassengerId;render();}
      if(a==="dcs-checkin")dcsPatch({checkinStatus:"checked_in",boardingStatus:"not_boarded"},"Passenger checked in");
      if(a==="dcs-board")dcsPatch({checkinStatus:"boarded",boardingStatus:"boarded"},"Passenger boarded");
      if(a==="dcs-offload")dcsPatch({checkinStatus:"checked_in",boardingStatus:"offloaded"},"Passenger offloaded");
      if(a==="dcs-noshow")dcsPatch({checkinStatus:"no_show",boardingStatus:"not_boarded"},"Passenger marked no-show");
      if(a==="dcs-bag")openBagModal();
      if(a==="dcs-seat")openSeatModal();
      if(a==="dcs-boarding-pass")printBoardingPass();
      if(a==="dcs-bagtag") printBagTag();
      if(a==="select-transfer-departure"){state.transferDcsSelectedDepartureId=element.dataset.departureId||"";state.transferDcsTab="acceptance";state.transferDcsSelectedPassengerId="";render();}
      if(a==="select-transfer-passenger"){state.transferDcsSelectedPassengerId=element.dataset.passengerId||"";render();}
      if(a==="refresh-transfer-dcs"){post("ALTEA_TRANSFER_DCS_BOOTSTRAP",{date:new Date().toISOString().slice(0,10),bookingId:booking()?.id||""},{busy:false});}
      if(a==="transfer-accept"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{acceptance:"ACCEPTED",boarding:"NOT_BOARDED"},"Customer accepted at transfer meeting point");}
      if(a==="transfer-voucher-verify"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{voucherVerified:true},"Transfer voucher verified");}
      if(a==="transfer-bag")openTransferBagModal();
      if(a==="transfer-seat"){state.transferDcsTab="seats";render();}
      if(a==="transfer-seat-click")assignTransferSeat(element.dataset.seat||"");
      if(a==="transfer-auto-seat")autoTransferSeat();
      if(a==="transfer-card")printTransferCard();
      // Wire the "Luggage tag" button directly to the Flight tag
      if(a==="transfer-luggage-tag") printTransferLuggageTag();
      if(a==="transfer-waitlist"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{acceptance:"WAITLIST",boarding:"NOT_BOARDED"},"Customer moved to waitlist / overflow");}
      if(a==="transfer-noshow"){const dep=selectedTransferDeparture(),p=transferSelectedPax(dep);transferSavePassenger(dep,p,{acceptance:"NO_SHOW",boarding:"NOT_BOARDED"},"Customer marked no-show");}
      if(a==="transfer-offload"){const dep=selectedTransferDeparture();const pid=element.dataset.passengerId||state.transferDcsSelectedPassengerId;const p=transferPassengers(dep).find(x=>transferPaxId(x)===pid)||transferSelectedPax(dep);state.transferDcsSelectedPassengerId=transferPaxId(p);transferSavePassenger(dep,p,{acceptance:"ACCEPTED",boarding:"OFFLOADED",boardedAt:""},"Customer offloaded from coach");}
      if(a==="transfer-start-boarding"){const dep=selectedTransferDeparture();transferSaveDeparture(dep,{boardingStarted:true,status:"BOARDING"},`Boarding started for ${dep?.serviceNumber||"transfer"}`);}
      if(a==="transfer-close"){const dep=selectedTransferDeparture(),st=transferStats(dep);const remaining=Math.max(0,st.accepted-st.boarded);if(remaining>0&&!confirm(`${remaining} accepted customer(s) remain unboarded. Close and dispatch anyway?`))return;transferSaveDeparture(dep,{closed:true,status:"CLOSED"},`Coach ${dep?.serviceNumber||""} closed and dispatched`);}
      if(a==="transfer-scan")transferScan();
      if(a==="transfer-clear-activity"){state.transferDcsActivity=[];render();}
      if(a==="print-transfer-manifest"){const dep=selectedTransferDeparture();if(dep)printHtml(`Transfer Manifest ${dep.serviceNumber}`,transferManifestHtml(dep));}
      if(a==="print-passenger-manifest")printPassengerManifest();
      if(a==="send-operations-manifest")post("ALTEA_SEND_MANIFEST",{bookingId:booking()?.id,bookingReference:masterReference(),manifestType:state.manifestMode});
      if(a==="view-generated-document")post("ALTEA_GET_DOCUMENT",{bookingId:booking()?.id||"",documentId:element.dataset.documentId});
    });
  };


  function bindEnterpriseEvents(){
    if(["packagebuilder","club","departure","manifests"].includes(state.activeView)){
      document.querySelectorAll('[data-view]',main).forEach(b=>{if(b.dataset.enterpriseBound)return;b.dataset.enterpriseBound="1";b.addEventListener("click",()=>navigate(b.dataset.view));});
        
    document.querySelectorAll('[data-dir]', main).forEach(b => {
      b.addEventListener("click", () => {
        state.transferDcsDirection = b.dataset.dir;
        state.transferDcsSelectedDepartureId = ""; // Reset selection so it picks the first one in the new direction
        render();
      });
    });
    document.querySelectorAll('[data-action]',main).forEach(b=>bindAction(b));
    document.querySelectorAll('[data-manifest-mode]',main).forEach(b=>b.addEventListener("click",()=>{state.manifestMode=b.dataset.manifestMode;render()}));
    document.querySelectorAll('[data-transfer-dcs-tab]',main).forEach(b=>b.addEventListener("click",()=>{state.transferDcsTab=b.dataset.transferDcsTab||"departures";render()}));
    const transferScanner=document.getElementById("transferScannerInput");if(transferScanner)transferScanner.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();transferScan();}});
    const acceptanceFilter=document.getElementById("transferAcceptanceFilter");if(acceptanceFilter)acceptanceFilter.addEventListener("change",()=>{const v=acceptanceFilter.value;document.querySelectorAll('tr[data-transfer-status]',main).forEach(r=>r.classList.toggle('hidden',v!=="ALL"&&r.dataset.transferStatus!==v));});
    const inv=document.getElementById("inventoryFilter");if(inv)inv.addEventListener("input",()=>{const q=inv.value.toLowerCase();const items=(state.inventory||[]).filter(i=>JSON.stringify(i).toLowerCase().includes(q));const table=document.getElementById("enterpriseInventoryTable");if(table){table.innerHTML=enterpriseInventoryMarkup(items);table.querySelectorAll('[data-action]').forEach(bindAction)}});
    document.getElementById("clubPassenger")?.addEventListener("change",e=>{state.selectedPassengerId=e.target.value;state.clubSelectedCustomerId="";render()});
    document.getElementById("clubSearchType")?.addEventListener("change",e=>{state.clubSearchType=e.target.value;render()});
    document.getElementById("clubMembershipFilter")?.addEventListener("change",e=>{state.clubMembershipFilter=e.target.value;render()});
    document.getElementById("clubSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchClub();}});
    document.querySelectorAll("[data-club-customer]",main).forEach(row=>{
      row.addEventListener("click",()=>{state.clubSelectedCustomerId=row.dataset.clubCustomer||"";render();});
      row.addEventListener("dblclick",()=>{const id=row.dataset.clubCustomer||"";if(id)linkClub(id);});
    });
    document.getElementById("reqPassenger")?.addEventListener("change",e=>{state.selectedPassengerId=e.target.value;state.travelDecision=null;render()});
    }
  }


  function savePackage(){const b=booking();if(!b?.id)return;const type=$("#packageBookingType")?.value||bookingType();const transferControl=$("#packageTransferControl")?.value||"SKANDI";post("ALTEA_UPDATE_BOOKING",{bookingId:b.id,patch:{bookingType:type,tripTitle:$("#packageTitle")?.value||"",transferControl,startDate:$("#packageStart")?.value||"",endDate:$("#packageEnd")?.value||"",packageStatus:$("#packageStatus")?.value||"DRAFT"}})}
  function searchClub(){
    const p=selectedPax()||passengers().find(x=>x.id===state.selectedPassengerId);
    state.clubSearchType=$("#clubSearchType")?.value||state.clubSearchType||"all";
    state.clubMembershipFilter=$("#clubMembershipFilter")?.value||state.clubMembershipFilter||"all";
    post("ALTEA_CLUB_SEARCH",{
      query:$("#clubSearch")?.value||"",
      searchType:state.clubSearchType,
      membershipFilter:state.clubMembershipFilter,
      passengerId:$("#clubPassenger")?.value||p?.id||"",
      bookingId:booking()?.id
    });
  }
  function linkClub(customerProfileId){
    const passengerId=$("#clubPassenger")?.value||state.selectedPassengerId;
    if(!passengerId||!customerProfileId)return;
    post("ALTEA_CLUB_LINK_MEMBER",{bookingId:booking()?.id,passengerId,customerProfileId});
  }
  function adjustClub(memberId){const delta=Number($("#clubPointsDelta")?.value);const reason=$("#clubPointsReason")?.value.trim();if(!Number.isFinite(delta)||!delta)return toast("Points amount required","Enter a non-zero whole-number adjustment.","warning");if(!reason)return toast("Reason required","Enter an audit reason for the points adjustment.","warning");post("ALTEA_CLUB_ADJUST_POINTS",{customerProfileId:memberId,passengerId:state.selectedPassengerId,bookingId:booking()?.id,bookingReference:masterReference(),delta:Math.trunc(delta),reason})}function checkRequirements(){const passengerId=$("#reqPassenger")?.value||state.selectedPassengerId;state.travelDecision=null;post("ALTEA_TRAVEL_REQUIREMENTS_CHECK",{bookingId:booking()?.id,passengerId,nationality:$("#reqNationality")?.value||"",residenceCountry:$("#reqResidence")?.value||"",dateOfBirth:$("#reqDob")?.value||"",origin:$("#reqOrigin")?.value||"",destination:$("#reqDestination")?.value||"",documentType:"PASSPORT",documentIssuingCountry:$("#reqIssue")?.value||"",documentExpiry:$("#reqExpiry")?.value||"",transitPoints:String($("#reqTransit")?.value||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean)})}


  function openComponentEditor(id){const c=components().find(x=>x.id===id);if(!c)return;openModal("Edit trip component",`<div class="field"><label>Service</label><input value="${escapeAttr(serviceLabel(c))}" readonly></div><div class="grid grid-3"><div class="field"><label>Service date</label><input id="compDate" type="date" value="${escapeAttr(c.serviceDate||c.startDate||c.payload?.serviceDate||"")}"></div><div class="field"><label>Time / pickup</label><input id="compTime" value="${escapeAttr(c.serviceTime||c.payload?.pickupTime||"")}"></div><div class="field"><label>Passengers</label><input id="compPax" type="number" min="1" value="${escapeAttr(String(c.passengerCount||c.payload?.passengerCount||passengers().length||1))}"></div></div><div class="grid grid-2"><div class="field"><label>Supplier reference</label><input id="compRef" value="${escapeAttr(c.supplierReference||"")}"></div><div class="field"><label>Total amount</label><input id="compAmount" type="number" step="0.01" value="${escapeAttr(String(c.totalAmount||0))}"></div></div><div class="field"><label>Operational notes / pickup instructions</label><textarea id="compNotes">${escapeHTML(c.operationalNotes||c.payload?.operationalNotes||"")}</textarea></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save component",className:"primary",onClick:()=>{closeModal();post("ALTEA_UPDATE_COMPONENT",{componentId:id,patch:{serviceDate:$("#compDate")?.value||"",serviceTime:$("#compTime")?.value||"",passengerCount:Number($("#compPax")?.value||1),supplierReference:$("#compRef")?.value||"",totalAmount:Number($("#compAmount")?.value||0),operationalNotes:$("#compNotes")?.value||""}})}}])}


  function dcsPatch(patch,message){const p=selectedPax();if(!p||!isSkandiDcs())return;post("ALTEA_DCS_UPDATE_PASSENGER",{bookingId:booking()?.id,passengerId:p.id,patch});toast("Departure Control",message,"success")}
  function openBagModal(){const p=selectedPax();if(!p||!isSkandiDcs())return;openModal("Record baggage",`<div class="grid grid-2"><div class="field"><label>Pieces</label><input id="bagPieces" type="number" min="0" value="${escapeAttr(String(p.baggageCount||p.payload?.baggageCount||0))}"></div><div class="field"><label>Total weight kg</label><input id="bagWeight" type="number" min="0" step="0.1" value="${escapeAttr(String(p.baggageWeight||p.payload?.baggageWeight||0))}"></div></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Save baggage",className:"primary",onClick:()=>{const pieces=Number($("#bagPieces")?.value||0),weight=Number($("#bagWeight")?.value||0);closeModal();dcsPatch({baggageCount:pieces,baggageWeight:weight},"Baggage updated")}}])}
  function openSeatModal(){const p=selectedPax();if(!p||!isSkandiDcs())return;openModal("Assign seat",`<div class="field"><label>Seat</label><input id="dcsSeat" maxlength="5" value="${escapeAttr(p.seatNumber||"")}" placeholder="12A"></div>`,[{label:"Cancel",className:"secondary",close:true},{label:"Assign",className:"primary",onClick:()=>{const seat=String($("#dcsSeat")?.value||"").toUpperCase().trim();if(!seat)return;closeModal();dcsPatch({seatNumber:seat},`Seat ${seat} assigned`)}}])}


  function generateBookingDocument(type){if(!booking()?.id)return;post("ALTEA_GENERATE_DOCUMENT",{bookingId:booking().id,documentType:type,bookingReference:masterReference()})}
  function sendBookingDocument(type){if(!booking()?.id)return;post("ALTEA_SEND_DOCUMENT",{bookingId:booking().id,documentType:type,bookingReference:masterReference(),recipient:booking().customerEmail||""})}
  function sendComponentVoucher(id){const c=components().find(x=>x.id===id);if(!c)return;post("ALTEA_SEND_DOCUMENT",{bookingId:booking()?.id,componentId:id,documentType:"VOUCHER",bookingReference:masterReference(),recipient:booking()?.customerEmail||""})}


  function printBookingConfirmation(){
    const id=booking()?.id;
    if(!id)return toast("Booking file required","Create or open a booking before previewing the customer confirmation.","warning");
    post("ALTEA_PREVIEW_BOOKING_CONFIRMATION",{bookingId:id});
  }
  function printComponentVoucher(id){const c=components().find(x=>x.id===id);if(!c)return;printHtml(`Voucher ${masterReference()}`,componentVoucherHtml(c))}
  function printPassengerManifest(){printHtml(`Passenger Manifest ${masterReference()}`,passengerManifestHtml())}
  function printBoardingPass(){const p=selectedPax();if(!p||!isSkandiDcs())return;const docNo=`BP-${masterReference()}-${p.sequenceNumber||passengers().indexOf(p)+1}`;post("ALTEA_DCS_RECORD_DOCUMENT",{bookingId:booking()?.id,passengerId:p.id,documentType:"BOARDING_PASS",documentNumber:docNo});printHtml(`Boarding Pass ${paxName(p)}`,boardingPassHtml(p,docNo))}
  async function printBagTag() {
  // Grab the passenger explicitly clicked in the Flight DCS list
  const pId = state.dcsSelectedPassengerId || state.selectedPassengerId;
  const p = passengers74().find(x => x.id === pId) || selectedPax();
  
  if (!p) return toast("No Passenger", "Select a passenger to print an airline baggage tag.", "warning");

  const b = booking74(); 
  const order = state.selectedOrder; 
  const segments = order?.slices?.[0]?.segments || []; 

  // Format the Sequence, BN, and Tag ID
  const seqRaw = p.sequenceNumber || passengers74().indexOf(p) + 1;
  const seq = String(seqRaw === 0 ? 1 : seqRaw).padStart(3, "0");
  const bn = formatBoardingNumber(seq); 
  const ref = b?.bookingReference || b?.pnrLocator || order?.bookingReference || "SKNDI";
  const tag = `SK${String(ref).replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase()}${seq}`;

  // Generate 10-digit IATA License Plate
  const licensePlate = "0117" + String(Math.floor(100000 + Math.random() * 900000));

  // Determine Cabin Class safely
  let cabin = "Y";
  if (segments.length > 0 && segments[0].passengers) {
    const pInfo = segments[0].passengers[0];
    cabin = pInfo?.cabinClassMarketingName || pInfo?.cabin_class || pInfo?.cabinClass || "Y";
  }

  // Log to ALTEA
  post("ALTEA_DCS_RECORD_DOCUMENT", { bookingId: b?.id, passengerId: p.id, documentType: "BAG_TAG", documentNumber: tag });

  // 1. Build Payload for your Node.js Backend
  const payload = {
    booking: b || {},
    passenger: { 
      ...p, 
      bnNumber: bn,
      firstName: p.firstName || p.givenName || p.first_name || "",
      lastName: p.lastName || p.familyName || p.last_name || "PASSENGER",
      title: p.title || "",
      sequenceNumber: seq,
      bagIndex: 1, // Defaulting to bag 1
      cabinClass: cabin
    }, 
    segments: segments,
    documentNumber: tag,
    licensePlate: licensePlate,
    airlineName: order?.owner?.name || b?.supplier || "SKANDI"
  };

  try {
    // 2. Fetch the ZPL string from your Node.js endpoint
    const response = await fetch('/api/generate-baggage-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Backend failed to generate ZPL code.");
    const zplText = await response.text();

    // 3. Render the returned ZPL to PNG using Labelary
    const formData = new URLSearchParams();
    formData.append("file", zplText);

    const labelaryRes = await fetch("http://api.labelary.com/v1/printers/8dpmm/labels/2.21x21/0/", {
      method: "POST",
      headers: { 
        "Accept": "image/png", 
        "Content-Type": "application/x-www-form-urlencoded" 
      },
      body: formData
    });

    if (!labelaryRes.ok) throw new Error("Failed to render ZPL to Image");
    const blob = await labelaryRes.blob();
    const imageUrl = URL.createObjectURL(blob);

    // 4. Open the print window
    const printWindow = window.open("", "_blank", "width=450,height=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Bag Tag - ${tag}</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; background:#ccc; height:100vh;">
            <img src="${imageUrl}" style="background:#fff; box-shadow:0 0 10px rgba(0,0,0,0.5); max-height:90vh;" onload="window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast("Popup Blocked", "Please allow pop-ups to print baggage tags.", "warning");
    }
  } catch (error) {
    toast("Print Error", error.message, "danger");
  }
}


  function basePrintStyles(){return `body{font-family:Arial,sans-serif;color:#111;margin:28px;font-size:12px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #022e64;padding-bottom:12px;margin-bottom:18px}.brand{font-size:24px;font-weight:800;color:#022e64}.ref{font:800 22px Consolas,monospace;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #bbb;padding:9px}.label{font-size:9px;text-transform:uppercase;color:#666}.value{font-weight:700;margin-top:3px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eef1f4}.section{font-size:15px;font-weight:800;color:#022e64;margin-top:18px}.muted{color:#666}.barcode{height:48px;background:repeating-linear-gradient(90deg,#000 0,#000 2px,#fff 2px,#fff 4px,#000 4px,#000 5px,#fff 5px,#fff 8px)}@page{margin:12mm}`}
  function componentVoucherHtml(c){return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>${escapeHTML(humanize(c.componentType||c.entityType))} voucher</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><div class="section">${escapeHTML(serviceLabel(c))}</div><div class="grid"><div class="box"><div class="label">Supplier</div><div class="value">${escapeHTML(c.supplier||"SKANDI")}</div></div><div class="box"><div class="label">Supplier reference</div><div class="value">${escapeHTML(c.supplierReference||"—")}</div></div><div class="box"><div class="label">Status</div><div class="value">${escapeHTML(c.status||"")}</div></div><div class="box"><div class="label">Date / time</div><div class="value">${escapeHTML(c.serviceDate||c.startDate||c.payload?.pickupTime||"—")}</div></div><div class="box"><div class="label">Passengers</div><div class="value">${escapeHTML(String(c.passengerCount||c.payload?.passengerCount||passengers().length))}</div></div><div class="box"><div class="label">Amount</div><div class="value">${money(c.totalAmount,c.currency||booking()?.currency)}</div></div></div><div class="section">Travelers</div><p>${passengers().map(p=>escapeHTML(paxName(p))).join(" · ")}</p><div class="section">Instructions</div><p>${escapeHTML(c.operationalNotes||c.payload?.operationalNotes||c.description||"Present this voucher together with the booking reference where requested.")}</p>`}
  function passengerManifestHtml(){return `<div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>Passenger manifest</div></div><div><div class="label">Booking reference</div><div class="ref">${escapeHTML(masterReference())}</div></div></div><table><thead><tr><th>SEQ</th><th>Passenger</th><th>Type</th><th>Seat</th><th>APIS</th><th>Check-in</th><th>Boarding</th><th>Bags</th></tr></thead><tbody>${passengers().map((p,i)=>`<tr><td>${escapeHTML(p.sequenceNumber||String(i+1).padStart(3,"0"))}</td><td>${escapeHTML(paxName(p))}</td><td>${escapeHTML(p.paxType||"ADT")}</td><td>${escapeHTML(p.seatNumber||"—")}</td><td>${escapeHTML(p.apisStatus||"—")}</td><td>${escapeHTML(p.checkinStatus||"—")}</td><td>${escapeHTML(p.boardingStatus||p.payload?.boardingStatus||"—")}</td><td>${escapeHTML(String(p.baggageCount||p.payload?.baggageCount||0))}</td></tr>`).join("")}</tbody></table>`}
  function boardingPassHtml(p,docNo){const b=booking();return `<div style="border:2px solid #111;padding:18px"><div class="head"><div><div class="brand">SKANDI TRAVELS</div><div>BOARDING PASS · SKANDI CHARTER</div></div><div class="ref">${escapeHTML(masterReference())}</div></div><div style="font-size:24px;font-weight:800;margin:18px 0">${escapeHTML(paxName(p))}</div><div class="grid"><div class="box"><div class="label">From</div><div class="value" style="font-size:22px">${escapeHTML(b?.origin||"—")}</div></div><div class="box"><div class="label">To</div><div class="value" style="font-size:22px">${escapeHTML(b?.destination||"—")}</div></div><div class="box"><div class="label">Seat</div><div class="value" style="font-size:22px">${escapeHTML(p.seatNumber||"—")}</div></div><div class="box"><div class="label">Flight</div><div class="value">${escapeHTML(b?.flightNumber||b?.payload?.flightNumber||"SKANDI")}</div></div><div class="box"><div class="label">Date</div><div class="value">${escapeHTML(b?.departureDate||b?.startDate||"—")}</div></div><div class="box"><div class="label">Sequence</div><div class="value">${escapeHTML(p.sequenceNumber||String(passengers().indexOf(p)+1).padStart(3,"0"))}</div></div></div><div class="barcode" style="margin-top:18px"></div><div class="muted" style="margin-top:5px">${escapeHTML(docNo)} · Valid only for a SKANDI-controlled charter departure recorded in ALTEA.</div></div>`}
  function bagTagHtml(p,tag){const b=booking();return `<div style="border:2px solid #111;padding:15px;width:680px;max-width:100%"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="brand">SKANDI</div><div class="muted">BAGGAGE TAG · CHARTER DCS</div></div><div class="ref">${escapeHTML(tag)}</div></div><div style="font-size:46px;font-weight:900;letter-spacing:.08em;margin:14px 0">${escapeHTML(b?.destination||"—")}</div><div class="grid"><div class="box"><div class="label">Passenger</div><div class="value">${escapeHTML(paxName(p))}</div></div><div class="box"><div class="label">From</div><div class="value">${escapeHTML(b?.origin||"—")}</div></div><div class="box"><div class="label">Flight / Date</div><div class="value">${escapeHTML(b?.flightNumber||b?.payload?.flightNumber||"SKANDI")} · ${escapeHTML(b?.departureDate||"—")}</div></div></div><div class="barcode" style="margin-top:14px"></div><div class="ref" style="text-align:center;margin-top:5px">${escapeHTML(tag)}</div></div>`}
  function printHtml(title,body){const frame=document.createElement("iframe");frame.style.position="fixed";frame.style.right="0";frame.style.bottom="0";frame.style.width="1px";frame.style.height="1px";frame.style.border="0";frame.style.opacity="0";document.body.appendChild(frame);const doc=frame.contentDocument;doc.open();doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>${basePrintStyles()}</style></head><body>${body}</body></html>`);doc.close();setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}finally{setTimeout(()=>frame.remove(),1200)}},120)}


  // Generated Asset Library upload/finalize is owned by the Wix page bridge in R-006.3.




  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;const m=event.data||{};if(m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="ALTEA_UNIFIED_BOOTSTRAP_RESULT"){state.travelRequirementsProvider=p.travelRequirementsProvider||p.timaticProvider||state.travelRequirementsProvider||null;if(Array.isArray(p.transferDepartures))state.transferDcsDepartures=p.transferDepartures;state.transferDcsPersistence=Boolean(p.transferDcsPersistence||p.capabilities?.transferDcsPersistence||p.capabilities?.transferDcs);}
    if(m.type==="ALTEA_TRANSFER_DCS_BOOTSTRAP_RESULT"){state.transferDcsDepartures=Array.isArray(p.departures)?p.departures:[];state.transferDcsPersistence=Boolean(p.persistenceAvailable??true);if(state.activeView==="departure"||state.activeView==="baggage")render();}
    if(m.type==="ALTEA_TRANSFER_DCS_PASSENGER_UPDATED"||m.type==="ALTEA_TRANSFER_DCS_DEPARTURE_UPDATED"){if(p.workspace)state.alteaWorkspace=p.workspace;if(Array.isArray(p.departures))state.transferDcsDepartures=p.departures;if(state.activeView==="departure"||state.activeView==="baggage")render();}
    if(m.type==="ALTEA_BOOKING_RESULT"||m.type==="ALTEA_LOCAL_BOOKING_CREATED"||m.type==="ALTEA_BOOKING_UPDATED"||m.type==="ALTEA_DCS_PASSENGER_UPDATED"){if(p.workspace){state.alteaWorkspace=p.workspace;if(p.workspace.booking)upsertAlteaBooking(p.workspace.booking)}if(["booking","packagebuilder","departure","manifests"].includes(state.activeView))render();}
    if(m.type==="ALTEA_CLUB_SEARCH_RESULT"){state.clubSearchResults=p.members||p.items||[];state.clubSearchLoaded=true;if(!state.clubSelectedCustomerId&&state.clubSearchResults[0])state.clubSelectedCustomerId=state.clubSearchResults[0].customerProfileId||state.clubSearchResults[0].id||"";if(state.activeView==="club")render();}
    if(m.type==="ALTEA_CLUB_MEMBER_LINKED"||m.type==="ALTEA_CLUB_MEMBER_UPDATED"){const passengerId=p.passengerId||state.selectedPassengerId;if(passengerId&&(p.customerProfile||p.member))state.clubProfiles[passengerId]=p.customerProfile||p.member;if(p.workspace)state.alteaWorkspace=p.workspace;state.clubSelectedCustomerId=(p.customerProfile||p.member)?.customerProfileId||(p.customerProfile||p.member)?.id||state.clubSelectedCustomerId;if(state.activeView==="club"||state.activeView==="passengers")render();toast("Customer connection updated",p.message||"Passenger customer profile updated.","success")}
    if(m.type==="ALTEA_DOCUMENT_RESULT"){const d=p.document||null;if(d?.htmlSnapshot){const w=window.open("","_blank","noopener,noreferrer");if(w){w.document.open();w.document.write(d.htmlSnapshot);w.document.close()}else toast("Document blocked","Allow pop-ups to view or print this generated document.","warning")}else toast("Document unavailable","No generated HTML is stored for this document.","warning");}
    if(m.type==="ALTEA_TRAVEL_REQUIREMENTS_RESULT"){state.travelDecision=p.decision||p.result||p;state.travelRequirementsProvider=p.provider||state.travelRequirementsProvider;if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="requirements")render();}
    if(m.type==="ALTEA_DOCUMENT_GENERATED"){if(p.document)state.generatedDocuments.unshift(p.document);if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="ticketing")render();toast("Document generated",p.document?.documentType||"SKANDI document created.","success")}
    if(m.type==="ALTEA_DOCUMENT_SENT"){toast("Delivery",p.message||"The document workflow was recorded in booking history.","success")}
    if(m.type==="ALTEA_MANIFEST_SENT"){toast("Manifest generated",p.message||"The manifest was generated and recorded.","success")}
    if(m.type==="ALTEA_DCS_DOCUMENT_RECORDED"){if(p.workspace)state.alteaWorkspace=p.workspace}
    if(m.type==="ALTEA_GENERATED_ASSET_FINALIZED"){if(p.workspace)state.alteaWorkspace=p.workspace;if(state.activeView==="ticketing"||state.activeView==="manifests")render();toast("Asset Library","Generated file stored in the private SKANDI Asset Library.","success")}
  });


  post("ALTEA_ENTERPRISE_MODULE_READY",{version:ENTERPRISE_VERSION,capabilities:["master_booking","skandi_club","package_charter","documents_vouchers","travel_requirements_adapter","transfer_departure_control","manifests"]},{busy:false});
})();
