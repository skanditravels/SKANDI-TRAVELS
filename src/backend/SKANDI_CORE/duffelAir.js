// /src/backend/SKANDI_CORE/bagTag.js
// SKANDI R-006.6 — ZPL Industrial Baggage Tag Renderer.

const TEMPLATE = `^XA
^MMP
^PW432
^LL3456
^LS0
^FX --- INVERTED TOP Passenger STUB --
^FO0,160^GB20,250,20^FS
^FO316,160^GB20,250,20^FS
^FO29,165^GB280,2,2^FS
^FX --- BELOW --- SEGMENT - 3 (Final Destination) ---
^FO170,185^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg3_destination}}^FS
^FO30,185^A@I,20,23,E:DIN.FNT^FB90,1,0,R^FD{{seg3_date}}^FS
^FO130,185^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{seg3_flightNum}}/^FS
^FO185,185^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{seg3_carrier}}^FS
^FO130,205^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg3_cityName}}^FS
^FO170,205^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg3_via}}^FS
^FX --- BELOW --- SEGMENT - 2 (Connection) ---
^FO30,230^A@I,20,23,E:DIN.FNT^FB90,1,0,R^FD{{seg2_date}}^FS
^FO130,230^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{seg2_flightNum}}/^FS
^FO185,230^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{seg2_carrier}}^FS
^FO170,230^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg2_destination}}^FS
^FO130,255^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg2_cityName}}^FS 
^FO170,255^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg2_via}}^FS
^FX --- BELOW --- SEGMENT - 1 (First Flight) ---
^FO30,280^A@I,20,23,E:DIN.FNT^FB90,1,0,R^FD{{seg1_date}}^FS
^FO130,280^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{seg1_flightNum}}/^FS
^FO185,280^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{seg1_carrier}}^FS
^FO170,305^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg1_to}}^FS
^FO170,280^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg1_destination}}^FS
^FO130,305^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{seg1_cityName}}^FS
^FX --- LOWER DIVIDER LINE ---
^FO29,330^GB280,2,2^FS
^FO100,335^A@I,20,23,E:DIN.FNT^FB60,1,0,L^FD{{bnNumber}}^FS
^FO220,335^A@I,20,23,E:DIN.FNT^FB40,1,0,L^FD{{baggageWeight}}^FS
^FO140,335^A@I,23,23,E:DIN.FNT^FB140,1,0,L^FD{{bag_divider}}^FS
^FO170,335^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{baggageCount}}^FS
^FO30,365^A@I,20,23,E:DIN.FNT^FD{{pnrLocator}}^FS
^FO170,365^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{lastName}}^FS 
^FO170,390^A@I,20,23,E:DIN.FNT^FB140,1,0,L^FD{{shortDate}}^FS
^FO140,390^A@I,23,23,E:DIN.FNT^FDSKANDI^FS
^FO30,390^A@I,20,23,E:DIN.FNT^FDALTEA^FS
^FO30,420^A@I,20,20,E:DIN.FNT^FD{{airlineName}}^FS
^FO12,500^A@I,20,21,E:DIN.FNT^FD BAGGAGAGE IDENTIFICATION TAG^FS
^XZ`;

const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = (v) => Array.isArray(v) ? v : [];
const text = (v, n = 100) => String(v ?? "").trim().slice(0, n).toUpperCase();

function dateDisplay(value) {
  const s = text(value, 40);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s ? s : "";
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${m[3]}${months[Math.max(0, Math.min(11, Number(m[2]) - 1))]}`;
}

export function renderBagTag({ booking = {}, passenger = {}, segments = [], documentNumber = "", airlineName = "" } = {}) {
  const flights = arr(segments);
  const bp = obj(booking.payload);

  // Set default / bottom variables
  const values = {
    bnNumber: text(passenger.bnNumber || passenger.sequenceNumber),
    baggageWeight: passenger.baggageWeight ? passenger.baggageWeight + "KG" : "",
    baggageCount: passenger.baggageCount ? passenger.baggageCount : "",
    bag_divider: passenger.baggageCount ? "/" : "",
    pnrLocator: text(booking.bookingReference || booking.pnrLocator || documentNumber),
    lastName: text(passenger.lastName || passenger.familyName || passenger.last_name || "PASSENGER"),
    shortDate: dateDisplay(booking.departureDate || new Date().toISOString()),
    airlineName: text(airlineName || booking.supplier || "SKANDI")
  };

  // Initialize segment variables to empty strings (in case passenger has less than 3 flights)
  for (let i = 1; i <= 3; i++) {
    values[`seg${i}_destination`] = "";
    values[`seg${i}_date`] = "";
    values[`seg${i}_flightNum`] = "";
    values[`seg${i}_carrier`] = "";
    values[`seg${i}_cityName`] = "";
    values[`seg${i}_via`] = "";
  }
  values[`seg1_to`] = "";

  // Populate actual segments dynamically (Max 3)
  flights.slice(0, 3).forEach((seg, index) => {
     const segId = `seg${index + 1}`;
     values[`${segId}_destination`] = text(seg.destination?.iataCode || seg.destination);
     values[`${segId}_date`] = dateDisplay(seg.departingAt || seg.departureDate);
     values[`${segId}_flightNum`] = text(seg.marketingFlightNumber || seg.flightNumber);
     values[`${segId}_carrier`] = text(seg.marketingCarrier?.iataCode || seg.carrier);
     values[`${segId}_cityName`] = text(seg.destination?.cityName || seg.destination?.iataCode || seg.destination);

     // Only add the "TO" and "VIA" markers if the segment actually exists
     if (index === 0) values[`seg1_to`] = "TO";
     if (index > 0) values[`${segId}_via`] = "VIA";
  });

  // Fallback for Manual Charter Bookings (Where `segments` array is empty)
  if (flights.length === 0 && booking.destination) {
     values.seg1_destination = text(booking.destination);
     values.seg1_date = dateDisplay(booking.departureDate);
     const fNum = text(booking.flightNumber);
     values.seg1_carrier = fNum.replace(/[0-9]+$/, ''); // Extracts "SK" from "SK903"
     values.seg1_flightNum = fNum.replace(/^[A-Z]+/, ''); // Extracts "903" from "SK903"
     values.seg1_to = "TO";
  }

  // Inject values into the ZPL template
  let zpl = TEMPLATE;
  for (const [key, val] of Object.entries(values)) {
     zpl = zpl.split(`{{${key}}}`).join(val);
  }
  return zpl;
}
