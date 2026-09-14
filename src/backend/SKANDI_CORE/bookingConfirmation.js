// /src/backend/SKANDI_CORE/bookingConfirmation.js
// SKANDI Backend Base 1.0 — B-007.4 canonical Booking Confirmation renderer.
// One renderer is used for agent preview and the persisted customer-facing confirmation.
// The renderer is display-only: it never mutates booking state or calls providers.

const LOGO_URL = "https://static.wixstatic.com/media/394052_504704bd94f44f01a95f304bd19640e5~mv2.png";
const DEFAULT_PHONE = "+1 646 583 1610";
const DEFAULT_SITE = "www.skanditravels.com";

const arr = (v) => Array.isArray(v) ? v : [];
const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const clean = (v, max = 5000) => String(v ?? "").trim().slice(0, max);
const upper = (v, max = 5000) => clean(v, max).toUpperCase();
const number = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;

function esc(value) {
  return clean(value, 20000)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function human(value) {
  return clean(value).replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
}
function dateOnly(value) {
  const raw = clean(value, 40);
  if (!raw) return "—";
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00Z` : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}
function dateTime(value) {
  const raw = clean(value, 80);
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
function localClock(value) {
  const raw = clean(value, 80);
  if (!raw) return "—";
  const m = raw.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : raw;
}
function money(value, currency = "USD") {
  const n = number(value);
  const c = upper(currency, 3) || "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
  } catch (_) {
    return `${c} ${n.toFixed(2)}`;
  }
}
function duration(value) {
  const raw = clean(value, 80);
  if (!raw) return "—";
  const m = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!m) return raw;
  return [m[1] ? `${m[1]}h` : "", m[2] ? `${m[2]}m` : ""].filter(Boolean).join(" ") || raw;
}
function first(...values) {
  return values.find(v => v !== undefined && v !== null && clean(v) !== "") ?? "";
}
function fullName(p = {}) {
  return clean(first(p.display_name, p.displayName, [p.first_name || p.firstName, p.last_name || p.lastName].filter(Boolean).join(" ")), 300) || "Traveler";
}
function paxType(p = {}) {
  const t = upper(first(p.pax_type, p.paxType, p.type), 10);
  return ({ ADT: "Adult", CHD: "Child", INF: "Infant", YTH: "Youth", SRC: "Senior" })[t] || human(t || "Traveler");
}
function bookingRef(booking = {}) {
  return upper(first(booking.booking_reference, booking.bookingReference, booking.pnr_locator, booking.pnrLocator, booking.id), 120) || "PENDING";
}
function bookingCurrency(booking = {}, components = []) {
  return upper(first(booking.currency, components.find(c => c.currency)?.currency, "USD"), 3);
}
function payload(v) { return obj(v?.payload); }
function componentType(c = {}) { return upper(first(c.component_type, c.componentType, c.entityType), 80); }
function segmentType(s = {}) { return upper(first(s.segment_type, s.segmentType, s.type), 80); }
function componentTitle(c = {}) { return clean(first(c.title, payload(c).title, payload(c).hotelName, payload(c).tourName, payload(c).transferName, human(componentType(c))), 400); }
function serviceDate(c = {}) { return clean(first(c.service_date, c.serviceDate, c.start_date, c.startDate, payload(c).serviceDate, payload(c).startDate), 40); }
function chronologyKey(item = {}) {
  const v = clean(first(item.sortAt, item.departingAt, item.startDate, item.date, "9999-12-31"), 80);
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

function passengerDocumentNumber(passenger = {}, documents = [], components = []) {
  const pid = first(passenger.id, passenger.passenger_id, passenger.passengerId);
  const own = documents.find(d => first(d.passenger_id, d.passengerId) === pid && /TICKET|VOUCHER|BOARDING|ETKT|EMD/i.test(`${d.document_type || d.documentType || ""}`));
  if (own) return first(own.document_number, own.documentNumber, own.payload?.ticketNumber, own.payload?.voucherNumber);
  return first(payload(passenger).ticketNumber, payload(passenger).voucherNumber, payload(passenger).documentNumber,
    components.find(c => first(c.passenger_id, c.passengerId) === pid)?.supplier_reference);
}

function passengerExtras(passenger = {}, segments = [], components = []) {
  const p = payload(passenger);
  const seat = first(passenger.seat_number, passenger.seatNumber, p.seat, p.seatNumber,
    segments.map(s => payload(s).seatAssignments?.[passenger.id]).find(Boolean));
  const baggage = first(p.baggageAllowance, p.baggage, p.baggageText,
    p.baggageCount ? `${p.baggageCount} pc${p.baggageWeight ? ` · ${p.baggageWeight} kg` : ""}` : "");
  const meal = first(p.mealRequest, p.mealCode, p.specialMeal, p.dietaryPrefs);
  return { seat, baggage, meal };
}

function normalizeFlight(seg = {}, passengers = []) {
  const p = payload(seg);
  const marketing = obj(first(p.marketingCarrier, seg.marketingCarrier) || {});
  const operating = obj(first(p.operatingCarrier, seg.operatingCarrier) || {});
  const origin = obj(p.origin || seg.origin || {});
  const destination = obj(p.destination || seg.destination || {});
  const dep = first(seg.departing_at, seg.departingAt, p.departingAt, p.departureDateTime,
    [first(seg.departure_date, seg.departureDate), first(seg.departure_time, seg.departureTime)].filter(Boolean).join("T"));
  const arrv = first(seg.arriving_at, seg.arrivingAt, p.arrivingAt, p.arrivalDateTime,
    [first(p.arrivalDate, seg.return_date), first(seg.arrival_time, seg.arrivalTime)].filter(Boolean).join("T"));
  const flightNumber = first(seg.flight_number, seg.flightNumber, p.flightNumber, p.marketingFlightNumber);
  const marketingCode = first(marketing.iataCode, marketing.iata_code, p.marketingCarrierCode, p.carrierCode, seg.carrierCode);
  const operatingCode = first(operating.iataCode, operating.iata_code, p.operatingCarrierCode);
  return {
    type: "FLIGHT",
    sortAt: dep,
    title: `${first(marketing.name, p.carrierName, marketingCode, "Flight")} ${[marketingCode, flightNumber].filter(Boolean).join("")}`.trim(),
    subtitle: operatingCode || operating.name ? `Operated by ${first(operating.name, operatingCode)}` : "",
    originCode: first(origin.iataCode, origin.iata_code, seg.origin, p.origin),
    originName: first(origin.name, origin.cityName, p.originName),
    originTerminal: first(seg.origin_terminal, seg.originTerminal, p.originTerminal, p.departureTerminal),
    destinationCode: first(destination.iataCode, destination.iata_code, seg.destination, p.destination),
    destinationName: first(destination.name, destination.cityName, p.destinationName),
    destinationTerminal: first(seg.destination_terminal, seg.destinationTerminal, p.destinationTerminal, p.arrivalTerminal),
    departure: dep,
    arrival: arrv,
    cabin: first(seg.cabin, p.cabinClass, p.cabin),
    bookingClass: first(seg.booking_class, seg.bookingClass, p.bookingClass),
    duration: first(seg.duration, p.duration),
    aircraft: first(p.aircraft?.name, p.aircraftName, p.aircraft, seg.aircraft),
    fareBasis: first(p.fareBasis, p.fare_basis),
    baggage: first(p.baggageAllowance, p.baggage),
    supplierReference: first(seg.supplier_reference, seg.supplierReference, p.supplierReference),
    passengerExtras: passengers.map(px => ({ name: fullName(px), ...passengerExtras(px, [seg], []) }))
  };
}
function normalizeTransfer(c = {}) {
  const p = payload(c);
  return {
    type: "TRANSFER", sortAt: serviceDate(c),
    title: first(p.transferType, p.serviceName, c.title, "SKANDI Transfer"),
    pickup: first(p.pickupLocation, p.pickupPoint, p.origin, p.airportName, p.airportIata),
    dropoff: first(p.dropoffLocation, p.dropoffPoint, p.destination, p.hotelName),
    date: serviceDate(c), time: first(p.pickupTime, p.serviceTime, p.scheduledTime),
    flightNumber: first(p.arrivalFlightNumber, p.flightNumber, p.associatedFlight),
    scheduledArrival: first(p.scheduledArrivalTime, p.arrivalTime),
    vehicle: first(p.vehicleType, p.vehicleName),
    instructions: first(p.instructions, p.meetingInstructions, p.operationalNotes, c.operational_notes, "Look for a representative holding a SKANDI sign at the stated meeting point."),
    luggage: first(p.luggageSummary, p.standardSuitcases ? `${p.standardSuitcases} standard suitcase(s)` : ""),
    extras: arr(p.extras).map(human),
    contactPhone: first(p.travelerMobile, p.phoneNumber, p.phone),
    supplierReference: first(c.supplier_reference, c.supplierReference, p.supplierReference)
  };
}
function normalizeHotel(seg = {}, c = {}) {
  const sp = payload(seg), cp = payload(c);
  const p = { ...sp, ...cp };
  const checkIn = first(seg.departure_date, seg.departureDate, p.checkInDate, p.checkIn, c.start_date, c.startDate, c.service_date, c.serviceDate);
  const checkOut = first(seg.return_date, seg.returnDate, p.checkOutDate, p.checkOut, c.end_date, c.endDate);
  return {
    type: "HOTEL", sortAt: checkIn,
    title: first(seg.hotel_name, seg.hotelName, p.hotelName, p.accommodationName, c.title, "Accommodation"),
    address: first(p.hotelAddress, p.address?.lineOne, p.addressLine1),
    city: first(p.address?.city, p.city),
    phone: first(p.hotelPhone, p.phoneNumber, p.phone),
    checkIn, checkOut,
    checkInTime: first(p.checkInTime, p.standardCheckInTime, "15:00"),
    checkOutTime: first(p.checkOutTime, p.standardCheckOutTime, "11:00"),
    roomType: first(seg.room_type, seg.roomType, p.roomType, p.roomName),
    boardBasis: first(seg.board_basis, seg.boardBasis, p.boardBasis, p.boardType, p.mealPlanBasis),
    guests: first(p.guestSummary, p.passengerSummary),
    rooms: first(p.roomCount, p.rooms, c.quantity),
    cancellationPolicy: first(p.cancellationPolicy, p.cancellationText, p.conditions?.cancellation),
    supplierReference: first(c.supplier_reference, c.supplierReference, p.reference, p.bookingReference)
  };
}
function normalizeGeneric(c = {}) {
  const p = payload(c);
  return {
    type: componentType(c) || "SERVICE", sortAt: serviceDate(c),
    title: componentTitle(c),
    description: first(p.description, p.operationalNotes, c.operational_notes),
    supplierReference: first(c.supplier_reference, c.supplierReference, p.supplierReference)
  };
}

function buildTimeline(segments = [], components = [], passengers = []) {
  const out = [];
  const hotelSegments = arr(segments).filter(s => /HOTEL|ACCOM/i.test(segmentType(s)));
  for (const seg of arr(segments)) {
    const type = segmentType(seg);
    if (/FLIGHT|AIR/.test(type)) out.push(normalizeFlight(seg, passengers));
    else if (/HOTEL|ACCOM/.test(type)) out.push(normalizeHotel(seg));
  }
  for (const c of arr(components)) {
    const type = componentType(c);
    if (/TRANSFER/.test(type)) out.push(normalizeTransfer(c));
    else if (/HOTEL|ACCOM/.test(type) && !hotelSegments.length) out.push(normalizeHotel({}, c));
    else if (!/FLIGHT|AIR/.test(type)) out.push(normalizeGeneric(c));
  }
  return out.sort((a, b) => chronologyKey(a) - chronologyKey(b));
}

function manifestRows(passengers = [], documents = [], components = []) {
  return arr(passengers).map((p, i) => {
    const number = passengerDocumentNumber(p, documents, components);
    return `<tr><td>${i + 1}</td><td><strong>${esc(fullName(p))}</strong></td><td>${esc(paxType(p))}</td><td>${esc(dateOnly(first(p.date_of_birth, p.dateOfBirth)))}</td><td>${esc(number || "—")}</td></tr>`;
  }).join("");
}
function flightBlock(item = {}) {
  const paxRows = arr(item.passengerExtras).filter(x => x.seat || x.baggage || x.meal).map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.seat || "—")}</td><td>${esc(x.baggage || item.baggage || "—")}</td><td>${esc(x.meal || "—")}</td></tr>`).join("");
  return `<section class="journey-card flight"><div class="journey-head"><div><span class="eyebrow">Flight</span><h3>${esc(item.title)}</h3>${item.subtitle ? `<p>${esc(item.subtitle)}</p>` : ""}</div><span class="status-pill">CONFIRMED</span></div>
    <div class="flight-grid"><div><span>Departure</span><strong>${esc(item.originCode || "—")} · ${esc(item.originName || "")}</strong><small>${esc(dateTime(item.departure))}${item.originTerminal ? ` · Terminal ${esc(item.originTerminal)}` : ""}</small></div><div class="flight-arrow">→</div><div><span>Arrival</span><strong>${esc(item.destinationCode || "—")} · ${esc(item.destinationName || "")}</strong><small>${esc(dateTime(item.arrival))}${item.destinationTerminal ? ` · Terminal ${esc(item.destinationTerminal)}` : ""}</small></div></div>
    <div class="facts"><div><span>Class</span><strong>${esc([item.cabin, item.bookingClass].filter(Boolean).join(" · ") || "—")}</strong></div><div><span>Duration</span><strong>${esc(duration(item.duration))}</strong></div><div><span>Aircraft</span><strong>${esc(item.aircraft || "—")}</strong></div><div><span>Fare basis</span><strong>${esc(item.fareBasis || "—")}</strong></div></div>
    ${paxRows ? `<table class="compact-table"><thead><tr><th>Passenger</th><th>Seat</th><th>Baggage</th><th>Meal</th></tr></thead><tbody>${paxRows}</tbody></table>` : ""}
  </section>`;
}
function transferBlock(item = {}) {
  return `<section class="journey-card transfer"><div class="journey-head"><div><span class="eyebrow">Ground transfer</span><h3>${esc(item.title)}</h3></div><span class="status-pill">CONFIRMED</span></div>
    <div class="facts two"><div><span>Pick-up</span><strong>${esc(item.pickup || "—")}</strong><small>${esc([dateOnly(item.date), item.time].filter(Boolean).join(" · "))}</small></div><div><span>Drop-off</span><strong>${esc(item.dropoff || "—")}</strong></div><div><span>Flight synchronization</span><strong>${esc([item.flightNumber, item.scheduledArrival].filter(Boolean).join(" · ") || "—")}</strong></div><div><span>Vehicle / luggage</span><strong>${esc([item.vehicle, item.luggage].filter(Boolean).join(" · ") || "—")}</strong></div></div>
    <div class="note"><strong>Instructions:</strong> ${esc(item.instructions || "Follow the instructions supplied by SKANDI before arrival.")}${item.contactPhone ? `<br><strong>Traveler mobile:</strong> ${esc(item.contactPhone)}` : ""}</div>
  </section>`;
}
function hotelBlock(item = {}) {
  const address = [item.address, item.city].filter(Boolean).join(", ");
  return `<section class="journey-card hotel"><div class="journey-head"><div><span class="eyebrow">Accommodation</span><h3>${esc(item.title)}</h3><p>${esc(address || "Address not provided")}${item.phone ? ` · ${esc(item.phone)}` : ""}</p></div><span class="status-pill">CONFIRMED</span></div>
    <div class="facts two"><div><span>Check-in</span><strong>${esc(dateOnly(item.checkIn))}</strong><small>${esc(item.checkInTime || "")}</small></div><div><span>Check-out</span><strong>${esc(dateOnly(item.checkOut))}</strong><small>${esc(item.checkOutTime || "")}</small></div><div><span>Room details</span><strong>${esc([item.rooms ? `${item.rooms}x` : "", item.roomType].filter(Boolean).join(" ") || "—")}</strong></div><div><span>Board basis</span><strong>${esc(item.boardBasis || "—")}</strong></div><div><span>Guests</span><strong>${esc(item.guests || "See passenger manifest")}</strong></div><div><span>Hotel confirmation</span><strong>${esc(item.supplierReference || "—")}</strong></div></div>
    ${item.cancellationPolicy ? `<div class="note"><strong>Cancellation policy:</strong> ${esc(item.cancellationPolicy)}</div>` : ""}
  </section>`;
}
function genericBlock(item = {}) {
  return `<section class="journey-card"><div class="journey-head"><div><span class="eyebrow">${esc(human(item.type))}</span><h3>${esc(item.title)}</h3>${item.description ? `<p>${esc(item.description)}</p>` : ""}</div><span class="status-pill">CONFIRMED</span></div>${item.supplierReference ? `<div class="note"><strong>Supplier reference:</strong> ${esc(item.supplierReference)}</div>` : ""}</section>`;
}
function renderTimeline(items = []) {
  if (!items.length) return `<div class="empty-state">No itinerary products have been added yet.</div>`;
  return items.map(item => item.type === "FLIGHT" ? flightBlock(item) : item.type === "TRANSFER" ? transferBlock(item) : item.type === "HOTEL" ? hotelBlock(item) : genericBlock(item)).join("");
}

function priceLines(booking = {}, components = []) {
  const bp = payload(booking), currency = bookingCurrency(booking, components);
  const configured = arr(first(bp.priceItems, bp.priceBreakdown, bp.financials?.items));
  if (configured.length) return configured.map(x => ({ label: first(x.label, x.title, x.name, "Item"), amount: number(first(x.amount, x.value, x.total)), currency: upper(first(x.currency, currency), 3) }));
  const componentLines = arr(components).filter(c => number(first(c.total_amount, c.totalAmount)) > 0).map(c => ({ label: componentTitle(c), amount: number(first(c.total_amount, c.totalAmount)), currency: upper(first(c.currency, currency), 3) }));
  if (componentLines.length) return componentLines;
  const total = number(first(booking.total_amount, booking.totalAmount));
  return total ? [{ label: "Base package / booking price", amount: total - number(first(booking.tax_amount, booking.taxAmount)), currency }] : [];
}
function paymentSummary(booking = {}) {
  const p = payload(booking), payment = obj(first(p.payment, p.paymentSummary, p.financials?.payment) || {});
  const total = number(first(booking.total_amount, booking.totalAmount, payment.total));
  const paid = number(first(payment.amountPaid, payment.paidAmount, p.amountPaid, p.totalPaid));
  const balance = number(first(payment.balanceDue, p.balanceDue, total - paid));
  return {
    status: first(booking.payment_status, booking.paymentStatus, payment.status, paid >= total && total > 0 ? "PAID" : paid > 0 ? "PART PAID" : "UNPAID"),
    paid, balance,
    dueDate: first(payment.balanceDueDate, p.balanceDueDate, p.paymentDueDate),
    method: first(payment.method, payment.paymentMethod, p.paymentMethod),
    authorization: first(payment.approvalCode, payment.authorizationCode, p.paymentApprovalCode)
  };
}
function cancellationSummary(booking = {}, timeline = []) {
  const p = payload(booking);
  return first(p.cancellationPolicy, p.cancellationTerms, p.refundRule,
    timeline.find(x => x.cancellationPolicy)?.cancellationPolicy,
    "Cancellation and change terms are supplier- and fare-specific. Review the applicable rules shown at booking before making changes.");
}

export function renderBookingConfirmation({
  booking = {}, passengers = [], segments = [], components = [], documents = [],
  documentNumber = "", generatedAt = new Date().toISOString(), preview = false
} = {}) {
  const b = booking, bp = payload(b), ref = bookingRef(b), currency = bookingCurrency(b, components);
  const lead = passengers[0] || {};
  const timeline = buildTimeline(segments, components, passengers);
  const prices = priceLines(b, components);
  const payment = paymentSummary(b);
  const tax = number(first(b.tax_amount, b.taxAmount, bp.taxAmount));
  const total = number(first(b.total_amount, b.totalAmount, prices.reduce((s, x) => s + x.amount, 0) + tax));
  const issueDate = generatedAt || new Date().toISOString();
  const bookingDate = first(b.created_at, b.createdAt, bp.bookingDate, issueDate);
  const agentName = first(bp.agentName, bp.bookedBy, bp.assignedAgentName, "SKANDI Travels");
  const agencyPhone = first(bp.agencyPhone, DEFAULT_PHONE);
  const agencySite = first(bp.agencyWebsite, DEFAULT_SITE);
  const contactEmail = first(b.customer_email, b.customerEmail, bp.customerEmail);
  const contactPhone = first(bp.customerPhone, bp.phoneNumber, lead.payload?.phone, lead.phone);
  const status = upper(first(b.status, "CONFIRMED"), 40);
  const finalConfirmed = ["CONFIRMED", "TICKETED"].includes(status);
  const passportNotice = first(bp.passportValidityMessage,
    "Verify destination-specific passport, visa and entry requirements before travel. Validity rules vary by destination and nationality.");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SKANDI Booking Confirmation ${esc(ref)}</title><style>
  :root{--navy:#022e64;--teal:#173747;--ink:#17212b;--muted:#66727d;--line:#dfe5eb;--soft:#f4f7fa;--blue:#eaf3ff;--good:#0d7a47;--warn:#8a5700}*{box-sizing:border-box}html,body{margin:0;background:#eef2f5;color:var(--ink);font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45}.sheet{width:min(210mm,calc(100vw - 24px));min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:14mm 14mm 16mm}.preview{position:fixed;top:16px;left:-44px;transform:rotate(-45deg);background:#f0ad00;color:#17212b;font-weight:800;padding:5px 55px;z-index:5;letter-spacing:.08em}.top{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;border-bottom:3px solid var(--navy);padding-bottom:12px}.logo{width:190px;max-width:42vw}.doc-title{text-align:right}.doc-title h1{margin:0;color:var(--navy);font-size:26px}.doc-title p{margin:4px 0 0;color:var(--muted)}.meta{margin:16px 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line)}.meta>div{padding:8px 10px;border-right:1px solid var(--line)}.meta>div:last-child{border-right:0}.label,.facts span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.06em}.meta strong,.facts strong{display:block;margin-top:2px}.section-title{margin:20px 0 8px;color:var(--navy);font-size:15px;border-bottom:2px solid var(--navy);padding-bottom:4px}.compact-table{width:100%;border-collapse:collapse}.compact-table th,.compact-table td{padding:6px;border:1px solid var(--line);text-align:left;vertical-align:top}.compact-table th{background:var(--soft);font-size:9px;text-transform:uppercase;color:#465563}.journey-card{border:1px solid var(--line);margin:0 0 10px;page-break-inside:avoid}.journey-head{display:flex;justify-content:space-between;gap:16px;padding:9px 10px;background:var(--soft);border-bottom:1px solid var(--line)}.journey-head h3{margin:1px 0 0;font-size:14px}.journey-head p{margin:2px 0 0;color:var(--muted)}.eyebrow{font-size:9px;color:var(--navy);font-weight:800;text-transform:uppercase;letter-spacing:.07em}.status-pill{align-self:flex-start;border:1px solid #9cccb7;background:#e9f7ef;color:var(--good);font-size:9px;font-weight:800;padding:3px 7px}.flight-grid{display:grid;grid-template-columns:1fr 28px 1fr;padding:10px;align-items:center}.flight-grid span,.flight-grid small{display:block;color:var(--muted)}.flight-grid strong{font-size:13px}.flight-arrow{text-align:center;font-size:18px;color:var(--navy)}.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line)}.facts.two{grid-template-columns:repeat(2,minmax(0,1fr))}.facts>div{padding:7px 10px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.facts>div:nth-child(4n),.facts.two>div:nth-child(2n){border-right:0}.facts small{display:block;color:var(--muted);margin-top:2px}.note{margin:8px 10px 10px;padding:7px 9px;background:#fff8e6;border-left:3px solid #e5a93b;color:#4e4431}.financial-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px}.receipt{border:1px solid var(--line);padding:8px 10px}.receipt-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px dotted #ccd3da}.receipt-row.total{font-size:15px;font-weight:800;border-top:2px solid var(--navy);border-bottom:0;margin-top:5px;padding-top:8px}.payment-box{border:1px solid var(--line);padding:10px;background:var(--soft)}.payment-box .big{font-size:19px;color:var(--navy);font-weight:800}.legal{display:grid;grid-template-columns:1fr 1fr;gap:10px}.legal>div{border:1px solid var(--line);padding:9px}.legal h4{margin:0 0 5px;color:var(--navy)}.footer{margin-top:18px;padding-top:8px;border-top:2px solid var(--navy);color:var(--muted);font-size:10px}.empty-state{padding:18px;background:var(--soft);color:var(--muted)}@media(max-width:760px){.sheet{width:100%;margin:0;padding:18px;min-height:auto}.top{grid-template-columns:1fr}.doc-title{text-align:left}.meta{grid-template-columns:1fr 1fr}.facts,.facts.two{grid-template-columns:1fr 1fr}.financial-grid,.legal{grid-template-columns:1fr}.flight-grid{grid-template-columns:1fr}.flight-arrow{display:none}}@media print{@page{size:A4;margin:10mm}html,body{background:#fff}.sheet{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}.preview{display:none}.journey-card,.financial-grid,.legal{break-inside:avoid}}
  </style></head><body>${preview || !finalConfirmed ? `<div class="preview">DRAFT PREVIEW</div>` : ""}<main class="sheet">
    <header class="top"><img class="logo" src="${esc(LOGO_URL)}" alt="SKANDI Travels"><div class="doc-title"><h1>${preview || !finalConfirmed ? "Booking Preview" : "Booking Confirmation"}</h1><p>Travel Itinerary · ${esc(documentNumber || ref)}</p></div></header>
    <section class="meta"><div><span class="label">Booking reference / PNR</span><strong>${esc(ref)}</strong></div><div><span class="label">Date of issue</span><strong>${esc(dateOnly(issueDate))}</strong></div><div><span class="label">Lead passenger</span><strong>${esc(fullName(lead))}</strong></div><div><span class="label">Booking status</span><strong>${esc(human(status))}</strong></div></section>
    <section><h2 class="section-title">Passenger Manifest</h2><table class="compact-table"><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Date of birth</th><th>Ticket / Voucher No.</th></tr></thead><tbody>${manifestRows(passengers, documents, components) || `<tr><td colspan="5">No passengers recorded.</td></tr>`}</tbody></table></section>
    <section><h2 class="section-title">Travel Itinerary</h2>${renderTimeline(timeline)}</section>
    <section><h2 class="section-title">Financials & Payment Summary</h2><div class="financial-grid"><div class="receipt">${prices.map(x => `<div class="receipt-row"><span>${esc(x.label)}</span><strong>${esc(money(x.amount, x.currency || currency))}</strong></div>`).join("")}${tax ? `<div class="receipt-row"><span>Taxes & fees</span><strong>${esc(money(tax, currency))}</strong></div>` : ""}<div class="receipt-row total"><span>Total price</span><span>${esc(money(total, currency))}</span></div></div><div class="payment-box"><span class="label">Payment status</span><strong class="big">${esc(human(payment.status))}</strong><div class="receipt-row"><span>Amount paid</span><strong>${esc(money(payment.paid, currency))}</strong></div><div class="receipt-row"><span>Balance due</span><strong>${esc(money(payment.balance, currency))}</strong></div><div class="receipt-row"><span>Due by</span><strong>${esc(payment.dueDate ? dateOnly(payment.dueDate) : "—")}</strong></div><div class="receipt-row"><span>Payment method</span><strong>${esc(payment.method || "—")}</strong></div>${payment.authorization ? `<div class="receipt-row"><span>Authorization</span><strong>${esc(payment.authorization)}</strong></div>` : ""}</div></div></section>
    <section><h2 class="section-title">Important Information & Terms</h2><div class="legal"><div><h4>Check-in & Travel Documents</h4><p>Complete airline and supplier check-in within the time limits shown in your travel documents. ${esc(passportNotice)}</p></div><div><h4>Cancellation / Change Policy</h4><p>${esc(cancellationSummary(b, timeline))}</p></div><div><h4>Contact Details</h4><p><strong>Traveler:</strong> ${esc(contactPhone || "—")} · ${esc(contactEmail || "—")}</p><p><strong>SKANDI Travels:</strong> ${esc(agencyPhone)} · ${esc(agencySite)}</p></div><div><h4>Booking Record</h4><p>Booked ${esc(dateOnly(bookingDate))} via ${esc(first(b.source_channel, b.sourceChannel, "SKANDI"))}. Agent / desk: ${esc(agentName)}.</p></div></div></section>
    <footer class="footer">This confirmation summarizes the products currently recorded in the SKANDI booking. Airline tickets, boarding passes, hotel vouchers, transfer vouchers and other supplier documents may be issued separately. Supplier terms and live operational information take precedence where they differ from this summary.</footer>
  </main></body></html>`;
}
