// /src/backend/SKANDI_CORE/atbTicket.js
// SKANDI R-005.4 — one ATB-size renderer for:
//   BOARDING_CARD, TRANSFER_TICKET, TOUR_TICKET
// Visual source of truth: boarding_card_atb_pdf417_airline_operated_by.html
// Physical stock remains 203.20 × 82.55 mm.

const TEMPLATE = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>__HTML_TITLE__</title>\n\n<style>\n/*\n  Standards-faithful physical stock:\n  8.00 in × 3.25 in = 203.20 mm × 82.55 mm\n\n  Resolution 792 defines the BCBP data/barcode, not one universal visual layout.\n  This layout follows the classic airport-kiosk ATB-size BCBP arrangement:\n  large operational fields, compact thermal-printer typography, and a\n  vertically oriented 2D barcode zone near the right edge.\n\n  The barcode below is intentionally decorative and NON-SCANNABLE.\n*/\n\n:root{\n  --w:203.20mm;\n  --h:82.55mm;\n  --ink:#050505;\n  --paper:#fff;\n}\n\n*{box-sizing:border-box}\n\nhtml,body{\n  margin:0;\n  padding:0;\n  background:#dcdcdc;\n  color:var(--ink);\n  font-family:\"Courier New\", Courier, monospace;\n  -webkit-print-color-adjust:exact;\n  print-color-adjust:exact;\n}\n\n.screen-note{\n  max-width:900px;\n  margin:18px auto;\n  padding:12px 14px;\n  background:#fff;\n  border:1px solid #aaa;\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:14px;\n  line-height:1.45;\n}\n\n.pass{\n  width:var(--w);\n  height:var(--h);\n  margin:20px auto 40px;\n  position:relative;\n  background:var(--paper);\n  overflow:hidden;\n  box-shadow:0 3px 20px rgba(0,0,0,.2);\n}\n\n/* thermal-card edge */\n.pass:before,\n.pass:after{\n  content:\"\";\n  position:absolute;\n  top:0;\n  bottom:0;\n  width:.35mm;\n  background:repeating-linear-gradient(\n    to bottom,\n    #000 0 .25mm,\n    transparent .25mm .85mm\n  );\n  opacity:.28;\n}\n.pass:before{left:0}\n.pass:after{right:0}\n\n.content{\n  position:absolute;\n  left:5.2mm;\n  top:4.6mm;\n  right:23mm; /* reserve right-side barcode zone */\n  bottom:4.4mm;\n}\n\n.topline{\n  display:grid;\n  grid-template-columns:45mm 1fr 24mm;\n  gap:5mm;\n  align-items:start;\n}\n\n.brand{\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:7.2mm;\n  line-height:.82;\n  font-weight:900;\n  letter-spacing:-.35mm;\n}\n\n.brand-sub{\n  margin-top:1.2mm;\n  font-size:2.1mm;\n  line-height:1;\n  font-weight:700;\n  letter-spacing:.12mm;\n}\n\n.center-head{\n  text-align:center;\n  padding-top:.6mm;\n}\n\n.document-title{\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:4.5mm;\n  font-weight:900;\n  letter-spacing:.12mm;\n}\n\n.et{\n  margin-top:.9mm;\n  font-size:2.3mm;\n  font-weight:700;\n}\n\n.seq{\n  text-align:right;\n  font-size:2.25mm;\n  line-height:1.3;\n  font-weight:700;\n}\n\n.name-block{\n  margin-top:3.0mm;\n  padding-bottom:1.7mm;\n  border-bottom:.45mm solid #000;\n}\n\n.label{\n  display:block;\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:1.85mm;\n  line-height:1;\n  text-transform:uppercase;\n  letter-spacing:.08mm;\n  font-weight:700;\n}\n\n.name{\n  margin-top:.7mm;\n  font-size:4.5mm;\n  font-weight:900;\n  line-height:1;\n  white-space:nowrap;\n}\n\n.route-line{\n  margin-top:2.15mm;\n  font-size:3.15mm;\n  line-height:1;\n  font-weight:900;\n}\n\n.primary{\n  margin-top:2.2mm;\n  display:grid;\n  grid-template-columns:21mm 38mm 38mm 18mm 23mm;\n  align-items:end;\n  column-gap:3.2mm;\n  padding-bottom:2.0mm;\n  border-bottom:.45mm solid #000;\n}\n\n.field .value{\n  display:block;\n  margin-top:.7mm;\n  font-size:4.5mm;\n  font-weight:900;\n  line-height:.9;\n  white-space:nowrap;\n}\n\n.field.flight .value{font-size:6.5mm}\n.field.station .value{font-size:8.7mm;letter-spacing:-.55mm}\n.field.gate .value{font-size:7.6mm}\n.field.board .value{font-size:6.6mm}\n\n.station-caption{\n  display:block;\n  margin-top:.85mm;\n  font-size:1.9mm;\n  line-height:1;\n  font-weight:700;\n  white-space:nowrap;\n}\n\n.secondary{\n  margin-top:2.2mm;\n  display:grid;\n  grid-template-columns:19mm 20mm 24mm 22mm 22mm 22mm 1fr;\n  gap:3.2mm;\n}\n\n.secondary .value{\n  margin-top:.65mm;\n  font-size:3.4mm;\n  font-weight:900;\n  line-height:1;\n  white-space:nowrap;\n}\n\n.seat-box{\n  display:inline-block;\n  border:.45mm solid #000;\n  min-width:16mm;\n  padding:1.2mm 1.7mm 1.0mm;\n  text-align:center;\n}\n\n.seat-box .label{\n  margin-bottom:.45mm;\n}\n\n.seat{\n  font-size:8mm;\n  line-height:.85;\n  font-weight:900;\n}\n\n.bottom{\n  position:absolute;\n  left:0;\n  right:0;\n  bottom:0;\n  display:grid;\n  grid-template-columns:32mm 36mm 1fr;\n  gap:4mm;\n  align-items:end;\n  padding-top:1.7mm;\n  border-top:.35mm solid #000;\n}\n\n.bottom .value{\n  margin-top:.55mm;\n  font-size:2.85mm;\n  font-weight:900;\n}\n\n.notice{\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:1.75mm;\n  line-height:1.15;\n  font-weight:700;\n  text-align:right;\n}\n\n/*\n  Real PDF417 symbol.\n  It is generated from a deliberately non-BCBP sample payload so it scans as\n  PDF417 but cannot function as a valid boarding pass barcode.\n*/\n.barcode-zone{\n  position:absolute;\n  top:11.5mm;\n  right:3.2mm;\n  width:17mm;\n  height:56mm;\n  display:flex;\n  align-items:center;\n  justify-content:center;\n  overflow:visible;\n}\n\n.pdf417-real{\n  display:block;\n  width:54mm;\n  height:auto;\n  max-width:none;\n  transform:rotate(90deg);\n  transform-origin:center;\n  image-rendering:auto;\n}\n\n.barcode-caption{\n  position:absolute;\n  right:1.9mm;\n  top:67.3mm;\n  width:17mm;\n  text-align:center;\n  font-size:1.55mm;\n  line-height:1.05;\n  font-weight:900;\n  transform:none;\n}\n\n.sample-mark{\n  position:absolute;\n  top:2.4mm;\n  right:3.6mm;\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:2.0mm;\n  font-weight:900;\n  letter-spacing:.11mm;\n  border:.35mm solid #000;\n  padding:.7mm 1mm .55mm;\n}\n\n.watermark{\n  position:absolute;\n  inset:0;\n  display:flex;\n  align-items:center;\n  justify-content:center;\n  pointer-events:none;\n}\n\n.watermark span{\n  font-family:Arial,Helvetica,sans-serif;\n  font-size:13.5mm;\n  font-weight:900;\n  letter-spacing:1.2mm;\n  transform:rotate(-12deg);\n  color:rgba(0,0,0,.045);\n  white-space:nowrap;\n}\n\n@page{\n  size:203.20mm 82.55mm;\n  margin:0;\n}\n\n@media print{\n  html,body{\n    width:203.20mm;\n    height:82.55mm;\n    background:#fff;\n  }\n\n  .screen-note{display:none!important}\n\n  .pass{\n    margin:0;\n    box-shadow:none;\n    width:203.20mm;\n    height:82.55mm;\n  }\n}\n</style>\n</head>\n\n<body>\n\n<article class=\"pass\" aria-label=\"SKANDI ATB-size travel service document\">\n\n  <div class=\"sample-mark\">__STATUS_MARK__</div>\n\n  <div class=\"content\">\n\n    <header class=\"topline\">\n      <div>\n        <div class=\"brand\">SKANDI</div>\n        <div class=\"brand-sub\">TRAVELS</div>\n      </div>\n\n      <div class=\"center-head\">\n        <div class=\"document-title\">__DOC_TITLE__</div>\n        <div class=\"et\">__DOC_SUBTITLE__</div>\n      </div>\n\n      <div class=\"seq\">\n        __SEQ_LINE__<br>\n        __ZONE_LINE__\n      </div>\n    </header>\n\n    <section class=\"name-block\">\n      <span class=\"label\">Passenger name</span>\n      <div class=\"name\">__PASSENGER__</div>\n    </section>\n\n    <div class=\"route-line\">__ROUTE_LINE__</div>\n\n    <section class=\"primary\">\n      <div class=\"field flight\">\n        <span class=\"label\">__P1_LABEL__</span>\n        <span class=\"value\">__P1_VALUE__</span>\n      </div>\n\n      <div class=\"field station\">\n        <span class=\"label\">__P2_LABEL__</span>\n        <span class=\"value\">__P2_VALUE__</span>\n        <span class=\"station-caption\">__P2_CAPTION__</span>\n      </div>\n\n      <div class=\"field station\">\n        <span class=\"label\">__P3_LABEL__</span>\n        <span class=\"value\">__P3_VALUE__</span>\n        <span class=\"station-caption\">__P3_CAPTION__</span>\n      </div>\n\n      <div class=\"field gate\">\n        <span class=\"label\">__P4_LABEL__</span>\n        <span class=\"value\">__P4_VALUE__</span>\n      </div>\n\n      <div class=\"field board\">\n        <span class=\"label\">__P5_LABEL__</span>\n        <span class=\"value\">__P5_VALUE__</span>\n      </div>\n    </section>\n\n    <section class=\"secondary\">\n      <div class=\"field\">\n        <span class=\"label\">Date</span>\n        <span class=\"value\">__S1_VALUE__</span>\n      </div>\n\n      <div class=\"field\">\n        <span class=\"label\">Departure</span>\n        <span class=\"value\">__S2_VALUE__</span>\n      </div>\n\n      <div class=\"field\">\n        <span class=\"label\">__S3_LABEL__</span>\n        <span class=\"value\">__S3_VALUE__</span>\n      </div>\n\n      <div class=\"field\">\n        <span class=\"label\">__S4_LABEL__</span>\n        <span class=\"value\">__S4_VALUE__</span>\n      </div>\n\n      <div class=\"field\">\n        <span class=\"label\">Status</span>\n        <span class=\"value\">__S5_VALUE__</span>\n      </div>\n\n      <div class=\"field\">\n        <span class=\"label\">__S6_LABEL__</span>\n        <span class=\"value\">__S6_VALUE__</span>\n      </div>\n\n      <div class=\"field\">\n        <span class=\"label\">Operated by</span>\n        <span class=\"value\">__S7_VALUE__</span>\n      </div>\n\n      <div class=\"seat-box\">\n        <span class=\"label\">Seat</span>\n        <div class=\"seat\">__SEAT_VALUE__</div>\n      </div>\n    </section>\n\n    <footer class=\"bottom\">\n      <div>\n        <span class=\"label\">Booking reference</span>\n        <span class=\"value\">__BOOKING_REF__</span>\n      </div>\n\n      <div>\n        <span class=\"label\">Frequent traveller</span>\n        <span class=\"value\">__LOYALTY__</span>\n      </div>\n\n      <div class=\"notice\">\n        __NOTICE_LINE1__<br>\n        __NOTICE_LINE2__\n      </div>\n    </footer>\n\n  </div>\n\n  <aside class=\"barcode-zone\" aria-label=\"SKANDI PDF417 service barcode\">\n    <img\n      class=\"pdf417-real\"\n      alt=\"PDF417 sample barcode\"\n      src=\"__PDF417_URL__\"\n    >\n  </aside>\n\n  <div class=\"barcode-caption\">PDF417<br>__BARCODE_CAPTION__</div>\n\n  <div class=\"watermark\"><span>__WATERMARK__</span></div>\n\n</article>\n\n</body>\n</html>\n";

const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const text = (v, n = 1000) => String(v ?? "").trim().slice(0, n);
const upper = (v, n = 1000) => text(v, n).toUpperCase();
const esc = (v) => text(v, 4000)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
const pad3 = (v) => String(v || "1").replace(/\D/g, "").slice(-3).padStart(3, "0");

function dateDisplay(value) {
  const s = text(value, 40);
  if (!s) return "—";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return upper(s.slice(0, 5), 8);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${m[3]}${months[Math.max(0, Math.min(11, Number(m[2]) - 1))]}`;
}
function timeDisplay(value) {
  const s = text(value, 80);
  if (!s) return "—";
  const m = s.match(/T(\d{2}:\d{2})/) || s.match(/\b(\d{2}:\d{2})\b/);
  return m ? m[1] : s.slice(0, 5);
}
function passengerName(p = {}) {
  const name = text(p.display_name || p.displayName ||
    [p.first_name || p.firstName, p.last_name || p.lastName].filter(Boolean).join(" "), 300);
  return upper(name || "PASSENGER", 300);
}
function code(value, fallback = "—") {
  const s = upper(value, 16).replace(/[^A-Z0-9]/g, "");
  return s || fallback;
}
function full(value, fallback = "—") {
  return upper(text(value, 500) || fallback, 500);
}
function providerName(component = {}, segment = {}, booking = {}) {
  const cp = obj(component.payload), sp = obj(segment.payload), bp = obj(booking.payload);
  return full(
    cp.providerName || cp.operatorName || cp.operatedBy ||
    sp.operatingCarrier || sp.operatorCarrier || sp.operatedBy ||
    component.supplier || segment.supplier || booking.supplier || bp.providerName || "SKANDI TRAVELS"
  );
}
function pdf417Url(payload) {
  return "https://bwipjs-api.metafloor.com/?bcid=pdf417&text=" +
    encodeURIComponent(payload) +
    "&columns=6&eclevel=2&scale=3&paddingwidth=4&paddingheight=2";
}
function fill(template, values) {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`__${key}__`).join(String(value));
  }
  return out;
}

function dataForVariant(variant, booking, passenger, segment, component, documentNumber, authority) {
  const bp = obj(booking.payload), pp = obj(passenger.payload), sp = obj(segment.payload), cp = obj(component.payload);
  const ref = upper(booking.booking_reference || booking.bookingReference || booking.pnr_locator || booking.pnrLocator || documentNumber, 120);
  const pax = passengerName(passenger);
  const loyalty = upper(obj(pp.clubProfile).memberNumber || obj(pp.clubProfile).tier || pp.frequentFlyer || "SKANDI CLUB", 100);
  const sequence = pad3(passenger.sequence_number || passenger.sequenceNumber || pp.sequenceNumber || 1);
  const seat = upper(passenger.seat_number || passenger.seatNumber || pp.seat || "—", 20);

  if (variant === "TRANSFER_TICKET") {
    const service = upper(cp.serviceNumber || cp.transferNumber || component.supplier_reference || component.supplierReference || documentNumber, 80);
    const pickupCode = code(cp.pickupCode || cp.originCode || booking.origin, "PICK");
    const dropCode = code(cp.dropoffCode || cp.destinationCode || booking.destination, "DROP");
    const pickup = full(cp.pickupLocation || cp.pickupPoint || cp.origin || booking.origin || "PICKUP");
    const drop = full(cp.dropoffLocation || cp.dropoffPoint || cp.destination || booking.destination || "DROP-OFF");
    const date = cp.serviceDate || cp.startDate || booking.departure_date || booking.departureDate;
    const departure = cp.serviceTime || cp.pickupTime || cp.startTime;
    const report = cp.reportTime || cp.meetingTime || cp.pickupTime || departure;
    const bay = upper(obj(cp.transferDcsState).bay || cp.bay || cp.meetingPoint || "—", 40);
    const vehicle = upper(obj(cp.transferDcsState).vehicle || cp.vehicleName || cp.vehicleType || "COACH", 100);
    const provider = providerName(component, segment, booking);
    return {
      htmlTitle: "SKANDI Transfer Ticket",
      statusMark: "SKANDI ISSUED",
      docTitle: "TRANSFER TICKET",
      docSubtitle: "SKANDI GROUND TRANSPORT",
      seqLine: `SEQ ${sequence}`,
      zoneLine: `ZONE ${upper(cp.zone || cp.transferZone || "GROUND", 20)}`,
      passenger: pax,
      routeLine: `${pickup} TO ${drop}`,
      p1Label: "Service", p1Value: service,
      p2Label: "Pickup", p2Value: pickupCode, p2Caption: pickup,
      p3Label: "Drop-off", p3Value: dropCode, p3Caption: drop,
      p4Label: "Bay", p4Value: bay,
      p5Label: "Report", p5Value: timeDisplay(report),
      s1Value: dateDisplay(date),
      s2Value: timeDisplay(departure),
      s3Label: "Vehicle", s3Value: vehicle,
      s4Label: "Ticket type", s4Value: "TRANSFER",
      s5Value: upper(component.status || cp.status || "CONFIRMED", 30),
      s6Label: "Provider", s6Value: provider,
      s7Value: full(cp.operatedBy || provider),
      seatValue: upper(cp.seat || pp.transferSeat || seat || "—", 20),
      bookingRef: ref,
      loyalty,
      noticeLine1: "SKANDI TRANSFER SERVICE DOCUMENT",
      noticeLine2: "PDF417 CONTAINS SKANDI SERVICE-TICKET DATA · NOT AN AIRLINE BCBP",
      watermark: "SKANDI TRAVELS",
      barcodeCaption: "SERVICE DATA",
      barcodePayload: ["SKANDI","TRANSFER_TICKET",documentNumber,ref,pax,service,pickupCode,dropCode,dateDisplay(date),timeDisplay(report)].join("|")
    };
  }

  if (variant === "TOUR_TICKET") {
    const service = upper(cp.serviceNumber || cp.tourCode || cp.activityCode || component.supplier_reference || component.supplierReference || documentNumber, 80);
    const meetCode = code(cp.meetingCode || cp.originCode || booking.origin, "MEET");
    const destCode = code(cp.destinationCode || cp.areaCode || booking.destination, "TOUR");
    const meeting = full(cp.meetingLocation || cp.meetingPoint || cp.pickupLocation || "MEETING POINT");
    const destination = full(cp.destinationName || cp.destination || cp.areaName || component.title || booking.destination || "TOUR");
    const date = cp.activityDate || cp.serviceDate || cp.startDate || booking.departure_date || booking.departureDate;
    const start = cp.activityTime || cp.startTime || cp.serviceTime;
    const report = cp.reportTime || cp.meetingTime || start;
    const zone = upper(cp.meetingZone || cp.zone || cp.meetingPointCode || "—", 40);
    const ticketType = upper(cp.ticketType || cp.category || "TOUR", 80);
    const provider = providerName(component, segment, booking);
    return {
      htmlTitle: "SKANDI Tour Ticket",
      statusMark: "SKANDI ISSUED",
      docTitle: "TOUR TICKET",
      docSubtitle: "SKANDI ACTIVITY DOCUMENT",
      seqLine: `SEQ ${sequence}`,
      zoneLine: `ZONE ${upper(cp.zone || "TOUR", 20)}`,
      passenger: pax,
      routeLine: `${meeting} TO ${destination}`,
      p1Label: "Tour", p1Value: service,
      p2Label: "Meet", p2Value: meetCode, p2Caption: meeting,
      p3Label: "To", p3Value: destCode, p3Caption: destination,
      p4Label: "Zone", p4Value: zone,
      p5Label: "Start", p5Value: timeDisplay(start),
      s1Value: dateDisplay(date),
      s2Value: timeDisplay(report),
      s3Label: "Type", s3Value: ticketType,
      s4Label: "Ticket type", s4Value: "TOUR",
      s5Value: upper(component.status || cp.status || "CONFIRMED", 30),
      s6Label: "Provider", s6Value: provider,
      s7Value: full(cp.operatedBy || provider),
      seatValue: upper(cp.seat || cp.participantNumber || pp.tourSeat || "—", 20),
      bookingRef: ref,
      loyalty,
      noticeLine1: "SKANDI TOUR / ACTIVITY SERVICE DOCUMENT",
      noticeLine2: "PDF417 CONTAINS SKANDI SERVICE-TICKET DATA · NOT AN AIRLINE BCBP",
      watermark: "SKANDI TRAVELS",
      barcodeCaption: "SERVICE DATA",
      barcodePayload: ["SKANDI","TOUR_TICKET",documentNumber,ref,pax,service,meetCode,destCode,dateDisplay(date),timeDisplay(start)].join("|")
    };
  }

  const flight = upper(segment.flight_number || segment.flightNumber || sp.flightNumber || sp.serviceNumber || documentNumber, 80);
  const originCode = code(segment.origin || sp.originCode || booking.origin, "ORG");
  const destinationCode = code(segment.destination || sp.destinationCode || booking.destination, "DST");
  const originName = full(sp.originName || sp.departureStation || segment.origin || booking.origin || "ORIGIN");
  const destinationName = full(sp.destinationName || sp.arrivalStation || segment.destination || booking.destination || "DESTINATION");
  const date = segment.departure_date || segment.departureDate || sp.departingAt || sp.departureDate || booking.departure_date || booking.departureDate;
  const departure = segment.departure_time || segment.departureTime || sp.departingAt || sp.departureTime;
  const boarding = sp.boardingTime || sp.boarding || pp.boardingTime || departure;
  const gate = upper(sp.gate || pp.gate || "—", 30);
  const cabin = upper(segment.cabin || sp.cabinClass || sp.cabin || "ECONOMY", 80);
  const bookingClass = upper(segment.booking_class || segment.bookingClass || sp.bookingClass || "", 12);
  const operator = providerName(component, segment, booking);
  const airline = full(sp.marketingCarrier || sp.carrierName || segment.supplier || booking.supplier || "SKANDI");
  const zone = upper(pp.boardingZone || sp.boardingZone || "3", 20);
  return {
    htmlTitle: "SKANDI Boarding Pass",
    statusMark: authority === "SKANDI_CHARTER_DCS" ? "SKANDI DCS" : "SKANDI ISSUED",
    docTitle: "BOARDING PASS",
    docSubtitle: "SKANDI DCS / BOARDING DOCUMENT",
    seqLine: `SEQ ${sequence}`,
    zoneLine: `ZONE ${zone}`,
    passenger: pax,
    routeLine: `${originName} TO ${destinationName}`,
    p1Label: "Flight", p1Value: flight,
    p2Label: "From", p2Value: originCode, p2Caption: originName,
    p3Label: "To", p3Value: destinationCode, p3Caption: destinationName,
    p4Label: "Gate", p4Value: gate,
    p5Label: "Boarding", p5Value: timeDisplay(boarding),
    s1Value: dateDisplay(date),
    s2Value: timeDisplay(departure),
    s3Label: "Class", s3Value: [bookingClass, cabin].filter(Boolean).join(" / "),
    s4Label: "Ticket type", s4Value: "BOARDING",
    s5Value: upper(passenger.checkin_status || passenger.checkinStatus || "CONFIRMED", 30),
    s6Label: "Airline", s6Value: airline,
    s7Value: operator,
    seatValue: seat,
    bookingRef: ref,
    loyalty,
    noticeLine1: "SKANDI-CONTROLLED BOARDING DOCUMENT",
    noticeLine2: "NOT VALID FOR A SUPPLIER-CONTROLLED FLIGHT WITHOUT AIRLINE / DCS AUTHORITY",
    watermark: "SKANDI TRAVELS",
    barcodeCaption: "SKANDI DCS DATA",
    barcodePayload: ["SKANDI","BOARDING_CARD",documentNumber,ref,pax,flight,originCode,destinationCode,dateDisplay(date),timeDisplay(boarding),seat].join("|")
  };
}

export function renderAtbTicket({
  variant = "BOARDING_CARD",
  booking = {},
  passenger = {},
  segment = {},
  component = {},
  documentNumber = "",
  authority = "SKANDI_BOOKING"
} = {}) {
  const v = upper(variant, 40);
  const data = dataForVariant(v, booking, passenger, segment, component, documentNumber, authority);
  const values = {
    HTML_TITLE: esc(data.htmlTitle),
    STATUS_MARK: esc(data.statusMark),
    DOC_TITLE: esc(data.docTitle),
    DOC_SUBTITLE: esc(data.docSubtitle),
    SEQ_LINE: esc(data.seqLine),
    ZONE_LINE: esc(data.zoneLine),
    PASSENGER: esc(data.passenger),
    ROUTE_LINE: esc(data.routeLine),
    P1_LABEL: esc(data.p1Label), P1_VALUE: esc(data.p1Value),
    P2_LABEL: esc(data.p2Label), P2_VALUE: esc(data.p2Value), P2_CAPTION: esc(data.p2Caption),
    P3_LABEL: esc(data.p3Label), P3_VALUE: esc(data.p3Value), P3_CAPTION: esc(data.p3Caption),
    P4_LABEL: esc(data.p4Label), P4_VALUE: esc(data.p4Value),
    P5_LABEL: esc(data.p5Label), P5_VALUE: esc(data.p5Value),
    S1_VALUE: esc(data.s1Value), S2_VALUE: esc(data.s2Value),
    S3_LABEL: esc(data.s3Label), S3_VALUE: esc(data.s3Value),
    S4_LABEL: esc(data.s4Label), S4_VALUE: esc(data.s4Value),
    S5_VALUE: esc(data.s5Value),
    S6_LABEL: esc(data.s6Label), S6_VALUE: esc(data.s6Value),
    S7_VALUE: esc(data.s7Value),
    SEAT_VALUE: esc(data.seatValue),
    BOOKING_REF: esc(data.bookingRef),
    LOYALTY: esc(data.loyalty),
    NOTICE_LINE1: esc(data.noticeLine1),
    NOTICE_LINE2: esc(data.noticeLine2),
    WATERMARK: esc(data.watermark),
    BARCODE_CAPTION: esc(data.barcodeCaption),
    PDF417_URL: pdf417Url(data.barcodePayload)
  };
  return fill(TEMPLATE, values);
}
