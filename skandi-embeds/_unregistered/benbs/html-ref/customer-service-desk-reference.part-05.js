
(()=>{
  "use strict";
  const B0074="BACKEND-BASE-1.0-B007.5";


  state.seatWorkbench=state.seatWorkbench||{category:"seats",activePassengerId:"",selectedPassengerIds:[],activeSegmentId:"",filters:{},requestCradle:false,deck:""};
  state.hotelChildAges=state.hotelChildAges||[];
  state.hotelAmenities=state.hotelAmenities||{};
  state.hotelSearchDraft=state.hotelSearchDraft||{destination:"",checkInDate:"",checkOutDate:"",rooms:1,adults:2,chainCode:"",radiusKm:25};
  state.customerProfileDetail=state.customerProfileDetail||null;
  state.packageTransferEntityId=state.packageTransferEntityId||"";
  state._pendingTransferDetails=null;


  const ws=()=>state.alteaWorkspace||null;
  const booking74=()=>ws()?.booking||null;
  const passengers74=()=>ws()?.passengers||[];
  const components74=()=>((ws()?.components||[]).filter(c=>String(c.status||"").toUpperCase()!=="REMOVED"));
  const norm=v=>String(v||"").toUpperCase().replace(/[\s-]+/g,"_");
  const paxName74=p=>p?.displayName||[p?.firstName,p?.lastName].filter(Boolean).join(" ")||p?.passengerRef||"Passenger";
  const componentLabel74=c=>c?.title||c?.name||c?.productName||humanize(c?.componentType||c?.entityType||"Service");
  const masterRef74=()=>booking74()?.bookingReference||booking74()?.pnrLocator||booking74()?.id||state.selectedOrder?.bookingReference||"—";
  const componentTotal74=()=>components74().reduce((n,c)=>n+(Number(c.totalAmount)||0),0);
  const packageTotal74=()=>Number(booking74()?.totalAmount||0)+componentTotal74();
  const transferComponents74=()=>components74().filter(c=>norm(c.componentType||c.entityType).includes("TRANSFER"));
  const selectedBookingPax74=()=>passengers74().find(p=>p.id===state.selectedPassengerId)||passengers74()[0]||null;
  const selectedClubCustomer74=()=>{
    const id=String(state.clubSelectedCustomerId||"");
    return (state.clubSearchResults||[]).find(x=>String(x.customerProfileId||x.id)===id)||null;
  };


  /* --------------------------- Seats & Services --------------------------- */
  function seatPassengerLabel(p,index){
    const draft=state.travelerDrafts?.[p.id];
    const name=draft?[draft.name?.firstName,draft.name?.lastName].filter(Boolean).join(" "):"";
    const type=draft?.paxType||String(p.type||"").toUpperCase()||"ADT";
    return `P${index+1}: ${name||`Traveler ${index+1}`} (${type})`;
  }
  function allSeatSegments(){
    // Display every flight leg even if the airline does not return a seat map.
    return (state.selectedOffer?.slices||[]).flatMap(s=>s.segments||[]);
  }
  function activeSeatSegment(){
    const segs=allSeatSegments();
    if(!state.seatWorkbench.activeSegmentId&&segs[0])state.seatWorkbench.activeSegmentId=segs[0].id;
    return segs.find(s=>s.id===state.seatWorkbench.activeSegmentId)||segs[0]||null;
  }
  function activeSeatPassenger(){
    const pax=state.selectedOffer?.passengers||[];
    if(!state.seatWorkbench.activePassengerId&&pax[0])state.seatWorkbench.activePassengerId=pax[0].id;
    return pax.find(p=>p.id===state.seatWorkbench.activePassengerId)||pax[0]||null;
  }
  function selectedSeatPassengers(){
    const all=state.selectedOffer?.passengers||[];
    const ids=new Set(state.seatWorkbench.selectedPassengerIds||[]);
    if(!ids.size&&activeSeatPassenger())ids.add(activeSeatPassenger().id);
    return all.filter(p=>ids.has(p.id));
  }
  function activeSeatMap(){
    const seg=activeSeatSegment();
    const maps=state.seatMaps||[];
    // A seat-map service is bound to its Duffel flight segment. Never show or
    // assign another flight's seats when the selected segment has no map.
    return seg?.id ? maps.find(m=>m.segmentId===seg.id)||null : maps[0]||null;
  }
  function cabinDecks(map){return [...new Set((map?.cabins||[]).map(c=>String(c.deck??"")).filter(Boolean))]}
  function visibleCabins(map){
    const decks=cabinDecks(map);
    if(decks.length&&!state.seatWorkbench.deck)state.seatWorkbench.deck=decks[0];
    return (map?.cabins||[]).filter(c=>!decks.length||String(c.deck??"")===String(state.seatWorkbench.deck));
  }
  function disclosureText(el){return [...(el.disclosures||[]),...(el.features||[]),el.name||""].join(" ").toLowerCase()}
  function seatFeature(el,key){
    const t=disclosureText(el);
    if(key==="chargeable")return (el.availableServices||[]).some(s=>Number(s.totalAmount||0)>0);
    if(key==="bassinet")return t.includes("bassinet");
    if(key==="overwing")return t.includes("overwing")||t.includes("wing");
    if(key==="child")return t.includes("not suitable for child")||t.includes("child_restricted")||t.includes("children");
    if(key==="restricted")return t.includes("restricted")||t.includes("special needs");
    if(key==="infant")return t.includes("infant");
    if(key==="exit")return t.includes("exit");
    return false;
  }
  function highlighted(el){return Object.entries(state.seatWorkbench.filters||{}).some(([k,v])=>v&&seatFeature(el,k))}
  function serviceForPassenger(el,passengerId){
    if(!passengerId)return null;
    const list=Array.isArray(el.availableServices)?el.availableServices:[];
    return list.find(s=>{
      const ids=Array.isArray(s.passengerIds)&&s.passengerIds.length?s.passengerIds:(s.passengerId?[s.passengerId]:[]);
      return !ids.length||ids.includes(passengerId);
    })||null;
  }
  function assignment(passengerId,segmentId){
    for(const [id,s] of state.selectedServices||[]){
      if(s?.type==="seat"&&s.passengerId===passengerId&&(s.segmentId===segmentId||!segmentId))return{id,...s};
    }
    return null;
  }
  function badgeForSeat(designator,segmentId){
    const pax=state.selectedOffer?.passengers||[];
    for(let i=0;i<pax.length;i++){
      const a=assignment(pax[i].id,segmentId);
      if(a?.designator===designator||String(a?.label||"").includes(designator))return `P${i+1}`;
    }
    return "";
  }
  function selectSeat(el,passengerId,map,confirmedExit=false){
    if(paymentIsCommitted()||paymentSessionStarted()){
      toast("Payment session active","Reconcile payment and booking before changing seat services.","warning");
      return false;
    }
    const service=serviceForPassenger(el,passengerId);
    if(!service){
      toast("Seat unavailable",`${el.designator||"This seat"} is not available for the selected passenger.`,"warning");
      return false;
    }
    if(service.segmentId&&map.segmentId&&service.segmentId!==map.segmentId){
      toast("Seat segment mismatch","The supplier seat service belongs to another flight segment.","warning");
      return false;
    }
    if(seatFeature(el,"exit")&&!confirmedExit&&!window.confirm("Exit-row assignment: verify the airline's actual passenger eligibility rules and seat disclosures before proceeding. This confirmation does not override supplier restrictions."))return false;
    if([...state.selectedServices.values()].some(s=>s?.type==="seat"&&s.passengerId!==passengerId&&s.designator===el.designator&&(s.segmentId===map.segmentId||!map.segmentId))) {
      toast("Seat already assigned",`${el.designator||"Seat"} is selected for another passenger.`,"warning");
      return false;
    }
    for(const [id,s] of [...state.selectedServices]){
      if(s?.type==="seat"&&s.passengerId===passengerId&&(s.segmentId===map.segmentId||service.segmentId===s.segmentId))state.selectedServices.delete(id);
    }
    state.selectedServices.set(service.id,{...service,type:"seat",designator:el.designator,passengerId,segmentId:map.segmentId||service.segmentId,quantity:1});
    invalidatePayment();
    return true;
  }
  function toggleSeat74(el,map){
    if(paymentIsCommitted()||paymentSessionStarted())return toast("Payment session active","Reconcile payment and booking before changing seats.","warning");
    const pax=activeSeatPassenger();if(!pax)return;
    const current=assignment(pax.id,map.segmentId);
    if(current?.designator===el.designator){state.selectedServices.delete(current.id);invalidatePayment();render();return}
    selectSeat(el,pax.id,map);render();
  }
  function quickAssign(value){
    if(paymentIsCommitted()||paymentSessionStarted())return toast("Payment session active","Reconcile payment and booking before changing seats.","warning");
    const map=activeSeatMap();if(!map)return;
    const designators=String(value||"").toUpperCase().split(/[\s,;]+/).filter(Boolean);
    const pax=selectedSeatPassengers();if(!designators.length||!pax.length)return;
    if(designators.length!==pax.length)return toast("Seat count mismatch",`Enter exactly ${pax.length} seat number${pax.length===1?"":"s"} for the selected passengers.`,"warning");
    if(new Set(designators).size!==designators.length)return toast("Duplicate seat","Each passenger must have a different seat.","warning");
    const proposed=[];
    for(let i=0;i<pax.length;i++){
      const el=(map.seats||[]).find(s=>String(s.designator).toUpperCase()===designators[i]);
      if(!el)return toast("Seat not found",`${designators[i]} is not present on this segment.`,"warning");
      if(!serviceForPassenger(el,pax[i].id))return toast("Seat unavailable",`${designators[i]} is not selectable for passenger ${i+1}.`,"warning");
      proposed.push({el,passengerId:pax[i].id});
    }
    const bulkPassengerIds=new Set(pax.map(p=>p.id));
    if(proposed.some(({el})=>[...state.selectedServices.values()].some(s=>s?.type==="seat"&&!bulkPassengerIds.has(s.passengerId)&&s.designator===el.designator&&(s.segmentId===map.segmentId||!map.segmentId))))return toast("Seat already assigned","One or more selected seats belong to another passenger outside this bulk assignment.","warning");
    if(proposed.some(x=>seatFeature(x.el,"exit"))&&!window.confirm("Exit-row assignment: verify each passenger's eligibility against the carrier's actual seat restrictions and disclosures. Continue with the entire assignment?"))return;
    // Check every service and collision before mutating any assignment. A
    // rejected later passenger must not leave an earlier passenger changed.
    const current=new Map(state.selectedServices);
    const requestedIds=new Set(pax.map(p=>p.id));
    const staged=new Map(current);
    for(const [id,s] of current){
      if(s?.type==="seat"&&requestedIds.has(s.passengerId)&&s.segmentId===map.segmentId)staged.delete(id);
    }
    for(const {el,passengerId} of proposed){
      const service=serviceForPassenger(el,passengerId);
      if(!service?.id||service.segmentId&&map.segmentId&&service.segmentId!==map.segmentId){
        return toast("Seat unavailable",`${el.designator||"Seat"} is not a valid supplier service for this flight. No assignments were changed.`,"warning");
      }
      const segmentId=map.segmentId||service.segmentId;
      if([...staged.values()].some(s=>s?.type==="seat"&&s.designator===el.designator&&s.segmentId===segmentId&&s.passengerId!==passengerId)){
        return toast("Seat already assigned",`${el.designator||"Seat"} already belongs to another passenger. No assignments were changed.`,"warning");
      }
      if(staged.has(service.id)&&staged.get(service.id)?.passengerId!==passengerId){
        return toast("Seat service conflict","The supplier returned a service already used for another traveler. No assignments were changed.","warning");
      }
      staged.set(service.id,{...service,type:"seat",designator:el.designator,passengerId,segmentId,quantity:1});
    }
    state.selectedServices=staged;
    invalidatePayment();
    render();
  }
  function seatElement(el,map){
    const type=String(el.type||"empty").toLowerCase();
    if(type==="empty")return '<span class="seat-cell empty"></span>';
    if(type!=="seat"){
      const label=type==="lavatory"?"WC":type==="galley"?"GAL":type==="bassinet"?"BAS":type==="exit_row"?"EXIT":type.slice(0,4).toUpperCase();
      return `<span class="seat-cell facility" title="${escapeAttr([humanize(type),el.name,...(Array.isArray(el.features)?el.features:[]),...(Array.isArray(el.disclosures)?el.disclosures.map(x=>typeof x==="string"?x:x?.title||x?.description||""):[])].filter(Boolean).join(" · "))}">${escapeHTML(label)}</span>`;
    }
    const activePassengerId=activeSeatPassenger()?.id;
    const service=serviceForPassenger(el,activePassengerId);
    const current=activePassengerId?assignment(activePassengerId,map.segmentId):null;
    const badge=badgeForSeat(el.designator,map.segmentId),selected=Boolean(badge),hi=highlighted(el);
    const alreadyMine=Boolean(current?.designator===el.designator);
    const blocked=!service&&!alreadyMine;
    const chargeable=(el.availableServices||[]).some(s=>Number(s.totalAmount||0)>0);
    const price=service&&Number(service.totalAmount||0)>0?money(service.totalAmount,service.totalCurrency):"";
    return `<button type="button" class="seat-cell ${blocked?"blocked":""} ${chargeable?"chargeable":""} ${selected?"selected":""} ${hi?"highlight":""}" data-b0074-seat="${escapeAttr(el.designator||"")}" ${blocked?"disabled":""} title="${escapeAttr([el.designator,el.name,...(Array.isArray(el.features)?el.features:[]),...(Array.isArray(el.disclosures)?el.disclosures.map(x=>typeof x==="string"?x:x?.title||x?.description||""):[]),el.coordinates?JSON.stringify(el.coordinates):"",el.metadata?JSON.stringify(el.metadata):""].filter(Boolean).join(" · "))}"><span>${escapeHTML(el.designator||"—")}</span>${badge?`<span class="seat-pax-badge">${badge}</span>`:""}${price?`<span class="seat-price">${escapeHTML(price.replace(/^[A-Z]{3}\s*/,""))}</span>`:""}</button>`;
  }
  function normalizedCabins(map){
    if(Array.isArray(map?.cabins)&&map.cabins.length)return visibleCabins(map);
    const rows=new Map();
    for(const seat of map?.seats||[]){const n=String(seat.designator||"").match(/^\d+/)?.[0]||"";if(!rows.has(n))rows.set(n,[]);rows.get(n).push({...seat,type:"seat"})}
    return [{cabinName:(map?.seats||[])[0]?.cabinName||"Cabin",rows:[...rows.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([rowNumber,elements])=>({rowNumber,sections:[{elements:elements.sort((a,b)=>String(a.designator).localeCompare(String(b.designator)))}]}))}];
  }
  function cabinGrid(map){
    return normalizedCabins(map).map(c=>`<div class="cabin-block"><div class="cabin-title">${escapeHTML(c.cabinName||c.cabinClass||"Cabin")}${c.deck!==null&&c.deck!==undefined?` · Deck ${escapeHTML(String(c.deck))}`:""}${c.aisles!=null?` · Aisles ${escapeHTML(c.aisles)}`:""}${c.wings?` · Wings ${escapeHTML(c.wings.firstRowIndex??"—")}–${escapeHTML(c.wings.lastRowIndex??"—")}`:""}</div>${(c.rows||[]).map(r=>`<div class="seat-row"><span class="row-number">${escapeHTML(r.rowNumber||"")}</span><div class="seat-row-inner">${(r.sections||[]).map(sec=>`<span class="seat-section">${(sec.elements||[]).map(el=>seatElement(el,map)).join("")}</span>`).join("")}</div><span class="row-number">${escapeHTML(r.rowNumber||"")}</span></div>`).join("")}</div>`).join("");
  }
  function legend(){
    return `<div class="seat-legend"><h4>Explanation</h4><div class="legend-row"><span class="legend-swatch selected">1</span>Selected seat / passenger badge</div><div class="legend-row"><span class="legend-swatch"></span>Available</div><div class="legend-row"><span class="legend-swatch blocked">X</span>Occupied / airline blocked</div><div class="legend-row"><span class="legend-swatch chargeable"></span>Chargeable seat</div><div class="legend-row"><span class="legend-swatch">EXIT</span>Exit / facility row</div><div class="legend-row"><span class="legend-swatch">B</span>Bassinet</div><div class="legend-row"><span class="legend-swatch">GAL</span>Galley</div><div class="legend-row"><span class="legend-swatch">WC</span>Lavatory</div><h4 style="margin-top:12px">Features</h4><div class="seat-feature-filter">${[["bassinet","Seat with bassinet facility"],["chargeable","Chargeable seat"],["overwing","Overwing seat(s)"],["child","Seat not suitable for child"],["restricted","Restricted seat - General"],["infant","Seat suitable for adult with an infant"]].map(([k,l])=>`<label><input type="checkbox" data-seat-filter="${k}" ${state.seatWorkbench.filters?.[k]?"checked":""}> ${l}</label>`).join("")}</div></div>`;
  }
  function supplierSeatMapFacts(map){
    const cabins=normalizedCabins(map);
    const all=cabins.flatMap((c,cabinIndex)=>(c.rows||[]).flatMap((r,rowIndex)=>(r.sections||[]).flatMap((sec,sectionIndex)=>(sec.elements||[]).map(el=>({c:c.cabinName||c.cabinClass||`Cabin ${cabinIndex+1}`,row:r.rowNumber||rowIndex+1,section:sectionIndex+1,sectionType:sec.type||"",el})))));
    const notable=all.filter(({el})=>el?.name||(el?.features||[]).length||(el?.disclosures||[]).length||el?.coordinates||el?.metadata||el?.type&&!["seat","empty"].includes(el.type));
    const printable=x=>x===null||x===undefined?"":typeof x==="string"?x:JSON.stringify(x);
    if(!notable.length)return "";
    return `<details class="supplier-seat-details"><summary>Inspect Duffel's physical seat and cabin metadata (${notable.length} elements)</summary>
      <div class="supplier-seat-metadata-table"><table class="data-table"><thead><tr><th>Cabin · row · section</th><th>Type / Name</th><th>Features</th><th>Disclosures</th><th>Coordinates</th><th>Metadata</th></tr></thead><tbody>
      ${notable.map(({c,row,section,sectionType,el})=>`<tr><td>${escapeHTML(c)} · ${escapeHTML(row)} · ${escapeHTML(section)}${sectionType?` (${escapeHTML(sectionType)})`:""}</td><td>${escapeHTML([el.designator||"",el.type||"",el.name||""].filter(Boolean).join(" · "))}</td><td>${escapeHTML((el.features||[]).map(printable).join(", ")||"—")}</td><td>${escapeHTML((el.disclosures||[]).map(printable).join("; ")||"—")}</td><td class="mono">${escapeHTML(printable(el.coordinates)||"—")}</td><td class="mono">${escapeHTML(printable(el.metadata)||"—")}</td></tr>`).join("")}</tbody></table></div></details>`;
  }

  function seatServiceView(){
    const category=state.seatWorkbench.category||"seats",pax=state.selectedOffer?.passengers||[];
    if(category==="seat_preference")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>Preference</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td><select data-seat-pref-passenger="${escapeAttr(p.id)}"><option value="">No preference</option><option value="WINDOW">Window</option><option value="AISLE">Aisle</option><option value="MIDDLE">Middle</option></select></td></tr>`).join("")}</tbody></table><div class="alert info" style="margin:8px">Seat preference is not a confirmed seat. A seat is confirmed only when a seat service is selected.</div></div>`;
    if(category==="baggage")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>Live baggage services</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td>${serviceListMarkup((state.selectedOffer?.availableServices||[]).filter(s=>s.type==="baggage"&&(!s.passengerId||s.passengerId===p.id)))}</td></tr>`).join("")}</tbody></table></div>`;
    if(category==="meals")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>Meal request</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td><select data-meal-passenger="${escapeAttr(p.id)}"><option value="">No request</option>${["VGML","KSML","MOML","CHML","BBML"].map(v=>`<option>${v}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table><div class="alert warning" style="margin:8px">Meal codes are agent requests unless the airline returns a bookable supplier service. No airline acceptance is implied.</div></div>`;
    if(category==="pets")return `<div class="panel-body"><div class="form-grid"><div class="field"><label>Passenger</label><select id="petPassenger">${pax.map((p,i)=>`<option value="${escapeAttr(p.id)}">${escapeHTML(seatPassengerLabel(p,i))}</option>`).join("")}</select></div><div class="field"><label>Service</label><select id="petCode"><option value="PETC">PETC · Pet in cabin</option><option value="AVIH">AVIH · Animal in hold</option></select></div><div class="field"><label>Animal / weight</label><input id="petDetails" placeholder="Dog · 7kg incl. carrier"></div><div class="field"><label>Status</label><input value="Request only · carrier confirmation required" readonly></div></div><button class="secondary" data-b0074-action="record-pet-request">Record agent request</button></div>`;
    if(category==="assistance")return `<div class="panel-body"><table class="data-table"><thead><tr><th>Passenger</th><th>SSR assistance</th></tr></thead><tbody>${pax.map((p,i)=>`<tr><td>${escapeHTML(seatPassengerLabel(p,i))}</td><td>${["WCHR","WCHS","WCHC","BLND","DEAF"].map(v=>`<label style="margin-right:9px"><input type="checkbox" data-assist-passenger="${escapeAttr(p.id)}" value="${v}"> ${v}</label>`).join("")}</td></tr>`).join("")}</tbody></table><div class="alert info" style="margin:8px">Assistance requests require carrier confirmation.</div></div>`;
    if(category==="other")return `<div class="panel-body"><div class="grid grid-2"><div class="field"><label>SSR / OSI type</label><select id="manualRemarkType"><option value="SSR">SSR</option><option value="OSI">OSI</option></select></div><div class="field"><label>Passenger</label><select id="manualRemarkPax"><option value="">Whole PNR</option>${pax.map((p,i)=>`<option value="${escapeAttr(p.id)}">${escapeHTML(seatPassengerLabel(p,i))}</option>`).join("")}</select></div></div><div class="field"><label>Remark</label><textarea id="manualRemarkText" placeholder="Agent operational remark"></textarea></div><button class="secondary" data-b0074-action="record-remark">Record in PNR history</button></div>`;
    if(category==="passenger")return `<div class="panel-body">${pax.map((p,i)=>passengerForm(p,i)).join("")}</div>`;
    if(category!=="seats")return `<div class="panel-body">${emptyState("▦",humanize(category),"No supplier catalogue items were returned for this category on the current offer.")}</div>`;
    const map=activeSeatMap();
    if(!map)return `<div class="panel-body">${emptyState("▦","Seat map unavailable for this flight","The selected flight segment has no matching supplier seat map. Select another segment or refresh the current offer; no other flight's seats are substituted.")}</div>`;
    const decks=cabinDecks(map);
    const total=[...state.selectedServices.values()].filter(s=>s.type==="seat").reduce((n,s)=>n+Number(s.totalAmount||0)*Number(s.quantity||1),0);
    return `<div class="svc-toolbar"><div class="field"><label>Quick Assign / Seat number(s)</label><input id="seatQuickAssign" placeholder="22A, 22B"></div>${decks.length>1?`<div class="field"><label>Deck</label><select id="seatDeckSelect">${decks.map(d=>`<option value="${escapeAttr(d)}" ${String(state.seatWorkbench.deck)===d?"selected":""}>${Number(d)===0?"Lower":Number(d)===1?"Upper":`Deck ${escapeHTML(d)}`}</option>`).join("")}</select></div>`:""}<label class="check"><input id="seatRequestCradle" type="checkbox" ${state.seatWorkbench.requestCradle?"checked":""}> Request cradle / bassinet</label><button class="secondary" data-b0074-action="print-seat-catalog">Print and Save</button></div><div class="svc-body">${legend()}<div class="aircraft-canvas">${cabinGrid(map)}${supplierSeatMapFacts(map)}</div></div><div class="svc-footer"><span>Selected seat total <strong>${money(total,state.selectedOffer?.totalCurrency)}</strong></span><button class="primary" data-b0074-action="review-seat-catalog">Review & Submit</button></div>`;
  }


  seatMapMarkup=function seatMapMarkupB0074(){
    if(!state.seatMaps?.length)return `<div class="muted">Seat maps load after a refreshed offer is selected.</div>`;
    const pax=state.selectedOffer?.passengers||[],segs=allSeatSegments(),selected=new Set(state.seatWorkbench.selectedPassengerIds||[]);
    return `<div class="svc-catalog"><nav class="svc-nav"><h4>Seats and Services</h4><button class="${["seats","seat_preference"].includes(state.seatWorkbench.category)?"active":""}" data-seat-category="seats">Seats</button><button class="sub ${state.seatWorkbench.category==="seats"?"active":""}" data-seat-category="seats">Seat Map</button><button class="sub ${state.seatWorkbench.category==="seat_preference"?"active":""}" data-seat-category="seat_preference">Seat Preference</button>${[["baggage","Baggage"],["meals","Meals"],["pets","Pets"],["assistance","Passenger Assistance"],["other","Other"],["passenger","Passenger Information"]].map(([id,label])=>`<button class="${state.seatWorkbench.category===id?"active":""}" data-seat-category="${id}">${label}</button>`).join("")}<button class="disabled" disabled>Travel Services (0)</button><button class="disabled" disabled>Lounge (0)</button><button class="disabled" disabled>In-flight Entertainment (0)</button><button class="disabled" disabled>Ground Transportation (0)</button><button class="disabled" disabled>Carbon Offset (0)</button><button class="disabled" disabled>Store (0)</button><button class="disabled" disabled>Mileage Accrual (0)</button><button class="disabled" disabled>Standby (0)</button><button class="disabled" disabled>Packs (0)</button><button class="disabled" disabled>Upgrades (0)</button></nav><div class="svc-main"><div class="svc-top"><div class="svc-box"><div class="svc-box-title">Passengers</div>${pax.map((p,i)=>`<label class="svc-box-row ${state.seatWorkbench.activePassengerId===p.id?"active":""}"><input type="checkbox" data-seat-pax-check="${escapeAttr(p.id)}" ${selected.has(p.id)||(!selected.size&&i===0)?"checked":""}> <input type="radio" name="seatActivePax" data-seat-pax-radio="${escapeAttr(p.id)}" ${state.seatWorkbench.activePassengerId===p.id||(!state.seatWorkbench.activePassengerId&&i===0)?"checked":""}> ${escapeHTML(seatPassengerLabel(p,i))}</label>`).join("")}</div><div class="svc-box"><div class="svc-box-title">Flight segments</div>${segs.map((g,i)=>`<label class="svc-box-row ${activeSeatSegment()?.id===g.id?"active":""}"><input type="radio" name="seatSegment" data-seat-segment="${escapeAttr(g.id)}" ${activeSeatSegment()?.id===g.id?"checked":""}> S${i+1}: ${escapeHTML((g.marketingCarrier?.iataCode||"")+(g.marketingFlightNumber||""))} · ${escapeHTML(g.origin?.iataCode||"")}-${escapeHTML(g.destination?.iataCode||"")} · ${escapeHTML(timeOnly(g.departingAt))}-${escapeHTML(timeOnly(g.arrivingAt))}</label>`).join("")}</div></div>${seatServiceView()}</div></div>`;
  };


  /* --------------------------- Hotel workbench --------------------------- */
  function filteredStayResults(){
    const chain=String(state.hotelSearchDraft.chainCode||"").trim().toLowerCase();
    const filters=Object.entries(state.hotelAmenities||{}).filter(([,v])=>v).map(([k])=>k);
    return (state.stayResults||[]).filter(r=>{
      const a=r.accommodation||{};
      if(chain&&!JSON.stringify([a.chain,a.brand]).toLowerCase().includes(chain))return false;
      if(filters.length){const hay=JSON.stringify(a.amenities||[]).toLowerCase();if(filters.some(f=>!hay.includes(f)))return false}
      return true;
    });
  }
  function childAgeFields(){return state.hotelChildAges.map((age,i)=>`<div class="field"><label>Child ${i+1} age at check-out</label><select data-hotel-child-age="${i}">${Array.from({length:16},(_,n)=>`<option value="${n+2}" ${Number(age)===n+2?"selected":""}>${n+2}</option>`).join("")}</select></div>`).join("")}
  function hotelCancellation(rate){
    const t=rate.cancellationTimeline||[];
    if(!t.length)return "Supplier cancellation terms shown after final quote";
    return t.map(x=>`${x.refundable===false?"Non-refundable":"Refundable"}${x.before?` before ${x.before}`:""}${x.refund_amount?` · refund ${money(x.refund_amount,x.currency||rate.totalCurrency)}`:""}${x.penalty_amount?` · penalty ${money(x.penalty_amount,x.penalty_currency||rate.totalCurrency)}`:""}`).join("; ");
  }
  const liveBadge=()=>'<span class="hotel-status live">LIVE SUPPLIER</span>';
  function packageBasket(){
    const b=booking74()||{},hotel=state.stayQuote;
    return `<aside class="panel basket"><div class="panel-head">Trip Basket</div><div class="panel-body"><div class="money-line"><span>Booking Ref</span><strong>${escapeHTML(masterRef74())}</strong></div><div class="money-line"><span>Status</span><strong>${escapeHTML(humanize(b.packageStatus||b.status||"BUILDING"))}</strong></div><div class="basket-block"><strong>✈ Outbound Flight</strong><div class="muted">${escapeHTML((state.selectedOffer?.slices?.[0]?.segments?.[0]?.marketingCarrier?.iataCode||"")+(state.selectedOffer?.slices?.[0]?.segments?.[0]?.marketingFlightNumber||"")||"No flight selected")}</div></div><div class="basket-block"><strong>🏨 Accommodation</strong><div class="muted">${hotel?`${escapeHTML(hotel.accommodation?.name||"Selected hotel")} · ${escapeHTML(hotel.boardType||hotel.paymentType||"")}`:"No hotel selected"}</div></div><div class="basket-block"><strong>🚐 Transfers</strong><div class="muted">${transferComponents74().length?`${transferComponents74().length} transfer component(s)`:"Not selected - use Package Builder transfer panel"}</div></div><div class="money-line"><span>Recorded booking</span><strong>${money(Number(b.totalAmount||0),b.currency)}</strong></div><div class="money-line"><span>Hotel quote</span><strong>${hotel?money(hotel.totalAmount,hotel.totalCurrency):"—"}</strong></div><div class="money-line"><span>Package total</span><strong class="price-total">${money(packageTotal74()+(hotel?Number(hotel.totalAmount||0):0),b.currency||hotel?.totalCurrency||state.preferences.currency)}</strong></div><button class="primary" style="width:100%;margin-top:8px" data-b0074-action="preview-confirmation">Preview Booking Confirmation</button></div></aside>`;
  }
  function renderHotelWorkbench(){
    const d=state.hotelSearchDraft,visible=filteredStayResults();
    return `${pageHead("Tour Operator Hotel Workbench","Dense Hotels master-detail search with exact child ages and a package basket. Board basis, rate code, payment method and cancellation terms are live supplier data.")}<div class="hotel-workbench"><div><section class="panel hotel-searchbar"><div class="panel-head">Search Inventory</div><div class="panel-body"><div class="form-grid"><div class="field"><label>Destination / Resort</label><input id="stayDest74" value="${escapeAttr(d.destination||"")}" placeholder="Palma de Mallorca, Alcudia, PMI"></div><div class="field"><label>Check-in</label><input id="stayIn74" type="date" value="${escapeAttr(d.checkInDate||"")}"></div><div class="field"><label>Check-out</label><input id="stayOut74" type="date" value="${escapeAttr(d.checkOutDate||"")}"></div><div class="field"><label>Rooms</label><input id="stayRooms74" type="number" min="1" max="9" value="${escapeAttr(String(d.rooms||1))}"></div><div class="field"><label>Adults</label><input id="stayAdults74" type="number" min="1" max="9" value="${escapeAttr(String(d.adults||2))}"></div><div class="field"><label>Children</label><input id="stayChildren74" type="number" min="0" max="8" value="${state.hotelChildAges.length}"></div><div class="field"><label>Chain / Brand Filter</label><input id="stayChain74" maxlength="40" value="${escapeAttr(d.chainCode||"")}" placeholder="Marriott / Hyatt"></div><div class="field"><label>Radius KM</label><input id="stayRadius74" type="number" min="1" max="100" value="${escapeAttr(String(d.radiusKm||25))}"></div></div><div class="form-grid">${childAgeFields()}</div><div class="toolbar" style="padding-left:0"><label class="check"><input type="checkbox" data-hotel-amenity="pool" ${state.hotelAmenities.pool?"checked":""}> Pool</label><label class="check"><input type="checkbox" data-hotel-amenity="gym" ${state.hotelAmenities.gym?"checked":""}> Gym</label><label class="check"><input type="checkbox" data-hotel-amenity="wifi" ${state.hotelAmenities.wifi?"checked":""}> Free WiFi</label><label class="check"><input type="checkbox" data-hotel-amenity="pet" ${state.hotelAmenities.pet?"checked":""}> Pet Friendly</label></div></div><div class="panel-foot"><button class="primary" data-b0074-action="stay-search">Search Inventory</button></div></section><section style="margin-top:10px">${visible.length?visible.map(r=>{
      const a=r.accommodation||{},image=r.imageUrl||a.photos?.[0]||"",rates=state.selectedStayResult===r.id?state.stayRates:[];
      return `<article class="hotel-card"><div class="hotel-head">${image?`<img class="hotel-thumb" src="${escapeAttr(image)}" alt="">`:'<div class="hotel-thumb"></div>'}<div><strong>${escapeHTML(r.title||a.name||"Accommodation")}</strong><div class="muted">${escapeHTML(r.address?.city||a.address?.city||"")} · ${"★".repeat(Math.max(0,Math.min(5,Math.round(Number(r.rating||a.rating||0)))))} </div></div><div><span class="muted">Lead price</span><div class="strong">${money(r.cheapestRateTotalAmount||r.total,r.cheapestRateTotalCurrency||r.currency)}</div></div><div>${liveBadge()}<br><button class="link" data-b0074-action="stay-rates" data-search-result-id="${escapeAttr(r.id)}">${rates.length?"Refresh rates":"Rooms & rates"}</button></div></div>${rates.length?`<div class="hotel-matrix"><table class="data-table"><thead><tr><th>Room Type</th><th>Max Occupancy</th><th>Board Basis</th><th>Rate Code</th><th>Inventory</th><th>Price / Payment</th><th>Benefits</th><th>Cancellation Policy</th><th></th></tr></thead><tbody>${rates.map(rate=>`<tr><td><strong>${escapeHTML(rate.roomName||"Room")}</strong><br><small>${escapeHTML(rate.roomDescription||"")}</small></td><td>${escapeHTML(rate.maxOccupancy?String(rate.maxOccupancy):"Supplier rules")}</td><td><strong>${escapeHTML(rate.boardType||"Supplier rate")}</strong></td><td class="mono">${escapeHTML(rate.rateCode||"—")}</td><td>${liveBadge()}</td><td><strong>${money(rate.totalAmount,rate.totalCurrency)}</strong><br><small>${escapeHTML(rate.paymentType||"Live rate")}</small>${Number(rate.dueAtAccommodationAmount||0)>0?`<br><small>At hotel: ${money(rate.dueAtAccommodationAmount,rate.dueAtAccommodationCurrency||rate.totalCurrency)}</small>`:""}</td><td>${escapeHTML((rate.benefits||[]).map(x=>x.title||x.type).filter(Boolean).join(", ")||"—")}</td><td><strong>${escapeHTML(hotelCancellation(rate))}</strong></td><td><button class="primary" data-b0074-action="stay-quote" data-rate-id="${escapeAttr(rate.rateId)}">Quote / Add</button></td></tr>`).join("")}</tbody></table></div>`:""}</article>`;
    }).join(""):emptyState("⌂","No stay results loaded","Search Hotels using the destination/resort and exact child ages.")}</section>${state.stayQuote?renderStayQuote74():""}</div>${packageBasket()}</div>`;
  }
  function renderStayQuote74(){
    const q=state.stayQuote;if(!q)return "";
    return `<section class="panel" style="margin-top:10px"><div class="panel-head"><span>Final Stay Quote</span><span class="badge info">LIVE QUOTE</span></div><div class="panel-body"><div class="grid grid-4"><div><span class="muted">Hotel</span><div class="strong">${escapeHTML(q.accommodation?.name||"Accommodation")}</div></div><div><span class="muted">Board</span><div class="strong">${escapeHTML(q.boardType||"—")}</div></div><div><span class="muted">Rate code</span><div class="strong mono">${escapeHTML(q.rateCode||"—")}</div></div><div><span class="muted">Payment</span><div class="strong">${escapeHTML(q.paymentType||"—")}</div></div></div><div class="money-line"><span>Base</span><strong>${money(q.baseAmount,q.totalCurrency)}</strong></div><div class="money-line"><span>Taxes</span><strong>${money(q.taxAmount,q.taxCurrency||q.totalCurrency)}</strong></div><div class="money-line"><span>Total</span><strong class="price-total">${money(q.totalAmount,q.totalCurrency)}</strong></div><div class="alert warning" style="margin-top:8px"><span>!</span><div><strong>Cancellation</strong>${escapeHTML(hotelCancellation(q))}</div></div></div><div class="panel-foot"><button class="primary" data-b0074-action="stay-book">Book into open ALTEA file</button></div></section>`;
  }
  function openStayBooking74(){
    const q=state.stayQuote;if(!q)return;
    const p=selectedBookingPax74(),cp=p?.payload?.customerProfile||{};
    openModal("Book Hotel",`<div class="field"><label>Lead guest first name</label><input id="stayGuestFirst74" value="${escapeAttr(p?.firstName||cp.firstName||"")}"></div><div class="field"><label>Lead guest last name</label><input id="stayGuestLast74" value="${escapeAttr(p?.lastName||cp.lastName||"")}"></div><div class="field"><label>Email</label><input id="stayGuestEmail74" type="email" value="${escapeAttr(cp.email||booking74()?.customerEmail||"")}"></div><div class="field"><label>Phone (E.164)</label><input id="stayGuestPhone74" value="${escapeAttr(cp.phone||p?.payload?.contact?.phone||"")}" placeholder="+12125550123"></div>`,[{label:"Back",className:"secondary",close:true},{label:"Book stay",className:"primary",onClick:()=>{const payload={quoteId:q.id,guests:[{givenName:document.getElementById("stayGuestFirst74")?.value||"",familyName:document.getElementById("stayGuestLast74")?.value||""}],email:document.getElementById("stayGuestEmail74")?.value||"",phoneNumber:document.getElementById("stayGuestPhone74")?.value||"",alteaBookingId:booking74()?.id||""};closeModal();post("DUFFEL_CREATE_STAY_BOOKING",payload)}}]);
  }


  /* --------------------------- Package / Transfers --------------------------- */
  function sellableTransferCandidates(){return (state.inventory||[]).filter(x=>norm(x.entityType||x.type)==="TRANSFER").slice(0,100)}
  function selectedTransferProduct(){return sellableTransferCandidates().find(x=>String(x.id)===String(state.packageTransferEntityId))||null}
  function sellableDatedLines(product){return (product?.dated||[]).filter(d=>!d.stopSale&&!d.blackout&&Number(d.available??0)>0&&["OPEN","AVAILABLE"].includes(String(d.status||"OPEN").toUpperCase()))}
  function packageClassPanel(){
    const b=booking74()||{},p=b.payload||{};
    return `<section class="panel"><div class="panel-head">Charter / Tour Operator Classification</div><div class="panel-body"><div class="form-grid"><div class="field"><label>Booking type</label><select id="packageBookingType74">${["FLIGHT_ONLY","LAND_ONLY","DYNAMIC_PACKAGE","SKANDI_PACKAGE","GROUP_BOOKING"].map(v=>option(v,humanize(v),norm(b.bookingType||p.bookingType||"DYNAMIC_PACKAGE"))).join("")}</select></div><div class="field"><label>Tour Operator Code</label><select id="packageTourOperator74">${["SKANDI","TUI","VING","APOL"].map(v=>option(v,v,b.tourOperatorCode||p.tourOperatorCode||"SKANDI")).join("")}</select></div><div class="field"><label>Destination Resort / Zone</label><input id="packageResortZone74" value="${escapeAttr(b.destinationResortZone||p.destinationResortZone||"")}" placeholder="Alcudia / Magaluf / Playa de Muro"></div><div class="field"><label>Duration</label><select id="packageDuration74"><option value="7" ${Number(b.durationNights||p.durationNights)===7?"selected":""}>7 Nights</option><option value="14" ${Number(b.durationNights||p.durationNights)===14?"selected":""}>14 Nights</option><option value="0" ${![7,14].includes(Number(b.durationNights||p.durationNights))?"selected":""}>Flexible</option></select></div><div class="field"><label>Meal Board</label><select id="packageMealBoard74">${[["RO","Room Only"],["BB","Bed & Breakfast"],["HB","Half Board"],["AI","All Inclusive"]].map(([v,l])=>`<option value="${v}" ${String(b.mealBoard||p.mealBoard||"")===v?"selected":""}>${v} · ${l}</option>`).join("")}</select></div><div class="field span-2"><label>Room Type Code / Description</label><input id="packageRoomType74" value="${escapeAttr(b.roomTypeCode||p.roomTypeCode||"")}" placeholder="Double Room, Sea View, Balcony"></div><div class="field"><label>Start date</label><input id="packageStart74" type="date" value="${escapeAttr(b.departureDate||b.startDate||"")}"></div><div class="field"><label>End date</label><input id="packageEnd74" type="date" value="${escapeAttr(b.returnDate||b.endDate||"")}"></div></div><div class="alert info"><span>ℹ</span><div>Tour-operator fields classify the SKANDI package. Live hotel board/rate data remains authoritative; SKANDI does not calculate synthetic board supplements.</div></div><button class="primary" data-b0074-action="save-package">Save package setup</button></div></section>`;
  }
  function transferPanel(){
    const b=booking74()||{},flight=state.selectedOffer?.slices?.[0]?.segments?.[0]||{},hotel=components74().find(c=>norm(c.componentType||c.entityType).includes("HOTEL"))||{},candidates=sellableTransferCandidates(),product=selectedTransferProduct(),dated=sellableDatedLines(product),p=selectedBookingPax74(),phone=p?.payload?.customerProfile?.phone||p?.payload?.contact?.phone||"";
    return `<section class="transfer-builder"><div class="panel-head">Smart Transfer Ancillary</div><div class="panel-body"><div class="alert info"><span>ℹ</span><div><strong>Basket-aware routing</strong>Flight and hotel context is prefilled from the open booking. Transfer supply uses SKANDI Inventory; no transfer product is fabricated.</div></div><div class="form-grid"><div class="field"><label>Transfer product</label><select id="pkgTransferEntity74"><option value="">Select SKANDI transfer</option>${candidates.map(x=>`<option value="${escapeAttr(x.id)}" ${String(x.id)===String(state.packageTransferEntityId)?"selected":""}>${escapeHTML(x.name||x.title||"Transfer")}</option>`).join("")}</select></div>${product?.dated?.length?`<div class="field"><label>Service / capacity line</label><select id="pkgTransferDated74"><option value="">Select dated inventory</option>${dated.map(d=>`<option value="${escapeAttr(d.id||d.datedInventoryId)}">${escapeHTML(d.serviceDate||d.service_date||"")} · ${escapeHTML(d.variantName||d.variant_name||d.variantCode||"Standard")} · ${escapeHTML(String(d.available??0))} available</option>`).join("")}</select></div>`:""}<div class="field"><label>Transfer type</label><select id="pkgTransferType74"><option>Shared Shuttle</option><option>Private Standard Taxi</option><option>Private VIP</option><option>Minivan</option><option>Wheelchair Accessible</option></select></div><div class="field"><label>Direction</label><select id="pkgTransferDirection74"><option value="INBOUND">Inbound: Airport → Hotel</option><option value="OUTBOUND">Outbound: Hotel → Airport</option><option value="ROUNDTRIP">Roundtrip</option></select></div><div class="field"><label>Arrival flight</label><input id="pkgTransferFlight74" value="${escapeAttr((flight.marketingCarrier?.iataCode||"")+(flight.marketingFlightNumber||""))}"></div><div class="field"><label>Scheduled arrival</label><input id="pkgTransferArrival74" value="${escapeAttr(flight.arrivingAt||"")}"></div><div class="field"><label>Pick-up</label><input id="pkgTransferPickup74" value="${escapeAttr(flight.destination?.iataCode||b.destination||"")}"></div><div class="field"><label>Drop-off / Hotel</label><input id="pkgTransferDropoff74" value="${escapeAttr(hotel.title||hotel.payload?.hotelName||"")}"></div><div class="field"><label>Traveler mobile</label><input id="pkgTransferPhone74" value="${escapeAttr(phone)}" placeholder="+12125550123"></div><div class="field"><label>Standard suitcases</label><input id="pkgTransferBags74" type="number" min="0" max="20" value="2"></div><div class="field"><label>Child / infant seats</label><input id="pkgTransferChildSeats74" type="number" min="0" max="9" value="0"></div></div><div class="toolbar" style="padding-left:0"><label class="check"><input id="pkgGolf74" type="checkbox"> Golf bags</label><label class="check"><input id="pkgStroller74" type="checkbox"> Strollers</label><label class="check"><input id="pkgBike74" type="checkbox"> Bicycles</label><label class="check"><input id="pkgSkis74" type="checkbox"> Skis</label></div><button class="primary" data-b0074-action="add-transfer">Add Transfer to Booking</button></div></section>`;
  }
  function renderPackageWorkbench(){
    const b=booking74();
    if(!b)return `${pageHead("Package Builder","Open or create a booking file before assembling a package.")}<div class="grid grid-3">${emptyState("◈","No booking selected","Create/open a SKANDI booking file first.")}</div>`;
    const comps=components74();
    return `${pageHead("Package Builder",`${masterRef74()} · Air + hotel + transfer + tour package workspace`,'<button class="secondary" data-b0074-action="preview-confirmation">Preview Confirmation</button>')}<div class="grid grid-4"><div class="stat"><div class="stat-label">Master reference</div><div class="stat-value" style="font-size:18px">${escapeHTML(masterRef74())}</div></div><div class="stat"><div class="stat-label">Passengers</div><div class="stat-value">${passengers74().length}</div></div><div class="stat"><div class="stat-label">Components</div><div class="stat-value">${comps.length}</div></div><div class="stat"><div class="stat-label">Recorded total</div><div class="stat-value" style="font-size:18px">${money(packageTotal74(),b.currency||state.preferences.currency)}</div></div></div><div class="grid grid-2" style="margin-top:10px"><div>${packageClassPanel()}${transferPanel()}</div>${packageBasket()}</div>`;
  }
  function savePackage74(){
    const b=booking74();if(!b?.id)return;
    post("ALTEA_UPDATE_BOOKING",{bookingId:b.id,patch:{bookingType:document.getElementById("packageBookingType74")?.value||"DYNAMIC_PACKAGE",tourOperatorCode:document.getElementById("packageTourOperator74")?.value||"SKANDI",destinationResortZone:document.getElementById("packageResortZone74")?.value||"",durationNights:Number(document.getElementById("packageDuration74")?.value||0),mealBoard:document.getElementById("packageMealBoard74")?.value||"",roomTypeCode:document.getElementById("packageRoomType74")?.value||"",startDate:document.getElementById("packageStart74")?.value||"",endDate:document.getElementById("packageEnd74")?.value||"",packageStatus:b.packageStatus||b.status||"DRAFT",passengerAges:passengers74().map(p=>({passengerId:p.id,type:p.paxType||"",dateOfBirth:p.dateOfBirth||""}))}});
  }
  function addTransfer74(){
    const b=booking74(),entityId=document.getElementById("pkgTransferEntity74")?.value||"";if(!b?.id||!entityId)return toast("Transfer product required","Choose a SKANDI transfer product.","warning");
    const product=sellableTransferCandidates().find(x=>String(x.id)===String(entityId)),datedInventoryId=document.getElementById("pkgTransferDated74")?.value||"";
    if(product?.dated?.length&&!datedInventoryId)return toast("Dated inventory required","Choose the exact service/capacity line so Inventory Control sold/available stays synchronized.","warning");
    state._pendingTransferDetails={transferType:document.getElementById("pkgTransferType74")?.value||"",direction:document.getElementById("pkgTransferDirection74")?.value||"",arrivalFlightNumber:document.getElementById("pkgTransferFlight74")?.value||"",scheduledArrivalTime:document.getElementById("pkgTransferArrival74")?.value||"",pickupLocation:document.getElementById("pkgTransferPickup74")?.value||"",dropoffLocation:document.getElementById("pkgTransferDropoff74")?.value||"",travelerMobile:document.getElementById("pkgTransferPhone74")?.value||"",standardSuitcases:Number(document.getElementById("pkgTransferBags74")?.value||0),childSeats:Number(document.getElementById("pkgTransferChildSeats74")?.value||0),extras:[["Golf Bags",document.getElementById("pkgGolf74")?.checked],["Strollers",document.getElementById("pkgStroller74")?.checked],["Bicycles",document.getElementById("pkgBike74")?.checked],["Skis",document.getElementById("pkgSkis74")?.checked]].filter(x=>x[1]).map(x=>x[0])};
    post("ALTEA_ADD_INVENTORY_COMPONENT",{bookingId:b.id,entityId,datedInventoryId:datedInventoryId||undefined,quantity:1});
  }


  /* --------------------------- Customer Profiles / CRM --------------------------- */
  function crmRows(){
    const selected=String(state.clubSelectedCustomerId||"");
    return (state.clubSearchResults||[]).map(r=>`<div class="crm-row ${String(r.customerProfileId||r.id)===selected?"active":""}" data-b0074-action="crm-open" data-profile-id="${escapeAttr(r.customerProfileId||r.id)}"><strong>${escapeHTML(r.name||"Customer")}</strong><div class="muted">${escapeHTML(r.email||"")}</div><div>${r.isLoyaltyMember?`<span class="badge info">SKANDI CLUB · ${escapeHTML(r.tier||"MEMBER")}</span>`:'<span class="badge neutral">SKANDI MEMBER</span>'}</div></div>`).join("");
  }
  function crmDetail(){
    const p=state.customerProfileDetail||selectedClubCustomer74();
    if(!p)return emptyState("♙","Select a customer","Search by last name, email or member number, then open the profile.");
    return `<div class="panel-head"><span>${escapeHTML(p.name||"Customer Profile")}</span>${p.isLoyaltyMember?`<span class="badge info">${escapeHTML(p.tier||"SKANDI CLUB")}</span>`:'<span class="badge neutral">SKANDI MEMBER</span>'}</div><div class="panel-body"><div class="crm-detail-grid"><div><span class="muted">Member ID</span><strong>${escapeHTML(p.memberId||"—")}</strong></div><div><span class="muted">Club number</span><strong>${escapeHTML(p.memberNumber||"Not enrolled")}</strong></div><div><span class="muted">Points</span><strong>${escapeHTML(String(p.pointsBalance??0))}</strong></div><div><span class="muted">Email</span><strong>${escapeHTML(p.email||"—")}</strong></div><div><span class="muted">Phone</span><strong>${escapeHTML(p.phone||"—")}</strong></div><div><span class="muted">Seat preference</span><strong>${escapeHTML(p.preferences?.seat||"—")}</strong></div><div><span class="muted">Dietary / meals</span><strong>${escapeHTML([p.preferences?.dietary,...(p.preferences?.meals||[])].filter(Boolean).join(", ")||"—")}</strong></div><div><span class="muted">Accessibility</span><strong>${escapeHTML(p.accessibilityNeeds||"—")}</strong></div><div><span class="muted">Stored payment</span><strong>${escapeHTML((p.storedPaymentMethods||[]).map(x=>`${x.brand||"CARD"} •••• ${x.last4||""}`).join(", ")||"No masked method exposed")}</strong></div></div><div class="crm-section"><h4>Saved Travelers</h4>${p.travelers?.length?`<table class="data-table"><thead><tr><th>Name</th><th>DOB</th><th>Passport</th><th>Preferences</th><th></th></tr></thead><tbody>${p.travelers.map(t=>`<tr><td>${escapeHTML(t.name||"")}</td><td>${escapeHTML(t.dateOfBirth||"—")}</td><td>${t.passportLast4?`•••• ${escapeHTML(t.passportLast4)} · ${escapeHTML(t.passportExpiry||"")}`:"—"}</td><td>${escapeHTML([t.dietaryPrefs,t.accessibilityNeeds].filter(Boolean).join(" · ")||"—")}</td><td><button class="link" data-b0074-action="crm-transfer" data-profile-id="${escapeAttr(p.customerProfileId||p.id)}" data-traveler-id="${escapeAttr(t.id)}">Transfer to passenger / PNR</button></td></tr>`).join("")}</tbody></table>`:'<div class="muted">No saved travelers returned.</div>'}</div><div class="crm-section"><h4>Secure Documents</h4>${p.documents?.length?`<table class="data-table"><thead><tr><th>Type</th><th>Last 4</th><th>Issue</th><th>Expiry</th><th>Status</th></tr></thead><tbody>${p.documents.map(d=>`<tr><td>${escapeHTML(d.documentType||d.title||"")}</td><td>${escapeHTML(d.last4||"—")}</td><td>${escapeHTML(d.issueDate||"—")}</td><td>${escapeHTML(d.expiryDate||"—")}</td><td>${escapeHTML(d.status||"")}</td></tr>`).join("")}</tbody></table>`:'<div class="muted">No secure document metadata returned.</div>'}</div><div class="crm-section"><h4>Loyalty Accounts</h4><div class="muted">${escapeHTML([...(p.preferences?.frequentFlyer||[]),...(p.preferences?.hotelLoyalty||[]),...(p.preferences?.carLoyalty||[])].map(x=>typeof x==="string"?x:(x.label||x.accountNumber||x.number||"")).filter(Boolean).join(" · ")||"No loyalty accounts stored")}</div></div><div class="crm-section"><h4>Emergency Contacts</h4><div class="muted">${escapeHTML((p.emergencyContacts||[]).map(x=>typeof x==="string"?x:[x.name,x.phone,x.relationship].filter(Boolean).join(" · ")).join(" | ")||"No emergency contact stored")}</div></div><div class="club-profile-actions"><button class="primary" data-b0074-action="crm-transfer" data-profile-id="${escapeAttr(p.customerProfileId||p.id)}">Transfer Primary Profile to Passenger / PNR</button></div></div>`;
  }
  function renderCrmWorkbench(){
    const list=passengers74(),active=list.find(x=>x.id===state.selectedPassengerId)||list[0]||null;
    return `${pageHead("Customer Profiles & CRM","Canonical SKANDI customer_profiles search. Customer profile data is transferred into the active ALTEA passenger; System is not used as a CRM directory.",'<button class="secondary" disabled title="Create customer identities in the canonical Customer Management/account workflow.">+ Create New Profile</button>')}<div class="crm-workbench"><section class="panel"><div class="panel-head">Search & Results</div><div class="panel-body"><div class="field"><label>Passenger target</label><select id="crmPassenger74">${list.map(p=>option(p.id,paxName74(p),active?.id)).join("")}</select></div><div class="field"><label>Search</label><input id="crmSearch74" value="${escapeAttr(state.clubSearchText||"")}" placeholder="Last name, email, member number"></div><div class="grid grid-2"><div class="field"><label>Search by</label><select id="crmSearchType74">${["all","name","email","member"].map(v=>option(v,humanize(v),state.clubSearchType||"all")).join("")}</select></div><div class="field"><label>Membership</label><select id="crmMembership74">${["all","members","not_enrolled"].map(v=>option(v,humanize(v),state.clubMembershipFilter||"all")).join("")}</select></div></div><button class="primary" data-b0074-action="crm-search">Search Profiles</button></div><div class="crm-results">${crmRows()||'<div class="empty">No profile results loaded.</div>'}</div></section><section class="panel">${crmDetail()}</section></div>`;
  }


  /* --------------------------- Confirmation Preview --------------------------- */
  function ensurePreviewButton(){
    const tabs=document.querySelector(".workspace-tabs");if(!tabs||document.getElementById("bookingPreviewQuick"))return;
    const b=document.createElement("button");b.id="bookingPreviewQuick";b.className="quick-preview";b.type="button";b.textContent="Preview Confirmation";
    b.addEventListener("click",()=>previewConfirmation74());tabs.appendChild(b);
  }
  function previewConfirmation74(){
    const id=booking74()?.id;if(!id)return toast("Booking file required","Create or open a booking before previewing the customer confirmation.","warning");
    post("ALTEA_PREVIEW_BOOKING_CONFIRMATION",{bookingId:id});
  }


  /* --------------------------- Events --------------------------- */
  main.addEventListener("click",event=>{
    const seat=event.target.closest?.("[data-b0074-seat]");
    if(seat){event.preventDefault();const map=activeSeatMap(),el=(map?.seats||[]).find(x=>String(x.designator)===String(seat.dataset.b0074Seat));if(el)toggleSeat74(el,map);return}
    const category=event.target.closest?.("[data-seat-category]");if(category){state.seatWorkbench.category=category.dataset.seatCategory;render();return}
    const action=event.target.closest?.("[data-b0074-action]")?.dataset.b0074Action;
    if(!action)return;
    if(action==="review-seat-catalog"){state.activeView="workspace";render();toast("Seat selections ready",`${[...state.selectedServices.values()].filter(s=>s.type==="seat").length} seat selection(s) are included in the current order workspace.`,"success");return}
    if(action==="print-seat-catalog"){window.print();return}
    if(action==="record-pet-request"){
      const passengerId=document.getElementById("petPassenger")?.value||"",code=document.getElementById("petCode")?.value||"PETC",details=document.getElementById("petDetails")?.value||"";
      if(booking74()?.id)post("ALTEA_ADD_HISTORY_NOTE",{bookingId:booking74().id,eventType:"AGENT_SERVICE_REQUEST",note:`${code}${passengerId?` passenger ${passengerId}`:""}: ${details||"Pet request"}`});
      else toast("Booking file required","Open a booking before recording a pet request.","warning");return;
    }
    if(action==="record-remark"){
      const type=document.getElementById("manualRemarkType")?.value||"OSI",passengerId=document.getElementById("manualRemarkPax")?.value||"",text=document.getElementById("manualRemarkText")?.value.trim()||"";
      if(!booking74()?.id||!text)return toast("Remark required","Open a booking and enter the SSR/OSI remark.","warning");
      post("ALTEA_ADD_HISTORY_NOTE",{bookingId:booking74().id,eventType:`AGENT_${type}`,note:`${type}${passengerId?` PAX ${passengerId}`:""}: ${text}`});return;
    }
    if(action==="stay-search"){
      const d=state.hotelSearchDraft;post("DUFFEL_SEARCH_STAYS",{destination:d.destination,checkInDate:d.checkInDate,checkOutDate:d.checkOutDate,rooms:Number(d.rooms||1),adults:Number(d.adults||2),childAges:state.hotelChildAges,radiusKm:Number(d.radiusKm||25),instantPayment:true});return;
    }
    if(action==="stay-rates"){
      const id=event.target.closest("[data-search-result-id]")?.dataset.searchResultId||"";state.selectedStayResult=id;state.stayRates=[];state.stayQuote=null;post("DUFFEL_FETCH_STAY_RATES",{searchResultId:id});render();return;
    }
    if(action==="stay-quote"){
      const id=event.target.closest("[data-rate-id]")?.dataset.rateId||"";state.selectedStayRate=id;post("DUFFEL_QUOTE_STAY",{rateId:id});return;
    }
    if(action==="stay-book"){openStayBooking74();return}
    if(action==="save-package"){savePackage74();return}
    if(action==="add-transfer"){addTransfer74();return}
    if(action==="preview-confirmation"){previewConfirmation74();return}
    if(action==="crm-search"){
      const q=document.getElementById("crmSearch74")?.value||"";state.clubSearchText=q;state.clubSearchType=document.getElementById("crmSearchType74")?.value||"all";state.clubMembershipFilter=document.getElementById("crmMembership74")?.value||"all";
      post("ALTEA_CLUB_SEARCH",{query:q,searchType:state.clubSearchType,membershipFilter:state.clubMembershipFilter,passengerId:document.getElementById("crmPassenger74")?.value||state.selectedPassengerId||"",bookingId:booking74()?.id||""});return;
    }
    if(action==="crm-open"){
      state.clubSelectedCustomerId=event.target.closest("[data-profile-id]")?.dataset.profileId||"";state.customerProfileDetail=null;post("ALTEA_CUSTOMER_PROFILE_GET",{customerProfileId:state.clubSelectedCustomerId},{busy:false});render();return;
    }
    if(action==="crm-transfer"){
      const passengerId=document.getElementById("crmPassenger74")?.value||state.selectedPassengerId||"",el=event.target.closest("[data-profile-id]");const profileId=el?.dataset.profileId||state.clubSelectedCustomerId||"",travelerId=el?.dataset.travelerId||"";
      if(!passengerId||!profileId)return toast("Passenger and profile required","Select a target passenger and customer profile.","warning");
      post("ALTEA_CLUB_LINK_MEMBER",{bookingId:booking74()?.id||"",passengerId,customerProfileId:profileId,travelerId});return;
    }
  });


  main.addEventListener("change",event=>{
    const e=event.target;if(e.matches?.("[data-seat-pax-radio]")){state.seatWorkbench.activePassengerId=e.dataset.seatPaxRadio;render();return}
    if(e.matches?.("[data-seat-pax-check]")){const set=new Set(state.seatWorkbench.selectedPassengerIds||[]);e.checked?set.add(e.dataset.seatPaxCheck):set.delete(e.dataset.seatPaxCheck);state.seatWorkbench.selectedPassengerIds=[...set];render();return}
    if(e.matches?.("[data-seat-segment]")){state.seatWorkbench.activeSegmentId=e.dataset.seatSegment;state.seatWorkbench.deck="";render();return}
    if(e.matches?.("[data-seat-filter]")){state.seatWorkbench.filters[e.dataset.seatFilter]=e.checked;render();return}
    if(e.id==="seatRequestCradle"){state.seatWorkbench.requestCradle=e.checked;return}
    if(e.id==="seatDeckSelect"){state.seatWorkbench.deck=e.value;render();return}
    if(e.id==="stayChildren74"){const n=Math.max(0,Math.min(8,Number(e.value||0)));state.hotelChildAges=Array.from({length:n},(_,i)=>state.hotelChildAges[i]??7);render();return}
    if(e.matches?.("[data-hotel-child-age]")){state.hotelChildAges[Number(e.dataset.hotelChildAge)]=Number(e.value);return}
    if(e.matches?.("[data-hotel-amenity]")){state.hotelAmenities[e.dataset.hotelAmenity]=e.checked;render();return}
    if(e.id==="stayChain74"){state.hotelSearchDraft.chainCode=e.value;render();return}
    if(e.id==="pkgTransferEntity74"){state.packageTransferEntityId=e.value;render();return}
    if(e.id==="crmPassenger74"){state.selectedPassengerId=e.value;return}
  });
  main.addEventListener("input",event=>{
    const e=event.target;if(!e?.id)return;
    const map={stayDest74:"destination",stayIn74:"checkInDate",stayOut74:"checkOutDate",stayRooms74:"rooms",stayAdults74:"adults",stayRadius74:"radiusKm"};
    const key=map[e.id];if(key)state.hotelSearchDraft[key]=["rooms","adults","radiusKm"].includes(key)?Number(e.value||0):e.value;
  });
  main.addEventListener("keydown",event=>{if(event.target?.id==="seatQuickAssign"&&event.key==="Enter"){event.preventDefault();quickAssign(event.target.value)}});


  window.addEventListener("message",event=>{
    const m=typeof event.data==="string"?(()=>{try{return JSON.parse(event.data)}catch(_){return null}})():event.data;
    if(!m||m.source!==PARENT_SOURCE)return;const p=m.payload||{};
    if(m.type==="ALTEA_CUSTOMER_PROFILE_RESULT"){state.customerProfileDetail=p.profile||null;if(state.activeView==="club")render()}
    if(m.type==="ALTEA_COMPONENT_UPDATED"&&state._pendingTransferDetails&&p.component?.id){const details=state._pendingTransferDetails;state._pendingTransferDetails=null;post("ALTEA_UPDATE_COMPONENT",{bookingId:booking74()?.id||"",componentId:p.component.id,patch:{payload:details}},{busy:false})}
    if(m.type==="ALTEA_BOOKING_CONFIRMATION_PREVIEW"&&p.html){openModal("Booking Confirmation Preview",'<iframe class="preview-frame" id="bookingPreviewFrame"></iframe>',[{label:"Close",className:"secondary",close:true},{label:"Print",className:"primary",onClick:()=>document.getElementById("bookingPreviewFrame")?.contentWindow?.print()}],{size:"lg",onMount:()=>{const f=document.getElementById("bookingPreviewFrame");if(f)f.srcdoc=p.html}})}
  });


  const previousRender=render;
  render=function renderB0074(){
    previousRender();
    if(state.activeView==="hotels")main.innerHTML=`<section class="view">${renderHotelWorkbench()}</section>`;
    if(state.activeView==="packagebuilder")main.innerHTML=`<section class="view">${renderPackageWorkbench()}</section>`;
    if(state.activeView==="club")main.innerHTML=`<section class="view">${renderCrmWorkbench()}</section>`;
    ensurePreviewButton();const q=document.getElementById("bookingPreviewQuick");if(q)q.disabled=!booking74()?.id;
  };
// --- GLOBAL DATE SYNCHRONIZER ---
  // Listens to the whole document so it never breaks when tabs change.
  document.addEventListener('input', (e) => {
    const syncPairs = {
      'departureDate': 'returnDate',       // Flights
      'stayIn': 'stayOut',                 // Hotels (Base)
      'stayIn74': 'stayOut74',             // Hotels (Enterprise)
      'packageStart74': 'packageEnd74',    // Package Builder
      'carPickupDate': 'carDropoffDate'    // <--- Cars added here!
    };
    // ... [rest of the function remains the same]
    
    const targetOutId = syncPairs[e.target.id];
    
    if (targetOutId) {
      const outInput = document.getElementById(targetOutId);
      if (outInput && e.target.value) {
        // 1. Update the check-out date to match check-in
        outInput.value = e.target.value;
        
        // 2. Prevent user from picking a check-out date in the past
        outInput.min = e.target.value;
        
        // 3. Force the app's internal state to recognize the automatic change
        outInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  render();
})();


