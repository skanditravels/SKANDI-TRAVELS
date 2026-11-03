
(function(){
  "use strict";
  // Additive, read-only ALTEA order inspector. No new payment or supplier actions.
  if(typeof renderActions!=="function"||typeof escapeHTML!=="function")return;
  const previousActions=renderActions;
  const asArray=v=>Array.isArray(v)?v:[];
  const isValue=v=>v!==null&&v!==undefined&&v!=="";
  function show(value){
    if(!isValue(value))return "Not provided by supplier";
    if(Array.isArray(value))return value.length?value.map(item=>typeof item==="object"?JSON.stringify(item):String(item)).join("; "):"None returned";
    if(typeof value==="object")return JSON.stringify(value);
    return String(value);
  }
  function entry(label,value){return `<div class="audit-entry"><dt>${escapeHTML(label)}</dt><dd class="mono">${escapeHTML(show(value))}</dd></div>`;}
  function items(label,values,render){
    const arr=asArray(values);
    return `<details><summary>${escapeHTML(label)} (${arr.length})</summary>${arr.length?arr.map((item,index)=>`<section style="padding:9px 3px;border-bottom:1px dotted #c3c3c3"><strong>Entry ${index+1}</strong>${render(item,index)}</section>`).join(""):'<p class="audit-note">No records returned by Duffel.</p>'}</details>`;
  }
  function audit(order){
    if(!order?.id)return "";
    const currencies=[order.totalCurrency,order.baseCurrency,order.taxCurrency].filter(Boolean);
    return `<section class="panel duffel-order-audit" aria-label="Airline order record details"><div class="panel-head">Duffel Order Record — Read Only</div><div class="panel-body"><p class="audit-note">The fields below reflect data actually returned by the airline. Missing values are not interpreted as zero, authorization or successful ticket issuance. Actions are still controlled by the existing server-side workflow.</p>
      ${entry("Duffel order ID",order.id)}
      ${entry("Order status",order.status)}
      ${entry("Payment status",order.paymentStatus)}
      ${entry("Booking reference",order.bookingReference)}
      ${entry("Airline references",order.bookingReferences)}
      ${entry("Total amount",order.totalAmount)}
      ${entry("Base amount",order.baseAmount)}
      ${entry("Tax amount",order.taxAmount)}
      ${entry("Currency/currencies",currencies)}
      ${entry("Payment required by",order.paymentRequiredBy)}
      ${entry("Void window ends",order.voidWindowEndsAt)}
      ${entry("Available supplier actions",order.availableActions)}
      ${entry("Intended payment methods",order.intendedPaymentMethods)}
      ${items("Tax breakdown",order.taxBreakdown,t=>entry("Code",t.code)+entry("Name",t.name)+entry("Amount",t.amount)+entry("Currency",t.currency)+entry("Description",t.description)+entry("Carrier imposed",t.carrier_imposed??t.carrierImposed))}
      ${items("Supplier-issued documents",order.documents,d=>entry("Document ID",d.id)+entry("Type",d.type)+entry("Identifier",d.uniqueIdentifier??d.unique_identifier)+entry("Passenger IDs",d.passengerIds??d.passenger_ids))}
      ${items("Booked services",order.services,v=>entry("Service ID",v.id)+entry("Type",v.type)+entry("Passenger IDs",v.passengerIds)+entry("Segment IDs",v.segmentIds)+entry("Amount",v.totalAmount)+entry("Currency",v.totalCurrency))}
      ${items("Airline-initiated changes",order.airlineInitiatedChanges,c=>entry("ID",c.id)+entry("Action",c.action_taken??c.actionTaken)+entry("Available actions",c.available_actions??c.availableActions)+entry("Added flights",c.added)+entry("Removed flights",c.removed))}
      ${items("Order changes",order.changes,c=>entry("ID",c.id)+entry("Status",c.status)+entry("Confirmed",c.confirmed_at??c.confirmedAt)+entry("Penalty",c.penalty_total_amount??c.penaltyTotalAmount))}
      ${items("Passenger records",order.passengers,p=>entry("Passenger ID",p.id)+entry("Name",[p.givenName,p.familyName].filter(Boolean).join(" "))+entry("Documents",p.identityDocuments??p.identity_documents))}
    </div></section>`;
  }
  renderActions=function renderActionsV12DuffelAudit(){
    const original=previousActions();
    const reconciliation=state.servicingReconciliation;
    const warning=Boolean(reconciliation?.orderId)&&reconciliation.orderId===state.selectedOrder?.id
      ? `<div class="alert warning" role="alert"><span>!</span><div><strong>Supplier servicing outcome unresolved</strong>Check Duffel order ${escapeHTML(reconciliation.orderId)}, the airline change/cancellation outcome, and customer payment or refund before another submission. Supplier request ID: ${escapeHTML(reconciliation.providerRequestId||"not returned")}. This view does not mark the operation successful.<div style="margin-top:8px"><button type="button" class="secondary" data-action="refresh-current-order">Recheck Duffel order (read only)</button></div><small>Rechecking shows the latest supplier order; it does not independently confirm Stripe captures or refunds, or remove the reconciliation lock.</small></div></div>`
      : "";
    return state.selectedOrder?.id?original+warning+audit(state.selectedOrder):original;
  };
})();
