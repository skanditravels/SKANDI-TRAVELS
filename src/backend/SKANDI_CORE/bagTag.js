// /src/backend/SKANDI_CORE/bagTag.js
// SKANDI R-006.6 — ZPL Industrial Baggage Tag Renderer.

const TEMPLATE = `^XA
^MMP
^PW432
^LL4263
^LS0

^FX --- INVERTED TOP Passenger STUB --

^FX EU-bars on edges
^FO0,160^GB20,250,20^FS
^FO316,160^GB20,250,20^FS

^FO29,165^GB280,2,2^FS

^FX (Rotated 180 degrees)

^FX --- Mini Receipt Barcode (Height=100 dots) ---
^FO70,10^A0I,36,36^FD0 001 234567^FS
^BY2,3,90^FT25,150^BCN,,N,N^FD0001234567^FS

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
^FO140,390^A@I,20,23,E:DIN.FNT^FDSKANDI^FS
^FO30,390^A@I,20,23,E:DIN.FNT^FDALTEA^FS
^FO30,420^A@I,20,20,E:DIN.FNT^FD{{airlineName}}^FS
^FO12,500^A@I,20,21,E:DIN.FNT^FD BAGGAGAGE IDENTIFICATION TAG^FS
^FO0,530^GB340,2,2^FS

^FX --- Passenger Stub Above ---

^FX --- HORIZONTAL BARCODE BELOW ---

^FX Sideways barcode spanning the width of the tag
^BY3,3,350
^FO10,540^BCR,310,N,N,N^FD{{licensePlate}}^FS

^FX Separator
^FO0,1020^GB430,2,2^FS

^FX --- SECTION 3: MASSIVE VERTICAL BARCODE ---

^FX Picket fence barcode stretched down the center
^BY5,3,1500
^FO10,1030^BCN,500,N,N,N^FD{{licensePlate}}^FS

^FX SKANDI LOGO
^FO10,1530^GFA,2560,2560,40,:Z64:eJzt1T+OGzcUBvBvllhMABV0t2kC+ga6QaibKDdwuqQjgxQ5RvYIucHyCJsuXQikcRHAA3gRExuKX/RxJM1o48JNgBRmI2H0E/88vvcG+Dz+f8Pxk9jwc/tWnxHAF3gN4BWA3WvgewA3FzeSdWAcWIA7ZhhOGJg8+Rfgni/OkpNh1M9w3ZWj23mSEa5c3JYshnFkAvzVfLyHq6tjdGcX9wTDuCc5wS8uNF9GRscIBGYMrGdX1o7v/p5GwjcAD0y4ZZML/IMF24sbOBm5IMeLQ5hGVviyuITHo2PVdybFCZo/g+2F+2Zsg8IyaOtyt4RPWmIVF92aaT18ZnZNjhnugP10ZkZu0wyz5vOT4h7H1p12eeVs62Eez85U8B722iXAPluFz7bZJdPkxmuXAVvsPK0v3dk29JNfuQLY2sN8V33RPd7b55Pj4xKXBrgaFHhb5A7Mi8uLY5JToHxxBa4w2/pvF/iL1tJGwjS7ydUbRowcFgelhWN/0J0toXzMBV2jFgeYXT05M7uQVvl8kFMZheie4Mu+unJyXNwx/qf5Bia5t776MjS8cCYwzs5wns/XbTFyB6ycknM+h2H0FX5ybXusBMAe0LdzKaS0fy+ndaoO3Xzurpm1u+1O6Ve/YukJ7/J4AO6unWEKv/Kt/v9dd5ZeFQN37Ybuip5T62Z1CNsAX0174ZLywJFUIo/kY3dlfOGYlTXb7h7k+nyhn/raqXw9P9iGh2TILMdp5V6d3EE3/ZttYLoh852ax2QX96XCy+zZA350IQ6zG5k3i/v6GN4fmFRHJDZESHKuKv6btrjklD6OaQhP2Byvftdvsg6/9+nPw/Od0sIeHVWUZ0cGYuUc2brLqlC5iNAdG8bF7XUHart55K6nQndqu3/CLm0oqD4Yb+dgjdSVup65nNbtKpDTjdp90eHG9iMjfHeHtG7jb8jd/FrQInI6mzL8A+CeLk7lYVocWPXn2bkWQ8/wldN7SHuiehAMf5JTG+8NYlkXblUqn8d/Mv4BJnW4/Q==:6F1D^FS

^FX SKANDI PRIORITY / RUSH / CREW
^FO15,1590^GB300,70,5^FS

^FX -- Priority Indicator (Large Block) --
^FT25,1650^A0N,60,70^FDPRIORITY^FS

^FX Green/Black bars on edges
^FO0,1700^GB20,940,20^FS
^FO320,1700^GB20,940,20^FS

^FX --- Class of Travel / Sequence Number ---
^FT30,1692^A@N,22,26,E:DIN.FNT^FDSEQ:{{sequenceNumber}}  / CLASS: {{cabinClass}}^FS
^FO85,1705^A@N,22,26,E:DIN.FNT^FB30,1,0,C^FDPNR:{{pnrLocator}} BN:{{bnNumber}}^FS

^FX --- Passenger Name ---
^FT30,1750^A@N,22,26,E:DIN.FNT^FD{{lastName}} / {{firstName}} {{title}}^FS

^FX --- Weight and Total Bag Count --
^FT30,1775^A@N,22,26,E:DIN.FNT^FDWT: {{baggageWeight}} / PCS: {{bagIndex}}-{{baggageCount}}^FS
^FO29,1780^GB280,2,2^FS

^FX --- MID DESTINATION CODES ---

^FX Upper Block: TO CDG
^FO30,1800^A0N,30,30^FD{{seg1_to}}^FS
^FO0,1840^A0N,160,160^FB340,1,0,C^FD{{seg1_destination}}^FS
^FO20,1980^A0N,50,50^FB430,1,0,C^FD{{seg1_carrier}}{{seg1_flightNum}}^FS

^FX Center separator line
^FO20,2050^GB370,4,4^FS

^FX Lower Block: VIA 
^FO30,2080^A0N,30,30^FD{{seg2_via}}^FS
^FO0,2120^A0N,160,160^FB340,1,0,C^FD{{seg2_destination}}^FS
^FO20,2260^A0N,50,50^FB430,1,0,C^FD{{seg2_carrier}}{{seg2_flightNum}}^FS

^FX Secondary separator line
^FO20,2330^GB370,4,4^FS

^FX ---- END OF EU LINES
^FO9,2650^GB310,2,2^FS
^FT20,2700^A@N,26,26,E:DIN.FNT^FD{{lastName}} / {{firstName}} {{title}}^FS

^FX --- Mini Destination and Flight Data
^FT20,2750^A@N,40,40,E:DIN.FNT^FD{{seg1_destination}}^FS
^FT190,2750^A@N,40,40,E:DIN.FNT^FDSEQ:{{sequenceNumber}}^FS
^FO0,2780^GB430,2,2^FS

^FX Sideways barcode spanning the width of the tag
^BY3,3,340
^FO10,3215^BCR,310,N,N,N^FD{{licensePlate}}^FS

^FX --- SECTION 3: MASSIVE VERTICAL BARCODE ---
^BY5,3,1500
^FO10,2800^BCN,400,N,N,N^FD{{licensePlate}}^FS
^FO0,3700^GB430,2,2^FS

^FX --- SECTION 6: REMOVABLE BINGO STUBS ---
^BY2,3,4000

^FX Stub 1
^FO10,3720^BCN,100,N,N,N^FD{{licensePlate}}^FS
^FO0,3834^GB430,2,2^FS

^FX Stub 2
^FO10,3850^BCN,100,N,N,N^FD{{licensePlate}}^FS
^FO0,3960^GB430,2,2^FS

^FX Stub 3 (With text underneath)
^FO10,3980^BCN,100,Y,N,N^FD{{licensePlate}}^FS
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

export function renderBagTag({ booking = {}, passenger = {}, segments = [], documentNumber = "", licensePlate = "", airlineName = "" } = {}) {
  const flights = arr(segments);

  // Set default / bottom variables
  const values = {
    bnNumber: text(passenger.bnNumber || passenger.sequenceNumber),
    baggageWeight: passenger.baggageWeight ? passenger.baggageWeight + "KG" : "",
    baggageCount: passenger.baggageCount ? passenger.baggageCount : "1",
    bagIndex: passenger.bagIndex || "1",
    bag_divider: passenger.baggageCount ? "/" : "",
    pnrLocator: text(booking.bookingReference || booking.pnrLocator || documentNumber),
    lastName: text(passenger.lastName || passenger.familyName || passenger.last_name || "PASSENGER"),
    firstName: text(passenger.firstName || passenger.givenName || passenger.first_name || ""),
    title: text(passenger.title || ""),
    sequenceNumber: text(passenger.sequenceNumber),
    cabinClass: text(passenger.cabinClass || "Y"),
    shortDate: dateDisplay(booking.departureDate || new Date().toISOString()),
    licensePlate: text(licensePlate),
    airlineName: text(airlineName || booking.supplier || "SKANDI")
  };

  // Initialize segment variables to empty strings (in case passenger has fewer flights)
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

     if (index === 0) values[`seg1_to`] = "TO";
     if (index > 0) values[`${segId}_via`] = "VIA";
  });

  // Fallback for Manual Charter Bookings (Where `segments` array is empty)
  if (flights.length === 0 && booking.destination) {
     values.seg1_destination = text(booking.destination);
     values.seg1_date = dateDisplay(booking.departureDate);
     const fNum = text(booking.flightNumber);
     values.seg1_carrier = fNum.replace(/[0-9]+$/, ''); 
     values.seg1_flightNum = fNum.replace(/^[A-Z]+/, ''); 
     values.seg1_to = "TO";
  }

  // Inject values into the ZPL template
  let zpl = TEMPLATE;
  for (const [key, val] of Object.entries(values)) {
     zpl = zpl.split(`{{${key}}}`).join(val);
  }
  return zpl;
}
