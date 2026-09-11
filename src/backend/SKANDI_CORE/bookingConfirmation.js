// /src/backend/SKANDI_CORE/bookingConfirmation.js
// SKANDI R-005.4 — canonical Booking Confirmation renderer.
// Visual source: approved SKANDI PDF Booking Confirmation template.
// This renderer injects booking data into the approved document without
// duplicating Reservations business logic.

const TEMPLATE = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">\n<title>SKANDI Travels • PDF Booking Confirmation</title>\n\n<link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js\" crossorigin=\"anonymous\" referrerpolicy=\"no-referrer\"></script>\n\n<style>\n*{margin:0;padding:0;box-sizing:border-box;}\n\n:root{\n  --skandi-blue:#022e64;\n  --skandi-blue-soft:#285ca8;\n  --skandi-light-blue:#d7e6ff;\n  --skandi-pale-blue:#f6faff;\n  --skandi-panel:#f2f4f8;\n  --skandi-border:#e6e9ee;\n  --skandi-text:#000;\n  --skandi-body:#333;\n  --skandi-muted:#555;\n  --skandi-soft-muted:#6b7280;\n}\n\nhtml,body{\n  width:100%;\n  min-height:100%;\n}\n\nbody{\n  font-family:\"Montserrat\",Arial,sans-serif;\n  margin:0;\n  padding:40px;\n  background:#fff;\n  color:var(--skandi-text);\n  font-size:11px;\n  line-height:1.4;\n  -webkit-print-color-adjust:exact;\n  print-color-adjust:exact;\n}\n\n.hidden{display:none!important;}\n\n.document-container{\n  max-width:8.5in;\n  margin:0 auto;\n  background:#fff;\n}\n\n.header-section{\n  display:flex;\n  padding:22px 30px 28px 22px;\n  background:linear-gradient(135deg,var(--skandi-light-blue),var(--skandi-pale-blue));\n  justify-content:space-between;\n  align-items:flex-start;\n  margin-bottom:30px;\n  border-bottom:1px solid var(--skandi-border);\n}\n\n.brand-logo{\n  max-width:220px;\n  height:auto;\n  display:block;\n}\n\n.document-title-block{\n  text-align:right;\n  color:var(--skandi-blue);\n}\n\n.document-title{\n  font-size:26px;\n  font-weight:700;\n  margin:0 0 5px;\n  letter-spacing:-.5px;\n  color:var(--skandi-blue);\n}\n\n.document-title-block h2{\n  font-size:15px;\n  color:var(--skandi-blue);\n  margin:0 0 5px;\n}\n\n.document-subtitle{\n  font-size:10px;\n  color:var(--skandi-muted);\n  font-style:italic;\n  max-width:310px;\n}\n\n.confirmed-banner{\n  border-top:2px solid var(--skandi-blue);\n  border-bottom:1px solid var(--skandi-border);\n  padding:8px 0 10px;\n  margin-bottom:24px;\n  display:grid;\n  grid-template-columns:1fr auto;\n  gap:20px;\n  align-items:start;\n}\n\n.confirmed-banner strong{\n  color:var(--skandi-blue);\n  font-size:13px;\n}\n\n.confirmed-banner p{\n  color:var(--skandi-body);\n  font-size:10px;\n  margin-top:3px;\n}\n\n.confirmed-pill{\n  background:var(--skandi-blue);\n  color:#fff;\n  border-radius:999px;\n  padding:6px 11px;\n  font-size:9px;\n  font-weight:700;\n  letter-spacing:.08em;\n  text-transform:uppercase;\n}\n\n.info-columns{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:40px;\n  margin-bottom:28px;\n}\n\n#pax_name_headline{\n  font-weight:700;\n  font-size:13px;\n  margin-bottom:5px;\n}\n\n.meta-data-table{\n  width:100%;\n  border-collapse:collapse;\n}\n\n.meta-data-table td{\n  padding:2px 0;\n  vertical-align:top;\n  font-size:11px;\n}\n\n.meta-data-table td.label{\n  width:45%;\n  color:var(--skandi-body);\n}\n\n.meta-data-table td.value{\n  font-weight:700;\n  text-align:left;\n  overflow-wrap:anywhere;\n}\n\n.pnr-highlight{\n  font-size:14px!important;\n  color:var(--skandi-blue)!important;\n  letter-spacing:.04em;\n}\n\n.section-header{\n  font-size:13px;\n  font-weight:700;\n  color:var(--skandi-blue);\n  border-bottom:2px solid var(--skandi-blue);\n  padding-bottom:2px;\n  margin-top:24px;\n  margin-bottom:8px;\n  display:flex;\n  justify-content:space-between;\n  align-items:flex-end;\n  gap:18px;\n}\n\n.section-subtitle{\n  font-size:10px;\n  color:#444;\n  font-weight:400;\n  text-align:right;\n}\n\n.data-table{\n  width:100%;\n  border-collapse:collapse;\n  margin-bottom:12px;\n}\n\n.data-table td{\n  padding:4px 0;\n  vertical-align:top;\n}\n\n.data-table td.col-label{\n  width:15%;\n  color:#444;\n}\n\n.data-table td.col-main{\n  width:40%;\n  font-weight:700;\n}\n\n.data-table td.col-date{\n  width:20%;\n}\n\n.data-table td.col-time{\n  width:25%;\n  font-weight:700;\n}\n\n.segment-note{\n  background:var(--skandi-panel);\n  border-radius:8px;\n  padding:8px 10px;\n  color:#444;\n  font-size:10px;\n  margin:4px 0 10px;\n}\n\n.segment-supplier{\n  font-size:10px;\n  color:#444;\n  margin-top:-4px;\n  margin-bottom:10px;\n}\n\n.split-layout{\n  display:grid;\n  grid-template-columns:1.2fr .8fr;\n  gap:40px;\n}\n\n.items-list-table,.price-table{\n  width:100%;\n  border-collapse:collapse;\n}\n\n.items-list-table td,.price-table td{\n  padding:3px 0;\n  border-bottom:1px solid #e0e0e0;\n  vertical-align:top;\n}\n\n.items-list-table tr:last-child td,.price-table tr:last-child td{\n  border-bottom:none;\n}\n\n.price-table td.amount{\n  text-align:right;\n  font-weight:700;\n}\n\n.price-table tr.total-row td{\n  border-top:1px solid #000;\n  font-weight:700;\n  font-size:13px;\n  padding-top:6px;\n}\n\n.qr-wrapper{\n  display:flex;\n  justify-content:flex-start;\n  margin-top:20px;\n}\n\n.qr-fallback{\n  border:1px solid var(--skandi-border);\n  border-radius:8px;\n  padding:10px;\n  font-size:10px;\n  color:#444;\n}\n\n.legal-section{\n  margin-top:30px;\n}\n\n.legal-grid{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:24px;\n}\n\n.legal-box{\n  border:1px solid var(--skandi-border);\n  padding:10px 12px;\n  min-height:88px;\n}\n\n.legal-box h3{\n  font-size:12px;\n  color:var(--skandi-blue);\n  margin-bottom:5px;\n}\n\n.legal-box p,.legal-box li{\n  font-size:10px;\n  color:#444;\n  line-height:1.5;\n}\n\n.legal-box ul{\n  padding-left:16px;\n}\n\n.notice-container{\n  border-top:2px solid var(--skandi-blue);\n  margin-top:32px;\n  padding-top:8px;\n}\n\n.notice-grid{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:40px;\n  margin-bottom:15px;\n}\n\n.notice-title{\n  font-size:13px;\n  font-weight:700;\n  color:var(--skandi-blue);\n  margin-bottom:5px;\n}\n\n.footer-text{\n  font-size:10px;\n  color:#444;\n  margin-top:12px;\n}\n\n.validation-warning{\n  border:2px solid #b00020;\n  padding:10px;\n  margin-bottom:18px;\n  color:#b00020;\n  font-weight:700;\n  font-size:11px;\n}\n\n@media print{\n  @page{\n    size:letter;\n    margin:.42in;\n  }\n\n  body{\n    padding:0;\n    margin:0;\n    background:#fff;\n  }\n\n  .document-container{\n    max-width:100%;\n  }\n\n  .section-header,\n  .split-layout,\n  .notice-container,\n  .legal-section{\n    page-break-inside:avoid;\n  }\n}\n</style>\n</head>\n\n<body>\n\n<div class=\"document-container\">\n\n  <div id=\"validation_warning\" class=\"validation-warning hidden\"></div>\n\n  <header class=\"header-section\">\n    <img id=\"brand_logo\" src=\"https://static.wixstatic.com/media/394052_0e4f0c0da11443688a30b3e688c619c6~mv2.png\" alt=\"SKANDI Travels Logo\" class=\"brand-logo\">\n    <div class=\"document-title-block\">\n      <h1 class=\"document-title\">Booking Confirmation</h1>\n      <h2>Travel Itinerary</h2>\n      <div class=\"document-subtitle\">\n        Confirmed booking summary. Tickets, boarding passes and supplier vouchers may be issued separately unless included below.\n      </div>\n    </div>\n  </header>\n\n  <section class=\"confirmed-banner\">\n    <div>\n      <strong>Confirmed Booking</strong>\n      <p>\n        This PDF is issued after SKANDI Travels has confirmed the booking. Please review all traveler names,\n        supplier details, travel dates, payment details, cancellation terms and document requirements.\n      </p>\n    </div>\n    <div class=\"confirmed-pill\">Confirmed</div>\n  </section>\n\n  <section class=\"info-columns\">\n    <div>\n      <div id=\"pax_name_headline\">----</div>\n      <div id=\"pax_address_line1\">----</div>\n      <div id=\"pax_address_line2\">----</div>\n    </div>\n\n    <div>\n      <table class=\"meta-data-table\">\n        <tr><td class=\"label\">Booking reference:</td><td class=\"value pnr-highlight\" id=\"lbl_pnr_code\">------</td></tr>\n        <tr><td class=\"label\">Booking date:</td><td class=\"value\" id=\"lbl_booking_date\">-----</td></tr>\n        <tr><td class=\"label\">Document created:</td><td class=\"value\" id=\"lbl_created_date\">-----</td></tr>\n        <tr><td class=\"label\">Booked via:</td><td class=\"value\" id=\"lbl_booking_channel\">-----</td></tr>\n        <tr><td class=\"label\">Confirmation status:</td><td class=\"value\">Confirmed</td></tr>\n        <tr><td class=\"label\">Telephone:</td><td class=\"value\" id=\"lbl_agency_phone\">-----</td></tr>\n        <tr><td class=\"label\">Website:</td><td class=\"value\" id=\"lbl_agency_url\">-----</td></tr>\n      </table>\n    </div>\n  </section>\n\n  <main id=\"itinerary_segments_target\"></main>\n\n  <section class=\"split-layout\" style=\"margin-top:30px;\">\n    <div>\n      <div class=\"section-header\">\n        <div>Travelers</div>\n        <div class=\"section-subtitle\">Passengers, documents and selected services</div>\n      </div>\n      <table class=\"items-list-table\" id=\"table_travelers_addons\"></table>\n    </div>\n\n    <div>\n      <div class=\"section-header\">Price Specification</div>\n      <table class=\"price-table\" id=\"table_price_specification\"></table>\n    </div>\n  </section>\n\n  <section class=\"split-layout\">\n    <div>\n      <div id=\"itinerary_master_qrcode\" class=\"qr-wrapper\"></div>\n    </div>\n\n    <div>\n      <div class=\"section-header\">Payment Summary</div>\n      <table class=\"meta-data-table\">\n        <tr><td class=\"label\">Payment status:</td><td class=\"value\" id=\"lbl_payment_status\">-----</td></tr>\n        <tr><td class=\"label\">Amount paid:</td><td class=\"value\" id=\"lbl_amount_paid\">-----</td></tr>\n        <tr><td class=\"label\">Balance due:</td><td class=\"value\" id=\"lbl_balance_due\">-----</td></tr>\n        <tr><td class=\"label\">Payment method:</td><td class=\"value\" id=\"lbl_payment_method\">-----</td></tr>\n        <tr><td class=\"label\">Authorization:</td><td class=\"value\" id=\"lbl_payment_auth\">-----</td></tr>\n      </table>\n    </div>\n  </section>\n\n  <section class=\"legal-section\">\n    <div class=\"section-header\">\n      <div>Supplier & Legal Disclosures</div>\n      <div class=\"section-subtitle\">Required customer receipt details</div>\n    </div>\n\n    <div class=\"legal-grid\">\n      <div class=\"legal-box\">\n        <h3>Agency / Seller Information</h3>\n        <p id=\"agency_disclosure_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>State / Seller of Travel Disclosure</h3>\n        <p id=\"state_disclosure_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Supplier Information</h3>\n        <ul id=\"supplier_disclosure_list\"></ul>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Payment Authorization</h3>\n        <p id=\"authorization_disclosure_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Cancellation / Refund Terms</h3>\n        <p id=\"cancellation_terms_text\">----</p>\n      </div>\n\n      <div class=\"legal-box\">\n        <h3>Limitations / Conditions</h3>\n        <p id=\"limitations_text\">----</p>\n      </div>\n    </div>\n  </section>\n\n  <footer class=\"notice-container\">\n    <div class=\"notice-grid\">\n      <div>\n        <div class=\"notice-title\">Important Information</div>\n        <div class=\"footer-text\" style=\"margin-top:0;\" id=\"important_info_text\">\n          Please verify that each passenger name matches the physical passport exactly, including all given first names and surnames.\n        </div>\n      </div>\n\n      <div>\n        <table class=\"meta-data-table\" style=\"margin-top:5px;\">\n          <tr><td class=\"label\">Mobile Number:</td><td class=\"value\" id=\"lbl_cust_phone\">-----</td></tr>\n          <tr><td class=\"label\">E-mail Address:</td><td class=\"value\" id=\"lbl_cust_email\">-----</td></tr>\n        </table>\n      </div>\n    </div>\n\n    <div class=\"footer-text\" id=\"lbl_baggage_terms_text\">\n      For detailed luggage and baggage allowance restrictions, please review standard terms online.\n    </div>\n\n    <div class=\"footer-text\" id=\"final_document_note\">\n      This PDF confirmation summarizes your confirmed SKANDI Travels booking. Airline tickets, hotel vouchers,\n      transfer vouchers, activity vouchers and travel documents may be issued separately depending on the booked products.\n    </div>\n  </footer>\n\n</div>\n\n<script>\nlet CURRENT_CONFIRMATION_DATA = null;\n\nfunction escapeHTML(value){\n  return String(value ?? \"\")\n    .replaceAll(\"&\",\"&amp;\")\n    .replaceAll(\"<\",\"&lt;\")\n    .replaceAll(\">\",\"&gt;\")\n    .replaceAll('\"',\"&quot;\")\n    .replaceAll(\"'\",\"&#039;\");\n}\n\nfunction setText(id,value){\n  const node=document.getElementById(id);\n  if(node) node.innerText=value ?? \"\";\n}\n\nfunction cleanValue(value){\n  if(value === null || value === undefined) return \"\";\n  if(typeof value === \"boolean\") return value ? \"Yes\" : \"No\";\n  return String(value);\n}\n\nfunction hasValue(value){\n  return cleanValue(value).trim() !== \"\";\n}\n\nfunction money(value,currency){\n  const num=Number(value || 0);\n  const prefix=currency ? `${currency} ` : \"\";\n  return `${prefix}${num.toFixed(2)}`;\n}\n\nfunction pair(label,value){\n  return hasValue(value) ? {label,value} : null;\n}\n\nfunction renderPairs(pairs){\n  const filtered=pairs.filter(Boolean);\n  let rows=\"\";\n\n  for(let i=0;i<filtered.length;i+=2){\n    const a=filtered[i];\n    const b=filtered[i+1];\n\n    rows += `\n      <tr>\n        <td class=\"col-label\">${escapeHTML(a.label)}</td>\n        <td class=\"col-main\">${escapeHTML(cleanValue(a.value))}</td>\n        ${\n          b\n          ? `<td class=\"col-date\">${escapeHTML(b.label)}</td><td class=\"col-time\">${escapeHTML(cleanValue(b.value))}</td>`\n          : `<td class=\"col-date\"></td><td class=\"col-time\"></td>`\n        }\n      </tr>\n    `;\n  }\n\n  return rows;\n}\n\nfunction supplierNameFromSegment(seg){\n  const d=seg.details || {};\n  return seg.supplierName || d.supplierName || d.providerName || d.operatorCarrier || d.carrier || d.hotelName || \"\";\n}\n\nfunction supplierAddressFromSegment(seg){\n  const d=seg.details || {};\n  return seg.supplierAddress || d.supplierAddress || d.hotelAddress || \"\";\n}\n\nfunction renderFlightPairs(seg){\n  const d=seg.details || {};\n  return [\n    pair(\"Depart from\",d.departureStation),\n    pair(\"Date\",d.departureDate),\n    pair(\"Time\",d.departureTime),\n    pair(\"Terminal\",d.departureTerminal),\n    pair(\"Arrive at\",d.arrivalStation),\n    pair(\"Date\",d.arrivalDate),\n    pair(\"Time\",d.arrivalTime),\n    pair(\"Terminal\",d.arrivalTerminal),\n    pair(\"Flight\",d.flightNo || d.flightLine),\n    pair(\"Carrier\",d.carrier || d.operatorCarrier),\n    pair(\"Operating carrier\",d.operatorCarrier),\n    pair(\"Aircraft\",d.aircraft),\n    pair(\"Cabin / fare\",d.cabinClass || d.fareFamily),\n    pair(\"Booking class\",d.bookingClass),\n    pair(\"Fare basis\",d.fareBasis),\n    pair(\"Ticket number\",d.ticketNumber || d.eTicket),\n    pair(\"Seat\",d.seat),\n    pair(\"Baggage\",d.baggage),\n    pair(\"Supplier ref\",d.supplierReference || seg.supplierReference)\n  ];\n}\n\nfunction renderHotelPairs(seg){\n  const d=seg.details || {};\n  return [\n    pair(\"Destination\",d.resortZone || d.destination),\n    pair(\"Hotel\",d.hotelName),\n    pair(\"Address\",d.hotelAddress),\n    pair(\"Telephone\",d.hotelPhone),\n    pair(\"Check-in\",d.checkIn),\n    pair(\"Check-out\",d.checkOut),\n    pair(\"Room\",d.roomType),\n    pair(\"Meal plan\",d.mealPlanBasis || d.boardBasis),\n    pair(\"Nights\",d.nightsCount),\n    pair(\"Voucher\",d.voucherRef || d.supplierReference),\n    pair(\"Supplier ref\",d.supplierReference || seg.supplierReference)\n  ];\n}\n\nfunction renderTransferPairs(seg){\n  const d=seg.details || {};\n  return [\n    pair(\"Pickup\",d.pickupPoint),\n    pair(\"Pickup date\",d.pickupDate || seg.dateDisplay),\n    pair(\"Pickup time\",d.pickupTime || seg.timeDisplay),\n    pair(\"Drop-off\",d.dropoffPoint),\n    pair(\"Vehicle\",d.vehicleType),\n    pair(\"Provider\",d.providerName),\n    pair(\"Transfer ref\",d.transferRef || d.voucherRef || d.supplierReference),\n    pair(\"Notes\",d.notes)\n  ];\n}\n\nfunction renderTourPairs(seg){\n  const d=seg.details || {};\n  return [\n    pair(\"Activity\",d.tourName || seg.title),\n    pair(\"Activity date\",d.activityDate || seg.dateDisplay),\n    pair(\"Activity time\",d.activityTime || seg.timeDisplay),\n    pair(\"Meeting point\",d.meetingLocation),\n    pair(\"Duration\",d.duration),\n    pair(\"Provider\",d.providerName),\n    pair(\"Voucher\",d.voucherRef || d.supplierReference),\n    pair(\"Notes\",d.notes)\n  ];\n}\n\nfunction renderInsurancePairs(seg){\n  const d=seg.details || {};\n  return [\n    pair(\"Product\",d.productName || seg.title),\n    pair(\"Provider\",d.providerName),\n    pair(\"Policy number\",d.policyNumber),\n    pair(\"Coverage\",d.coverageSummary),\n    pair(\"Effective from\",d.effectiveFrom),\n    pair(\"Effective to\",d.effectiveTo)\n  ];\n}\n\nfunction renderCarPairs(seg){\n  const d=seg.details || {};\n  return [\n    pair(\"Pickup\",d.pickupLocation),\n    pair(\"Pickup date\",d.pickupDate),\n    pair(\"Pickup time\",d.pickupTime),\n    pair(\"Return\",d.returnLocation),\n    pair(\"Return date\",d.returnDate),\n    pair(\"Return time\",d.returnTime),\n    pair(\"Vehicle\",d.vehicleClass || d.vehicleType),\n    pair(\"Provider\",d.providerName),\n    pair(\"Confirmation\",d.confirmationNumber || d.supplierReference)\n  ];\n}\n\nfunction renderGenericPairs(seg){\n  const d=seg.details || {};\n\n  if(Array.isArray(seg.fields)){\n    return seg.fields.map(item=>pair(item.label,item.value));\n  }\n\n  return Object.keys(d).map(key=>{\n    const label=key\n      .replace(/([A-Z])/g,\" $1\")\n      .replace(/^./,m=>m.toUpperCase());\n    return pair(label,d[key]);\n  });\n}\n\nfunction renderSegment(seg){\n  const type=String(seg.type || \"generic\").toLowerCase();\n  const title=seg.headerTitle || seg.title || `${type.charAt(0).toUpperCase()+type.slice(1)} Details`;\n  const subtitle=seg.headerSubtitle || seg.subtitle || \"\";\n\n  let pairs=[];\n\n  if(type === \"flight\") pairs=renderFlightPairs(seg);\n  else if(type === \"hotel\" || type === \"accommodation\") pairs=renderHotelPairs(seg);\n  else if(type === \"transfer\") pairs=renderTransferPairs(seg);\n  else if(type === \"tour\" || type === \"activity\" || type === \"excursion\") pairs=renderTourPairs(seg);\n  else if(type === \"insurance\") pairs=renderInsurancePairs(seg);\n  else if(type === \"car\" || type === \"rentalcar\" || type === \"rental_car\") pairs=renderCarPairs(seg);\n  else pairs=renderGenericPairs(seg);\n\n  const d=seg.details || {};\n  const notes=[\n    d.notes,\n    seg.notes,\n    seg.cancellationPolicy ? `Cancellation: ${seg.cancellationPolicy}` : \"\",\n    seg.refundRule ? `Refund rule: ${seg.refundRule}` : \"\",\n    seg.changeRule ? `Change rule: ${seg.changeRule}` : \"\"\n  ].filter(hasValue);\n\n  const supplierName=supplierNameFromSegment(seg);\n  const supplierAddress=supplierAddressFromSegment(seg);\n\n  return `\n    <section class=\"segment-block\">\n      <div class=\"section-header\">\n        <div>${escapeHTML(title)}</div>\n        <div class=\"section-subtitle\">${escapeHTML(subtitle)}</div>\n      </div>\n\n      <table class=\"data-table\">${renderPairs(pairs)}</table>\n\n      ${notes.length ? `<div class=\"segment-note\">${notes.map(escapeHTML).join(\"<br>\")}</div>` : \"\"}\n\n      ${\n        supplierName || supplierAddress\n        ? `<div class=\"segment-supplier\"><strong>Supplier:</strong> ${escapeHTML(supplierName || \"Not provided\")}${supplierAddress ? ` · ${escapeHTML(supplierAddress)}` : \"\"}</div>`\n        : \"\"\n      }\n    </section>\n  `;\n}\n\nfunction renderSegments(data){\n  const target=document.getElementById(\"itinerary_segments_target\");\n  const segments=data.segments || [];\n\n  if(!segments.length){\n    target.innerHTML=`\n      <div class=\"section-header\">\n        <div>Itinerary</div>\n        <div class=\"section-subtitle\">No segments provided</div>\n      </div>\n      <div class=\"segment-note\">No flight, hotel, transfer, tour or service segments were provided.</div>\n    `;\n    return;\n  }\n\n  target.innerHTML=segments.map(renderSegment).join(\"\");\n}\n\nfunction renderTravelersAndAncillaries(data){\n  const target=document.getElementById(\"table_travelers_addons\");\n  const customer=data.customer || {};\n  const travelers=(data.travelers && data.travelers.length)\n    ? data.travelers\n    : [{name:customer.name,type:\"Traveler\",documentStatus:\"Not provided\"}];\n\n  let html=\"\";\n\n  travelers.forEach((traveler,index)=>{\n    html += `\n      <tr>\n        <td style=\"font-weight:bold;color:#000;\">${escapeHTML(traveler.name || `Traveler ${index+1}`)}</td>\n        <td style=\"font-weight:bold;\">${escapeHTML(traveler.type || traveler.passengerType || \"\")}</td>\n      </tr>\n    `;\n\n    [\n      pair(\"Document / APIS Status\",traveler.documentStatus || traveler.apisStatus),\n      pair(\"Nationality\",traveler.nationality),\n      pair(\"Date of birth\",traveler.dateOfBirth),\n      pair(\"Loyalty / Known Traveler\",traveler.loyalty || traveler.frequentFlyer),\n      pair(\"Seat\",traveler.seat),\n      pair(\"Baggage\",traveler.baggage)\n    ].filter(Boolean).forEach(item=>{\n      html += `\n        <tr>\n          <td style=\"color:#444;padding-left:10px;\">${escapeHTML(item.label)}</td>\n          <td style=\"font-weight:bold;\">${escapeHTML(cleanValue(item.value))}</td>\n        </tr>\n      `;\n    });\n  });\n\n  (data.ancillaries || []).forEach(item=>{\n    const price=hasValue(item.price) ? ` · ${money(item.price,data.prices?.currency)}` : \"\";\n    html += `\n      <tr>\n        <td style=\"color:#444;padding-left:10px;\">${escapeHTML(item.name || \"Service\")}</td>\n        <td style=\"font-weight:bold;\">${escapeHTML(cleanValue(item.statusValue || item.status || \"Included\"))}${escapeHTML(price)}</td>\n      </tr>\n    `;\n  });\n\n  target.innerHTML=html;\n}\n\nfunction renderPrices(data){\n  const target=document.getElementById(\"table_price_specification\");\n  const prices=data.prices || {};\n  const currency=prices.currency || \"\";\n  let html=\"\";\n\n  (prices.items || []).forEach(priceLine=>{\n    html += `\n      <tr>\n        <td>${escapeHTML(priceLine.label || \"Price item\")}</td>\n        <td class=\"amount\">${money(priceLine.value,currency)}</td>\n      </tr>\n    `;\n  });\n\n  html += `\n    <tr class=\"total-row\">\n      <td>Total Price</td>\n      <td class=\"amount\">${money(prices.totalSum,currency)}</td>\n    </tr>\n    <tr>\n      <td style=\"font-weight:bold;padding-top:4px;\">Amount Paid</td>\n      <td class=\"amount\" style=\"padding-top:4px;color:#022e64;\">${money(prices.totalPaid,currency)}</td>\n    </tr>\n  `;\n\n  if(Number(prices.balanceDue || 0) > 0){\n    html += `\n      <tr>\n        <td style=\"font-weight:bold;\">Balance Due</td>\n        <td class=\"amount\">${money(prices.balanceDue,currency)}</td>\n      </tr>\n    `;\n  }\n\n  target.innerHTML=html;\n}\n\nfunction collectSuppliers(data){\n  const suppliers=[];\n\n  (data.segments || []).forEach(seg=>{\n    const name=supplierNameFromSegment(seg);\n    const address=supplierAddressFromSegment(seg);\n    const reference=seg.supplierReference || seg.details?.supplierReference || seg.details?.voucherRef || seg.details?.ticketNumber || \"\";\n\n    if(name || address || reference){\n      suppliers.push({name,address,reference});\n    }\n  });\n\n  if(Array.isArray(data.suppliers)){\n    data.suppliers.forEach(item=>suppliers.push(item));\n  }\n\n  const seen=new Set();\n\n  return suppliers.filter(item=>{\n    const key=[item.name,item.address,item.reference].join(\"|\");\n    if(seen.has(key)) return false;\n    seen.add(key);\n    return true;\n  });\n}\n\nfunction getStateDisclosure(data){\n  const state=String(\n    data.compliance?.state ||\n    data.customer?.billingState ||\n    data.customer?.residenceState ||\n    \"\"\n  ).toUpperCase();\n\n  const reg=data.compliance?.registrationNumber || \"\";\n\n  const map={\n    NY:\"New York Truth in Travel disclosures apply. This confirmation provides the travel promoter/seller contact details, payment details, supplier/service descriptions, cancellation/refund terms and limitations/conditions for the confirmed travel services.\",\n    CA:`California Seller of Travel disclosure applies where required. Registration number: ${reg || \"[ADD CA SOT NUMBER]\"}. Registration as a seller of travel does not constitute approval by the State of California.`,\n    FL:`Florida Seller of Travel disclosure applies where required. ${data.agency?.legalName || \"SKANDI Travels\"} is registered with the State of Florida as a Seller of Travel Registration No. ${reg || \"[ADD FL SOT NUMBER]\"}.`,\n    WA:`Washington Seller of Travel disclosure applies where required. Sellers of Travel endorsement / registration: ${reg || \"[ADD WA SELLER OF TRAVEL ENDORSEMENT]\"}.`,\n    HI:`Hawaii travel agency disclosure applies where required. Registration number: ${reg || \"[ADD HI REGISTRATION NUMBER]\"}.`\n  };\n\n  return map[state] || \"\";\n}\n\nfunction renderLegal(data){\n  const agency=data.agency || {};\n  const booking=data.booking || {};\n  const customer=data.customer || {};\n  const prices=data.prices || {};\n  const payment=data.payment || {};\n  const compliance=data.compliance || {};\n\n  const agencyText =\n    compliance.agencyDisclosureText ||\n    [\n      agency.legalName || \"SKANDI Travels\",\n      agency.address,\n      agency.phone || booking.agencyPhone,\n      agency.website || booking.agencyUrl\n    ].filter(hasValue).join(\" · \");\n\n  setText(\"agency_disclosure_text\",agencyText || \"SKANDI Travels agency information not provided.\");\n\n  const stateText =\n    compliance.stateDisclosureText ||\n    compliance.sellerOfTravelText ||\n    getStateDisclosure(data) ||\n    \"No state-specific Seller of Travel disclosure has been provided for this booking.\";\n\n  setText(\"state_disclosure_text\",stateText);\n\n  const supplierList=document.getElementById(\"supplier_disclosure_list\");\n  const suppliers=collectSuppliers(data);\n\n  supplierList.innerHTML=suppliers.length\n    ? suppliers.map(item=>`\n      <li>\n        ${escapeHTML(item.name || \"Supplier not named\")}\n        ${item.address ? ` · ${escapeHTML(item.address)}` : \"\"}\n        ${item.reference ? ` · Ref: ${escapeHTML(item.reference)}` : \"\"}\n      </li>\n    `).join(\"\")\n    : `<li>No supplier details were provided.</li>`;\n\n  const total=money(prices.totalSum,prices.currency);\n  const last4=payment.cardLast4 || data.authorization?.cardLast4 || \"\";\n  const authText =\n    data.authorization?.text ||\n    compliance.authorizationText ||\n    `Customer authorized SKANDI Travels to process the selected payment method for ${total}${last4 ? ` using card ending in ${last4}` : \"\"}. Individual charges may appear from SKANDI Travels or from the respective travel suppliers.`;\n\n  setText(\"authorization_disclosure_text\",authText);\n\n  setText(\n    \"cancellation_terms_text\",\n    compliance.cancellationTermsText ||\n    data.cancellationTerms ||\n    \"Cancellation, change and refund rights are governed by SKANDI Travels terms and the applicable airline, hotel, transfer, activity and supplier rules shown or referenced at the time of booking.\"\n  );\n\n  setText(\n    \"limitations_text\",\n    compliance.limitationsText ||\n    data.limitationsText ||\n    \"Traveler is responsible for valid passport, visa, transit, health, vaccination and entry documentation. Schedule changes, supplier changes, weather, airport disruption, force majeure, government action and operational restrictions may affect travel services.\"\n  );\n}\n\nfunction renderQr(data){\n  const target=document.getElementById(\"itinerary_master_qrcode\");\n  const booking=data.booking || {};\n  const customer=data.customer || {};\n  const qrString=[\n    booking.pnr || booking.bookingReference || \"BOOKING\",\n    customer.name || \"TRAVELER\",\n    booking.createdDate || \"\"\n  ].join(\"-\").replace(/\\s+/g,\"\");\n\n  target.innerHTML=\"\";\n\n  if(typeof QRCode !== \"undefined\"){\n    new QRCode(target,{\n      text:qrString,\n      width:90,\n      height:90,\n      colorDark:\"#022e64\",\n      colorLight:\"#ffffff\",\n      correctLevel:QRCode.CorrectLevel.M\n    });\n  }else{\n    target.innerHTML=`<div class=\"qr-fallback\">QR unavailable<br>${escapeHTML(booking.pnr || \"\")}</div>`;\n  }\n}\n\nfunction validateConfirmationData(data){\n  const missing=[];\n\n  if(!hasValue(data.customer?.name)) missing.push(\"customer.name\");\n  if(!hasValue(data.booking?.pnr) && !hasValue(data.booking?.bookingReference)) missing.push(\"booking.pnr or booking.bookingReference\");\n  if(!hasValue(data.booking?.bookingDate)) missing.push(\"booking.bookingDate\");\n  if(!hasValue(data.booking?.createdDate)) missing.push(\"booking.createdDate\");\n  if(!hasValue(data.agency?.legalName)) missing.push(\"agency.legalName\");\n  if(!hasValue(data.agency?.phone) && !hasValue(data.booking?.agencyPhone)) missing.push(\"agency.phone or booking.agencyPhone\");\n  if(!Array.isArray(data.segments) || !data.segments.length) missing.push(\"segments\");\n  if(!hasValue(data.prices?.currency)) missing.push(\"prices.currency\");\n  if(data.prices?.totalSum === undefined) missing.push(\"prices.totalSum\");\n  if(data.prices?.totalPaid === undefined) missing.push(\"prices.totalPaid\");\n  if(!hasValue(data.compliance?.stateDisclosureText) && !hasValue(getStateDisclosure(data))) missing.push(\"compliance.stateDisclosureText\");\n  if(!hasValue(data.compliance?.cancellationTermsText) && !hasValue(data.cancellationTerms)) missing.push(\"compliance.cancellationTermsText\");\n  if(!hasValue(data.authorization?.text) && !hasValue(data.compliance?.authorizationText)) missing.push(\"authorization.text or compliance.authorizationText\");\n\n  const warning=document.getElementById(\"validation_warning\");\n\n  if(missing.length){\n    warning.classList.remove(\"hidden\");\n    warning.innerText=`PDF CONFIRMATION WARNING - Missing required production data: ${missing.join(\", \")}`;\n  }else{\n    warning.classList.add(\"hidden\");\n    warning.innerText=\"\";\n  }\n}\n\nfunction normalizeConfirmationData(raw){\n  const data=raw && typeof raw === \"object\" ? raw : {};\n\n  data.document=data.document || {};\n  data.customer=data.customer || {};\n  data.booking=data.booking || {};\n  data.agency=data.agency || {};\n  data.prices=data.prices || {};\n  data.payment=data.payment || {};\n  data.compliance=data.compliance || {};\n  data.authorization=data.authorization || {};\n  data.travelers=Array.isArray(data.travelers) ? data.travelers : [];\n  data.segments=Array.isArray(data.segments) ? data.segments : [];\n  data.ancillaries=Array.isArray(data.ancillaries) ? data.ancillaries : [];\n\n  if(data.prices.balanceDue === undefined){\n    data.prices.balanceDue=Math.max(0,Number(data.prices.totalSum || 0)-Number(data.prices.totalPaid || 0));\n  }\n\n  return data;\n}\n\nfunction synchronizeTravelDocument(rawData){\n  const data=normalizeConfirmationData(rawData);\n  CURRENT_CONFIRMATION_DATA=data;\n\n  validateConfirmationData(data);\n\n  const customer=data.customer || {};\n  const booking=data.booking || {};\n  const agency=data.agency || {};\n  const prices=data.prices || {};\n  const payment=data.payment || {};\n\n  if(agency.logoUrl){\n    document.getElementById(\"brand_logo\").src=agency.logoUrl;\n  }\n\n  setText(\"pax_name_headline\",customer.name || \"\");\n  setText(\"pax_address_line1\",customer.addressLine1 || \"\");\n  setText(\"pax_address_line2\",customer.addressLine2 || \"\");\n\n  setText(\"lbl_pnr_code\",booking.pnr || booking.bookingReference || \"\");\n  setText(\"lbl_booking_date\",booking.bookingDate || \"\");\n  setText(\"lbl_created_date\",booking.createdDate || \"\");\n  setText(\"lbl_booking_channel\",booking.channel || \"\");\n  setText(\"lbl_agency_phone\",agency.phone || booking.agencyPhone || \"\");\n  setText(\"lbl_agency_url\",agency.website || booking.agencyUrl || \"\");\n\n  setText(\"lbl_cust_phone\",customer.mobile || customer.phone || \"\");\n  setText(\"lbl_cust_email\",customer.email || \"\");\n\n  setText(\"lbl_payment_status\",prices.paymentStatus || booking.paymentStatus || \"Paid / Confirmed\");\n  setText(\"lbl_amount_paid\",money(prices.totalPaid,prices.currency));\n  setText(\"lbl_balance_due\",money(prices.balanceDue,prices.currency));\n  setText(\"lbl_payment_method\",payment.method || payment.brand || \"\");\n  setText(\"lbl_payment_auth\",payment.authorizationId || payment.chargeId || payment.status || \"\");\n\n  setText(\n    \"important_info_text\",\n    data.importantInfo ||\n    \"Please verify that each passenger name matches the physical passport exactly, including all given first names and surnames. Confirm that your registered mobile phone number and email address are valid before travel.\"\n  );\n\n  setText(\n    \"lbl_baggage_terms_text\",\n    data.baggageTermsText ||\n    `For detailed baggage allowance policies and airport guidelines, please visit ${(agency.website || booking.agencyUrl || \"SKANDI Travels\")}/baggage`\n  );\n\n  setText(\n    \"final_document_note\",\n    data.finalDocumentNote ||\n    \"This PDF confirmation summarizes your confirmed SKANDI Travels booking. Airline tickets, hotel vouchers, transfer vouchers, activity vouchers and travel documents may be issued separately depending on the booked products.\"\n  );\n\n  renderSegments(data);\n  renderTravelersAndAncillaries(data);\n  renderPrices(data);\n  renderLegal(data);\n  renderQr(data);\n}\n\nwindow.onmessage=function(event){\n  const message=event.data || {};\n\n  if(message.type === \"PDF_BOOKING_CONFIRMATION_DATA\"){\n    synchronizeTravelDocument(message.payload || message.data || {});\n  }\n};\n\nif(window.SKANDI_PDF_CONFIRMATION_DATA){\n  synchronizeTravelDocument(window.SKANDI_PDF_CONFIRMATION_DATA);\n}\n\nwindow.parent.postMessage({\n  type:\"PDF_BOOKING_CONFIRMATION_HTML_READY\"\n},\"*\");\n</script>\n\n</body>\n</html>";

const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = (v) => Array.isArray(v) ? v : [];
const text = (v, n = 4000) => String(v ?? "").trim().slice(0, n);
const upper = (v, n = 4000) => text(v, n).toUpperCase();
const number = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const isoDate = (v) => text(v, 40).slice(0, 10);
const isoTime = (v) => {
  const s = text(v, 60);
  if (!s) return "";
  const m = s.match(/T(\d{2}:\d{2})/) || s.match(/\b(\d{2}:\d{2})\b/);
  return m ? m[1] : s.slice(0, 5);
};
const safeJson = (value) => JSON.stringify(value)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

function passengerName(p = {}) {
  return text(
    p.display_name ||
    p.displayName ||
    [p.first_name || p.firstName, p.last_name || p.lastName].filter(Boolean).join(" ")
  , 300);
}

function segmentType(row = {}) {
  const raw = upper(row.segment_type || row.segmentType || row.component_type || row.componentType, 80);
  if (raw.includes("FLIGHT") || raw.includes("AIR")) return "flight";
  if (raw.includes("HOTEL") || raw.includes("STAY") || raw.includes("ACCOM")) return "hotel";
  if (raw.includes("TRANSFER")) return "transfer";
  if (raw.includes("TOUR") || raw.includes("ACTIVITY") || raw.includes("EXCURSION") || raw.includes("GUIDED")) return "tour";
  if (raw.includes("CAR") || raw.includes("RENTAL")) return "car";
  if (raw.includes("INSURANCE")) return "insurance";
  return "generic";
}

function normalizedSegment(row = {}, kind = "") {
  const p = obj(row.payload);
  const type = kind || segmentType(row);
  const supplier = text(row.supplier || p.providerName || p.supplierName || "SKANDI", 300);
  const supplierReference = text(row.supplier_reference || row.supplierReference || p.supplierReference || p.voucherRef || "", 300);

  if (type === "flight") {
    return {
      type,
      title: text(row.title || p.title || "Flight"),
      headerSubtitle: [upper(row.origin || p.origin, 12), upper(row.destination || p.destination, 12)].filter(Boolean).join(" → "),
      supplierReference,
      supplierName: supplier,
      details: {
        departureStation: text(p.departureStation || p.originName || row.origin, 300),
        departureDate: isoDate(row.departure_date || row.departureDate || p.departureDate || p.departingAt),
        departureTime: isoTime(row.departure_time || row.departureTime || p.departureTime || p.departingAt),
        departureTerminal: text(p.departureTerminal || p.terminal, 80),
        arrivalStation: text(p.arrivalStation || p.destinationName || row.destination, 300),
        arrivalDate: isoDate(row.return_date || row.arrivalDate || p.arrivalDate || p.arrivingAt),
        arrivalTime: isoTime(row.arrival_time || row.arrivalTime || p.arrivalTime || p.arrivingAt),
        arrivalTerminal: text(p.arrivalTerminal, 80),
        flightNo: text(row.flight_number || row.flightNumber || p.flightNumber || p.serviceNumber, 80),
        carrier: text(p.carrierName || p.marketingCarrier || supplier, 300),
        operatorCarrier: text(p.operatingCarrier || p.operatorCarrier || p.operatedBy, 300),
        aircraft: text(p.aircraft || p.aircraftType, 160),
        cabinClass: text(row.cabin || p.cabin || p.cabinClass, 160),
        bookingClass: text(row.booking_class || row.bookingClass || p.bookingClass, 80),
        fareFamily: text(p.fareFamily, 160),
        fareBasis: text(p.fareBasis, 160),
        ticketNumber: text(p.ticketNumber || p.eTicket, 160),
        seat: text(p.seat || p.seatNumber, 40),
        baggage: text(p.baggage || p.baggageAllowance, 300),
        supplierReference
      }
    };
  }

  if (type === "hotel") {
    return {
      type,
      title: text(row.title || row.hotel_name || row.hotelName || p.hotelName || "Hotel"),
      supplierReference,
      supplierName: supplier,
      details: {
        destination: text(p.destination || p.city, 300),
        hotelName: text(row.hotel_name || row.hotelName || p.hotelName || row.title, 300),
        hotelAddress: text(p.hotelAddress || p.address, 800),
        hotelPhone: text(p.hotelPhone || p.phone, 100),
        checkIn: text(p.checkIn || p.startDate || row.departure_date || row.startDate, 80),
        checkOut: text(p.checkOut || p.endDate || row.return_date || row.endDate, 80),
        roomType: text(row.room_type || row.roomType || p.roomType, 300),
        boardBasis: text(row.board_basis || row.boardBasis || p.boardBasis, 160),
        nightsCount: p.nightsCount ?? p.nights ?? "",
        voucherRef: text(p.voucherRef || supplierReference, 200),
        supplierReference
      }
    };
  }

  if (type === "transfer") {
    return {
      type,
      title: text(row.title || p.title || "Transfer"),
      supplierReference,
      supplierName: supplier,
      dateDisplay: isoDate(p.serviceDate || p.startDate || row.departure_date),
      timeDisplay: isoTime(p.serviceTime || p.pickupTime),
      details: {
        pickupPoint: text(p.pickupPoint || p.pickupLocation || p.origin || row.origin, 600),
        pickupDate: isoDate(p.pickupDate || p.serviceDate || p.startDate || row.departure_date),
        pickupTime: isoTime(p.pickupTime || p.serviceTime),
        dropoffPoint: text(p.dropoffPoint || p.dropoffLocation || p.destination || row.destination, 600),
        vehicleType: text(p.vehicleType || p.vehicleName || p.vehicle, 300),
        providerName: text(p.providerName || supplier, 300),
        transferRef: text(p.transferRef || p.voucherRef || supplierReference, 200),
        supplierReference,
        notes: text(p.notes || p.operationalNotes, 2000)
      }
    };
  }

  if (type === "tour") {
    return {
      type,
      title: text(row.title || row.excursion_name || row.excursionName || p.tourName || p.title || "Tour / Activity"),
      supplierReference,
      supplierName: supplier,
      dateDisplay: isoDate(p.activityDate || p.serviceDate || p.startDate || row.departure_date),
      timeDisplay: isoTime(p.activityTime || p.startTime || p.serviceTime),
      details: {
        tourName: text(row.title || row.excursion_name || row.excursionName || p.tourName || p.title, 500),
        activityDate: isoDate(p.activityDate || p.serviceDate || p.startDate || row.departure_date),
        activityTime: isoTime(p.activityTime || p.startTime || p.serviceTime),
        meetingLocation: text(p.meetingLocation || p.meetingPoint || p.pickupLocation, 600),
        duration: text(p.duration || p.durationText, 160),
        providerName: text(p.providerName || supplier, 300),
        voucherRef: text(p.voucherRef || supplierReference, 200),
        supplierReference,
        notes: text(p.notes || p.operationalNotes, 2000)
      }
    };
  }

  if (type === "car") {
    return {
      type,
      title: text(row.title || p.title || "Car Rental"),
      supplierReference,
      supplierName: supplier,
      details: {
        pickupLocation: text(p.pickupLocation || p.origin, 500),
        pickupDate: isoDate(p.pickupDate || p.startDate),
        pickupTime: isoTime(p.pickupTime),
        returnLocation: text(p.returnLocation || p.destination, 500),
        returnDate: isoDate(p.returnDate || p.endDate),
        returnTime: isoTime(p.returnTime),
        vehicleClass: text(p.vehicleClass || p.vehicleType, 300),
        providerName: text(p.providerName || supplier, 300),
        confirmationNumber: text(p.confirmationNumber || supplierReference, 200)
      }
    };
  }

  return {
    type: "generic",
    title: text(row.title || p.title || row.component_type || row.segment_type || "Service"),
    supplierReference,
    supplierName: supplier,
    details: {
      serviceDate: text(p.serviceDate || p.startDate || row.departure_date, 80),
      status: text(row.status || p.status, 80),
      supplierReference,
      notes: text(p.notes || p.operationalNotes, 2000)
    }
  };
}

function paymentAmounts(booking = {}) {
  const p = obj(booking.payload);
  const total = number(booking.total_amount ?? booking.totalAmount ?? p.totalAmount);
  let paid = p.amountPaid ?? p.totalPaid;
  if (paid === undefined || paid === null || paid === "") {
    const state = String(booking.payment_status || booking.paymentStatus || "").toLowerCase();
    paid = ["paid","captured","payment_authorized","authorized"].includes(state) ? total : 0;
  }
  return {
    total,
    paid: Math.max(0, number(paid)),
    balance: Math.max(0, total - Math.max(0, number(paid)))
  };
}

export function renderBookingConfirmation({
  booking = {},
  passengers = [],
  segments = [],
  components = [],
  documentNumber = "",
  generatedAt = ""
} = {}) {
  const bp = obj(booking.payload);
  const customer = obj(bp.customer);
  const payment = obj(bp.payment);
  const compliance = obj(bp.compliance);
  const authorization = obj(bp.authorization);
  const amounts = paymentAmounts(booking);
  const currency = upper(booking.currency || bp.currency || "USD", 3);

  const normalized = [
    ...arr(segments).map((s) => normalizedSegment(s)),
    ...arr(components).map((c) => normalizedSegment(c))
  ];

  const travelers = arr(passengers).map((p) => {
    const pp = obj(p.payload);
    const club = obj(pp.clubProfile);
    const bagCount = number(pp.baggageCount);
    const bagWeight = number(pp.baggageWeight);
    return {
      name: passengerName(p),
      type: upper(p.pax_type || p.paxType || "ADT", 12),
      documentStatus: text(p.document_status || p.documentStatus || p.apis_status || p.apisStatus, 120),
      nationality: upper(p.nationality, 3),
      dateOfBirth: text(p.date_of_birth || p.dateOfBirth, 30),
      loyalty: text(club.memberNumber || club.member_number || club.tier || pp.frequentFlyer, 160),
      seat: text(p.seat_number || p.seatNumber, 30),
      baggage: bagCount || bagWeight ? `${bagCount || 0} pc${bagCount === 1 ? "" : "s"}${bagWeight ? ` · ${bagWeight} kg` : ""}` : ""
    };
  });

  const data = {
    document: {
      type: "BOOKING_CONFIRMATION",
      number: text(documentNumber, 120),
      createdAt: generatedAt || new Date().toISOString()
    },
    customer: {
      name: text(booking.customer_name || booking.customerName || customer.name, 300),
      addressLine1: text(customer.addressLine1 || bp.addressLine1, 500),
      addressLine2: text(customer.addressLine2 || bp.addressLine2, 500),
      mobile: text(customer.mobile || customer.phone || bp.customerPhone, 100),
      email: text(booking.customer_email || booking.customerEmail || customer.email, 400),
      billingState: text(customer.billingState || bp.billingState, 20),
      residenceState: text(customer.residenceState || bp.residenceState, 20)
    },
    booking: {
      pnr: text(booking.pnr_locator || booking.pnrLocator || booking.booking_reference || booking.bookingReference, 120),
      bookingReference: text(booking.booking_reference || booking.bookingReference, 120),
      bookingDate: isoDate(booking.created_at || booking.createdAt),
      createdDate: isoDate(generatedAt || new Date().toISOString()),
      channel: text(booking.source_channel || booking.sourceChannel || "SKANDI Travels", 160),
      paymentStatus: text(booking.payment_status || booking.paymentStatus, 120),
      agencyPhone: text(bp.agencyPhone || bp.supportPhone, 100),
      agencyUrl: "https://www.skanditravels.com"
    },
    agency: {
      legalName: text(bp.agencyLegalName || "SKANDI Travels", 300),
      address: text(bp.agencyAddress || "", 600),
      phone: text(bp.agencyPhone || bp.supportPhone || "", 100),
      website: "https://www.skanditravels.com",
      logoUrl: "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png"
    },
    travelers,
    segments: normalized,
    ancillaries: arr(bp.ancillaries),
    prices: {
      currency,
      items: arr(bp.priceItems),
      totalSum: amounts.total,
      totalPaid: amounts.paid,
      balanceDue: amounts.balance,
      paymentStatus: text(booking.payment_status || booking.paymentStatus || "")
    },
    payment: {
      method: text(payment.method || payment.brand || bp.paymentMethod, 120),
      brand: text(payment.brand, 120),
      authorizationId: text(payment.authorizationId || payment.chargeId || booking.payment_reference || booking.paymentReference, 200),
      status: text(payment.status || booking.payment_status || booking.paymentStatus, 120),
      cardLast4: text(payment.cardLast4 || "", 8)
    },
    compliance: {
      state: text(compliance.state || customer.billingState || customer.residenceState, 20),
      registrationNumber: text(compliance.registrationNumber || "", 120),
      agencyDisclosureText: text(compliance.agencyDisclosureText || "", 4000),
      stateDisclosureText: text(compliance.stateDisclosureText || compliance.sellerOfTravelText || "", 4000),
      cancellationTermsText: text(compliance.cancellationTermsText || bp.cancellationTermsText || "", 6000),
      limitationsText: text(compliance.limitationsText || bp.limitationsText || "", 6000),
      authorizationText: text(compliance.authorizationText || "", 4000)
    },
    authorization: {
      text: text(authorization.text || bp.authorizationText || "", 4000),
      cardLast4: text(authorization.cardLast4 || payment.cardLast4 || "", 8)
    },
    importantInfo: text(bp.importantInfo || "", 5000),
    baggageTermsText: text(bp.baggageTermsText || "", 5000),
    finalDocumentNote: text(bp.finalDocumentNote || "", 5000),
    cancellationTerms: text(bp.cancellationTerms || "", 6000),
    limitationsText: text(bp.limitationsText || "", 6000)
  };

  const injection = `<script>window.SKANDI_PDF_CONFIRMATION_DATA=${safeJson(data)};</script>`;
  return TEMPLATE.replace("</head>", `${injection}</head>`);
}
