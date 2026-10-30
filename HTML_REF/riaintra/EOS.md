# EOS Operations — complete intended source

STATUS: STATICALLY VERIFIED / REQUIRES LIVE TEST
ROUTE: /riaintra/success-factors/altea/eos
AREA: RIAINTRA / ALTEA
SOURCE OF BRAND ASSETS: src/pages/masterPage.js
LANGUAGE CONTROLLER: masterPage.js settings.language
LAST UPDATED: 2026-10-30

## 2026-10-30 — Brand asset mapping

The wide side-rail EOS mark uses brand.assets.logos.eosLight. The compact mobile mark uses eosIconLight. Both are received from SKANDI_MASTER_CONFIG. Unassigned fallback slots use [LEAVE_PLACEHOLDER]. No logo URL is embedded in EOS.

## COMPLETE INTENDED LIVE HTML

```html
<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><title>EOS | SKANDI ALTEA</title><script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script><script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script><script src="https://unpkg.com/@babel/standalone@7.29.7/babel.min.js"></script><script>tailwind.config = { darkMode: ['class', '.theme-dark'] };</script></head><body><div id="root"></div><script type="text/babel" src="skandi-eos.js"></script></body></html>

```

## COMPLETE INTENDED LIVE CSS

```css
:root {
      --sk-royal: #000F89;
      --sk-royal-mid: #0017A5;
      --sk-navy: #002244;
      --sk-blue: #0066CC;
      --sk-blue-light: #EBF3FA;
      --sk-red: #D22630;
      --sk-green: #108548;
      --sk-bg: #F2F4F7;
      --sk-card: #FFFFFF;
      --sk-text: #111827;
      --sk-muted: #6B7280;
      --sk-border: #E5E7EB;
    }

    .theme-dark {
      --sk-bg: #050B24;
      --sk-card: #0C1438;
      --sk-text: #F9FAFB;
      --sk-muted: #9CA3AF;
      --sk-border: #1E295B;
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: #090D16;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overscroll-behavior: none;
      overflow: hidden;
    }

    #root {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .device-iphone {
      width: 100%;
      max-width: 430px;
      height: 100%;
      max-height: 932px;
      border-radius: 36px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.75), 0 0 0 8px #1f2937;
    }

    .device-ipad {
      width: 100%;
      max-width: 1180px;
      height: 100%;
      max-height: 820px;
      border-radius: 28px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.75), 0 0 0 8px #1f2937;
    }

    @media (max-width: 500px) {
      .device-iphone {
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
        box-shadow: none;
      }
    }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .touch-target {
      min-height: 40px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .active-scale:active {
      transform: scale(0.97);
      transition: transform 0.1s ease;
    }

    .main-canvas-transition {
      transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.35s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.35s ease;
      transform-origin: center right;
    }
    .canvas-pushed {
      transform: translateX(255px) scale(0.86);
      border-radius: 28px !important;
      box-shadow: -16px 0 40px rgba(0, 0, 0, 0.45);
      overflow: hidden;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .slide-enter-active {
      animation: slideInRight 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    }

    @keyframes slideDownBanner {
      0% { transform: translateY(-120%); opacity: 0; }
      12% { transform: translateY(0); opacity: 1; }
      88% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(-120%); opacity: 0; }
    }
    .top-banner-anim {
      animation: slideDownBanner 4s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }

    .ios-switch {
      position: relative;
      width: 46px;
      height: 26px;
      appearance: none;
      background: #D1D5DB;
      outline: none;
      border-radius: 9999px;
      transition: background 0.25s ease;
      cursor: pointer;
      flex-shrink: 0;
    }
    .ios-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      background: #FFFFFF;
      border-radius: 9999px;
      transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.22);
    }
    .ios-switch:checked {
      background: #0066CC;
    }
    .ios-switch:checked::after {
      transform: translateX(20px);
    }

    .text-scale-small { font-size: 92%; }
    .text-scale-large { font-size: 100%; }

    .ofp-box {
      font-family: "Courier New", Courier, monospace;
      border: 1.5px solid #111827;
      background: #FFFFFF;
      color: #000000;
    }
    .ofp-cell {
      border-right: 1px solid #111827;
      border-bottom: 1px solid #111827;
      padding: 4px 6px;
    }

```

## COMPLETE INTENDED LIVE JAVASCRIPT

```javascript

  const { useState, useEffect } = React;

  const FLIGHTS_DATA = [];

  const INITIAL_CREW = [];
  const STATIONS_DB = [];

  // --- SVG ICONS ---
  const IconHamburger = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="17" x2="18" y2="17"/>
    </svg>
  );
  const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
  const IconPlane = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5Z"/></svg>;
  const IconSun = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
  const IconHouse = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const IconCalendarSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>;
  const IconMail = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
  const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  const IconStats = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
  const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  const IconFeedback = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  const IconChevronLeft = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>;
  const IconChevronRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6"/></svg>;
  const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#108548" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
  const IconUserAssign = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="16" r="3"/><line x1="20.2" y1="18.2" x2="22" y2="20"/></svg>;
  const IconClock = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

  const MarshallerIllustration = () => (
    <svg width="170" height="150" viewBox="0 0 200 170" className="mx-auto">
      <circle cx="100" cy="85" r="56" fill="none" stroke="#FCA5A5" strokeWidth="18" opacity="0.45"/>
      <path d="M100 29 A56 56 0 0 1 156 85" fill="none" stroke="#EF4444" strokeWidth="18" opacity="0.45"/>
      <path d="M44 85 A56 56 0 0 1 100 141" fill="none" stroke="#EF4444" strokeWidth="18" opacity="0.45"/>
      <path d="M88 105 L80 155 M112 105 L120 155" stroke="#E5A073" strokeWidth="8" strokeLinecap="round"/>
      <rect x="78" y="95" width="44" height="24" rx="6" fill="#1E3A8A"/>
      <rect x="80" y="45" width="40" height="52" rx="10" fill="#D9F99D" stroke="#84CC16" strokeWidth="2"/>
      <line x1="80" y1="68" x2="120" y2="68" stroke="#65A30D" strokeWidth="4"/>
      <line x1="80" y1="82" x2="120" y2="82" stroke="#65A30D" strokeWidth="4"/>
      <path d="M80 52 L52 88" stroke="#E5A073" strokeWidth="8" strokeLinecap="round"/>
      <path d="M120 52 L148 88" stroke="#E5A073" strokeWidth="8" strokeLinecap="round"/>
      <line x1="52" y1="88" x2="32" y2="115" stroke="#DC2626" strokeWidth="6" strokeLinecap="round"/>
      <line x1="148" y1="88" x2="174" y2="108" stroke="#DC2626" strokeWidth="6" strokeLinecap="round"/>
      <circle cx="88" cy="26" r="5" fill="#1E293B"/>
      <circle cx="112" cy="26" r="5" fill="#1E293B"/>
      <circle cx="100" cy="26" r="11" fill="#E5A073"/>
      <rect x="92" y="22" width="16" height="5" rx="2" fill="#0F172A"/>
    </svg>
  );

  const HotelVectorGraphic = () => (
    <div className="w-full h-36 bg-[#D6E6F2] flex items-end justify-center overflow-hidden relative">
      <div className="w-16 h-24 bg-[#8AB6D6] mx-1 rounded-t flex flex-col justify-around p-2">
        <div className="h-2 bg-white/60 rounded"/><div className="h-2 bg-white/60 rounded"/><div className="h-2 bg-white/60 rounded"/>
      </div>
      <div className="w-24 h-32 bg-[#2978B5] mx-1 rounded-t flex flex-col justify-around p-3 shadow-md">
        <div className="grid grid-cols-3 gap-1.5"><div className="h-3 bg-white/80"/><div className="h-3 bg-white/80"/><div className="h-3 bg-white/80"/></div>
        <div className="grid grid-cols-3 gap-1.5"><div className="h-3 bg-white/80"/><div className="h-3 bg-white/80"/><div className="h-3 bg-white/80"/></div>
        <div className="grid grid-cols-3 gap-1.5"><div className="h-3 bg-white/80"/><div className="h-3 bg-white/80"/><div className="h-3 bg-white/80"/></div>
      </div>
      <div className="w-12 h-16 bg-[#0066CC] mx-1 rounded-full mb-2"/>
    </div>
  );

// SKANDI EOS — same Airside mobile/tablet shell, backed by live ALTEA services.
function eosRequest(type,payload={}) {
  const requestId=`eos-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  window.parent.postMessage({source:"SKANDI_EOS_EMBED",type,requestId,payload:{...payload,requestId}},"*");
  return requestId;
}
function eosFlight(row={}) {
  const date=String(row.departureDate||"").slice(0,10);
  const niceDate=date?new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"—";
  const aircraft=[row.registration,row.aircraftType].filter(Boolean).join(" · ");
  return {id:row.flightNumber||row.id||"Flight",flightNumber:row.flightNumber||"",origin:row.origin||"—",originCity:row.origin||"",originName:row.origin||"",dest:row.destination||"—",destCity:row.destination||"",destName:row.destination||"",date:niceDate,shortDate:niceDate,std:row.scheduledTime||"—",sta:row.arrivalTime||"—",takeOff:row.estimatedTime||"—",landing:row.actualTime||"—",blockOff:row.actualTime||"—",blockOn:"—",blockTime:"—",departed:Boolean(row.actualTime),isDelayed:/delay|disrupt/i.test(row.status||""),parkOrig:"",gateOrig:row.gate?`Gate ${row.gate}`:"",parkDest:"",gateDest:"",ctot:"",ops:{gate:Boolean(row.gate),fuel:false,ramp:false},pax:{booked:"—",capacity:"—",checkedIn:"—",boarded:"—",wchr:"—",inf:"—",business:"—",plus:"—",go:"—",inbound:"—",outbound:"—"},delays:[],ofpReleased:"",ofpUtc:"",mealCode:"",mealDesc:"",acReg:aircraft,acVersion:row.aircraftType||"",melText:"",prevFlight:{id:"",route:"—",sta:"—",blockOn:"—",groundStop:"—"},status:row.status||"SCHEDULED",terminal:row.terminal||"",belt:row.belt||"",source:row.source||"ALTEA FIDS"};
}
const App = () => {
  const [isIpad,setIsIpad]=useState(false);
  const [darkMode,setDarkMode]=useState(false);
  const [textSize,setTextSize]=useState("Large");
  const [isLoggedOut,setIsLoggedOut]=useState(false);
  const [activeSection,setActiveSection]=useState("roster");
  const [isSidebarOpen,setIsSidebarOpen]=useState(false);
  const [selectedFlight,setSelectedFlight]=useState(null);
  const [subScreen,setSubScreen]=useState(null);
  const [topBanner,setTopBanner]=useState(null);
  const [loadingOverlay,setLoadingOverlay]=useState(false);
  const [liveFlights,setLiveFlights]=useState([]);
  const [searchResults,setSearchResults]=useState(null);
  const [assignments,setAssignments]=useState([]);
  const [clockEvents,setClockEvents]=useState([]);
  const [crewList,setCrewList]=useState([]);
  const [profile,setProfile]=useState({});
  const [station,setStation]=useState(null);
  const [selectedStation,setSelectedStation]=useState(null);
  const [stationQuery,setStationQuery]=useState("");
  const [stationResults,setStationResults]=useState([]);
  const [logoUrl,setLogoUrl]=useState("");
  const [iconLogoUrl,setIconLogoUrl]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [flightQuery,setFlightQuery]=useState("");
  const [fromDate,setFromDate]=useState(new Date().toISOString().slice(0,10));
  const [toDate,setToDate]=useState(new Date(Date.now()+13*86400000).toISOString().slice(0,10));
  const [searchTab,setSearchTab]=useState("Flights");
  const [rosterMode,setRosterMode]=useState("Agenda");
  const [settingsTab,setSettingsTab]=useState("Profile");
  const [darkPreference,setDarkPreference]=useState(false);
  const [actionType,setActionType]=useState("SAFETY_REPORT");
  const [actionText,setActionText]=useState("");
  const [actionAssignment,setActionAssignment]=useState("");
  const [toast,setToast]=useState("");
  const [online,setOnline]=useState(navigator.onLine);
  const [syncedAt,setSyncedAt]=useState("");

  const refresh=()=>{setLoading(true);eosRequest("EOS_BOOTSTRAP_REQUEST",{});};
  const banner=(title,subtitle="")=>{setToast([title,subtitle].filter(Boolean).join(" · "));setTimeout(()=>setToast(""),4200);};
  useEffect(()=>{
    const syncDevice=()=>setIsIpad(/iPad|Tablet|Android(?!.*Mobile)/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&window.innerWidth>=700));
    const syncOnline=()=>setOnline(navigator.onLine);
    const refreshVisible=()=>{if(document.visibilityState==="visible"&&navigator.onLine)eosRequest("EOS_BOOTSTRAP_REQUEST",{});};
    const listener=event=>{
      const msg=event?.data;
      if(!msg||msg.source!=="SKANDI_WIX_PARENT")return;
      const p=msg.payload&&typeof msg.payload==="object"?msg.payload:{};
      if(msg.type==="SKANDI_MASTER_CONFIG") {const logos=p.brand?.assets?.logos||{};setLogoUrl(logos.eosLight||"");setIconLogoUrl(logos.eosIconLight||"");return;}
      if(msg.type==="EOS_BOOTSTRAP_RESPONSE") {setProfile(p.profile||{});setStation(p.station||null);setAssignments(Array.isArray(p.assignments)?p.assignments:[]);setClockEvents(Array.isArray(p.clockEvents)?p.clockEvents:[]);setLiveFlights((p.flights||[]).map(eosFlight));setCrewList([]);setSyncedAt(p.syncedAt||new Date().toISOString());setLoading(false);setError("");return;}
      if(msg.type==="EOS_FLIGHT_SEARCH_RESULT") {setSearchResults((p.flights||[]).map(eosFlight));setBusy(false);return;}
      if(msg.type==="EOS_STATION_SEARCH_RESULT") {setStationResults(Array.isArray(p.stations)?p.stations:[]);setBusy(false);return;}
      if(msg.type==="EOS_CLOCK_EVENT_RESULT") {setBusy(false);banner("Duty clock updated");refresh();return;}
      if(msg.type==="EOS_OPS_ACTION_RESULT") {setBusy(false);setActionText("");setSubScreen(null);banner(p.message||"Sent to OPS Control for review");return;}
      if(msg.type==="EOS_ERROR") {setBusy(false);setLoading(false);setError(p.message||"EOS could not synchronize with ALTEA.");banner(p.message||"EOS sync failed");}
    };
    syncDevice();window.addEventListener("resize",syncDevice);window.addEventListener("online",syncOnline);window.addEventListener("offline",syncOnline);window.addEventListener("message",listener);document.addEventListener("visibilitychange",refreshVisible);const poll=setInterval(refreshVisible,120000);
    eosRequest("SKANDI_MASTER_CONFIG_REQUEST",{});eosRequest("EOS_BOOTSTRAP_REQUEST",{});
    return ()=>{clearInterval(poll);window.removeEventListener("resize",syncDevice);window.removeEventListener("online",syncOnline);window.removeEventListener("offline",syncOnline);window.removeEventListener("message",listener);document.removeEventListener("visibilitychange",refreshVisible);};
  },[]);
  const flights=searchResults||liveFlights;
  const currentStation=selectedStation||station;
  const usableAssignments=assignments.filter(row=>!/cancel|rejected|void/i.test(row.status||""));
  const latestEvent=row=>clockEvents.filter(event=>event.payload?.assignmentId===row.id).sort((a,b)=>(Date.parse(b.eventAt)||0)-(Date.parse(a.eventAt)||0))[0]||null;
  const openFlight=flight=>{setSelectedFlight(flight);setSubScreen(null);};
  const searchStations=event=>{event?.preventDefault();if(stationQuery.trim().length<2){banner("Enter at least two characters to search stations");return;}setBusy(true);eosRequest("EOS_STATION_SEARCH",{query:stationQuery.trim()});};
  const searchFlight=event=>{event?.preventDefault();if(flightQuery.trim().length<2){banner("Enter a flight number or airport code");return;}setBusy(true);setSearchResults(null);eosRequest("EOS_FLIGHT_SEARCH",{query:flightQuery.trim(),from:fromDate,to:toDate});};
  const clockAction=row=>{const event=latestEvent(row),eventType=event?.eventType==="CLOCK_IN"?"CLOCK_OUT":"CLOCK_IN";setBusy(true);eosRequest("EOS_CLOCK_EVENT",{eventType,assignmentId:row.id,sourceTable:row.sourceTable});};
  const sendOpsAction=event=>{event?.preventDefault();if(actionText.trim().length<4){banner("Add a short description first");return;}const row=usableAssignments.find(item=>item.id===actionAssignment);setBusy(true);eosRequest("EOS_OPS_ACTION",{action:actionType,summary:actionText.trim(),assignmentId:row?.id||"",sourceTable:row?.sourceTable||"",flightNumber:selectedFlight?.flightNumber||"",route:selectedFlight?`${selectedFlight.origin||""}-${selectedFlight.dest||""}`:"",stationCode:currentStation?.code||""});};
  const logout=()=>eosRequest("EOS_LOGOUT",{});
  const showBanner=(obj)=>banner(obj?.title||"SKANDI EOS",obj?.subtitle||"");
  const triggerSpinner=(cb)=>{setLoadingOverlay(true);setTimeout(()=>{setLoadingOverlay(false);cb?.();},180);};

  const AssignmentCard=({row})=>{const event=latestEvent(row),clockedIn=event?.eventType==="CLOCK_IN";return <div className="p-4 rounded-2xl shadow-sm border space-y-3" style={{backgroundColor:"var(--sk-card)",borderColor:"var(--sk-border)"}}><div className="flex justify-between gap-3"><div><div className="font-bold text-sm">{row.label||"Operational duty"}</div><div className="text-xs opacity-60 mt-1">{row.route||row.location||station?.name||profile.baseCode||"SKANDI station"}</div></div><span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-[#0066CC]">{row.status||"SCHEDULED"}</span></div><div className="grid grid-cols-2 text-xs"><div><span className="opacity-60">Start</span><div className="font-bold">{row.startAt?`${row.startAt.slice(0,10)} · ${row.startAt.slice(11,16)}`:"—"}</div></div><div><span className="opacity-60">End</span><div className="font-bold">{row.endAt?row.endAt.slice(11,16):"—"}</div></div></div>{row.notes&&<div className="text-xs opacity-70">{row.notes}</div>}<div className="flex gap-2"><button disabled={busy||!row.id} onClick={()=>clockAction(row)} className="px-3 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-bold disabled:opacity-50">{clockedIn?"Clock out":"Clock in"}</button><button onClick={()=>{setActionAssignment(row.id);setSubScreen("opsRequest");}} className="px-3 py-2 rounded-lg bg-blue-50 text-[#0066CC] text-xs font-bold">Contact OPS</button></div></div>;};

  const ScreenHome=()=> <div className="flex-1 overflow-y-auto hide-scrollbar pb-16" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="relative h-52 overflow-hidden bg-[#EBF2F7]"><div className="absolute inset-0 flex items-center justify-center opacity-70"><svg viewBox="0 0 800 300" className="w-full h-full"><rect width="800" height="300" fill={darkMode?"#081032":"#E5EEF5"}/><path d="M50,220 Q120,180 160,240 T260,230 M420,190 Q460,110 520,60 T600,40 L630,140 L550,210 Z" fill={darkMode?"#111D4A":"#F4F7FA"}/><path d="M120,210 Q350,50 650,120" fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4"/><circle cx="120" cy="210" r="5" fill="#0066CC"/><circle cx="650" cy="120" r="5" fill="#0066CC"/></svg></div>{!isIpad&&<button onClick={()=>setIsSidebarOpen(true)} className="absolute top-5 left-4 z-20 w-11 h-11 rounded-full shadow-md flex items-center justify-center bg-white"><IconHamburger/></button>}<div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between"><div><div className="text-[10px] uppercase tracking-widest opacity-60">{station?.name||profile.baseName||profile.baseCode||"SKANDI ALTEA"}</div><h1 className="text-xl font-bold">Flight operations</h1></div><button onClick={refresh} className="bg-[#0066CC] text-white px-4 py-2 rounded-full text-xs font-bold">Refresh</button></div></div><div className="p-4 space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold text-sm">Live flights</h2><p className="text-[11px] opacity-60">ALTEA FIDS and published inventory schedule</p></div><button onClick={()=>{setActiveSection("search");setSearchTab("Flights");}} className="text-xs font-bold text-[#0066CC]">Search</button></div>{loading?<div className="p-6 rounded-2xl text-center text-xs opacity-60 bg-white">Connecting to live ALTEA data…</div>:liveFlights.length?<div className={`flex ${isIpad?"flex-row overflow-x-auto gap-4 pb-4":"flex-col gap-4"} hide-scrollbar`}>{liveFlights.slice(0,8).map((flight,idx)=><button key={`${flight.id}-${idx}`} onClick={()=>openFlight(flight)} className={`${isIpad?"min-w-[330px] max-w-[350px]":"w-full"} text-left rounded-2xl shadow-sm border p-5 bg-white active-scale`} style={{borderColor:"var(--sk-border)"}}><div className="flex justify-between items-start border-b pb-4" style={{borderColor:"var(--sk-border)"}}><div><div className="text-2xl font-bold">{flight.origin}</div><div className="text-xs opacity-60">{flight.originCity}</div></div><div className="text-center"><div className="font-bold text-sm">{flight.id}</div><span className="text-[10px]">{flight.status}</span></div><div className="text-right"><div className="text-2xl font-bold">{flight.dest}</div><div className="text-xs opacity-60">{flight.destCity}</div></div></div><div className="grid grid-cols-3 text-center py-4 border-b text-xs" style={{borderColor:"var(--sk-border)"}}><div><span className="block opacity-50">Date</span><b>{flight.shortDate}</b></div><div><span className="block opacity-50">Departure</span><b>{flight.std}</b></div><div><span className="block opacity-50">Arrival</span><b>{flight.sta}</b></div></div><div className="pt-3 grid grid-cols-2 gap-4 text-xs"><div><span className="opacity-50">Estimated</span><b className="block">{flight.takeOff}</b></div><div><span className="opacity-50">Gate / Terminal</span><b className="block">{[flight.gateOrig,flight.terminal].filter(Boolean).join(" · ")||"—"}</b></div></div></button>)}</div>:<div className="p-6 rounded-2xl border text-center bg-white" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-sm">No live flights available</div><p className="text-xs opacity-60 mt-1">ALTEA has no flight feed records for your station and current operating window.</p></div>}<div className="flex items-center justify-between"><div><h2 className="font-bold text-sm">Your next duty</h2><p className="text-[11px] opacity-60">Roster items attached to your staff account</p></div><button onClick={()=>setActiveSection("roster")} className="text-xs font-bold text-[#0066CC]">Full roster</button></div>{usableAssignments[0]?<AssignmentCard row={usableAssignments[0]}/>:<div className="p-4 rounded-xl border text-xs opacity-60 bg-white" style={{borderColor:"var(--sk-border)"}}>No upcoming duties have been published to your staff profile.</div>}{error&&<div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>}<div className="text-[10px] opacity-50">{syncedAt?`Last synced ${new Date(syncedAt).toLocaleString()}`:"Waiting for sync"} · {online?"Online":"Offline"}</div></div></div>;

  const ScreenRoster=()=> <div className="flex-1 flex flex-col overflow-hidden" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="pt-8 px-4 border-b flex items-center justify-between shrink-0 bg-white" style={{borderColor:"var(--sk-border)"}}>{!isIpad&&<button onClick={()=>setIsSidebarOpen(true)} className="touch-target"><IconHamburger/></button>}<div className="flex gap-6 mx-auto">{["Agenda","Month","Week"].map(mode=><button key={mode} onClick={()=>setRosterMode(mode)} className={`py-3 text-xs font-bold border-b-2 ${rosterMode===mode?"border-[#0066CC] text-[#0066CC]":"border-transparent opacity-60"}`}>{mode}</button>)}</div><button onClick={refresh} className="text-xs text-[#0066CC]">↻</button></div><div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 hide-scrollbar"><div className="flex justify-between items-center text-xs"><div><b>{rosterMode} roster</b><div className="opacity-50">{profile.baseName||profile.baseCode||"SKANDI staff"}</div></div><span className="opacity-50">{assignments.length} live assignments</span></div>{usableAssignments.length?usableAssignments.map(row=><AssignmentCard key={`${row.sourceTable}-${row.id}`} row={row}/>):<div className="p-6 rounded-2xl border text-center bg-white" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-sm">No live roster entries</div><p className="text-xs opacity-60 mt-1">The agenda, month and week views will populate when OPS publishes assignments to your account.</p></div>}</div></div>;

  const ScreenSearch=()=> <div className="flex-1 flex flex-col overflow-hidden" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="pt-8 px-4 border-b flex items-center justify-between bg-white" style={{borderColor:"var(--sk-border)"}}>{!isIpad&&<button onClick={()=>setIsSidebarOpen(true)} className="touch-target"><IconHamburger/></button>}<div className="flex gap-6 mx-auto">{["Flights","Station"].map(tab=><button key={tab} onClick={()=>setSearchTab(tab)} className={`py-3 text-xs font-bold border-b-2 ${searchTab===tab?"border-[#0066CC] text-[#0066CC]":"border-transparent opacity-60"}`}>{tab}</button>)}</div><span className="w-8"/></div><div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">{searchTab==="Flights"?<><form onSubmit={searchFlight} className="p-4 rounded-2xl border bg-white space-y-3" style={{borderColor:"var(--sk-border)"}}><div className="flex gap-2"><input value={flightQuery} onChange={e=>{setFlightQuery(e.target.value);setSearchResults(null);}} placeholder="Flight number or airport" className="flex-1 min-w-0 p-3 rounded-xl border text-sm" style={{borderColor:"var(--sk-border)"}}/><button disabled={busy} className="px-4 rounded-xl bg-[#0066CC] text-white text-xs font-bold disabled:opacity-50">Search</button></div><div className="grid grid-cols-2 gap-3 text-[10px] opacity-70"><label>From<input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="block w-full p-2 border rounded mt-1"/></label><label>To<input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="block w-full p-2 border rounded mt-1"/></label></div><div className="text-[10px] opacity-50">Search includes published schedule flights even when they are not on your personal roster.</div></form>{(searchResults||liveFlights).length?(searchResults||liveFlights).map((flight,idx)=><button key={`${flight.id}-${idx}`} onClick={()=>openFlight(flight)} className="w-full text-left p-4 rounded-xl border shadow-sm bg-white" style={{borderColor:"var(--sk-border)"}}><div className="flex justify-between"><b>{flight.id}</b><span className="text-[10px]">{flight.status}</span></div><div className="text-sm mt-1">{flight.origin} → {flight.dest}</div><div className="text-xs opacity-60 mt-1">{flight.date} · {flight.std} · Gate {flight.gateOrig||"—"}</div></button>):<div className="p-6 rounded-xl border text-center text-xs opacity-60 bg-white" style={{borderColor:"var(--sk-border)"}}>No matching live flights.</div>}</>:<div className="p-4 rounded-2xl border bg-white" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-sm">Station information</div><form onSubmit={searchStations} className="mt-3 flex gap-2"><input value={stationQuery} onChange={e=>setStationQuery(e.target.value)} placeholder="Airport name or IATA code" className="flex-1 min-w-0 p-3 rounded-xl border text-sm" style={{borderColor:"var(--sk-border)"}}/><button disabled={busy} className="px-4 rounded-xl bg-[#0066CC] text-white text-xs font-bold disabled:opacity-50">Search</button></form>{stationResults.length>0&&<div className="mt-3 space-y-2">{stationResults.map(item=><button key={item.id||item.code} onClick={()=>setSelectedStation(item)} className="w-full p-3 rounded-xl border text-left" style={{borderColor:"var(--sk-border)"}}><b className="text-xs">{item.code}</b><span className="text-xs"> · {item.name}</span><div className="text-[10px] opacity-60">{[item.city,item.country].filter(Boolean).join(" · ")}</div></button>)}</div>}{currentStation?<><div className="text-lg font-bold mt-4">{currentStation.name} ({currentStation.code})</div><div className="text-xs opacity-60">{[currentStation.city,currentStation.country,currentStation.timezone].filter(Boolean).join(" · ")||"Official airport directory record"}</div>{currentStation.summary&&<p className="mt-2 text-xs opacity-70">{currentStation.summary}</p>}<button onClick={()=>{setActionType("STATION_UPDATE");setSubScreen("opsRequest");}} className="mt-4 px-3 py-2 rounded-lg bg-blue-50 text-[#0066CC] text-xs font-bold">Send station update to OPS</button></>:<div className="text-xs opacity-60 mt-3">Search the live airport directory or set a base in the SKANDI staff profile.</div>}</div>}</div></div>;

  const ScreenStatistics=()=>{const clockInCount=clockEvents.reduce((sum,event)=>sum+(event.eventType==="CLOCK_IN"?1:0),0);return <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="pt-8 flex items-center justify-between">{!isIpad&&<button onClick={()=>setIsSidebarOpen(true)} className="touch-target"><IconHamburger/></button>}<h1 className="font-bold text-base">Operational activity</h1><button onClick={refresh} className="text-[#0066CC]">↻</button></div><div className="grid grid-cols-2 gap-3"><div className="p-4 rounded-xl border bg-white" style={{borderColor:"var(--sk-border)"}}><div className="text-xs opacity-60">Roster assignments</div><b className="text-2xl">{assignments.length}</b></div><div className="p-4 rounded-xl border bg-white" style={{borderColor:"var(--sk-border)"}}><div className="text-xs opacity-60">Clock-in events</div><b className="text-2xl">{clockInCount}</b></div></div><h2 className="font-bold text-sm">Recent clock events</h2>{clockEvents.length?clockEvents.slice(0,20).map(item=><div key={item.id} className="p-3 rounded-xl border bg-white flex justify-between text-xs" style={{borderColor:"var(--sk-border)"}}><b>{item.eventType.replace(/_/g," ")}</b><span>{item.eventAt?new Date(item.eventAt).toLocaleString():"—"}</span></div>):<div className="p-5 rounded-xl border text-xs opacity-60 bg-white" style={{borderColor:"var(--sk-border)"}}>There are no clock events recorded for your staff account.</div>}</div>;};

  const ScreenSettings=()=> <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="pt-8 flex items-center justify-between">{!isIpad&&<button onClick={()=>setIsSidebarOpen(true)} className="touch-target"><IconHamburger/></button>}<h1 className="font-bold text-base">Settings</h1><span className="w-8"/></div><div className="rounded-2xl border shadow-sm p-5 flex flex-col items-center bg-white" style={{borderColor:"var(--sk-border)"}}>{profile.badgePhotoUrl?<img src={profile.badgePhotoUrl} className="w-20 h-20 rounded-full object-cover"/>:<div className="w-20 h-20 rounded-full bg-blue-50 text-[#0066CC] font-bold text-2xl flex items-center justify-center">{String(profile.displayName||"SK").split(/\s+/).map(x=>x[0]).slice(0,2).join("")}</div>}<h2 className="text-lg font-bold mt-3">{profile.displayName||"SKANDI staff"}</h2><div className="text-xs opacity-60">{profile.jobTitle||profile.accessRole||"ALTEA Operations"}</div><div className="text-xs opacity-60 mt-1">{profile.baseName||profile.baseCode||"Base not set"}</div>{profile.email&&<div className="text-xs opacity-60 mt-1">{profile.email}</div>}</div><div className="rounded-xl border bg-white p-4 space-y-3" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-sm">App appearance</div><label className="flex justify-between text-xs">Dark appearance<input type="checkbox" checked={darkPreference} onChange={e=>{setDarkPreference(e.target.checked);setDarkMode(e.target.checked);}}/></label><label className="flex justify-between text-xs items-center">Text size<select value={textSize} onChange={e=>setTextSize(e.target.value)} className="p-2 border rounded"><option>Large</option><option>Small</option></select></label></div><div className="rounded-xl border bg-white p-4 text-xs opacity-70" style={{borderColor:"var(--sk-border)"}}>Your name, role, base and photo are controlled by the SKANDI staff directory. Contact your manager to update them.</div><button onClick={logout} className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold text-xs bg-white">Log out of SKANDI</button></div>;

  const ScreenFeedback=()=> <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="pt-8 flex items-center justify-between">{!isIpad&&<button onClick={()=>setIsSidebarOpen(true)} className="touch-target"><IconHamburger/></button>}<h1 className="font-bold text-base">OPS support</h1><span className="w-8"/></div><div className="p-5 rounded-xl border bg-white space-y-3" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-sm">Send an operational request</div><p className="text-xs opacity-60">Requests are attached to your staff identity and sent to the OPS Control review queue.</p><button onClick={()=>{setActionType("SAFETY_REPORT");setSubScreen("opsRequest");}} className="w-full py-3 rounded-xl bg-[#0066CC] text-white text-xs font-bold">New OPS request</button></div><div className="p-4 rounded-xl border bg-white text-xs opacity-60" style={{borderColor:"var(--sk-border)"}}>For schedule changes, passenger reservations and DCS actions, use the corresponding ALTEA application. EOS does not display sample passenger records.</div></div>;

  const ScreenFlightDetail=({flight})=> <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{backgroundColor:"var(--sk-bg)",color:"var(--sk-text)"}}><div className="pt-8 flex items-center justify-between"><button onClick={()=>setSelectedFlight(null)} className="touch-target text-[#0066CC]"><IconChevronLeft/></button><span className="font-bold text-sm">Flight information</span><button onClick={()=>{setActionType("FLIGHT_ISSUE");setSubScreen("opsRequest");}} className="text-xs font-bold text-[#0066CC]">Report</button></div><div className="rounded-2xl border shadow-sm p-5 bg-white" style={{borderColor:"var(--sk-border)"}}><div className="flex justify-between items-start border-b pb-4" style={{borderColor:"var(--sk-border)"}}><div><div className="text-2xl font-bold">{flight.origin}</div><div className="text-xs opacity-60">{flight.originCity}</div></div><div className="text-center"><div className="font-bold text-sm">{flight.id}</div><span className="text-[10px] opacity-60">{flight.date}</span></div><div className="text-right"><div className="text-2xl font-bold">{flight.dest}</div><div className="text-xs opacity-60">{flight.destCity}</div></div></div><div className="grid grid-cols-3 text-center py-4 border-b text-xs" style={{borderColor:"var(--sk-border)"}}><div><span className="block opacity-50">STD</span><b>{flight.std}</b></div><div><span className="block opacity-50">Estimated</span><b>{flight.takeOff}</b></div><div><span className="block opacity-50">Status</span><b>{flight.status}</b></div></div><div className="grid grid-cols-2 gap-3 pt-4 text-xs"><div><span className="opacity-50">Arrival</span><b className="block">{flight.sta}</b></div><div><span className="opacity-50">Terminal / Gate</span><b className="block">{[flight.terminal,flight.gateOrig].filter(Boolean).join(" · ")||"—"}</b></div><div><span className="opacity-50">Aircraft</span><b className="block">{flight.acReg||"—"}</b></div><div><span className="opacity-50">Baggage belt</span><b className="block">{flight.belt||"—"}</b></div></div></div><div className="rounded-xl border p-4 bg-white" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-xs">Passenger and seat information</div><p className="text-[11px] opacity-60 mt-2">Passenger manifests and seat data are served only by the authorized reservations / DCS systems. No passenger feed is currently connected to EOS.</p></div><div className="grid grid-cols-2 gap-3"><button onClick={()=>setSubScreen("safetyBriefing")} className="p-4 rounded-xl border bg-white text-left" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-xs">Safety briefing</div><div className="text-[10px] opacity-60 mt-1">Open SKANDI operational guidance</div></button><button onClick={()=>setSubScreen("ofpPdf")} className="p-4 rounded-xl border bg-white text-left" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-xs">Flight plan</div><div className="text-[10px] opacity-60 mt-1">Document availability</div></button></div></div>;

  const modal= subScreen==="opsRequest" ? <div className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"><form onSubmit={sendOpsAction} className="w-full max-w-md rounded-2xl p-5 space-y-3 bg-white text-slate-900"><div className="font-bold">Send to OPS Control</div><select value={actionType} onChange={e=>setActionType(e.target.value)} className="w-full p-3 border rounded-lg text-xs"><option value="SAFETY_REPORT">Safety report</option><option value="FLIGHT_ISSUE">Flight issue</option><option value="STATION_UPDATE">Station update</option><option value="CREW_SUPPORT">Crew support</option><option value="DUTY_NOTE">Duty note</option></select><select value={actionAssignment} onChange={e=>setActionAssignment(e.target.value)} className="w-full p-3 border rounded-lg text-xs"><option value="">No specific duty</option>{usableAssignments.map(row=><option key={row.id} value={row.id}>{row.label} · {row.route||row.id}</option>)}</select><textarea value={actionText} onChange={e=>setActionText(e.target.value)} maxLength={400} rows={4} placeholder="Describe the issue or support needed" className="w-full p-3 border rounded-lg text-xs"/><div className="flex gap-2"><button type="button" onClick={()=>setSubScreen(null)} className="flex-1 py-3 rounded-lg bg-slate-100 text-xs font-bold">Cancel</button><button disabled={busy} className="flex-1 py-3 rounded-lg bg-[#0066CC] text-white text-xs font-bold">{busy?"Sending…":"Submit to OPS"}</button></div></form></div> : subScreen ? <div className="absolute inset-0 z-[90] bg-[#F2F4F7] p-4 flex flex-col"><div className="pt-6 flex items-center justify-between"><button onClick={()=>setSubScreen(null)} className="text-[#0066CC]"><IconChevronLeft/></button><b className="text-sm">{subScreen==="safetyBriefing"?"Safety briefing":subScreen==="ofpPdf"?"Flight plan":"Route information"}</b><span/></div><div className="my-auto p-5 rounded-2xl border bg-white text-center" style={{borderColor:"var(--sk-border)"}}><div className="font-bold text-sm">No published document is connected</div><p className="text-xs opacity-60 mt-2">SKANDI documents will appear here when published to the authorized DocuNet / ALTEA source.</p><button onClick={()=>{setActionType("DUTY_NOTE");setSubScreen("opsRequest");}} className="mt-4 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-bold">Ask OPS for support</button></div></div> : null;

  const sidebarDrawerClass=isIpad?(isSidebarOpen?"w-64 relative":"w-14 relative"):"w-64 absolute inset-y-0 left-0 transition-all duration-300 "+(isSidebarOpen?"translate-x-0 opacity-100":"-translate-x-6 opacity-0 pointer-events-none");
  if(isLoggedOut)return <div className="w-full h-full flex items-center justify-center bg-[#090D16]"><div className="device-iphone bg-[#00094B] text-white flex flex-col justify-center p-8 text-center"><div className="text-2xl font-black">SKANDI ALTEA</div><p className="text-xs text-blue-200 mt-3">Your staff session has ended.</p><button onClick={logout} className="mt-6 py-3 bg-[#0066CC] rounded-xl text-sm font-bold">Return to staff login</button></div></div>;
  return <div className="w-full h-full flex items-center justify-center relative select-none bg-[#090D16]"><div className={`${isIpad?"device-ipad":"device-iphone"} ${darkMode?"theme-dark":""} ${textSize==="Small"?"text-scale-small":"text-scale-large"} bg-[#000F89] relative overflow-hidden flex`}>
    <div className={`${sidebarDrawerClass} bg-[#000F89] text-white flex flex-col justify-between py-8 px-3 shrink-0 z-10`}><div>{(!isIpad||isSidebarOpen)&&<div className="flex items-center gap-3 px-2 mb-7">{logoUrl?<img src={logoUrl} data-master-logo="eosLight" alt="EOS" className="w-11 h-11 object-contain"/>:<div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-[8px] text-center leading-tight" data-master-logo="[LEAVE_PLACEHOLDER]">[LEAVE_PLACEHOLDER]</div>}<div className="min-w-0"><div className="font-bold text-sm leading-tight truncate">{profile.displayName||"SKANDI staff"}</div><div className="text-[10px] text-blue-200 mt-0.5 truncate">{profile.baseCode||profile.accessRole||"ALTEA operations"}</div></div></div>}<nav className="space-y-1">{[{id:"home",label:"Home",icon:<IconHome/>},{id:"roster",label:"Roster",icon:<IconPlane/>},{id:"messages",label:"Messages",icon:<IconMail/>},{id:"search",label:"Search",icon:<IconSearch/>},{id:"statistics",label:"Statistics",icon:<IconStats/>},{id:"settings",label:"Settings",icon:<IconSettings/>},{id:"feedback",label:"Feedback",icon:<IconFeedback/>}].map(item=><button key={item.id} onClick={()=>{setActiveSection(item.id);setSelectedFlight(null);setSubScreen(null);setIsSidebarOpen(false);}} className={`w-full py-3 ${isIpad&&!isSidebarOpen?"px-0 justify-center":"px-3"} rounded-xl flex items-center gap-4 text-sm transition-colors ${activeSection===item.id&&selectedFlight===null?"font-bold bg-white/15":"opacity-75 hover:opacity-100"}`}>{item.icon}{(!isIpad||isSidebarOpen)&&<span>{item.label}</span>}</button>)}</nav></div>{isIpad&&<button onClick={()=>setIsSidebarOpen(v=>!v)} className="w-8 h-8 rounded-full bg-white text-[#000F89] font-bold self-center">{isSidebarOpen?"‹":"›"}</button>}</div>
    <div onClick={()=>!isIpad&&isSidebarOpen&&setIsSidebarOpen(false)} className={`w-full h-full flex-1 flex flex-col relative overflow-hidden main-canvas-transition ${!isIpad&&isSidebarOpen?"canvas-pushed cursor-pointer":""} ${!isIpad?"absolute inset-0 z-20":"z-20"}`} style={{backgroundColor:"var(--sk-bg)"}}>
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#000F89] text-white">{!isIpad?<button onClick={e=>{e.stopPropagation();setIsSidebarOpen(true);}} className="touch-target"><IconHamburger/></button>:<span className="text-xs font-bold">{iconLogoUrl?<img src={iconLogoUrl} data-master-logo="eosIconLight" alt="EOS" className="h-6 max-w-24 object-contain"/>:<span data-master-logo="[LEAVE_PLACEHOLDER]">[LEAVE_PLACEHOLDER]</span>}</span>}<div className="text-center"><div className="font-bold text-xs">EOS Operations</div><div className="text-[10px] opacity-70">{station?.name||profile.baseName||profile.baseCode||"Live ALTEA data"}</div></div><button onClick={e=>{e.stopPropagation();refresh();}} className="w-9 h-9 rounded-full bg-white/10">↻</button></div>
      {!online&&<div className="bg-amber-500 text-white text-[11px] font-bold py-1 px-4 text-center">Offline · showing the last successful sync</div>}
      {error&&<div className="bg-red-600 text-white text-[11px] font-bold py-1 px-4 text-center">{error}</div>}
      {loadingOverlay&&<div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/10"><div className="w-14 h-14 rounded-2xl bg-gray-600/80 text-white flex items-center justify-center shadow-lg animate-spin">✈</div></div>}
      {topBanner&&<button onClick={()=>setTopBanner(null)} className="absolute top-3 left-4 right-4 z-[90] p-3 rounded-xl bg-white shadow-xl text-left"><b className="text-xs">{topBanner.title}</b><div className="text-[11px] text-[#0066CC]">{topBanner.subtitle}</div></button>}
      {selectedFlight?<ScreenFlightDetail flight={selectedFlight}/>:activeSection==="home"?<ScreenHome/>:activeSection==="roster"?<ScreenRoster/>:activeSection==="search"?<ScreenSearch/>:activeSection==="statistics"?<ScreenStatistics/>:activeSection==="settings"?<ScreenSettings/>:activeSection==="feedback"?<ScreenFeedback/>:<div className="flex-1 p-4"><div className="font-bold text-sm">Messages</div>{profile.canUseGroupTalk?<div className="mt-5 p-5 rounded-xl border bg-white space-y-3" style={{borderColor:"var(--sk-border)"}}><div className="text-xs opacity-70">Open the SKANDI GroupTalk workspace for live team chat and voice channels.</div><button onClick={()=>eosRequest("EOS_NAVIGATE",{path:"/riaintra/success-factors/altea/grouptalk"})} className="w-full py-3 rounded-xl bg-[#0066CC] text-white text-xs font-bold">Open GroupTalk</button></div>:<div className="mt-5 p-5 rounded-xl border bg-white text-xs opacity-60" style={{borderColor:"var(--sk-border)"}}>GroupTalk access is not enabled for this staff profile.</div>}</div>}
      {modal}{toast&&<div className="absolute z-[120] bottom-4 left-4 right-4 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl">{toast}</div>}
    </div>
  </div></div>;
};
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

```
