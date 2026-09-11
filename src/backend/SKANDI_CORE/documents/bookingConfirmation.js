// /src/backend/SKANDI_CORE/documents/bookingConfirmation.js
// SKANDI R-006.6 — canonical Booking Confirmation renderer.
// Visual source of truth: user-approved SKANDI PDF Booking Confirmation template.
// Data mapping remains owned by the canonical Reservations core.
// Generated HTML is stored through the PRIVATE Platform Asset Library.

const TEMPLATE = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><title>SKANDI Travels • PDF Booking Confirmation</title><link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap\" rel=\"stylesheet\"><script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js\" crossorigin=\"anonymous\" referrerpolicy=\"no-referrer\"></script><style>*{margin:0;padding:0;box-sizing:border-box;}:root{--skandi-blue:#022e64;--skandi-blue-soft:#285ca8;--skandi-light-blue:#d7e6ff;--skandi-pale-blue:#f6faff;--skandi-panel:#f2f4f8;--skandi-border:#e6e9ee;--skandi-text:#000;--skandi-body:#333;--skandi-muted:#555;--skandi-soft-muted:#6b7280;}html,body{width:100%;min-height:100%;}body{font-family:\"Montserrat\",Arial,sans-serif;margin:0;padding:40px;background:#fff;color:var(--skandi-text);font-size:11px;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.hidden{display:none!important;}.document-container{max-width:8.5in;margin:0 auto;background:#fff;}.header-section{display:flex;padding:22px 30px 28px 22px;background:linear-gradient(135deg,var(--skandi-light-blue),var(--skandi-pale-blue));justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:1px solid var(--skandi-border);}.brand-logo{max-width:220px;height:auto;display:block;}.document-title-block{text-align:right;color:var(--skandi-blue);}.document-title{font-size:26px;font-weight:700;margin:0 0 5px;letter-spacing:-.5px;color:var(--skandi-blue);}.document-title-block h2{font-size:15px;color:var(--skandi-blue);margin:0 0 5px;}.document-subtitle{font-size:10px;color:var(--skandi-muted);font-style:italic;max-width:310px;}.confirmed-banner{border-top:2px solid var(--skandi-blue);border-bottom:1px solid var(--skandi-border);padding:8px 0 10px;margin-bottom:24px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start;}.confirmed-banner strong{color:var(--skandi-blue);font-size:13px;}.confirmed-banner p{color:var(--skandi-body);font-size:10px;margin-top:3px;}.confirmed-pill{background:var(--skandi-blue);color:#fff;border-radius:999px;padding:6px 11px;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}.info-columns{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:28px;}#pax_name_headline{font-weight:700;font-size:13px;margin-bottom:5px;}.meta-data-table{width:100%;border-collapse:collapse;}.meta-data-table td{padding:2px 0;vertical-align:top;font-size:11px;}.meta-data-table td.label{width:45%;color:var(--skandi-body);}.meta-data-table td.value{font-weight:700;text-align:left;overflow-wrap:anywhere;}.pnr-highlight{font-size:14px!important;color:var(--skandi-blue)!important;letter-spacing:.04em;}.section-header{font-size:13px;font-weight:700;color:var(--skandi-blue);border-bottom:2px solid var(--skandi-blue);padding-bottom:2px;margin-top:24px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;}.section-subtitle{font-size:10px;color:#444;font-weight:400;text-align:right;}.data-table{width:100%;border-collapse:collapse;margin-bottom:12px;}.data-table td{padding:4px 0;vertical-align:top;}.data-table td.col-label{width:15%;color:#444;}.data-table td.col-main{width:40%;font-weight:700;}.data-table td.col-date{width:20%;}.data-table td.col-time{width:25%;font-weight:700;}.segment-note{background:var(--skandi-panel);border-radius:8px;padding:8px 10px;color:#444;font-size:10px;margin:4px 0 10px;}.segment-supplier{font-size:10px;color:#444;margin-top:-4px;margin-bottom:10px;}.split-layout{display:grid;grid-template-columns:1.2fr .8fr;gap:40px;}.items-list-table,.price-table{width:100%;border-collapse:collapse;}.items-list-table td,.price-table td{padding:3px 0;border-bottom:1px solid #e0e0e0;vertical-align:top;}.items-list-table tr:last-child td,.price-table tr:last-child td{border-bottom:none;}.price-table td.amount{text-align:right;font-weight:700;}.price-table tr.total-row td{border-top:1px solid #000;font-weight:700;font-size:13px;padding-top:6px;}.qr-wrapper{display:flex;justify-content:flex-start;margin-top:20px;}.qr-fallback{border:1px solid var(--skandi-border);border-radius:8px;padding:10px;font-size:10px;color:#444;}.legal-section{margin-top:30px;}.legal-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}.legal-box{border:1px solid var(--skandi-border);padding:10px 12px;min-height:88px;}.legal-box h3{font-size:12px;color:var(--skandi-blue);margin-bottom:5px;}.legal-box p,.legal-box li{font-size:10px;color:#444;line-height:1.5;}.legal-box ul{padding-left:16px;}.notice-container{border-top:2px solid var(--skandi-blue);margin-top:32px;padding-top:8px;}.notice-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:15px;}.notice-title{font-size:13px;font-weight:700;color:var(--skandi-blue);margin-bottom:5px;}.footer-text{font-size:10px;color:#444;margin-top:12px;}.validation-warning{border:2px solid #b00020;padding:10px;margin-bottom:18px;color:#b00020;font-weight:700;font-size:11px;}@media print{@page{size:letter;margin:.42in;}body{padding:0;margin:0;background:#fff;}.document-container{max-width:100%;}.section-header,.split-layout,.notice-container,.legal-section{page-break-inside:avoid;}}\n</style></head><body><div class=\"document-container\"><div id=\"validation_warning\" class=\"validation-warning hidden\"></div><header class=\"header-section\"><img id=\"brand_logo\" src=\"https://static.wixstatic.com/media/394052_0e4f0c0da11443688a30b3e688c619c6~mv2.png\" alt=\"SKANDI Travels Logo\" class=\"brand-logo\"><div class=\"document-title-block\"><h1 class=\"document-title\">Booking Confirmation</h1><h2>Travel Itinerary</h2><div class=\"document-subtitle\">Confirmed booking summary. Tickets, boarding passes and supplier vouchers may be issued separately unless included below.</div></div></header><section class=\"confirmed-banner\"><div><strong>Confirmed Booking</strong><p>This PDF is issued after SKANDI Travels has confirmed the booking. Please review all traveler names,supplier details, travel dates, payment details, cancellation terms and document requirements.</p></div><div class=\"confirmed-pill\">Confirmed</div></section><section class=\"info-columns\"><div><div id=\"pax_name_headline\">----</div><div id=\"pax_address_line1\">----</div><div id=\"pax_address_line2\">----</div></div><div><table class=\"meta-data-table\"><tr><td class=\"label\">Booking reference:</td><td class=\"value pnr-highlight\" id=\"lbl_pnr_code\">------</td></tr><tr><td class=\"label\">Booking date:</td><td class=\"value\" id=\"lbl_booking_date\">-----</td></tr><tr><td class=\"label\">Document created:</td><td class=\"value\" id=\"lbl_created_date\">-----</td></tr><tr><td class=\"label\">Booked via:</td><td class=\"value\" id=\"lbl_booking_channel\">-----</td></tr><tr><td class=\"label\">Confirmation status:</td><td class=\"value\">Confirmed</td></tr><tr><td class=\"label\">Telephone:</td><td class=\"value\" id=\"lbl_agency_phone\">-----</td></tr><tr><td class=\"label\">Website:</td><td class=\"value\" id=\"lbl_agency_url\">-----</td></tr></table></div></section><main id=\"itinerary_segments_target\"></main><section class=\"split-layout\" style=\"margin-top:30px;\"><div><div class=\"section-header\"><div>Travelers</div><div class=\"section-subtitle\">Passengers, documents and selected services</div></div><table class=\"items-list-table\" id=\"table_travelers_addons\"></table></div><div><div class=\"section-header\">Price Specification</div><table class=\"price-table\" id=\"table_price_specification\"></table></div></section><section class=\"split-layout\"><div><div id=\"itinerary_master_qrcode\" class=\"qr-wrapper\"></div></div><div><div class=\"section-header\">Payment Summary</div><table class=\"meta-data-table\"><tr><td class=\"label\">Payment status:</td><td class=\"value\" id=\"lbl_payment_status\">-----</td></tr><tr><td class=\"label\">Amount paid:</td><td class=\"value\" id=\"lbl_amount_paid\">-----</td></tr><tr><td class=\"label\">Balance due:</td><td class=\"value\" id=\"lbl_balance_due\">-----</td></tr><tr><td class=\"label\">Payment method:</td><td class=\"value\" id=\"lbl_payment_method\">-----</td></tr><tr><td class=\"label\">Authorization:</td><td class=\"value\" id=\"lbl_payment_auth\">-----</td></tr></table></div></section><section class=\"legal-section\"><div class=\"section-header\"><div>Supplier & Legal Disclosures</div><div class=\"section-subtitle\">Required customer receipt details</div></div><div class=\"legal-grid\"><div class=\"legal-box\"><h3>Agency / Seller Information</h3><p id=\"agency_disclosure_text\">----</p></div><div class=\"legal-box\"><h3>State / Seller of Travel Disclosure</h3><p id=\"state_disclosure_text\">----</p></div><div class=\"legal-box\"><h3>Supplier Information</h3><ul id=\"supplier_disclosure_list\"></ul></div><div class=\"legal-box\"><h3>Payment Authorization</h3><p id=\"authorization_disclosure_text\">----</p></div><div class=\"legal-box\"><h3>Cancellation / Refund Terms</h3><p id=\"cancellation_terms_text\">----</p></div><div class=\"legal-box\"><h3>Limitations / Conditions</h3><p id=\"limitations_text\">----</p></div></div></section><footer class=\"notice-container\"><div class=\"notice-grid\"><div><div class=\"notice-title\">Important Information</div><div class=\"footer-text\" style=\"margin-top:0;\" id=\"important_info_text\">Please verify that each passenger name matches the physical passport exactly, including all given first names and surnames.</div></div><div><table class=\"meta-data-table\" style=\"margin-top:5px;\"><tr><td class=\"label\">Mobile Number:</td><td class=\"value\" id=\"lbl_cust_phone\">-----</td></tr><tr><td class=\"label\">E-mail Address:</td><td class=\"value\" id=\"lbl_cust_email\">-----</td></tr></table></div></div><div class=\"footer-text\" id=\"lbl_baggage_terms_text\">For detailed luggage and baggage allowance restrictions, please review standard terms online.</div><div class=\"footer-text\" id=\"final_document_note\">This PDF confirmation summarizes your confirmed SKANDI Travels booking. Airline tickets, hotel vouchers,transfer vouchers, activity vouchers and travel documents may be issued separately depending on the booked products.</div></footer></div><script>let CURRENT_CONFIRMATION_DATA = null;function escapeHTML(value){return String(value ?? \"\").replaceAll(\"&\",\"&amp;\").replaceAll(\"<\",\"&lt;\").replaceAll(\">\",\"&gt;\").replaceAll('\"',\"&quot;\").replaceAll(\"'\",\"&#039;\");}function setText(id,value){const node=document.getElementById(id);if(node) node.innerText=value ?? \"\";}function cleanValue(value){if(value === null || value === undefined) return \"\";if(typeof value === \"boolean\") return value ? \"Yes\" : \"No\";return String(value);}function hasValue(value){return cleanValue(value).trim() !== \"\";}function money(value,currency){const num=Number(value || 0);const prefix=currency ? `${currency} ` : \"\";return `${prefix}${num.toFixed(2)}`;}\nfunction pair(label,value){return hasValue(value) ? {label,value} : null;}function renderPairs(pairs){const filtered=pairs.filter(Boolean);let rows=\"\";for(let i=0;i<filtered.length;i+=2){const a=filtered[i];const b=filtered[i+1];rows += `<tr><td class=\"col-label\">${escapeHTML(a.label)}</td><td class=\"col-main\">${escapeHTML(cleanValue(a.value))}</td>${b? `<td class=\"col-date\">${escapeHTML(b.label)}</td><td class=\"col-time\">${escapeHTML(cleanValue(b.value))}</td>`: `<td class=\"col-date\"></td><td class=\"col-time\"></td>`}</tr>`;}return rows;}function supplierNameFromSegment(seg){const d=seg.details || {};return seg.supplierName || d.supplierName || d.providerName || d.operatorCarrier || d.carrier || d.hotelName || \"\";}function supplierAddressFromSegment(seg){const d=seg.details || {};return seg.supplierAddress || d.supplierAddress || d.hotelAddress || \"\";}function renderFlightPairs(seg){const d=seg.details || {};return [pair(\"Depart from\",d.departureStation),pair(\"Date\",d.departureDate),pair(\"Time\",d.departureTime),pair(\"Terminal\",d.departureTerminal),pair(\"Arrive at\",d.arrivalStation),pair(\"Date\",d.arrivalDate),pair(\"Time\",d.arrivalTime),pair(\"Terminal\",d.arrivalTerminal),pair(\"Flight\",d.flightNo || d.flightLine),pair(\"Carrier\",d.carrier || d.operatorCarrier),pair(\"Operating carrier\",d.operatorCarrier),pair(\"Aircraft\",d.aircraft),pair(\"Cabin / fare\",d.cabinClass || d.fareFamily),pair(\"Booking class\",d.bookingClass),pair(\"Fare basis\",d.fareBasis),pair(\"Ticket number\",d.ticketNumber || d.eTicket),pair(\"Seat\",d.seat),pair(\"Baggage\",d.baggage),pair(\"Supplier ref\",d.supplierReference || seg.supplierReference)];}function renderHotelPairs(seg){\nconst d=seg.details || {};return [pair(\"Destination\",d.resortZone || d.destination),pair(\"Hotel\",d.hotelName),pair(\"Address\",d.hotelAddress),pair(\"Telephone\",d.hotelPhone),pair(\"Check-in\",d.checkIn),pair(\"Check-out\",d.checkOut),pair(\"Room\",d.roomType),pair(\"Meal plan\",d.mealPlanBasis || d.boardBasis),pair(\"Nights\",d.nightsCount),pair(\"Voucher\",d.voucherRef || d.supplierReference),pair(\"Supplier ref\",d.supplierReference || seg.supplierReference)];}function renderTransferPairs(seg){const d=seg.details || {};return [pair(\"Pickup\",d.pickupPoint),pair(\"Pickup date\",d.pickupDate || seg.dateDisplay),pair(\"Pickup time\",d.pickupTime || seg.timeDisplay),pair(\"Drop-off\",d.dropoffPoint),pair(\"Vehicle\",d.vehicleType),pair(\"Provider\",d.providerName),pair(\"Transfer ref\",d.transferRef || d.voucherRef || d.supplierReference),pair(\"Notes\",d.notes)];}function renderTourPairs(seg){const d=seg.details || {};return [pair(\"Activity\",d.tourName || seg.title),pair(\"Activity date\",d.activityDate || seg.dateDisplay),pair(\"Activity time\",d.activityTime || seg.timeDisplay),pair(\"Meeting point\",d.meetingLocation),pair(\"Duration\",d.duration),pair(\"Provider\",d.providerName),pair(\"Voucher\",d.voucherRef || d.supplierReference),pair(\"Notes\",d.notes)];}function renderInsurancePairs(seg){const d=seg.details || {};return [pair(\"Product\",d.productName || seg.title),pair(\"Provider\",d.providerName),pair(\"Policy number\",d.policyNumber),pair(\"Coverage\",d.coverageSummary),pair(\"Effective from\",d.effectiveFrom),pair(\"Effective to\",d.effectiveTo)];}function renderCarPairs(seg){const d=seg.details || {};return [pair(\"Pickup\",d.pickupLocation),pair(\"Pickup date\",d.pickupDate),pair(\"Pickup time\",d.pickupTime),pair(\"Return\",d.returnLocation),pair(\"Return date\",d.returnDate),pair(\"Return time\",d.returnTime),pair(\"Vehicle\",d.vehicleClass || d.vehicleType),pair(\"Provider\",d.providerName),pair(\"Confirmation\",d.confirmationNumber || d.supplierReference)];}function renderGenericPairs(seg){const d=seg.details || {};if(Array.isArray(seg.fields)){return seg.fields.map(item=>pair(item.label,item.value));}return Object.keys(d).map(key=>{const label=key.replace(/([A-Z])/g,\" $1\").replace(/^./,m=>m.toUpperCase());return pair(label,d[key]);});}function renderSegment(seg){const type=String(seg.type || \"generic\").toLowerCase();const title=seg.headerTitle || seg.title || `${type.charAt(0).toUpperCase()+type.slice(1)} Details`;const subtitle=seg.headerSubtitle || seg.subtitle || \"\";let pairs=[];if(type === \"flight\") pairs=renderFlightPairs(seg);else if(type === \"hotel\" || type === \"accommodation\") pairs=renderHotelPairs(seg);else if(type === \"transfer\") pairs=renderTransferPairs(seg);else if(type === \"tour\" || type === \"activity\" || type === \"excursion\") pairs=renderTourPairs(seg);else if(type === \"insurance\") pairs=renderInsurancePairs(seg);else if(type === \"car\" || type === \"rentalcar\" || type === \"rental_car\") pairs=renderCarPairs(seg);else pairs=renderGenericPairs(seg);const d=seg.details || {};const notes=[d.notes,seg.notes,seg.cancellationPolicy ? `Cancellation: ${seg.cancellationPolicy}` : \"\",seg.refundRule ? `Refund rule: ${seg.refundRule}` : \"\",seg.changeRule ? `Change rule: ${seg.changeRule}` : \"\"].filter(hasValue);const supplierName=supplierNameFromSegment(seg);const supplierAddress=supplierAddressFromSegment(seg);return `<section class=\"segment-block\"><div class=\"section-header\"><div>${escapeHTML(title)}</div><div class=\"section-subtitle\">${escapeHTML(subtitle)}</div></div><table class=\"data-table\">${renderPairs(pairs)}</table>${notes.length ? `<div class=\"segment-note\">${notes.map(escapeHTML).join(\"<br>\")}</div>` : \"\"}${supplierName || supplierAddress? `<div class=\"segment-supplier\"><strong>Supplier:</strong> ${escapeHTML(supplierName || \"Not provided\")}${supplierAddress ? ` · ${escapeHTML(supplierAddress)}` : \"\"}</div>`: \"\"}</section>`;}function renderSegments(data){const target=document.getElementById(\"itinerary_segments_target\");\nconst segments=data.segments || [];if(!segments.length){target.innerHTML=`<div class=\"section-header\"><div>Itinerary</div><div class=\"section-subtitle\">No segments provided</div></div><div class=\"segment-note\">No flight, hotel, transfer, tour or service segments were provided.</div>`;return;}target.innerHTML=segments.map(renderSegment).join(\"\");}function renderTravelersAndAncillaries(data){const target=document.getElementById(\"table_travelers_addons\");const customer=data.customer || {};const travelers=(data.travelers && data.travelers.length)? data.travelers: [{name:customer.name,type:\"Traveler\",documentStatus:\"Not provided\"}];let html=\"\";travelers.forEach((traveler,index)=>{html += `<tr><td style=\"font-weight:bold;color:#000;\">${escapeHTML(traveler.name || `Traveler ${index+1}`)}</td><td style=\"font-weight:bold;\">${escapeHTML(traveler.type || traveler.passengerType || \"\")}</td></tr>`;[pair(\"Document / APIS Status\",traveler.documentStatus || traveler.apisStatus),pair(\"Nationality\",traveler.nationality),pair(\"Date of birth\",traveler.dateOfBirth),pair(\"Loyalty / Known Traveler\",traveler.loyalty || traveler.frequentFlyer),pair(\"Seat\",traveler.seat),pair(\"Baggage\",traveler.baggage)].filter(Boolean).forEach(item=>{html += `<tr><td style=\"color:#444;padding-left:10px;\">${escapeHTML(item.label)}</td><td style=\"font-weight:bold;\">${escapeHTML(cleanValue(item.value))}</td></tr>`;});});(data.ancillaries || []).forEach(item=>{const price=hasValue(item.price) ? ` · ${money(item.price,data.prices?.currency)}` : \"\";html += `<tr><td style=\"color:#444;padding-left:10px;\">${escapeHTML(item.name || \"Service\")}</td><td style=\"font-weight:bold;\">${escapeHTML(cleanValue(item.statusValue || item.status || \"Included\"))}${escapeHTML(price)}</td></tr>`;});target.innerHTML=html;}function renderPrices(data){const target=document.getElementById(\"table_price_specification\");const prices=data.prices || {};const currency=prices.currency || \"\";let html=\"\";(prices.items || []).forEach(priceLine=>{html += `<tr><td>${escapeHTML(priceLine.label || \"Price item\")}</td><td class=\"amount\">${money(priceLine.value,currency)}</td></tr>`;});html += `<tr class=\"total-row\"><td>Total Price</td><td class=\"amount\">${money(prices.totalSum,currency)}</td></tr><tr><td style=\"font-weight:bold;padding-top:4px;\">Amount Paid</td><td class=\"amount\" style=\"padding-top:4px;color:#022e64;\">${money(prices.totalPaid,currency)}</td></tr>`;if(Number(prices.balanceDue || 0) > 0){html += `<tr><td style=\"font-weight:bold;\">Balance Due</td><td class=\"amount\">${money(prices.balanceDue,currency)}</td></tr>`;}target.innerHTML=html;}function collectSuppliers(data){\nconst suppliers=[];(data.segments || []).forEach(seg=>{const name=supplierNameFromSegment(seg);const address=supplierAddressFromSegment(seg);const reference=seg.supplierReference || seg.details?.supplierReference || seg.details?.voucherRef || seg.details?.ticketNumber || \"\";if(name || address || reference){suppliers.push({name,address,reference});}});if(Array.isArray(data.suppliers)){data.suppliers.forEach(item=>suppliers.push(item));}const seen=new Set();return suppliers.filter(item=>{const key=[item.name,item.address,item.reference].join(\"|\");if(seen.has(key)) return false;seen.add(key);return true;});}function getStateDisclosure(data){const state=String(data.compliance?.state ||data.customer?.billingState ||data.customer?.residenceState ||\"\").toUpperCase();const reg=data.compliance?.registrationNumber || \"\";const map={NY:\"New York Truth in Travel disclosures apply. This confirmation provides the travel promoter/seller contact details, payment details, supplier/service descriptions, cancellation/refund terms and limitations/conditions for the confirmed travel services.\",CA:`California Seller of Travel disclosure applies where required. Registration number: ${reg || \"[ADD CA SOT NUMBER]\"}. Registration as a seller of travel does not constitute approval by the State of California.`,FL:`Florida Seller of Travel disclosure applies where required. ${data.agency?.legalName || \"SKANDI Travels\"} is registered with the State of Florida as a Seller of Travel Registration No. ${reg || \"[ADD FL SOT NUMBER]\"}.`,WA:`Washington Seller of Travel disclosure applies where required. Sellers of Travel endorsement / registration: ${reg || \"[ADD WA SELLER OF TRAVEL ENDORSEMENT]\"}.`,HI:`Hawaii travel agency disclosure applies where required. Registration number: ${reg || \"[ADD HI REGISTRATION NUMBER]\"}.`};return map[state] || \"\";}function renderLegal(data){const agency=data.agency || {};const booking=data.booking || {};const customer=data.customer || {};const prices=data.prices || {};const payment=data.payment || {};const compliance=data.compliance || {};const agencyText =compliance.agencyDisclosureText ||[agency.legalName || \"SKANDI Travels\",agency.address,agency.phone || booking.agencyPhone,agency.website || booking.agencyUrl].filter(hasValue).join(\" · \");setText(\"agency_disclosure_text\",agencyText || \"SKANDI Travels agency information not provided.\");const stateText =compliance.stateDisclosureText ||compliance.sellerOfTravelText ||getStateDisclosure(data) ||\"No state-specific Seller of Travel disclosure has been provided for this booking.\";setText(\"state_disclosure_text\",stateText);const supplierList=document.getElementById(\"supplier_disclosure_list\");const suppliers=collectSuppliers(data);supplierList.innerHTML=suppliers.length? suppliers.map(item=>`<li>${escapeHTML(item.name || \"Supplier not named\")}${item.address ? ` · ${escapeHTML(item.address)}` : \"\"}${item.reference ? ` · Ref: ${escapeHTML(item.reference)}` : \"\"}</li>`).join(\"\"): `<li>No supplier details were provided.</li>`;const total=money(prices.totalSum,prices.currency);const last4=payment.cardLast4 || data.authorization?.cardLast4 || \"\";const authText =data.authorization?.text ||compliance.authorizationText ||`Customer authorized SKANDI Travels to process the selected payment method for ${total}${last4 ? ` using card ending in ${last4}` : \"\"}. Individual charges may appear from SKANDI Travels or from the respective travel suppliers.`;setText(\"authorization_disclosure_text\",authText);setText(\"cancellation_terms_text\",compliance.cancellationTermsText ||data.cancellationTerms ||\"Cancellation, change and refund rights are governed by SKANDI Travels terms and the applicable airline, hotel, transfer, activity and supplier rules shown or referenced at the time of booking.\");setText(\"limitations_text\",compliance.limitationsText ||data.limitationsText ||\"Traveler is responsible for valid passport, visa, transit, health, vaccination and entry documentation. Schedule changes, supplier changes, weather, airport disruption, force majeure, government action and operational restrictions may affect travel services.\");}function renderQr(data){const target=document.getElementById(\"itinerary_master_qrcode\");const booking=data.booking || {};const customer=data.customer || {};const qrString=[booking.pnr || booking.bookingReference || \"BOOKING\",customer.name || \"TRAVELER\",booking.createdDate || \"\"].join(\"-\").replace(/\\s+/g,\"\");target.innerHTML=\"\";if(typeof QRCode !== \"undefined\"){new QRCode(target,{text:qrString,width:90,height:90,colorDark:\"#022e64\",colorLight:\"#ffffff\",correctLevel:QRCode.CorrectLevel.M});}else{target.innerHTML=`<div class=\"qr-fallback\">QR unavailable<br>${escapeHTML(booking.pnr || \"\")}</div>`;}}\nfunction validateConfirmationData(data){const missing=[];if(!hasValue(data.customer?.name)) missing.push(\"customer.name\");if(!hasValue(data.booking?.pnr) && !hasValue(data.booking?.bookingReference)) missing.push(\"booking.pnr or booking.bookingReference\");if(!hasValue(data.booking?.bookingDate)) missing.push(\"booking.bookingDate\");if(!hasValue(data.booking?.createdDate)) missing.push(\"booking.createdDate\");if(!hasValue(data.agency?.legalName)) missing.push(\"agency.legalName\");if(!hasValue(data.agency?.phone) && !hasValue(data.booking?.agencyPhone)) missing.push(\"agency.phone or booking.agencyPhone\");if(!Array.isArray(data.segments) || !data.segments.length) missing.push(\"segments\");if(!hasValue(data.prices?.currency)) missing.push(\"prices.currency\");if(data.prices?.totalSum === undefined) missing.push(\"prices.totalSum\");if(data.prices?.totalPaid === undefined) missing.push(\"prices.totalPaid\");if(!hasValue(data.compliance?.stateDisclosureText) && !hasValue(getStateDisclosure(data))) missing.push(\"compliance.stateDisclosureText\");if(!hasValue(data.compliance?.cancellationTermsText) && !hasValue(data.cancellationTerms)) missing.push(\"compliance.cancellationTermsText\");if(!hasValue(data.authorization?.text) && !hasValue(data.compliance?.authorizationText)) missing.push(\"authorization.text or compliance.authorizationText\");const warning=document.getElementById(\"validation_warning\");if(missing.length){warning.classList.remove(\"hidden\");warning.innerText=`PDF CONFIRMATION WARNING - Missing required production data: ${missing.join(\", \")}`;}else{warning.classList.add(\"hidden\");warning.innerText=\"\";}}\nfunction normalizeConfirmationData(raw){const data=raw && typeof raw === \"object\" ? raw : {};data.document=data.document || {};data.customer=data.customer || {};data.booking=data.booking || {};data.agency=data.agency || {};data.prices=data.prices || {};data.payment=data.payment || {};data.compliance=data.compliance || {};data.authorization=data.authorization || {};data.travelers=Array.isArray(data.travelers) ? data.travelers : [];data.segments=Array.isArray(data.segments) ? data.segments : [];data.ancillaries=Array.isArray(data.ancillaries) ? data.ancillaries : [];if(data.prices.balanceDue === undefined){data.prices.balanceDue=Math.max(0,Number(data.prices.totalSum || 0)-Number(data.prices.totalPaid || 0));}return data;}function synchronizeTravelDocument(rawData){const data=normalizeConfirmationData(rawData);CURRENT_CONFIRMATION_DATA=data;validateConfirmationData(data);const customer=data.customer || {};const booking=data.booking || {};const agency=data.agency || {};const prices=data.prices || {};const payment=data.payment || {};if(agency.logoUrl){document.getElementById(\"brand_logo\").src=agency.logoUrl;}setText(\"pax_name_headline\",customer.name || \"\");setText(\"pax_address_line1\",customer.addressLine1 || \"\");setText(\"pax_address_line2\",customer.addressLine2 || \"\");setText(\"lbl_pnr_code\",booking.pnr || booking.bookingReference || \"\");setText(\"lbl_booking_date\",booking.bookingDate || \"\");setText(\"lbl_created_date\",booking.createdDate || \"\");setText(\"lbl_booking_channel\",booking.channel || \"\");setText(\"lbl_agency_phone\",agency.phone || booking.agencyPhone || \"\");setText(\"lbl_agency_url\",agency.website || booking.agencyUrl || \"\");setText(\"lbl_cust_phone\",customer.mobile || customer.phone || \"\");setText(\"lbl_cust_email\",customer.email || \"\");setText(\"lbl_payment_status\",prices.paymentStatus || booking.paymentStatus || \"Paid / Confirmed\");setText(\"lbl_amount_paid\",money(prices.totalPaid,prices.currency));setText(\"lbl_balance_due\",money(prices.balanceDue,prices.currency));setText(\"lbl_payment_method\",payment.method || payment.brand || \"\");setText(\"lbl_payment_auth\",payment.authorizationId || payment.chargeId || payment.status || \"\");setText(\"important_info_text\",data.importantInfo ||\"Please verify that each passenger name matches the physical passport exactly, including all given first names and surnames. Confirm that your registered mobile phone number and email address are valid before travel.\");setText(\"lbl_baggage_terms_text\",data.baggageTermsText ||`For detailed baggage allowance policies and airport guidelines, please visit ${(agency.website || booking.agencyUrl || \"SKANDI Travels\")}/baggage`);setText(\"final_document_note\",data.finalDocumentNote ||\"This PDF confirmation summarizes your confirmed SKANDI Travels booking. Airline tickets, hotel vouchers, transfer vouchers, activity vouchers and travel documents may be issued separately depending on the booked products.\");renderSegments(data);renderTravelersAndAncillaries(data);renderPrices(data);renderLegal(data);renderQr(data);}window.onmessage=function(event){\nconst message=event.data || {};if(message.type === \"PDF_BOOKING_CONFIRMATION_DATA\"){synchronizeTravelDocument(message.payload || message.data || {});}};if(window.SKANDI_PDF_CONFIRMATION_DATA){synchronizeTravelDocument(window.SKANDI_PDF_CONFIRMATION_DATA);}window.parent.postMessage({type:\"PDF_BOOKING_CONFIRMATION_HTML_READY\"},\"*\");</script></body></html>";

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
