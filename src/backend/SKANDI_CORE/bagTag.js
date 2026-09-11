// /src/backend/SKANDI_CORE/bagTag.js
// SKANDI R-005.4 — canonical long-form baggage tag renderer.
// Visual source: approved IATA-style 2 × 17 inch / 203 DPI prototype.
// Unlike the approved visual prototype, this production renderer replaces
// decorative bars with a scannable Code 128 representation of the supplied
// 10-digit baggage license plate.

const TEMPLATE = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>IATA Resolution 740 Automated Baggage Tag - Industrial Replica</title>\n    \n    <!-- Tightly compressed monospace stack replicating direct thermal printheads -->\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    <link href=\"https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap\" rel=\"stylesheet\">\n    \n    <style>\n        /* GLOBAL CANVAS SETTINGS */\n        body {\n            background-color: #d1d5db;\n            display: flex;\n            justify-content: center;\n            padding: 40px 0;\n            margin: 0;\n        }\n\n        /* \n         * 1. CANVAS DIMENSIONS & SCALING (203 DPI PRINT-READY)\n         * Enforcing absolute locked container limits: 2\" (406px) by 17\" (3451px)\n         */\n        .abt-container {\n            width: 406px;\n            min-height: 3451px;\n            background-color: #ffffff;\n            border: 1px dashed #a3a3a3;\n            box-sizing: border-box;\n            font-family: 'Roboto Mono', 'Courier New', monospace;\n            text-transform: uppercase;\n            color: #000000;\n            display: flex;\n            flex-direction: column;\n            box-shadow: 0px 30px 60px rgba(0, 0, 0, 0.3);\n            position: relative;\n            overflow: hidden; /* Ensure nothing clips outside the physical tag dimensions */\n        }\n\n        /* INLINE SVG BARCODE BASE CLASSES */\n        .svg-barcode {\n            fill: #000000;\n            display: block;\n        }\n\n        /* \n         * ZONE 1: THE ATTACHMENT LOOP \n         */\n        .zone-1-loop {\n            height: 1000px;\n            width: 100%;\n            border-bottom: 2px dotted #cccccc;\n            box-sizing: border-box;\n            display: flex;\n            align-items: flex-end;\n            justify-content: center;\n            padding-bottom: 40px;\n        }\n\n        .folding-apex-indicator {\n            color: #a3a3a3;\n            font-size: 14px;\n            font-weight: 700;\n            letter-spacing: 2px;\n        }\n\n        /* \n         * ZONE 2: CARRIER & PASSENGER METADATA\n         */\n        .zone-2-metadata {\n            height: 400px;\n            width: 100%;\n            border-bottom: 4px solid #000000;\n            box-sizing: border-box;\n            padding: 40px 30px;\n            display: flex;\n            flex-direction: column;\n        }\n\n        .carrier-header {\n            display: flex;\n            justify-content: space-between;\n            font-size: 18px;\n            font-weight: 700;\n        }\n\n        .pax-name {\n            font-size: 42px;\n            font-weight: 700;\n            margin-top: 45px;\n            line-height: 1.1;\n            letter-spacing: -1px;\n        }\n\n        .pnr-box {\n            font-size: 60px;\n            font-weight: 700;\n            border: 2px solid #000000;\n            padding: 10px 20px;\n            margin-top: auto;\n            align-self: flex-start;\n            line-height: 1;\n            letter-spacing: 2px;\n        }\n\n        /* \n         * ZONE 3: PRIMARY HORIZONTAL AUTOMATED TRACKING\n         */\n        .zone-3-tracking {\n            height: 400px;\n            width: 100%;\n            border-bottom: 4px solid #000000;\n            box-sizing: border-box;\n            padding: 60px 30px;\n            display: flex;\n            flex-direction: column;\n            align-items: center;\n            justify-content: center;\n        }\n\n        .z3-barcode-wrapper {\n            width: 100%;\n            height: 170px;\n        }\n\n        .z3-license-plate {\n            font-size: 38px;\n            font-weight: 700;\n            letter-spacing: 6px;\n            margin-top: 40px;\n        }\n\n        /* \n         * ZONE 4: THE MULTI-ANGLE SORTING & ROUTING ARCHITECTURE\n         * Exact height: 1100px. Split into 326px / 80px CSS Grid columns.\n         */\n        .zone-4-routing {\n            height: 1100px;\n            width: 100%;\n            display: grid;\n            grid-template-columns: 326px 80px;\n            border-bottom: 4px solid #000000;\n            box-sizing: border-box;\n            position: relative;\n        }\n\n        /* LEFT ROUTING COLUMN (326px) */\n        .z4-left-col {\n            padding: 50px 30px;\n            display: flex;\n            flex-direction: column;\n            border-right: 4px solid #000000;\n            box-sizing: border-box;\n        }\n\n        .destination-code {\n            font-size: 160px;\n            font-weight: 700;\n            line-height: 0.8;\n            margin: 0;\n            transform: scaleX(0.85);\n            transform-origin: left;\n            letter-spacing: -5px;\n        }\n\n        .destination-city {\n            font-size: 14px;\n            font-weight: 700;\n            margin-top: 15px;\n            letter-spacing: 1px;\n        }\n\n        .itinerary-matrix {\n            margin-top: 80px;\n            border-top: 4px solid #000000;\n            border-bottom: 4px solid #000000;\n            padding: 40px 0;\n            display: flex;\n            flex-direction: column;\n            gap: 30px;\n            font-size: 32px;\n            font-weight: 700;\n            line-height: 1.1;\n            letter-spacing: -1px;\n        }\n\n        .ops-stats {\n            margin-top: 50px;\n            display: flex;\n            flex-direction: column;\n            gap: 15px;\n            font-size: 24px;\n            font-weight: 700;\n            letter-spacing: -0.5px;\n        }\n\n        /* RIGHT ORTHOGONAL SIDEBAR STRIP (80px) */\n        .z4-right-col {\n            position: absolute;\n            right: 0;\n            top: 0;\n            width: 80px;\n            height: 1100px;\n            overflow: hidden;\n            box-sizing: border-box;\n        }\n\n        /* \n         * Rotating logic: \n         * Setting width to the height of the parent (1100px) and height to width (80px).\n         * Positioning it at left: 80px, then rotating 90deg from top-left hinges it perfectly \n         * downwards into the 80x1100 bounding box without clipping.\n         */\n        .sidebar-rotated-inner {\n            position: absolute;\n            left: 80px;\n            top: 0;\n            width: 1100px;\n            height: 80px;\n            transform-origin: top left;\n            transform: rotate(90deg);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 60px;\n            padding: 0 40px;\n            box-sizing: border-box;\n        }\n\n        .sidebar-barcode-wrapper {\n            width: 650px;\n            height: 50px;\n        }\n\n        .sidebar-license-plate {\n            font-size: 34px;\n            font-weight: 700;\n            letter-spacing: 5px;\n        }\n\n        /* \n         * ZONE 5: PEEL-OFF ADHESIVE BACKUP LABELS\n         */\n        .zone-5-backups {\n            height: 300px;\n            width: 100%;\n            border-bottom: 4px solid #000000;\n            box-sizing: border-box;\n            display: flex;\n            justify-content: space-evenly;\n            align-items: center;\n        }\n\n        .backup-stub {\n            width: 160px;\n            height: 220px;\n            border: 2px dashed #000000;\n            display: flex;\n            flex-direction: column;\n            justify-content: center;\n            align-items: center;\n            padding: 20px;\n            box-sizing: border-box;\n        }\n\n        .stub-barcode-wrapper {\n            width: 100%;\n            height: 50px;\n        }\n\n        .stub-license-plate {\n            font-size: 15px;\n            font-weight: 700;\n            margin: 20px 0;\n            letter-spacing: 1px;\n        }\n\n        .stub-hub {\n            font-size: 45px;\n            font-weight: 700;\n            line-height: 1;\n        }\n\n        /* \n         * ZONE 6: PERFORATION & PASSENGER RECEIPT STUB\n         */\n        .zone-6-receipt {\n            height: 351px;\n            width: 100%;\n            border-top: 3px dashed #000000; /* Micro-perforation */\n            box-sizing: border-box;\n            padding: 30px;\n            display: flex;\n            flex-direction: column;\n            justify-content: space-between;\n        }\n\n        .receipt-warning {\n            border: 2px solid #000000;\n            padding: 15px;\n            text-align: center;\n            font-size: 13px;\n            font-weight: 700;\n            line-height: 1.4;\n        }\n\n        .receipt-bottom {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n        }\n\n        .receipt-routing {\n            display: flex;\n            flex-direction: column;\n            gap: 12px;\n            font-size: 20px;\n            font-weight: 700;\n        }\n\n        .receipt-tracking {\n            display: flex;\n            flex-direction: column;\n            align-items: center;\n            gap: 15px;\n            width: 160px;\n        }\n\n        .receipt-barcode-wrapper {\n            width: 100%;\n            height: 50px;\n        }\n\n        .receipt-license {\n            font-size: 15px;\n            font-weight: 700;\n            letter-spacing: 1px;\n        }\n    </style>\n</head>\n<body>\n\n    <div class=\"abt-container\">\n        \n        <!-- ZONE 1: THE ATTACHMENT LOOP -->\n        <div class=\"zone-1-loop\">\n            <span class=\"folding-apex-indicator\">HANDLE WRAP / FOLD APEX</span>\n        </div>\n\n        <!-- ZONE 2: CARRIER & PASSENGER METADATA -->\n        <div class=\"zone-2-metadata\">\n            <div class=\"carrier-header\">\n                <span>__CARRIER_HEADER__</span>\n                <span>__ISSUED_TIME__</span>\n            </div>\n            <div class=\"pax-name\">__PASSENGER__</div>\n            <div class=\"pnr-box\">__BOOKING_REF__</div>\n        </div>\n\n        <!-- ZONE 3: PRIMARY HORIZONTAL AUTOMATED TRACKING -->\n        <div class=\"zone-3-tracking\">\n            <!-- Universal pure HTML SVG Barcode to guarantee crisp edges -->\n            <div class=\"z3-barcode-wrapper\">\n                <img src=\"__BARCODE_URL__\" alt=\"Baggage license plate barcode\" style=\"display:block;width:100%;height:100%;object-fit:fill;\">\n            </div>\n            <div class=\"z3-license-plate\">__LICENSE_DISPLAY__</div>\n        </div>\n\n        <!-- ZONE 4: THE MULTI-ANGLE SORTING & ROUTING ARCHITECTURE -->\n        <div class=\"zone-4-routing\">\n            <div class=\"z4-left-col\">\n                <div class=\"destination-code\">__DEST_CODE__</div>\n                <div class=\"destination-city\">__DEST_CITY__</div>\n                \n                <div class=\"itinerary-matrix\">\n                    <div>__ROUTE_1__</div>\n                    <div>__ROUTE_2__</div>\n                </div>\n\n                <div class=\"ops-stats\">\n                    <div>__DATE__</div>\n                    <div>__WEIGHT__</div>\n                    <div>__PIECES__</div>\n                </div>\n            </div>\n            \n            <div class=\"z4-right-col\">\n                <div class=\"sidebar-rotated-inner\">\n                    <div class=\"sidebar-barcode-wrapper\">\n                        <img src=\"__BARCODE_URL__\" alt=\"Baggage license plate barcode\" style=\"display:block;width:100%;height:100%;object-fit:fill;\">\n                    </div>\n                    <div class=\"sidebar-license-plate\">__LICENSE_DISPLAY__</div>\n                </div>\n            </div>\n        </div>\n\n        <!-- ZONE 5: PEEL-OFF ADHESIVE BACKUP LABELS -->\n        <div class=\"zone-5-backups\">\n            <div class=\"backup-stub\">\n                <div class=\"stub-barcode-wrapper\">\n                    <img src=\"__BARCODE_URL__\" alt=\"Baggage license plate barcode\" style=\"display:block;width:100%;height:100%;object-fit:fill;\">\n                </div>\n                <div class=\"stub-license-plate\">__LICENSE_DISPLAY__</div>\n                <div class=\"stub-hub\">__DEST_CODE__</div>\n            </div>\n            <div class=\"backup-stub\">\n                <div class=\"stub-barcode-wrapper\">\n                    <img src=\"__BARCODE_URL__\" alt=\"Baggage license plate barcode\" style=\"display:block;width:100%;height:100%;object-fit:fill;\">\n                </div>\n                <div class=\"stub-license-plate\">__LICENSE_DISPLAY__</div>\n                <div class=\"stub-hub\">__DEST_CODE__</div>\n            </div>\n        </div>\n\n        <!-- ZONE 6: PERFORATION & PASSENGER RECEIPT STUB -->\n        <div class=\"zone-6-receipt\">\n            <div class=\"receipt-warning\">\n                BAGGAGE CLAIM CHECK ONLY<br>\n                NOT A CERTIFICATE OF VALUABLE INSURED ITEMS\n            </div>\n            \n            <div class=\"receipt-bottom\">\n                <div class=\"receipt-routing\">\n                    <span>__ROUTE_1__</span>\n                    <span>__ROUTE_2__</span>\n                </div>\n                \n                <div class=\"receipt-tracking\">\n                    <div class=\"receipt-barcode-wrapper\">\n                        <img src=\"__BARCODE_URL__\" alt=\"Baggage license plate barcode\" style=\"display:block;width:100%;height:100%;object-fit:fill;\">\n                    </div>\n                    <div class=\"receipt-license\">__LICENSE_DISPLAY__</div>\n                </div>\n            </div>\n        </div>\n\n    </div>\n\n</body>\n</html>";

const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = (v) => Array.isArray(v) ? v : [];
const text = (v, n = 1000) => String(v ?? "").trim().slice(0, n);
const upper = (v, n = 1000) => text(v, n).toUpperCase();
const esc = (v) => text(v, 4000)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

function passengerName(p = {}) {
  const first = text(p.first_name || p.firstName, 160);
  const last = text(p.last_name || p.lastName, 160);
  const title = upper(obj(p.payload).title || "", 12);
  return upper(
    p.display_name || p.displayName ||
    [last, first].filter(Boolean).join("/") + (title ? ` ${title}` : "")
  , 300);
}
function dateDisplay(value) {
  const s = text(value, 40);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return upper(s || "—", 12);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${m[3]}${months[Math.max(0, Math.min(11, Number(m[2]) - 1))]}`;
}
function timeZulu(value) {
  const s = text(value, 80);
  const m = s.match(/T(\d{2}):(\d{2})/) || s.match(/\b(\d{2}):(\d{2})\b/);
  return m ? `${m[1]}:${m[2]}Z` : "—";
}
function flightSegments(segments) {
  return arr(segments).filter((s) => {
    const t = upper(s.segment_type || s.segmentType, 80);
    return t.includes("FLIGHT") || t.includes("AIR");
  });
}
function flightNo(s = {}) {
  const p = obj(s.payload);
  return upper(s.flight_number || s.flightNumber || p.flightNumber || p.serviceNumber || "", 40);
}
function destinationCode(s = {}, booking = {}) {
  return upper(s.destination || obj(s.payload).destinationCode || booking.destination || "DST", 8).replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
function destinationName(s = {}, booking = {}) {
  return upper(obj(s.payload).destinationName || obj(s.payload).arrivalStation || s.destination || booking.destination || "DESTINATION", 120);
}
function barcodeUrl(licensePlate) {
  return "https://bwipjs-api.metafloor.com/?bcid=code128&text=" +
    encodeURIComponent(licensePlate) +
    "&scale=3&height=10&includetext=false&paddingwidth=0&paddingheight=0";
}
function fill(template, values) {
  let out = template;
  for (const [key, value] of Object.entries(values)) out = out.split(`__${key}__`).join(String(value));
  return out;
}

export function renderBagTag({
  booking = {},
  passenger = {},
  segments = [],
  documentNumber = "",
  licensePlate = "",
  weightKg = 0,
  pieceNumber = 1,
  pieceCount = 1,
  journeyStatus = "",
  issuedAt = ""
} = {}) {
  const lp = text(licensePlate, 20).replace(/\D/g, "");
  if (!/^\d{10}$/.test(lp)) throw new Error("BAGGAGE_LICENSE_PLATE_10_DIGITS_REQUIRED");

  const flights = flightSegments(segments);
  const first = flights[0] || {};
  const final = flights[flights.length - 1] || first;
  const via = flights.length > 1 ? flights[0] : null;
  const bp = obj(booking.payload);
  const issuer = lp.slice(1, 4);
  const carrier = upper(
    obj(first.payload).marketingCarrier ||
    obj(first.payload).carrierName ||
    first.supplier ||
    booking.supplier ||
    "SKANDI TRAVELS",
    120
  );
  const finalCode = destinationCode(final, booking);
  const finalCity = destinationName(final, booking);
  const route1 = via
    ? `VIA ${flightNo(via) || "SERVICE"} ${destinationCode(via, booking)}`
    : `VIA ${flightNo(first) || "DIRECT"} ${upper(first.origin || booking.origin || "", 8)}`;
  const route2 = `FINAL ${flightNo(final) || "SERVICE"} ${finalCode}`;
  const date = dateDisplay(first.departure_date || first.departureDate || obj(first.payload).departingAt || booking.departure_date || booking.departureDate);
  const count = Math.max(1, Number(pieceCount) || 1);
  const piece = Math.max(1, Math.min(count, Number(pieceNumber) || 1));
  const weight = Math.max(0, Number(weightKg) || 0);
  const spaced = `${lp.slice(0,1)} ${lp.slice(1,4)} ${lp.slice(4)}`;

  return fill(TEMPLATE, {
    BARCODE_URL: barcodeUrl(lp),
    CARRIER_HEADER: esc(`${carrier} - ${issuer}`),
    ISSUED_TIME: esc(timeZulu(issuedAt || new Date().toISOString())),
    PASSENGER: esc(passengerName(passenger) || "PASSENGER"),
    BOOKING_REF: esc(upper(booking.booking_reference || booking.bookingReference || booking.pnr_locator || booking.pnrLocator || documentNumber, 80)),
    LICENSE_DISPLAY: esc(spaced),
    DEST_CODE: esc(finalCode),
    DEST_CITY: esc(finalCity),
    ROUTE_1: esc(route1),
    ROUTE_2: esc(route2),
    DATE: esc(date),
    WEIGHT: esc(`WT: ${weight.toFixed(1)} KG`),
    PIECES: esc(`PCS: ${piece}/${count}`)
  });
}
